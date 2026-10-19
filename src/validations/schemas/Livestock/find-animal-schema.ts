// src/validations/schemas/Livestock/find-animal-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de transferência de lote da tela
// "Localizar Animal" (FindAnimal — Operacional > Pecuária > Manejo, F-042,
// TASK-FA-FE-02, `BatchTransferForm.tsx` — TASK-FA-FE-05).
//
// Único campo: `batch` (Select sob `<Controller>`, `Option<string>`),
// obrigatório. A mensagem de erro é a mensagem PRÓPRIA do módulo
// (`languageGB.livestock.findAnimal.transfer.validation.batchRequired`,
// contrato de tela §6.4/§7) — NUNCA a mensagem genérica de
// `defaltStrings.validations.requiredField` que `fieldValidationSchema(...).option()`
// devolveria. Por isso o schema NÃO compõe `fieldValidationSchema` para este
// campo (não cabe — a fábrica central não aceita mensagem customizada por
// chamada) e mirra, em vez disso, o `optionSchema` local de
// `TransferAbcBatch/transferAbcBatch-schema.ts` (mesmo módulo `livestock`,
// mesmo formato de campo Select).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { FindAnimalBatchTransferForm } from '@/@types/v2/Livestock/findAnimal';
import type Shape from '@/@types/validations/shape';

/**
 * Schema de validação da transferência de lote — `batch` obrigatório, com a
 * mensagem derivada do dicionário do módulo (re-traduz em tempo real ao
 * trocar o idioma quando memoizado com `[languageGB]` no consumidor).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {yup.ObjectSchema<any>} Schema Yup da transferência de lote.
 */
export const findAnimalSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.livestock.findAnimal.transfer.validation;

  return yup.object().shape<Shape<FindAnimalBatchTransferForm>>({
    batch: yup
      .object({ value: yup.mixed(), label: yup.string() })
      .nullable()
      .default(null)
      .required(messages.batchRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` — exportado nomeado e
 * default (Regra 4 da Tarefa).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de transferência de lote.
 */
export const findAnimalSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(findAnimalSchema(languageGB)) as any;

export default findAnimalSchemaResolver;
