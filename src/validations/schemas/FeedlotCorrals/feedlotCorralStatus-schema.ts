// src/validations/schemas/FeedlotCorrals/feedlotCorralStatus-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do diálogo de Status do Curral — TASK-FE-042-208.
// Mirror 1:1 `UpdateFeedlotCorralStatusRequest::rules()`: `available_at`/
// `note` são `required_if` só quando o status DESTINO é um dos "vazio com
// detalhe" (`VS`/`LI`/`MA`/`FE`) — os demais (`VA`/`OC`) não exigem nada.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

// Mirror `$conditionalStatuses` (`UpdateFeedlotCorralStatusRequest`).
export const FEEDLOT_CORRAL_STATUS_DETAIL_REQUIRED = ['VS', 'LI', 'MA', 'FE'] as const;

function requiresDetail(status: Option<string> | null | undefined): boolean {
  return (
    !!status && (FEEDLOT_CORRAL_STATUS_DETAIL_REQUIRED as readonly string[]).includes(status.value)
  );
}

export interface FeedlotCorralStatusFormValues {
  status: Option<string> | null;
  available_at: string | null;
  note: string;
}

export const feedlotCorralStatusSchema = (languageGB: LanguageDate) => {
  const msgs = languageGB.feedlotMap.feedlotMap.status.validation;

  return yup.object<Record<keyof FeedlotCorralStatusFormValues, yup.AnySchema>>({
    status: yup.object().nullable().required(msgs.statusRequired),
    available_at: yup
      .string()
      .nullable()
      .when('status', {
        is: (status: Option<string> | null) => requiresDetail(status),
        then: (schema) => schema.required(msgs.availableAtRequired),
      }),
    note: yup
      .string()
      .nullable()
      .max(1500, msgs.noteMaxLength)
      .when('status', {
        is: (status: Option<string> | null) => requiresDetail(status),
        then: (schema) => schema.required(msgs.noteRequired),
      }),
  });
};

export const feedlotCorralStatusSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(feedlotCorralStatusSchema(languageGB) as any);

export default feedlotCorralStatusSchemaResolver;
