// src/pages/Operacional/Reproducao/EstacaoDeMonta/breedingSeasonChart.ts
// -----------------------------------------------------------------------------
// Funções PURAS de cálculo client-side de Estação de Monta (mirror exato do
// legado `CV1`/`CV2`/`CV4`) — nascem na fundação (Tarefa 12) e são
// IMPORTADAS também pela Tarefa 13 (formulário de criação/edição), evitando
// duplicar a fórmula entre `EstacaoDeMontaDetalhe.tsx` (Tarefa 12, valores
// vindos do servidor) e `CreateOrUpdateEstacaoDeMonta.tsx` (Tarefa 13, prévia
// client-side) — `GAP-ESTACAOMONTA-FE-03` (gráfico presente nas 3 telas).
//
// `computeDaysAndWeeks` — mirror `CV1`/`CV2`: diferença em dias entre
// `start_date`/`end_date`, +1 dia no fim (inclusivo); semanas =
// `Math.floor(dias / 7)`. Usado SÓ como prévia client-side no formulário —
// o Detalhe usa `days`/`weeks` vindos do servidor (`GAP-EM-05` do backend,
// fonte única lá).
//
// `computeMonthlyDaysBars` — mirror `CV4`: itera mês a mês entre
// `start_date`/`end_date`, retornando os dias do intervalo que caem em cada
// mês (para o gráfico "Dias por mês", `BarChart`). Datas em formato ISO
// `YYYY-MM-DD` (`DateInput`); inválidas ou `start > end` retornam `[]` (o
// gráfico exibe o estado vazio).
// -----------------------------------------------------------------------------

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface MonthlyDaysBar {
  /** Chave estável 'YYYY-MM' do mês (ordenação/city). */
  monthKey: string;
  /** Ano do mês (para formatação de rótulo). */
  year: number;
  /** Mês 1-12 (para formatação de rótulo). */
  month: number;
  /** Dias do intervalo [start_date, end_date] que caem neste mês. */
  days: number;
}

// Parse tolerante de 'YYYY-MM-DD' → `Date` local (meia-noite), ou `null` se
// a string não bater no formato/for uma data inválida.
function parseIsoDate(value?: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  // Guarda contra "31/02" etc. — `Date` normaliza silenciosamente, aqui
  // rejeitamos qualquer overflow de calendário.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

// Mirror `CV1`/`CV2` do legado — dias (inclusivo, +1 no fim) e semanas
// (`Math.floor(dias / 7)`) entre `startDate`/`endDate` (ISO 'YYYY-MM-DD').
// Retorna `null` quando as datas são ausentes/inválidas/invertidas — o
// formulário trata como "sem prévia" (não é erro de validação em si).
export function computeDaysAndWeeks(
  startDate?: string | null,
  endDate?: string | null
): { days: number; weeks: number } | null {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (!start || !end || start > end) return null;

  const days = Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
  const weeks = Math.floor(days / 7);
  return { days, weeks };
}

// Mirror `CV4` do legado — itera mês a mês entre `startDate`/`endDate`
// (ISO 'YYYY-MM-DD'), retornando os dias do intervalo que caem em cada mês.
// Datas ausentes/inválidas/invertidas retornam `[]` (gráfico exibe vazio).
export function computeMonthlyDaysBars(
  startDate?: string | null,
  endDate?: string | null
): MonthlyDaysBar[] {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (!start || !end || start > end) return [];

  const bars: MonthlyDaysBar[] = [];
  let cursorYear = start.getFullYear();
  let cursorMonth = start.getMonth(); // 0-based

  const endYear = end.getFullYear();
  const endMonth = end.getMonth();

  // Guarda de segurança — nunca itera mais de 10 anos (120 meses) mesmo se
  // datas absurdas chegarem aqui (a validação bloqueante do formulário,
  // GAP-ESTACAOMONTA-FE-06, já impede start > end, mas não impõe teto de
  // duração).
  let iterations = 0;
  const MAX_ITERATIONS = 120;

  while (
    (cursorYear < endYear || (cursorYear === endYear && cursorMonth <= endMonth)) &&
    iterations < MAX_ITERATIONS
  ) {
    const monthFirstDay = new Date(cursorYear, cursorMonth, 1);
    const monthLastDay = new Date(cursorYear, cursorMonth + 1, 0);

    const rangeStart = monthFirstDay > start ? monthFirstDay : start;
    const rangeEnd = monthLastDay < end ? monthLastDay : end;

    const days = Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / MS_PER_DAY) + 1;

    bars.push({
      monthKey: `${cursorYear}-${String(cursorMonth + 1).padStart(2, '0')}`,
      year: cursorYear,
      month: cursorMonth + 1,
      days: Math.max(days, 0),
    });

    cursorMonth += 1;
    if (cursorMonth > 11) {
      cursorMonth = 0;
      cursorYear += 1;
    }
    iterations += 1;
  }

  return bars;
}
