// src/services/v2/SupplyStatusSlas/supply-status-sla-service.ts
// -----------------------------------------------------------------------------
// Supply Status Sla Service — API v1 do backend Laravel GB.Cerne (Parâmetros
// SLA — Administrativo / Suprimentos, TASK-FE-SLA-01).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET /supply-status-slas              → SEM paginação — array COMPLETO,
//                                           11 linhas fixas por fazenda ativa
//                                           (mirror `listAccountingGroupers`,
//                                           SEM nenhum param de query — não
//                                           existe filtro nesta entidade).
//   PUT/PATCH /supply-status-slas/{uuid} → payload SEMPRE `{ max_hours }` —
//                                           nunca parcial de outros campos,
//                                           porque não existem outros campos
//                                           editáveis (`status` é imutável).
//
// `farm.context` estrito (grupo de rotas sem variante `.optional`/`.hybrid`)
// — `X-Farm-Id` obrigatório, anexado automaticamente pelo interceptor axios
// global (`api.V2`), sem ação especial necessária neste service.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  SupplyStatusSlaListItem,
  SupplyStatusSlaPayload,
  SupplyStatusSlasListEnvelope,
} from '@/@types/v2/SupplyStatusSlas';

// SEM paginação, SEM filtro — a API devolve o array COMPLETO dos 11
// parâmetros da fazenda ativa (mirror `listAccountingGroupers`).
async function listSupplyStatusSlas(): Promise<SupplyStatusSlaListItem[]> {
  const { data } = await api.V2.get<SupplyStatusSlasListEnvelope>('/supply-status-slas');
  return data.data;
}

// `status`/`status_label` nunca fazem parte do payload — só existe o
// caminho de edição de `max_hours` (mirror `updateParameterWeight`).
async function updateSupplyStatusSla(
  uuid: string,
  payload: SupplyStatusSlaPayload
): Promise<Response<SupplyStatusSlaListItem>> {
  const { data } = await api.V2.put<Response<SupplyStatusSlaListItem>>(
    `/supply-status-slas/${uuid}`,
    payload
  );
  return data;
}

export { listSupplyStatusSlas, updateSupplyStatusSla };
