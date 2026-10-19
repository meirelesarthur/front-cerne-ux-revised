// src/pages/CadastrosBase/Contador/contador-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Contador (TASK-CT-03b) — espelha as
// `rules()` de `ContadorRequest.php` (mesmas em store E update, sem `sometimes`):
// razao_social/nome_fantasia (max:80), cnpj (max:18), ie (max:20), rua (max:80),
// numero (max:10), bairro (max:50), fone (max:20), cep (max:10), email
// (max:80, formato), cidade_uuid (required), issue_uuids (required, min:1).
//
// `cidade_uuid` guarda o `Option<string>` INTEIRO no RHF (não uma string crua)
// — validado como objeto obrigatório (`.nullable().required()`), mesmo
// racional de campos `Option` obrigatórios do projeto. `issue_uuids` é
// `string[]` — validação client-side ESPELHA o `required|min:1` do backend
// (Regra de Negócio nº 5 — Contador nunca existe sem Emissor Fiscal), exibida
// como mensagem de campo, não só a validação do backend.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import cleanMask from '@/utils/clean-mask';
import { docTypeOfDigits } from '@/utils/masks/document';
import { isValidCpfCnpj } from '@/utils/validateCpfCnpj';

import type { LanguageDate } from '@/@types/language';

export const contadorSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.contadores.contador.form.validation;

  return yup.object({
    razao_social: yup
      .string()
      .trim()
      .required(messages.razaoSocialRequired)
      .max(80, messages.razaoSocialMaxLength),
    nome_fantasia: yup
      .string()
      .trim()
      .required(messages.nomeFantasiaRequired)
      .max(80, messages.nomeFantasiaMaxLength),
    // `cnpj` aceita CPF OU CNPJ (TASK-CT-FIX-02) — o `.required()` cobre
    // ausência; o `.test()` ADICIONAL valida o dígito verificador (checksum
    // mod-11) sem substituir a obrigatoriedade. Mensagem dinâmica reaproveita
    // `invalidDocument.cpf`/`.cnpj` já existentes (Achado 3 da Tarefa) — zero
    // mensagem nova criada.
    cnpj: yup
      .string()
      .required(messages.cnpjRequired)
      .test(
        'cpf-cnpj-valido',
        languageGB.defaltStrings.validations.invalidDocument.cnpj,
        (value, ctx) => {
          if (!value) return true; // ausência já é responsabilidade do `.required()`
          if (isValidCpfCnpj(value)) return true;

          const digits = cleanMask(value);
          const message =
            digits.length === 11
              ? languageGB.defaltStrings.validations.invalidDocument.cpf
              : languageGB.defaltStrings.validations.invalidDocument.cnpj;

          return ctx.createError({ message });
        }
      ),
    // UT-000767: IE obrigatória, dispensada SÓ quando o documento tem
    // exatamente 11 dígitos (CPF). Documento incompleto/CNPJ mantém a exigência.
    ie: yup
      .string()
      .trim()
      .max(20, messages.ieMaxLength)
      .when('cnpj', {
        is: (value?: string) => docTypeOfDigits(value ?? '') === 'cpf',
        then: (schema) => schema,
        otherwise: (schema) => schema.required(messages.ieRequired),
      }),
    rua: yup.string().trim().required(messages.ruaRequired).max(80),
    numero: yup.string().trim().required(messages.numeroRequired).max(10),
    bairro: yup.string().trim().required(messages.bairroRequired).max(50),
    cep: yup.string().required(messages.cepRequired),
    fone: yup.string().required(messages.foneRequired),
    email: yup
      .string()
      .trim()
      .required(messages.emailRequired)
      .email(messages.emailInvalid)
      .max(80),
    // Guarda o `Option<string>` inteiro — obrigatório (`.nullable()` permite
    // o valor inicial `null`, `.required()` ainda rejeita `null`/`undefined`).
    cidade_uuid: yup.object().nullable().required(messages.cidadeRequired),
    issue_uuids: yup
      .array()
      .of(yup.string().required())
      .min(1, messages.issuesRequired)
      .required(messages.issuesRequired),
    auto_send: yup.boolean().required(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const contadorSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(contadorSchema(languageGB));

export default contadorSchemaResolver;
