// src/pages/BaseRegistrations/AccountingGroupers/useAccountingGroupers.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de AGRUPADORES CONTÁBEIS (AccountingGrouper —
// Cadastros Base / Financeiros).
//
// `useAccountingGroupersList` NÃO usa `useCustomGridQuery` (família Grid do
// projeto assume paginação real — `page`/`per_page`/`meta` — ver
// `get_pwa_grid_query_pattern`): a API de `AccountingGrouper` devolve a
// árvore INTEIRA em uma única chamada (`ListAccountingGroupersAction`, sem
// `meta` de paginação). Por isso este hook é um `useQuery` DIRETO (TanStack
// Query) — mesmo racional de qualquer catálogo pequeno sem paginação
// server-side, sem forçar o array completo dentro do contrato
// `ResponsePagination`/`TableProvider` (que é semântica de GRID paginado).
// Perfil de rede alinhado ao `useCustomGridQuery` "sem ID de contexto"
// (listagem global): `networkMode: "online"` + `staleTime: 0` +
// `refetchOnWindowFocus: true` — a árvore sempre busca dado fresco ao focar
// a janela (TASK-ACG-01).
//
// TASK-ACG-01 cobriu só a LISTAGEM (useAccountingGroupersList). TASK-ACG-02
// adiciona `useAccountingGrouperForm` (detalhe/formulário) neste mesmo arquivo.
// -----------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';

import { queryKey } from '@/constants/query-key';

import {
  getAccountingGrouper,
  listAccountingGroupers,
} from '@/services/v2/AccountingGroupers/accounting-grouper-service';

import type {
  AccountingGrouperDetail,
  AccountingGrouperFilterForm,
} from '@/@types/v2/AccountingGroupers';

// Modo ÚNICO — a árvore inteira, já ordenada por depth/nested-set. Filtro
// `search` (name OU code) é o único parâmetro real do backend.
export function useAccountingGroupersList(filter?: AccountingGrouperFilterForm) {
  return useQuery({
    queryKey: [queryKey.baseRegistrations.accountingGroupers.list, filter],
    queryFn: () => listAccountingGroupers(filter),
    networkMode: 'online',
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

interface UseAccountingGrouperFormProps {
  registrationId?: string;
  fillForm: (data: AccountingGrouperDetail, resetForce?: boolean) => void;
}

// TASK-ACG-02 — query de detalhe para preencher o formulário de edição
// (match por GUID). Reaproveitado também para o PREVIEW do Antecessor (pai
// atual em edição, pai fixo em criar-descendente) — mesmo racional de
// `useGrouperForm` em `CreateOrUpdateAgrupador.tsx`.
export function useAccountingGrouperForm({
  registrationId,
  fillForm,
}: UseAccountingGrouperFormProps) {
  return useCustomFormQueryByGuid<AccountingGrouperDetail>({
    registrationId,
    queryKey: queryKey.baseRegistrations.accountingGroupers.detail,
    asyncFunction: getAccountingGrouper,
    fillForm,
  });
}
