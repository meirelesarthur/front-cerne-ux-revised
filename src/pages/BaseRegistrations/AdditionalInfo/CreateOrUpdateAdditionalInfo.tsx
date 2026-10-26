// src/pages/BaseRegistrations/AdditionalInfo/CreateOrUpdateAdditionalInfo.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de INFORMAÇÃO COMPLEMENTAR (AdditionalInfo) —
// Cadastros Base / Fiscais (TASK-AI-04). Rotas:
// /cadastros-base/info-complementares/novo e
// /cadastros-base/info-complementares/:additionalInfoId (GUID), registradas
// em src/router/index.tsx, guardadas por `additional-info_view`.
//
// Referência UX (mesma de TASK-AI-03 — UX-GAP confirmado, sem página oficial
// de Informações Complementares no `cerne`): precedente interno
// `MotivosBaixa/CreateOrUpdateMotivoBaixa.tsx` (estrutura mecânica — isEditing
// por GUID, fillForm guardado, mutação via useRequest, ButtonSaveAndNext com
// dirtyFields), SEM o bloco "Código gerado" (não existe `code` aqui — ver
// TASK-AI-03, "Correção de premissa": módulo sem FK própria, sem code).
// `Perfil/CreateOrUpdatePerfil.tsx` — molde do campo de texto longo `info`
// (Textarea, `@/components/Form/InputTextArea`, mesmo import já em uso lá).
// `TiposTitulo/CreateOrUpdateTipoTitulo.tsx` — molde do Select estático
// (Ativo/Inativo) para `is_active` (NÃO um Switch — Breed usa Switch, mas é
// caso à parte por ter FK).
//
// 3 campos editáveis: `description` (obrigatório, máx. 100), `info`
// (obrigatório, máx. 1000, Textarea) e `is_active` (obrigatório, Select,
// default `true` no create) — SEM `code`, SEM FK/select assíncrono (ver
// TASK-AI-03).
//
// ⚠️ ARMADILHA CENTRAL (checklist do dono, item 3) — este arquivo NÃO usa
// `isEmpty`/`!isEmpty` (`src/utils/isEmpty.ts` é MAL NOMEADA — retorna `true`
// quando o objeto TEM chaves, nome invertido do que sugere, e já foi
// responsável por defeitos reais em `Especies`/`Cultivation`/`Perfil`). Usa a
// forma EXPLÍCITA `Object.keys(dirtyFields).length` — tanto no guard de
// `onSubmit` quanto no guard equivalente de `fillForm` (guards DIFERENTES:
// um decide se chama a API, o outro protege o form de ser resetado por um
// refetch em background — não confundir os dois).
//
// Payload de update COMPLETO (não delta) — `AdditionalInfoRequest::rules()`
// exige description/info/is_active também no update (sem bloco condicional
// por verbo). `tenant_id`/`farm_id` NUNCA entram no payload (DA-AI-09,
// resolvidos no backend via FarmContext) — o form nem os conhece.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Textarea } from '@/components/Form/InputTextArea';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { additionalInfoSchemaResolver } from '@/validations/schemas/BaseRegistrations/additionalInfo-schema';

import {
  createAdditionalInfo,
  getAdditionalInfo,
  updateAdditionalInfo,
} from '@/services/v2/AdditionalInfo/additional-info-service';

import type { Option } from '@/@types/option';
import type {
  AdditionalInfoData,
  AdditionalInfoForm as AdditionalInfoFormType,
  AdditionalInfoPayload,
} from '@/@types/v2/AdditionalInfo';

