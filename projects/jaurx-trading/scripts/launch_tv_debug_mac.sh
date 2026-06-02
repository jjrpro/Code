#!/bin/bash
# Launch TradingView Desktop with Chrome debug port enabled.
# This lets JAURX connect and place orders through the trading panel.
#
# Run once before using tv_execute.js:
#   bash scripts/launch_tv_debug_mac.sh

PORT=${1:-9222}

echo "Launching TradingView Desktop with debug port $PORT..."

# Kill existing TradingView if running
pkill -f "TradingView" 2>/dev/null && sleep 1

# Launch with debug port
open -a "TradingView" --args --remote-debugging-port=$PORT

echo "Waiting for TradingView to start..."
for i in $(seq 1 15); do
  if curl -s "http://127.0.0.1:$PORT/json" > /dev/null 2>&1; then
    echo "TradingView is ready on debug port $PORT"
    echo ""
    echo "Next steps:"
    echo "  1. Make sure Tradovate broker is connected (bottom panel → Trading)"
    echo "  2. Test: node bridge/tv_execute.js test"
    echo "  3. Trade: node bridge/tv_execute.js buy MGC 4507 4485 4540,4575,4610"
    exit 0
  fi
  sleep 2
done

echo "TradingView started but debug port not responding yet."
echo "Give it a few more seconds, then test with:"
echo "  curl http://127.0.0.1:$PORT/json"
