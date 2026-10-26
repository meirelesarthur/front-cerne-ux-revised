// src/pages/Planos/Contratacao/catalog.ts
// -----------------------------------------------------------------------------
// CATÁLOGO COMERCIAL do GB Cerne (planos, faixas de tamanho, acessos, módulos avulsos, IA e
// GB Consult) — dados REAIS do documento "Precificação do GB Cerne" (artifact do time de produto,
// outubro/2026, valores ilustrativos de referência). Fonte única da página de contratação.
//
// TEMPORÁRIO: quando o backend expuser o catálogo (ex.: `GET /subscription/catalog`), este
// arquivo vira o *fallback/seed* e o contrato abaixo (`Catalog`) é o que a API deve devolver.
// Textos de produto (nomes/descrições) ficam aqui em PT-BR porque são conteúdo do catálogo,
// não "chrome" de interface (esse vai por i18n).
//
// Regras do documento preservadas:
//  - o preço do plano acompanha o TAMANHO da fazenda: 5 faixas, em cabeças ou hectares
//    (limites do legado); fazenda mista conta pela maior faixa; faixa 5 = ponto de partida
//    para proposta;
//  - acessos: Pro 5, Deluxe 10, Enterprise ilimitados; extra de R$ 25 no Pro e no Deluxe,
//    igual para qualquer perfil (administrativo ou operacional);
//  - módulo avulso tem o mesmo preço em qualquer plano abaixo daquele em que vem incluído;
//    `price: null` = não é vendido avulso (só existe a partir do plano `includedIn`);
//  - assistente de IA em todos os planos, com limite de uso por plano;
//  - GB Consult (consultoria fiscal/contábil) é opcional e cobrado à parte do software;
//  - cobrança anual = 10 meses pelo preço de 12 ("2 meses grátis").
// -----------------------------------------------------------------------------

export type PlanTier = 'Pro' | 'Deluxe' | 'Enterprise';

/** Medida do tamanho da fazenda: cabeças (rebanho) ou hectares (área). */
export type SizeUnit = 'cab' | 'ha';

/** `Nenhum` = nenhum plano inclui o módulo (só avulso). */
export type IncludedIn = PlanTier | 'Nenhum';

export interface CatalogModule {
  key: string;
  name: string;
  description: string;
  /** Plano em que o módulo já vem incluído. */
  includedIn: IncludedIn;
  /** Preço avulso (R$/mês) abaixo desse plano; `null` = não vendido avulso. */
  price: number | null;
}

export interface SizeUnitInfo {
  /** Limites superiores das faixas 1 a 4 (a faixa 5 é "acima do último"). */
  limits: [number, number, number, number];
  /** Fim da régua do controle deslizante. */
  max: number;
  /** Palavra no plural, para textos. */
  word: string;
  /** Abreviação curta. */
  short: string;
}

export interface ConsultOption {
  key: string;
  name: string;
  /** R$/mês; 0 = sem serviço. */
  price: number;
  description: string;
}

export interface AiLimit {
  /** Mensagens por janela de 5 horas. */
  perWindow: number;
  /** Cota mensal em milhões de tokens. */
  monthlyTokensMi: number;
  /** Mensagens equivalentes à cota mensal (~1.500 tokens por mensagem). */
  approxMessages: number;
}

export interface Catalog {
  tiers: PlanTier[];
  sizeUnits: Record<SizeUnit, SizeUnitInfo>;
  /** Preço base (R$/mês) do plano em cada uma das 5 faixas. */
  bandPrice: Record<PlanTier, [number, number, number, number, number]>;
  /** Acessos incluídos (`Infinity` = ilimitados). */
  seatsIncluded: Record<PlanTier, number>;
  /** Preço do acesso extra (R$/mês). */
  extraSeatPrice: Record<PlanTier, number>;
  /** Atividades incluídas (informativo). */
  activitiesIncluded: Record<PlanTier, number | 'todas'>;
  /** Cor de identidade de cada plano (dado de marca do catálogo). */
  accent: Record<PlanTier, string>;
  /** Meses cobrados no plano anual (de 12). */
  annualBilledMonths: number;
  modules: CatalogModule[];
  consult: ConsultOption[];
  ai: Record<PlanTier, AiLimit>;
  /** Pacote extra de 1 mi de tokens (R$). */
  aiExtraPackPrice: number;
}

