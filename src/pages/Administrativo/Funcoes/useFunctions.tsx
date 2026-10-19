// src/pages/Administrativo/Funcoes/useFunctions.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de FUNÇÕES (Function) — mesmo padrão de
// CadastrosBase/Marcadores/useMarkers.tsx:
//   - useFunctionsList → useCustomGridQuery (listagem paginada REAL de
//     servidor + filtros `search`/`is_enabled`/`cbo_uuid`, TASK-FN-FE-01)
//   - useFunctionForm  → useCustomFormQueryByGuid (detalhe p/ formulário,
//     TASK-FN-FE-02) — mesmo hook usado por `useMarkerForm` (o molde
//     estrutural desta Tarefa, `Marcadores`), NÃO `useCustomFormQueryById`
//     (a variante sugerida genericamente pela ficha): o precedente REAL e
//     dominante em todo `CadastrosBase/*` para forms create/edit por GUID é
//     `useCustomFormQueryByGuid` (fonte de verdade real > tool/ficha
//     genérica) — confirmado por grep, dezenas de módulos já `✅ CONCLUÍDO`
//     usam esta variante, `useCustomFormQueryById` só aparece em 4 módulos
//     legados (ID numérico apesar do nome).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getFunction, listFunctions } from '@/services/v2/Functions/function-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { FunctionDetail, FunctionFilterForm, FunctionListItem } from '@/@types/v2/Functions';

interface UseFunctionsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: FunctionFilterForm;
}

// Query de listagem paginada de funções (filtros `search`/`is_enabled`/
// `cbo_uuid` vão como query params — ver ListFunctionsParams). Paginação REAL
// de servidor — mesmo shape de `useMarkersList`.
export function useFunctionsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseFunctionsListProps) {
  return useCustomGridQuery<FunctionListItem, FunctionFilterForm>({
    asyncFunction: listFunctions,
    queryKey: queryKey.functions.functionsList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as FunctionFilterForm),
  });
}

interface UseFunctionFormProps {
  registrationId?: string;
  fillForm: (data: FunctionDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID) —
// TASK-FN-FE-02. Mesmo padrão de `useMarkerForm` (Marcadores, molde
// estrutural desta Tarefa).
export function useFunctionForm({ registrationId, fillForm }: UseFunctionFormProps) {
  return useCustomFormQueryByGuid<FunctionDetail>({
    registrationId,
    queryKey: queryKey.functions.function,
    asyncFunction: getFunction,
    fillForm,
  });
}
