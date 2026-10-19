// src/pages/Operacional/Reproducao/GerenciamentoAvancado/useGerenciamentoAvancado.tsx
// -----------------------------------------------------------------------------
// Hook de listagem do módulo "Gerenciamento Avançado" (AdvancedReproductive —
// Operacional / Reprodução, F-011, 97-Esteiras/056, TASK-AR-FE-02). Mirror
// `useEstacoesDeMontaList` (`EstacaoDeMonta/useEstacoesDeMonta.tsx`) —
// `useCustomGridQuery` SEM ID de contexto: os 6 filtros vão via querystring,
// não há UUID pai de rota (roteiro-cirurgico-frontend-advanced-reproductive.md
// §6.2).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  listAdvancedReproductive,
  type ResponsePaginationWithIndicators,
} from '@/services/v2/AdvancedReproductive/advanced-reproductive-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  AdvancedReproductiveFilterForm,
  AdvancedReproductiveListItem,
} from '@/@types/v2/AdvancedReproductive';

import type { UseQueryResult } from '@tanstack/react-query';

interface UseGerenciamentoAvancadoListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: AdvancedReproductiveFilterForm;
}

// Listagem paginada REAL de servidor — mesmo shape de `useEstacoesDeMontaList`.
//
// NOTA DE TIPAGEM (roteiro §6.1/§6.2): `useCustomGridQuery` (genérico
// reutilizável, `@/hooks/useCustomGridQuery`) faz cast interno do retorno
// para `UseQueryResult<ResponsePagination<TData[]>>` — o shape BASE, sem o
// bloco `indicators` que `listAdvancedReproductive` ESTENDE (extensão
// documentada e obrigatória do envelope, não é campo opcional novo). O
// `asyncFunction` continua sendo literalmente `listAdvancedReproductive`
// (nenhuma duplicação/mock de fetch, Lei 3) — só o tipo de RETORNO do hook é
// corrigido aqui, de volta ao shape real que a função já devolve em runtime,
// para a tela poder ler `data?.data?.indicators` com segurança de tipos.
export function useGerenciamentoAvancadoList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseGerenciamentoAvancadoListProps): UseQueryResult<ResponsePaginationWithIndicators> {
  const query = useCustomGridQuery<AdvancedReproductiveListItem, AdvancedReproductiveFilterForm>({
    asyncFunction: listAdvancedReproductive,
    queryKey: queryKey.advancedReproductive.advancedReproductiveList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as AdvancedReproductiveFilterForm),
  });

  return query as unknown as UseQueryResult<ResponsePaginationWithIndicators>;
}
