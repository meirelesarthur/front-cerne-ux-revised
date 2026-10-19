// src/@types/v2/Relatorios/loggedHours.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Horas Logadas" (F-275, `logged-hours-report`,
// esteira 97-Esteiras/012, Tarefa 47). Shapes conforme
// `api-contract-horas-logadas.md §6.2/§7` (v3, CONTRATO_AUTOAPROVADO) —
// payload agregado contratante → fazenda → linhas (usuário × dia), com
// subtotal por fazenda.
//
// PROIBIÇÃO NOMINAL (contrato de tela §3.3, Tarefa 47 DoD): `total_formatted`
// (linha e subtotal) e `date_label` vêm PRONTOS da API e são renderizados
// VERBATIM. `total_seconds`/`date` acompanham como valor canônico e NUNCA são
// recalculados/reformatados no front (proibido `formatDurationHms`,
// `Intl.NumberFormat` ou qualquer aritmética sobre `total_seconds`) —
// `DEF-03` (overflow de horas >=24h) já foi corrigido no backend
// (`formatSeconds()`), o front só exibe o valor pronto.
// -----------------------------------------------------------------------------

export interface LoggedHoursRow {
  user_name: string;
  date: string;
  date_label: string;
  total_seconds: number;
  total_formatted: string;
}

export interface LoggedHoursSubtotal {
  total_seconds: number;
  total_formatted: string;
}

export interface LoggedHoursFarm {
  farm_uuid: string;
  farm_label: string;
  rows: LoggedHoursRow[];
  subtotal: LoggedHoursSubtotal;
}

export interface LoggedHoursTenant {
  tenant_uuid: string;
  tenant_label: string;
  farms: LoggedHoursFarm[];
}

export interface LoggedHoursReportData {
  period: { start_date: string; end_date: string };
  tenants: LoggedHoursTenant[];
}
