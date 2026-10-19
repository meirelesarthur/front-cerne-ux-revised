// src/validations/schemas/Users/user-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Usuários" (User — Cadastros Base),
// espelhando `UserRequest::rules()` (User-contrato.md §18.1/§7.1, TASK-FE-900
// — reversão E2E). Vive em `src/validations/schemas/` (NÃO em `pages/`) —
// mesmo path canônico de `client-schema.ts`.
//
// REVERSÃO (TASK-FE-900): o bloco "Pessoa" volta a ser campos achatados
// inline (nif/name/email/phone/city_uuid/address), CREATE e EDIT com as
// MESMAS regras — não há mais `person_uuid` no form.
// `nif`/`name`/`city_uuid`/`address` são validados como sempre obrigatórios
// no FRONT (a tela sempre resolve a Person por NIF — nunca omite o bloco
// inteiro como um cliente mobile por `person_uuid` poderia fazer; a API é
// mais frouxa — `required_with:nif` — porque também atende esse outro
// caminho, fora do escopo desta tela).
//
// AJUSTE 2º E2E (TASK-FE-912) — `number`/`district` SAÍRAM do schema (campos
// removidos da tela, ver `@types/v2/Users/index.d.ts`); `contact_email`
// também SAIU como campo distinto — a tela agora tem 1 único `email`,
// reenviado para os 2 destinos (`email`/`contact_email`) no payload, ver
// `CreateOrUpdateUsuario.tsx::tryPersistUser`.
//
// `isEditing` como 2º parâmetro da fábrica (mirror `pessoa-schema.ts`):
//   - `email`: obrigatório, formato e-mail, `max:191`, em AMBOS os modos
//     (D-02 continua válida no MODELO DE DADOS — os 2 campos seguem
//     desacoplados no banco; é só a tela que passou a oferecer 1 input).
//   - `password`/`password_confirmation`: obrigatórios (+ min:6 / match) só
//     no CREATE — no edit os campos nem existem na UI (mirror
//     `StepUsuario.tsx`/`u.editPasswordNotice`).
//   - `role_uuids`: array, MÍNIMO 1 item — decisão de fidelidade ao legado
//     (contrato §3.4.3/§18).
//   - `farm_uuids`/`boss_uuids`: array, opcionais.
//   - `is_active`/`is_purchasing_assistant`: booleanos.
//
// `photo` NÃO entra neste schema — gerida fora do RHF (estado dedicado no
// componente, mesmo padrão `icon` de `marker-schema.ts`).
// `nickname` também NÃO entra — campo "invisível" preenchido só via
// `handleNifBlur` (TASK-FE-903), sem UI/validação própria (mirror do legado,
// que nunca perguntou apelido no form de User).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isValidCpfCnpj } from '@/utils/cpfCnpj';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const userSchema = (languageGB: LanguageDate, isEditing = false) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.users.user.form.validation;

  return yup.object({
    nif: yup
      .string()
      .trim()
      .required(messages.nifRequired)
      .test('valid-nif', messages.nifInvalid, (value) => (value ? isValidCpfCnpj(value) : false)),

    name: yup.string().trim().required(messages.nameRequired).max(120, messages.nameMaxLength),

    // Único e-mail da tela (TASK-FE-912) — alimenta login E contato no
    // payload, mas aqui é validado com as regras do login (mais estritas),
    // já que precisa satisfazer os 2 destinos.
    email: yup
      .string()
      .trim()
      .required(messages.emailRequired)
      .email(messages.emailInvalid)
      .max(191, messages.emailMaxLength),

    phone: yup.string().nullable(),

    city_uuid: v.option().required(messages.cityRequired),

    address: yup
      .string()
      .trim()
      .required(messages.addressRequired)
      .max(120, messages.addressMaxLength),

    // Só obrigatório no CREATE — no edit o campo não é renderizado (omitido
    // inteiro, não apenas desabilitado, mirror `StepUsuario.tsx`).
    password: isEditing
      ? yup.string().nullable()
      : yup.string().required(messages.passwordRequired).min(6, messages.passwordMin),

    // Confirmação client-side only, nunca enviada à API. Só valida "bate com
    // a senha" no CREATE (mesmo racional de `pessoa-schema.ts`, achado D).
    password_confirmation: isEditing
      ? yup.string().nullable()
      : yup
          .string()
          .nullable()
          .when('password', {
            is: (password: string) => !!password,
            then: (schema) =>
              schema.oneOf([yup.ref('password')], messages.passwordConfirmationMismatch),
          }),

    is_active: v.boolean(),
    is_purchasing_assistant: v.boolean(),

    // Mínimo 1 item — decisão de fidelidade ao legado (contrato §3.4.3), a
    // API aceita `nullable` mas o front exige por paridade de comportamento.
    role_uuids: yup.array(yup.string().required()).min(1, messages.roleUuidsMin).default([]),
    // 97-Esteiras/030 — fazenda passou a ser OBRIGATÓRIA (mínimo 1), mesmo
    // espelho literal de `role_uuids` acima (decisão de fidelidade ao
    // legado, sem `.min()` antes era possível salvar Usuário sem nenhuma
    // fazenda vinculada).
    farm_uuids: yup.array(yup.string().required()).min(1, messages.farmUuidsMin).default([]),
    boss_uuids: yup.array(yup.string().required()).default([]),
  });
};

export const userSchemaResolver = (languageGB: LanguageDate, isEditing = false) =>
  yupResolver(userSchema(languageGB, isEditing));

export default userSchemaResolver;
