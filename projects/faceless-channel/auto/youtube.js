// =============================================================================
// youtube.js — upload + schedule a Short via the official YouTube Data API v3
// =============================================================================
//
// Auth model (safe): we NEVER store a password. You do a one-time OAuth consent
// (see scripts/get-youtube-token.js) which yields a long-lived REFRESH TOKEN.
// That refresh token lives as an env var / Render secret. This module exchanges
// it for a short-lived access token at runtime.
//
// Required env:
//   YT_CLIENT_ID, YT_CLIENT_SECRET   (from Google Cloud console OAuth client)
//   YT_REFRESH_TOKEN                  (from the one-time consent script)
//
// Scope needed: https://www.googleapis.com/auth/youtube.upload
// =============================================================================

const fs = require('fs');
const https = require('https');

async function getAccessToken() {
  const { YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN } = process.env;
  if (!YT_CLIENT_ID || !YT_CLIENT_SECRET || !YT_REFRESH_TOKEN) {
    throw new Error('Missing YT_CLIENT_ID / YT_CLIENT_SECRET / YT_REFRESH_TOKEN');
  }
  const body = new URLSearchParams({
    client_id: YT_CLIENT_ID,
    client_secret: YT_CLIENT_SECRET,
    refresh_token: YT_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }).toString();

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = await res.json();
  if (!res.ok) throw new Error('token refresh failed: ' + JSON.stringify(json));
  return json.access_token;
}

// Resumable upload. `meta` = { title, description, tags[], privacyStatus,
// publishAt? (ISO string for scheduled), categoryId }
async function uploadShort(filePath, meta) {
  const accessToken = await getAccessToken();
  const stat = fs.statSync(filePath);

  const snippet = {
    title: meta.title,
    description: meta.description,
    tags: meta.tags || [],
    categoryId: meta.categoryId || '27', // 27 = Education
  };
  const status = {
    privacyStatus: meta.publishAt ? 'private' : (meta.privacyStatus || 'public'),
    selfDeclaredMadeForKids: false,
  };
  if (meta.publishAt) status.publishAt = meta.publishAt; // schedule for later

  const metadata = JSON.stringify({ snippet, status });

  // Step 1: initiate the resumable session
  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': 'video/*',
        'X-Upload-Content-Length': String(stat.size),
      },
      body: metadata,
    }
  );
  if (!initRes.ok) {
    throw new Error('init upload failed: ' + initRes.status + ' ' + (await initRes.text()));
  }
  const uploadUrl = initRes.headers.get('location');
  if (!uploadUrl) throw new Error('no resumable upload URL returned');

  // Step 2: send the bytes
  const fileBuf = fs.readFileSync(filePath);
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/*', 'Content-Length': String(stat.size) },
    body: fileBuf,
  });
  const result = await putRes.json();
  if (!putRes.ok) throw new Error('upload failed: ' + JSON.stringify(result));

  return { videoId: result.id, url: `https://youtu.be/${result.id}`, scheduled: !!meta.publishAt };
}

module.exports = { uploadShort, getAccessToken };
