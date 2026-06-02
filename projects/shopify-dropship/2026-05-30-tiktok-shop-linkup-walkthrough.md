---
date: 2026-05-30
project: shopify-dropship
status: in-progress
tags:
  - tiktok-shop
  - shopify
  - integration
---

# TikTok Shop ↔ Shopify Linkup — Walkthrough

**Date**: 2026-05-30
**Context**: JR has TikTok Shop Seller account already approved. This doc covers wiring the approved seller account to JaurxShops Shopify, then bulk-uploading the active product catalog.

---

## Status check

| Step | State |
|---|---|
| TikTok Shop Seller account approved | ✅ JR confirmed |
| TikTok Shop Shopify app installed | ⏳ pending |
| Shopify ↔ TikTok auth connected | ⏳ pending |
| Product catalog exported from Shopify | ⏳ pending — JR running export |
| Catalog transformed to TikTok bulk-import CSV | ⏳ pending — waiting on Shopify CSV |
| Products live on TikTok Shop | ⏳ blocked on above |

---

## Path chosen: Manual CSV with review step

JR opted for the manual CSV path (vs the auto-sync Shopify app) so we get a review checkpoint before products go live on TikTok. The flow:

1. Export active products from Shopify → CSV
2. Claude transforms Shopify CSV → TikTok Shop bulk-upload format
3. JR reviews, fixes any flagged issues in Shopify, re-exports if needed
4. JR uploads final CSV to TikTok Shop Seller Center bulk import

---

## Step 1 — Export active products from Shopify

In Shopify Admin:

1. Click **Products** in left sidebar
2. Filter status to **Active** (top of product list dropdown)
3. Click **Export** (top-right button)
4. Dialog settings:
   - Scope: **All products matching your search**
   - Format: **Plain CSV file**
5. Click **Export products**
6. Wait 1–2 min, check email at `admin@jjrproconsultants.com`
7. Download the attached CSV

---

## Step 2 — Get the CSV to Claude

Two paths:

**Path A — Paste in chat** (fastest, less private)
Open the CSV in any text editor or Excel, paste contents as a code block in the next message.

**Path B — Drop in synced repo** (cleaner, requires sync working)
Save the CSV to:
- **Mac**: `~/Documents/Obsidian/JaurxOps/projects/shopify-dropship/shopify-active-products.csv`
- **Windows**: `C:\Users\jr910\Documents\Obsidian\JaurxOps\projects\shopify-dropship\shopify-active-products.csv`

Caveat: Path B only works once bi-directional Obsidian sync is verified working (currently Windows push not confirmed, Mac sync not yet installed).

---

## Step 3 — What Claude will produce

Output files (committed to `projects/shopify-dropship/`):

| File | Content |
|---|---|
| `2026-05-30-tiktok-shop-upload.csv` | Active products only, one row per product, mapped to TikTok Shop bulk-upload columns: Product name, Category, Brand, Description, SKU, Variant attributes, Sale price, Original price, Stock, Weight, Image URLs |
| `2026-05-30-tiktok-shop-import-issues.md` | Any products missing required TikTok fields (no category, no weight, image too small, restricted product type, etc.) — fix in Shopify before uploading to avoid one-by-one rejections |

---

## Step 4 — Connect Shopify ↔ TikTok Shop (one-time wiring)

In Shopify Admin:

1. **Apps** → **Shopify App Store**
2. Search "**TikTok Shop**" — install the one developed by **TikTok Inc.** (not third-party clones)
3. Open the app from the left sidebar after install
4. Click **Connect TikTok Shop**
5. Log in with the **TikTok account tied to your Seller Center** (not personal account)
6. Authorize Shopify access

Once connected, products can flow either via:
- **App auto-sync** (push selected products through the app UI)
- **Bulk CSV** (what we're doing) — upload at TikTok Shop Seller Center → Products → Bulk Add

---

## Step 5 — Upload bulk CSV to TikTok Shop Seller Center

1. Log in to **seller-us.tiktok.com**
2. **Products** → **Manage Products** → **Bulk Add Product**
3. Upload `2026-05-30-tiktok-shop-upload.csv`
4. TikTok validates the file — any line-level errors show in their UI
5. Fix errors, re-upload
6. Products go to "Pending Review" — TikTok typically approves in 1-2 hours for known categories like phone accessories

---

## Common TikTok Shop bulk-upload gotchas

| Problem | Fix |
|---|---|
| "Category not found" | Use TikTok's category taxonomy, not Shopify's. The transform script will map known ones. |
| "Image fails minimum requirements" | TikTok wants ≥1000×1000 pure-white-background. Lifestyle photos belong in ads, not catalog. |
| "Restricted product" | Phone accessories should be fine. If hit, check TikTok's prohibited list. |
| "Missing weight/dimensions" | TikTok needs these for shipping calc. Fix in Shopify under product details. |
| "Brand requires authorization" | Generic brand name (or "JaurxShops") avoids this. Only kicks in for trademarked brands. |
| Wrong fee disclosure | TikTok Shop US: 6% transaction fee + payment processing on top of cost-of-goods. Build margin accordingly. |

---

## Next action

JR exports the Shopify CSV → sends it to Claude → Claude produces the TikTok bulk-upload CSV + issues report.
