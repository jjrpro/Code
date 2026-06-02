/**
 * JAURX Telegram /ai command — Claude-powered trading assistant.
 *
 * Wires a `/ai <question>` command into your existing bot.js. When JR sends
 * `/ai find me a gold setup`, this calls the Anthropic API (Claude Opus 4.8)
 * with tool access to the JAURX pipeline, so Claude can pull live data, run
 * TA/ML, size trades, and format alerts — then replies in Telegram.
 *
 * Built with the Anthropic SDK:
 *   - Model: claude-opus-4-8 (most capable)
 *   - Adaptive thinking (Claude decides how hard to think)
 *   - Prompt caching on the system prompt (cheaper repeat calls)
 *   - Tool use: `run_jaurx` executes whitelisted pipeline commands
 *
 * Setup (on JR's Mac, in the bot's directory):
 *   npm install @anthropic-ai/sdk
 *   export ANTHROPIC_API_KEY="sk-ant-..."
 *   # optional: export JAURX_DIR="/Users/you/jjr-ops/projects/jaurx-trading"
 *
 * Then in bot.js:
 *   import { registerAiCommand } from "./bot-ai-patch.js";
 *   registerAiCommand(bot);   // `bot` = your node-telegram-bot-api instance
 *
 * Only the authorized user (JR) can use /ai. Everyone else is ignored.
 */

import Anthropic from "@anthropic-ai/sdk";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));

// JAURX pipeline lives in projects/jaurx-trading. Override with JAURX_DIR.
const JAURX_DIR = process.env.JAURX_DIR || resolve(__dirname, "../../jaurx-trading");

// Only JR may drive the AI. (Telegram user id + VIP channel.)
const AUTHORIZED_USER_ID = 5680523955;
const VIP_CHANNEL_ID = -1003952631411;

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// Whitelisted pipeline subcommands the AI may run. No execution/order commands
// are exposed here — analysis only, by design.
const ALLOWED_COMMANDS = ["macro", "morning", "scan", "ml", "size", "alert", "full", "backtest"];

// Rich system prompt → also gives prompt caching something substantial to cache.
const SYSTEM_PROMPT = `You are JAURX, John Reilly's (JR's) AI futures-trading analyst.
You run inside his Telegram bot and answer his /ai commands.

WHO JR IS
- Trades MGC (Micro Gold, $10/point, 0.10 tick) and MNQ (Micro Nasdaq, $2/point, 0.25 tick) on Tradovate via a Lucid Trading funded prop account.
- Style: supply/demand zones on 4H/Daily, FVG (fair value gap) confirmation on 1H, macro alignment (Fed, DXY, yields, VIX), NY open + London overlap sessions.
- Not a developer — give paste-ready, concrete answers, not architecture talk.

RISK RULES (enforce these in any setup you propose)
- 1% max risk per trade, 3% daily drawdown stop, max 3 open positions.
- TP scaling 50% / 30% / 20%; move stop to break-even after TP1.
- JR requires a minimum ~65% win-probability read or NO TRADE. Be honest: directional futures rarely clear 65% on a single entry — most edge is R:R. If a setup does not clear his bar, say NO TRADE plainly and explain why.

TOOLS
- You have a run_jaurx tool that executes the live JAURX pipeline. Use it to pull real data before answering market questions:
  - macro            live Gold, NQ, VIX, DXY, yields
  - morning          macro + bias + paste-ready VIP alert
  - scan             macro + multi-timeframe analysis
  - ml <SYM>         ML signal (e.g. ml GC=F or ml NQ=F)
  - size <args>      position sizing, e.g. size MGC 4507 4485 4540,4575,4610
  - alert <args>     VIP alert, e.g. alert MGC LONG 4507 4485 4540,4575,4610 "thesis"
  - full             full pipeline: macro -> ML -> bias
  - backtest <SYM>   historical strategy comparison (clearly label as SIMULATED, not real wins)
- Always pull fresh data with the tool before giving levels or a verdict. Never invent prices.

EXECUTION REALITY (be truthful, never fake a trade)
- No trade has ever been auto-executed. Tradovate blocks API access on prop accounts.
- Real orders go through a webhook bridge (TradersPost / PickMyTrade) or TradingView Desktop, both of which JR triggers. You are the analyst; you do not silently place orders.
- If asked to "place" a trade, give the exact order ticket (entry/stop/TP1-3/contracts) and remind him which execution path to fire it through.

STYLE
- Lead with the answer. Use compact tables for levels. Mark confluence zones. Be direct and honest, including when the answer is "no trade."`;

