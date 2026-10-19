// src/pages/Operacional/CompraAnimais/movementPurchaseXmlDraft.ts
// -----------------------------------------------------------------------------
// 088 D4-FE-T1 — aplicação PURA do draft do XML (`POST /movement-purchases/
// import-xml`, §2.5 API / §4.5 plano FE) ao formulário da Compra. Sem React:
// testável isoladamente e usada pelo upload e pelo caminho DFe
// (`location.state.dfeXmlDraft`).
//
// Regras (decisões vinculantes do dono):
//  - duplicatas aplicadas COMO VIERAM (datas/valores), `origin='xml'`, sem
//    regenerar na abertura; o recálculo por mudança de total (D3-b) reescala
//    mantendo as datas;
//  - `financial_defaults` pré-preenchem o cabeçalho (Classificação visível);
//  - fornecedor do draft SEMPRE selecionado (mesmo de outro tipo — o valor
//    controlado do select não depende de a opção estar na lista `type=1`);
//  - `other_values` NÃO é tocado (igual ao legado); quantidade já vem truncada;
//  - rateio: 1 linha com o total da tela (categoria/conta/centro manuais).
// -----------------------------------------------------------------------------

import type {
  MovementPurchaseXmlDraft,
  MovementPurchaseXmlDraftWarning,
} from '@/services/v2/MovementPurchases/movement-purchase-service';

import type {
  MovementPurchaseFinInstallmentRow,
  MovementPurchaseForm,
  MovementPurchaseItemForm,
} from '@/@types/v2/MovementPurchases';

import { fromCents, toCents } from './movementPurchaseFinancialMath';
import {
  computeMovementPurchaseItemAmount,
  createEmptyMovementPurchaseItem,
} from './useMovementPurchases';

/** Campos da tela que o XML NÃO sobrescreve (preservados do form atual). */
export interface XmlDraftCurrentValues {
  code: MovementPurchaseForm['code'];
  seller_uuid: MovementPurchaseForm['seller_uuid'];
  type_payment: MovementPurchaseForm['type_payment'];
  gtas: MovementPurchaseForm['gtas'];
  other_values: MovementPurchaseForm['other_values'];
}

export interface XmlDraftApplication {
  values: MovementPurchaseForm;
  warnings: MovementPurchaseXmlDraftWarning[];
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function buildMovementPurchaseXmlApplication(
  draft: MovementPurchaseXmlDraft,
  current: XmlDraftCurrentValues,
  todayIso: string
): XmlDraftApplication {
  const defaults = draft.financial_defaults;

  const items: MovementPurchaseItemForm[] =
    draft.items.length > 0
      ? draft.items.map((item) => ({
          category_uuid: null,
          batch_uuid: null,
          grazing_uuid: null,
          center_uuid: null,
          quantity: item.quantity,
          value_unit: item.value_unit,
          amount: item.amount,
          note: '',
          item_description: item.description,
          fiscal_baseline: {
            quantity: Number(item.quantity) || 0,
            value_unit: Number(item.value_unit) || 0,
            amount: Number(item.amount) || 0,
          },
        }))
      : [createEmptyMovementPurchaseItem()];

  // Total da tela (mesma fórmula do form): Σ itens + frete + outros − desconto.
  const itemsTotal = items.reduce((sum, item) => sum + computeMovementPurchaseItemAmount(item), 0);
  const screenTotal = round(
    itemsTotal +
      (Number(draft.freight) || 0) +
      (Number(current.other_values) || 0) -
      (Number(draft.discount) || 0),
    2
  );

  const installments: MovementPurchaseFinInstallmentRow[] = (draft.installments ?? []).map(
    (row) => ({ due_date: row.due_date, amount: row.amount, origin: 'xml' as const })
  );
  const intervalDays =
    typeof draft.interval_days === 'number'
      ? draft.interval_days
      : installments.length > 1
        ? 30
        : 0;

  return {
    warnings: draft.warnings ?? [],
    values: {
      code: current.code,
      dt_sale: draft.dt_sale || todayIso,
      provider_uuid: draft.provider.uuid
        ? { label: draft.provider.name || draft.provider.uuid, value: draft.provider.uuid }
        : null,
      seller_uuid: current.seller_uuid,
      chave: draft.chave || null,
      serie: draft.serie || null,
      number: draft.number || null,
      type_payment: current.type_payment,
      gtas: current.gtas,
      note: draft.note || '',
      total_products: draft.total_products,
      freight: draft.freight,
      other_values: current.other_values,
      discount: draft.discount,
      total: draft.total,
      items,

      has_financial: true,
      financial_number: defaults?.number || draft.number || '',
      financial_type_title: defaults?.type_title
        ? {
            label: defaults.type_title.description ?? defaults.type_title.uuid,
            value: defaults.type_title.uuid,
          }
        : null,
      financial_proprietary: defaults?.proprietary
        ? {
            label: defaults.proprietary.name ?? defaults.proprietary.uuid,
            value: defaults.proprietary.uuid,
          }
        : null,
      financial_note: defaults?.note ?? draft.note ?? '',
      // Entrada: o XML não traz (pacote 1) — "Não" explícito, sem campos.
      financial_has_input: false,
      financial_input_date: null,
      financial_input_value: null,
      financial_fiscal_document: defaults?.fiscal_document ?? true,
      financial_classification: defaults?.classification ?? 'N',
      generator: {
        count: installments.length > 0 ? installments.length : null,
        first_due_date: installments[0]?.due_date ?? null,
        interval_days: intervalDays,
      },
      financial_installments: installments,
      financial_allocations: [
        {
          category: null,
          plan_account: null,
          center: null,
          percent: 100,
          value: fromCents(toCents(screenTotal)),
        },
      ],
      financial_write_off: false,
    },
  };
}

// Texto do aviso por `code` (i18n); código desconhecido cai na `message` da API.
export function resolveXmlWarningMessage(
  warning: MovementPurchaseXmlDraftWarning,
  texts: Record<string, string>
): string {
  return texts[warning.code] ?? warning.message;
}
