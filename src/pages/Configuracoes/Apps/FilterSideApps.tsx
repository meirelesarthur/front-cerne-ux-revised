// src/pages/Configuracoes/Apps/FilterSideApps.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Aplicativos (App, TASK-APP-FE-01) — mesma
// casca global <FilterSide> de `Configuracoes/Help/FilterSideHelp.tsx`.
// Contrato B canônico: seis props exatas de `FilterModalProps<T>`,
// re-hidratação em `[isOpen]`. Contrato A (`onApply`/`onReset` sem `filter`)
// está aposentado — não usado aqui.
//
// 2 filtros, ambos Input de texto — SEM lookup, SEM select assíncrono
// (`platform`/`version`, App-contrato.md Seção 1: o backend faz WHERE
// exato, não `contains`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { AppFilterForm } from '@/@types/v2/Configuracoes/apps';

interface FilterSideAppsProps extends FilterModalProps<AppFilterForm> {
  /** Contagem de filtros ativos — repassada ao badge do header do drawer. */
  filtersApplied?: number;
}

// Forma INTERNA do form (só deste componente) — idêntica à `AppFilterForm`
// (sem Select/Option a converter, diferente do precedente Help).
interface FilterFormValues {
  platform: string;
  version: string;
}

export function FilterSideApps({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  filtersApplied,
}: FilterSideAppsProps) {
  const text = languageGB.configuracoes.app.filter;

  const pristineFormValues: FilterFormValues = {
    platform: '',
    version: '',
  };

  function toInternalValues(rawFilter?: AppFilterForm | null): FilterFormValues {
    return {
      platform: rawFilter?.platform ?? '',
      version: rawFilter?.version ?? '',
    };
  }

  const { register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      platform: data.platform.trim() || undefined,
      version: data.version.trim() || undefined,
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

          <Input
            label={text.platform}
            placeholder={text.platformPlaceholder}
            {...register('platform')}
          />

          <Input
            label={text.version}
            placeholder={text.versionPlaceholder}
            {...register('version')}
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
