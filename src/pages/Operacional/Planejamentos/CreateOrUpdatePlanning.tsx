// src/pages/Operacional/Planejamentos/CreateOrUpdatePlanning.tsx
// -----------------------------------------------------------------------------
// Form raiz de criação/edição de Planejamento (Planning) + casca da árvore —
// TASK-FE-PLAN-02 (execução `97-Esteiras/007`). UMA página só, mirror exato
// do legado (`plannings/{id}/edit`): form principal (FLD-01..12) no topo,
// árvore (`PlanningTree.tsx`) embaixo, SÓ em modo edição — "Decisão de
// arquitetura de tela" do manifesto FID-G3F
// (`97-Esteiras/007/CONTRATOS/fid-g3f-planejamentos.md`). NÃO existem duas
// rotas (form-raiz vs. detalhe) — diferente do precedente `ServiceOrders`
// (que separa `CreateOrUpdateServiceOrder`/`ServiceOrderDetalhe`); aqui o
// legado nunca teve duas telas.
//
// Rotas: `/operacional/planejamentos/novo` (criar) e
// `/operacional/planejamentos/:planningUuid` (editar; árvore monta
// condicionalmente: `{planningUuid && <PlanningTree .../>}`).
//
// Form raiz: `useCustomFormQueryById<PlanningTreeData>` (Lei 2, `fillForm`
// nomeada com guarda `!isEmpty(dirtyFields) && !resetForce → return`, mirror
// `CreateOrUpdateEstacaoDeMonta.tsx`/`CreateOrUpdateBreedingSeason` —
// variante correta e testada da guarda, ver `dirty-guard-repro.test.tsx` de
// `BullSeedSeason`). Árvore: query PRÓPRIA e independente, dentro de
// `PlanningTree.tsx` — NUNCA a mesma `queryKey` (armadilha 1 do Roteiro).
//
// Navegação (mode_matrix do contrato legado, AM-06): criar → `POST` →
// navega para `/operacional/planejamentos/{uuid}` (permite montar cultivos
// na mesma sessão); editar → `PUT` → navega para `/operacional/planejamentos`
// (index).
//
// FLD-01/02/04 (código/responsável/data de cadastro) são SEMPRE readonly —
// nunca habilitar edição (armadilha 4). `employee_uuid` é coluna DORMENTE
// (sem select no legado nem aqui, `PlanningRequest.php`) — nunca enviada
// por este form; "Responsável" exibido é só leitura (criação: usuário
// autenticado; edição: `employee.name ?? user.name`, mesmo fallback da
// coluna "responsável" da Listagem, LM-04).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { getPlanningStatusOptions } from '@/constants/plannings/options/planning-status-options';
import { queryKey } from '@/constants/query-key';

import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import { listHarvests } from '@/services/v2/Harvests/harvest-service';
import {
  createPlanning,
  getPlanningById,
  getPlanningNextCode,
  updatePlanning,
} from '@/services/v2/Operacional/Planejamentos/planning-service';

import type { Option } from '@/@types/option';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { Harvest } from '@/@types/v2/Harvests';
import type {
  PlanningForm as PlanningFormType,
  PlanningPayload,
  PlanningStatusValue,
  PlanningTreeData,
} from '@/@types/v2/Operacional/planning';

import { PlanningTree } from './PlanningTree';

const PLANNINGS_LIST_ROUTE = '/operacional/planejamentos';

const defaultValues: PlanningFormType = {
  harvest_uuid: null,
  area_uuid: null,
  area_total: null,
  planted_area: null,
  status: null,
  commercial_dollar: null,
  real_sc: null,
};

function formatMoney(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDisplayDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('pt-BR');
}

