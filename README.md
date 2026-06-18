# Logistic Oversite

Protótipo web para controle logístico de pedidos, chamados operacionais, anexos, histórico, relatórios e comprovante de entrega.

## Como rodar localmente

Este projeto ainda não usa build system. Ele roda como arquivos estáticos e carrega React/Babel por CDN.

No diretório do projeto, suba um servidor estático:

```powershell
python -m http.server 5173
```

Depois abra:

```text
http://localhost:5173/
```

## Login demo

Use qualquer usuário listado na tela de login.

Senha demo:

```text
1234
```

## Dados

Os dados são salvos no navegador via `localStorage`.

Chaves usadas:

```text
eixo.orders.v1
eixo.chamados.v1
eixo.user.v1
```

Limpar os dados do site no navegador faz o app voltar para os dados de exemplo.

## Estrutura

- `index.html`: página principal, estilos e scripts.
- `app.jsx`: orquestração da aplicação.
- `seed.js`: dados de exemplo e helpers de pedidos.
- `chamados.js`: dados de exemplo e helpers de chamados.
- `auth.js`: usuários demo e permissões.
- `pedidos.jsx`: telas e componentes de pedidos.
- `chamados.jsx`: telas e componentes de chamados/GLPI.
- `attachments.jsx`: anexos e visualização.
- `comprovante.jsx`: comprovante de entrega e assinatura.
- `relatorios.jsx`: KPIs, relatórios e exportação CSV.
- `activity.jsx`: histórico geral.
- `components.jsx`: componentes visuais compartilhados.
- `history.js`: eventos e linha do tempo.
- `tweaks-panel.jsx`: painel de ajustes visuais.

## Limitações atuais

- Autenticação apenas demonstrativa, feita no cliente.
- Persistência apenas em `localStorage`, sem backend.
- Integração GLPI simulada.
- Dependência de CDN para React, ReactDOM, Babel e html2canvas.
- JSX é compilado no navegador, adequado para demo, não para produção.

## Próximos passos recomendados

- Converter para Vite.
- Adicionar `package.json` com scripts de desenvolvimento e build.
- Empacotar dependências localmente.
- Criar backup/importação dos dados do `localStorage`.
- Publicar via GitHub Pages, Cloudflare Pages, Netlify ou Vercel.
