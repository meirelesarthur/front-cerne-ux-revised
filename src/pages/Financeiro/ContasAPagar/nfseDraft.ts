// src/pages/Financeiro/ContasAPagar/nfseDraft.ts
// -----------------------------------------------------------------------------
// UT-000754 / T-754-FE-03 — mapeador PURO do rascunho de despesa vindo de
// "NFS-e Recebidas" (`POST /nfses/{uuid}/expense-draft` → `state.nfseDraft`)
// para os campos do form de Contas a Pagar que o rascunho preenche além do
// que `handleXmlImported` já cobre (number/dt_emission/amount/note/xml_key/
// provider/type_note/type_title).
//
// NÃO usa `@/utils/isEmpty` (polaridade invertida, ERRO-FE-001): vazio é
// testado por `Object.keys(x).length === 0` quando necessário.
// -----------------------------------------------------------------------------

import { expenseAppropriationOptions } from '@/constants/financeiro/expense/options/appropriation-options';
import { expensePaymentTypeOptions } from '@/constants/financeiro/expense/options/payment-type-options';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { NfseExpenseDraft } from '@/@types/v2/BaseRegistrations/nfse';
import type {
  ExpenseAppropriationValue,
  ExpensePaymentTypeValue,
} from '@/@types/v2/Financeiro/expense';
import type { ExpenseXmlDraft } from '@/@types/v2/XmlPrefill';

/** Rota de criação de Contas a Pagar e chave do `state` de navegação. */
export interface NfseDraftNavigationState {
  nfseDraft?: NfseExpenseDraft;
  nfseUuid?: string;
}

export interface NfseDraftExtraFields {
  due_date: string | null;
  payment_type: Option<ExpensePaymentTypeValue>;
  appropriation: Option<ExpenseAppropriationValue>;
  fiscal_document: Option<boolean>;
  is_taxation: Option<boolean>;
}

// `Y-m-d` — trunca defensivamente se vier com timestamp.
function toDateOnly(value: string | null | undefined): string | null {
  return value ? value.slice(0, 10) : null;
}

// Adapta o rascunho ao shape de `handleXmlImported` (superconjunto; número nulo vira '').
export function toExpenseXmlDraft(draft: NfseExpenseDraft): ExpenseXmlDraft {
  return {
    xml_key: draft.xml_key,
    note: draft.note,
    amount: draft.amount,
    provider_uuid: draft.provider_uuid,
    provider_matched: draft.provider_matched,
    dt_emission: toDateOnly(draft.dt_emission) ?? '',
    number: draft.number ?? '',
    type_note_id: draft.type_note_id,
    type_id: draft.type_id,
  };
}

// Campos do rascunho que `handleXmlImported` NÃO cobre.
export function mapNfseDraftExtraFields(
  draft: NfseExpenseDraft,
  languageGB: LanguageDate
): NfseDraftExtraFields {
  const yes = languageGB.defaltStrings.yes;
  const no = languageGB.defaltStrings.no;
  const paymentType = draft.payment_type as ExpensePaymentTypeValue;
  const appropriation = draft.appropriation as ExpenseAppropriationValue;

  return {
    // Legado: vencimento = emissão.
    due_date: toDateOnly(draft.due_date) ?? toDateOnly(draft.dt_emission),
    payment_type: expensePaymentTypeOptions.getOption(paymentType, languageGB),
    appropriation: {
      label: expenseAppropriationOptions.getLabel(appropriation, languageGB),
      value: appropriation,
    },
    fiscal_document: { label: draft.fiscal_document ? yes : no, value: draft.fiscal_document },
    is_taxation: { label: draft.is_taxation ? yes : no, value: draft.is_taxation },
  };
}
