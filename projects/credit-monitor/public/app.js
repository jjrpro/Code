'use strict';

// Vanilla-JS dashboard. Talks to the JSON API, renders everything, and draws
// charts as inline SVG (no external libraries — fully offline / local-first).

const $ = (s) => document.querySelector(s);
const el = (tag, attrs = {}, html = '') => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => (k === 'class' ? (e.className = v) : e.setAttribute(k, v)));
  if (html) e.innerHTML = html;
  return e;
};
const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function api(method, path, body) {
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function toast(msg, ms = 3200) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), ms);
}

let DASH = null;

async function load() {
  const target = Number($('#targetUtil').value) || 9;
  const azeo = $('#azeo').checked;
  DASH = await api('GET', `/dashboard?target=${target}&azeo=${azeo}`);
  renderAggregate(DASH.aggregate);
  renderScore(DASH);
  renderRecs(DASH.recommendations);
  renderCalendar(DASH.calendar);
  renderFactors(DASH.factors);
  renderPaydown(DASH.paydownPriority);
  renderCards(DASH.cards);
  fillCardSelect(DASH.cards);
}

function renderAggregate(a) {
  $('#aggCurrent').innerHTML = `${a.currentPct}% <span class="dot ${a.currentColor}-bg"></span>`;
  $('#aggCurrent').className = 'big-num ' + a.currentColor + '-tx';
  $('#aggReported').textContent = `${a.reportedPct}%`;
  $('#aggReported').className = 'big-num ' + a.reportedColor + '-tx';
  const bar = $('#aggBar');
  bar.style.width = Math.min(100, a.currentPct) + '%';
  bar.className = a.currentColor + '-bg';
  $('#aggTotals').textContent = `${money(a.totalCurrentBalance)} of ${money(a.totalLimit)} total limit`;
}

function renderScore(d) {
  if (d.scoreLatest) {
    $('#scoreLatest').textContent = d.scoreLatest.score;
    $('#scoreSource').textContent = `${d.scoreLatest.source || ''} · ${d.scoreLatest.date}`;
  } else {
    $('#scoreLatest').textContent = '—';
    $('#scoreSource').textContent = 'no score logged';
  }
  $('#healthNum').textContent = d.factors.composite;
  $('#scoreChart').innerHTML = sparkline(d.scores.map((s) => ({ x: s.date, y: s.score })));
}

