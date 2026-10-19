// src/@types/v2/Relatorios/suppliesReport.ts
// -----------------------------------------------------------------------------
// Tipos de domínio da tela "Relatórios > Suprimentos > Suprimentos" (F-325,
// `supplies-report`, execução CORE_WORKSPACE/97-Esteiras/015, Tarefa 52).
// Contrato reconciliado e `CONTRATO_AUTOAPROVADO`
// (`fid-g3f-suprimentos-relatorio.md`) — camada api 100% pronta/testada
// (Tarefa 54 backend, `SuppliesReportController`).
//
// Os 8 filtros são TODOS opcionais (nenhum campo obrigatório, diferente dos
// precedentes `GerencialSolicitacoesRelatorio`/`SavingsRelatorio`, que exigem
// período) — `SuppliesReportFormValues` e `SuppliesReportParams` têm o MESMO
// conjunto de chaves; a única fronteira permitida entre os dois é a função
// pura `toSuppliesReportParams()` (`supplies-report-service.ts`) — a página
// NUNCA remonta chaves inline.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export interface SuppliesReportOptionsData {
  farms: { uuid: string; description: string }[];
  requesters: { uuid: string; name: string }[];
  authorizers: { uuid: string; name: string }[];
  statuses: { value: number; label: string }[];
  priorities: { value: number; label: string }[];
}

export interface SuppliesReportFormValues {
  farm_uuid: Option<string> | null;
  user_uuid: Option<string> | null;
  authorizer_uuid: Option<string> | null;
  status: Option<number> | null;
  priority: Option<number> | null;
  number: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface SuppliesReportParams {
  farm_uuid?: string;
  user_uuid?: string;
  authorizer_uuid?: string;
  status?: number;
  priority?: number;
  number?: string;
  start_date?: string;
  end_date?: string;
}
