// src/constants/Users/tenant-status.ts
// Enum de negócio `tenant_status` do filtro de User (contrato §1.5) — espelha
// `App\Enums\TenantStatus` (api_root): ACTIVE=1, DEFAULTING=2, SUSPENDED=3,
// CANCELLED=4. Enviado/lido sempre como INTEIRO (nunca o nome do case) —
// mesma armadilha documentada em `markerType`. Exclusivo da visão
// `Gestor_Plataf` (TASK-FE-807, fora desta Tarefa) — só a fundação de
// constantes/opções nasce aqui (TASK-FE-801).

export const tenantStatus = {
  active: 1,
  defaulting: 2,
  suspended: 3,
  cancelled: 4,
} as const;

export type TenantStatus = (typeof tenantStatus)[keyof typeof tenantStatus];
