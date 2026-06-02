"""
JAURX ML Signal Engine — Layer 5 bridge.

Downloads historical data, generates features, trains ML models,
and produces buy/sell signals for MGC/MNQ.

Uses intelligent-trading-bot's pipeline with LightGBM.
"""

import json
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
import yfinance as yf

log = logging.getLogger("jaurx.ml")

try:
    import lightgbm as lgbm
    from sklearn.preprocessing import StandardScaler
    from sklearn.svm import SVC
    import scipy.stats as stats
    AVAILABLE = True
except ImportError as e:
    AVAILABLE = False
    log.warning(f"ML deps not available: {e}")

try:
    import talib
    TALIB_AVAILABLE = True
except ImportError:
    TALIB_AVAILABLE = False


DATA_DIR = Path(__file__).parent.parent / "data"


def check_available():
    if not AVAILABLE:
        raise RuntimeError("ML deps missing. Run: pip install scikit-learn lightgbm scipy")


def download_data(symbol: str, period: str = "2y", interval: str = "1h") -> pd.DataFrame:
    """Download historical OHLCV data from Yahoo Finance."""
    log.info(f"Downloading {symbol} {period} @ {interval}")
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period, interval=interval)

    if df.empty:
        raise ValueError(f"No data returned for {symbol}")

    df.columns = [c.lower() for c in df.columns]
    log.info(f"Downloaded {len(df)} bars for {symbol}")
    return df


def generate_features(df: pd.DataFrame, windows: list = None) -> pd.DataFrame:
    """
    Generate technical features from OHLCV data.

    Features: SMA ratios, slope, stddev, RSI proxy, volume ratio.
    """
    if windows is None:
        windows = [3, 6, 12, 24, 168]

    features = pd.DataFrame(index=df.index)

    for w in windows:
        sma = df["close"].rolling(w).mean()
        features[f"sma_ratio_{w}"] = df["close"] / sma - 1
        features[f"slope_{w}"] = df["close"].rolling(w).apply(
            lambda x: np.polyfit(range(len(x)), x, 1)[0] if len(x) == w else 0,
            raw=False,
        )
        features[f"stddev_{w}"] = df["close"].rolling(w).std() / sma
        features[f"volume_ratio_{w}"] = df["volume"] / df["volume"].rolling(w).mean()

    delta = df["close"].diff()
    gain = delta.where(delta > 0, 0).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / loss.replace(0, np.nan)
    features["rsi_14"] = 100 - (100 / (1 + rs))

    features["bar_range"] = (df["high"] - df["low"]) / df["close"]
    features["body_ratio"] = abs(df["close"] - df["open"]) / (df["high"] - df["low"]).replace(0, np.nan)

    return features.dropna()


def generate_labels(df: pd.DataFrame, horizon: int = 24, threshold_pct: float = 2.0) -> pd.DataFrame:
    """
    Generate binary labels: will price move up/down by threshold% within horizon bars?
    """
    labels = pd.DataFrame(index=df.index)

    future_high = df["high"].rolling(horizon).max().shift(-horizon)
    future_low = df["low"].rolling(horizon).min().shift(-horizon)

    labels["will_rise"] = ((future_high / df["close"] - 1) * 100 >= threshold_pct).astype(int)
    labels["will_fall"] = ((1 - future_low / df["close"]) * 100 >= threshold_pct).astype(int)

    return labels.dropna()


def train_model(features: pd.DataFrame, labels: pd.Series, algo: str = "gb") -> dict:
    """Train a model and return it with its scaler."""
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(features)

    if algo == "gb":
        dataset = lgbm.Dataset(X_scaled, labels.values)
        model = lgbm.train(
            {"objective": "binary", "metric": "binary_logloss",
             "num_leaves": 31, "learning_rate": 0.05, "verbose": -1},
            train_set=dataset,
            num_boost_round=200,
        )
    elif algo == "svc":
        model = SVC(C=1.0, probability=True)
        model.fit(X_scaled, labels.values)
    else:
        raise ValueError(f"Unknown algo: {algo}. Use 'gb' or 'svc'.")

    return {"model": model, "scaler": scaler, "algo": algo}


