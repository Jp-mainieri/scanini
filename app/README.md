# 🏆 Scanner de Figurinhas — Copa 2026

App (PWA) que lê figurinhas do álbum Panini pela câmera usando IA (Google Gemini),
controla o que falta e gera a lista pra mandar no WhatsApp. Funciona 100% no navegador,
sem backend e sem custo de servidor.

## 📲 Como instalar no celular

1. Hospede a pasta (veja abaixo) **ou** abra o `index.html` por um servidor local.
2. Abra a URL no **Chrome do celular**.
3. Toque no menu (⋮) → **"Adicionar à tela inicial"** / **"Instalar app"**.
4. Pronto — abre como app, em tela cheia, com ícone próprio.

> O scanner por câmera só funciona em **HTTPS** ou em **localhost** (exigência do navegador).

## 🔑 Configurar a chave do Gemini (1 vez só)

1. Pegue uma chave grátis em: https://aistudio.google.com/apikey (sem cartão de crédito)
2. No app, toque em ⚙️ → cole a chave → **Salvar**.
3. A chave fica salva **só no seu aparelho** (localStorage). Nunca sai do seu celular,
   exceto nas chamadas diretas ao Google na hora de ler a figurinha.

Free tier do Gemini: ~1.500 leituras por dia. Mais que suficiente pra uso pessoal.

## 🚀 Como hospedar (grátis)

A forma mais fácil pelo celular:
- Acesse **app.netlify.com/drop**
- Compacte esta pasta em `.zip` e arraste/selecione → vira um site com HTTPS na hora.

Outras opções: GitHub Pages, Cloudflare Pages, Vercel — todas gratuitas para arquivos estáticos.

## 🧩 Como funciona

- **📷 Scanner:** câmera + Gemini Vision lê o código (ex: PAN3) ignorando o "2026" decorativo do fundo.
- **📖 Álbum:** grade de todas as 49 seções; toque numa figurinha pra marcar/desmarcar manualmente.
- **💬 Lista:** mensagem formatada com tudo que falta, pronta pra abrir direto no WhatsApp.
- Tudo salvo automaticamente no aparelho. Funciona offline (menos a leitura por IA, que precisa de internet).

## ⚠️ Notas honestas

- A lista de seleções/prefixos segue o padrão Panini (3 letras + número). Alguns times de
  repescagem podem ter prefixo diferente no álbum oficial — ajuste em `album-data.js` se precisar.
- O total aqui é 968 figurinhas (o álbum oficial tem 980, incluindo algumas exclusivas
  fora dos pacotes). Dá pra completar a estrutura conforme for conferindo o seu álbum.
- A leitura por IA acerta muito bem com boa luz e a figurinha enquadrada. Em caso de erro,
  use o "Adicionar manualmente" ou a aba Álbum.

## 📁 Arquivos

| Arquivo | O quê |
|---|---|
| `index.html` | Interface |
| `app.js` | Lógica (câmera, Gemini, álbum, WhatsApp) |
| `album-data.js` | Estrutura das 49 seções / 968 figurinhas |
| `manifest.json` + `sw.js` | Configuração de PWA (instalável/offline) |
| `icon-192.png` / `icon-512.png` | Ícones do app |
