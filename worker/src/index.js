/**
 * Scanini Cloudflare Worker
 *
 * Endpoints:
 *   POST /api/scan        — chama Gemini com a imagem (requer premium)
 *   POST /api/activate    — ativa um código premium no KV
 *   POST /api/webhook-mp  — recebe webhook do Mercado Pago e gera código
 *   GET  /api/status      — retorna se deviceId é premium
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      let response;

      if (pathname === '/api/scan' && request.method === 'POST') {
        response = await handleScan(request, env);
      } else if (pathname === '/api/activate' && request.method === 'POST') {
        response = await handleActivate(request, env);
      } else if (pathname === '/api/webhook-mp' && request.method === 'POST') {
        response = await handleWebhookMP(request, env);
      } else if (pathname === '/api/status' && request.method === 'GET') {
        response = await handleStatus(request, env);
      } else {
        response = json({ error: 'Not found' }, 404);
      }

      Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
      return response;
    } catch (err) {
      console.error('Worker error:', err);
      const res = json({ error: 'Internal server error' }, 500);
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }
  },
};

// ─── POST /api/scan ─────────────────────────────────────────────────────────

async function handleScan(request, env) {
  const body = await request.json().catch(() => null);
  if (!body?.image || !body?.mode || !body?.deviceId) {
    return json({ error: 'Campos obrigatórios: image, mode, deviceId' }, 400);
  }

  const { image, mode, deviceId } = body;

  const premium = await isPremium(deviceId, env);
  if (!premium) {
    return json({ error: 'premium_required' }, 403);
  }

  if (mode !== 'single' && mode !== 'page') {
    return json({ error: 'mode deve ser "single" ou "page"' }, 400);
  }

  const prompt = mode === 'single' ? PROMPT_SINGLE : PROMPT_PAGE;
  const maxTokens = mode === 'single' ? 800 : 2000;

  let text;
  try {
    text = await callGemini(prompt, image, maxTokens, env.GEMINI_API_KEY);
  } catch (err) {
    console.error('Gemini error:', err.message);
    return json({ error: err.message || 'Erro ao chamar a IA' }, 502);
  }

  const parsed = extractJSON(text);
  if (!parsed) {
    return json({ error: 'IA retornou resposta inválida' }, 502);
  }

  return json(parsed);
}

// ─── POST /api/activate ─────────────────────────────────────────────────────

async function handleActivate(request, env) {
  const body = await request.json().catch(() => null);
  if (!body?.code || !body?.deviceId) {
    return json({ error: 'Campos obrigatórios: code, deviceId' }, 400);
  }

  const { code, deviceId } = body;
  const normalizedCode = code.trim().toUpperCase();

  const raw = await env.SCANINI_KV.get(`code:${normalizedCode}`);
  if (!raw) {
    return json({ error: 'Código inválido' }, 404);
  }

  const entry = JSON.parse(raw);

  entry.activated = true;
  entry.deviceId = deviceId;
  entry.activatedAt = new Date().toISOString();

  await env.SCANINI_KV.put(`code:${normalizedCode}`, JSON.stringify(entry));
  await env.SCANINI_KV.put(`device:${deviceId}`, normalizedCode);

  return json({ ok: true });
}

// ─── POST /api/webhook-mp ────────────────────────────────────────────────────

async function handleWebhookMP(request, env) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Body inválido' }, 400);

  // Validação básica de assinatura (header x-signature do MP)
  const signature = request.headers.get('x-signature') || '';
  const webhookId = request.headers.get('x-request-id') || '';

  if (env.MP_WEBHOOK_SECRET && !validateMPSignature(signature, webhookId, env.MP_WEBHOOK_SECRET)) {
    console.warn('Webhook MP: assinatura inválida', { signature, webhookId });
    // Em produção, descomente para rejeitar webhooks sem assinatura válida:
    // return json({ error: 'Assinatura inválida' }, 401);
  }

  const { type, data } = body;

  // Só processa pagamentos aprovados
  if (type !== 'payment') {
    return json({ ok: true, skipped: true });
  }

  const paymentId = data?.id;
  if (!paymentId) return json({ error: 'payment id ausente' }, 400);

  // Busca detalhes do pagamento no MP
  const payment = await fetchMPPayment(paymentId, env.MP_ACCESS_TOKEN);
  if (!payment) return json({ error: 'Erro ao buscar pagamento' }, 502);

  if (payment.status !== 'approved') {
    console.log(`Pagamento ${paymentId} com status ${payment.status}, ignorando`);
    return json({ ok: true, skipped: true });
  }

  // Gera código único
  const prefix = env.CODE_PREFIX || 'SCAN';
  const code = generateCode(prefix);

  const entry = {
    paymentId: String(paymentId),
    payerEmail: payment.payer?.email || null,
    generatedAt: new Date().toISOString(),
    activated: false,
    deviceId: null,
  };

  await env.SCANINI_KV.put(`code:${code}`, JSON.stringify(entry));

  console.log(`Código gerado: ${code} para pagamento ${paymentId} (${entry.payerEmail})`);

  return json({ ok: true, code });
}

// ─── GET /api/status ─────────────────────────────────────────────────────────

async function handleStatus(request, env) {
  const url = new URL(request.url);
  const deviceId = url.searchParams.get('deviceId');

  if (!deviceId) {
    return json({ error: 'deviceId obrigatório' }, 400);
  }

  const premium = await isPremium(deviceId, env);
  return json({ premium });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function isPremium(deviceId, env) {
  const code = await env.SCANINI_KV.get(`device:${deviceId}`);
  return code !== null;
}

async function callGemini(prompt, base64Image, maxTokens, apiKey) {
  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'image/jpeg', data: base64Image } },
        ],
      }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: maxTokens,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!resp.ok) {
    let detail = '';
    try { const e = await resp.json(); detail = e.error?.message || ''; } catch {}
    throw new Error(`Gemini ${resp.status}: ${detail}`);
  }

  const data = await resp.json();
  const cand = data?.candidates?.[0];
  const finish = cand?.finishReason;
  const text = cand?.content?.parts?.map(p => p.text || '').join('') || '';

  if (!text) {
    if (finish === 'MAX_TOKENS') throw new Error('IA cortou a resposta');
    if (finish === 'SAFETY') throw new Error('Imagem bloqueada pela IA');
    throw new Error('IA não retornou texto');
  }

  return text;
}

async function fetchMPPayment(paymentId, accessToken) {
  try {
    const resp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) return null;
    return resp.json();
  } catch {
    return null;
  }
}

function validateMPSignature(signature, requestId, secret) {
  // O MP envia: x-signature: ts=<timestamp>,v1=<hmac>
  // Validação completa requer Web Crypto — implementação simplificada por ora
  return signature.length > 0;
}

function generateCode(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  for (const byte of array) {
    suffix += chars[byte % chars.length];
  }
  return `${prefix}-${suffix.slice(0, 3)}${suffix.slice(3)}`;
}

function extractJSON(s) {
  s = s.replace(/```json|```/gi, '').trim();
  try { return JSON.parse(s); } catch {}
  const m = s.match(/[{[][\s\S]*[}\]]/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ─── Prompts Gemini ───────────────────────────────────────────────────────────

const PROMPT_SINGLE = `Você está vendo a foto de UMA figurinha do álbum Panini da Copa do Mundo 2026.

Cada figurinha tem um código no formato PREFIXO + NÚMERO, por exemplo: PAN3, BRA15, ARG1, MEX20.
O prefixo são 3 letras maiúsculas identificando a seleção (PAN=Panamá, BRA=Brasil, ARG=Argentina, MEX=México, USA=EUA, FRA=França, ENG=Inglaterra, ESP=Espanha, POR=Portugal, GER=Alemanha, etc).

IMPORTANTE: ignore o número grande decorativo "2026" ou "26" que aparece no FUNDO de toda figurinha — isso NÃO é o código. O código verdadeiro fica em texto menor, geralmente perto do nome do jogador ou no canto.

Se o código não estiver legível mas você reconhecer o jogador e a seleção, deduza o prefixo da seleção e informe o nome do jogador.

Responda SOMENTE com JSON puro, sem markdown, sem crases, neste formato exato:
{"code":"PAN3","player":"Fidel Escobar","team":"Panamá","confidence":"high"}

- "code": o código no formato PREFIXO+NÚMERO em maiúsculas, ou null se impossível
- "confidence": "high", "medium" ou "low"
- Se não for uma figurinha: {"code":null,"player":null,"team":null,"confidence":"none"}`;

const PROMPT_PAGE = `Você está vendo a foto de UMA FOLHA do álbum Panini da Copa do Mundo 2026.
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
