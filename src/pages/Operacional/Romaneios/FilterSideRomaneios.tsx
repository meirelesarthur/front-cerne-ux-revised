// src/pages/Operacional/Romaneios/FilterSideRomaneios.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Romaneios — mesma casca global <FilterSide>
// + <Form formFilter>/<Form.BodyFilter>/<Form.FooterFilter> (Contrato B
// canônico), mirror `FilterSideEstoqueInicial.tsx` (SelectAsyncPaginate com
// re-hidratação por par uuid+label) + `FilterSideInventario.tsx` (Select
// bulk sobre `listProprietaryOptions`, mesmo endpoint gateado).
//
// 9 filtros reais (front-contract-romaneios.md §4.3 — a busca por número é
// SEPARADA, fica no toolbar do header, GAP-TRF-FE-06):
//   Produto · Cliente · Responsável · Proprietário Gestor · Tipo · Status ·
//   Gerado Financeiro · Dt. Início · Dt. Fim.
//
// Armadilha #3 da Tarefa — `financial` é TRI-ESTADO: serializado com `??`,
// NUNCA `||` (`financial === false` é "Não", valor legítimo).
//
// `proprietary_uuid` usa `GET /proprietaries/options` — gateado por
// `accounts_create|accounts_edit` (GAP-TRF-FE-14), permissão de OUTRO
// domínio. 403 aqui é degradação graciosa: campo desabilitado + hint, nunca
// erro fatal do drawer inteiro (o filtro é opcional).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { transferStatusOptions, transferTypeOptions } from '@/constants/transfers/options';

import { listClients } from '@/services/v2/CadastrosBase/Client/client-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import { listUsers } from '@/services/v2/Users/user-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { ClientListItem } from '@/@types/v2/CadastrosBase/client';
import type { ProductOption } from '@/@types/v2/Products';
import type { TransferFilterForm, TransferStatus, TransferType } from '@/@types/v2/Transfers';
import type { UserListItem } from '@/@types/v2/Users';