def predict(model_pair: dict, features: pd.DataFrame) -> np.ndarray:
    """Generate predictions from a trained model."""
    X_scaled = model_pair["scaler"].transform(features)

    if model_pair["algo"] == "gb":
        return model_pair["model"].predict(X_scaled)
    elif model_pair["algo"] == "svc":
        return model_pair["model"].predict_proba(X_scaled)[:, 1]

    return np.zeros(len(features))


def compute_signal(rise_score: np.ndarray, fall_score: np.ndarray) -> np.ndarray:
    """Combine rise/fall scores into a single signal: -1 (sell) to +1 (buy)."""
    return rise_score - fall_score


def run_pipeline(
    symbol: str,
    period: str = "2y",
    interval: str = "1h",
    horizon: int = 24,
    threshold_pct: float = 2.0,
    algo: str = "gb",
    train_ratio: float = 0.8,
) -> dict:
    """
    Full ML pipeline: download → features → labels → train → predict → signal.

    Returns the latest signal score and model metrics.
    """
    check_available()

    df = download_data(symbol, period, interval)
    features = generate_features(df)
    labels = generate_labels(df, horizon, threshold_pct)

    common_idx = features.index.intersection(labels.index)
    features = features.loc[common_idx]
    labels = labels.loc[common_idx]

    split = int(len(features) * train_ratio)
    X_train, X_test = features.iloc[:split], features.iloc[split:]
    y_rise_train, y_rise_test = labels["will_rise"].iloc[:split], labels["will_rise"].iloc[split:]
    y_fall_train, y_fall_test = labels["will_fall"].iloc[:split], labels["will_fall"].iloc[split:]

    log.info(f"Training on {len(X_train)} bars, testing on {len(X_test)} bars")

    rise_model = train_model(X_train, y_rise_train, algo)
    fall_model = train_model(X_train, y_fall_train, algo)

    rise_pred = predict(rise_model, X_test)
    fall_pred = predict(fall_model, X_test)
    signals = compute_signal(rise_pred, fall_pred)

    latest_signal = float(signals[-1]) if len(signals) > 0 else 0.0

    buy_signals = (signals > 0.08).sum()
    sell_signals = (signals < -0.08).sum()
    neutral_signals = len(signals) - buy_signals - sell_signals

    if latest_signal > 0.08:
        label = "BUY ZONE"
        emoji = "📈"
    elif latest_signal > 0.04:
        label = "bullish lean"
        emoji = "〉〉"
    elif latest_signal < -0.08:
        label = "SELL ZONE"
        emoji = "📉"
    elif latest_signal < -0.04:
        label = "bearish lean"
        emoji = "〈〈"
    else:
        label = "neutral"
        emoji = "➖"

    return {
        "symbol": symbol,
        "algo": algo,
        "period": period,
        "interval": interval,
        "horizon": horizon,
        "threshold_pct": threshold_pct,
        "train_bars": len(X_train),
        "test_bars": len(X_test),
        "latest_signal": round(latest_signal, 4),
        "signal_label": f"{emoji} {label}",
        "signal_distribution": {
            "buy_signals": int(buy_signals),
            "sell_signals": int(sell_signals),
            "neutral": int(neutral_signals),
        },
        "latest_bar": str(X_test.index[-1]) if len(X_test) > 0 else None,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def format_signal(result: dict) -> str:
    """Format ML signal for display."""
    lines = []
    lines.append(f"JAURX ML SIGNAL — {result['symbol']}")
    lines.append(f"Model: {result['algo'].upper()} | {result['interval']} bars | {result['period']} history")
    lines.append(f"Trained: {result['train_bars']} bars | Tested: {result['test_bars']} bars")
    lines.append(f"Horizon: {result['horizon']} bars forward | Threshold: {result['threshold_pct']}% move")
    lines.append("")
    lines.append(f"SIGNAL: {result['latest_signal']:+.4f}  {result['signal_label']}")
    lines.append(f"Latest bar: {result['latest_bar']}")
    lines.append("")
    dist = result["signal_distribution"]
    lines.append(f"Test period: {dist['buy_signals']} buys | {dist['sell_signals']} sells | {dist['neutral']} neutral")
    return "\n".join(lines)


if __name__ == "__main__":
    import sys
    symbol = sys.argv[1] if len(sys.argv) > 1 else "GC=F"
    result = run_pipeline(symbol)
    print(format_signal(result))
