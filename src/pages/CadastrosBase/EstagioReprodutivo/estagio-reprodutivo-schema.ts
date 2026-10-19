// src/pages/CadastrosBase/EstagioReprodutivo/estagio-reprodutivo-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Estágio Reprodutivo (TASK-CATYMT-02)
// — mirror mecânico de CadastrosBase/Especies/especie-schema.ts: FUNÇÃO que
// recebe `languageGB` e devolve o schema (mensagens i18n).
//
// `specie_uuid` ENTRA no schema (diferente de `cost_center_uuid` em Espécies,
// que é opcional e fica fora do schema) — é `required` no backend
// (`CategoryMatrixRequest::rules()`), então o form valida no client via yup,
// não só confia no 422 do backend. Guarda um objeto `Option` (não uma folha
// simples) — validado com `yup.object({...}).nullable().required(...)`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const estagioReprodutivoSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.categoryMatrix.categoryMatrix.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    is_enabled: yup.boolean().required(),
    specie_uuid: yup
      .object({ label: yup.string().required(), value: yup.string().required() })
      .nullable()
      .required(messages.specieRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const estagioReprodutivoSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(estagioReprodutivoSchema(languageGB) as any);

export default estagioReprodutivoSchemaResolver;
