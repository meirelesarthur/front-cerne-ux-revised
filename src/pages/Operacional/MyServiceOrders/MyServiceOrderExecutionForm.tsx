// src/pages/Operacional/MyServiceOrders/MyServiceOrderExecutionForm.tsx
// -----------------------------------------------------------------------------
// Formulário de EXECUÇÃO de Ordem de Serviço restrita ao executor logado
// (MyServiceOrder) — esteira 063 (TASK-MOS-FE-05, Wave 3). Rota
// `/operacional/minhas-os/:uuid`, SEMPRE modo edição — `mode_matrix.criar =
// NAO_APLICAVEL`, esta rota nunca tem variante `/novo`.
//
// Casca `FormContainer` com footer (mirror `RatingServiceOrderForm.tsx`):
// guard de `uuid` inválido (`isValidGuid` + `navigate(-1)`).
//
// CORREÇÃO DE FIDELIDADE (execução 063 — o dono reportou nomes/ordem de
// campos divergentes do legado): a área readonly deixa de ser 2
// `CollapsibleSection` genéricas e passa a ser 6 `CollapsibleSection`
// STACKED fiéis ao `_forms.blade.php` legado, em ordem exata —
// Identificação da OS / Tipo de serviço / Execução (readonly) / Condições e
// Restrições / Instruções Detalhadas / Segurança e Sustentabilidade — cada
// uma com rótulos PRÓPRIOS em `languageMyServiceOrders.myServiceOrder.form.
// readonly.*` (módulo-próprio, NÃO mais `languageGB.serviceOrders.
// serviceOrder.detail.*`).
//
// CORREÇÃO DE FIDELIDADE #2 (execução 063 — 2ª rodada, o dono reportou que
// os 5 blocos de checklist NÃO deveriam aparecer sempre): o legado
// `_forms.blade.php` renderiza cada card via `@if ($item->{relacao}->
// isNotEmpty())` — são CARDS EMPILHADOS CONDICIONAIS, não abas sempre
// visíveis. O `Tabs.Root` foi removido; em seu lugar, 5 `CollapsibleSection`
// condicionais (Insumos/Máq·Implementos/Mão de obra/Proteções(EPI)/Produção
// — `MyServiceOrderChecklistTab`, TASK-MOS-FE-06), cada uma só renderizada
// quando a relação correspondente tem itens, seguidas do bloco EDITÁVEL
// "Execução" (5 campos escalares) e por fim o card "Evidências" SEMPRE
// renderizado (`MyServiceOrderAttachmentsTab`, TASK-MOS-FE-07) — ordem 1:1
// do legado: Insumos? → Máq? → Mão de obra? → Proteções? → Produção? →
// Execução editável → Evidências sempre.
//
// Botão de submit FORA da tag `<Form>`, ligado por
// `form="my-service-order-execution-form"` (mirror
// `Marcacao/PrevisaoLoteMarking.tsx`/get_pwa_form_query_pattern — mecanismo
// canônico de casca com footer). Footer nunca `position: absolute`
// (`FormContainer` já resolve isso internamente quando `footer` é passado).
//
// Execução 086 (API-06/FE-03): o GET responde para TODA OS da lista de Minhas
// OS (executor, qualquer status) com `can_execute` (true só em status 1/2).
// Com `can_execute=false` (ou sem permissão `my-service-orders_edit`) a tela
// abre em MODO LEITURA, sem submit/iniciar/concluir/marcar itens: status,
// itens com nomes, dados de execução, anexos e cancelamento (se exposto).
// `EmptyState` + voltar ficou só para erro real de carga (404/rede).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import {
  Box,
  EmptyState,
  Flex,
  Icon,
  Input,
  Link,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { formatServiceOrderDate } from '@/pages/Operacional/ServiceOrders/ServiceOrderDetailBody';
import { getServiceOrderStatusBadgeColor } from '@/pages/Operacional/ServiceOrders/serviceOrderStatus';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { CollapsibleSection } from '@/components/Form/CollapsibleSection';
import { Field } from '@/components/Form/Field';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Status } from '@/components/Status';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { getMyServiceOrderExecutionStatusOptions } from '@/constants/myServiceOrders/options/my-service-order-execution-status-options';
import { queryKey } from '@/constants/query-key';

