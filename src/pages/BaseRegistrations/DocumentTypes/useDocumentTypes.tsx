// src/pages/BaseRegistrations/DocumentTypes/useDocumentTypes.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de TIPO DOCUMENTO (DocumentType — Administrativo /
// Gestão Documentos).
//
// `useDocumentTypesList` NÃO usa `useCustomGridQuery` (família Grid do
// projeto assume paginação real — `page`/`per_page`/`meta` — ver
// `get_pwa_grid_query_pattern`): a API de `DocumentType` devolve a árvore
// INTEIRA em uma única chamada (`ListDocumentTypesAction`, sem `meta` de
// paginação e SEM parâmetro `search`, diferente de `AccountingGrouper`). Por
// isso este hook é um `useQuery` DIRETO (TanStack Query), SEM argumento de
// filtro — o filtro (nome OU código) é aplicado DEPOIS, no componente, sobre
// `data` (ver "Diferenças reais" da TASK-DT-FE-01). Perfil de rede mirror
// exato de `useAccountingGroupersList`: `networkMode: "online"` +
// `staleTime: 0` + `gcTime: 5min` + `refetchOnWindowFocus: true`.
//
// TASK-DT-FE-01 cobriu só a LISTAGEM (useDocumentTypesList). TASK-DT-FE-02
// adiciona os hooks do formulário:
//   useDocumentTypeForm     — detalhe por GUID (`useCustomFormQueryByGuid`,
//                              "padrão da empresa para projetos novos", mesmo
//                              hook usado por `useAccountingGrouperForm`).
//   useDocumentTypeOptions  — lookup dedicado do Antecessor (`/document-types
//                              /options?except=`), usado pelo form para
//                              derivar o rótulo (`código — nome`) do pai
//                              ATUALMENTE selecionado. O `SelectAsyncPaginate`
//                              em si consome um adaptador PRÓPRIO
//                              (`listDocumentTypeOptionsForSelect`, definido
//                              em `CreateOrUpdateDocumentType.tsx`, mesma
//                              técnica de `listPlanAccountOptions`/
//                              `listAccountingGroupersForParent`) — chamada de
//                              rede independente do cache deste hook, porque
//                              o componente de Select precisa de uma função
//                              assíncrona simples (shape `ResponsePagination`),
//                              não do estado de um `useQuery`.
// -----------------------------------------------------------------------------

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';

import { queryKey } from '@/constants/query-key';

import {
  getDocumentType,
  listDocumentTypeOptions,
  listDocumentTypes,
} from '@/services/v2/DocumentTypes/document-type-service';

import type { DocumentTypeDetail } from '@/@types/v2/DocumentTypes';

// Modo ÚNICO — a árvore inteira, já ordenada por `code`. SEM argumento de
// filtro: `GET /document-types` não aceita `search` (ver nota de topo).
export function useDocumentTypesList() {
  return useQuery({
    queryKey: [queryKey.baseRegistrations.documentTypes.list],
    queryFn: () => listDocumentTypes(),
    networkMode: 'online',
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

interface UseDocumentTypeFormProps {
  registrationId?: string;
  fillForm: (data: DocumentTypeDetail, resetForce?: boolean) => void;
}

// TASK-DT-FE-02 — query de detalhe para preencher o formulário de edição
// (match por GUID). `useCustomFormQueryByGuid` (não `useCustomFormQueryById`)
// — ver nota de divergência de `[[DocumentType-contrato-tela]] §3`.
export function useDocumentTypeForm({ registrationId, fillForm }: UseDocumentTypeFormProps) {
  return useCustomFormQueryByGuid<DocumentTypeDetail>({
    registrationId,
    queryKey: queryKey.baseRegistrations.documentTypes.detail,
    asyncFunction: getDocumentType,
    fillForm,
  });
}

// TASK-DT-FE-02 — lookup dedicado do Antecessor. `exceptUuid` = uuid do
// próprio nó SÓ em modo edição (o servidor já resolve a exclusão de
// subárvore, `GAP-DT-03`) — `undefined` em modo criação (raiz ou
// descendente).
export function useDocumentTypeOptions(exceptUuid?: string) {
  return useQuery({
    queryKey: [queryKey.baseRegistrations.documentTypes.options, exceptUuid],
    queryFn: () => listDocumentTypeOptions({ except: exceptUuid }),
    networkMode: 'online',
    staleTime: 0,
  });
}
