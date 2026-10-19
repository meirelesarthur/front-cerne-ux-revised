// src/pages/Operacional/CompraAnimais/movementPurchaseFinancialBaseline.ts
// -----------------------------------------------------------------------------
// 088 D3-FE-T4 — ponte PURA (sem React) entre as linhas do formulário
// (`financial_installments`/`financial_allocations`, em reais) e o módulo de
// cálculo em centavos (`movementPurchaseFinancialMath`), para o recálculo D3-b
// por mudança de total (PLANO-088-D3-D4-FRONT §4.3 + decisão do dono P-FE-3).
//
//  - `captureFinancialBaseline`: congela as linhas (e o total) vigentes quando o
//    USUÁRIO ou a CARGA mudam as linhas; o recálculo NUNCA atualiza a baseline
//    (sem deriva de centavos em recálculos sucessivos).
//  - `financialRowsSignature`: assinatura estável das linhas, para distinguir a
//    escrita do próprio recálculo de uma edição do usuário.
//  - `applyRecalculationToRows`: devolve as linhas do form a partir do resultado
//    de `recalculateForTotal`, preservando categoria/conta/centro e as datas.
// -----------------------------------------------------------------------------

import type {
  MovementPurchaseFinAllocationRow,
  MovementPurchaseFinInstallmentRow,
  MovementPurchaseInstallmentGeneratorForm,
} from '@/@types/v2/MovementPurchases';

import {
  type AllocationMathRow,
  type FinancialBaseline,
  type InstallmentCentsRow,
  type RecalculateResult,
  fromCents,
  isValidIsoDate,
  toCents,
} from './movementPurchaseFinancialMath';

// Linha de rateio com os campos de seleção preservados ao longo do recálculo.
export type AllocationBaselineRow = AllocationMathRow &
  Pick<MovementPurchaseFinAllocationRow, 'category' | 'plan_account' | 'center'>;

export type MovementPurchaseFinancialBaseline = FinancialBaseline<AllocationBaselineRow>;

export interface FinancialRowsValues {
  financial_installments: MovementPurchaseFinInstallmentRow[];
  financial_allocations: MovementPurchaseFinAllocationRow[];
  generator: MovementPurchaseInstallmentGeneratorForm;
}

export function financialRowsSignature(
  installments: MovementPurchaseFinInstallmentRow[] | undefined,
  allocations: MovementPurchaseFinAllocationRow[] | undefined
): string {
  return JSON.stringify([
    (installments ?? []).map((row) => [row?.due_date ?? null, toCents(row?.amount), row?.origin]),
    (allocations ?? []).map((row) => [
      row?.category?.value ?? null,
      row?.plan_account?.value ?? null,
      row?.center?.value ?? null,
      toCents(row?.value),
      row?.percent ?? null,
    ]),
  ]);
}

export function captureFinancialBaseline(
  values: FinancialRowsValues,
  totalCents: number
): MovementPurchaseFinancialBaseline {
  // Linha sem vencimento (parcela recém-adicionada, ainda incompleta): o recálculo
  // fica desligado (baseline sem parcelas) até o usuário completá-la.
  const rawInstallments = values.financial_installments ?? [];
  const installments: InstallmentCentsRow[] = rawInstallments.every((row) => !!row?.due_date)
    ? rawInstallments.map((row) => ({
        due_date: row.due_date as string,
        amountCents: toCents(row.amount),
        origin: row.origin,
      }))
    : [];

  const body = installments.filter((row) => row.origin !== 'input');
  const generator = values.generator;
  const hasGeneratorParams =
    typeof generator?.count === 'number' &&
    isValidIsoDate(generator?.first_due_date) &&
    typeof generator?.interval_days === 'number';

  return {
    totalCents,
    installments,
    allocations: (values.financial_allocations ?? []).map((row) => ({
      valueCents: toCents(row?.value),
      percent: Number(row?.percent) || 0,
      category: row?.category ?? null,
      plan_account: row?.plan_account ?? null,
      center: row?.center ?? null,
    })),
    // Só "gerado e intocado" regenera pelo gerador; qualquer outra origem reescala.
    generatedUntouched: body.length > 0 && body.every((row) => row.origin === 'generated'),
    generatorParams: hasGeneratorParams
      ? {
          count: generator.count,
          firstDueDate: generator.first_due_date,
          intervalDays: generator.interval_days,
        }
      : null,
  };
}

export function installmentRowsFromCents(
  rows: InstallmentCentsRow[]
): MovementPurchaseFinInstallmentRow[] {
  return rows.map((row) => ({
    due_date: row.due_date,
    amount: fromCents(row.amountCents),
    origin: row.origin,
  }));
}

export function allocationRowsFromBaseline(
  rows: AllocationBaselineRow[]
): MovementPurchaseFinAllocationRow[] {
  return rows.map((row) => ({
    category: row.category,
    plan_account: row.plan_account,
    center: row.center,
    value: fromCents(row.valueCents),
    percent: row.percent,
  }));
}

export interface AppliedRecalculation {
  installments: MovementPurchaseFinInstallmentRow[];
  allocations: MovementPurchaseFinAllocationRow[];
  applyInstallments: boolean;
  applyAllocations: boolean;
}

// Decide o que o recálculo grava no form: um bloco com erro NÃO é aplicado (o
// outro pode ser). A mudança é medida contra as linhas ATUAIS do form (não contra
// a baseline), para que voltar ao total da baseline restaure as linhas originais.
export function applyRecalculationToRows(
  result: RecalculateResult<AllocationBaselineRow>,
  current: Pick<FinancialRowsValues, 'financial_installments' | 'financial_allocations'>
): AppliedRecalculation {
  const nextInstallments = result.installmentsError
    ? null
    : installmentRowsFromCents(result.installments);
  const nextAllocations = result.allocationsError
    ? null
    : allocationRowsFromBaseline(result.allocations);

  const installmentsChanged =
    !!nextInstallments &&
    (nextInstallments.length !== current.financial_installments.length ||
      nextInstallments.some((row, i) => {
        const now = current.financial_installments[i];
        return row.due_date !== now?.due_date || toCents(row.amount) !== toCents(now?.amount);
      }));

  const allocationsChanged =
    !!nextAllocations &&
    nextAllocations.length === current.financial_allocations.length &&
    nextAllocations.some((row, i) => {
      const now = current.financial_allocations[i];
      return toCents(row.value) !== toCents(now?.value) || row.percent !== now?.percent;
    });

  return {
    applyInstallments: installmentsChanged,
    applyAllocations: allocationsChanged,
    installments:
      installmentsChanged && nextInstallments ? nextInstallments : current.financial_installments,
    allocations:
      allocationsChanged && nextAllocations ? nextAllocations : current.financial_allocations,
  };
}
