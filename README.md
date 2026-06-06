# Scanini

PWA para colecionadores do álbum Panini Copa 2026 — escaneia figurinhas com IA, controla o que tem e o que falta.

## Estrutura

```
scanini/
├── app/        PWA estático (Cloudflare Pages)
└── worker/     Backend (Cloudflare Worker + KV)
```

## Worker — primeiros passos

```bash
cd worker
npm install

# Autenticar no Cloudflare
npx wrangler login

# Criar namespace KV
npx wrangler kv:namespace create "SCANINI_KV"
# Copie os IDs gerados para wrangler.toml

# Configurar secrets
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put MP_ACCESS_TOKEN
npx wrangler secret put MP_WEBHOOK_SECRET

# Testar localmente
npx wrangler dev

# Deploy
npx wrangler deploy
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/scan` | Escaneia figurinha via Gemini (requer premium) |
| POST | `/api/activate` | Ativa código premium no dispositivo |
| POST | `/api/webhook-mp` | Webhook do Mercado Pago — gera código |
| GET | `/api/status?deviceId=` | Verifica se dispositivo é premium |
