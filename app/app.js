/* ══════════════════════════════════════════════════════════════
   Scanner de Figurinhas — Copa 2026
   Lógica principal: câmera, Gemini Vision, álbum, export WhatsApp
   ══════════════════════════════════════════════════════════════ */

// ─── CONFIG ──────────────────────────────────────────────────
const WORKER_URL = 'https://scanini-worker.scaniworker.workers.dev';
const APP_URL = 'scanini.pages.dev';

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
let owned = new Set(JSON.parse(localStorage.getItem('fig_owned') || '[]'));
let stream = null;
let missingOnly = false;
let deferredPrompt = null;
let scanMode = 'have';   // 'have' = escaneia o que tenho | 'missing' = escaneia espaços vazios

const $ = id => document.getElementById(id);
const codeSet = new Set(ALL_CODES);
const teamByPrefix = Object.fromEntries(ALBUM.map(t => [t.prefix, t]));

function save() { localStorage.setItem('fig_owned', JSON.stringify([...owned])); }

// ─── INIT ────────────────────────────────────────────────────
function init() {
  // popular dropdown de times
  const sel = $('teamSelect');
  ALBUM.forEach(t => {
    const o = document.createElement('option');
    o.value = t.prefix;
    o.textContent = `${t.flag} ${t.name}`;
    sel.appendChild(o);
  });
  updateStats();
  renderAlbum();
  updateWhatsApp();
  syncPremiumStatus();
}

// ─── STATS / PROGRESS ────────────────────────────────────────
function updateStats() {
  const have = owned.size, missing = TOTAL - have;
  const pct = TOTAL ? Math.round(have / TOTAL * 100) : 0;
  $('sTotal').textContent = TOTAL;
  $('sHave').textContent = have;
  $('sMissing').textContent = missing;
  $('sPct').textContent = pct + '%';
  $('progFill').style.width = pct + '%';
}

// ─── TABS ────────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.panel === name));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  $('panel-' + name).classList.add('active');
  if (name !== 'scan' && stream) stopCamera();
  if (name === 'wa') updateWhatsApp();
}

// ─── ALBUM RENDER ────────────────────────────────────────────
function toggleMissingOnly() {
  missingOnly = !missingOnly;
  $('missingToggle').classList.toggle('active', missingOnly);
  renderAlbum();
}

function renderAlbum() {
  const sel = $('teamSelect').value;
  const container = $('albumContainer');
  const teams = sel === 'all' ? ALBUM : ALBUM.filter(t => t.prefix === sel);
  let html = '';

  for (const t of teams) {
    const cells = t.stickers.filter(s => !missingOnly || !owned.has(s.code));
    if (cells.length === 0) continue;
    const haveCount = t.stickers.filter(s => owned.has(s.code)).length;

    html += `<div class="team-block" data-prefix="${t.prefix}">
      <div class="team-head" onclick="toggleTeam('${t.prefix}')">
        <span class="flag">${t.flag}</span>
        <span class="name">${t.name}</span>
        <span class="cnt">${haveCount}/${t.stickers.length}</span>
        <span class="chev">▾</span>
      </div>
      <div class="grid">`;
    for (const s of cells) {
      const has = owned.has(s.code);
      const cls = 'cell' + (has ? ' owned' : '') + (s.role === 'special' ? ' special' : '');
      html += `<div class="${cls}" onclick="toggleSticker('${s.code}')">
        <span class="code">${s.code}</span>
      </div>`;
    }
    html += `</div></div>`;
  }

  container.innerHTML = html || '<div class="empty">🎉 Nada faltando aqui!</div>';
}

function toggleTeam(prefix) {
  const block = document.querySelector(`.team-block[data-prefix="${prefix}"]`);
  if (block) block.classList.toggle('collapsed');
}

function toggleSticker(code) {
  if (owned.has(code)) {
    owned.delete(code);
    showToast(`➖ ${code} removida`);
  } else {
    owned.add(code);
    showToast(`✅ ${code} adicionada`);
  }
  save(); updateStats(); renderAlbum(); updateWhatsApp();
}

// ─── WHATSAPP MESSAGE ────────────────────────────────────────
function buildMessage() {
  const missing = ALL_CODES.filter(c => !owned.has(c));
  if (missing.length === 0) return '🎉 Álbum completo! Parabéns! 🏆';

  let msg = `📌 *Figurinhas que faltam — Copa 2026*\n`;
  msg += `_${missing.length} de ${TOTAL} faltando (${Math.round(owned.size / TOTAL * 100)}% completo)_\n\n`;
  for (const t of ALBUM) {
    const m = t.stickers.filter(s => !owned.has(s.code)).map(s => s.code);
    if (m.length === 0) continue;
    msg += `${t.flag} *${t.name}:* ${m.join(', ')}\n`;
  }
  msg += `\n_Feito com o Scanner de Figurinhas 🏆_`;
  return msg;
}

