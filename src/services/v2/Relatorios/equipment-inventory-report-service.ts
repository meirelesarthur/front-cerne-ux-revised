// src/services/v2/Relatorios/equipment-inventory-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Inventário Patrimonial" (Bens/Equipamentos — F-260, TASK-INV-FE-01,
// esteira 075). Endpoint ÚNICO (contrato de API `## 0.8`/`## 3`/`## 7`):
//   GET /equipments-inventory-report (`responseType: 'blob'`)
//
// DIVERGE do mirror estrutural `stock-movement-report-service.ts` (2
// funções/2 endpoints) — aqui é 1 função só, 1 endpoint só: o backend decide
// PDF vs. Excel pelo MESMO parâmetro `type` (mirror CL-008/CL-009, índices
// implícitos do legado — ausente/0 = PDF, 1 = Excel). NÃO replicar o padrão
// de 2 rotas/2 botões por reflexo.
//
// Envelope `{success,message,data,errors,meta}` NÃO se aplica a este binário
// — mesma exceção documentada de `stock-movement-report-service.ts`/
// `paid-interest-report-service.ts`.
//
// SEM `farm_id`/`X-Farm-Id` no payload — a fazenda ativa vai pelo header
// `X-Farm-Id` automático do client (`get_spa_api_client_pattern §2`);
// `Equipment` já é `HasFarmTenantScope` (contrato de API `DA-INV-05`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

export interface EquipmentInventoryReportParams {
  family?: string;
  proprietary?: string;
  status: 1 | 2;
  type?: 0 | 1; // ausente/0 = PDF, 1 = Excel (mirror CL-009 — índices implícitos do legado)
}

function toQuery(params: EquipmentInventoryReportParams) {
  return {
    family: params.family || undefined,
    proprietary: params.proprietary || undefined,
    status: params.status,
    type: params.type || undefined,
  };
}

export async function downloadEquipmentInventoryReport(
  params: EquipmentInventoryReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/equipments-inventory-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}
