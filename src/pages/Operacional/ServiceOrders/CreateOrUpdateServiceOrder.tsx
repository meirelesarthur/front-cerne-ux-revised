// src/pages/Operacional/ServiceOrders/CreateOrUpdateServiceOrder.tsx
// -----------------------------------------------------------------------------
// Formulário único de criação/edição de Ordem de Serviço (ServiceOrder) —
// TASK-FE-2005 (esteira 038, D-FRONT-01/03/04 RESOLVIDAS). Substitui o
// placeholder `ServiceOrderFormPending` (TASK-FE-2001), destino real das
// rotas `/operacional/lista-os/novo` e `/operacional/lista-os/:serviceOrderId`.
//
// 1 `useForm` RAIZ (`ServiceOrderForm`) com o resolver ÚNICO
// (`serviceOrderSchemaResolver`), casca de `Tabs.Root` (variant
// `outline`/`secondary`, mirror `CreateOrUpdateAppropriation.tsx`) — Tab "0"
// (Identificação) contém `ServiceOrderHeaderFields` (que agrupa as 5 seções
// escalares em `CollapsibleSection`, D-FRONT-03); Tabs "1".."5" são os 5
// blocos dinâmicos de linha (`useFieldArray` por bloco, PATTERN-GAP
// registrado no plano — encaixe natural para N blocos persistidos num
// submit único).
//
// PATTERN-GAP declarado (`TASK-FE-2005-form-create-edit-BLOQUEADA.md`):
// `get_pwa_complex_screen_compositions_pattern` NÃO cobre N blocos dinâmicos
// persistidos num submit único — `useFieldArray` por bloco + submit inline
// é o encaixe adotado, mirror `Appropriations/CreateOrUpdateAppropriation.tsx`.
//
// `update` é PUT completo (SE-04, recria pivôs integralmente) — SEM PATCH
// parcial por `dirtyFields` (a Request/Data do backend usa `sometimes` só
// para tolerar ausência, mas a Action orquestradora sempre substitui os 5
// blocos por completo).
//
// `farm_id`/`service_farm_id`/`user_id` NUNCA fazem parte do payload
// (DEC-LOS-07) — nem são campos do form, nem são montados aqui.
//
// Execução 086 (FE-02): o payload é montado por `buildServiceOrderPayload`
// (`service-order-payload.ts`) SEM `.filter(...)` — o PUT faz replace dos 5
// blocos e o antigo filtro por `func_type` apagava toda a mão de obra. Linha
// incompleta bloqueia o salvar com erro visível (aba + toast "linha N").
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Tabs } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useForm, type FieldErrors } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { queryKey } from '@/constants/query-key';
import { getServiceOrderCategoryOptions } from '@/constants/serviceOrders/options/service-order-category-options';
import { serviceOrderLaborTypeOptions } from '@/constants/serviceOrders/options/service-order-labor-type-options';

import { serviceOrderSchemaResolver } from '@/validations/schemas/ServiceOrders/service-order-schema';

import {
  createServiceOrder,
  getServiceOrderNextCode,
  updateServiceOrder,
} from '@/services/v2/ServiceOrders/service-order-service';

import type {
  ServiceOrderDetail,
  ServiceOrderForm as ServiceOrderFormType,
  ServiceOrderPayload,
} from '@/@types/v2/ServiceOrders';

import { mapServiceOrderDetailToFormValues } from './service-order-form-mapper';
import {
  buildServiceOrderPayload,
  findFirstLineError,
  SERVICE_ORDER_BLOCK_TAB,
  ServiceOrderIncompleteLineError,
} from './service-order-payload';
import { ServiceOrderHeaderFields } from './ServiceOrderHeaderFields';
import { ServiceOrderEquipmentTab } from './tabs/ServiceOrderEquipmentTab';
import { ServiceOrderLaborTab } from './tabs/ServiceOrderLaborTab';
import { ServiceOrderProductionTab } from './tabs/ServiceOrderProductionTab';
import { ServiceOrderProductTab } from './tabs/ServiceOrderProductTab';
import { ServiceOrderProtectionTab } from './tabs/ServiceOrderProtectionTab';
import { useServiceOrderForm } from './useServiceOrders';

type ServiceOrderTabKey = '0' | '1' | '2' | '3' | '4' | '5';

const TAB_FIELDS: Record<ServiceOrderTabKey, (keyof ServiceOrderFormType)[]> = {
  '0': [
    'code',
    'executor_uuid',
    'dt_emission',
    'execution_date',
    'deadline',
    'category',
    'operation_uuid',
    'activity_uuid',
    'area_uuid',
    'cultivation_uuid',
    'batch_uuid',
    'category_uuid',
    'weather_requirements',
    'minimum_temperature',
    'maximum_temperature',
    'allowed_working_period_start',
    'allowed_working_period_end',
    'environmental_restrictions',
    'legal_compliance',
    'service_description',
    'expected_result_description',
    'success_criteria_description',
    'roadmap_description',
  ],
  '1': ['employees'],
  '2': ['equipments'],
  '3': ['products_warehouse_uuid', 'products'],
  '4': ['productions_warehouse_uuid', 'productions'],
  '5': ['protections'],
};