function updateWhatsApp() {
  $('waPrev').textContent = owned.size === 0
    ? 'Adicione figurinhas para gerar a lista…'
    : buildMessage();
}

function openWhatsApp() {
  if (owned.size === TOTAL) { showToast('Álbum completo! 🎉'); return; }
  const url = `https://wa.me/?text=${encodeURIComponent(buildMessage())}`;
  window.open(url, '_blank');
}

function copyMsg() {
  navigator.clipboard.writeText(buildMessage())
    .then(() => showToast('📋 Lista copiada!'))
    .catch(() => showToast('Erro ao copiar'));
}

// ─── MANUAL ADD ──────────────────────────────────────────────
function normalizeCode(raw) {
  return raw.trim().toUpperCase().replace(/\s+/g, '').replace(/[-_.]/g, '');
}

function addManual() {
  const inp = $('manualInp');
  const code = normalizeCode(inp.value);
  if (!code) return;
  if (!codeSet.has(code)) {
    showToast(`⚠️ "${code}" não existe no álbum`);
    inp.select();
    return;
  }
  if (owned.has(code)) { showToast(`🔁 ${code} já adicionada`); inp.value = ''; return; }
  owned.add(code); save(); updateStats(); renderAlbum(); updateWhatsApp();
  showToast(`✅ ${code} adicionada!`);
  inp.value = '';
  inp.focus();
}

// ─── CAMERA ──────────────────────────────────────────────────
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } }
    });
    $('video').srcObject = stream;
    $('camOverlay').classList.add('hidden');
    $('scanFrame').classList.remove('hidden');
    $('camHint').classList.remove('hidden');
    $('startBtn').classList.add('hidden');
    $('captureBtn').classList.remove('hidden');
    $('stopBtn').classList.remove('hidden');
    setTimeout(() => { $('captureBtn').disabled = false; }, 700);
    setResult('', 'Câmera ativa. Enquadre a figurinha.');
  } catch (e) {
    setResult('error', '❌ Não consegui acessar a câmera. Verifique as permissões do navegador.');
  }
}

function stopCamera() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  $('video').srcObject = null;
  $('camOverlay').classList.remove('hidden');
  $('scanFrame').classList.add('hidden');
  $('camHint').classList.add('hidden');
  $('startBtn').classList.remove('hidden');
  $('captureBtn').classList.add('hidden');
  $('stopBtn').classList.add('hidden');
  $('captureBtn').disabled = true;
  setResult('', 'Aguardando…');
}

async function capture() {
  const video = $('video'), canvas = $('canvas');
  const vw = video.videoWidth, vh = video.videoHeight;
  canvas.width = vw; canvas.height = vh;
  canvas.getContext('2d').drawImage(video, 0, 0);
  // página inteira usa qualidade maior (mais texto pequeno pra ler)
  const quality = scanMode === 'page' ? 0.9 : 0.8;
  const b64 = canvas.toDataURL('image/jpeg', quality).split(',')[1];

  setResult('loading', '<span class="spinner"></span> ' + (scanMode === 'page' ? 'Lendo a página inteira…' : 'Lendo a figurinha…'));
  $('captureBtn').disabled = true;

  try {
    const mode = scanMode === 'page' ? 'page' : 'single';
    const res = await callWorker('/api/scan', { image: b64, mode, deviceId });
    if (scanMode === 'page') {
      handlePageResult(res);
    } else {
      handleResult(res);
    }
  } catch (e) {
    if (e.message === 'premium_required') {
      setResult('error', '🔒 O scanner requer Premium. Ative seu código.');
      openPremiumModal();
    } else {
      setResult('error', '❌ ' + (e.message || 'Erro ao analisar. Tente de novo.'));
    }
  } finally {
    if (stream) $('captureBtn').disabled = false;
  }
}

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

