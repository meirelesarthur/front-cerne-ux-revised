// src/validations/schemas/CadastrosBase/provider-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Fornecedores" (Provider —
// Cadastros Base), espelhando `ProviderRequest::rules()` (lido diretamente
// em `api_root`, TASK-PR-FE-01). Vive em `src/validations/schemas/` (NÃO em
// `pages/`) — o legado de Pessoas/Bancos que coloca o schema dentro da
// própria pasta de página é um DESVIO pré-canonização (Provider-FrontEnd-
// contrato.md `## 8`), não uma referência a clonar.
//
// Independência arquitetural: NÃO importa nada de
// `@/pages/CadastrosBase/Pessoas/` (mesma decisão de `ProviderRequest` não
// estender `PersonRequest` por herança) — a validação de CPF/CNPJ vem do
// util PURO e compartilhado `@/utils/cpfCnpj` (mesmo algoritmo usado por
// `Pessoas/nif.ts`, mas sem importar a pasta de Pessoas).
//
// Obrigatoriedade condicional (DA-PR-08, fechada no `ProviderRequest`):
// `commission` requerido só quando `type===Comissionado(5)`; `hour_value`
// requerido só quando `type===Terceirizado(3)`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isValidCpfCnpj } from '@/utils/cpfCnpj';
import { GUID_REGEX } from '@/utils/guid';

import { providerType } from '@/constants/cadastrosBase/provider/provider-type';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const providerSchema = (languageGB: LanguageDate) => {
  const v = languageGB.providers.provider.form.validation;

  return yup.object({
    // --- raiz Person (idênticos a ProviderRequest §4.2) ---
    nif: yup
      .string()
      .trim()
      .required(v.nifRequired)
      .test('valid-nif', v.nifInvalid, (value) => (value ? isValidCpfCnpj(value) : false)),
    name: yup.string().trim().required(v.nameRequired).max(120, v.nameMaxLength),
    nickname: yup.string().trim().required(v.nicknameRequired).max(60, v.nicknameMaxLength),
    email: yup.string().trim().email(v.emailInvalid).max(89, v.emailMaxLength).nullable(),
    phone: yup.string().nullable(),
    zip_code: yup.string().nullable(),
    address: yup.string().trim().required(v.addressRequired).max(120, v.addressMaxLength),
    number: yup.string().trim().required(v.numberRequired).max(10, v.numberMaxLength),
    district: yup.string().trim().required(v.districtRequired).max(60, v.districtMaxLength),
    city: optionSchema.test('required', v.cityRequired, (value) => !!value),

    // --- bloco provider (raiz do papel) ---
    type: optionSchema.test('required', v.typeRequired, (value) => !!value),
    commission: yup
      .number()
      .nullable()
      .when('type', {
        is: (type: { value?: number } | null) => type?.value === providerType.comissionado,
        then: (schema) => schema.required(v.commissionRequiredForType),
      }),
    hour_value: yup
      .number()
      .nullable()
      .when('type', {
        is: (type: { value?: number } | null) => type?.value === providerType.terceirizado,
        then: (schema) => schema.required(v.hourValueRequiredForType),
      }),
    state_registration: yup.string().nullable(),
    city_registration: yup.string().nullable(),
    contact: yup.string().max(120, v.contactMaxLength).nullable(),
    contact_phone: yup.string().nullable(),
    cellphone: yup.string().max(15, v.cellphoneMaxLength).nullable(),
    // UT-000773 — centro de custo padrão opcional; GUID v1-v8 (UUIDv7 do
    // backend) — nunca `yup.string().uuid()`.
    default_cost_center: optionSchema.test(
      'guid',
      v.defaultCostCenterInvalid,
      (opt) => !opt || GUID_REGEX.test(String(opt.value ?? ''))
    ),
    is_enabled: optionSchema.test('required', v.isEnabledRequired, (value) => !!value),

    // --- aba Conta (presence-aware no backend, sem obrigatoriedade extra
    // no client — fiel ao legado, ProviderRequest `sometimes|nullable`) ---
    bank: optionSchema,
    account_type: optionSchema,
    agency: yup.string().nullable(),
    account: yup.string().nullable(),
    pix_type: optionSchema,
    pix: yup.string().nullable(),

    // --- aba Filiais (V1 confirmado) — sem validação server-side própria
    // além de `required_with`, fiel ao legado (Doc Bruta §5) ---
    branches: yup
      .array(
        yup.object({
          nif: yup.string().trim().required(v.branchNifRequired),
          name: yup.string().nullable(),
          state_registration: yup.string().nullable(),
          zip_code: yup.string().nullable(),
          city: optionSchema.test('required', v.branchCityRequired, (value) => !!value),
          address: yup.string().trim().required(v.branchAddressRequired),
        })
      )
      .default([]),

    // --- aba Vendedores (V1 confirmado) ---
    sellers: yup
      .array(
        yup.object({
          name: yup.string().trim().required(v.sellerNameRequired),
          email: yup.string().trim().email(v.sellerEmailInvalid).nullable(),
          phone: yup.string().nullable(),
        })
      )
      .default([]),
  });
};

export const providerSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(providerSchema(languageGB));

export default providerSchemaResolver;