const FIELD_TAB_MAP: Partial<Record<keyof ServiceOrderFormType, ServiceOrderTabKey>> =
  Object.fromEntries(
    (Object.entries(TAB_FIELDS) as [ServiceOrderTabKey, (keyof ServiceOrderFormType)[]][]).flatMap(
      ([tab, fields]) => fields.map((field) => [field, tab])
    )
  );

const SERVICE_ORDERS_LIST_ROUTE = '/operacional/lista-os';

const defaultValues: ServiceOrderFormType = {
  code: null,
  executor_uuid: null,
  dt_emission: null,
  execution_date: null,
  deadline: null,
  category: null,
  operation_uuid: null,
  activity_uuid: null,
  area_uuid: null,
  cultivation_uuid: null,
  batch_uuid: null,
  category_uuid: null,
  weather_requirements: null,
  minimum_temperature: null,
  maximum_temperature: null,
  allowed_working_period_start: null,
  allowed_working_period_end: null,
  environmental_restrictions: null,
  legal_compliance: null,
  service_description: null,
  expected_result_description: null,
  success_criteria_description: null,
  roadmap_description: null,
  employees: [],
  equipments: [],
  // R2-05/R2-06 — armazéns de BLOCO (UI-only, nunca vão ao payload).
  products_warehouse_uuid: null,
  products: [],
  productions_warehouse_uuid: null,
  productions: [],
  protections: [],
};

