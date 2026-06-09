'use strict';

// SMTP email via nodemailer. Fully optional: if SMTP_HOST is blank, email is
// disabled and the caller falls back to console/desktop. Secrets come only
// from env (.env) — never logged.

const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

function isConfigured() {
  return Boolean(config.email.host);
}

function getTransporter() {
  if (!isConfigured()) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: config.email.user ? { user: config.email.user, pass: config.email.pass } : undefined,
  });
  return transporter;
}

async function send({ subject, text, html, attachments }) {
  if (!isConfigured()) {
    return { sent: false, reason: 'SMTP not configured (SMTP_HOST blank)' };
  }
  if (!config.email.to) {
    return { sent: false, reason: 'No DIGEST_TO recipient configured' };
  }
  const t = getTransporter();
  const info = await t.sendMail({
    from: config.email.from,
    to: config.email.to,
    subject,
    text,
    html,
    attachments,
  });
  return { sent: true, messageId: info.messageId };
}

module.exports = { isConfigured, send };
