// src/constants/relatorios/payment-schedule-report/options/status-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do filtro `status` do relatório "Agenda/Pagamentos"
// (F-294, CONTRATO-F294-agenda-pagamentos.md, esteira 97-Esteiras/059) —
// mirror ESTRUTURAL de `report-format-options.ts` (`Option<T>` alimentado por
// `languageGB`, domínio fixo). Espelha `App\Enums\Reports\
// PaymentScheduleReportStatusEnum` (backend): 1 A vencer · 2 Vencido · 3
// Parcial · 4 Quitado.
//
// NÃO é `accountsPayableReceivableStatusOptions` — universo de status
// DIFERENTE (docblock do enum backend: "NÃO é status derivado/computado por
// linha [...] é um SELETOR de predicado de query [...] nunca a
// `AccountsPayableReceivableStatusEnum`, um enum PRÓPRIO para não caber um
// universo de valores alheio").
//
// Só 1-4 têm rótulo/efeito aqui — 5-8 são ACEITOS pela validação do backend
// (`PaymentScheduleReportRequest`, DEC-265, fidelidade ao legado) mas SEM
// tratamento na query (`PaymentScheduleReportRepository`); por não terem
// rótulo/sentido de UI, não são expostos como opção (mesma omissão do
// próprio enum backend, que só define os casos 1-4).
//
// Campo ESCALAR (`Select` simples, `Option<PaymentScheduleReportStatus> |
// null`), NÃO `CheckboxListField` — divergência já registrada no contrato:
// `status` do payment-schedule-report é filtro ÚNICO, diferente do irmão
// `status[]` (array) de `accounts-payable-receivable-report`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

export type PaymentScheduleReportStatus = 1 | 2 | 3 | 4;

const labels = (languageGB: LanguageDate): Map<PaymentScheduleReportStatus, string> => {
  const dictionary = languageGB.paymentScheduleReport.report.statusOptions;
  return new Map([
    [1, dictionary.dueSoon],
    [2, dictionary.overdue],
    [3, dictionary.partial],
    [4, dictionary.settled],
  ]);
};

const getLabel = (value: PaymentScheduleReportStatus, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: PaymentScheduleReportStatus,
  languageGB: LanguageDate
): Option<PaymentScheduleReportStatus> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<PaymentScheduleReportStatus>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const paymentScheduleReportStatusOptions = { getLabel, getOption, options };
