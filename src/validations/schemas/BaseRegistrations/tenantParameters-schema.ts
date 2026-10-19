// src/validations/schemas/BaseRegistrations/tenantParameters-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Parametrizações (TASK-FE-071) —
// mirror mecânico de GruposProduto/product-group-schema.ts: FUNÇÃO que recebe
// `languageGB` e devolve o schema (mensagens i18n).
//
// `calc_icms_desonerado` guarda a string 'true'/'false' do Select Sim/Não
// (mesmo padrão de ProductGroupFormType.is_enabled).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const tenantParametersSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.tenantParameters.form.validation;

  return yup.object({
    calc_icms_desonerado: yup
      .string()
      .oneOf(['true', 'false'])
      .required(messages.calcIcmsDesoneradoRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const tenantParametersSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(tenantParametersSchema(languageGB));

export default tenantParametersSchemaResolver;
