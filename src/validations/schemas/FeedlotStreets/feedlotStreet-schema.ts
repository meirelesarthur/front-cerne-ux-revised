// src/validations/schemas/FeedlotStreets/feedlotStreet-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do diálogo de Rua (FeedlotStreet) — TASK-FE-042-207.
// Mirror 1:1 `FeedlotStreetRequest::rules()`: `description` (string,
// required, max:100), `orientation` (`H`/`V`, required). `feedlot_sector_uuid`
// é resolvido pelo contexto de abertura do diálogo (setor pai clicado no
// board) — fora deste schema, nunca um campo do formulário.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { FeedlotStreetForm } from '@/@types/v2/FeedlotStreets';

export const feedlotStreetSchema = (languageGB: LanguageDate) => {
  const msgs = languageGB.feedlotMap.feedlotMap.street.validation;

  return yup.object<Record<keyof FeedlotStreetForm, yup.AnySchema>>({
    description: yup
      .string()
      .trim()
      .required(msgs.descriptionRequired)
      .max(100, msgs.descriptionMaxLength),
    orientation: yup.object().nullable().required(msgs.orientationRequired),
  });
};

export const feedlotStreetSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(feedlotStreetSchema(languageGB) as any);

export default feedlotStreetSchemaResolver;
