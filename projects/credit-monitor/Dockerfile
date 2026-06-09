# Credit Monitor — container image for cloud hosting (Render, Fly, Railway, etc.)
# better-sqlite3 ships prebuilt binaries; build tools are included as a fallback
# so a native compile still succeeds if a prebuild isn't available.

FROM node:22-bookworm-slim

# Build tools for better-sqlite3 (only used if no prebuild matches).
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (better layer caching).
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# App source.
COPY . .

# Generate PWA icons at build time (committed too, but keep them fresh).
RUN node scripts/make-icons.js || true

# The host provides PORT; bind on all interfaces (password gate is required).
ENV HOST=0.0.0.0
ENV NODE_ENV=production
# Persist the SQLite DB + keyfile on a mounted disk in production.
ENV CM_DATA_DIR=/var/data

EXPOSE 4600
CMD ["npm", "start"]
