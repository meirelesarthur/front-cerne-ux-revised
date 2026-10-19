// src/pages/BaseRegistrations/BatchAreas/FilterSideBatchAreas.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Lote/Área (BatchArea) — TASK-FRONT-1,
// esteira 063-est03-9-reprovacoes (`lote-area-f143-roteiro.md §2`). Restaura
// os 2 filtros que existiam no legado (Lote/Área) e que a migração
// (execução 029) tinha deliberadamente omitido só para esta tela —
// `BatchGrazings` (módulo irmão) permanece SEM filtro, não é revertido por
// esta correção. Contrato B canônico (`get_pwa_grid_query_pattern` — seção
// "Contrato B — FilterModalProps<T>") — `<Form formFilter>`
// (`Form.BodyFilter`/`Form.FooterFilter`), NUNCA `<VStack as="form">` cru.
// Mirror estrutural de `FilterSideWarehouseTransfer.tsx`/
// `FilterSideNutrition.tsx`.
//
// `FilterModalProps<BatchAreaFilterForm>` — 6 props exatas.
// `BatchAreaFilterForm` (`@/@types/v2/BaseRegistrations/batch-areas`) já é
// Option-based (`{ area_uuid?: Option|null, batch_uuid?: Option|null }`) — o
// form RHF interno usa o próprio tipo, sem wrapper intermediário. O
// achatamento `Option` → querystring crua (`BatchAreaFilterRequest`)
// acontece em `BatchAreas/index.tsx::toRequestFilter`, NÃO aqui.
//
//   - Lote (`batch_uuid`) — `SelectAsyncPaginate` sobre
//     `listBatchOptionsForForm` (`@/services/v2/Batches/batch-service.ts`,
//     JÁ EXISTENTE — `GET /batches/options` com `include_empty:false`,
//     filtra o sentinela "Sem lote"). NÃO criar função nova (anti-clonagem,
//     Tarefa).
//   - Área (`area_uuid`) — `SelectAsyncPaginate` sobre `listAreaOptions`
//     (`@/services/v2/BaseRegistrations/areas-service.ts`, NOVA função desta
//     Tarefa) — `GET /areas/options?include_disabled=true`, farm-scoped pela
//     FAZENDA ATIVA (`X-Farm-Id`), TODAS as áreas da fazenda (incluindo
//     desabilitadas e já vinculadas) — NUNCA `eligible-areas` (esse endpoint
//     é exclusivo do picker de CRIAÇÃO, `CreateBatchArea.tsx`, com regra de
//     elegibilidade diferente).
//
// Re-hidratação obrigatória — `useEffect(() => reset(...), [isOpen])`
// (Checklist de nova tela / Contrato B, `get_pwa_grid_query_pattern`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listAreaOptions } from '@/services/v2/BaseRegistrations/areas-service';
import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { AreaOption } from '@/@types/v2/BaseRegistrations/areas';
import type { BatchAreaFilterForm } from '@/@types/v2/BaseRegistrations/batch-areas';
import type { BatchOption } from '@/@types/v2/Batches';

function mapBatchOption(item: BatchOption) {
  return { label: item.label, value: item.uuid };
}

function mapAreaOption(item: AreaOption) {
  return { label: item.description, value: item.uuid };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

const pristineFormValues: BatchAreaFilterForm = {
  area_uuid: null,
  batch_uuid: null,
};

export function FilterSideBatchAreas({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<BatchAreaFilterForm>) {
  const filterText = languageGB.baseRegistrations.batchArea.list.filter;

  const { control, handleSubmit, reset } = useForm<BatchAreaFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...filter,
    },
  });

  // Re-hidratação ao (re)abrir o drawer — deps SOMENTE [isOpen] (reagir a
  // `filter` clobaria o que o usuário está escolhendo com o drawer aberto).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...filter });
  }, [isOpen]);

  function onSubmit(data: BatchAreaFilterForm) {
    handleFilterChange({
      area_uuid: data.area_uuid ?? undefined,
      batch_uuid: data.batch_uuid ?? undefined,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({ ...pristineFormValues, ...filter });
    onClose();
  }

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filterText.title}
          </Text>

          <Controller
            name="batch_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.batch}
                placeholder={filterText.batchPlaceholder}
                service={listBatchOptionsForForm}
                mapOptions={mapBatchOption}
                findParams={findParamsFromSearch}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="area_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={filterText.area}
                placeholder={filterText.areaPlaceholder}
                service={listAreaOptions}
                mapOptions={mapAreaOption}
                findParams={findParamsFromSearch}
                value={value ?? null}
                onChange={(option: any) => onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={languageGB.defaltStrings.clearAllFilters}
            variant="ghost"
            p="0"
            color="semanticNeutral.900"
            height="4"
            marginTop="4"
            onClick={handleResetFilters}
            type="button"
          />
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}

export default FilterSideBatchAreas;
