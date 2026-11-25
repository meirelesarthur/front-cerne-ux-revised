// src/pages/Administrativo/Solicitacao/prototype/duplicateOrder.ts
// -----------------------------------------------------------------------------
// PROTÓTIPO (lote 3, item 2 do plano — F3) — "Duplicar OC": monta os valores do
// formulário de CRIAÇÃO a partir de uma ordem salva, só com os itens marcados.
// Copia tipo, prioridade, descrição, justificativa, observação, encarregado e
// itens (sem `item_uuid`: são itens novos). NÃO copia código, situação,
// anexos, cotações, histórico nem NF; a data do pedido é a de hoje. Não depende
// de API: a ordem nova é criada pelo POST de sempre. Regra pura, testada.
// -----------------------------------------------------------------------------

import type { RequestPurchaseData, RequestPurchaseForm } from '@/@types/v2/RequestPurchases';

import { buildAuthorizerOption } from '../requestPurchaseLabels';

/** Estado de navegação que o formulário de criação lê para vir preenchido. */
export interface DuplicateOrderState {
  duplicateOf: { code: string | null };
  values: Partial<RequestPurchaseForm>;
}

export function buildDuplicateState(
  data: RequestPurchaseData,
  selectedItemUuids: string[],
  today: string
): DuplicateOrderState {
  const selected = new Set(selectedItemUuids);
  return {
    duplicateOf: { code: data.code },
    values: {
      type: { label: data.type_label, value: data.type },
      request_date: today,
      justification: data.justification,
      description: data.description,
      priority:
        data.priority !== null && data.priority !== undefined
          ? { label: data.priority_label, value: data.priority }
          : null,
      authorizer_uuid: buildAuthorizerOption(data),
      observation: data.observation ?? '',
      items: (data.items ?? [])
        .filter((row) => selected.has(row.uuid))
        .map((row) => ({
          item_uuid: null,
          product_uuid: row.product ? { label: row.product.description, value: row.product.uuid } : null,
          quantity: row.quantity ?? null,
          amount: row.amount ?? null,
          name: row.name ?? null,
          nif: row.nif ?? null,
          phone: row.phone ?? null,
          description: row.description ?? null,
          service_description: row.service_description ?? null,
          daily_quantity: row.daily_quantity ?? null,
          brand: row.brand ?? null,
          observation: row.observation ?? null,
          delivery_date: null,
        })),
      attachments: [],
    },
  };
}

export function isDuplicateOrderState(state: unknown): state is DuplicateOrderState {
  return !!state && typeof state === 'object' && 'duplicateOf' in state && 'values' in state;
}
