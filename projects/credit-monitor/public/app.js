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
  renderSimulator(DASH.cards);
  fillCardSelect(DASH.cards);
  await loadSurvey();
}

// ── Daily check-in ──────────────────────────────────────────────────────
async function loadSurvey() {
  const target = Number($('#targetUtil').value) || 9;
  const s = await api('GET', `/survey/today?target=${target}`);
  $('#streakBadge').textContent = s.streak > 0 ? `🔥 ${s.streak}-day streak` : 'Start your streak today';
  if (s.alreadyDone) renderCheckinDone(s);
  else renderCheckinForm(s);
}

function focusHtml(focus, highCount) {
  if (!focus) return '<div class="done-box">✓ No urgent actions right now — nicely done.</div>';
  return `<div class="focus-box">
    <div class="flabel">Today's #1 move${highCount ? ` · ${highCount} high-impact item(s)` : ''}</div>
    <div style="font-weight:600;margin:3px 0">${esc(focus.title)}</div>
    <div class="detail" style="font-size:13px;color:#c4d0dd">${esc(focus.detail)}</div>
  </div>`;
}

function renderCheckinDone(s) {
  $('#checkinBody').innerHTML = `
    <div class="done-box" style="margin:12px 0">✓ <strong>Checked in today.</strong> Snapshot saved — utilization ${s.summary.aggUtilization}%${s.summary.score ? `, score ${s.summary.score}` : ''}, health ${s.summary.composite}/100.</div>
    ${focusHtml(s.focus, s.highCount)}
    <div style="margin-top:14px"><div class="sub" style="margin-bottom:4px">Your utilization trend (from daily check-ins — lower is better)</div>${progressChart(s.progress)}</div>
    <button id="redoCheckin" class="ghost" style="margin-top:12px">Update today's check-in</button>`;
  $('#redoCheckin').addEventListener('click', () => renderCheckinForm(s));
}

function renderCheckinForm(s) {
  const cardInputs = s.cards
    .map(
      (c) => `<div class="ci-card">
        <div class="ci-top"><strong>${esc(c.nickname)}</strong>
          <span class="pill ${c.utilization ? c.utilization.currentColor : ''}">${c.utilization ? c.utilization.currentPct + '%' : ''}</span></div>
        <label>Today's balance ($)</label>
        <input type="number" step="0.01" id="ci_bal_${c.id}" value="${c.current_balance}" />
        <label class="chk" style="margin-top:6px"><input type="checkbox" id="ci_ap_${c.id}" ${c.autopay ? 'checked' : ''}/> autopay on</label>
      </div>`
    )
    .join('');

  $('#checkinBody').innerHTML = `
    <p class="sub" style="margin-top:6px">Confirm each balance (pre-filled with what's on file), note anything new, and submit. Takes ~30 seconds.</p>
    <div class="checkin-cards">${cardInputs || '<div class="sub">No cards yet — add your cards below first.</div>'}</div>

    <div class="ci-extra">
      <div class="field"><label>Log a payment you made (optional)</label>
        <select id="ci_pay_card"></select></div>
      <div class="field"><label>Payment amount ($)</label><input type="number" step="0.01" id="ci_pay_amt" placeholder="0.00" /></div>
      <div class="field"><label>On time?</label><select id="ci_pay_ontime"><option value="1">Yes</option><option value="0">No (late)</option></select></div>
    </div>

    <label class="chk"><input type="checkbox" id="ci_inq_on" /> New hard inquiry today?</label>
    <div id="ci_inq_fields" class="ci-extra" style="display:none">
      <div class="field"><label>Reason</label><input id="ci_inq_reason" placeholder="Auto loan" /></div>
      <div class="field"><label>Bureau</label><input id="ci_inq_bureau" placeholder="Experian" /></div>
    </div>

    <label class="chk"><input type="checkbox" id="ci_score_on" /> New credit score to log?</label>
    <div id="ci_score_fields" class="ci-extra" style="display:none">
      <div class="field"><label>Score</label><input type="number" id="ci_score_val" min="300" max="850" /></div>
      <div class="field"><label>Source</label><input id="ci_score_src" placeholder="Credit Karma / Experian" /></div>
    </div>

    <label class="chk"><input type="checkbox" id="ci_azeo" /> Planning a credit application or score pull soon? (turns on AZEO guidance)</label>
    <div class="field" style="margin-top:8px"><label>Notes (optional)</label><input id="ci_note" placeholder="Anything you want to remember about today" /></div>

    <button id="ci_submit" style="margin-top:12px">✓ Complete today's check-in</button>`;

  $('#ci_pay_card').innerHTML = '<option value="">(which card?)</option>' + s.cards.map((c) => `<option value="${c.id}">${esc(c.nickname)}</option>`).join('');
  $('#ci_inq_on').addEventListener('change', (e) => ($('#ci_inq_fields').style.display = e.target.checked ? 'grid' : 'none'));
  $('#ci_score_on').addEventListener('change', (e) => ($('#ci_score_fields').style.display = e.target.checked ? 'grid' : 'none'));
  $('#ci_submit').addEventListener('click', () => submitSurvey(s).catch((e) => toast(e.message)));
}

