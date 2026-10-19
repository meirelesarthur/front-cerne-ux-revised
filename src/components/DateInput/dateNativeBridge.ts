/**
 * dateNativeBridge — ponte única entre o formato ISO 'yyyy-MM-dd' (contrato
 * público de `DateInput`) e o `CalendarDate` (`@internationalized/date`)
 * exigido pelo motor nativo `DatePicker` do Chakra UI 3.37.0 (Ark UI
 * `@zag-js/date-picker`).
 *
 * CONTRATO-FE-DATE-NATIVO-CHAKRA (esteira 006, seção 3.2) — `parseDate` e
 * `CalendarDate.toString()` são funções da própria lib `@internationalized/
 * date` (dependência transitiva já instalada via `@ark-ui/react`), então
 * NENHUM parsing manual (`split('-')`, regex) é necessário em nenhum dos
 * dois sentidos. "Hoje" (dia local) vem SEMPRE de `@/utils/localDate` — o
 * `DatePicker` recebe `timeZone` local (default do zag é UTC). Nenhum outro
 * arquivo deve reimplementar esta conversão —
 * todos os componentes do motor nativo (`DateInput`, e futuramente
 * `InputDate`/`MonthInput` nas Tarefas 02/03) importam daqui.
 */

import { CalendarDate, parseDate } from '@internationalized/date';

/**
 * string 'yyyy-MM-dd' → CalendarDate (para `value`/`min`/`max` nativos).
 * @param {string | null | undefined} iso - Data no formato ISO 'yyyy-MM-dd'.
 * @return {CalendarDate | null} Equivalente, ou `null` se vazio/inválido.
 */
export function isoToCalendarDate(iso: string | null | undefined): CalendarDate | null {
  if (!iso) return null;
  try {
    // `.slice(0, 10)` tolera datetime completo (`toISOString()`) além do
    // `yyyy-MM-dd` puro — hardening defensivo (QA2 Currais F-035, item 1);
    // o fix canônico é a API devolver `date` puro (`format('Y-m-d')`), esta
    // linha é rede de segurança para os ~252 demais callsites do `DateInput`.
    return parseDate(iso.slice(0, 10));
  } catch {
    // ISO malformado — mesmo raciocínio de `isValid()` do date-fns usado
    // anteriormente pelo motor `react-datepicker`.
    return null;
  }
}

/**
 * CalendarDate → string 'yyyy-MM-dd' (para o `onChange` externo).
 * @param {CalendarDate | null | undefined} value - `CalendarDate` selecionado.
 * @return {string | null} Data ISO 'yyyy-MM-dd', ou `null` se vazio.
 */
export function calendarDateToIso(value: CalendarDate | null | undefined): string | null {
  // `CalendarDate.toString()` já retorna 'YYYY-MM-DD' — sem `format()` manual.
  return value ? value.toString() : null;
}

/**
 * Date (usado hoje em `minDate`/`maxDate`) → CalendarDate — sem depender do
 * fuso horário do runtime (`CalendarDate` não carrega timezone, ao
 * contrário de `Date`).
 * @param {Date | null | undefined} date - Objeto `Date` de origem.
 * @return {CalendarDate | null} Equivalente (ano/mês/dia locais), ou `null`.
 */
export function dateToCalendarDate(date: Date | null | undefined): CalendarDate | null {
  if (!date) return null;
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}
