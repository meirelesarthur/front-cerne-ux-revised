// src/constants/RequestReceipts/options/confirm-receipt-completion-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `purchase_status` de Confirmar Recebimento
// (`ConfirmReceiptCompletion`, 1=Total/2=Parcial — CLM-11/12, IG-01). Campo
// LOCAL da tela de confirmação, distinto do enum `RequestPurchaseStatus`
// (status da solicitação como um todo) — mesmo domínio, semântica diferente,
// por isso NÃO reusa `requestPurchaseStatusOptions`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { ConfirmReceiptCompletion } from '@/@types/v2/RequestReceipts';

const CONFIRM_RECEIPT_COMPLETION = { total: 1, parcial: 2 } as const;

const labels = (languageGB: LanguageDate): Map<ConfirmReceiptCompletion, string> => {
  const text = languageGB.requestReceipts.requestReceipt.confirm.purchaseStatusOptions;
  return new Map([
    [CONFIRM_RECEIPT_COMPLETION.total, text.total],
    [CONFIRM_RECEIPT_COMPLETION.parcial, text.parcial],
  ]);
};

const getLabel = (value: ConfirmReceiptCompletion, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: ConfirmReceiptCompletion,
  languageGB: LanguageDate
): Option<ConfirmReceiptCompletion> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<ConfirmReceiptCompletion>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const confirmReceiptCompletionOptions = {
  values: CONFIRM_RECEIPT_COMPLETION,
  getLabel,
  getOption,
  options,
};
