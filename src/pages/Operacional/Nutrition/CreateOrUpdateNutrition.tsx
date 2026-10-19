// src/pages/Operacional/Nutrition/CreateOrUpdateNutrition.tsx
// -----------------------------------------------------------------------------
// Formulário ÚNICO de criação/edição de Nutrição (Nutrition — Operacional,
// F-050, esteira 066, TASK-NT-FE-03). Rotas `/operacional/nutricao/novo`
// (criar) e `/operacional/nutricao/:id` (editar) — `isEditing = !!id && id
// !== 'novo'`, mirror ESTRUTURAL de `CreateOrUpdateFoodBeat.tsx`/
// `CreateOrUpdateUsuario.tsx` (1 componente cobre os 2 modos, `DA-NT-11`
// elimina a bifurcação de payload que `FoodBeat` precisou).
//
// ⚠️ Ajuste de rota vs. o texto literal da Tarefa (`/operational/nutritions/
// create`/`/operational/nutritions/:id`, em inglês): a rota REAL já
// registrada por `TASK-NT-FE-02` é `/operacional/nutricao` (PT-BR, mirror de
// TODAS as demais telas de Operacional deste fork). Seguido aqui o padrão
// REAL do router + dos irmãos estruturais (`/novo`, `/:id`), não o literal em
// inglês do template da ficha — divergência de fidelidade declarada, não
// silenciosa.
//
// UX-GAP confirmado (`nutricao-fid-g3f-matriz.DRAFT.md`) — seguido
// `get_spa_ux_fidelity_pattern` (tokens `cerne`, Chakra v3, 5 estados) +
// `get_pwa_complex_screen_compositions_pattern` (cards dinâmicos) sem
// inventar layout, mesmo racional já registrado em `TASK-NT-FE-02`.
//
// Checklist de nova tela (INVIOLÁVEL, injetado na Tarefa):
//  1. Re-hidratação em edição — TODOS os campos, EXCETO `qnt_stock`
//     (`DA-NT-04`, sempre resolvido ao vivo, nunca lido de um campo
//     persistido inexistente — correção do round-trip quebrado do legado,
//     `CLM-02`). `warehouse_id` vem de `item.warehouse` do GET
//     (TASK-095-R2-02), inclusive armazém excluído logicamente (o editor
//     o rotula); item sem armazém (dieta automática) fica vazio.
//  2. `time_control` é `boolean` no RHF (`Switch`), cast na fronteira do
//     tipo — nunca `0`/`1` cru.
//  3. Guard de `onSubmit` — botão salvar desabilitado enquanto qualquer
//     lookup de cascata (`NutritionItemsEditor.tsx`) estiver `isFetching`
//     (`useIsFetching` tagueado por `NUTRITION_CASCADE_QK`).
//  4. Portal de Select — todos os `SelectAsyncPaginate` dos cards
//     (`area_id`/`grazing_id`/`cost_center_id`) portalizados, ver
//     `NutritionItemsEditor.tsx`.
//
// LACUNA declarada (não bloqueia, ver docblock de `NutritionItemsEditor.tsx`):
// `measurement_id`/`measurement_uuid` (`DA-NT-13`/`GAP-NT-07`) sem UI nesta
// Tarefa — nenhum lookup consumido expõe o UUID da medida (só descrições em
// texto); campo permanece sempre ausente no payload (medida primária, sem
// conversão — comportamento honesto já suportado pelo backend).
//
// `diet_beat_id` (dieta automática) — decisão pragmática da ficha: SEM UI
// nesta rodada (sempre `null`), só `product_id` (fluxo manual).
//
// `employees[]` (mão-de-obra, `time_control=true`, SRF-06) — `TASK-NT-FE-04`:
// seção condicional `NutritionEmployeesEditor.tsx`, montada só quando
// `time_control` (aqui via `watch`) é `true`, mirror EXATO do snippet de
// payload da própria ficha (`## Montagem do payload`). Re-hidratação em
// edição: `func_type`/`func_executor_id`/`func_total_quantity` vêm 100% do
// Resource (uuid real do executor); `func_um` só tem a DESCRIÇÃO no Resource
// (sem uuid) — resolvido por MELHOR ESFORÇO (`resolveEmployeesFuncUm`,
// mesmo racional de `resolveItemsWarehouseAndStock` abaixo: casa por
// descrição EXATA contra `listMeasurementOptions`; ambíguo/não encontrado
// fica honestamente vazio, SEM MOCK).
//
// "Responsável" (`user_name`, FLD-03) — `NutritionResource` (API) NÃO expõe
// nenhum campo `user`/`employee` no detalhe (`Nutrition-contrato.md §3.5`), e
// `user_id` nunca é enviado pelo cliente (sempre implícito do autenticado,
// `## Hooks → Endpoints` da ficha) — ou seja, o backend atribui o autor a
// QUEM ESTÁ EDITANDO em toda escrita. AJUSTE 3: o `show` agora devolve
// `employee_or_user_name` (COALESCE funcionário > usuário) — na EDIÇÃO o
// Responsável exibido é o do registro; na CRIAÇÃO segue `authUser?.username`.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { useIsFetching } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { todayLocalIso } from '@/utils/localDate';

