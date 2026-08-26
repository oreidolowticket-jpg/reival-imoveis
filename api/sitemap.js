// Gera o sitemap.xml dinamicamente com todos os imóveis ativos.
const SUPABASE_URL = 'https://vopmedyztnbrqckjoapd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_lFB48IAS9IVMJV6mNf0Cnw_HtyfDI4-';

module.exports = async (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const base = `https://${host}`;

  const urls = [
    { loc: `${base}/`, lastmod: null, priority: '1.0' },
    { loc: `${base}/imoveis`, lastmod: null, priority: '0.9' },
    { loc: `${base}/corretor`, lastmod: null, priority: '0.6' },
  ];

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/imoveis?ativo=eq.true&select=id,atualizado_em&order=criado_em.desc&limit=2000`,
      { headers: { apikey: SUPABASE_KEY } }
    );
    const rows = await r.json();
    if (Array.isArray(rows)) {
      for (const im of rows) {
        urls.push({
          loc: `${base}/imovel?id=${im.id}`,
          lastmod: im.atualizado_em ? String(im.atualizado_em).slice(0, 10) : null,
          priority: '0.8',
        });
      }
    }
  } catch (e) { /* sitemap sai só com a home */ }

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/cidades?ativo=eq.true&select=nome`,
      { headers: { apikey: SUPABASE_KEY } }
    );
    const rows = await r.json();
    if (Array.isArray(rows)) {
      for (const c of rows) {
        urls.push({ loc: `${base}/cidade?c=${encodeURIComponent(c.nome)}`, lastmod: null, priority: '0.7' });
      }
    }
  } catch (e) { /* segue sem as cidades */ }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) =>
      `  <url><loc>${u.loc.replace(/&/g, '&amp;')}</loc>` +
      (u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : '') +
      `<priority>${u.priority}</priority></url>`
    ).join('\n') +
    `\n</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
};
