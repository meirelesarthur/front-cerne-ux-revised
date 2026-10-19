// src/pages/CadastrosBase/Atividades/activity-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Atividade (TASK-FE-027) — mirror
// mecânico de CadastrosBase/TiposTitulo/tipo-titulo-schema.ts: FUNÇÃO que
// recebe `languageGB` e devolve o schema (mensagens i18n).
//
// `name` obrigatório/trim/máx 30, `description` opcional/trim/máx 50,
// `vl_hectare` numérico >= 0 obrigatório, `type`/`use` (slugs) obrigatórios —
// `use` OBRIGATÓRIO é a correção D5 do contrato (Activity-contrato.md §8):
// o legado já marcava o campo como `required` na UI (`_forms.blade.php:26`)
// mas nunca validava no backend — agora front e backend concordam.
// `is_enabled` boolean obrigatório. `operations` opcional (array de ids
// numéricos) — sem UI nesta Tarefa (ver CreateOrUpdateAtividade.tsx, pendência
// registrada por ausência de endpoint de `Operation`), mas o schema já aceita
// o shape do contrato para não quebrar quando o campo for reintroduzido.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const activitySchema = (languageGB: LanguageDate) => {
  const messages = languageGB.activities.activity.form.validation;

  return yup.object({
    name: yup.string().trim().required(messages.nameRequired).max(30, messages.nameMaxLength),
    description: yup.string().trim().max(50, messages.descriptionMaxLength).optional(),
    vl_hectare: yup
      .number()
      .typeError(messages.vlHectareRequired)
      .min(0, messages.vlHectareMin)
      .required(messages.vlHectareRequired),
    type: yup.string().required(messages.typeRequired),
    use: yup.string().required(messages.useRequired), // NOVO — D5 do contrato
    is_enabled: yup.boolean().required(messages.isEnabledRequired),
    operations: yup.array().of(yup.number().required()).optional(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const activitySchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(activitySchema(languageGB));

export default activitySchemaResolver;
