import { useAuth } from '@/hooks/useAuth';

/**
 * Escopo de persistência da personalização de grid (`storageScope` do
 * `useGridSettings`).
 *
 * A persistência é ancorada no USUÁRIO, com a fazenda ativa apenas como
 * sub-escopo quando existir — mesmo modelo do GB Armazém. Antes, cada tela
 * derivava `storageScope: userStorageId && activeFarmUuid ? ... : null`
 * inline, o que virava `null` (persistência desligada) sempre que não havia
 * fazenda ativa (admin/contratante novo) — recarregar a página perdia toda a
 * configuração. Este helper centraliza a regra e só devolve `null` quando de
 * fato não há usuário logado.
 *
 * Regra:
 * - `null` apenas quando NÃO há usuário logado (sem âncora estável);
 * - `user-${userStorageId}` com usuário mas sem fazenda ativa;
 * - `user-${userStorageId}:farm-${activeFarmUuid}` com usuário e fazenda.
 *
 * A fonte de `userStorageId`/`activeFarmUuid` é a MESMA que as telas usavam
 * (`useAuth()`), garantindo continuidade das chaves já persistidas quando há
 * fazenda ativa.
 *
 * @return {string | null} Escopo estável para `storageScope`, ou `null` só
 * quando não há usuário logado.
 */
export function useGridStorageScope(): string | null {
  const { user, activeFarmUuid } = useAuth();

  // Âncora estável por usuário. Em alguns perfis o `user_id` vem como `0`
  // (placeholder) mesmo logado — nesse caso caímos para `email` (e depois
  // `username`), que são estáveis e únicos por usuário. Sem NENHUM identificador
  // não há âncora → `null` (persistência desligada). Isso corrige a perda de
  // configuração no reload quando `user_id` é 0.
  const anchor = user?.user_id
    ? String(user.user_id)
    : user?.email || user?.username || null;

  if (!anchor) return null;

  return activeFarmUuid ? `user-${anchor}:farm-${activeFarmUuid}` : `user-${anchor}`;
}
