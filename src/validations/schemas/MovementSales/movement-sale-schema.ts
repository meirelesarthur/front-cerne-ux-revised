// src/validations/schemas/MovementSales/movement-sale-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de VENDA DE ANIMAIS (MovementSale) —
// TASK-VD-FE-02, contrato de tela §7.1/§7.2/§7.3/§7.8, espelhando
// `MovementSaleRequest::rules()` (api-contract-vendas.md §5, GB.Cerne.Api
// branch `feature/vendas-nascimentos-for-api`, lido nesta Tarefa).
//
// Cascata IG5/IG6/IG9 (contrato §7.1) NÃO é validada aqui por `when()` —
// depende de estado computado na TELA (número de `items`, se veio de XML,
// etc.) que o Yup por campo não alcança sem duplicar lógica; a tela
// (`CreateOrUpdateMovementSale.tsx`) aplica a cascata via `setValue`/campos
// `readOnly` diretamente, mirror `CreateOrUpdateRomaneio.tsx` (cascata #6
// idêntica, também fora do schema).
//
// `items`/`categories` só validam o MÍNIMO server-side real
// (`items: required|array|min:1`, mirror `contrato §5.4` de Romaneios) — o
// preço por categoria (`value_real`/`value_head`) é obrigatório conforme
// `pricing_type`, mas essa condicional depende do valor de OUTRO campo do
// formulário raiz (`pricing_type`), resolvida via `.test()` no array
// (Yup não alcança o pai a partir do item aninhado sem contexto extra).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type {
  MovementSaleAllocationRowForm,
  MovementSaleInstallmentRowForm,
} from '@/@types/v2/MovementSales';
import type Shape from '@/@types/validations/shape';

// TASK-VD-FE-04 (fundação, atualização do task-packet 2026-08-20 — achados
// GAP-VD-14/GAP-VD-15 da camada api) — `'finish'` (individual) e
// `'finishMany'` (lote) deixam de compartilhar 1 único modo: a API já
// aceita/persiste `type_payment` na finalização INDIVIDUAL (`GAP-VD-14`), mas
// o controller de LOTE descarta o campo por construção (`D-LOTE-a`, defeito
// legado preservado por decisão do dono) — exigi-lo no `'finishMany'`
// reproduziria exatamente o bug original ("toast sem campo destacado").
export type MovementSaleSchemaMode = 'default' | 'finish' | 'finishMany';

// TASK-VD-FE-04 (fundação compartilhada, GAP-VENDAS-FE-04 §5) — mesmas
// tolerâncias do mirror `farm-transfer-create-schema.ts`: rateio fecha com
// igualdade exata no legado, tolerância `0.01` adotada aqui (divergência
// deliberada, documentada); parcelamento com tolerância PROPORCIONAL
// (`0.01 × nº de linhas`, padrão de parcelamento do fork,
// `ExpenseInstallmentsTab.tsx`).
const ALLOCATION_SUM_TOLERANCE = 0.01;
const INSTALLMENT_SUM_TOLERANCE_PER_ROW = 0.01;

function sumRowValues(rows: Array<{ value?: number | null } | undefined> | undefined): number {
  return (rows ?? []).reduce((sum, row) => sum + (Number(row?.value) || 0), 0);
}

