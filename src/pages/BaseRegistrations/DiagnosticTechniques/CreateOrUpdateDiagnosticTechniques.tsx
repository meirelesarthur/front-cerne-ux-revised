// src/pages/BaseRegistrations/DiagnosticTechniques/CreateOrUpdateDiagnosticTechniques.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de TÉCNICA DIAGNÓSTICO — Cadastros Base.
// Rotas: /cadastros-base/tecnicas-diagnostico/novo e
// /cadastros-base/tecnicas-diagnostico/:diagnosticTechniqueId (GUID),
// registradas em src/router/index.tsx, guardadas por
// `diagnostic_techniques_view`.
//
// EXATAMENTE 2 campos, nesta ordem — `description` (Input, obrigatório, max 100)
// seguido de `is_enabled` (Select Ativa/Inativa, obrigatório, default `true` no
// create). Sem FK, sem `code`, sem abas.
//
// Payload SEMPRE completo (create e update) — `DiagnosticTechniqueRequest::
// rules()` não diferencia por verbo (full-resource-replace, mesmo racional de
// updateLowReason, NÃO o delta opcional de updateSpecie/updateDiagnosisPregnancy).
//
// ⚠️ LANDMINE `src/utils/isEmpty.ts` (ERRO-FE-001) — a função tem nome
// INVERTIDO: retorna `true` quando o objeto TEM chaves (não vazio) e `false`
// quando está vazio. Guard usado aqui é o CORRIGIDO: `fillForm` só reseta quando
// `!isEmpty(dirtyFields) || resetForce` (ou seja, quando `dirtyFields` está
// REALMENTE vazio, ou é forçado); `onSubmit` só volta sem salvar quando
// `isEditing && !isEmpty(dirtyFields)` (ou seja, quando NADA mudou). NÃO usar
// a leitura ingênua do nome (sem o `!`) — descartaria toda edição real em
// silêncio.
// -----------------------------------------------------------------------------

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

import { diagnosticTechniqueSchemaResolver } from '@/validations/schemas/BaseRegistrations/diagnosticTechnique-schema';

import {
  createDiagnosticTechnique,
  getDiagnosticTechniqueByUuid,
  updateDiagnosticTechnique,
} from '@/services/v2/BaseRegistrations/diagnosticTechnique-service';

import type { Option } from '@/@types/option';
import type {
  DiagnosticTechniqueData,
  DiagnosticTechniqueForm as DiagnosticTechniqueFormType,
  DiagnosticTechniquePayload,
} from '@/@types/v2/BaseRegistrations/diagnosticTechnique';

export default function CreateOrUpdateDiagnosticTechniques() {
  const { diagnosticTechniqueId } = useParams<{ diagnosticTechniqueId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(diagnosticTechniqueId);

  const text = languageGB.baseRegistrations.diagnosticTechnique;

  const canSave = isEditing
    ? can('diagnostic_techniques_edit')
    : can('diagnostic_techniques_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<DiagnosticTechniqueFormType>({
    mode: 'onChange',
    resolver: diagnosticTechniqueSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
    },
  });

  // Lei 2 (obrigatória) — só reseta o form a partir do servidor quando
  // `dirtyFields` está REALMENTE vazio (nada editado ainda) ou quando forçado
  // (`resetForce`). `isEmpty()` é INVERTIDO (ver cabeçalho do arquivo) — daqui
  // vem o `!`.
  function fillForm(data: DiagnosticTechniqueData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        is_enabled: !!data.is_enabled,
      });
    }
  }

  // Query de detalhe (match por GUID) inline — padrão modular, mesmo shape de
  // DiagnosisPregnancy.
  const diagnosticTechniqueQuery = useCustomFormQueryByGuid<DiagnosticTechniqueData>({
    registrationId: isEditing ? diagnosticTechniqueId : undefined,
    queryKey: queryKey.baseRegistrations.diagnosticTechnique,
    asyncFunction: getDiagnosticTechniqueByUuid,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([diagnosticTechniqueQuery as any]);

  const diagnosticTechniqueMutation = useRequest({
    asyncFunction: tryPersistDiagnosticTechnique,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.diagnosticTechniques,
    queryKey2: queryKey.baseRegistrations.diagnosticTechnique,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistDiagnosticTechnique(data: DiagnosticTechniqueFormType) {
    // Payload SEMPRE completo — `DiagnosticTechniqueRequest::rules()` não
    // diferencia por verbo (`description`/`is_enabled` são `required` tanto
    // no store quanto no update), então NUNCA gated por `dirtyFields` (mesmo
    // racional de updateLowReason, NÃO o delta parcial de updateSpecie).
    const payload: DiagnosticTechniquePayload = {
      description: data.description.trim(),
      is_enabled: !!data.is_enabled,
    };

    if (isEditing && diagnosticTechniqueId) {
      return await updateDiagnosticTechnique(diagnosticTechniqueId, payload);
    }

    return await createDiagnosticTechnique(payload);
  }

  // Guard CORRIGIDO (ver cabeçalho do arquivo / ERRO-FE-001): "editar sem
  // alterar nada = Cancelar" — só volta sem salvar quando `isEditing` E
  // `dirtyFields` está REALMENTE vazio (`!isEmpty(dirtyFields)`, dado que
  // `isEmpty()` retorna `true` quando HÁ chaves). A versão sem o `!`
  // descartaria toda edição real em silêncio.
  async function onSubmit(data: DiagnosticTechniqueFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await diagnosticTechniqueMutation.mutateAsync(data);
    }
  }

  const isSubmitting = diagnosticTechniqueMutation.isPending;

  // Reaproveita os textos já existentes da listagem (Ativa/Inativa) — evita
  // duplicar chave de i18n para o mesmo par de rótulos.
  const statusOptions: Option<boolean>[] = [
    { value: true, label: text.list.table.active },
    { value: false, label: text.list.table.inactive },
  ];

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
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
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
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
                label={text.form.fields.isEnabled}
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
