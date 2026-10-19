// src/validations/schemas/WriteOff/writeoff-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do módulo COMPARTILHADO de Baixa Manual (WriteOff)
// — TASK-FE-036-330. Consumido por `WriteOffCreateModal` (Tarefa 331), para
// os 2 segmentos (`incomes`/`expenses`) — NÃO duplicar em Income/Expense.
//
// Mirror EXATO das regras reais de `ManualWriteOffIncomeRequest`/
// `ManualWriteOffExpenseRequest` (leitura direta do backend,
// `TASK-036-GB-07/08`):
//   writeoff_type            — required, oneOf as 6 chaves POR SEGMENTO
//                               (`WRITEOFF_COUNTERPART_TYPES_BY_SEGMENT`,
//                               mirror `WriteOffCounterpartType::availableForExpenses()`/
//                               `availableForIncomes()`).
//   account_uuid/movement_date — `required_if:writeoff_type,M` — deixam de
//                               ser incondicionalmente obrigatórios.
//                               `reason_uuid` SAIU (`TASK-036-GB-06`) —
//                               motivo resolvido no servidor, nunca mais
//                               campo do form/payload.
//   related_title_uuid       — `required_if:writeoff_type,B`.
//   nfe_uuid                 — `required_if:writeoff_type,D` (só `expenses`).
//   external_income_uuid     — `required_if:writeoff_type,I` (só `expenses`).
//   external_expense_uuid    — `required_if:writeoff_type,E` (só `incomes`).
//   card_bill_uuid           — `required_if:writeoff_type,C` (só `expenses`).
//   amount                   — required, numeric, > 0 (`gt:0`).
//   discount/penalty/interest/increase — opcionais (`sometimes`), >= 0
//                               (`min:0`) quando presentes.
//   note                     — opcional, string. ATENÇÃO (registrado por
//                               instrução da Tarefa 330): a `Request` valida
//                               `max:1500`, mas a COLUNA física do banco
//                               (`writeoffs.note`) é `varchar(150)` — a
//                               mensagem 422 do servidor pode divergir do
//                               limite aqui. Usamos `max:150` como
//                               SALVAGUARDA REAL no front (mais restritivo
//                               que a Request, nunca `1500`) — evita que o
//                               usuário digite um valor que o front aceita
//                               mas o banco trunca/rejeita.
//   categories               — required, array, min:1; cada linha exige
//                               `category_uuid`/`center_uuid`/`value`
//                               (`plan_account_uuid`/`harvest_uuid`
//                               opcionais).
//   SUM(categories[].value) === net_value — validado no servidor com
//                               tolerância `0.01`; `net_value` NÃO é campo do
//                               form, é calculado pela MESMA fórmula do
//                               backend (`ManualWriteOffIncomeAction`/
//                               `ManualWriteOffExpenseAction`):
//                               `amount - discount + penalty + interest + increase`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { WRITEOFF_COUNTERPART_TYPES_BY_SEGMENT } from '@/constants/WriteOff/writeoff-counterpart-type';

import type { LanguageDate } from '@/@types/language';
import type { WriteOffSegment } from '@/@types/v2/WriteOff';

// Mirror EXATO da tolerância real do backend (`ManualWriteOffIncomeAction`/
// `ManualWriteOffExpenseAction`, comparação `SUM(categories[].value) ==
// net_value`) — NÃO inventar tolerância diferente da confirmada na Tarefa 330.
const WRITEOFF_SUM_TOLERANCE = 0.01;

// Salvaguarda real do front — coluna física `writeoffs.note` é
// `varchar(150)`; a Request valida `max:1500`, mas usamos o limite mais
// restritivo aqui (ver cabeçalho do arquivo).
const NOTE_MAX_LENGTH = 150;

/**
 * MESMA fórmula do backend (`ManualWriteOffIncomeAction::handle()`/
 * `ManualWriteOffExpenseAction::handle()`) — preview client-side de
 * `net_value`, nunca enviado ao payload (`WriteOffPayload` não tem o campo).
 * @param {object} fields - Campos monetários de topo do form (`amount`/`discount`/`penalty`/`interest`/`increase`).
 * @return {number} O valor líquido calculado (`amount - discount + penalty + interest + increase`).
 */
export function calculateWriteOffNetValue(fields: {
  amount?: number | null;
  discount?: number | null;
  penalty?: number | null;
  interest?: number | null;
  increase?: number | null;
}): number {
  const amount = Number(fields.amount) || 0;
  const discount = Number(fields.discount) || 0;
  const penalty = Number(fields.penalty) || 0;
  const interest = Number(fields.interest) || 0;
  const increase = Number(fields.increase) || 0;
  return amount - discount + penalty + interest + increase;
}

