// src/pages/Operacional/Processamentos/FilterSideProcessing.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Processamentos (TASK-FE-039-PROC-02,
// REWORK 039 PROC-09) — Contrato B canônico (`FilterModalProps<T>`), mirror
// `Operacional/Nascimentos/FilterSideNascimentos.tsx`.
//
// REWORK (FD-R2 desbloqueada) — o `index` agora aceita `batch_uuid`/
// `area_uuid`/`grazing_uuid` (resolvidos para id interno server-side). Os 3
// campos entram como `SelectAsyncPaginate`: `batch_uuid` ←
// `listBatchOptionsForForm` (round-4, D-02.1 — `ProcessingIndexRequest.
// batch_uuid` é `sometimes|uuid|exists`, NÃO aceita o sentinela `"0"`; ainda
// que este seja um filtro, dar semântica "sem lote" a ele exigiria um
// branch `whereNull` novo no `ProcessingRepository` — fora de escopo do
// round-4, registrado como melhoria futura); `area_uuid` ←
// `listAreas` (exige `farm_uuid`, injetado via closure a partir da fazenda
// ativa, mirror `listAreasForActiveFarm` de
// `Appropriations/FilterSideAppropriations.tsx`); `grazing_uuid` ←
// `listGrazings` (tenant-scoped só por `X-Farm-Id`, sem `farm_uuid`
// explícito). `area_uuid`⊕`grazing_uuid` exclusivos (`prohibits` no
// backend) — o front já desabilita/limpa o outro ao selecionar um dos dois,
// evitando um 422 evitável.
//
// `status` é enum estático (1=PENDING/2=FINISHED) — usa `Select` comum
// (`processingStatusOptions`), não `SelectAsyncPaginate` (sem lookup remoto).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useAuth } from '@/hooks/useAuth';

import { processingStatusOptions } from '@/constants/processamentos/processing/options/processing-status-options';
import type { ProcessingStatus } from '@/constants/processamentos/processing/processing-status';

import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import { listGrazings } from '@/services/v2/BaseRegistrations/grazings-service';
import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { GrazingListItem } from '@/@types/v2/BaseRegistrations/grazings';
import type { BatchOption } from '@/@types/v2/Batches';
import type { ProcessingFilterRequest } from '@/@types/v2/Processamentos/processing';

interface FilterFormValues {
  status: Option<ProcessingStatus> | null;
  batch_uuid: Option<string> | null;
  area_uuid: Option<string> | null;
  grazing_uuid: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  status: null,
  batch_uuid: null,
  area_uuid: null,
  grazing_uuid: null,
};

export function FilterSideProcessing({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ProcessingFilterRequest>) {
  const text = languageGB.processamentos.processing;
  const filterText = text.list.filter;
  const statusOptions = processingStatusOptions.options(languageGB);
  const { activeFarmUuid } = useAuth();

  // `listAreas` exige `farm_uuid` (`AreaIndexRequest::rules()`) — injetado
  // via closure a partir da fazenda ativa, mirror `listAreasForActiveFarm`.
  function listAreasForActiveFarm(params: { search?: string; page?: number; per_page?: number }) {
    return listAreas({ ...params, farm_uuid: activeFarmUuid ?? '' });
  }

  function toInternalValues(rawFilter?: ProcessingFilterRequest | null): FilterFormValues {
    return {
      status: rawFilter?.status
        ? (statusOptions.find((option) => option.value === rawFilter.status) ?? null)
        : null,
      batch_uuid: rawFilter?.batch_uuid
        ? { value: rawFilter.batch_uuid, label: rawFilter.batch_uuid }
        : null,
      area_uuid: rawFilter?.area_uuid
        ? { value: rawFilter.area_uuid, label: rawFilter.area_uuid }
        : null,
      grazing_uuid: rawFilter?.grazing_uuid
        ? { value: rawFilter.grazing_uuid, label: rawFilter.grazing_uuid }
        : null,
    };
  }

  const { control, handleSubmit, reset, setValue, watch } = useForm<FilterFormValues>({
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  // `area_uuid`⊕`grazing_uuid` exclusivos (`prohibits` no backend) — o front
  // limpa o outro campo ao selecionar um dos dois, evitando um 422 evitável.
  const watchedAreaUuid = watch('area_uuid');
  const watchedGrazingUuid = watch('grazing_uuid');

  // Re-hidratação obrigatória — deps SOMENTE [isOpen] (Contrato B canônico,
  // get_pwa_grid_query_pattern).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      status: data.status?.value ?? undefined,
      batch_uuid: data.batch_uuid?.value ?? undefined,
      area_uuid: data.area_uuid?.value ?? undefined,
      grazing_uuid: data.grazing_uuid?.value ?? undefined,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filterText.title}
          </Text>

          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={filterText.status}
                options={statusOptions}
                value={field.value ?? null}
                onChange={(option: Option<ProcessingStatus> | null) =>
                  field.onChange(option ?? null)
                }
              />
            )}
          />

          <Controller
            name="batch_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.batch}
                service={listBatchOptionsForForm}
                mapOptions={(item: BatchOption) => ({ label: item.label, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="area_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.area}
                isDisabled={!!watchedGrazingUuid}
                service={listAreasForActiveFarm}
                mapOptions={(item: AreaListItem) => ({ label: item.description, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  if (option) setValue('grazing_uuid', null, { shouldDirty: true });
                }}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="grazing_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.grazing}
                isDisabled={!!watchedAreaUuid}
                service={listGrazings}
                mapOptions={(item: GrazingListItem) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  if (option) setValue('area_uuid', null, { shouldDirty: true });
                }}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={languageGB.defaltStrings.clearAllFilters}
            variant="outline"
            onClick={handleResetFilters}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
