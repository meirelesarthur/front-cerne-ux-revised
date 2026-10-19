// src/@types/v2/Sharings/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo Compartilhamento (Sharing) — Integrações, F-122,
// 97-Esteiras/070. `TASK-CP-FE-01` (fundação: list/envelope) +
// `TASK-CP-FE-02` (form: create/edit) no mesmo arquivo, mirror da convenção
// já usada por outros módulos do projeto (1 arquivo de tipos por módulo).
//
// Endpoints consumidos (F-122-compartilhamento-api-contract.md,
// CONTRATO_AUTOAPROVADO): `GET/POST/PUT/DELETE /api/v1/sharings` — mesmo
// `SharingResource` em todas as ações (list/create/edit/view).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** "Contratante" — `label` PRONTO do backend (`"nif - name"`), pensado para o
 * `SelectAsyncPaginate` do formulário. Para EXIBIÇÃO em grid/detalhe, usar
 * `extractTenantNameFromLabel()` (`src/utils/extractTenantNameFromLabel.ts`)
 * — o legado (`CL-029`/`CL-032`) mostra só o nome, nunca o NIF composto. */
export interface SharingTenantRef {
  uuid: string;
  label: string;
}

/** "Responsável" — sempre derivado do servidor (`auth()->id()` no create,
 * dono original do registro no edit/view), NUNCA um campo do formulário. */
export interface SharingUserRef {
  uuid: string;
  name: string;
}

/** `items` — array cru de strings (hoje só `"markings"`, `SharingItem` enum
 * do backend). Exibido SEM tradução de rótulo nas telas de leitura
 * (`CL-032`) — "Marcação" é só o LABEL do checkbox de entrada do formulário. */
export interface SharingListItem {
  uuid: string;
  date: string; // "YYYY-MM-DD"
  tenant: SharingTenantRef;
  user: SharingUserRef;
  items: string[];
}

/** `GET /sharings/{uuid}` — mesmo shape do `SharingResource` da listagem
 * (reaproveitado por FORM/EDIT — `TASK-CP-FE-02` — e por VIEW —
 * `TASK-CP-FE-03`). */
export interface SharingDetail extends SharingListItem {}

/** `ApiResponse::paginated()` — `GET /sharings`. */
export interface SharingsListEnvelope {
  success: boolean;
  message: string;
  data: SharingListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
}

/** Valores do `react-hook-form` (`CreateOrUpdateCompartilhamento.tsx`).
 * `tenant_uuid` é um `Option` do `SelectAsyncPaginate` — convertido para
 * `uuid` puro só no submit (`tryPersistSharing`). "Responsável" NÃO existe
 * aqui — nunca é um campo do formulário/payload (`CL-016`, `BR-01`/`BR-02`). */
export interface SharingForm {
  date: string; // ISO "YYYY-MM-DD"
  tenant_uuid: Option<string> | null;
  items: string[]; // sempre [] ou ["markings"]
}

/** Payload real enviado ao backend (`POST`/`PUT /sharings`) — `SharingRequest`. */
export interface SharingPayload {
  date: string;
  tenant_uuid: string;
  items: string[];
}
