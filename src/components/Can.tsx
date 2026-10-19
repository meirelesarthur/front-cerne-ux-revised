// src/components/Can.tsx
// Gate de UI por permissão (fase 2 do plano de permissionamento) — esconde
// botões/ações que o usuário não pode executar.
//
//   <Can permission="farms_create"><Button>Nova Fazenda</Button></Can>
//   <Can anyOf={["farms_edit", "farms_delete"]}>...</Can>
//
// UX apenas: esconder um botão ≠ proteger a operação — o enforcement real é
// o 403 do backend (middleware `permission:` + `authorize()`). Para proteger
// ROTAS, use <RequirePermission> (renderiza Acesso Negado em vez de sumir).

import type { ReactNode } from "react";

import { usePermissions } from "@/hooks/usePermissions";

interface CanProps {
  /** Permissão exigida (ex.: "farms_create"). */
  permission?: string;
  /** Alternativa: basta QUALQUER uma destas. */
  anyOf?: string[];
  /** Renderizado quando NÃO permitido (default: nada). */
  fallback?: ReactNode;
  children: ReactNode;
}

export function Can({ permission, anyOf, fallback = null, children }: CanProps) {
  const { can, canAny } = usePermissions();

  const allowed = permission
    ? can(permission)
    : anyOf?.length
      ? canAny(anyOf)
      : true;

  return <>{allowed ? children : fallback}</>;
}
