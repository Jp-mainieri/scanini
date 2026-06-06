# BRIEFING — Projeto Scanini
> Cole este documento no início de uma sessão do Claude Code para ele entender o projeto completo.

---

## O que é

**Scanini** é um PWA (Progressive Web App) que ajuda colecionadores do álbum Panini da Copa do Mundo 2026 a:
1. Escanear figurinhas pela câmera usando IA (Google Gemini Vision)
2. Controlar quais têm e quais faltam
3. Exportar a lista de faltantes pro WhatsApp
4. Gerar um PDF compacto pra levar na banca de troca (feature premium)

**Público-alvo:** crianças que colam figurinha + pais que pagam.
**Modelo de negócio:** pagamento único de R$9,90 libera scanner ilimitado + PDF. Versão grátis tem marcação manual + WhatsApp.

---

## Estado atual do projeto

O MVP está **funcionando e hospedado** em `scanini.netlify.app` (Netlify temporário, vamos migrar pro Cloudflare).

### Arquivos existentes (pasta local já criada)

```
/app
  index.html      — interface PWA completa (tabs: Scanner, Álbum, Lista)
  app.js          — toda a lógica: câmera, Gemini, álbum, WhatsApp, PDF, premium
  album-data.js   — estrutura das 49 seções / 968 figurinhas do álbum Panini 2026
  manifest.json   — configuração PWA (instalável no celular)
  sw.js           — service worker (funciona offline)
  icon-192.png    — ícone do app
  icon-512.png    — ícone do app
```

### O problema central a resolver

**Hoje a chave da API Gemini fica no aparelho do usuário** — ele precisa criar uma conta no Google AI Studio e colar a chave manualmente no app. Isso é inviável pro público-alvo (crianças/pais não técnicos).

**A solução:** mover a chamada ao Gemini pra um backend (Cloudflare Worker) que guarda a chave em segredo. O app passa a chamar o Worker, não o Gemini diretamente. O usuário nunca vê chave nenhuma.

---

## Arquitetura alvo (tudo Cloudflare)

```
GitHub repo (monorepo)
├── /app          → PWA estático
└── /worker       → Cloudflare Worker (API backend)

Cloudflare Pages  → serve /app com HTTPS automático (deploy via GitHub push)
Cloudflare Worker → backend que:
                    1. Guarda a chave Gemini em secret (nunca exposta)
                    2. Valida se o código premium é válido (via KV)
                    3. Faz a chamada ao Gemini e devolve o resultado
Cloudflare KV     → banco chave-valor que guarda:
                    - códigos premium gerados (key: código, value: {usado, aparelho})
Mercado Pago      → processa pagamento de R$9,90 (webhook confirma → Worker gera código)
```

---

## Fluxo do scanner (após migração)

```
[Celular do usuário]
  app.js captura foto → converte pra base64
  → POST /api/scan  (Worker)
      Worker verifica: tem código premium válido? (KV)
      Se sim: chama Gemini com a chave secreta
              devolve { code, player, confidence }
      Se não: devolve { error: 'premium_required' }
  → app.js recebe resultado e atualiza o álbum
```

---

## Fluxo premium (código de ativação)

```
Pai acessa página de compra → paga R$9,90 via Mercado Pago
→ Webhook do MP chama Worker /api/webhook-mp
→ Worker gera código único (ex: SCAN-7X9K2)
→ Worker salva código no KV: { gerado: timestamp, ativado: false }
→ Worker envia código pro pai (por ora: e-mail simples ou manualmente)

Filho digita código no app
→ POST /api/activate { code: 'SCAN-7X9K2', deviceId: 'abc123' }
→ Worker verifica no KV se código existe e não foi ativado em outro aparelho
→ Marca como ativado, salva deviceId
→ Devolve { ok: true }
→ app.js salva isPremium=true no localStorage
```

**Regra de negócio do código:**
- Um código = um álbum = um aparelho principal
- Sem bloqueio de repasse (se o pai compartilhar, é escolha dele)
- Se limpar dados do navegador → digita o código de novo (continua válido no KV)

---

## O que o app.js faz hoje (resumo das principais funções)

| Função | O que faz |
|---|---|
| `startCamera()` | Abre câmera do dispositivo |
| `capture()` | Tira foto e chama Gemini (hoje direto, vai virar chamada ao Worker) |
| `analyzeWithGemini(b64)` | Prompt pra figurinha única → retorna `{code, player, confidence}` |
| `analyzePageWithGemini(b64)` | Prompt pra página inteira → retorna `{team, stickers:[{code, bigNumberVisible}]}` |
| `callGemini(prompt, b64, maxTokens)` | Helper compartilhado que faz o fetch ao Gemini |
| `handleResult(r)` | Processa resultado de figurinha única conforme o modo (tenho/falta) |
| `handlePageResult(r)` | Processa resultado de página: `bigNumberVisible=true` → não tenho |
| `setMode(mode)` | Alterna entre modos: `have`, `missing`, `page` |
| `generatePDF()` | Gera PDF com figurinhas faltantes usando jsPDF (só premium) |
| `activateCode()` | Valida código premium (hoje hardcoded, vai virar chamada ao Worker) |
| `refreshPremiumUI()` | Mostra/esconde botão PDF conforme `isPremium` |
| `buildMessage()` | Monta mensagem WhatsApp com figurinhas faltantes |
| `renderAlbum()` | Renderiza grade do álbum por seleção |
| `updateStats()` | Atualiza contadores e barra de progresso |

---

## Lógica do álbum (importante)

