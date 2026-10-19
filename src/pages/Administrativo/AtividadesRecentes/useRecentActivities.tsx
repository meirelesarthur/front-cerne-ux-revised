// src/pages/Administrativo/AtividadesRecentes/useRecentActivities.tsx
// -----------------------------------------------------------------------------
// Hooks de query de ATIVIDADES RECENTES (UT-000690 / F-349), mirror de
// `Faltas/useAbsences.tsx`:
//   - useRecentActivitiesList → useCustomGridQuery (sem id pai: o contexto é o
//     `X-Farm-Id` do interceptor — AD-FE-04)
//   - useRecentActivityTypeOptions → useOptionsSelectQuery (`/types`); o label
//     vem da fábrica i18n, com fallback para o `label` da API (AD-FE-02).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useOptionsSelectQuery } from '@/hooks/useOptionsSelectQuery';

import { queryKey } from '@/constants/query-key';
import { recentActivityTypeOptions } from '@/constants/RecentActivities/options';

import {
  listRecentActivities,
  listRecentActivityTypes,
} from '@/services/v2/RecentActivities/recent-activity-service';

import type { LanguageDate } from '@/@types/language';
import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  RecentActivityFilterForm,
  RecentActivityListItem,
  RecentActivityTypeOption,
} from '@/@types/v2/RecentActivities';

interface UseRecentActivitiesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: RecentActivityFilterForm;
}

export function useRecentActivitiesList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseRecentActivitiesListProps) {
  return useCustomGridQuery<RecentActivityListItem, RecentActivityFilterForm>({
    asyncFunction: listRecentActivities,
    queryKey: queryKey.recentActivities.recentActivities,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as RecentActivityFilterForm),
  });
}

export function useRecentActivityTypeOptions(languageGB: LanguageDate, enabled = true) {
  return useOptionsSelectQuery<RecentActivityTypeOption, string>({
    asyncFunction: listRecentActivityTypes,
    queryKey: queryKey.recentActivities.recentActivityTypes,
    mapOption: (item) => ({
      value: item.value,
      label: recentActivityTypeOptions.getLabel(item.value, languageGB) ?? item.label,
    }),
    enabled,
  });
}