import { myServiceOrderSchemaResolver } from '@/validations/schemas/MyServiceOrders/my-service-order-schema';

import { updateMyServiceOrderExecution } from '@/services/v2/MyServiceOrders/my-service-order-service';

import type {
  MyServiceOrderDetail,
  MyServiceOrderExecutionForm as MyServiceOrderExecutionFormType,
  MyServiceOrderExecutionPayload,
} from '@/@types/v2/MyServiceOrders';

import { MyServiceOrderAttachmentsTab } from './MyServiceOrderAttachmentsTab';
import { MyServiceOrderChecklistTab } from './MyServiceOrderChecklistTab';
import { useMyServiceOrderForm } from './useMyServiceOrders';

const MY_SERVICE_ORDERS_LIST_ROUTE = '/operacional/minhas-os';
const FORM_ID = 'my-service-order-execution-form';
const DATE_TIME_PATTERN = 'dd/MM/yyyy HH:mm';

const defaultValues: MyServiceOrderExecutionFormType = {
  status: null,
  execution_start_date: null,
  execution_end_date: null,
  execution_problems: null,
  corrective_actions: null,
  employees_checked_ids: [],
  equipments_checked_ids: [],
  products_checked_ids: [],
  productions_checked_ids: [],
  protections_checked_ids: [],
  attachments: [],
};

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={1}
      >
        {label}
      </Text>
      <Text fontSize="sm" color="fg.default" whiteSpace="pre-wrap">
        {value}
      </Text>
    </Box>
  );
}

