// src/@types/v2/SupplyStatusSlas/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Parâmetros SLA" (SupplyStatusSla — Administrativo /
// Suprimentos, TASK-FE-SLA-01). Confirmado por leitura direta de
// `SupplyStatusSlaResource` (api_root, `app/Http/Resources/V1/
// SupplyStatusSlaResource.php`): expõe `uuid, status (int), status_label,
// max_hours, created_at, updated_at` — nunca `id`/`farm_id`/`tenant_id` cru.
//
// O front só precisa de `uuid, status_label, max_hours, created_at,
// updated_at` (SEM `status` cru — nenhuma apresentação usa o valor numérico
// bruto; a listagem exibe só `status_label`, já pronto do backend,
// `RequestPurchaseStatus::label()` — contrato de API §4.3, contrato de tela
// §2).
//
// Contrato (envelope ApiResponse):
//   GET /supply-status-slas         → SEM paginação — array COMPLETO, 11
//                                      linhas fixas por fazenda ativa
//                                      (ListSupplyStatusSlasAction).
//   PUT/PATCH /supply-status-slas/{uuid} → payload SupplyStatusSlaPayload,
//                                      SÓ `max_hours` (`status` imutável,
//                                      nunca lido do payload pela Action).
// Sem POST/DELETE (DEC-C/DEC-D do contrato de API) e sem GET /{uuid} de
// detalhe (DEC-D — "Supply Status Sla View" = a própria listagem).
// -----------------------------------------------------------------------------

// ============================================
// SUPPLY STATUS SLA (resposta da API)
// ============================================

export interface SupplyStatusSlaListItem {
  uuid: string;
  /** Status 1..11 (`RequestPurchaseStatus`): só para a cor da bolinha (token `supplyStatusN`). */
  status: number;
  /** `RequestPurchaseStatus::label()`, já pronto do backend — NUNCA recalcular no cliente a partir de `status`. */
  status_label: string;
  /** Único campo editável (`PUT/PATCH /supply-status-slas/{uuid}`). */
  max_hours: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// ENVELOPE (ApiResponse::success — SEM meta de paginação, DA-SLA-03)
// ============================================

export interface SupplyStatusSlasListEnvelope {
  success: boolean;
  message: string;
  data: SupplyStatusSlaListItem[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// PAYLOAD (PUT/PATCH — só `max_hours`)
// ============================================

export interface SupplyStatusSlaPayload {
  max_hours: number;
}
