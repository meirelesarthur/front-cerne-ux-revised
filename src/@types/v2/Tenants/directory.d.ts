// src/@types/v2/Tenants/directory.d.ts
// -----------------------------------------------------------------------------
// Tipos do lookup "Diretório de Contratantes" (Tenants) — API v1 do backend
// Laravel GB.Cerne, F-122 (Compartilhamento), TASK-CP-FE-02.
//
//   GET /api/v1/tenants/directory?search= → data: TenantDirectoryOptionItem[]
//     (universo completo de tenants, sem paginação — `ApiResponse::success()`,
//     `meta: null`). Endpoint NOVO e DISTINTO de `/tenants/options`
//     (`TenantOptionItem`/`TenantOptionsListEnvelope`, src/@types/v2/Tenants/
//     index.d.ts): `/tenants/options` é `auth:sanctum` + restrito a
//     `Gestor_Plataf` (403 para usuário comum); `/tenants/directory` é
//     `auth:sanctum` SEM `permission:` dedicada — qualquer autenticado. Reuso
//     de `/tenants/options` foi avaliado e REJEITADO no contrato de API
//     (`F-122-compartilhamento-api-contract.md`, `SURF-010`) — por isso este
//     arquivo/tipo é deliberadamente separado, não uma extensão do módulo
//     `Tenants/index.d.ts` acima.
// -----------------------------------------------------------------------------

/** Payload — `{ uuid, label }`, `label` PRONTO do backend (`"nif - name"`, mirror `CL-026`). */
export interface TenantDirectoryOptionItem {
  uuid: string;
  label: string;
}

/** `ApiResponse::success()` — sem paginação, `meta` sempre `null`. */
export interface TenantDirectoryListEnvelope {
  success: boolean;
  message: string;
  data: TenantDirectoryOptionItem[];
  errors: Record<string, string[]> | null;
  meta: null;
}
