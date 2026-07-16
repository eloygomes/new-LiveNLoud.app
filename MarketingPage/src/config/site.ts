export type CtaMode = 'WAITLIST' | 'TRIAL' | 'CHECKOUT';

const env = import.meta.env;
const ctaMode = (env.PUBLIC_CTA_MODE || 'WAITLIST') as CtaMode;

export const site = {
  name: 'Sustenido',
  url: env.PUBLIC_SITE_URL || 'https://sustenido.app',
  appUrl: env.PUBLIC_APP_URL || '',
  contactEmail: env.PUBLIC_CONTACT_EMAIL || '',
  analyticsId: env.PUBLIC_ANALYTICS_ID || '',
  cta: {
    mode: ctaMode,
    url: env.PUBLIC_CTA_URL || '',
    labels: {
      WAITLIST: 'Quero conhecer o Sustenido',
      TRIAL: 'Começar agora',
      CHECKOUT: 'Assinar o Sustenido',
    } satisfies Record<CtaMode, string>,
  },
  extension: {
    available: env.PUBLIC_CHROME_EXTENSION_AVAILABLE === 'true',
    url: env.PUBLIC_CHROME_EXTENSION_URL || '',
  },
} as const;

export const navItems = [
  ['Produto', '#produto'],
  ['Recursos', '#recursos'],
  ['Para quem', '#para-quem'],
  ['FAQ', '#faq'],
] as const;

export const faqs = [
  ['Para quem é o Sustenido?', 'Para músicos, bandas e outras rotinas musicais que precisam reunir repertório, materiais, estudo e ensaio em um único workspace.'],
  ['Como adiciono músicas usando a extensão do Chrome?', 'A extensão foi pensada para capturar uma música enquanto você navega. O link público será exibido aqui assim que a publicação na Chrome Web Store for confirmada.'],
  ['Preciso instalar alguma coisa?', 'O workspace funciona no navegador. Alguns recursos, como a extensão e conexões MIDI, dependem do ambiente e do dispositivo usados.'],
  ['Funciona no celular e no computador?', 'A experiência é responsiva e foi desenhada para celulares, tablets e computadores. A disponibilidade de recursos específicos pode variar por navegador.'],
  ['Posso organizar por instrumento e setlist?', 'Sim. Você pode reunir partes por instrumento, links, arquivos, vídeos, notas e organizar músicas em setlists.'],
  ['Como ajuda durante apresentações ao vivo?', 'O modo LIVE mantém repertório e materiais acessíveis durante a performance e pode receber comandos mapeados por pedal MIDI.'],
  ['O pedal funciona por Bluetooth?', 'Em dispositivos e navegadores compatíveis, a conexão pode ser sem fio. Consulte o guia de compatibilidade antes de usar no palco.'],
  ['O que funciona offline?', 'O escopo exato do modo offline será detalhado na documentação oficial antes do lançamento comercial.'],
  ['Quando os planos estarão disponíveis?', 'Os planos ainda estão sendo definidos. Entre na lista de interesse para acompanhar as novidades sem valores ou condições fictícias.'],
] as const;
