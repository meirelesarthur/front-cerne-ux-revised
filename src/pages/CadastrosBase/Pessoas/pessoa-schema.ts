// src/pages/CadastrosBase/Pessoas/pessoa-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do wizard de Pessoa — árvore ÚNICA (não fatiada por
// etapa); a navegação do wizard valida só os campos da etapa atual via
// `trigger([...paths])` do React Hook Form (`CreateOrUpdatePessoa.tsx`).
//
// Limites REAIS do contrato (`PersonRequest::rules()`), NÃO os do protótipo
// UX (que usa maxLength={70} para name/nickname): `name` max:120,
// `nickname` max:60. `number` max:10, `district` max:60.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import transformStringToNumber from '@/utils/transformStringToNumber';

import type { LanguageDate } from '@/@types/language';

import { isValidNif } from './nif';

export const personSchema = (languageGB: LanguageDate, isEditing = false) => {
  const v = languageGB.people.person.form.validation;

  const optionSchema = yup
    .object({ value: yup.mixed(), label: yup.string() })
    .nullable()
    .default(null);

  return yup.object({
    nif: yup
      .string()
      .trim()
      .required(v.nifRequired)
      .test('valid-nif', v.nifInvalid, (value) => (value ? isValidNif(value) : false)),
    name: yup.string().trim().required(v.nameRequired).max(120, v.nameMaxLength),
    nickname: yup.string().trim().required(v.nicknameRequired).max(60, v.nicknameMaxLength),
    email: yup
      .string()
      .trim()
      .email(v.emailInvalid)
      .when(['user', 'client', 'proprietary'], {
        is: (
          user: { enabled?: boolean },
          client: { enabled?: boolean },
          proprietary: { enabled?: boolean }
        ) => !!user?.enabled || !!client?.enabled || !!proprietary?.enabled,
        then: (schema) => schema.required(v.emailRequiredForAccess),
        otherwise: (schema) => schema.notRequired(),
      }),
    phone: yup.string().nullable(),
    city: optionSchema.test('required', v.cityRequired, (value) => !!value),
    address: yup.string().trim().required(v.addressRequired),
    number: yup.string().trim().required(v.numberRequired).max(10, v.numberMaxLength),
    district: yup.string().trim().required(v.districtRequired).max(60, v.districtMaxLength),

    proprietary: yup.object({
      enabled: yup.boolean().default(false),
      farms: yup
        .array(
          yup.object({
            farm: optionSchema.test('required', v.farmRequired, (value) => !!value),
            // TASK-FE-333 — REVERTIDO de `yup.number()` (TASK-FE-330) para
            // `yup.string()` com teste custom sobre a string (padrão
            // pré-existente antes de `TASK-FE-330`): `PercentInput` impedia
            // digitar 100% (cap de `MAX_RAW_DIGITS=4`). `transformStringToNumber`
            // (mesma função usada no `buildPayload()`) faz o parse
            // vírgula→ponto antes de validar a faixa 0-100.
            percentage: yup
              .string()
              .nullable()
              .test('percentage-range', v.percentageRange, (value) => {
                if (!value) return true;
                const num = transformStringToNumber(value);
                return !Number.isNaN(num) && num >= 0 && num <= 100;
              }),
          })
        )
        .default([]),
      state_registration_numbers: yup.array(yup.object({ value: yup.string() })).default([]),
    }),

    employee: yup.object({
      enabled: yup.boolean().default(false),
      office: yup.string().nullable(),
      function: optionSchema.when('enabled', {
        is: true,
        then: (schema) => schema.test('required', v.functionRequired, (value) => !!value),
      }),
      // TASK-FE-330 — 5 campos migrados de `yup.string()` para
      // `yup.number()` (sem faixa nova — fora do que o dev pediu para
      // `commission`, ver Leitura do dev da Tarefa).
      commission: yup.number().nullable(),
      vl_time_productive: yup.number().nullable(),
      vl_time_unproductive: yup.number().nullable(),
      base_salary: yup.number().nullable(),
      goal_salary: yup.number().nullable(),
      center: optionSchema,
      birthday: yup
        .string()
        .nullable()
        .when('enabled', {
          is: true,
          then: (schema) => schema.required(v.birthdayRequired),
        }),
      bank: optionSchema,
      account_type: yup.string().nullable(),
      agency: yup.string().nullable(),
      account: yup.string().nullable(),
      pix_type: optionSchema,
      pix: yup.string().nullable(),
    }),

    provider: yup.object({
      enabled: yup.boolean().default(false),
      type: optionSchema.when('enabled', {
        is: true,
        then: (schema) => schema.test('required', v.typeRequired, (value) => !!value),
      }),
      // TASK-FE-330 — migrados de `yup.string()` para `yup.number()`.
      commission: yup.number().nullable(),
      hour_value: yup.number().nullable(),
      state_registration: yup.string().nullable(),
      city_registration: yup.string().nullable(),
      contact: yup.string().nullable(),
      contact_phone: yup.string().nullable(),
      bank: optionSchema,
      account_type: yup.string().nullable(),
      agency: yup.string().nullable(),
      account: yup.string().nullable(),
      pix_type: optionSchema,
      pix: yup.string().nullable(),
      branches: yup
        .array(
          yup.object({
            nif: yup.string().required(v.branchNifRequired),
            name: yup.string().nullable(),
            state_registration: yup.string().nullable(),
            zip_code: yup.string().nullable(),
            city: optionSchema.test('required', v.branchCityRequired, (value) => !!value),
            address: yup.string().required(v.branchAddressRequired),
          })
        )
        .default([]),
      sellers: yup
        .array(
          yup.object({
            name: yup.string().required(v.sellerNameRequired),
            email: yup.string().email(v.emailInvalid).nullable(),
            phone: yup.string().nullable(),
          })
        )
        .default([]),
    }),

    client: yup.object({
      enabled: yup.boolean().default(false),
      cellphone: yup.string().nullable(),
      contact: yup.string().nullable(),
      contact_phone: yup.string().nullable(),
      city_registration: yup.string().nullable(),
      farm_name: yup.string().nullable(),
      final_costumer: yup.boolean().default(false),
      taxpayer: yup.boolean().default(true),
      code_country: yup.string().when('enabled', {
        is: true,
        then: (schema) => schema.required(v.countryRequired),
      }),
      id_abroad: yup.string().nullable(),
      // TASK-FE-334 — repeater; mesmo shape/schema de
      // `proprietary.state_registration_numbers` acima.
      state_registrations: yup.array(yup.object({ value: yup.string() })).default([]),
    }),

    user: yup.object({
      enabled: yup.boolean().default(false),
      is_purchasing_assistant: yup.boolean().default(false),
      password: yup.string().nullable(),
      // Achado D — na edição os campos de senha nem aparecem na UI
      // (`StepUsuario.tsx`); a validação de "confirmação bate com a senha"
      // só faz sentido na criação (único lugar onde os campos existem).
      password_confirmation: isEditing
        ? yup.string().nullable()
        : yup
            .string()
            .nullable()
            .when('password', {
              is: (password: string) => !!password,
              then: (schema) => schema.oneOf([yup.ref('password')], v.passwordConfirmationMismatch),
            }),
      farm_uuids: yup.array(yup.string()).default([]),
      role_uuids: yup.array(yup.string()).default([]),
      boss_uuids: yup.array(yup.string()).default([]),
    }),
  });
};

export const personSchemaResolver = (languageGB: LanguageDate, isEditing = false) =>
  yupResolver(personSchema(languageGB, isEditing));

export default personSchemaResolver;
