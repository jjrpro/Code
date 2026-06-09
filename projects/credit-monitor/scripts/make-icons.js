'use strict';

// Generates the PWA / home-screen icons as real PNGs — no image libraries.
// Draws a full-bleed dark tile with a centered "credit card" glyph (safe for
// maskable icons). Run: node scripts/make-icons.js
//
// Outputs public/icons/icon-{192,512}.png and icon-180.png (apple-touch).

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(OUT, { recursive: true });

// ---- tiny PNG encoder (RGBA, 8-bit) ----
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // raw scanlines with filter byte 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---- draw the icon ----
function hex(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function draw(size) {
  const bg = hex('#0f1419'); // app background (full bleed → maskable-safe)
  const card = hex('#2ecc71'); // green card
  const stripe = hex('#0f1419');
  const chip = hex('#f1c40f');
  const rgba = Buffer.alloc(size * size * 4);

  // card rectangle, centered within the safe zone
  const cx0 = Math.round(size * 0.16), cx1 = Math.round(size * 0.84);
  const cy0 = Math.round(size * 0.30), cy1 = Math.round(size * 0.70);
  const r = Math.round(size * 0.05); // corner radius
  // magnetic stripe
  const sy0 = Math.round(size * 0.37), sy1 = Math.round(size * 0.43);
  // chip
  const chx0 = Math.round(size * 0.22), chx1 = Math.round(size * 0.30);
  const chy0 = Math.round(size * 0.50), chy1 = Math.round(size * 0.58);

  const inRoundRect = (x, y) => {
    if (x < cx0 || x > cx1 || y < cy0 || y > cy1) return false;
    // round the four corners
    const corners = [
      [cx0 + r, cy0 + r], [cx1 - r, cy0 + r], [cx0 + r, cy1 - r], [cx1 - r, cy1 - r],
    ];
    const nearCorner = (x < cx0 + r || x > cx1 - r) && (y < cy0 + r || y > cy1 - r);
    if (!nearCorner) return true;
    return corners.some(([px, py]) => (x - px) ** 2 + (y - py) ** 2 <= r * r &&
      Math.abs(x - px) <= r && Math.abs(y - py) <= r &&
      (x <= cx0 + r ? x <= px : x >= px) && (y <= cy0 + r ? y <= py : y >= py));
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let c = bg;
      if (inRoundRect(x, y)) {
        c = card;
        if (y >= sy0 && y <= sy1) c = stripe;
        else if (x >= chx0 && x <= chx1 && y >= chy0 && y <= chy1) c = chip;
      }
      const i = (y * size + x) * 4;
      rgba[i] = c[0];
      rgba[i + 1] = c[1];
      rgba[i + 2] = c[2];
      rgba[i + 3] = 255;
    }
  }
  return encodePNG(size, size, rgba);
}

for (const size of [192, 512, 180]) {
  const name = size === 180 ? 'icon-180.png' : `icon-${size}.png`;
  fs.writeFileSync(path.join(OUT, name), draw(size));
  // eslint-disable-next-line no-console
  console.log('wrote', path.join('public/icons', name));
}