- **968 figurinhas** em 49 seções (48 times + especiais)
- Cada time tem 20 figurinhas: código 1 = logo, código 13 = foto do time, demais = jogadores
- Formato dos códigos: `PREFIXO + NÚMERO` sem separador (ex: `PAN3`, `BRA15`, `MEX20`)
- Dados em `album-data.js`: array `ALBUM` com `{prefix, name, flag, stickers[]}`
- Estado salvo no `localStorage` como `fig_owned` (Set serializado como array JSON)

---

## Modos do scanner

| Modo | Botão | Comportamento |
|---|---|---|
| `have` | ✅ Tenho | Escaneia figurinha na mão → marca como TENHO |
| `missing` | 🔍 Falta | Escaneia espaço vazio do álbum → marca como NÃO TENHO |
| `page` | 📄 Página | Fotografa folha inteira → `bigNumberVisible=true` = não tenho, `false` = tenho |

**Detalhe crítico do modo Página:** no álbum Panini 2026, o número grande (ex: "PAN 3") aparece no fundo do espaço APENAS quando ele está vazio (figurinha faltando). Quando a figurinha está colada, cobre o número. Então a IA lê: "número grande visível?" = não tenho.

---

## Próximos passos em ordem

### 1. Criar repositório GitHub + estrutura monorepo
```
scanini/
├── app/          (copiar arquivos atuais do PWA)
├── worker/       (criar do zero)
│   ├── src/index.js
│   └── wrangler.toml
├── .github/
│   └── workflows/deploy.yml  (opcional, Cloudflare Pages faz auto)
└── README.md
```

### 2. Criar Cloudflare Worker (`/worker`)
Endpoints necessários:
- `POST /api/scan` — recebe `{image: base64, mode: 'single'|'page', deviceId}`, valida premium no KV, chama Gemini, devolve resultado
- `POST /api/activate` — recebe `{code, deviceId}`, valida no KV, ativa
- `POST /api/webhook-mp` — recebe webhook do Mercado Pago, gera código, salva no KV
- `GET /api/status` — recebe `{deviceId}`, devolve se é premium (pra sincronizar ao abrir o app)

### 3. Migrar app.js: trocar chamadas diretas ao Gemini por chamadas ao Worker
- Remover `callGemini()`, `analyzeWithGemini()`, `analyzePageWithGemini()`
- Substituir por `callWorker('/api/scan', {image, mode, deviceId})`
- Remover campo de API key das configurações (⚙️ fica só com reset)
- Adicionar geração de `deviceId` único no primeiro acesso (salvo no localStorage)

### 4. Migrar Cloudflare Pages (substituir Netlify)
- Conectar repo GitHub ao Cloudflare Pages
- Build: nenhum (arquivos estáticos)
- Publish directory: `app/`
- Domínio: configurar `scanini.app` se quiser (ou usar `scanini.pages.dev` grátis)

### 5. Integrar Mercado Pago
- Criar conta MP e gerar credenciais
- Criar página de checkout simples (pode ser uma rota do Worker que redireciona pro MP)
- Configurar webhook pra `POST /api/webhook-mp`
- Worker gera código e por ora loga no console (depois envia e-mail via Resend/SendGrid)

### 6. Envio do código por e-mail (opcional no MVP)
- Usar **Resend** (grátis até 3k emails/mês) pra mandar o código pro pai
- Ou começar manual: MP notifica você, você manda o código no WhatsApp

---

## Variáveis de ambiente do Worker (Cloudflare Secrets)

```
GEMINI_API_KEY      — sua chave do Google AI Studio
MP_ACCESS_TOKEN     — token do Mercado Pago (produção)
MP_WEBHOOK_SECRET   — secret pra validar webhooks do MP
CODE_PREFIX         — prefixo dos códigos gerados (ex: "SCAN")
```

---

## Decisões tomadas (não questionar, só implementar)

- **Pagamento único R$9,90** — libera tudo vitalício, sem assinatura
- **Código de ativação** sem login — o pai digita o código no app do filho
- **Sem bloqueio de repasse** do código — uma conta = um álbum, se compartilhar tudo bem
- **Sem limite de scans** pra premium — a API é barata demais pra valer a pena limitar
- **PDF gerado no browser** com jsPDF — só os códigos faltantes, agrupados por seleção
- **Cloudflare tudo** — Pages (frontend) + Workers (backend) + KV (banco)
- **Gemini 2.5 Flash** como modelo — `thinkingBudget: 0`, `temperature: 0`, `maxOutputTokens: 800` (scan único) ou `2000` (página)

---

## Contexto de produto

- Álbum Panini Copa 2026: 968 figurinhas, 49 seções, lançado em abril 2026
- Torneio vai até julho 2026 — janela de mercado de ~3 meses
- Concorrente direto: scanini.app (existe, mas é mais complexo)
- Diferencial: mais simples, em português, com modo página (foto a folha inteira)
- Risco jurídico: uso de IP da Panini/FIFA — manter tom de "ferramenta de organização pessoal", sem usar logos ou marcas nos materiais de venda

---

## Comandos úteis pra começar

```bash
# Instalar Wrangler (CLI do Cloudflare)
npm install -g wrangler

# Autenticar no Cloudflare
wrangler login

# Criar Worker
cd worker && wrangler init

# Criar namespace KV
wrangler kv:namespace create "SCANINI_KV"

# Adicionar secret
wrangler secret put GEMINI_API_KEY

# Testar Worker localmente
wrangler dev

# Deploy do Worker
wrangler deploy

# Ver logs em tempo real
wrangler tail
```
