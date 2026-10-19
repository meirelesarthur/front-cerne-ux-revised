// src/validations/schemas/Financeiro/expense-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Expense (Contas a Pagar, esteira
// 036) — TASK-FE-036-111. Resolver ÚNICO cobrindo Cabeçalho + Rateio +
// Parcelamento + Baixa Automática — 1 `useForm` raiz
// (`CreateOrUpdateExpense.tsx`) consome este schema, mirror
// `invoice-schema.ts`.
//
// Divergências REAIS vs. o mirror `Invoices` (achados do contrato de tela,
// não preferência de estilo):
//   - `categories` (rateio) fecha EXATO contra `amount` (tolerância 0,
//     `ApplyExpenseApportionmentAction`: "O total rateado (...) deve ser
//     exatamente igual ao valor do título (...)."), NUNCA contra 100% como
//     o Invoice (lá é percentual; aqui é REAIS) — GAP-FE-036-102/103.
//   - `categories` é obrigatório (`min:1`) em CRIAÇÃO **e** EDIÇÃO (o
//     backend sempre exige a chave presente, `ExpenseRequest::rules()`
//     `$sometimesOrRequired` no update também) — DIFERENTE do Invoice
//     (write-only, só valida em criação).
//   - `installments` (parcelamento) NUNCA tem validação de soma bloqueante
//     (GAP-FE-036-104, achado real — `StoreExpenseAction` não compara
//     `sum(installments[].value)` com `amount`) — só `due_date`/`value`
//     por linha, `requiredIf qtd_installments>1` no nível de array.
//   - `amount` tem guarda condicional por VERBO: em CRIAÇÃO, `amount<=0` é
//     rejeitado SEMPRE, exceto `payment_type=FATURA(5)` (única exceção); em
//     EDIÇÃO, `amount<=0` é SEMPRE rejeitado, mesmo com `payment_type=
//     FATURA` (`ExpenseRequest::withValidator()`, ground truth do código
//     real — a exceção só existe no `store()`).
//   - `recurrence_type` é `requiredIf payment_type===RECORRENTE(3)` (int
//     3, `ExpensePaymentTypeEnum`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isProviderRequiredForAppropriation } from '@/pages/Financeiro/ContasAPagar/appropriation/expenseAppropriation';

import {
  expenseAppropriationIndex,
  expenseAppropriationTypeIndex,
} from '@/constants/financeiro/expense/options/appropriation-options';
import { expensePaymentTypeIndex } from '@/constants/financeiro/expense/options/payment-type-options';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

/** Fechamento EXATO do rateio contra `amount` (tolerância 0) — mirror EXATO
 *  do backend (`round($sum, 2) !== round($amount, 2)`), NUNCA a margem de
 *  arredondamento (`0.01`) usada pelo Invoice. */
const APPORTIONMENT_SUM_TOLERANCE = 0;

type ApportionmentRowShape = {
  category_uuid?: unknown;
  center_uuid?: unknown;
  value?: number;
  area_uuid?: { value?: unknown } | null;
};

type InstallmentRowShape = {
  due_date?: string | null;
  value?: number;
};

