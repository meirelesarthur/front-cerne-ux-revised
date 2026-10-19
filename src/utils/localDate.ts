/**
 * localDate — fonte única de "hoje" no fuso LOCAL do navegador.
 *
 * `new Date().toISOString().slice(0, 10)` devolve o dia em UTC: em UTC-3, depois
 * das 21h locais já é "amanhã". Use estas funções para todo "hoje" de formulário,
 * de `maxDate`/`minDate` e de validação. O formato de valor continua 'yyyy-MM-dd'.
 *
 * NÃO usar para converter um `Date` já existente (parcelas/conversões que vêm
 * de 'yyyy-MM-dd'): nesses casos o uso de UTC é intencional (ver `dateOnlyToYmd`).
 */

import { getLocalTimeZone, today } from '@internationalized/date';

/**
 * Fuso horário IANA do navegador (ex.: 'America/Sao_Paulo').
 * @return {string} Identificador IANA do fuso local.
 */
export function localTimeZone(): string {
  return getLocalTimeZone();
}

/**
 * Dia de hoje no fuso local, no formato 'yyyy-MM-dd'.
 * @return {string} Data ISO (somente dia) de hoje, no fuso local.
 */
export function todayLocalIso(): string {
  return today(getLocalTimeZone()).toString();
}

/**
 * Hoje no fuso local como `Date` à meia-noite local (para `minDate`/`maxDate`).
 * @return {Date} Meia-noite local do dia de hoje.
 */
export function todayLocalDate(): Date {
  const [year, month, day] = todayLocalIso().split('-').map(Number);
  return new Date(year, month - 1, day);
}