function handleResult(r) {
  if (!r || !r.code) {
    setResult('error', '❌ Não identifiquei o código. Aproxime mais ou melhore a luz.');
    return;
  }
  const code = normalizeCode(r.code);
  const who = r.player ? ` — ${r.player}` : (r.team ? ` — ${r.team}` : '');
  const confPill = r.confidence && r.confidence !== 'none'
    ? `<span class="conf ${r.confidence}">${({high:'alta',medium:'média',low:'baixa'})[r.confidence] || r.confidence}</span>` : '';

  if (!codeSet.has(code)) {
    setResult('error', `⚠️ Li "${code}"${who}, mas não está no álbum. Confira manualmente.${confPill}`);
    return;
  }

  if (scanMode === 'have') {
    // Escaneando figurinha que TENHO → adicionar
    if (owned.has(code)) {
      setResult('dup', `🔁 ${code}${who} — você já tem essa (repetida)!${confPill}`);
      return;
    }
    owned.add(code); save(); updateStats(); renderAlbum(); updateWhatsApp();
    setResult('success', `✅ ${code}${who} adicionada ao seu álbum!${confPill}`);
    if (navigator.vibrate) navigator.vibrate(40);
  } else {
    // Escaneando ESPAÇO VAZIO → isso é uma figurinha que FALTA
    if (!owned.has(code)) {
      setResult('dup', `📌 ${code}${who} — já estava na lista de faltantes.${confPill}`);
      return;
    }
    // estava marcada como "tenho", mas o espaço está vazio → corrige pra faltante
    owned.delete(code); save(); updateStats(); renderAlbum(); updateWhatsApp();
    setResult('success', `🔍 ${code}${who} marcada como FALTANDO.${confPill}`);
    if (navigator.vibrate) navigator.vibrate(40);
  }
}

function setMode(mode) {
  scanMode = mode;
  document.getElementById('modeHave').classList.toggle('active', mode === 'have');
  document.getElementById('modeMissing').classList.toggle('active', mode === 'missing');
  document.getElementById('modePage').classList.toggle('active', mode === 'page');
  const hints = {
    have: 'Escaneie as figurinhas que você <b>tem</b> na mão.',
    missing: 'Aponte para os <b>espaços vazios</b> do álbum (o que falta).',
    page: 'Fotografe <b>uma folha</b> (1-10 ou 11-20). Número grande à mostra = falta; coberto pelo jogador = tenho.'
  };
  document.getElementById('modeHint').innerHTML = hints[mode];
}

// Modo página: número grande visível = espaço VAZIO = não tenho.
//              número grande coberto = espaço PREENCHIDO = tenho.
function handlePageResult(res) {
  const list = res && Array.isArray(res.stickers) ? res.stickers : [];
  if (list.length === 0) {
    setResult('error', '❌ Não consegui ler nenhum código na folha. Tente enquadrar melhor.');
    return;
  }

  let added = 0, removed = 0, ignored = 0;
  for (const item of list) {
    const code = normalizeCode(item.code || '');
    if (!codeSet.has(code)) { ignored++; continue; }
    if (item.bigNumberVisible) {
      // número grande à mostra → espaço vazio → NÃO TENHO
      if (owned.has(code)) { owned.delete(code); removed++; }
    } else {
      // número coberto → figurinha colada → TENHO
      if (!owned.has(code)) { owned.add(code); added++; }
    }
  }

  save(); updateStats(); renderAlbum(); updateWhatsApp();
  if (navigator.vibrate) navigator.vibrate(60);

  const team = res.team ? ` (${res.team})` : '';
  let msg = `📄 Folha lida${team}: `;
  const parts = [];
  if (added) parts.push(`✅ ${added} marcada${added > 1 ? 's' : ''} como tenho`);
  if (removed) parts.push(`🔍 ${removed} marcada${removed > 1 ? 's' : ''} como falta`);
  if (!added && !removed) parts.push('nada mudou (tudo já estava certo)');
  msg += parts.join(', ') + '.';
  if (ignored) msg += ` (${ignored} não reconhecido${ignored > 1 ? 's' : ''})`;
  setResult('success', msg);
}

// ─── SETTINGS ────────────────────────────────────────────────
function openSettings() { $('settingsModal').classList.add('show'); }
function closeSettings() { $('settingsModal').classList.remove('show'); }

function resetAll() {
  if (!confirm('Apagar TODAS as figurinhas marcadas? Isso não pode ser desfeito.')) return;
  owned.clear(); save(); updateStats(); renderAlbum(); updateWhatsApp();
  closeSettings();
  showToast('🗑 Álbum zerado');
}

// ─── HELPERS ─────────────────────────────────────────────────
function setResult(type, html) {
  const el = $('result');
  el.className = 'result' + (type ? ' ' + type : '');
  el.innerHTML = html;
}
let toastTimer;
function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

// close modal on backdrop tap
$('settingsModal').addEventListener('click', e => {
  if (e.target.id === 'settingsModal') closeSettings();
});

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

