// src/constants/BaseRegistrations/mappers/tenant-form-mode.ts
// -----------------------------------------------------------------------------
// TASK-072-FE-06 (I9) — modo do formulário de Contratante, função PURA.
// Fiel ao legado (`TenantController.php:33` + ação "Visualizar" do
// `index.blade.php`): quem tem só `tenants_view` abre o registro em modo
// somente leitura. Rota `/novo` segue exigindo `tenants_create`; `/:uuid`
// aceita `tenants_view` OU `tenants_edit` — `tenants_edit` prevalece (edição).
// `denied` é defesa em profundidade (o `RequirePermission` da rota já barra).
// -----------------------------------------------------------------------------

import type { TenantFormMode } from '@/@types/v2/BaseRegistrations/tenant';

interface ResolveTenantFormModeInput {
  isEditing: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canView: boolean;
}

/**
 * Resolve o modo do formulário a partir da rota e das permissões.
 * @param {ResolveTenantFormModeInput} input - Rota (edição?) e permissões do usuário.
 * @return {TenantFormMode} `create` | `edit` | `view` | `denied`.
 */
export function resolveTenantFormMode({
  isEditing,
  canCreate,
  canEdit,
  canView,
}: ResolveTenantFormModeInput): TenantFormMode {
  if (!isEditing) return canCreate ? 'create' : 'denied';
  if (canEdit) return 'edit';
  if (canView) return 'view';
  return 'denied';
}