export default function CreateOrUpdateServiceOrder() {
  const { serviceOrderId } = useParams<{ serviceOrderId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();

  const isEditing = isValidGuid(serviceOrderId);

  const text = languageGB.serviceOrders.serviceOrder;
  const formText = text.form;
  const categoryOptions = getServiceOrderCategoryOptions(languageGB);

  const canSave = isEditing ? can('service-orders_edit') : can('service-orders_create');

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<ServiceOrderFormType>({
    mode: 'onChange',
    resolver: serviceOrderSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues,
  });

  const [tabValue, setTabValue] = useState<ServiceOrderTabKey>('0');

  // ---- "Solicitante" (GAP-OS-01, execução 038) — SEMPRE read-only, NUNCA
  // vai ao payload (`user_id` resolvido no servidor pelo contexto de
  // autenticação, DEC-LOS-07). Criação: usuário autenticado local. Edição:
  // `data.user?.name` do detalhe carregado — mirror EXATO
  // `CreateOrUpdateEstacaoDeMonta.tsx`/`CreateFarmTransfer.tsx`. ----------
  const [requesterName, setRequesterName] = useState<string>('—');

  useEffect(() => {
    if (!isEditing) {
      setRequesterName(authUser?.username ?? '—');
    }
  }, [isEditing, authUser?.username]);

  function fillServiceOrderForm(data: ServiceOrderDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset(
        mapServiceOrderDetailToFormValues(
          data,
          categoryOptions,
          serviceOrderLaborTypeOptions.options(languageGB)
        )
      );
      setRequesterName(data.user?.name ?? '—');
    }
  }

  const serviceOrderQuery = useServiceOrderForm({
    registrationId: isEditing ? serviceOrderId : undefined,
    fillForm: fillServiceOrderForm,
  });

  const isLoading = isEditing && checkLoadingStatus([serviceOrderQuery as any]);

  // ---- "Código" (GAP-OS-04, execução 038) — SEMPRE read-only (criação E
  // edição). Criação: prévia via `GET /service-orders/next-code` (decisão
  // do dono confirmando o endpoint, supera a `DECISAO_DE_ESCOPO` anterior
  // de `code` como Input manual, ver `ServiceOrderHeaderFields.tsx`).
  // Edição: `code` já vem populado pelo próprio detalhe carregado
  // (`mapServiceOrderDetailToFormValues`) — `next-code` NUNCA é chamado em
  // edição, mirror EXATO `CreateOrUpdateEstacaoDeMonta.tsx`. ------------
  const nextCodeQuery = useQuery({
    queryKey: [queryKey.serviceOrders.serviceOrder, 'next-code'],
    queryFn: getServiceOrderNextCode,
    enabled: !isEditing,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isEditing && nextCodeQuery.data?.data?.code) {
      setValue('code', nextCodeQuery.data.data.code, { shouldDirty: false });
    }
  }, [isEditing, nextCodeQuery.data]);

  const codeLoading = !isEditing && nextCodeQuery.isLoading;

  const serviceOrderMutation = useRequest({
    asyncFunction: tryPersistServiceOrder,
    entityName: text.singularLabel,
    queryKey: queryKey.serviceOrders.serviceOrders,
    queryKey2: queryKey.serviceOrders.serviceOrder,
    typesRequest: isEditing ? 'update' : 'create',
    personalizedMessage: isEditing ? formText.updatedToast : formText.createdToast,
    actionSuccess: () => {
      navigate(SERVICE_ORDERS_LIST_ROUTE);
    },
  });

  async function tryPersistServiceOrder(payload: ServiceOrderPayload) {
    if (isEditing && serviceOrderId) {
      return await updateServiceOrder(serviceOrderId, payload);
    }
    return await createServiceOrder(payload);
  }

  const isSubmitting = serviceOrderMutation.isPending;

  function showIncompleteLine(block: keyof typeof SERVICE_ORDER_BLOCK_TAB, line: number) {
    setTabValue(SERVICE_ORDER_BLOCK_TAB[block]);
    toaster.error({
      title: isEditing ? formText.title.edit : formText.title.create,
      description: formText.errors.incompleteLine[block].replace('{n}', String(line)),
      duration: 6000,
    });
  }

  async function onSubmit(data: ServiceOrderFormType) {
    // Linha incompleta BLOQUEIA o salvar (o PUT é replace dos 5 blocos —
    // nunca descartar linha em silêncio).
    let payload: ServiceOrderPayload;
    try {
      payload = buildServiceOrderPayload(data);
    } catch (error) {
      if (error instanceof ServiceOrderIncompleteLineError) {
        showIncompleteLine(error.block, error.line);
        return;
      }
      throw error;
    }

    await serviceOrderMutation.mutateAsync(payload);
  }

  function onInvalid(formErrors: FieldErrors<ServiceOrderFormType>) {
    const erroredFieldNames = Object.keys(formErrors) as (keyof ServiceOrderFormType)[];
    if (erroredFieldNames.length === 0) return;

    // Erro numa linha de bloco: mensagem específica "complete a linha N" +
    // aba do bloco (em vez do aviso genérico).
    const lineError = findFirstLineError(formErrors);
    const hasHeaderError = erroredFieldNames.some((field) => FIELD_TAB_MAP[field] === '0');
    if (lineError && !hasHeaderError) {
      showIncompleteLine(lineError.block, lineError.line);
      return;
    }

    const erroredTab = erroredFieldNames
      .map((field) => FIELD_TAB_MAP[field])
      .find((tab): tab is ServiceOrderTabKey => !!tab && tab !== tabValue);

    if (erroredTab) {
      setTabValue(erroredTab);
    }

    toaster.error({
      title: isEditing ? formText.title.edit : formText.title.create,
      description: formText.errors.invalidFields,
      duration: 6000,
    });
  }

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      subtitle={isEditing ? formText.subtitle.edit : formText.subtitle.create}
      showDivider
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            onClick={() => navigate(-1)}
            type="button"
            disabled={isSubmitting}
          />

          {canSave && (
            <Button
              title={languageGB.defaltStrings.save}
              type="button"
              onClick={handleSubmit(onSubmit, onInvalid)}
              loading={isSubmitting}
              disabled={isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form onSubmit={handleSubmit(onSubmit, onInvalid)} noPadding>
        {/* @ts-ignore - custom variant */}
        <Tabs.Root
          value={tabValue}
          onValueChange={(details: { value: string }) =>
            setTabValue(details.value as ServiceOrderTabKey)
          }
          variant="outline"
        >
          {/* @ts-ignore - Tab List sticky no topo do body: abas sempre visíveis, só o conteúdo rola. */}
          <Tabs.List position="sticky" top="0" zIndex={1} bg="formBG">
            {/* @ts-ignore */}
            <Tabs.Trigger value="0">{formText.tabs.header}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="1">{formText.tabs.labor}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="2">{formText.tabs.equipment}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="3">{formText.tabs.products}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="4">{formText.tabs.productions}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="5">{formText.tabs.protections}</Tabs.Trigger>
          </Tabs.List>

          {/* @ts-ignore */}
          <Tabs.Content value="0">
            <ServiceOrderHeaderFields
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              canSave={canSave}
              isLoading={!!isLoading}
              requesterName={requesterName}
              codeLoading={codeLoading}
            />
          </Tabs.Content>

          {/* @ts-ignore */}
          <Tabs.Content value="1">
            <ServiceOrderLaborTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canSave}
            />
          </Tabs.Content>

          {/* @ts-ignore */}
          <Tabs.Content value="2">
            <ServiceOrderEquipmentTab
              control={control}
              errors={errors}
              watch={watch}
              isLoading={!!isLoading}
              canSave={canSave}
            />
          </Tabs.Content>

          {/* @ts-ignore */}
          <Tabs.Content value="3">
            <ServiceOrderProductTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canSave}
            />
          </Tabs.Content>

          {/* @ts-ignore */}
          <Tabs.Content value="4">
            <ServiceOrderProductionTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canSave}
            />
          </Tabs.Content>

          {/* @ts-ignore */}
          <Tabs.Content value="5">
            <ServiceOrderProtectionTab
              control={control}
              errors={errors}
              isLoading={!!isLoading}
              canSave={canSave}
            />
          </Tabs.Content>
        </Tabs.Root>
      </Form>
    </FormContainer>
  );
}
