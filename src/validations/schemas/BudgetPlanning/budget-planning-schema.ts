// src/validations/schemas/BudgetPlanning/budget-planning-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Prev. Orçamentária" (BudgetPlanning
// — F-106, esteira 97-Esteiras/067, TASK-PO-FE-04), espelhando
// `BudgetPlanningRequest::rules()` (contrato de tela §2/§4) — cabeçalho
// (`date`/`year`) + `rows` (matriz categoria×mês, achatada em `categories`
// no payload de escrita por `TASK-PO-FE-07`, BLOQUEADA). Vive em
// `src/validations/schemas/BudgetPlanning/` (pasta pelo NOME DA ENTIDADE,
// nunca em `src/pages/`) — mirror estrutural de
// `src/validations/schemas/FinancialFreeze/financial-freeze-schema.ts`.
//
// Consumido por `CreateOrUpdateBudgetPlanning.tsx` (TASK-PO-FE-07, GAP-PO-08
// resolvido — universo de categorias elegíveis via
// `listEligibleBudgetPlanningCategories`).
//
// `categories` (aqui, `rows` achatado) exige AO MENOS 1 valor preenchido no
// CONJUNTO inteiro (`required|array|min:1` de `BudgetPlanningRequest`), não
// por linha/célula individual — Yup não valida isso com `.min()` simples de
// array (a estrutura de `rows` é FIXA, sempre com N linhas, nunca vazia
// mesmo sem nenhum valor preenchido), por isso o `.test()` no nível de
// `rows` conta quantas células têm `amount != null` no total. Cada célula
// preenchida deve ser `>= 0` (servidor rejeita negativo,
// `categories.*.amount` => `numeric|min:0`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { BudgetPlanningForm } from '@/@types/v2/Financeiro/budgetPlanning';
import type Shape from '@/@types/validations/shape';

export const budgetPlanningSchema = (languageGB: LanguageDate) => {
  const v = languageGB.financial.budgetPlanning.form.validation;

  return yup.object().shape<Shape<BudgetPlanningForm>>({
    date: yup.date().nullable().required(v.dateRequired),
    year: yup
      .number()
      .nullable()
      .required(v.yearRequired)
      // `digits:4` do servidor (`BudgetPlanningRequest::rules()`,
      // `year => required|integer|digits:4`) — mirror via checagem de
      // comprimento da string, não `.min()/.max()` numérico (evita aceitar
      // um ano de 3 ou 5 dígitos com o mesmo valor numérico de um válido).
      .test('digits-4', v.yearRequired, (value) =>
        value == null ? false : String(value).length === 4
      ),
    // `rows` — matriz FIXA (1 linha por categoria elegível, TASK-PO-FE-07).
    // NUNCA `.min(1)` no nível do array (a matriz sempre tem N linhas,
    // preenchidas ou não) — o teste abaixo conta CÉLULAS preenchidas no
    // CONJUNTO inteiro, mirror EXATO de `categories.required|array|min:1`
    // do servidor (que só recebe as linhas com valor, regra #4).
    rows: yup
      .array()
      .test('ao-menos-1-valor', v.categoriesRequired, (rows) =>
        (rows ?? []).some((row) =>
          (row?.months ?? []).some((cell: { amount?: number | null }) => cell?.amount != null)
        )
      )
      .of(
        yup.object().shape({
          months: yup.array().of(
            yup.object().shape({
              amount: yup
                .number()
                .nullable()
                // Mirror `categories.*.amount` => `numeric|min:0`
                // (`BudgetPlanningRequest`) — célula individual não aceita
                // valor negativo.
                .min(0, v.categoriesRequired)
                .transform((value, original) => (original === '' ? null : value)),
            })
          ),
        })
      ),
  });
};

export const budgetPlanningSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(budgetPlanningSchema(languageGB)) as any;

export default budgetPlanningSchemaResolver;
