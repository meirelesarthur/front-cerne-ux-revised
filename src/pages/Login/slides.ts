// Carrossel institucional do Login — copy e vídeos oficiais do design system
// (`cerne/src/pages/Login.tsx`). Os vídeos vêm do CDN público do acervo do DS.

const CDN = 'https://pub-0f1e695318f140f895ccdb13696c1c62.r2.dev';

export interface LoginSlide {
  src: string;
  eyebrow: string;
  h1a: string;
  h1em: string;
  h1b: string;
  desc: string;
}

export const LOGIN_SLIDES: LoginSlide[] = [
  {
    src: `${CDN}/cafe.mp4`,
    eyebrow: 'Cafeicultura de precisão',
    h1a: 'Sua safra de café,',
    h1em: 'gerenciada',
    h1b: 'com precisão.',
    desc: 'Do campo ao escritório, controle produção, custos, colheita e equipes em uma plataforma pensada para o agronegócio brasileiro.',
  },
  {
    src: `${CDN}/Gado.mp4`,
    eyebrow: 'Pecuária de corte',
    h1a: 'Rebanho e pastagem',
    h1em: 'monitorados',
    h1b: 'em tempo real.',
    desc: 'Gerencie lotes, manejo e sanidade animal com rastreabilidade completa do campo até o abate.',
  },
  {
    src: `${CDN}/confinamento.mov`,
    eyebrow: 'Confinamento inteligente',
    h1a: 'Cochos e currais',
    h1em: 'controlados',
    h1b: 'sem esforço.',
    desc: 'Ciclos de produção, conversão alimentar e lotação de currais integrados em um único painel.',
  },
  {
    src: `${CDN}/plantation.mov`,
    eyebrow: 'Agricultura moderna',
    h1a: 'Plantio e colheita',
    h1em: 'acompanhados',
    h1b: 'do plantio à venda.',
    desc: 'Rastreie cada talhão, controle insumos, safras e produtividade com registros precisos e auditáveis.',
  },
  {
    src: `${CDN}/soja.mp4`,
    eyebrow: 'Grãos e commodities',
    h1a: 'Lavouras de soja',
    h1em: 'gerenciadas',
    h1b: 'com inteligência.',
    desc: 'Controle produtividade, armazenagem e comercialização com análises automáticas e alertas em tempo real.',
  },
];

export const LOGIN_STATS = [
  { value: '2.400+', label: 'Fazendas ativas' },
  { value: 'R$ 4,2B', label: 'Em produção gerenciada' },
  { value: '99,7%', label: 'Uptime SLA garantido' },
];
