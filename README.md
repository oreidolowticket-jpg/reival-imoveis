# CaçapavaImóveis

Site institucional + painel administrativo da CaçapavaImóveis.

## Estrutura

- `index.html` — landing page pública com busca e listagem de imóveis
- `back/admin.html` — painel administrativo (login obrigatório)
- `assets/js/config.js` — configurações do site (WhatsApp, e-mail, chaves do Supabase)
- `assets/js/main.js` — lógica da landing page
- `assets/js/admin.js` — lógica do painel admin
- `assets/css/style.css` — estilos (identidade visual centralizada nas variáveis CSS no topo)

## Stack

- **Front-end:** HTML/CSS/JS puro (sem build)
- **Banco de dados e fotos:** Supabase (tabela `imoveis` + bucket `fotos`)
- **Hospedagem:** Vercel (deploy automático a cada push na branch `main`)

## Como editar contatos

Edite `assets/js/config.js` e altere `WHATSAPP`, `TELEFONE_EXIBICAO` e `EMAIL_CONTATO`.

## Como trocar as cores

Edite as variáveis no topo de `assets/css/style.css` (e o bloco `:root` em `back/admin.html`).

## Painel admin

Acesse `/back/admin.html`. O acesso é restrito ao usuário administrador cadastrado no Supabase Auth; escrita no banco e no bucket de fotos é protegida por RLS.
