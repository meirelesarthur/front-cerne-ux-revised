// src/pages/Administrativo/Solicitacao/prototype/purchaseOrderCategories.ts
// -----------------------------------------------------------------------------
// PROTÓTIPO (lote 5, item 5 do plano — F2) — CATEGORIAS no lugar dos 11 tipos.
// Proposta para a apresentação (decisão 4 do plano: "propor na F0 a partir do
// uso real"); os nomes saem do i18n (`form.prototype.categories`).
//   Insumos ............ Produto (P), Emergencial (U), Compra efetuada (F)
//   Manutenção ......... Manutenção (M)
//   Serviços ........... Serviço (S), Empreitada (C), Diária (D)
//   Adiantamento e reembolso ... Adiantamento (A), Reembolso (R)
//   Despesas fixas ..... Despesas fixas (B)
//   Frete .............. Frete (E)
// Regra pura, testada.
// -----------------------------------------------------------------------------

import { requestPurchaseType } from '@/constants/RequestPurchases/request-purchase-type';

export type PurchaseOrderCategoryKey =
  | 'insumos'
  | 'manutencao'
  | 'servicos'
  | 'adiantamento'
  | 'despesasFixas'
  | 'frete';

export const PURCHASE_ORDER_CATEGORIES: { key: PurchaseOrderCategoryKey; types: string[] }[] = [
  {
    key: 'insumos',
    types: [requestPurchaseType.produto, requestPurchaseType.emergencial, requestPurchaseType.compraEfetuada],
  },
  { key: 'manutencao', types: [requestPurchaseType.manutencao] },
  {
    key: 'servicos',
    types: [requestPurchaseType.servico, requestPurchaseType.empreitada, requestPurchaseType.diaria],
  },
  { key: 'adiantamento', types: [requestPurchaseType.adiantamento, requestPurchaseType.reembolso] },
  { key: 'despesasFixas', types: [requestPurchaseType.despesaFixa] },
  { key: 'frete', types: [requestPurchaseType.frete] },
];

/** Categoria de um tipo atual; `null` para tipo desconhecido ou vazio. */
export function categoryOfType(type: string | null | undefined): PurchaseOrderCategoryKey | null {
  if (!type) return null;
  return PURCHASE_ORDER_CATEGORIES.find((category) => category.types.includes(type))?.key ?? null;
}
