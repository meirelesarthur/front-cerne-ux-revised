// src/validations/schemas/Financeiro/ofxImport-schema.ts
// -----------------------------------------------------------------------------
// Schema Yup do formulário "Importação OFX" (OfxImport — Financeiro, F-114,
// 97-Esteiras/064, TASK-064-OFX-FE-01), espelhando `OfxImportRequest::rules()`
// (lido diretamente em `api_root`) + Decisão F2 (`code` nunca aparece no
// formulário — não é um campo de escrita, populado só na exibição a partir
// da resposta do GET).
//
// `ofx_file` — obrigatório SOMENTE na criação (`Rule::requiredIf` do backend,
// mirror `OfxImportRequest.php:62`); na edição, ausente preserva o anexo
// atual (SE-02, `UpdateOfxImportAction` não reprocessa parse). `isEditing`
// como 2º parâmetro da fábrica — mirror `user-schema.ts`.
//
// `start_date`/`end_date` — `v.date()` (string ISO 'yyyy-MM-dd', NUNCA
// `yup.date()`, ver `field-validation-schema.ts` para o racional completo do
// bug de `Date.prototype.toString()` em payload multipart).
//
// Localização: `src/validations/schemas/Financeiro/`, NUNCA em `pages/`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { OfxImportForm } from '@/@types/v2/Financeiro/ofxImport';
import type Shape from '@/@types/validations/shape';

export const ofxImportSchema = (languageGB: LanguageDate, isEditing = false) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.ofxImports.ofxImport.form.validation;

  return yup.object().shape<Shape<OfxImportForm>>({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(255, messages.descriptionMaxLength),

    account_uuid: v.option<string>().required(messages.accountRequired),

    start_date: v.date().required(messages.startDateRequired),
    end_date: v.date().required(messages.endDateRequired),

    // Decisão F2/SE-02 — obrigatório só na criação; edição sem arquivo novo
    // preserva o anexo atual. `isEditing` já é conhecido na CONSTRUÇÃO do
    // schema (2º parâmetro da fábrica) — condicional direta, sem `.when()`
    // (não há campo irmão do formulário do qual isso dependa em runtime).
    ofx_file: isEditing
      ? yup.mixed<File>().nullable().default(null)
      : yup.mixed<File>().nullable().required(messages.ofxFileRequired),
  });
};

export const ofxImportSchemaResolver = (languageGB: LanguageDate, isEditing = false) =>
  yupResolver(ofxImportSchema(languageGB, isEditing)) as any;

export default ofxImportSchemaResolver;
