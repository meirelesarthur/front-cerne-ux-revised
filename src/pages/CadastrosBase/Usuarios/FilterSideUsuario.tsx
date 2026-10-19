// src/pages/CadastrosBase/Usuarios/FilterSideUsuario.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Usuários — TASK-FE-807. Mirror MECÂNICO
// obrigatório de `Administrativo/Funcoes/FilterSideFuncoes.tsx` (molde
// primário indicado pelo dev) — casca `<FilterSide>` → `<Form noPadding
// formFilter>` → `<Form.BodyFilter>` (campos) → `<Form.FooterFilter>`
// (Limpar/Aplicar). NUNCA `<VStack as="form">`.
//
// Contrato real (User-Frontend-Contrato.md §3.5, 7 campos):
//   Sempre visíveis: search, role_uuid, is_active, inactive_days, online.
//   Só para `Gestor_Plataf`: tenant_uuid, plan, tenant_status.
//
// Poda por papel: `usePermissions().hasRole('Gestor_Plataf')` — MESMO
// mecanismo já usado por `FilterSideFazendas.tsx`/`CentroCusto/index.tsx`
// (DEC-005/GAP-BE-032, exceção documentada em `usePermissions.ts`; grep
// confirmado antes de codar, não inventado).
//
// GAP DECLARADO (tenant_uuid/plan): a Tarefa pediu para "confirmar service
// existente — não inventar" para o endpoint de tenants e o catálogo de
// planos. Confirmado por grep: NENHUM dos dois existe no `frontend_root`
// hoje (nenhum `tenant-service.ts`/`plan-service.ts`, nenhum `TenantOption`/
// `PlanOption`). SEM MOCK: em vez de inventar um service ou uma lista de
// opções fictícia, os dois campos usam `Input` de texto livre — MESMO
// precedente já aceito no fork para a idêntica lacuna (`FilterSideFazendas
// .tsx`, `tenant_id` como `NumberInput` cru, GAP-FE-122, "não há endpoint que
// devolva uuid+id numérico de Tenant ao mesmo tempo"). `tenant_uuid`/`plan`
// aqui também batem o próprio contrato: `UserFilterData.plan` é "string
// solta (sem enum)" — um Input de texto é a representação MAIS fiel ao que
// realmente existe, não uma degradação. Reportado no resumo da entrega.
//
// `is_active`/`online` SEMPRE com `??`, nunca `||` (armadilha documentada em
// `FilterSideFuncoes.tsx` — `false`/"Inativo" é falsy e seria descartado por
// `||`).
//
// Re-hidratação: ÚNICO `useEffect` com deps `[isOpen]` (nunca `[filter]`) —
// reagir a `filter` clobaria o que o usuário está digitando no drawer aberto.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { FilterSide } from '@/components/FilterSide';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { usePermissions } from '@/hooks/usePermissions';

import {
  tenantStatusOptions,
  userActiveOptions,
  userInactiveDaysOptions,
  userOnlineOptions,
  type TenantStatus,
} from '@/constants/Users';

import { listRoles } from '@/services/v2/Roles/role-service';

import type { FilterModalProps } from '@/@types/filter-modal';
import type { Option } from '@/@types/option';
import type { RoleListItem } from '@/@types/v2/Roles';
import type { UserFilterForm } from '@/@types/v2/Users';

// Forma INTERNA do form (só deste componente) — os Selects/SelectAsyncPaginate
// trabalham com `Option`, o submit converte para `UserFilterForm` (strings/
// números crus). `tenant_uuid`/`plan` ficam como string crua mesmo aqui — são
// `Input` de texto livre (ver nota de cabeçalho, GAP tenant/plan).
interface FilterFormValues {
  search?: string;
  role_uuid: Option<string> | null;
  is_active: Option<'true' | 'false'> | null;
  inactive_days: Option<number | undefined> | null;
  online: Option<'true' | 'false'> | null;
  tenant_uuid: string;
  plan: string;
  tenant_status: Option<TenantStatus> | null;
}

const pristineFormValues: FilterFormValues = {
  search: '',
  role_uuid: null,
  is_active: null,
  inactive_days: null,
  online: null,
  tenant_uuid: '',
  plan: '',
  tenant_status: null,
};

