// src/validations/schemas/Advances/advance-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de ADIANTAMENTO SALARIAL (Advance) —
// TASK-FE-adiant-salarial (97-Esteiras/034). Mirror mecânico de
// `CicloProducao/ciclo-producao-schema.ts`: FUNÇÃO que recebe `languageGB` e
// devolve o schema (mensagens i18n do próprio módulo,
// `languageGB.advances.advance.form.validation`).
//
// Local canônico (FID-G3F §6.3, default do dono): `src/validations/schemas/
// Advances/` — NÃO no folder da página (desvio de CicloProducao NÃO
// replicado aqui).
//
// `date` é STRING 'YYYY-MM-DD' via `.matches()` — NUNCA `yup.date()` (Lei/
// FID-G3F §5.2, mesmo racional de `ciclo-producao-schema.ts`).
//
// `employee_uuid`/`event_uuid` validados como STRING (uuid) — os selects
// (`SelectAsyncPaginate`) já fazem o unwrap de `.value` no `onChange` antes
// de chamar `field.onChange`.
//
// `installments` — array de linhas {month:'YYYY-MM', value}, min 1 +
// invariante de soma (`Σ(value) == amount`, tolerância 0.01) validada a
// nível de ARRAY via `.test()` lendo `ctx.parent.amount` (mirror
// `invoice-schema.ts`, técnica idêntica à soma de `categories`/`installments`
// de lá). O 422 do servidor (mesma invariante, `AdvanceRequest::after()`)
// é a rede de segurança — mapeado por campo em
// `CreateOrUpdateAdiantamento.tsx` (foco `installments`).
//
// `code`/`farm_id`/criador NUNCA entram neste schema — nunca fazem parte do
// payload (Advance não tem `code`; `farm_id` é R4, server-derived).
//
// ---- D2-REV (TASK-FE-FINANCEIRO-adiant, 97-Esteiras/034) — bloco financeiro
// ("Gerar Financeiro") ----
// `financial.*` só é validado quando `has_financial=true` (`yup.object().
// when('has_financial', ...)`, DEC-FIN-C — corrige o gap legado que só
// validava client-side, o servidor agora TAMBÉM valida as 2 somas). Datas do
// bloco financeiro (`due_date`/`input_date`) são STRING via `.matches()`,
// NUNCA `yup.date()` (mesma regra do núcleo).
//
// As 2 somas financeiras (`financial.installments`/`financial.categories`
// == `amount`, tolerância 0.01) são testadas na RAIZ do schema (NÃO dentro
// de `financial.installments`/`financial.categories`) — o projeto está em
// `yup@0.32` (não v1: `TestContext` não expõe `ctx.from`/cadeia de
// ancestrais, só `ctx.parent` = pai IMEDIATO). Como esses arrays estão 1
// nível abaixo de `financial` (2 níveis da raiz), `ctx.parent` alcançaria só
// o objeto `financial`, não a raiz com `amount`. Solução: `.test()` no
// schema RAIZ (onde `value` já É o objeto completo do form) +
// `ctx.createError({ path: 'financial.installments' | 'financial.categories',
// message })` para anexar o erro exatamente no campo do array (RHF
// `errors.financial?.installments?.message`/`.categories?.message` leem
// esse path normalmente). `percent` (rateio por categoria) é UI-only —
// NUNCA validado aqui (não vai no wire, `advance-financial-hydrate.ts`/
// `CreateOrUpdateAdiantamento.tsx` descartam antes do payload).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Tolerância das invariantes Σ(...) == amount — mirror EXATO do backend
 *  (`AdvanceRequest::after()`, `abs($sum - $amount) > 0.01`), tanto para o
 *  núcleo (`installments`) quanto para o financeiro (`financial.installments`/
 *  `financial.categories`). */
const INSTALLMENTS_SUM_TOLERANCE = 0.01;

/** Linha genérica de field-array com `value` numérico (núcleo `installments`
 *  ou financeiro `installments`/`categories`) — só o shape que `sumRowValues`
 *  precisa, evita `{}` aninhado no JSDoc (`valid-jsdoc`). */
type SumRow = { value?: number | string | null };

