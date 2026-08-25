// ============================================================
// CaçapavaImóveis — Painel administrativo
// ============================================================
const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

let imoveis = [];
// Fotos do formulário: { url } para já enviadas, { file, previewUrl } para novas
let fotosForm = [];

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtPreco = (v) => v == null ? 'Consulte' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
}

$('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('btn-login');
  btn.disabled = true;
  btn.textContent = 'Entrando...';
  $('login-erro').classList.remove('visivel');

  const { data, error } = await sb.auth.signInWithPassword({
    email: $('login-email').value.trim(),
    password: $('login-senha').value,
  });

  btn.disabled = false;
  btn.textContent = 'Entrar';

  if (error) {
    $('login-erro').textContent = 'E-mail ou senha incorretos.';
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
async function carregarImoveis() {
  const { data, error } = await sb
    .from('imoveis')
    .select('*')
    .order('criado_em', { ascending: false });

  if (error) {
    $('lista-imoveis').innerHTML = '<p style="color:var(--vermelho);">Erro ao carregar imóveis. Recarregue a página.</p>';
    console.error(error);
    return;
  }
  imoveis = data || [];
  renderLista();
  renderResumo();
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
    ? imoveis.filter((i) => `${i.titulo} ${i.bairro || ''} ${i.codigo}`.toLowerCase().includes(termo))
    : imoveis;

  if (!lista.length) {
    $('lista-imoveis').innerHTML = '<p style="color:var(--cinza-500);">Nenhum imóvel encontrado.</p>';
    return;
  }

  $('lista-imoveis').innerHTML = lista.map((i) => {
    const fotos = Array.isArray(i.fotos) ? i.fotos : [];
    const foto = fotos.length
      ? `<img src="${esc(fotos[0])}" alt="">`
      : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>';
    return `
      <div class="linha-imovel ${i.ativo ? '' : 'inativo'}">
        <div class="linha-foto">${foto}</div>
        <div class="linha-info">
          <h3>${esc(i.titulo)}</h3>
          <div class="meta">
            <span>Cód. ${i.codigo}</span>
            <span>${esc(i.tipo)}${i.bairro ? ' · ' + esc(i.bairro) : ''}</span>
            <span class="preco">${fmtPreco(i.preco)}</span>
            <span class="etiqueta ${i.finalidade === 'Aluguel' ? 'aluguel' : 'venda'}">${esc(i.finalidade)}</span>
            ${i.destaque ? '<span class="etiqueta destaque">Destaque</span>' : ''}
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
  if (!confirm(`Excluir "${imovel.titulo}" (cód. ${imovel.codigo})?\nEssa ação não pode ser desfeita.`)) return;

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
    $('i-titulo').value = imovel.titulo || '';
    $('i-tipo').value = imovel.tipo || 'Casa';
    $('i-finalidade').value = imovel.finalidade || 'Venda';
    $('i-bairro').value = imovel.bairro || '';
    $('i-preco').value = imovel.preco ?? '';
    $('i-quartos').value = imovel.quartos ?? '';
    $('i-banheiros').value = imovel.banheiros ?? '';
    $('i-vagas').value = imovel.vagas ?? '';
    $('i-area').value = imovel.area ?? '';
    $('i-endereco').value = imovel.endereco || '';
    $('i-descricao').value = imovel.descricao || '';
    $('i-destaque').checked = !!imovel.destaque;
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

async function uploadFotos() {
  const urls = [];
  for (const f of fotosForm) {
    if (f.url) { urls.push(f.url); continue; }
    const ext = (f.file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const caminho = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await sb.storage.from('fotos').upload(caminho, f.file, { cacheControl: '3600', upsert: false });
    if (error) throw new Error(`Falha no upload de "${f.file.name}": ${error.message}`);
    const { data } = sb.storage.from('fotos').getPublicUrl(caminho);
    urls.push(data.publicUrl);
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
      titulo: $('i-titulo').value.trim(),
      tipo: $('i-tipo').value,
      finalidade: $('i-finalidade').value,
      bairro: $('i-bairro').value.trim() || null,
      preco: numOuNull('i-preco'),
      quartos: numOuNull('i-quartos'),
      banheiros: numOuNull('i-banheiros'),
      vagas: numOuNull('i-vagas'),
      area: numOuNull('i-area'),
      endereco: $('i-endereco').value.trim() || null,
      descricao: $('i-descricao').value.trim() || null,
      destaque: $('i-destaque').checked,
      aceita_financiamento: $('i-financiamento').checked,
      ativo: $('i-ativo').checked,
      fotos,
    };

    const id = $('i-id').value;
    const { error } = id
      ? await sb.from('imoveis').update(registro).eq('id', id)
      : await sb.from('imoveis').insert(registro);
    if (error) throw error;

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

iniciar();
