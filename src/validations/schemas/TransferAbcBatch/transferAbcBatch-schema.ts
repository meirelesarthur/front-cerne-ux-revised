// src/validations/schemas/TransferAbcBatch/transferAbcBatch-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de CRIAÇÃO de Transferência ABC de
// Animais entre Lotes (TransferAbcBatch — Operacional > Pecuária >
// Transferências, 97-Esteiras/039, TASK-FE-039-ABC-01/03), espelhando
// `TransferAbcBatchRequest::rules()` (lido no código real, `GB.Cerne.Api`) +
// fidelidade de UX ao molde `farm-transfer-create-schema.ts` (mesma classe
// de formulário: cabeçalho + repeater + subfluxo financeiro com rateio +
// parcelas).
//
// Divergências vs. o molde (`FarmTransfer`):
//  - `type` (1|2) dirige o recíproco `provider_uuid`/`client_uuid`
//    (`when('type')`, mirror `required_if`/`prohibited_if` do backend) — o
//    irmão não tem esse discriminador.
//  - `origin_batch_uuid`/`destination_batch_uuid` — `different` mútuo
//    (IG-002), sempre obrigatório (nenhum é client-only aqui).
//  - `animals[]` sempre obrigatório (não há "sem financeiro" — o financeiro
//    do TransferAbcBatch NÃO é opcional, ao contrário do `has_financial`
//    do irmão).
//  - `categories[].plan_account_uuid` — OPCIONAL (mirror
//    `financial.categories.*.plan_account_uuid: nullable`).
//  - Soma de `categories[]`/`installments[]` fechando `vl_total` (derivado
//    de `animals[].total_value`, NUNCA enviado ao servidor) — regra de UX
//    herdada do legado (IG-011/CV-007), sem equivalente `.test()` no
//    backend (o servidor só valida `min:0.01`/`gt:0` por linha).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type {
  TransferAbcAnimalForm,
  TransferAbcCategoryRowForm,
  TransferAbcInstallmentRowForm,
} from '@/@types/v2/Livestock/transferAbcBatch';
import type Shape from '@/@types/validations/shape';

const SUM_TOLERANCE = 0.01;

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

function sumValues(rows: Array<{ value?: number | null } | undefined> | undefined): number {
  return (rows ?? []).reduce((sum, row) => sum + (Number(row?.value) || 0), 0);
}

/**
 * Schema de criação — cabeçalho + cascata `type` + repeater `animals[]` +
 * subfluxo financeiro (`installments[]`/`categories[]`).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {yup.ObjectSchema<any>} Schema Yup de criação.
 */
