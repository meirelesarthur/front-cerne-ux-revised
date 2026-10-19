// src/validations/schemas/RequestQuotations/request-quotation-public-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do Formulário PÚBLICO do fornecedor (hash,
// RequestQuotation — Administrativo/Suprimentos, esteira 97-Esteiras/035,
// TASK-CQ-FE-10). Fábrica `(languageGB, requiresFile) => yupResolver(...)` —
// mesmo mecanismo de fábrica com parâmetro extra já usado em
// `requestQuotationSavingSchemaResolver(languageGB, totalValue)` (este mesmo
// módulo) — aqui para tornar `file` condicionalmente obrigatório
// (`quotation.requires_file`, mirror `Rule::requiredIf` do Form Request real).
//
// Localização: `src/validations/schemas/RequestQuotations/`, NUNCA em
// `pages/` (regra inviolável do módulo).
//
// ⚠️ CAMPOS/REGRAS CONFIRMADOS por leitura direta do código real
// (`RequestQuotationPublicSubmissionRequest::rules()`, `api_root`) — este
// schema é PREVIEW client-side, nunca a autoridade final:
//   reponsible        required|string|max:120
//   expiration_date   required|date|after_or_equal:hoje
//   items.*.unitary_value  required|numeric (legado: obrigatório, sem mínimo;
//                          o total geral > 0 é validado no submit — T-081-FE-03)
//   items.*.brand          required|string
//   items.*.observation    nullable|string|max:60
//   payments.*.payment_method  required, enum (0..4, mirror
//                              `requestQuotationPaymentMethod`)
//   payments.*.installments   required|integer|min:1
//   payments.*.interval       required|integer|min:0
//   payments.*.total           numeric — SOMENTE LEITURA, igual ao total geral
//                               (legado `tt_value`); `amount` = total/parcelas
//   file               requiredIf(requires_file)|file|mimes:pdf|max:20240KB
//
// `items.*.request_item_uuid`/`description`/`quantity` NÃO entram neste
// schema — vêm do `GET` (snapshot somente-leitura, nunca editados pelo
// fornecedor, nunca validados como entrada de formulário).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

// `mimes:pdf|max:20240` (KB) do Form Request real — 20240/1024, NÃO
// arredondado para 20 (arredondar para cima aceitaria no cliente um arquivo
// que o servidor rejeitaria com 422 por estourar o limite real em KB).
const MAX_FILE_SIZE_MB = 20240 / 1024;

export const requestQuotationPublicSchema = (languageGB: LanguageDate, requiresFile: boolean) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.requestQuotations.requestQuotation.publicForm.validation;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return yup.object({
    reponsible: yup
      .string()
      .trim()
      .required(messages.reponsibleRequired)
      .max(120, messages.reponsibleMax),

    // String ISO 'yyyy-MM-dd' (`<input type="date">`/`DateInput`, mirror
    // `field-validation-schema.ts` § `date()`) + guarda "mínimo hoje"
    // (`after_or_equal`, preview client-side — o servidor é a autoridade).
    expiration_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.expirationDateRequired)
      .matches(/^\d{4}-\d{2}-\d{2}$/, {
        message: messages.expirationDateInvalid,
        excludeEmptyString: true,
      })
      .test('expiration-date-min-today', messages.expirationDateMin, (value) => {
        if (!value) return true; // `.required()` acima já cobre ausência
        const parsed = new Date(`${value}T00:00:00`);
        return !Number.isNaN(parsed.getTime()) && parsed.getTime() >= today.getTime();
      }),

    // `Rule::requiredIf(quotationRequiresFile())` (Form Request real) —
    // `requiresFile` é resolvido pelo CHAMADOR a partir de
    // `PublicRequestQuotationData.requires_file` (mesma técnica de
    // `totalValue` em `request-quotation-saving-schema.ts`).
    // Tipo/tamanho (`mimes:pdf|max:20240`) já são barrados ANTES de aceitar o
    // arquivo pelo próprio `FileUpload` (`accept`/`maxSizeMb`, ver
    // `RequestQuotationPublicForm.tsx`) — este `.test()` cobre só a
    // obrigatoriedade condicional (`requiresFile`), que o componente não
    // decide sozinho.
    file: yup
      .mixed<File>()
      .nullable()
      .test('file-required-when-requires-file', messages.fileRequired, (value) =>
        requiresFile ? value instanceof File : true
      ),

    items: yup.array(
      yup.object({
        request_item_uuid: yup.string().required(),
        description: yup.string().nullable(),
        quantity: yup.number().required(),
        // Legado: obrigatório (HTML), sem mínimo; o que se exige é total geral > 0
        // ("O valor deve ser maior que zero", validado no submit do formulário).
        unitary_value: v.number().required(messages.unitaryValueRequired),
        brand: yup.string().trim().required(messages.brandRequired),
        observation: yup.string().trim().nullable().max(60, messages.observationMax),
        amount: yup.number().nullable(),
      })
    ),

    payments: yup
      .array(
        yup.object({
          payment_method: v.option<number>().required(messages.paymentMethodRequired),
          installments: v
            .number()
            .required(messages.installmentsRequired)
            .min(1, messages.installmentsMin),
          interval: v.number().required(messages.intervalRequired).min(0, messages.intervalMin),
          // `total` e `amount` são DERIVADOS (total geral e total/parcelas) e somente leitura.
          total: yup.number().nullable(),
          amount: yup.number().nullable(),
        })
      )
      .min(1, messages.paymentsMinOne),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @param {boolean} requiresFile - `quotation.requires_file` (GET público) — torna `file` condicionalmente obrigatório.
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const requestQuotationPublicSchemaResolver = (
  languageGB: LanguageDate,
  requiresFile: boolean
) => yupResolver(requestQuotationPublicSchema(languageGB, requiresFile));

export default requestQuotationPublicSchemaResolver;

/** Limite de tamanho client-side (mirror `mimes:pdf|max:20240` do Form
 *  Request real, 20240KB ≈ 20MB) — consumido pelo `FileUpload` desta tela
 *  (`maxSizeMb`), não pelo Yup acima (o componente já valida tipo/tamanho
 *  ANTES de aceitar o arquivo, mirror `RequestAttachmentRow`/`FileUpload`
 *  padrão do projeto — duplicar como `.test()` de tamanho no Yup exigiria
 *  reimplementar `errorSizeMessage`, o próprio componente já cobre isso). */
export const REQUEST_QUOTATION_PUBLIC_FILE_MAX_SIZE_MB = MAX_FILE_SIZE_MB;
