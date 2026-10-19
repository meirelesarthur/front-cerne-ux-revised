// src/pages/Frota/Manutencoes/generate-financial-validation.ts
// -----------------------------------------------------------------------------
// UT-000684 — validação PURA do parcelamento da tela "Gerar Financeiro".
// Espelha a regra da API (`providers.*.installments` required|array|min:1;
// `installments.*.due_date` required|date; `installments.*.value`
// required|numeric|min:0.01) para bloquear o envio antes do 422 cru.
// -----------------------------------------------------------------------------

export type InstallmentIssueReason = 'missing' | 'invalid';

export interface InstallmentIssue {
  providerIndex: number;
  providerLabel: string;
  reason: InstallmentIssueReason;
}

export interface InstallmentRowLike {
  due_date?: string | null;
  value?: number | string | null;
}

export interface ProviderInstallmentsLike {
  provider_label?: string | null;
  installments?: Array<InstallmentRowLike | null | undefined> | null;
}

function isRowValid(row: InstallmentRowLike | null | undefined): boolean {
  if (!row) return false;
  const hasDate = typeof row.due_date === 'string' && row.due_date.trim() !== '';
  const value = Number(row.value);
  return hasDate && Number.isFinite(value) && value >= 0.01;
}

export function validateProvidersInstallments(
  providers: ProviderInstallmentsLike[] | null | undefined
): InstallmentIssue[] {
  const issues: InstallmentIssue[] = [];
  (providers ?? []).forEach((provider, providerIndex) => {
    const providerLabel = provider?.provider_label ?? '';
    const rows = provider?.installments ?? [];
    if (rows.length === 0) {
      issues.push({ providerIndex, providerLabel, reason: 'missing' });
      return;
    }
    if (!rows.every(isRowValid)) {
      issues.push({ providerIndex, providerLabel, reason: 'invalid' });
    }
  });
  return issues;
}
