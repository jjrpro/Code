// =============================================================================
// get-youtube-token.js — ONE-TIME: mint a YouTube refresh token (run locally)
// =============================================================================
//
// You run this once on your own machine to authorize the channel. It opens a
// Google consent page; you approve; it prints a REFRESH TOKEN. You paste that
// token into Render as the YT_REFRESH_TOKEN secret. After that, the autopilot
// uploads forever without you logging in again. No password is ever stored.
//
// Setup (one time, ~5 min) — see SETUP-AUTOMATION.md step 2:
//   1. Google Cloud Console -> new project -> enable "YouTube Data API v3".
//   2. Create an OAuth client (type: Desktop app). Copy client id + secret.
//   3. Run:  YT_CLIENT_ID=... YT_CLIENT_SECRET=... node auto/get-youtube-token.js
//   4. Open the printed URL, approve, paste the code back here.
//   5. Copy the printed refresh token into Render.
// =============================================================================

const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');

const CLIENT_ID = process.env.YT_CLIENT_ID;
const CLIENT_SECRET = process.env.YT_CLIENT_SECRET;
const SCOPE = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube';
const REDIRECT = 'http://localhost:4321/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set YT_CLIENT_ID and YT_CLIENT_SECRET (from your Google Cloud OAuth client).');
  process.exit(1);
}

const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
  }).toString();

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/callback')) { res.end('waiting...'); return; }
  const code = new URL(req.url, 'http://localhost:4321').searchParams.get('code');
  res.end('Authorized. You can close this tab and return to the terminal.');
  server.close();

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT,
      grant_type: 'authorization_code',
    }).toString(),
  });
  const json = await tokenRes.json();
  if (json.refresh_token) {
    console.log('\n=== SUCCESS ===');
    console.log('Your YT_REFRESH_TOKEN (paste into Render as a secret):\n');
    console.log(json.refresh_token);
    console.log('\nKeep this secret. Anyone with it can upload to your channel.\n');
  } else {
    console.error('No refresh token returned:', json);
  }
  process.exit(0);
});

server.listen(4321, () => {
  console.log('\nOpen this URL in your browser, approve access:\n');
  console.log(authUrl + '\n');
  exec(`open "${authUrl}" 2>/dev/null || xdg-open "${authUrl}" 2>/dev/null`, () => {});
});
