// src/pages/Integracoes/Compartilhamento/useSharings.tsx
// -----------------------------------------------------------------------------
// Hooks orquestradores do módulo Compartilhamento (Sharing) — Integrações,
// F-122, 97-Esteiras/070. `useSharingList` (`TASK-CP-FE-01`) +
// `useSharingForm` (`TASK-CP-FE-02`) + `useSharingDetail` (`TASK-CP-FE-03`)
// no mesmo arquivo, mirror da convenção já usada por `useAcasalamentos.tsx`.
// -----------------------------------------------------------------------------

import { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getSharing, listSharings } from '@/services/v2/Sharings/sharing-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { SharingDetail, SharingListItem } from '@/@types/v2/Sharings';

/**
 * Listagem paginada REAL de Compartilhamentos (`TASK-CP-FE-01`). Família Grid
 * SEM ID de contexto (listagem global) — `useCustomGridQuery` (V3 canônico),
 * `networkMode:"online"`/`staleTime:0`/`refetchOnWindowFocus:true`. Sem
 * `filter`/`filterQuery` fixo — o legado não tem painel de filtro (`FM-01
 * NONE_OBSERVED`), não inventado aqui.
 *
 * @param {PaginatedQueryProps} paginatedQuery - Estado de paginação atual (`userPaginatedQuery`).
 * @param {Dispatch<SetStateAction<PaginatedQueryProps<any>>>} setPaginatedQuery - Setter do estado de paginação.
 * @return {object} Resultado da query de listagem (V3, `data.data.items`/`data.data.pagination`).
 */
export function useSharingList(
  paginatedQuery: PaginatedQueryProps,
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>
) {
  return useCustomGridQuery<SharingListItem, any>({
    asyncFunction: listSharings,
    queryKey: queryKey.sharings.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
  });
}

/**
 * Hidratação do formulário de Edit (`TASK-CP-FE-02`) — `useCustomFormQueryByGuid`
 * (variante real do projeto para IDs UUID), `fillForm` chamado com
 * `resetForce=true` na carga inicial (Lei 2). Desabilitado em modo Create
 * (`sharingUuid` vazio/inválido).
 *
 * @param {string} [sharingUuid] - uuid da rota (`undefined`/inválido = modo create, query desabilitada).
 * @param {Function} fillForm - Função nomeada com guarda `dirtyFields` (Lei 2), assinatura `(data, resetForce?) => void`.
 * @return {object} Resultado da query de hidratação do formulário.
 */
export function useSharingForm(
  sharingUuid: string | undefined,
  fillForm: (data: SharingDetail, resetForce?: boolean) => void
) {
  return useCustomFormQueryByGuid<SharingDetail>({
    registrationId: sharingUuid,
    queryKey: queryKey.sharings.detail,
    asyncFunction: getSharing,
    fillForm,
  });
}

/**
 * Leitura pura da tela de View (`TASK-CP-FE-03`) — `useQuery` direto
 * reaproveitando `getSharing` (não acopla a tela de View ao hook de
 * formulário, que exige `fillForm`, inexistente aqui — decisão registrada no
 * contrato de tela).
 *
 * @param {string} [sharingUuid] - uuid da rota; `undefined`/inválido desabilita a query.
 * @return {object} Resultado da query de leitura (`data` = `SharingDetail`).
 */
export function useSharingDetail(sharingUuid: string | undefined) {
  return useQuery({
    queryKey: [queryKey.sharings.detail, 'view', sharingUuid ?? null],
    queryFn: async () => {
      const response = await getSharing(sharingUuid!);
      return response.data;
    },
    enabled: !!sharingUuid,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
