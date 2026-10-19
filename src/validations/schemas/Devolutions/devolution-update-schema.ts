// src/validations/schemas/Devolutions/devolution-update-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de VISUALIZAÇÃO/EDIÇÃO (linha única,
// `FID-11`, Devolução/Entrada — 97-Esteiras/037, Tarefa 09). Schema NOVO,
// sem mirror direto (`Requisition` não edita) — todos os campos fracamente
// validados no client (PATCH parcial via `dirtyFields`, `UpdateDevolutionData`
// já valida `sometimes|numeric|gt:0` no servidor). `stock_id` (campo "Trocar
// Estoque") não entra no schema: é opcional por natureza (nasce vazio) e
// nunca bloqueia o submit.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

/**
 * Schema de edição (linha única) — validação fraca no client, todos os
 * campos preenchidos quando existentes; o backend é a guarda real (`sometimes`).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {yup.ObjectSchema<any>} Schema Yup de edição.
 */
export const devolutionUpdateSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.devolutions.devolution.form.validation;

  return yup.object({
    date: yup.string().trim().notRequired(),
    // CORRECAO-R1/D1 — `SelectAsyncPaginate` de Employee (`label=value=name`),
    // mirror `cost_center_id` (mesmo shape de Option).
    requester: yup.object({ value: yup.mixed(), label: yup.string() }).nullable().notRequired(),
    cost_center_id: yup
      .object({ value: yup.mixed(), label: yup.string() })
      .nullable()
      .notRequired(),
    quantity: yup
      .number()
      .typeError(messages.numberType)
      .transform((value, original) => (original === '' ? undefined : value))
      .moreThan(0, messages.quantityMin)
      .notRequired(),
    amount: yup
      .number()
      .typeError(messages.numberType)
      .transform((value, original) => (original === '' ? undefined : value))
      .min(0, messages.quantityMin)
      .notRequired(),
    stock_id: yup.object({ value: yup.mixed(), label: yup.string() }).nullable().notRequired(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` — modo edição (linha única).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de edição do módulo.
 */
export const devolutionUpdateSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(devolutionUpdateSchema(languageGB)) as any;