import { funcTypeOptions } from '@/constants/operational/nutrition/options/func-type-options';
import { queryKey } from '@/constants/query-key';

import { nutritionSchemaResolver } from '@/validations/schemas/Nutrition/nutrition-schema';

import { listMeasurementOptions } from '@/services/v2/Measurements/measurement-service';
import {
  createNutrition,
  getNutrition,
  updateNutrition,
} from '@/services/v2/Nutritions/nutrition-service';

import type {
  ItemNutritionPayload,
  NutritionData,
  NutritionEmployeeData,
  NutritionEmployeePayload,
  NutritionForm as NutritionFormType,
  NutritionPayload,
} from '@/@types/v2/Nutritions';

import { mapNutritionItemToForm } from './nutrition-item-form-mapper';
import { NutritionEmployeesEditor } from './NutritionEmployeesEditor';
import { NUTRITION_CASCADE_QK, NutritionItemsEditor } from './NutritionItemsEditor';

import type { NutritionEmployeesFieldValues } from './NutritionEmployeesEditor';
import type { NutritionItemsFieldValues } from './NutritionItemsEditor';
import type { UseFieldArrayAppend } from 'react-hook-form';

export default function CreateOrUpdateNutrition() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();
  const text = languageGB.nutritions.nutrition;
  const header = text.form.fields.header;

  // "novo" não é GUID — mirror `CreateOrUpdateFoodBeat.tsx`/
  // `CreateOrUpdateUsuario.tsx`.
  const isEditing = !!id && id !== 'novo';
  // Guard de navegação (Checklist/ficha "## Hooks → Endpoints") — um `id`
  // que NÃO é "novo" e NÃO é um GUID válido não tem estado válido nenhum;
  // redireciona à listagem ANTES de renderizar o form (mirror
  // `UpdateWarehouseTransfer.tsx`).
  const isValidRouteId = !isEditing || isValidGuid(id);

  useEffect(() => {
    if (isEditing && !isValidRouteId) {
      navigate('/operacional/nutricao', { replace: true });
    }
  }, [isEditing, isValidRouteId, navigate]);

  const canSave = isEditing ? can('nutrition_edit') : can('nutrition_create');

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<NutritionFormType>({
    mode: 'onChange',
    resolver: nutritionSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      date: todayLocalIso(),
      user_name: '',
      time_control: false,
      items: [],
      employees: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  // `employees` (SRF-06, `TASK-NT-FE-04`) — `useFieldArray` no PAI, mesma
  // decisão arquitetural de `items` (RHF não tolera bem trocar o shape do
  // form por condição).
  const {
    fields: employeeFields,
    append: appendEmployee,
    remove: removeEmployee,
  } = useFieldArray({ control, name: 'employees' });

  const timeControlValue = watch('time_control');
  const userNameValue = watch('user_name');

  // Melhor esforço (Checklist item 1) — `NutritionEmployeeData.func_um` (`GET /nutritions/{uuid}`) só
  // traz a DESCRIÇÃO da medida (ex.: "Hora"), sem `uuid` (diferente de
  // `func_executor`, que já vem com `{uuid, name}`). Casa por descrição
  // EXATA contra o catálogo `listMeasurementOptions`: 1 match único → resolve
  // o `Option`; 0 ou 2+ matches (ambíguo) fica honestamente vazio — SEM
  // MOCK, nunca adivinha, mesmo racional de `resolveStockQuantity`
  // (`UpdateWarehouseTransfer.tsx`, Risco 3).
  async function resolveEmployeesFuncUm(employees: NutritionEmployeeData[]) {
    if (employees.length === 0) return;
    try {
      const measurementOptions = await listMeasurementOptions({});
      const measurements = measurementOptions.data.items;
      employees.forEach((employee, index) => {
        if (!employee.func_um) return;
        const matches = measurements.filter((item) => item.description === employee.func_um);
        if (matches.length !== 1) return;
        setValue(
          `employees.${index}.func_um`,
          { label: matches[0].description, value: matches[0].uuid },
          { shouldDirty: false, shouldValidate: false }
        );
      });
    } catch {
      // Silencioso — estado honesto mantido (fillForm inicial), sem toast
      // bloqueante; a linha segue editável normalmente.
    }
  }

  // fillForm (Lei 2 — guarda `dirtyFields`), mirror `CreateOrUpdateFoodBeat.tsx`.
  function fillForm(data: NutritionData, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length > 0 && !resetForce) return;

    reset({
      code: data.code,
      date: data.date ? data.date.slice(0, 10) : '',
      // "Responsável" — ver nota de topo do arquivo (edição: do registro).
      user_name: data.employee_or_user_name || '',
      time_control: !!data.time_control,
      items: data.items.map(mapNutritionItemToForm),
      // Aba "Controle de Horas" (SRF-06, `TASK-NT-FE-04`) — re-hidratação
      // real. `func_type`/`func_executor_id`/`func_total_quantity` vêm 100%
      // do Resource; `func_um` fica honestamente vazio aqui e é resolvido
      // por melhor esforço em `resolveEmployeesFuncUm` (ver acima), chamado
      // só na carga inicial (`resetForce`) abaixo.
      employees: data.employees.map((employee) => ({
        uuid: employee.uuid,
        func_type: funcTypeOptions.getOption(employee.func_type, languageGB),
        func_executor_id: {
          label: employee.func_executor.name,
          value: employee.func_executor.uuid,
        },
        func_um: null,
        func_total_quantity: Number(employee.func_total_quantity) || 0,
      })),
    });

    if (resetForce) {
      void resolveEmployeesFuncUm(data.employees);
    }
  }

  const nutritionQuery = useCustomFormQueryById<NutritionData>({
    registrationId: isEditing && isValidRouteId ? (id ?? '') : '',
    queryKey: queryKey.nutritions.nutrition,
    asyncFunction: getNutrition,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([nutritionQuery as any]);
  const nutritionDetail = (nutritionQuery as any)?.data as NutritionData | undefined;

  // Guard de `onSubmit` (Checklist item 3) — qualquer lookup de cascata
  // (`NutritionItemsEditor.tsx`) ainda em `isFetching` bloqueia o salvar.
  const cascadeFetchingCount = useIsFetching({ queryKey: NUTRITION_CASCADE_QK });
  const isCascadeFetching = cascadeFetchingCount > 0;

  const nutritionMutation = useRequest({
    asyncFunction: tryPersistNutrition,
    entityName: text.singularLabel,
    queryKey: queryKey.nutritions.nutrition,
    queryKey2: queryKey.nutritions.nutritions,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Wrapper nomeado (Lei 3) — diff de itens/mão-de-obra por `uuid`
  // (`DA-NT-11`). `warehouse_id`/`qnt_stock`/`product_um`/`measurement_id`
  // (client-only ou sem fonte de UUID, ver LACUNA) NUNCA entram como os
  // campos do FORM — `warehouse_id` é reenviado sob a chave `warehouse_uuid`
  // do DTO (`DA-NT-06` — usado só para resolver o `stock_id` no Repository,
  // nunca gravado diretamente); `qnt_stock`/`product_um` nunca aparecem no
  // payload.
  async function tryPersistNutrition(data: NutritionFormType) {
    const payload: NutritionPayload = {
      date: data.date,
      time_control: data.time_control,
      items: data.items.map((item): ItemNutritionPayload => ({
        uuid: item.uuid,
        trough_uuid: item.trough_id!.value,
        product_uuid: item.product_id?.value,
        diet_beat_uuid: item.diet_beat_id?.value,
        warehouse_uuid: item.warehouse_id?.value,
        area_uuid: item.area_id?.value,
        grazing_uuid: item.grazing_id?.value,
        quantity: Number(item.quantity),
        note_item: item.note_item || undefined,
        cost_center_uuid: item.cost_center_id?.value,
        batches: item.batches,
        measurement_uuid: item.measurement_id?.value,
      })),
      // SRF-06/`TASK-NT-FE-04` — mirror EXATO do snippet de payload já
      // autorizado na ficha desta Tarefa; diff por `uuid` (`DA-NT-11`),
      // mesmo mecanismo de `items`. Omitido (`undefined`) quando
      // `!time_control` (schema já faz `.strip()` do campo nesse caso).
      employees: data.time_control
        ? data.employees.map((employee): NutritionEmployeePayload => ({
            uuid: employee.uuid,
            func_type: employee.func_type!.value,
            func_executor_uuid: employee.func_executor_id!.value,
            func_um: employee.func_um!.value,
            func_total_quantity: Number(employee.func_total_quantity),
          }))
        : undefined,
    };
    try {
      return isEditing ? await updateNutrition(id!, payload) : await createNutrition(payload);
    } catch (error) {
      // 422 flat da API (`items.N.warehouse_uuid` etc.) mapeado no campo
      // do form (`*_uuid` → `*_id`); o `throw` preserva o toast do `useRequest`.
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field.replace(/_uuid$/, '_id') as any, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
      throw error;
    }
  }

  // Guard EXPLÍCITO (`Object.keys(dirtyFields).length === 0`) — editar SEM
  // mudança navega sem chamar a API; editar COM mudança salva (mirror
  // `UpdateWarehouseTransfer.tsx`).
  async function onSubmit(data: NutritionFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }
    await nutritionMutation.mutateAsync(data);
  }

  const isSubmitting = nutritionMutation.isPending;

  if (isEditing && !isValidRouteId) return null;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="outline"
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
              disabled={isSubmitting || isLoading || isCascadeFetching}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* Cabeçalho — ORDEM FIEL a FLD-01..04. */}
        <SimpleGrid columns={4} gap={6}>
          {/* `code` (FLD-01) — readonly; auto-sequencial só no servidor
              (`DA-NT-12`), sem prévia em criação (mirror
              `CreateWarehouseTransfer.tsx`). */}
          <InputReadOnly
            name="code"
            label={header.code}
            value={isEditing ? (nutritionDetail?.code ?? '—') : '—'}
            loading={!!isLoading}
          />

          {/* `date` (FLD-02) — obrigatório. */}
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={header.date}
                error={errors.date?.message as string | undefined}
                isRequired
                disabled={!canSave || !!isLoading}
              />
            )}
          />

          {/* "Responsável" (FLD-03) — readonly, ver nota de topo do arquivo. */}
          <InputReadOnly
            label={header.user}
            value={isEditing ? userNameValue || '—' : (authUser?.username ?? '—')}
          />

          {/* `time_control` (FLD-04) — `boolean` no RHF (Checklist item 2),
              aba condicional de mão-de-obra é `TASK-NT-FE-04`. */}
          <Controller
            name="time_control"
            control={control}
            render={({ field }) => (
              // @ts-ignore - Chakra UI v3 Switch API
              <Switch
                checked={!!field.value}
                onCheckedChange={(details: { checked: boolean }) => field.onChange(details.checked)}
                colorPalette="green"
                disabled={!canSave}
                aria-label={header.timeControl}
              >
                {header.timeControl}
              </Switch>
            )}
          />
        </SimpleGrid>

        {/* Cards de item dinâmicos — `useFieldArray` vive AQUI (pai). */}
        <SimpleGrid columns={1} mt={6}>
          <NutritionItemsEditor
            control={control}
            setValue={setValue}
            fields={fields}
            append={append as unknown as UseFieldArrayAppend<NutritionItemsFieldValues, 'items'>}
            remove={remove}
            errors={errors}
            languageGB={languageGB}
            isEditing={isEditing}
            disabled={!canSave}
            savedBatches={nutritionDetail?.items?.flatMap((item) => item.batches ?? [])}
          />
        </SimpleGrid>

        {/* Aba/seção "Controle de Horas" (SRF-06, `TASK-NT-FE-04`) — guard
            no JSX: só monta quando `time_control === true` (sem campos
            escondidos com `display:none`). */}
        {timeControlValue && (
          <SimpleGrid columns={1} mt={0}>
            <NutritionEmployeesEditor
              control={control}
              fields={employeeFields}
              append={
                appendEmployee as unknown as UseFieldArrayAppend<
                  NutritionEmployeesFieldValues,
                  'employees'
                >
              }
              remove={removeEmployee}
              languageGB={languageGB}
              disabled={!canSave}
            />
          </SimpleGrid>
        )}
      </Form>
    </FormContainer>
  );
}
