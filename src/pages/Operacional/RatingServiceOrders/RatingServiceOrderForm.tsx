// src/pages/Operacional/RatingServiceOrders/RatingServiceOrderForm.tsx
// -----------------------------------------------------------------------------
// Formulário de AVALIAÇÃO one-shot de Ordem de Serviço (RatingServiceOrder)
// — TASK-FE-041-AVL-03 (esteira 041, SCREEN-02 do plano). Rota
// `/operacional/avaliacoes/:uuid`, SEMPRE modo edição — `mode_matrix.criar
// = NAO_APLICAVEL`, esta rota nunca tem variante `/novo`.
//
// Bloco readonly (contexto da OS) — reaproveita o MESMO padrão visual
// (`CollapsibleSection`/`InfoField`) e o MESMO tipo `ServiceOrderDetail` já
// usados em `ServiceOrderDetalhe.tsx` (risco de duplicar ~150 linhas,
// `plano-front-avaliacoes.md` "Leitura do dev"): seções "Identificação"
// (`header`) + "Condições e Instruções" (`conditions`) + "Execução"
// (`execution`) — as MESMAS 3 seções escalares da Visualização, na MESMA
// ordem, reaproveitando `languageGB.serviceOrders.serviceOrder.detail.*`
// (não duplica tradução). A seção "Avaliação" da Visualização é SUBSTITUÍDA
// aqui pelo bloco EDITÁVEL abaixo — nunca duplicada como readonly nesta
// tela. Os 5 blocos de linha (mão de obra/equipamentos/insumos/produção/
// proteções) NÃO são reproduzidos — são contexto de EXECUÇÃO da OS, não da
// avaliação (`core_finding` da matriz FID-G3F: "nota/feedback residem
// exclusivamente nos 4 campos de `service_orders`"), e o próprio legado só
// submete os 4 campos (round_trip step 5).
//
// Bloco editável ("Avaliação") — `assessment_grade` (1..5)/`rating_date`
// (datetime-local nativo, FLD-034/DIV-004 — sem datepicker customizado,
// mesma fidelidade do legado)/`feedback`/`recommendations`. Submit único
// via `useRequest` (`typesRequest: 'update'`) → `PUT
// /rating-service-orders/{uuid}` (só os 4 campos) → sucesso: toast +
// `navigate('/operacional/avaliacoes')` (mirror INT-011/SE-002, sem modal
// de confirmação).
//
// Execução 086 (API-06/FE-03): o GET responde para TODA OS exibida na lista
// (solicitante, status >= 3) com `can_rate` (true só no status 3). Com
// `can_rate=false` (ou sem permissão `rating-service-orders_edit`) a tela abre
// em MODO LEITURA, sem submit: dados da OS + avaliação registrada (status 4)
// ou bloco de cancelamento (status 9). O estado "não encontrado" ficou só para
// erro real de carga (404/rede), sem recuperação client-side.
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Box, EmptyState, Flex, Icon, Input, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { formatServiceOrderDate } from '@/pages/Operacional/ServiceOrders/ServiceOrderDetailBody';
import { getServiceOrderStatusBadgeColor } from '@/pages/Operacional/ServiceOrders/serviceOrderStatus';

import { Button } from '@/components/Button';
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
import { queryKey } from '@/constants/query-key';
import { getAssessmentGradeOptions } from '@/constants/ratingServiceOrders/options/assessment-grade-options';

import { ratingServiceOrderSchemaResolver } from '@/validations/schemas/RatingServiceOrders/rating-service-order-schema';

import { updateRatingServiceOrder } from '@/services/v2/RatingServiceOrders/rating-service-order-service';

import type {
  RatingServiceOrderDetail,
  RatingServiceOrderForm as RatingServiceOrderFormType,
  RatingServiceOrderPayload,
} from '@/@types/v2/RatingServiceOrders';

import { useRatingServiceOrderForm } from './useRatingServiceOrders';

const RATING_SERVICE_ORDERS_LIST_ROUTE = '/operacional/avaliacoes';

const DATE_TIME_PATTERN = 'dd/MM/yyyy HH:mm';

