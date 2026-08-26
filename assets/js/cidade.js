// ============================================================
// Reival Imóveis — Página de imóveis por cidade (?c=Nome)
// ============================================================
const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tituloImovel = (i) => i.titulo || [i.tipo || 'Imóvel', i.cidade ? `em ${i.cidade}` : ''].filter(Boolean).join(' ');
const fmtPreco = (valor, finalidade) => {
  if (valor == null) return 'Consulte';
  const preco = Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
  return finalidade === 'Aluguel' ? `${preco}/mês` : preco;
};
const zapLink = (msg) => `https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(msg)}`;

const ICONES = {
  cama: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M2 17h20"/><path d="M6 10V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/></svg>',
  banho: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12h16a1 1 0 0 1 1 1 7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7 1 1 0 0 1 1-1z"/><path d="M6 12V5a2 2 0 0 1 2-2h1"/></svg>',
  carro: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14l-1.5-5.5a2 2 0 0 0-1.9-1.5H8.4a2 2 0 0 0-1.9 1.5L5 17z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>',
  area: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h18"/></svg>',
  casa: '<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/></svg>',
};

function cardImovel(imovel) {
  const fotos = Array.isArray(imovel.fotos) ? imovel.fotos : [];
  const foto = fotos.length
    ? `<img src="${esc(fotos[0])}" alt="${esc(tituloImovel(imovel))}" loading="lazy">`
    : `<div class="sem-foto">${ICONES.casa}</div>`;

  const atributos = [];
  if (imovel.quartos) atributos.push(`<span>${ICONES.cama} ${imovel.quartos} quarto${imovel.quartos > 1 ? 's' : ''}</span>`);
  if (imovel.banheiros) atributos.push(`<span>${ICONES.banho} ${imovel.banheiros} banheiro${imovel.banheiros > 1 ? 's' : ''}</span>`);
  if (imovel.vagas) atributos.push(`<span>${ICONES.carro} ${imovel.vagas} vaga${imovel.vagas > 1 ? 's' : ''}</span>`);
  if (imovel.area) atributos.push(`<span>${ICONES.area} ${Number(imovel.area).toLocaleString('pt-BR')} m²</span>`);

  return `
    <a class="card-imovel" href="imovel?id=${imovel.id}" target="_blank" rel="noopener">
      <div class="card-foto">
        <div class="card-badges">
          <span class="badge ${imovel.finalidade === 'Aluguel' ? 'aluguel' : ''}">${esc(imovel.finalidade)}</span>
          ${imovel.aceita_financiamento ? '<span class="badge financia">Financia</span>' : ''}
        </div>
        ${foto}
      </div>
      <div class="card-corpo">
        <span class="tipo-bairro">${esc(imovel.tipo)}</span>
        <h3>${esc(tituloImovel(imovel))}</h3>
        <span class="codigo">Código: ${imovel.codigo}</span>
        ${atributos.length ? `<div class="card-atributos">${atributos.join('')}</div>` : '<div class="card-atributos"><span>Consulte detalhes</span></div>'}
        <div class="card-preco">
          <span class="valor">${fmtPreco(imovel.preco, imovel.finalidade)}</span>
          <span class="rotulo-preco">${imovel.finalidade === 'Aluguel' ? 'Valor do aluguel' : 'Valor de venda'}</span>
        </div>
      </div>
    </a>`;
}

async function carregar() {
  const cidade = new URLSearchParams(location.search).get('c');
  const grade = document.getElementById('grade-cidade');

  if (!cidade) {
    document.getElementById('titulo-cidade').textContent = 'Cidade não encontrada';
    document.getElementById('sub-cidade').textContent = '';
    grade.innerHTML = '<p class="vazio">Volte ao início e escolha uma cidade.</p>';
    return;
  }

  document.title = `Imóveis em ${cidade} | Reival Imóveis`;
  document.getElementById('titulo-cidade').textContent = `Imóveis em ${cidade}`;
  document.getElementById('bc-cidade').textContent = cidade;

  const { data, error } = await sb
    .from('imoveis')
    .select('*')
    .eq('ativo', true)
    .eq('cidade', cidade)
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: false });

  if (error) {
    console.error(error);
    grade.innerHTML = '<p class="vazio">Não foi possível carregar os imóveis. Tente novamente.</p>';
    document.getElementById('sub-cidade').textContent = '';
    return;
  }

  const lista = (data || []).filter((i) => !i.somente_destaque);
  document.getElementById('sub-cidade').textContent = lista.length
    ? `${lista.length} imóve${lista.length === 1 ? 'l disponível' : 'is disponíveis'} nesta cidade.`
    : '';
  grade.innerHTML = lista.length
    ? lista.map(cardImovel).join('')
    : '<p class="vazio">Nenhum imóvel disponível nesta cidade no momento.</p>';
}

// ---------- Menu mobile + contatos ----------
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('nav').classList.toggle('aberto');
});
(function contatos() {
  const msgGeral = 'Olá! Vim pelo site Reival Imóveis e gostaria de mais informações.';
  const msgAnuncio = 'Olá! Gostaria de anunciar meu imóvel com a Reival Imóveis.';
  document.getElementById('topbar-telefone').href = zapLink(msgGeral);
  document.getElementById('topbar-telefone').innerHTML = `${ICONES_CONTATO.whatsapp}${CONFIG.TELEFONE_EXIBICAO}`;
  document.getElementById('topbar-instagram').href = CONFIG.INSTAGRAM;
  const topEmail = document.getElementById('topbar-email');
  topEmail.href = `mailto:${CONFIG.EMAIL_CONTATO}`;
  topEmail.innerHTML = `${ICONES_CONTATO.email}${CONFIG.EMAIL_CONTATO}`;
  document.getElementById('zap-flutuante').href = zapLink(msgGeral);
  document.getElementById('nav-anunciar').href = zapLink(msgAnuncio);
  document.getElementById('rodape-telefone').textContent = CONFIG.TELEFONE_EXIBICAO;
  document.getElementById('rodape-email').innerHTML = `<a href="mailto:${CONFIG.EMAIL_CONTATO}">${CONFIG.EMAIL_CONTATO}</a>`;
  document.getElementById('rodape-instagram').innerHTML = `<a href="${CONFIG.INSTAGRAM}" target="_blank" rel="noopener">${CONFIG.INSTAGRAM_USUARIO}</a>`;
  document.getElementById('rodape-cidade').textContent = CONFIG.CIDADE;
  document.getElementById('ano').textContent = new Date().getFullYear();
})();

carregar();
