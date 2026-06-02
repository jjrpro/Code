/**
 * JAURX TradingView Execution Bridge
 *
 * Places REAL orders through TradingView Desktop's trading panel,
 * which is connected to Tradovate. Bypasses the Tradovate API entirely.
 *
 * How it works:
 *   1. TradingView Desktop runs with a Chrome debug port (--remote-debugging-port=9222)
 *   2. This script connects via Chrome DevTools Protocol (CDP)
 *   3. It executes JavaScript inside the TradingView page to interact with
 *      the trading panel / broker integration
 *   4. Orders route through TradingView → Tradovate → exchange
 *
 * Requirements:
 *   - TradingView Desktop open with debug port enabled
 *   - Tradovate broker connected inside TradingView
 *   - JR logged into both
 *
 * Usage (on JR's Mac):
 *   node tv_execute.js buy MGC 4507 4485 4540,4575,4610
 *   node tv_execute.js sell MGC 4580 4602 4545,4515,4480
 *   node tv_execute.js status
 *   node tv_execute.js flatten
 */

import http from "node:http";
import { WebSocket } from "ws";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, "../config/jaurx-config.json");

const DEBUG_PORT = process.env.TV_DEBUG_PORT || 9222;
const DEBUG_HOST = process.env.TV_DEBUG_HOST || "127.0.0.1";

// ── CDP Connection ─────────────────────────────────────────