export const CATALOG: Catalog = {
  tiers: ['Pro', 'Deluxe', 'Enterprise'],
  sizeUnits: {
    cab: { limits: [500, 1500, 3000, 10000], max: 20000, word: 'cabeças', short: 'cab' },
    ha: { limits: [200, 800, 1500, 3000], max: 6000, word: 'hectares', short: 'ha' },
  },
  bandPrice: {
    Pro: [189, 349, 590, 990, 1590],
    Deluxe: [290, 490, 790, 1290, 1990],
    Enterprise: [590, 890, 1290, 1890, 2790],
  },
  seatsIncluded: { Pro: 5, Deluxe: 10, Enterprise: Infinity },
  extraSeatPrice: { Pro: 25, Deluxe: 25, Enterprise: 0 },
  activitiesIncluded: { Pro: 1, Deluxe: 2, Enterprise: 'todas' },
  accent: { Pro: '#047857', Deluxe: '#9a6408', Enterprise: '#3c4a9e' },
  annualBilledMonths: 10,
  aiExtraPackPrice: 29,
  ai: {
    Pro: { perWindow: 30, monthlyTokensMi: 1, approxMessages: 650 },
    Deluxe: { perWindow: 80, monthlyTokensMi: 3, approxMessages: 2000 },
    Enterprise: { perWindow: 200, monthlyTokensMi: 10, approxMessages: 6600 },
  },
  consult: [
    { key: 'none', name: 'Sem serviço', price: 0, description: '' },
    { key: 'fis', name: 'Fiscal', price: 489, description: 'LCDPR mensal, IR do produtor, ITR e Funrural' },
    { key: 'faz', name: 'Fazenda', price: 1290, description: 'Fiscal + folha e eSocial rural, BPO financeiro básico e relatório por safra' },
    { key: 'cor', name: 'Corporativo', price: 3490, description: 'Escrita fiscal e contábil completa, consultoria tributária mensal e BPO completo' },
  ],
  modules: [
    { key: 'dre', name: 'DRE, custos e orçamento', includedIn: 'Deluxe', price: null, description: 'DRE mensal e anual, previsto × realizado, centro de custo, rateios, contratos e financiamentos, depreciação.' },
    { key: 'ofx', name: 'Conciliação bancária', includedIn: 'Deluxe', price: 79, description: 'Importação de OFX e extratos, conciliação de lançamentos, meses conciliados.' },
    { key: 'cte', name: 'CT-e e MDF-e', includedIn: 'Deluxe', price: 79, description: 'Emissão e manifestação de CT-e, emissão de MDF-e.' },
    { key: 'dom', name: 'Integração Domínio', includedIn: 'Deluxe', price: 99, description: 'Exportação de movimento bancário, contas a pagar e receber, NFS-e e CSV para a contabilidade.' },
    { key: 'rep', name: 'Reprodução', includedIn: 'Deluxe', price: 99, description: 'Estação de monta, touros e sêmen, protocolos, acasalamento, diagnóstico de gestação, genealogia.' },
    { key: 'fab', name: 'Fábrica de ração', includedIn: 'Deluxe', price: 79, description: 'Formulação, batidas e custo de produção da ração.' },
    { key: 'conf', name: 'Confinamento', includedIn: 'Deluxe', price: 199, description: 'Dietas, batidas, pátios, setores, currais, mapa e fases de alimentação.' },
    { key: 'bal', name: 'Balança e contratos', includedIn: 'Deluxe', price: 149, description: 'Pesagem rodoviária, descontos e classificação, contratos de venda de grãos.' },
    { key: 'car', name: 'Carregamento (fruta)', includedIn: 'Deluxe', price: 149, description: 'Cargas, fechamento semanal, contas a pagar e receber do carregamento.' },
    { key: 'sup', name: 'Compras (Suprimentos)', includedIn: 'Enterprise', price: 290, description: 'Solicitação, cotação com fornecedores, autorização por alçada, compra, recebimento, SLA e savings.' },
    { key: 'ven', name: 'Vendas e pedidos', includedIn: 'Enterprise', price: 190, description: 'Orçamentos, pedidos, vendas e relatórios por cliente, produto e vendedor.' },
    { key: 'os', name: 'Ordens de serviço', includedIn: 'Enterprise', price: 149, description: 'Abertura e acompanhamento de OS, monitoramento, avaliações, serviços e estornos.' },
    { key: 'pes', name: 'Gestão de pessoal', includedIn: 'Enterprise', price: 149, description: 'Eventos, funções, equipes, faltas, adiantamentos, apuração mensal e folha para o Domínio.' },
    { key: 'doc', name: 'Gestão documental', includedIn: 'Enterprise', price: 79, description: 'Tipos de documento e repositório com vencimentos.' },
    { key: 'ras', name: 'Rastreabilidade e site', includedIn: 'Enterprise', price: 190, description: 'Rastreio de produtos por lote e site público da fazenda.' },
  ],
};

/** Descrição do que cada plano inclui (texto do catálogo). */
export const PLAN_DESCRIPTION: Record<PlanTier, string> = {
  Pro: 'Financeiro (pagar, receber, caixa e bancos), estoque e entradas por NF, emissão de NF-e e LCDPR, frota e bens, cadastros, operação da atividade, 61 relatórios e painéis essenciais.',
  Deluxe:
    'Tudo do Pro, mais DRE, centro de custo, orçamento e depreciação, e todos os módulos do Deluxe (conciliação, CT-e/MDF-e, Domínio, reprodução, confinamento, fábrica, balança, carregamento).',
  Enterprise:
    'Tudo do Deluxe, mais todos os módulos do Enterprise (compras, vendas, OS, pessoal, documentos, rastreabilidade), implantação dedicada e suporte com SLA.',
};

/** Destaques de cada plano para o resumo dos planos (conteúdo do catálogo). */
export const PLAN_HIGHLIGHTS: Record<PlanTier, { inherits: string | null; items: string[] }> = {
  Pro: {
    inherits: null,
    items: [
      'Assistente de IA, uso básico',
      'Financeiro, caixa e bancos',
      'Estoque e entradas por NF',
      'Emissão de NF-e e LCDPR',
      'Frota e bens',
      'Cadastros e relatórios',
      'Rebanho, lavoura ou pomar',
    ],
  },
  Deluxe: {
    inherits: 'Pro',
    items: [
      'Assistente de IA, uso ampliado',
      'DRE, centro de custo, orçamento',
      'Depreciação e contabilidade',
      'Conciliação bancária',
      'CT-e, MDF-e e Domínio',
      'Reprodução e confinamento',
      'Balança e carregamento',
    ],
  },
  Enterprise: {
    inherits: 'Deluxe',
    items: [
      'Assistente de IA, uso máximo',
      'Compras com cotação e alçada',
      'Vendas e pedidos',
      'Ordens de serviço',
      'Gestão de pessoal',
      'Documentos e rastreabilidade',
      'Implantação e suporte com SLA',
    ],
  },
};
