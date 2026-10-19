// src/validations/schemas/Integracoes/integrationDominio-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário único de Software Domínio
// (IntegrationDominio — Integrações, F-121, TASK-F121-FE-01). Fábrica
// `(languageGB) => yupResolver(...)`, mirror mecânico de `sharing-schema.ts`.
//
// 4 campos, todos `required` (contrato de tela §2.1): `issue`/`contador`
// (Option — selects async), `x_integration_key` (string), `is_enabled`
// (Option<boolean> — severidade: fábrica de options, nunca boolean cru).
// Mensagens SEMPRE via `languageGB.integrationDominios.form.validation.*`
// — nunca literal (severidade i18n).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

export const integrationDominioSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.integrationDominios.form.validation;

  return yup.object({
    issue: yup.mixed<Option<string> | null>().required(messages.issuerRequired),
    contador: yup.mixed<Option<string> | null>().required(messages.accountantRequired),
    x_integration_key: yup.string().required(messages.tokenRequired),
    is_enabled: yup.mixed<Option<boolean> | null>().required(messages.enabledRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const integrationDominioSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(integrationDominioSchema(languageGB));

export default integrationDominioSchemaResolver;
