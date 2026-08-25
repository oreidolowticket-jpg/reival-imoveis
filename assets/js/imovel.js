// ============================================================
// Reival Imóveis — Página de detalhes do imóvel
// ============================================================
const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

let fotos = [];
let fotoAtual = 0;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
  pino: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  cifrao: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  casa: '<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/></svg>',
};

function naoEncontrado() {
  document.getElementById('conteudo-imovel').innerHTML = `
    <div class="aviso-nao-encontrado">
      <h1>Imóvel não encontrado</h1>
      <p>Esse anúncio pode ter sido removido ou o link está incorreto.</p>
      <a class="btn" href="index.html#imoveis">Ver todos os imóveis</a>
    </div>`;
}

function renderFotoPrincipal() {
  const principal = document.getElementById('foto-principal');
  if (!principal) return;
  principal.innerHTML = fotos.length
    ? `<img src="${esc(fotos[fotoAtual])}" alt="Foto do imóvel">
       ${fotos.length > 1 ? `
         <button class="galeria-nav ant" onclick="mudarFoto(-1)" aria-label="Foto anterior">&#10094;</button>
         <button class="galeria-nav prox" onclick="mudarFoto(1)" aria-label="Próxima foto">&#10095;</button>
         <span class="galeria-contador">${fotoAtual + 1} / ${fotos.length}</span>` : ''}`
    : `<div class="sem-foto">${ICONES.casa}</div>`;
  document.querySelectorAll('.miniatura').forEach((m, i) => m.classList.toggle('ativa', i === fotoAtual));
}

window.mudarFoto = (dir) => {
  fotoAtual = (fotoAtual + dir + fotos.length) % fotos.length;
  renderFotoPrincipal();
};
window.irParaFoto = (i) => { fotoAtual = i; renderFotoPrincipal(); };

function renderImovel(imovel) {
  document.title = `${imovel.titulo} | Reival Imóveis`;
  fotos = Array.isArray(imovel.fotos) ? imovel.fotos : [];
  fotoAtual = 0;

  const chips = [];
  if (imovel.quartos) chips.push(`<span class="atributo-chip">${ICONES.cama} ${imovel.quartos} quarto${imovel.quartos > 1 ? 's' : ''}</span>`);
  if (imovel.banheiros) chips.push(`<span class="atributo-chip">${ICONES.banho} ${imovel.banheiros} banheiro${imovel.banheiros > 1 ? 's' : ''}</span>`);
  if (imovel.vagas) chips.push(`<span class="atributo-chip">${ICONES.carro} ${imovel.vagas} vaga${imovel.vagas > 1 ? 's' : ''}</span>`);
  if (imovel.area) chips.push(`<span class="atributo-chip">${ICONES.area} ${Number(imovel.area).toLocaleString('pt-BR')} m²</span>`);
  chips.push(`<span class="atributo-chip">${ICONES.pino} ${esc([imovel.bairro, imovel.cidade].filter(Boolean).join(', '))}</span>`);
  if (imovel.aceita_financiamento) chips.push(`<span class="atributo-chip">${ICONES.cifrao} Aceita financiamento</span>`);

  const msg = `Olá! Tenho interesse no imóvel "${imovel.titulo}" (código ${imovel.codigo}) que vi no site Reival Imóveis. Pode me passar mais informações?`;
  const msgVisita = `Olá! Gostaria de agendar uma visita ao imóvel "${imovel.titulo}" (código ${imovel.codigo}).`;

  document.getElementById('conteudo-imovel').innerHTML = `
    <nav class="breadcrumb">
      <a href="index.html">Início</a> › <a href="index.html#imoveis">Imóveis</a> › <span>${esc(imovel.tipo)}</span> › <span>Cód. ${imovel.codigo}</span>
    </nav>
    <div class="imovel-grid">
      <div>
        <div class="galeria-pagina">
          <div class="principal" id="foto-principal">
            <div class="card-badges">
              <span class="badge ${imovel.finalidade === 'Aluguel' ? 'aluguel' : ''}">${esc(imovel.finalidade)}</span>
              ${imovel.aceita_financiamento ? '<span class="badge financia">Financia</span>' : ''}
            </div>
          </div>
          ${fotos.length > 1 ? `
            <div class="miniaturas">
              ${fotos.map((f, i) => `<button class="miniatura ${i === 0 ? 'ativa' : ''}" onclick="irParaFoto(${i})" aria-label="Foto ${i + 1}"><img src="${esc(f)}" alt="Miniatura ${i + 1}" loading="lazy"></button>`).join('')}
            </div>` : ''}
        </div>
        <div class="bloco-descricao">
          <h2>Descrição</h2>
          <p>${imovel.descricao ? esc(imovel.descricao) : 'Entre em contato para saber mais detalhes sobre este imóvel.'}</p>
          <p class="aviso-legal">Os valores, condições de pagamento e disponibilidade dos imóveis estão sujeitos a alterações sem aviso prévio. Consulte sempre a nossa equipe para informações atualizadas.</p>
        </div>
      </div>
      <aside class="painel-lateral">
        <div class="cartao-info">
          <span class="tipo-bairro">${esc(imovel.tipo)} · ${esc([imovel.bairro, imovel.cidade].filter(Boolean).join(', '))} · Código ${imovel.codigo}</span>
          <h1>${esc(imovel.titulo)}</h1>
          <div class="preco-grande">${fmtPreco(imovel.preco, imovel.finalidade)}</div>
          <span class="rotulo-preco">${imovel.finalidade === 'Aluguel' ? 'Valor do aluguel' : 'Valor de venda'}</span>
          ${chips.length ? `<div class="atributos-grade">${chips.join('')}</div>` : ''}
          <a class="btn" href="${zapLink(msg)}" target="_blank" rel="noopener">&#128172; Tenho interesse</a>
          <a class="btn btn-fantasma" style="margin-top:10px;" href="${zapLink(msgVisita)}" target="_blank" rel="noopener">&#128197; Agendar visita</a>
          <p class="obs-codigo">Ao entrar em contato, informe o código <strong>${imovel.codigo}</strong>.</p>
        </div>
      </aside>
    </div>`;

  renderFotoPrincipal();
  carregarSimilares(imovel);
}

