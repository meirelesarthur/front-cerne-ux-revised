// src/pages/Administrativo/Documentos/FilterSideDocumentos.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Documentos (DocumentManagement) —
// Administrativo / Gestão Documentos, Tarefa 12. Casca `<FilterSide>` +
// `<Form formFilter>`/`<Form.BodyFilter>`/`<Form.FooterFilter>` — mirror de
// composição de `FilterSideParameterWeights.tsx` (par `date_from`/`date_to`
// via `DateInput`+`Field`) combinado com a técnica de adaptador
// client-side de `CreateOrUpdateDocumentType.tsx`
// (`listDocumentTypeOptionsForSelect` → `SelectAsyncPaginate`, endpoint FLAT
// sem paginação/search reais no backend, paginação aplicada CLIENT-SIDE).
//
// GAP-DOCUMENTOS-FE-02 (degradação graciosa, Opção A aplicada por default):
// `GET /document-types/options` NÃO aceita `document-managements_view` —
// perfil só-leitura (sem `_create`/`_edit`) receberia 403 ao popular o combo
// de Tipo de Documento. O adaptador abaixo captura o erro e devolve uma
// página VAZIA (mesmo racional de `FilterSideInventario.tsx` para
// `/family-equipments/options` quando a rede falha) — o campo de filtro por
// tipo fica vazio/silencioso para esse perfil, SEM quebrar o resto da tela
// (o filtro por período continua funcional).
//
// RE-HIDRATAÇÃO — único `useEffect([isOpen])`, SEM `filter` nas deps
// (clobber conhecido de `FilterSideClasses`/`FilterSideCategoriasProduto`).
// -----------------------------------------------------------------------------

import { useCallback, useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listDocumentTypeOptions } from '@/services/v2/DocumentTypes/document-type-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type { DocumentManagementFilterForm } from '@/@types/v2/Documentos';
import type { DocumentTypeOption } from '@/@types/v2/DocumentTypes';

interface ListDocumentTypeOptionsForFilterParams extends PaginationQueryParams {
  search?: string;
}

// Forma INTERNA do form — o combo de tipo trabalha com `Option` completo
// (label+value), o submit converte para `DocumentManagementFilterForm`
// (uuid cru + `document_type_label` companion, mirror `EquipmentFilterForm`).
// Datas nullable para o `DateInput` controlado.
interface FilterFormValues {
  document_type_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  document_type_uuid: null,
  start_date: null,
  end_date: null,
};

export function FilterSideDocumentos({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<DocumentManagementFilterForm>) {
  const filterText = languageGB.baseRegistrations.documentManagements.filter;

  function toInternalValues(rawFilter?: DocumentManagementFilterForm | null): FilterFormValues {
    return {
      document_type_uuid: rawFilter?.document_type_uuid
        ? {
            value: rawFilter.document_type_uuid,
            label: rawFilter.document_type_label ?? rawFilter.document_type_uuid,
          }
        : null,
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
    };
  }

  const { control, handleSubmit, reset, watch } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  const dateFrom = watch('start_date');
  const dateTo = watch('end_date');
  const isDateRangeInvalid = !!dateFrom && !!dateTo && dateTo < dateFrom;

  // Adaptador `ResponsePagination` sobre o endpoint FLAT `/document-types/options`
  // (mesma técnica de `listDocumentTypeOptionsForSelect`) — GAP-DOCUMENTOS-FE-02:
  // 403 (perfil só-`_view`) degrada para combo VAZIO, nunca quebra a tela.
  const listDocumentTypeOptionsForFilter = useCallback(
    async (
      params: ListDocumentTypeOptionsForFilterParams
    ): Promise<ResponsePagination<DocumentTypeOption[]>> => {
      try {
        const all = await listDocumentTypeOptions({});
        const filtered = params.search
          ? all.filter(
              (o) =>
                o.name.toLowerCase().includes(params.search!.toLowerCase()) ||
                o.code.toLowerCase().includes(params.search!.toLowerCase())
            )
          : all;

        const perPage = params.per_page ?? filtered.length ?? 1;
        const page = params.page ?? 1;
        const start = (page - 1) * perPage;
        const pageItems = filtered.slice(start, start + perPage);

        return {
          success: true,
          data: {
            items: pageItems,
            pagination: {
              total: filtered.length,
              count: pageItems.length,
              per_page: perPage,
              current_page: page,
              total_pages: Math.max(1, Math.ceil(filtered.length / perPage)),
            },
          },
        };
      } catch {
        // GAP-DOCUMENTOS-FE-02 — degradação graciosa: combo vazio, sem
        // quebrar o resto do drawer (busca por período continua funcional).
        return {
          success: true,
          data: {
            items: [],
            pagination: {
              total: 0,
              count: 0,
              per_page: params.per_page ?? 1,
              current_page: 1,
              total_pages: 1,
            },
          },
        };
      }
    },
    []
  );

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      document_type_uuid: data.document_type_uuid?.value || undefined,
      document_type_label: data.document_type_uuid?.label,
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
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
    onClose();
  }

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro REALMENTE
  // aplicado — deps SOMENTE `[isOpen]`.
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {filterText.title}
          </Text>

          <Controller
            name="document_type_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.documentType}
                placeholder={filterText.documentTypeAll}
                service={listDocumentTypeOptionsForFilter}
                mapOptions={(item: DocumentTypeOption) => ({
                  label: `${item.code} — ${item.name}`,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value}
                onChange={(option: any) => field.onChange(option ?? null)}
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

          {isDateRangeInvalid && (
            <Text fontSize="xs" color="fg.error">
              {filterText.dateRangeInvalid}
            </Text>
          )}
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={languageGB.defaltStrings.clearAllFilters}
            variant="ghost"
            p="0"
            color="semanticNeutral.900"
            height="4"
            marginTop="4"
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