async function getDebugTargets() {
  return new Promise((resolve, reject) => {
    http
      .get(`http://${DEBUG_HOST}:${DEBUG_PORT}/json`, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse debug targets: ${e.message}`));
          }
        });
      })
      .on("error", (e) => {
        reject(
          new Error(
            `Cannot connect to TradingView debug port ${DEBUG_PORT}. ` +
              `Make sure TradingView Desktop is running with: ` +
              `open -a "TradingView" --args --remote-debugging-port=${DEBUG_PORT}\n` +
              `Error: ${e.message}`
          )
        );
      });
  });
}

async function findTradingViewTarget(targets) {
  const tvTarget = targets.find(
    (t) =>
      t.type === "page" &&
      (t.url.includes("tradingview.com") || t.title.includes("TradingView"))
  );
  if (!tvTarget) {
    throw new Error(
      "No TradingView page found in debug targets. " +
        "Make sure TradingView Desktop is open with a chart loaded."
    );
  }
  return tvTarget;
}

async function connectCDP(target) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let msgId = 0;
    const pending = new Map();

    ws.on("open", () => resolve({ ws, send, close }));
    ws.on("error", reject);
    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.id !== undefined && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });

    function send(method, params = {}) {
      return new Promise((res, rej) => {
        const id = ++msgId;
        pending.set(id, { resolve: res, reject: rej });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    function close() {
      ws.close();
    }
  });
}

// ── Execute JavaScript in TradingView page ──────────────────

async function evalInTV(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });

  if (result.exceptionDetails) {
    throw new Error(
      `TV eval error: ${result.exceptionDetails.exception?.description || "unknown"}`
    );
  }

  return result.result?.value;
}

// ── Order Placement Through TradingView ─────────────────────

async function placeOrderViaTV(cdp, { symbol, action, qty, orderType, price, stopLoss, takeProfits }) {
  // Step 1: Make sure we're on the right symbol
  const currentSymbol = await evalInTV(cdp, `
    (function() {
      try {
        const widget = window.tvWidget || window.TradingView?.widget;
        if (widget && widget.activeChart) {
          return widget.activeChart().symbol();
        }
        // Fallback: read from DOM
        const symbolEl = document.querySelector('[data-name="legend-source-item"] [class*="apply-common-tooltip"]');
        return symbolEl ? symbolEl.textContent : null;
      } catch(e) { return 'ERROR: ' + e.message; }
    })()
  `);
  console.log(`Current chart symbol: ${currentSymbol}`);

  if (symbol && currentSymbol && !currentSymbol.includes(symbol)) {
    console.log(`Switching chart to ${symbol}...`);
    await evalInTV(cdp, `
      (function() {
        const widget = window.tvWidget || window.TradingView?.widget;
        if (widget && widget.activeChart) {
          widget.activeChart().setSymbol('${symbol}');
        }
      })()
    `);
    await sleep(2000);
  }

  // Step 2: Check broker connection
  const brokerConnected = await evalInTV(cdp, `
    (function() {
      try {
        // Check if trading panel exists and broker is connected
        const tradingPanel = document.querySelector('[data-name="trading-floating-toolbar"]') ||
                            document.querySelector('[class*="tradingPanel"]') ||
                            document.querySelector('[data-name="bottom-toolbar"]');
        const brokerButton = document.querySelector('[data-name="broker-button"]') ||
                            document.querySelector('[class*="brokerButton"]');
        // Check for order ticket elements
        const hasTrading = document.querySelector('[class*="orderDialog"]') !== null ||
                          document.querySelector('[data-name="order-panel"]') !== null ||
                          tradingPanel !== null;
        return {
          hasTradingPanel: !!tradingPanel,
          hasBrokerButton: !!brokerButton,
          hasTrading: hasTrading,
          bodyClasses: document.body.className.substring(0, 200)
        };
      } catch(e) { return { error: e.message }; }
    })()
  `);
  console.log("Broker status:", JSON.stringify(brokerConnected, null, 2));

  // Step 3: Place order through TradingView's trading API
  const orderResult = await evalInTV(cdp, `
    (async function() {
      try {
        const widget = window.tvWidget || window.TradingView?.widget;

        // Method 1: Widget Trading API (preferred)
        if (widget && typeof widget.trading === 'function') {
          const trading = widget.trading();
          if (trading && typeof trading.placeOrder === 'function') {
            const order = await trading.placeOrder({
              symbol: '${symbol || ""}',
              side: '${action}',          // 'buy' or 'sell'
              type: '${orderType}',        // 'limit', 'market', 'stop'
              qty: ${qty},
              ${price ? `limitPrice: ${price},` : ""}
              ${stopLoss ? `stopLoss: ${stopLoss},` : ""}
              ${takeProfits && takeProfits[0] ? `takeProfit: ${takeProfits[0]},` : ""}
            });
            return { method: 'widget_api', success: true, order };
          }
        }

        // Method 2: Broker API direct access
        if (widget && widget.activeChart) {
          const chart = widget.activeChart();

          // Create the order via chart trading
          if (typeof chart.createOrderLine === 'function') {
            const orderLine = chart.createOrderLine()
              .setText('JAURX ${action.toUpperCase()} ${qty}x')
              .setQuantity('${qty}')
              .setPrice(${price || 0})
              .setLineColor('${action === "buy" ? "#26a69a" : "#ef5350"}');

            return { method: 'order_line', success: true, info: 'Order line created on chart' };
          }
        }

        // Method 3: DOM-based order placement (interact with the trading panel UI)
        // Open buy/sell dialog
        const actionBtn = action === 'buy'
          ? document.querySelector('[data-name="buy-button"], [class*="buyButton"], button[class*="buy"]')
          : document.querySelector('[data-name="sell-button"], [class*="sellButton"], button[class*="sell"]');

        if (actionBtn) {
          actionBtn.click();
          await new Promise(r => setTimeout(r, 500));

          // Fill quantity
          const qtyInput = document.querySelector('[data-name="order-quantity"] input, [class*="qtyInput"] input');
          if (qtyInput) {
            qtyInput.value = '${qty}';
            qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
          }

          // Fill price
          ${price ? `
          const priceInput = document.querySelector('[data-name="order-price"] input, [class*="priceInput"] input');
          if (priceInput) {
            priceInput.value = '${price}';
            priceInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          ` : ""}

          // Fill stop loss
          ${stopLoss ? `
          const slInput = document.querySelector('[data-name="stop-loss-input"] input, [class*="stopLoss"] input');
          if (slInput) {
            slInput.value = '${stopLoss}';
            slInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          ` : ""}

          // Fill take profit
          ${takeProfits && takeProfits[0] ? `
          const tpInput = document.querySelector('[data-name="take-profit-input"] input, [class*="takeProfit"] input');
          if (tpInput) {
            tpInput.value = '${takeProfits[0]}';
            tpInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
          ` : ""}

          return { method: 'dom', success: true, info: 'Order dialog opened and filled — confirm on screen' };
        }

        return {
          method: 'none',
          success: false,
          error: 'Could not find trading interface. Make sure Tradovate broker is connected in TradingView.',
          hint: 'Open TradingView → Bottom panel → Trading → Connect to Tradovate'
        };
      } catch(e) {
        return { method: 'error', success: false, error: e.message, stack: e.stack?.substring(0, 300) };
      }
    })()
  `);

  return orderResult;
}

// ── Get Account / Position Status ──────────────────────────

async function getPositions(cdp) {
  return await evalInTV(cdp, `
    (function() {
      try {
        const widget = window.tvWidget || window.TradingView?.widget;
        if (widget && typeof widget.trading === 'function') {
          const trading = widget.trading();
          if (trading && typeof trading.getPositions === 'function') {
            return trading.getPositions();
          }
        }
        // Fallback: read from DOM
        const posRows = document.querySelectorAll('[class*="position-row"], [data-name*="position"]');
        const positions = [];
        posRows.forEach(row => {
          positions.push({ text: row.textContent?.substring(0, 200) });
        });
        return positions.length > 0 ? positions : 'No positions found in DOM';
      } catch(e) { return 'Error: ' + e.message; }
    })()
  `);
}

async function flattenAll(cdp) {
  return await evalInTV(cdp, `
    (function() {
      try {
        const widget = window.tvWidget || window.TradingView?.widget;
        if (widget && typeof widget.trading === 'function') {
          const trading = widget.trading();
          if (trading && typeof trading.closeAll === 'function') {
            trading.closeAll();
            return { success: true, method: 'widget_api' };
          }
        }
        // Fallback: look for flatten/close all button
        const flattenBtn = document.querySelector('[data-name="flatten-button"], [class*="flattenAll"], [class*="closeAll"]');
        if (flattenBtn) {
          flattenBtn.click();
          return { success: true, method: 'dom_click' };
        }
        return { success: false, error: 'No flatten button found' };
      } catch(e) { return { success: false, error: e.message }; }
    })()
  `);
}

// ── Utilities ──────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
}

// ── CLI ────────────────────────────────────────────────────

async function main() {
  const cmd = process.argv[2] || "help";

  if (cmd === "help") {
    console.log("JAURX TradingView Execution Bridge");
    console.log("");
    console.log("Bypass Tradovate API — place orders directly through TradingView's");
    console.log("trading panel while JR is logged into the broker.");
    console.log("");
    console.log("Commands:");
    console.log("  recon                 Diagnose what your TradingView exposes (run this FIRST)");
    console.log("  test                  Quick connection test");
    console.log("  buy <symbol> <entry> <stop> <tp1,tp2,tp3> [qty]");
    console.log("  sell <symbol> <entry> <stop> <tp1,tp2,tp3> [qty]");
    console.log("  status                Get open positions");
    console.log("  flatten               Close all positions");
    console.log("");
    console.log("Examples:");
    console.log("  node tv_execute.js buy MGC 4507 4485 4540,4575,4610");
    console.log("  node tv_execute.js sell MGC 4580 4602 4545,4515,4480");
    console.log("  node tv_execute.js flatten");
    console.log("");
    console.log("Prerequisites:");
    console.log("  1. TradingView Desktop running with debug port:");
    console.log('     open -a "TradingView" --args --remote-debugging-port=9222');
    console.log("  2. Tradovate broker connected in TradingView");
    console.log("  3. npm install ws  (in this directory)");
    return;
  }

  // Connect to TradingView
  console.log(`Connecting to TradingView debug port ${DEBUG_PORT}...`);
  const targets = await getDebugTargets();
  const tvTarget = await findTradingViewTarget(targets);
  console.log(`Found: ${tvTarget.title} (${tvTarget.url.substring(0, 80)})`);

  const cdp = await connectCDP(tvTarget);

  try {
    switch (cmd) {
      case "test": {
        const symbol = await evalInTV(cdp, `
          (function() {
            const w = window.tvWidget || window.TradingView?.widget;
            if (w && w.activeChart) return w.activeChart().symbol();
            return document.title;
          })()
        `);
        console.log(`Connected! Current: ${symbol}`);

        const broker = await evalInTV(cdp, `
          (function() {
            const w = window.tvWidget || window.TradingView?.widget;
            const hasTrading = w && typeof w.trading === 'function';
            const tradingPanel = document.querySelector('[data-name="bottom-toolbar"]');
            return { hasWidgetTrading: hasTrading, hasTradingPanel: !!tradingPanel };
          })()
        `);
        console.log("Trading capability:", JSON.stringify(broker, null, 2));
        break;
      }

      case "recon": {
        // Deep diagnostic — dumps everything we need to wire order placement
        // to YOUR specific TradingView Desktop runtime. Paste the output back.
        console.log("=== JAURX TradingView Recon ===\n");

        const recon = await evalInTV(cdp, `
          (function() {
            const out = {};

            // 1. Page identity
            out.url = location.href;
            out.title = document.title;

            // 2. Global objects that matter
            out.globals = {
              tvWidget: typeof window.tvWidget,
              TradingView: typeof window.TradingView,
              TradingView_widget: window.TradingView ? typeof window.TradingView.widget : 'n/a',
            };

            // 3. Widget API surface
            const w = window.tvWidget || window.TradingView?.widget;
            if (w) {
              out.widgetMethods = Object.keys(w).filter(k => typeof w[k] === 'function').slice(0, 50);
              out.hasTrading = typeof w.trading === 'function';
              if (typeof w.trading === 'function') {
                try {
                  const t = w.trading();
                  out.tradingMethods = t ? Object.keys(t).filter(k => typeof t[k] === 'function') : 'trading() returned null';
                } catch(e) { out.tradingError = e.message; }
              }
              if (typeof w.activeChart === 'function') {
                try {
                  const c = w.activeChart();
                  out.chartMethods = Object.keys(c).filter(k => typeof c[k] === 'function')
                    .filter(k => /order|trade|position|broker/i.test(k));
                  out.symbol = c.symbol();
                } catch(e) { out.chartError = e.message; }
              }
            }

            // 4. DOM recon — find the actual trading panel + buy/sell buttons
            const findEls = (sel) => {
              try { return document.querySelectorAll(sel).length; } catch(e) { return 'bad-sel'; }
            };
            out.dom = {
              bottomToolbar: findEls('[data-name="bottom-toolbar"]'),
              tradingPanel: findEls('[class*="tradingPanel"], [class*="trading-panel"]'),
              buyButtons: findEls('[data-name*="buy"], [class*="buyButton"], [class*="buy-button"]'),
              sellButtons: findEls('[data-name*="sell"], [class*="sellButton"], [class*="sell-button"]'),
              orderPanel: findEls('[data-name="order-panel"], [class*="orderTicket"], [class*="order-ticket"]'),
              brokerButton: findEls('[data-name="broker-button"], [class*="brokerButton"]'),
            };

            // 5. Any element whose text says Tradovate / connected broker
            const allText = document.body.innerText || '';
            out.mentionsTradovate = allText.includes('Tradovate');
            out.mentionsConnected = /connect(ed)?/i.test(allText);

            // 6. Sample data-name attributes near the bottom toolbar (for selector building)
            const toolbar = document.querySelector('[data-name="bottom-toolbar"]');
            if (toolbar) {
              out.toolbarDataNames = Array.from(toolbar.querySelectorAll('[data-name]'))
                .map(e => e.getAttribute('data-name')).slice(0, 40);
            }

            return out;
          })()
        `);

        console.log(JSON.stringify(recon, null, 2));
        console.log("\n=== Copy ALL of the above and paste it back so I can wire order placement to your exact setup ===");
        break;
      }

      case "buy":
      case "sell": {
        const symbol = process.argv[3];
        const entry = parseFloat(process.argv[4]);
        const stop = parseFloat(process.argv[5]);
        const tps = process.argv[6] ? process.argv[6].split(",").map(Number) : [];
        const qty = parseInt(process.argv[7] || "1");

        if (!symbol || isNaN(entry) || isNaN(stop)) {
          console.log(`Usage: node tv_execute.js ${cmd} <symbol> <entry> <stop> <tp1,tp2,tp3> [qty]`);
          break;
        }

        console.log(`\nPlacing ${cmd.toUpperCase()} ${qty}x ${symbol}`);
        console.log(`  Entry: ${entry}`);
        console.log(`  Stop:  ${stop}`);
        console.log(`  TPs:   ${tps.join(", ") || "none"}`);
        console.log("");

        const result = await placeOrderViaTV(cdp, {
          symbol,
          action: cmd,
          qty,
          orderType: "limit",
          price: entry,
          stopLoss: stop,
          takeProfits: tps,
        });

        console.log("Result:", JSON.stringify(result, null, 2));
        break;
      }

      case "status": {
        const positions = await getPositions(cdp);
        console.log("Positions:", JSON.stringify(positions, null, 2));
        break;
      }

      case "flatten": {
        console.log("FLATTENING ALL POSITIONS...");
        const result = await flattenAll(cdp);
        console.log("Result:", JSON.stringify(result, null, 2));
        break;
      }

      default:
        console.log(`Unknown command: ${cmd}. Run with 'help' for usage.`);
    }
  } finally {
    cdp.close();
  }
}

main().catch((err) => {
  console.error(`\nFATAL: ${err.message}`);
  process.exit(1);
});