export default function CreateOrUpdatePlanning() {
  const { planningUuid } = useParams<{ planningUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser, activeFarmUuid } = useAuth();

  const planningText = languageGB.plannings.planning;
  const text = planningText.form;

  // Guard de navegação: `planningUuid` presente mas NÃO é um UUID válido
  // (URL adulterada) — redireciona para a listagem ANTES de renderizar o
  // form (mirror `CreateOrUpdateEstacaoDeMonta.tsx`/
  // `CreateOrUpdateAppropriation.tsx`, `get_pwa_form_query_pattern`
  // "Guard de navegação").
  const hasMalformedRouteParam = planningUuid !== undefined && !isValidGuid(planningUuid);

  useEffect(() => {
    if (hasMalformedRouteParam) {
      navigate(PLANNINGS_LIST_ROUTE, { replace: true });
    }
  }, [hasMalformedRouteParam, navigate]);

  const isEditing = isValidGuid(planningUuid);
  const canSave = isEditing ? can('plannings_edit') : can('plannings_create');

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<PlanningFormType>({
    mode: 'onChange',
    defaultValues,
  });

  // ---- Guarda de saída sem salvar (mirror `useUnsavedChangesGuard`, já em
  // produção em `CreateOrUpdateEstacaoDeMonta.tsx`) ----
  const hasUnsavedChanges = !isEmpty(dirtyFields);
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);

  // ---- Detalhe carregado (para os campos readonly FLD-01/02/04/12 e o
  // "Responsável" de edição) — setado dentro do `fillForm`, mirror
  // `CreateOrUpdateAppropriation.tsx`/`ServiceOrderDetalhe.tsx`. ----
  const [detail, setDetail] = useState<PlanningTreeData | null>(null);

  // ✅ LEI 2: `fillForm` nomeada, guarda `!isEmpty(dirtyFields) && !resetForce
  // → return` (variante correta/testada — `dirty-guard-repro.test.tsx` de
  // `BullSeedSeason` — equivalente para este hook, que SEMPRE chama
  // `fillForm(data, true)`, mas defensiva contra qualquer chamador futuro
  // que passe `resetForce` ausente).
  function fillPlanningForm(data: PlanningTreeData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      setDetail(data);
      reset({
        harvest_uuid: data.harvest
          ? { label: data.harvest.description, value: data.harvest.uuid }
          : null,
        area_uuid: data.area ? { label: data.area.description, value: data.area.uuid } : null,
        area_total: data.area?.total_area ?? null,
        planted_area: data.planted_area,
        status: { label: data.status_label, value: data.status },
        commercial_dollar: data.commercial_dollar,
        real_sc: data.real_sc,
      });
    }
  }

  const planningQuery = useCustomFormQueryById<PlanningTreeData>({
    registrationId: planningUuid ?? '',
    asyncFunction: getPlanningById,
    queryKey: queryKey.plannings.planning,
    fillForm: fillPlanningForm,
  });

  const isLoading = isEditing && checkLoadingStatus([planningQuery as any]);

  // GAP-PLAN-FE-03 (item 1) — preview do próximo código, SÓ em criação
  // (mirror EXATO `CreateOrUpdateServiceOrder.tsx`, `nextCodeQuery`). `code`
  // continua fora de `PlanningPayload`/`PlanningFormType` — preview é só
  // exibição, nunca enviado no submit (resolvido sempre pelo servidor).
  const nextCodeQuery = useQuery({
    queryKey: [queryKey.plannings.planning, 'next-code'],
    queryFn: getPlanningNextCode,
    enabled: !isEditing,
    retry: false,
    refetchOnWindowFocus: false,
  });

  function listAreasForActiveFarm(params: { search?: string; page?: number; per_page?: number }) {
    return listAreas({ ...params, farm_uuid: activeFarmUuid ?? '' });
  }

  const planningMutation = useRequest<PlanningTreeData>({
    asyncFunction: tryPersistPlanning,
    entityName: planningText.singularLabel,
    queryKey: queryKey.plannings.plannings,
    queryKey2: queryKey.plannings.planning,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: (data) => {
      // Navegação fiel ao `mode_matrix` do legado (AM-06): criar → editar
      // (permite montar cultivos na mesma sessão); editar → index.
      if (!isEditing) {
        navigate(`${PLANNINGS_LIST_ROUTE}/${data.uuid}`);
      } else {
        navigate(PLANNINGS_LIST_ROUTE);
      }
    },
  });

  async function tryPersistPlanning(data: PlanningFormType) {
    const payload: PlanningPayload = {
      harvest_uuid: data.harvest_uuid!.value,
      area_uuid: data.area_uuid!.value,
      planted_area: Number(data.planted_area ?? 0),
      commercial_dollar: Number(data.commercial_dollar ?? 0),
      real_sc: Number(data.real_sc ?? 0),
      status: data.status!.value,
    };

    try {
      if (isEditing && planningUuid) {
        return await updatePlanning(planningUuid, payload);
      }
      return await createPlanning(payload);
    } catch (error) {
      // 422 do backend mapeado por campo (`PlanningRequest::rules()` +
      // `withValidator` — inclui a regra cruzada `planted_area ≤
      // area.total_area`, mapeada em `planted_area`), mirror
      // `CreateOrUpdateEstacaoDeMonta.tsx`.
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof PlanningFormType, { type: 'server', message: messages[0] });
          }
        });
      }
      throw error;
    }
  }

  const isSubmitting = planningMutation.isPending;

  async function onSubmit(data: PlanningFormType) {
    // Lei 2 — sem campos sujos em edição = nada a salvar (mirror
    // `CreateOrUpdateEstacaoDeMonta.tsx`). `isEmpty` (`@/utils/isEmpty`) tem
    // nome INVERTIDO — retorna `true` quando o objeto TEM ao menos uma
    // chave — por isso a guarda exige `!isEmpty(dirtyFields)` para
    // significar "nada sujo" (GAP-PLAN-FE-03, item 6 — ERRO-FE-001: sem o
    // `!`, editar QUALQUER campo navegava de volta sem nunca chamar
    // `planningMutation.mutateAsync`, mesma classe de defeito já corrigida
    // em `CreateOrUpdateBullSeedSeason.tsx`, ver `dirty-guard-repro.test.tsx`).
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(PLANNINGS_LIST_ROUTE);
      return;
    }
    await planningMutation.mutateAsync(data);
  }

  const statusOptions: Option<PlanningStatusValue>[] = getPlanningStatusOptions(languageGB).map(
    (option) => ({ label: option.label, value: option.status })
  );

  const watchedAreaTotal = watch('area_total');
  const watchedPlantedArea = watch('planted_area');
  const availableAreaPreview =
    watchedAreaTotal !== null && watchedPlantedArea !== null
      ? watchedAreaTotal - watchedPlantedArea
      : null;

  const responsibleLabel = isEditing
    ? (detail?.employee?.name ?? detail?.user?.name ?? '—')
    : (authUser?.username ?? '—');

  if (hasMalformedRouteParam) {
    return null;
  }

  return (
    <>
      <FormContainer
        title={isEditing ? text.title.edit : text.title.create}
        subtitle={isEditing ? text.subtitle.edit : text.subtitle.create}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="secondary"
              type="button"
              onClick={() => guardedNavigate(-1)}
              disabled={isSubmitting}
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
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
            {/* FLD-01 — código (readonly, gerado pelo servidor). Em
                criação, exibe o PREVIEW do próximo código disponível
                (`GET /plannings/next-code`, GAP-PLAN-FE-03 item 1) — mirror
                `CreateOrUpdateServiceOrder.tsx`/telas irmãs. A geração final
                continua SEMPRE server-side; `codeGeneratedPlaceholder`
                permanece como fallback (loading/erro do preview). */}
            <InputReadOnly
              name="code"
              label={text.fields.code}
              value={
                isEditing
                  ? (detail?.code ?? '—')
                  : (nextCodeQuery.data?.data?.code ?? text.fields.codeGeneratedPlaceholder)
              }
              loading={!!isLoading || (!isEditing && nextCodeQuery.isLoading)}
            />

            {/* FLD-02 — responsável (readonly; criação = usuário logado,
                edição = employee.name ?? user.name, mesmo fallback LM-04). */}
            <InputReadOnly
              name="responsible"
              label={text.fields.responsible}
              value={responsibleLabel}
              loading={!!isLoading}
            />

            {/* FLD-03 — harvest_uuid (LK-01). */}
            <Controller
              name="harvest_uuid"
              control={control}
              rules={{ required: text.errors.required }}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.harvest}
                  placeholder={text.placeholders.harvest}
                  error={errors.harvest_uuid?.message as string | undefined}
                  service={listHarvests}
                  mapOptions={(item: Harvest) => ({ label: item.description, value: item.uuid })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isRequired
                  isDisabled={!canSave || !!isLoading}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            {/* FLD-04 — data de cadastro (readonly; criação = hoje, edição =
                created_at do detalhe). Exibição apenas — nunca persistida
                como valor de negócio (mirror do legado). */}
            <InputReadOnly
              name="created_at"
              label={text.fields.createdAt}
              value={
                isEditing
                  ? formatDisplayDate(detail?.created_at)
                  : formatDisplayDate(new Date().toISOString())
              }
              loading={!!isLoading}
            />

            {/* FLD-05 — area_uuid (LK-02), farm-scoped pela fazenda ativa. */}
            <Controller
              name="area_uuid"
              control={control}
              rules={{ required: text.errors.required }}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.area}
                  placeholder={text.placeholders.area}
                  error={errors.area_uuid?.message as string | undefined}
                  service={listAreasForActiveFarm}
                  mapOptions={(item: AreaListItem) => ({
                    label: item.description,
                    value: item.uuid,
                    total_area: item.total_area,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? undefined}
                  onChange={(option: any) => {
                    field.onChange(option ?? null);
                    setValue('area_total', option?.total_area ?? null);
                  }}
                  isRequired
                  isDisabled={!canSave || !!isLoading}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            {/* FLD-06 — área total (readonly, derivada da Área selecionada). */}
            <InputReadOnly
              name="area_total"
              label={text.fields.areaTotal}
              value={formatMoney(watchedAreaTotal)}
              loading={!!isLoading}
            />

            {/* FLD-07 — área plantada (validação cruzada ≤ área total é
                espelhada pelo servidor, `PlanningRequest::withValidator()` —
                422 mapeado em `tryPersistPlanning`). */}
            <Controller
              name="planted_area"
              control={control}
              rules={{ required: text.errors.required }}
              render={({ field }) => (
                <NumberInput
                  name={field.name}
                  label={text.fields.plantedArea}
                  allowDot
                  decimalPlaces={2}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  error={errors.planted_area?.message as string | undefined}
                  isRequired
                  disabled={!canSave || !!isLoading}
                />
              )}
            />

            {/* FLD-08 — área disponível (readonly, derivada — CV-02, prévia
                client-side; fonte de verdade em edição é
                `PlanningResource.available_area`, ambos convergem). */}
            <InputReadOnly
              name="available_area"
              label={text.fields.availableArea}
              value={formatMoney(availableAreaPreview)}
              loading={!!isLoading}
            />

            {/* FLD-09 — status (LK-03), mesmas options/cores da Listagem. */}
            <Controller
              name="status"
              control={control}
              rules={{ required: text.errors.required }}
              render={({ field }) => (
                <Select
                  name={field.name}
                  label={text.fields.status}
                  placeholder={text.placeholders.status}
                  error={errors.status?.message as string | undefined}
                  options={statusOptions}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  isRequired
                  isDisabled={!canSave || !!isLoading}
                />
              )}
            />

            {/* FLD-10 — cotação US$. */}
            <Controller
              name="commercial_dollar"
              control={control}
              rules={{ required: text.errors.required }}
              render={({ field }) => (
                <NumberInput
                  name={field.name}
                  label={text.fields.commercialDollar}
                  allowDot
                  decimalPlaces={2}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  error={errors.commercial_dollar?.message as string | undefined}
                  disabled={!canSave || !!isLoading}
                />
              )}
            />

            {/* FLD-11 — R$/sc. */}
            <Controller
              name="real_sc"
              control={control}
              rules={{ required: text.errors.required }}
              render={({ field }) => (
                <NumberInput
                  name={field.name}
                  label={text.fields.realSc}
                  allowDot
                  decimalPlaces={2}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  error={errors.real_sc?.message as string | undefined}
                  disabled={!canSave || !!isLoading}
                />
              )}
            />

            {/* FLD-12 — rodapé (Vl. Planejado/Vl. área) — SÓ existe em
                edição (mirror legado: "widget React só monta com item.id"). */}
            {isEditing && detail && (
              <>
                <InputReadOnly
                  name="planning_total"
                  label={text.fields.planningTotal}
                  value={formatMoney(detail.planning_total)}
                />
                <InputReadOnly
                  name="planning_area"
                  label={text.fields.planningArea}
                  value={formatMoney(detail.planning_area)}
                />
              </>
            )}
          </SimpleGrid>
        </Form>

        {/* Árvore — monta SOMENTE em modo edição, mirror "widget React só
            monta se existir item.id" do legado. Query PRÓPRIA, independente
            da query do form raiz acima (ver docblock do arquivo). */}
        {isEditing && planningUuid && (
          <Box mt={2}>
            <PlanningTree planningUuid={planningUuid} />
          </Box>
        )}
      </FormContainer>

      <DeleteConfirmDialog
        isOpen={isConfirmOpen}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        tone="warning"
        colorPalette="orange"
        title={text.unsavedChangesDialog.title}
        description={text.unsavedChangesDialog.description}
        confirmButtonText={text.unsavedChangesDialog.confirmButton}
        hideQuestionMark
        warningText=""
      />
    </>
  );
}
