// src/pages/Administrativo/OrdensCompra/purchaseOrderViews.ts
// Visões da tela única "Ordens de compra" (decisão do dono, 24/11/2026: todas as
// telas de solicitação convergem numa só). Cada visão é uma das listas atuais,
// com o mesmo endpoint, a mesma permissão e as mesmas ações. Enquanto a API não
// tem `scope` e `status[]` no `GET /request-purchases`, a visão é o escopo.
// Mapa de impacto: docs/ux/funcionalidades/ordem-de-compra-unica-e-tipos-de-servico.md §3.

export type PurchaseOrderViewKey =
  | 'minhas'
  | 'responsabilidade'
  | 'aprovar'
  | 'cotacao'
  | 'compra'
  | 'recebimento'
  | 'encerradas';

export interface PurchaseOrderView {
  key: PurchaseOrderViewKey;
  /** Permissão de leitura da lista de origem (a mesma da rota antiga). */
  permission: string;
  /** Rota antiga da mesma lista, mantida para links do sino e do app. */
  legacyPath: string;
}

/** Ordem das abas: o caminho da ordem (pedir → aprovar → cotar → comprar → receber → encerrar). */
export const PURCHASE_ORDER_VIEWS: readonly PurchaseOrderView[] = [
  { key: 'minhas', permission: 'request-purchases_view', legacyPath: '/administrativo/solicitacao' },
  { key: 'responsabilidade', permission: 'request-purchases_view', legacyPath: '/administrativo/meus-processos' },
  { key: 'aprovar', permission: 'request-authorization_view', legacyPath: '/administrativo/autorizacao' },
  { key: 'cotacao', permission: 'request-quotation_view', legacyPath: '/administrativo/cotacoes' },
  { key: 'compra', permission: 'request-buy_view', legacyPath: '/administrativo/compras' },
  { key: 'recebimento', permission: 'request-receipts_view', legacyPath: '/administrativo/recebimentos' },
  { key: 'encerradas', permission: 'rejected-requests_view', legacyPath: '/administrativo/rejeitados' },
];

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
  const match = visible.find((view) => view.key === requested);
  return (match ?? visible[0])?.key;
}

export function purchaseOrderViewPath(key: PurchaseOrderViewKey): string {
  return `${PURCHASE_ORDERS_PATH}?${VIEW_PARAM}=${key}`;
}
