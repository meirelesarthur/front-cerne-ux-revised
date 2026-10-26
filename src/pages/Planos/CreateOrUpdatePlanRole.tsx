// src/pages/Planos/CreateOrUpdatePlanRole.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de PLANO (PlanRole) — TASK-FE-2702. Rotas:
// /planos/create (criar) e /planos/:uuid (editar) — registradas em
// `TASK-FE-2704`.
//
// GAP-FE-233 RESOLVIDO (backend, 2026-08-07) — `PlanRoleRequest`/
// `PlanRoleResource` passaram a falar `role_uuid`/`role_uuids[]` (uuid),
// fechando a exceção que quebrava a convenção uuid-na-borda (Lei GB 10) e
// que mantinha a CRIAÇÃO de Plano bloqueada (stub "criação indisponível") e
// os 2 campos de Atribuição desabilitados. Esta Tarefa (FOLLOW-UP):
//   1. remove o stub de criação — a tela volta a ser um componente ÚNICO
//      (create + edit), mirror estrutural de `CreateOrUpdateCentroCusto.tsx`
//      (não há mais early-return-antes-de-hooks para justificar o split em
//      2 componentes que existia enquanto a criação estava bloqueada);
//   2. fia "Atribuição Principal" a um `SelectAsyncPaginate` (`role_uuid`,
//      Option-based, mirror `CreateOrUpdateFuncionario.tsx:1249` — único
//      precedente real de Role single-select no projeto) e "Atribuições
//      Adicionais" a um `CheckboxListField` (`role_uuids[]`, mirror
//      `CreateOrUpdateUsuario.tsx:729`/`StepUsuario.tsx` — precedente real
//      de Role multi-select), ambos consumindo `listRoles` (`GET /roles`,
//      uuid-only, nenhuma mudança nesse service).
//
// Segmento (`segment_uuids`) já funcionava sem bloqueio — `exists:cost_centers,
// uuid` já era compatível 1:1 com o catálogo do front (mirror
// `CreateOrUpdateFinancialCategory.tsx:194-202`, `CategoryTreeSelector` +
// `useCostCenterTree()`) — INALTERADO por esta Tarefa.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Input } from '@/components/Form/Input';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { planRoleSchemaResolver } from '@/validations/schemas/Planos/plan-role-schema';

import { createPlanRole, updatePlanRole } from '@/services/v2/Planos/planRole-service';
import { listRoles } from '@/services/v2/Roles/role-service';

import type {
  PlanRoleDetail,
  PlanRoleForm as PlanRoleFormType,
  PlanRolePayload,
} from '@/@types/v2/Planos';
import type { RoleListItem } from '@/@types/v2/Roles';

import { usePlanRoleForm } from './usePlanRole';

import { useCostCenterTree } from '../CadastrosBase/CentroCusto/useCostCenters';
import { CategoryTreeSelector } from '../CadastrosBase/PlanAccount/CategoryTreeSelector';

