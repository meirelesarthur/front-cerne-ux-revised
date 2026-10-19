// src/pages/CadastrosBase/Atividades/useActivities.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de ATIVIDADES (Activity) — mesmo padrão de
// CadastrosBase/TiposTitulo/useTypeTitles.tsx (paginação REAL, default 10).
//
// TASK-FE-025 cobre a fundação de dados (listagem + detalhe). As telas que
// consomem estes hooks (listagem/form/roteamento) são TASK-FE-026/027/028.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getActivityByUuid, listActivities } from '@/services/v2/Activities/activity-service';
import { listOperations } from '@/services/v2/Operations/operation-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { ActivityData, ActivityFilterForm, ActivityListItem } from '@/@types/v2/Activities';

interface UseActivityListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: ActivityFilterForm;
}

// Query de listagem de Atividades (filtros `search`/`type`/`use`/`is_enabled`/
// `operation_id` vão como query params reais — ver ListActivitiesParams). Usa
// `useCustomGridQuery` (família Grid padrão do projeto) com paginação REAL —
// `listActivities` já adapta o envelope paginado real para o shape
// `ResponsePagination` que este hook espera (nada de `meta:null` fixo).
export function useActivityList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseActivityListProps) {
  return useCustomGridQuery<ActivityListItem, ActivityFilterForm>({
    asyncFunction: listActivities,
    queryKey: queryKey.activities.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as ActivityFilterForm),
  });
}

interface UseActivityFormProps {
  registrationId?: string;
  fillForm: (data: ActivityData, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID),
// mesmo padrão de `useTypeTitleForm`/`useLowReasonForm`.
export function useActivityForm({ registrationId, fillForm }: UseActivityFormProps) {
  return useCustomFormQueryByGuid<ActivityData>({
    registrationId,
    queryKey: queryKey.activities.detail,
    asyncFunction: getActivityByUuid,
    fillForm,
  });
}

interface UseOperationsChecklistProps {
  search: string;
}

// Alimenta o `CheckboxListField` "Operações" de `CreateOrUpdateAtividade.tsx`
// (rodada visual 2, pós-E2E — substitui o `SelectAsyncPaginate isMulti`, cujo
// dropdown flutuante vazava do card/overflow). Não usa `useCustomGridQuery`
// (família de GRID paginada) porque este campo não pagina — é uma lista de
// checkboxes com busca, sem página/próxima-página.
//
// `per_page: 100` é o TETO de segurança do backend
// (`OperationIndexRequest::rules()`, `max:100`, Operation-contrato §9) — o
// maior lote permitido em uma única chamada. DECISÃO DOCUMENTADA (sem mock):
// se o tenant tiver mais de 100 Operações cadastradas, o primeiro lote não
// traz todas — o usuário localiza o restante pela busca (`search`,
// SERVER-SIDE, mesmo parâmetro usado pelo antigo `SelectAsyncPaginate`).
// Paginação incremental do checklist (scroll infinito) fica fora do escopo
// desta rodada visual; se o volume real de Operações por tenant crescer além
// disso, é um gap de UX a abrir separadamente.
export function useOperationsChecklist({ search }: UseOperationsChecklistProps) {
  return useQuery({
    queryKey: [queryKey.operations.list, search],
    queryFn: () => listOperations({ page: 1, per_page: 100, search: search || undefined }),
    staleTime: 30 * 1000,
    // Mantém a lista anterior visível enquanto a busca re-consulta o
    // backend — evita "flash" de lista vazia a cada tecla digitada.
    placeholderData: keepPreviousData,
  });
}
