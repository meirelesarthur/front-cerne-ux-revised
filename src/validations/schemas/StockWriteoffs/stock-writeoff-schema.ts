// src/validations/schemas/StockWriteoffs/stock-writeoff-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de CRIAÇÃO de Baixa de Estoque
// (StockWriteoff, TASK-FE-3004) + do formulário de RELATÓRIO (TASK-FE-3005).
// Fábricas `(languageGB) => resolver`, mirror `serviceOrderSchemaResolver`/
// `appropriationSchemaResolver`. Schema NUNCA em `pages/` (SEVERIDADE
// inviolável). Client-side só impede submit de linha OBVIAMENTE incompleta
// — a autoridade final de negócio é sempre o 422 do backend
// (`StockWriteoffRequest::rules()`).
//
// `items` exige ≥1 linha PREENCHIDA (`stock`+`quantity`+`value`) — como o
// form nasce com 1 linha vazia e o bloco nunca permite remover a última
// (`ItemRow.tsx`/`CreateBaixaEstoque.tsx`), o `.min(1)` no array + os
// `required()` de cada campo da linha já bastam (mirror `productItemSchema`
// de `service-order-schema.ts`) — sem necessidade do gate `onSubmit`
// dedicado que `appropriation-schema.ts` precisou (aquele existia só para a
// regra condicional "≥1 em qualquer uma das 5 coleções", não é o caso aqui).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const stockWriteoffSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const genericMessages = languageGB.defaltStrings.validations;

  // Número obrigatório (>0) — quantidade da linha (mirror
  // `requiredNumberMoreThan0` de `service-order-schema.ts`).
  const requiredNumberMoreThan0 = () =>
    yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .required(genericMessages.requiredField)
      .moreThan(0, genericMessages.invalidValue)
      .typeError(genericMessages.invalidValue);

  // Número obrigatório (>=0) — valor unitário (`gte:0` no backend, CV-004).
  const requiredNumberMin0 = () =>
    yup
      .number()
      .transform((value, original) => (original === '' || original === null ? null : value))
      .required(genericMessages.requiredField)
      .min(0, genericMessages.invalidValue)
      .typeError(genericMessages.invalidValue);

  // Linha do bloco de itens — `stock` é a Option (linha de estoque
  // selecionada, embute `product_uuid`/`lot`/`unit`/`saldo`/`average_cost`,
  // ver `@/@types/v2/StockWriteoffs`). `quantity`/`value` obrigatórios.
  const itemSchema = yup.object({
    stock: fv.option(),
    quantity: requiredNumberMoreThan0(),
    value: requiredNumberMin0(),
  });

  // Linha do bloco de anexos — 100% opcional (`sometimes` no backend); sem
  // `.required()` em nenhum campo — o mapper filtra linhas sem `file` antes
  // do submit (`stock-writeoff-form-mapper.ts`), mirror da folga já usada
  // por `RequestReceiptAttachmentsFieldArray.tsx` (append/remove guiados por
  // UX, não pelo schema).
  const attachmentSchema = yup.object({
    name: yup.string().nullable(),
    file: yup.mixed<File>().nullable(),
  });

  return yup.object({
    date: fv.date(),
    type: fv.option<number>(),
    type_note: yup.string().nullable(),
    warehouse: fv.option(),
    justification: yup
      .string()
      .trim()
      .required(genericMessages.requiredField)
      .max(191, genericMessages.invalidValue),
    // D-FE-BE-04/D3 — UI-only, NUNCA obrigatório (fidelidade AS-IS: o legado
    // exibia o campo, mas o backend nunca validou/persistiu `center`).
    cost_center: yup.mixed().nullable(),
    items: yup.array().of(itemSchema).min(1, genericMessages.requiredField),
    attachments: yup.array().of(attachmentSchema).default([]),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` do form de criação.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const stockWriteoffSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(stockWriteoffSchema(languageGB) as any);

// -----------------------------------------------------------------------------
// Schema do formulário de RELATÓRIO (TASK-FE-3005) — só `warehouse` é
// obrigatório (FM-003); `product`/datas opcionais (FM-004..006).
// -----------------------------------------------------------------------------

export const stockWriteoffReportSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);

  return yup.object({
    warehouse: fv.option(),
    product: yup.mixed().nullable(),
    start_date: yup.string().nullable(),
    end_date: yup.string().nullable(),
  });
};

export const stockWriteoffReportSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(stockWriteoffReportSchema(languageGB) as any);

export default stockWriteoffSchemaResolver;