export default function CreateOrUpdatePlanRole() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.planos.planRole;

  // É edição quando existe um GUID válido na rota (`/create` não é GUID,
  // nem chega a cair aqui como `uuid` — rota literal própria, casada ANTES
  // de `/:uuid`) — mesmo racional de `CreateOrUpdateCentroCusto.tsx::isEditing`.
  const isEditing = isValidGuid(uuid);

  // Guard de navegação: um `uuid` presente mas inválido não deve chegar às
  // queries de detalhe nem renderizar um form "fantasma" em modo create —
  // mesmo racional de `CreateOrUpdateApp.tsx`/`CreateOrUpdateCentroCusto.tsx`.
  useEffect(() => {
    if (uuid && !isValidGuid(uuid)) {
      navigate('/planos', { replace: true });
    }
  }, [uuid, navigate]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<PlanRoleFormType>({
    mode: 'onChange',
    resolver: planRoleSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      price: 0,
      interval_days: 1,
      farm_limit: null,
      concurrent_user_limit: null,
      is_free: false,
      animals_limit: 0,
      agriculture_area_limit: 0,
      fruitgrowing_area_limit: 0,
      role_uuid: null,
      role_uuids: [],
      segment_uuids: [],
    },
  });

  function fillForm(data: PlanRoleDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        name: data.name,
        price: data.price,
        interval_days: data.interval_days,
        farm_limit: data.farm_limit,
        concurrent_user_limit: data.concurrent_user_limit,
        is_free: !!data.is_free,
        animals_limit: data.animals_limit,
        agriculture_area_limit: data.agriculture_area_limit,
        fruitgrowing_area_limit: data.fruitgrowing_area_limit,
        role_uuid: data.role ? { label: data.role.name, value: data.role.uuid } : null,
        role_uuids: (data.role_uuids ?? []).map((role) => role.uuid),
        segment_uuids: data.segment_uuids ?? [],
      });
    }
  }

  const planRoleQuery = usePlanRoleForm({ registrationId: isEditing ? uuid : undefined, fillForm });
  const isLoading = isEditing && checkLoadingStatus([planRoleQuery as any]);

  const canSave = isEditing ? can('plan_edit') : can('plan_create');

  // ---- Atribuição Principal (`role_uuid`, Select ÚNICO) — mirror
  // `CreateOrUpdateFuncionario.tsx:1249` (único precedente real de Role
  // single-select), Option-based (`{label,value}`) igual a `city_uuid`/
  // `parent_uuid`. `SelectAsyncPaginate` já resolve busca+paginação
  // server-side sobre `listRoles` (`GET /roles`, uuid-only) — nenhuma
  // mudança no service. ------------------------------------------------------

  // ---- Atribuições Adicionais (`role_uuids[]`, multi) — mirror
  // `CreateOrUpdateUsuario.tsx:729`/`StepUsuario.tsx` (único precedente real
  // de Role multi-select): `CheckboxListField` com busca SERVER-SIDE
  // (mesmo `listRoles`, estado de busca PRÓPRIO — não compartilhado com o
  // Select acima, para não filtrar um campo enquanto o usuário digita no
  // outro). ------------------------------------------------------------------
  const [additionalRoleSearch, setAdditionalRoleSearch] = useState('');
  const { data: additionalRolesData, isLoading: additionalRolesLoading } = useQuery({
    queryKey: [queryKey.roles.list, 'plan-role-additional', additionalRoleSearch],
    queryFn: () => listRoles({ page: 1, per_page: 50, search: additionalRoleSearch || undefined }),
  });
  const additionalRoleItems = (additionalRolesData?.data.items ?? []).map((role) => ({
    value: role.uuid,
    label: role.name,
  }));

  // ---- Segmento (Centro de Custo, árvore tri-state) — mesmo componente/
  // hook do Plano de Contas/Categoria Financeira, mirror
  // `CreateOrUpdateFinancialCategory.tsx:194-202`. `segment_uuids` é
  // `sometimes`/`exists:cost_centers,uuid` no `PlanRoleRequest` — sem Gap.
  // `selectableGroups` ausente (default `false`) — mesma cautela do
  // precedente citado (grupo Sintético GLOBAL pode não ser aceito pelo
  // backend; folhas apenas até confirmação em contrário). -------------------
  const costCenterTreeQuery = useCostCenterTree();

  const watchedSegmentUuids = watch('segment_uuids') ?? [];
  const selectedSegmentUuids = useMemo(() => new Set(watchedSegmentUuids), [watchedSegmentUuids]);

  function handleSegmentTreeChange(next: Set<string>) {
    setValue('segment_uuids', Array.from(next), { shouldDirty: true, shouldValidate: true });
  }

  const planRoleMutation = useRequest({
    asyncFunction: tryPersistPlanRole,
    entityName: text.singularLabel,
    queryKey: queryKey.planos.planRoles,
    queryKey2: queryKey.planos.planRole,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Payload SEMPRE completo (mirror `updateGrazing`/`updateFodder`, sem
  // PATCH parcial). `role_uuid` vem do `Option` selecionado no
  // `SelectAsyncPaginate` (`.value`, mesmo padrão de `city_uuid`/
  // `parent_uuid`); `role_uuids`/`segment_uuids` já são `string[]` crus no
  // form-state.
  async function tryPersistPlanRole(data: PlanRoleFormType) {
    const payload: PlanRolePayload = {
      name: data.name.trim(),
      price: Number(data.price),
      interval_days: Number(data.interval_days),
      farm_limit: data.farm_limit ?? null,
      concurrent_user_limit: data.concurrent_user_limit ?? null,
      is_free: !!data.is_free,
      animals_limit: Number(data.animals_limit),
      agriculture_area_limit: Number(data.agriculture_area_limit),
      fruitgrowing_area_limit: Number(data.fruitgrowing_area_limit),
      role_uuid: data.role_uuid!.value,
      role_uuids: data.role_uuids ?? [],
      segment_uuids: data.segment_uuids ?? [],
    };

    if (isEditing && uuid) {
      return await updatePlanRole(uuid, payload);
    }

    return await createPlanRole(payload);
  }

  // Mirror do padrão canônico `isEditing && !isEmpty(dirtyFields)` (ver
  // `CreateOrUpdateCentroCusto.tsx`/~40 siblings — `isEmpty` tem semântica
  // INVERTIDA no projeto, `src/utils/isEmpty.ts`: retorna `true` quando o
  // objeto TEM chaves. `!isEmpty(dirtyFields)` só é `true` quando não há
  // nenhuma alteração real). CORREÇÃO nesta Tarefa: a versão anterior deste
  // arquivo (`if (!isEmpty(dirtyFields)) mutate; else navigate(-1)`, sem o
  // `isEditing &&`) tinha a condição INVERTIDA — editar um campo e salvar
  // só navegava de volta SEM PERSISTIR (bug pré-existente, mascarado
  // enquanto os 2 campos de Atribuição eram os únicos previsíveis de ficar
  // "sempre dirty"; nunca detectado porque a maioria das edições reais
  // tocava outro campo, disparando o mesmo caminho errado sem sintoma
  // óbvio). Corrigido para o padrão universal do projeto — necessário
  // também para a CRIAÇÃO nova funcionar (nunca deve navegar sem persistir).
  async function onSubmit(data: PlanRoleFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await planRoleMutation.mutateAsync(data);
    }
  }

  const isSubmitting = planRoleMutation.isPending;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      subtitle={isEditing ? text.form.subtitle.edit : text.form.subtitle.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && (
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* ---- Seção: Dados Gerais ------------------------------------- */}
        <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" mb={3}>
          {text.form.sections.general}
        </Text>
        <SimpleGrid columns={columnsForm.threeColumns} gap={6} mb={6}>
          <Box gridColumn={{ base: 'auto', md: 'span 1' }}>
            <Input
              label={text.form.fields.name}
              placeholder={text.form.placeholders.name}
              {...register('name')}
              error={errors.name?.message}
              maxLength={50}
              isRequired
              loading={!!isLoading}
              disabled={!canSave}
            />
          </Box>

          <Controller
            name="price"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <MoneyInput
                name={name}
                label={text.form.fields.price}
                value={value}
                onValueChange={onChange}
                error={error?.message}
                isRequired
                disabled={!canSave || !!isLoading}
              />
            )}
          />

          <Controller
            name="interval_days"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <NumberInput
                name={name}
                label={text.form.fields.intervalDays}
                value={value}
                onValueChange={onChange}
                allowDot={false}
                min={1}
                error={error?.message}
                isRequired
                disabled={!canSave || !!isLoading}
              />
            )}
          />
        </SimpleGrid>

        {/* ---- Seção: Atribuição de Perfil (GAP-FE-233 resolvido) ------- */}
        <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" mb={3}>
          {text.form.sections.assignments}
        </Text>
        <SimpleGrid columns={columnsForm.twoColumns} gap={6} mb={6}>
          <Controller
            name="role_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.mainRole}
                service={listRoles}
                mapOptions={(item: RoleListItem) => ({ label: item.name, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                isDisabled={!canSave || !!isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </SimpleGrid>

        <Box mb={6}>
          <Controller
            name="role_uuids"
            control={control}
            render={({ field: { value, onChange } }) => (
              <CheckboxListField
                label={text.form.fields.additionalRoles}
                items={additionalRoleItems}
                selectedValues={value}
                onChange={onChange}
                searchValue={additionalRoleSearch}
                onSearchChange={setAdditionalRoleSearch}
                searchPlaceholder={text.form.rolesSearchPlaceholder}
                selectedCountLabel={text.form.selectedRolesCountLabel}
                isLoading={additionalRolesLoading}
                isDisabled={!canSave}
              />
            )}
          />
        </Box>

        {/* ---- Seção: Limites -------------------------------------------- */}
        <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" mb={3}>
          {text.form.sections.limits}
        </Text>
        <SimpleGrid columns={columnsForm.threeColumns} gap={6} mb={6}>
          <Controller
            name="animals_limit"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <NumberInput
                name={name}
                label={text.form.fields.animalsLimit}
                value={value}
                onValueChange={onChange}
                allowDot={false}
                min={0}
                error={error?.message}
                isRequired
                disabled={!canSave || !!isLoading}
              />
            )}
          />

          <Controller
            name="agriculture_area_limit"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <NumberInput
                name={name}
                label={text.form.fields.agricultureAreaLimit}
                value={value}
                onValueChange={onChange}
                allowDot
                decimalPlaces={2}
                min={0}
                error={error?.message}
                isRequired
                disabled={!canSave || !!isLoading}
              />
            )}
          />

          <Controller
            name="fruitgrowing_area_limit"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <NumberInput
                name={name}
                label={text.form.fields.fruitgrowingAreaLimit}
                value={value}
                onValueChange={onChange}
                allowDot
                decimalPlaces={2}
                min={0}
                error={error?.message}
                isRequired
                disabled={!canSave || !!isLoading}
              />
            )}
          />

          <Controller
            name="farm_limit"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <NumberInput
                name={name}
                label={text.form.fields.farmLimit}
                value={value}
                onValueChange={onChange}
                allowDot={false}
                min={1}
                error={error?.message}
                disabled={!canSave || !!isLoading}
              />
            )}
          />

          <Controller
            name="concurrent_user_limit"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <NumberInput
                name={name}
                label={text.form.fields.concurrentUserLimit}
                value={value}
                onValueChange={onChange}
                allowDot={false}
                min={1}
                error={error?.message}
                disabled={!canSave || !!isLoading}
              />
            )}
          />

          <Controller
            name="is_free"
            control={control}
            render={({ field }) => (
              <Box display="flex" alignItems="center" justifyContent="space-between" h="full">
                <Text fontSize="sm" fontWeight="medium">
                  {text.form.fields.isFree}
                </Text>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  disabled={!canSave || !!isLoading}
                  aria-label={text.form.fields.isFree}
                />
              </Box>
            )}
          />
        </SimpleGrid>

        {/* ---- Seção: Segmento (árvore de Centro de Custo, sem Gap) ------ */}
        <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" mb={3}>
          {text.form.fields.segments}
        </Text>
        <Box mb={2}>
          <Controller
            name="segment_uuids"
            control={control}
            render={() => (
              <CategoryTreeSelector
                title={text.form.fields.segments}
                tree={costCenterTreeQuery.data}
                isLoading={costCenterTreeQuery.isLoading || !!isLoading}
                selected={selectedSegmentUuids}
                onChange={handleSegmentTreeChange}
                readOnly={!canSave}
                languageGB={languageGB}
                searchable
                strings={text.form.segmentsTree}
                isError={costCenterTreeQuery.isError}
                onRetry={() => costCenterTreeQuery.refetch()}
              />
            )}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
