'use strict';

// Notification orchestrator. Builds the digest and fans it out across the
// modular channels (console always; email/desktop/push when configured).

const digest = require('./digest');
const email = require('./email');
const desktop = require('./desktop');
const push = require('./push');

async function sendDigest({ dryRun = false, options = {} } = {}) {
  const built = digest.build(options);
  const results = { subject: built.subject, channels: {} };

  // Console is always available and is the source of truth for `--dry-run`.
  // eslint-disable-next-line no-console
  console.log('\n' + built.text + '\n');
  results.channels.console = { sent: true };

  if (dryRun) {
    results.dryRun = true;
    return results;
  }

  // Email (optional)
  try {
    results.channels.email = await email.send(built);
  } catch (e) {
    results.channels.email = { sent: false, reason: e.message };
  }

  // Desktop summary (one-liner)
  const top = built.data.recommendations[0];
  results.channels.desktop = desktop.notify({
    title: built.subject,
    message: top ? `${top.title}` : 'No urgent actions — looking good.',
  });

  // Mobile push (stubbed)
  try {
    results.channels.push = await push.send({
      title: 'Credit Monitor',
      message: built.subject,
    });
  } catch (e) {
    results.channels.push = { sent: false, reason: e.message };
  }

  return results;
}

module.exports = { sendDigest, buildDigest: digest.build };
