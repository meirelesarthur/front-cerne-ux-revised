// src/pages/CadastrosBase/Funcionarios/useFuncionarios.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo "Funcionários" (Employee — Cadastros Base).
//
// TASK-EMP-FE-02 cobre a LISTAGEM (`useEmployeesList`, mirror direto de
// `useProviders.tsx`/`useProviderList` — `useCustomGridQuery`, sem ID pai).
// `useEmployeeForm` é ESQUELETO (mirror `useProviderForm`) para
// `TASK-EMP-FE-03` consumir — `fillForm` continua no-op porque a
// responsabilidade de popular o form (defaultValues síncronos ANTES do
// mount) já saiu do hook de busca neste padrão (mesma reconciliação já
// aplicada a `Provider`, ver `useProviders.tsx`).
//
// Achatamento do filtro (checklist item 19/armadilha #11 — `false`
// (Inativo) é valor válido, NUNCA `filter?.isEnabled?.value || undefined`,
// que descartaria `false`): `paginatedQuery.filter` guarda
// `EmployeeFilterForm` (com `isEnabled: Option<boolean> | null` completo,
// útil para re-hidratar o drawer — ver `FilterSideFuncionarios.tsx`); aqui
// é achatado para `ListEmployeesParams` (valores crus que
// `listEmployees`/`EmployeeFilterData` esperam, contrato `## 3.5`, DA-EMP-04
// — sem filtro de FK).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getEmployeeByUuid,
  listEmployees,
} from '@/services/v2/CadastrosBase/Employee/employee-service';
import type { ListEmployeesParams } from '@/services/v2/CadastrosBase/Employee/employee-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  EmployeeDetail,
  EmployeeFilterForm,
  EmployeeListItem,
} from '@/@types/v2/CadastrosBase/employee';

interface UseEmployeeListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: EmployeeFilterForm;
}

// Query de listagem paginada de Funcionários (`GET /api/v1/employees`,
// filtros `search`/`start_date`/`end_date`/`is_enabled` 100% server-side,
// checklist item 6 — `manualPagination` via `useCustomGridQuery`, mesmo
// mecanismo de `useProviderList`).
export function useEmployeesList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseEmployeeListProps) {
  return useCustomGridQuery<EmployeeListItem, ListEmployeesParams>({
    asyncFunction: listEmployees,
    queryKey: queryKey.cadastrosBase.employees,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: {
      search: filter?.search || undefined,
      start_date: filter?.startDate || undefined,
      end_date: filter?.endDate || undefined,
      // Armadilha #11/checklist item 19: `false` (Inativo) é valor válido —
      // NUNCA `filter?.isEnabled?.value || undefined` (descartaria `false`).
      is_enabled: filter?.isEnabled ? filter.isEnabled.value : undefined,
    },
  });
}

interface UseEmployeeFormProps {
  registrationId?: string;
}

// Esqueleto — `TASK-EMP-FE-03` liga a UI do formulário. `GET
// /employees/{uuid}` já devolve o detalhe completo (mirror
// `useProviderForm`/`getProviderByUuid`) — `{registrationId}` é o uuid do
// PAPEL Employee, nunca o da Person.
export function useEmployeeForm({ registrationId }: UseEmployeeFormProps) {
  return useCustomFormQueryByGuid<EmployeeDetail>({
    registrationId,
    queryKey: queryKey.cadastrosBase.employee,
    asyncFunction: getEmployeeByUuid,
    fillForm: () => {},
  });
}
