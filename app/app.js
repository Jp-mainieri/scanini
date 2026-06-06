/* ══════════════════════════════════════════════════════════════
   Scanini — Copa 2026
   ══════════════════════════════════════════════════════════════ */

// ─── CONFIG ──────────────────────────────────────────────────
const WORKER_URL     = 'https://scanini.scaniworker.workers.dev';
const APP_URL        = 'scanini.pages.dev';
const MP_PAYMENT_LINK = 'https://mpago.la/2PzMmCY';

// ─── DEVICE ID ───────────────────────────────────────────────
function getDeviceId() {
  let id = localStorage.getItem('fig_device_id');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem('fig_device_id', id);
  }
  return id;
}
const deviceId = getDeviceId();

// ─── STATE ───────────────────────────────────────────────────
let owned        = new Set(JSON.parse(localStorage.getItem('fig_owned') || '[]'));
let stream       = null;
let facingMode   = 'environment';
let deferredPrompt = null;
let scanMode     = 'have';
let albumFilter  = 'all';
let toastTimer   = null;
let resultTimer  = null;
let syncTimer    = null;

const $          = id => document.getElementById(id);
const codeSet    = new Set(ALL_CODES);

function save() {
  localStorage.setItem('fig_owned', JSON.stringify([...owned]));
  scheduleAlbumPush();
}

// Inline SVGs para células do álbum (evita overhead do lucide em 968 células)
const SVG_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const SVG_MINUS = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

// ─── INIT ────────────────────────────────────────────────────
function init() {
  buildFilterPills();
  updateStats();
  renderAlbum();
  updateWhatsApp();
  lucide.createIcons();
  syncPremiumStatus();
}

// ─── STATS ───────────────────────────────────────────────────
function updateStats() {
  const have = owned.size, missing = TOTAL - have;
  const pct  = TOTAL ? Math.round(have / TOTAL * 100) : 0;
  $('sTotal').textContent   = TOTAL;
  $('sHave').textContent    = have;
  $('sMissing').textContent = missing;
  $('sPct').textContent     = pct + '%';
  $('progFill').style.width = pct + '%';
}

// ─── TABS ────────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  $('panel-' + name).classList.add('active');
  $('nav-' + name).classList.add('active');
  if (name !== 'scan' && stream) stopCamera();
  if (name === 'wa') updateWhatsApp();
}

// ─── ALBUM FILTER ────────────────────────────────────────────
function buildFilterPills() {
  const row = $('filterRow');
  ALBUM.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'filter-pill';
    btn.dataset.filter = t.prefix;
    btn.textContent = `${t.flag} ${t.name}`;
    btn.onclick = () => setAlbumFilter(t.prefix);
    row.appendChild(btn);
  });
}

function setAlbumFilter(filter) {
  albumFilter = filter;
  document.querySelectorAll('.filter-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.filter === filter);
  });
  renderAlbum();
}

// ─── ALBUM RENDER ────────────────────────────────────────────
function renderAlbum() {
  let teams;
  if (albumFilter === 'all') {
    teams = ALBUM;
  } else if (albumFilter === 'missing') {
    teams = ALBUM.filter(t => t.stickers.some(s => !owned.has(s.code)));
  } else {
    teams = ALBUM.filter(t => t.prefix === albumFilter);
  }

  let html = '';
  for (const t of teams) {
    const haveCount = t.stickers.filter(s => owned.has(s.code)).length;
    const total     = t.stickers.length;
    const pct       = Math.round(haveCount / total * 100);
    const isComplete = haveCount === total;
    const stickers  = albumFilter === 'missing'
      ? t.stickers.filter(s => !owned.has(s.code))
      : t.stickers;
    if (stickers.length === 0) continue;

    html += `<div class="team-card${isComplete ? ' collapsed' : ''}" data-prefix="${t.prefix}">
      <div class="team-card-head" onclick="toggleTeam('${t.prefix}')">
        <div class="team-flag-col">${t.flag}</div>
        <div class="team-body">
          <div class="team-info-row">
            <span class="team-name">${t.name}</span>
            <span class="team-count" data-count="${t.prefix}">${haveCount}/${total}</span>
          </div>
          <div class="team-prog">
            <div class="team-prog-fill" data-prog="${t.prefix}" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
      <div class="team-grid">`;

    for (const s of stickers) {
      const has = owned.has(s.code);
      html += `<div class="sticker-cell${has ? ' owned' : ''}" data-code="${s.code}" onclick="toggleSticker('${s.code}')">
        <span class="s-icon">${has ? SVG_CHECK : SVG_MINUS}</span>
        <span class="s-code">${s.code}</span>
      </div>`;
    }
    html += `</div></div>`;
  }

  $('albumContainer').innerHTML = html || `<div style="text-align:center;padding:40px 20px;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:1rem;text-transform:uppercase;color:var(--muted)">Álbum completo!</div>`;
  $('albumTotal').textContent = `${owned.size} / ${TOTAL}`;
}

