// src/@types/v2/Tenants/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do lookup de Contratantes (Tenants) — API v1 do backend Laravel
// GB.Cerne. PLANO-ADMIN-USER-ANALYSIS §3.5/§4 — endpoint dedicado FORA de
// qualquer farm-context, restrito a `Gestor_Plataf`.
//
//   GET /api/v1/tenants/options?search= → data: TenantOptionItem[] (universo
//     completo de tenants ATIVOS visíveis ao papel de plataforma, sem
//     paginação — `ApiResponse::success()`, `meta: null`, mirror mecânico de
//     `RoleOptionsListEnvelope`/`ListRoleOptionsAction`).
// -----------------------------------------------------------------------------

/** Payload ENXUTO — `{ uuid, name }` (mirror `TenantOptionResource`). */
export interface TenantOptionItem {
  uuid: string;
  name: string;
}

/** `ApiResponse::success()` — sem paginação, `meta` sempre `null`. */
export interface TenantOptionsListEnvelope {
  success: boolean;
  message: string;
  data: TenantOptionItem[];
  errors: Record<string, string[]> | null;
  meta: null;
}
