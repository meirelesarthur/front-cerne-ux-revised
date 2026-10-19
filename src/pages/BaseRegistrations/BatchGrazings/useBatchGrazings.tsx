// src/pages/BaseRegistrations/BatchGrazings/useBatchGrazings.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo Lote/Módulo (BatchGrazing) — mirror
// `Atividades/useActivities.tsx` (família `useCustomGridQuery`/
// `useCustomFormQueryByGuid` + checklist server-side sem paginação real para
// os campos auxiliares do formulário). TASK-FE-2002/2003 (execução 029).
//
// `useBatchGrazingList`/`useBatchGrazingForm` são consumidos pela listagem
// (`index.tsx`, TASK-FE-2001) e pelo detalhe (`BatchGrazingDetalhe.tsx`,
// TASK-FE-2003). `useEligibleGrazingsChecklist`/`useEligibleBatchesChecklist`
// alimentam SÓ o formulário de criação (`CreateBatchGrazing.tsx`,
// TASK-FE-2002) — sem tela de CRUD própria para Módulo/Lote aqui (essas
// features já existem em `Grazings`/`Batches`, reaproveitadas em modo
// leitura).
//
// `useEligibleBatchesChecklist` — adicionado pela correção pós-E2E dos
// Achados 3+4 (TASK-FE-2005, `contrato-adendo-lotes-elegiveis-metricas.md`),
// SUBSTITUI o antigo `useBatchOptionsChecklist`/`GET /batches/options` nesta
// tela (removido — sem outro consumidor neste arquivo).
//
// `useEligibleGrazingsChecklist` — correção pós-reprovação de fidelidade
// (esteira 061-reprovacoes, `roteiro-lote-modulo-fidelidade.md §4.1`),
// SUBSTITUI o antigo `useGrazingModuleOptions` (fetch cru de
// `listGrazings`, que listava TODOS os módulos ativos, inclusive já
// vinculados — divergência de fidelidade contra
// `BatchGrazingController::create()` do legado, que nunca oferece um Módulo
// já vinculado). `GET /batch-grazings/eligible-grazings` (mirror
// `eligible-batches`) filtra server-side; se este endpoint ainda não
// existir no fork da API no momento em que este hook rodar, ele falha como
// dependência pendente do lado backend (Executor da API,
// `roteiro-lote-modulo-fidelidade.md §4.1 item 2`), não como bug de front.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getBatchGrazingByUuid,
  listBatchGrazings,
  listEligibleBatchesForGrazing,
  listEligibleGrazingsForBatchGrazing,
} from '@/services/v2/BaseRegistrations/batch-grazings-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  BatchGrazingData,
  BatchGrazingListItem,
} from '@/@types/v2/BaseRegistrations/batch-grazings';

interface UseBatchGrazingListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
}

// Query de listagem — SEM filtro (contrato de tela §2, mirror
// `Grazings/index.tsx`). `filter`/`filterQuery` sempre vazios — a família
// `useCustomGridQuery` exige o genérico, satisfeito aqui por
// `Record<string, never>`.
export function useBatchGrazingList({
  paginatedQuery,
  setPaginatedQuery,
}: UseBatchGrazingListProps) {
  return useCustomGridQuery<BatchGrazingListItem, Record<string, never>>({
    asyncFunction: listBatchGrazings,
    queryKey: queryKey.batchGrazings.batchGrazingsList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: {} as Record<string, never>,
  });
}

interface UseBatchGrazingFormProps {
  registrationId?: string;
  fillForm: (data: BatchGrazingData, resetForce?: boolean) => void;
}

// Query de detalhe — consumida pelo card de visualização (`BatchGrazingDetalhe.tsx`,
// SEM `useForm`/RHF, `fillForm` é um no-op ali — mirror `useCostCenterForm`
// consumido por `DetalheCentroCusto.tsx`) e, estruturalmente, poderia
// alimentar um formulário de edição futuro (que não existe — API sem
// `PUT`/`PATCH`, D1 do contrato de API).
export function useBatchGrazingForm({ registrationId, fillForm }: UseBatchGrazingFormProps) {
  return useCustomFormQueryByGuid<BatchGrazingData>({
    registrationId,
    queryKey: queryKey.batchGrazings.batchGrazing,
    asyncFunction: getBatchGrazingByUuid,
    fillForm,
  });
}

// Módulos de Pastejo ELEGÍVEIS — alimenta o Select single "Módulo" da
// criação (`CreateBatchGrazing.tsx`). Correção pós-reprovação de fidelidade
// (esteira 061-reprovacoes, `roteiro-lote-modulo-fidelidade.md §4.1`) —
// SUBSTITUI o antigo fetch cru de `listGrazings` (todos os módulos ativos,
// inclusive já vinculados): `GET /batch-grazings/eligible-grazings` (mirror
// `eligible-batches`) já filtra server-side (só módulos SEM lote vinculado,
// mirror `BatchGrazingController::create()` do legado) e devolve a
// Collection inteira em 1 fetch (SEM paginação) — o preview de Hectares
// continua funcionando via `EligibleGrazing.areas_sum_total_area`.
export function useEligibleGrazingsChecklist() {
  return useQuery({
    queryKey: [queryKey.batchGrazings.eligibleGrazings],
    queryFn: async () => {
      const response = await listEligibleGrazingsForBatchGrazing();
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

// Lotes ELEGÍVEIS — alimenta o `CheckboxListField` "Lote" da criação
// (correção pós-E2E Achados 3+4, TASK-FE-2005,
// `contrato-adendo-lotes-elegiveis-metricas.md`). SUBSTITUI o antigo
// `useBatchOptionsChecklist`/`GET /batches/options` NESTA TELA: aquele
// endpoint listava TODOS os lotes ativos (sem filtro de elegibilidade,
// Achado 4) e só devolvia `{uuid,label}`, sem `quantity_animal`/`weight`
// (Achado 3 — sem eles não há preview ao vivo). `GET /batch-grazings/
// eligible-batches` devolve SÓ os lotes elegíveis (ACTIVE, sem Módulo nem
// Área vinculado) + as 2 métricas agregadas — SEM a entrada sintética "Sem
// lote" (exclusiva de `BatchOption`).
//
// SEM `search` no servidor (D6 do adendo — dataset pequeno, ~14 lotes por
// fazenda) — 1 fetch da Collection inteira, filtro CLIENT-SIDE dentro do
// consumidor (mirror `listEligibleIssuersForSync`/`eligibleIssuersQuery`,
// `IssueDfeSyncTimes`). SEM `keepPreviousData` — não há refetch por tecla
// aqui (alinhado com `BatchAreas/useBatchAreas.tsx`: a versão antiga desta
// feature tinha `keepPreviousData` por engano, a irmã nunca teve; esta
// correção remove a divergência, já que nenhuma das duas re-dispara query
// por busca agora).
export function useEligibleBatchesChecklist() {
  return useQuery({
    queryKey: [queryKey.batchGrazings.eligibleBatches],
    queryFn: async () => {
      const response = await listEligibleBatchesForGrazing();
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}
