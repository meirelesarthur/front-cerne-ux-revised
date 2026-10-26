// src/pages/Administrativo/Solicitacao/FilterSideSolicitacao.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Solicitação de Compras (TASK-RP-FE-08) —
// mesma casca de `BaseRegistrations/DiagnosisPregnancy/
// FilterSideDiagnosisPregnancy.tsx`/`BaseRegistrations/Headbands/
// FilterSideHeadband.tsx` (`<Form formFilter>`, `Form.BodyFilter`/
// `Form.FooterFilter`, RE-HIDRATA via `useEffect([isOpen])` — NUNCA
// `<VStack as="form">` cru, regra inviolável do task-packet).
//
// Contrato de tela (contrato §3.1): `search` (Input, ILIKE em description/
// justification) + `type` (Select, fábrica `requestPurchaseTypeOptions`,
// 11 valores) + `status` (Select, fábrica `requestPurchaseStatusOptions`,
// 11 valores) + `date_from`/`date_to` (par `DateInput`+`Field`, único
// precedente do projeto: `BaseRegistrations/ParameterWeights/
// FilterSideParameterWeights.tsx`).
//
// Sem aviso client-side de "data final < data inicial" — a i18n do módulo
// (`languageRequestPurchases.filter`) não reserva uma chave própria para essa
// mensagem (diferente de `ParameterWeight.filter.dateRangeInvalid`); não
// introduzir string literal nova fora do escopo desta Tarefa (FE-03 já
// congelou o bloco de tradução).
//
// ADITIVO (TASK-CQ-FE-02, hub de Cotações, CL-058/CL-059 do roteiro de
// Cotações) — 4 campos que faltavam neste drawer (confirmado por leitura:
// só existiam `search/type/status/date_from/date_to`), mirror
// `RequestPurchaseFilterData` real (`api_root`, TASK-CQ-API-06):
// `farm_uuid` (`SelectAsyncPaginate` sobre `GET /farms`, admin paginado,
// já existente em `farm-admin-service.ts`), `user_uuid` (solicitante,
// `SelectAsyncPaginate` sobre `listUsers`), `priority` (`Select` sobre a
// fábrica `requestPurchasePriorityOptions` já existente), `responsible_uuid`
// (mesma fonte de `user_uuid`, mirror `FilterSideRomaneios.tsx`). Os 3
// campos relacionais usam companion `*_label` DISPLAY-ONLY no
// `RequestPurchaseFilterForm` para re-hidratar o `SelectAsyncPaginate` sem
// request extra ao reabrir o drawer (mesmo padrão de `TransferFilterForm`).
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
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { requestPurchasePriorityOptions } from '@/constants/RequestPurchases/options/request-purchase-priority-options';
import { requestPurchaseStatusOptions } from '@/constants/RequestPurchases/options/request-purchase-status-options';
import { requestPurchaseTypeOptions } from '@/constants/RequestPurchases/options/request-purchase-type-options';
import type { RequestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';

// `listFarms` de `farm-admin-service.ts` (CRUD administrativo, `GET /farms`,
// paginado REAL) — NÃO confundir com `listFarms` de `farm-service.ts`
// (`/farms/current-tenant`, sem paginação, service DIFERENTE); aliasado para
// deixar o propósito explícito no call site (mirror da distinção já
// documentada no cabeçalho de `farm-admin-service.ts`).
import { listFarms as listFarmOptions } from '@/services/v2/Farms/farm-admin-service';
import { listUsers } from '@/services/v2/Users/user-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { FarmDetail } from '@/@types/v2/Farms/farm-admin';
import type { RequestPurchaseFilterForm } from '@/@types/v2/RequestPurchases';
import type { UserListItem } from '@/@types/v2/Users';

// Forma INTERNA do form (só deste componente) — os Selects trabalham com
// `Option`, o submit converte para `RequestPurchaseFilterForm` (strings/
// números crus).
interface FilterFormValues {
  search?: string;
  type: Option<string> | null;
  status: Option<number> | null;
  date_from: string | null;
  date_to: string | null;
  farm_uuid: Option<string> | null;
  user_uuid: Option<string> | null;
  priority: Option<number> | null;
  responsible_uuid: Option<string> | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  type: null,
  status: null,
  date_from: null,
  date_to: null,
  farm_uuid: null,
  user_uuid: null,
  priority: null,
  responsible_uuid: null,
};

// ADITIVO (TASK-CQ-FE-13) — `statusOptions` opcional, default = lista
// completa (11 valores). O hub "Cotações" (`Administrativo/Cotacoes/
// index.tsx`) passa uma lista restrita ([solicitacao, cotacaoEmAndamento],
// FM-02) — a tela "Solicitação" (que NÃO passa a prop) continua vendo os 11
// valores, comportamento 100% preservado (aditivo, não regressivo).
//
// ADITIVO (execução 081, T-081-FE-01) — `visibleFields` opcional, default = todos
// os 9 campos (comportamento atual). Cada tela passa os campos do filtro do
// legado: Solicitação (search, status, type, datas), Rejeitados (search, type,
// datas), Cotações/Compras (todos os 9). O placeholder da busca passa a dizer
// "Pesquisar por descrição/chamado/código" (literal do legado).
export type SolicitacaoFilterField =
  | 'search'
  | 'type'
  | 'status'
  | 'date_from'
  | 'date_to'
  | 'farm_uuid'
  | 'user_uuid'
  | 'priority'
  | 'responsible_uuid';

export const allSolicitacaoFilterFields: SolicitacaoFilterField[] = [
  'search',
  'type',
  'status',
  'date_from',
  'date_to',
  'farm_uuid',
  'user_uuid',
  'priority',
  'responsible_uuid',
];

interface FilterSideSolicitacaoProps extends FilterModalProps<RequestPurchaseFilterForm> {
  statusOptions?: Option<RequestPurchaseStatus>[];
  visibleFields?: SolicitacaoFilterField[];
}

export function FilterSideSolicitacao({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
  statusOptions,
  visibleFields = allSolicitacaoFilterFields,
}: FilterSideSolicitacaoProps) {
  const isVisible = (field: SolicitacaoFilterField) => visibleFields.includes(field);
  const supplyFilters = languageGB.requestPurchases.requestPurchase.supply.filters;
  const typeOptions = requestPurchaseTypeOptions.options(languageGB);
  const resolvedStatusOptions = statusOptions ?? requestPurchaseStatusOptions.options(languageGB);
  const priorityOptions = requestPurchasePriorityOptions.options(languageGB);

  function toInternalValues(rawFilter?: RequestPurchaseFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      type: typeOptions.find((option) => option.value === rawFilter?.type) ?? null,
      status: resolvedStatusOptions.find((option) => option.value === rawFilter?.status) ?? null,
      date_from: rawFilter?.date_from ?? null,
      date_to: rawFilter?.date_to ?? null,
      // Companion `*_label` reconstrói o `Option` sem request extra (mirror
      // `FilterSideRomaneios.tsx::toInternalValues`) — fallback pro próprio
      // uuid quando o label ainda não foi persistido (defensivo).
      farm_uuid: rawFilter?.farm_uuid
        ? { value: rawFilter.farm_uuid, label: rawFilter.farm_label ?? rawFilter.farm_uuid }
        : null,
      user_uuid: rawFilter?.user_uuid
        ? { value: rawFilter.user_uuid, label: rawFilter.user_label ?? rawFilter.user_uuid }
        : null,
      priority: priorityOptions.find((option) => option.value === rawFilter?.priority) ?? null,
      responsible_uuid: rawFilter?.responsible_uuid
        ? {
            value: rawFilter.responsible_uuid,
            label: rawFilter.responsible_label ?? rawFilter.responsible_uuid,
          }
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
      type: (data.type?.value as RequestPurchaseFilterForm['type']) || undefined,
      status: data.status?.value ?? undefined,
      date_from: data.date_from || undefined,
      date_to: data.date_to || undefined,
      farm_uuid: data.farm_uuid?.value || undefined,
      farm_label: data.farm_uuid?.label,
      user_uuid: data.user_uuid?.value || undefined,
      user_label: data.user_uuid?.label,
      priority: data.priority?.value ?? undefined,
      responsible_uuid: data.responsible_uuid?.value || undefined,
      responsible_label: data.responsible_uuid?.label,
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
            {languageGB.requestPurchases.requestPurchase.filter.title}
          </Text>

          {isVisible('search') && (
            <Input
              label={languageGB.requestPurchases.requestPurchase.filter.search}
              placeholder={supplyFilters.searchPlaceholder}
              {...register('search')}
            />
          )}

          {isVisible('type') && (
            <Controller
              name="type"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={languageGB.requestPurchases.requestPurchase.filter.type}
                  name={name}
                  value={value}
                  onChange={onChange}
                  options={typeOptions}
                />
              )}
            />
          )}

          {isVisible('status') && (
            <Controller
              name="status"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={languageGB.requestPurchases.requestPurchase.filter.status}
                  name={name}
                  value={value}
                  onChange={onChange}
                  options={resolvedStatusOptions}
                />
              )}
            />
          )}

          {isVisible('date_from') && (
            <Controller
              name="date_from"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Field label={supplyFilters.dateStart}>
                  <DateInput value={value ?? null} onChange={onChange} />
                </Field>
              )}
            />
          )}

          {isVisible('date_to') && (
            <Controller
              name="date_to"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Field label={supplyFilters.dateEnd}>
                  <DateInput value={value ?? null} onChange={onChange} />
                </Field>
              )}
            />
          )}

          {/* ADITIVO (TASK-CQ-FE-02) — 4 campos abaixo, ver nota de cabeçalho
              do arquivo. */}
          {isVisible('farm_uuid') && (
            <Controller
              name="farm_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={languageGB.requestPurchases.requestPurchase.filter.farm}
                  service={listFarmOptions}
                  mapOptions={(item: FarmDetail) => ({
                    label: item.description,
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
          )}

          {isVisible('user_uuid') && (
            <Controller
              name="user_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={languageGB.requestPurchases.requestPurchase.filter.requester}
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
          )}

          {isVisible('priority') && (
            <Controller
              name="priority"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={languageGB.requestPurchases.requestPurchase.filter.priority}
                  name={name}
                  value={value}
                  onChange={onChange}
                  options={priorityOptions}
                />
              )}
            />
          )}

          {isVisible('responsible_uuid') && (
            <Controller
              name="responsible_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={languageGB.requestPurchases.requestPurchase.filter.responsible}
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
