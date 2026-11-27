// src/pages/CadastrosBase/TiposServico/CreateOrUpdateTipoServico.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (27/11/2026, não portar) — formulário (novo e editar) de TIPO DE SERVIÇO, tela cheia como
// as demais. Rotas: /cadastros-base/tipos-de-servico/novo e /cadastros-base/tipos-de-servico/:uuid.
//
// Linha de cima igual à de Operações (Nome, Descrição, Ordem somente leitura, Status, Agrupador).
// Abaixo, seções do kit (`FormSection`) com os parâmetros que montam o Apontamento, o "Gera execução"
// e a prévia "Como fica o Apontamento". As regras de tela (uso x campos, texto máximo, fotos) vivem em
// `serviceTypeParams.ts` (lógica pura, com teste).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectCombobox } from '@/components/Form/SelectCombobox';
import { FormSection } from '@/components/FormSection';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Icon } from '@/components/ui/Icon';
import { ToggleRow } from '@/components/ui/ToggleRow';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { columnsForm } from '@/constants/coluns-form';

import type { Option } from '@/@types/option';

import { serviceQueryKey } from '../ServicosAgricolas/serviceService';
import {
  type AppointmentPreviewItem,
  appointmentPreview,
  DEFAULT_SERVICE_TYPE_PARAMS,
  fieldAppliesToUse,
  normalizeParamsForUse,
  type ServiceTypeParams,
  type ServiceTypeUse,
  type UseDependentField,
  validateServiceTypeParams,
} from './serviceTypeParams';
import { SERVICE_TYPES_ROUTE } from './serviceTypeRoutes';
import {
  createServiceType,
  getNextServiceTypeOrder,
  getServiceType,
  listPrototypeGrouperOptions,
  type ServiceTypePayload,
  serviceTypeQueryKey,
  updateServiceType,
} from './serviceTypeService';

interface FormValues extends ServiceTypeParams {
  name: string;
  description: string;
  order: number;
  is_enabled: boolean;
  grouper_uuid: string | null;
}

const DEFAULT_VALUES: FormValues = {
  ...DEFAULT_SERVICE_TYPE_PARAMS,
  name: '',
  description: '',
  order: 0,
  is_enabled: true,
  grouper_uuid: null,
};

const NAME_MAX = 60;
const DESCRIPTION_MAX = 120;

