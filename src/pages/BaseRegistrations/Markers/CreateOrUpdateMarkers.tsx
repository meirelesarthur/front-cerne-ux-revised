// src/pages/BaseRegistrations/Markers/CreateOrUpdateMarkers.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de MARCADOR — Cadastros Base (TASK-MK-FE-02).
// Rotas: /cadastros-base/marcadores/novo e /cadastros-base/marcadores/:markerId
// (GUID), registradas em src/router/index.tsx (a rota-mãe da listagem é
// registrada pela Tarefa irmã FE-01), guardadas por `markers_view`.
//
// Estrutura mecânica adaptada de FamiliaBens/CreateOrUpdateFamiliaBens.tsx
// (isEditing por GUID, upload de ícone multipart inline via `ImageUpload`
// reusado sem modificação, mutação via `useRequest`) — mais simples que o
// molde porque não há campo condicional reativo (`residual`).
//
// ⚠️ CHECKLIST OBRIGATÓRIO desta Tarefa:
//
// 1) Guard `onSubmit` — `src/utils/isEmpty.ts` está MAL NOMEADA (retorna
//    `true` quando o objeto TEM ao menos uma chave) e já causou bug real
//    confirmado em `Especies`/`Perfil`/`Cultivation` (guard invertido,
//    edições descartadas silenciosamente). Este módulo NÃO importa
//    `@/utils/isEmpty` — usa a checagem EXPLÍCITA
//    `Object.keys(dirtyFields).length === 0`, mandato direto do task-packet
//    (armadilha #4), tanto no guard de submit quanto no guard de `fillForm`
//    (mesmo racional, evitar qualquer superfície do utilitário mal-nomeado).
//
// 2) `icon` é OBRIGATÓRIO no create (DA-MK-17, diferente de
//    FamilyEquipment/`image`, sempre opcional) — bloqueado client-side ANTES
//    de chamar a mutação, sem round-trip à API. Ícone não é campo RHF (mesmo
//    padrão `image`/`removeImage` de FamilyEquipment) — estado dedicado
//    (`iconFile`/`removeIcon`/`currentIconUrl`/`iconError`).
//
// 3) Payload sempre FULL-RESOURCE (todos os campos, nunca um delta de
//    `dirtyFields`) — `buildMarkerFormData` (service) já implementa isso;
//    este arquivo só monta o `MarkerPayload` completo a partir do form + ícone.
//
// 4) `updateMarker` usa `POST` + `_method=PUT` (method spoofing, já
//    implementado no service) — NUNCA `api.V2.put()` com `FormData`.
//
// 5) 422 por campo mapeado localmente via `setError` do RHF (este projeto não
//    tem, hoje, um mecanismo compartilhado para isso em `useRequest.tsx` —
//    mesmo achado/solução já usados em `Safra/CreateOrUpdateSafra.tsx`): o
//    `throw` no `catch` preserva o toast genérico que `useRequest` já mostra.
//
// 6) TASK-MK-FE-03 (correção pós-entrega, [[ERRO-03]]) — o GD do container
//    está compilado sem libjpeg; a API passou a aceitar só PNG (422 claro em
//    vez de 500, decisão consciente do dono, divergência do legado). Ícone
//    restrito a `image/png` no `ImageUpload`, textos i18n atualizados
//    (`form.hints.iconAccepted`/`form.image.errorType`, 3 idiomas), e
//    `errors.icon` do 422 interceptado ANTES do loop genérico de `setError`
//    (item 5 acima) e roteado para `setIconError` — `icon` não é campo RHF,
//    então `setError('icon', ...)` nunca teria onde renderizar (achado do
//    Arquiteto lendo o código real desta Tarefa).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { ImageUpload } from '@/components/Form/ImageUpload';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { markerType } from '@/constants/Marker/marker-type';
import { markerTypeOptions } from '@/constants/Marker/options/marker-type-options';
import { queryKey } from '@/constants/query-key';

import { markerSchemaResolver } from '@/validations/schemas/BaseRegistrations/marker-schema';

