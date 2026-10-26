// src/pages/Planos/Contratacao/catalog.ts
// -----------------------------------------------------------------------------
// CATÁLOGO COMERCIAL do GB Cerne (planos, acessos e módulos avulsos) — dados REAIS
// da proposta de precificação "Cerne Planos e Precificação" (artifact do time de
// produto, referência: legado em 02/06/2026). Fonte única da página de contratação.
//
// TEMPORÁRIO: quando o backend expuser o catálogo (ex.: `GET /subscription/catalog`),
// este arquivo vira o *fallback/seed* e o contrato abaixo (`Catalog`) é o que a API
// deve devolver. Textos de produto (nomes/descrições de módulos) ficam aqui em PT-BR
// porque são conteúdo do catálogo, não "chrome" de interface (esse vai por i18n).
//
// Regras do artifact preservadas:
//  - valor do plano é FLAT (sem porte): Pro 349 · Deluxe 490 · Enterprise 890;
//  - acesso extra custa o mesmo para qualquer perfil (administrativo ou operacional);
//  - módulo avulso tem o mesmo preço em qualquer plano abaixo daquele em que vem incluído;
//    `price: null` = não é vendido avulso (só existe a partir do plano `includedIn`);
//  - cobrança anual = 10 meses pelo preço de 12 ("2 meses grátis").
// -----------------------------------------------------------------------------

export type PlanTier = 'Pro' | 'Deluxe' | 'Enterprise';

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

export interface Catalog {
  tiers: PlanTier[];
  /** Valor base (R$/mês), sem porte. */
  basePrice: Record<PlanTier, number>;
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
}

export const CATALOG: Catalog = {
  tiers: ['Pro', 'Deluxe', 'Enterprise'],
  basePrice: { Pro: 349, Deluxe: 490, Enterprise: 890 },
  seatsIncluded: { Pro: 3, Deluxe: 5, Enterprise: 10 },
  extraSeatPrice: { Pro: 39, Deluxe: 35, Enterprise: 29 },
  activitiesIncluded: { Pro: 1, Deluxe: 2, Enterprise: 'todas' },
  accent: { Pro: '#047857', Deluxe: '#9a6408', Enterprise: '#3c4a9e' },
  annualBilledMonths: 10,
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
    { key: 'abc', name: 'Programa ABC Corte', includedIn: 'Nenhum', price: 149, description: 'Indicadores e transferências do programa ABC Corte.' },
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