function toggleTeam(prefix) {
  const card = document.querySelector(`.team-card[data-prefix="${prefix}"]`);
  if (card) card.classList.toggle('collapsed');
}

function toggleSticker(code) {
  const had = owned.has(code);
  if (had) { owned.delete(code); showToast(`${code} removida`); }
  else      { owned.add(code);   showToast(`${code} adicionada`, 'success'); }
  if (navigator.vibrate) navigator.vibrate(30);
  save(); updateStats(); updateWhatsApp();

  if (albumFilter === 'missing') {
    // re-render pois a célula precisa sumir quando marcada
    renderAlbum();
    return;
  }

  // Atualização cirúrgica da célula
  const has = owned.has(code);
  document.querySelectorAll(`[data-code="${code}"]`).forEach(cell => {
    cell.classList.toggle('owned', has);
    cell.querySelector('.s-icon').innerHTML = has ? SVG_CHECK : SVG_MINUS;
  });

  // Atualiza contadores e barras do time afetado
  const team = ALBUM.find(t => t.stickers.some(s => s.code === code));
  if (team) {
    const haveCount = team.stickers.filter(s => owned.has(s.code)).length;
    const pct = Math.round(haveCount / team.stickers.length * 100);
    const countEl = document.querySelector(`[data-count="${team.prefix}"]`);
    const progEl  = document.querySelector(`[data-prog="${team.prefix}"]`);
    if (countEl) countEl.textContent = `${haveCount}/${team.stickers.length}`;
    if (progEl)  progEl.style.width  = pct + '%';
    const card = document.querySelector(`.team-card[data-prefix="${team.prefix}"]`);
    if (card) card.classList.toggle('collapsed', haveCount === team.stickers.length);
  }

  $('albumTotal').textContent = `${owned.size} / ${TOTAL}`;
}

// ─── WHATSAPP ────────────────────────────────────────────────
function buildMessage() {
  const missing = ALL_CODES.filter(c => !owned.has(c));
  if (missing.length === 0) return '🏆 Álbum completo! Parabéns!';
  let msg = `📌 *Figurinhas que faltam — Copa 2026*\n`;
  msg += `_${missing.length} de ${TOTAL} faltando (${Math.round(owned.size / TOTAL * 100)}% completo)_\n\n`;
  for (const t of ALBUM) {
    const m = t.stickers.filter(s => !owned.has(s.code)).map(s => s.code);
    if (m.length === 0) continue;
    msg += `${t.flag} *${t.name}:* ${m.join(', ')}\n`;
  }
  msg += `\n_Feito com o Scanini_`;
  return msg;
}

function updateWhatsApp() {
  const missing = ALL_CODES.filter(c => !owned.has(c));
  const pct = Math.round(owned.size / TOTAL * 100);
  $('listaSub').textContent = missing.length === 0
    ? '🏆 Álbum completo! Parabéns!'
    : `${missing.length} figurinhas faltando · ${pct}% completo`;
  $('waPrev').textContent = owned.size === 0 ? 'Adicione figurinhas para gerar a lista…' : buildMessage();
}

function openWhatsApp() {
  if (owned.size === TOTAL) { showToast('Álbum completo!', 'success'); return; }
  window.open(`https://wa.me/?text=${encodeURIComponent(buildMessage())}`, '_blank');
}