async function submitSurvey(s) {
  const balances = {};
  const autopay = {};
  s.cards.forEach((c) => {
    const v = $('#ci_bal_' + c.id).value;
    if (v !== '') balances[c.id] = Number(v);
    autopay[c.id] = $('#ci_ap_' + c.id).checked ? 1 : 0;
  });
  const payments = [];
  if ($('#ci_pay_amt').value) {
    payments.push({ card_id: $('#ci_pay_card').value || null, amount: Number($('#ci_pay_amt').value), on_time: Number($('#ci_pay_ontime').value) });
  }
  const answers = {
    balances,
    autopay,
    payments,
    inquiry: $('#ci_inq_on').checked ? { reason: $('#ci_inq_reason').value, bureau: $('#ci_inq_bureau').value } : null,
    score: $('#ci_score_on').checked && $('#ci_score_val').value ? { score: Number($('#ci_score_val').value), source: $('#ci_score_src').value } : null,
    upcomingApplication: $('#ci_azeo').checked,
    note: $('#ci_note').value,
  };
  const res = await api('POST', '/survey', answers);
  toast(`Check-in saved — ${res.streak}-day streak. Today's move: ${res.focus ? res.focus.title : 'all clear'}`);
  if (answers.upcomingApplication) $('#azeo').checked = true;
  await load();
}

