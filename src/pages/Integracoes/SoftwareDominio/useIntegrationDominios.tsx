// src/pages/Integracoes/SoftwareDominio/useIntegrationDominios.tsx
// -----------------------------------------------------------------------------
// Hooks orquestradores do módulo Software Domínio (IntegrationDominio) —
// Integrações, F-121, 97-Esteiras/072, TASK-F121-FE-02. `useIntegrationDominioList`
// (Lista) + `useIntegrationDominioDetail` (hidratação do form em edição E
// leitura pura da tela de Detalhe — `fillForm` opcional, default no-op) no
// mesmo arquivo, mirror `useSharings.tsx`.
// -----------------------------------------------------------------------------

import { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getIntegrationDominio,
  listIntegrationDominios,
} from '@/services/v2/Integrations/integration-dominio-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  IntegrationDominioData,
  IntegrationDominioListItem,
} from '@/@types/v2/Integrations/integrationDominio';

/**
 * Listagem paginada REAL de Integrações Domínio (`TASK-F121-FE-03`). Família
 * Grid SEM ID de contexto (listagem global farm-scoped via `X-Farm-Id`) —
 * `useCustomGridQuery` (V3 canônico).
 *
 * @param {PaginatedQueryProps} paginatedQuery - Estado de paginação atual (`userPaginatedQuery`).
 * @param {Dispatch<SetStateAction<PaginatedQueryProps<any>>>} setPaginatedQuery - Setter do estado de paginação.
 * @return {object} Resultado da query de listagem (V3, `data.data.items`/`data.data.pagination`).
 */
export function useIntegrationDominioList(
  paginatedQuery: PaginatedQueryProps,
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>
) {
  return useCustomGridQuery<IntegrationDominioListItem, any>({
    asyncFunction: listIntegrationDominios,
    queryKey: queryKey.integrationDominios.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
  });
}

/**
 * Hidratação do formulário de Edit (`TASK-F121-FE-04`) — `useCustomFormQueryByGuid`
 * (Lei 2, `fillForm` nomeada com guarda `dirtyFields`, `resetForce=true` na
 * carga inicial). `fillForm` é OPCIONAL (default no-op) para reuso desta
 * mesma orquestração pela tela de Detalhe read-only (`TASK-F121-FE-05`), que
 * só precisa de `.data`/estado de carregamento, sem popular nenhum form.
 *
 * @param {string} [uuid] - uuid da rota (`undefined`/inválido = query desabilitada).
 * @param {Function} [fillForm] - Função nomeada com guarda `dirtyFields` (Lei 2); omitida na tela de Detalhe.
 * @return {object} Resultado da query de hidratação/leitura.
 */
export function useIntegrationDominioDetail(
  uuid: string | undefined,
  fillForm: (data: IntegrationDominioData, resetForce?: boolean) => void = () => {}
) {
  return useCustomFormQueryByGuid<IntegrationDominioData>({
    registrationId: uuid,
    queryKey: queryKey.integrationDominios.detail,
    asyncFunction: getIntegrationDominio,
    fillForm,
  });
}
