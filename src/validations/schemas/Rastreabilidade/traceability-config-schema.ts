// src/validations/schemas/Rastreabilidade/traceability-config-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Configuração" (TraceabilityConfig —
// Rastreabilidade), espelhando `TraceabilityConfigRequest::rules()` REAL
// (`GB.Cerne.Api`, leitura direta do backend, TASK-TR-FE-01). Vive em
// `src/validations/schemas/Rastreabilidade/` (NUNCA em `src/pages/`, Lei 1).
//
// Mensagens SEMPRE derivadas de `fieldValidationSchema(languageGB)` (`v`) +
// `languageGB.defaltStrings.validations.*` (`messages`) — mesma fonte única
// de `traceability-schema.ts`/`config-schema.ts`. NENHUMA string literal.
//
// `farm_id` (FD-44) NÃO entra neste schema — o `TraceabilityConfigRequest`
// real nunca aceita esse campo do cliente (resolvido no servidor via
// `FarmContext`); ver divergência documentada em
// `@types/v2/Rastreabilidade/traceability-config/index.d.ts`.
//
// `cpf_cnpj` — regra custom de CPF/CNPJ reaproveitando `isValidCpfCnpj`
// de `@/utils/cpfCnpj` (mirror `proprietary-schema.ts`/`provider-schema.ts`/
// `tenant-schema.ts`/`user-schema.ts` — util JÁ EXISTENTE, checksum mod-11,
// NÃO reescrito aqui). Mensagem de erro dinâmica por tipo de documento
// (`docTypeOfDigits`), já que o campo aceita CPF OU CNPJ (mirror servidor:
// `App\Rules\CpfCnpj`, parametrizado pelo `country_id` do tenant).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { docTypeOfDigits, isValidCpfCnpj } from '@/utils/cpfCnpj';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { TraceabilityConfigForm } from '@/@types/v2/Rastreabilidade/traceability-config';
import type Shape from '@/@types/validations/shape';

export const traceabilityConfigSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;

  return yup.object().shape<Shape<TraceabilityConfigForm>>({
    proprietary_uuid: v.option(),
    name: yup.string().trim().required(messages.requiredField).max(100, messages.invalidValue),
    cpf_cnpj: yup
      .string()
      .trim()
      .required(messages.requiredField)
      .max(20, messages.invalidValue)
      // Arrow function com `ctx` (NÃO `function(value){ this... }`) — evita
      // `no-invalid-this` do ESLint do projeto (mesma convenção de
      // `writeoff-schema.ts`/`advance-schema.ts`).
      .test('valid-document', messages.invalidDocument.cnpj, (value, ctx) => {
        if (!value) return false;
        if (isValidCpfCnpj(value)) return true;
        const docType = docTypeOfDigits(value) === 'cpf' ? 'cpf' : 'cnpj';
        return ctx.createError({ message: messages.invalidDocument[docType] });
      }),
    address: yup.string().trim().required(messages.requiredField).max(80, messages.invalidValue),
    number: yup.string().trim().required(messages.requiredField).max(30, messages.invalidValue),
    district: yup.string().trim().required(messages.requiredField).max(50, messages.invalidValue),
    city_uuid: v.option(),
    phone: yup.string().trim().required(messages.requiredField).max(20, messages.invalidValue),
    email: v.email().max(80, messages.invalidValue),
    whatsapp_fone: yup
      .string()
      .trim()
      .required(messages.requiredField)
      .max(30, messages.invalidValue),
    whatsapp_texto: yup
      .string()
      .trim()
      .required(messages.requiredField)
      .max(255, messages.invalidValue),
  });
};

export const traceabilityConfigSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(traceabilityConfigSchema(languageGB));

export default traceabilityConfigSchemaResolver;