const defaultValues: RatingServiceOrderFormType = {
  assessment_grade: null,
  rating_date: null,
  feedback: null,
  recommendations: null,
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

export default function RatingServiceOrderForm() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  const text = languageGB.ratingServiceOrders.ratingServiceOrder;
  const formText = text.form;
  const contextText = languageGB.serviceOrders.serviceOrder.detail;
  const noData = '—';

  const gradeOptions = getAssessmentGradeOptions(languageGB);

  const { can } = usePermissions();
  const canEditPermission = can('rating-service-orders_edit');

  const validId = isValidGuid(uuid);

  useEffect(() => {
    if (!validId) {
      navigate(RATING_SERVICE_ORDERS_LIST_ROUTE, { replace: true });
    }
  }, [validId, navigate]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<RatingServiceOrderFormType>({
    mode: 'onChange',
    resolver: ratingServiceOrderSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues,
  });

  function fillRatingServiceOrderForm(data: RatingServiceOrderDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        assessment_grade:
          data.assessment_grade != null
            ? (gradeOptions.find((option) => option.value === data.assessment_grade) ?? null)
            : null,
        rating_date: data.rating_date,
        feedback: data.feedback,
        recommendations: data.recommendations,
      });
    }
  }

  const ratingServiceOrderQuery = useRatingServiceOrderForm({
    registrationId: validId ? uuid : undefined,
    fillForm: fillRatingServiceOrderForm,
  });

  const isLoading = checkLoadingStatus([ratingServiceOrderQuery as any]);
  const item = ratingServiceOrderQuery.data as RatingServiceOrderDetail | undefined;
  const isError = !isLoading && (ratingServiceOrderQuery as any).isError;
  // Modo leitura: OS carregada e sem permissão de avaliar agora (`can_rate`
  // do backend é a fonte de verdade; a permissão só esconde a ação).
  const isReadOnly = !!item && (item.can_rate !== true || !canEditPermission);
  const isCancelled = item?.status.value === 9 || !!item?.cancellation_reason;
  const hasRating = item?.status.value === 4 || item?.assessment_grade != null;

  const ratingMutation = useRequest({
    asyncFunction: async (payload: RatingServiceOrderPayload) => {
      if (!uuid) throw new Error('ID inválido');
      return await updateRatingServiceOrder(uuid, payload);
    },
    queryKey: queryKey.ratingServiceOrders.ratingServiceOrders,
    queryKey2: queryKey.ratingServiceOrders.ratingServiceOrder,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: formText.updatedToast,
    actionSuccess: () => {
      navigate(RATING_SERVICE_ORDERS_LIST_ROUTE);
    },
  });

  function onSubmit(data: RatingServiceOrderFormType) {
    if (isReadOnly) return;
    if (!data.assessment_grade || !data.rating_date || !data.feedback) return;

    const payload: RatingServiceOrderPayload = {
      assessment_grade: data.assessment_grade.value,
      rating_date: data.rating_date,
      feedback: data.feedback,
      recommendations: data.recommendations || null,
    };
    ratingMutation.mutate(payload);
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
                onClick={() => navigate(RATING_SERVICE_ORDERS_LIST_ROUTE)}
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
            onClick={() => navigate(RATING_SERVICE_ORDERS_LIST_ROUTE)}
          />
        ) : (
          <>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="secondary"
              type="button"
              onClick={() => navigate(RATING_SERVICE_ORDERS_LIST_ROUTE)}
            />
            <Button
              title={languageGB.defaltStrings.save}
              type="button"
              onClick={handleSubmit(onSubmit)}
              loading={isSubmitting || ratingMutation.isPending}
              disabled={isSubmitting || ratingMutation.isPending || isLoading}
            />
          </>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Flex direction="column" gap={4} mt={6}>
          {/* ---- Contexto readonly da OS — mesmas 3 seções escalares de
              `ServiceOrderDetalhe.tsx` (header/conditions/execution),
              MENOS "Avaliação" (substituída pelo bloco editável abaixo). ---- */}
          <CollapsibleSection title={contextText.sections.header}>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField label={contextText.fields.code} value={item?.code ?? noData} />
              <InfoField
                label={contextText.fields.dtEmission}
                value={formatServiceOrderDate(item?.dt_emission)}
              />
              <InfoField
                label={contextText.fields.executionDate}
                value={formatServiceOrderDate(item?.execution_date)}
              />
              <InfoField
                label={contextText.fields.deadline}
                value={formatServiceOrderDate(item?.deadline)}
              />
              <InfoField
                label={contextText.fields.category}
                value={
                  item?.category_label ??
                  (item?.category !== undefined && item?.category !== null
                    ? String(item.category)
                    : noData)
                }
              />
              <InfoField label={contextText.fields.area} value={item?.area?.name ?? noData} />
              <InfoField
                label={contextText.fields.cultivation}
                value={item?.cultivation?.name ?? noData}
              />
              <InfoField label={contextText.fields.batch} value={item?.batch?.name ?? noData} />
              <InfoField
                label={contextText.fields.categoryAnimal}
                value={item?.category_animal?.name ?? noData}
              />
              <InfoField
                label={contextText.fields.operation}
                value={item?.operation?.name ?? noData}
              />
              <InfoField
                label={contextText.fields.activity}
                value={item?.activity?.name ?? noData}
              />
              <InfoField label={contextText.fields.user} value={item?.user?.name ?? noData} />
              <InfoField
                label={contextText.fields.executor}
                value={item?.executor?.name ?? noData}
              />
            </SimpleGrid>
          </CollapsibleSection>

          <CollapsibleSection title={contextText.sections.conditions} defaultOpen={false}>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField
                label={contextText.fields.weatherRequirements}
                value={item?.weather_requirements ?? noData}
              />
              <InfoField
                label={contextText.fields.minimumTemperature}
                value={
                  item?.minimum_temperature != null ? String(item.minimum_temperature) : noData
                }
              />
              <InfoField
                label={contextText.fields.maximumTemperature}
                value={
                  item?.maximum_temperature != null ? String(item.maximum_temperature) : noData
                }
              />
              <InfoField
                label={contextText.fields.allowedWorkingPeriodStart}
                value={item?.allowed_working_period_start ?? noData}
              />
              <InfoField
                label={contextText.fields.allowedWorkingPeriodEnd}
                value={item?.allowed_working_period_end ?? noData}
              />
              <InfoField
                label={contextText.fields.environmentalRestrictions}
                value={item?.environmental_restrictions ?? noData}
              />
              <InfoField
                label={contextText.fields.legalCompliance}
                value={item?.legal_compliance ?? noData}
              />
              <InfoField
                label={contextText.fields.serviceDescription}
                value={item?.service_description ?? noData}
              />
              <InfoField
                label={contextText.fields.expectedResultDescription}
                value={item?.expected_result_description ?? noData}
              />
              <InfoField
                label={contextText.fields.successCriteriaDescription}
                value={item?.success_criteria_description ?? noData}
              />
              <InfoField
                label={contextText.fields.roadmapDescription}
                value={item?.roadmap_description ?? noData}
              />
            </SimpleGrid>
          </CollapsibleSection>

          <CollapsibleSection title={contextText.sections.execution} defaultOpen={false}>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField
                label={contextText.fields.executionStartDate}
                value={formatServiceOrderDate(item?.execution_start_date, DATE_TIME_PATTERN)}
              />
              <InfoField
                label={contextText.fields.executionEndDate}
                value={formatServiceOrderDate(item?.execution_end_date, DATE_TIME_PATTERN)}
              />
              <InfoField
                label={contextText.fields.executionProblems}
                value={item?.execution_problems ?? noData}
              />
              <InfoField
                label={contextText.fields.correctiveActions}
                value={item?.corrective_actions ?? noData}
              />
            </SimpleGrid>
          </CollapsibleSection>

          {/* ---- Modo LEITURA (execução 086) — avaliação registrada (4),
              cancelamento (9) ou aviso de pendência (3 sem permissão). ---- */}
          {isReadOnly && isCancelled && (
            <CollapsibleSection title={contextText.sections.cancellation}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField
                  label={contextText.cancellation.reason}
                  value={item?.cancellation_reason ?? noData}
                />
                <InfoField
                  label={contextText.cancellation.date}
                  value={formatServiceOrderDate(item?.cancellation_date, DATE_TIME_PATTERN)}
                />
                <InfoField
                  label={contextText.cancellation.user}
                  value={item?.cancellation_user?.name ?? noData}
                />
              </SimpleGrid>
            </CollapsibleSection>
          )}

          {isReadOnly && !isCancelled && (
            <CollapsibleSection title={formText.sections.assessment}>
              {hasRating ? (
                <SimpleGrid columns={columnsForm.default} gap={6}>
                  <InfoField
                    label={formText.fields.assessmentGrade}
                    value={item?.assessment_grade != null ? String(item.assessment_grade) : noData}
                  />
                  <InfoField
                    label={formText.fields.ratingDate}
                    value={formatServiceOrderDate(item?.rating_date, DATE_TIME_PATTERN)}
                  />
                  <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
                    <InfoField label={formText.fields.feedback} value={item?.feedback || noData} />
                  </Box>
                  <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
                    <InfoField
                      label={formText.fields.recommendations}
                      value={item?.recommendations || noData}
                    />
                  </Box>
                </SimpleGrid>
              ) : (
                <Text fontSize="sm" color="fg.muted">
                  {formText.readOnly.assessmentPending}
                </Text>
              )}
            </CollapsibleSection>
          )}

          {/* ---- Bloco EDITÁVEL "Avaliação" — os 4 campos, FLD-034..037.
              Sempre aberto (é o objetivo desta tela). ---- */}
          {!isReadOnly && (
            <CollapsibleSection title={formText.sections.assessment}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <Controller
                  name="assessment_grade"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={formText.fields.assessmentGrade}
                      name={field.name}
                      value={field.value}
                      onChange={(option) => field.onChange(option ?? null)}
                      options={gradeOptions}
                      placeholder={formText.placeholders.assessmentGrade}
                      error={errors.assessment_grade?.message as string | undefined}
                      isRequired
                    />
                  )}
                />

                <Controller
                  name="rating_date"
                  control={control}
                  render={({ field }) => (
                    <Field
                      label={formText.fields.ratingDate}
                      isRequired
                      errorText={errors.rating_date?.message as string | undefined}
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
                  name="feedback"
                  control={control}
                  render={({ field }) => (
                    <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
                      <Textarea
                        label={formText.fields.feedback}
                        name={field.name}
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(event.target.value)}
                        error={errors.feedback?.message as string | undefined}
                        isRequired
                      />
                    </Box>
                  )}
                />

                <Controller
                  name="recommendations"
                  control={control}
                  render={({ field }) => (
                    <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
                      <Textarea
                        label={formText.fields.recommendations}
                        name={field.name}
                        value={field.value ?? ''}
                        onChange={(event) => field.onChange(event.target.value)}
                        error={errors.recommendations?.message as string | undefined}
                      />
                    </Box>
                  )}
                />
              </SimpleGrid>
            </CollapsibleSection>
          )}
        </Flex>
      </Box>
    </FormContainer>
  );
}
