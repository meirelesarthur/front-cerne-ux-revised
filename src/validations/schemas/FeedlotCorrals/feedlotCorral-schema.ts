// src/validations/schemas/FeedlotCorrals/feedlotCorral-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do diálogo de Curral (FeedlotCorral) —
// TASK-FE-042-206. Mirror 1:1 `FeedlotCorralRequest::rules()`: `name`
// (required, max:120), `installation_type`/`coverage`/`floor`/`shading`
// (enum, required), `width`/`length` (numeric, min:0, required),
// `capacity` (integer, min:0, required), `trough_uuid`/`drinking_fountain_uuid`
// (required). `status` é validado SÓ no create (schema único — o formulário
// só renderiza o campo em modo create/duplicar; em editar o valor fica
// `null` e não é enviado no payload, então a regra abaixo não bloqueia).
//
// `available_at`/`note` — ADITIVO (TASK-063-CUR-01, roteiro F-035 Currais,
// execução 063). Mirror EXATO do `.when('status', ...)` já usado em
// `feedlotCorralStatus-schema.ts`/`feedlotCorralWizard-schema.ts`, reusando a
// MESMA constante `FEEDLOT_CORRAL_STATUS_DETAIL_REQUIRED` (proibido criar uma
// cópia divergente do conjunto `['VS','LI','MA','FE']` ou incluir `EN`).
// Corrige o 500/422 ao criar via diálogo do Mapa com status restrito sem os
// 2 campos — a API já exige (`required_if`), o diálogo nunca coletava.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { FEEDLOT_CORRAL_DIMENSION_MAX } from '@/constants/FeedlotCorrals/feedlot-corral-dimension-max';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { FeedlotCorralForm } from '@/@types/v2/FeedlotCorrals';

import { FEEDLOT_CORRAL_STATUS_DETAIL_REQUIRED } from './feedlotCorralStatus-schema';

// Mirror `requiresDetail` (`feedlotCorralStatus-schema.ts`) — mesma
// constante, sem duplicar o conjunto de status. Não importado de
// `feedlotCorralWizard-schema.ts` para evitar dependência circular (o
// wizard compõe ESTE schema via `.shape()`).
function requiresDetail(status: Option<string> | null | undefined): boolean {
  return (
    !!status && (FEEDLOT_CORRAL_STATUS_DETAIL_REQUIRED as readonly string[]).includes(status.value)
  );
}

export const feedlotCorralSchema = (languageGB: LanguageDate, requireStatus: boolean) => {
  const msgs = languageGB.feedlotMap.feedlotMap.corral.validation;
  const statusMsgs = languageGB.feedlotMap.feedlotMap.status.validation;

  return yup.object<Record<keyof FeedlotCorralForm, yup.AnySchema>>({
    name: yup.string().trim().required(msgs.nameRequired).max(120, msgs.nameMaxLength),
    installation_type: yup.object().nullable().required(msgs.installationTypeRequired),
    status: requireStatus
      ? yup.object().nullable().required(msgs.statusRequired)
      : yup.object().nullable(),
    available_at: yup
      .string()
      .nullable()
      .when('status', {
        is: (status: Option<string> | null) => requiresDetail(status),
        then: (schema) => schema.required(statusMsgs.availableAtRequired),
      }),
    note: yup
      .string()
      .nullable()
      .max(1500, statusMsgs.noteMaxLength)
      .when('status', {
        is: (status: Option<string> | null) => requiresDetail(status),
        then: (schema) => schema.required(statusMsgs.noteRequired),
      }),
    width: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? undefined : Number(original)
      )
      .typeError(msgs.widthRequired)
      .required(msgs.widthRequired)
      .min(0, msgs.widthMin)
      .max(FEEDLOT_CORRAL_DIMENSION_MAX, msgs.widthMax),
    length: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? undefined : Number(original)
      )
      .typeError(msgs.lengthRequired)
      .required(msgs.lengthRequired)
      .min(0, msgs.lengthMin)
      .max(FEEDLOT_CORRAL_DIMENSION_MAX, msgs.lengthMax),
    capacity: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? undefined : Number(original)
      )
      .typeError(msgs.capacityRequired)
      .required(msgs.capacityRequired)
      .min(0, msgs.capacityMin)
      .integer(msgs.capacityMin),
    coverage: yup.object().nullable().required(msgs.coverageRequired),
    floor: yup.object().nullable().required(msgs.floorRequired),
    shading: yup.object().nullable().required(msgs.shadingRequired),
    trough_uuid: yup.object().nullable().required(msgs.troughRequired),
    drinking_fountain_uuid: yup.object().nullable().required(msgs.drinkingFountainRequired),
  });
};

export const feedlotCorralSchemaResolver = (languageGB: LanguageDate, requireStatus: boolean) =>
  yupResolver(feedlotCorralSchema(languageGB, requireStatus) as any);

export default feedlotCorralSchemaResolver;