export function FilterSideUsuario({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<UserFilterForm>) {
  const { hasRole } = usePermissions();
  // §3.5 do contrato — os 3 últimos campos (tenant_uuid/plan/tenant_status)
  // só existem para `Gestor_Plataf` (papel de plataforma, não permissão
  // dedicada — mesma exceção documentada em `usePermissions.ts`).
  const isGestorPlataforma = hasRole('Gestor_Plataf');

  // Var local renomeada p/ `filterText` — evita colisão com a prop `filter`
  // do Contrato B (`FilterModalProps<UserFilterForm>`).
  const filterText = languageGB.users.user.filter;

  const { control, register, handleSubmit, reset } = useForm<FilterFormValues>({
    defaultValues: pristineFormValues,
  });

  function toInternalValues(rawFilter?: UserFilterForm | null): FilterFormValues {
    return {
      search: rawFilter?.search ?? '',
      role_uuid: rawFilter?.role_uuid
        ? { value: rawFilter.role_uuid, label: rawFilter.role_uuid_label ?? rawFilter.role_uuid }
        : null,
      is_active: rawFilter?.is_active
        ? userActiveOptions.getOption(rawFilter.is_active, languageGB)
        : null,
      inactive_days:
        rawFilter?.inactive_days !== undefined
          ? userInactiveDaysOptions.getOption(rawFilter.inactive_days, languageGB)
          : null,
      online: rawFilter?.online ? userOnlineOptions.getOption(rawFilter.online, languageGB) : null,
      tenant_uuid: rawFilter?.tenant_uuid ?? '',
      plan: rawFilter?.plan ?? '',
      tenant_status:
        rawFilter?.tenant_status !== undefined
          ? tenantStatusOptions.getOption(rawFilter.tenant_status as TenantStatus, languageGB)
          : null,
    };
  }

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
  // Deps SOMENTE [isOpen] — deliberado: reagir a `filter` clobaria o que o
  // usuário está digitando dentro do drawer aberto.
  useEffect(() => {
    if (!isOpen) return;

    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  function onSubmit(data: FilterFormValues) {
    handleFilterChange({
      search: data.search?.trim() || undefined,
      role_uuid: data.role_uuid?.value || undefined,
      // Display-only (companheiro do SelectAsyncPaginate) — nunca conta como
      // filtro real, só re-hidrata o Select na próxima abertura do drawer.
      role_uuid_label: data.role_uuid?.label,
      // `??`, NUNCA `||` — checklist documentado em FilterSideFuncoes.tsx
      // (`false`/"Inativo" é falsy e seria descartado por `||`).
      is_active: (data.is_active?.value as UserFilterForm['is_active']) ?? undefined,
      online: (data.online?.value as UserFilterForm['online']) ?? undefined,
      inactive_days: data.inactive_days?.value ?? undefined,
      // Os 3 campos de Gestor_Plataf NUNCA vão ao payload para outros papéis
      // — poda real, não só visual (mesmo se o form ainda tiver valores
      // residuais de uma sessão anterior como Gestor_Plataf).
      tenant_uuid: isGestorPlataforma ? data.tenant_uuid?.trim() || undefined : undefined,
      plan: isGestorPlataforma ? data.plan?.trim() || undefined : undefined,
      tenant_status: isGestorPlataforma ? (data.tenant_status?.value ?? undefined) : undefined,
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

          <Input
            label={filterText.search}
            placeholder={filterText.searchPlaceholder}
            {...register('search')}
          />

          <Controller
            name="role_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={filterText.role}
                placeholder={filterText.roleAll}
                service={listRoles}
                mapOptions={(item: RoleListItem) => ({
                  label: item.description ?? item.name,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                // `?? null`, NUNCA `?? undefined` — `handleResetFilters()`
                // põe `field.value = null`; caindo em `undefined` o
                // `<AsyncPaginate>` vira NÃO-CONTROLADO e mantém a última
                // seleção interna do react-select (armadilha documentada em
                // FilterSideFuncoes.tsx).
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="is_active"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.isActive}
                placeholder={filterText.isActiveAll}
                name={name}
                value={value}
                onChange={onChange}
                options={userActiveOptions.options(languageGB)}
              />
            )}
          />

          <Controller
            name="inactive_days"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.inactiveDays}
                placeholder={filterText.inactiveDaysAll}
                name={name}
                value={value}
                onChange={onChange}
                options={userInactiveDaysOptions.options(languageGB)}
              />
            )}
          />

          <Controller
            name="online"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={filterText.online}
                placeholder={filterText.onlineAll}
                name={name}
                value={value}
                onChange={onChange}
                options={userOnlineOptions.options(languageGB)}
              />
            )}
          />

          {/* §3.5 — 3 campos exclusivos de Gestor_Plataf. */}
          {isGestorPlataforma && (
            <>
              <Input label={filterText.tenant} {...register('tenant_uuid')} />

              <Input label={filterText.plan} {...register('plan')} />

              <Controller
                name="tenant_status"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={filterText.tenantStatus}
                    placeholder={filterText.tenantStatusAll}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={tenantStatusOptions.options(languageGB)}
                  />
                )}
              />
            </>
          )}
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
