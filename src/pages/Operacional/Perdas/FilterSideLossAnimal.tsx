// src/pages/Operacional/Perdas/FilterSideLossAnimal.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Perdas — Contrato B canônico
// (`FilterModalProps<T>`), mirror `Operacional/Weaning/FilterSideWeaning.tsx`.
// 4 campos (FLD-001..004 do legado, contrato de tela §7.3 linhas 1-4):
// Animal (`SelectAsyncPaginate`, mesmo lookup do formulário), Causa
// (`SelectAsyncPaginate`, catálogo `death-losses/active?cause=P`, mesmo
// lookup do formulário), Data início/Data fim (`Input type="date"`).
//
// ⚠️ Decisão aplicada (contrato §7.7.2): "Limpar" segue o comportamento
// PADRÃO do Contrato B (`handleResetFilters` — limpa os filtros locais e
// MANTÉM o usuário na tela de Perdas) — NÃO replicar a navegação legada para
// `death-animals`/"Mortes" (`DIV-001`, defeito conhecido do legado).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listAnimalOptions } from '@/services/v2/Animals/animal-service';
import { listDeathLossOptions } from '@/services/v2/DeathLosses/death-loss-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { AnimalOptionListItem } from '@/@types/v2/Animals';
import type { DeathLossOptionRef } from '@/@types/v2/DeathLosses';
import type { LossAnimalFilterForm } from '@/@types/v2/Operacional/Pecuaria/lossAnimal';

interface FilterFormValues {
  animal_uuid: LossAnimalFilterForm['animal_uuid'];
  cause_uuid: LossAnimalFilterForm['cause_uuid'];
  start_date: string;
  end_date: string;
}

const pristineFormValues: FilterFormValues = {
  animal_uuid: null,
  cause_uuid: null,
  start_date: '',
  end_date: '',
};

function toInternalValues(rawFilter?: LossAnimalFilterForm | null): FilterFormValues {
  return {
    animal_uuid: rawFilter?.animal_uuid ?? null,
    cause_uuid: rawFilter?.cause_uuid ?? null,
    start_date: rawFilter?.start_date ?? '',
    end_date: rawFilter?.end_date ?? '',
  };
}

export function FilterSideLossAnimal({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<LossAnimalFilterForm>) {
  const filterText = languageGB.lossAnimals.lossAnimal.filter;

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Re-hidratação obrigatória — deps SOMENTE [isOpen] (Contrato B canônico).
  useEffect(() => {
    if (!isOpen) return;
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      animal_uuid: data.animal_uuid ?? null,
      cause_uuid: data.cause_uuid ?? null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
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
            name="animal_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.animal}
                service={listAnimalOptions}
                mapOptions={(item: AnimalOptionListItem) => ({
                  label: item.label,
                  value: item.uuid,
                })}
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
            name="cause_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.cause}
                // Catálogo `death-losses/options?cause=P` — mesmo lookup do
                // formulário (contrato de tela §3.5/§7.7.1) — filtro fixo
                // `cause: 'P'`.
                service={listDeathLossOptions}
                mapOptions={(item: DeathLossOptionRef) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={() => ({ cause: 'P' })}
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
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={filterText.startDate}
              />
            )}
          />
          <Controller
            name="end_date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={filterText.endDate}
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
