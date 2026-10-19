// src/constants/financeiro/expense/options/appropriation-options.ts
// -----------------------------------------------------------------------------
// Fábricas de opções dos campos `appropriation` (Modalidade)/`appropriation_
// type` (Tipo) de Expense (Contas a Pagar). Padrão canônico
// `(languageGB) => Map` + `getLabel`/`options`, mirror `payment-type-options.ts`.
//
// `appropriation`: 1=Direta, 2=Indireta. Modalidade Direta liga o Select
// "Tipo" (`appropriation_type`).
//
// `appropriation_type` (`ExpenseAppropriationTypeEnum`): 1=AGRICULTURA/
// 2=PECUARIA/3=AREA/4=MANUTENCAO. UT-000795 (Execução 102): os 4 tipos são
// processados pela API; o sufixo "(indisponível nesta versão)" deixou de
// existir. Os tipos OFERECIDOS vêm de `GET /expenses/appropriation-types/
// options` (regra por centro de custo do tenant, D-102-15) via
// `buildExpenseAppropriationTypeOptions`; sem resposta válida (carregando,
// erro, vazio) cai nos 4 tipos fixos (fallback seguro — filtro só de tela).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type {
  ExpenseAppropriationTypeOption,
  ExpenseAppropriationTypeValue,
  ExpenseAppropriationValue,
} from '@/@types/v2/Financeiro/expense';

export const expenseAppropriationIndex = {
  DIRETA: 1,
  INDIRETA: 2,
} as const satisfies Record<string, ExpenseAppropriationValue>;

const appropriationLabels = (languageGB: LanguageDate): Map<ExpenseAppropriationValue, string> => {
  const dictionary = languageGB.financial.expense.form.appropriationOptions;
  return new Map([
    [expenseAppropriationIndex.DIRETA, dictionary.direct],
    [expenseAppropriationIndex.INDIRETA, dictionary.indirect],
  ]);
};

const getAppropriationLabel = (
  value: ExpenseAppropriationValue,
  languageGB: LanguageDate
): string => appropriationLabels(languageGB).get(value)!;

const appropriationOptionsList = (languageGB: LanguageDate): Option<ExpenseAppropriationValue>[] =>
  Array.from(appropriationLabels(languageGB)).map(([value, label]) => ({ label, value }));

export const expenseAppropriationOptions = {
  getLabel: getAppropriationLabel,
  options: appropriationOptionsList,
};

export const expenseAppropriationTypeIndex = {
  AGRICULTURA: 1,
  PECUARIA: 2,
  AREA: 3,
  MANUTENCAO: 4,
} as const satisfies Record<string, ExpenseAppropriationTypeValue>;

const appropriationTypeLabels = (
  languageGB: LanguageDate
): Map<ExpenseAppropriationTypeValue, string> => {
  const dictionary = languageGB.financial.expense.form.appropriationTypeOptions;
  return new Map([
    [expenseAppropriationTypeIndex.AGRICULTURA, dictionary.agriculture],
    [expenseAppropriationTypeIndex.PECUARIA, dictionary.pasture],
    [expenseAppropriationTypeIndex.AREA, dictionary.area],
    [expenseAppropriationTypeIndex.MANUTENCAO, dictionary.maintenance],
  ]);
};

const getAppropriationTypeLabel = (
  value: ExpenseAppropriationTypeValue,
  languageGB: LanguageDate
): string => appropriationTypeLabels(languageGB).get(value) ?? String(value);

const appropriationTypeOptionsList = (
  languageGB: LanguageDate
): Option<ExpenseAppropriationTypeValue>[] =>
  Array.from(appropriationTypeLabels(languageGB)).map(([value, label]) => ({ label, value }));

export const expenseAppropriationTypeOptions = {
  getLabel: getAppropriationTypeLabel,
  options: appropriationTypeOptionsList,
};

// Monta as opções do Select "Tipo". Com `apiItems` válidos (não vazios) usa
// os `value` da API na ordem recebida e traduz o rótulo pela i18n do front
// (`getLabel` prevalece sobre o `label` da API). Sem `apiItems` (null/vazio)
// devolve os 4 tipos fixos. `savedType` (tipo já gravado no título, edição/
// visualização) é injetado quando ausente da lista, para o Select nunca ficar
// em branco nem apagar o dado — efeito só de tela.
export function buildExpenseAppropriationTypeOptions(
  languageGB: LanguageDate,
  apiItems: ExpenseAppropriationTypeOption[] | null | undefined,
  savedType?: ExpenseAppropriationTypeValue | null
): Option<ExpenseAppropriationTypeValue>[] {
  const valid = (apiItems ?? []).filter((item) =>
    Object.values(expenseAppropriationTypeIndex).includes(item.value)
  );
  const base: Option<ExpenseAppropriationTypeValue>[] =
    valid.length > 0
      ? valid.map((item) => ({
          label: getAppropriationTypeLabel(item.value, languageGB),
          value: item.value,
        }))
      : appropriationTypeOptionsList(languageGB);

  if (savedType !== null && savedType !== undefined && !base.some((o) => o.value === savedType)) {
    return [...base, { label: getAppropriationTypeLabel(savedType, languageGB), value: savedType }];
  }
  return base;
}
