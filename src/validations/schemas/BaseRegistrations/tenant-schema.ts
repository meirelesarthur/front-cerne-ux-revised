// src/validations/schemas/BaseRegistrations/tenant-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Contratante (Tenant) — 33 campos +
// `centers[]`, fiel à obrigatoriedade de UI do legado
// (`agro365/resources/views/tenants/_forms.blade.php`) e ao contrato de tela
// (`Tenant-contrato-tela.md §3`). Mirror `Afiliados/partner-schema.ts` (Yup,
// não Zod — único padrão real do projeto), mensagens derivadas de
// `languageGB.baseRegistrations.tenant.form.validation` (nunca string
// literal).
//
// `isEditing` — afeta `plan_uuid` (`GAP-TN-FE-01`) E `centers`
// (`TenantDetailResource` não expõe os centros já vinculados — ver nota em
// `@types/v2/BaseRegistrations/tenant::TenantForm.centers` — tornar
// `centers` obrigatório também no EDIT bloquearia toda edição que não
// re-selecione manualmente os centros, mesmo sem tocar neles).
//
// RECONCILIAÇÃO (`GAP-TN-FE-03`, Achados A/B/C/D — todos RESOLVIDOS no
// backend real): `country_id`→`country` (uuid-first); `qtd_issuers`
// adicionado (Achado C).
//
// EXECUÇÃO 072 (TASK-072-FE-02, D1 do dono): País é SEMPRE Brasil no CREATE
// (FE-03), então o DV de CPF/CNPJ (`fieldValidationSchema.cpfCnpj()`) e o
// formato do CEP aplicam via `isBrazilCountry(country)` (o teste antigo
// comparava `codigo` com o `id` 30 e nunca casava). No EDIT o NIF é somente leitura (legado
// `readonly(isset($item))`) e NÃO revalida o DV (G-FE-1: registros antigos
// não-corrigíveis pelo usuário não podem bloquear o save). Limites I11
// (zip 9 / cellphone 15 / contact_phone 15 / email 89) espelham o back.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isBrazilCountry } from '@/constants/countries';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type {
  TenantForm,
  TenantSignature,
  TenantStatus,
} from '@/@types/v2/BaseRegistrations/tenant';

