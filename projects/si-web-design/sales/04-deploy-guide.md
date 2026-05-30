# Putting a Site Live — Netlify Drop (free, ~2 minutes)

No account technically required to test, but make a free account so your sites
stay up and you can connect a real domain. This is the whole workflow.

## One-time: make a free Netlify account
1. Go to **https://app.netlify.com/signup**
2. Sign up with email or your Google/GitHub login. Free tier is plenty.

## Deploy a site (every time)
1. Make sure the client's folder has the file named exactly **`index.html`**
   (it already is in every demo/mockup folder).
2. Go to **https://app.netlify.com/drop**
3. **Drag the whole folder** (e.g. `top-notch-barber`) onto the page.
   - On Mac: drag from Finder. On Windows: drag from File Explorer.
4. Wait ~10 seconds. You get a live link like
   `https://shiny-cupcake-12345.netlify.app` — **that's the live site.**
5. Open it on your phone to confirm it looks right.

## Rename the link (makes it look pro for the pitch)
1. In Netlify: **Site configuration → Change site name**
2. Set it to something clean, e.g. `top-notch-barber-si` →
   `https://top-notch-barber-si.netlify.app`
3. Send THAT link in your outreach message.

## Updating a site later
- Easiest: go to the site's **Deploys** tab → drag the updated folder on again.
  It replaces the old version. (Re-drag the whole folder, not just one file.)

## Connecting their real domain (when they pay)
1. Buy the domain at **Namecheap** or **Porkbun** (~$12/yr) — e.g.
   `topnotchbarbersi.com`.
2. In Netlify: **Domain management → Add a domain** → type the domain.
3. Netlify shows you either nameservers or DNS records. Easiest path:
   set the domain's **nameservers** to Netlify's (it tells you which ones) in
   the Namecheap/Porkbun dashboard.
4. Wait for it to verify (minutes to a few hours). **SSL/https is automatic
   and free** — Netlify turns it on once the domain connects.

## Adding a working contact form (Pro package)
Netlify has free forms built in. In the HTML form tag add `netlify`:
```html
<form name="contact" method="POST" data-netlify="true">
```
Submissions show up in Netlify under **Forms**, and you can forward them to
the client's email under **Forms → Settings → Notifications**.
(The contractor demo's form is set to a demo alert — swap it to this when live.)

## Quick troubleshooting
| Problem | Fix |
|---|---|
| Page shows file list, not the site | The HTML file must be named `index.html` and be at the folder's top level. |
| Photos don't load | The demos/mockups use hosted Unsplash photos (work anywhere). If you swap in local photos, put them in the folder and use the right file name. |
| Map doesn't show | Confirm the address in the `iframe src`. Or grab a fresh embed: Google Maps → Share → Embed a map → copy the `src` URL. |
| Changes not showing | Re-drag the whole folder in the Deploys tab; hard-refresh (Cmd/Ctrl+Shift+R). |
