// src/pages/Dashboards/LivestockDashboard/FilterSideLivestockDashboard.tsx
// Drawer de filtro da dashboard Pecuária de Corte (execução 048, TASK-05-FE)
// — Contrato B canônico (`FilterModalProps<T>`), com a MESMA cascata
// Safra→datas de `FilterSideAbcIndicators.tsx` (`getHarvest`, já migrado,
// sem endpoint novo) — trocar a safra HIDRATA `startDate`/`endDate`, ambas
// continuam editáveis depois (mirror `SURF-006/007` do contrato
// normalizado). Diferente do ABC Corte, aqui NADA é obrigatório — o
// dashboard funciona com filtro vazio (mirror do racional de
// `AssetsDashboard`/`CashbookDashboard`, não do guard `ABC-GUARD-01`).

import { useEffect, useState } from 'react';

import { Text } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { dateOnlyToYmd } from '@/utils/dateOnlyToYmd';

import { livestockDashboardFilterSchema } from '@/validations/schemas/Dashboards/livestockDashboard-filter-schema';

import { listBreedOptions } from '@/services/v2/Breeds/breed-service';
import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';
import { getHarvest, listHarvestOptions } from '@/services/v2/Harvests/harvest-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { BreedOptionItem } from '@/@types/v2/Breeds/breed';
import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';
import type { LivestockDashboardFilterForm } from '@/@types/v2/Dashboards/livestockDashboard';

const pristineFormValues: LivestockDashboardFilterForm = {
  harvest: null,
  breed: null,
  category: null,
  startDate: null,
  endDate: null,
};

interface FilterSideLivestockDashboardProps extends FilterModalProps<LivestockDashboardFilterForm> {
  filtersApplied?: number;
}

export function FilterSideLivestockDashboard({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideLivestockDashboardProps) {
  const text = languageGB.dashboards.livestockDashboard.filter;

  function toInternalValues(
    rawFilter?: LivestockDashboardFilterForm | null
  ): LivestockDashboardFilterForm {
    return {
      harvest: rawFilter?.harvest ?? null,
      breed: rawFilter?.breed ?? null,
      category: rawFilter?.category ?? null,
      startDate: rawFilter?.startDate ?? null,
      endDate: rawFilter?.endDate ?? null,
    };
  }

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<LivestockDashboardFilterForm>({
    resolver: yupResolver(livestockDashboardFilterSchema(languageGB)),
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  const [isHydratingDates, setIsHydratingDates] = useState(false);
  const [harvestLookupFailed, setHarvestLookupFailed] = useState(false);

  // Cascata Safra→datas (mirror `ABC-CASCADE-01`) — dispara SÓ na troca do
  // campo, nunca sobrescreve datas já customizadas ao reabrir o drawer.
  async function handleHarvestChange(option: Option<string> | null) {
    setValue('harvest', option, { shouldDirty: true });
    setHarvestLookupFailed(false);
    if (!option) return;

    setIsHydratingDates(true);
    try {
      const response = await getHarvest(option.value);
      setValue('startDate', dateOnlyToYmd(response.data.start_date), {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue('endDate', dateOnlyToYmd(response.data.end_date), {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch {
      setHarvestLookupFailed(true);
    } finally {
      setIsHydratingDates(false);
    }
  }

  function onSubmit(data: LivestockDashboardFilterForm) {
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
            name="harvest"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.harvest}
                service={listHarvestOptions}
                mapOptions={(item: { uuid: string; description: string }) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => handleHarvestChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
          {harvestLookupFailed && (
            <Text fontSize="xs" color="feedBack.errorMain">
              {languageGB.dashboards.common.error.description}
            </Text>
          )}

          <Controller
            name="breed"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.breed}
                placeholder={text.breedAllPlaceholder}
                service={listBreedOptions}
                mapOptions={(item: BreedOptionItem) => ({ label: item.label, value: item.uuid })}
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
            name="category"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.category}
                placeholder={text.categoryAllPlaceholder}
                service={listCategoryAnimalOptions}
                mapOptions={(item: CategoryAnimalOptionItem) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  // `tenant_cost_center_scoped` (063-est03-9-reprovacoes,
                  // TASK-FE-063-11) — decisão do dono: Dashboard Pecuária
                  // escopado ao centro de custo do tenant ativo; `search`
                  // continua funcionando dentro do escopo (correção de
                  // `listOptionsForTenantCostCenter`).
                  tenant_cost_center_scoped: true,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="startDate"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.startDate} errorText={errors.startDate?.message}>
                <DateInput value={value ?? null} onChange={onChange} disabled={isHydratingDates} />
              </Field>
            )}
          />

          <Controller
            name="endDate"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.endDate} errorText={errors.endDate?.message}>
                <DateInput value={value ?? null} onChange={onChange} disabled={isHydratingDates} />
              </Field>
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