import {
  createMarker,
  getMarkerByUuid,
  updateMarker,
} from '@/services/v2/BaseRegistrations/marker-service';

import type { Option } from '@/@types/option';
import type {
  MarkerDetail,
  MarkerFormType,
  MarkerPayload,
} from '@/@types/v2/BaseRegistrations/marker';

export default function CreateOrUpdateMarkers() {
  const { markerId } = useParams<{ markerId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(markerId);

  const text = languageGB.markers.marker;

  const canSave = isEditing ? can('markers_edit') : can('markers_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<MarkerFormType>({
    mode: 'onChange',
    resolver: markerSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
      type: markerType.activity,
    },
  });

  // ---- Estado do ícone (NÃO é campo RHF — checklist item 2, upload
  // multipart inline). `iconFile` = arquivo novo selecionado nesta sessão;
  // `removeIcon` = flag local (só se aplica no update — no create o ícone é
  // obrigatório); `currentIconUrl` = espelho de `data.icon_url` (edição), só
  // para preview; `iconError` = bloqueio client-side de "obrigatório no
  // create", sem passar pelo schema Yup.
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [removeIcon, setRemoveIcon] = useState(false);
  const [currentIconUrl, setCurrentIconUrl] = useState<string | null>(null);
  const [iconError, setIconError] = useState<string | undefined>(undefined);

  function handleFileSelected(file: File | null) {
    setIconFile(file);
    setRemoveIcon(false);
    setIconError(undefined);
  }

  function handleRemoveIcon() {
    setIconFile(null);
    setRemoveIcon(true);
    setCurrentIconUrl(null); // some com o preview; dropzone reaparece; removeIcon=true garante a remoção no save
  }

  function fillForm(data: MarkerDetail, resetForce?: boolean) {
    // Checklist item 1 — guard EXPLÍCITO, nunca `isEmpty`/`!isEmpty`: só
    // sobrescreve os valores do form quando o usuário ainda não editou nada
    // (evita clobar uma edição em andamento caso o hook refaça o fetch em
    // background), ou quando `resetForce` for pedido explicitamente.
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (hasNoFormChanges || resetForce) {
      reset({
        description: data.description,
        is_enabled: !!data.is_enabled,
        type: data.type,
      });
    }
    // Ícone não é campo RHF — só sincroniza o preview "atual" quando o
    // usuário ainda não escolheu localmente um arquivo novo nem marcou
    // remoção (evita clobar uma seleção em andamento).
    if (!iconFile && !removeIcon) {
      setCurrentIconUrl(data.icon_url);
    }
  }

  const markerQuery = useCustomFormQueryByGuid<MarkerDetail>({
    registrationId: isEditing ? markerId : undefined,
    queryKey: queryKey.markers.marker,
    asyncFunction: getMarkerByUuid,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([markerQuery as any]);

  const markerMutation = useRequest({
    asyncFunction: tryPersistMarker,
    entityName: text.singularLabel,
    queryKey: queryKey.markers.markersList,
    queryKey2: queryKey.markers.marker,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate('/cadastros-base/marcadores');
    },
  });

  async function tryPersistMarker(data: MarkerFormType) {
    // Checklist item 3 — payload sempre FULL-RESOURCE (nunca um delta de
    // dirtyFields); `buildMarkerFormData` (service) monta o FormData
    // multipart a partir deste objeto completo.
    const payload: MarkerPayload = {
      description: data.description.trim(),
      is_enabled: !!data.is_enabled,
      type: data.type,
      icon: iconFile,
      removeIcon,
    };

    try {
      // Checklist item 4 — update via POST + `_method=PUT` (method
      // spoofing) — o service já implementa isso; NUNCA `api.V2.put()` com
      // FormData.
      return isEditing && markerId
        ? await updateMarker(markerId, payload)
        : await createMarker(payload);
    } catch (error) {
      // Checklist item 5 — 422 do backend mapeado por campo (mesma chave de
      // MarkerFormType) — este projeto não tem, hoje, um mecanismo
      // compartilhado para isso em `useRequest.tsx` (mesmo achado/solução já
      // usados em `Safra/CreateOrUpdateSafra.tsx`). Mapeamento feito
      // LOCALMENTE aqui; o `throw` preserva o toast genérico que `useRequest`
      // já mostra para qualquer erro (soma, não substitui).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        // TASK-MK-FE-03 — `icon` NÃO é campo RHF (é estado dedicado
        // `iconFile`/`iconError`, ver comentário de cabeçalho item 2): sem
        // este intercept, `setError('icon', ...)` cairia no loop genérico
        // abaixo sem nenhum JSX que leia `errors.icon?.message`, deixando a
        // mensagem do servidor (ex.: 422 de `errors.icon` do ERRO-03,
        // formato de imagem não suportado) INVISÍVEL ao usuário. Roteado
        // para `setIconError`, o mesmo estado que `ImageUpload` já exibe via
        // prop `error`.
        if (fieldErrors?.icon?.[0]) {
          setIconError(fieldErrors.icon[0]);
        }
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (field === 'icon') return; // já tratado acima — não há campo RHF `icon` para `setError`
          if (messages?.[0]) {
            setError(field as keyof MarkerFormType, { type: 'server', message: messages[0] });
          }
        });
      }
      throw error;
    }
  }

  const hasIconChange = !!iconFile || removeIcon;

  // Checklist item 1 — guard `onSubmit`: checagem EXPLÍCITA
  // `Object.keys(dirtyFields).length === 0`, nunca `isEmpty`/`!isEmpty`
  // (armadilha #4, histórico real de bug em `Especies`/`Perfil`/`Cultivation`
  // com o utilitário mal-nomeado). `hasIconChange` é um segundo fator
  // necessário porque o ícone não é campo RHF, então uma troca/remoção só de
  // ícone nunca suja `dirtyFields`.
  async function onSubmit(data: MarkerFormType) {
    // Checklist item 2 — bloqueio client-side de `icon` ausente no CREATE,
    // sem round-trip à API (espelha o `required` do `MarkerRequest`, DA-MK-17).
    if (!isEditing && !iconFile) {
      setIconError(text.form.validation.iconRequired);
      return;
    }
    setIconError(undefined);

    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (isEditing && hasNoFormChanges && !hasIconChange) {
      navigate('/cadastros-base/marcadores');
    } else {
      await markerMutation.mutateAsync(data);
    }
  }

  const isSubmitting = markerMutation.isPending;

  const typeOptions = markerTypeOptions.options(languageGB);

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
            name="type"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.type}
                name={name}
                value={typeOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<1 | 2> | null) =>
                  onChange(opt?.value ?? markerType.activity)
                }
                options={typeOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field }) => (
              <Box display="flex" alignItems="center" justifyContent="space-between" h="full">
                <Text fontSize="sm" fontWeight="medium">
                  {text.form.fields.isEnabled}
                </Text>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  disabled={!canSave || isLoading}
                  aria-label={text.form.fields.isEnabled}
                />
              </Box>
            )}
          />
        </SimpleGrid>

        <Box mt={6}>
          <ImageUpload
            label={isEditing ? text.form.fields.iconNew : text.form.fields.icon}
            hint={`${text.form.hints.iconAccepted} ${text.form.hints.iconMaxSize}`}
            // TASK-MK-FE-03 (ERRO-03) — GD do container sem libjpeg; API
            // restrita a PNG por decisão do dono, divergência consciente do
            // legado (que aceitava JPEG). Só PNG é selecionável no picker.
            accept="image/png"
            maxSizeMb={2}
            currentImageUrl={currentIconUrl}
            file={iconFile}
            onFileSelected={handleFileSelected}
            onRemove={handleRemoveIcon}
            disabled={!canSave || isLoading}
            error={iconError}
            dropzoneTitle={text.form.image.dropzoneTitle}
            dropzoneDraggingTitle={text.form.image.dropzoneDragging}
            changeLabel={text.form.image.changeLabel}
            removeLabel={text.form.image.removeLabel}
            errorTypeMessage={text.form.image.errorType}
            errorSizeMessage={text.form.image.errorSize}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
