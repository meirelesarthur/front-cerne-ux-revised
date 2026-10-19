// src/services/v2/SupplyStatusSlaReport/supply-status-sla-report-service.ts
// -----------------------------------------------------------------------------
// Serviço do Relatório SLA (SupplyStatusSlaReport — TASK-SLA-FE-01, esteira
// 97-Esteiras/037). `GET /request-purchases/sla-report` — resposta BINÁRIA
// (`.xlsx`), 100% SÍNCRONA (mirror fiel do legado `Excel::download`, sem
// fila/job/polling — confirmado por leitura direta de
// `SupplyStatusSlaReportController::__invoke()`, que devolve o binário na
// MESMA resposta HTTP).
//
// Inspeção Obrigatória (Tarefa) CONFIRMADA por leitura direta de
// `GenerateRequestPurchaseSlaReportAction::execute()`: o relatório É
// restrito à FAZENDA ATIVA (`FarmContext::farm()`, GAP-RC-02,
// `037/GATE-DECISOES.md`) — por isso o disparo do download PRECISA passar
// pelo client axios (`api.V2.get` + `responseType: 'blob'`), cujo
// interceptor de request já injeta `X-Farm-Id` (ver `services/api.ts`),
// NUNCA por `window.open`/link cru (que não propaga headers customizados).
//
// Mesmo mecanismo já consolidado em `equipment-service.ts`
// (`downloadEquipmentImportTemplate`/`exportEquipments`, TASK-PA-07/
// TASK-STK-FE-03) — `api.V2.get<Blob>(endpoint, params, { responseType:
// 'blob' })` + `downloadBlob()` (utils/downloadBlob.ts) no call site.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { SupplyStatusSlaReportFilterRequest } from '@/@types/v2/SupplyStatusSlaReport';

async function downloadSupplyStatusSlaReport(
  filters: SupplyStatusSlaReportFilterRequest
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/request-purchases/sla-report', filters, {
    responseType: 'blob',
  });
  return data;
}

export { downloadSupplyStatusSlaReport };
