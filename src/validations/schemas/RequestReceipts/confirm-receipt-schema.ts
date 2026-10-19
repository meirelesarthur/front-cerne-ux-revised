// src/validations/schemas/RequestReceipts/confirm-receipt-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup da tela "Confirmar Recebimento" (RequestReceipt —
// Administrativo / Suprimentos, esteira 97-Esteiras/040, TASK-RCB-FE-02).
// Fábrica `(languageGB) => yupResolver(...)`, mirror mecânico de
// `request-purchase-schema.ts` (mesma "empresa").
//
// Localização: `src/validations/schemas/RequestReceipts/`, NUNCA em
// `pages/` (regra inviolável §7 do contrato de arquitetura).
//
// Compõe `fieldValidationSchema(languageGB)` para os campos genéricos e usa
// `.test()` no nível do array `attachments` lendo `context.parent.
// purchase_status` (mesmo mecanismo documentado em `request-purchase-
// schema.ts` para `items[]`/`type` — o campo condicionante mora no form
// PAI, sibling do array, não da linha) — anexos obrigatórios quando
// `purchase_status.value===1` (Total, IG-01/CLM-15).
//
// `nfe` espelha `max:9` da API (CLM-14). Itens chaveados por `uuid`, nunca
// índice (CLM-13) — a validação aqui garante `status`/`delivery_date`
// preenchidos por linha; o `uuid` da linha é readonly (não editável pelo
// usuário, vem hidratado do servidor).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { ConfirmReceiptCompletion, ConfirmReceiptForm } from '@/@types/v2/RequestReceipts';
import type Shape from '@/@types/validations/shape';

const confirmReceiptSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const text = languageGB.requestReceipts.requestReceipt.confirm.validation;

  const itemRowSchema = yup.object({
    uuid: yup.string().required(),
    status: v.option<'P' | 'E' | 'C'>(),
    delivery_date: v.date(),
  });

  const attachmentRowSchema = yup.object({
    name: yup
      .string()
      .trim()
      .nullable()
      .when('file', {
        is: (file: unknown) => !!file,
        then: (schema) => schema.required(text.attachmentNameRequiredWithFile),
      }),
    file: yup.mixed<File | null>().nullable(),
  });

  return yup.object().shape<Shape<ConfirmReceiptForm>>({
    code: yup.string().nullable(),
    responsible: yup.string().nullable(),
    receipt_date: v.date().required(text.receiptDateRequired),
    nfe: yup.string().trim().required(text.nfeRequired).max(9, text.nfeMaxLength),
    purchase_status: v.option<ConfirmReceiptCompletion>().required(text.purchaseStatusRequired),
    receipt_note: yup.string().trim().nullable().max(600, text.receiptNoteMaxLength),

    items: yup.array().of(itemRowSchema).default([]),

    attachments: yup
      .array()
      .of(attachmentRowSchema)
      .default([])
      .test(
        'attachments-required-when-total',
        text.attachmentFileRequiredWhenTotal,
        // Arrow function + `context` como 2º parâmetro (evita `no-invalid-
        // this`, mesma técnica de `request-purchase-schema.ts`).
        (
          rows: { name?: string | null; file?: File | null }[] | undefined,
          context: yup.TestContext
        ) => {
          const purchaseStatus = (
            context.parent as { purchase_status?: Option<ConfirmReceiptCompletion> | null }
          )?.purchase_status?.value;
          if (purchaseStatus !== 1) return true;

          const innerErrors: yup.ValidationError[] = [];
          (rows ?? []).forEach((row, index) => {
            if (!row?.file) {
              innerErrors.push(
                new yup.ValidationError(
                  text.attachmentFileRequiredWhenTotal,
                  row?.file,
                  `attachments[${index}].file`
                )
              );
            }
          });

          if (innerErrors.length > 0) throw new yup.ValidationError(innerErrors);
          return true;
        }
      ),
  });
};

export const confirmReceiptSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(confirmReceiptSchema(languageGB));

export default confirmReceiptSchemaResolver;
