// src/pages/Operacional/FeedlotSectors/FilterSideFeedlotSectors.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Setores (mesma casca global <FilterSide> de
// `FeedlotYards/FilterSideFeedlotYards.tsx` — referência estrutural PRIMÁRIA).
//
// Contrato B (`FilterModalProps<FeedlotSectorFilterForm>`, seis props exatas).
// Campos: `code` (text), `name` (text), `feedlot_yard_id`
// (`SelectAsyncPaginate`, contrato de tela §2.4/§5.3 — UM campo a mais que
// `FeedlotYardFilterForm`), `is_active` (Select Sim/Não via
// `feedlotSectorStatusOptions`). Re-hidratação por `[isOpen]` (não `[filter]`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { feedlotSectorStatusOptions } from '@/constants/FeedlotSectors/options/feedlot-sector-status-options';

import { listFeedlotYards } from '@/services/v2/FeedlotYards/feedlot-yard-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { FeedlotSectorFilterForm } from '@/@types/v2/FeedlotSectors';
import type { FeedlotYardListItem } from '@/@types/v2/FeedlotYards';

interface FilterSideFeedlotSectorsProps extends FilterModalProps<FeedlotSectorFilterForm> {
  /** Contagem de filtros ativos — repassada ao badge do header do drawer (aditivo/opcional). */
  filtersApplied?: number;
}

// Forma INTERNA do form (só deste componente) — `feedlot_yard_id`/`is_active`
// trabalham com `Option<T>` (o próprio contrato de `FeedlotSectorFilterForm`),
// o submit repassa esses `Option` inteiros ao `handleFilterChange` — a
// conversão para valor cru acontece só no ponto de chamada do serviço
// (`index.tsx`, `useFeedlotSectorsList`), mesmo racional de `FeedlotYard`.
interface FilterFormValues {
  code: string;
  name: string;
  feedlot_yard_id: Option<string> | null;
  is_active: Option<boolean> | null;
}

export function FilterSideFeedlotSectors({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideFeedlotSectorsProps) {
  const text = languageGB.feedlotSectors.feedlotSector.filter;
  const statusOptions = feedlotSectorStatusOptions.options(languageGB);

  const pristineFormValues: FilterFormValues = {
    code: '',
    name: '',
    feedlot_yard_id: null,
    is_active: null,
  };

  function toInternalValues(rawFilter?: FeedlotSectorFilterForm | null): FilterFormValues {
    return {
      code: rawFilter?.code ?? '',
      name: rawFilter?.name ?? '',
      feedlot_yard_id: rawFilter?.feedlot_yard_id ?? null,
      is_active: rawFilter?.is_active ?? null,
    };
  }

  const { register, control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      code: data.code.trim() || undefined,
      name: data.name.trim() || undefined,
      feedlot_yard_id: data.feedlot_yard_id ?? undefined,
      is_active: data.is_active ?? undefined,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
    onClose();
  }

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

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

          <Input label={text.code} placeholder={text.codePlaceholder} {...register('code')} />

          <Input label={text.name} placeholder={text.namePlaceholder} {...register('name')} />

          <Controller
            name="feedlot_yard_id"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={text.feedlotYard}
                placeholder={text.feedlotYardPlaceholder}
                service={listFeedlotYards}
                mapOptions={(item: FeedlotYardListItem) => ({ label: item.name, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  is_active: true,
                })}
                value={value ?? undefined}
                onChange={(option: any) => onChange(option ?? null)}
              />
            )}
          />

          <Controller
            name="is_active"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.isActive}
                placeholder={text.isActiveAll}
                name={name}
                value={value}
                onChange={onChange}
                options={statusOptions}
              />
            )}
          />
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={languageGB.defaltStrings.clearAllFilters}
            variant="ghost"
            p="0"
            height="4"
            onClick={handleResetFilters}
            type="button"
          />
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
