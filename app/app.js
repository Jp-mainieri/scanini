/* ══════════════════════════════════════════════════════════════
   Scanner de Figurinhas — Copa 2026
   Lógica principal: câmera, Gemini Vision, álbum, export WhatsApp
   ══════════════════════════════════════════════════════════════ */

// ─── STATE ───────────────────────────────────────────────────
let owned = new Set(JSON.parse(localStorage.getItem('fig_owned') || '[]'));
let apiKey = localStorage.getItem('fig_gemini_key') || '';
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
  refreshKeyStatus();
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
  if (!apiKey) {
    setResult('error', '🔑 Configure sua chave da API Gemini primeiro (ícone ⚙️).');
    openSettings();
    return;
  }
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
    if (scanMode === 'page') {
      const res = await analyzePageWithGemini(b64);
      handlePageResult(res);
    } else {
      const res = await analyzeWithGemini(b64);
      handleResult(res);
    }
  } catch (e) {
    setResult('error', '❌ ' + (e.message || 'Erro ao analisar. Tente de novo.'));
  } finally {
    if (stream) $('captureBtn').disabled = false;
  }
}

// ─── GEMINI VISION ───────────────────────────────────────────
async function analyzeWithGemini(base64Image) {
  const prompt = `Você está vendo a foto de UMA figurinha do álbum Panini da Copa do Mundo 2026.

Cada figurinha tem um código no formato PREFIXO + NÚMERO, por exemplo: PAN3, BRA15, ARG1, MEX20.
O prefixo são 3 letras maiúsculas identificando a seleção (PAN=Panamá, BRA=Brasil, ARG=Argentina, MEX=México, USA=EUA, FRA=França, ENG=Inglaterra, ESP=Espanha, POR=Portugal, GER=Alemanha, etc).

IMPORTANTE: ignore o número grande decorativo "2026" ou "26" que aparece no FUNDO de toda figurinha — isso NÃO é o código. O código verdadeiro fica em texto menor, geralmente perto do nome do jogador ou no canto.

Se o código não estiver legível mas você reconhecer o jogador e a seleção, deduza o prefixo da seleção e informe o nome do jogador.

Responda SOMENTE com JSON puro, sem markdown, sem crases, neste formato exato:
{"code":"PAN3","player":"Fidel Escobar","team":"Panamá","confidence":"high"}

- "code": o código no formato PREFIXO+NÚMERO em maiúsculas, ou null se impossível
- "confidence": "high", "medium" ou "low"
- Se não for uma figurinha: {"code":null,"player":null,"team":null,"confidence":"none"}`;

  const text = await callGemini(prompt, base64Image, 800);
  const parsed = extractJSON(text);
  if (!parsed) {
    window.__lastRaw = text;
    const preview = text.slice(0, 60).replace(/\n/g, ' ');
    throw new Error(`Não entendi a resposta: "${preview}…"`);
  }
  return parsed;
}

// ─── Modo PÁGINA: lê vários códigos de uma vez ───────────────
async function analyzePageWithGemini(base64Image) {
  const prompt = `Você está vendo a foto de UMA FOLHA do álbum Panini da Copa do Mundo 2026.
A folha mostra vários espaços de figurinhas, todos da MESMA seleção.

COMO FUNCIONA ESTE ÁLBUM (muito importante):
- Cada espaço tem um código no formato PREFIXO + NÚMERO (ex: PAN1, PAN3, PAN6). O prefixo são 3 letras da seleção (PAN=Panamá, BRA=Brasil, ARG=Argentina, MEX=México, etc).
- Quando o espaço está VAZIO (figurinha faltando), aparece um NÚMERO GRANDE e legível impresso no fundo do espaço — por exemplo "PAN 3" em letras grandes.
- Quando o espaço está PREENCHIDO (figurinha colada), esse número grande fica COBERTO pela figurinha do jogador — então NÃO se vê o número grande, vê-se a foto do jogador.

IGNORE o "2026"/"26" decorativo gigante que aparece no fundo de TODO espaço — isso nunca é o código.

Sua tarefa: para CADA espaço da folha, identifique o código e responda se o NÚMERO GRANDE do código está visível e legível no fundo.

Responda SOMENTE com JSON puro (sem markdown, sem crases):
{"team":"Panamá","stickers":[{"code":"PAN1","bigNumberVisible":true},{"code":"PAN3","bigNumberVisible":false},{"code":"PAN6","bigNumberVisible":true}]}

- "bigNumberVisible": true se você consegue LER o número grande do código no fundo (espaço vazio). false se o número grande está coberto por uma figurinha de jogador (espaço preenchido).
- Liste todos os espaços que conseguir identificar pelo código, mesmo os preenchidos.
- Se não conseguir ler a folha: {"team":null,"stickers":[]}`;

  const text = await callGemini(prompt, base64Image, 2000);
  const parsed = extractJSON(text);
  if (!parsed) {
    window.__lastRaw = text;
    const preview = text.slice(0, 60).replace(/\n/g, ' ');
    throw new Error(`Não entendi a resposta: "${preview}…"`);
  }
  return parsed;
}

