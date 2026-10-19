// src/pages/CadastrosBase/NaturezaOperacao/useNatureOperations.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de NATUREZA DE OPERAÇÃO (NatureOperation) — mesmo
// padrão de CadastrosBase/InfoComplementares/useAdditionalInfo.tsx e
// CadastrosBase/RegrasFiscais/useTaxRules.tsx.
//
// TASK-NO-FE-01 cobriu só a LISTAGEM (useNatureOperationsList). TASK-NO-FE-02
// (este bloco) adiciona:
//   - useNatureOperationForm         → useCustomFormQueryByGuid (detalhe p/
//     formulário de criação/edição, mirror useTaxRuleForm).
//   - useNatureOperationFiscalOptions → DESVIO DOCUMENTADO (mirror
//     useTaxRuleOptions/Achado 2 da Tarefa): reaproveita o MESMO service
//     `getTaxRuleOptions` (`GET /tax-rules/options`, camada de serviço
//     compartilhada `src/services/v2/**` — import cross-módulo NORMAL nesta
//     camada) com a MESMA `queryKey: [queryKey.taxRules.options]` — cache
//     compartilhado entre `NaturezaOperacao` e `RegrasFiscais`, zero request
//     duplicado. `NatureOperation` reaproveita os MESMOS 7 enums fiscais de
//     `TaxRule` (contrato DA-NO-05) — nenhum endpoint novo, nenhuma lista
//     hardcoded duplicada.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getNatureOperation,
  listNatureOperations,
} from '@/services/v2/NatureOperations/nature-operation-service';
import { getTaxRuleOptions } from '@/services/v2/TaxRules/tax-rule-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  NatureOperationData,
  NatureOperationFilterForm,
  NatureOperationListItem,
} from '@/@types/v2/NatureOperations';
import type { TaxRuleOptionsData } from '@/@types/v2/TaxRules';

interface UseNatureOperationsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: NatureOperationFilterForm;
}

// Query de listagem paginada de Natureza de Operação (filtros
// `search`/`tipo`/`ativo` vão como query params — ver ListNatureOperationsParams).
export function useNatureOperationsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseNatureOperationsListProps) {
  return useCustomGridQuery<NatureOperationListItem, NatureOperationFilterForm>({
    asyncFunction: listNatureOperations,
    queryKey: queryKey.natureOperations.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as NatureOperationFilterForm),
  });
}

interface UseNatureOperationFormProps {
  registrationId?: string;
  fillForm: (data: NatureOperationData, resetForce?: boolean) => void;
}

// Query de detalhe (GUID) para popular o formulário de criação/edição —
// mirror mecânico de useTaxRuleForm.
export function useNatureOperationForm({ registrationId, fillForm }: UseNatureOperationFormProps) {
  return useCustomFormQueryByGuid<NatureOperationData>({
    registrationId,
    queryKey: queryKey.natureOperations.detail,
    asyncFunction: getNatureOperation,
    fillForm,
  });
}

// DESVIO DOCUMENTADO (mirror useTaxRuleOptions, Achado 2 da Tarefa): reaproveita
// o MESMO endpoint estático `/tax-rules/options` (8 chaves, nunca muda em
// runtime) via `useQuery` DIRETO do TanStack — não a família
// useCustomGridQuery*/useCustomFormQuery*. `queryKey` IDÊNTICA à de
// `useTaxRuleOptions` (`[queryKey.taxRules.options]`) — cache compartilhado
// entre os 2 módulos fiscais, zero request duplicado quando ambos estão
// montados na mesma sessão. `staleTime: Infinity` — dado 100% hardcoded no
// backend, nenhuma invalidação necessária.
export function useNatureOperationFiscalOptions() {
  return useQuery({
    queryKey: [queryKey.taxRules.options],
    queryFn: async () => {
      const response = await getTaxRuleOptions();
      return response.data as TaxRuleOptionsData;
    },
    staleTime: Infinity,
  });
}
