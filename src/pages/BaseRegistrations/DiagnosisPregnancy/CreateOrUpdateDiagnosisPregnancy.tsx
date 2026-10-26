// src/pages/BaseRegistrations/DiagnosisPregnancy/CreateOrUpdateDiagnosisPregnancy.tsx
// Tela ÚNICA de criação/edição de Diagnóstico de Gestação (Cadastros Base → Pecuários).

import { SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
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

import { diagnosisPregnancySchemaResolver } from '@/validations/schemas/BaseRegistrations/diagnosisPregnancy-schema';

import {
  createDiagnosisPregnancy,
  getDiagnosisPregnancyByUuid,
  updateDiagnosisPregnancy,
} from '@/services/v2/BaseRegistrations/diagnosisPregnancy-service';

import type { Option } from '@/@types/option';
import type {
  DiagnosisPregnancyData,
  DiagnosisPregnancyForm as DiagnosisPregnancyFormType,
  DiagnosisPregnancyPayload,
} from '@/@types/v2/BaseRegistrations/diagnosisPregnancy';

export default function CreateOrUpdateDiagnosisPregnancy() {
  const { diagnosisPregnancyId } = useParams<{ diagnosisPregnancyId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(diagnosisPregnancyId);

  const canSave = isEditing
    ? can('diagnosis_pregnancies_edit')
    : can('diagnosis_pregnancies_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<DiagnosisPregnancyFormType>({
    mode: 'onChange',
    resolver: diagnosisPregnancySchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
    },
  });

  function fillForm(data: DiagnosisPregnancyData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        is_enabled: !!data.is_enabled,
      });
    }
  }

  const diagnosisPregnancyQuery = useCustomFormQueryByGuid<DiagnosisPregnancyData>({
    registrationId: isEditing ? diagnosisPregnancyId : undefined,
    queryKey: queryKey.baseRegistrations.diagnosisPregnancy,
    asyncFunction: getDiagnosisPregnancyByUuid,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([diagnosisPregnancyQuery as any]);

  const diagnosisPregnancyMutation = useRequest({
    asyncFunction: tryPersistDiagnosisPregnancy,
    entityName: languageGB.baseRegistrations.diagnosisPregnancy.singularLabel,
    queryKey: queryKey.baseRegistrations.diagnosisPregnancies,
    queryKey2: queryKey.baseRegistrations.diagnosisPregnancy,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistDiagnosisPregnancy(data: DiagnosisPregnancyFormType) {
    if (isEditing && diagnosisPregnancyId) {
      // Update envia SÓ o delta de `dirtyFields` — nenhum campo não-alterado
      // é reenviado (mesma convenção de `tryPersistSpecie`/`tryPersistCostCenter`).
      // Revertido o paliativo de payload completo (Emenda v1.2/PATTERN
      // update-parcial-patch-friendly §8): `DiagnosisPregnancyRequest` agora
      // aceita update parcial (`sometimes` por verbo, TASK-04 backend).
      const payload: Partial<DiagnosisPregnancyPayload> = {};
      if (dirtyFields.description) payload.description = data.description.trim();
      if (dirtyFields.is_enabled) payload.is_enabled = !!data.is_enabled;
      return await updateDiagnosisPregnancy(diagnosisPregnancyId, payload);
    }

    // CREATE: conjunto completo.
    const payload: DiagnosisPregnancyPayload = {
      description: data.description.trim(),
      is_enabled: !!data.is_enabled,
    };
    return await createDiagnosisPregnancy(payload);
  }

  // "editar sem alterar nada = Cancelar" (só volta sem salvar quando NADA
  // mudou). ERRO-FE-001: `src/utils/isEmpty.ts` é MAL NOMEADA — retorna `true`
  // quando o objeto TEM alguma chave própria. A guarda correta é portanto
  // `!isEmpty(dirtyFields)` (mesma semântica já usada em `fillForm` acima), e
  // é a mesma correção já aplicada em `CreateOrUpdateEspecie.tsx`
  // (TASK-ESP-FIX-3, FIX 1). Sem o `!`, toda edição REAL (com `dirtyFields`
  // preenchido) caía no `navigate(-1)` e a mutation nunca era chamada — o
  // registro não atualizava, em silêncio.
  async function onSubmit(data: DiagnosisPregnancyFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await diagnosisPregnancyMutation.mutateAsync(data);
    }
  }

  const isSubmitting = diagnosisPregnancyMutation.isPending;

  // Reaproveita os textos já existentes da listagem (Ativo/Inativo) — mesmo
  // racional de `CreateOrUpdateEspecie.tsx` (evita duplicar chave de i18n
  // para o mesmo par de rótulos).
  const statusOptions: Option<boolean>[] = [
    { value: true, label: languageGB.baseRegistrations.diagnosisPregnancy.list.table.active },
    { value: false, label: languageGB.baseRegistrations.diagnosisPregnancy.list.table.inactive },
  ];

  return (
    <FormContainer
      title={
        isEditing
          ? languageGB.baseRegistrations.diagnosisPregnancy.form.title.edit
          : languageGB.baseRegistrations.diagnosisPregnancy.form.title.create
      }
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
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Input
            label={languageGB.baseRegistrations.diagnosisPregnancy.form.fields.description}
            placeholder={
              languageGB.baseRegistrations.diagnosisPregnancy.form.placeholders.description
            }
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={languageGB.baseRegistrations.diagnosisPregnancy.form.fields.isEnabled}
                name={name}
                value={statusOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={statusOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
