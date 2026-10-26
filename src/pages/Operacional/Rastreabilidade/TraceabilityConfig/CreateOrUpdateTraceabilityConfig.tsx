// src/pages/Operacional/Rastreabilidade/TraceabilityConfig/CreateOrUpdateTraceabilityConfig.tsx
// -----------------------------------------------------------------------------
// Formulário ÚNICO de CRIAÇÃO/EDIÇÃO de Configuração (TraceabilityConfig —
// Rastreabilidade, F-067, TASK-TR-FE-09). 11 campos reais do RHF
// (`TraceabilityConfigForm`, TASK-TR-FE-01) em 1 `FormSection` (contrato de
// tela `## 5.2`, "1 seção, mais simples") + logo (upload local) + Fazenda
// (LEITURA, satélite `TraceabilityConfigData.farm` — não é campo do form).
//
// ⚠️ DIVERGÊNCIA DOCUMENTADA vs. o `field_manifest` legado (FD-44 `farm_id`,
// "select Fazenda") — CONFIRMADA nesta Tarefa por leitura direta da fundação
// já construída sobre o backend REAL (`TraceabilityConfigRequest::rules()`,
// TASK-TR-FE-01/02/03): `farm_id` NUNCA é campo aceito do cliente em NENHUM
// verbo — a fazenda é resolvida 100% no servidor via `FarmContext`/
// `X-Farm-Id` (mesmo racional de todo recurso `HasFarmTenantScope` do fork).
// Por isso NÃO existe select "Fazenda" neste form; em EDIÇÃO exibimos a
// fazenda dona do registro como LEITURA (`InputReadOnly`, satélite `farm` já
// vem no `GET .../{uuid}` — sem round-trip extra); em CRIAÇÃO não há dado de
// fazenda a mostrar antes do 1º save (SEM MOCK — estado honesto, a fazenda
// ativa via `X-Farm-Id` já é a que o servidor vai gravar). O widget de mapa
// (`farm-context`, áreas) é escopo de `TASK-TR-FE-10`, não desta Tarefa.
//
// Cascata `proprietary_uuid` → autofill (`## 5.3`, `IG-08`) — dispara em
// `GET /proprietaries/{uuid}` só quando `dirtyFields.proprietary_uuid` é
// `true` (mirror EXATO do autofill `product_uuid` de
// `Traceability/CreateOrUpdateTraceability.tsx` — nunca sobrescreve dados já
// persistidos ao simplesmente abrir o form em edição): preenche `name`/
// `cpf_cnpj`/`email`/`number`/`district`/`address`/`phone` + `city_uuid`
// (via `setValue`, SUBSTITUINDO sempre — fecha D17, "acúmulo de `<option>`
// sem limpar" do legado; como `city_uuid` é um `Option<T>` único, não um
// array acumulável, a substituição por `setValue` é estruturalmente imune ao
// bug).
//
// Mirror ESTRUTURAL `get_pwa_form_query_pattern` (Lei 2 — `fillForm` nomeada
// + guarda de `dirtyFields`, `useCustomFormQueryById`) +
// `Traceability/CreateOrUpdateTraceability.tsx` (casca `FormContainer`+
// `ButtonSaveAndNext`+guarda de navegação por GUID malformado+422 por campo)
// + `Proprietarios/CreateOrUpdateProprietario.tsx` (máscara `nif`/CPF-CNPJ
// dinâmica via `@/utils/cpfCnpj`, `PhoneInput`, `SelectAsyncPaginate` de
// Cidade) + `Fazendas/steps/StepIdentificacao.tsx` (`ImageUpload` de logo).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { ImageUpload } from '@/components/Form/ImageUpload';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormSection } from '@/components/FormSection';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { normalizeDocument } from '@/utils/cpfCnpj';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';
import { resolveStorageUrl } from '@/utils/resolveStorageUrl';

import { queryKey } from '@/constants/query-key';
import { traceabilityConfigFormDefaultValues } from '@/constants/rastreabilidade/traceability-config/default-values';

import { traceabilityConfigSchemaResolver } from '@/validations/schemas/Rastreabilidade/traceability-config-schema';

