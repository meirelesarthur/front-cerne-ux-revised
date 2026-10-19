// src/validations/schemas/RequestReceipts/financial-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup da tela "Gerar Financeiro" (RequestReceipt —
// Administrativo / Suprimentos, esteira 97-Esteiras/040, TASK-RCB-FE-03).
// Fábrica `(languageGB) => yupResolver(...)`, mirror mecânico de
// `confirm-receipt-schema.ts`/`request-purchase-schema.ts`.
//
// Localização: `src/validations/schemas/RequestReceipts/`, NUNCA em
// `pages/` (regra inviolável §7 do contrato de arquitetura).
//
// Condicionais reais (IG-03/CALC-03):
//   - `input_value`/`input_date` obrigatórios quando `has_input.value===1`
//     (`.when('has_input', ...)` comum — sibling da MESMA linha do form
//     raiz, não precisa do mecanismo de `.test()` de array).
//   - `vl_total` é sempre presente no form (hidratado do contexto,
//     server-authoritative exceto tipo `D` — CLM-17); o schema exige valor
//     maior que zero ("O valor do título deve ser maior que zero", RRC:247-251);
//     a regra de "quem pode editar" é de UI (campo desabilitado fora do tipo `D`).
//   - Nº Título e Fornecedor obrigatórios (FF-08, FF-11; a API também exige).
//   - "Int. Parcelas (dias)" pode ficar vazio (vale 0, como no legado).
//   - Parcelas e rateio não vazios e rateio igual ao total: checados no submit
//     (`GerarFinanceiroPage`), com as mensagens do legado.
//   - Rateio (`ratio[]`): `category_uuid`/`center_uuid`/`value` obrigatórios
//     por linha. A soma de percentual (Σ=100%) é aviso visual, NUNCA bloqueia
//     o submit — mirror EXATO da decisão já documentada em
//     `RequestAuthorizationRatioFieldArray.tsx` ("Soma de % NÃO bloqueia o
//     submit no backend — só o JS legado avisava"), reuso confirmado pelo
//     arquiteto.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { GenerateFinancialForm } from '@/@types/v2/RequestReceipts';
import type Shape from '@/@types/validations/shape';

const financialSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const text = languageGB.requestReceipts.requestReceipt.financial.validation;

  const installmentRowSchema = yup.object({
    due_date: v.date(),
    value: v.number(),
  });

  const ratioRowSchema = yup.object({
    category_uuid: v.option<string>().required(text.ratioCategoryRequired),
    center_uuid: v.option<string>().required(text.ratioCenterRequired),
    plan_account_uuid: yup.mixed().nullable(),
    value: v.number(),
    percent: yup.number().nullable(),
  });

  return yup.object().shape<Shape<GenerateFinancialForm>>({
    code: yup.string().nullable(),
    responsible: yup.string().nullable(),
    receipt_date: yup.string().nullable(),
    nfe: yup.string().nullable(),
    receipt_note: yup.string().nullable(),

    vl_total: v.number().required(text.vlTotalRequired).moreThan(0, text.vlTotalPositive),

    financial_number: yup
      .string()
      .trim()
      .required(text.financialNumberRequired)
      .max(15, text.financialNumberMaxLength),
    financial_type_id: v.option<string>().required(text.financialTypeIdRequired),
    financial_proprietary_id: yup.mixed().nullable(),
    financial_provider_id: v.option<string>().required(text.providerRequired),
    financial_note: yup
      .string()
      .trim()
      .required(text.financialNoteRequired)
      .max(1000, text.financialNoteMaxLength),

    has_input: v.option<0 | 1>().required(text.hasInputRequired),
    input_value: yup
      .number()
      .nullable()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .when('has_input', {
        is: (option: { value?: number } | null) => option?.value === 1,
        then: (schema) => schema.required(text.inputValueRequired),
        otherwise: (schema) => schema.nullable(),
      }),
    input_date: yup
      .string()
      .trim()
      .nullable()
      .when('has_input', {
        is: (option: { value?: number } | null) => option?.value === 1,
        then: (schema) => schema.required(text.inputDateRequired),
        otherwise: (schema) => schema.nullable(),
      }),

    qtd_installments: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(text.qtdInstallmentsRequired)
      .required(text.qtdInstallmentsRequired)
      .min(1, text.qtdInstallmentsMin),
    first_installment: v.date().required(text.firstInstallmentRequired),
    int_installments: yup
      .number()
      .nullable()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .min(0, text.qtdInstallmentsMin),
    fiscal_document: v.option<boolean>(),

    installments: yup.array().of(installmentRowSchema).default([]),
    ratio: yup.array().of(ratioRowSchema).default([]),
  });
};

export const financialSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(financialSchema(languageGB));

export default financialSchemaResolver;
