// Serve a página do imóvel com título, descrição, Open Graph e JSON-LD
// injetados no HTML — assim Google e WhatsApp veem os dados do imóvel
// sem depender de JavaScript.
const SUPABASE_URL = 'https://vopmedyztnbrqckjoapd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_lFB48IAS9IVMJV6mNf0Cnw_HtyfDI4-';

let templateCache = null;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = async (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const base = `https://${host}`;

  if (!templateCache) {
    const t = await fetch(`${base}/_imovel.html`);
    if (!t.ok) { res.status(500).send('Erro ao carregar a página.'); return; }
    templateCache = await t.text();
  }

  let html = templateCache;
  const id = (req.query && req.query.id) || '';

  if (/^[0-9a-fA-F-]{36}$/.test(id)) {
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/imoveis?id=eq.${id}&ativo=eq.true&select=titulo,descricao,preco,finalidade,tipo,cidade,bairro,fotos,codigo`,
        { headers: { apikey: SUPABASE_KEY } }
      );
      const rows = await r.json();
      const im = Array.isArray(rows) ? rows[0] : null;

      if (im) {
        const local = [im.bairro, im.cidade].filter(Boolean).join(', ') || 'São Paulo e região';
        const preco = im.preco != null
          ? Number(im.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + (im.finalidade === 'Aluguel' ? '/mês' : '')
          : 'Consulte';
        const title = `${im.titulo} - ${im.cidade || 'SP'} | Reival Imóveis`;
        const desc = `${im.tipo} para ${im.finalidade === 'Aluguel' ? 'alugar' : 'comprar'} em ${local}: ${preco}. Código ${im.codigo}. Reival Imóveis, São Paulo e região.`;
        const img = (Array.isArray(im.fotos) && im.fotos[0]) || `${base}/assets/logo.png`;
        const url = `${base}/imovel?id=${id}`;

        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'RealEstateListing',
          name: im.titulo,
          url,
          image: img,
          description: (im.descricao || desc).slice(0, 500),
          offers: { '@type': 'Offer', price: im.preco || undefined, priceCurrency: 'BRL' },
        };

        const extra = [
          `<link rel="canonical" href="${esc(url)}">`,
          '<meta property="og:type" content="website">',
          '<meta property="og:site_name" content="Reival Imóveis">',
          '<meta property="og:locale" content="pt_BR">',
          `<meta property="og:title" content="${esc(title)}">`,
          `<meta property="og:description" content="${esc(desc)}">`,
          `<meta property="og:url" content="${esc(url)}">`,
          `<meta property="og:image" content="${esc(img)}">`,
          '<meta name="twitter:card" content="summary_large_image">',
          `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
        ].join('\n  ');

        html = html
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
          .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`)
          .replace('</head>', `  ${extra}\n</head>`);
      }
    } catch (e) {
      // Sem dados do imóvel, serve o template normal — o JS da página resolve.
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=1800');
  res.status(200).send(html);
};