import {
  getProprietaryByUuid,
  listProprietaryOptions,
} from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import type { ProprietaryOption } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listCityOptions } from '@/services/v2/Cities/city-service';
import {
  createTraceabilityConfig,
  getTraceabilityConfig,
  updateTraceabilityConfig,
} from '@/services/v2/Rastreabilidade/traceability-config-service';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type { CityListItem } from '@/@types/v2/Cities';
import type {
  CreateTraceabilityConfigRequest,
  TraceabilityConfigData,
  TraceabilityConfigForm as TraceabilityConfigFormValues,
} from '@/@types/v2/Rastreabilidade/traceability-config';

const TRACEABILITY_CONFIG_BASE_ROUTE = '/operacional/rastreabilidade/configuracao';

// `Form id` + `form=` no botão externo (mirror `Traceability/CreateOrUpdateTraceability.tsx`)
// — o botão "Salvar" vive no `footer` do `FormContainer`, fora da árvore DOM
// do `<form>`.
const TRACEABILITY_CONFIG_FORM_ID = 'traceability-config-form';

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

// `extends PaginationQueryParams` — mesmo fix documentado em
// `TraceabilityConfigOptionsQueryParams` (`CreateOrUpdateTraceability.tsx`):
// sem isso o TS rejeita a atribuição a `SelectAsyncPaginateProps.service`.
interface ProprietaryOptionsQueryParams extends PaginationQueryParams {
  search?: string;
}

