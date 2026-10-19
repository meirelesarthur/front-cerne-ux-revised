// src/pages/Integracoes/SoftwareDominio/CreateOrUpdateIntegrationDominio.tsx
// -----------------------------------------------------------------------------
// Formulário ÚNICO de criação/edição de Software Domínio (IntegrationDominio)
// — Integrações, F-121, 97-Esteiras/072, TASK-F121-FE-04. MESMO componente
// para os dois casos (`isEditing = isValidGuid(uuid)`, mirror
// `CreateOrUpdateCompartilhamento.tsx`/`CreateOrUpdateTraceabilityConfig.tsx`).
// Rotas `/integracoes/dominio/novo` (create) e
// `/integracoes/dominio/:uuid/editar` (edit) — wiring de rota é
// `src/router/index.tsx` (TASK-F121-FE-05, não tocado aqui).
//
// 4 campos NESTA ORDEM EXATA (contrato de tela §2.1):
//   1) `issue` "Emissor" — `SelectAsyncPaginate` (async, `issue-options`, farm-scoped)
//   2) `contador` "Contador" — `SelectAsyncPaginate` (async, `contador-options`, farm-scoped)
//   3) `x_integration_key` "Token de Integração" — `Field` texto
//   4) `is_enabled` "Ativo" — `Select` estático via fábrica (severidade — NÃO `ToggleSwitch`)
//
// FLUXO "TESTAR CONEXÃO" → GATE DE SALVAR (contrato de tela §2.2):
// Salvar nasce `disabled` (create E edit) e só habilita após um
// `test-connection` 2xx. Mudança em Emissor/Contador/Token reseta o gate
// para `idle` (esconde o bloco de conexão, desabilita Salvar de novo).
// "Testar Conexão" pré-valida os 3 campos client-side (toaster.warning i18n,
// mirror dos 3 `swal` legados) antes do POST.
//
// PATCH parcial no update via `dirtyFields`; reset do form + do gate na
// troca de fazenda ativa (`activeFarmUuid`, RISCO 4 do contrato de tela).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DisplayFieldGroup } from '@/components/DisplayFieldGroup';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormSection } from '@/components/FormSection';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { integrationDominioEnabledOptions } from '@/constants/integracoes/integrationDominio/options';
import { queryKey } from '@/constants/query-key';

import { integrationDominioSchemaResolver } from '@/validations/schemas/Integracoes/integrationDominio-schema';

import {
  createIntegrationDominio,
  listContadorOptions,
  listIssueOptions,
  testConnectionIntegrationDominio,
  updateIntegrationDominio,
} from '@/services/v2/Integrations/integration-dominio-service';

import type {
  ConnectionInfo,
  ContadorOption,
  IntegrationDominioData,
  IntegrationDominioForm as IntegrationDominioFormType,
  IntegrationDominioPayload,
  IssueOption,
  TestConnectionRequest,
} from '@/@types/v2/Integrations/integrationDominio';

import { useIntegrationDominioDetail } from './useIntegrationDominios';

const INTEGRATION_DOMINIOS_LIST_ROUTE = '/integracoes/dominio';

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

type ConnectionGate = 'idle' | 'success' | 'error';

