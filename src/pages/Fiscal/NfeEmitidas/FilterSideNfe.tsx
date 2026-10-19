// src/pages/Fiscal/NfeEmitidas/FilterSideNfe.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de NFe Emitida — mirror `FilterSideInvoice.tsx`
// (Contrato B canônico de filtro). Campos 1:1 com `NfeIndexRequest::rules()`
// real (TASK-FE-036-403, contrato de tela §3): `client_id` (uuid,
// SelectAsyncPaginate sobre `/clients`), `estado` (Select com as 4 opções do
// enum), `emission_from`/`emission_to` (intervalo — mapeado pelo backend para
// `created_at`, ver nota de `@/@types/v2/Nfes`).
//
// **Correção NFE-R2-002 (REAUDITORIA-036-2a-rodada.md, esteira 036fix2):**
// `NfeIndexRequest::rules()` real (branch `feature/036-financeiro-fiscal`)
// passou a aceitar `numero_nfe`/`product_id`/`issuer_id`/`amount`/
// `harvest_id` — os 5 filtros do legado (`index.blade.php:41-76`) que a 1ª
// leva só tinha fechado no backend. Todos existence-only (mesmo padrão de
// `client_id`) — nunca 422.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { nfeEstadoOptions } from '@/constants/Fiscal/nfe-estado-options';

import { listClients } from '@/services/v2/CadastrosBase/Client/client-service';
import { listHarvests } from '@/services/v2/Harvests/harvest-service';
import { listIssuers } from '@/services/v2/Issuers/issuer-service';
import { listProducts } from '@/services/v2/Products/product-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { ClientListItem } from '@/@types/v2/CadastrosBase/client';
import type { NfeEstado, NfeFilterForm } from '@/@types/v2/Nfes';
import type { ProductListItem } from '@/@types/v2/Products';

// Forma INTERNA do form — o select de cliente/estado trabalha com `Option`,
// o submit converte para o shape cru de `NfeFilterForm`.
interface FilterFormValues {
  client_id: Option<string> | null;
  estado: Option<NfeEstado> | null;
  emission_from?: string | null;
  emission_to?: string | null;
  numero_nfe?: string | null;
  product_id: Option<string> | null;
  issuer_id: Option<string> | null;
  amount?: number | null;
  harvest_id: Option<string> | null;
}

export function FilterSideNfe({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<NfeFilterForm>) {
  const filterText = languageGB.nfes.nfe.filter;
  const estadoOptions = nfeEstadoOptions.options(languageGB);

  const pristineFormValues: FilterFormValues = {
    client_id: null,
    estado: null,
    emission_from: null,
    emission_to: null,
    numero_nfe: null,
    product_id: null,
    issuer_id: null,
    amount: null,
    harvest_id: null,
  };

  // NFE-R2-002 — `product_id`/`issuer_id`/`harvest_id` reabrem sem o rótulo
  // (a API de filtro devolve só o uuid aplicado, mesma limitação estrutural
  // já aceita para `client_id` acima nesta tela, SEM MOCK).
  function toInternalValues(rawFilter?: NfeFilterForm | null): FilterFormValues {
    return {
      client_id: null,
      estado: rawFilter?.estado
        ? (estadoOptions.find((option) => option.value === rawFilter.estado) ?? null)
        : null,
      emission_from: rawFilter?.emission_from ?? null,
      emission_to: rawFilter?.emission_to ?? null,
      numero_nfe: rawFilter?.numero_nfe ?? null,
      product_id: null,
      issuer_id: null,
      amount: rawFilter?.amount ?? null,
      harvest_id: null,
    };
  }

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      client_id: data.client_id?.value || undefined,
      estado: data.estado?.value || undefined,
      emission_from: data.emission_from || undefined,
      emission_to: data.emission_to || undefined,
      numero_nfe: data.numero_nfe?.trim() || undefined,
      product_id: data.product_id?.value || undefined,
      issuer_id: data.issuer_id?.value || undefined,
      amount: data.amount ?? undefined,
      harvest_id: data.harvest_id?.value || undefined,
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
            name="client_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.client}
                service={listClients}
                mapOptions={(item: ClientListItem) => ({
                  label: item.name,
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

          <Controller
            name="estado"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.estado}
                placeholder={filterText.estadoAll}
                name={name}
                value={value}
                onChange={(option) => onChange(option ?? null)}
                options={estadoOptions}
              />
            )}
          />

          {/* NFE-R2-002 — 5 filtros corrigidos na API real, restaurados
              aqui: Número NFe/Produto/Emissor/Valor/Safra, mirror legado
              (`index.blade.php:41-76`). */}
          <Controller
            name="numero_nfe"
            control={control}
            render={({ field }) => (
              <Input
                label={filterText.numeroNfe}
                name={field.name}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />

          <Controller
            name="product_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.product}
                service={listProducts}
                mapOptions={(item: ProductListItem) => ({
                  label: item.code ? `${item.code} — ${item.description}` : item.description,
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

          <Controller
            name="issuer_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.issuer}
                service={listIssuers}
                mapOptions={(item: { uuid: string; razao_social: string }) => ({
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

          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={filterText.amount}
                allowDot
                decimalPlaces={2}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
              />
            )}
          />

          <Controller
            name="harvest_id"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.harvest}
                service={listHarvests}
                mapOptions={(item: { uuid: string; description: string }) => ({
                  label: item.description,
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

          <Text fontSize="sm" fontWeight="medium">
            {filterText.emissionFrom}
          </Text>
          <Controller
            name="emission_from"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} />
            )}
          />

          <Text fontSize="sm" fontWeight="medium">
            {filterText.emissionTo}
          </Text>
          <Controller
            name="emission_to"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} />
            )}
          />
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
            variant="outline"
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
