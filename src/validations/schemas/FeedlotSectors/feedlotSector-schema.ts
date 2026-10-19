// src/validations/schemas/FeedlotSectors/feedlotSector-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Setor (FeedlotSector) —
// TASK-FS-FE-02. Mirror 1:1 das regras reais do backend
// (`FeedlotSectorRequest::rules()`): `name` (string, required, max:120),
// `feedlot_yard_uuid` (required no POST — o mesmo schema serve os dois
// modos, mirror `feedlotYard-schema.ts`, que também não bifurca por modo;
// em edição o campo fica desabilitado mas sempre chega preenchido pelo
// `fillForm`), `width`/`length` (numeric, required, min:0), `is_active`
// (boolean, required), `observation` (string, nullable, max:600).
// `code`/`area`/`priority` são SÓ-LEITURA — fora deste schema.
//
// Mensagens via `languageGB.feedlotSectors.feedlotSector.form.validation.*`
// (bloco PRÓPRIO do módulo) — mesma convenção de `feedlotYard-schema.ts`.
// Mecanismo REAL confirmado por leitura de `feedlotYard-schema.ts`:
// `yup.object<Record<keyof T, yup.AnySchema>>()` direto + `yupResolver` —
// NÃO existe `fieldValidationSchema()` neste repositório (armadilha
// MARCO 118 evitada).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { FeedlotSectorForm } from '@/@types/v2/FeedlotSectors';

export const feedlotSectorSchema = (languageGB: LanguageDate) => {
  const msgs = languageGB.feedlotSectors.feedlotSector.form.validation;

  return yup.object<Record<keyof FeedlotSectorForm, yup.AnySchema>>({
    name: yup.string().trim().required(msgs.nameRequired).max(120, msgs.nameMaxLength),
    feedlot_yard_uuid: yup.object().nullable().required(msgs.feedlotYardRequired),
    width: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? undefined : Number(original)
      )
      .typeError(msgs.widthRequired)
      .required(msgs.widthRequired)
      .min(0, msgs.widthMin),
    length: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? undefined : Number(original)
      )
      .typeError(msgs.lengthRequired)
      .required(msgs.lengthRequired)
      .min(0, msgs.lengthMin),
    is_active: yup.object().nullable().required(msgs.isActiveRequired),
    observation: yup.string().nullable().max(600, msgs.observationMaxLength),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const feedlotSectorSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(feedlotSectorSchema(languageGB) as any);

export default feedlotSectorSchemaResolver;
