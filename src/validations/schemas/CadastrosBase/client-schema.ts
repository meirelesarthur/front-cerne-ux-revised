// src/validations/schemas/CadastrosBase/client-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Clientes" (Client — Cadastros
// Base).
//
// ⚠️ SCAFFOLD ADIANTADO POR ESPELHAMENTO (TASK-CL-FE-01) — escrito ANTES de
// `Client-contrato.md`/`ClientRequest.php` existirem, mirror estrutural de
// `proprietary-schema.ts` (irmão mais próximo). Reconfirmar contra
// `ClientRequest::rules()` quando materializado.
//
// Vive em `src/validations/schemas/` (NÃO em `pages/`) — mesmo padrão
// canônico de `provider-schema.ts`/`proprietary-schema.ts`.
//
// Independência arquitetural: NÃO importa nada de
// `@/pages/CadastrosBase/Pessoas/` — a validação de CPF/CNPJ vem do util
// PURO e compartilhado `@/utils/cpfCnpj` (mesmo algoritmo usado por
// `provider-schema.ts`/`proprietary-schema.ts`).
//
// `zip_code` NULLABLE (não `required`) — divergência DELIBERADA do texto da
// ficha (que sugeria `address/number/district/zip_code` todos obrigatórios):
// leitura direta dos 2 precedentes reais (`provider-schema.ts:49`,
// `proprietary-schema.ts:56`) confirma que só `address`/`number`/`district`
// são `required` na raiz de Person — `zip_code` é sempre `nullable()` nos
// dois módulos irmãos já ✅ CONCLUÍDO/validados. Seguido aqui por fidelidade
// ao precedente real, reconfirmar contra `ClientRequest` quando existir.
//
// `code_country` obrigatório — `id_abroad` SEM regra condicional adicional
// no schema (opcional, sempre visível na UI — AJUSTE DE HOMOLOGAÇÃO
// 2026-07-30, confirmado no legado real
// `agro365/resources/views/clients/_forms.blade.php`: campo sempre
// presente/opcional, nunca condicional a `code_country`).
//
// `code_country` — CORREÇÃO CRÍTICA (2026-07-30): passou de
// `yup.string().required()` (aceitava QUALQUER string, inclusive sigla ISO
// `"BR"` — causa-raiz do 500 `SQLSTATE[22P02]`) para o MESMO padrão Option
// de `city` acima (`optionSchema.test(...)`), pois o campo virou
// `SelectAsyncPaginate` sobre `/countries/options`
// (`value = codigo` numérico, NUNCA ISO). Ver nota de cabeçalho de
// `CreateOrUpdateCliente.tsx`.
//
// `is_enabled` — AJUSTE DE HOMOLOGAÇÃO (2026-07-30): passou a ser campo
// OBRIGATÓRIO do form ("Ativo*"), divergindo do mirror original de
// `Proprietary`/`Provider` (que ainda forçam o valor server-side). Mesmo
// padrão de validação já usado por `especie-schema.ts`/
// `plan-account-schema.ts` (`yup.boolean().required()`).
//
// `state_registrations`: array de `{ value: string }`. D5 (T-DEF02-FE-02):
// sem máscara, só `ISENTO` (case-insensitive) ou 2–14 dígitos; vazio segue
// opcional. Mesma regra de `ClientRequest` (T-DEF02-API-03); sem DV por UF.
//
// SEM bloco `farms[]` — Client não tem participação societária (diferente
// de `Proprietary`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isValidCpfCnpj } from '@/utils/cpfCnpj';

import type { LanguageDate } from '@/@types/language';

// D5 — IE sem máscara: `ISENTO` (case-insensitive) ou 2–14 dígitos. Vazio = opcional.
export function isValidStateRegistration(value: string | undefined | null): boolean {
  const raw = (value ?? '').replace(/[.\-/\s]/g, '');
  if (raw === '') return true;
  return raw.toUpperCase() === 'ISENTO' || /^[0-9]{2,14}$/.test(raw);
}

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const clientSchema = (languageGB: LanguageDate) => {
  const v = languageGB.clients.client.form.validation;

  return yup.object({
    // --- raiz Person ---
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

    // --- bloco client (papel) ---
    cellphone: yup.string().nullable(),
    contact: yup.string().nullable(),
    contact_phone: yup.string().nullable(),
    city_registration: yup.string().nullable(),
    farm_name: yup.string().nullable(),
    is_enabled: yup.boolean().required(),
    final_costumer: yup.boolean().default(false),
    taxpayer: yup.boolean().default(true),
    // CORREÇÃO CRÍTICA (2026-07-30) — `Option<codigo>`, não mais
    // `yup.string()` cru (aceitava a sigla ISO indevidamente).
    code_country: optionSchema.test('required', v.countryRequired, (value) => !!value),
    // `id_abroad` — sem regra condicional adicional no schema, SEMPRE
    // visível na UI (AJUSTE DE HOMOLOGAÇÃO 2026-07-30 — ver nota de
    // cabeçalho acima).
    id_abroad: yup.string().nullable(),
    state_registrations: yup
      .array(
        yup.object({
          value: yup
            .string()
            .test('valid-state-registration', v.stateRegistrationInvalid, (value) =>
              isValidStateRegistration(value)
            ),
        })
      )
      .default([]),
  });
};

export const clientSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(clientSchema(languageGB));

export default clientSchemaResolver;