function copyMsg() {
  navigator.clipboard.writeText(buildMessage())
    .then(() => showToast('Lista copiada!', 'success'))
    .catch(() => showToast('Erro ao copiar', 'error'));
}

// ─── MANUAL ADD ──────────────────────────────────────────────
function normalizeCode(raw) {
  return raw.trim().toUpperCase().replace(/\s+/g, '').replace(/[-_.]/g, '');
}

function openManualSheet() {
  $('manualInp').value = '';
  $('manualModal').classList.add('show');
  setTimeout(() => $('manualInp').focus(), 300);
}
function closeManualSheet() { $('manualModal').classList.remove('show'); }

function addManual() {
  const code = normalizeCode($('manualInp').value);
  if (!code) return;
  if (!codeSet.has(code)) {
    showToast('Código não encontrado no álbum', 'error'); return;
  }
  if (owned.has(code)) {
    showToast(`${code} já adicionada`); $('manualInp').value = ''; return;
  }
  owned.add(code); save(); updateStats(); renderAlbum(); updateWhatsApp();
  showToast(`${code} adicionada`, 'success');
  $('manualInp').value = '';
  $('manualInp').focus();
}

$('manualModal').addEventListener('click', e => { if (e.target.id === 'manualModal') closeManualSheet(); });

// ─── CAMERA ──────────────────────────────────────────────────
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 1280 } }
    });
    $('video').srcObject = stream;
    $('camInactive').classList.add('hidden');
    $('startBtn').classList.add('hidden');
    $('camChips').classList.remove('hidden');
    $('camManualPill').classList.remove('hidden');
    $('camControls').classList.remove('hidden');
    $('scanFrame').classList.toggle('hidden', scanMode === 'page');
    setTimeout(() => { $('captureBtn').disabled = false; }, 700);
  } catch {
    showToast('Sem acesso à câmera. Verifique as permissões.', 'error');
  }
}

function stopCamera() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  $('video').srcObject = null;
  $('camInactive').classList.remove('hidden');
  $('startBtn').classList.remove('hidden');
  $('camChips').classList.add('hidden');
  $('camManualPill').classList.add('hidden');
  $('camControls').classList.add('hidden');
  $('scanFrame').classList.add('hidden');
  $('captureBtn').disabled = true;
  hideResultToast();
}

async function switchCamera() {
  if (!stream) return;
  facingMode = facingMode === 'environment' ? 'user' : 'environment';
  stream.getTracks().forEach(t => t.stop());
  stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 1280 } }
    });
    $('video').srcObject = stream;
  } catch {}
}

async function capture() {
  const video = $('video'), canvas = $('canvas');
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const quality = scanMode === 'page' ? 0.9 : 0.8;
  const b64 = canvas.toDataURL('image/jpeg', quality).split(',')[1];

  $('captureBtn').disabled = true;
  hideResultToast();

  try {
    const mode = scanMode === 'page' ? 'page' : 'single';
    const res  = await callWorker('/api/scan', { image: b64, mode, deviceId });
    if (scanMode === 'page') handlePageResult(res);
    else handleResult(res);
  } catch (e) {
    if (e.message === 'premium_required') {
      showResultToast('err', 'Scanner Premium', 'Ative seu código para escanear');
      openPremiumModal();
    } else {
      showResultToast('err', 'Algo deu errado', e.message || 'Tente de novo');
    }
  } finally {
    if (stream) $('captureBtn').disabled = false;
  }
}

function setMode(mode) {
  scanMode = mode;
  $('chipHave').classList.toggle('active',    mode === 'have');
  $('chipMissing').classList.toggle('active', mode === 'missing');
  $('chipPage').classList.toggle('active',    mode === 'page');
  const hints = {
    have:    'Escaneie a figurinha que você tem na mão',
    missing: 'Aponte para os espaços vazios do álbum',
    page:    'Fotografe uma folha inteira (1-10 ou 11-20)'
  };
  $('modeHint').textContent = hints[mode];
  if (stream) $('scanFrame').classList.toggle('hidden', mode === 'page');
}

