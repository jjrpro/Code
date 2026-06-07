"""
Generate JAURX VIP banner for Whop.
Specs: 1500x500 px, matches jjrpro-site palette (gold on dark navy).
Output: projects/jaurx-vip/assets/whop-banner-jaurx.png
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math

W, H = 1500, 500
OUT = "/home/user/Code/projects/jaurx-vip/assets/whop-banner-jaurx.png"

# Palette (from projects/jjrpro-site/index.html)
BG_1     = (7, 10, 18)        # #070a12 deep navy
BG_2     = (12, 17, 29)       # #0c111d
BG_3     = (17, 24, 39)       # #111827 panel
GOLD     = (245, 166, 35)     # #f5a623 primary
AMBER    = (224, 138, 30)     # #e08a1e
HIGHLITE = (255, 207, 92)     # #ffcf5c soft gold
INK      = (234, 240, 251)    # #eaf0fb off-white
MUTED    = (138, 150, 173)    # #8a96ad
GREEN    = (52, 211, 153)     # #34d399 P&L green
RED      = (239, 68, 68)      # #ef4444 stop-loss red


def linear_gradient(size, top_color, bottom_color):
    """Vertical linear gradient as a flat RGB image."""
    w, h = size
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        r = int(top_color[0] + (bottom_color[0] - top_color[0]) * t)
        g = int(top_color[1] + (bottom_color[1] - top_color[1]) * t)
        b = int(top_color[2] + (bottom_color[2] - top_color[2]) * t)
        for x in range(w):
            px[x, y] = (r, g, b)
    return img


def radial_glow(canvas, center, radius, color, opacity):
    """Soft radial glow disc additively blended onto canvas (RGB)."""
    cx, cy = center
    glow = Image.new("RGBA", (radius * 2, radius * 2), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    # Concentric circles with falling alpha → smooth radial fade
    steps = 60
    for i in range(steps, 0, -1):
        r = int(radius * i / steps)
        a = int(opacity * (1 - i / steps) ** 2 * 255)
        gd.ellipse((radius - r, radius - r, radius + r, radius + r),
                   fill=(color[0], color[1], color[2], a))
    glow = glow.filter(ImageFilter.GaussianBlur(radius * 0.18))
    canvas.alpha_composite(glow, (cx - radius, cy - radius))


def thin_grid(canvas, spacing, color, opacity):
    """Subtle grid (trader chart vibe)."""
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    a = int(opacity * 255)
    for x in range(0, canvas.size[0], spacing):
        od.line([(x, 0), (x, canvas.size[1])], fill=(color[0], color[1], color[2], a), width=1)
    for y in range(0, canvas.size[1], spacing):
        od.line([(0, y), (canvas.size[0], y)], fill=(color[0], color[1], color[2], a), width=1)
    canvas.alpha_composite(overlay)


def draw_candles(canvas, origin, n=14, w=18, gap=10, scale=1.0, seed_seq=None):
    """Stylized rising candlestick stripe — pure gold."""
    od = ImageDraw.Draw(canvas)
    ox, oy = origin
    # Hand-tuned OHLC progression: trend up with two small pullbacks.
    if seed_seq is None:
        seed_seq = [
            (0, 30, -5, 28),
            (28, 50, 22, 45),
            (45, 60, 40, 55),
            (55, 52, 40, 48),    # small red
            (48, 78, 45, 72),
            (72, 90, 68, 86),
            (86, 110, 80, 105),
            (105, 100, 88, 92),  # small red
            (92, 130, 90, 122),
            (122, 150, 118, 144),
            (144, 175, 140, 168),
            (168, 195, 162, 188),
            (188, 220, 184, 215),
            (215, 250, 210, 248),
        ]
    # Find min/max across data for vertical normalization
    all_vals = [v for q in seed_seq for v in q]
    lo, hi = min(all_vals), max(all_vals)
    span = max(1, hi - lo)
    rng_h = int(160 * scale)

    for i, (o, h, l, c) in enumerate(seed_seq[:n]):
        x = ox + i * (w + gap)
        def y(v): return oy + rng_h - int((v - lo) / span * rng_h)
        rising = c >= o
        body_col = GOLD if rising else (170, 80, 30)
        wick_col = AMBER if rising else (140, 70, 25)
        # wick
        od.line([(x + w // 2, y(h)), (x + w // 2, y(l))], fill=wick_col, width=2)
        # body — higher price -> smaller y, so top uses max(o,c)
        top, bot = y(max(o, c)), y(min(o, c))
        if bot - top < 2:
            bot = top + 2  # ensure visible body for tiny / doji moves
        od.rectangle([x, top, x + w, bot], fill=body_col)


def load_font(paths, size):
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()


# Available fonts
FONT_BOLD = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
             "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]
FONT_REG  = ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
             "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"]
FONT_MONO = ["/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
             "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"]


# ------- COMPOSE -----------------------------------------------------------

# 1. Base gradient background
base = linear_gradient((W, H), BG_1, BG_3).convert("RGBA")

# 2. Subtle grid overlay
thin_grid(base, spacing=50, color=GOLD, opacity=0.025)

# 3. Soft gold glows: top-left + bottom-right
radial_glow(base, center=(80, 80), radius=420, color=GOLD, opacity=0.55)
radial_glow(base, center=(W - 240, H - 60), radius=360, color=AMBER, opacity=0.45)
radial_glow(base, center=(W // 2 + 280, H // 2), radius=300, color=HIGHLITE, opacity=0.18)

# 4. Right-side candlestick chart accent
draw_candles(base, origin=(W - 480, 150), n=14, w=18, gap=10, scale=1.0)

# 5. Text
draw = ImageDraw.Draw(base)

# Eyebrow — uppercase mono, gold
eyebrow_font = load_font(FONT_MONO, 22)
draw.text((90, 76), "PRIVATE  ·  LIVE TRADE ALERTS  ·  $49/MO", font=eyebrow_font, fill=GOLD)

# Headline — JAURX huge, off-white (with gold highlight underline)
headline_font = load_font(FONT_BOLD, 180)
draw.text((86, 110), "JAURX", font=headline_font, fill=INK)

# Gold accent underline
draw.rectangle([90, 308, 380, 316], fill=GOLD)

# Subhead 1 — tagline (white)
sub1_font = load_font(FONT_BOLD, 40)
draw.text((90, 336), "Live MGC + MNQ trade alerts", font=sub1_font, fill=INK)

# Subhead 2 — value props (muted gold)
sub2_font = load_font(FONT_REG, 24)
draw.text((92, 392), "Real entries  ·  Real stops  ·  Real P&L", font=sub2_font, fill=HIGHLITE)

# Footer right — handle
footer_font = load_font(FONT_MONO, 20)
fh_text = "@JaurxTrades  ·  whop.com/JAURX"
fh_bbox = draw.textbbox((0, 0), fh_text, font=footer_font)
fw, fh = fh_bbox[2] - fh_bbox[0], fh_bbox[3] - fh_bbox[1]
draw.text((W - fw - 60, H - fh - 32), fh_text, font=footer_font, fill=MUTED)

# CTA badge top right — gold pill "$49/mo VIP"
badge_font = load_font(FONT_BOLD, 28)
badge_text = "$49/mo  VIP"
bb = draw.textbbox((0, 0), badge_text, font=badge_font)
bw, bh = bb[2] - bb[0], bb[3] - bb[1]
pad_x, pad_y = 26, 14
bx2 = W - 60
bx1 = bx2 - (bw + pad_x * 2)
by1 = 60
by2 = by1 + bh + pad_y * 2 - 2
# Pill background (gold gradient via two-layer)
pill = Image.new("RGBA", (bx2 - bx1, by2 - by1), (0, 0, 0, 0))
pd = ImageDraw.Draw(pill)
pd.rounded_rectangle([0, 0, bx2 - bx1 - 1, by2 - by1 - 1], radius=(by2 - by1) // 2, fill=GOLD)
base.alpha_composite(pill, (bx1, by1))
draw.text((bx1 + pad_x, by1 + pad_y - 4), badge_text, font=badge_font, fill=(20, 14, 6))

# 6. Final tone shaping: very slight vignette
vignette = Image.new("L", (W, H), 0)
vd = ImageDraw.Draw(vignette)
vd.ellipse([-150, -150, W + 150, H + 150], fill=0, outline=None)
for r in range(0, 200, 20):
    vd.ellipse([r - 150, r - 150, W + 150 - r, H + 150 - r], fill=int(120 * (r / 200) ** 1.5))
vignette = vignette.filter(ImageFilter.GaussianBlur(120))
black = Image.new("RGBA", (W, H), (0, 0, 0, 0))
black.putalpha(vignette)
base = Image.alpha_composite(base, black)

# Save
base.convert("RGB").save(OUT, "PNG", optimize=True)
print(f"Saved: {OUT}")
print(f"Size:  {W}x{H}")
