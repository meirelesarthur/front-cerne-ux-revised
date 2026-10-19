// src/pages/Financeiro/Contrato/FilterSideContrato.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Contratos (Contract — Financeiro, esteira
// 97-Esteiras/023, TASK-CTR-FE-07) — mesma casca `<FilterSide>` + `<Form
// formFilter>`/`Form.BodyFilter`/`Form.FooterFilter` (NUNCA `<VStack as=
// "form">` cru, regra inviolável do task-packet), mirror mecânico de
// `Administrativo/Solicitacao/FilterSideSolicitacao.tsx` e, para os 2
// `SelectAsyncPaginate`, de `CadastrosBase/EstoqueInicial/
// FilterSideEstoqueInicial.tsx`.
//
// Contrato de tela (`Contract-FrontEnd-contrato.md §3`/Tarefa `## Objetivo`):
// `search` (Input, ILIKE em `number`) + `provider_uuid` (`SelectAsyncPaginate`,
// `listProviderOptions`) + `employee_uuid` (`SelectAsyncPaginate`,
// `listEmployees` DIRETO — não existe `/employees/options` no backend, mesma
// técnica tolerante já usada por `parent_uuid` em
// `CreateOrUpdateSolicitacao.tsx`).
//
// `ContractFilterForm` (`@/@types/v2/Contracts`, TASK-CTR-FE-01, CONGELADO)
// só guarda `provider_uuid`/`employee_uuid` crus — SEM companion `*_label`
// (diferente de `OpeningBalanceFilterForm`). Ao reabrir o drawer com filtro
// já aplicado, a re-hidratação usa o próprio uuid como label provisório
// (mesma técnica tolerante documentada no contrato de tela §3 para
// `parent_uuid`) até o usuário digitar e o `SelectAsyncPaginate` resolver um
// label real — não há endpoint de detalhe avulso para resolver um label
// amigável sem essa técnica.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { listEmployees } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { EmployeeListItem } from '@/@types/v2/CadastrosBase/employee';
import type { ContractFilterForm } from '@/@types/v2/Contracts';

// Forma INTERNA do form (só deste componente) — os 2 Selects trabalham com
// `Option`, o submit converte para `ContractFilterForm` (uuid cru), mesmo
// padrão de `FilterSideSolicitacao`/`FilterSideEstoqueInicial`.
interface FilterFormValues {
  search: string;
  provider_uuid: Option<string> | null;
  employee_uuid: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  provider_uuid: null,
  employee_uuid: null,
};

export function FilterSideContrato({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<ContractFilterForm>) {
  const text = languageGB.contracts.contract.filter;

  function toInternalValues(rawFilter?: ContractFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      provider_uuid: rawFilter?.provider_uuid
        ? { value: rawFilter.provider_uuid, label: rawFilter.provider_uuid }
        : null,
      employee_uuid: rawFilter?.employee_uuid
        ? { value: rawFilter.employee_uuid, label: rawFilter.employee_uuid }
        : null,
    };
  }

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      provider_uuid: data.provider_uuid?.value || undefined,
      employee_uuid: data.employee_uuid?.value || undefined,
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
  // aplicado — deps SOMENTE `[isOpen]` (nunca `filter`: reagir a `filter`
  // clobaria o que o usuário está digitando dentro do drawer aberto).
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
            {text.title}
          </Text>

          <Input
            label={text.search}
            placeholder={languageGB.contracts.contract.filter.search}
            {...register('search')}
          />

          <Controller
            name="provider_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.provider}
                service={listProviderOptions}
                mapOptions={(item: ProviderOptionItem) => ({
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
            name="employee_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.employee}
                service={listEmployees}
                mapOptions={(item: EmployeeListItem) => ({
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
