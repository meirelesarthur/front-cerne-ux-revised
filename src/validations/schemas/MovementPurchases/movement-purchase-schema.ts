// src/validations/schemas/MovementPurchases/movement-purchase-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de COMPRA DE ANIMAIS (MovementPurchase)
// — TASK-CP-04 (fundação, cabeçalho) + TASK-CP-06 (itens) + TASK-CP-07
// (financeiro), espelhando `MovementPurchaseRequest::rules()`
// (contrato-api-compras-movimento.md §5, GB.Cerne.Api, branch
// `feature/refactor-movement-purchase-and-breeding-batch-for-api`, lido
// nesta Tarefa). Mirror `movement-sale-schema.ts`.
//
// ---- Itens (TASK-CP-06) --------------------------------------------------
// Campos validados: `category_uuid` (obrigatório), `quantity` (`min:0.01` no
// servidor; UI usa `min 1` — animais são unidades inteiras, FLD-19 do
// legado), `value_unit`/`amount` (`>= 0`). `batch_uuid`/`grazing_uuid`/
// `center_uuid`/os 15 campos fiscais NÃO são validados aqui — não são
// renderizados (decisão de fidelidade §4.1/§4.2 do contrato de frontend +
// task-packet RUN-047, `MovementPurchaseItemData` real não os aceita).
//
// ---- Financeiro (088 D3-FE-T4) ------------------------------------------
// Compõe os campos de `movement-purchase-financial-schema.ts` (cabeçalho,
// entrada, gerador, parcelas — Σ em centavos = total) e o schema de rateio de
// `movement-purchase-allocation-schema.ts` (mín. 1 linha, tripla única, Σ valores
// = total em centavos). Tudo só vale com `has_financial=true` e SEM baixa
// (`financial_write_off`, D2 — passivo). Espelha `MovementPurchaseRequest`
// (plano API §2.2); o servidor repete as regras e devolve 422 por campo.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

import { movementPurchaseAllocationsSchema } from './movement-purchase-allocation-schema';
import { movementPurchaseFinancialFields } from './movement-purchase-financial-schema';

export const movementPurchaseSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.movementPurchases.movementPurchase.form.validation;

  const optionOrNull = () =>
    yup.object({ label: yup.string(), value: yup.mixed() }).nullable().default(null);

  const numberOrNull = () =>
    yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .default(null);

  // D2 (088) — com parcela baixada o rateio hidratado não é validado.
  const allocationRowPassive = yup.object({
    category: yup.object().nullable(),
    plan_account: yup.object().nullable(),
    center: yup.object().nullable(),
    percent: yup.number().nullable(),
    value: yup.number().nullable(),
  });

  return yup.object({
    code: yup.string().default(''),
    dt_sale: v.date(),
    provider_uuid: v.option().required(messages.providerRequired),
    seller_uuid: optionOrNull(),
    // `MovementPurchaseRequest::rules()` real: `sometimes|nullable|digits:44`
    // — editável (achado de fidelidade, ver docblock de
    // `@/@types/v2/MovementPurchases`), mas sem `.required()`.
    chave: yup
      .string()
      .nullable()
      .default(null)
      .test('chave-digits-44', messages.chaveInvalid, (value) => {
        if (!value) return true;
        return /^\d{44}$/.test(value);
      }),
    number: yup.string().nullable().default(null),
    serie: yup.string().nullable().default(null),
    // 088 — Forma de Pagamento só existe (e só é obrigatória) com Gerar
    // Financeiro = Sim; espelha `required_if:has_financial,true` da API.
    type_payment: optionOrNull().when('has_financial', {
      is: true,
      then: () => v.option().required(messages.typePaymentRequired),
    }),
    gtas: yup.string().trim().default(''),
    note: yup.string().trim().default(''),

    // ---- Bloco "Totais" (contrato §5/FLD-10..14) — mirror Vendas, campos
    // não-negativos; `total_products`/`total` são prévia (recalculada na
    // tela, `CreateOrUpdateMovementPurchase.tsx`). ------------------------
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

    // ---- Itens (TASK-CP-06, contrato §5 FLD-18..23 exceto os 3 campos
    // NÃO renderizados por decisão de fidelidade §4.2 e os 15 campos
    // fiscais §4.1, fora do DTO real). -------------------------------------
    items: yup
      .array()
      .of(
        yup.object({
          category_uuid: v.option().required(messages.itemCategoryRequired),
          batch_uuid: optionOrNull(),
          grazing_uuid: optionOrNull(),
          center_uuid: optionOrNull(),
          quantity: numberOrNull()
            .required(messages.itemQuantityRequired)
            .min(1, messages.itemQuantityMin),
          // D5 (088) — espelha `items.*.value_unit: required|numeric|gt:0` da
          // API; mensagem por linha (campo `items.N.value_unit`).
          value_unit: numberOrNull()
            .required(messages.itemValueUnitRequired)
            .moreThan(0, messages.itemValueUnitMin),
          amount: numberOrNull().min(0, messages.numberType).default(0),
          note: yup.string().trim().default(''),
          item_description: yup.string().nullable().default(null),
        })
      )
      // `required|array|min:1` no servidor (`MovementPurchaseRequest`).
      .min(1, messages.itemsMin)
      .default([]),

    has_financial: v.boolean(),
    // D2 (088) — parcela baixada: bloco financeiro travado, sem validação.
    financial_write_off: yup.boolean().default(false),

    // ---- Subfluxo financeiro (D3-FE-T4) — cabeçalho, entrada, gerador e
    // parcelas (T2). ---------------------------------------------------------
    ...movementPurchaseFinancialFields(languageGB),

    // Rateio (T3) — obrigatório (mín. 1 linha, Σ = total) só com financeiro ativo.
    financial_allocations: yup
      .array()
      .of(allocationRowPassive)
      .default([])
      .when(['has_financial', 'financial_write_off'], {
        is: (hasFinancial: boolean, writeOff: boolean) => hasFinancial === true && !writeOff,
        then: () => movementPurchaseAllocationsSchema(languageGB),
      }),
  });
};

export const movementPurchaseSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(movementPurchaseSchema(languageGB));

export default movementPurchaseSchemaResolver;