const tools = [
  {
    name: "run_jaurx",
    description:
      "Run a JAURX trading pipeline command and return its stdout. Use this to pull live market data, run technical analysis, ML signals, position sizing, or generate alerts before answering. Always run this for any market/price question — never guess prices.",
    input_schema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          enum: ALLOWED_COMMANDS,
          description: "The pipeline subcommand to run.",
        },
        args: {
          type: "string",
          description:
            "Optional space-separated arguments. Examples: 'GC=F' for ml; 'MGC 4507 4485 4540,4575,4610' for size.",
        },
      },
      required: ["command"],
    },
  },
];

async function runJaurx(command, args = "") {
  if (!ALLOWED_COMMANDS.includes(command)) {
    return `Refused: '${command}' is not an allowed command.`;
  }
  // execFile with an argv array — no shell, so no injection from args.
  const argv = ["-m", "bridge.pipeline", command, ...(args ? args.trim().split(/\s+/) : [])];
  try {
    const { stdout } = await execFileAsync("python3", argv, {
      cwd: JAURX_DIR,
      timeout: 150000,
      maxBuffer: 4 * 1024 * 1024,
    });
    return stdout.slice(0, 7000) || "(no output)";
  } catch (err) {
    return `Pipeline error running '${command} ${args}': ${err.message}`;
  }
}

/** Run the full agentic loop and return Claude's final text. */
async function askClaude(userText) {
  const messages = [{ role: "user", content: userText }];

  for (let turn = 0; turn < 8; turn++) {
    const resp = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      tools,
      messages,
    });

    if (resp.stop_reason === "tool_use") {
      // Preserve full content (incl. thinking blocks) for the next request.
      messages.push({ role: "assistant", content: resp.content });
      const toolResults = [];
      for (const block of resp.content) {
        if (block.type === "tool_use") {
          const out = await runJaurx(block.input.command, block.input.args || "");
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: out });
        }
      }
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    const text = resp.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return text || "(Claude returned no text.)";
  }
  return "Stopped after 8 tool rounds without a final answer — try a narrower question.";
}

/** Split long replies to fit Telegram's ~4096-char message limit. */
async function sendLong(bot, chatId, text) {
  for (let i = 0; i < text.length; i += 4000) {
    // eslint-disable-next-line no-await-in-loop
    await bot.sendMessage(chatId, text.slice(i, i + 4000));
  }
}

/**
 * Register the /ai command on an existing node-telegram-bot-api instance.
 */
export function registerAiCommand(bot) {
  bot.onText(/^\/ai(?:@\w+)?\s+([\s\S]+)/, async (msg, match) => {
    const userId = msg.from && msg.from.id;
    const chatId = msg.chat.id;

    // Authorization: only JR, and (if from a group/channel) only the VIP channel.
    const fromAuthorizedUser = userId === AUTHORIZED_USER_ID;
    const inAllowedChat = chatId === AUTHORIZED_USER_ID || chatId === VIP_CHANNEL_ID;
    if (!fromAuthorizedUser || !inAllowedChat) {
      return; // ignore silently — don't advertise the command to others
    }

    const prompt = match[1].trim();
    try {
      await bot.sendChatAction(chatId, "typing");
      const answer = await askClaude(prompt);
      await sendLong(bot, chatId, answer);
    } catch (err) {
      await bot.sendMessage(chatId, `AI error: ${err.message}`);
    }
  });

  console.log("JAURX /ai command registered (authorized user " + AUTHORIZED_USER_ID + ")");
}

export default { registerAiCommand };