/**
 * Soma `Σ(row.value)` de um array de linhas — usado pelas 3 invariantes de
 * soma == amount (núcleo `installments` + financeiro `installments`/
 * `categories`).
 * @param {Array<SumRow>} rows - Linhas do field-array.
 * @return {number} Soma dos valores (0 se vazio/ausente).
 */
function sumRowValues(rows: Array<SumRow | undefined> | undefined): number {
  return (rows ?? []).reduce((sum, row) => sum + (Number(row?.value) || 0), 0);
}

export const advanceSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.advances.advance.form.validation;

  const installmentRowSchema = yup.object({
    month: yup.string().required(messages.installmentMonthRequired).matches(ISO_MONTH_REGEX, {
      message: messages.installmentMonthRequired,
      excludeEmptyString: true,
    }),
    value: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.installmentValueRequired)
      .required(messages.installmentValueRequired)
      .moreThan(0, messages.installmentValueRequired),
  });

  // ---- Bloco financeiro (D2-REV) — linhas de "Parcelas Financeiras" ----
  const financialInstallmentRowSchema = yup.object({
    due_date: yup
      .string()
      .required(messages.dueDateRequired)
      .matches(ISO_DATE_REGEX, { message: messages.dueDateRequired, excludeEmptyString: true }),
    value: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.financialValueRequired)
      .required(messages.financialValueRequired)
      .moreThan(0, messages.financialValueRequired),
  });

  // ---- Bloco financeiro (D2-REV) — linhas de "Rateio por Categoria" ----
  // `percent` NÃO é validado (UI-only, nunca vai no wire).
  const financialCategoryRowSchema = yup.object({
    category_uuid: yup.string().required(messages.financialCategoryRequired).matches(UUID_REGEX, {
      message: messages.financialCategoryRequired,
      excludeEmptyString: true,
    }),
    center_uuid: yup
      .string()
      .required(messages.costCenterRequired)
      .matches(UUID_REGEX, { message: messages.costCenterRequired, excludeEmptyString: true }),
    value: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.financialValueRequired)
      .required(messages.financialValueRequired)
      .moreThan(0, messages.financialValueRequired),
    percent: yup
      .number()
      .nullable()
      .transform((value, original) => (original === '' || original === null ? null : value)),
  });

  // ---- financial.* QUANDO has_financial=true (validação plena) ----
  const financialSchemaActive = yup.object({
    type_uuid: yup
      .string()
      .required(messages.typeRequired)
      .matches(UUID_REGEX, { message: messages.typeRequired, excludeEmptyString: true }),
    provider_uuid: yup.string().nullable(),
    proprietary_uuid: yup.string().nullable(),
    number: yup.string().nullable().max(15),
    note: yup.string().nullable().max(1000),
    fiscal_document: yup
      .string()
      .oneOf(['0', '1'], messages.fiscalDocumentRequired)
      .required(messages.fiscalDocumentRequired),
    has_input: yup.boolean().nullable(),
    input_date: yup
      .string()
      .nullable()
      .matches(ISO_DATE_REGEX, { excludeEmptyString: true })
      .when('has_input', {
        is: true,
        then: (schema) => schema.required(messages.inputDateRequired),
      }),
    input_value: yup
      .number()
      .nullable()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .when('has_input', {
        is: true,
        then: (schema) =>
          schema.required(messages.inputValueRequired).moreThan(0, messages.inputValueRequired),
      }),
    // Σ(financial.installments.value) == amount (0.01) — FE-FIN-INST-SUM.
    // O teste de SOMA em si vive na RAIZ do schema (ver comentário de
    // cabeçalho — yup 0.32 não alcança `amount` da raiz a partir daqui).
    installments: yup
      .array()
      .of(financialInstallmentRowSchema)
      .min(1, messages.installmentsRequired)
      .required(messages.installmentsRequired),
    // Σ(financial.categories.value) == amount (0.01) — FE-FIN-CAT-SUM.
    categories: yup
      .array()
      .of(financialCategoryRowSchema)
      .min(1, messages.financialCategoryRequired)
      .required(messages.financialCategoryRequired),
  });

  // ---- financial.* QUANDO has_financial=false — schema permissivo, NADA é
  // validado/exigido (o `financial` do RHF continua populado por conveniência
  // de tipos, mas é descartado inteiro do payload, §B.8). ----
  const financialSchemaInactive = yup.object({
    type_uuid: yup.string().nullable(),
    provider_uuid: yup.string().nullable(),
    proprietary_uuid: yup.string().nullable(),
    number: yup.string().nullable(),
    note: yup.string().nullable(),
    fiscal_document: yup.string().nullable(),
    has_input: yup.boolean().nullable(),
    input_date: yup.string().nullable(),
    input_value: yup.number().nullable(),
    installments: yup.array().notRequired(),
    categories: yup.array().notRequired(),
  });

  return (
    yup
      .object({
        employee_uuid: yup
          .string()
          .required(messages.employeeRequired)
          .matches(UUID_REGEX, { message: messages.employeeRequired, excludeEmptyString: true }),
        event_uuid: yup
          .string()
          .required(messages.eventRequired)
          .matches(UUID_REGEX, { message: messages.eventRequired, excludeEmptyString: true }),
        date: yup
          .string()
          .required(messages.dateRequired)
          .matches(ISO_DATE_REGEX, { message: messages.dateRequired, excludeEmptyString: true }),
        amount: yup
          .number()
          .transform((value, original) =>
            original === '' || original === null ? undefined : value
          )
          .typeError(messages.amountRequired)
          .required(messages.amountRequired)
          .moreThan(0, messages.amountRequired),
        installments: yup
          .array()
          .of(installmentRowSchema)
          .min(1, messages.installmentsRequired)
          .required(messages.installmentsRequired)
          // Invariante Σ(value) == amount (0.01) — FE-FORM-SUMCALC, mirror
          // `invoice-schema.ts` ('installments-sum-total'). Arrow function +
          // `ctx.parent` (não `function(){...}`/`this.parent`) — evita
          // `no-invalid-this` do ESLint do projeto (mesma convenção de
          // `ciclo-producao-schema.ts`). Aqui `ctx.parent` JÁ é a raiz
          // (installments é campo direto do root) — diferente do financeiro,
          // que está 1 nível mais fundo (ver testes de soma abaixo).
          .test('installments-sum', messages.installmentsSum, (rows, ctx) => {
            const amount = Number(ctx.parent?.amount) || 0;
            return Math.abs(sumRowValues(rows) - amount) <= INSTALLMENTS_SUM_TOLERANCE;
          }),
        // ---- D2-REV — "Gerar Financeiro" ----
        has_financial: yup.boolean().default(false),
        financial: yup.object().when('has_financial', {
          is: true,
          then: () => financialSchemaActive,
          otherwise: () => financialSchemaInactive,
        }),
      })
      // ---- Somas do bloco financeiro (FE-FIN-INST-SUM/FE-FIN-CAT-SUM) —
      // testadas na RAIZ (yup 0.32, ver comentário de cabeçalho) com
      // `ctx.createError({ path })` para anexar o erro no campo do array. Só
      // rodam quando `has_financial=true` (senão a soma é irrelevante). ----
      .test('financial-installments-sum', messages.financialInstallmentsSum, (value: any, ctx) => {
        if (!value?.has_financial) return true;
        const amount = Number(value?.amount) || 0;
        if (
          Math.abs(sumRowValues(value?.financial?.installments) - amount) <=
          INSTALLMENTS_SUM_TOLERANCE
        ) {
          return true;
        }
        return ctx.createError({
          path: 'financial.installments',
          message: messages.financialInstallmentsSum,
        });
      })
      .test('financial-categories-sum', messages.apportionmentSum, (value: any, ctx) => {
        if (!value?.has_financial) return true;
        const amount = Number(value?.amount) || 0;
        if (
          Math.abs(sumRowValues(value?.financial?.categories) - amount) <=
          INSTALLMENTS_SUM_TOLERANCE
        ) {
          return true;
        }
        return ctx.createError({
          path: 'financial.categories',
          message: messages.apportionmentSum,
        });
      })
  );
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const advanceSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(advanceSchema(languageGB)) as any;

export default advanceSchemaResolver;
