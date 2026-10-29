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
//  - assistente GIA embutida em todos os planos, em 3 níveis (Suporte, Consulta, Execução), cada
//    um com uma janela diária de mensagens POR PESSOA (60 · 100 · 150); passou da janela a GIA
//    economiza recursos em vez de bloquear; pacote extra opcional de mensagens;
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

/** Nível da GIA (assistente de IA) de cada plano. */
export type GiaLevel = 'Suporte' | 'Consulta' | 'Execução';

/** Situação de cada capacidade: já existe, será construída ou ainda não decidida. */
export type GiaStatus = 'available' | 'build' | 'decide';

export interface GiaCapability {
  /** Parte em negrito (opcional), seguida do texto. */
  title?: string;
  text: string;
  status: GiaStatus;
}

export interface GiaTier {
  level: GiaLevel;
  /** Mensagens por dia, por pessoa, em uso normal (a "janela"). */
  window: number;
  /** Mensagens por dia, por pessoa, em modo economia (depois da janela). */
  economy: number;
  /** Nível que este inclui ("Tudo do …"). */
  inherits: GiaLevel | null;
  capabilities: GiaCapability[];
}

/** Modelo de uso e custo da GIA (medido em produção, 27/10/2026; valores aproximados). */
export interface GiaModel {
  /** R$ por mensagem em cada modo (normal · economia · reduzido). */
  costPerMessage: { normal: number; economy: number; reduced: number };
  /** Margem sobre o custo da IA (0 a 1) para o repasse mínimo. */
  margin: number;
  /** Mensagens por pessoa por dia no uso típico e no pior caso. */
  typicalPerDay: number;
  worstPerDay: number;
  daysPerMonth: number;
  /** Pacote extra opcional: R$ e quantidade de mensagens. */
  extraPackPrice: number;
  extraPackMessages: number;
  tiers: Record<PlanTier, GiaTier>;
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
  /** Assistente GIA: níveis, janelas e custo. */
  gia: GiaModel;
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
  // tokens de tema (`planPro`…): a cor de marca no claro e a versão clara no escuro
  accent: { Pro: 'var(--chakra-colors-plan-pro)', Deluxe: 'var(--chakra-colors-plan-deluxe)', Enterprise: 'var(--chakra-colors-plan-enterprise)' },
  annualBilledMonths: 10,
  gia: {
    costPerMessage: { normal: 0.0038, economy: 0.0031, reduced: 0.0023 },
    margin: 0.7,
    typicalPerDay: 20,
    worstPerDay: 480,
    daysPerMonth: 30,
    extraPackPrice: 29,
    extraPackMessages: 1000,
    tiers: {
      Pro: {
        level: 'Suporte',
        window: 60,
        economy: 100,
        inherits: null,
        capabilities: [
          { text: 'Dúvidas de uso pela documentação do sistema', status: 'available' },
          { text: 'Passo a passo de telas, campos e erros comuns', status: 'available' },
          { text: 'Leitura de print de tela com erro', status: 'available' },
          { text: 'Abre chamado com o resumo quando não resolve', status: 'available' },
          { text: 'Consulta simples ao sistema (opcional, gasta mais mensagens da janela)', status: 'decide' },
        ],
      },
      Deluxe: {
        level: 'Consulta',
        window: 100,
        economy: 60,
        inherits: 'Suporte',
        capabilities: [
          { title: 'Consultas aos dados do cliente', text: 'saldos, notas, contratos, títulos, estoque e animais, em linguagem natural', status: 'available' },
          { text: 'Explica números e indicadores e compara períodos', status: 'available' },
          { title: 'GIA no WhatsApp', text: 'mesmas consultas pelo celular, no campo e na estrada', status: 'build' },
          { text: 'Áudio no WhatsApp: a pessoa fala e a GIA entende (conta na janela como qualquer mensagem)', status: 'build' },
        ],
      },
      Enterprise: {
        level: 'Execução',
        window: 150,
        economy: 25,
        inherits: 'Consulta',
        capabilities: [
          { title: 'Executa operações com confirmação', text: 'lança despesa, dá baixa em título, cria pedido, registra pesagem ou manejo, prepara NF-e para revisão', status: 'build' },
          { title: 'Documentos viram lançamento', text: 'foto de nota, romaneio ou boleto é lida e o lançamento sai pronto para confirmar', status: 'build' },
          { title: 'Rotinas e alertas', text: 'resumo diário da fazenda, títulos a vencer, estoque baixo, MDF-e não encerrado, enviados no WhatsApp', status: 'build' },
          { title: 'Análises para a gestão', text: 'previsto × realizado, custo por cabeça ou por hectare, tendências, em relatório pronto', status: 'build' },
        ],
      },
    },
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
    { key: 'orc', name: 'Planejamento e orçamento', includedIn: 'Deluxe', price: 79, description: 'Planejamento agrícola e pecuário, previsão orçamentária.' },
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
    { key: 'emi', name: 'Emissor fiscal adicional', includedIn: 'Nenhum', price: 29, description: 'CNPJ ou inscrição estadual a mais para emissão de NF-e.' },
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
      'GIA Suporte: 60 mensagens/dia por pessoa',
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
      'GIA Consulta: 100 mensagens/dia por pessoa',
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
      'GIA Execução: 150 mensagens/dia por pessoa',
      'Compras com cotação e alçada',
      'Vendas e pedidos',
      'Ordens de serviço',
      'Gestão de pessoal',
      'Documentos e rastreabilidade',
      'Implantação e suporte com SLA',
    ],
  },
};