export default function CreateOrUpdateTipoServico() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.serviceTypes.serviceType;
  const form = text.form;

  const isEditing = !!uuid && uuid !== 'novo';
  const canSave = isEditing ? can('operations_edit') : can('operations_create');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({ mode: 'onChange', defaultValues: DEFAULT_VALUES });

  const values = watch();
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValue(key, value as never, { shouldDirty: true, shouldValidate: true });

  // ---- dados -------------------------------------------------------------------
  const detailQuery = useQuery({
    queryKey: [serviceTypeQueryKey.detail, uuid],
    queryFn: async () => (await getServiceType(uuid as string)).data,
    enabled: isEditing,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const data = detailQuery.data;
    if (!data) return;
    reset({
      ...DEFAULT_VALUES,
      ...data,
      description: data.description ?? '',
      grouper_uuid: data.grouper_uuid ?? null,
    });
  }, [detailQuery.data, reset]);

  // Só em criação: a "Ordem" é um número automático (o sistema manda nela), somente leitura.
  const nextOrderQuery = useQuery({
    queryKey: [serviceTypeQueryKey.nextOrder],
    queryFn: async () => (await getNextServiceTypeOrder()).data.next_order,
    enabled: !isEditing,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isEditing && nextOrderQuery.data !== undefined) setValue('order', nextOrderQuery.data);
  }, [isEditing, nextOrderQuery.data, setValue]);

  const groupersQuery = useQuery({
    queryKey: [serviceTypeQueryKey.groupers],
    queryFn: listPrototypeGrouperOptions,
    staleTime: Infinity,
  });
  const grouperOptions: Option<string>[] = (groupersQuery.data ?? []).map((g) => ({
    value: g.uuid,
    label: `${g.code} — ${g.name}`,
  }));

  const isLoading = isEditing && detailQuery.isLoading;

  // ---- salvar ------------------------------------------------------------------
  const paramsErrors = validateServiceTypeParams(values);

  const mutation = useRequest({
    asyncFunction: async (data: FormValues) => {
      const normalized = normalizeParamsForUse(data);
      const payload: ServiceTypePayload = {
        ...normalized,
        name: data.name.trim(),
        description: data.description.trim() || null,
        grouper_uuid: data.grouper_uuid,
        is_enabled: data.is_enabled,
        order: Number(data.order),
        min_photos: Number(normalized.min_photos) || 0,
        text_min: Number(normalized.text_min) || 0,
        text_max: Number(normalized.text_max) || 0,
      };
      return isEditing ? updateServiceType(uuid as string, payload) : createServiceType(payload);
    },
    entityName: text.singularLabel,
    queryKey: serviceTypeQueryKey.list,
    queryKey2: serviceTypeQueryKey.detail,
    queryKey3: serviceTypeQueryKey.options,
    queryKey4: serviceQueryKey.list,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => navigate(SERVICE_TYPES_ROUTE),
  });

  const isSubmitting = mutation.isPending;

  async function onSubmit(data: FormValues) {
    if (validateServiceTypeParams(data).length > 0) return;
    await mutation.mutateAsync(data);
  }

  // ---- uso: desliga o que não se aplica -----------------------------------------
  function changeUse(next: ServiceTypeUse) {
    const normalized = normalizeParamsForUse({ ...values, use: next });
    set('use', next);
    (['requires_harvest', 'requires_cultivation', 'requires_used_area', 'requires_batch'] as const).forEach((field) => {
      if (normalized[field] !== values[field]) set(field, normalized[field]);
    });
  }

  const useOptions: Option<ServiceTypeUse>[] = [
    { value: 'agricultura', label: text.useOptions.agriculture },
    { value: 'pecuaria', label: text.useOptions.livestock },
    { value: 'ambos', label: text.useOptions.both },
  ];
  const enabledOptions: Option<boolean>[] = [
    { value: true, label: text.list.table.active },
    { value: false, label: text.list.table.inactive },
  ];

  // ---- interruptores ------------------------------------------------------------
  const usageToggle = (field: UseDependentField, label: string, hint: string) => {
    const applies = fieldAppliesToUse(field, values.use);
    return (
      <ToggleRow
        label={label}
        checked={applies && values[field]}
        onChange={(v) => set(field, v)}
        hint={applies ? hint : form.notApplicable}
        disabled={!canSave || !applies}
      />
    );
  };

  type PlainToggle =
    | 'required_labor'
    | 'required_machines'
    | 'required_inputs'
    | 'generates_production'
    | 'requires_occurrence'
    | 'requires_signature'
    | 'notify_on_finish'
    | 'generates_execution';
  const plainToggle = (field: PlainToggle, label: string, hint: string) => (
    <ToggleRow label={label} checked={values[field]} onChange={(v) => set(field, v)} hint={hint} disabled={!canSave} />
  );

  // ---- prévia -------------------------------------------------------------------
  const preview = appointmentPreview(values);
  const previewLabel = (item: AppointmentPreviewItem): string => {
    const p = form.preview;
    switch (item.key) {
      case 'photos':
        return p.photos.replace('{count}', String(item.count ?? 0));
      case 'text': {
        const min = item.min ?? 0;
        const max = item.max ?? 0;
        if (min > 0 && max > 0) return p.textRange.replace('{min}', String(min)).replace('{max}', String(max));
        return min > 0 ? p.textMin.replace('{min}', String(min)) : p.textMax.replace('{max}', String(max));
      }
      default:
        return p.items[item.key];
    }
  };

  const textMaxError = paramsErrors.includes('textMaxLessThanMin')
    ? form.validation.textMaxLessThanMin
    : paramsErrors.includes('textNegative')
      ? form.validation.textNegative
      : undefined;

  return (
    <FormContainer
      title={isEditing ? form.title.edit : form.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
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
              disabled={isSubmitting || isLoading || paramsErrors.length > 0}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Input
            label={form.fields.name}
            placeholder={form.placeholders.name}
            {...register('name', {
              required: form.validation.nameRequired,
              validate: (v) => v.trim().length > 0 || form.validation.nameRequired,
              maxLength: { value: NAME_MAX, message: form.validation.nameMaxLength },
            })}
            error={errors.name?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Input
            label={form.fields.description}
            placeholder={form.placeholders.description}
            {...register('description', {
              maxLength: { value: DESCRIPTION_MAX, message: form.validation.descriptionMaxLength },
            })}
            error={errors.description?.message}
            loading={isLoading}
            disabled={!canSave}
          />

          <NumberInput
            name="order"
            label={form.fields.order}
            value={values.order ?? null}
            onValueChange={() => undefined}
            min={0}
            allowDot={false}
            isRequired
            // A ordem é automática (o sistema manda nela), como no cadastro de hoje.
            readOnly
            disabled
          />

          <Select
            label={form.fields.isEnabled}
            name="is_enabled"
            value={enabledOptions.find((o) => o.value === values.is_enabled) ?? null}
            onChange={(opt: Option<boolean> | null) => set('is_enabled', !!opt?.value)}
            options={enabledOptions}
            isRequired
            noClearable
            isDisabled={!canSave}
            loading={isLoading}
          />
        </SimpleGrid>

        <Box mt={6} mb={6}>
          <SelectCombobox<string>
            label={form.fields.grouper}
            name="grouper_uuid"
            placeholder={form.placeholders.grouper}
            size="md"
            options={grouperOptions}
            value={grouperOptions.find((o) => o.value === values.grouper_uuid) ?? null}
            onChange={(opt) => set('grouper_uuid', opt?.value ?? null)}
            disabled={!canSave}
            loading={isLoading || groupersQuery.isLoading}
          />
        </Box>

        <FormSection title={form.sections.appointment} subtitle={form.sections.appointmentHint}>
          <SimpleGrid columns={columnsForm.fourColumns} gap={4} mb={4}>
            <Select
              label={form.fields.use}
              name="use"
              value={useOptions.find((o) => o.value === values.use) ?? null}
              onChange={(opt: Option<ServiceTypeUse> | null) => opt && changeUse(opt.value)}
              options={useOptions}
              isRequired
              noClearable
              isDisabled={!canSave}
              loading={isLoading}
            />
            <NumberInput
              name="min_photos"
              label={form.fields.minPhotos}
              value={values.min_photos ?? null}
              onValueChange={(v) => set('min_photos', v ?? 0)}
              min={0}
              allowDot={false}
              error={paramsErrors.includes('minPhotosNegative') ? form.validation.minPhotosNegative : undefined}
              disabled={!canSave}
            />
            <NumberInput
              name="text_min"
              label={form.fields.textMin}
              value={values.text_min ?? null}
              onValueChange={(v) => set('text_min', v ?? 0)}
              min={0}
              allowDot={false}
              disabled={!canSave}
            />
            <NumberInput
              name="text_max"
              label={form.fields.textMax}
              value={values.text_max ?? null}
              onValueChange={(v) => set('text_max', v ?? 0)}
              min={0}
              allowDot={false}
              error={textMaxError}
              disabled={!canSave}
            />
          </SimpleGrid>

          <SimpleGrid columns={columnsForm.threeColumns} gap={3}>
            {usageToggle('requires_harvest', form.params.requiresHarvest, form.hints.requiresHarvest)}
            {usageToggle('requires_cultivation', form.params.requiresCultivation, form.hints.requiresCultivation)}
            {usageToggle('requires_batch', form.params.requiresBatch, form.hints.requiresBatch)}
            {usageToggle('requires_used_area', form.params.requiresUsedArea, form.hints.requiresUsedArea)}
            {plainToggle('generates_production', form.params.generatesProduction, form.hints.generatesProduction)}
            {plainToggle('requires_occurrence', form.params.requiresOccurrence, form.hints.requiresOccurrence)}
            {plainToggle('requires_signature', form.params.requiresSignature, form.hints.requiresSignature)}
            {plainToggle('notify_on_finish', form.params.notifyOnFinish, form.hints.notifyOnFinish)}
          </SimpleGrid>
        </FormSection>

        <FormSection title={form.sections.entries} subtitle={form.sections.entriesHint}>
          <SimpleGrid columns={columnsForm.threeColumns} gap={3}>
            {plainToggle('required_labor', form.params.requiredLabor, form.hints.requiredLabor)}
            {plainToggle('required_machines', form.params.requiredMachines, form.hints.requiredMachines)}
            {plainToggle('required_inputs', form.params.requiredInputs, form.hints.requiredInputs)}
          </SimpleGrid>
        </FormSection>

        <FormSection title={form.sections.execution} subtitle={form.sections.executionHint}>
          <Box maxW="420px">
            {plainToggle('generates_execution', form.params.generatesExecution, form.hints.generatesExecution)}
          </Box>
          <Box mt={3}>
            <Text
              fontSize="sm"
              color={values.generates_execution ? 'strongText' : 'fg.muted'}
              fontWeight={values.generates_execution ? 'semibold' : 'normal'}
            >
              {form.executionYes}
            </Text>
            <Text
              fontSize="sm"
              mt={1}
              color={values.generates_execution ? 'fg.muted' : 'strongText'}
              fontWeight={values.generates_execution ? 'normal' : 'semibold'}
            >
              {form.executionNo}
            </Text>
          </Box>
        </FormSection>

        <FormSection title={form.sections.preview}>
          <Box
            px="16px"
            py="14px"
            bg="semanticNeutral.100"
            borderWidth="1px"
            borderColor="semanticNeutral.200"
            borderRadius="8px"
            aria-live="polite"
          >
            <Text fontSize="sm" color="fg.muted" mb={preview.length ? 2 : 0}>
              {preview.length ? form.preview.intro : form.preview.empty}
            </Text>
            {preview.length > 0 && (
              <Flex as="ul" direction="column" gap="6px" listStyleType="none" m={0} p={0}>
                {preview.map((item) => (
                  <Flex as="li" key={item.key} align="center" gap="8px" fontSize="md" color="strongText">
                    <Box as="span" display="flex" color="green.600">
                      <Icon name="check" size="sm" />
                    </Box>
                    {previewLabel(item)}
                  </Flex>
                ))}
              </Flex>
            )}
          </Box>
        </FormSection>
      </Form>
    </FormContainer>
  );
}
