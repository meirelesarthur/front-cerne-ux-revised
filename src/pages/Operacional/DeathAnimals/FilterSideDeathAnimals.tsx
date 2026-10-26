// src/pages/Operacional/DeathAnimals/FilterSideDeathAnimals.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Mortes — Contrato B canônico
// (`FilterModalProps<DeathAnimalFilterForm>`, seis props exatas), mirror
// `Operacional/Nascimentos/FilterSideNascimentos.tsx`/
// `FeedlotYards/FilterSideFeedlotYards.tsx`.
//
// 4 campos reais (`DeathAnimal-contrato-tela.md §2.4`/§5.3, mirror
// `FLT-01..04` do legado): `animal_identification` (texto livre) ·
// `cause_uuid` (`SelectAsyncPaginate` contra `listDeathLossOptions`,
// cause=M) · `start_date`/`end_date` (`DateInput`, ISO `Y-m-d`).
// Re-hidratação por `[isOpen]` (não `[filter]`). `<Form formFilter>` sempre.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listDeathLossOptions } from '@/services/v2/DeathLosses/death-loss-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { DeathAnimalFilterForm } from '@/@types/v2/DeathAnimals';
import type { DeathLossOptionRef } from '@/@types/v2/DeathLosses';

// `cause_label` é companion DISPLAY-ONLY de re-hidratação do
// `SelectAsyncPaginate` (mesma regra de `Nascimentos`/`Romaneios`) — não faz
// parte do `DeathAnimalFilterForm` real enviado ao servidor.
interface FilterFormValues {
  animal_identification: string;
  cause_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  animal_identification: '',
  cause_uuid: null,
  start_date: null,
  end_date: null,
};

interface FilterSideDeathAnimalsProps extends FilterModalProps<
  DeathAnimalFilterForm & { cause_label?: string }
> {
  /** Contagem de filtros ativos — repassada ao badge do header do drawer (aditivo/opcional). */
  filtersApplied?: number;
}

export function FilterSideDeathAnimals({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideDeathAnimalsProps) {
  const filterText = languageGB.deathAnimals.deathAnimal.filter;

  function toInternalValues(
    rawFilter?: (DeathAnimalFilterForm & { cause_label?: string }) | null
  ): FilterFormValues {
    return {
      animal_identification: rawFilter?.animal_identification ?? '',
      cause_uuid: rawFilter?.cause_uuid
        ? { value: rawFilter.cause_uuid, label: rawFilter.cause_label ?? rawFilter.cause_uuid }
        : null,
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
    };
  }

  const { control, handleSubmit, reset, register } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Re-hidratação obrigatória — dep SOMENTE [isOpen] (Contrato B canônico).
  useEffect(() => {
    if (!isOpen) return;
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      animal_identification: data.animal_identification?.trim() || undefined,
      cause_uuid: data.cause_uuid?.value || undefined,
      cause_label: data.cause_uuid?.label,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    } as DeathAnimalFilterForm & { cause_label?: string });
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
            {filterText.title}
          </Text>

          <Input
            label={filterText.animalIdentification}
            placeholder={filterText.animalIdentificationPlaceholder}
            {...register('animal_identification')}
          />

          <Controller
            name="cause_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.cause}
                placeholder={filterText.causePlaceholder}
                service={listDeathLossOptions}
                mapOptions={(item: DeathLossOptionRef) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={() => ({ cause: 'M' })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={filterText.startDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={filterText.endDate}>
                <DateInput value={value ?? null} onChange={onChange} />
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
