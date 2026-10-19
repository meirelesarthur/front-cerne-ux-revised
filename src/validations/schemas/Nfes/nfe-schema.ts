// src/validations/schemas/Nfes/nfe-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de NFe Emitida (domínio Fiscal) —
// TASK-FE-036-402. Resolver ÚNICO cobrindo cabeçalho + itens — 1 `useForm`
// raiz (`CreateOrUpdateNfe.tsx`, TASK-FE-036-404) consome este schema para as
// 2 abas de uma vez (mirror `invoice-schema.ts`, formulário com abas
// compartilha 1 resolver só).
//
// `client_uuid`/`natureza_uuid`/`state_registration_client`/`type_payment`
// obrigatórios (mirror contrato de API §7, `NfeRequest::rules()` real:
// `required` no store, `sometimes` no update — o front trata como sempre
// obrigatório quando presente no form, mesma disciplina de `invoice-schema`).
// `items` — `array().min(1)`, `items.*.product_uuid`/`quantity`/`amount`
// obrigatórios (mirror contrato de API §7).
//
// Regra numérica preservada (contrato de API §13): `total > 0` — `.test()`
// no total calculado (`amount` do bloco de Totais, mirror `NfeItemsTab.tsx`,
// MESMA fórmula: `total_products + shipping_value + added_value - discount`,
// SEM tolerância, comparação direta `> 0`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isValidCpf } from '@/utils/cpfCnpj';
import { isValidPlate } from '@/utils/masks/plate';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

/** `finnfe` = 4 — Devolução de mercadoria (NT 2013/005). */
export const NFE_FINNFE_DEVOLUCAO = 4;

/** UT-000776 / T-776-FE-05 — máximo de defensivos agrícolas por NF-e (mirror `NfeRequest`). */
export const NFE_AGRO_DEFENSIVOS_MAX = 20;

type NfeItemRowShape = {
  quantity?: number;
  amount?: number;
  discount?: number;
};

// TASK-FE-036-D2-2 — bloco Financeiro real. Mirror EXATO das tolerâncias já
// usadas por `income-schema.ts` para os MESMOS campos (`percentage` do
// rateio soma 100%, tolerância `0.01`; parcelamento soma dentro de
// `count * 0.01`, SEM reconciliação — `NfeFinancialTab.tsx` usa o mesmo
// `distributeWithoutReconciling`). NÃO a tolerância exata (`0`) de
// `expense-schema.ts` — o contrato de API desta fatia (`NfeRequest::rules()`,
// TASK-BE-036-D2A) fecha em `percentage`, forma idêntica a `IncomeData`,
// nunca em valor bruto como `ExpenseApportionmentData`.
const FINANCIAL_APPORTIONMENT_SUM_TOLERANCE = 0.01;
const FINANCIAL_APPORTIONMENT_SUM_TARGET = 100;

type NfeFinancialInstallmentRowShape = {
  due_date?: string | null;
  value?: number | null;
};

type NfeFinancialCategoryRowShape = {
  percentage?: number | null;
};

