// src/pages/Configuracoes/Help/FilterSideHelp.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Tutoriais (Help, TASK-HP-06) — mesma casca
// global <FilterSide> de CentroCusto/FilterSideCentroCusto.tsx. Contrato B
// canônico: seis props exatas de `FilterModalProps<T>`, re-hidratação em
// `[isOpen]`. Contrato A (`onApply`/`onReset` sem `filter`) está aposentado —
// não usado aqui.
//
// Único filtro: `permission_uuid` (tela vinculada) — Select do lookup
// NÃO-paginado `/permissions/screens` via `SelectCombobox` (busca CLIENT-SIDE,
// `usePermissionScreens` compartilhado com `CreateOrUpdateHelp.tsx`). NUNCA
// `SelectAsyncPaginate` aqui (endpoint não pagina).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { SelectCombobox } from '@/components/Form/SelectCombobox';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { HelpFilterForm } from '@/@types/v2/Configuracoes/help';

import { usePermissionScreens } from './usePermissionScreens';

interface FilterSideHelpProps extends FilterModalProps<HelpFilterForm> {
  /** Contagem de filtros ativos — repassada ao badge do header do drawer. */
  filtersApplied?: number;
}

// Forma INTERNA do form (só deste componente) — o Select trabalha com
// `Option`, o submit converte para `HelpFilterForm` (uuid cru).
interface FilterFormValues {
  permission: Option<string> | null;
}

export function FilterSideHelp({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideHelpProps) {
  const text = languageGB.configuracoes.help.filter;
  const { options: screenOptions, isLoading: isLoadingScreens } = usePermissionScreens();

  const pristineFormValues: FilterFormValues = {
    permission: null,
  };

  function toInternalValues(rawFilter?: HelpFilterForm | null): FilterFormValues {
    return {
      permission:
        screenOptions.find((option) => option.value === rawFilter?.permission_uuid) ?? null,
    };
  }

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      permission_uuid: data.permission?.value || undefined,
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

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado — e só
  // com as opções de tela já carregadas (para o `find` de `toInternalValues`
  // conseguir resolver o label a partir do uuid persistido).
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen, screenOptions]);

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
            name="permission"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <SelectCombobox
                name={name}
                label={text.screen}
                placeholder={text.screenPlaceholder}
                value={value}
                onChange={onChange}
                options={screenOptions}
                loading={isLoadingScreens}
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