export default function MyServiceOrderExecutionForm() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  const text = languageGB.myServiceOrders.myServiceOrder;
  const formText = text.form;
  const readonlyText = formText.readonly;
  const cancellationText = languageGB.serviceOrders.serviceOrder.detail;
  const noData = '—';

  const statusOptions = getMyServiceOrderExecutionStatusOptions(languageGB);

  const { can } = usePermissions();
  const canEditPermission = can('my-service-orders_edit');

  const validId = isValidGuid(uuid);

  useEffect(() => {
    if (!validId) {
      navigate(-1);
    }
  }, [validId, navigate]);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<MyServiceOrderExecutionFormType>({
    mode: 'onChange',
    resolver: myServiceOrderSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues,
  });

  const watchedStatus = watch('status');

  // ✅ Lei 2 — função nomeada com guarda de `dirtyFields`. Semeia os 5 arrays
  // `*_checked_ids` a partir de `data.{bloco}.filter(l=>l.is_checked).map(l=>l.id)`
  // (contrato de tela §3) e os anexos existentes com `file: null` (mirror
  // `CreateOrUpdateEquipamento.tsx` — front sempre envia o array completo).
  function fillMyServiceOrderExecutionForm(data: MyServiceOrderDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        status:
          data.status != null
            ? (statusOptions.find((option) => option.value === data.status.value) ?? null)
            : null,
        execution_start_date: data.execution_start_date,
        execution_end_date: data.execution_end_date,
        execution_problems: data.execution_problems,
        corrective_actions: data.corrective_actions,
        employees_checked_ids: (data.employees ?? [])
          .filter((line) => line.is_checked)
          .map((line) => line.id),
        equipments_checked_ids: (data.equipments ?? [])
          .filter((line) => line.is_checked)
          .map((line) => line.id),
        products_checked_ids: (data.products ?? [])
          .filter((line) => line.is_checked)
          .map((line) => line.id),
        productions_checked_ids: (data.productions ?? [])
          .filter((line) => line.is_checked)
          .map((line) => line.id),
        protections_checked_ids: (data.protections ?? [])
          .filter((line) => line.is_checked)
          .map((line) => line.id),
        attachments: (data.attachments ?? []).map((row) => ({
          uuid: row.uuid,
          name: row.name,
          file: null,
        })),
      });
    }
  }

  const myServiceOrderQuery = useMyServiceOrderForm({
    registrationId: validId ? uuid : undefined,
    fillForm: fillMyServiceOrderExecutionForm,
  });

  const isLoading = checkLoadingStatus([myServiceOrderQuery as any]);
  const item = myServiceOrderQuery.data as MyServiceOrderDetail | undefined;
  const isError = !isLoading && (myServiceOrderQuery as any).isError;
  // Modo leitura: `can_execute` do backend é a fonte de verdade; a permissão
  // só esconde a ação.
  const isReadOnly = !!item && (item.can_execute !== true || !canEditPermission);
  const isCancelled = item?.status.value === 9 || !!item?.cancellation_reason;

  // 422 por campo mapeado localmente (mirror `tryPersistAdvance`). As chaves da API
  // vêm em dot-notation (`attachments.0.file`) e o RHF aceita direto. O erro é sempre
  // relançado: o toast do `useRequest` continua cobrindo a `message` geral.
  async function tryPersistMyServiceOrderExecution(payload: MyServiceOrderExecutionPayload) {
    if (!uuid) throw new Error('ID inválido');
    try {
      return await updateMyServiceOrderExecution(uuid, payload);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as any, { type: 'server', message: messages[0] });
          }
        });
      }
      throw error;
    }
  }

  const myServiceOrderMutation = useRequest({
    asyncFunction: tryPersistMyServiceOrderExecution,
    queryKey: queryKey.myServiceOrders.myServiceOrders,
    queryKey2: queryKey.myServiceOrders.myServiceOrder,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: formText.updatedToast,
    actionSuccess: () => {
      navigate(MY_SERVICE_ORDERS_LIST_ROUTE);
    },
  });

  const isBusy = isSubmitting || myServiceOrderMutation.isPending;

  function onSubmit(data: MyServiceOrderExecutionFormType) {
    if (isReadOnly) return;
    if (!data.status || !data.execution_start_date) return;

    const payload: MyServiceOrderExecutionPayload = {
      status: data.status.value,
      execution_start_date: data.execution_start_date,
      execution_end_date: data.execution_end_date || null,
      execution_problems: data.execution_problems || null,
      corrective_actions: data.corrective_actions || null,
      employees_checked_ids: data.employees_checked_ids,
      equipments_checked_ids: data.equipments_checked_ids,
      products_checked_ids: data.products_checked_ids,
      productions_checked_ids: data.productions_checked_ids,
      protections_checked_ids: data.protections_checked_ids,
      attachments: data.attachments.map((row) => ({
        uuid: row.uuid,
        name: row.name || undefined,
        file: row.file,
      })),
    };
    myServiceOrderMutation.mutate(payload);
  }

  if (!validId) {
    return null;
  }

  if (isError) {
    return (
      <FormContainer title={text.singularLabel}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{formText.notFound.title}</EmptyState.Title>
                <EmptyState.Description>{formText.notFound.description}</EmptyState.Description>
              </VStack>
              <Button
                title={formText.notFound.back}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(MY_SERVICE_ORDERS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={item?.code ?? (isReadOnly ? formText.readOnly.title : formText.title)}
      subtitle={isReadOnly ? formText.readOnly.subtitle : formText.subtitle}
      headerActions={
        item && (
          <Status
            text={item.status.label}
            backgroundColor={getServiceOrderStatusBadgeColor(item.status.value)}
          />
        )
      }
      footer={
        isReadOnly ? (
          <Button
            title={formText.readOnly.back}
            icon={FiArrowLeft as ElementType}
            variant="outline"
            type="button"
            onClick={() => navigate(MY_SERVICE_ORDERS_LIST_ROUTE)}
          />
        ) : (
          <>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="outline"
              type="button"
              onClick={() => navigate(MY_SERVICE_ORDERS_LIST_ROUTE)}
              disabled={isBusy}
            />
            <Button
              title={languageGB.defaltStrings.save}
              type="submit"
              form={FORM_ID}
              loading={isBusy}
              disabled={isBusy || isLoading}
            />
          </>
        )
      }
    >
      <Form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noPadding>
        <Flex direction="column" gap={4} mt={6}>
          {/* ---- 1/6 — "Identificação da OS", SEMPRE aberta. Rótulos e
              ordem 1:1 do `_forms.blade.php` legado — módulo-próprio
              (`formText.readonly.*`), NÃO mais `languageGB.serviceOrders.
              serviceOrder.detail.*`. `service_farm` (FLD-07) volta a
              aparecer aqui (correção de fidelidade). ---- */}
          <CollapsibleSection title={readonlyText.sections.identification}>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField label={readonlyText.fields.code} value={item?.code ?? noData} />
              <InfoField label={readonlyText.fields.user} value={item?.user?.name ?? noData} />
              <InfoField
                label={readonlyText.fields.executor}
                value={item?.executor?.name ?? noData}
              />
              <InfoField
                label={readonlyText.fields.dtEmission}
                value={formatServiceOrderDate(item?.dt_emission)}
              />
              <InfoField
                label={readonlyText.fields.executionDate}
                value={formatServiceOrderDate(item?.execution_date)}
              />
              <InfoField
                label={readonlyText.fields.deadline}
                value={formatServiceOrderDate(item?.deadline)}
              />
              <InfoField
                label={readonlyText.fields.serviceFarm}
                value={item?.service_farm?.name ?? noData}
              />
            </SimpleGrid>
          </CollapsibleSection>

          {/* ---- 2/6 — "Tipo de serviço". ---- */}
          <CollapsibleSection title={readonlyText.sections.serviceType} defaultOpen={false}>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField
                label={readonlyText.fields.category}
                value={item?.category_label ?? item?.category?.label ?? noData}
              />
              <InfoField
                label={readonlyText.fields.operation}
                value={item?.operation?.name ?? noData}
              />
              <InfoField
                label={readonlyText.fields.activity}
                value={item?.activity?.name ?? noData}
              />
            </SimpleGrid>
          </CollapsibleSection>

          {/* ---- 3/6 — "Execução" (readonly — área/cultura/lote/categoria
              animal). NÃO confundir com a seção editável "Execução" mais
              abaixo — o legado usa o mesmo título para os dois cards. ---- */}
          <CollapsibleSection title={readonlyText.sections.execution} defaultOpen={false}>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField
                label={readonlyText.fields.area}
                value={item?.area?.description ?? item?.area?.name ?? noData}
              />
              <InfoField
                label={readonlyText.fields.cultivation}
                value={item?.cultivation?.name ?? noData}
              />
              <InfoField label={readonlyText.fields.batch} value={item?.batch?.name ?? noData} />
              <InfoField
                label={readonlyText.fields.categoryAnimal}
                value={item?.category_animal?.name ?? noData}
              />
            </SimpleGrid>
          </CollapsibleSection>

          {/* ---- 4/6 — "Condições e Restrições". ---- */}
          <CollapsibleSection title={readonlyText.sections.conditions} defaultOpen={false}>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField
                label={readonlyText.fields.weatherRequirements}
                value={item?.weather_requirements ?? noData}
              />
              <InfoField
                label={readonlyText.fields.minimumTemperature}
                value={
                  item?.minimum_temperature != null ? String(item.minimum_temperature) : noData
                }
              />
              <InfoField
                label={readonlyText.fields.maximumTemperature}
                value={
                  item?.maximum_temperature != null ? String(item.maximum_temperature) : noData
                }
              />
              <InfoField
                label={readonlyText.fields.allowedWorkingPeriodStart}
                value={item?.allowed_working_period_start ?? noData}
              />
              <InfoField
                label={readonlyText.fields.allowedWorkingPeriodEnd}
                value={item?.allowed_working_period_end ?? noData}
              />
            </SimpleGrid>
          </CollapsibleSection>

          {/* ---- 5/6 — "Instruções Detalhadas". ---- */}
          <CollapsibleSection title={readonlyText.sections.instructions} defaultOpen={false}>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField
                label={readonlyText.fields.serviceDescription}
                value={item?.service_description ?? noData}
              />
              <InfoField
                label={readonlyText.fields.expectedResultDescription}
                value={item?.expected_result_description ?? noData}
              />
              <InfoField
                label={readonlyText.fields.successCriteriaDescription}
                value={item?.success_criteria_description ?? noData}
              />
              <InfoField
                label={readonlyText.fields.roadmapDescription}
                value={item?.roadmap_description ?? noData}
              />
            </SimpleGrid>
          </CollapsibleSection>

          {/* ---- 6/6 — "Segurança e Sustentabilidade". ---- */}
          <CollapsibleSection title={readonlyText.sections.safety} defaultOpen={false}>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField
                label={readonlyText.fields.environmentalRestrictions}
                value={item?.environmental_restrictions ?? noData}
              />
              <InfoField
                label={readonlyText.fields.legalCompliance}
                value={item?.legal_compliance ?? noData}
              />
            </SimpleGrid>
          </CollapsibleSection>

          {/* ---- Cards de checklist CONDICIONAIS (FLD-26..32) — mirror
              `_forms.blade.php`: cada card só renderiza `@if
              ($item->{relacao}->isNotEmpty())`. Substituem o antigo
              `Tabs.Root` (correção de fidelidade, execução 063, 2ª rodada).
              Mão de Obra é 1 ÚNICO card (achado §1 — RN-08, `employees[]`
              já unificado). Ordem 1:1 do legado: Insumos / Máq·Implementos /
              Mão de obra / Proteções(EPI) / Produção. ---- */}
          {(item?.products?.length ?? 0) > 0 && (
            <CollapsibleSection title={formText.sections.products}>
              <MyServiceOrderChecklistTab
                lines={item?.products ?? []}
                control={control}
                name="products_checked_ids"
                emptyLabel={formText.checklist.emptyRow}
                isCheckedLabel={formText.checklist.isChecked}
                itemLabel={formText.checklist.itemLabel}
                isDisabled={isBusy || isReadOnly}
              />
            </CollapsibleSection>
          )}

          {(item?.equipments?.length ?? 0) > 0 && (
            <CollapsibleSection title={formText.sections.equipment}>
              <MyServiceOrderChecklistTab
                lines={item?.equipments ?? []}
                control={control}
                name="equipments_checked_ids"
                emptyLabel={formText.checklist.emptyRow}
                isCheckedLabel={formText.checklist.isChecked}
                itemLabel={formText.checklist.itemLabel}
                isDisabled={isBusy || isReadOnly}
              />
            </CollapsibleSection>
          )}

          {(item?.employees?.length ?? 0) > 0 && (
            <CollapsibleSection title={formText.sections.labor}>
              <MyServiceOrderChecklistTab
                lines={item?.employees ?? []}
                control={control}
                name="employees_checked_ids"
                emptyLabel={formText.checklist.emptyRow}
                isCheckedLabel={formText.checklist.isChecked}
                itemLabel={formText.checklist.itemLabel}
                isDisabled={isBusy || isReadOnly}
              />
            </CollapsibleSection>
          )}

          {(item?.protections?.length ?? 0) > 0 && (
            <CollapsibleSection title={formText.sections.protections}>
              <MyServiceOrderChecklistTab
                lines={item?.protections ?? []}
                control={control}
                name="protections_checked_ids"
                emptyLabel={formText.checklist.emptyRow}
                isCheckedLabel={formText.checklist.isChecked}
                itemLabel={formText.checklist.itemLabel}
                isDisabled={isBusy || isReadOnly}
              />
            </CollapsibleSection>
          )}

          {(item?.productions?.length ?? 0) > 0 && (
            <CollapsibleSection title={formText.sections.productions}>
              <MyServiceOrderChecklistTab
                lines={item?.productions ?? []}
                control={control}
                name="productions_checked_ids"
                emptyLabel={formText.checklist.emptyRow}
                isCheckedLabel={formText.checklist.isChecked}
                itemLabel={formText.checklist.itemLabel}
                isDisabled={isBusy || isReadOnly}
              />
            </CollapsibleSection>
          )}

          {/* ---- Modo LEITURA (execução 086) ---- */}
          {isReadOnly && (
            <CollapsibleSection title={formText.sections.execution}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField
                  label={formText.readOnly.statusLabel}
                  value={item?.status.label ?? noData}
                />
                <InfoField
                  label={formText.fields.executionStartDate}
                  value={formatServiceOrderDate(item?.execution_start_date, DATE_TIME_PATTERN)}
                />
                <InfoField
                  label={formText.fields.executionEndDate}
                  value={formatServiceOrderDate(item?.execution_end_date, DATE_TIME_PATTERN)}
                />
                <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
                  <InfoField
                    label={formText.fields.executionProblems}
                    value={item?.execution_problems || noData}
                  />
                </Box>
                <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
                  <InfoField
                    label={formText.fields.correctiveActions}
                    value={item?.corrective_actions || noData}
                  />
                </Box>
              </SimpleGrid>
            </CollapsibleSection>
          )}

          {isReadOnly && isCancelled && item?.cancellation_reason && (
            <CollapsibleSection title={cancellationText.sections.cancellation}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField
                  label={cancellationText.cancellation.reason}
                  value={item.cancellation_reason}
                />
                <InfoField
                  label={cancellationText.cancellation.date}
                  value={formatServiceOrderDate(item.cancellation_date, DATE_TIME_PATTERN)}
                />
                <InfoField
                  label={cancellationText.cancellation.user}
                  value={item.cancellation_user?.name ?? noData}
                />
              </SimpleGrid>
            </CollapsibleSection>
          )}

          {isReadOnly && (
            <CollapsibleSection title={formText.sections.attachments}>
              {(item?.attachments?.length ?? 0) === 0 ? (
                <Text fontSize="sm" color="fg.muted" py={2}>
                  {formText.checklist.emptyRow}
                </Text>
              ) : (
                <Flex direction="column" gap={2} py={2}>
                  {item?.attachments.map((attachment) => (
                    <Link
                      key={attachment.uuid}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      fontSize="sm"
                    >
                      {attachment.name || attachment.filename}
                    </Link>
                  ))}
                </Flex>
              )}
            </CollapsibleSection>
          )}

          {!isReadOnly && (
            <>
              {/* ---- Bloco EDITÁVEL "Execução" — os 5 campos, FLD-33..37.
              Sempre aberto (é o objetivo desta tela). `execution_end_date`
              `required` apenas quando `status.value===3` (DEF-02, replicado
              no client — fonte de verdade é o backend). Posição no legado:
              depois dos cards de checklist condicionais e antes do card de
              Evidências. ---- */}
              <CollapsibleSection title={formText.sections.execution}>
                <SimpleGrid columns={columnsForm.default} gap={6}>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label={formText.fields.status}
                        name={field.name}
                        value={field.value}
                        onChange={(option) => field.onChange(option ?? null)}
                        options={statusOptions}
                        placeholder={formText.placeholders.status}
                        error={errors.status?.message as string | undefined}
                        isRequired
                      />
                    )}
                  />

                  <Controller
                    name="execution_start_date"
                    control={control}
                    render={({ field }) => (
                      <Field
                        label={formText.fields.executionStartDate}
                        isRequired
                        errorText={errors.execution_start_date?.message as string | undefined}
                      >
                        <Input
                          type="datetime-local"
                          name={field.name}
                          value={field.value ?? ''}
                          onChange={(event) => field.onChange(event.target.value || null)}
                        />
                      </Field>
                    )}
                  />

                  <Controller
                    name="execution_end_date"
                    control={control}
                    render={({ field }) => (
                      <Field
                        label={formText.fields.executionEndDate}
                        isRequired={watchedStatus?.value === 3}
                        helperText={
                          watchedStatus?.value === 3
                            ? formText.executionEndDateRequiredWhenCompleted
                            : undefined
                        }
                        errorText={errors.execution_end_date?.message as string | undefined}
                      >
                        <Input
                          type="datetime-local"
                          name={field.name}
                          value={field.value ?? ''}
                          onChange={(event) => field.onChange(event.target.value || null)}
                        />
                      </Field>
                    )}
                  />

                  <Controller
                    name="execution_problems"
                    control={control}
                    render={({ field }) => (
                      <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
                        <Textarea
                          label={formText.fields.executionProblems}
                          name={field.name}
                          value={field.value ?? ''}
                          onChange={(event) => field.onChange(event.target.value)}
                          error={errors.execution_problems?.message as string | undefined}
                        />
                      </Box>
                    )}
                  />

                  <Controller
                    name="corrective_actions"
                    control={control}
                    render={({ field }) => (
                      <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
                        <Textarea
                          label={formText.fields.correctiveActions}
                          name={field.name}
                          value={field.value ?? ''}
                          onChange={(event) => field.onChange(event.target.value)}
                          error={errors.corrective_actions?.message as string | undefined}
                        />
                      </Box>
                    )}
                  />
                </SimpleGrid>
              </CollapsibleSection>

              {/* ---- Card "Evidências" (FLD-38..40) — SEMPRE renderizado, o
              legado não condiciona o card de anexos. ---- */}
              <CollapsibleSection title={formText.sections.attachments}>
                <MyServiceOrderAttachmentsTab
                  control={control}
                  errors={errors}
                  watch={watch}
                  isLoading={isBusy}
                  canSave
                  myServiceOrderData={item}
                />
              </CollapsibleSection>
            </>
          )}
        </Flex>
      </Form>
    </FormContainer>
  );
}