export const transferAbcBatchSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.livestock.transferAbcBatch.form.validation;

  return yup.object({
    date: yup.string().trim().required(messages.dateRequired),

    type: optionSchema.required(messages.typeRequired),

    description: yup.string().trim().required(messages.descriptionRequired),

    // Recíproco `type` ↔ terceiro (IG-001, mirror `required_if`/`prohibited_if`).
    provider_uuid: optionSchema.when('type', {
      is: (type: { value?: number } | null) => type?.value === 1,
      then: (schema) => schema.required(messages.providerRequired),
    }),
    client_uuid: optionSchema.when('type', {
      is: (type: { value?: number } | null) => type?.value === 2,
      then: (schema) => schema.required(messages.clientRequired),
    }),

    origin_batch_uuid: optionSchema.required(messages.originBatchRequired),

    destination_batch_uuid: optionSchema
      .required(messages.destinationBatchRequired)
      .test(
        'batches-must-differ',
        messages.batchesMustDiffer,
        (value: { value?: string } | null | undefined, ctx: yup.TestContext) => {
          const originUuid = ctx.parent.origin_batch_uuid?.value;
          if (!value?.value || !originUuid) return true;
          return value.value !== originUuid;
        }
      ),

    animals: yup
      .array()
      .of(
        yup.object().shape<Shape<TransferAbcAnimalForm>>({
          animal_uuid: optionSchema.required(messages.animalRequired),
          last_weight: yup.number().nullable().default(null),
          actual_weight: yup
            .number()
            .nullable()
            .typeError(messages.numberType)
            .min(0, messages.numberType)
            .required(messages.actualWeightRequired),
          value: yup
            .number()
            .nullable()
            .typeError(messages.numberType)
            .min(0, messages.numberType)
            .required(messages.valueRequired),
          total_value: yup.number().default(0),
        })
      )
      .min(1, messages.animalsMin),

    financial_number: yup.string().trim().max(15).required(messages.financialNumberRequired),
    financial_type_title_uuid: optionSchema.required(messages.typeTitleRequired),
    financial_proprietary_uuid: optionSchema.required(messages.proprietaryRequired),
    // FD-FIN1: `.max(200)` (era `.max(60)`) — deploy a produção aguarda `TASK-BE-039-ABCFIN-02`
    // subir o mesmo limite no back (senão 422 em notas de 61-200 chars).
    financial_note: yup.string().trim().max(200).required(messages.financialNoteRequired),
    // Dropdown Sim/Não (era `yup.boolean()`) — mirror exato de `type` no mesmo schema.
    financial_fiscal_document: optionSchema.required(messages.fiscalDocumentRequired),
    financial_has_input: optionSchema.required(messages.hasInputRequired),

    financial_input_date: yup
      .string()
      .nullable()
      .when('financial_has_input', {
        is: (hasInput: { value?: boolean } | null) => hasInput?.value === true,
        then: (schema) => schema.required(messages.inputDateRequired),
      }),
    financial_input_value: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .typeError(messages.numberType)
      .when('financial_has_input', {
        is: (hasInput: { value?: boolean } | null) => hasInput?.value === true,
        then: (schema) =>
          schema.required(messages.inputValueRequired).min(0.01, messages.inputValueRequired),
      }),

    // Front-only (TASK-FE-039-ABCFIN-01) — sempre obrigatórios (spec: "TODOS AUSENTES no
    // cerne", sem condicional a `has_input`), nunca vão no payload.
    financial_qtd_installments: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .typeError(messages.numberType)
      .integer(messages.numberType)
      .min(1, messages.installmentsCountRequired)
      .required(messages.installmentsCountRequired),
    financial_first_installment_date: yup
      .string()
      .nullable()
      .required(messages.firstInstallmentDateRequired),
    financial_int_installments: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .typeError(messages.numberType)
      .integer(messages.numberType)
      .min(1, messages.installmentsIntervalRequired)
      .required(messages.installmentsIntervalRequired),

    installments: yup
      .array()
      .of(
        yup.object().shape<Shape<TransferAbcInstallmentRowForm>>({
          due_date: yup.string().nullable().required(messages.installmentDateRequired),
          value: yup
            .number()
            .nullable()
            .typeError(messages.numberType)
            .moreThan(0, messages.installmentValueRequired)
            .required(messages.installmentValueRequired),
        })
      )
      .min(1, messages.installmentsMin)
      .test('installments-sum-matches-total', messages.installmentsSumMismatch, (rows, ctx) => {
        const vlTotal = Number(ctx.parent.vl_total) || 0;
        return Math.abs(sumValues(rows) - vlTotal) <= SUM_TOLERANCE;
      }),

    categories: yup
      .array()
      .of(
        yup.object().shape<Shape<TransferAbcCategoryRowForm>>({
          category_uuid: optionSchema.required(messages.categoryRequired),
          center_uuid: optionSchema.required(messages.centerRequired),
          plan_account_uuid: optionSchema,
          value: yup
            .number()
            .nullable()
            .typeError(messages.numberType)
            .min(0.01, messages.categoryValueRequired)
            .required(messages.categoryValueRequired),
        })
      )
      .min(1, messages.categoriesMin)
      .test('categories-sum-matches-total', messages.categoriesSumMismatch, (rows, ctx) => {
        const vlTotal = Number(ctx.parent.vl_total) || 0;
        return Math.abs(sumValues(rows) - vlTotal) <= SUM_TOLERANCE;
      }),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de criação do módulo.
 */
export const transferAbcBatchSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(transferAbcBatchSchema(languageGB)) as any;