// `listProprietaryOptions(search, 'farm')` devolve `T[]` FLAT — adaptado
// para `ResponsePagination` só para casar com `SelectAsyncPaginate.service`
// (mirror `listTraceabilityConfigOptions` em `Traceability/
// CreateOrUpdateTraceability.tsx`). `scope: 'farm'` filtra pela fazenda
// ATIVA (`## 6.2` do contrato de destino).
async function listProprietaryOptionsFarmScoped(
  params: ProprietaryOptionsQueryParams
): Promise<ResponsePagination<ProprietaryOption[]>> {
  const items = await listProprietaryOptions(params.search, 'farm');
  return {
    success: true,
    message: '',
    data: {
      items,
      pagination: {
        total: items.length,
        count: items.length,
        per_page: items.length || 1,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

export default function CreateOrUpdateTraceabilityConfig() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.rastreabilidade.traceabilityConfig;
  const formText = text.form;

  // Gate ÚNICO `tracconfig_view` (`## 6.1` do contrato de destino, ratificado)
  // — cobre listagem/create/edit/delete, não existem gates separados.
  const isEditing = isValidGuid(uuid);
  const canSave = can('tracconfig_view');

  // Guard de navegação — `uuid` presente e malformado não pode chegar ao hook
  // de detalhe.
  useEffect(() => {
    if (!uuid) return;
    if (!isValidGuid(uuid)) {
      navigate(TRACEABILITY_CONFIG_BASE_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<TraceabilityConfigFormValues>({
    mode: 'onChange',
    resolver: traceabilityConfigSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: traceabilityConfigFormDefaultValues,
  });

  // ---- Logo (`image`/`remove_image`) — FORA do RHF, estado local (mirror
  // `ImageUpload`/`FarmForm`/`FamilyEquipment`, divergência documentada no
  // tipo `TraceabilityConfigForm`). ----
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  function handleLogoSelected(file: File | null) {
    setLogoFile(file);
    setRemoveLogo(false);
  }

  function handleLogoRemove() {
    setLogoFile(null);
    setRemoveLogo(true);
  }

  // ---- Lei 2 — `fillForm` NOMEADA + guarda de `dirtyFields`. ----
  function fillTraceabilityConfigForm(data: TraceabilityConfigData, resetForce?: boolean) {
    if (!(!isEmpty(dirtyFields) || resetForce)) return;

    reset({
      proprietary_uuid: data.proprietary ? { label: '', value: data.proprietary.uuid } : null,
      name: data.name,
      cpf_cnpj: data.cpf_cnpj,
      address: data.address,
      number: data.number,
      district: data.district,
      city_uuid: data.city ? { label: data.city.title, value: data.city.uuid } : null,
      phone: data.phone,
      email: data.email,
      whatsapp_fone: data.whatsapp_fone,
      whatsapp_texto: data.whatsapp_texto,
    });
    setLogoFile(null);
    setRemoveLogo(false);
  }

  const traceabilityConfigQuery = useCustomFormQueryById<TraceabilityConfigData>({
    registrationId: uuid ?? '',
    asyncFunction: getTraceabilityConfig,
    queryKey: queryKey.rastreabilidade.traceabilityConfig,
    fillForm: fillTraceabilityConfigForm,
  });

  const traceabilityConfigDetail = traceabilityConfigQuery.data;
  const isLoadingTraceabilityConfig =
    isEditing && checkLoadingStatus([traceabilityConfigQuery as any]);

  // ---- Resolução do RÓTULO de `proprietary_uuid` em EDIÇÃO — o satélite
  // `TraceabilityConfigProprietaryRef` do detalhe só expõe `{uuid}` (sem
  // `name`, divergência documentada em `@types/v2/Rastreabilidade/
  // traceability-config/index.d.ts`); `fillTraceabilityConfigForm` hidrata o
  // campo com `label: ''` e este efeito complementa o rótulo assim que o
  // detalhe do Proprietário resolve — `shouldDirty: false` (é só um patch de
  // EXIBIÇÃO, não conta como edição do usuário nem dispara a cascata de
  // autofill abaixo, que exige `dirtyFields.proprietary_uuid`). Falha
  // silenciosa: o rótulo permanece vazio, mas o `value` (uuid) já está
  // correto e o formulário segue funcional.
  useEffect(() => {
    const proprietaryUuid = traceabilityConfigDetail?.proprietary?.uuid;
    if (!isEditing || !proprietaryUuid) return;

    let cancelled = false;

    async function resolveProprietaryLabel() {
      try {
        const { data } = await getProprietaryByUuid(proprietaryUuid!);
        if (!cancelled) {
          setValue(
            'proprietary_uuid',
            { label: data.name, value: proprietaryUuid! },
            { shouldDirty: false }
          );
        }
      } catch {
        // Rótulo permanece vazio — falha não bloqueia o formulário.
      }
    }

    void resolveProprietaryLabel();

    return () => {
      cancelled = true;
    };
  }, [isEditing, traceabilityConfigDetail?.proprietary?.uuid]);

  // ---- Cascata `proprietary_uuid` → autofill (`## 5.3`, `IG-08`) —
  // CONDICIONADA a `dirtyFields.proprietary_uuid` (só dispara quando o
  // usuário TROCA o proprietário via `onChange`, nunca via `reset()` da
  // hidratação de edição). `setValue` SEMPRE substitui — fecha D17. ----
  const proprietaryUuidValue = watch('proprietary_uuid');

  useEffect(() => {
    const proprietaryUuid = proprietaryUuidValue?.value;
    if (!proprietaryUuid || !dirtyFields.proprietary_uuid) return;

    let cancelled = false;

    async function applyProprietaryAutofill() {
      try {
        const { data } = await getProprietaryByUuid(proprietaryUuid!);
        if (cancelled) return;

        setValue('name', data.name ?? '', { shouldDirty: true, shouldValidate: true });
        setValue('cpf_cnpj', data.nif ?? '', { shouldDirty: true, shouldValidate: true });
        setValue('email', data.email ?? '', { shouldDirty: true, shouldValidate: true });
        setValue('number', data.number ?? '', { shouldDirty: true, shouldValidate: true });
        setValue('district', data.district ?? '', { shouldDirty: true, shouldValidate: true });
        setValue('address', data.address ?? '', { shouldDirty: true, shouldValidate: true });
        setValue('phone', data.phone ?? '', { shouldDirty: true, shouldValidate: true });
        // Fix D17 — `setValue` SUBSTITUI o `Option` único, nunca acumula.
        setValue(
          'city_uuid',
          data.city
            ? {
                label: `${data.city.name}${data.city.state ? ` — ${data.city.state.uf}` : ''}`,
                value: data.city.uuid,
              }
            : null,
          { shouldDirty: true, shouldValidate: true }
        );
      } catch {
        // Fallback fiel ao molde `product_uuid` de `Traceability` — autofill
        // secundário não bloqueante, preenchimento manual segue disponível.
      }
    }

    void applyProprietaryAutofill();

    return () => {
      cancelled = true;
    };
  }, [proprietaryUuidValue?.value, dirtyFields.proprietary_uuid]);

  const isDisabledField = !canSave || isLoadingTraceabilityConfig;

  // ---- Guarda de saída sem salvar (mirror `Traceability`/`Budget`). ----
  const hasUnsavedChanges = !isEmpty(dirtyFields) || !!logoFile || removeLogo;
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);

  const traceabilityConfigMutation = useRequest({
    asyncFunction: tryPersistTraceabilityConfig,
    entityName: text.singularLabel,
    queryKey: queryKey.rastreabilidade.traceabilityConfig,
    queryKey2: queryKey.rastreabilidade.traceabilityConfigs,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(TRACEABILITY_CONFIG_BASE_ROUTE);
    },
  });

  async function tryPersistTraceabilityConfig(data: TraceabilityConfigFormValues) {
    const payload: CreateTraceabilityConfigRequest = {
      proprietary_uuid: data.proprietary_uuid!.value,
      name: data.name.trim(),
      // Documento normalizado `[0-9A-Z]` (CPF/CNPJ alfanumérico, UT-000776).
      cpf_cnpj: normalizeDocument(data.cpf_cnpj),
      address: data.address.trim(),
      number: data.number.trim(),
      district: data.district.trim(),
      city_uuid: data.city_uuid!.value,
      phone: data.phone,
      email: data.email.trim(),
      whatsapp_fone: data.whatsapp_fone,
      whatsapp_texto: data.whatsapp_texto.trim(),
      image: logoFile ?? undefined,
      remove_image: removeLogo || undefined,
    };

    try {
      // `PUT` é SEMPRE o recurso COMPLETO (`TraceabilityConfigRequest`
      // unificado store+update — mirror `TraceabilityRequest`/`ChargeRequest`).
      return isEditing && uuid
        ? await updateTraceabilityConfig(uuid, payload)
        : await createTraceabilityConfig(payload);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          Object.entries(fieldErrors).forEach(([field, fieldMessages]) => {
            if (fieldMessages?.[0]) {
              setError(field as any, { type: 'server', message: fieldMessages[0] });
            }
          });
        }
      }
      throw error;
    }
  }

  async function onSubmit(data: TraceabilityConfigFormValues) {
    await traceabilityConfigMutation.mutateAsync(data);
  }

  const isSaving = traceabilityConfigMutation.isPending;

  return (
    <>
      <FormContainer
        title={isEditing ? formText.title.edit : formText.title.create}
        subtitle={isEditing ? formText.subtitle.edit : formText.subtitle.create}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="secondary"
              type="button"
              onClick={() => guardedNavigate(TRACEABILITY_CONFIG_BASE_ROUTE)}
            />
            {canSave && (
              <ButtonSaveAndNext
                create={!isEditing}
                dirtyFields={dirtyFields}
                type="submit"
                form={TRACEABILITY_CONFIG_FORM_ID}
                languageGB={languageGB}
                loading={isSaving}
                disabled={isSaving || isLoadingTraceabilityConfig}
              />
            )}
          </>
        }
      >
        <Form id={TRACEABILITY_CONFIG_FORM_ID} noPadding onSubmit={handleSubmit(onSubmit)}>
          <FormSection title={formText.sections.general} columns={3}>
            {/* Fazenda — LEITURA apenas, satélite `TraceabilityConfigData.farm`
                (## 6.6, divergência documentada no topo do arquivo). SEM MOCK
                em criação — nada a exibir antes do 1º save. */}
            {isEditing && (
              <InputReadOnly
                label={formText.fields.farm}
                value={traceabilityConfigDetail?.farm.description ?? ''}
                loading={isLoadingTraceabilityConfig}
              />
            )}

            <Controller
              name="proprietary_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.fields.proprietary}
                  service={listProprietaryOptionsFarmScoped}
                  mapOptions={(item: ProprietaryOption) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={findParamsFromSearch}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={errors.proprietary_uuid?.message as string | undefined}
                  isRequired
                  isDisabled={isDisabledField}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <Input
              label={formText.fields.name}
              {...register('name')}
              error={errors.name?.message}
              loading={isLoadingTraceabilityConfig}
              disabled={isDisabledField}
              isRequired
              maxLength={100}
            />

            <Controller
              name="cpf_cnpj"
              control={control}
              render={({ field }) => (
                <MaskedInput
                  kind="cpfCnpj"
                  label={formText.fields.cpfCnpj}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.cpf_cnpj?.message}
                  isRequired
                  disabled={isDisabledField}
                />
              )}
            />

            <Input
              label={formText.fields.address}
              {...register('address')}
              error={errors.address?.message}
              loading={isLoadingTraceabilityConfig}
              disabled={isDisabledField}
              isRequired
              maxLength={80}
            />

            <Input
              label={formText.fields.number}
              {...register('number')}
              error={errors.number?.message}
              loading={isLoadingTraceabilityConfig}
              disabled={isDisabledField}
              isRequired
              maxLength={30}
            />

            <Input
              label={formText.fields.district}
              {...register('district')}
              error={errors.district?.message}
              loading={isLoadingTraceabilityConfig}
              disabled={isDisabledField}
              isRequired
              maxLength={50}
            />

            <Controller
              name="city_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.fields.city}
                  service={listCityOptions}
                  mapOptions={(item: CityListItem) => ({
                    label: `${item.title} — ${item.state?.letter ?? ''}`,
                    value: item.uuid,
                  })}
                  findParams={findParamsFromSearch}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={errors.city_uuid?.message as string | undefined}
                  isRequired
                  isDisabled={isDisabledField}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <MaskedInput
              kind="phone"
              label={formText.fields.phone}
              {...register('phone')}
              error={errors.phone?.message}
              disabled={isDisabledField}
              isRequired
            />

            <Input
              label={formText.fields.email}
              type="email"
              spellCheck={false}
              {...register('email')}
              error={errors.email?.message}
              loading={isLoadingTraceabilityConfig}
              disabled={isDisabledField}
              isRequired
              maxLength={80}
            />

            <MaskedInput
              kind="phone"
              label={formText.fields.whatsappFone}
              {...register('whatsapp_fone')}
              error={errors.whatsapp_fone?.message}
              disabled={isDisabledField}
              isRequired
            />

            <Input
              label={formText.fields.whatsappTexto}
              {...register('whatsapp_texto')}
              error={errors.whatsapp_texto?.message}
              loading={isLoadingTraceabilityConfig}
              disabled={isDisabledField}
              isRequired
              maxLength={255}
            />
          </FormSection>

          <Box mt={2} maxW="sm">
            <ImageUpload
              label={formText.fields.logo}
              hint={formText.logoUpload.hint}
              accept="image/jpeg,image/png,image/jpg,image/gif,image/svg+xml"
              maxSizeMb={2}
              currentImageUrl={
                removeLogo ? null : resolveStorageUrl(traceabilityConfigDetail?.logo)
              }
              file={logoFile}
              onFileSelected={handleLogoSelected}
              onRemove={handleLogoRemove}
              disabled={isDisabledField}
              dropzoneTitle={formText.logoUpload.dropzoneTitle}
              dropzoneDraggingTitle={formText.logoUpload.dropzoneDraggingTitle}
              changeLabel={formText.logoUpload.changeLabel}
              removeLabel={formText.logoUpload.removeLabel}
              errorTypeMessage={formText.logoUpload.errorTypeMessage}
              errorSizeMessage={formText.logoUpload.errorSizeMessage}
            />
          </Box>
        </Form>
      </FormContainer>

      <DeleteConfirmDialog
        isOpen={isConfirmOpen}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        tone="warning"
        colorPalette="orange"
        title={formText.unsavedChangesDialog.title}
        description={formText.unsavedChangesDialog.description}
        confirmButtonText={formText.unsavedChangesDialog.confirmButton}
        hideQuestionMark
        warningText=""
      />
    </>
  );
}
