// src/pages/Operacional/FeedlotCorrals/FilterSideFeedlotCorrals.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Currais — TASK-043-CUR-T02 (F01,
// `02-Tela-Lista-Currais.md`). Mesma casca global <FilterSide> de
// `FeedlotSectors/FilterSideFeedlotSectors.tsx` (referência estrutural
// PRIMÁRIA) — Contrato B (`FilterModalProps<FeedlotCorralFilterForm>`, seis
// props exatas), re-hidratação por `[isOpen]`.
//
// Campos: `name` (text) · `feedlot_sector_id` (`SelectAsyncPaginate`, reusa
// `listFeedlotSectors`) · `status` (`Select`, `feedlotCorralStatusOptions`).
//
// DIVERGÊNCIA DECLARADA vs a leitura inicial do dev (Tarefa T02 menciona
// `installation_type`/`coverage` como filtro adicional): o contrato REAL do
// backend (`App\Data\FeedlotCorralFilterData`, GB.Cerne.Api) só aceita
// `feedlot_sector_id`/`status`/`name` — `installation_type`/`coverage` NÃO
// são filtro suportado (confirmado em código, não documentação). Enviar um
// param que o backend ignora seria pior que omiti-lo (Regra 7 — contrato da
// API é a fonte de verdade). `FeedlotCorralFilterForm`/`FilterRequest`
// (T01, `@types/v2/FeedlotCorrals`) já refletem essa realidade — reusados
// AS-IS, sem alteração. Reportado como divergência ao Architect/Tester.
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

import { feedlotCorralStatusOptions } from '@/constants/FeedlotCorrals/options/feedlot-corral-status-options';

import { listFeedlotSectors } from '@/services/v2/FeedlotSectors/feedlot-sector-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { FeedlotCorralFilterForm } from '@/@types/v2/FeedlotCorrals';
import type { FeedlotSectorListItem } from '@/@types/v2/FeedlotSectors';

interface FilterSideFeedlotCorralsProps extends FilterModalProps<FeedlotCorralFilterForm> {
  /** Contagem de filtros ativos — repassada ao badge do header do drawer (aditivo/opcional). */
  filtersApplied?: number;
}

// Forma INTERNA do form (só deste componente) — `feedlot_sector_id`/`status`
// trabalham com `Option<T>` (mesmo contrato de `FeedlotCorralFilterForm`); a
// conversão para valor cru acontece só no ponto de chamada do serviço
// (`index.tsx`, `useFeedlotCorralsList`), mesmo racional de `FeedlotSector`.
interface FilterFormValues {
  name: string;
  feedlot_sector_id: Option<string> | null;
  status: Option<string> | null;
}

export function FilterSideFeedlotCorrals({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideFeedlotCorralsProps) {
  const text = languageGB.feedlotCorrals.feedlotCorral.filter;
  const statusOptions = feedlotCorralStatusOptions.options(languageGB);

  const pristineFormValues: FilterFormValues = {
    name: '',
    feedlot_sector_id: null,
    status: null,
  };

  function toInternalValues(rawFilter?: FeedlotCorralFilterForm | null): FilterFormValues {
    return {
      name: rawFilter?.name ?? '',
      feedlot_sector_id: rawFilter?.feedlot_sector_id ?? null,
      status: rawFilter?.status ?? null,
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
      name: data.name.trim() || undefined,
      feedlot_sector_id: data.feedlot_sector_id ?? undefined,
      status: data.status ?? undefined,
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

          <Input label={text.name} placeholder={text.namePlaceholder} {...register('name')} />

          <Controller
            name="feedlot_sector_id"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectAsyncPaginate
                name={name}
                label={text.feedlotSector}
                placeholder={text.feedlotSectorPlaceholder}
                service={listFeedlotSectors}
                mapOptions={(item: FeedlotSectorListItem) => ({
                  label: item.name,
                  value: item.uuid,
                })}
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
            name="status"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={text.status}
                placeholder={text.statusAll}
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
