// src/pages/Administrativo/BaixaEstoque/useStockWriteoffs.tsx
// -----------------------------------------------------------------------------
// Hooks de query/mutation do módulo BAIXA DE ESTOQUE (StockWriteoff) —
// esteira 038, fatia READ (TASK-FE-3001/3002/3003) + fatia WRITE (TASK-FE-3006,
// handoff "Emitir NFe"). Mirror `useServiceOrdersList`/`useAppropriations`
// (`useRevertAppropriationStatus`) — co-locamos os hooks de grid/mutação num
// arquivo próprio em vez da chamada inline na tela.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import {
  getAllStockWriteoffs,
  linkNfeToStockWriteoff,
} from '@/services/v2/StockWriteoffs/stock-writeoff-service';
import type { ListStockWriteoffsParams } from '@/services/v2/StockWriteoffs/stock-writeoff-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { StockWriteoffData, StockWriteoffFilterForm } from '@/@types/v2/StockWriteoffs';

interface UseStockWriteoffsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: StockWriteoffFilterForm;
}

export function useStockWriteoffsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseStockWriteoffsListProps) {
  return useCustomGridQuery<StockWriteoffData, ListStockWriteoffsParams>({
    asyncFunction: getAllStockWriteoffs,
    queryKey: queryKey.stockWriteoffs.stockWriteoffsList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as StockWriteoffFilterForm),
  });
}

// ============================================
// HANDOFF "EMITIR NFE" (TASK-FE-3006) — vínculo isolado (`POST /{uuid}/nfe`).
// NÃO É MAIS ACIONADO pelo fluxo padrão de "Emitir NFe" (exec-038, correção
// de fidelidade — mirror legado `StockWriteoffController@nfe()`: o clique
// agora NAVEGA para a criação de Nfe pré-preenchida em `/fiscal/nfe-
// emitidas/novo`, ver `index.tsx`/`BaixaEstoqueDetalhe.tsx::
// handleEmitirNfeClick`, SEM modal de vínculo a uma Nfe já existente).
// Mantido no service/hook para uso futuro (GAP documentado no handover:
// auto-vínculo do `nfe_uuid` da baixa após a Nfe pré-preenchida ser
// efetivamente criada/salva em `CreateOrUpdateNfe.tsx` — decisão do dono
// pendente). Invalida a LISTA (`stockWriteoffsList`) e o DETALHE
// (`stockWriteoff` — prefixo do array `[queryKey.stockWriteoffs.
// stockWriteoff, uuid]` usado no `useQuery` do Detalhe; `invalidateQueries`
// casa por prefixo, não precisa do `uuid` aqui) para o botão "Emitir NFe"
// desaparecer assim que `nfe_uuid` deixa de ser `null`.
// ============================================

interface UseLinkNfeToStockWriteoffProps {
  actionSuccess: (data: StockWriteoffData) => void;
}

export function useLinkNfeToStockWriteoff({ actionSuccess }: UseLinkNfeToStockWriteoffProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.stockWriteoffs.stockWriteoff;

  return useRequest<StockWriteoffData>({
    asyncFunction: async ({ uuid, nfeUuid }: { uuid: string; nfeUuid: string }) => {
      return await linkNfeToStockWriteoff(uuid, { nfe_uuid: nfeUuid });
    },
    queryKey: queryKey.stockWriteoffs.stockWriteoffsList,
    queryKey2: queryKey.stockWriteoffs.stockWriteoff,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.nfeHandoff.linkedToast,
    actionSuccess,
  });
}