export const nfeSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.nfes.nfe.form.validation;

  // `finnfe` do cabeçalho (raiz do form) — `from[1]` é o contexto do pai do
  // item (array) e `from[last]` a raiz; procura o valor na cadeia.
  const isDevolucao = (testContext: yup.TestContext): boolean => {
    // `from` existe em runtime (yup 0.32) mas não está nos tipos de `TestContext`.
    const chain = ((testContext as unknown as { from?: unknown }).from ?? []) as Array<{
      value?: { finnfe?: unknown };
    }>;
    return chain.some((entry) => Number(entry?.value?.finnfe) === NFE_FINNFE_DEVOLUCAO);
  };

  const itemRowSchema = yup.object({
    product_uuid: v.option<string>().required(messages.productRequired),
    quantity: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.quantityRequired)
      .required(messages.quantityRequired)
      .moreThan(0, messages.quantityMin),
    amount: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.amountRequired)
      .required(messages.amountRequired)
      .min(0, messages.amountRequired),
    package_uuid: yup.mixed().nullable(),
    area_uuid: yup.mixed().nullable(),
    warehouse_uuid: yup.mixed().nullable(),
    discount: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .nullable()
      .min(0),
    order_item: yup.string().trim().nullable().max(20),
    // Bloco fiscal clássico + Reforma Tributária — a maioria NULLABLE no
    // contrato real (`NfeRequest::rules()`, sem `Rule::in()` no backend);
    // `cst_csosn`/`cst_pis`/`cst_cofins`/`cst_ipi`/`cenq_ipi` são exceção
    // DELIBERADA (rework de fidelidade, audit-nfe-emitidas.md — legado
    // exige `->required()` nesses 5 selects em `_card-item.blade.php:137-149`,
    // catálogo fechado via `nfe-fiscal-catalogs.ts`).
    cfop: yup.string().trim().nullable().max(191),
    cfop_saida_interno: yup.string().trim().nullable().max(191),
    cfop_saida_externo: yup.string().trim().nullable().max(191),
    cst_csosn: yup.string().trim().required(messages.cstCsosnRequired).max(191),
    cst_csosn_exp: yup.string().trim().nullable().max(191),
    cst_pis: yup.string().trim().required(messages.cstPisRequired).max(191),
    cst_cofins: yup.string().trim().required(messages.cstCofinsRequired).max(191),
    cst_ipi: yup.string().trim().required(messages.cstIpiRequired).max(191),
    cenq_ipi: yup.string().trim().required(messages.cenqIpiRequired).max(191),
    perc_icms: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    perc_pis: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    perc_cofins: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    perc_ipi: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    cest: yup.string().trim().nullable().max(10),
    // Limites alinhados ao legado (`_card-item.blade.php:167`, `maxlength=13`).
    barcode: yup.string().trim().nullable().max(13),
    percent_reduction: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    // C1 (D-101-19): nullable; dominio por CST validado na API (422 no campo).
    mot_des_icms: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable(),
    perc_dif: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0)
      .max(100),
    perc_fcp: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0)
      .max(100),
    perc_ipi_devol: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0)
      .max(100),
    // Rework de fidelidade (audit-nfe-emitidas.md, Grupo B "Catálogos
    // fiscais como select") — mirror `App\Product::listaCST*`/`origens()`,
    // legado exige (`->required()`) estes 7 selects em `_card-item.blade.php`.
    modality_bc: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .required(messages.modalityBcRequired)
      .typeError(messages.modalityBcRequired),
    origem: yup.string().trim().required(messages.origemRequired).max(1),
    // Limites alinhados ao legado (`_card-item.blade.php:187,190`,
    // `maxlength=60`/`maxlength=30` — "Cod. Produto"/"Cód. Benefício Fiscal").
    reference: yup.string().trim().nullable().max(60),
    cbenef: yup.string().trim().nullable().max(30),
    c_class_trib: yup.string().trim().nullable().max(6),
    cst_ibs_cbs: yup.string().trim().nullable().max(3),
    perc_ibs_uf: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    perc_ibs_mun: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    perc_reducao_aliq_ibs_uf: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    perc_reducao_aliq_ibs_mun: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    perc_dif_ibs_uf: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    perc_dif_ibs_mun: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    perc_cbs: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    perc_reducao_aliq_cbs: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    perc_dif_cbs: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    cst_is: yup.string().trim().nullable().max(3),
    perc_is: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    perc_is_espec: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    u_trib_is: yup.string().trim().nullable().max(6),
    ad_rem_ibs: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    ad_rem_cbs: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    tp_cred_pres_ibs_zfm: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable(),
    ind_doacao: yup.string().trim().nullable().max(1),
    // UT-000776 / T-776-FE-04 — referência por item da NF-e de devolução
    // (finnfe=4): chave (44 dígitos) + nº do item de origem (1..990), ambos
    // obrigatórios SÓ em devolução. Lê `finnfe` do cabeçalho via `from`.
    ref_access_key: yup
      .string()
      .trim()
      .nullable()
      .test('ref-access-key-devolucao', (value, testContext) => {
        if (!isDevolucao(testContext)) return true;
        if (!value) return testContext.createError({ message: messages.refAccessKeyRequired });
        if (!/^\d{44}$/.test(value)) {
          return testContext.createError({ message: messages.refAccessKeyLength });
        }
        return true;
      }),
    ref_item_number: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .typeError(messages.refItemNumberRange)
      .test('ref-item-number-devolucao', (value, testContext) => {
        if (!isDevolucao(testContext)) return true;
        if (value === null || value === undefined) {
          return testContext.createError({ message: messages.refItemNumberRequired });
        }
        if (!Number.isInteger(value) || value < 1 || value > 990) {
          return testContext.createError({ message: messages.refItemNumberRange });
        }
        return true;
      }),
  });

  // TASK-FE-036-D2-2 — linhas do bloco Financeiro, mirror EXATO de
  // `installmentItemSchema`/`categoryItemSchema` de `income-schema.ts`
  // (MESMAS mensagens de validação por campo, reaproveitadas do namespace
  // `nfes.nfe.form.validation.financial*` — não uma tradução nova
  // desconectada do padrão já usado por Income/Expense).
  const financialInstallmentItemSchema = yup.object({
    due_date: yup.string().nullable().required(messages.financialInstallmentDueDateRequired),
    value: yup
      .number()
      .nullable()
      .typeError(messages.financialInstallmentValueRequired)
      .required(messages.financialInstallmentValueRequired),
  });

  const financialCategoryItemSchema = yup.object({
    category_uuid: yup.string().nullable().required(messages.financialCategoryRequired),
    center_uuid: yup.string().nullable().required(messages.financialCenterRequired),
    plan_account_uuid: yup.string().nullable(),
    percentage: yup
      .number()
      .nullable()
      .typeError(messages.financialPercentageRequired)
      .min(0, messages.financialPercentageRange)
      .max(100, messages.financialPercentageRange)
      .required(messages.financialPercentageRequired),
  });

  return yup.object({
    // -- Aba "Cabeçalho" --
    client_uuid: v.option<string>().required(messages.clientRequired),
    natureza_uuid: v.option<string>().required(messages.naturezaRequired),
    state_registration_client: yup
      .string()
      .trim()
      .required(messages.stateRegistrationClientRequired)
      .max(191),
    type_payment: yup.string().trim().required(messages.typePaymentRequired).max(2),
    emissor_uuid: yup.mixed().nullable(),
    harvest_uuid: yup.mixed().nullable(),
    // E-11 do audit — legado habilita/exige Tipo Débito/Crédito conforme a
    // Finalidade selecionada (`_forms.blade.php:565-588`, JS
    // `handleFinNFeChange`): finnfe=6 → Tipo Débito obrigatório; finnfe=5 →
    // Tipo Crédito obrigatório. Nos demais casos seguem opcionais.
    type_debt: yup
      .string()
      .trim()
      .nullable()
      .max(2)
      .when('finnfe', {
        is: 6,
        then: (schema) => schema.required(messages.typeDebtRequiredWhenFinnfe6),
      }),
    type_credit: yup
      .string()
      .trim()
      .nullable()
      .max(2)
      .when('finnfe', {
        is: 5,
        then: (schema) => schema.required(messages.typeCreditRequiredWhenFinnfe5),
      }),
    transp_name: yup.string().trim().nullable().max(80),
    transp_cnpj: yup.string().trim().nullable().max(18),
    transp_address: yup.string().trim().nullable().max(80),
    transp_city_uuid: yup.mixed().nullable(),
    shipping_type: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      // D-101-16 — obrigatório como no legado (select sem opção vazia, padrão 0).
      .required(messages.shippingTypeRequired),
    // UT-000783: valida formato só quando preenchida (NF-e legada com placa
    // livre não é barrada ao ficar vazia); aceita antiga e Mercosul.
    shipping_board_vehicle: yup
      .string()
      .trim()
      .nullable()
      .max(8)
      .test(
        'plate-format',
        languageGB.defaltStrings.validations.plateInvalid,
        (v) => !v || isValidPlate(v)
      ),
    shipping_uf_shipping: yup.string().nullable().max(2),
    shipping_value: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .nullable()
      .min(0),
    specie: yup.string().trim().nullable().max(30),
    number_volumes: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    quantity_volumes: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    gross_weight: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    net_weight: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    departure_date: yup.string().nullable(),
    delivery_date: yup.string().nullable(),
    // DERIVADO (soma dos itens, `InputReadOnly`) — sem `.required()` próprio,
    // só numérico/não-negativo (o valor é sempre calculado pelo front, nunca
    // digitado pelo usuário — ver `NfeItemsTab.tsx`).
    discount: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .nullable()
      .min(0),
    added_value: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? 0 : value))
      .nullable()
      .min(0),
    percent_icms: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    icms_base: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    gta: yup.string().trim().nullable().max(191),
    type_guide: yup.string().trim().nullable().max(1),
    // E-11 do audit — legado torna UF/Número da Guia obrigatórios só quando
    // um Tipo de Guia é selecionado (`_forms.blade.php:292-304`, JS
    // `toggleRequiredGuideFields`: `isRequired = value && value != ''`).
    uf_guide: yup
      .string()
      .nullable()
      .max(2)
      .when('type_guide', {
        is: (value: string | null | undefined) => !!value,
        then: (schema) => schema.required(messages.ufGuideRequiredWhenTypeGuide),
      }),
    number_guide: yup
      .string()
      .trim()
      .nullable()
      .max(9)
      .when('type_guide', {
        is: (value: string | null | undefined) => !!value,
        then: (schema) => schema.required(messages.numberGuideRequiredWhenTypeGuide),
      }),
    serie_guide: yup.string().trim().nullable().max(9),
    // UT-000776 / T-776-FE-05 — defensivos agrícolas (grupo `agro`): até 20 linhas,
    // `n_receituario` (até 30) + `cpf_resp_tec` (CPF válido); EXCLUSIVO com a guia
    // (P-FE-05): guia + defensivo → erro na raiz do array (chave `agro_defensivos`).
    agro_defensivos: yup
      .array()
      .of(
        yup.object({
          n_receituario: yup
            .string()
            .trim()
            .required(messages.agroDefensivosReceituarioRequired)
            .max(30, messages.agroDefensivosReceituarioMax),
          cpf_resp_tec: yup
            .string()
            .trim()
            .required(messages.agroDefensivosCpfRequired)
            .test('agro-cpf-valid', messages.agroDefensivosCpfInvalid, (value) =>
              value ? isValidCpf(value) : true
            ),
        })
      )
      .max(NFE_AGRO_DEFENSIVOS_MAX, messages.agroDefensivosMax)
      .test(
        'agro-defensivos-exclusive-guide',
        messages.agroDefensivosGuideExclusive,
        (items, ctx) => {
          if (!items || items.length === 0) return true;
          const parent = ctx.parent as {
            type_guide?: string | null;
            uf_guide?: string | null;
            number_guide?: string | null;
            serie_guide?: string | null;
          };
          const hasGuide = [
            parent?.type_guide,
            parent?.uf_guide,
            parent?.number_guide,
            parent?.serie_guide,
          ].some((value) => !!value && String(value).trim() !== '');
          return !hasGuide;
        }
      ),
    order_number: yup.string().trim().nullable().max(20),
    // NFe Referência (Chave) — legado restringe a 44 dígitos numéricos
    // (`_forms.blade.php:75-78`, `oninput` filtra não-dígitos); mirror no
    // front via `Input` com filtro de dígitos (`CreateOrUpdateNfe.tsx`).
    ref_nfe: yup.string().trim().nullable().max(44),
    // Observações — legado `maxlength=1000` (`_forms.blade.php:155`).
    note: yup.string().trim().nullable().max(1000),
    antt: yup.string().trim().nullable().max(15),
    // Operação/Finalidade — legado `->required()` (`_forms.blade.php:47-65`).
    tipo: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .required(messages.tipoRequired)
      .typeError(messages.tipoRequired),
    finnfe: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .required(messages.finnfeRequired)
      .typeError(messages.finnfeRequired),
    // Tipo Emissão — E2E do dono (esteira 036fix5), mirror `App\Nfe::
    // emissions()`, legado `->required()` (`_forms.blade.php:61-66`).
    type_emission: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .required(messages.typeEmissionRequired)
      .typeError(messages.typeEmissionRequired),
    // "Gerar financeiro?" — E2E do dono (esteira 036fix5). Booleano simples,
    // sem `.required()` (sempre tem um valor default no form).
    has_financial: yup.boolean().default(true),

    // -- Bloco "Financeiro" (TASK-FE-036-D2-2, supera TASK-FE-036-D2) --
    // `required_if has_financial=true` (mirror `NfeRequest::rules()`,
    // TASK-BE-036-D2A) — `.test()` (não `.when()`) para reler o MESMO
    // `has_financial` já usado pelos testes de array abaixo, mesma técnica
    // de `income-schema.ts`.
    financial_type_title_uuid: yup
      .object()
      .nullable()
      .test(
        'financial-type-title-required-when-financial',
        messages.financialTypeTitleRequired,
        (value, testContext) => {
          const parent = testContext.parent as { has_financial?: boolean };
          return !parent?.has_financial || !!value;
        }
      ),
    financial_proprietary_uuid: yup.object().nullable(),
    financial_installments: yup
      .array()
      .of(financialInstallmentItemSchema)
      .test(
        'financial-installments-required',
        messages.financialInstallmentsRequired,
        (items, testContext) => {
          const parent = testContext.parent as { has_financial?: boolean };
          if (!parent?.has_financial) return true;
          return !!items && items.length > 0;
        }
      )
      .test(
        'financial-installments-sum-total',
        messages.financialInstallmentsSumMismatch,
        (items, testContext) => {
          const parent = testContext.parent as {
            has_financial?: boolean;
            items?: NfeItemRowShape[];
            shipping_value?: number;
            added_value?: number;
            discount?: number;
          };
          if (!parent?.has_financial || !items || items.length === 0) return true;

          // Total da NFe — MESMA fórmula de `nfe-total-must-be-positive`
          // abaixo (contrato de API §9), não o `amount` de Income/Expense
          // (a NFe não tem um campo `amount` de topo digitado pelo
          // usuário).
          const totalProducts = (parent.items ?? []).reduce((total, row) => {
            const quantity = Number(row?.quantity) || 0;
            const amount = Number(row?.amount) || 0;
            return total + quantity * amount;
          }, 0);
          const total =
            totalProducts +
            (Number(parent.shipping_value) || 0) +
            (Number(parent.added_value) || 0) -
            (Number(parent.discount) || 0);

          // Tolerância `count * 0.01` — MESMA fórmula de
          // `income-schema.ts`/GAP-FE-036-302 (o gerador de parcelas do
          // bloco Financeiro reaproveita `distributeWithoutReconciling`,
          // NfeFinancialTab.tsx).
          const sum = (items as NfeFinancialInstallmentRowShape[]).reduce(
            (acc, item) => acc + (Number(item?.value) || 0),
            0
          );
          const tolerance = items.length * 0.01;
          return Math.abs(sum - total) <= tolerance;
        }
      ),
    financial_categories: yup
      .array()
      .of(financialCategoryItemSchema)
      .test(
        'financial-categories-required',
        messages.financialCategoriesRequired,
        (items, testContext) => {
          const parent = testContext.parent as { has_financial?: boolean };
          if (!parent?.has_financial) return true;
          return !!items && items.length > 0;
        }
      )
      .test(
        'financial-categories-sum-100',
        messages.financialCategoriesSumMismatch,
        (items, testContext) => {
          const parent = testContext.parent as { has_financial?: boolean };
          if (!parent?.has_financial || !items || items.length === 0) return true;
          const sum = (items as NfeFinancialCategoryRowShape[]).reduce(
            (acc, item) => acc + (Number(item?.percentage) || 0),
            0
          );
          return (
            Math.abs(sum - FINANCIAL_APPORTIONMENT_SUM_TARGET) <=
            FINANCIAL_APPORTIONMENT_SUM_TOLERANCE
          );
        }
      ),

    // -- Aba "Itens & Totais" --
    items: yup
      .array()
      .of(itemRowSchema)
      .min(1, messages.itemsRequired)
      .default([])
      .test(
        'nfe-total-must-be-positive',
        messages.totalMustBePositive,
        (rows: NfeItemRowShape[] | undefined, context: yup.TestContext) => {
          const parent = context.parent as {
            shipping_value?: number;
            added_value?: number;
            discount?: number;
          };

          // Mirror EXATO `CalculateNfeTotalsAction` do backend (contrato de
          // API §9) e do preview de `NfeItemsTab.tsx` — fórmula ÚNICA, sem
          // ramificação create/update (fecha GAP-036-402 também do lado da
          // validação).
          const totalProducts = (rows ?? []).reduce((total, row) => {
            const quantity = Number(row?.quantity) || 0;
            const amount = Number(row?.amount) || 0;
            return total + quantity * amount;
          }, 0);
          const total =
            totalProducts +
            (Number(parent.shipping_value) || 0) +
            (Number(parent.added_value) || 0) -
            (Number(parent.discount) || 0);

          return total > 0;
        }
      ),
  });
};

export const nfeSchemaResolver = (languageGB: LanguageDate) => yupResolver(nfeSchema(languageGB));

export default nfeSchemaResolver;