// ─── Helper compartilhado de chamada ao Gemini ───────────────
async function callGemini(prompt, base64Image, maxTokens) {
  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
        ]
      }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: maxTokens || 800,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 }
      }
    })
  });

  if (!resp.ok) {
    let detail = '';
    try { const e = await resp.json(); detail = e.error?.message || ''; } catch {}
    if (resp.status === 400 && /API key/i.test(detail)) throw new Error('Chave da API inválida. Verifique em ⚙️.');
    if (resp.status === 429) throw new Error('Limite de uso atingido. Espere um momento.');
    throw new Error(`Erro ${resp.status}. ${detail}`.trim());
  }

  const data = await resp.json();
  const cand = data?.candidates?.[0];
  const finish = cand?.finishReason;
  const text = cand?.content?.parts?.map(p => p.text || '').join('') || '';

  if (!text) {
    if (finish === 'MAX_TOKENS') throw new Error('IA cortou a resposta. Tente de novo.');
    if (finish === 'SAFETY' || data?.promptFeedback?.blockReason) throw new Error('Imagem bloqueada pela IA. Tente outra foto.');
    throw new Error('IA não retornou texto. Tente de novo.');
  }
  return text;
}

// Extrai o primeiro JSON (objeto ou array) de dentro de qualquer texto
function extractJSON(s) {
  s = s.replace(/```json|```/gi, '').trim();
  try { return JSON.parse(s); } catch {}
  const m = s.match(/[\{\[][\s\S]*[\}\]]/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
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

// ─── SETTINGS / KEY ──────────────────────────────────────────
function openSettings() {
  $('apiKeyInp').value = apiKey;
  $('settingsModal').classList.add('show');
}
function closeSettings() { $('settingsModal').classList.remove('show'); }
function saveKey() {
  const k = $('apiKeyInp').value.trim();
  apiKey = k;
  localStorage.setItem('fig_gemini_key', k);
  refreshKeyStatus();
  showToast(k ? '🔑 Chave salva!' : 'Chave removida');
  closeSettings();
}
function refreshKeyStatus() {
  const el = $('keyStatus');
  if (apiKey) {
    el.className = 'key-status ok';
    el.textContent = '✅ Chave salva. Scanner pronto pra usar.';
  } else {
    el.className = 'key-status no';
    el.textContent = '🔑 Nenhuma chave salva — o scanner não vai funcionar sem ela.';
  }
}

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

// Códigos válidos hardcoded por enquanto (MVP manual)
// Futuramente: validar contra backend
const VALID_CODES = new Set([
  'SCAN-TESTE', // reservado pra você testar
]);

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

function activateCode() {
  const raw = $('codeInp').value.trim().toUpperCase();
  const status = $('codeStatus');
  if (!raw) return;

  if (VALID_CODES.has(raw) || raw === localStorage.getItem('fig_code')) {
    isPremium = true;
    localStorage.setItem('fig_premium', '1');
    localStorage.setItem('fig_code', raw);
    status.className = 'code-status ok';
    status.textContent = '✅ Código válido! Premium ativado.';
    refreshPremiumUI();
    setTimeout(() => closePremiumModal(), 1400);
    showToast('🏆 Premium ativado!');
  } else {
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
  doc.text('scanini.netlify.app', margin, 25);

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
    doc.text(`Página ${i} de ${pages}  ·  scanini.netlify.app`, W / 2, 293, { align: 'center' });
  }

  doc.save(`figurinhas-faltando-${date.replace(/\//g,'-')}.pdf`);
  showToast('📄 PDF baixando…');
}

init();
refreshPremiumUI();
