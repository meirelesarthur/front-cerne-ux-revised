// src/constants/stockWriteoffs/options/stock-writeoff-type-options.ts
// -----------------------------------------------------------------------------
// Options factory do enum `StockWriteoffTypeEnum` (contrato de tela §2.5,
// TASK-FE-3004) — mirror `eventTypeOptions` (`getLabel`/`getOption`/
// `options`). Diferente de `eventTypeOptions` (que devolve `Option<string>`
// para casar com um `<Select>` que guarda string no RHF), aqui o valor é
// mantido `number` (`Option<number>`) — o campo `type` do
// `StockWriteoffRequest` é `int` no wire e o `Select` do projeto aceita
// `Option<any>` nativamente, sem necessidade de round-trip string↔number no
// submit (mirror `ServiceOrderForm.category: Option<number>`).
//
// Ordem de exibição = ordem numérica do enum (1..13, contrato de tela §2.5) —
// não há reordenação por UX documentada para este campo.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<number, string> => {
  const text = languageGB.stockWriteoffs.stockWriteoff.typeOptions;
  return new Map<number, string>([
    [1, text.loss],
    [2, text.deterioration],
    [3, text.theft],
    [4, text.damage],
    [5, text.inventory],
    [6, text.accounting],
    [7, text.pettyTheft],
    [8, text.expirationDate],
    [9, text.freeGift],
    [10, text.donation],
    [11, text.others],
    [12, text.consumption],
    [13, text.paymentInProduct],
  ]);
};

const getLabel = (type: number, languageGB: LanguageDate): string =>
  labels(languageGB).get(type) ?? String(type);

const getOption = (type: number, languageGB: LanguageDate): Option<number> => ({
  label: getLabel(type, languageGB),
  value: type,
});

const options = (languageGB: LanguageDate): Option<number>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const stockWriteoffTypeOptions = { getLabel, getOption, options };
