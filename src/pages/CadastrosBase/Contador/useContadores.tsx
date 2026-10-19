// src/pages/CadastrosBase/Contador/useContadores.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de CONTADOR (Escritório de Contabilidade) — mesmo
// padrão de PlanAccount/usePlanAccounts.tsx:
//   - useContadoresList          → useCustomGridQuery (listagem paginada + filtro `search`, TASK-CT-03a)
//   - useContadorForm            → useCustomFormQueryById (detalhe p/ formulário, TASK-CT-03b)
//   - useIssuesEligibleChecklist → useQuery direto (SEM paginação, TASK-CT-03b)
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getContador,
  listContadores,
  listEligibleIssues,
} from '@/services/v2/Contadores/contador-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { ContadorDetail, ContadorFilterForm, ContadorListItem } from '@/@types/v2/Contadores';

interface UseContadoresListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: ContadorFilterForm;
}

// Query de listagem paginada do Contador (filtro `search` — ILIKE em
// `razao_social`/`nome_fantasia`/`cnpj`, Contador-contrato §3).
export function useContadoresList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseContadoresListProps) {
  return useCustomGridQuery<ContadorListItem, ContadorFilterForm>({
    asyncFunction: listContadores,
    queryKey: queryKey.contadores.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as ContadorFilterForm),
  });
}

interface UseContadorFormProps {
  registrationId?: string;
  fillForm: (data: ContadorDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de criação/edição (match por
// GUID) — TASK-CT-03b.
export function useContadorForm({ registrationId, fillForm }: UseContadorFormProps) {
  return useCustomFormQueryById<ContadorDetail>({
    registrationId: registrationId ?? '',
    queryKey: queryKey.contadores.detail,
    asyncFunction: getContador,
    fillForm,
  });
}

// Alimenta o `CheckboxListField` "Emissores Fiscais" de
// `CreateOrUpdateContador.tsx` (TASK-CT-03b). `GET /contadores/issues-elegiveis`
// NÃO pagina e NÃO aceita `search` (contrato §3 — `ListEligibleIssuesAction`
// devolve a Collection inteira, lista pequena por design: elegíveis do
// tenant/farm atuais). Por isso este hook busca a lista completa UMA VEZ,
// sem parâmetro de busca — o filtro do `CheckboxListField` é aplicado
// CLIENT-SIDE sobre `data` já carregado, em `CreateOrUpdateContador.tsx`
// (mesmo racional documentado no contrato/Achado 1 da Tarefa).
export function useIssuesEligibleChecklist() {
  return useQuery({
    queryKey: [queryKey.contadores.issuesEligible],
    queryFn: async () => {
      const response = await listEligibleIssues();
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}
