// src/validations/schemas/Marcacao/marking-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Marcação (Marking — Operacional >
// Agricultura > Manejo, TASK-MC-FE-01/04). Mirror estrutural de
// `validations/schemas/Weaning/weaning-schema.ts` (FUNÇÃO que recebe
// `languageGB`, usa `fieldValidationSchema(languageGB)`, mensagens sempre
// derivadas de `languageGB.defaltStrings.validations`).
//
// `week_vintage_uuid` NÃO tem validação própria aqui — é preenchido pela
// cascata (`useCascadesMarking`) e seu valor obrigatório é garantido pelo
// bloqueio de submit quando a cascata falha/está pendente (mirror
// `erro_cor_safra`, `get_spa_ux_fidelity_pattern §3`: nunca falha silenciosa).
//
// `employee_uuid`/`center_uuid` NÃO fazem parte deste schema — FIX de
// fidelidade (achado do dono): o form legado (`_forms.blade.php`) não tem
// esses inputs; foram removidos do `MarkingForm` (ver `@/@types/v2/
// Marcacao/marking`).
//
// `user_uuid` (Responsável) TAMBÉM não faz parte deste schema — FIX #2
// (decisão do dono): é READONLY = usuário logado/responsável já gravado,
// nunca uma escolha validável do form (ver nota em `MarkingForm`).
//
// FIX de homologação (achado do dono) — `quantity` usava `yup.number()`
// CRU (`.required(messages.requiredField).min(1, messages.invalidValue)`),
// sem `.typeError()`: ao esvaziar o campo, `''` → `NaN` disparava o
// typeError PADRÃO do Yup em inglês ("quantity must be a `number` type...")
// em vez da mensagem traduzida. `v.number()` (helper de
// `field-validation-schema.ts`, já usado em `Funcoes/function-schema.ts`/
// `BirthAnimals/birth-animal-schema.ts`/`RequestQuotations/request-
// quotation-public-schema.ts`) resolve isso: `.transform()` converte
// `''`/`null` em `undefined` ANTES da checagem de tipo (cai no
// `.required(messages.requiredField)` traduzido, nunca no typeError) +
// `.typeError(messages.invalidValue)` traduzido para qualquer outro valor
// não-numérico. Mirror `function-schema.ts` (`v.number().min(0, ...)`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const markingSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;

  return yup.object({
    area_uuid: v.option(),
    date: v.date(),
    variety_uuid: v.option(),
    quantity: v.number().min(1, messages.invalidValue),
    harvest_uuid: v.option(),
    color: v.option(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const markingSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(markingSchema(languageGB) as any);

export default markingSchemaResolver;
