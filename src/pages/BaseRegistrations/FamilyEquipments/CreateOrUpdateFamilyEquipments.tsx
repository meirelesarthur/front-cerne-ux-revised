// src/pages/BaseRegistrations/FamilyEquipments/CreateOrUpdateFamilyEquipments.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de FAMÍLIA DE BENS — Cadastros Base
// (TASK-FE-FE-02). Rotas: /cadastros-base/familia-de-bens/novo e
// /cadastros-base/familia-de-bens/:familyEquipmentId (GUID), registradas em
// src/router/index.tsx (a rota-mãe da listagem é registrada pela Tarefa irmã
// FE-FE-01), guardadas por `familyequipments_view`.
//
// Estrutura mecânica idêntica a CentroCusto/CreateOrUpdateCentroCusto.tsx /
// Especies/CreateOrUpdateEspecie.tsx (isEditing por GUID, `fillForm` guardado
// por `!isEmpty(dirtyFields) || resetForce`, mutação via `useRequest`).
// Permissão de salvar é GLOBAL nos dois modos (`familyequipments_create`/
// `familyequipments_edit` — recurso sem flag por item, diferente de
// CostCenter/DEC-005).
//
// ⚠️ CHECKLIST OBRIGATÓRIO (itens 2/3/7/8 desta Tarefa — ver Tarefa irmã
// FE-FE-01 para os itens 1/4/5/6/9):
//
// 2) Guard `onSubmit` — `src/utils/isEmpty.ts` está MAL NOMEADA (retorna
//    `true` quando o objeto TEM ao menos uma chave). A fórmula VERIFICADA
//    como correta (família CentroCusto/Safra/Armazem, NÃO a família
//    Especies/Perfil/Cultivation, que está invertida/bugada) é:
//      if (isEditing && !isEmpty(dirtyFields)) { navigate(-1); }
//      else { await mutateAsync(data); }
//    Nunca remover o `!`. Adaptação adicional e TRANSPARENTE desta Tarefa
//    (não pedida literalmente pelo checklist, mas necessária para não
//    reintroduzir o mesmo tipo de bug por outra via): a imagem NÃO é um campo
//    RHF, então `dirtyFields` nunca reflete uma troca/remoção de imagem — a
//    fórmula pura descartaria silenciosamente uma edição feita SÓ na imagem.
//    Por isso o guard usa `!isEmpty(dirtyFields) && !hasImageChange`
//    (`hasImageChange = !!imageFile || removeImage`) para decidir "nada
//    mudou" — a fórmula do checklist continua exatamente como especificada,
//    apenas com um segundo fator, documentado aqui e no relatório de entrega.
//
// 3) Payload sempre FULL-RESOURCE (todos os campos, nunca um delta de
//    `dirtyFields`) — `buildFamilyEquipmentFormData` (service) já implementa
//    isso; este arquivo só monta o `FamilyEquipmentPayload` completo a partir
//    do form + imagem.
//
// 7) `residual` só renderiza/é obrigatório quando
//    `type_depreciation === COM_RESIDUAL (1)` — `watch` reativo; limpo
//    (`setValue('residual', null)`) ao trocar para SEM_RESIDUAL.
//
// 8) Upload de imagem via `@/components/Form/ImageUpload` — preview/trocar/
//    remover, validação client-side de mimetype/tamanho.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { ImageUpload } from '@/components/Form/ImageUpload';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { FamilyEquipmentDepreciationType } from '@/constants/FamilyEquipmentDepreciationType';
import { queryKey } from '@/constants/query-key';

import { familyEquipmentSchemaResolver } from '@/validations/schemas/BaseRegistrations/familyEquipment-schema';

import {
  createFamilyEquipment,
  getFamilyEquipmentByUuid,
  updateFamilyEquipment,
} from '@/services/v2/BaseRegistrations/familyEquipment-service';

import type { Option } from '@/@types/option';
import type {
  FamilyEquipmentDetail,
  FamilyEquipmentFormType,
  FamilyEquipmentPayload,
} from '@/@types/v2/BaseRegistrations/familyEquipment';

