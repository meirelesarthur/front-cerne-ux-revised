// src/utils/budgetInstallments.ts
// -----------------------------------------------------------------------------
// Funções PURAS de cálculo de parcelamento do bloco financeiro de Orçamento
// (Budget — Operacional / Vendas, F-018, 97-Esteiras/054, TASK-BG-FE-04).
// Portam `calcInstallments`/`adjustInstallmentsDifference` do legado (CV-06,
// `budgets-legacy-contract.md` EV-53/CB-23/CB-24), mirror do padrão de util
// puro já usado em `@/utils/requestQuotationWhatsApp.ts`.
//
// Substitui o stub registrado em TASK-BG-FE-01 (assinatura de BASELINE
// diferente, sem suporte a edição individual de parcela) pela assinatura
// definitiva do Roteiro `TASK-BG-FE-04-budget-form-pagamentos.md`, consumida
// por `BudgetPaymentRow.tsx`.
//
// Nenhuma dependência de React/DOM — funções 100% puras, testáveis
// isoladamente (`budgetInstallments.test.ts`, Vitest, ambiente `node`).
// -----------------------------------------------------------------------------

export interface BudgetInstallmentRow {
  date: string;
  value: number;
}

export interface CalcInstallmentsInput {
  /** Valor total do pagamento (`BudgetPayment.total`). */
  total: number;
  /** IG-07 — quando há entrada (`has_input`), o valor de entrada é abatido
   *  do valor financiado. Passar `null` quando `has_input` for falso — a
   *  decisão de "há entrada ou não" é do chamador (`BudgetPaymentRow`),
   *  nunca desta função pura. */
  inputValue: number | null;
  /** Número de parcelas detalhadas a gerar (`qtd_installments`). */
  qtdInstallments: number;
  /** Data ISO (`yyyy-MM-dd`) da 1ª parcela (`first_installment`). */
  firstInstallment: string | null;
  /** Intervalo em dias entre parcelas (`int_installments`). */
  intervalDays: number;
}

function round2(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function addDaysIso(baseIso: string, days: number): string {
  const date = new Date(`${baseIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Gera a tabela de parcelas detalhadas (CV-06) — divide o valor financiado
 * (`total`, descontada a entrada quando `inputValue` for informado)
 * igualmente entre `qtdInstallments` linhas, espaçadas por `intervalDays`
 * dias a partir de `firstInstallment`, concentrando o resto do
 * arredondamento na ÚLTIMA parcela (mirror `calcInstallments` do legado,
 * CB-23/CB-24).
 *
 * Recálculo client-side, sempre PREVIEW — o servidor persiste verbatim o
 * array recebido, sem recomputar (`budgets-api-contract.md §4.3`).
 *
 * @param {CalcInstallmentsInput} input - Parâmetros do cálculo (valor,
 *   entrada, quantidade/intervalo de parcelas, data da 1ª parcela).
 * @return {BudgetInstallmentRow[]} Array de `{ date, value }`, comprimento
 *   `qtdInstallments` (vazio se dados insuficientes, mirror IG-06 — "não
 *   gera linhas se faltar dado").
 */
export function calcInstallments(input: CalcInstallmentsInput): BudgetInstallmentRow[] {
  const { total, inputValue, qtdInstallments, firstInstallment, intervalDays } = input;

  if (!firstInstallment || !qtdInstallments || qtdInstallments <= 0) return [];

  const financedValue = round2((Number(total) || 0) - (Number(inputValue) || 0));
  if (!(financedValue > 0)) return [];

  const firstDate = new Date(`${firstInstallment}T00:00:00`);
  if (Number.isNaN(firstDate.getTime())) return [];

  const interval = Number(intervalDays) || 0;
  const baseValue = round2(financedValue / qtdInstallments);

  const rows: BudgetInstallmentRow[] = Array.from({ length: qtdInstallments }, (_, index) => ({
    date: addDaysIso(firstInstallment, index * interval),
    value: baseValue,
  }));

  // Concentra o resto do arredondamento na última parcela (mirror
  // `calcInstallmentTotal`/ajuste final do legado — soma das parcelas SEMPRE
  // bate exatamente com o valor financiado).
  const lastIndex = rows.length - 1;
  const sumExceptLast = rows.slice(0, lastIndex).reduce((sum, row) => sum + row.value, 0);
  rows[lastIndex] = { ...rows[lastIndex], value: round2(financedValue - sumExceptLast) };

  return rows;
}

/**
 * Reconcilia a soma das parcelas com `targetTotal` depois que o usuário edita
 * manualmente o valor de UMA parcela (`editedIndex`) — mirror
 * `adjustInstallmentsDifference` do legado (CB-24), acionado no
 * `value_installments blur` (IG-10).
 *
 * A diferença entre `targetTotal` e a soma das demais parcelas é sempre
 * absorvida pela parcela `editedIndex` (redação Bíblia AGENTS: quando o
 * usuário edita a ÚLTIMA parcela diretamente, ela mesma é o alvo do ajuste;
 * quando edita qualquer OUTRA parcela, a diferença cai na ÚLTIMA, fiel ao
 * "concentra na última" do legado).
 *
 * Recusa (retorna o array ORIGINAL, sem aplicar `newValue`) se o ajuste
 * resultante zerar ou tornar negativa a parcela que absorve a diferença —
 * o chamador (`BudgetPaymentRow`) deve exibir um `toaster.error` e manter o
 * valor anterior quando a referência devolvida for igual à recebida.
 *
 * @param {BudgetInstallmentRow[]} installments - Parcelas ANTES da edição
 *   (valores já arredondados a 2 casas).
 * @param {number} editedIndex - Índice da parcela que o usuário editou.
 * @param {number} newValue - Novo valor digitado pelo usuário para
 *   `installments[editedIndex]`.
 * @param {number} targetTotal - Valor-alvo que a soma das parcelas deve
 *   igualar (`total` do pagamento, já descontada a entrada quando aplicável).
 * @return {BudgetInstallmentRow[]} Parcelas reconciliadas, OU a mesma
 *   referência de `installments` recebida quando a edição é recusada.
 */
export function adjustInstallmentsDifference(
  installments: BudgetInstallmentRow[],
  editedIndex: number,
  newValue: number,
  targetTotal: number
): BudgetInstallmentRow[] {
  if (installments.length === 0) return installments;
  if (editedIndex < 0 || editedIndex >= installments.length) return installments;

  const lastIndex = installments.length - 1;
  const roundedNewValue = round2(newValue);

  // Editar a ÚLTIMA parcela diretamente: ela é o próprio alvo do ajuste —
  // recusa se o valor digitado zerar/negativar.
  if (editedIndex === lastIndex) {
    if (roundedNewValue <= 0) return installments;
    return installments.map((row, index) =>
      index === editedIndex ? { ...row, value: roundedNewValue } : row
    );
  }

  const sumExceptLast = installments.reduce(
    (sum, row, index) =>
      index === lastIndex ? sum : sum + (index === editedIndex ? roundedNewValue : row.value),
    0
  );
  const adjustedLastValue = round2(targetTotal - sumExceptLast);

  // IG-10 — nunca deixa a última parcela zerar/negativar: recusa a edição
  // inteira (mantém o array original, inclusive a parcela `editedIndex`).
  if (adjustedLastValue <= 0) return installments;

  return installments.map((row, index) => {
    if (index === editedIndex) return { ...row, value: roundedNewValue };
    if (index === lastIndex) return { ...row, value: adjustedLastValue };
    return row;
  });
}
