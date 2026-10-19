// src/validations/schemas/CashBook/cashBook-schema.ts
// Schema de validação Yup do Cadastro (create-only) de CashBook (LCDPR —
// Livro Caixa Digital do Produtor Rural, domínio Fiscal, execução 045,
// TASK-LCDPR-FE-01/03). Espelha as `rules()` de `CashBookRequest.php`
// (`GB.Cerne.Api`) — 8 campos, nenhum a mais/a menos. É feedback client-side
// ANTECIPADO; a validação real e definitiva é sempre o 422 do backend.
//
// `end_date` — 3 regras ad-hoc (`CONTRATO-FRONT-LCDPR.md §4.3`):
// `fieldValidationSchema` (get_pwa_validation_and_utils_pattern) não
// cataloga validador de data nem comparação entre 2 datas — lacuna real do
// padrão-alvo, confirmada por leitura integral da tool. Composição via
// `.test(nome-kebab, mensagem, fn)`, mesma assinatura do padrão confirmado.
//
// `dt_special` — obrigatório client-side apenas quando `special.value > 0`
// (`.when()`, `CONTRATO-FRONT-LCDPR.md §4.2`) — o servidor continua
// aceitando `null` (`present`,`nullable` no `CashBookRequest`, `DV-07`
// preservada); o front replica só a EXIGÊNCIA, nunca bloqueia mais que o
// backend.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { todayLocalIso } from '@/utils/localDate';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { CashBookProprietaryOption, CashBookSpecial } from '@/@types/v2/Fiscal/cashBook';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MIN_YEAR = 2000;

// Valida formato 'yyyy-MM-dd' e existência real do dia (rejeita 2026-02-31).
// Valor vazio/nulo é tratado pelo `.required()`/`.when()`, não aqui.
function isValidIsoDate(value: string | null | undefined): boolean {
  if (!value) return true;
  if (!ISO_DATE_REGEX.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isMinYear(value: string | null | undefined): boolean {
  if (!value || !isValidIsoDate(value)) return true;
  return Number(value.slice(0, 4)) >= MIN_YEAR;
}

export const cashBookSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.cashBooks.cashBook.form.validation;

  return yup.object({
    start_date: yup
      .string()
      .nullable()
      .required(messages.startDateRequired)
      .test('valid-date', messages.dateInvalid, (value) => isValidIsoDate(value))
      .test('min-year', messages.dateMinYear, (value) => isMinYear(value)),

    end_date: yup
      .string()
      .nullable()
      .required(messages.endDateRequired)
      .test('valid-date', messages.dateInvalid, (value) => isValidIsoDate(value))
      // Arrow function (não `function`) + `context` como 2º parâmetro do
      // `.test()` (mesma técnica de `request-purchase-schema.ts`/
      // `parameterWeights-schema.ts`) — evita `no-invalid-this`/`camelcase`
      // do eslint do projeto; `context.parent.start_date` é acesso de
      // propriedade (não destructuring), não dispara `camelcase`.
      .test('not-before-start', messages.endDateNotBeforeStart, (value, context) => {
        const startDate = context.parent.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      })
      .test('not-today-or-future', messages.endDateNotTodayOrFuture, (value) => {
        if (!value) return true;
        const todayIso = todayLocalIso();
        return value < todayIso;
      })
      .test('same-year-as-start', messages.endDateSameYearAsStart, (value, context) => {
        const startDate = context.parent.start_date;
        if (!value || !startDate) return true;
        return value.slice(0, 4) === startDate.slice(0, 4);
      }),

    // Defesa extra (UT-000785, D1): a option sem CPF válido já vem `disabled`
    // no select; este teste cobre qualquer caminho que a injete no form.
    proprietary_id: yup
      .object()
      .nullable()
      .required(messages.proprietaryRequired)
      .test('proprietary-cpf-valid', messages.proprietaryCpfRequired, (value) => {
        const option = value as CashBookProprietaryOption | null | undefined;
        return !option || option.cpf_valid !== false;
      }),

    period: yup.object().nullable().required(messages.periodRequired),

    special: yup.object().nullable().required(messages.specialRequired),

    // Obrigatório client-side só quando `special.value > 0` — servidor
    // aceita `null` sempre (`DV-07`).
    dt_special: yup
      .string()
      .nullable()
      .test('valid-date', messages.dateInvalid, (value) => isValidIsoDate(value))
      .test('min-year', messages.dateMinYear, (value) => isMinYear(value))
      .test('not-after-end', messages.dtSpecialAfterEnd, (value, context) => {
        const endDate = context.parent.end_date;
        if (!value || !endDate || !isValidIsoDate(value) || !isValidIsoDate(endDate)) return true;
        return value <= endDate;
      })
      .when('special', {
        is: (special: Option<CashBookSpecial> | null) => !!special && special.value > 0,
        then: (schema) => schema.required(messages.dtSpecialRequired),
        otherwise: (schema) => schema.nullable(),
      }),

    verification: yup.object().nullable().required(messages.verificationRequired),

    contador_id: yup.object().nullable().required(messages.contadorRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const cashBookSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(cashBookSchema(languageGB));

export default cashBookSchemaResolver;