// ---------- Similares ----------
function cardSimilar(i) {
  const fts = Array.isArray(i.fotos) ? i.fotos : [];
  const foto = fts.length
    ? `<img src="${esc(fts[0])}" alt="${esc(i.titulo)}" loading="lazy">`
    : `<div class="sem-foto">${ICONES.casa}</div>`;
  return `
    <a class="card-imovel" href="imovel.html?id=${i.id}">
      <div class="card-foto">
        <div class="card-badges">
          <span class="badge ${i.finalidade === 'Aluguel' ? 'aluguel' : ''}">${esc(i.finalidade)}</span>
        </div>
        ${foto}
      </div>
      <div class="card-corpo">
        <span class="tipo-bairro">${esc(i.tipo)} · ${esc([i.bairro, i.cidade].filter(Boolean).join(', '))}</span>
        <h3>${esc(i.titulo)}</h3>
        <span class="codigo">Código: ${i.codigo}</span>
        <div class="card-preco" style="margin-top:12px;">
          <span class="valor">${fmtPreco(i.preco, i.finalidade)}</span>
        </div>
      </div>
    </a>`;
}

async function carregarSimilares(imovel) {
  let { data } = await sb.from('imoveis').select('*')
    .eq('ativo', true).neq('id', imovel.id)
    .eq('tipo', imovel.tipo).eq('finalidade', imovel.finalidade)
    .limit(3);
  if (!data || !data.length) {
    ({ data } = await sb.from('imoveis').select('*')
      .eq('ativo', true).neq('id', imovel.id)
      .eq('finalidade', imovel.finalidade)
      .limit(3));
  }
  if (data && data.length) {
    document.getElementById('grade-similares').innerHTML = data.map(cardSimilar).join('');
    document.getElementById('secao-similares').style.display = '';
  }
}

// ---------- Carregamento ----------
async function carregar() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { naoEncontrado(); return; }
  const { data, error } = await sb.from('imoveis').select('*').eq('id', id).eq('ativo', true).maybeSingle();
  if (error || !data) { naoEncontrado(); return; }
  renderImovel(data);
}

// ---------- Menu mobile + contatos ----------
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('nav').classList.toggle('aberto');
});
(function contatos() {
  const msgGeral = 'Olá! Vim pelo site Reival Imóveis e gostaria de mais informações.';
  const msgAnuncio = 'Olá! Gostaria de anunciar meu imóvel com a Reival Imóveis.';
  document.getElementById('topbar-telefone').href = zapLink(msgGeral);
  document.getElementById('topbar-telefone').innerHTML = `&#128222; ${CONFIG.TELEFONE_EXIBICAO}`;
  document.getElementById('zap-flutuante').href = zapLink(msgGeral);
  document.getElementById('nav-anunciar').href = zapLink(msgAnuncio);
  document.getElementById('rodape-telefone').textContent = CONFIG.TELEFONE_EXIBICAO;
  document.getElementById('rodape-email').textContent = CONFIG.EMAIL_CONTATO;
  document.getElementById('rodape-cidade').textContent = CONFIG.CIDADE;
  document.getElementById('ano').textContent = new Date().getFullYear();
})();

carregar();
