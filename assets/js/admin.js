// ============================================================
// Reival Imóveis — Painel administrativo
// ============================================================
const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

let imoveis = [];
// Fotos do formulário: { url } para já enviadas, { file, previewUrl } para novas
let fotosForm = [];

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtPreco = (v) => v == null ? 'Consulte' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const tituloImovel = (i) => i.titulo || [i.tipo || 'Imóvel', i.cidade ? `em ${i.cidade}` : ''].filter(Boolean).join(' ');

// ---------- Máscara de preço (1.000.000 ou 1.000.000,50) ----------
function formatarPrecoDigitado(valor) {
  let v = String(valor).replace(/[^\d,]/g, '');
  const temVirgula = v.includes(',');
  const [inteiro, ...resto] = v.split(',');
  const dec = resto.join('').slice(0, 2);
  const intFmt = inteiro.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return intFmt + (temVirgula ? ',' + dec : '');
}

function parsearPreco(texto) {
  const v = String(texto).trim().replace(/\./g, '').replace(',', '.');
  return v === '' ? null : Number(v);
}

function exibirPreco(preco) {
  return preco == null ? '' : Number(preco).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('visivel');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('visivel'), 3200);
}

// ---------- Sessão ----------
async function iniciar() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    mostrarPainel(session.user.email);
  }
}

function mostrarPainel(email) {
  $('tela-login').style.display = 'none';
  $('painel').classList.add('visivel');
  $('email-admin').textContent = email;
  carregarImoveis();
  carregarBanners();
  carregarCidades();
}

$('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('btn-login');
  btn.disabled = true;
  btn.textContent = 'Entrando...';
  $('login-erro').classList.remove('visivel');

  // Aceita usuário simples (ex.: "reivalacesso") ou e-mail completo
  let usuario = $('login-email').value.trim();
  if (!usuario.includes('@')) usuario += '@reival.site';

  const { data, error } = await sb.auth.signInWithPassword({
    email: usuario,
    password: $('login-senha').value,
  });

  btn.disabled = false;
  btn.textContent = 'Entrar';

  if (error) {
    $('login-erro').textContent = 'Usuário ou senha incorretos.';
    $('login-erro').classList.add('visivel');
    return;
  }
  mostrarPainel(data.user.email);
});

$('btn-sair').addEventListener('click', async () => {
  await sb.auth.signOut();
  location.reload();
});

// ---------- Listagem ----------
const ICONE_ALCA = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="5" r="1.7"/><circle cx="15" cy="5" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="19" r="1.7"/><circle cx="15" cy="19" r="1.7"/></svg>';

async function carregarImoveis() {
  const { data, error } = await sb
    .from('imoveis')
    .select('*')
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: false });

  if (error) {
    $('lista-imoveis').innerHTML = '<p style="color:var(--vermelho);">Erro ao carregar imóveis. Recarregue a página.</p>';
    console.error(error);
    return;
  }
  imoveis = data || [];
  renderLista();
  renderResumo();
  renderCidades();
}

function renderResumo() {
  $('resumo-total').textContent = imoveis.length;
  $('resumo-ativos').textContent = imoveis.filter((i) => i.ativo).length;
  $('resumo-destaques').textContent = imoveis.filter((i) => i.destaque && i.ativo).length;
  $('resumo-venda').textContent = imoveis.filter((i) => i.finalidade === 'Venda' && i.ativo).length;
}

