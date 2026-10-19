// src/validations/schemas/Bonuses/bonus-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de REGISTRO DE EVENTOS (Bonus) —
// esteira 037 (registro-eventos-front-roteiro.md, TASK-FE-02). Mirror de
// `Advances/advance-schema.ts` SEM as invariantes de soma/parcelas/financeiro
// — só o núcleo: `employee_uuid`/`event_uuid` (uuid), `date` (string ISO),
// `amount`.
//
// Local canônico (mirror `Advances`): `src/validations/schemas/Bonuses/` —
// NÃO no folder da página.
//
// `date` é STRING 'YYYY-MM-DD' via `.matches()` — NUNCA `yup.date()` (mesma
// regra do núcleo de `Advance`/`ciclo-producao-schema.ts`).
//
// `employee_uuid`/`event_uuid` validados como STRING (uuid) — os selects
// (`SelectAsyncPaginate`) já fazem o unwrap de `.value` no `onChange` antes
// de chamar `field.onChange`.
//
// `amount`: contrato real usa `min:0`, mas `0` não é um bônus útil — mirror
// `Advance`, usa `.moreThan(0, ...)` como default sugerido pelo roteiro
// (decisão de produto, não de contrato — Cenário "Teste do dev" pede
// confirmação com o dono se `amount = 0` deve ser aceito).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const bonusSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.bonuses.bonus.form.validation;

  return yup.object({
    employee_uuid: yup
      .string()
      .required(messages.employeeRequired)
      .matches(UUID_REGEX, { message: messages.employeeRequired, excludeEmptyString: true }),
    event_uuid: yup
      .string()
      .required(messages.eventRequired)
      .matches(UUID_REGEX, { message: messages.eventRequired, excludeEmptyString: true }),
    date: yup
      .string()
      .required(messages.dateRequired)
      .matches(ISO_DATE_REGEX, { message: messages.dateRequired, excludeEmptyString: true }),
    amount: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.amountRequired)
      .required(messages.amountRequired)
      .moreThan(0, messages.amountRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const bonusSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(bonusSchema(languageGB)) as any;

export default bonusSchemaResolver;
