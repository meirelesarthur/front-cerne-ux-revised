// src/validations/field-validation-schema.ts
// -----------------------------------------------------------------------------
// INFRAESTRUTURA REAL de validação (NÃO é camada de exemplo).
//
// Helper reutilizável que centraliza os tipos de campo mais comuns (string,
// email, senha, número, select/Option, data, booleano) já com as mensagens
// traduzidas de `languageGB.defaltStrings.validations.*`. Todo schema de
// entidade do projeto deve compor a partir daqui, em vez de repetir mensagens.
//
// Uso:
//   const v = fieldValidationSchema(languageGB);
//   const schema = yup.object({ name: v.string(), email: v.email() });
// -----------------------------------------------------------------------------

import * as yup from "yup";

import { isValidCpfCnpj, maskDocType } from '@/utils/cpfCnpj';

import { LanguageDate } from "@/@types/language";

const fieldValidationSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.defaltStrings.validations;

  return {
    /** Texto obrigatório, sem espaços em branco puros. */
    string: () =>
      yup
        .string()
        .trim()
        .nullable()
        .required(messages.requiredField)
        .test(
          "is-valid",
          messages.invalidValue,
          (value) => value !== undefined && value !== null && value.trim() !== "",
        ),

    /** E-mail obrigatório e válido. */
    email: () =>
      yup
        .string()
        .trim()
        .email(messages.emailInvalid)
        .required(messages.emailRequired),

    /** Senha com no mínimo 8 caracteres. */
    password: () =>
      yup
        .string()
        .min(8, messages.passwordMin)
        .required(messages.passwordRequired),

    /** Confirmação de senha (deve coincidir com o campo `password`). */
    confirmPassword: () =>
      yup
        .string()
        .nullable()
        .when("password", {
          is: (password: any) => !!password,
          then: (schema) =>
            schema
              .trim()
              .oneOf([yup.ref("password"), null], messages.passwordMismatch)
              .required(messages.requiredField),
          otherwise: (schema) => schema.nullable(),
        }),

    /** Número obrigatório (converte "" em erro de tipo). */
    number: () =>
      yup
        .number()
        .transform((value, original) =>
          original === "" || original === null ? undefined : value,
        )
        .typeError(messages.invalidValue)
        .required(messages.requiredField),

    /**
     * Campo de select (react-select / componente Select do projeto), no formato
     * `Option<T> = { label, value }`. Obrigatório: o objeto precisa existir.
     */
    option: <T = any>() =>
      yup
        .object({
          label: yup.string().required(messages.requiredField),
          value: yup.mixed<T>().required(messages.requiredField),
        })
        .nullable()
        .required(messages.requiredField),

    /**
     * Data obrigatória — string ISO 'yyyy-MM-dd' (formato nativo de
     * `<input type="date">`), NÃO `yup.date()`.
     *
     * `yup.date()` faz o `yupResolver` devolver o valor CASTADO (um objeto
     * `Date`, não a string original) em `handleSubmit`. Isso já quebra o
     * controlled `<input type="date">` (que espera string) e, pior, qualquer
     * service que monte `FormData`: `FormData.append(key, dateObj)` chama
     * `Date.prototype.toString()` (ex.: "Mon Aug 03 2026 00:00:00 GMT-0300
     * ..."), string que o `strtotime` do backend não parseia — 422 em
     * produção (achado real: `entry_date` do Animal, TASK-FE-917). Único
     * schema serializado via `JSON.stringify` escapava por acidente (ISO
     * automático do `Date.toJSON`); o resto (multipart) não tem essa rede.
     * Mesmo racional já catalogado em
     * `pages/CadastrosBase/Safra/safra-schema.ts`.
     */
    date: () =>
      yup
        .string()
        .trim()
        .nullable()
        .required(messages.requiredField)
        .matches(/^\d{4}-\d{2}-\d{2}$/, {
          message: messages.invalidValue,
          excludeEmptyString: true,
        }),

    /**
     * CPF/CNPJ brasileiro obrigatório com dígito verificador (TASK-072-FE-02).
     * Aceita o valor pontuado (`999.999.999-99` / `99.999.999/9999-99`) ou só
     * dígitos — o checksum é delegado a `isValidCpfCnpj` (nunca reimplementado).
     * A mensagem de DV é dinâmica pelo tipo detectado (`invalidDocument.cpf`
     * até 11 dígitos, `invalidDocument.cnpj` acima disso).
     * @return {yup.StringSchema} Schema de string com teste de DV.
     */
    cpfCnpj: () =>
      yup
        .string()
        .trim()
        .required(messages.requiredField)
        .test('is-valid-cpf-cnpj', (value, context) => {
          // Vazio é responsabilidade do `required` (evita erro duplicado).
          if (!value) return true;
          if (isValidCpfCnpj(value)) return true;
          return context.createError({
            message: messages.invalidDocument[maskDocType(value)],
          });
        }),

    /**
     * Data OPCIONAL (filtros) — mesma string ISO `yyyy-MM-dd` de `date()`,
     * mas vazio/`null` é válido (TASK-072-FE-07).
     * @return {yup.StringSchema} Schema de string ISO opcional.
     */
    optionalDate: () =>
      yup
        .string()
        .trim()
        .nullable()
        .default(null)
        .matches(/^\d{4}-\d{2}-\d{2}$/, {
          message: messages.invalidValue,
          excludeEmptyString: true,
        }),

    /**
     * Select OPCIONAL (filtros) no formato `Option<T>` — `null` é válido;
     * quando presente, precisa de `value` (TASK-072-FE-07).
     * @return {yup.ObjectSchema} Schema de Option opcional.
     */
    optionalOption: <T = any>() =>
      yup
        .object({
          label: yup.string(),
          value: yup.mixed<T>().required(messages.invalidValue),
        })
        .nullable()
        .default(null),

    /** Booleano (checkbox / switch). Sem `required` porque `false` é válido. */
    boolean: () => yup.boolean().default(false),
  };
};

export default fieldValidationSchema;