function renderLista() {
  const termo = $('filtro-admin').value.trim().toLowerCase();
  const lista = termo
    ? imoveis.filter((i) => `${i.titulo} ${i.bairro || ''} ${i.cidade || ''} ${i.codigo}`.toLowerCase().includes(termo))
    : imoveis;

  if (!lista.length) {
    $('lista-imoveis').innerHTML = '<p style="color:var(--cinza-500);">Nenhum imóvel encontrado.</p>';
    return;
  }

  // Com a busca ativa a lista mostra so uma parte, entao reordenar
  // bagunçaria os que estao fora dela. A alca fica desabilitada.
  const podeOrdenar = !termo;

  $('lista-imoveis').innerHTML = lista.map((i) => {
    const fotos = Array.isArray(i.fotos) ? i.fotos : [];
    const foto = fotos.length
      ? `<img src="${esc(fotos[0])}" alt="">`
      : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>';
    return `
      <div class="linha-imovel linha-ordenavel ${i.ativo ? '' : 'inativo'}" data-id="${i.id}">
        <button type="button" class="alca" ${podeOrdenar ? '' : 'disabled'}
          title="${podeOrdenar ? 'Arraste para mudar a ordem' : 'Limpe a busca para reordenar'}"
          aria-label="Mover ${esc(tituloImovel(i))}">${ICONE_ALCA}</button>
        <div class="linha-foto">${foto}</div>
        <div class="linha-info">
          <h3>${esc(tituloImovel(i))}</h3>
          <div class="meta">
            <span>Cód. ${i.codigo}</span>
            <span>${esc(i.tipo)} · ${esc([i.bairro, i.cidade].filter(Boolean).join(', '))}</span>
            <span class="preco">${fmtPreco(i.preco)}</span>
            <span class="etiqueta ${i.finalidade === 'Aluguel' ? 'aluguel' : 'venda'}">${esc(i.finalidade)}</span>
            ${i.destaque ? '<span class="etiqueta destaque">Destaque</span>' : ''}
            ${i.somente_destaque ? '<span class="etiqueta venda">Só destaques</span>' : ''}
            ${i.ativo ? '' : '<span class="etiqueta oculto">Oculto</span>'}
            <span>${fotos.length} foto${fotos.length === 1 ? '' : 's'}</span>
          </div>
        </div>
        <div class="linha-acoes">
          <button class="btn btn-borda btn-mini" onclick="editarImovel('${i.id}')">Editar</button>
          <button class="btn btn-cinza btn-mini" onclick="alternarCampo('${i.id}', 'destaque')">${i.destaque ? 'Tirar destaque' : 'Destacar'}</button>
          <button class="btn btn-cinza btn-mini" onclick="alternarCampo('${i.id}', 'ativo')">${i.ativo ? 'Ocultar' : 'Publicar'}</button>
          <button class="btn btn-vermelho btn-mini" onclick="excluirImovel('${i.id}')">Excluir</button>
        </div>
      </div>`;
  }).join('');
}

$('filtro-admin').addEventListener('input', renderLista);

// ---------- Reordenar imóveis arrastando pela alça ----------
// A captura do ponteiro fica no container (que nunca sai do lugar) e não na
// alça, porque a linha arrastada é movida no DOM durante o arrasto.
(function reordenar() {
  const container = $('lista-imoveis');
  let linhaArrastada = null;

  container.addEventListener('pointerdown', (ev) => {
    const alca = ev.target.closest('.alca');
    if (!alca || alca.disabled) return;
    linhaArrastada = alca.closest('.linha-imovel');
    if (!linhaArrastada) return;
    linhaArrastada.classList.add('arrastando');
    container.setPointerCapture(ev.pointerId);
    ev.preventDefault();
  });

  container.addEventListener('pointermove', (ev) => {
    if (!linhaArrastada) return;
    const sob = document.elementFromPoint(ev.clientX, ev.clientY);
    const alvo = sob && sob.closest ? sob.closest('.linha-imovel') : null;
    if (!alvo || alvo === linhaArrastada || alvo.parentNode !== container) return;
    const area = alvo.getBoundingClientRect();
    const depois = ev.clientY > area.top + area.height / 2;
    container.insertBefore(linhaArrastada, depois ? alvo.nextSibling : alvo);
  });

  const encerrar = () => {
    if (!linhaArrastada) return;
    linhaArrastada.classList.remove('arrastando');
    linhaArrastada = null;
    salvarOrdem();
  };
  container.addEventListener('pointerup', encerrar);
  container.addEventListener('pointercancel', encerrar);
})();

