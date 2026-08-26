// ============================================================
// CONFIGURAÇÃO DO SITE — Reival Imóveis
// Edite os valores abaixo quando precisar trocar contatos.
// ============================================================
const CONFIG = {
  SUPABASE_URL: 'https://vopmedyztnbrqckjoapd.supabase.co',
  SUPABASE_KEY: 'sb_publishable_lFB48IAS9IVMJV6mNf0Cnw_HtyfDI4-',

  // Número do WhatsApp com DDI+DDD, só dígitos
  WHATSAPP: '5512997232249',
  TELEFONE_EXIBICAO: '(12) 99723-2249',
  EMAIL_CONTATO: 'reivalimobiliario@gmail.com',
  INSTAGRAM: 'https://www.instagram.com/reival_imobiliario/',
  INSTAGRAM_USUARIO: '@reival_imobiliario',
  CIDADE: 'São Paulo e região',
};

// Ícones da barra de contatos do topo. Mesmo traço do ícone do Instagram
// que já está no HTML — herdam a cor do link, então acompanham o hover.
const ICONES_CONTATO = {
  whatsapp: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .5 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.5-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .7-.2 1l-2.3 2.2z"/></svg>',
  email: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>',
};
