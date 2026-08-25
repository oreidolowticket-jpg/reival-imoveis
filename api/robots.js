// robots.txt dinâmico — o domínio do sitemap acompanha o host atual.
module.exports = async (req, res) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const txt = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /back/',
    'Disallow: /api/',
    'Disallow: /_imovel',
    '',
    `Sitemap: https://${host}/sitemap.xml`,
    '',
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400');
  res.status(200).send(txt);
};
