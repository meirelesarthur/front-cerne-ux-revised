// src/validations/schemas/BaseRegistrations/marker-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Marcadores" (Marker — Cadastros
// Base), espelhando `MarkerRequest::rules()` (lido diretamente em `api_root`,
// TASK-MK-FE-02): `description` obrigatório/`max:40`, `type` enum obrigatório
// (INTEIRO 1/2), `is_enabled` booleano. Vive em `src/validations/schemas/`
// (NÃO em `pages/`) — mandato explícito da Tarefa, divergência deliberada do
// precedente `family-equipment-schema.ts` (que fica em `pages/`, desvio
// pré-canonização não replicado aqui), mesmo path canônico já usado por
// `client-schema.ts`/`provider-schema.ts`/`proprietary-schema.ts`.
//
// `icon`/`remove_icon` NÃO entram neste schema — geridos fora do RHF (estado
// dedicado no componente, mesmo padrão `image`/`removeImage` de
// FamilyEquipment) porque a obrigatoriedade de `icon` é condicional ao modo
// (obrigatório só no create, DA-MK-17) e não é representável como campo RHF
// simples sem duplicar o estado do arquivo.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { markerType } from '@/constants/Marker/marker-type';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const markerSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.markers.marker.form.validation;

  return yup.object({
    description: v.string().max(40, messages.descriptionMaxLength),
    type: yup
      .number()
      .oneOf([markerType.activity, markerType.infrastructure], messages.typeRequired)
      .required(messages.typeRequired),
    is_enabled: v.boolean(),
  });
};

export const markerSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(markerSchema(languageGB));

export default markerSchemaResolver;
