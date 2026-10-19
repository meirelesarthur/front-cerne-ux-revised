// src/validations/schemas/Rastreabilidade/traceability-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Produtos" (Traceability —
// Rastreabilidade), espelhando `TraceabilityRequest::rules()` REAL
// (`GB.Cerne.Api`, leitura direta do backend, TASK-TR-FE-01). Vive em
// `src/validations/schemas/Rastreabilidade/` (NUNCA em `src/pages/`, Lei 1).
//
// Mensagens SEMPRE derivadas de `fieldValidationSchema(languageGB)` (`v`) +
// `languageGB.defaltStrings.validations.*` (`messages`) — fonte única do
// projeto para mensagens Yup, por instrução explícita desta Tarefa. NENHUMA
// string literal, NENHUM módulo de i18n novo criado aqui (fora do escopo
// desta fundação — mirror `config-schema.ts`).
//
// Campos EXCLUÍDOS deliberadamente (não fazem parte do payload de escrita,
// ver `TraceabilityForm`/`TraceabilityData` para o round-trip completo):
//   - `tracking_code`/`lot_number` — SEMPRE readonly, gerados no servidor
//     (round-trip `## 8` do contrato de tela). NÃO entram neste schema.
//   - `farm_id`/`hash` — nunca aparecem no form (resolvidos/gerados no
//     servidor, fora do `TraceabilityRequest`).
//
// Fix D09 (RATIFICADO `## 9.3` do contrato de tela): `availability` exige
// `.min(1)` — o legado aceitava `[]` (`JSON.stringify([])` passava no
// `required` de string); o novo Request já fecha isso com `array|min:1` no
// servidor, e este schema espelha a mesma regra no client, SEM replicar o
// bug histórico.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { TraceabilityForm } from '@/@types/v2/Rastreabilidade/traceability';
import type Shape from '@/@types/validations/shape';

export const traceabilitySchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;

  // Mirror `numberOrNull` de `charge-schema.ts` — transforma `''`/`null` em
  // `null` (repouso do input), nunca `NaN`; os 16 campos nutricionais +
  // `box_quantity` são `required|numeric|min:0` no servidor (SEMPRE
  // presentes no payload, nos dois verbos — `TraceabilityRequest` real).
  const numberOrNull = () =>
    yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .nullable()
      .default(null);

  return yup.object().shape<Shape<TraceabilityForm>>({
    // ---- 1. Identificação ----
    product_uuid: v.option(),
    traceability_config_uuid: v.option(),
    harvested_in: v.date(),
    packing: yup.string().trim().required(messages.requiredField).max(20, messages.invalidValue),
    gross_weight: yup.string().trim().max(191, messages.invalidValue).default(''),
    name_pt: yup.string().trim().required(messages.requiredField).max(80, messages.invalidValue),
    name_en: yup.string().trim().max(80, messages.invalidValue).default(''),
    name_es: yup.string().trim().max(80, messages.invalidValue).default(''),

    // ---- 2. Sobre o produto ----
    description_pt: yup.string().trim().required(messages.requiredField),
    description_en: yup.string().trim().default(''),
    description_es: yup.string().trim().default(''),

    // ---- 3. Informação nutricional (16 campos, `required|numeric|min:0`) ----
    energetic_value: numberOrNull().required(messages.requiredField).min(0, messages.invalidValue),
    energetic_value_perc: numberOrNull()
      .required(messages.requiredField)
      .min(0, messages.invalidValue),
    carbohydrates: numberOrNull().required(messages.requiredField).min(0, messages.invalidValue),
    carbohydrates_perc: numberOrNull()
      .required(messages.requiredField)
      .min(0, messages.invalidValue),
    proteins: numberOrNull().required(messages.requiredField).min(0, messages.invalidValue),
    proteins_perc: numberOrNull().required(messages.requiredField).min(0, messages.invalidValue),
    fat_total: numberOrNull().required(messages.requiredField).min(0, messages.invalidValue),
    fat_total_perc: numberOrNull().required(messages.requiredField).min(0, messages.invalidValue),
    fat_saturated: numberOrNull().required(messages.requiredField).min(0, messages.invalidValue),
    fat_saturated_perc: numberOrNull()
      .required(messages.requiredField)
      .min(0, messages.invalidValue),
    fat_trans: numberOrNull().required(messages.requiredField).min(0, messages.invalidValue),
    fat_trans_perc: numberOrNull().required(messages.requiredField).min(0, messages.invalidValue),
    dietary_fiber: numberOrNull().required(messages.requiredField).min(0, messages.invalidValue),
    dietary_fiber_perc: numberOrNull()
      .required(messages.requiredField)
      .min(0, messages.invalidValue),
    sodium: numberOrNull().required(messages.requiredField).min(0, messages.invalidValue),
    sodium_perc: numberOrNull().required(messages.requiredField).min(0, messages.invalidValue),

    // ---- 4. Exportador (opcional, sem i18n no legado — labels PT fixos) ----
    barcode: yup.string().trim().max(191, messages.invalidValue).default(''),
    exporter_name: yup.string().trim().max(191, messages.invalidValue).default(''),
    exporter_address: yup.string().trim().max(191, messages.invalidValue).default(''),
    exporter_zip_code: yup.string().trim().max(191, messages.invalidValue).default(''),
    exporter_city: yup.string().trim().max(191, messages.invalidValue).default(''),
    exporter_state: yup.string().trim().max(191, messages.invalidValue).default(''),
    exporter_country: yup.string().trim().max(191, messages.invalidValue).default(''),

    // ---- 5. Área e disponibilidade ----
    area_uuid: v.option(),
    box_quantity: numberOrNull().required(messages.requiredField).min(0, messages.invalidValue),
    // Fix D09 (`## 9.3`, RATIFICADO) — mínimo 1 mês selecionado; o legado
    // aceitava array vazio (bug), o servidor já corrige (`array|min:1`) e
    // este schema espelha a mesma regra no client.
    availability: yup
      .array()
      .of(yup.number().integer().min(1).max(12))
      .min(1, messages.requiredField)
      .default([]),

    // ---- 6. Mapa (display read-only — `## 9.1`, sem desenho manual) ----
    latlng: yup.string().trim().max(80, messages.invalidValue).default(''),
  });
};

export const traceabilitySchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(traceabilitySchema(languageGB));

export default traceabilitySchemaResolver;
