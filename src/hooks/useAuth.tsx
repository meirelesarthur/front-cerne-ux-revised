import { useContextSelector } from 'use-context-selector';

import { AuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  // Usar estado do contexto (reativo) em vez de localStorage (não reativo)
  const user = useContextSelector(AuthContext, (ctx) => ctx.user);
  const profile = useContextSelector(AuthContext, (ctx) => ctx.profile);
  // Execução 071 (SRF-071-01a, contrato de tela §3) — badges de perfil de
  // acesso no Resumo da conta. Aditivo: exposição nova de um campo que já
  // existia no AuthContext (`ctx.roles`), sem tocar em nenhum consumidor
  // existente de `useAuth()`.
  const roles = useContextSelector(AuthContext, (ctx) => ctx.roles);
  const error = useContextSelector(AuthContext, (ctx) => ctx.error);
  const isAuthenticated = useContextSelector(AuthContext, (ctx) => ctx.isAuthenticated);
  // ERRO-FE-012: exposto para PrivateRoute distinguir "ainda não sei" de
  // "sei que não está autenticado" antes de decidir um redirect.
  const loading = useContextSelector(AuthContext, (ctx) => ctx.loading);
  const activeFarmUuid = useContextSelector(AuthContext, (ctx) => ctx.activeFarmUuid);
  const signIn = useContextSelector(AuthContext, (ctx) => ctx.signIn);
  const signOut = useContextSelector(AuthContext, (ctx) => ctx.signOut);
  const refreshProfile = useContextSelector(AuthContext, (ctx) => ctx.refreshProfile);
  // TASK-072-FE-11 — guard "contratante sem fazenda" (sinal + setter otimista).
  const farmContext = useContextSelector(AuthContext, (ctx) => ctx.farmContext);
  const markHasFarms = useContextSelector(AuthContext, (ctx) => ctx.markHasFarms);

  return {
    user,
    profile,
    roles,
    error,
    isAuthenticated,
    loading,
    activeFarmUuid,
    signIn,
    signOut,
    refreshProfile,
    farmContext,
    markHasFarms,
  };
}