export default function CreateOrUpdateAdditionalInfo() {
  const { additionalInfoId } = useParams<{ additionalInfoId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(additionalInfoId);

  // Guard de navegação: um `additionalInfoId` presente mas que NÃO é um GUID
  // válido (ex.: URL adulterada manualmente) não deve chegar ao hook de query
  // nem renderizar um form "fantasma" — redireciona para a listagem, mesmo
  // padrão de CreateOrUpdateRaca.tsx.
  useEffect(() => {
    if (additionalInfoId && !isValidGuid(additionalInfoId)) {
      navigate('/cadastros-base/info-complementares', { replace: true });
    }
  }, [additionalInfoId, navigate]);

  const text = languageGB.baseRegistrations.additionalInfo;

  const canSave = isEditing ? can('additional-info_edit') : can('additional-info_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<AdditionalInfoFormType>({
    mode: 'onChange',
    resolver: additionalInfoSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      info: '',
      is_active: true,
    },
  });

  // Guard de `fillForm` (Lei 2, forma EXPLÍCITA) — `isSafeToReset` é `true`
  // quando `dirtyFields` está VAZIO (nenhuma edição em andamento). `reset()`
  // só roda quando é seguro ou quando forçado pela carga inicial do hook
  // (`resetForce=true`). Guard DIFERENTE do guard de `onSubmit` abaixo (um
  // protege o form de ser resetado por um refetch em background; o outro
  // decide se chama a API) — checklist do dono, item 3, `Object.keys(...)
  // .length`, nunca `isEmpty`/`!isEmpty`.
  function fillForm(data: AdditionalInfoData, resetForce?: boolean) {
    const isSafeToReset = Object.keys(dirtyFields).length === 0;

    if (isSafeToReset || resetForce) {
      reset({
        uuid: data.uuid,
        description: data.description,
        info: data.info,
        is_active: !!data.is_active,
      });
    }
  }

  const additionalInfoQuery = useCustomFormQueryByGuid<AdditionalInfoData>({
    registrationId: isEditing ? additionalInfoId : undefined,
    queryKey: queryKey.baseRegistrations.additionalInfo,
    asyncFunction: getAdditionalInfo,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([additionalInfoQuery as any]);

  const additionalInfoMutation = useRequest({
    asyncFunction: tryPersistAdditionalInfo,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.additionalInfos,
    queryKey2: queryKey.baseRegistrations.additionalInfo,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistAdditionalInfo(data: AdditionalInfoFormType) {
    // Payload SEMPRE COMPLETO (description+info+is_active) — NÃO delta.
    // `tenant_id`/`farm_id` NUNCA entram aqui (resolvidos no backend via
    // FarmContext, DA-AI-09).
    const payload: AdditionalInfoPayload = {
      description: data.description.trim(),
      info: data.info.trim(),
      is_active: !!data.is_active,
    };

    if (isEditing && additionalInfoId) {
      return await updateAdditionalInfo(additionalInfoId, payload); // PUT full-resource, SEMPRE os 3 campos
    }

    return await createAdditionalInfo(payload);
  }

  // Guard de `onSubmit` — checklist do dono (item 3), FORMA EXPLÍCITA
  // obrigatória: `Object.keys(dirtyFields).length`. Salva quando há
  // alterações reais (edição) ou sempre no create; só volta sem salvar quando
  // editando E nada mudou. NUNCA `isEmpty(dirtyFields)`/`!isEmpty(dirtyFields)`
  // neste arquivo.
  async function onSubmit(data: AdditionalInfoFormType) {
    const hasChanges = Object.keys(dirtyFields).length > 0;

    if (isEditing && hasChanges) {
      await additionalInfoMutation.mutateAsync(data); // há alterações reais -> salva
    } else if (isEditing) {
      navigate(-1); // nada mudou -> só volta, sem chamar a API
    } else {
      await additionalInfoMutation.mutateAsync(data); // create -> sempre salva
    }
  }

  const isSubmitting = additionalInfoMutation.isPending;

  // Reaproveita os textos já existentes da listagem (Ativo/Inativo) — mesmo
  // racional de CreateOrUpdateMotivoBaixa.tsx/CreateOrUpdateTipoTitulo.tsx
  // (evita duplicar chave de i18n para o mesmo par de rótulos).
  const activeOptions: Option<boolean>[] = [
    { value: true, label: text.list.table.active },
    { value: false, label: text.list.table.inactive },
  ];

  const watchedDescription = watch('description');
  const descriptionLength = (watchedDescription ?? '').length;

  const watchedInfo = watch('info');
  const infoLength = (watchedInfo ?? '').length;

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
            helperText={errors.description?.message ? undefined : `${descriptionLength}/100`}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="is_active"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.isActive}
                name={name}
                value={activeOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={activeOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />
        </SimpleGrid>

        <Box mt={6}>
          <Textarea
            label={text.form.fields.info}
            placeholder={text.form.placeholders.info}
            helperText={errors.info?.message ? undefined : `${infoLength}/1000`}
            maxLength={1000}
            {...register('info')}
            error={errors.info?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
