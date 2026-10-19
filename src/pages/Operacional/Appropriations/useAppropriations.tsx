// src/pages/Operacional/Appropriations/useAppropriations.tsx
// -----------------------------------------------------------------------------
// Hooks de query/mutação do módulo Apontamentos (Appropriation) — mirror
// `Invoices/useInvoices.tsx`/`CadastrosBase/CentroCusto/useCostCenters.tsx`:
//   - useAppropriationsList        → useCustomGridQuery (listagem paginada +
//     filtros, TASK-FE-2706)
//   - useAppropriationForm         → useCustomFormQueryByGuid (detalhe p/
//     formulário/visualização/apropriar, TASK-FE-2707/2711/2712)
//   - useRevertAppropriationStatus → mutação reutilizada por Listagem
//     (TASK-FE-2706), Form (TASK-FE-2710) e Visualização (TASK-FE-2712)
//   - useFinishAppropriation       → mutação reutilizada pelo Form
//     (TASK-FE-2710) e Visualização (TASK-FE-2712)
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import {
  finishAppropriation,
  getAppropriation,
  listAppropriations,
  revertAppropriationStatus,
} from '@/services/v2/Appropriations/appropriation-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  AppropriationDetail,
  AppropriationFilterForm,
  AppropriationListItem,
  FinishAppropriationPayload,
} from '@/@types/v2/Appropriations';

interface UseAppropriationsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: AppropriationFilterForm;
}

export function useAppropriationsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseAppropriationsListProps) {
  return useCustomGridQuery<AppropriationListItem, AppropriationFilterForm>({
    asyncFunction: listAppropriations,
    queryKey: queryKey.appropriations.appropriations,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as AppropriationFilterForm),
  });
}

interface UseAppropriationFormProps {
  registrationId?: string;
  fillForm: (data: AppropriationDetail, resetForce?: boolean) => void;
}

export function useAppropriationForm({ registrationId, fillForm }: UseAppropriationFormProps) {
  return useCustomFormQueryByGuid<AppropriationDetail>({
    registrationId,
    queryKey: queryKey.appropriations.appropriation,
    asyncFunction: getAppropriation,
    fillForm,
  });
}

interface UseRevertAppropriationStatusProps {
  actionSuccess: (data: AppropriationDetail) => void;
}

export function useRevertAppropriationStatus({ actionSuccess }: UseRevertAppropriationStatusProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.appropriations.appropriation;

  return useRequest<AppropriationDetail>({
    asyncFunction: async ({ uuid, observation }: { uuid: string; observation: string }) => {
      return await revertAppropriationStatus(uuid, observation);
    },
    queryKey: queryKey.appropriations.appropriations,
    queryKey2: queryKey.appropriations.appropriation,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.revertStatusModal.revertedToast,
    actionSuccess,
  });
}

interface UseFinishAppropriationProps {
  actionSuccess: (data: AppropriationDetail) => void;
}

export function useFinishAppropriation({ actionSuccess }: UseFinishAppropriationProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.appropriations.appropriation;

  return useRequest<AppropriationDetail>({
    // GAP-BE-653 (TASK-FE-716, execução 034) — `payload` OPCIONAL (Horímetro
    // Final + Foto Final por equipamento); mantém a chamada sem payload
    // (comportamento pré-existente) quando a apropriação não tem
    // equipamento algum (D2 simetria). A invalidação de `queryKey2` abaixo
    // já cobre o `GET /appropriations/{uuid}` pós-finish exigido pelo
    // backend (a resposta do próprio `/finish` não recarrega os itens —
    // colateral confirmado, ver GAP-BE-653): a tela de destino
    // (`AppropriationDetalhe.tsx`) monta um NOVO `useQuery` com a mesma
    // chave, já marcada stale, e busca os dados frescos.
    asyncFunction: async ({
      uuid,
      payload,
    }: {
      uuid: string;
      payload?: FinishAppropriationPayload;
    }) => {
      return await finishAppropriation(uuid, payload);
    },
    queryKey: queryKey.appropriations.appropriations,
    queryKey2: queryKey.appropriations.appropriation,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.form.footer.finishedToast,
    actionSuccess,
  });
}