export const expenseSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.financial.expense.form.validation;

  const apportionmentRowSchema = yup.object({
    category_uuid: v.option<string>().required(messages.categoryRequired),
    center_uuid: v.option<string>().required(messages.centerRequired),
    value: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.valueRequired)
      .required(messages.valueRequired)
      .min(0.01, messages.valueMin),
    plan_account_uuid: yup.mixed().nullable(),
    // `area_uuid` (TASK-FE-036-123, B-09 Opção C parcial) — a obrigatoriedade
    // condicional (`appropriation===1 && appropriation_type===AREA(3)`) NÃO
    // é validável aqui via `.when()`: os 2 campos condicionantes vivem no
    // form RAIZ (Cabeçalho), não são SIBLINGS deste objeto de linha dentro
    // de `yup.array().of(apportionmentRowSchema)` — `context.parent` de um
    // campo AQUI resolve para a PRÓPRIA linha, não para o root (achado desta
    // Tarefa, confirmado testando a mecânica real do Yup 0.32 instalado).
    // Mirror da MESMA técnica já usada por `categories-sum-exact-amount`
    // (teste no NÍVEL DO ARRAY, onde `context.parent` já é o root de fato,
    // ver `categories-area-required-when-type-area` abaixo) — não duplicar
    // a obrigatoriedade aqui.
    area_uuid: yup.mixed().nullable(),
    // `percent` (esteira 036fix) — SÓ-CLIENTE (cálculo bidirecional %↔valor,
    // mirror legado `calcPercents()`/`calcValues()`), nunca enviado ao
    // backend (`ExpenseApportionmentPayload` não tem este campo) — por isso
    // sem `.required()`/teste de soma aqui, `categories-sum-exact-amount`
    // continua fechando contra `value`, não contra `percent`.
    percent: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable(),
  });

  const installmentRowSchema = yup.object({
    due_date: yup.string().nullable().required(messages.dueDateRequired),
    value: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.valueRequired)
      .required(messages.valueRequired)
      .moreThan(0, messages.valueMin),
  });

  return yup.object({
    // -- Aba "Cabeçalho" --
    number: yup.string().trim().required(messages.numberRequired).max(15),
    type_title_uuid: v.option<string>().required(messages.typeTitleRequired),
    // `provider_uuid` (`GAP-FE-036-121` Decisão 2, TASK-FE-036-124; UT-000795
    // D-102-12 estende a Pecuária e Manutenção) — OR com o backend
    // (`ExpenseRequest::rules()`): obrigatório quando `is_taxation` é falso OU
    // quando Direta+Tipo ∈ {Agricultura, Pecuária, Manutenção} está ativo (independente de
    // `is_taxation`) — sem o 2º ramo, um usuário com `is_taxation=Sim` +
    // Tipo=Agricultura ficava preso num 422 permanente (campo obrigatório e
    // desabilitado ao mesmo tempo).
    provider_uuid: yup
      .mixed()
      .nullable()
      .when(['is_taxation', 'appropriation', 'appropriation_type'], {
        is: (
          isTaxation: { value?: boolean } | null,
          appropriation: { value?: number } | null,
          appropriationType: { value?: number } | null
        ) =>
          !isTaxation?.value ||
          isProviderRequiredForAppropriation(appropriation?.value, appropriationType?.value),
        then: (schema) => schema.required(messages.providerRequired),
      }),
    branch_uuid: yup.mixed().nullable(),
    proprietary_uuid: yup.mixed().nullable(),
    harvest_uuid: yup.mixed().nullable(),
    dt_emission: yup.string().nullable().required(messages.dtEmissionRequired),
    due_date: yup.string().nullable().required(messages.dueDateRequired),
    amount: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.amountRequired)
      .required(messages.amountRequired)
      .test(
        'amount-greater-than-zero',
        messages.amountMustBeGreaterThanZero,
        // Arrow function (não `function`) + `context.parent`/`context.
        // options.context` — mesma técnica de `parameterWeights-schema.ts`,
        // evita `no-invalid-this` do eslint do projeto.
        (value, context: yup.TestContext) => {
          const isEditing = (context.options.context as { isEditing?: boolean } | undefined)
            ?.isEditing;
          const parent = context.parent as { payment_type?: { value?: number } | null };
          const isFatura = parent?.payment_type?.value === expensePaymentTypeIndex.FATURA;
          // Em edição a guarda é SEMPRE ativa (ExpenseRequest::withValidator,
          // ramo `! isMethod('post')`) — a exceção FATURA só existe no store().
          if (isEditing) return (value ?? 0) > 0;
          if (isFatura) return true;
          return (value ?? 0) > 0;
        }
      ),
    note: yup.string().trim().required(messages.noteRequired).max(1500),
    fiscal_document: v.option<boolean>().required(messages.fiscalDocumentRequired),
    payment_type: v.option<number>().required(messages.paymentTypeRequired),
    recurrence_type: yup
      .mixed()
      .nullable()
      .when('payment_type', {
        is: (paymentType: { value?: number } | null) =>
          paymentType?.value === expensePaymentTypeIndex.RECORRENTE,
        then: (schema) => schema.required(messages.recurrenceTypeRequired),
      }),
    // `classification` (esteira 036fix, audit "Classificação deixou de ser
    // obrigatória") — legado exige CAPEX/OPEX/Não Classificado sempre
    // selecionado (`_forms.blade.php:52-56`, `->required()`); o form JÁ
    // preenche um default (`{label: notClassified, value: 'N'}`), esta
    // validação só impede o usuário de limpar o Select (agora
    // `noClearable`) e garante o contrato mesmo se o valor for programado
    // como `null` por algum caminho.
    classification: v.option<string>().required(messages.classificationRequired),
    type_note: yup.mixed().nullable(),
    // `appropriation` (Select "Modalidade", TASK-FE-036-123, B-09 Opção C
    // parcial) — SEMPRE preenchido (default Indireta, `defaultValues` de
    // `CreateOrUpdateExpense.tsx`), mirror `payment_type`.
    appropriation: v.option<number>().required(messages.appropriationRequired),
    // `appropriation_type` (Select "Tipo") — `requiredIf appropriation===1`
    // (Direta), mirror EXATO do `.when()` já usado por `recurrence_type`
    // (sibling do form RAIZ, acesso direto sem a ressalva de `area_uuid`
    // acima).
    appropriation_type: yup
      .mixed()
      .nullable()
      .when('appropriation', {
        is: (appropriation: { value?: number } | null) =>
          appropriation?.value === expenseAppropriationIndex.DIRETA,
        then: (schema) => schema.required(messages.appropriationTypeRequired),
      }),
    // Bloco "Agricultura" (TASK-FE-036-124, B-09 Opção C parcial,
    // `GAP-036-115`, 2/2) — Área/Atividade obrigatórios só quando
    // Direta+Tipo=Agricultura (mirror EXATO do `.when()` acima de
    // `appropriation_type`); Operação/Cultura SEMPRE opcionais, sem `.when()`
    // (`ExpenseRequest::rules()`, `aprop_agri_operation_uuid`/
    // `aprop_agri_cultivation_uuid` são `nullable` puro).
    aprop_agri_area_uuid: yup
      .mixed()
      .nullable()
      .when(['appropriation', 'appropriation_type'], {
        is: (
          appropriation: { value?: number } | null,
          appropriationType: { value?: number } | null
        ) =>
          appropriation?.value === expenseAppropriationIndex.DIRETA &&
          appropriationType?.value === expenseAppropriationTypeIndex.AGRICULTURA,
        then: (schema) => schema.required(messages.agriAreaRequired),
      }),
    aprop_agri_activity_uuid: yup
      .mixed()
      .nullable()
      .when(['appropriation', 'appropriation_type'], {
        is: (
          appropriation: { value?: number } | null,
          appropriationType: { value?: number } | null
        ) =>
          appropriation?.value === expenseAppropriationIndex.DIRETA &&
          appropriationType?.value === expenseAppropriationTypeIndex.AGRICULTURA,
        then: (schema) => schema.required(messages.agriActivityRequired),
      }),
    aprop_agri_operation_uuid: yup.mixed().nullable(),
    aprop_agri_cultivation_uuid: yup.mixed().nullable(),
    // UT-000795 — Bloco Pecuária (Direta+Tipo=2): Operação e Atividade
    // obrigatórias; Lote obrigatório quando há Animal; Área e Módulo nunca
    // ambos. Fora desse caminho nenhuma exigência nova.
    aprop_pec_area_uuid: yup
      .mixed()
      .nullable()
      .test('pec-area-xor-grazing', messages.areaOrGrazingOnly, (value, context) => {
        const parent = context.parent as
          | {
              appropriation?: { value?: number } | null;
              appropriation_type?: { value?: number } | null;
              aprop_pec_grazing_uuid?: unknown;
            }
          | undefined;
        const isLivestock =
          parent?.appropriation?.value === expenseAppropriationIndex.DIRETA &&
          parent?.appropriation_type?.value === expenseAppropriationTypeIndex.PECUARIA;
        return !(isLivestock && value && parent?.aprop_pec_grazing_uuid);
      }),
    aprop_pec_grazing_uuid: yup.mixed().nullable(),
    aprop_pec_batch_uuid: yup
      .mixed()
      .nullable()
      .when(['appropriation', 'appropriation_type', 'aprop_pec_animal_uuid'], {
        is: (
          appropriation: { value?: number } | null,
          appropriationType: { value?: number } | null,
          animal: unknown
        ) =>
          appropriation?.value === expenseAppropriationIndex.DIRETA &&
          appropriationType?.value === expenseAppropriationTypeIndex.PECUARIA &&
          !!animal,
        then: (schema) => schema.required(messages.livestockBatchRequired),
      }),
    aprop_pec_animal_uuid: yup.mixed().nullable(),
    aprop_pec_operation_uuid: yup
      .mixed()
      .nullable()
      .when(['appropriation', 'appropriation_type'], {
        is: (
          appropriation: { value?: number } | null,
          appropriationType: { value?: number } | null
        ) =>
          appropriation?.value === expenseAppropriationIndex.DIRETA &&
          appropriationType?.value === expenseAppropriationTypeIndex.PECUARIA,
        then: (schema) => schema.required(messages.livestockOperationRequired),
      }),
    aprop_pec_activity_uuid: yup
      .mixed()
      .nullable()
      .when(['appropriation', 'appropriation_type'], {
        is: (
          appropriation: { value?: number } | null,
          appropriationType: { value?: number } | null
        ) =>
          appropriation?.value === expenseAppropriationIndex.DIRETA &&
          appropriationType?.value === expenseAppropriationTypeIndex.PECUARIA,
        then: (schema) => schema.required(messages.livestockActivityRequired),
      }),
    // UT-000795 — Bloco Manutenção (Direta+Tipo=4): Equipamento sempre;
    // Horímetro só se o equipamento NÃO usa Km; Km só se usa Km. `0` é valor
    // válido (compara com null/undefined, nunca falsy).
    aprop_man_equipment_uuid: yup
      .mixed()
      .nullable()
      .when(['appropriation', 'appropriation_type'], {
        is: (
          appropriation: { value?: number } | null,
          appropriationType: { value?: number } | null
        ) =>
          appropriation?.value === expenseAppropriationIndex.DIRETA &&
          appropriationType?.value === expenseAppropriationTypeIndex.MANUTENCAO,
        then: (schema) => schema.required(messages.maintenanceEquipmentRequired),
      }),
    aprop_man_hour_meter: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0)
      .test('man-hour-meter-required', messages.hourMeterRequired, (value, context) => {
        const parent = context.parent as {
          appropriation?: { value?: number } | null;
          appropriation_type?: { value?: number } | null;
          aprop_man_equipment_uuid?: { uses_mileage?: boolean } | null;
        };
        const isMaintenance =
          parent?.appropriation?.value === expenseAppropriationIndex.DIRETA &&
          parent?.appropriation_type?.value === expenseAppropriationTypeIndex.MANUTENCAO;
        if (!isMaintenance || !parent.aprop_man_equipment_uuid) return true;
        if (parent.aprop_man_equipment_uuid.uses_mileage === true) return true;
        return value !== null && value !== undefined;
      }),
    aprop_man_mileage: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0)
      .test('man-mileage-required', messages.mileageRequired, (value, context) => {
        const parent = context.parent as {
          appropriation?: { value?: number } | null;
          appropriation_type?: { value?: number } | null;
          aprop_man_equipment_uuid?: { uses_mileage?: boolean } | null;
        };
        const isMaintenance =
          parent?.appropriation?.value === expenseAppropriationIndex.DIRETA &&
          parent?.appropriation_type?.value === expenseAppropriationTypeIndex.MANUTENCAO;
        if (!isMaintenance || parent.aprop_man_equipment_uuid?.uses_mileage !== true) return true;
        return value !== null && value !== undefined;
      }),
    is_taxation: v.option<boolean>().required(messages.isTaxationRequired),
    discount: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .nullable()
      .min(0),
    penalty: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .nullable()
      .min(0),
    interest: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .nullable()
      .min(0),
    perc_interest: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .nullable()
      .min(0),
    increase: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .nullable()
      .min(0),

    // -- Aba "Parcelamento" — só em criação, SEM soma bloqueante (GAP-FE-036-104) --
    qtd_installments: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(1),
    installments: yup
      .array()
      .of(installmentRowSchema)
      .default([])
      .test(
        'installments-required-when-parceled',
        messages.installmentsRequiredWhenParceled,
        (rows: InstallmentRowShape[] | undefined, context: yup.TestContext) => {
          const isEditing = (context.options.context as { isEditing?: boolean } | undefined)
            ?.isEditing;
          if (isEditing) return true;
          const qtdInstallments = Number(context.parent?.qtd_installments) || 1;
          if (qtdInstallments <= 1) return true;
          return (rows?.length ?? 0) >= 1;
        }
      ),

    // -- Aba "Rateio" — OBRIGATÓRIO em criação E edição (achado real,
    // diferente do write-only do Invoice), fecha EXATO contra `amount`.
    categories: yup
      .array()
      .of(apportionmentRowSchema)
      .min(1, messages.categoriesRequired)
      .default([])
      .test(
        'categories-sum-exact-amount',
        messages.categoriesSumExactAmount,
        (rows: ApportionmentRowShape[] | undefined, context: yup.TestContext) => {
          const parent = context.parent as { amount?: number };
          const amountTarget = Math.round((Number(parent?.amount) || 0) * 100) / 100;
          const sum =
            Math.round(
              (rows ?? []).reduce((total: number, row) => total + (Number(row?.value) || 0), 0) *
                100
            ) / 100;
          return Math.abs(sum - amountTarget) <= APPORTIONMENT_SUM_TOLERANCE;
        }
      )
      // TASK-FE-036-123 (B-09 Opção C parcial, `GAP-036-115`) — `area_uuid`
      // por linha é `requiredIf appropriation===1 && appropriation_type===
      // AREA(3)` (`ExpenseRequest::rules()`, `categories.*.area_uuid`), mas
      // os 2 campos condicionantes vivem no form RAIZ, não nas linhas do
      // array — mesma técnica de acesso ao root já usada por
      // `categories-sum-exact-amount` (`context.parent` no NÍVEL DO ARRAY é
      // o objeto raiz, ao contrário de um `.when()` dentro de
      // `apportionmentRowSchema`, que resolveria contra a própria linha).
      .test(
        'categories-area-required-when-type-area',
        messages.areaRequired,
        (rows: ApportionmentRowShape[] | undefined, context: yup.TestContext) => {
          const parent = context.parent as {
            appropriation?: { value?: number } | null;
            appropriation_type?: { value?: number } | null;
          };
          const isDirectArea =
            parent?.appropriation?.value === expenseAppropriationIndex.DIRETA &&
            parent?.appropriation_type?.value === expenseAppropriationTypeIndex.AREA;
          if (!isDirectArea) return true;
          return (rows ?? []).every((row) => !!row?.area_uuid?.value);
        }
      ),

    // -- Seção "Baixa Automática" — só em criação, parcela única --
    automatic_writeoff: yup.boolean().default(false),
    account_uuid: yup
      .mixed()
      .nullable()
      .when('automatic_writeoff', {
        is: true,
        then: (schema) => schema.required(messages.accountRequiredWhenAutomaticWriteoff),
      }),
    movement_date: yup
      .string()
      .nullable()
      .when('automatic_writeoff', {
        is: true,
        then: (schema) => schema.required(messages.movementDateRequiredWhenAutomaticWriteoff),
      }),
  });
};

export const expenseSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(expenseSchema(languageGB));

export default expenseSchemaResolver;
