// src/validations/schemas/Configuracoes/config-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Configuração (settings singleton
// de plataforma) — execução 032, TASK-FE-2600. Fábrica `(languageGB) =>
// resolver`, mesma convenção de `help-schema.ts`/`ibpt-schema.ts`.
//
// Mensagens SEMPRE derivadas de `fieldValidationSchema(languageGB)`
// (`fv`) + `languageGB.defaltStrings.validations.*` (`messages`) — fonte
// única do projeto para mensagens Yup (contrato de tela §6.6, mirror
// `help-schema.ts`). NUNCA string literal.
//
// Os 13 campos "sempre obrigatórios" do contrato (`ConfigRequest::rules()`,
// backend real já materializado nesta execução) — `afiliado_padrao_uuid`/
// `plano_padrao_uuid` são as 2 EXCEÇÕES `nullable` (FK opcionais, contrato
// §3 linhas 9/10). Os 2 segredos Mercado Pago são opcionais (`sometimes` no
// backend, write-only — §4.2): `max(100)`, sem `.required()`.
//
// `resp_cnpj` reaproveita `isValidCpfCnpj` de `@/utils/validateCpfCnpj.ts`
// (TASK-CT-FIX-02, checksum mod-11) — mirror explícito de `App\Rules\CpfCnpj`
// do backend (`ConfigRequest.php:41`), por instrução do contrato de tela
// §6.6. NÃO usar `@/utils/cpfCnpj.ts` (util irmão mais antigo, usado por
// outros módulos, mas não o indicado por este contrato).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { isValidCpfCnpj } from '@/utils/validateCpfCnpj';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

// Option<string> | null — FK opcional (Afiliado/Plano padrão), SEM
// `.required()` (mirror `optionSchema` de `client-schema.ts`).
const nullableOptionSchema = yup
  .object({ label: yup.string(), value: yup.string() })
  .nullable()
  .default(null);

export const configSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;

  return yup.object({
    dias_teste: fv.number().integer(messages.invalidValue).min(0, messages.invalidValue),
    dias_alerta_pagamento: fv.number().integer(messages.invalidValue).min(0, messages.invalidValue),
    dias_assinar_contrato: fv.number().integer(messages.invalidValue).min(0, messages.invalidValue),
    // Option<boolean> — Select Sim/Não (contrato §7.5), obrigatório.
    contrato_certificado: fv.option<boolean>(),
    minutos_online: fv.number().integer(messages.invalidValue).min(0, messages.invalidValue),
    dias_alerta_vencimento_certificado: fv
      .number()
      .integer(messages.invalidValue)
      .min(0, messages.invalidValue),
    // Segredos Mercado Pago — write-only, opcionais (§4.2): campo vazio
    // nasce sempre "" no form (nunca populado a partir do GET), omitido do
    // payload se intocado. Sem `.required()`.
    mercadopago_access_token: yup.string().trim().max(100, messages.invalidValue),
    mercadopago_public_key: yup.string().trim().max(100, messages.invalidValue),
    afiliado_padrao_uuid: nullableOptionSchema,
    plano_padrao_uuid: nullableOptionSchema,
    whatsapp_link_suporte: fv.string().max(255, messages.invalidValue).url(messages.invalidValue),
    resp_cnpj: yup
      .string()
      .trim()
      .nullable()
      .max(20, messages.invalidValue)
      .test(
        'valid-cnpj',
        messages.invalidDocument.cnpj,
        (value) => !value || isValidCpfCnpj(value)
      ),
    resp_nome: yup.string().trim().nullable().max(50, messages.invalidValue),
    resp_email: yup
      .string()
      .trim()
      .nullable()
      .email(messages.emailInvalid)
      .max(80, messages.invalidValue),
    resp_fone: yup.string().trim().nullable().max(40, messages.invalidValue),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const configSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(configSchema(languageGB) as any);

export default configSchemaResolver;
