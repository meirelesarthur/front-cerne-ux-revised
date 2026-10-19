// src/hooks/usePermissions.ts
// Verificação de permissões (RBAC Spatie) no front do GB Cerne.
//
// Fonte: `ctx.permissions` do AuthContext — array PLANO de strings no padrão
// `recurso_acao` (ex.: "animals_view"), entregue por GET /api/v1/auth/me e
// atualizado em login/refreshProfile. Reativo via use-context-selector (sem
// listener de localStorage: o contexto já re-renderiza quem consome).
//
// Isto é UX (esconder menu/rota/botão), NUNCA segurança — a autorização real
// é sempre do backend (middleware `permission:` + `authorize()` do Form
// Request). Deny-by-default: string errada só ESCONDE o item, nunca expõe.
//
// EXCEÇÃO — `hasRole()` (DEC-005/GAP-BE-032): este hook é, por convenção,
// 100%-permissão (nunca papel). A única exceção pontual e documentada é o
// módulo CentroCusto: `costcenters_create` sozinho deixou de distinguir
// "criar centro de topo" de "criar descendente" (o contratante passou a
// precisar da MESMA permissão para a segunda ação) — o próprio backend
// resolve "é Gestor_Plataf" via `$user->hasRole('Gestor_Plataf')` (Spatie),
// não via permissão dedicada, então o front precisa do mesmo sinal. NÃO
// generalizar `hasRole()` para novas telas sem uma justificativa equivalente
// (regra de negócio modelada por papel no backend, não por permissão).
//
// 2ª EXCEÇÃO documentada — Logs do Sistema (execução 079, DD-079-05): o
// backend exige o papel `Gestor_Plataf` ALÉM da permissão `system-logs_view`
// (`SystemLogRequest::authorize`), para que a permissão, concedida por engano
// a outro papel, não abra os logs. O front espelha a barreira dupla com
// `RequireRole` (rota) + `role` em `NavPermissionRule` (menu), sempre aditivos
// à permissão. Mesma regra: não generalizar.

import { useCallback, useMemo } from "react";
import { useContextSelector } from "use-context-selector";

import { AuthContext } from "@/contexts/AuthContext";

export function usePermissions() {
  const permissions = useContextSelector(AuthContext, (ctx) => ctx.permissions);
  const roles = useContextSelector(AuthContext, (ctx) => ctx.roles);
  const activeFarmUuid = useContextSelector(AuthContext, (ctx) => ctx.activeFarmUuid);
  const farmScopedPermissions = useContextSelector(AuthContext, (ctx) => ctx.farmScopedPermissions);

  // Set para lookup O(1) — a lista real tem centenas de entradas.
  const permissionSet = useMemo(() => new Set(permissions), [permissions]);
  const roleSet = useMemo(() => new Set(roles), [roles]);
  const farmScopedSet = useMemo(() => new Set(farmScopedPermissions), [farmScopedPermissions]);

  /** O usuário tem a permissão? (ex.: `can("farms_view")`) */
  const can = useCallback(
    (permission: string) => permissionSet.has(permission),
    [permissionSet]
  );

  /** Pelo menos uma das permissões. */
  const canAny = useCallback(
    (perms: string[]) => perms.some((p) => permissionSet.has(p)),
    [permissionSet]
  );

  /** Todas as permissões. */
  const canAll = useCallback(
    (perms: string[]) => perms.every((p) => permissionSet.has(p)),
    [permissionSet]
  );

  /**
   * O usuário tem o PAPEL (Spatie role)? Exceção deliberada e pontual — ver
   * nota de cabeçalho do arquivo. Uso hoje: `costcenters_create` +
   * `hasRole("Gestor_Plataf")` no módulo CentroCusto (DEC-005).
   */
  const hasRole = useCallback((role: string) => roleSet.has(role), [roleSet]);

  /** Há fazenda ativa (X-Farm-Id presente)? Espelha `activeFarmUuid` do AuthContext. */
  const hasFarm = !!activeFarmUuid;

  /** A permissão (por nome) exige fazenda ativa para ser exercida? (GAP-BE-033) */
  const isFarmScoped = useCallback(
    (permission: string) => farmScopedSet.has(permission),
    [farmScopedSet]
  );

  return { permissions, can, canAny, canAll, hasRole, hasFarm, isFarmScoped };
}