export const writeOffSchema = (languageGB: LanguageDate, segment: WriteOffSegment) => {
  const messages = languageGB.writeOff.form.validation;
  const availableTypes = WRITEOFF_COUNTERPART_TYPES_BY_SEGMENT[segment];

  const categoryItemSchema = yup.object({
    category_uuid: yup.object().nullable().required(messages.categoryRequired),
    center_uuid: yup.object().nullable().required(messages.centerRequired),
    plan_account_uuid: yup.object().nullable(),
    value: yup
      .number()
      .nullable()
      .typeError(messages.categoryValueRequired)
      .min(0.01, messages.categoryValueRequired)
      .required(messages.categoryValueRequired),
  });

  return yup.object({
    writeoff_type: yup
      .string()
      .nullable()
      .oneOf([...availableTypes, null], messages.writeoffTypeRequired)
      .required(messages.writeoffTypeRequired),
    account_uuid: yup
      .object()
      .nullable()
      .when('writeoff_type', {
        is: 'M',
        then: (schema) => schema.required(messages.accountRequired),
      }),
    movement_date: yup
      .string()
      .nullable()
      .when('writeoff_type', {
        is: 'M',
        then: (schema) => schema.required(messages.movementDateRequired),
      }),
    related_title_uuid: yup
      .object()
      .nullable()
      .when('writeoff_type', {
        is: 'B',
        then: (schema) => schema.required(messages.advanceTitleRequired),
      }),
    nfe_uuid: yup
      .object()
      .nullable()
      .when('writeoff_type', {
        is: 'D',
        then: (schema) => schema.required(messages.nfeRequired),
      }),
    external_income_uuid: yup
      .object()
      .nullable()
      .when('writeoff_type', {
        is: 'I',
        then: (schema) => schema.required(messages.incomeTitleRequired),
      }),
    external_expense_uuid: yup
      .object()
      .nullable()
      .when('writeoff_type', {
        is: 'E',
        then: (schema) => schema.required(messages.expenseTitleRequired),
      }),
    card_bill_uuid: yup
      .object()
      .nullable()
      .when('writeoff_type', {
        is: 'C',
        then: (schema) => schema.required(messages.cardBillRequired),
      }),
    amount: yup
      .number()
      .nullable()
      .typeError(messages.amountRequired)
      .moreThan(0, messages.amountRequired)
      .required(messages.amountRequired),
    discount: yup.number().nullable().min(0, messages.negativeValueNotAllowed),
    penalty: yup.number().nullable().min(0, messages.negativeValueNotAllowed),
    interest: yup.number().nullable().min(0, messages.negativeValueNotAllowed),
    increase: yup.number().nullable().min(0, messages.negativeValueNotAllowed),
    note: yup.string().trim().max(NOTE_MAX_LENGTH, messages.noteMaxLength),

    categories: yup
      .array()
      .of(categoryItemSchema)
      .min(1, messages.categoriesRequired)
      .required(messages.categoriesRequired)
      // Tolerância `0.01` — MESMA do backend (`SUM(categories[].value) ==
      // net_value`), `net_value` recalculado pela MESMA fórmula do servidor,
      // NUNCA um campo próprio do form.
      .test('categories-sum-net-value', messages.categoriesSumMismatch, (items, testContext) => {
        if (!items || items.length === 0) return true;
        const parent = testContext.parent as {
          amount?: number;
          discount?: number;
          penalty?: number;
          interest?: number;
          increase?: number;
        };
        const netValue = calculateWriteOffNetValue(parent);
        const sum = items.reduce((acc, item) => acc + (Number(item?.value) || 0), 0);
        return Math.abs(sum - netValue) <= WRITEOFF_SUM_TOLERANCE;
      }),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` do `WriteOffCreateModal`
 * (Tarefa 331) — mirror `incomeSchemaResolver`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @param {WriteOffSegment} segment - Segmento (`incomes`/`expenses`) — define o universo de `writeoff_type` aceito.
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const writeOffSchemaResolver = (languageGB: LanguageDate, segment: WriteOffSegment) =>
  yupResolver(writeOffSchema(languageGB, segment)) as any;

export default writeOffSchemaResolver;

// -----------------------------------------------------------------------------
// LOTE — TASK-FE-036-334 + correção `GAP-036-114`/`TASK-FE-036-343` v2.0
// (RE-ESCOPO A3). Mirror EXATO das regras reais de `BatchWriteOffRequest`
// (leitura direta do backend, `TASK-036-GB-05` v2.0):
//   banking_movement — required, boolean (`true` Movimento Bancário |
//                       `false` Baixa Cruzada).
//   account_uuid     — required_if banking_movement=true (Baixa Cruzada não
//                       usa conta bancária).
//   related_title_uuid — required_if banking_movement=false (título de
//                       ADIANTAMENTO do MESMO segmento).
//   writeoff_type     — required_if banking_movement=true ('M' Separado |
//                       'U' Único).
//   movement_date     — required, date (ÚNICO para o lote inteiro).
//   note              — opcional, string. Mesma salvaguarda `max:150` real
//                       (coluna física `writeoffs.note`) do schema individual.
//   penalty/interest/increase — opcionais (`sometimes`), >= 0. AGREGADOS do
//                       LOTE (só relevantes quando writeoff_type='U') — NUNCA
//                       por linha (`rows[].discount` é o ÚNICO encargo por
//                       linha).
//   description       — opcional, string, `max:50` (Documentos).
//   file              — opcional; PDF/JPG/JPEG/PNG, `max:2048` KB (2MB) —
//                       mais permissivo que o upload individual (mimes:pdf
//                       só), mirror EXATO do modal de lote do legado.
//   rows              — required, array, min:1; cada linha:
//     title_uuid  — required, uuid.
//     amount      — required, numeric, > 0.
//     discount    — opcional (`sometimes`), >= 0.
//     `categories` REMOVIDO (Achado A1, `GAP-036-114`) — rateio contábil não
//     existe mais no form do lote, derivado no servidor.
// -----------------------------------------------------------------------------

// Mirror do limite real do backend (`BatchWriteOffRequest::rules()`,
// `file => mimes:pdf,jpg,jpeg,png|max:2048`) — 2048 KB = 2 MB.
const BATCH_FILE_MAX_SIZE_BYTES = 2048 * 1024;
const BATCH_FILE_ACCEPTED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];
const BATCH_DESCRIPTION_MAX_LENGTH = 50;

/**
 * Fórmula IRMÃ de `calculateWriteOffNetValue` — SEM `penalty`/`interest`/
 * `increase` (o payload do lote não tem esses campos, ver
 * `@types/v2/WriteOff`). NÃO reaproveitar `calculateWriteOffNetValue` para o
 * lote (fórmula errada, somaria encargos que não existem no contrato do
 * lote).
 * @param {object} fields - Campos monetários da linha do lote (`amount`/`discount`).
 * @return {number} O valor líquido da linha (`amount - discount`).
 */
export function calculateBatchWriteOffRowNetValue(fields: {
  amount?: number | null;
  discount?: number | null;
}): number {
  const amount = Number(fields.amount) || 0;
  const discount = Number(fields.discount) || 0;
  return amount - discount;
}

export const writeOffBatchSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.writeOff.form.validation;
  const batchMessages = languageGB.writeOff.form.batch.validation;
  const batchErrors = languageGB.writeOff.form.batch.errors;

  const rowSchema = yup.object({
    title_uuid: yup.string().required(),
    title_number: yup.string().required(),
    title_balance: yup.number().required(),
    amount: yup
      .number()
      .nullable()
      .typeError(batchMessages.rowAmountRequired)
      .moreThan(0, batchMessages.rowAmountRequired)
      .required(batchMessages.rowAmountRequired)
      // Teto client-side `amount <= title_balance` (UT-000111, esteira 064,
      // onda 4) — mirror EXATO da validação real do servidor
      // (`BatchWriteOffAction::processRow()`, `if ($row->amount >
      // (float) $title->balance) throw new BusinessRuleException(...)`).
      // Hoje só existia `moreThan(0)` aqui; um valor acima do saldo só era
      // pego pelo 422 do servidor, derrubando o LOTE INTEIRO (backend é
      // tudo-ou-nada) sem qualquer aviso prévio no client. Schema
      // COMPARTILHADO por Contas a Pagar E a Receber — `title_balance` já é
      // preenchido por AMBAS as telas em `batchWriteOffRows`, então o teto
      // vale para os dois consumidores sem fatiar por segmento.
      .test(
        'row-amount-within-balance',
        batchMessages.rowAmountExceedsBalance,
        (value, testContext) => {
          if (value == null) return true; // ausência já é responsabilidade do `.required` acima
          const parent = testContext.parent as { title_balance?: number };
          const balance = Number(parent.title_balance) || 0;
          if (value <= balance) return true;
          return testContext.createError({
            message: batchMessages.rowAmountExceedsBalance.replace(
              '{balance}',
              balance.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            ),
          });
        }
      ),
    discount: yup.number().nullable().min(0, messages.negativeValueNotAllowed),
  });

  return yup.object({
    // `true` Movimento Bancário | `false` Baixa Cruzada — plain boolean
    // (mirror `control_stock`), NUNCA `Option`.
    banking_movement: yup.boolean().required(batchMessages.bankingMovementRequired),

    // Condicional por modo (mirror `BatchWriteOffRequest::rules()` —
    // `required_if:banking_movement,true/false`).
    account_uuid: yup
      .object()
      .nullable()
      .when('banking_movement', {
        is: true,
        then: (schema) => schema.required(messages.accountRequired),
      }),
    // 1º nível da cascata (`TASK-036-GB-09`) — 100% CLIENT-SIDE (não vai ao
    // payload), só reduz as opções do 2º nível. Obrigatório visualmente
    // (é o passo que precede o Título) na Baixa Cruzada.
    advance_party_uuid: yup
      .object()
      .nullable()
      .when('banking_movement', {
        is: false,
        then: (schema) => schema.required(batchMessages.relatedTitleRequired),
      }),
    related_title_uuid: yup
      .object()
      .nullable()
      .when('banking_movement', {
        is: false,
        then: (schema) => schema.required(batchMessages.relatedTitleRequired),
      })
      // Guarda de saldo (`TASK-036-GB-09` §3) — `balance` do título
      // selecionado (`WriteOffCounterpartOption`, cacheado na própria
      // option, sem round-trip) comparado contra o TOTAL AGREGADO do lote
      // (`rows[].amount - rows[].discount` somado), NUNCA linha a linha.
      // Reforço do front — a guarda "viva" (toast + reset) vive no
      // componente (`useEffect([batchTotal, relatedTitleUuid])`); este
      // `.test` é a rede de segurança que bloqueia o SUBMIT mesmo se o
      // `useEffect` não tiver rodado ainda.
      // Arrow function + `testContext` (mirror `categories-sum-net-value`
      // acima) — NÃO `function(value){ this... }`: evita `no-invalid-this`
      // e mantém o mesmo estilo já usado neste arquivo.
      .test('saldo-suficiente', batchErrors.relatedTitleBalanceExceeded, (value, testContext) => {
        if (!value) return true; // ausência já é responsabilidade do `.required` acima
        const parent = testContext.parent as {
          banking_movement?: boolean;
          rows?: Array<{ amount?: number | null; discount?: number | null }>;
        };
        if (parent.banking_movement !== false) return true; // guarda só se aplica na Baixa Cruzada
        const balance = (value as { balance?: number }).balance ?? 0;
        const total = (parent.rows ?? []).reduce(
          (sum, row) =>
            sum +
            calculateBatchWriteOffRowNetValue({ amount: row?.amount, discount: row?.discount }),
          0
        );
        if (balance >= total) return true;
        return testContext.createError({
          message: batchErrors.relatedTitleBalanceExceeded.replace(
            '{balance}',
            balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          ),
        });
      }),
    // Plain string (não `Option`) — Select estático converte na borda.
    writeoff_type: yup
      .string()
      .nullable()
      .when('banking_movement', {
        is: true,
        then: (schema) => schema.required(batchMessages.writeoffTypeRequired),
      }),

    movement_date: yup.string().nullable().required(messages.movementDateRequired),

    // Encargos AGREGADOS do lote — só relevantes quando `writeoff_type ===
    // 'U'` (a tela oculta/limpa quando `writeoff_type !== 'U'`); a validação
    // aqui só cobre "não negativo", mirror `sometimes|numeric|min:0` do back.
    penalty: yup.number().nullable().min(0, messages.negativeValueNotAllowed),
    interest: yup.number().nullable().min(0, messages.negativeValueNotAllowed),
    increase: yup.number().nullable().min(0, messages.negativeValueNotAllowed),

    // Mesma salvaguarda real do schema individual (coluna física
    // `writeoffs.note` é `varchar(150)`).
    note: yup.string().trim().max(NOTE_MAX_LENGTH, messages.noteMaxLength),

    // Documentos — reaproveita `TASK-036-GB-04`, mais permissivo que o
    // upload individual (PDF/JPG/JPEG/PNG, mirror do modal de lote legado).
    description: yup
      .string()
      .trim()
      .max(BATCH_DESCRIPTION_MAX_LENGTH, batchMessages.descriptionMaxLength),
    file: yup
      .mixed<File>()
      .nullable()
      .test('file-type', batchMessages.fileTypeInvalid, (file) => {
        if (!file) return true;
        const extension = file.name.split('.').pop()?.toLowerCase();
        return !!extension && BATCH_FILE_ACCEPTED_EXTENSIONS.includes(extension);
      })
      .test('file-size', batchMessages.fileSizeExceeded, (file) => {
        if (!file) return true;
        return file.size <= BATCH_FILE_MAX_SIZE_BYTES;
      }),

    rows: yup.array().of(rowSchema).min(1, batchMessages.rowsRequired).required(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` do `WriteOffBatchModal`
 * (Tarefa 335) — mirror `writeOffSchemaResolver`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do lote.
 */
export const writeOffBatchSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(writeOffBatchSchema(languageGB)) as any;
