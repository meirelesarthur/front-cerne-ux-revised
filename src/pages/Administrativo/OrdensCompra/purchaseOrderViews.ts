// src/pages/Administrativo/OrdensCompra/purchaseOrderViews.ts
// Visões da tela única "Ordens de compra" (decisão do dono, 24/11/2026: todas as
// telas de solicitação convergem numa só). Cada visão é uma das listas atuais,
// com o mesmo endpoint, a mesma permissão e as mesmas ações. Enquanto a API não
// tem `scope` e `status[]` no `GET /request-purchases`, a visão é o escopo.
// Mapa de impacto: docs/ux/funcionalidades/ordem-de-compra-unica-e-tipos-de-servico.md §3.

import { requestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';

export type PurchaseOrderViewKey =
  | 'todas'
  | 'minhas'
  | 'responsabilidade'
  | 'aprovar'
  | 'cotacao'
  | 'compra'
  | 'recebimento'
  | 'rejeitadas'
  | 'canceladas';

export interface PurchaseOrderView {
  key: PurchaseOrderViewKey;
  /** Permissão de leitura da lista de origem (a mesma da rota antiga). */
  permission: string;
  /** Rota antiga da mesma lista, mantida para links do sino e do app. */
  legacyPath: string;
  /** Filtro que a visão impõe à lista de origem (ex.: situação, escopo). */
  fixedFilter?: { status?: number; scope?: 'all' };
}

/**
 * Ordem das visões: "Todas" (padrão, decisão do dono 25/11) e depois o caminho
 * da ordem (pedir → aprovar → cotar → comprar → receber → encerrar).
 */
export const PURCHASE_ORDER_VIEWS: readonly PurchaseOrderView[] = [
  // Mesma lista de "Criadas por mim" com `scope=all` (depende da API).
  {
    key: 'todas',
    permission: 'request-purchases_view',
    legacyPath: '/administrativo/solicitacao',
    fixedFilter: { scope: 'all' },
  },
  { key: 'minhas', permission: 'request-purchases_view', legacyPath: '/administrativo/solicitacao' },
  { key: 'responsabilidade', permission: 'request-purchases_view', legacyPath: '/administrativo/meus-processos' },
  { key: 'aprovar', permission: 'request-authorization_view', legacyPath: '/administrativo/autorizacao' },
  { key: 'cotacao', permission: 'request-quotation_view', legacyPath: '/administrativo/cotacoes' },
  { key: 'compra', permission: 'request-buy_view', legacyPath: '/administrativo/compras' },
  { key: 'recebimento', permission: 'request-receipts_view', legacyPath: '/administrativo/recebimentos' },
  // A lista de rejeitados traz as duas situações; a visão fixa uma (25/11).
  {
    key: 'rejeitadas',
    permission: 'rejected-requests_view',
    legacyPath: '/administrativo/rejeitados',
    fixedFilter: { status: requestPurchaseStatus.pedidoNaoAprovado },
  },
  {
    key: 'canceladas',
    permission: 'rejected-requests_view',
    legacyPath: '/administrativo/rejeitados',
    fixedFilter: { status: requestPurchaseStatus.pedidoCancelado },
  },
];

/** Visões antigas que ainda podem chegar pela URL (favoritos, sino). */
const VIEW_ALIASES: Record<string, PurchaseOrderViewKey> = { encerradas: 'rejeitadas' };

/** Todas as permissões que abrem a tela única (basta uma). */
export const PURCHASE_ORDER_PERMISSIONS: string[] = Array.from(
  new Set(PURCHASE_ORDER_VIEWS.map((view) => view.permission))
);

export const PURCHASE_ORDERS_PATH = '/administrativo/ordens-de-compra';

/** Parâmetro da URL que guarda a visão aberta (`?visao=compra`). */
export const VIEW_PARAM = 'visao';

export function visiblePurchaseOrderViews(can: (permission: string) => boolean): PurchaseOrderView[] {
  return PURCHASE_ORDER_VIEWS.filter((view) => can(view.permission));
}

/**
 * Visão a abrir: a da URL, se a pessoa pode vê-la; senão a primeira permitida.
 * `undefined` só quando nenhuma é permitida (a rota já barra esse caso).
 */
export function resolvePurchaseOrderView(
  requested: string | null | undefined,
  visible: PurchaseOrderView[]
): PurchaseOrderViewKey | undefined {
  const key = (requested && VIEW_ALIASES[requested]) || requested;
  const match = visible.find((view) => view.key === key);
  return (match ?? visible[0])?.key;
}

export function purchaseOrderViewPath(key: PurchaseOrderViewKey): string {
  return `${PURCHASE_ORDERS_PATH}?${VIEW_PARAM}=${key}`;
}
