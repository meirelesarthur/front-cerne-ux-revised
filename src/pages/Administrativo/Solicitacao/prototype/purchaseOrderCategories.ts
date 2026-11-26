// src/pages/Administrativo/Solicitacao/prototype/purchaseOrderCategories.ts
// -----------------------------------------------------------------------------
// PROTÓTIPO (lote 5, item 5 do plano — F2) — CATEGORIAS e MARCAÇÕES no lugar
// dos 11 tipos. Decisão 4 do plano (Pietro, 25/11/2026): 4 categorias + 2
// marcações; os nomes saem do i18n (`form.prototype.categories` e `marks`).
//   Produto ................... Produto (P)
//   Serviço ................... Serviço (S), Diária (D), Empreitada (C),
//                               Frete (E), Manutenção (M — ponto em aberto na F0)
//   Reembolso/adiantamento .... Reembolso (R), Adiantamento (A) — só financeiro
//   Despesa fixa .............. Despesa fixa (B)
// Marcações (deixam de ser tipo):
//   Urgência ...... Emergencial (U), perfil Simples
//   Regularização . Compra efetuada (F), pula a cotação
// Os pedidos antigos U e F eram de insumo; no protótipo caem em Produto e
// ganham a marcação. A nova OS entra em Serviço (Gera execução do Tipo de
// serviço, 26/11), sem categoria nova.
// Regra pura, testada.
// -----------------------------------------------------------------------------

import { requestPurchaseType } from '@/constants/RequestPurchases/request-purchase-type';

export type PurchaseOrderCategoryKey = 'produto' | 'servico' | 'reembolsoAdiantamento' | 'despesaFixa';

export type PurchaseOrderMarkKey = 'urgencia' | 'regularizacao';

export const PURCHASE_ORDER_CATEGORIES: { key: PurchaseOrderCategoryKey; types: string[] }[] = [
  {
    key: 'produto',
    types: [requestPurchaseType.produto, requestPurchaseType.emergencial, requestPurchaseType.compraEfetuada],
  },
  {
    key: 'servico',
    types: [
      requestPurchaseType.servico,
      requestPurchaseType.diaria,
      requestPurchaseType.empreitada,
      requestPurchaseType.frete,
      requestPurchaseType.manutencao,
    ],
  },
  { key: 'reembolsoAdiantamento', types: [requestPurchaseType.reembolso, requestPurchaseType.adiantamento] },
  { key: 'despesaFixa', types: [requestPurchaseType.despesaFixa] },
];

export const PURCHASE_ORDER_MARKS: { key: PurchaseOrderMarkKey; type: string }[] = [
  { key: 'urgencia', type: requestPurchaseType.emergencial },
  { key: 'regularizacao', type: requestPurchaseType.compraEfetuada },
];

/** Categoria de um tipo atual; `null` para tipo desconhecido ou vazio. */
export function categoryOfType(type: string | null | undefined): PurchaseOrderCategoryKey | null {
  if (!type) return null;
  return PURCHASE_ORDER_CATEGORIES.find((category) => category.types.includes(type))?.key ?? null;
}

/** Marcação que um tipo atual vira; `null` quando o tipo não vira marcação. */
export function markOfType(type: string | null | undefined): PurchaseOrderMarkKey | null {
  if (!type) return null;
  return PURCHASE_ORDER_MARKS.find((mark) => mark.type === type)?.key ?? null;
}
