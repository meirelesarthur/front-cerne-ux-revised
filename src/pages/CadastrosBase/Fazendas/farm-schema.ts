// src/pages/CadastrosBase/Fazendas/farm-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do wizard de Fazenda — padrão da empresa: FUNÇÃO que
// recebe `languageGB` e devolve o schema (mensagens i18n). Fecha, em uma única
// passada, os campos dos 5 steps (`TASK-FE-400` fundação + `TASK-FE-402`
// steps 1-3 + `TASK-FE-403` steps 4-5).
//
// `image`/`remove_image` NÃO entram neste schema — geridos fora do RHF (mesmo
// padrão de `family-equipment-schema.ts`). `centers`/`tenant_id` também ficam
// fora de validação Yup obrigatória — `centers` é opcional (array livre) e
// `tenant_id` tem regra condicional por papel (Gestor_Plataf) melhor expressa
// como guarda manual no submit (`CreateOrUpdateFarm.tsx`) do que em `.when()`
// Yup (o schema não tem acesso a `usePermissions()`). `coordinates` (etapa
// Demarcação, GAP-FE-121 reaberto) também é opcional — `nullable`, sem
// `.required()`, escrito via `setValue` por `StepDemarcacao.tsx`.
//
// GAP-FE-120/GAP-FE-124 FECHADOS — `city_uuid`/`country_uuid` (campos internos
// do form, `Option<string>`) validados como PRESENTES (`.required()` em cada
// propriedade do objeto) — o `SelectAsyncPaginate` de ambos já resolve para o
// `uuid` real que o backend exige (`FarmRequest::rules()`, `TASK-BE-421`/
// `TASK-BE-424`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isValidCpfCnpj } from '@/utils/cpfCnpj';

import type { LanguageDate } from '@/@types/language';

export const farmSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.farms.farm.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(80, messages.descriptionMaxLength),
    descriptive: yup
      .string()
      .trim()
      .required(messages.descriptiveRequired)
      .max(80, messages.descriptiveMaxLength),
    nif: yup
      .string()
      .trim()
      .nullable()
      .test('nif-valido', messages.nifInvalid, (value) => {
        if (!value) return true;
        return isValidCpfCnpj(value);
      }),
    phone: yup.string().trim().required(messages.phoneRequired).max(15),
    exploration_type: yup.number().nullable().oneOf([1, 2, 3, 4, 5, 6, null]),
    car: yup.string().trim().nullable().max(50),
    nirf: yup.string().trim().nullable(),
    ccir: yup.string().trim().nullable(),
    cafir: yup.string().trim().nullable().max(8),
    caepf: yup.string().trim().nullable().max(14),
    state_registration: yup.string().trim().nullable().max(40),

    // ---- Endereço (GAP-FE-120/GAP-FE-124 fechados — ver nota de cabeçalho) -
    // Mesmo formato de `city_uuid` abaixo (objeto `Option<string>` do
    // `SelectAsyncPaginate`, validado internamente por `value`/`label`).
    country_uuid: yup
      .object({ value: yup.string().required(), label: yup.string().required() })
      .nullable()
      .default(null),
    // max(10) — máscara do projeto é `99.999-999` (`strings.mask.cep`) = 10
    // caracteres (ex.: "29.152-052"); backend alinhado em paralelo p/
    // `max:10` (coluna legado é varchar sem limite, 10 é fiel à máscara).
    zip_code: yup.string().trim().required(messages.zipCodeRequired).max(10),
    city_uuid: yup
      .object({ value: yup.string().required(), label: yup.string().required() })
      .nullable()
      .default(null),
    district: yup.string().trim().required(messages.districtRequired).max(50),
    number: yup.string().trim().nullable().max(6),
    latitude: yup.string().trim().nullable(),
    longitude: yup.string().trim().nullable(),

    // ---- Demarcação (GAP-FE-121 reaberto, TASK-FE-410) ----------------------
    // GeoJSON serializado do polígono — SEM validação obrigatória: o step é
    // opcional, mesmo racional do `cerne` (avançar sem desenhar nada não
    // bloqueia o wizard).
    coordinates: yup.string().nullable().default(null),

    // ---- Financeiro ---------------------------------------------------------
    coin: yup.string().trim().required(messages.coinRequired).length(1),
    total_area: yup
      .number()
      .typeError(messages.totalAreaRequired)
      .required(messages.totalAreaRequired)
      .min(0),
    value_ha: yup
      .number()
      .typeError(messages.valueHaRequired)
      .required(messages.valueHaRequired)
      .min(0),
    rate: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .min(0),
    is_enabled: yup.boolean().required(),
    use_cash_book: yup.boolean().required(),

    // ---- Configurações --------------------------------------------------------
    cost_processing_date: yup
      .number()
      .typeError(messages.costProcessingDateRequired)
      .required(messages.costProcessingDateRequired)
      .integer()
      .min(1, messages.costProcessingDateRange)
      .max(28, messages.costProcessingDateRange),
    control_supplies_stock: yup.boolean().required(),
    note: yup.string().trim().nullable(),

    // ---- Fora de validação obrigatória (ver nota de cabeçalho) -------------
    centers: yup.array().of(yup.string().required()).default([]),
    tenant_id: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable(),
  });
};

export const farmSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(farmSchema(languageGB)) as any;

export default farmSchemaResolver;