function handleResult(r) {
  if (!r || !r.code) {
    showResultToast('err', 'Não consegui ler', 'Tente mais perto ou com melhor luz');
    return;
  }
  const code = normalizeCode(r.code);
  const who  = r.player || r.team || '';
  const conf = r.confidence && r.confidence !== 'none' ? r.confidence : null;

  if (!codeSet.has(code)) {
    showResultToast('err', code, 'Código não reconhecido. Tente digitar manualmente.', conf);
    return;
  }

  if (scanMode === 'have') {
    if (owned.has(code)) {
      showResultToast('dup', `Repetida! ${code}`, who, conf);
      return;
    }
    owned.add(code); save(); updateStats(); updateWhatsApp();
    showResultToast('ok', code, who, conf);
    if (navigator.vibrate) navigator.vibrate(40);
  } else {
    if (!owned.has(code)) {
      showResultToast('dup', code, 'Já estava como faltando', conf);
      return;
    }
    owned.delete(code); save(); updateStats(); updateWhatsApp();
    showResultToast('ok', code, who || 'Marcada como faltando', conf);
    if (navigator.vibrate) navigator.vibrate(40);
  }
}

function handlePageResult(res) {
  const list = res && Array.isArray(res.stickers) ? res.stickers : [];
  if (list.length === 0) {
    showToast('Não consegui ler a folha. Tente enquadrar melhor.', 'error');
    return;
  }
  let added = 0, removed = 0, ignored = 0;
  for (const item of list) {
    const code = normalizeCode(item.code || '');
    if (!codeSet.has(code)) { ignored++; continue; }
    if (item.bigNumberVisible) {
      if (owned.has(code)) { owned.delete(code); removed++; }
    } else {
      if (!owned.has(code)) { owned.add(code); added++; }
    }
  }
  save(); updateStats(); updateWhatsApp();
  if (navigator.vibrate) navigator.vibrate(60);

  const team  = res.team ? ` (${res.team})` : '';
  const parts = [];
  if (added)   parts.push(`${added} marcada${added > 1 ? 's' : ''} como tenho`);
  if (removed) parts.push(`${removed} como falta`);
  if (!added && !removed) parts.push('nada mudou');
  const msg = `Folha lida${team}: ${parts.join(', ')}`;
  showToast(msg, 'success');
}

// ─── RESULT TOAST (sobre a câmera) ───────────────────────────
const LUCIDE_SVG = {
  check:       `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  x:           `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  'refresh-cw':`<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
};

function showResultToast(type, code, player, conf) {
  const iconNames = { ok: 'check', err: 'x', dup: 'refresh-cw' };
  const iconEl  = $('toastIcon');
  const codeEl  = $('toastCode');
  const confEl  = $('toastConf');

  $('toastIconInner').innerHTML = LUCIDE_SVG[iconNames[type]] || LUCIDE_SVG.check;
  iconEl.className  = `toast-icon${type === 'ok' ? '' : ' ' + type}`;
  codeEl.className  = `toast-code${type === 'ok' ? '' : ' ' + type}`;
  codeEl.textContent  = code;
  $('toastPlayer').textContent = player || '';

  if (conf && conf !== 'none') {
    const labels = { high: 'Alta', medium: 'Média', low: 'Baixa' };
    confEl.className  = `toast-conf ${conf}`;
    confEl.textContent = labels[conf] || conf;
  } else {
    confEl.className = 'toast-conf hidden';
  }

  $('resultToast').classList.add('show');
  clearTimeout(resultTimer);
  resultTimer = setTimeout(hideResultToast, 3000);
}

function hideResultToast() { $('resultToast').classList.remove('show'); }

// ─── WORKER ──────────────────────────────────────────────────
async function callWorker(path, body) {
  const resp = await fetch(WORKER_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`);
  return data;
}

// ─── ALBUM SYNC ──────────────────────────────────────────────
const SVG_CLOUD = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`;
const SVG_CLOUD_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="9 12 11 14 15 10"/></svg>`;

function getSyncCode() { return localStorage.getItem('fig_code') || null; }

