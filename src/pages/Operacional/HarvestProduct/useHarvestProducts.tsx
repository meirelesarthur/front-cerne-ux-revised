// src/pages/Operacional/HarvestProduct/useHarvestProducts.tsx
// -----------------------------------------------------------------------------
// Hooks de orquestração de dados (Colheita de Frutas — HarvestProduct,
// Operacional / Agricultura, F-040, execução 040, TASK-FE-1095). Sem lógica
// de fetch nos componentes (Lei 3) — a tela de listagem (TASK-FE-1096) e a de
// formulário (TASK-FE-1097) só consomem os hooks abaixo.
//
// Grid SEM ID de contexto (`useCustomGridQuery`, não `...ById`) — a listagem
// é farm-scoped pelo header `X-Farm-Id`, não por UUID pai (contrato §7.5).
// Form por UUID (`useCustomFormQueryById`, contrato §7.6).
// -----------------------------------------------------------------------------

import { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { isEmpty } from '@/utils/isEmpty';
import { formatPlateIfValid } from '@/utils/masks/plate';

import { queryKey } from '@/constants/query-key';

import {
  getAllHarvestProducts,
  getHarvestProduct,
} from '@/services/v2/HarvestProduct/harvestProduct-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  HarvestProductBoxForm,
  HarvestProductData,
  HarvestProductFilterRequest,
  HarvestProductForm,
} from '@/@types/v2/HarvestProduct';

interface UseHarvestProductsListProps {
  paginatedQuery: PaginatedQueryProps<HarvestProductFilterRequest>;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter: HarvestProductFilterRequest;
}

// Listagem — sem ID de contexto (a fazenda ativa vem do header `X-Farm-Id`,
// não de um UUID pai), `networkMode: 'online'`/`staleTime: 0` já embutidos em
// `useCustomGridQuery` (árvore de decisão do padrão para grid sem ID).
export function useHarvestProductsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseHarvestProductsListProps) {
  return useCustomGridQuery<HarvestProductData, HarvestProductFilterRequest>({
    asyncFunction: getAllHarvestProducts,
    queryKey: queryKey.harvestProducts.harvestProducts,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter,
  });
}

interface UseHarvestProductFormProps {
  uuid?: string;
  fillForm: (data: HarvestProductData, resetForce?: boolean) => void;
}

export function useHarvestProductForm({ uuid, fillForm }: UseHarvestProductFormProps) {
  return useCustomFormQueryById<HarvestProductData>({
    registrationId: uuid ?? '',
    queryKey: queryKey.harvestProducts.harvestProduct,
    asyncFunction: getHarvestProduct,
    fillForm,
  });
}

function mapBoxToFieldValue(box: HarvestProductData['boxes'][number]): HarvestProductBoxForm {
  return {
    uuid: box.uuid,
    amount: Number(box.amount),
  };
}

// Função NOMEADA (não arrow inline) — guarda `!isEmpty(dirtyFields) ||
// resetForce` (Lei 2), converte os 4 relacionamentos para `Option<string>` e
// `boxes` para `HarvestProductBoxForm[]`.
export function fillHarvestProductForm(
  reset: (values: HarvestProductForm) => void,
  dirtyFields: Record<string, any>,
  data: HarvestProductData,
  resetForce?: boolean
) {
  if (!isEmpty(dirtyFields) || resetForce) {
    reset({
      code: data.code,
      date: data.date,
      areaUuid: { value: data.area.uuid, label: data.area.description },
      clientUuid: { value: data.client.uuid, label: data.client.name ?? '—' },
      productUuid: { value: data.product.uuid, label: data.product.description },
      plate: formatPlateIfValid(data.plate),
      cityUuid: data.city
        ? {
            value: data.city.uuid,
            label: data.city.state_letter
              ? `${data.city.title} (${data.city.state_letter})`
              : data.city.title,
          }
        : null,
      driverName: data.driver_name ?? '',
      driverNif: data.driver_nif ?? '',
      boxes: data.boxes.length > 0 ? data.boxes.map(mapBoxToFieldValue) : [],
    });
  }
}
