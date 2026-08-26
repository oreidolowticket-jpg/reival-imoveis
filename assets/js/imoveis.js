// ============================================================
// Reival Imóveis — Catálogo completo, agrupado por tipo
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

// "Chácara" vira "chacara": o tipo precisa virar âncora de URL, e acento
// em fragmento dá problema em alguns navegadores.
const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const ICONES = {
  cama: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M2 17h20"/><path d="M6 10V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/></svg>',
  banho: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12h16a1 1 0 0 1 1 1 7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7 1 1 0 0 1 1-1z"/><path d="M6 12V5a2 2 0 0 1 2-2h1"/></svg>',
  carro: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14l-1.5-5.5a2 2 0 0 0-1.9-1.5H8.4a2 2 0 0 0-1.9 1.5L5 17z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>',
  area: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h18"/></svg>',
  casa: '<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/></svg>',
};

// A ordem aqui é a ordem das seções na página
const TIPOS = ['Casa', 'Apartamento', 'Terreno', 'Comercial', 'Chácara'];
const PLURAL = { Casa: 'Casas', Apartamento: 'Apartamentos', Terreno: 'Terrenos', Comercial: 'Comercial', 'Chácara': 'Chácaras' };

let todos = [];
let filtro = { finalidade: '', cidade: '', termo: '' };

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
        <span class="tipo-bairro">${esc([imovel.tipo, imovel.bairro].filter(Boolean).join(' · '))}</span>
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

function aplicarFiltro(lista) {
  return lista.filter((i) => {
    if (filtro.finalidade && i.finalidade !== filtro.finalidade) return false;
    if (filtro.cidade && i.cidade !== filtro.cidade) return false;
    if (filtro.termo) {
      const alvo = `${i.titulo || ''} ${i.codigo || ''} ${i.bairro || ''} ${i.cidade || ''} ${i.descricao || ''}`.toLowerCase();
      if (!alvo.includes(filtro.termo)) return false;
    }
    return true;
  });
}

function render() {
  const visiveis = aplicarFiltro(todos);
  const alvo = document.getElementById('grupos');
  const atalhos = document.getElementById('atalhos');

  if (!visiveis.length) {
    alvo.innerHTML = '<p class="vazio">Nenhum imóvel encontrado com esses filtros.</p>';
    atalhos.innerHTML = '';
    document.getElementById('contagem').textContent = 'Nenhum imóvel encontrado.';
    return;
  }

  // Tipos fora da lista conhecida entram no fim, para nada sumir da página
  const ordem = [...TIPOS, ...[...new Set(visiveis.map((i) => i.tipo))].filter((t) => !TIPOS.includes(t))];
  const grupos = ordem
    .map((tipo) => ({ tipo, itens: visiveis.filter((i) => i.tipo === tipo) }))
    .filter((g) => g.itens.length);

  document.getElementById('contagem').textContent =
    `${visiveis.length} imóve${visiveis.length === 1 ? 'l disponível' : 'is disponíveis'} em ${grupos.length} categoria${grupos.length === 1 ? '' : 's'}.`;

  atalhos.innerHTML = grupos.map((g) =>
    `<a class="atalho-tipo" href="#grupo-${slug(g.tipo)}">
       ${esc(PLURAL[g.tipo] || g.tipo)} <span>${g.itens.length}</span>
     </a>`).join('');

  alvo.innerHTML = grupos.map((g) => {
    const id = slug(g.tipo);
    return `
      <section class="grupo-tipo" id="grupo-${id}">
        <div class="grupo-cabecalho">
          <h2>${esc(PLURAL[g.tipo] || g.tipo)}</h2>
          <span class="grupo-qtd">${g.itens.length} imóve${g.itens.length === 1 ? 'l' : 'is'}</span>
        </div>
        <div class="grade-imoveis">${g.itens.map(cardImovel).join('')}</div>
      </section>`;
  }).join('');
}

async function carregar() {
  const { data, error } = await sb
    .from('imoveis')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: false });

  if (error) {
    console.error(error);
    document.getElementById('grupos').innerHTML = '<p class="vazio">Não foi possível carregar os imóveis. Tente novamente mais tarde.</p>';
    return;
  }

  todos = (data || []).filter((i) => !i.somente_destaque);

  const select = document.getElementById('f-cidade');
  [...new Set(todos.map((i) => i.cidade).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .forEach((c) => select.insertAdjacentHTML('beforeend', `<option value="${esc(c)}">${esc(c)}</option>`));

  // Permite chegar já filtrado, ex.: /imoveis?tipo=Terreno
  const params = new URLSearchParams(location.search);
  if (params.get('finalidade')) {
    filtro.finalidade = params.get('finalidade');
    document.getElementById('f-finalidade').value = filtro.finalidade;
  }
  if (params.get('cidade')) {
    filtro.cidade = params.get('cidade');
    select.value = filtro.cidade;
  }

  render();

  const tipo = params.get('tipo');
  if (tipo) {
    const id = slug(tipo);
    document.getElementById(`grupo-${id}`)?.scrollIntoView({ behavior: 'smooth' });
  }
}

document.getElementById('f-finalidade').addEventListener('change', (e) => { filtro.finalidade = e.target.value; render(); });
document.getElementById('f-cidade').addEventListener('change', (e) => { filtro.cidade = e.target.value; render(); });
document.getElementById('f-termo').addEventListener('input', (e) => { filtro.termo = e.target.value.trim().toLowerCase(); render(); });

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
