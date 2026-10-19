// src/validations/schemas/FeedlotMap/mapDeath-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do diálogo Lançar Morte (Mapa) — TASK-FE-042-216.
// `animal_id`/`cause_id`/`date` required; `note` opcional, max 500 (mirror
// `DeathAnimalPayload`/`[[09-front-sanitario-morte]]` §2). `batch_uuid` NÃO
// é campo do form — resolvido do animal selecionado no componente.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

export interface MapDeathFormValues {
  animal_id: Option<string> | null;
  cause_id: Option<string> | null;
  date: string | null;
  note: string;
}

export const mapDeathSchema = (languageGB: LanguageDate) => {
  const msgs = languageGB.feedlotMap.feedlotMap.death.validation;

  return yup.object({
    animal_id: yup.object().nullable().required(msgs.animalRequired),
    cause_id: yup.object().nullable().required(msgs.causeRequired),
    date: yup.string().nullable().required(msgs.dateRequired),
    note: yup.string().max(500, msgs.noteMaxLength),
  });
};

export const mapDeathSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(mapDeathSchema(languageGB) as any);

export default mapDeathSchemaResolver;
