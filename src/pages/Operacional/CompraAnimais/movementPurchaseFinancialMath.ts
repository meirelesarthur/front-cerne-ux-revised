// src/pages/Operacional/CompraAnimais/movementPurchaseFinancialMath.ts
// -----------------------------------------------------------------------------
// 088 D3-FE-T1 — módulo PURO (sem React) de cálculo do financeiro da Compra de
// Animais. Todo dinheiro é calculado em CENTAVOS INTEIROS; `number` em reais só
// existe nas bordas (`toCents`/`fromCents`). Fonte: PLANO-088-D3-D4-FRONT §4.1
// (gerador), §4.2 (rateio valor ↔ %), §4.3 (recálculo D3-b) e contrato legado
// §4.1/§4.2/§6 (vetores V1-V6).
//
// Decisões do dono aplicadas (vinculantes):
//  - resíduo de centavos na ÚLTIMA parcela (D3-a);
//  - parcela 0,00 é BLOQUEADA (P-5) — `INSTALLMENT_ZERO`;
//  - total 0 nunca gera NaN/∞ (DEF-D3-06) — `percentOf` devolve 0;
//  - entrada só existe com `hasInput=true` (pacote 1);
//  - % do rateio é derivado do valor (P-1).
//
// Datas: `@internationalized/date` (`CalendarDate#add`) — nunca `Date#toISOString`
// (DEF-D3-05: desloca o dia em fusos atrás de UTC).
// -----------------------------------------------------------------------------

import { parseDate } from '@internationalized/date';

import type { MovementPurchaseInstallmentOrigin } from '@/@types/v2/MovementPurchases';

// ---------------------------------------------------------------------------
// Conversões
// ---------------------------------------------------------------------------

// Reais → centavos inteiros. Não finito → 0. Corrige ruído binário (1.005 → 101).
export function toCents(value: number | null | undefined): number {
  if (value === null || value === undefined || !Number.isFinite(value)) return 0;
  return Math.round(Number.parseFloat((value * 100).toPrecision(15)));
}

// Centavos inteiros → reais (2 casas).
export function fromCents(cents: number): number {
  return Number.isFinite(cents) ? cents / 100 : 0;
}

function round2(value: number): number {
  return Math.round(Number.parseFloat((value * 100).toPrecision(15))) / 100;
}

// % de `valueCents` sobre `totalCents`, 2 casas. Total <= 0 → 0 (nunca NaN/∞,

// DEF-D3-06).
export function percentOf(valueCents: number, totalCents: number): number {
  if (!Number.isFinite(valueCents) || !Number.isFinite(totalCents) || totalCents <= 0) return 0;
  return round2((valueCents / totalCents) * 100);
}

