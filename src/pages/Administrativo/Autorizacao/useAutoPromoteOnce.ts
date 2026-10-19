// src/pages/Administrativo/Autorizacao/useAutoPromoteOnce.ts
// -----------------------------------------------------------------------------
// Promoção automática 4 para 3 da Ciência (execução 081, T-081-FE-06; legado
// `RequestAuthorizationController::second`, RA:456-471). O legado promovia dentro
// do GET (sem clique); a API não escreve em GET, então o front chama UMA vez
// `POST acknowledge { auto_promote: true }` ao abrir quando o contexto indica
// `auto_promote_available` (plano A-05):
//   - guarda por `useRef` (uma chamada por abertura da solicitação, mesmo com
//     re-render, refetch ou StrictMode);
//   - sucesso: refaz a busca e a tela cai no ramo de Aprovação;
//   - 422 (T-743-FE-04): deixa de ser silencioso; chama `onUnprocessable` (o container
//     avisa e marca Safra/Classificação) e refaz a busca;
//   - outro erro: refaz a busca e avisa pelo `onError`.
// Sem toast de sucesso: `useMutation` direto, não `useRequest`.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { acknowledgeRequestAuthorization } from '@/services/v2/RequestAuthorizations/request-authorization-service';

import { shouldAutoPromote } from './authorizationRules';

interface UseAutoPromoteOnceParams {
  uuid: string | undefined;
  context:
    { auto_promote_available?: boolean; can_acknowledge_second_level?: boolean } | null | undefined;
  canEdit: boolean;
  /** Refaz a busca do detalhe (e das cotações); a promoção só termina depois dela. */
  refetch: () => Promise<unknown>;
  /** Chamado para erros que não sejam 422. */
  onError?: (error: unknown) => void;
  /** Chamado no 422 (ex.: Safra/Classificação exigidas): o 422 não é engolido. */
  onUnprocessable?: (error: unknown) => void;
}

export function useAutoPromoteOnce({
  uuid,
  context,
  canEdit,
  refetch,
  onError,
  onUnprocessable,
}: UseAutoPromoteOnceParams) {
  const promotedFor = useRef<string | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  const promoteMutation = useMutation({
    mutationFn: (targetUuid: string) =>
      acknowledgeRequestAuthorization(targetUuid, { auto_promote: true }),
  });

  const shouldPromote = !!uuid && shouldAutoPromote(context, canEdit);

  useEffect(() => {
    if (!shouldPromote || !uuid) return;
    if (promotedFor.current === uuid) return;
    promotedFor.current = uuid;

    setIsSettling(true);
    promoteMutation
      .mutateAsync(uuid)
      .catch((error: unknown) => {
        const isUnprocessable = isAxiosError(error) && error.response?.status === 422;
        if (isUnprocessable) onUnprocessable?.(error);
        else onError?.(error);
      })
      .then(() => refetch())
      .catch(() => undefined)
      .finally(() => setIsSettling(false));
    // `promoteMutation`, `refetch` e `onError` mudam de identidade a cada render; a guarda é o ref.
  }, [shouldPromote, uuid]);

  // Enquanto a promoção está pendente (inclusive no primeiro render, antes do efeito
  // rodar) a tela mostra o carregamento, sem piscar o ramo da Ciência.
  const isPromoting = isSettling || (shouldPromote && promotedFor.current !== uuid);

  return { isPromoting };
}
