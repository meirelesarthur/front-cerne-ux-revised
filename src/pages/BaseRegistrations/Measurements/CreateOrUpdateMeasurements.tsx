// src/pages/BaseRegistrations/Measurements/CreateOrUpdateMeasurements.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de UN. DE MEDIDA (mesmo arquivo para os dois
// casos). Rotas: /cadastros-base/unidade-medida/novo (criar) e
// /cadastros-base/unidade-medida/:measurementId (editar, GUID) — ambas
// registradas em src/router/index.tsx (TASK-FE-056), guardadas por
// `measurements_view` (autorização real de create/edit é o 403 real do
// backend via `measurements_create`/`measurements_edit`).
//
// Fidelidade ao contrato (TASK-FE-053/055): EXATAMENTE 2 campos —
// `name` (Sigla, Input, obrigatório, max 8) + `description` (Descrição,
// Input, obrigatório, max 100). SEM Select/Switch de status/ativo —
// divergência estrutural intencional (Doc Bruta §4/§10, Measurement não tem
// `is_enabled` nem no legado nem no backend novo). Mirror ~1:1 de
// CadastrosBase/TiposIdentificacao/CreateOrUpdateTipoIdentificacao.tsx MENOS
// o campo de status.
//
// Payload SEMPRE completo (create e update) — `MeasurementRequest::rules()`
// não diferencia por verbo (full-resource-replace, mesmo racional de
// updateIdentificationType).
//
// ⚠️ LANDMINE `src/utils/isEmpty.ts` (ERRO-FE-001) — a função tem nome
// INVERTIDO: retorna `true` quando o objeto TEM chaves (não vazio) e `false`
// quando está vazio. Guard usado aqui é o CORRIGIDO, literalmente o mesmo de
// `CreateOrUpdateTipoIdentificacao.tsx`: `fillForm` só reseta quando
// `!isEmpty(dirtyFields) || resetForce`; `onSubmit` só volta sem salvar
// quando `isEditing && !isEmpty(dirtyFields)` (nada mudou). NÃO usar a
// leitura ingênua do nome (sem o `!`) — descartaria toda edição real em
// silêncio.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { measurementSchemaResolver } from '@/validations/schemas/BaseRegistrations/measurement-schema';

import {
  createMeasurement,
  getMeasurementByUuid,
  updateMeasurement,
} from '@/services/v2/Measurements/measurement-service';

import type {
  MeasurementData,
  MeasurementForm as MeasurementFormType,
  MeasurementPayload,
} from '@/@types/v2/Measurements';

export default function CreateOrUpdateMeasurements() {
  const { measurementId } = useParams<{ measurementId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(measurementId);

  // Guard de navegação: um `measurementId` presente mas que NÃO é um GUID
  // válido (ex.: URL adulterada manualmente) não deve chegar ao hook de query
  // nem renderizar um form "fantasma" — redireciona para a listagem, mesmo
  // racional de `CreateOrUpdateCausaMortePerda.tsx`.
  useEffect(() => {
    if (measurementId && !isValidGuid(measurementId)) {
      navigate('/cadastros-base/unidade-medida', { replace: true });
    }
  }, [measurementId, navigate]);

  const text = languageGB.baseRegistrations.measurement;

  const canSave = isEditing ? can('measurements_edit') : can('measurements_create');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<MeasurementFormType>({
    mode: 'onChange',
    resolver: measurementSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Lei 2 (obrigatória) — só reseta o form a partir do servidor quando
  // `dirtyFields` está REALMENTE vazio (nada editado ainda) ou quando forçado
  // (`resetForce`). `isEmpty()` é INVERTIDO (ver cabeçalho do arquivo) — daqui
  // vem o `!`.
  function fillForm(data: MeasurementData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        name: data.name,
        description: data.description,
      });
    }
  }

  const measurementQuery = useCustomFormQueryByGuid<MeasurementData>({
    registrationId: isEditing ? measurementId : undefined,
    queryKey: queryKey.baseRegistrations.measurement,
    asyncFunction: getMeasurementByUuid,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([measurementQuery as any]);

  const measurementMutation = useRequest({
    asyncFunction: tryPersistMeasurement,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.measurements,
    queryKey2: queryKey.baseRegistrations.measurement,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Payload SEMPRE completo — `name`/`description` são `required` nos dois
  // verbos (`MeasurementRequest::rules()` não diferencia por verbo), mesmo
  // racional de updateIdentificationType (full-resource-replace).
  async function tryPersistMeasurement(data: MeasurementFormType) {
    const payload: MeasurementPayload = {
      name: data.name.trim(),
      description: data.description.trim(),
    };

    if (isEditing && measurementId) {
      return await updateMeasurement(measurementId, payload);
    }
    return await createMeasurement(payload);
  }

  // Guard CORRIGIDO (ver cabeçalho do arquivo / ERRO-FE-001): "editar sem
  // alterar nada = Cancelar" — só volta sem salvar quando `isEditing` E
  // `dirtyFields` está REALMENTE vazio (`!isEmpty(dirtyFields)`, dado que
  // `isEmpty()` retorna `true` quando HÁ chaves). A versão sem o `!`
  // descartaria toda edição real em silêncio.
  async function onSubmit(data: MeasurementFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await measurementMutation.mutateAsync(data);
    }
  }

  const isSubmitting = measurementMutation.isPending;

  const watchedName = watch('name');
  const nameLength = (watchedName ?? '').length;
  const watchedDescription = watch('description');
  const descriptionLength = (watchedDescription ?? '').length;

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
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Input
            label={text.form.fields.name}
            placeholder={text.form.placeholders.name}
            helperText={errors.name?.message ? undefined : `${nameLength}/8`}
            {...register('name')}
            error={errors.name?.message}
            maxLength={8}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Input
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            helperText={errors.description?.message ? undefined : `${descriptionLength}/100`}
            {...register('description')}
            error={errors.description?.message}
            maxLength={100}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
