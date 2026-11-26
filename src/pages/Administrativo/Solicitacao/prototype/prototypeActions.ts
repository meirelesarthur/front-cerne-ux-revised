// src/pages/Administrativo/Solicitacao/prototype/prototypeActions.ts
// -----------------------------------------------------------------------------
// PROTÓTIPO (lote 4 — F4) — ações simuladas da Ordem de compra: registrar
// recebimento (parcial ou total, com a NF), cancelar saldo, cancelar item e
// reabrir. Chamam rotas `/request-purchases/{uuid}/prototype/*` que SÓ existem
// nos dados de demonstração (`mocks/dev-api/handlers/purchaseOrdersDemo.ts`) e
// mudam a ordem na memória (recarregar a página volta ao estado inicial). Os
// nomes dos campos seguem o documento do desenvolvedor; a API de verdade é
// outra conversa (F4 do plano).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { GenerateOrdersPayload } from './generateOrders';

export interface PrototypeReceiptPayload {
  invoice: { number: string; series: string; issued_at: string; value: number };
  items: { item_uuid: string; quantity: number }[];
}

const base = (uuid: string) => `/request-purchases/${uuid}/prototype`;

export function registerPrototypeReceipt(uuid: string, payload: PrototypeReceiptPayload) {
  return api.V2.post(`${base(uuid)}/receipt`, payload);
}

export function cancelPrototypeBalance(uuid: string, justify: string) {
  return api.V2.post(`${base(uuid)}/cancel-balance`, { justify });
}

export function cancelPrototypeItem(uuid: string, itemUuid: string, justify: string) {
  return api.V2.post(`${base(uuid)}/cancel-item`, { item_uuid: itemUuid, justify });
}

/** Solicitação gera Ordens de compra, uma por fornecedor (26/11). */
export function generatePrototypeOrders(uuid: string, payload: GenerateOrdersPayload) {
  return api.V2.post(`${base(uuid)}/generate-orders`, payload);
}

export function reopenPrototypeOrder(uuid: string, justify: string) {
  return api.V2.post(`${base(uuid)}/reopen`, { justify });
}
