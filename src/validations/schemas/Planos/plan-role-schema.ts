// src/validations/schemas/Planos/plan-role-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Planos (PlanRole) — TASK-FE-2702.
// Vive em `src/validations/schemas/` (NUNCA em `pages/`) — fábrica que recebe
// `languageGB` e devolve o schema, mirror `Configuracoes/app-schema.ts`
// (`fieldValidationSchema`/`fv`, fonte única de
// `languageGB.defaltStrings.validations.*` para os campos obrigatórios
// simples). Mensagens de faixa/limite (`min`) usam o bloco próprio do módulo
// (`languageGB.planos.planRole.form.validation`), mesmo racional de
// `centro-custo-schema.ts` (schema de módulo com regras de faixa próprias).
//
// GAP-FE-233 RESOLVIDO — `role_uuid` (Atribuição Principal) passa a ser
// validado como campo `Option` obrigatório (`fv.option()`, mesmo helper de
// `city_uuid`/`parent_uuid`), mirror do `SelectAsyncPaginate` que o alimenta.
// `role_uuids`/`segment_uuids` continuam SEM validação obrigatória — ambos
// `sometimes`/array no `PlanRoleRequest` real (mirror `CheckboxListField`/
// `CategoryTreeSelector`, que não exigem seleção mínima).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const planRoleSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const messages = languageGB.planos.planRole.form.validation;
  const genericMessages = languageGB.defaltStrings.validations;

  // Campo numérico OPCIONAL (`farm_limit`/`concurrent_user_limit`,
  // `nullable`/`min:1` no `PlanRoleRequest`) — `fv.number()` não serve aqui
  // porque força `.required()`; string vazia/`null`/`undefined` virem
  // `null` (preserva "não informado", nunca `0`).
  const optionalLimit = () =>
    yup
      .number()
      .transform((value, original) =>
        original === '' || original === null || original === undefined ? null : value
      )
      .nullable()
      .min(1, messages.limitMin)
      .typeError(genericMessages.invalidValue);

  return yup.object({
    name: fv.string().max(50, messages.nameMaxLength),
    price: fv.number().min(0, messages.priceMin),
    interval_days: fv.number().integer(messages.intervalDaysMin).min(1, messages.intervalDaysMin),
    farm_limit: optionalLimit(),
    concurrent_user_limit: optionalLimit(),
    is_free: fv.boolean(),
    animals_limit: fv.number().integer(messages.animalsLimitMin).min(0, messages.animalsLimitMin),
    agriculture_area_limit: fv.number().min(0, messages.areaLimitMin),
    fruitgrowing_area_limit: fv.number().min(0, messages.areaLimitMin),
    role_uuid: fv.option<string>(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const planRoleSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(planRoleSchema(languageGB) as any);

export default planRoleSchemaResolver;
