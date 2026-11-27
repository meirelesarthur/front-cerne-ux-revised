// src/pages/CadastrosBase/ServicosAgricolas/CreateOrUpdateServico.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (27/11/2026, não portar) — formulário (novo e editar) de SERVIÇO, tela cheia como as demais.
// Rotas: /cadastros-base/servicos-agricolas/novo e /cadastros-base/servicos-agricolas/:uuid.
//
// Só nome, descrição, status e "Tipos de serviço em que aparece" (escolha de vários, ao menos um).
// Nada de parâmetros: eles ficam no Tipo de serviço. "Valor/Hectare" e "Tipo (À Definir)" saíram.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { columnsForm } from '@/constants/coluns-form';

import type { Option } from '@/@types/option';

import { SERVICES_ROUTE } from '../TiposServico/serviceTypeRoutes';
import { listServiceTypeOptions, serviceTypeQueryKey } from '../TiposServico/serviceTypeService';
import {
  createService,
  getService,
  type ServicePayload,
  serviceQueryKey,
  updateService,
} from './serviceService';

interface FormValues {
  name: string;
  description: string;
  is_enabled: boolean;
  service_type_uuids: string[];
}

const DEFAULT_VALUES: FormValues = { name: '', description: '', is_enabled: true, service_type_uuids: [] };

const NAME_MAX = 60;
const DESCRIPTION_MAX = 120;

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export default function CreateOrUpdateServico() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.serviceTypes.service;
  const form = text.form;

  const isEditing = !!uuid && uuid !== 'novo';
  const canSave = isEditing ? can('activities_edit') : can('activities_create');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields, isSubmitted },
  } = useForm<FormValues>({ mode: 'onChange', defaultValues: DEFAULT_VALUES });

  const values = watch();
  const [typeSearch, setTypeSearch] = useState('');

  const detailQuery = useQuery({
    queryKey: [serviceQueryKey.detail, uuid],
    queryFn: async () => (await getService(uuid as string)).data,
    enabled: isEditing,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const data = detailQuery.data;
    if (!data) return;
    reset({
      name: data.name,
      description: data.description ?? '',
      is_enabled: data.is_enabled,
      service_type_uuids: data.service_types.map((t) => t.uuid),
    });
  }, [detailQuery.data, reset]);

  const typesQuery = useQuery({
    queryKey: [serviceTypeQueryKey.options],
    queryFn: listServiceTypeOptions,
  });
  const typeItems = (typesQuery.data ?? [])
    .filter((t) => !typeSearch.trim() || normalize(t.name).includes(normalize(typeSearch.trim())))
    .map((t) => ({ value: t.uuid, label: t.name }));

  const isLoading = isEditing && detailQuery.isLoading;

  const mutation = useRequest({
    asyncFunction: async (data: FormValues) => {
      const payload: ServicePayload = {
        name: data.name.trim(),
        description: data.description.trim() || null,
        is_enabled: data.is_enabled,
        service_type_uuids: data.service_type_uuids,
      };
      return isEditing ? updateService(uuid as string, payload) : createService(payload);
    },
    entityName: text.singularLabel,
    queryKey: serviceQueryKey.list,
    queryKey2: serviceQueryKey.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => navigate(SERVICES_ROUTE),
  });

  const isSubmitting = mutation.isPending;
  const noTypeSelected = values.service_type_uuids.length === 0;

  async function onSubmit(data: FormValues) {
    if (data.service_type_uuids.length === 0) return;
    await mutation.mutateAsync(data);
  }

  const enabledOptions: Option<boolean>[] = [
    { value: true, label: text.list.table.active },
    { value: false, label: text.list.table.inactive },
  ];

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
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
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

          <Select
            label={form.fields.isEnabled}
            name="is_enabled"
            value={enabledOptions.find((o) => o.value === values.is_enabled) ?? null}
            onChange={(opt: Option<boolean> | null) =>
              setValue('is_enabled', !!opt?.value, { shouldDirty: true, shouldValidate: true })
            }
            options={enabledOptions}
            isRequired
            noClearable
            isDisabled={!canSave}
            loading={isLoading}
          />
        </SimpleGrid>

        <Box mt={6}>
          <CheckboxListField<string>
            label={`${form.fields.serviceTypes} *`}
            tooltip={form.serviceTypesHint}
            items={typeItems}
            selectedValues={values.service_type_uuids}
            onChange={(next) => setValue('service_type_uuids', next, { shouldDirty: true, shouldValidate: true })}
            searchValue={typeSearch}
            onSearchChange={setTypeSearch}
            searchPlaceholder={form.placeholders.serviceTypesSearch}
            selectAllLabel={form.selectAll}
            deselectAllLabel={form.deselectAll}
            selectedCountLabel={form.serviceTypesSelected}
            emptyLabel={form.serviceTypesEmpty}
            isLoading={typesQuery.isLoading}
            isDisabled={!canSave}
            columns={columnsForm.threeColumns}
          />
          {noTypeSelected && (isSubmitted || dirtyFields.service_type_uuids) && (
            <Text role="alert" fontSize="sm" color="red.500" mt={2}>
              {form.validation.serviceTypesRequired}
            </Text>
          )}
        </Box>
      </Form>
    </FormContainer>
  );
}
