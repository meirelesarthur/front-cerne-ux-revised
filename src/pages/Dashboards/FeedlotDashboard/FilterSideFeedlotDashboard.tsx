// src/pages/Dashboards/FeedlotDashboard/FilterSideFeedlotDashboard.tsx
// Drawer de filtro da dashboard Lotação de Currais (execução 046,
// TASK-LC-FE-04) — Contrato B canônico (`FilterModalProps<T>`), com a
// cascata Pátio→Setores (`LC-CASCADE-01`): trocar o pátio recarrega os
// setores e SELECIONA TODOS (mirror do comportamento legado `AM-002`/`C-010`).
// `filter` é a forma Option-based (`FeedlotDashboardFilterForm`) — persistida
// assim na URL para não perder rótulo ao reabrir (ver nota no tipo).

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { queryKey } from '@/constants/query-key';

import { feedlotDashboardFilterSchema } from '@/validations/schemas/Dashboards/feedlotDashboard-filter-schema';

import { listSectorsByYard } from '@/services/v2/Dashboards/feedlotDashboard-service';
import { listFeedlotYards } from '@/services/v2/FeedlotYards/feedlot-yard-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { FeedlotDashboardFilterForm } from '@/@types/v2/Dashboards/feedlotDashboard';
import type { FeedlotYardListItem } from '@/@types/v2/FeedlotYards';

const pristineFormValues: FeedlotDashboardFilterForm = { yard: null, sectors: [] };

interface FilterSideFeedlotDashboardProps extends FilterModalProps<FeedlotDashboardFilterForm> {
  filtersApplied?: number;
}

export function FilterSideFeedlotDashboard({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideFeedlotDashboardProps) {
  const text = languageGB.dashboards.feedlotDashboard.filter;

  function toInternalValues(
    rawFilter?: FeedlotDashboardFilterForm | null
  ): FeedlotDashboardFilterForm {
    return {
      yard: rawFilter?.yard ?? null,
      sectors: rawFilter?.sectors ?? [],
    };
  }

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FeedlotDashboardFilterForm>({
    resolver: yupResolver(feedlotDashboardFilterSchema(languageGB)),
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  const selectedYard = watch('yard');

  const selectedYardUuid = selectedYard?.value;

  const sectorsQuery = useQuery({
    queryKey: [queryKey.dashboards.feedlotDashboardSectors, selectedYardUuid],
    queryFn: async () => {
      const response = await listSectorsByYard(selectedYardUuid!);
      return response.data;
    },
    enabled: !!selectedYardUuid,
  });

  const sectorOptions: Option<string>[] = (sectorsQuery.data ?? []).map((sector) => ({
    label: sector.name,
    value: sector.uuid,
  }));

  // Cascata `LC-CASCADE-01`: ao TROCAR o pátio (não na re-hidratação), os
  // setores carregados entram TODOS selecionados por padrão.
  function handleYardChange(option: Option<string> | null) {
    setValue('yard', option, { shouldDirty: true, shouldValidate: true });
    setValue('sectors', [], { shouldDirty: true });
  }

  useEffect(() => {
    if (!selectedYardUuid) return;
    if (!sectorsQuery.isSuccess) return;
    if (watch('sectors').length > 0) return; // já hidratado (reabertura) ou já escolhido
    setValue('sectors', sectorOptions, { shouldDirty: true, shouldValidate: true });
    // Roda só quando a lista de setores do pátio corrente resolve — `watch`/
    // `setValue`/`sectorOptions` são estáveis por render (RHF + derivado local).
  }, [sectorsQuery.isSuccess, sectorsQuery.data, selectedYardUuid]);

  function onSubmit(data: FeedlotDashboardFilterForm) {
    handleFilterChange(data);
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  return (
    <FilterSide
      isOpen={isOpen}
      onClose={onClose}
      languageGB={languageGB}
      filtersApplied={filtersApplied}
    >
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Controller
            name="yard"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.yard}
                error={errors.yard?.message}
                isRequired
                service={(params) => listFeedlotYards({ ...params, is_active: true })}
                mapOptions={(item: FeedlotYardListItem) => ({ label: item.name, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  name: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => handleYardChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="sectors"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.sectors}
                name={name}
                value={value}
                onChange={onChange}
                options={sectorOptions}
                multiple
                loading={sectorsQuery.isPending && !!selectedYard?.value}
                isDisabled={!selectedYard}
                error={errors.sectors?.message as string | undefined}
                isRequired
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
