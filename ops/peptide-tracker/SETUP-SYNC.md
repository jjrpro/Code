# Peptide Tracker — All-Devices Setup (hosting + cloud sync)

Goal: one app you open on **Mac, iPhone, and Windows**, with your data **synced** so a dose
logged on your phone shows on your Mac. ~15 min, one time.

---

## Part 1 — Host it (one link for every device)

1. **Log into GitHub** (github.com).
2. Go to **https://github.com/jjrpro/Code/settings/pages**
3. Under **Source** → choose **"Deploy from a branch."**
4. Branch: **`claude/peptide-optimization-LExZ2`**, folder **`/ (root)`** → **Save.**
5. Wait ~1–2 min, then your app link is:
   **https://jjrpro.github.io/Code/ops/peptide-tracker/index.html**

Open that link on each device:
- **Mac (Chrome):** ⋮ → Cast, Save, and Share → **Create Shortcut → "Open as window"** = Dock app.
- **iPhone (Safari):** Share → **Add to Home Screen** = home-screen app.
- **Windows (Chrome/Edge):** ⋮ → Apps → **Install this site as an app.**

At this point the app works on every device — but each device's data is still separate.
Part 2 makes them sync.

---

## Part 2 — Turn on cloud sync (free Supabase)

### A. Create the free database (do once, on a computer)
1. Go to **supabase.com** → sign up (free) → **New project**.
   - Name it anything; pick a region near you; set a database password (save it somewhere).
2. Wait ~2 min for it to finish provisioning.
3. Left sidebar → **SQL Editor** → **New query** → paste this and click **Run**:

   ```sql
   create table if not exists peptide_state (
     code text primary key,
     data jsonb,
     updated_at timestamptz default now()
   );
   alter table peptide_state enable row level security;
   create policy "tracker access" on peptide_state
     for all to anon using (true) with check (true);
   ```

4. Left sidebar → **Project Settings → API**. Copy two things:
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - **anon public** key (a long `eyJ...` string)

### B. Connect each device (do on every device)
1. Open the app → **⚙️ Setup** tab → **☁️ Cloud sync** card.
2. Paste your **Project URL** and **anon key**.
3. **Sync code:** make up a private phrase (e.g. `jr-peptides-2026`). **Use the exact same code on every device** — that's what links them.
4. Check **Enable cloud sync** → tap **Save & sync**.
5. On your **main device** (the one with your real data) do this first → it uploads.
6. On each **other device**, enter the same 3 values → tap **Save & sync** (or **Pull latest**) → your data appears.

Done. After that it syncs automatically: it uploads when you log something and pulls the
latest each time you open or switch back to the app.

---

## How it behaves
- **Last change wins.** If you edit on two devices while offline, the most recent save wins
  when they reconnect. (Fine for one person; just don't edit two devices at the same second.)
- **Offline:** the app still works offline (it's cached) and syncs when you're back online.
- **Privacy:** your data sits in *your* Supabase project, keyed by your secret sync code. The
  code is the password — keep it private. Nothing is stored in the public GitHub repo.
- **Backup:** Setup → **Export backup** still works as a manual safety copy anytime.

---

## Quick troubleshooting
- *"No cloud data yet"* on a 2nd device → do **Save & sync** on your main device first.
- *Push error 401/404* → re-check the Project URL (no trailing slash) and the anon key.
- Data not appearing → confirm the **sync code is identical** (case-sensitive) on both devices,
  then tap **Pull latest**.