// Minimal responsive SVG line chart.
function sparkline(points) {
  if (!points.length) return '<div class="sub">Log scores to see a trend.</div>';
  const W = 320, H = 90, pad = 24;
  const ys = points.map((p) => p.y);
  const min = Math.min(...ys) - 5, max = Math.max(...ys) + 5;
  const sx = (i) => pad + (i / Math.max(1, points.length - 1)) * (W - pad * 2);
  const sy = (y) => H - pad - ((y - min) / Math.max(1, max - min)) * (H - pad * 2);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
  const dots = points.map((p, i) => `<circle cx="${sx(i).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="2.5" fill="#4aa3ff"/>`).join('');
  const last = points[points.length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="none">
    <path d="${path}" fill="none" stroke="#4aa3ff" stroke-width="2"/>
    ${dots}
    <text x="${pad}" y="12">${esc(points[0].x)}</text>
    <text x="${W - pad}" y="12" text-anchor="end">${last.y}</text>
  </svg>`;
}

function renderRecs(recs) {
  const box = $('#recs');
  box.innerHTML = '';
  if (!recs.length) { box.innerHTML = '<div class="sub">✓ Nothing urgent — you look in good shape.</div>'; return; }
  recs.forEach((r) => {
    box.appendChild(el('div', { class: 'rec ' + r.impact }, `
      <div class="meta">#${r.priority} · ${esc(r.category)} · <span class="impact-tag ${r.impact}">${r.impact.toUpperCase()} impact</span></div>
      <div class="title">${esc(r.title)}</div>
      <div class="detail">${esc(r.detail)}</div>`));
  });
}

function renderCalendar(events) {
  const box = $('#calendar');
  box.innerHTML = '';
  const soon = events.filter((e) => e.daysAway >= 0 && e.daysAway <= 30);
  if (!soon.length) { box.innerHTML = '<div class="sub">No statement/due dates in the next 30 days.</div>'; return; }
  soon.forEach((e) => {
    const cls = e.daysAway <= 3 ? 'cal-soon' : e.daysAway <= 7 ? 'cal-mid' : '';
    const label = e.type === 'statement-close' ? '📅 statement closes' : '💳 payment due';
    const warn = e.type === 'payment-due' && !e.autopay ? ' <span class="pill off">no autopay</span>' : '';
    box.appendChild(el('div', { class: 'cal-item' }, `
      <div class="cal-days ${cls}">${e.daysAway}d</div>
      <div><strong>${esc(e.nickname)}</strong> ${label}${warn}<br><span class="sub">${e.date}</span></div>`));
  });
}

function renderFactors(f) {
  const box = $('#factors');
  box.innerHTML = `<div class="sub" style="margin-bottom:10px">Composite health indicator: <strong>${f.composite}/100</strong> (weighted estimate)</div>`;
  const colorFor = (s) => (s >= 80 ? 'var(--green)' : s >= 55 ? 'var(--yellow)' : 'var(--red)');
  const names = {
    paymentHistory: 'Payment history', amountsOwed: 'Amounts owed / utilization',
    lengthOfHistory: 'Length of history', newCredit: 'New credit', creditMix: 'Credit mix',
  };
  Object.entries(f.factors).forEach(([k, fac]) => {
    box.appendChild(el('div', { class: 'factor' }, `
      <div class="frow"><span>${names[k]} <span class="sub">(${fac.weight}%)</span></span><span>${fac.strength}/100 · ${fac.status}</span></div>
      <div class="fbar"><span style="width:${fac.strength}%; background:${colorFor(fac.strength)}"></span></div>
      <div class="fnote">${esc(fac.note)}</div>`));
  });
}

function renderPaydown(p) {
  const box = $('#paydown');
  const list = (title, items, fmt) =>
    `<div style="margin-bottom:12px"><div class="sub" style="margin-bottom:6px"><strong>${title}</strong></div>` +
    (items.length ? items.map((c, i) => `<div class="cal-item"><div class="cal-days">${i + 1}</div><div>${esc(c.nickname)} — ${fmt(c)}</div></div>`).join('') : '<div class="sub">No balances to pay down 🎉</div>') +
    '</div>';
  box.innerHTML =
    list('Score-first (target ~30%+ cards)', p.scoreFirst, (c) => `${c.utilization}% util · ${money(c.balance)}`) +
    list('Avalanche (highest APR first — saves interest)', p.avalanche, (c) => `${c.apr}% APR · ${money(c.balance)}`);
}

function renderCards(cards) {
  const body = $('#cardsBody');
  body.innerHTML = '';
  cards.forEach((c) => {
    const u = c.utilization;
    const tr = el('tr');
    tr.innerHTML = `
      <td><strong>${esc(c.nickname)}</strong><br><span class="sub">${esc(c.issuer)} ••${esc(c.last4 || '')}</span></td>
      <td class="right">${money(c.current_balance)}</td>
      <td class="right">${money(c.credit_limit)}</td>
      <td class="right"><span class="pill ${u.currentColor}">${u.currentPct}%</span></td>
      <td>${c.timing.closingDate ? `${c.timing.closingDate}<br><span class="sub">${c.timing.daysToClose}d</span>` : '—'}</td>
      <td>${c.timing.dueDate ? `${c.timing.dueDate}<br><span class="sub">${c.timing.daysToDue}d</span>` : '—'}</td>
      <td>${c.apr}%</td>
      <td><span class="pill ${c.autopay ? 'on' : 'off'}">${c.autopay ? 'on' : 'off'}</span></td>
      <td class="right"><button class="danger" data-del="${c.id}">✕</button></td>`;
    body.appendChild(tr);
  });
  body.querySelectorAll('[data-del]').forEach((b) =>
    b.addEventListener('click', async () => {
      if (!confirm('Delete this card and its payment history?')) return;
      await api('DELETE', '/cards/' + b.dataset.del);
      toast('Card deleted');
      load();
    })
  );
}

function fillCardSelect(cards) {
  const sel = $('#pm_card');
  sel.innerHTML = '<option value="">(no specific card)</option>' +
    cards.map((c) => `<option value="${c.id}">${esc(c.nickname)}</option>`).join('');
}

// ── Add-card form (built dynamically) ──
const CARD_FIELDS = [
  ['issuer', 'Issuer', 'text'], ['nickname', 'Nickname', 'text'], ['last4', 'Last 4', 'text'],
  ['credit_limit', 'Credit limit', 'number'], ['current_balance', 'Current balance', 'number'],
  ['statement_balance', 'Statement balance', 'number'], ['closing_day', 'Closing day (1-31)', 'number'],
  ['due_day', 'Due day (1-31)', 'number'], ['minimum_payment', 'Min payment', 'number'],
  ['apr', 'APR %', 'number'], ['date_opened', 'Date opened', 'date'],
];
function buildAddCard() {
  const box = $('#addCard');
  box.innerHTML = '';
  CARD_FIELDS.forEach(([k, label, type]) => {
    const f = el('div', { class: 'field' }, `<label>${label}</label>`);
    f.appendChild(el('input', { id: 'nc_' + k, type }));
    box.appendChild(f);
  });
  const ap = el('div', { class: 'field' }, '<label>Autopay</label>');
  ap.appendChild(el('select', { id: 'nc_autopay' }, '<option value="1">On</option><option value="0">Off</option>'));
  box.appendChild(ap);
}

async function saveCard() {
  const body = {};
  CARD_FIELDS.forEach(([k, , type]) => {
    const v = $('#nc_' + k).value;
    if (v !== '') body[k] = type === 'number' ? Number(v) : v;
  });
  body.autopay = Number($('#nc_autopay').value);
  if (!body.nickname) return toast('Nickname is required');
  await api('POST', '/cards', body);
  toast('Card added');
  buildAddCard();
  load();
}

// ── CSV import ──
const CARD_MAP_FIELDS = ['nickname', 'issuer', 'last4', 'credit_limit', 'current_balance', 'statement_balance', 'closing_day', 'due_day', 'minimum_payment', 'apr', 'date_opened', 'autopay'];
const PAY_MAP_FIELDS = ['date', 'amount', 'kind', 'on_time', 'card_nickname'];
let IMPORT_HEADERS = [];

async function previewCSV() {
  const text = $('#imp_csv').value.trim();
  if (!text) return toast('Paste some CSV first');
  const { headers, rowCount } = await api('POST', '/import/preview', { csv: text });
  IMPORT_HEADERS = headers;
  const fields = $('#imp_type').value === 'payments' ? PAY_MAP_FIELDS : CARD_MAP_FIELDS;
  const opts = (sel) => '<option value="">— none —</option>' + headers.map((h) => `<option ${guessMatch(sel, h) ? 'selected' : ''}>${esc(h)}</option>`).join('');
  $('#imp_mapping').innerHTML = `<div class="sub" style="margin-top:8px">${rowCount} data rows. Map each field to a column:</div><div class="mapgrid">` +
    fields.map((f) => `<div class="field"><label>${f}</label><select id="map_${f}">${opts(f)}</select></div>`).join('') + '</div>';
  $('#imp_run').style.display = 'inline-block';
}

// Best-effort auto-guess: match a target field to a header by fuzzy name.
function guessMatch(field, header) {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  const aliases = {
    nickname: ['nickname', 'name', 'card', 'account'], issuer: ['issuer', 'bank'], last4: ['last4', 'last', 'number'],
    credit_limit: ['limit', 'creditlimit'], current_balance: ['balance', 'currentbalance', 'current'],
    statement_balance: ['statementbalance', 'statement'], closing_day: ['closingday', 'closing', 'closedate', 'statementdate'],
    due_day: ['dueday', 'due', 'duedate'], minimum_payment: ['minimum', 'minpayment', 'min'], apr: ['apr', 'rate', 'interest'],
    date_opened: ['opened', 'dateopened', 'openeddate'], autopay: ['autopay'],
    date: ['date', 'posted', 'transactiondate'], amount: ['amount', 'amt', 'payment'], kind: ['kind', 'type', 'category'],
    on_time: ['ontime', 'status'], card_nickname: ['card', 'account', 'nickname', 'name'],
  };
  return (aliases[field] || [field]).some((a) => h === a || h.includes(a));
}

async function runImport() {
  const type = $('#imp_type').value;
  const fields = type === 'payments' ? PAY_MAP_FIELDS : CARD_MAP_FIELDS;
  const mapping = {};
  fields.forEach((f) => { const v = $('#map_' + f).value; if (v) mapping[f] = v; });
  const result = await api('POST', '/import/csv', { type, csv: $('#imp_csv').value.trim(), mapping });
  const msg = type === 'payments'
    ? `Imported ${result.created} payment(s). ${result.errors.length} error(s).`
    : `Created ${result.created}, updated ${result.updated} card(s). ${result.errors.length} error(s).`;
  $('#imp_result').textContent = msg + (result.errors.length ? ' ' + JSON.stringify(result.errors.slice(0, 3)) : '');
  toast(msg);
  load();
}

// ── Wire everything up ──
function wire() {
  buildAddCard();
  $('#refresh').addEventListener('click', () => load().then(() => toast('Refreshed')));
  $('#targetUtil').addEventListener('change', load);
  $('#azeo').addEventListener('change', load);
  $('#saveCard').addEventListener('click', () => saveCard().catch((e) => toast(e.message)));
  $('#sendDigest').addEventListener('click', async () => {
    try { const r = await api('POST', '/notify/digest'); toast('Digest sent. ' + (r.channels.email?.sent ? 'Email OK.' : 'Email off — printed to server console.')); }
    catch (e) { toast(e.message); }
  });
  $('#saveScore').addEventListener('click', async () => {
    try {
      await api('POST', '/scores', { date: $('#sc_date').value, score: Number($('#sc_score').value), source: $('#sc_source').value, bureau: $('#sc_bureau').value });
      toast('Score logged'); load();
    } catch (e) { toast(e.message); }
  });
  $('#saveInquiry').addEventListener('click', async () => {
    try {
      await api('POST', '/inquiries', { date: $('#iq_date').value, reason: $('#iq_reason').value, bureau: $('#iq_bureau').value, hard: 1 });
      toast('Inquiry logged'); load();
    } catch (e) { toast(e.message); }
  });
  $('#savePayment').addEventListener('click', async () => {
    try {
      await api('POST', '/payments', { card_id: $('#pm_card').value ? Number($('#pm_card').value) : null, date: $('#pm_date').value, amount: Number($('#pm_amount').value), kind: 'custom', on_time: Number($('#pm_ontime').value) });
      toast('Payment logged'); load();
    } catch (e) { toast(e.message); }
  });
  $('#imp_preview').addEventListener('click', () => previewCSV().catch((e) => toast(e.message)));
  $('#imp_run').addEventListener('click', () => runImport().catch((e) => toast(e.message)));

  load().catch((e) => toast('Load failed: ' + e.message));
}

wire();
