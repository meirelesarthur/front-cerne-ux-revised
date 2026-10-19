// src/pages/Administrativo/Recebimentos/installments.ts
// -----------------------------------------------------------------------------
// Cálculo de parcelas e totais de "Gerar Financeiro" (execução 081, T-081-FE-10).
// Funções PURAS, fiéis ao JS do legado (`expense_form.blade.php:530-590`,
// `calcInstallments`), vetores CV-01 e CV-02 do contrato LEGADO-SUPRIMENTOS-09:
//  - parcelas = (total - entrada) / quantidade, cada uma arredondada a 2 casas,
//    SEM ajuste de resíduo na última (1.000 em 3 -> 333,33 x 3 = 999,99);
//  - com entrada, a ENTRADA é a 1ª parcela (data da entrada) e as demais
//    (quantidade informada) vêm depois: 1.000, entrada 200, 2 parcelas ->
//    200 + 400 + 400;
//  - vencimentos: 1ª data + (n x intervalo em dias); intervalo vazio vale 0.
// -----------------------------------------------------------------------------

export interface InstallmentRow {
  due_date: string | null;
  value: number | null;
}

export interface InstallmentsInput {
  total: number | null;
  hasEntry: boolean;
  entryValue: number | null;
  entryDate: string | null;
  quantity: number | null;
  firstDate: string | null;
  intervalDays: number | null;
}

// Arredonda a 2 casas (centavos), como o `toLocaleString` do legado.
export function roundCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Soma `days` a uma data 'yyyy-MM-dd' sem passar pelo fuso (aritmética em UTC).
export function addDaysIso(dateIso: string, days: number): string {
  const [year, month, day] = dateIso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

// Gera as parcelas. Devolve `null` quando faltam dados para calcular (a tela
// então não mexe nas linhas que o usuário já tem).
export function buildInstallments(input: InstallmentsInput): InstallmentRow[] | null {
  const quantity = Math.trunc(Number(input.quantity ?? 0));
  const total = Number(input.total ?? 0);
  if (quantity < 1 || !input.firstDate || total <= 0) return null;

  const entry = input.hasEntry ? Number(input.entryValue ?? 0) : 0;
  const interval = Number(input.intervalDays ?? 0) || 0;
  const share = roundCents((total - entry) / quantity);

  const rows: InstallmentRow[] = [];
  if (input.hasEntry && entry > 0) {
    rows.push({ due_date: input.entryDate, value: roundCents(entry) });
  }
  for (let index = 0; index < quantity; index += 1) {
    rows.push({ due_date: addDaysIso(input.firstDate, index * interval), value: share });
  }
  return rows;
}

// Soma dos valores das linhas (nulos contam zero).
export function sumValues(rows: Array<{ value: number | null }>): number {
  return roundCents(rows.reduce((acc, row) => acc + (Number(row.value) || 0), 0));
}

// Preenche as linhas do rateio SEM valor com o total das parcelas e recalcula o
// percentual (IG-11 do legado). Linhas com valor não mudam.
export function fillEmptyRatioValues<T extends { value: number | null; percent: number | null }>(
  rows: T[],
  installmentsTotal: number,
  total: number
): T[] {
  if (installmentsTotal <= 0) return rows;
  return rows.map((row) => {
    if (row.value !== null && row.value !== undefined && Number(row.value) > 0) return row;
    return {
      ...row,
      value: installmentsTotal,
      percent: total > 0 ? roundCents((installmentsTotal / total) * 100) : row.percent,
    };
  });
}

// O rateio fecha com o total do título (centavos exatos), como a API exige.
export function ratioMatchesTotal(rows: Array<{ value: number | null }>, total: number): boolean {
  return Math.abs(sumValues(rows) - roundCents(total)) < 0.005;
}
