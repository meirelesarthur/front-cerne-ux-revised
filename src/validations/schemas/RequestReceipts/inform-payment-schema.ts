// src/validations/schemas/RequestReceipts/inform-payment-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup da tela "Finalizar Pedido" / Informar Pagamento
// (RequestReceipt — Administrativo / Suprimentos, esteira 97-Esteiras/040,
// TASK-RCB-FE-04). Fábrica `(languageGB) => yupResolver(...)`, mirror
// mecânico dos demais schemas de `RequestReceipts/`.
//
// Localização: `src/validations/schemas/RequestReceipts/`, NUNCA em
// `pages/` (regra inviolável §7 do contrato de arquitetura).
//
// `final_date`/`nfe` obrigatórios no client ESPELHANDO a correção do server
// (CLM-35 — a API corrigiu o bug de "sem validação server"; o front deixa de
// depender só do server e passa a validar também no client).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { FinalizeReceiptForm } from '@/@types/v2/RequestReceipts';
import type Shape from '@/@types/validations/shape';

const informPaymentSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const text = languageGB.requestReceipts.requestReceipt.informPayment.validation;

  return yup.object().shape<Shape<FinalizeReceiptForm>>({
    code: yup.string().nullable(),
    final_date: v.date().required(text.finalDateRequired),
    status: v.option<number>(),
    nfe: yup.string().trim().required(text.nfeRequired).max(9, text.nfeMaxLength),
    finalization_note: yup.string().trim().nullable(),
  });
};

export const informPaymentSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(informPaymentSchema(languageGB));

export default informPaymentSchemaResolver;
