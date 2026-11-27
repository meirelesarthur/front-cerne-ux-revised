// src/pages/Administrativo/Solicitacao/prototype/purchaseOrderSteps.ts
// -----------------------------------------------------------------------------
// PROTÓTIPO (ver `config/v2/purchaseOrderPrototype.ts`) — etapas da SOLICITAÇÃO
// para a linha do topo, a partir da situação (1–11) e do perfil de fluxo da
// fazenda (Simples, Padrão, Completo). Regra pura, testada.
//
// 27/11/2026 (decisão do dono): a Solicitação termina quando gera as Ordens de
// compra; recebimento e encerramento são de cada Ordem, na tela dela.
//   Simples   Pedido → Ordem de compra
//   Padrão    Pedido → Cotação → Aprovação → Ordem de compra
//   Completo  Pedido → Ciência → Cotação → Aprovação → Ordem de compra
//             (a ciência do gestor vem logo depois do pedido)
// Situação → etapa: 1/11 Pedido; 4 Ciência (no perfil sem Ciência, conta como
// Aprovação); 2 Cotação; 3 Aprovação; 5 parou na Aprovação (recusada); 6 Ordem
// de compra em andamento; 7, 8 e 9 Ordem de compra concluída; 10 parou na etapa
// em que foi cancelada (sem dado, ou etapa da Ordem: Ordem de compra).
// -----------------------------------------------------------------------------

import { requestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';

/** Perfil de fluxo da fazenda (F2). Demais campos de protótipo: `prototypeFields.ts`. */
export type PurchaseOrderFlowProfile = 'simples' | 'padrao' | 'completo';

export type PurchaseOrderStepKey = 'pedido' | 'ciencia' | 'cotacao' | 'aprovacao' | 'compra';

/** Etapa em que uma ordem antiga foi cancelada (os dados antigos ainda citam etapas da Ordem). */
export type PurchaseOrderCancelStep = PurchaseOrderStepKey | 'recebimento' | 'encerrada';

export type PurchaseOrderStepState = 'done' | 'current' | 'todo' | 'skipped' | 'stopped';

export interface PurchaseOrderStep {
  key: PurchaseOrderStepKey;
  state: PurchaseOrderStepState;
}

export const PURCHASE_ORDER_STEP_KEYS: PurchaseOrderStepKey[] = ['pedido', 'ciencia', 'cotacao', 'aprovacao', 'compra'];

export const SKIPPED_BY_PROFILE: Record<PurchaseOrderFlowProfile, PurchaseOrderStepKey[]> = {
  simples: ['ciencia', 'cotacao', 'aprovacao'],
  padrao: ['ciencia'],
  completo: [],
};

function currentStepOf(
  status: number,
  profile: PurchaseOrderFlowProfile,
  cancelledAt?: PurchaseOrderCancelStep
): PurchaseOrderStepKey {
  switch (status) {
    case requestPurchaseStatus.aguardandoCiencia:
      return SKIPPED_BY_PROFILE[profile].includes('ciencia') ? 'aprovacao' : 'ciencia';
    case requestPurchaseStatus.cotacaoEmAndamento:
      return 'cotacao';
    case requestPurchaseStatus.aguardandoAprovacao:
    case requestPurchaseStatus.pedidoNaoAprovado:
      return 'aprovacao';
    case requestPurchaseStatus.aguardandoCompra:
    case requestPurchaseStatus.compraEfetuada:
    case requestPurchaseStatus.compraRecebida:
    case requestPurchaseStatus.pedidoFinalizado:
      return 'compra';
    case requestPurchaseStatus.pedidoCancelado:
      return cancelledAt && (PURCHASE_ORDER_STEP_KEYS as string[]).includes(cancelledAt)
        ? (cancelledAt as PurchaseOrderStepKey)
        : 'compra';
    default:
      return 'pedido';
  }
}

export function purchaseOrderSteps(
  status: number,
  profile: PurchaseOrderFlowProfile = 'padrao',
  cancelledAt?: PurchaseOrderCancelStep
): PurchaseOrderStep[] {
  const skipped = SKIPPED_BY_PROFILE[profile];
  const current = currentStepOf(status, profile, cancelledAt);
  const currentIndex = PURCHASE_ORDER_STEP_KEYS.indexOf(current);
  const stopped =
    status === requestPurchaseStatus.pedidoNaoAprovado ||
    status === requestPurchaseStatus.pedidoCancelado;
  // As Ordens já saíram (compra efetuada, recebida ou encerrada): a Solicitação concluiu.
  const finished =
    status === requestPurchaseStatus.compraEfetuada ||
    status === requestPurchaseStatus.compraRecebida ||
    status === requestPurchaseStatus.pedidoFinalizado;

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

/** O caminho do perfil, para o diagrama da tela de fluxo. */
export function profilePath(profile: PurchaseOrderFlowProfile): PurchaseOrderStepKey[] {
  return PURCHASE_ORDER_STEP_KEYS.filter((key) => !SKIPPED_BY_PROFILE[profile].includes(key));
}