async function salvarOrdem() {
  const ids = [...$('lista-imoveis').querySelectorAll('.linha-imovel')].map((l) => l.dataset.id);
  const mudancas = [];
  ids.forEach((id, indice) => {
    const imovel = imoveis.find((i) => i.id === id);
    if (imovel && imovel.ordem !== indice + 1) mudancas.push({ imovel, ordem: indice + 1 });
  });
  if (!mudancas.length) return;

  const resultados = await Promise.all(
    mudancas.map((m) => sb.from('imoveis').update({ ordem: m.ordem }).eq('id', m.imovel.id)),
  );
  const falha = resultados.find((r) => r.error);
  if (falha) {
    console.error(falha.error);
    toast('Erro ao salvar a ordem. Recarregando a lista.');
    carregarImoveis();
    return;
  }

  mudancas.forEach((m) => { m.imovel.ordem = m.ordem; });
  imoveis.sort((a, b) => a.ordem - b.ordem);
  toast('Ordem atualizada!');
}

// ---------- Ações rápidas ----------
window.alternarCampo = async (id, campo) => {
  const imovel = imoveis.find((i) => i.id === id);
  if (!imovel) return;
  const { error } = await sb.from('imoveis').update({ [campo]: !imovel[campo] }).eq('id', id);
  if (error) { toast('Erro ao atualizar. Tente novamente.'); console.error(error); return; }
  toast(campo === 'destaque'
    ? (!imovel.destaque ? 'Imóvel destacado!' : 'Destaque removido.')
    : (!imovel.ativo ? 'Imóvel publicado!' : 'Imóvel oculto do site.'));
  carregarImoveis();
};

window.excluirImovel = async (id) => {
  const imovel = imoveis.find((i) => i.id === id);
  if (!imovel) return;
  if (!confirm(`Excluir "${tituloImovel(imovel)}" (cód. ${imovel.codigo})?\nEssa ação não pode ser desfeita.`)) return;

  const { error } = await sb.from('imoveis').delete().eq('id', id);
  if (error) { toast('Erro ao excluir. Tente novamente.'); console.error(error); return; }

  // Remove as fotos do storage (melhor esforço)
  const fotos = Array.isArray(imovel.fotos) ? imovel.fotos : [];
  const caminhos = fotos
    .map((u) => { const m = String(u).split('/storage/v1/object/public/fotos/')[1]; return m ? decodeURIComponent(m) : null; })
    .filter(Boolean);
  if (caminhos.length) await sb.storage.from('fotos').remove(caminhos);

  toast('Imóvel excluído.');
  carregarImoveis();
};

// ---------- Formulário ----------
function abrirForm(imovel) {
  fotosForm = [];
  $('form-imovel').reset();
  $('i-id').value = '';
  $('i-ativo').checked = true;
  $('form-status').textContent = '';

  if (imovel) {
    $('form-titulo').textContent = `Editar imóvel — cód. ${imovel.codigo}`;
    $('i-id').value = imovel.id;
    $('i-codigo').value = imovel.codigo ?? '';
    $('i-titulo').value = imovel.titulo || '';
    $('i-tipo').value = imovel.tipo || 'Casa';
    $('i-finalidade').value = imovel.finalidade || 'Venda';
    $('i-cidade').value = imovel.cidade || '';
    $('i-bairro').value = imovel.bairro || '';
    $('i-preco').value = exibirPreco(imovel.preco);
    $('i-quartos').value = imovel.quartos ?? '';
    $('i-banheiros').value = imovel.banheiros ?? '';
    $('i-vagas').value = imovel.vagas ?? '';
    $('i-area').value = imovel.area ?? '';
    $('i-endereco').value = imovel.endereco || '';
    $('i-descricao').value = imovel.descricao || '';
    $('i-destaque').checked = !!imovel.destaque;
    $('i-somente-destaque').checked = !!imovel.somente_destaque;
    $('i-financiamento').checked = !!imovel.aceita_financiamento;
    $('i-ativo').checked = !!imovel.ativo;
    fotosForm = (Array.isArray(imovel.fotos) ? imovel.fotos : []).map((url) => ({ url }));
  } else {
    $('form-titulo').textContent = 'Novo imóvel';
  }

  renderPreviews();
  $('modal-form-fundo').classList.add('aberto');
  document.body.style.overflow = 'hidden';
}

