// src/components/Form/AllocationCostCenterSelect.tsx
// Select de Centro de Custo dos rateios — catálogo paginado/pesquisável de
// TODOS os centros analíticos do contratante (`scope=allocation`; ver
// `utils/allocationCostCenter.ts`). O `value` é controlado: o centro salvo
// (edição) permanece com seu rótulo mesmo fora da 1ª página do catálogo.

import {
  buildAllocationCostCenterParams,
  mapCostCenterRefToOption,
} from '@/utils/allocationCostCenter';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';

import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';

import { SelectAsyncPaginate } from './SelectAsyncPaginate';

interface AllocationCostCenterSelectProps {
  name: string;
  label?: string;
  placeholder?: string;
  value: Option<string> | null;
  onChange: (option: Option<string> | null) => void;
  error?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}

export function AllocationCostCenterSelect({
  name,
  label,
  placeholder,
  value,
  onChange,
  error,
  isRequired,
  isDisabled,
}: AllocationCostCenterSelectProps) {
  return (
    <SelectAsyncPaginate
      name={name}
      label={label}
      placeholder={placeholder}
      service={listCostCenterOptions}
      mapOptions={(item: CostCenterRef) => mapCostCenterRefToOption(item)}
      findParams={buildAllocationCostCenterParams()}
      value={value ?? null}
      onChange={(option: any) => onChange((option as Option<string> | null) ?? null)}
      error={error}
      isRequired={isRequired}
      isDisabled={isDisabled}
      menuPortalTarget={document.body}
      menuPosition="fixed"
    />
  );
}