// Soma de centavos.
export function sumCents(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

// ---------------------------------------------------------------------------
// Datas
// ---------------------------------------------------------------------------

// `yyyy-MM-dd` válido (calendário real, ex.: 2025-02-30 é inválido).
export function isValidIsoDate(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  try {
    return parseDate(value).toString() === value;
  } catch {
    return false;
  }
}

// `yyyy-MM-dd` + N dias corridos, sem depender do fuso do navegador.
export function addDaysIso(dateIso: string, days: number): string {
  return parseDate(dateIso).add({ days }).toString();
}

// ---------------------------------------------------------------------------
// §4.1 — Gerador de parcelas (D3-a, P-5)
// ---------------------------------------------------------------------------

export interface InstallmentCentsRow {
  due_date: string;
  amountCents: number;
  origin: MovementPurchaseInstallmentOrigin;
}

export interface GeneratorInput {
  due_date: string;
  amountCents: number;
}

export interface GeneratorParams {
  count: number | null | undefined;
  firstDueDate: string | null | undefined;
  intervalDays: number | null | undefined;
}

export type GenerateInstallmentsError =
  'TOTAL_ZERO' | 'INPUT_GE_TOTAL' | 'INSTALLMENT_ZERO' | 'INCOMPLETE';

export interface GenerateInstallmentsResult {
  rows: InstallmentCentsRow[];
  error?: GenerateInstallmentsError;
  // 1-based da 1ª parcela com valor 0 (mensagem `installmentPositive`).
  position?: number;
}

export interface GenerateInstallmentsArgs extends GeneratorParams {
  totalCents: number;
  hasInput: boolean;
  input: GeneratorInput | null;
}

// Gera as parcelas. `INCOMPLETE` = "nada acontece" (a tabela anterior

// permanece — paridade com o legado). Resíduo na última parcela.
export function generateInstallments(args: GenerateInstallmentsArgs): GenerateInstallmentsResult {
  const { totalCents, hasInput, input, count, firstDueDate, intervalDays } = args;

  if (
    typeof count !== 'number' ||
    !Number.isInteger(count) ||
    count < 1 ||
    !isValidIsoDate(firstDueDate) ||
    typeof intervalDays !== 'number' ||
    !Number.isInteger(intervalDays) ||
    intervalDays < 0
  ) {
    return { rows: [], error: 'INCOMPLETE' };
  }

  if (!Number.isFinite(totalCents) || totalCents <= 0) return { rows: [], error: 'TOTAL_ZERO' };

  const entryOk = hasInput && !!input && isValidIsoDate(input.due_date) && input.amountCents > 0;
  const entryCents = entryOk ? input.amountCents : 0;
  if (entryCents >= totalCents) return { rows: [], error: 'INPUT_GE_TOTAL' };

  const base = totalCents - entryCents;
  const share = Math.floor(base / count);
  const last = base - share * (count - 1);

  if (share === 0) {
    return { rows: [], error: 'INSTALLMENT_ZERO', position: (entryOk ? 1 : 0) + 1 };
  }

  const rows: InstallmentCentsRow[] = [];
  if (entryOk && input) {
    rows.push({ due_date: input.due_date, amountCents: entryCents, origin: 'input' });
  }
  for (let i = 0; i < count; i += 1) {
    rows.push({
      due_date: addDaysIso(firstDueDate, i * intervalDays),
      amountCents: i < count - 1 ? share : last,
      origin: 'generated',
    });
  }
  return { rows };
}

// ---------------------------------------------------------------------------
// §4.2 — Rateio valor ↔ % (IG-03/IG-04, `distributeValues`)
// ---------------------------------------------------------------------------

export interface AllocationMathRow {
  valueCents: number;
  // % com 2 casas (ex.: 33.33).
  percent: number;
}

export type AllocationWarning = 'FILL_TOTAL_FIRST' | 'ALLOCATION_EXCEEDS';

export interface AllocationBlurResult<T extends AllocationMathRow> {
  rows: T[];
  warning?: AllocationWarning;
}

// Porte fiel de `distributeValues` (MAIN:1491-1530) em centavos.
export function distributeByPercents(totalCents: number, percents: number[]): number[] {
  const count = percents.length;
  if (count === 0) return [];
  if (!Number.isFinite(totalCents) || totalCents <= 0) return percents.map(() => 0);

  const raw = percents.map((p) => Number.parseFloat(((p * totalCents) / 100).toFixed(6)));
  const rounded = raw.map((value) => Math.round(value));
  let diff = totalCents - sumCents(rounded);
  if (diff === 0) return rounded;

  // diff > 0: ascendente por (raw - arred); diff < 0: descendente; empate = menor índice.
  const order = raw
    .map((value, index) => ({ index, decimal: value - rounded[index] }))
    .sort(
      (a, b) => (diff > 0 ? a.decimal - b.decimal : b.decimal - a.decimal) || a.index - b.index
    );

  const step = diff > 0 ? 1 : -1;
  let guard = 0;
  while (diff !== 0 && guard < 10_000) {
    const target = order[guard % count].index;
    rounded[target] += step;
    diff -= step;
    guard += 1;
  }
  return rounded;
}

function cloneRows<T extends AllocationMathRow>(rows: T[]): T[] {
  return rows.map((row) => ({ ...row }));
}

// Blur do VALOR da linha `idx` (IG-03): recalcula o % da linha; excede → zera a linha.
export function applyValueBlur<T extends AllocationMathRow>(
  rows: T[],
  idx: number,
  totalCents: number
): AllocationBlurResult<T> {
  const next = cloneRows(rows);
  const row = next[idx];
  if (!row) return { rows: next };
  if (!Number.isFinite(totalCents) || totalCents <= 0) {
    return { rows: next, warning: 'FILL_TOTAL_FIRST' };
  }

  row.percent = percentOf(row.valueCents, totalCents);

  if (sumCents(next.map((r) => r.valueCents)) > totalCents) {
    row.valueCents = 0;
    row.percent = 0;
    return { rows: next, warning: 'ALLOCATION_EXCEEDS' };
  }
  return { rows: next };
}

// Blur do % da linha `idx` (IG-04): valor = round(% × total / 100). Σ% > 100 →

// zera a linha; Σ% == 100 exato → redistribui TODOS os valores (maiores restos).
export function applyPercentBlur<T extends AllocationMathRow>(
  rows: T[],
  idx: number,
  totalCents: number
): AllocationBlurResult<T> {
  const next = cloneRows(rows);
  const row = next[idx];
  if (!row) return { rows: next };
  if (!Number.isFinite(totalCents) || totalCents <= 0) {
    return { rows: next, warning: 'FILL_TOTAL_FIRST' };
  }

  row.valueCents = Math.round(Number.parseFloat(((row.percent * totalCents) / 100).toFixed(6)));

  // Σ % em centésimos inteiros (evita 33,33 + 33,33 + 33,34 ≠ 100 por ruído binário).
  const percentHundredths = sumCents(next.map((r) => Math.round(r.percent * 100)));
  if (percentHundredths > 10000) {
    row.valueCents = 0;
    row.percent = 0;
    return { rows: next, warning: 'ALLOCATION_EXCEEDS' };
  }

  if (percentHundredths === 10000) {
    const distributed = distributeByPercents(
      totalCents,
      next.map((r) => r.percent)
    );
    next.forEach((r, i) => {
      r.valueCents = distributed[i];
    });
  }
  return { rows: next };
}

// ---------------------------------------------------------------------------
// §4.3 — Recálculo por mudança de total (D3-b)
// ---------------------------------------------------------------------------

export interface FinancialBaseline<T extends AllocationMathRow = AllocationMathRow> {
  totalCents: number;
  // Inclui a linha da entrada (`origin='input'`) quando existe.
  installments: InstallmentCentsRow[];
  allocations: T[];
  // `true` só se as parcelas vieram do gerador e nenhuma foi editada à mão.
  generatedUntouched: boolean;
  generatorParams: GeneratorParams | null;
}

export type RecalculateInstallmentsError =
  'TOTAL_ZERO' | 'INPUT_GE_TOTAL' | 'INSTALLMENT_ZERO' | 'NO_BASE';

export interface RecalculateResult<T extends AllocationMathRow> {
  installments: InstallmentCentsRow[];
  allocations: T[];
  installmentsChanged: boolean;
  allocationsChanged: boolean;
  installmentsError?: RecalculateInstallmentsError;
  // Linha de rateio ficaria <= 0: mantém a baseline e o usuário ajusta.
  allocationsError?: 'ALLOCATION_NONPOSITIVE';
  // 1-based da parcela com valor <= 0 (mensagem `installmentPositive`).
  position?: number;
}

function sameInstallments(a: InstallmentCentsRow[], b: InstallmentCentsRow[]): boolean {
  return (
    a.length === b.length &&
    a.every((row, i) => row.due_date === b[i].due_date && row.amountCents === b[i].amountCents)
  );
}

function recalculateInstallments(
  baseline: FinancialBaseline<AllocationMathRow>,
  newTotalCents: number,
  input: GeneratorInput | null
): {
  rows: InstallmentCentsRow[];
  error?: RecalculateInstallmentsError;
  position?: number;
} {
  const keep = baseline.installments.map((row) => ({ ...row }));

  if (newTotalCents <= 0) return { rows: keep, error: 'TOTAL_ZERO' };

  const entryCents = input && input.amountCents > 0 ? input.amountCents : 0;
  if (entryCents > 0 && entryCents >= newTotalCents) {
    return { rows: keep, error: 'INPUT_GE_TOTAL' };
  }

  const params = baseline.generatorParams;
  const viaGenerator = (): ReturnType<typeof recalculateInstallments> => {
    const generated = generateInstallments({
      totalCents: newTotalCents,
      hasInput: entryCents > 0,
      input,
      count: params?.count,
      firstDueDate: params?.firstDueDate,
      intervalDays: params?.intervalDays,
    });
    if (generated.error === 'INCOMPLETE') return { rows: keep, error: 'NO_BASE' };
    if (generated.error) {
      return { rows: keep, error: generated.error, position: generated.position };
    }
    return { rows: generated.rows };
  };

  if (baseline.generatedUntouched && params) {
    const generated = viaGenerator();
    if (generated.error !== 'NO_BASE') return generated;
  }

  // Reescala proporcional preservando datas e a entrada (XML, gravadas, editadas à mão).
  const body = baseline.installments.filter((row) => row.origin !== 'input');
  const sum = sumCents(body.map((row) => row.amountCents));
  const target = newTotalCents - entryCents;

  if (body.length === 0) return params ? viaGenerator() : { rows: keep, error: 'NO_BASE' };
  if (
    sum === target &&
    entryCents ===
      sumCents(
        baseline.installments.filter((row) => row.origin === 'input').map((row) => row.amountCents)
      )
  ) {
    return { rows: keep };
  }
  if (sum <= 0) return params ? viaGenerator() : { rows: keep, error: 'NO_BASE' };

  const scaled = body.map((row, i) =>
    i < body.length - 1 ? Math.round((row.amountCents * target) / sum) : 0
  );
  scaled[body.length - 1] = target - sumCents(scaled.slice(0, -1));

  const zeroAt = scaled.findIndex((value) => value <= 0);
  if (zeroAt >= 0) {
    const position = zeroAt + 1 + (entryCents > 0 ? 1 : 0);
    return { rows: keep, error: 'INSTALLMENT_ZERO', position };
  }

  const rows: InstallmentCentsRow[] = [];
  if (input && entryCents > 0) {
    rows.push({ due_date: input.due_date, amountCents: entryCents, origin: 'input' });
  }
  body.forEach((row, i) => rows.push({ ...row, amountCents: scaled[i] }));
  return { rows };
}

function recalculateAllocations<T extends AllocationMathRow>(
  baseline: FinancialBaseline<T>,
  newTotalCents: number
): { rows: T[]; error?: 'ALLOCATION_NONPOSITIVE' } {
  const keep = cloneRows(baseline.allocations);
  if (keep.length === 0 || newTotalCents <= 0) return { rows: keep };

  const baselineSum = sumCents(keep.map((r) => r.valueCents));
  if (baselineSum <= 0 || baseline.totalCents <= 0) return { rows: keep };

  const closed = baselineSum === baseline.totalCents;
  const divisor = closed ? baselineSum : baseline.totalCents;

  const values = keep.map((row) => Math.round((row.valueCents * newTotalCents) / divisor));
  if (closed) {
    values[values.length - 1] = newTotalCents - sumCents(values.slice(0, -1));
  }

  if (values.some((value) => value <= 0)) {
    return { rows: keep, error: 'ALLOCATION_NONPOSITIVE' };
  }

  return {
    rows: keep.map((row, i) => ({
      ...row,
      valueCents: values[i],
      percent: percentOf(values[i], newTotalCents),
    })),
  };
}

// Recalcula parcelas e rateio para o novo total A PARTIR DA BASELINE (nunca a

// partir do resultado anterior — sem deriva de centavos, rajada = 1 mudança).

// `input` = entrada atual do formulário (`null` sem entrada).
export function recalculateForTotal<T extends AllocationMathRow>(
  baseline: FinancialBaseline<T>,
  newTotalCents: number,
  input: GeneratorInput | null
): RecalculateResult<T> {
  const keepInstallments = baseline.installments.map((row) => ({ ...row }));
  const keepAllocations = cloneRows(baseline.allocations);

  if (!Number.isFinite(newTotalCents) || newTotalCents <= 0) {
    return {
      installments: keepInstallments,
      allocations: keepAllocations,
      installmentsChanged: false,
      allocationsChanged: false,
      installmentsError: 'TOTAL_ZERO',
    };
  }

  const installments = recalculateInstallments(baseline, newTotalCents, input);
  const allocations = recalculateAllocations(baseline, newTotalCents);

  return {
    installments: installments.rows,
    allocations: allocations.rows,
    installmentsChanged:
      !installments.error && !sameInstallments(installments.rows, baseline.installments),
    allocationsChanged:
      !allocations.error &&
      allocations.rows.some((row, i) => row.valueCents !== baseline.allocations[i].valueCents),
    installmentsError: installments.error,
    allocationsError: allocations.error,
    position: installments.position,
  };
}
