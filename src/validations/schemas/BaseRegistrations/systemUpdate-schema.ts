// src/validations/schemas/BaseRegistrations/systemUpdate-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Atualização do Sistema — execução
// 031, TASK-FE-1100. Fábrica `(languageGB) => resolver`, mesma convenção de
// `warehouse-schema.ts`/`parameterWeights-schema.ts`.
//
// `release_date`: `v.date()` (string ISO 'yyyy-MM-dd', NÃO `yup.date()` —
// mesma armadilha documentada em `field-validation-schema.ts`, TASK-FE-917).
//
// `description`: HTML rico produzido pelo `RichTextEditor` (Tiptap, §7.1) —
// um editor "vazio" produz `<p></p>` (ou `<p><br></p>`), string NÃO vazia
// mas SEM conteúdo textual real. `.required()` puro aceitaria esse HTML
// vazio como válido (achado antecipado pelo contrato de tela §6.5) — a
// validação real usa `.test()` decapando tags para checar se sobrou texto.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

// Decapa tags HTML e espaços em branco — mesma regra de negócio 5 da Doc
// Bruta do legado (usada também na truncagem da coluna Descrição da
// Listagem, TASK-FE-1101) para checar se o editor tem conteúdo REAL.
function hasTextContent(html: string | null | undefined): boolean {
  if (!html) return false;
  const stripped = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return stripped.length > 0;
}

export const systemUpdateSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.baseRegistrations.systemUpdate.form.validation;

  return yup.object({
    release_date: v.date(),
    description: yup
      .string()
      .required(messages.descriptionRequired)
      .test('has-text-content', messages.descriptionRequired, hasTextContent),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const systemUpdateSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(systemUpdateSchema(languageGB));

export default systemUpdateSchemaResolver;
