// src/pages/CadastrosBase/Afiliados/partner-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Afiliado (Partner) — 19 campos,
// fiel à obrigatoriedade de UI do contrato de tela §3.4 (`Partner-Frontend-
// Contrato.md`). `commission` é `numeric, min:0` SEM teto 100 (diferente de
// Funcionário/Fornecedor) — confirmado contra `PartnerRequest::rules()`
// (contrato backend §5). `zip_code` SEM validação (opcional, nunca bloqueia
// submit — CORREÇÃO E2E feature 024: passou a ir no payload, ver
// `partner-service.ts`).
//
// `phone`/`qtd_farms` são `required` aqui por FIDELIDADE DE UX ao legado
// (decisão já tomada no contrato de tela §1 — "Divergência deliberada vs.
// legado") mesmo o backend aceitando `nullable` nesses 2 campos.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isValidCpfCnpj } from '@/utils/cpfCnpj';

import type { LanguageDate } from '@/@types/language';

export const partnerSchema = (languageGB: LanguageDate) => {
  const v = languageGB.afiliados.partner.form.validation;

  const optionSchema = yup
    .object({ value: yup.mixed(), label: yup.string() })
    .nullable()
    .default(null);

  return yup.object({
    nif: yup
      .string()
      .trim()
      .required(v.nifRequired)
      .test('valid-nif', v.nifInvalid, (value) => (value ? isValidCpfCnpj(value) : false)),
    nickname: yup.string().trim().required(v.nicknameRequired).max(60, v.nicknameMaxLength),
    name: yup.string().trim().required(v.nameRequired).max(30, v.nameMaxLength),
    email: yup.string().trim().email(v.emailInvalid).required(v.emailRequired).max(89, v.emailMaxLength),
    phone: yup.string().trim().required(v.phoneRequired),
    cellphone: yup.string().nullable(),
    zip_code: yup.string().nullable(),
    address: yup.string().trim().required(v.addressRequired).max(120, v.addressMaxLength),
    city: optionSchema.test('required', v.cityRequired, (value) => !!value),
    contact: yup.string().nullable(),
    contact_phone: yup.string().nullable(),
    status: optionSchema.test('required', v.statusRequired, (value) => !!value),
    dt_affiliation: yup.string().nullable().required(v.dtAffiliationRequired),
    // Sem `.max()` — `PartnerRequest::commission` é `numeric, min:0` SEM
    // teto (diferente da comissão de Funcionário/Fornecedor, que tem 100).
    commission: yup
      .number()
      .nullable()
      .typeError(v.commissionInvalid)
      .required(v.commissionRequired)
      .min(0, v.commissionMin),
    due_date: yup.string().nullable(),
    qtd_farms: yup
      .number()
      .nullable()
      .typeError(v.qtdFarmsInvalid)
      .required(v.qtdFarmsRequired)
      .min(0, v.qtdFarmsMin),
    business_rule: yup.string().nullable(),
    note: yup.string().nullable(),
    contract_file: yup.mixed().nullable(),
    remove_contract_file: yup.boolean().default(false),
  });
};

export const partnerSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(partnerSchema(languageGB));

export default partnerSchemaResolver;
