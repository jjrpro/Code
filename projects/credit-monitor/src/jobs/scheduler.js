'use strict';

// Built-in scheduler (node-cron). Runs the daily digest and an optional
// weekly summary in-process. Disable via CM_SCHEDULE_ENABLED=false to use real
// OS cron instead (call `npm run digest`).

const cron = require('node-cron');
const config = require('../config');
const notify = require('../notify');

function start() {
  if (!config.scheduler.enabled) {
    // eslint-disable-next-line no-console
    console.log('[scheduler] disabled (CM_SCHEDULE_ENABLED=false)');
    return;
  }

  if (cron.validate(config.scheduler.digestCron)) {
    cron.schedule(config.scheduler.digestCron, async () => {
      // eslint-disable-next-line no-console
      console.log('[scheduler] running daily digest');
      try {
        await notify.sendDigest();
      } catch (e) {
        console.error('[scheduler] digest failed:', e.message);
      }
    });
    console.log(`[scheduler] daily digest scheduled: "${config.scheduler.digestCron}"`);
  } else {
    console.warn(`[scheduler] invalid CM_DIGEST_CRON: "${config.scheduler.digestCron}"`);
  }

  if (config.scheduler.weeklyCron && cron.validate(config.scheduler.weeklyCron)) {
    cron.schedule(config.scheduler.weeklyCron, async () => {
      console.log('[scheduler] running weekly summary');
      try {
        await notify.sendDigest();
      } catch (e) {
        console.error('[scheduler] weekly digest failed:', e.message);
      }
    });
    console.log(`[scheduler] weekly summary scheduled: "${config.scheduler.weeklyCron}"`);
  }
}

module.exports = { start };
