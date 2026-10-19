// src/pages/Operacional/Weaning/FilterSideWeaning.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Desmama — Contrato B canônico
// (`FilterModalProps<T>`), mirror `Operacional/Nascimentos/
// FilterSideNascimentos.tsx`.
//
// 1 campo real: `responsible_uuid` (`SelectAsyncPaginate`, lista de
// usuários via `listUsers`) — SEM a exclusão hardcoded `id=6` do legado
// (corrigida na API, `GAP-WN-02` Opção A; front só consome a lista já
// filtrada, mirror `WeaningFilterData`/`WeaningRepository` reais).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listUsers } from '@/services/v2/Users/user-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { UserListItem } from '@/@types/v2/Users';
import type { WeaningFilterForm } from '@/@types/v2/Weaning';

interface FilterFormValues {
  responsible_uuid: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  responsible_uuid: null,
};

export function FilterSideWeaning({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<WeaningFilterForm>) {
  const filterText = languageGB.weaning.weaning.filter;

  function toInternalValues(rawFilter?: WeaningFilterForm | null): FilterFormValues {
    return {
      responsible_uuid: rawFilter?.responsible_uuid
        ? {
            value: rawFilter.responsible_uuid,
            label: rawFilter.responsible_label ?? rawFilter.responsible_uuid,
          }
        : null,
    };
  }

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Re-hidratação obrigatória — deps SOMENTE [isOpen] (Contrato B canônico).
  useEffect(() => {
    if (!isOpen) return;
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      responsible_uuid: data.responsible_uuid?.value || undefined,
      responsible_label: data.responsible_uuid?.label,
    } as WeaningFilterForm);
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
            name="responsible_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.responsible}
                service={listUsers}
                mapOptions={(item: UserListItem) => ({ label: item.name, value: item.uuid })}
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
