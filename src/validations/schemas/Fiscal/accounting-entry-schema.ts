// src/validations/schemas/Fiscal/accounting-entry-schema.ts
// Schema de validação Yup de Partida Dobrada (AccountingEntry — domínio
// Fiscal, F-128, esteira 97-Esteiras/068, TASK-PD-FE-04). PONTO DE
// FIDELIDADE DE ALTO RISCO desta esteira: mirror EXATO do 422 real do
// servidor (`AccountingEntryRequest::withValidator()`) — mesma tolerância
// (0.01), mesmo arredondamento a 2 casas ANTES da comparação (defesa contra
// imprecisão IEEE754, ex.: `100.01 - 100.00` pode dar `0.010000000000005116`
// em ponto flutuante cru). Vive em `src/validations/schemas/Fiscal/` (pasta
// pelo NOME DO MÓDULO, NUNCA em `src/pages/`).
//
// As 3 mensagens (`itemsMinDebit`/`itemsMinCredit`/`itemsSumMismatch`) usam
// literalmente `languageGB.accountingEntries.accountingEntry.validation.*`
// (TASK-PD-FE-02) — texto IDÊNTICO ao 422 real, nunca paráfrase. Implementadas
// como 3 `.test()` encadeados (em vez de 1 só) para reproduzir as 3 mensagens
// distintas do backend com precisão, conforme nota de implementação da
// Tarefa — cada teste resolve para `true` quando a condição que ele cobre já
// foi satisfeita, deixando os demais testes decidirem sua própria mensagem.

import * as yup from 'yup';

import { accountingEntryItemCondition } from '@/constants/Fiscal/accountingEntry';

import type { LanguageDate } from '@/@types/language';
import { AccountingEntryForm, AccountingEntryItemForm } from '@/@types/v2/Fiscal/accountingEntry';
import type Shape from '@/@types/validations/shape';

const accountingEntryItemSchema = (languageGB: LanguageDate) => {
  const v = languageGB.accountingEntries.accountingEntry.validation;

  return yup.object().shape<Shape<AccountingEntryItemForm>>({
    uuid: yup.string().optional(),
    plan_account_uuid: yup.object().nullable().required(v.planAccountRequired),
    condition: yup.object().nullable().required(v.conditionRequired),
    value: yup.number().nullable().required(v.valueRequired).min(0.01, v.valueMin),
  });
};

// Soma dos itens da condição informada, ignorando linhas ainda incompletas
// (campo/valor inválido já é barrado pelas regras de linha acima — este
// helper só precisa ser tolerante a `undefined`/`NaN` para não estourar
// antes das mensagens de campo aparecerem).
function sumByCondition(
  items: Partial<AccountingEntryItemForm>[] | undefined,
  condition: number
): number {
  if (!items) return 0;
  return items.reduce(
    (sum, item) => (item?.condition?.value === condition ? sum + (Number(item?.value) || 0) : sum),
    0
  );
}

function hasCondition(
  items: Partial<AccountingEntryItemForm>[] | undefined,
  condition: number
): boolean {
  return !!items?.some((item) => item?.condition?.value === condition);
}

const accountingEntrySchema = (languageGB: LanguageDate) => {
  const v = languageGB.accountingEntries.accountingEntry.validation;

  return yup.object().shape<Shape<AccountingEntryForm>>({
    // `yup.string()`, NUNCA `yup.date()` — `yup.date()` faz o `yupResolver`
    // devolver o valor CASTADO (objeto `Date`), quebrando o contrato
    // string ISO 'yyyy-MM-dd' ponta-a-ponta do `DateInput` (mesmo racional
    // documentado em `field-validation-schema.ts`, TASK-FE-917 —
    // CONTRATO-FE-CONSOLIDA-INPUTDATE.md, esteira 006).
    date: yup.string().nullable().required(v.dateRequired),
    description: yup.string().required(v.descriptionRequired),
    origin: yup.object().nullable().required(v.originRequired),
    items: yup
      .array()
      .of(accountingEntryItemSchema(languageGB))
      .min(1, v.itemsMinDebit)
      // 1/3 — falta ao menos 1 linha de Débito.
      .test('items-min-debit', v.itemsMinDebit, (items) =>
        hasCondition(items, accountingEntryItemCondition.debit)
      )
      // 2/3 — falta ao menos 1 linha de Crédito.
      .test('items-min-credit', v.itemsMinCredit, (items) =>
        hasCondition(items, accountingEntryItemCondition.credit)
      )
      // 3/3 — soma de débito diverge da soma de crédito além da tolerância.
      // Mirror EXATO de `AccountingEntryRequest::withValidator()`: arredonda
      // a 2 casas ANTES de comparar, tolerância 0.01. Só avalia quando as 2
      // condições acima já foram satisfeitas (senão a mensagem certa é uma
      // das 2 anteriores, não esta).
      .test('items-balanced', v.itemsSumMismatch, (items) => {
        if (!hasCondition(items, accountingEntryItemCondition.debit)) return true;
        if (!hasCondition(items, accountingEntryItemCondition.credit)) return true;

        const debitSum = sumByCondition(items, accountingEntryItemCondition.debit);
        const creditSum = sumByCondition(items, accountingEntryItemCondition.credit);

        return Math.round(Math.abs(debitSum - creditSum) * 100) / 100 <= 0.01;
      }),
  });
};

export default accountingEntrySchema;
