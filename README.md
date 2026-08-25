# Reival Imóveis

Site institucional + painel administrativo da Reival Imóveis — imóveis em São Paulo e região.

## Estrutura

- `index.html` — landing page pública com busca, banners e listagem de imóveis
- `imovel.html` — página de detalhes do imóvel (galeria, descrição, contato)
- `back/admin.html` — painel administrativo (login obrigatório)
- `assets/js/config.js` — configurações do site (WhatsApp, e-mail, chaves do Supabase)
- `assets/js/main.js` — lógica da landing page
- `assets/js/imovel.js` — lógica da página de detalhes
- `assets/js/admin.js` — lógica do painel admin
- `assets/css/style.css` — estilos (identidade visual centralizada nas variáveis CSS no topo)

## Stack

- **Front-end:** HTML/CSS/JS puro (sem build)
- **Banco de dados e fotos:** Supabase (tabelas `imoveis` e `banners` + bucket `fotos`)
- **Hospedagem:** Vercel (deploy automático a cada push na branch `main`)

## Como editar contatos

Edite `assets/js/config.js` e altere `WHATSAPP`, `TELEFONE_EXIBICAO` e `EMAIL_CONTATO`.

## Como trocar as cores

Edite as variáveis no topo de `assets/css/style.css` (e o bloco `:root` em `back/admin.html`).

## Painel admin

Acesse `/back/admin.html`. O acesso é restrito ao usuário administrador cadastrado no Supabase Auth; escrita no banco e no bucket de fotos é protegida por RLS.
