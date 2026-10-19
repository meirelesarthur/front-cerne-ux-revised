// src/validations/schemas/Incomes/income-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Contas a Receber (Income) —
// TASK-FE-036-310 (esqueleto + campos de cabeçalho; os `.test()` de soma de
// parcelamento/rateio são REFINADOS pelas Tarefas 314/315, que consomem este
// arquivo, não o duplicam). Padrão da empresa: FUNÇÃO que recebe
// `languageGB` e devolve o schema (mensagens i18n) — mirror mecânico de
// `centro-custo-schema.ts`.
//
// DUAS tolerâncias DIFERENTES nesta tela (não confundir, GAP-FE-036-302 vs
// §4.2 do contrato):
//   - `installments` (parcelamento) — tolerância `count(installments) * 0.01`,
//     a soma PODE divergir do total (defeito legado preservado deliberadamente,
//     ver GAP-FE-036-302). NUNCA usar a tolerância fixa de `invoice-schema.ts`.
//   - `categories` (rateio) — tolerância FIXA `0.01`, soma DEVE fechar 100%
//     (mesma regra de `InvoiceApportionmentTab.tsx`, contrato §4.2).
//
// `context` do resolver (`useForm({ resolver, context: { isLocked, isEditing } })`,
// injetado pelo form raiz `CreateOrUpdateIncome.tsx`, TASK-FE-036-313):
//   - `isLocked` (GAP-FE-036-300) — quando `true`, a validação de `categories`
//     é pulada (o rateio nem é enviado no payload quando bloqueado).
//   - `isEditing` — a aba de Parcelamento só existe no CREATE (contrato §4.1/
//     §4.3); em edição o array `installments` permanece `[]` e sua validação
//     é pulada.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

// Mirror EXATO das constantes já usadas por `InvoiceApportionmentTab.tsx`
// (contrato §4.2) — tolerância do RATEIO, não do parcelamento.
const APPORTIONMENT_SUM_TOLERANCE = 0.01;
const APPORTIONMENT_SUM_TARGET = 100;

interface IncomeSchemaContext {
  isLocked?: boolean;
  isEditing?: boolean;
}