function fecharForm() {
  $('modal-form-fundo').classList.remove('aberto');
  document.body.style.overflow = '';
}

window.editarImovel = (id) => {
  const imovel = imoveis.find((i) => i.id === id);
  if (imovel) abrirForm(imovel);
};

$('i-preco').addEventListener('input', () => {
  $('i-preco').value = formatarPrecoDigitado($('i-preco').value);
});

$('btn-novo').addEventListener('click', () => abrirForm(null));
$('btn-fechar-form').addEventListener('click', fecharForm);
$('btn-cancelar').addEventListener('click', fecharForm);
$('modal-form-fundo').addEventListener('click', (e) => { if (e.target === e.currentTarget) fecharForm(); });

// ---------- Fotos ----------
$('btn-add-fotos').addEventListener('click', () => $('i-fotos').click());

$('i-fotos').addEventListener('change', () => {
  for (const file of $('i-fotos').files) {
    if (!file.type.startsWith('image/')) continue;
    fotosForm.push({ file, previewUrl: URL.createObjectURL(file) });
  }
  $('i-fotos').value = '';
  renderPreviews();
});

function renderPreviews() {
  $('previews').innerHTML = fotosForm.map((f, idx) => `
    <div class="preview">
      <img src="${esc(f.url || f.previewUrl)}" alt="Foto ${idx + 1}">
      <button type="button" onclick="removerFoto(${idx})" aria-label="Remover foto">&#10005;</button>
    </div>`).join('');
}

window.removerFoto = (idx) => {
  const f = fotosForm[idx];
  if (f && f.previewUrl) URL.revokeObjectURL(f.previewUrl);
  fotosForm.splice(idx, 1);
  renderPreviews();
};

// Redimensiona e converte para JPEG, reduzindo muito o espaço
// e o tráfego no Supabase Storage.
async function comprimirImagem(file, MAX = 1600, qualidade = 0.82) {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) return file;
  const img = await createImageBitmap(file).catch(() => null);
  if (!img) return file;
  const escala = Math.min(1, MAX / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * escala);
  canvas.height = Math.round(img.height * escala);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  img.close();
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', qualidade));
  return blob && blob.size < file.size ? blob : file;
}

