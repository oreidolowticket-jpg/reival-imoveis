// ============================================================
// Reival Imóveis — Página Sobre
// Só menu e contatos: a página é estática, não consulta o banco.
// ============================================================
const zapLink = (msg) => `https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(msg)}`;

document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('nav').classList.toggle('aberto');
});

(function contatos() {
  const msgGeral = 'Olá! Vim pelo site Reival Imóveis e gostaria de mais informações.';
  const msgAnuncio = 'Olá! Gostaria de anunciar meu imóvel com a Reival Imóveis.';
  const msgRicardo = 'Olá, Ricardo! Vim pela página Sobre do site e gostaria de conversar.';

  document.getElementById('topbar-telefone').href = zapLink(msgGeral);
  document.getElementById('topbar-telefone').innerHTML = `${ICONES_CONTATO.whatsapp}${CONFIG.TELEFONE_EXIBICAO}`;
  document.getElementById('topbar-instagram').href = CONFIG.INSTAGRAM;
  const topEmail = document.getElementById('topbar-email');
  topEmail.href = `mailto:${CONFIG.EMAIL_CONTATO}`;
  topEmail.innerHTML = `${ICONES_CONTATO.email}${CONFIG.EMAIL_CONTATO}`;

  document.getElementById('zap-flutuante').href = zapLink(msgGeral);
  document.getElementById('nav-anunciar').href = zapLink(msgAnuncio);
  document.getElementById('cta-ricardo').href = zapLink(msgRicardo);

  document.getElementById('rodape-telefone').textContent = CONFIG.TELEFONE_EXIBICAO;
  document.getElementById('rodape-email').innerHTML = `<a href="mailto:${CONFIG.EMAIL_CONTATO}">${CONFIG.EMAIL_CONTATO}</a>`;
  document.getElementById('rodape-instagram').innerHTML = `<a href="${CONFIG.INSTAGRAM}" target="_blank" rel="noopener">${CONFIG.INSTAGRAM_USUARIO}</a>`;
  document.getElementById('rodape-cidade').textContent = CONFIG.CIDADE;
  document.getElementById('ano').textContent = new Date().getFullYear();
})();
