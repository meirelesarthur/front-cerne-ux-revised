// src/validations/schemas/BaseRegistrations/issueDfeSyncTimes-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Sincronização DFe (IssueDfeSyncTime)
// — fábrica que recebe `languageGB` e devolve o resolver (mesmo padrão de
// diagnosisPregnancy-schema.ts).
//
// `issue_uuid`/`sync_hour` são AMBOS `required` — confirmado em
// `IssueDfeSyncTime-contrato.md` DA-DFE-10 (`IssueDfeSyncTimeRequest::rules()`,
// unificado store/update, ambos os campos obrigatórios nos dois verbos).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const issueDfeSyncTimesSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.issueDfeSyncTime.form.validation;

  return yup.object({
    issue_uuid: yup.mixed().required(messages.issueRequired),
    sync_hour: yup.mixed().required(messages.syncHourRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const issueDfeSyncTimesSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(issueDfeSyncTimesSchema(languageGB));

export default issueDfeSyncTimesSchemaResolver;