async function uploadImagem(arquivoOriginal, pasta, MAX, qualidade) {
  const arquivo = await comprimirImagem(arquivoOriginal, MAX, qualidade);
  const comprimido = arquivo !== arquivoOriginal;
  const ext = comprimido
    ? 'jpg'
    : ((arquivoOriginal.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg');
  const caminho = `${pasta}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from('fotos').upload(caminho, arquivo, {
    cacheControl: '31536000',
    contentType: comprimido ? 'image/jpeg' : (arquivoOriginal.type || undefined),
    upsert: false,
  });
  if (error) throw new Error(`Falha no upload de "${arquivoOriginal.name}": ${error.message}`);
  return sb.storage.from('fotos').getPublicUrl(caminho).data.publicUrl;
}

async function uploadFotos() {
  const urls = [];
  for (const f of fotosForm) {
    if (f.url) { urls.push(f.url); continue; }
    urls.push(await uploadImagem(f.file, '', 1600, 0.82));
  }
  return urls;
}

// ---------- Salvar ----------
$('form-imovel').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('btn-salvar');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    const totalNovas = fotosForm.filter((f) => f.file).length;
    if (totalNovas) $('form-status').textContent = `Enviando ${totalNovas} foto${totalNovas > 1 ? 's' : ''}...`;
    const fotos = await uploadFotos();
    $('form-status').textContent = '';

    const numOuNull = (id) => { const v = $(id).value; return v === '' ? null : Number(v); };
    const registro = {
      titulo: $('i-titulo').value.trim() || null,
      ...($('i-codigo').value.trim() !== '' ? { codigo: $('i-codigo').value.trim().toUpperCase() } : {}),
      tipo: $('i-tipo').value,
      finalidade: $('i-finalidade').value,
      cidade: $('i-cidade').value.trim() || null,
      bairro: $('i-bairro').value.trim() || null,
      preco: parsearPreco($('i-preco').value),
      quartos: numOuNull('i-quartos'),
      banheiros: numOuNull('i-banheiros'),
      vagas: numOuNull('i-vagas'),
      area: numOuNull('i-area'),
      endereco: $('i-endereco').value.trim() || null,
      descricao: $('i-descricao').value.trim() || null,
      // "Somente destaques" força o imóvel a ser destaque, senão não apareceria em lugar nenhum
      destaque: $('i-destaque').checked || $('i-somente-destaque').checked,
      somente_destaque: $('i-somente-destaque').checked,
      aceita_financiamento: $('i-financiamento').checked,
      ativo: $('i-ativo').checked,
      fotos,
    };

    const id = $('i-id').value;
    let resp = id
      ? await sb.from('imoveis').update(registro).eq('id', id)
      : await sb.from('imoveis').insert(registro);

    // Sem código manual: se o número gerado colidir com um definido à mão,
    // reinsere (a sequência avança a cada tentativa)
    if (!id && !('codigo' in registro)) {
      let tentativas = 0;
      while (resp.error && resp.error.code === '23505' && tentativas < 5) {
        resp = await sb.from('imoveis').insert(registro);
        tentativas++;
      }
    }

    if (resp.error) {
      if (resp.error.code === '23505') throw new Error('Este código já está em uso por outro imóvel. Escolha outro número.');
      throw resp.error;
    }

    toast(id ? 'Imóvel atualizado!' : 'Imóvel cadastrado!');
    fecharForm();
    carregarImoveis();
  } catch (err) {
    console.error(err);
    $('form-status').textContent = '';
    toast(err.message || 'Erro ao salvar. Tente novamente.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar imóvel';
  }
});

// ============================================================
// Banners da página inicial
// ============================================================
let banners = [];
let bannerImagemForm = null; // { url } já enviada ou { file, previewUrl } nova

const caminhoStorage = (url) => {
  const m = String(url).split('/storage/v1/object/public/fotos/')[1];
  return m ? decodeURIComponent(m) : null;
};

async function carregarBanners() {
  const { data, error } = await sb
    .from('banners')
    .select('*')
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: true });
  if (error) {
    $('lista-banners').innerHTML = '<p style="color:var(--vermelho);">Erro ao carregar banners.</p>';
    console.error(error);
    return;
  }
  banners = data || [];
  renderBanners();
}

function renderBanners() {
  if (!banners.length) {
    $('lista-banners').innerHTML = '<p style="color:var(--cinza-500);">Nenhum banner cadastrado. Clique em "+ Novo banner" para criar o primeiro.</p>';
    return;
  }
  $('lista-banners').innerHTML = banners.map((b) => `
    <div class="linha-imovel linha-banner ${b.ativo ? '' : 'inativo'}">
      <div class="linha-foto"><img src="${esc(b.imagem)}" alt=""></div>
      <div class="linha-info">
        <h3>${esc(b.titulo || 'Banner sem nome')}</h3>
        <div class="meta">
          <span>Ordem: ${b.ordem}</span>
          ${b.link ? '<span>Com link</span>' : ''}
          ${b.ativo ? '' : '<span class="etiqueta oculto">Oculto</span>'}
        </div>
      </div>
      <div class="linha-acoes">
        <button class="btn btn-borda btn-mini" onclick="editarBanner('${b.id}')">Editar</button>
        <button class="btn btn-cinza btn-mini" onclick="alternarBanner('${b.id}')">${b.ativo ? 'Ocultar' : 'Publicar'}</button>
        <button class="btn btn-vermelho btn-mini" onclick="excluirBanner('${b.id}')">Excluir</button>
      </div>
    </div>`).join('');
}

function abrirFormBanner(banner) {
  bannerImagemForm = null;
  $('form-banner').reset();
  $('b-id').value = '';
  $('b-ativo').checked = true;
  $('b-ordem').value = 0;
  $('banner-status').textContent = '';

  if (banner) {
    $('form-banner-titulo').textContent = 'Editar banner';
    $('b-id').value = banner.id;
    $('b-titulo').value = banner.titulo || '';
    $('b-link').value = banner.link || '';
    $('b-ordem').value = banner.ordem ?? 0;
    $('b-ativo').checked = !!banner.ativo;
    bannerImagemForm = { url: banner.imagem };
  } else {
    $('form-banner-titulo').textContent = 'Novo banner';
  }

  renderPreviewBanner();
  $('modal-banner-fundo').classList.add('aberto');
  document.body.style.overflow = 'hidden';
}

function fecharFormBanner() {
  $('modal-banner-fundo').classList.remove('aberto');
  document.body.style.overflow = '';
}

window.editarBanner = (id) => {
  const b = banners.find((x) => x.id === id);
  if (b) abrirFormBanner(b);
};

window.alternarBanner = async (id) => {
  const b = banners.find((x) => x.id === id);
  if (!b) return;
  const { error } = await sb.from('banners').update({ ativo: !b.ativo }).eq('id', id);
  if (error) { toast('Erro ao atualizar o banner.'); console.error(error); return; }
  toast(!b.ativo ? 'Banner publicado!' : 'Banner oculto.');
  carregarBanners();
};

window.excluirBanner = async (id) => {
  const b = banners.find((x) => x.id === id);
  if (!b) return;
  if (!confirm(`Excluir o banner "${b.titulo || 'sem nome'}"?\nEssa ação não pode ser desfeita.`)) return;
  const { error } = await sb.from('banners').delete().eq('id', id);
  if (error) { toast('Erro ao excluir o banner.'); console.error(error); return; }
  const caminho = caminhoStorage(b.imagem);
  if (caminho) await sb.storage.from('fotos').remove([caminho]);
  toast('Banner excluído.');
  carregarBanners();
};

function renderPreviewBanner() {
  $('preview-banner').innerHTML = bannerImagemForm ? `
    <div class="preview">
      <img src="${esc(bannerImagemForm.url || bannerImagemForm.previewUrl)}" alt="Prévia do banner">
      <button type="button" onclick="removerImagemBanner()" aria-label="Remover imagem">&#10005;</button>
    </div>` : '';
}

window.removerImagemBanner = () => {
  if (bannerImagemForm && bannerImagemForm.previewUrl) URL.revokeObjectURL(bannerImagemForm.previewUrl);
  bannerImagemForm = null;
  renderPreviewBanner();
};

// Atalhos de link: preenchem o campo em vez de o usuario digitar
document.querySelectorAll('.chip-link').forEach((chip) => {
  chip.addEventListener('click', () => {
    $('b-link').value = chip.dataset.link;
    $('b-link').focus();
  });
});

$('btn-novo-banner').addEventListener('click', () => abrirFormBanner(null));
$('btn-fechar-banner').addEventListener('click', fecharFormBanner);
$('btn-cancelar-banner').addEventListener('click', fecharFormBanner);
$('modal-banner-fundo').addEventListener('click', (e) => { if (e.target === e.currentTarget) fecharFormBanner(); });
$('btn-add-banner-img').addEventListener('click', () => $('b-imagem').click());

$('b-imagem').addEventListener('change', () => {
  const file = $('b-imagem').files[0];
  if (file && file.type.startsWith('image/')) {
    if (bannerImagemForm && bannerImagemForm.previewUrl) URL.revokeObjectURL(bannerImagemForm.previewUrl);
    bannerImagemForm = { file, previewUrl: URL.createObjectURL(file) };
    renderPreviewBanner();
  }
  $('b-imagem').value = '';
});

$('form-banner').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!bannerImagemForm) { toast('Escolha a imagem do banner.'); return; }

  const btn = $('btn-salvar-banner');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    let imagem = bannerImagemForm.url;
    if (!imagem) {
      $('banner-status').textContent = 'Enviando imagem...';
      imagem = await uploadImagem(bannerImagemForm.file, 'banners/', 1920, 0.85);
      $('banner-status').textContent = '';
    }

    const registro = {
      titulo: $('b-titulo').value.trim() || null,
      link: $('b-link').value.trim() || null,
      ordem: Number($('b-ordem').value || 0),
      ativo: $('b-ativo').checked,
      imagem,
    };

    const id = $('b-id').value;
    const { error } = id
      ? await sb.from('banners').update(registro).eq('id', id)
      : await sb.from('banners').insert(registro);
    if (error) throw error;

    toast(id ? 'Banner atualizado!' : 'Banner criado!');
    fecharFormBanner();
    carregarBanners();
  } catch (err) {
    console.error(err);
    $('banner-status').textContent = '';
    toast(err.message || 'Erro ao salvar o banner.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar banner';
  }
});

// ============================================================
// Cidades da página inicial
// ============================================================
let cidades = [];
let cidadeImagemForm = null; // { url } já enviada ou { file, previewUrl } nova

async function carregarCidades() {
  const { data, error } = await sb
    .from('cidades')
    .select('*')
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true });
  if (error) {
    $('lista-cidades').innerHTML = '<p style="color:var(--vermelho);">Erro ao carregar cidades.</p>';
    console.error(error);
    return;
  }
  cidades = data || [];
  renderCidades();
}

function renderCidades() {
  if (!cidades.length) {
    $('lista-cidades').innerHTML = '<p style="color:var(--cinza-500);">Nenhuma cidade cadastrada. Clique em "+ Nova cidade" para criar a primeira.</p>';
    return;
  }
  const qtdPorCidade = {};
  for (const i of imoveis) {
    if (i.cidade && i.ativo) qtdPorCidade[i.cidade] = (qtdPorCidade[i.cidade] || 0) + 1;
  }
  $('lista-cidades').innerHTML = cidades.map((c) => {
    const qtd = qtdPorCidade[c.nome] || 0;
    const foto = c.imagem
      ? `<img src="${esc(c.imagem)}" alt="">`
      : '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
    return `
      <div class="linha-imovel ${c.ativo ? '' : 'inativo'}">
        <div class="linha-foto">${foto}</div>
        <div class="linha-info">
          <h3>${esc(c.nome)}</h3>
          <div class="meta">
            <span>Ordem: ${c.ordem}</span>
            <span>${qtd} imóve${qtd === 1 ? 'l' : 'is'} ativo${qtd === 1 ? '' : 's'}</span>
            ${qtd === 0 ? '<span class="etiqueta oculto">Sem imóveis — não aparece no site</span>' : ''}
            ${c.ativo ? '' : '<span class="etiqueta oculto">Oculta</span>'}
          </div>
        </div>
        <div class="linha-acoes">
          <button class="btn btn-borda btn-mini" onclick="editarCidade('${c.id}')">Editar</button>
          <button class="btn btn-cinza btn-mini" onclick="alternarCidade('${c.id}')">${c.ativo ? 'Ocultar' : 'Publicar'}</button>
          <button class="btn btn-vermelho btn-mini" onclick="excluirCidade('${c.id}')">Excluir</button>
        </div>
      </div>`;
  }).join('');
}

function abrirFormCidade(cidade) {
  cidadeImagemForm = null;
  $('form-cidade').reset();
  $('c-id').value = '';
  $('c-ativo').checked = true;
  $('c-ordem').value = 0;
  $('cidade-status').textContent = '';

  if (cidade) {
    $('form-cidade-titulo').textContent = 'Editar cidade';
    $('c-id').value = cidade.id;
    $('c-nome').value = cidade.nome || '';
    $('c-ordem').value = cidade.ordem ?? 0;
    $('c-ativo').checked = !!cidade.ativo;
    if (cidade.imagem) cidadeImagemForm = { url: cidade.imagem };
  } else {
    $('form-cidade-titulo').textContent = 'Nova cidade';
  }

  renderPreviewCidade();
  $('modal-cidade-fundo').classList.add('aberto');
  document.body.style.overflow = 'hidden';
}

function fecharFormCidade() {
  $('modal-cidade-fundo').classList.remove('aberto');
  document.body.style.overflow = '';
}

window.editarCidade = (id) => {
  const c = cidades.find((x) => x.id === id);
  if (c) abrirFormCidade(c);
};

window.alternarCidade = async (id) => {
  const c = cidades.find((x) => x.id === id);
  if (!c) return;
  const { error } = await sb.from('cidades').update({ ativo: !c.ativo }).eq('id', id);
  if (error) { toast('Erro ao atualizar a cidade.'); console.error(error); return; }
  toast(!c.ativo ? 'Cidade publicada!' : 'Cidade oculta.');
  carregarCidades();
};

window.excluirCidade = async (id) => {
  const c = cidades.find((x) => x.id === id);
  if (!c) return;
  if (!confirm(`Excluir a cidade "${c.nome}"?\nOs imóveis dela não são afetados.`)) return;
  const { error } = await sb.from('cidades').delete().eq('id', id);
  if (error) { toast('Erro ao excluir a cidade.'); console.error(error); return; }
  if (c.imagem) {
    const caminho = caminhoStorage(c.imagem);
    if (caminho) await sb.storage.from('fotos').remove([caminho]);
  }
  toast('Cidade excluída.');
  carregarCidades();
};

function renderPreviewCidade() {
  $('preview-cidade').innerHTML = cidadeImagemForm ? `
    <div class="preview">
      <img src="${esc(cidadeImagemForm.url || cidadeImagemForm.previewUrl)}" alt="Prévia da foto">
      <button type="button" onclick="removerImagemCidade()" aria-label="Remover foto">&#10005;</button>
    </div>` : '';
}

window.removerImagemCidade = () => {
  if (cidadeImagemForm && cidadeImagemForm.previewUrl) URL.revokeObjectURL(cidadeImagemForm.previewUrl);
  cidadeImagemForm = null;
  renderPreviewCidade();
};

$('btn-nova-cidade').addEventListener('click', () => abrirFormCidade(null));
$('btn-fechar-cidade').addEventListener('click', fecharFormCidade);
$('btn-cancelar-cidade').addEventListener('click', fecharFormCidade);
$('modal-cidade-fundo').addEventListener('click', (e) => { if (e.target === e.currentTarget) fecharFormCidade(); });
$('btn-add-cidade-img').addEventListener('click', () => $('c-imagem').click());

$('c-imagem').addEventListener('change', () => {
  const file = $('c-imagem').files[0];
  if (file && file.type.startsWith('image/')) {
    if (cidadeImagemForm && cidadeImagemForm.previewUrl) URL.revokeObjectURL(cidadeImagemForm.previewUrl);
    cidadeImagemForm = { file, previewUrl: URL.createObjectURL(file) };
    renderPreviewCidade();
  }
  $('c-imagem').value = '';
});

$('form-cidade').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('btn-salvar-cidade');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    let imagem = cidadeImagemForm ? cidadeImagemForm.url : null;
    if (cidadeImagemForm && cidadeImagemForm.file) {
      $('cidade-status').textContent = 'Enviando foto...';
      imagem = await uploadImagem(cidadeImagemForm.file, 'cidades/', 1200, 0.82);
      $('cidade-status').textContent = '';
    }

    const registro = {
      nome: $('c-nome').value.trim(),
      ordem: Number($('c-ordem').value || 0),
      ativo: $('c-ativo').checked,
      imagem,
    };

    const id = $('c-id').value;
    const { error } = id
      ? await sb.from('cidades').update(registro).eq('id', id)
      : await sb.from('cidades').insert(registro);
    if (error) {
      if (error.code === '23505') throw new Error('Essa cidade já está cadastrada.');
      throw error;
    }

    toast(id ? 'Cidade atualizada!' : 'Cidade cadastrada!');
    fecharFormCidade();
    carregarCidades();
  } catch (err) {
    console.error(err);
    $('cidade-status').textContent = '';
    toast(err.message || 'Erro ao salvar a cidade.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar cidade';
  }
});

iniciar();