// Forma INTERNA do form — os selects relacionais trabalham com `Option`, o
// submit converte para o shape cru de `TransferFilterForm` (uuid + label
// companion, para re-hidratação sem request extra ao reabrir o drawer).
interface FilterFormValues {
  product_uuid: Option<string> | null;
  client_uuid: Option<string> | null;
  user_uuid: Option<string> | null;
  proprietary_uuid: Option<string> | null;
  type: Option<TransferType> | null;
  status: Option<TransferStatus> | null;
  financial: Option<'true' | 'false'> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineFormValues: FilterFormValues = {
  product_uuid: null,
  client_uuid: null,
  user_uuid: null,
  proprietary_uuid: null,
  type: null,
  status: null,
  financial: null,
  start_date: null,
  end_date: null,
};

export function FilterSideRomaneios({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<TransferFilterForm>) {
  const filterText = languageGB.transfers.transfer.filter;

  const typeOptions = transferTypeOptions.options(languageGB);
  const statusOptions = transferStatusOptions.options(languageGB);
  const financialOptions: Option<'true' | 'false'>[] = [
    { value: 'true', label: filterText.financialOptions.yes },
    { value: 'false', label: filterText.financialOptions.no },
  ];

  // Bulk fetch (1x, só enquanto o drawer está aberto) — `proprietaries/options`
  // é catálogo PLANO, sem paginação (mirror `FilterSideInventario.tsx`).
  // Gateado por `accounts_create|accounts_edit` (GAP-TRF-FE-14) — 403 vira
  // `isError`, tratado como degradação (campo desabilitado + hint), nunca
  // erro fatal do drawer.
  const proprietaryOptionsQuery = useQuery({
    queryKey: ['transfers-filter-proprietary-options'],
    queryFn: () => listProprietaryOptions(),
    enabled: isOpen,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const proprietaryOptions: Option<string>[] = (proprietaryOptionsQuery.data ?? []).map((item) => ({
    label: item.label,
    value: item.uuid,
  }));

  function toInternalValues(rawFilter?: TransferFilterForm | null): FilterFormValues {
    return {
      product_uuid: rawFilter?.product_uuid
        ? {
            value: rawFilter.product_uuid,
            label: rawFilter.product_label ?? rawFilter.product_uuid,
          }
        : null,
      client_uuid: rawFilter?.client_uuid
        ? { value: rawFilter.client_uuid, label: rawFilter.client_label ?? rawFilter.client_uuid }
        : null,
      user_uuid: rawFilter?.user_uuid
        ? { value: rawFilter.user_uuid, label: rawFilter.user_label ?? rawFilter.user_uuid }
        : null,
      proprietary_uuid: rawFilter?.proprietary_uuid
        ? {
            value: rawFilter.proprietary_uuid,
            label: rawFilter.proprietary_label ?? rawFilter.proprietary_uuid,
          }
        : null,
      type: rawFilter?.type
        ? (typeOptions.find((option) => option.value === rawFilter.type) ?? null)
        : null,
      status: rawFilter?.status
        ? (statusOptions.find((option) => option.value === rawFilter.status) ?? null)
        : null,
      // `!== undefined` — nunca `?` solto — para capturar `financial === false`.
      financial:
        rawFilter?.financial !== undefined
          ? (financialOptions.find((option) => option.value === String(rawFilter.financial)) ??
            null)
          : null,
      start_date: rawFilter?.start_date ?? null,
      end_date: rawFilter?.end_date ?? null,
    };
  }

  const { control, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado. Deps
  // SOMENTE [isOpen] — deliberado: reagir a `filter` clobaria o que o
  // usuário está digitando dentro do drawer aberto (mesma disciplina de
  // `FilterSideEstoqueInicial.tsx`/`FilterSideInventario.tsx`).
  useEffect(() => {
    if (!isOpen) return;
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      product_uuid: data.product_uuid?.value || undefined,
      product_label: data.product_uuid?.label,
      client_uuid: data.client_uuid?.value || undefined,
      client_label: data.client_uuid?.label,
      user_uuid: data.user_uuid?.value || undefined,
      user_label: data.user_uuid?.label,
      proprietary_uuid: data.proprietary_uuid?.value || undefined,
      proprietary_label: data.proprietary_uuid?.label,
      type: data.type?.value || undefined,
      status: data.status?.value || undefined,
      // `??`, NUNCA `||` — armadilha #3 da Tarefa (`financial === false` é
      // "Não", valor legítimo, e seria descartado por `||`).
      financial: data.financial ? data.financial.value === 'true' : undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
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
            name="product_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.product}
                service={listProductOptions}
                mapOptions={(item: ProductOption) => ({
                  label: `${item.code} — ${item.description}`,
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
            name="client_uuid"
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
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="user_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.responsible}
                service={listUsers}
                mapOptions={(item: UserListItem) => ({
                  label: item.name,
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
            name="proprietary_uuid"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.proprietary}
                name={name}
                value={value}
                onChange={onChange}
                options={proprietaryOptions}
                loading={proprietaryOptionsQuery.isLoading}
                isDisabled={proprietaryOptionsQuery.isError}
                helperText={
                  proprietaryOptionsQuery.isError
                    ? languageGB.defaltStrings.protectedRoute.noPermissionResource
                    : undefined
                }
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.type}
                placeholder={filterText.typeAll}
                name={name}
                value={value}
                onChange={onChange}
                options={typeOptions}
              />
            )}
          />

          <Controller
            name="status"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.status}
                placeholder={filterText.statusAll}
                name={name}
                value={value}
                onChange={onChange}
                options={statusOptions}
              />
            )}
          />

          <Controller
            name="financial"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.financial}
                placeholder={filterText.financialAll}
                name={name}
                value={value}
                onChange={onChange}
                options={financialOptions}
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
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