// Utilization trend from check-ins (lower is better).
function progressChart(points) {
  if (!points || points.length < 1) return '<div class="sub">Check in daily to build your trend.</div>';
  const pts = points.map((p) => ({ x: p.date, y: p.agg_utilization }));
  if (pts.length === 1) return `<div class="sub">First snapshot saved: ${pts[0].y}% on ${pts[0].x}. Come back tomorrow.</div>`;
  const W = 320, H = 80, pad = 22;
  const ys = pts.map((p) => p.y);
  const min = Math.min(...ys, 0), max = Math.max(...ys, 30) + 5;
  const sx = (i) => pad + (i / Math.max(1, pts.length - 1)) * (W - pad * 2);
  const sy = (y) => H - pad - ((y - min) / Math.max(1, max - min)) * (H - pad * 2);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
  const dots = pts.map((p, i) => `<circle cx="${sx(i).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="2.5" fill="#2ecc71"/>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="none">
    <line x1="${pad}" y1="${sy(30).toFixed(1)}" x2="${W - pad}" y2="${sy(30).toFixed(1)}" stroke="#e74c3c" stroke-dasharray="3,3" opacity="0.5"/>
    <path d="${path}" fill="none" stroke="#2ecc71" stroke-width="2"/>${dots}
    <text x="${pad}" y="12">${esc(pts[0].x)}</text>
    <text x="${W - pad}" y="12" text-anchor="end">${pts[pts.length - 1].y}%</text>
  </svg>`;
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
      <td class="right" style="white-space:nowrap">
        <button class="edit-btn" data-edit="${c.id}">✎</button>
        <button class="danger" data-del="${c.id}">✕</button></td>`;
    body.appendChild(tr);
  });
  body.querySelectorAll('[data-edit]').forEach((b) =>
    b.addEventListener('click', () => editCard(cards.find((c) => c.id == b.dataset.edit)))
  );
  body.querySelectorAll('[data-del]').forEach((b) =>
    b.addEventListener('click', async () => {
      if (!confirm('Delete this card and its payment history?')) return;
      await api('DELETE', '/cards/' + b.dataset.del);
      toast('Card deleted');
      load();
    })
  );
}

let EDIT_ID = null;
function editCard(c) {
  if (!c) return;
  EDIT_ID = c.id;
  CARD_FIELDS.forEach(([k]) => { const e = $('#nc_' + k); if (e) e.value = c[k] != null ? c[k] : ''; });
  $('#nc_autopay').value = String(c.autopay ? 1 : 0);
  $('#cardFormSummary').textContent = `Editing: ${c.nickname}`;
  $('#cardFormDetails').open = true;
  $('#saveCard').textContent = 'Save changes';
  $('#cancelEdit').style.display = 'inline-block';
  $('#cardFormDetails').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function resetCardForm() {
  EDIT_ID = null;
  CARD_FIELDS.forEach(([k]) => { const e = $('#nc_' + k); if (e) e.value = ''; });
  $('#nc_autopay').value = '1';
  $('#cardFormSummary').textContent = '+ Add a card';
  $('#saveCard').textContent = 'Add card';
  $('#cancelEdit').style.display = 'none';
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
  if (EDIT_ID) {
    await api('PUT', '/cards/' + EDIT_ID, body);
    toast('Card updated');
    resetCardForm();
    return load();
  }
  if (!body.nickname) return toast('Nickname is required');
  await api('POST', '/cards', body);
  toast('Card added');
  resetCardForm();
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

// ── Screenshot import (AI) ──────────────────────────────────────────────
const SCAN_FIELDS = [
  ['issuer', 'Issuer'], ['nickname', 'Nickname'], ['last4', 'Last 4'],
  ['credit_limit', 'Limit'], ['current_balance', 'Balance'], ['statement_balance', 'Stmt bal'],
  ['closing_day', 'Closes'], ['due_day', 'Due'], ['minimum_payment', 'Min pmt'], ['apr', 'APR %'],
];
let SCAN = [];

function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function handleScanFile(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!file) return;
  const review = $('#scanReview');
  review.style.display = 'block';
  review.innerHTML = '<div class="sub">📷 Reading your screenshot with AI… this takes a few seconds.</div>';
  try {
    const dataURL = await fileToDataURL(file);
    const r = await api('POST', '/import/screenshot', { image: dataURL });
    SCAN = r.accounts || [];
    renderScanReview();
  } catch (err) {
    review.innerHTML = '<div class="sub" style="color:var(--red)">' + esc(err.message) + '</div>'
      + '<div style="margin-top:8px"><button class="ghost" onclick="document.getElementById(\'scanReview\').style.display=\'none\'">Close</button></div>';
  }
}

function renderScanReview() {
  const review = $('#scanReview');
  if (!SCAN.length) {
    review.innerHTML = '<div class="sub">No accounts detected. Try a clearer, tighter screenshot of just the account list.</div>'
      + '<div style="margin-top:8px"><button class="ghost" id="scanClose">Close</button></div>';
    $('#scanClose').addEventListener('click', () => (review.style.display = 'none'));
    return;
  }
  let html = '<div class="row" style="justify-content:space-between; margin-bottom:8px">'
    + '<strong>Found ' + SCAN.length + ' account(s) — review &amp; edit, then save</strong>'
    + '<button class="ghost" id="scanClose">Cancel</button></div>'
    + '<div class="scan-scroll"><table class="scan-table"><thead><tr><th></th>'
    + SCAN_FIELDS.map(([, label]) => '<th>' + label + '</th>').join('') + '</tr></thead><tbody>';
  SCAN.forEach((acc, i) => {
    html += '<tr><td><input type="checkbox" id="scan_use_' + i + '" checked /></td>'
      + SCAN_FIELDS.map(([k]) => {
        const v = acc[k] != null ? acc[k] : '';
        return '<td><input id="scan_' + i + '_' + k + '" value="' + esc(v) + '" /></td>';
      }).join('') + '</tr>';
  });
  html += '</tbody></table></div>'
    + '<div class="sub" style="margin:8px 0">Matches by last-4 or nickname update an existing card; the rest are added new.</div>'
    + '<button id="scanSave">Save selected cards</button>';
  review.innerHTML = html;
  $('#scanClose').addEventListener('click', () => (review.style.display = 'none'));
  $('#scanSave').addEventListener('click', () => saveScanned().catch((err) => toast(err.message)));
}

async function saveScanned() {
  const existing = (DASH && DASH.cards) || [];
  let created = 0, updated = 0;
  for (let i = 0; i < SCAN.length; i++) {
    if (!$('#scan_use_' + i).checked) continue;
    const body = {};
    SCAN_FIELDS.forEach(([k]) => {
      const raw = $('#scan_' + i + '_' + k).value.trim();
      if (raw === '') return;
      if (['credit_limit', 'current_balance', 'statement_balance', 'minimum_payment', 'apr', 'closing_day', 'due_day'].includes(k)) {
        const n = Number(raw.replace(/[$,%\s]/g, ''));
        if (Number.isFinite(n)) body[k] = n;
      } else {
        body[k] = raw;
      }
    });
    if (!body.nickname && !body.issuer) continue;
    if (SCAN[i].autopay != null) body.autopay = SCAN[i].autopay;
    // Match an existing card to update rather than duplicate.
    const last4 = (body.last4 || '').replace(/\D/g, '').slice(-4);
    const nick = (body.nickname || '').toLowerCase();
    const match = existing.find((c) =>
      (last4 && String(c.last4 || '').replace(/\D/g, '').slice(-4) === last4) ||
      (nick && String(c.nickname || '').toLowerCase() === nick));
    if (match) { await api('PUT', '/cards/' + match.id, body); updated++; }
    else { await api('POST', '/cards', body); created++; }
  }
  $('#scanReview').style.display = 'none';
  toast(`Saved ${created} new, ${updated} updated`);
  load();
}

// ── Auth + PWA ──────────────────────────────────────────────────────────
async function setupAuth() {
  try {
    const s = await api('GET', '/auth/status');
    if (s.enabled) $('#logout').style.display = '';
  } catch (_) { /* ignore */ }
}

async function setupScreenshot() {
  try {
    const s = await api('GET', '/import/screenshot/status');
    if (!s.enabled) $('#scanShot').title = 'Set CM_ANTHROPIC_API_KEY on the server to enable AI screenshot import';
  } catch (_) { /* ignore */ }
}

function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
}

// ── Backup & restore ────────────────────────────────────────────────────
async function setupBackup() {
  try {
    const s = await api('GET', '/backup/status');
    const last = s.lastTime ? new Date(s.lastTime).toLocaleString() : 'none yet';
    $('#backupStatus').textContent =
      `Last backup: ${last} · ${s.count} kept on server · Off-server email: ${s.emailConfigured ? 'on' : 'off (set SMTP)'}`;
    if (!s.emailConfigured) {
      const b = $('#emailBackup');
      b.disabled = true;
      b.title = 'Configure SMTP (email) to send backups off-server';
    }
  } catch (_) { /* ignore */ }
}

async function emailBackupNow() {
  const r = await api('POST', '/backup/run');
  toast(r.emailed ? 'Backup saved + emailed to you' : `Backup saved on server (${r.emailReason})`);
  setupBackup();
}

async function handleRestoreFile(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!file) return;
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch (_) {
    toast('That file is not valid JSON.');
    return;
  }
  if (!confirm('Restore will REPLACE all current data with this backup. Continue?')) return;
  const r = await api('POST', '/admin/restore', { data, replace: true });
  const c = r.imported || {};
  toast(`Restored ${c.cards || 0} cards, ${c.scores || 0} scores, ${c.payments || 0} payments`);
  load();
  setupBackup();
}

// ── Score from screenshot ───────────────────────────────────────────────
async function handleScoreFile(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!file) return;
  toast('📷 Reading your score…');
  try {
    const dataURL = await fileToDataURL(file);
    const r = await api('POST', '/import/score-screenshot', { image: dataURL });
    if (!r.score) { toast('No score found. Try a tighter screenshot of just the score.'); return; }
    $('#sc_score').value = r.score;
    if (r.source) $('#sc_source').value = r.source;
    if (r.bureau) $('#sc_bureau').value = r.bureau;
    $('#sc_date').value = r.date || new Date().toISOString().slice(0, 10);
    toast('Score read — review it, then click Log score.');
    $('#sc_score').scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    toast(err.message);
  }
}

// ── Phone alerts (web push) ─────────────────────────────────────────────
let PUSH_KEY = null;

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function setupAlerts() {
  try {
    const k = await api('GET', '/push/key');
    if (!k.enabled || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    PUSH_KEY = k.publicKey;
    const btn = $('#enableAlerts');
    btn.style.display = '';
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    const sub = reg && (await reg.pushManager.getSubscription());
    if (sub) btn.textContent = '🔔 Alerts on';
  } catch (_) { /* ignore */ }
}

async function enableAlerts() {
  if (!PUSH_KEY) { toast('Alerts are not configured on the server.'); return; }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') { toast('Allow notifications to get alerts on this device.'); return; }
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUSH_KEY),
    });
  }
  await api('POST', '/push/subscribe', { subscription: sub });
  await api('POST', '/push/test').catch(() => {});
  $('#enableAlerts').textContent = '🔔 Alerts on';
  toast('Alerts enabled — sent a test notification.');
}

// ── What-if simulator ───────────────────────────────────────────────────
const SIM_PAY = {}; // cardId -> planned payment string (survives reloads)

function utilClass(color) {
  return color === 'green' ? 'sim-good' : color === 'yellow' ? 'sim-warn' : 'sim-bad';
}

function renderSimulator(cards) {
  const host = $('#simCards');
  if (!host) return;
  const active = (cards || []).filter((c) => c.active);
  host.innerHTML = active.map((c) => {
    const u = c.utilization ? c.utilization.reportedPct : 0;
    const val = SIM_PAY[c.id] != null ? SIM_PAY[c.id] : '';
    return `<div class="sim-card-row">
      <span class="nm">${esc(c.nickname)}</span>
      <span class="now">${money(c.statement_balance)} · ${u}%</span>
      <input id="sim_pay_${c.id}" type="number" min="0" step="50" placeholder="pay $" value="${esc(val)}" />
    </div>`;
  }).join('') || '<div class="sub">Add a card to use the simulator.</div>';
  active.forEach((c) => {
    const inp = $('#sim_pay_' + c.id);
    if (inp) inp.addEventListener('input', () => { SIM_PAY[c.id] = inp.value; debouncedSim(); });
  });
  runSim();
}

let _simTimer = null;
function debouncedSim() {
  clearTimeout(_simTimer);
  _simTimer = setTimeout(() => runSim().catch(() => {}), 300);
}

async function runSim() {
  const target = Number($('#targetUtil').value) || 9;
  const adjustments = Object.entries(SIM_PAY)
    .map(([id, payment]) => ({ id: Number(id), payment: Number(payment) || 0 }))
    .filter((a) => a.payment > 0);
  const sim = await api('POST', '/simulate', { adjustments, target });
  renderSimOut(sim);
}

function renderSimOut(sim) {
  const out = $('#simOut');
  if (!out) return;
  const repArrow = sim.delta.reportedPct === 0 ? '' :
    `<span class="sim-arrow">${sim.before.reportedPct}% →</span> `;
  const healthArrow = sim.delta.health === 0 ? `${sim.before.health}` :
    `${sim.before.health} → <strong>${sim.after.health}</strong> <span class="${sim.delta.health >= 0 ? 'sim-good' : 'sim-bad'}">(${sim.delta.health >= 0 ? '+' : ''}${sim.delta.health})</span>`;
  const targetLine = sim.totalPaid <= 0 ? '' :
    (sim.meetsTarget
      ? `<div class="sim-good" style="margin-top:8px">✓ Reported utilization is under your ${sim.target}% target.</div>`
      : `<div class="sim-warn" style="margin-top:8px">Still above your ${sim.target}% target — pay more on your highest-% cards to get there.</div>`);
  out.innerHTML = `
    <div class="sub">Projected reported utilization (what the bureaus see)</div>
    <div class="sim-big ${utilClass(sim.after.reportedColor)}">${repArrow}${sim.after.reportedPct}%</div>
    <div class="sim-line"><span>Current utilization</span><span class="${utilClass(sim.after.currentColor)}">${sim.before.currentPct}% → ${sim.after.currentPct}%</span></div>
    <div class="sim-line"><span>Health indicator /100</span><span>${healthArrow}</span></div>
    <div class="sim-line"><span>Total planned payment</span><span><strong>${money(sim.totalPaid)}</strong></span></div>
    ${targetLine}`;
}

// ── Wire everything up ──
function wire() {
  buildAddCard();
  $('#refresh').addEventListener('click', () => load().then(() => toast('Refreshed')));
  $('#targetUtil').addEventListener('change', load);
  $('#azeo').addEventListener('change', load);
  $('#saveCard').addEventListener('click', () => saveCard().catch((e) => toast(e.message)));
  $('#cancelEdit').addEventListener('click', resetCardForm);
  $('#clearData').addEventListener('click', async () => {
    if (!confirm('Delete ALL cards, scores, inquiries, payments and check-ins? This clears the sample data so you can enter your own. This cannot be undone.')) return;
    await api('POST', '/admin/reset');
    toast('Cleared. Add your real cards below.');
    resetCardForm();
    load();
  });
  $('#loadSample').addEventListener('click', async () => {
    if (!confirm('Replace current data with the demo sample data?')) return;
    await api('POST', '/admin/load-sample');
    toast('Sample data loaded');
    load();
  });
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

  $('#scanShot').addEventListener('click', () => $('#scanFile').click());
  $('#scanFile').addEventListener('change', (e) => handleScanFile(e));
  $('#scanScore').addEventListener('click', () => $('#scoreFile').click());
  $('#scoreFile').addEventListener('change', (e) => handleScoreFile(e));
  $('#enableAlerts').addEventListener('click', () => enableAlerts().catch((e) => toast(e.message)));
  $('#logout').addEventListener('click', async () => { await api('POST', '/logout'); window.location.href = '/login'; });

  $('#emailBackup').addEventListener('click', () => emailBackupNow().catch((e) => toast(e.message)));
  $('#restoreBtn').addEventListener('click', () => $('#restoreFile').click());
  $('#restoreFile').addEventListener('change', (e) => handleRestoreFile(e).catch((err) => toast(err.message)));

  $('#simReset').addEventListener('click', () => {
    Object.keys(SIM_PAY).forEach((k) => delete SIM_PAY[k]);
    document.querySelectorAll('[id^="sim_pay_"]').forEach((i) => (i.value = ''));
    runSim().catch(() => {});
  });
  $('#targetUtil').addEventListener('change', () => runSim().catch(() => {}));

  setupAuth();
  setupScreenshot();
  setupBackup();
  setupAlerts();
  registerSW();
  load().catch((e) => toast('Load failed: ' + e.message));
}

wire();
