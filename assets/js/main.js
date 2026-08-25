// ============================================================
// Reival Imóveis — Landing page
// ============================================================
const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

let todosImoveis = [];

// ---------- Utilitários ----------
const fmtPreco = (valor, finalidade) => {
  if (valor == null) return 'Consulte';
  const preco = Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
  return finalidade === 'Aluguel' ? `${preco}/mês` : preco;
};

const zapLink = (msg) => `https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(msg)}`;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICONES = {
  cama: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M2 17h20"/><path d="M6 10V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/></svg>',
  banho: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12h16a1 1 0 0 1 1 1 7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7 1 1 0 0 1 1-1z"/><path d="M6 12V5a2 2 0 0 1 2-2h1"/></svg>',
  carro: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14l-1.5-5.5a2 2 0 0 0-1.9-1.5H8.4a2 2 0 0 0-1.9 1.5L5 17z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>',
  area: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h18"/></svg>',
  casa: '<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/></svg>',
};

// ---------- Renderização de cards ----------
function cardImovel(imovel) {
  const fotos = Array.isArray(imovel.fotos) ? imovel.fotos : [];
  const foto = fotos.length
    ? `<img src="${esc(fotos[0])}" alt="${esc(imovel.titulo)}" loading="lazy">`
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
        <span class="tipo-bairro">${esc(imovel.tipo)} · ${esc([imovel.bairro, imovel.cidade].filter(Boolean).join(', '))}</span>
        <h3>${esc(imovel.titulo)}</h3>
        <span class="codigo">Código: ${imovel.codigo}</span>
        ${atributos.length ? `<div class="card-atributos">${atributos.join('')}</div>` : '<div class="card-atributos"><span>Consulte detalhes</span></div>'}
        <div class="card-preco">
          <span class="valor">${fmtPreco(imovel.preco, imovel.finalidade)}</span>
          <span class="rotulo-preco">${imovel.finalidade === 'Aluguel' ? 'Valor do aluguel' : 'Valor de venda'}</span>
        </div>
      </div>
    </a>`;
}

function renderizar(lista, alvo, msgVazio) {
  const el = document.getElementById(alvo);
  el.innerHTML = lista.length ? lista.map(cardImovel).join('') : `<p class="vazio">${msgVazio}</p>`;
}

// ---------- Carregamento ----------
async function carregarImoveis() {
  const { data, error } = await sb
    .from('imoveis')
    .select('*')
    .eq('ativo', true)
    .order('destaque', { ascending: false })
    .order('criado_em', { ascending: false });

  if (error) {
    console.error('Erro ao carregar imóveis:', error);
    document.getElementById('grade-imoveis').innerHTML = '<p class="vazio">Não foi possível carregar os imóveis. Tente novamente mais tarde.</p>';
    document.getElementById('grade-destaques').innerHTML = '<p class="vazio">Não foi possível carregar os destaques.</p>';
    return;
  }

  todosImoveis = data || [];
  renderizar(todosImoveis.filter((i) => i.destaque).slice(0, 6), 'grade-destaques', 'Nenhum destaque no momento.');
  renderizar(todosImoveis, 'grade-imoveis', 'Nenhum imóvel disponível no momento.');
  document.getElementById('stat-imoveis').textContent = todosImoveis.length;
  preencherCidades();
}

function preencherCidades() {
  const cidades = [...new Set(todosImoveis.map((i) => i.cidade).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const select = document.getElementById('f-cidade');
  select.innerHTML = '<option value="">Todas as cidades</option>' +
    cidades.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
}

// ---------- Busca / filtros ----------
document.getElementById('form-busca').addEventListener('submit', (e) => {
  e.preventDefault();
  const finalidade = document.getElementById('f-finalidade').value;
  const tipo = document.getElementById('f-tipo').value;
  const cidade = document.getElementById('f-cidade').value;
  const termo = document.getElementById('f-bairro').value.trim().toLowerCase();

  const filtrados = todosImoveis.filter((i) => {
    if (finalidade && i.finalidade !== finalidade) return false;
    if (tipo && i.tipo !== tipo) return false;
    if (cidade && i.cidade !== cidade) return false;
    if (termo) {
      const alvo = `${i.titulo} ${i.codigo || ''} ${i.bairro || ''} ${i.cidade || ''} ${i.descricao || ''} ${i.endereco || ''}`.toLowerCase();
      if (!alvo.includes(termo)) return false;
    }
    return true;
  });

  renderizar(filtrados, 'grade-imoveis', 'Nenhum imóvel encontrado com esses filtros.');
  document.getElementById('resultado-info').textContent =
    `${filtrados.length} imóve${filtrados.length === 1 ? 'l encontrado' : 'is encontrados'}.`;
  document.getElementById('imoveis').scrollIntoView({ behavior: 'smooth' });
});

// ---------- Cards de cidades ----------
async function carregarCidades() {
  const { data } = await sb
    .from('cidades')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true });

  if (!data || !data.length) return;

  // Só mostra cidades que têm imóveis ativos; conta quantos
  const contagem = {};
  for (const i of todosImoveis) {
    if (i.cidade) contagem[i.cidade] = (contagem[i.cidade] || 0) + 1;
  }

  const cidades = data.filter((c) => contagem[c.nome] > 0);
  if (!cidades.length) return;

  document.getElementById('grade-cidades').innerHTML = cidades.map((c) => {
    const qtd = contagem[c.nome];
    const foto = c.imagem ? `<img src="${esc(c.imagem)}" alt="Imóveis em ${esc(c.nome)}" loading="lazy">` : '';
    return `
      <button type="button" class="card-cidade" data-cidade="${esc(c.nome)}">
        ${foto}
        <span class="cidade-info">
          <span class="cidade-nome">${esc(c.nome)}</span>
          <span class="cidade-qtd">${qtd} imóve${qtd === 1 ? 'l' : 'is'} disponíve${qtd === 1 ? 'l' : 'is'}</span>
        </span>
      </button>`;
  }).join('');

  document.querySelectorAll('.card-cidade').forEach((card) => {
    card.addEventListener('click', () => {
      document.getElementById('f-cidade').value = card.dataset.cidade;
      document.getElementById('f-finalidade').value = '';
      document.getElementById('f-tipo').value = '';
      document.getElementById('f-bairro').value = '';
      document.getElementById('form-busca').requestSubmit();
    });
  });

  document.getElementById('cidades-secao').style.display = '';
}

// ---------- Carrossel de banners ----------
let bannersSite = [];
let bannerAtivo = 0;
let bannerTimer;

async function carregarBanners() {
  const { data } = await sb
    .from('banners')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: true });

  bannersSite = data || [];
  if (!bannersSite.length) return;

  const cont = document.getElementById('carrossel-banners');
  cont.innerHTML = bannersSite.map((b, i) => {
    const img = `<img src="${esc(b.imagem)}" alt="${esc(b.titulo || 'Banner')}" loading="${i === 0 ? 'eager' : 'lazy'}" draggable="false">`;
    return b.link
      ? `<a class="banner-slide ${i === 0 ? 'ativo' : ''}" href="${esc(b.link)}" target="_blank" rel="noopener">${img}</a>`
      : `<div class="banner-slide ${i === 0 ? 'ativo' : ''}">${img}</div>`;
  }).join('');

  document.getElementById('banners-pontos').innerHTML = bannersSite.length > 1
    ? bannersSite.map((_, i) => `<button class="banner-ponto ${i === 0 ? 'ativo' : ''}" data-i="${i}" aria-label="Ir para o banner ${i + 1}"></button>`).join('')
    : '';

  document.getElementById('banners-secao').style.display = '';

  if (bannersSite.length > 1) {
    document.querySelectorAll('.banner-ponto').forEach((p) => {
      p.addEventListener('click', () => mudarBanner(Number(p.dataset.i)));
    });
    ativarDeslize(cont);
    reiniciarAutoplay();
  }
}

// Navegação por deslize (dedo ou mouse)
function ativarDeslize(cont) {
  let inicioX = null;
  let arrastou = false;

  cont.addEventListener('pointerdown', (e) => {
    inicioX = e.clientX;
    arrastou = false;
    try { cont.setPointerCapture(e.pointerId); } catch (_) {}
  });

  cont.addEventListener('pointermove', (e) => {
    if (inicioX !== null && Math.abs(e.clientX - inicioX) > 10) arrastou = true;
  });

  cont.addEventListener('pointerup', (e) => {
    if (inicioX === null) return;
    const delta = e.clientX - inicioX;
    inicioX = null;
    if (Math.abs(delta) > 40) mudarBanner(bannerAtivo + (delta < 0 ? 1 : -1));
  });

  cont.addEventListener('pointercancel', () => { inicioX = null; });

  // Evita abrir o link do banner quando o gesto foi um deslize
  cont.addEventListener('click', (e) => {
    if (arrastou) { e.preventDefault(); e.stopPropagation(); }
  }, true);
}

function mudarBanner(i) {
  bannerAtivo = (i + bannersSite.length) % bannersSite.length;
  document.querySelectorAll('.banner-slide').forEach((s, idx) => s.classList.toggle('ativo', idx === bannerAtivo));
  document.querySelectorAll('.banner-ponto').forEach((p, idx) => p.classList.toggle('ativo', idx === bannerAtivo));
  reiniciarAutoplay();
}

function reiniciarAutoplay() {
  clearInterval(bannerTimer);
  bannerTimer = setInterval(() => mudarBanner(bannerAtivo + 1), 5000);
}

// ---------- Menu mobile ----------
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('nav').classList.toggle('aberto');
});

// ---------- Contatos dinâmicos ----------
(function contatos() {
  const msgGeral = 'Olá! Vim pelo site Reival Imóveis e gostaria de mais informações.';
  const msgAnuncio = 'Olá! Gostaria de anunciar meu imóvel com a Reival Imóveis.';
  document.getElementById('topbar-telefone').href = zapLink(msgGeral);
  document.getElementById('topbar-telefone').innerHTML = `&#128222; ${CONFIG.TELEFONE_EXIBICAO}`;
  document.getElementById('zap-flutuante').href = zapLink(msgGeral);
  document.getElementById('nav-anunciar').href = zapLink(msgAnuncio);
  document.getElementById('cta-anunciar-btn').href = zapLink(msgAnuncio);
  document.getElementById('rodape-telefone').textContent = CONFIG.TELEFONE_EXIBICAO;
  document.getElementById('rodape-email').textContent = CONFIG.EMAIL_CONTATO;
  document.getElementById('rodape-cidade').textContent = CONFIG.CIDADE;
  document.getElementById('ano').textContent = new Date().getFullYear();
})();

carregarImoveis().then(carregarCidades);
carregarBanners();