function setSyncIndicator(state) {
  const el = $('syncIndicator');
  if (!el) return;
  el.className = state;
  if (state === 'syncing') {
    el.innerHTML = SVG_CLOUD;
    el.title = 'Sincronizando…';
  } else if (state === 'done') {
    el.innerHTML = SVG_CLOUD_CHECK;
    el.title = 'Sincronizado';
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => { el.className = ''; el.innerHTML = ''; }, 2500);
  } else {
    el.innerHTML = '';
  }
}

// Puxa álbum do KV e faz union com local — sem bloquear UI
async function pullAlbum(code) {
  try {
    const resp = await fetch(`${WORKER_URL}/api/album?code=${encodeURIComponent(code)}`);
    if (!resp.ok) return;
    const data   = await resp.json();
    const remote = data.owned || [];
    const before = owned.size;
    remote.forEach(c => { if (codeSet.has(c)) owned.add(c); });
    if (owned.size !== before) {
      localStorage.setItem('fig_owned', JSON.stringify([...owned]));
      updateStats(); renderAlbum(); updateWhatsApp();
    }
  } catch {}
}

// Debounce de 2s: envia álbum local ao KV e aplica union da resposta
function scheduleAlbumPush() {
  const code = getSyncCode();
  if (!code) return;
  setSyncIndicator('syncing');
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      const resp = await fetch(`${WORKER_URL}/api/album`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, owned: [...owned] }),
      });
      if (!resp.ok) { setSyncIndicator(''); return; }
      const data   = await resp.json();
      const before = owned.size;
      (data.owned || []).forEach(c => { if (codeSet.has(c)) owned.add(c); });
      if (owned.size !== before) {
        localStorage.setItem('fig_owned', JSON.stringify([...owned]));
        updateStats(); renderAlbum(); updateWhatsApp();
      }
      setSyncIndicator('done');
    } catch { setSyncIndicator(''); }
  }, 2000);
}

// ─── SETTINGS ────────────────────────────────────────────────
function openSettings() {
  refreshPremiumSettingsRow();
  $('settingsModal').classList.add('show');
}
function closeSettings() { $('settingsModal').classList.remove('show'); }

function resetAll() {
  if (!confirm('Apagar TODAS as figurinhas marcadas? Não pode ser desfeito.')) return;
  owned.clear(); save(); updateStats(); renderAlbum(); updateWhatsApp();
  closeSettings();
  showToast('Álbum zerado', 'info');
}

$('settingsModal').addEventListener('click', e => { if (e.target.id === 'settingsModal') closeSettings(); });

