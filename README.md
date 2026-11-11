# Up Concept Beauty — site (prévia)

Site one-page do salão **Up Concept Beauty** (BR 020, Taquari — Brasília/DF): cabelo, maquiagem e unhas, com agendamento pelo WhatsApp.

HTML + CSS + JavaScript puro, **sem etapa de build**. Animações com GSAP + ScrollTrigger via CDN (cdnjs).

---

## Como abrir

**Opção 1: direto no navegador.** Dê dois cliques no `index.html`. Funciona, mas o mapa e alguns recursos ficam melhores servidos por HTTP.

**Opção 2: servidor local (recomendado).** Na pasta do projeto:

```bash
python -m http.server 5500
```

Depois abra http://localhost:5500.

**Publicar:** envie a pasta inteira para qualquer hospedagem estática (Netlify, Vercel, GitHub Pages, Hostinger etc.). Não há nada para compilar.

---

## Estrutura

```
index.html            página inteira (8 seções + rodapé)
assets/css/style.css  estilos (variáveis de cor, fonte e espaçamento no topo)
assets/js/main.js     interações, animações, WhatsApp e rastreamento
assets/img/           imagens (todas placeholders, exceto logo-referencia.png)
assets/video/         coloque aqui o hero.mp4
```

---

## Onde trocar cada coisa

| O quê | Onde |
|---|---|
| **Cores** | `assets/css/style.css`, bloco `:root` no topo (`--off-white`, `--nude`, `--rose`, `--rose-gold`, `--bronze`, `--cafe`, `--cafe-claro`). `--cafe-claro-forte` e `--bronze-texto` são versões mais escuras usadas em textos pequenos para manter o contraste acessível. |
| **Fontes** | Link do Google Fonts no `<head>` do `index.html` + variáveis `--font-display` e `--font-body` no `:root`. |
| **Logo** | O monograma "UP" foi redesenhado em SVG a partir de `assets/img/logo-referencia.png`. Ele fica no `<symbol id="up-mark">`, logo no início do `<body>`, e é usado no header e no rodapé. Na hero, os mesmos `<path>` aparecem dentro de `<svg class="hero-mask">`. Se receber o logo oficial em SVG, troque os `<path>` nesses dois lugares. |
| **Vídeo da hero** | Salve como `assets/video/hero.mp4` (ideal: 1920×1080, 10–20 s, H.264, sem áudio, até ~4 MB). Troque também o poster `assets/img/hero-poster.webp`. Sem o vídeo, aparece automaticamente um gradiente rose gold animado. |
| **Fotos** | Substitua os arquivos em `assets/img/` mantendo os nomes, ou troque o `src` no HTML. Ajuste `width`/`height` para a proporção real da foto e prefira WebP. Pares de antes/depois: `antes-N.webp` / `depois-N.webp` e a lista `PARES_ANTES_DEPOIS` em `main.js`. |
| **WhatsApp** | `main.js` → `CONFIG.whatsapp` e `CONFIG.mensagemPadrao`. Todos os links passam pela função `whatsappLink()`. |
| **Serviços e preços** | Seção `#servicos` no `index.html`. Cada card tem `data-servico="Nome"`, que gera a mensagem do WhatsApp sozinho. |
| **Dias de atendimento** (calendário do formulário) | `main.js` → `AGENDA.diasFechados` (0 = domingo … 6 = sábado). |
| **GTM / Meta Pixel** | Snippets comentados no `<head>`. Descomente e troque `GTM-[PLACEHOLDER]` e `[PLACEHOLDER: ID do Pixel]`. |
| **SEO** | `<title>`, `meta description`, Open Graph (`og:image` = `assets/img/og-image.webp`, 1200×630), `canonical` e o JSON-LD `BeautySalon` no `<head>`. Atualize o domínio `www.upconceptbeauty.com.br` se for outro. |

---

## Rastreamento

A função `track(evento, dados)` em `main.js` envia para `window.dataLayer` (GTM/GA4) e, se existir, para `fbq` (Meta Pixel). Não quebra se nenhum dos dois estiver instalado.

