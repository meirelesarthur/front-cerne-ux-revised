// src/pages/Dashboards/AbcIndicators/FilterSideAbcIndicators.tsx
// Drawer de filtro do Programa ABC Corte (execução 046, TASK-ABC-FE-04) —
// Contrato B canônico (`FilterModalProps<T>`), com a cascata Safra→datas
// (`ABC-CASCADE-01`): trocar a safra HIDRATA `startDate`/`endDate` (a safra
// só hidrata, não filtra o cálculo — `CLM-003` preservado). Reusa `getHarvest`
// (já migrado, sem endpoint novo, `CONTRATO-API-046-04-abc-indicators.md §1`).

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

import { abcIndicatorsFilterSchema } from '@/validations/schemas/Dashboards/abcIndicators-filter-schema';

import { listGrazings } from '@/services/v2/BaseRegistrations/grazings-service';
import { getHarvest, listHarvestOptions } from '@/services/v2/Harvests/harvest-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { GrazingListItem } from '@/@types/v2/BaseRegistrations/grazings';
import type { AbcIndicatorsFilterForm } from '@/@types/v2/Dashboards/abcIndicators';

const pristineFormValues: AbcIndicatorsFilterForm = {
  harvest: null,
  grazing: null,
  startDate: null,
  endDate: null,
};

// GAP-FE-247: `GET /harvests/{uuid}` intermitentemente devolve `start_date`/
// `end_date` como ISO 8601 completo (`2024-01-01T00:00:00.000000Z`) em vez do
// `Y-m-d` puro documentado no contrato — gravar o valor cru na cascata
// `ABC-CASCADE-01` reenviava esse formato ao filtro e o backend rejeitava com
// 422 "não corresponde ao formato Y-m-d". Normaliza para `yyyy-MM-dd` SEMPRE
// antes do `setValue` via `dateOnlyToYmd` (mesmo normalizador usado na
// montagem do request em `AbcIndicators/index.tsx` — a causa-raiz completa
// do 422 tinha uma 2ª etapa: `usePaginatedQueryUrl` reidrata essas datas
// como `Date` a cada sync de URL, ver comentário lá).

interface FilterSideAbcIndicatorsProps extends FilterModalProps<AbcIndicatorsFilterForm> {
  filtersApplied?: number;
}

export function FilterSideAbcIndicators({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideAbcIndicatorsProps) {
  const text = languageGB.dashboards.abcIndicators.filter;

  function toInternalValues(rawFilter?: AbcIndicatorsFilterForm | null): AbcIndicatorsFilterForm {
    return {
      harvest: rawFilter?.harvest ?? null,
      grazing: rawFilter?.grazing ?? null,
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
  } = useForm<AbcIndicatorsFilterForm>({
    resolver: yupResolver(abcIndicatorsFilterSchema(languageGB)),
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  const [isHydratingDates, setIsHydratingDates] = useState(false);
  const [harvestLookupFailed, setHarvestLookupFailed] = useState(false);

  // Cascata `ABC-CASCADE-01`: dispara SÓ na troca do campo (chamada direta,
  // não `useQuery` reativo) — a re-hidratação em `[isOpen]` NÃO deve
  // sobrescrever datas já customizadas pelo usuário na sessão anterior.
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
      // `ABC-CASCADE-01`: falha visível (não console.log) — mensagem inline abaixo do campo.
      setHarvestLookupFailed(true);
    } finally {
      setIsHydratingDates(false);
    }
  }

  function onSubmit(data: AbcIndicatorsFilterForm) {
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
            name="grazing"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.grazing}
                isRequired
                error={errors.grazing?.message}
                service={listGrazings}
                mapOptions={(item: GrazingListItem) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={() => ({})}
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
              <Field label={text.startDate} errorText={errors.startDate?.message} isRequired>
                <DateInput value={value ?? null} onChange={onChange} disabled={isHydratingDates} />
              </Field>
            )}
          />

          <Controller
            name="endDate"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.endDate} errorText={errors.endDate?.message} isRequired>
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