// ─── HELPERS ─────────────────────────────────────────────────
const TOAST_ICONS = {
  success: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  error:   `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  info:    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

function showToast(msg, type = 'info') {
  $('gToastIcon').innerHTML = TOAST_ICONS[type] || TOAST_ICONS.info;
  $('gToastMsg').textContent = msg;
  $('gToast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('gToast').classList.remove('show'), 2500);
}

// ─── PWA INSTALL ─────────────────────────────────────────────
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  $('installBanner').classList.add('show');
});
function doInstall() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.finally(() => {
    deferredPrompt = null;
    $('installBanner').classList.remove('show');
  });
}

// ─── PREMIUM ─────────────────────────────────────────────────
let isPremium = localStorage.getItem('fig_premium') === '1';

async function syncPremiumStatus() {
  try {
    const resp = await fetch(`${WORKER_URL}/api/status?deviceId=${encodeURIComponent(deviceId)}`);
    if (!resp.ok) return;
    const data = await resp.json();
    isPremium = !!data.premium;
    if (isPremium) {
      localStorage.setItem('fig_premium', '1');
      refreshPremiumUI();
      const code = getSyncCode();
      if (code) pullAlbum(code); // sync silencioso ao abrir
    } else {
      localStorage.removeItem('fig_premium');
      refreshPremiumUI();
    }
  } catch {}
}

function refreshPremiumUI() {
  const lockEl = $('pdfLock');
  const btnEl  = $('pdfBtn');
  if (isPremium) { lockEl.style.display = 'none'; btnEl.classList.add('show'); }
  else           { lockEl.style.display = 'block'; btnEl.classList.remove('show'); }
}

function refreshPremiumSettingsRow() {
  const text = $('premiumStatusText');
  const btn  = $('premiumActivateBtn');
  if (isPremium) {
    text.textContent = 'Premium ativo';
    text.className = 'premium-status active';
    btn.style.display = 'none';
  } else {
    text.textContent = 'Não ativado';
    text.className = 'premium-status inactive';
    btn.style.display = '';
  }
}

function openPremiumModal() {
  $('codeInp').value = '';
  $('codeStatus').textContent = '';
  $('codeStatus').className = 'code-status';
  $('premiumModal').classList.add('show');
  lucide.createIcons();
}
function closePremiumModal() { $('premiumModal').classList.remove('show'); }

async function activateCode() {
  const raw    = $('codeInp').value.trim().toUpperCase();
  const status = $('codeStatus');
  if (!raw) return;

  status.className = 'code-status';
  status.textContent = 'Verificando…';

  try {
    await callWorker('/api/activate', { code: raw, deviceId });
    isPremium = true;
    localStorage.setItem('fig_premium', '1');
    localStorage.setItem('fig_code', raw);
    status.className = 'code-status ok';
    status.textContent = '✓ Código ativado! Seja bem-vindo ao Premium.';
    refreshPremiumUI();
    pullAlbum(raw); // puxa álbum do KV e faz union com local
    setTimeout(() => closePremiumModal(), 1500);
    showToast('Premium ativado!', 'success');
  } catch {
    status.className = 'code-status err';
    status.textContent = 'Código inválido. Verifique e tente novamente.';
    $('codeInp').classList.add('invalid');
    setTimeout(() => $('codeInp').classList.remove('invalid'), 1500);
  }
}

$('premiumModal').addEventListener('click', e => { if (e.target.id === 'premiumModal') closePremiumModal(); });

// ─── PDF ─────────────────────────────────────────────────────
function generatePDF() {
  const missing = ALL_CODES.filter(c => !owned.has(c));
  if (missing.length === 0) { showToast('Álbum completo! Nada pra imprimir.', 'success'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, margin = 14, usable = W - margin * 2;
  let y = margin;

  doc.setFillColor(15, 26, 16);
  doc.rect(0, 0, W, 28, 'F');
  doc.setTextColor(232, 160, 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('FIGURINHAS QUE FALTAM — Copa 2026', margin, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 190, 160);
  const date = new Date().toLocaleDateString('pt-BR');
  doc.text(`Gerado em ${date}  ·  ${missing.length} faltando de ${TOTAL}  ·  ${Math.round(owned.size / TOTAL * 100)}% completo`, margin, 19);
  doc.setTextColor(120, 130, 110);
  doc.setFontSize(7);
  doc.text(APP_URL, margin, 25);
  y = 36;

  for (const team of ALBUM) {
    const teamMissing = team.stickers.filter(s => !owned.has(s.code)).map(s => s.code);
    if (teamMissing.length === 0) continue;
    if (y > 270) { doc.addPage(); y = margin; }

    doc.setFillColor(20, 35, 22);
    doc.roundedRect(margin, y, usable, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(232, 160, 16);
    doc.text(`${team.flag}  ${team.name.toUpperCase()}`, margin + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 150, 130);
    doc.text(`${teamMissing.length} faltando`, W - margin - 2, y + 5, { align: 'right' });
    y += 10;

    const colW = 18, cols = Math.floor(usable / colW);
    let col = 0;
    for (const code of teamMissing) {
      if (y > 278) { doc.addPage(); y = margin; }
      doc.setFillColor(240, 244, 235);
      doc.roundedRect(margin + col * colW, y, colW - 1, 5.5, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 26, 16);
      doc.text(code, margin + col * colW + (colW - 1) / 2, y + 3.8, { align: 'center' });
      col++;
      if (col >= cols) { col = 0; y += 7; }
    }
    if (col > 0) y += 7;
    y += 4;
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(140, 150, 130);
    doc.text(`Página ${i} de ${pages}  ·  ${APP_URL}`, W / 2, 293, { align: 'center' });
  }

  doc.save(`figurinhas-faltando-${date.replace(/\//g, '-')}.pdf`);
  showToast('PDF baixando…', 'success');
}

init();
refreshPremiumUI();
