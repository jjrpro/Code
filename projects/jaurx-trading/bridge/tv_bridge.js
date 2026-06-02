/**
 * JAURX TradingView Bridge — connects to TradingView Desktop via Jackson MCP.
 *
 * This file is meant to run on JR's Mac alongside TradingView Desktop.
 * It provides helper functions that the JAURX pipeline calls for:
 *   - Reading current chart state and indicator values
 *   - Running morning briefs across MGC + MNQ
 *   - Drawing supply/demand zones on charts
 *   - Capturing chart screenshots for analysis
 *
 * Prerequisites:
 *   1. TradingView Desktop running with debug port:
 *      bash scripts/launch_tv_debug_mac.sh
 *   2. tradingview-mcp-jackson installed:
 *      cd /path/to/tradingview-mcp-jackson && npm install
 *   3. This bridge cloned alongside it
 *
 * Usage:
 *   node tv_bridge.js brief        # Morning brief on watchlist
 *   node tv_bridge.js state        # Current chart state
 *   node tv_bridge.js indicators   # Read all indicator values
 *   node tv_bridge.js screenshot   # Capture current chart
 */

import { resolve, dirname } from "node:path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, "../config/jaurx-config.json");
const RULES_PATH = resolve(__dirname, "../config/rules.json");

// Jackson MCP core modules — path adjusted at runtime
let chart, data, capture, drawing;

function loadJacksonMCP(jacksonPath) {
  const corePath = resolve(jacksonPath, "src/core");
  return Promise.all([
    import(resolve(corePath, "chart.js")),
    import(resolve(corePath, "data.js")),
    import(resolve(corePath, "capture.js")),
    import(resolve(corePath, "drawing.js")),
  ]).then(([c, d, cap, draw]) => {
    chart = c;
    data = d;
    capture = cap;
    drawing = draw;
  });
}

function loadConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
}

function loadRules() {
  return JSON.parse(readFileSync(RULES_PATH, "utf8"));
}

// ── Chart State ─────────────────────────────────────────

async function getChartState() {
  const state = await chart.getState();
  const indicators = await data.getStudyValues();
  const quote = await data.getQuote({});
  return { state, indicators, quote };
}

// ── Morning Brief ───────────────────────────────────────

async function runMorningBrief() {
  const rules = loadRules();
  const { watchlist = [], default_timeframe = "240" } = rules;

  // Save current chart to restore after
  let originalSymbol, originalTimeframe;
  try {
    const currentState = await chart.getState();
    originalSymbol = currentState.symbol;
    originalTimeframe = currentState.resolution;
  } catch (_) {}

  const results = [];

  for (const symbol of watchlist) {
    try {
      await chart.setSymbol({ symbol });
      await sleep(1000);
      await chart.setTimeframe({ timeframe: default_timeframe });
      await sleep(1000);

      const [state, indicators, quote] = await Promise.all([
        chart.getState(),
        data.getStudyValues(),
        data.getQuote({}),
      ]);

      results.push({ symbol, timeframe: default_timeframe, state, indicators, quote });
    } catch (err) {
      results.push({ symbol, error: err.message });
    }
  }

  // Restore original chart
  if (originalSymbol) {
    try {
      await chart.setSymbol({ symbol: originalSymbol });
      if (originalTimeframe) await chart.setTimeframe({ timeframe: originalTimeframe });
    } catch (_) {}
  }

  return {
    generated_at: new Date().toISOString(),
    rules_loaded: true,
    bias_criteria: rules.bias_criteria || null,
    risk_rules: rules.risk_rules || null,
    symbols_scanned: results,
  };
}

// ── Drawing Helpers ─────────────────────────────────────

async function drawSupplyZone(high, low, label = "SUPPLY") {
  await drawing.drawShape({
    shape: "rectangle",
    points: [
      { price: high, time: "now" },
      { price: low, time: "-50bars" },
    ],
    overrides: {
      backgroundColor: "rgba(255, 0, 0, 0.15)",
      borderColor: "rgba(255, 0, 0, 0.6)",
    },
  });
  await drawing.drawShape({
    shape: "text",
    point: { price: high, time: "-25bars" },
    text: label,
    overrides: { color: "#ff4444", fontsize: 12 },
  });
}

