// src/pages/Administrativo/Documentos/useDocumentManagements.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo "Documentos" (DocumentManagement — Administrativo /
// Gestão Documentos).
//
// `useDocumentManagementsList` — `document-managements` usa `listWithFilters()`
// + `paginate()` REAL (contrato de API §3.5), diferente da árvore sem
// paginação de `DocumentType` — por isso usa `useCustomGridQuery` (mirror
// `useIncomesList`/`Measurements`), NÃO `useQuery` direto (Tarefa 12).
//
// `useDocumentManagementForm` — `useCustomFormQueryByGuid` (mirror
// `useDocumentTypeForm`, "padrão da empresa para projetos novos", Tarefa 13).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getDocumentManagement,
  listDocumentManagements,
} from '@/services/v2/Documentos/document-management-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  DocumentManagementData,
  DocumentManagementFilterForm,
  DocumentManagementListItem,
} from '@/@types/v2/Documentos';

interface UseDocumentManagementsListProps {
  paginatedQuery: PaginatedQueryProps<DocumentManagementFilterForm>;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: DocumentManagementFilterForm;
}

export function useDocumentManagementsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseDocumentManagementsListProps) {
  return useCustomGridQuery<DocumentManagementListItem, DocumentManagementFilterForm>({
    asyncFunction: listDocumentManagements,
    queryKey: queryKey.baseRegistrations.documentManagements.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as DocumentManagementFilterForm),
  });
}

interface UseDocumentManagementFormProps {
  registrationId?: string;
  fillForm: (data: DocumentManagementData, resetForce?: boolean) => void;
}

export function useDocumentManagementForm({
  registrationId,
  fillForm,
}: UseDocumentManagementFormProps) {
  return useCustomFormQueryByGuid<DocumentManagementData>({
    registrationId,
    queryKey: queryKey.baseRegistrations.documentManagements.detail,
    asyncFunction: getDocumentManagement,
    fillForm,
  });
}