// ─── PREMIUM / CÓDIGO ────────────────────────────────────────
let isPremium = localStorage.getItem('fig_premium') === '1';

async function syncPremiumStatus() {
  try {
    const resp = await fetch(`${WORKER_URL}/api/status?deviceId=${encodeURIComponent(deviceId)}`);
    if (!resp.ok) return;
    const data = await resp.json();
    isPremium = !!data.premium;
    if (isPremium) localStorage.setItem('fig_premium', '1');
    else localStorage.removeItem('fig_premium');
    refreshPremiumUI();
  } catch {}
}

function refreshPremiumUI() {
  const lockEl = $('pdfLock');
  const btnEl = $('pdfBtn');
  if (isPremium) {
    lockEl.style.display = 'none';
    btnEl.classList.add('show');
  } else {
    lockEl.style.display = 'block';
    btnEl.classList.remove('show');
  }
}

function openPremiumModal() {
  $('codeInp').value = '';
  $('codeStatus').textContent = '';
  $('codeStatus').className = 'code-status';
  $('premiumModal').classList.add('show');
}
function closePremiumModal() { $('premiumModal').classList.remove('show'); }

async function activateCode() {
  const raw = $('codeInp').value.trim().toUpperCase();
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
    status.textContent = '✅ Código válido! Premium ativado.';
    refreshPremiumUI();
    setTimeout(() => closePremiumModal(), 1400);
    showToast('🏆 Premium ativado!');
  } catch (e) {
    status.className = 'code-status err';
    status.textContent = '❌ Código inválido. Verifique e tente de novo.';
  }
}

$('premiumModal').addEventListener('click', e => {
  if (e.target.id === 'premiumModal') closePremiumModal();
});

// ─── GERAÇÃO DE PDF ──────────────────────────────────────────
function generatePDF() {
  const missing = ALL_CODES.filter(c => !owned.has(c));
  if (missing.length === 0) { showToast('🎉 Álbum completo! Nada pra imprimir.'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210, margin = 14;
  const usable = W - margin * 2;
  let y = margin;

  // Cabeçalho
  doc.setFillColor(10, 15, 30);
  doc.rect(0, 0, W, 28, 'F');
  doc.setTextColor(245, 197, 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('FIGURINHAS QUE FALTAM — Copa 2026', margin, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 190, 210);
  const date = new Date().toLocaleDateString('pt-BR');
  doc.text(`Gerado em ${date}  ·  ${missing.length} faltando de ${TOTAL}  ·  ${Math.round(owned.size/TOTAL*100)}% completo`, margin, 19);
  doc.setTextColor(100, 120, 150);
  doc.setFontSize(7);
  doc.text(APP_URL, margin, 25);

  y = 36;

  // Por time
  for (const team of ALBUM) {
    const teamMissing = team.stickers.filter(s => !owned.has(s.code)).map(s => s.code);
    if (teamMissing.length === 0) continue;

    // Verifica espaço pra cabeçalho + pelo menos 1 linha
    if (y > 270) { doc.addPage(); y = margin; }

    // Nome do time
    doc.setFillColor(20, 30, 55);
    doc.roundedRect(margin, y, usable, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(245, 197, 24);
    doc.text(`${team.flag}  ${team.name.toUpperCase()}`, margin + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(160, 170, 190);
    doc.text(`${teamMissing.length} faltando`, W - margin - 2, y + 5, { align: 'right' });
    y += 10;

    // Codes em linha — cabe ~10 por linha
    const colW = 18;
    const cols = Math.floor(usable / colW);
    let col = 0;

    for (const code of teamMissing) {
      if (y > 278) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 30, 30);
      // caixa clara por trás do código
      doc.setFillColor(240, 244, 255);
      doc.roundedRect(margin + col * colW, y, colW - 1, 5.5, 1, 1, 'F');
      doc.setTextColor(10, 15, 30);
      doc.text(code, margin + col * colW + (colW - 1) / 2, y + 3.8, { align: 'center' });
      col++;
      if (col >= cols) { col = 0; y += 7; }
    }
    if (col > 0) y += 7;
    y += 4; // espaço entre times
  }

  // Rodapé em todas as páginas
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(160, 170, 190);
    doc.text(`Página ${i} de ${pages}  ·  ${APP_URL}`, W / 2, 293, { align: 'center' });
  }

  doc.save(`figurinhas-faltando-${date.replace(/\//g,'-')}.pdf`);
  showToast('📄 PDF baixando…');
}

init();
refreshPremiumUI();