export const movementSaleSchema = (
  languageGB: LanguageDate,
  mode: MovementSaleSchemaMode = 'default'
) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.movementSales.movementSale.form.validation;

  const optionOrNull = () =>
    yup.object({ label: yup.string(), value: yup.mixed() }).nullable().default(null);

  const numberOrNull = () =>
    yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .default(null);

  // ---- Subfluxo financeiro (TASK-VD-FE-04) — mirror LITERAL do padrão de
  // `farm-transfer-create-schema.ts`: 2 schemas por linha (`...Passive` sem
  // `.required()`, `...Required`), trocados via `.when('has_financial')` no
  // nível do próprio array (o `.test()` de soma acessa o irmão `total` via
  // `ctx.parent`, sem precisar de `context`/`$ref`). ----------------------
  const allocationRowSchemaRequired = yup.object().shape<Shape<MovementSaleAllocationRowForm>>({
    category_uuid: yup.object().nullable().required(messages.incomeCategoryRequired),
    center_uuid: yup.object().nullable().required(messages.incomeCenterRequired),
    // VD-API-03 (`GAP-API-FE-03`) — Conta Contábil é OPCIONAL (mirror legado,
    // norm L1283 — rateio sem conta continua válido), nunca `.required()`.
    plan_account_uuid: yup.object().nullable().default(null),
    value: yup
      .number()
      .nullable()
      .typeError(messages.numberType)
      .moreThan(0, messages.incomeValueRequired)
      .required(messages.incomeValueRequired),
  });

  const allocationRowSchemaPassive = yup.object().shape<Shape<MovementSaleAllocationRowForm>>({
    category_uuid: yup.object().nullable().default(null),
    center_uuid: yup.object().nullable().default(null),
    plan_account_uuid: yup.object().nullable().default(null),
    value: yup.number().nullable().default(null),
  });

  const installmentRowSchemaRequired = yup.object().shape<Shape<MovementSaleInstallmentRowForm>>({
    date: yup.string().nullable().required(messages.installmentDateRequired),
    value: yup
      .number()
      .nullable()
      .typeError(messages.numberType)
      .moreThan(0, messages.installmentValueRequired)
      .required(messages.installmentValueRequired),
  });

  const installmentRowSchemaPassive = yup.object().shape<Shape<MovementSaleInstallmentRowForm>>({
    date: yup.string().nullable().default(null),
    value: yup.number().nullable().default(null),
  });

  return yup.object({
    code: yup.string().default(''),
    dt_sale: v.date(),
    seller_uuid: optionOrNull(),
    batch_sale: v.boolean(),
    // Condicional a `batch_sale` — mensagem literal do contrato (§7.1),
    // `(value, context)` — mirror `breeding-season-schema.ts`
    // (`end_date`/`start_date`), evita `function(){ this.parent }`
    // (`no-invalid-this`).
    batch_uuid: optionOrNull().test(
      'batch-required-when-batch-sale',
      messages.batchRequired,
      (value, context) => {
        const batchSale = (context?.parent as { batch_sale?: boolean } | undefined)?.batch_sale;
        if (!batchSale) return true;
        return !!value?.value;
      }
    ),
    // TASK-VD-FE-04 (GAP-VENDAS-FE-04 §5.24) — relaxado em `'finish'`/
    // `'finishMany'`: no lote é estruturalmente inexistente (multi-venda,
    // `mapMovementSaleDetailsToFinishManyFormValues` zera por construção); a
    // Finalização individual também não renderiza o campo. Pré-requisito
    // para a tela de Finalizar voltar a submeter.
    client_uuid: mode === 'default' ? v.option().required(messages.clientRequired) : optionOrNull(),
    type_sale: v.option().required(messages.typeSaleRequired),
    pricing_type: v.option().required(messages.requiredField),
    chave: yup.string().nullable().default(null),
    number: yup.string().nullable().default(null),
    serie: yup.string().nullable().default(null),
    // D1-a/GAP-VD-14/D-LOTE-a — `type_payment` diverge entre os 2 modos de
    // Finalizar (atualização 2026-08-20 do task-packet, achado da camada
    // api): permanece OBRIGATÓRIO em `'default'`/`'finish'` (a API já aceita
    // e persiste na finalização INDIVIDUAL, Tarefa 22 passa a renderizá-lo);
    // RELAXADO em `'finishMany'` (o controller de lote descarta o campo por
    // construção, `D-LOTE-a` — exigi-lo reproduziria o bug original de campo
    // obrigatório invisível). Contrato da API (`sometimes|string|max:2`,
    // permissivo) NÃO é harmonizado — o cliente é deliberadamente mais
    // estrito em `'finish'`, fiel ao legado.
    type_payment:
      mode === 'finishMany' ? optionOrNull() : v.option().required(messages.typePaymentRequired),
    // TASK-VD-FE-04 (GAP-VENDAS-FE-04 §5.24) — relaxado em `'finish'`/
    // `'finishMany'`: não renderizado em nenhuma das duas telas de Finalizar
    // (pertence só ao Criar/Editar no legado).
    gtas:
      mode === 'default'
        ? yup.string().trim().required(messages.gtasRequired)
        : yup.string().trim().default(''),
    note: yup.string().trim().default(''),
    has_financial: v.boolean(),
    // UT-000719 (D-097-12) — Documento Fiscal (Sim/Não), default Sim; nunca
    // obrigatório (só enviado na Finalização com `has_financial`).
    fiscal_document: v.boolean().default(true),

    // ---- Subfluxo financeiro (TASK-VD-FE-04) — só valida quando
    // `has_financial === true` (mirror legado `if (has_financial == 0)
    // return true;`); soma comparada contra `total` (recalculado pela
    // tela/mapper — em Vendas não há `vl_total` digitado, diferente de
    // Trans. Fazendas). ------------------------------------------------------
    financial_allocations: yup
      .array()
      .of(allocationRowSchemaPassive)
      .when('has_financial', {
        is: true,
        then: (schema) =>
          schema
            .of(allocationRowSchemaRequired)
            .min(1, messages.incomeCategoryRequired)
            .test(
              'financial-allocations-sum-matches-total',
              messages.incomeSumMismatch,
              (rows, ctx) => {
                const total = Number(ctx.parent.total) || 0;
                return Math.abs(sumRowValues(rows) - total) <= ALLOCATION_SUM_TOLERANCE;
              }
            ),
      }),

    financial_installments: yup
      .array()
      .of(installmentRowSchemaPassive)
      .when('has_financial', {
        is: true,
        then: (schema) =>
          schema
            .of(installmentRowSchemaRequired)
            .min(1, messages.installmentsMin)
            .test(
              'financial-installments-sum-matches-total',
              messages.installmentsSumMismatch,
              (rows, ctx) => {
                const total = Number(ctx.parent.total) || 0;
                const tolerance =
                  INSTALLMENT_SUM_TOLERANCE_PER_ROW * Math.max((rows ?? []).length, 1);
                return Math.abs(sumRowValues(rows) - total) <= tolerance;
              }
            ),
      }),

    // ---- Itens (contrato §7.2/§7.4) ----------------------------------------
    items: yup
      .array()
      .of(
        yup.object({
          animal_uuid: v.option().required(messages.animalRequired),
          category_uuid: optionOrNull(),
          previous_weight_kg: numberOrNull(),
          entry_date: yup.string().nullable().default(null),
          weight_kg: numberOrNull()
            .required(messages.weightRequired)
            .moreThan(0, messages.weightMin),
          // TASK-VD-FE-03 (contrato §8) — `carcass_weight`/`performance`
          // `required|numeric` no `MovementSaleSlaughterRequest`/
          // `MovementSaleSlaughterManyRequest` reais, na Finalização de
          // abate (`'finish'`/`'finishMany'`); no fluxo principal
          // (`'default'`, Tarefa 15) continuam opcionais.
          performance:
            mode === 'default' ? numberOrNull() : numberOrNull().required(messages.requiredField),
          gain: numberOrNull(),
          gmd: numberOrNull(),
          carcass_weight:
            mode === 'default'
              ? numberOrNull()
              : numberOrNull().required(messages.requiredField).min(0, messages.weightMin),
          note: yup.string().trim().default(''),
        })
      )
      // `required|array|min:1` no servidor (`MovementSaleRequest`).
      .min(1, messages.itemsMin)
      .default([]),

    // ---- Categorias agregadas (contrato §7.3) — derivadas de `items`, mas
    // o PREÇO (`value_real`/`value_head`, conforme `pricing_type`) é digitado
    // pelo usuário aqui e precisa ser validado antes do submit. ------------
    categories: yup
      .array()
      .of(
        yup.object({
          category_uuid: yup.string().required(),
          description: yup.string().default(''),
          quantity: yup.number().default(0),
          value_real: numberOrNull(),
          value_arroba: numberOrNull(),
          value_head: numberOrNull(),
          value_total: yup.number().default(0),
        })
      )
      .min(1, messages.categoriesMin)
      .default([])
      .test(
        'category-price-required',
        messages.categoryValueRequired,
        (
          categories: Array<{ value_real?: number | null; value_head?: number | null }> | undefined,
          context: yup.TestContext
        ) => {
          const pricingType = (context?.parent as { pricing_type?: { value?: number } } | undefined)
            ?.pricing_type?.value;
          if (!categories || categories.length === 0) return true;
          return categories.every((category) =>
            pricingType === 2
              ? category.value_head !== null && category.value_head !== undefined
              : category.value_real !== null && category.value_real !== undefined
          );
        }
      ),

    // ---- Bloco "Totais" (contrato §7.5) — só os 3 campos que vão ao
    // payload; `total_products`/`total` são prévia pura (`MovementSaleTotalsBlock`). --
    average_weight_kg: numberOrNull(),
    total_products: yup.number().default(0),
    freight: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .min(0)
      .default(0),
    other_values: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .min(0)
      .default(0),
    discount: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .min(0)
      .default(0),
    total: yup.number().default(0),
  });
};

export const movementSaleSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(movementSaleSchema(languageGB));

// TASK-VD-FE-03 (contrato §8) — resolver dedicado da Finalização de abate
// INDIVIDUAL (`carcass_weight`/`performance` obrigatórios por linha;
// `type_payment` OBRIGATÓRIO — GAP-VD-14, a API já aceita/persiste na
// finalização individual).
export const movementSaleFinishSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(movementSaleSchema(languageGB, 'finish'));

// TASK-VD-FE-04 (fundação, atualização 2026-08-20) — resolver dedicado da
// Finalização de abate EM LOTE: mesmas obrigatoriedades de item de
// `'finish'`, mas `type_payment` RELAXADO (`D-LOTE-a` — o controller de
// lote descarta o campo por construção). A troca do resolver em
// `FinishMovementSaleMany.tsx` é da Tarefa 22 — este arquivo só o exporta.
export const movementSaleFinishManySchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(movementSaleSchema(languageGB, 'finishMany'));

export default movementSaleSchemaResolver;