async function drawDemandZone(high, low, label = "DEMAND") {
  await drawing.drawShape({
    shape: "rectangle",
    points: [
      { price: high, time: "now" },
      { price: low, time: "-50bars" },
    ],
    overrides: {
      backgroundColor: "rgba(0, 200, 0, 0.15)",
      borderColor: "rgba(0, 200, 0, 0.6)",
    },
  });
  await drawing.drawShape({
    shape: "text",
    point: { price: low, time: "-25bars" },
    text: label,
    overrides: { color: "#00cc00", fontsize: 12 },
  });
}

async function drawTradeSetup(entry, stop, tp1, tp2, tp3, direction = "SHORT") {
  const color = direction === "SHORT" ? "#ff4444" : "#00cc00";
  const stopColor = "#ff0000";
  const tpColor = "#00cc00";

  // Entry line
  await drawing.drawShape({
    shape: "horizontal_line",
    point: { price: entry },
    overrides: { linecolor: color, linewidth: 2, linestyle: 0, showLabel: true, text: `ENTRY ${entry}` },
  });

  // Stop loss line
  await drawing.drawShape({
    shape: "horizontal_line",
    point: { price: stop },
    overrides: { linecolor: stopColor, linewidth: 2, linestyle: 2, showLabel: true, text: `SL ${stop}` },
  });

  // TP lines
  for (const [label, price] of [["TP1", tp1], ["TP2", tp2], ["TP3", tp3]]) {
    if (price) {
      await drawing.drawShape({
        shape: "horizontal_line",
        point: { price },
        overrides: { linecolor: tpColor, linewidth: 1, linestyle: 2, showLabel: true, text: `${label} ${price}` },
      });
    }
  }
}

// ── Screenshot ──────────────────────────────────────────

async function captureChart(outputDir = "/tmp/jaurx-screenshots") {
  mkdirSync(outputDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const state = await chart.getState();
  const filename = `${state.symbol}_${state.resolution}_${timestamp}.png`;
  const filepath = resolve(outputDir, filename);

  const result = await capture.screenshot({ region: "chart", path: filepath });
  return { filepath, symbol: state.symbol, timeframe: state.resolution, ...result };
}

// ── Utilities ───────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── CLI ─────────────────────────────────────────────────

async function main() {
  const cmd = process.argv[2] || "help";
  const jacksonPath = process.env.JACKSON_MCP_PATH || resolve(__dirname, "../../tradingview-mcp-jackson");

  if (cmd === "help") {
    console.log("JAURX TradingView Bridge");
    console.log("");
    console.log("Commands:");
    console.log("  brief        Run morning brief on watchlist");
    console.log("  state        Get current chart state + indicators");
    console.log("  screenshot   Capture current chart");
    console.log("  draw-setup   Draw trade setup (entry/stop/tp)");
    console.log("");
    console.log("Set JACKSON_MCP_PATH env var to tradingview-mcp-jackson location");
    return;
  }

  console.log(`Loading Jackson MCP from: ${jacksonPath}`);
  await loadJacksonMCP(jacksonPath);

  switch (cmd) {
    case "brief": {
      const brief = await runMorningBrief();
      console.log(JSON.stringify(brief, null, 2));
      break;
    }
    case "state": {
      const state = await getChartState();
      console.log(JSON.stringify(state, null, 2));
      break;
    }
    case "screenshot": {
      const result = await captureChart();
      console.log(`Screenshot saved: ${result.filepath}`);
      break;
    }
    case "draw-setup": {
      const [entry, stop, tp1, tp2, tp3] = process.argv.slice(3).map(Number);
      const direction = entry > stop ? "LONG" : "SHORT";
      await drawTradeSetup(entry, stop, tp1, tp2, tp3, direction);
      console.log(`Drew ${direction} setup: entry=${entry} stop=${stop} TP1=${tp1} TP2=${tp2} TP3=${tp3}`);
      break;
    }
    default:
      console.log(`Unknown command: ${cmd}`);
  }
}

main().catch(console.error);
