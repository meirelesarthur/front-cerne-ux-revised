// src/pages/Operacional/FechamentoSemana/useFechamentoSemana.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de FECHAMENTO SEMANA (ClosingWeek) — mesmo padrão
// de `Operacional/Carregamento/useCarregamentos.tsx`:
//   - useClosingWeeksList → useCustomGridQuery (listagem paginada REAL de
//     servidor, TASK-FE-FS-02). SEM `registrationId` — Fechamento Semana é
//     listagem global da fazenda ativa (via `X-Farm-Id`), sem ID de contexto
//     pai. SEM filtro (fiel ao legado, CL-006) — `filterQuery: []`,
//     `filter: {}`.
//   - useClosingWeekDetail → hidratação por uuid (TASK-FE-FS-03), mirror
//     `useTransferDetail`/`usePersonDetail` (`useCustomFormQueryByGuid`, NÃO
//     `useCustomFormQueryById` — o id desta entidade é sempre GUID, mesmo
//     racional de `Romaneios`/`Pessoas`). `fillForm` é um NO-OP (`() =>
//     undefined`) — esta tela é 100% read-only, SEM `useForm`/RHF/`reset()`
//     (contrato de tela §5, DoD da Tarefa); o dado consumido é sempre
//     `customQuery.data` bruto, nunca um form hidratado.
//
// TASK-FE-FS-04 ADICIONA a este mesmo arquivo (`usePreviewClosingWeek`,
// `useStoreClosingWeek`):
//   - usePreviewClosingWeek → useMutation direto (mirror
//     `useBuildChargeTransferDraft`, `Operacional/Carregamento/
//     useCarregamentos.tsx`) — leitura PURA sob demanda do usuário
//     (`GET /closing-weeks/preview`), NUNCA auto-fetch/cache; o resultado vira
//     `previewData` (estado local do componente consumidor), não é cache de
//     servidor persistente.
//   - useStoreClosingWeek → `useRequest` (mirror `useFinishCharge`),
//     `typesRequest:'create'` — payload reduzido `{start_date,end_date}`
//     (DEC-FS-11/GAP-FS-05), toast + invalidação de
//     `queryKey.fechamentoSemana.closingWeeks` automáticos.
//
// Sem Zustand — paginação por `userPaginatedQuery` (Contexto React), dados
// de servidor só no TanStack Query.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useMutation } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import {
  getClosingWeek,
  listClosingWeeks,
  previewClosingWeek,
  storeClosingWeek,
} from '@/services/v2/FechamentoSemana/closing-week-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  ClosingWeekDetail,
  ClosingWeekListItem,
  ClosingWeekPreviewParams,
  StoreClosingWeekPayload,
} from '@/@types/v2/FechamentoSemana';

interface UseClosingWeeksListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
}

export function useClosingWeeksList({
  paginatedQuery,
  setPaginatedQuery,
}: UseClosingWeeksListProps) {
  return useCustomGridQuery<ClosingWeekListItem, Record<string, never>>({
    asyncFunction: listClosingWeeks,
    queryKey: queryKey.fechamentoSemana.closingWeeks,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: {},
  });
}

// `GET /closing-weeks/{uuid}` — tela de Detalhe (TASK-FE-FS-03). uuid
// malformado/ausente nunca dispara a query (`isValidGuid` interno do hook).
export function useClosingWeekDetail(closingWeekUuid: string | undefined) {
  return useCustomFormQueryByGuid<ClosingWeekDetail>({
    registrationId: closingWeekUuid,
    asyncFunction: getClosingWeek,
    fillForm: () => undefined,
    queryKey: queryKey.fechamentoSemana.closingWeek,
  });
}

// TASK-FE-FS-04 — cálculo do relatório server-driven (`GET /closing-weeks/
// preview`). `useMutation` direto (NÃO `useQuery`) — mirror
// `useBuildChargeTransferDraft`: só deve rodar quando o usuário clica
// "Gerar", nunca em background por invalidação de cache. Sem toast/redirect
// próprios — a tela decide o que fazer com `previewData`/erro.
export function usePreviewClosingWeek() {
  return useMutation({
    mutationFn: (params: ClosingWeekPreviewParams) => previewClosingWeek(params),
  });
}

interface UseStoreClosingWeekProps {
  actionSuccess: (data: ClosingWeekDetail) => void;
}

// TASK-FE-FS-04 — confirmação do Fechamento (`POST /closing-weeks`), mirror
// `useFinishCharge`. Payload SEMPRE `{start_date,end_date}` (DEC-FS-11/
// GAP-FS-05) — o servidor recomputa o relatório inteiro de novo, reutilizando
// a MESMA Action do preview.
export function useStoreClosingWeek({ actionSuccess }: UseStoreClosingWeekProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.fechamentoSemana.closingWeek;

  return useRequest<ClosingWeekDetail>({
    asyncFunction: (payload: StoreClosingWeekPayload) => storeClosingWeek(payload),
    queryKey: queryKey.fechamentoSemana.closingWeeks,
    typesRequest: 'create',
    entityName: text.singularLabel,
    personalizedMessage: text.report.savedToast,
    actionSuccess,
  });
}
