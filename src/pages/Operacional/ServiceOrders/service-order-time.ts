// src/pages/Operacional/ServiceOrders/service-order-time.ts
// -----------------------------------------------------------------------------
// Normalização de horário da OS para `HH:MM` (execução 086, FE-02): o
// `GET /service-orders/{uuid}` devolve `allowed_working_period_start/end` como
// `HH:MM:SS` ('06:00:00'), mas o schema do form exige `^\d{2}:\d{2}$` e o PUT
// só aceita `date_format:H:i` (06:00:00 → 422). Sem normalizar, salvar sem
// mudanças falhava em toda OS com janela de trabalho.
// Outros campos conferidos contra o GET real: `dt_emission`/`execution_date`/
// `deadline` já vêm `yyyy-MM-dd` e as temperaturas como inteiro — sem ajuste.
// -----------------------------------------------------------------------------

const TIME_PATTERN = /^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/;

/**
 * @param {string | null | undefined} value - `HH:MM`, `HH:MM:SS` ou vazio.
 * @return {string | null} `HH:MM`, ou `null` quando vazio/inválido (nunca inventa horário).
 */
export function normalizeTimeToHm(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const match = TIME_PATTERN.exec(value.trim());
  if (!match) return null;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}
