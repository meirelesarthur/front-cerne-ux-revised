// src/pages/CadastrosBase/Emissores/useIssuers.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de EMISSORES NFe (Issuer) — mesmo padrão de
// CadastrosBase/CondicoesPagamento/usePaymentTerms.tsx.
//
// `useIssuerList` cobre a LISTAGEM (família Grid, paginação real).
// `useIssuerForm` cobre o detalhe/formulário (família Form por GUID).
// `useIssuerCertificate` cobre o status do certificado digital (`useQuery`
// simples — NÃO alimenta um form RHF, só exibe status, TASK-FE-320/324).
// `useFarmsList` popula o `CheckboxListField` "Fazendas Vinculadas"
// (TASK-FE-322) — lista pequena, sem paginação real (ver farm-service.ts).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { isValidGuid } from '@/utils/guid';

import { queryKey } from '@/constants/query-key';

import { listFarms } from '@/services/v2/Farms/farm-service';
import {
  getIssuerByUuid,
  listIssuers,
  viewIssuerCertificate,
} from '@/services/v2/Issuers/issuer-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { FarmRef } from '@/@types/v2/Farms';
import type {
  IssuerCertificateInfo,
  IssuerDetail,
  IssuerFilterForm,
  IssuerListItem,
} from '@/@types/v2/Issuers';

interface UseIssuerListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: IssuerFilterForm;
}

// Query de listagem de Emissores (filtros `search`/`is_enabled`/`issues_nfe`
// vão como query params reais — SEM `ambiente`, GAP-FE-114). Paginação REAL
// server-side — `per_page ?? 10`, mesmo default de todo o fork.
export function useIssuerList({ paginatedQuery, setPaginatedQuery, filter }: UseIssuerListProps) {
  return useCustomGridQuery<IssuerListItem, IssuerFilterForm>({
    asyncFunction: listIssuers,
    queryKey: queryKey.issuers.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as IssuerFilterForm),
  });
}

interface UseIssuerFormProps {
  registrationId?: string;
  fillForm: (data: IssuerDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID).
export function useIssuerForm({ registrationId, fillForm }: UseIssuerFormProps) {
  return useCustomFormQueryByGuid<IssuerDetail>({
    registrationId,
    queryKey: queryKey.issuers.detail,
    asyncFunction: getIssuerByUuid,
    fillForm,
  });
}

// Status do certificado digital (GET .../certificate) — `useQuery` simples,
// SEM `useCustomFormQueryByGuid` (não alimenta form RHF, só exibe status,
// contrato §3.4/TASK-FE-320). `data: null` = sem certificado cadastrado (não
// é erro); certificado ilegível vira 422 real (`isError`).
export function useIssuerCertificate(issuerUuid: string | undefined) {
  return useQuery({
    queryKey: [queryKey.issuers.certificate, issuerUuid],
    queryFn: async () => {
      if (!issuerUuid) throw new Error('uuid inválido');
      const response = await viewIssuerCertificate(issuerUuid);
      return response.data as IssuerCertificateInfo | null;
    },
    enabled: isValidGuid(issuerUuid),
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// Lista de fazendas do tenant corrente (picker "Fazendas Vinculadas") — sem
// paginação real no backend (GET /farms/current-tenant), busca é filtrada no
// CLIENTE pelo consumidor (CheckboxListField, contrato "busca controlada").
export function useFarmsList() {
  return useQuery<FarmRef[]>({
    queryKey: [queryKey.farms.list],
    queryFn: listFarms,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
