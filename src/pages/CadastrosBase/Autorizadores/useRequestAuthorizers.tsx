// src/pages/CadastrosBase/Autorizadores/useRequestAuthorizers.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de AUTORIZADORES. SLICE 1 (Lote 06 / esteira 089,
// Frente C, F-141: Lista + visibilidade) trouxe:
//   - useRequestAuthorizersList → useCustomGridQuery (listagem paginada + filtro `search`)
// SLICE 2 (mesmo lote/esteira, frente C — Form criar/editar) ACRESCENTA:
//   - useRequestAuthorizerForm  → useCustomFormQueryById (detalhe p/ form, mirror useCostCenterForm)
//   - useFarmsCurrentTenantForAuthorizer → 1 fetch compartilhado de fazendas do
//     tenant corrente (§7.1 do contrato), reusado por TODAS as linhas de
//     `farms[]` via cache do TanStack (SelectCombobox, não 1 fetch por linha).
//     Reusa `listFarms()`/`queryKey.farms.list` JÁ existentes (mesma chave que
//     ~15 telas do projeto já compartilham para `GET /farms/current-tenant`)
//     — NÃO cria sub-chave nova (evita duplicar cache do MESMO endpoint).
//
// FIX P1 (Lote 06 / esteira 089, correção pós-Tester — F-141): `GET
// /request-authorizers` roda sob `farm.context` ESTRITO (`routes/api.php` —
// mesmo bloco físico de `request-purchases`/`warehouses`), exigindo
// `X-Farm-Id` em TODA ação (index/show), mesmo o `index` filtrando por
// TENANT INTEIRO (DA-AU-04) — o header é resolvido pelo interceptor Axios a
// partir de `localStorage['app-active-farm']` (`services/api.ts`), que só é
// garantidamente populado depois do boot de auth (`AuthContext.verifySession`
// → `saveProfile`) resolver. Como `<AuthProvider>` NÃO desmonta `{children}`
// enquanto `loading` (o `<Loading/>` é overlay IRMÃO — ver AuthContext/
// index.tsx), a tela de listagem pode montar e disparar a query ANTES do
// boot resolver, causando 403 "Header X-Farm-Id é obrigatório" em navegações
// frias (achado do Tester, rede real). `useRequestAuthorizersList` e
// `useRequestAuthorizerForm` passam a exigir `activeFarmUuid` (mesma fonte de
// `useAuth()` — `AuthContext.activeFarmUuid`, espelho reativo do MESMO
// localStorage lido pelo interceptor) resolvido antes de disparar — mesmo
// guard já usado por `useProductionCycleAreasCatalog`
// (CicloProducao/useProductionCycles.tsx, `enabled: !!activeFarmUuid`) e por
// `PesagemRodoviaria/CreateOrUpdateModuleWeighing.tsx`. NÃO inventa
// mecanismo novo: a LISTA reusa o parâmetro `enabled` que `useCustomGridQuery`
// já suporta (default `true`, hooks/useCustomGridQuery.tsx); o FORM reusa o
// gate de `registrationId` que `useCustomFormQueryById` já aplica (guard por
// GUID válido, hooks/useCustomFormQueryById.tsx) — aqui só compõe esse
// mesmo guard com a fazenda ativa, sem tocar no hook compartilhado.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listFarms } from '@/services/v2/Farms/farm-service';
import {
  getRequestAuthorizerByUuid,
  listRequestAuthorizers,
} from '@/services/v2/RequestAuthorizers/request-authorizer-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  RequestAuthorizerData,
  RequestAuthorizerFilterForm,
  RequestAuthorizerListItem,
} from '@/@types/v2/RequestAuthorizers';

interface UseRequestAuthorizersListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: RequestAuthorizerFilterForm;
  /**
   * Fazenda ativa (`useAuth().activeFarmUuid`) — FIX P1 (ver cabeçalho do
   * arquivo). `enabled: !!activeFarmUuid` represa a query até o boot de auth
   * resolver o `X-Farm-Id`, mesmo guard de `useProductionCycleAreasCatalog`
   * (CicloProducao/useProductionCycles.tsx).
   */
  activeFarmUuid?: string | null;
}

// Query de listagem paginada de autorizadores (filtro `search` — nome do
// usuário vinculado — vai como query param).
export function useRequestAuthorizersList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
  activeFarmUuid,
}: UseRequestAuthorizersListProps) {
  return useCustomGridQuery<RequestAuthorizerListItem, RequestAuthorizerFilterForm>({
    asyncFunction: listRequestAuthorizers,
    queryKey: queryKey.requestAuthorizers.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as RequestAuthorizerFilterForm),
    enabled: !!activeFarmUuid,
  });
}

interface UseRequestAuthorizerFormProps {
  registrationId?: string;
  fillForm: (data: RequestAuthorizerData, resetForce?: boolean) => void;
  /**
   * Fazenda ativa (`useAuth().activeFarmUuid`) — FIX P1 (ver cabeçalho do
   * arquivo). `GET /request-authorizers/{uuid}` está no MESMO bloco
   * `farm.context` ESTRITO do `index` — sem fazenda ativa resolvida, a query
   * de detalhe fica represada (mesmo racional da lista), reusando o guard
   * de GUID já existente em `useCustomFormQueryById` (registrationId vazio
   * = `enabled:false`).
   */
  activeFarmUuid?: string | null;
}

// Query de detalhe para preencher o formulário de edição (match por UUID).
export function useRequestAuthorizerForm({
  registrationId,
  fillForm,
  activeFarmUuid,
}: UseRequestAuthorizerFormProps) {
  return useCustomFormQueryById<RequestAuthorizerData>({
    registrationId: activeFarmUuid ? (registrationId ?? '') : '',
    queryKey: queryKey.requestAuthorizers.detail,
    asyncFunction: getRequestAuthorizerByUuid,
    fillForm,
  });
}

// Fazendas do TENANT CORRENTE (`GET /farms/current-tenant`, sem paginação,
// sem permissão cruzada) — 1 fetch compartilhado por TODAS as linhas de
// `farms[]` do form (nenhuma linha faz fetch própria). Reusa
// `queryKey.farms.list` (já o cache de `listFarms()` em ~15 telas do
// projeto) — mesmo endpoint, mesma chave, sem duplicar.
export function useFarmsCurrentTenantForAuthorizer() {
  return useQuery({
    queryKey: [queryKey.farms.list],
    queryFn: listFarms,
    refetchOnWindowFocus: false,
  });
}