| Evento | Quando | Dados |
|---|---|---|
| `whatsapp_click` | qualquer botão de WhatsApp (Pixel: `Contact`) | `origem` (header, hero, servico, contato, rodape, flutuante, formulario), `categoria`, `servico` |
| `painel_hero_click` | botão de um painel Hair/Make/Nail | `categoria` |
| `servicos_aba` | troca de aba em Serviços | `categoria` |
| `antes_depois_uso` | primeira interação com cada par do slider | `par` |
| `galeria_filtro` | filtro da galeria | `filtro` |
| `form_etapa` | avanço/volta no formulário | `etapa` |
| `form_submit` | envio do formulário (Pixel: `Schedule`) | `servicos`, `periodo` |
| `google_review_click` | botão "Avalie a gente no Google" | — |

---

## Lista completa de placeholders

Todos estão marcados no código como `[PLACEHOLDER: ...]` e/ou com o atributo `data-placeholder`. Para encontrar:

```bash
grep -n "PLACEHOLDER" index.html assets/js/main.js
```

**Informações do salão**
- Horário de funcionamento: seção Contato e `openingHours` no JSON-LD (formato `Mo-Fr 09:00-19:00`)
- Dias em que o salão fecha: `AGENDA.diasFechados` em `main.js` (hoje: domingo)
- CNPJ: rodapé
- Link da política de privacidade: rodapé
- Link de avaliação do Google: botão "Avalie a gente no Google" (seção Depoimentos)
- Domínio definitivo: `canonical`, `og:url`, `og:image` e JSON-LD

**Serviços**
- Lista de serviços, descrições, durações e preços (14 cards; todos os preços estão como `[PLACEHOLDER]`). **Validar tudo com o salão.**

**Mídia**
- Vídeo da hero (`assets/video/hero.mp4`) e poster (`hero-poster.webp`)
- Fotos dos painéis Hair, Make e Nail (`panel-*.webp`)
- 3 pares de antes/depois (`antes-1..3`, `depois-1..3`): hoje são **ilustrações de exemplo** (morena iluminada, alinhamento, unhas em gel), marcadas "Exemplo ilustrativo". Troque por fotos reais de clientes, com autorização, e ajuste os títulos em `PARES_ANTES_DEPOIS` (`main.js`)
- 9 fotos da galeria (`galeria-hair/make/nail-1..3.webp`) + textos alternativos
- 2 fotos do espaço (`espaco-1/2.webp`)
- Imagem de compartilhamento (`og-image.webp`)
- Logo oficial em vetor (hoje recriado a partir de `logo-referencia.png`)

**Pessoas e textos**
- Equipe: 3 fotos, nomes, especialidades e @ do Instagram
- Parágrafo sobre a história do salão ou da fundadora (seção O Espaço)
- Depoimentos: 4 cards com **"[PLACEHOLDER: depoimento de cliente real]"** e **"Cliente Exemplo"**. Substitua só por depoimentos reais, com autorização das clientes.

**Rastreamento**
- ID do Google Tag Manager
- ID do Meta Pixel

---

## Acessibilidade, desempenho e movimento

- Navegação completa por teclado: menu, abas (setas, Home, End), slider de antes/depois (setas, Shift+setas, Home, End), galeria e lightbox (Esc, setas) e formulário.
- Foco visível rose gold. Contraste AA nos textos.
- `prefers-reduced-motion`: sem pin nem zoom. A hero mostra o título direto e os painéis ficam estáticos abaixo.
- O vídeo e as animações da hero pausam quando ela sai da tela. Com o vídeo carregado, o fallback animado deixa de ser desenhado.
- O header só usa blur depois da hero, porque o blur custa caro a cada quadro.
- No celular (< 768px), os cards de serviço e a galeria viram faixas com swipe e indicadores, para reduzir a rolagem vertical.
- Lighthouse (mobile, servidor local): Performance 85–87, Acessibilidade 100, Boas práticas 96 (só pelo 404 do vídeo que ainda não existe), SEO 100.