export const incomeSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.incomes.income.form.validation;

  const installmentItemSchema = yup.object({
    due_date: yup.string().nullable().required(messages.installmentDueDateRequired),
    value: yup
      .number()
      .nullable()
      .typeError(messages.installmentValueRequired)
      .required(messages.installmentValueRequired),
  });

  const categoryItemSchema = yup.object({
    category_uuid: yup.string().nullable().required(messages.categoryRequired),
    center_uuid: yup.string().nullable().required(messages.centerRequired),
    plan_account_uuid: yup.string().nullable(),
    percentage: yup
      .number()
      .nullable()
      .typeError(messages.percentageRequired)
      .min(0, messages.percentageRange)
      .max(100, messages.percentageRange)
      .required(messages.percentageRequired),
  });

  return yup.object({
    // TASK-FE-036-326 (FID-G3F FLD07/OQ02, Decisão do Dono nº 10) — o back
    // migrado padronizou `number` em `max:15` (resolvendo a divergência
    // legada UI=15/servidor=14 a favor do maior valor); front alinhado.
    number: yup.string().trim().max(15, messages.numberMaxLength).required(messages.numberRequired),
    type_title_uuid: yup.object().nullable().required(messages.typeRequired),
    client_uuid: yup.object().nullable().required(messages.clientRequired),
    // Opcional (achado B-02, auditoria de fidelidade 2026-08) — o legado não
    // exige proprietário (`IncomeRequest::proprietary_uuid` é `nullable`,
    // sem `$sometimesOrRequired`). NÃO required aqui.
    proprietary_uuid: yup.object().nullable(),
    harvest_uuid: yup.object().nullable(),
    payment_type: yup
      .number()
      .oneOf([1, 2, 4], messages.paymentTypeRequired)
      .required(messages.paymentTypeRequired),
    dt_emission: yup.string().nullable().required(messages.dtEmissionRequired),
    due_date: yup.string().nullable().required(messages.dueDateRequired),
    amount: yup
      .number()
      .nullable()
      .typeError(messages.amountRequired)
      .required(messages.amountRequired),
    discount: yup.number().nullable(),
    penalty: yup.number().nullable(),
    interest: yup.number().nullable(),
    perc_interest: yup.number().nullable(),
    increase: yup.number().nullable(),
    // Histórico obrigatório + máximo 800 (mirror legado, achado da auditoria
    // de fidelidade 2026-08 — `_forms.blade.php` histórico é `required` +
    // `maxlength="800"` com contador; API valida `note` como
    // `$sometimesOrRequired`+`max:800`).
    note: yup.string().trim().max(800, messages.noteMaxLength).required(messages.noteRequired),
    fiscal_document: yup.boolean(),

    // ---- Baixa automática (INC-R21, REAUDITORIA-036-2a-rodada) ----
    // O legado exige conta+data quando a baixa automática está ativa
    // (`_forms.blade.php:343`); o schema aceitava qualquer valor e adiava a
    // rejeição para a API (`IncomeRequest.php:104`). Corrigido com `.test()`
    // (NÃO `.when('automatic_writeoff', {is:true})` puro) — Adiantamento
    // força `automatic_writeoff=true` assim que a forma de pagamento muda
    // (`CreateOrUpdateIncome.tsx`), MESMO antes de existir 1 parcela e da
    // seção (com os campos conta/data) estar montada; um `.when()` simples
    // bloquearia o submit sem UI visível para corrigir. A MESMA condição de
    // elegibilidade do payload real (`isEligibleForAutomaticWriteoff` em
    // `CreateOrUpdateIncome.tsx`: 1 única parcela) decide quando a exigência
    // se aplica.
    automatic_writeoff: yup.boolean(),
    account_uuid: yup
      .object()
      .nullable()
      .test(
        'automatic-writeoff-account-required',
        messages.automaticWriteoffAccountRequired,
        (value, testContext) => {
          const parent = testContext.parent as {
            automatic_writeoff?: boolean;
            installments?: unknown[];
          };
          const isEligible =
            !!parent.automatic_writeoff && (parent.installments?.length ?? 0) === 1;
          return !isEligible || !!value;
        }
      ),
    movement_date: yup
      .string()
      .nullable()
      .test(
        'automatic-writeoff-movement-date-required',
        messages.automaticWriteoffMovementDateRequired,
        (value, testContext) => {
          const parent = testContext.parent as {
            automatic_writeoff?: boolean;
            installments?: unknown[];
          };
          const isEligible =
            !!parent.automatic_writeoff && (parent.installments?.length ?? 0) === 1;
          return !isEligible || !!value;
        }
      ),

    // ---- Aba Parcelamento (TASK-FE-036-314, GAP-FE-036-302) ----
    // Só existe/valida no CREATE com Forma de Pagamento=PARCELADA(2) — mirror
    // legado (`_forms.blade.php:720`, `handlePaymentType()`: só a forma 2
    // abre o modal de geração de parcelas) e do Contas a Pagar
    // (`expense-schema.ts`/`showInstallmentsTab`). Única(1)/Adiantamento(4)
    // NUNCA exigem parcelamento manual — o front deriva 1 parcela única a
    // partir do cabeçalho (`due_date`/`amount`) direto no payload
    // (`CreateOrUpdateIncome.tsx::tryPersistIncome`), mesma regra do backend
    // (`IncomeController::store` legado ~454: `qtd_installments=1` quando
    // não há `date_installments`). Em edição o array permanece `[]` e a aba
    // nem é montada (contrato §4.1/§4.3).
    installments: yup
      .array()
      .of(installmentItemSchema)
      // Forma `(value, testContext) => ...` (NÃO `function(){ this... }`) —
      // evita `this` em função regular (regra `no-invalid-this` do projeto),
      // Yup entrega o MESMO `TestContext` (`.options.context`/`.parent`) como
      // 2º argumento da função de teste.
      .test('installments-required', messages.installmentsRequired, (items, testContext) => {
        const { isEditing } = (testContext.options.context ?? {}) as IncomeSchemaContext;
        if (isEditing) return true;
        const parent = testContext.parent as { payment_type?: number } | undefined;
        // payment_type=2 (PARCELADA) é a ÚNICA forma que exige geração
        // manual de parcelas — Única(1)/Adiantamento(4) derivam do
        // cabeçalho, sem aba/validação de array (fix BLOQUEADOR 036fix3).
        if (parent?.payment_type !== 2) return true;
        return !!items && items.length > 0;
      })
      .test('installments-sum-total', messages.installmentsSumMismatch, (items, testContext) => {
        const { isEditing } = (testContext.options.context ?? {}) as IncomeSchemaContext;
        if (isEditing || !items || items.length === 0) return true;
        const parent = testContext.parent as { payment_type?: number; amount?: number } | undefined;
        if (parent?.payment_type !== 2) return true;
        // Tolerância `count * 0.01` — MESMA fórmula do backend
        // (`StoreIncomeAction::assertInstallmentsMatchTotal`, GAP-FE-036-302).
        // A soma PODE divergir do `amount` dentro dessa faixa — comportamento
        // INTENCIONAL, não corrigir aqui.
        const amount = Number(parent?.amount ?? 0);
        const sum = items.reduce((acc, item) => acc + (Number(item?.value) || 0), 0);
        const tolerance = items.length * 0.01;
        return Math.abs(sum - amount) <= tolerance;
      }),

    // ---- Aba Rateio (TASK-FE-036-315, GAP-FE-036-301) ----
    // Tolerância ZERO (§4.2 do contrato) — pulada quando `is_locked` (a aba
    // nem é enviada nesse modo, GAP-FE-036-300).
    categories: yup
      .array()
      .of(categoryItemSchema)
      // INC-R21 (REAUDITORIA-036-2a-rodada) — o schema aceitava `categories=[]`
      // e só a API rejeitava. Pulado quando `is_locked` (a aba nem é enviada
      // nesse modo, GAP-FE-036-300) — mesma guarda do teste de soma abaixo.
      .test('categories-required', messages.categoriesRequired, (items, testContext) => {
        const { isLocked } = (testContext.options.context ?? {}) as IncomeSchemaContext;
        if (isLocked) return true;
        return !!items && items.length > 0;
      })
      .test('categories-sum-100', messages.categoriesSumMismatch, (items, testContext) => {
        const { isLocked } = (testContext.options.context ?? {}) as IncomeSchemaContext;
        if (isLocked || !items || items.length === 0) return true;
        const sum = items.reduce((acc, item) => acc + (Number(item?.percentage) || 0), 0);
        return Math.abs(sum - APPORTIONMENT_SUM_TARGET) <= APPORTIONMENT_SUM_TOLERANCE;
      }),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver, context })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const incomeSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(incomeSchema(languageGB)) as any;

export default incomeSchemaResolver;
