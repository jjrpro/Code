'use strict';

// Fire the digest once, from cron or by hand.
//   npm run digest          # build + send via configured channels
//   npm run digest:dry      # print to console only, send nothing
//
// For real OS cron instead of the in-process scheduler, set
// CM_SCHEDULE_ENABLED=false and add e.g.:
//   0 8 * * *  cd /path/to/credit-monitor && /usr/bin/node scripts/send-digest.js

const notify = require('../src/notify');

(async () => {
  const dryRun = process.argv.includes('--dry-run');
  const result = await notify.sendDigest({ dryRun });
  // eslint-disable-next-line no-console
  console.log('[digest] channels:', JSON.stringify(result.channels, null, 2));
  process.exit(0);
})().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('[digest] failed:', e.message);
  process.exit(1);
});
