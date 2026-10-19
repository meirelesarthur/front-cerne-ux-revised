// src/validations/schemas/BaseRegistrations/ibpt-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Import de Tabela IBPT — execução
// 032, TASK-FE-2410. Fábrica `(languageGB) => resolver`, mesma convenção de
// `systemUpdate-schema.ts`/`warehouse-schema.ts`.
//
// `uf`: `v.option()` (o valor é um `Option<string>`, não uma string crua —
// mirror padrão de Select obrigatório já usado no projeto).
// `versao`: `required` + `trim` + `max(30)` — mensagens dedicadas
// (`languageGB.baseRegistrations.ibpt.import.validation.*`).
//
// SEM regra para `file` — validado fora do RHF (checagem manual no submit +
// validação client-side já embutida no próprio `FileUpload`, contrato de
// tela §4).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const ibptSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.ibpt.import.validation;

  return yup.object({
    // Valor é um `Option<string>`, não uma string crua — mirror padrão de
    // Select obrigatório já usado no projeto. Mensagem dedicada (`ufRequired`)
    // em vez do genérico `v.option()` para refletir o texto do contrato.
    uf: yup
      .object({
        label: yup.string().required(),
        value: yup.string().required(),
      })
      .nullable()
      .required(messages.ufRequired),
    versao: yup.string().trim().required(messages.versaoRequired).max(30, messages.versaoMaxLength),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const ibptSchemaResolver = (languageGB: LanguageDate) => yupResolver(ibptSchema(languageGB));

export default ibptSchemaResolver;