export default function CreateOrUpdateIntegrationDominio() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { activeFarmUuid } = useAuth();

  const isEditing = isValidGuid(uuid ?? null);

  // Guard de navegação: `uuid` presente mas NÃO é um GUID válido (URL
  // adulterada) — redireciona para a listagem (mirror
  // `CreateOrUpdateCompartilhamento.tsx`).
  useEffect(() => {
    if (uuid && !isValidGuid(uuid)) {
      navigate(INTEGRATION_DOMINIOS_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const text = languageGB.integrationDominios;
  const formText = text.form;

  const canCreate = can('integration_dominios_create');
  const canEdit = can('integration_dominios_edit');
  const canSave = isEditing ? canEdit : canCreate;

  const defaultValues: IntegrationDominioFormType = {
    issue: null,
    contador: null,
    x_integration_key: '',
    is_enabled: integrationDominioEnabledOptions.getOption(true, languageGB),
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<IntegrationDominioFormType>({
    mode: 'onChange',
    resolver: integrationDominioSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues,
  });

  // ---- Gate "Testar Conexão" → Salvar (contrato de tela §2.2). -------------
  const [connection, setConnection] = useState<ConnectionGate>('idle');
  const [connInfo, setConnInfo] = useState<ConnectionInfo | null>(null);

  function resetConnectionGate() {
    setConnection('idle');
    setConnInfo(null);
  }

  // Lei 2: função nomeada com guarda `!isEmpty(dirtyFields) || resetForce`.
  function fillIntegrationDominioForm(data: IntegrationDominioData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        issue: {
          label: data.issue.full_description ?? data.issue.razao_social,
          value: data.issue.uuid,
        },
        contador: { label: data.contador.razao_social, value: data.contador.uuid },
        x_integration_key: data.x_integration_key,
        is_enabled: integrationDominioEnabledOptions.getOption(data.is_enabled, languageGB),
      });
    }
  }

  const integrationDominioQuery = useIntegrationDominioDetail(
    isEditing ? uuid : undefined,
    fillIntegrationDominioForm
  );

  const isLoading = isEditing && checkLoadingStatus([integrationDominioQuery as any]);

  // Reset do form + do gate na troca de fazenda ativa (RISCO 4) — Emissor/
  // Contador são farm-scoped (`X-Farm-Id`); a seleção anterior não é válida
  // na nova fazenda.
  useEffect(() => {
    reset(defaultValues);
    resetConnectionGate();
  }, [activeFarmUuid]);

  const testMutation = useRequest({
    asyncFunction: (payload: TestConnectionRequest) => testConnectionIntegrationDominio(payload),
    typesRequest: 'apply',
    entityName: text.singularLabel,
    queryKey: queryKey.integrationDominios.detail,
    personalizedMessage: formText.testConnection.okToast,
    actionSuccess: (data) => {
      setConnInfo(data.connection);
      setConnection('success');
    },
  });

  async function handleTest() {
    const issue = watch('issue');
    const contador = watch('contador');
    const token = watch('x_integration_key');

    if (!issue) {
      toaster.warning({ description: formText.testConnection.validation.issuerRequired });
      return;
    }
    if (!contador) {
      toaster.warning({ description: formText.testConnection.validation.accountantRequired });
      return;
    }
    if (!token) {
      toaster.warning({ description: formText.testConnection.validation.tokenRequired });
      return;
    }

    try {
      await testMutation.mutateAsync({
        issue_id: issue.value,
        contador_id: contador.value,
        x_integration_key: token,
      });
    } catch {
      // Toast de erro já exibido pelo `useRequest` (onError interno) — aqui
      // só refletimos o gate visual (Salvar continua desabilitado).
      setConnection('error');
    }
  }

  async function tryPersistIntegrationDominio(data: IntegrationDominioFormType) {
    if (isEditing && uuid) {
      const patch: Partial<IntegrationDominioPayload> = {};
      if (dirtyFields.issue) patch.issue_id = data.issue!.value;
      if (dirtyFields.contador) patch.contador_id = data.contador!.value;
      if (dirtyFields.x_integration_key) patch.x_integration_key = data.x_integration_key;
      if (dirtyFields.is_enabled) patch.is_enabled = data.is_enabled!.value;
      return updateIntegrationDominio(uuid, patch);
    }

    const payload: IntegrationDominioPayload = {
      issue_id: data.issue!.value,
      contador_id: data.contador!.value,
      x_integration_key: data.x_integration_key,
      is_enabled: data.is_enabled!.value,
    };
    return createIntegrationDominio(payload);
  }

  const saveMutation = useRequest({
    asyncFunction: tryPersistIntegrationDominio,
    entityName: text.singularLabel,
    queryKey: queryKey.integrationDominios.detail,
    queryKey2: queryKey.integrationDominios.list,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(INTEGRATION_DOMINIOS_LIST_ROUTE);
    },
  });

  async function onSubmit(data: IntegrationDominioFormType) {
    await saveMutation.mutateAsync(data);
  }

  const isSubmitting = saveMutation.isPending;
  const isDisabledField = !canSave || !!isLoading;

  return (
    <FormContainer
      title={isEditing ? formText.editTitle : formText.createTitle}
      footer={
        <>
          <Button
            title={formText.cancel}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          />
          {canSave && (
            <Button
              title={formText.save}
              type="submit"
              form="integration-dominio-form"
              loading={isSubmitting}
              disabled={connection !== 'success' || isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form id="integration-dominio-form" onSubmit={handleSubmit(onSubmit)} noPadding>
        <FormSection title={formText.fields.issuer} columns={2}>
          {/* 1) issue ("Emissor") — SelectAsyncPaginate, farm-scoped */}
          <Controller
            name="issue"
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.issuer}
                error={fieldState.error?.message as string | undefined}
                service={listIssueOptions}
                mapOptions={(item: IssueOption) => ({ label: item.label, value: item.uuid })}
                findParams={findParamsFromSearch}
                cacheUniqs={[activeFarmUuid]}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  resetConnectionGate();
                }}
                isRequired
                isDisabled={isDisabledField}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          {/* 2) contador ("Contador") — SelectAsyncPaginate, farm-scoped */}
          <Controller
            name="contador"
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.accountant}
                error={fieldState.error?.message as string | undefined}
                service={listContadorOptions}
                mapOptions={(item: ContadorOption) => ({ label: item.label, value: item.uuid })}
                findParams={findParamsFromSearch}
                cacheUniqs={[activeFarmUuid]}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  resetConnectionGate();
                }}
                isRequired
                isDisabled={isDisabledField}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </FormSection>

        <FormSection title={formText.fields.token} columns={2}>
          {/* 3) x_integration_key ("Token de Integração") — Field texto */}
          <Controller
            name="x_integration_key"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label={formText.fields.token}
                name={field.name}
                value={field.value ?? ''}
                onChange={(event) => {
                  field.onChange(event);
                  resetConnectionGate();
                }}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                disabled={isDisabledField}
                isRequired
              />
            )}
          />

          {/* 4) is_enabled ("Ativo") — Select estático via fábrica (severidade) */}
          <Controller
            name="is_enabled"
            control={control}
            render={({ field }) => (
              <Select
                name={field.name}
                label={formText.fields.enabled}
                options={integrationDominioEnabledOptions.options(languageGB)}
                value={field.value}
                onChange={(option) => field.onChange(option ?? null)}
                error={errors.is_enabled?.message as string | undefined}
                noClearable
                isDisabled={isDisabledField}
              />
            )}
          />

          <Box>
            <Button
              title={formText.testConnection.button}
              variant="outline"
              type="button"
              loading={testMutation.isPending}
              disabled={!(watch('issue') && watch('contador') && watch('x_integration_key'))}
              onClick={handleTest}
            />
          </Box>
        </FormSection>

        {connection === 'success' && connInfo && (
          <Box mt={2}>
            <DisplayFieldGroup
              loading={false}
              displayFields={[
                {
                  label: formText.testConnection.block.accountant,
                  value: connInfo.accountant ?? '',
                },
                { label: formText.testConnection.block.client, value: connInfo.client ?? '' },
              ]}
            />
          </Box>
        )}
      </Form>
    </FormContainer>
  );
}
