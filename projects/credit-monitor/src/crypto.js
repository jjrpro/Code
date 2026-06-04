'use strict';

// Field-level encryption at rest using AES-256-GCM.
//
// Used for genuinely sensitive values (card last-4, Plaid access tokens).
// The rest of the schema (balances, limits, dates) is not secret in the same
// way and is stored plainly so the app can query/aggregate it.
//
// Key resolution order:
//   1. CM_ENCRYPTION_KEY env (64 hex chars = 32 bytes)
//   2. data/.keyfile (auto-generated on first run, gitignored)
//
// Format of an encrypted value (string): "v1:<ivHex>:<tagHex>:<cipherHex>"

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const PREFIX = 'v1';
const ALGO = 'aes-256-gcm';

let cachedKey = null;

function resolveKey() {
  if (cachedKey) return cachedKey;

  if (config.encryptionKey) {
    if (!/^[0-9a-fA-F]{64}$/.test(config.encryptionKey)) {
      throw new Error(
        'CM_ENCRYPTION_KEY must be 64 hex characters (32 bytes). ' +
          'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }
    cachedKey = Buffer.from(config.encryptionKey, 'hex');
    return cachedKey;
  }

  // Fall back to a persisted local keyfile.
  const keyfile = path.join(config.dataDir, '.keyfile');
  if (fs.existsSync(keyfile)) {
    cachedKey = Buffer.from(fs.readFileSync(keyfile, 'utf8').trim(), 'hex');
    return cachedKey;
  }

  fs.mkdirSync(config.dataDir, { recursive: true });
  const key = crypto.randomBytes(32);
  fs.writeFileSync(keyfile, key.toString('hex'), { mode: 0o600 });
  // eslint-disable-next-line no-console
  console.warn(
    '[crypto] No CM_ENCRYPTION_KEY set — generated a local key at data/.keyfile. ' +
      'Keep this file safe; losing it makes encrypted fields unreadable.'
  );
  cachedKey = key;
  return cachedKey;
}

function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') return null;
  const key = resolveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString('hex'), tag.toString('hex'), enc.toString('hex')].join(':');
}

function decrypt(payload) {
  if (payload === null || payload === undefined || payload === '') return null;
  const parts = String(payload).split(':');
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    // Not an encrypted value (e.g. legacy/plain) — return as-is.
    return payload;
  }
  const [, ivHex, tagHex, dataHex] = parts;
  const key = resolveKey();
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return dec.toString('utf8');
}

module.exports = { encrypt, decrypt };
