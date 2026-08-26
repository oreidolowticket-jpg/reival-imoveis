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
  whatsapp: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  email: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>',
};
