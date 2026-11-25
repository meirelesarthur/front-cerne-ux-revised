// src/pages/Administrativo/Solicitacao/prototype/purchaseOrderSteps.ts
// -----------------------------------------------------------------------------
// PROTÓTIPO (ver `config/v2/purchaseOrderPrototype.ts`) — etapas da Ordem de
// compra para a linha do topo, a partir da situação (1–11) e do perfil de fluxo
// da fazenda (F2 do plano: Simples, Padrão, Completo). Regra pura, testada.
//
// Etapas: Pedido → Cotação → Aprovação → Compra → Recebimento → Encerrada.
// - Situação → etapa atual: 1/11 Pedido; 2 Cotação; 3/4 Aprovação; 5 parou na
//   Aprovação (recusada); 6 Compra; 7 Recebimento; 8 Recebimento concluído;
//   9 Encerrada; 10 parou na etapa em que foi cancelada (sem dado: Compra).
// - Perfil Simples pula Cotação e Aprovação; Padrão e Completo passam por todas.
// -----------------------------------------------------------------------------

import { requestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';

/** Perfil de fluxo da fazenda (F2). Demais campos de protótipo: `prototypeFields.ts`. */
export type PurchaseOrderFlowProfile = 'simples' | 'padrao' | 'completo';

export type PurchaseOrderStepKey =
  | 'pedido'
  | 'cotacao'
  | 'aprovacao'
  | 'compra'
  | 'recebimento'
  | 'encerrada';

export type PurchaseOrderStepState = 'done' | 'current' | 'todo' | 'skipped' | 'stopped';

export interface PurchaseOrderStep {
  key: PurchaseOrderStepKey;
  state: PurchaseOrderStepState;
}

export const PURCHASE_ORDER_STEP_KEYS: PurchaseOrderStepKey[] = [
  'pedido',
  'cotacao',
  'aprovacao',
  'compra',
  'recebimento',
  'encerrada',
];

const SKIPPED_BY_PROFILE: Record<PurchaseOrderFlowProfile, PurchaseOrderStepKey[]> = {
  simples: ['cotacao', 'aprovacao'],
  padrao: [],
  completo: [],
};

function currentStepOf(status: number, cancelledAt?: PurchaseOrderStepKey): PurchaseOrderStepKey {
  switch (status) {
    case requestPurchaseStatus.cotacaoEmAndamento:
      return 'cotacao';
    case requestPurchaseStatus.aguardandoAprovacao:
    case requestPurchaseStatus.aguardandoCiencia:
    case requestPurchaseStatus.pedidoNaoAprovado:
      return 'aprovacao';
    case requestPurchaseStatus.aguardandoCompra:
      return 'compra';
    case requestPurchaseStatus.compraEfetuada:
    case requestPurchaseStatus.compraRecebida:
      return 'recebimento';
    case requestPurchaseStatus.pedidoFinalizado:
      return 'encerrada';
    case requestPurchaseStatus.pedidoCancelado:
      return cancelledAt ?? 'compra';
    default:
      return 'pedido';
  }
}

export function purchaseOrderSteps(
  status: number,
  profile: PurchaseOrderFlowProfile = 'padrao',
  cancelledAt?: PurchaseOrderStepKey
): PurchaseOrderStep[] {
  const skipped = SKIPPED_BY_PROFILE[profile];
  const current = currentStepOf(status, cancelledAt);
  const currentIndex = PURCHASE_ORDER_STEP_KEYS.indexOf(current);
  const stopped =
    status === requestPurchaseStatus.pedidoNaoAprovado ||
    status === requestPurchaseStatus.pedidoCancelado;
  const finished =
    status === requestPurchaseStatus.pedidoFinalizado ||
    status === requestPurchaseStatus.compraRecebida;

  return PURCHASE_ORDER_STEP_KEYS.map((key, index) => {
    if (skipped.includes(key)) return { key, state: 'skipped' };
    if (index < currentIndex) return { key, state: 'done' };
    if (index === currentIndex) {
      if (stopped) return { key, state: 'stopped' };
      if (finished) return { key, state: 'done' };
      return { key, state: 'current' };
    }
    return { key, state: 'todo' };
  });
}
