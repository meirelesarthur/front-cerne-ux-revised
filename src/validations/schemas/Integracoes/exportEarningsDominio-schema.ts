// src/validations/schemas/Integracoes/exportEarningsDominio-schema.ts
// Schema Yup da tela "Exportação Folha Salarial → Domínio" (F-117,
// Integrações, irmã do canário F-119). 2 campos obrigatórios `year`/`month`
// (`Option<number>` via `fieldValidationSchema(...).option()`, espelha
// `digits:4`/`between:1,12` do server). Mensagens específicas por campo
// derivadas da tradução (`form.validation.*`) — nunca string literal
// (severidade INVIOLÁVEL).

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const exportEarningsDominioSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const vMsg = languageGB.integrations.exportEarningsDominio.form.validation;

  return yupResolver(
    yup.object({
      year: v.option<number>().required(vMsg.yearRequired),
      month: v.option<number>().required(vMsg.monthRequired),
    })
  );
};
