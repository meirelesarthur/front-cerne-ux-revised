// src/validations/schemas/Romaneios/transfer-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de ROMANEIO (Transfer) — aba
// Cabeçalho (TASK-TRF-FE-02) + aba Itens/bloco Totais (TASK-TRF-FE-03) + aba
// Despesas acessórias (TASK-TRF-FE-04), espelhando `TransferRequest::rules()`
// (front-contract-romaneios.md §5.3, §5.4, §5.5, §5.6, §5.7;
// api-contract-romaneios.md §4.3).
//
// Armadilhas respeitadas (contrato §5.3, Tarefa #9/#11):
//   - `driver` maxLength 50 (NÃO 40 — Decisão D3).
//   - `note` SEM maxLength (servidor é `nullable|string` sem `max`).
//   - `nfe` maxLength 15.
//   - `commission` opcional, `numeric|min:0`.
//   - `due_date` OPCIONAL — validado só quando preenchido (formato ISO);
//     a decisão de omitir a chave quando vazio é do submit (§5.7), não do
//     schema (o schema só valida o formato, nunca decide presença/ausência
//     no payload).
//
// Armadilhas da aba Itens/Totais (contrato §5.4/§5.5, Tarefa #12/#17/#18):
//   - `items` nunca vazio (`min(1)`) — mensagem literal do legado.
//   - `product_uuid`/`measurement_uuid` obrigatórios (Option); `quantity`
//     `min:0.01`; `amount` `min:0` — os únicos 3 campos de linha realmente
//     obrigatórios no servidor (FID §5.4, `total_amount` deixou de ser um).
//   - `lot` maxLength 20; `discard_kg` opcional `min:0`.
//   - `total_amount`/`factor`/`factor_type`/`measurement_second` SEM
//     validação de obrigatoriedade — são conveniência/client-only, nunca
//     vão ao payload (ver `@/@types/v2/Transfers`).
//   - `funrural_percentage` `min:0 max:100` — SEM `maxlength` copiado do
//     legado (armadilha #18, impediria digitar `100,00`).
//
// Armadilhas da aba Despesas (contrato §5.6, servidor `TransferRequest`
// §`expenses.*`, Tarefa TASK-TRF-FE-04):
//   - `type`/`who_pay`/`apropriation` obrigatórios (`Option`, `v.option()`
//     genérico — mesma mensagem de `defaltStrings.validations.requiredField`,
//     sem mensagem dedicada, mirror `type`/`payment_indicator` do cabeçalho).
//   - `quantity`/`vl_unit` obrigatórios `min:0` (NÃO `min:0.01` como os itens
//     — o servidor aceita `0`, `expenses.*.quantity`/`vl_unit` são
//     `required|numeric|min:0` em `TransferRequest::rules()`).
//   - `service_reversal_uuid`/`warehouse_uuid`/`product_uuid`/`provider_uuid`
//     SEM obrigatoriedade — todos `nullable` no servidor; a tela só os EXIBE
//     condicionalmente por `type`/`who_pay` (`RomaneioExpenseRow.tsx`).
//   - `expenses` é `present|array` (D6, armadilha #1/#7) — SEM `.min(1)`,
//     diferente de `items`: `[]` é o mecanismo aprovado para remover todas as
//     despesas, inverso da armadilha de Equipes.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const transferSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.transfers.transfer.form.validation;
  const itemRowText = languageGB.transfers.transfer.form.itemRow;
  const itemMessages = itemRowText.validation;
  const expenseRowMessages = languageGB.transfers.transfer.form.expenseRow.validation;

  const optionOrNull = () =>
    yup.object({ label: yup.string(), value: yup.mixed() }).nullable().default(null);

  const numberOrNull = () =>
    yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .default(null);

  return yup.object({
    // ---- Seção "Informações gerais" ----------------------------------------
    dt_sale: v.date(),
    dt_shipping: v.date(),
    // Opcional — o servidor deriva de `dt_sale` + 1º prazo da condição de
    // pagamento quando ausente (armadilha #5 da Tarefa). Validado só quando
    // preenchido; NUNCA `required`.
    due_date: yup
      .string()
      .trim()
      .nullable()
      .default(null)
      .test(
        'is-valid-date',
        messages.invalidDate,
        (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value)
      ),
    type: v.option(),
    client_uuid: v.option(),
    user_uuid: v.option(),
    // `seller_uuid` — opcional (`providers/options`, GAP-TRF-FE-14).
    seller_uuid: yup.object({ label: yup.string(), value: yup.mixed() }).nullable().default(null),
    commission: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0, messages.commissionMin)
      .default(null),

    // ---- Seção "Faturamento e transporte" ----------------------------------
    // `''` — NUNCA `null` no form (convenção do fork p/ campo `register()`,
    // mirror `description` de `team-schema.ts`); convertido para `null` só no
    // payload (`.trim() || null`) quando vazio.
    nfe: yup.string().trim().max(15, messages.nfeMaxLength).default(''),
    payment_term_uuid: v.option(),
    type_payment: v.option(),
    payment_indicator: v.option(),
    type_title_uuid: v.option(),
    transporter_uuid: yup
      .object({ label: yup.string(), value: yup.mixed() })
      .nullable()
      .default(null),
    proprietary_uuid: yup
      .object({ label: yup.string(), value: yup.mixed() })
      .nullable()
      .default(null),
    // `maxLength` 50 — Decisão D3 (NÃO 40, o 40 do Blade era só HTML). `''`,
    // nunca `null` no form (idem `nfe`).
    driver: yup.string().trim().max(50, messages.driverMaxLength).default(''),
    fiscal_document: v.boolean(),
    // SEM `maxLength` — armadilha #10 da Tarefa (o servidor é
    // `nullable|string`, sem `max`; o 200 do legado era só HTML). `''`, nunca
    // `null` no form (idem `nfe`).
    note: yup.string().trim().default(''),

    // ---- Aba Itens (TASK-TRF-FE-03, contrato §5.4) -------------------------
    items: yup
      .array()
      .of(
        yup.object({
          item_uuid: yup.string().nullable().default(null),
          product_uuid: v.option(),
          measurement_uuid: v.option(),
          warehouse_uuid: optionOrNull(),
          package_uuid: optionOrNull(),
          lot: yup.string().trim().max(20, itemMessages.lotMaxLength).default(''),
          quantity: numberOrNull()
            .required(itemMessages.quantityRequired)
            .min(0.01, itemMessages.quantityMin),
          amount: numberOrNull()
            .required(itemMessages.amountRequired)
            .min(0, itemMessages.amountMin),
          // Conveniência bidirecional — nunca vai ao payload (armadilha #2/#3).
          total_amount: numberOrNull(),
          discard_kg: numberOrNull().min(0, itemMessages.discardKgMin),
          area_uuid: optionOrNull(),
          note: yup.string().trim().default(''),
          // Client-only (cascata produto→UM, §5.4.1) — sem validação de
          // obrigatoriedade, nunca vão ao payload.
          factor: numberOrNull(),
          factor_type: yup.mixed<'M' | 'D'>().nullable().default(null),
          measurement_second: yup.string().nullable().default(null),
        })
      )
      // `required|array|min:1` no servidor — mensagem literal do legado
      // (contrato §2.5, armadilha #13).
      .min(1, itemRowText.removeLastError)
      .default([]),

    // ---- Aba Despesas acessórias (TASK-TRF-FE-04, contrato §5.6) -----------
    expenses: yup
      .array()
      .of(
        yup.object({
          expense_uuid: yup.string().nullable().default(null),
          type: v.option(),
          service_reversal_uuid: optionOrNull(),
          warehouse_uuid: optionOrNull(),
          product_uuid: optionOrNull(),
          provider_uuid: optionOrNull(),
          quantity: numberOrNull()
            .required(expenseRowMessages.quantityRequired)
            .min(0, expenseRowMessages.quantityMin),
          vl_unit: numberOrNull()
            .required(expenseRowMessages.vlUnitRequired)
            .min(0, expenseRowMessages.vlUnitMin),
          who_pay: v.option(),
          apropriation: v.option(),
          // Client-only (hint `use_kg`, §5.6/armadilha #12) — sem validação
          // de obrigatoriedade, nunca vai ao payload.
          use_kg: yup.boolean().nullable().default(null),
        })
      )
      // `present|array` no servidor (D6) — SEM `.min(1)`: `[]` é o mecanismo
      // aprovado para remover TODAS as despesas (armadilha #1/#7, inverso da
      // regra de Equipes, onde `[]` é que dava 422).
      .default([]),

    // ---- Bloco "Totais" (TASK-TRF-FE-03, contrato §5.5) --------------------
    // Só os 5 campos que vão ao payload; `total_products`/`funrural`/`total`
    // são prévia pura (nem existem no form — computados na leitura).
    icms: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .min(0)
      .default(0),
    freight: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .min(0)
      .default(0),
    others_values: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .min(0)
      .default(0),
    discount: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .min(0)
      .default(0),
    // Base = `total_products` (armadilha #4) — a trava `funrural ≤
    // total_products` é validada na TELA (depende do total dos itens, fora
    // do alcance do Yup por campo), não aqui.
    funrural_percentage: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .min(0)
      .max(100)
      .default(0),
  });
};

export const transferSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(transferSchema(languageGB));

export default transferSchemaResolver;
