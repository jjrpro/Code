# Credit Monitor — automatic backups + restore

**Date:** 2026-06-09
**Summary:** Added automatic, rotated backups with off-server email delivery and
an in-app restore, so hosting the app on a cheap cloud disk can't lose JR's data.
This was the option JR picked after the cloud-hosting + screenshot-import work.

---

## What changed

### Backup engine (`src/logic/backup.js`)
- **JSON export** of the full state: cards (with `last4` decrypted for
  portability), scores, inquiries, payments, check-ins.
- **On-disk snapshots** under `CM_DATA_DIR/backups`, rotated to the last
  `CM_BACKUP_KEEP` (default 14).
- **Off-server email**: if SMTP is configured, the snapshot is emailed to
  `DIGEST_TO` as a `.json` attachment — the part that actually survives a disk
  loss. (`src/notify/email.js` now passes `attachments` through to nodemailer.)
- **Restore** (`importData`): validates the file, wipes, re-inserts, **remaps
  card IDs** so payment links stay correct, and **re-encrypts `last4`** on the
  way in.
- **Raw DB download**: `wal_checkpoint(TRUNCATE)` then serves the `.db` file for
  a faithful, restore-anywhere copy.

### Schedule (`src/jobs/scheduler.js`)
- New daily backup cron (`CM_BACKUP_CRON`, default 08:10). Logs whether the copy
  was emailed off-server.

### API (`src/routes/api.js`)
- `GET /api/backup/status`, `GET /api/backup/export.json`,
  `GET /api/backup/export.db`, `POST /api/backup/run`,
  `POST /api/admin/restore`. All behind the auth gate in cloud mode.

### UI (Backup & restore panel)
- Download backup (JSON) / Download database file / Email a backup now /
  Restore from backup, plus a status line (last backup time, count kept,
  whether off-server email is on).

### Config / env
- `CM_BACKUP_ENABLED` (default true), `CM_BACKUP_CRON` (`10 8 * * *`),
  `CM_BACKUP_KEEP` (14). Documented in `.env.example`.

## Verified end-to-end
Booted a server, exported JSON (5 cards / 6 scores / 6 payments), **wiped all
data → 0 cards**, restored from the export → **5 cards back with `last4`
correctly decrypted (1007)** and payment links intact; scheduled-backup wrote a
rotated snapshot; `.db` download returned a valid file; status reflected the new
snapshot.

## Note for JR
Auto-backup already runs daily on the server. To get copies **off** the server
(the real protection), fill in the SMTP block in `.env` (Gmail = App Password) so
backups email themselves to you. Manual download/restore is always available in
the **Backup & restore** panel regardless.