export const tenantSchema = (languageGB: LanguageDate, { isEditing }: { isEditing: boolean }) => {
  const v = languageGB.baseRegistrations.tenant.form.validation;
  const fv = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;

  // Select genérico (react-select/`SelectAsyncPaginate`/`Select` do projeto,
  // formato `Option<T> = {label, value}`) — mirror `partner-schema.ts`.
  const optionSchema = yup
    .object({ value: yup.mixed(), label: yup.string() })
    .nullable()
    .default(null);

  return yup.object({
    country: fv.option(),
    // CREATE (País sempre Brasil pela FE-03): CPF/CNPJ com DV (D1). O DV é
    // condicionado a `isBrazilCountry(country)`; EDIT: só obrigatório — NIF
    // readonly, sem revalidar DV (G-FE-1), inclusive contratante estrangeiro.
    nif: isEditing
      ? yup.string().trim().required(messages.requiredField)
      : yup.string().when('country', {
          is: (country: TenantForm['country']) => isBrazilCountry(country),
          then: () => fv.cpfCnpj(),
          otherwise: (schema) => schema.trim().required(messages.requiredField),
        }),
    nickname: yup.string().trim().required(v.nicknameRequired).max(60, v.nicknameMaxLength),
    name: yup.string().trim().required(v.nameRequired).max(30, v.nameMaxLength),
    email: fv.email().max(89, v.emailMaxLength),
    phone: yup.string().trim().required(v.phoneRequired).max(15, v.phoneMaxLength),
    cellphone: yup.string().nullable().max(15, v.cellphoneMaxLength),
    role_id: optionSchema.test('required', v.roleIdRequired, (value) => !!value),
    // Obrigatório só no CREATE (fidelidade ao blade); no EDIT o campo vem
    // PRÉ-SELECIONADO com o plano ativo (`GAP-TN-FE-01` RESOLVIDO,
    // `data.plan` no `fillForm`, `TASK-TN-FE-04`), mas permanece OPCIONAL no
    // schema — o backend aceita `plan_uuid` ausente (`sometimes`) e um
    // Tenant legitimamente sem plano ativo não deve ser bloqueado no save.
    plan_uuid: isEditing
      ? optionSchema
      : optionSchema.test('required', v.planRequired, (value) => !!value),
    // `.nullable()`, SEM `.required()` — decisão do dono, campo opcional.
    list_all_farms: optionSchema,
    qtd_farms: yup
      .number()
      .nullable()
      .typeError(v.qtdFarmsInvalid)
      .required(v.qtdFarmsRequired)
      .min(1, v.qtdFarmsMin),
    qtd_users: yup
      .number()
      .nullable()
      .typeError(v.qtdUsersInvalid)
      .required(v.qtdUsersRequired)
      .min(1, v.qtdUsersMin),
    // NOVO (Achado C, `GAP-TN-FE-03`, ✅) — 30º campo, mirror `qtd_farms`/`qtd_users`.
    qtd_issuers: yup
      .number()
      .nullable()
      .typeError(v.qtdIssuersInvalid)
      .required(v.qtdIssuersRequired)
      .min(1, v.qtdIssuersMin),
    // NOVOS (ajuste de homologação, `TASK-TN-12` backend ✅ validado) — 3
    // campos de quantidade fiscal, mirror EXATO de `qtd_issuers`.
    qtd_nfe: yup
      .number()
      .nullable()
      .typeError(v.qtdNfeInvalid)
      .required(v.qtdNfeRequired)
      .min(1, v.qtdNfeMin),
    qtd_cte: yup
      .number()
      .nullable()
      .typeError(v.qtdCteInvalid)
      .required(v.qtdCteRequired)
      .min(1, v.qtdCteMin),
    qtd_mdfe: yup
      .number()
      .nullable()
      .typeError(v.qtdMdfeInvalid)
      .required(v.qtdMdfeRequired)
      .min(1, v.qtdMdfeMin),
    export_xls: optionSchema.test('required', v.exportXlsRequired, (value) => !!value),
    // CEP opcional, até 9 caracteres (I11). Formato `00000-000` (I3) só para
    // Brasil — estrangeiro gravado (edit, G-FE-1) mantém CEP livre.
    zip_code: yup
      .string()
      .nullable()
      .max(9, v.zipCodeMaxLength)
      .when('country', {
        is: (country: TenantForm['country']) => isBrazilCountry(country),
        then: (schema) =>
          schema.matches(/^\d{5}-\d{3}$/, {
            message: messages.invalidValue,
            excludeEmptyString: true,
          }),
      }),
    address: yup.string().trim().required(v.addressRequired).max(120, v.addressMaxLength),
    city: optionSchema.test('required', v.cityRequired, (value) => !!value),
    contact: yup.string().nullable().max(120, v.contactMaxLength),
    contact_phone: yup.string().nullable().max(15, v.contactPhoneMaxLength),
    status: optionSchema.test('required', v.statusRequired, (value) => !!value),
    // `.nullable()`, SEM `.required()` — decisão do dono, campo opcional.
    uses_cash_book: optionSchema,
    use_fiscal: optionSchema.test('required', v.useFiscalRequired, (value) => !!value),
    signature: optionSchema.test('required', v.signatureRequired, (value) => !!value),
    dt_accession: yup
      .string()
      .trim()
      .nullable()
      .required(v.dtAccessionRequired)
      .matches(/^\d{4}-\d{2}-\d{2}$/, { message: v.dtAccessionRequired, excludeEmptyString: true }),
    // `signature=99` (UNDETERMINED) oculta+desobriga `due_date` (mirror
    // `handleTaxation()` do blade legado) — condicional client-side via
    // `watch()` no formulário (`TASK-TN-FE-04`), aqui só a regra de
    // validação em si.
    due_date: yup
      .string()
      .nullable()
      .when('signature', {
        is: (signature: Option<TenantSignature> | null) => signature?.value !== 99,
        then: (schema) => schema.required(v.dueDateRequired),
      }),
    due_day: optionSchema.test('required', v.dueDayRequired, (value) => !!value),
    value: yup
      .number()
      .nullable()
      .typeError(v.valueInvalid)
      .required(v.valueRequired)
      .min(0, v.valueMin),
    generate_financial: optionSchema.test(
      'required',
      v.generateFinancialRequired,
      (value) => !!value
    ),
    generate_ticket: optionSchema.test('required', v.generateTicketRequired, (value) => !!value),
    // `status=4` (CANCELLED) revela+obriga `cancellation_reason` (mirror
    // `handleCancellation()` do blade legado).
    cancellation_reason: yup.string().when('status', {
      is: (status: Option<TenantStatus> | null) => status?.value === 4,
      then: (schema) => schema.trim().required(v.cancellationReasonRequired),
    }),
    // CLIENT-required por fidelidade ao blade SÓ no CREATE — no EDIT o
    // `TenantDetailResource` não expõe os centros já vinculados (achado
    // desta execução, ver `TenantForm.centers`), então exigir `min(1)`
    // sempre bloquearia qualquer edição que não re-selecione manualmente
    // os centros, mesmo sem tocar neles. `dirtyFields.centers` (não este
    // schema) é quem decide se a chave entra no payload de UPDATE.
    centers: isEditing
      ? yup.array().of(yup.string().required())
      : yup.array().of(yup.string().required()).min(1, v.centersRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @param {{isEditing: boolean}} options - `isEditing` afeta `plan_uuid` e `centers` (ver `tenantSchema`).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const tenantSchemaResolver = (languageGB: LanguageDate, options: { isEditing: boolean }) =>
  yupResolver(tenantSchema(languageGB, options));

export default tenantSchemaResolver;