export default function CreateOrUpdateFamilyEquipments() {
  const { familyEquipmentId } = useParams<{ familyEquipmentId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(familyEquipmentId);

  const text = languageGB.baseRegistrations.familyEquipment;

  const canSave = isEditing ? can('familyequipments_edit') : can('familyequipments_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<FamilyEquipmentFormType>({
    mode: 'onChange',
    resolver: familyEquipmentSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: true,
      type_depreciation: FamilyEquipmentDepreciationType.SEM_RESIDUAL,
      depreciation: null,
      residual: null,
      life_bens: null,
      vl_time_productive: null,
      vl_time_unproductive: null,
    },
  });

  // ---- Estado da imagem (NÃO é campo RHF — ver "Achado real #1" da Tarefa,
  // upload multipart inline). `imageFile` = arquivo novo selecionado nesta
  // sessão; `removeImage` = flag local que vira `remove_image=1` no submit;
  // `currentImageUrl` = espelho de `data.image_url` (edição), só para preview.
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  function handleFileSelected(file: File | null) {
    setImageFile(file);
    setRemoveImage(false);
  }

  function handleRemoveImage() {
    setImageFile(null);
    setRemoveImage(true);
    setCurrentImageUrl(null); // some com o preview; dropzone reaparece; removeImage=true garante a remoção no save
  }

  function fillForm(data: FamilyEquipmentDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        description: data.description,
        is_enabled: !!data.is_enabled,
        type_depreciation: data.type_depreciation,
        depreciation: data.depreciation,
        residual: data.residual,
        life_bens: data.life_bens,
        vl_time_productive: data.vl_time_productive,
        vl_time_unproductive: data.vl_time_unproductive,
      });
    }
    // Imagem não é campo RHF — só sincroniza o preview "atual" quando o
    // usuário ainda não escolheu localmente um arquivo novo nem marcou
    // remoção (evita clobar uma seleção em andamento caso o hook refaça o
    // fetch em background).
    if (!imageFile && !removeImage) {
      setCurrentImageUrl(data.image_url);
    }
  }

  const familyEquipmentQuery = useCustomFormQueryByGuid<FamilyEquipmentDetail>({
    registrationId: isEditing ? familyEquipmentId : undefined,
    queryKey: queryKey.baseRegistrations.familyEquipment,
    asyncFunction: getFamilyEquipmentByUuid,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([familyEquipmentQuery as any]);

  const familyEquipmentMutation = useRequest({
    asyncFunction: tryPersistFamilyEquipment,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.familyEquipments,
    queryKey2: queryKey.baseRegistrations.familyEquipment,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistFamilyEquipment(data: FamilyEquipmentFormType) {
    const isComResidual = data.type_depreciation === FamilyEquipmentDepreciationType.COM_RESIDUAL;

    // Checklist item 3 — payload sempre FULL-RESOURCE (nunca um delta de
    // dirtyFields); `buildFamilyEquipmentFormData` (service) monta o
    // FormData multipart a partir deste objeto completo.
    const payload: FamilyEquipmentPayload = {
      description: data.description.trim(),
      is_enabled: !!data.is_enabled,
      type_depreciation: data.type_depreciation,
      depreciation: data.depreciation ?? null,
      life_bens: data.life_bens ?? null,
      // `residual` só é enviado quando o tipo é COM_RESIDUAL — evita mandar
      // um valor residual "fantasma" de uma seleção anterior (mesma
      // disciplina do `replaceApportionments([])` em CentroCusto).
      residual: isComResidual ? (data.residual ?? null) : null,
      vl_time_productive: data.vl_time_productive ?? null,
      vl_time_unproductive: data.vl_time_unproductive ?? null,
      image: imageFile,
      removeImage,
    };

    if (isEditing && familyEquipmentId) {
      // Update via POST + `_method=PUT` (method spoofing) — o service já
      // implementa isso; NUNCA `api.V2.put()` com FormData (ver Achado real
      // #2 da Tarefa).
      return await updateFamilyEquipment(familyEquipmentId, payload);
    }

    return await createFamilyEquipment(payload);
  }

  const hasImageChange = !!imageFile || removeImage;

  // Checklist item 2 — guard `onSubmit`: fórmula VERIFICADA como correta
  // (família CentroCusto/Safra/Armazem, `!isEmpty(dirtyFields)`) + fator
  // adicional `!hasImageChange` (ver nota de cabeçalho do arquivo — a imagem
  // não é campo RHF, então uma troca/remoção só de imagem não suja
  // `dirtyFields`).
  async function onSubmit(data: FamilyEquipmentFormType) {
    if (isEditing && !isEmpty(dirtyFields) && !hasImageChange) {
      navigate(-1);
    } else {
      await familyEquipmentMutation.mutateAsync(data);
    }
  }

  const isSubmitting = familyEquipmentMutation.isPending;

  const typeDepreciationOptions: Option<number>[] = [
    {
      value: FamilyEquipmentDepreciationType.SEM_RESIDUAL,
      label: text.form.typeDepreciationOptions.semResidual,
    },
    {
      value: FamilyEquipmentDepreciationType.COM_RESIDUAL,
      label: text.form.typeDepreciationOptions.comResidual,
    },
  ];

  const watchedTypeDepreciation = watch('type_depreciation');
  const isComResidual = watchedTypeDepreciation === FamilyEquipmentDepreciationType.COM_RESIDUAL;

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
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="type_depreciation"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.typeDepreciation}
                name={name}
                value={typeDepreciationOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<number> | null) => {
                  onChange(opt?.value ?? FamilyEquipmentDepreciationType.SEM_RESIDUAL);
                  // Checklist item 7 — ao SAIR de COM_RESIDUAL, limpar
                  // VISUALMENTE o valor de `residual` (evita enviar um valor
                  // residual "fantasma" de uma seleção anterior).
                  if (opt?.value !== FamilyEquipmentDepreciationType.COM_RESIDUAL) {
                    setValue('residual', null, { shouldDirty: true });
                  }
                }}
                options={typeDepreciationOptions}
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

        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <Controller
            name="depreciation"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.depreciation}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                min={0}
                max={100}
                allowDot
                decimalPlaces={2}
                error={fieldState.error?.message}
                disabled={!canSave || isLoading}
              />
            )}
          />

          {isComResidual && (
            <Controller
              name="residual"
              control={control}
              rules={{ required: isComResidual }}
              render={({ field, fieldState }) => (
                <NumberInput
                  name={field.name}
                  label={text.form.fields.residual}
                  tooltip={text.form.hints.residualConditional}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  min={0}
                  max={100}
                  allowDot
                  decimalPlaces={2}
                  error={fieldState.error?.message}
                  isRequired
                  disabled={!canSave || isLoading}
                />
              )}
            />
          )}

          <Controller
            name="life_bens"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.lifeBens}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                min={1}
                decimalPlaces={0}
                error={fieldState.error?.message}
                disabled={!canSave || isLoading}
              />
            )}
          />
        </SimpleGrid>

        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <Controller
            name="vl_time_productive"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.vlTimeProductive}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                min={0}
                allowDot
                decimalPlaces={2}
                error={fieldState.error?.message}
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Controller
            name="vl_time_unproductive"
            control={control}
            render={({ field, fieldState }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.vlTimeUnproductive}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                min={0}
                allowDot
                decimalPlaces={2}
                error={fieldState.error?.message}
                disabled={!canSave || isLoading}
              />
            )}
          />
        </SimpleGrid>

        <Box mt={6}>
          <ImageUpload
            label={text.form.fields.image}
            hint={`${text.form.hints.imageAccepted} ${text.form.hints.imageMaxSize}`}
            accept="image/jpeg,image/png,image/jpg,image/gif,image/svg+xml"
            maxSizeMb={2}
            currentImageUrl={currentImageUrl}
            file={imageFile}
            onFileSelected={handleFileSelected}
            onRemove={handleRemoveImage}
            disabled={!canSave || isLoading}
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
