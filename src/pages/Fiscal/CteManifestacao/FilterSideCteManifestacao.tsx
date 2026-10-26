// src/pages/Fiscal/CteManifestacao/FilterSideCteManifestacao.tsx
// -----------------------------------------------------------------------------
// Drawer de filtro da listagem de Manifestação de CT-e (TASK-CTE-FE-12).
// Contrato B canônico (`FilterModalProps<CteManifestacaoFilterForm>`, seis
// props exatas), mirror ESTRUTURAL `Fiscal/Dfe/FilterSideDfe.tsx` (mesmo
// domínio Fiscal, mesmo padrão de Combobox de Emissor via `listIssuers`).
//
// Campos (FL04-FL08, `CONTRATO-API-CTE-ONDA2.md §2`, R11/S40-S41):
// `issue_id` (Select assíncrono de emissores — GAP-CTE-FE-04, ver nota no
// componente), `search` (Input, filtra só `nome`), `start_date`/`end_date`
// (`DateInput`, preservados na UI por fidelidade visual — `DV13`: nota
// explícita de que NÃO filtram de fato, mirror do roteiro da Tarefa).
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

import { listIssuers } from '@/services/v2/Issuers/issuer-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { CteManifestacaoFilterForm } from '@/@types/v2/Fiscal/cteManifestacao';
import type { IssuerListItem } from '@/@types/v2/Issuers';

// Forma INTERNA do form — `issue_id` guarda o `Option` inteiro (label+value).
// GAP-CTE-FE-04: `value` é o `uuid` do emissor (única fonte real do SPA);
// `GET /cte-manifestacoes` real espera `integer` — ver nota no service/DTO.
interface FilterFormValues {
  issue_id: Option<string> | null;
  search: string;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  issue_id: null,
  search: '',
  start_date: null,
  end_date: null,
};

export function FilterSideCteManifestacao({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<CteManifestacaoFilterForm>) {
  const text = languageGB.cteManifestacoes.cteManifestacao.filter;

  // Sem endpoint de "buscar 1 emissor pelo uuid" dedicado a este drawer — o
  // label reidratado usa o próprio uuid como fallback visual até o usuário
  // reabrir o combobox (mesma limitação aceita em `FilterSideDfe.tsx`).
  function toInternalValues(rawFilter?: CteManifestacaoFilterForm | null): FilterFormValues {
    return {
      issue_id: rawFilter?.issue_id
        ? { label: rawFilter.issue_id, value: rawFilter.issue_id }
        : null,
      search: rawFilter?.search ?? '',
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
    };
  }

  const { control, register, handleSubmit, reset, watch } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { ...pristineFormValues, ...toInternalValues(filter) },
  });

  const dateFrom = watch('start_date');
  const dateTo = watch('end_date');
  const isDateRangeInvalid = !!dateFrom && !!dateTo && dateTo < dateFrom;

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      issue_id: data.issue_id?.value || undefined,
      search: data.search.trim() || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
    onClose();
  }

  // Re-hidratação — deps SOMENTE `[isOpen]` (nunca `[filter]`).
  useEffect(() => {
    reset({ ...pristineFormValues, ...toInternalValues(filter) });
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {text.title}
          </Text>

          <Controller
            name="issue_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.issuer}
                placeholder={text.issuerPlaceholder}
                service={listIssuers}
                mapOptions={(item: IssuerListItem) => ({
                  label: item.razao_social,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Input label={text.search} placeholder={text.searchPlaceholder} {...register('search')} />

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.startDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Field label={text.endDate}>
                <DateInput value={value ?? null} onChange={onChange} />
              </Field>
            )}
          />

          {isDateRangeInvalid && (
            <Text fontSize="xs" color="fg.error">
              {text.dateRangeInvalid}
            </Text>
          )}

          {/* DV13 — nota visual: os 2 campos de data acima são preservados na
              UI por fidelidade ao legado mas NÃO filtram (ignorados pelo
              backend, `ManifestaCteFilterData`). Não é bug de frontend. */}
          <Text fontSize="xs" color="fg.muted">
            {text.dateFilterNotSupportedNotice}
          </Text>
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

export default FilterSideCteManifestacao;
