// src/components/Suprimentos/slaReport.ts
// -----------------------------------------------------------------------------
// "Relatório SLA" por solicitação — execução 081, T-081-FE-01 (03/AC02,
// 04/AM02, 08/AM-02, 09/AM-03). Gate `status-sla_report_view`; abre em NOVA ABA
// (`supply-status.report` do legado) em `/relatorios/suprimentos?uuid=`.
// O relatório em si é a rota de relatórios (fora do escopo da 081).
// -----------------------------------------------------------------------------

export const SLA_REPORT_PERMISSION = 'status-sla_report_view';

export function canSlaReport(can: (permission: string) => boolean): boolean {
  return can(SLA_REPORT_PERMISSION);
}

export function buildSlaReportUrl(requestPurchaseUuid: string): string {
  return `/relatorios/suprimentos?uuid=${encodeURIComponent(requestPurchaseUuid)}`;
}

// Abre o Relatório SLA em nova aba, como no legado.
export function openSlaReport(requestPurchaseUuid: string): void {
  window.open(buildSlaReportUrl(requestPurchaseUuid), '_blank', 'noopener,noreferrer');
}
