// src/pages/Operacional/DeathAnimals/CreateOrUpdateDeathAnimal.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de MORTES (DeathAnimal) — Operacional/
// Pecuária, TASK-DA-FE-02. Rotas: `/operacional/mortes/novo` (criação) e
// `/operacional/mortes/:deathAnimalUuid` (edição, GUID).
//
// 3 mecanismos reaproveitados de 3 siblings estruturais DIFERENTES (nenhum
// módulo já combina os três):
//   - `FeedlotYards/CreateOrUpdateFeedlotYard.tsx` — esqueleto geral do form
//     (`FormContainer`, `fillForm` com guarda de `dirtyFields`, bloco `code`
//     readonly fora do `<Form>`);
//   - `Nascimentos/CreateOrUpdateBirthAnimal.tsx` — upload de foto
//     (`ImageUpload`, estado dedicado `photoFile`/`currentPhotoUrl`, NÃO
//     campo RHF) + guarda de `check-date` no formato `checks` map
//     (debounce ~600ms, `toaster` NÃO-BLOQUEANTE, falha de rede silenciosa);
//   - `Diet/DietBeat/CreateOrUpdateDietBeat.tsx` — select travado em edição
//     (`isDisabled={!canSave || isEditing}`), reusado para `batch_uuid`/
//     `animal_uuid` (o backend já ignora esses campos no `update()`, travar
//     no client é só reforço de UX).
//
// Payload SEMPRE full-resource-replace (nunca um delta de `dirtyFields`,
// mirror `BirthAnimalPayload`) — `DeathAnimalRequest::rules()` (api_root)
// exige `animal_uuid`/`batch_uuid` `required` em AMBOS os verbos (a
// imutabilidade pós-criação é responsabilidade da `UpdateDeathAnimalAction`
// no servidor, não deste formulário); por isso o front sempre reenvia os
// valores já hidratados desses 2 campos, mesmo sendo `isDisabled`.
//
// `code`/`user_name` NUNCA entram no `register()`/payload — texto estático
// fora do `<Form>` (`InputReadOnly`). "Funcionário Responsável":
// `useAuth().user?.username` em criação (`User.username` = `profile.name`,
// mirror `CreateOrUpdatePastagem.tsx`); `data.user?.name` (do Resource) em
// edição.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { ImageUpload } from '@/components/Form/ImageUpload';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { deathAnimalSchemaResolver } from '@/validations/schemas/DeathAnimals/deathAnimal-schema';

import { listAnimals } from '@/services/v2/Animals/animal-service';
import { listBatchOptions } from '@/services/v2/Batches/batch-service';
import {
  checkDeathAnimalDate,
  createDeathAnimal,
  updateDeathAnimal,
} from '@/services/v2/DeathAnimals/death-animal-service';
import { listDeathLossOptions } from '@/services/v2/DeathLosses/death-loss-service';

import type { AnimalListItem } from '@/@types/v2/Animals';
import type { BatchOption } from '@/@types/v2/Batches';
import type {
  DeathAnimalDetail,
  DeathAnimalForm as DeathAnimalFormType,
  DeathAnimalPayload,
} from '@/@types/v2/DeathAnimals';
import type { DeathLossOptionRef } from '@/@types/v2/DeathLosses';

import { useDeathAnimalForm } from './useDeathAnimals';

const DEATH_ANIMALS_LIST_ROUTE = '/operacional/mortes';

export default function CreateOrUpdateDeathAnimal() {
  const { deathAnimalUuid } = useParams<{ deathAnimalUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user } = useAuth();

  const text = languageGB.deathAnimals.deathAnimal;
  const formText = text.form;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(deathAnimalUuid);

  // Guard de GUID malformado na rota de edição — redireciona para a
  // listagem ANTES de renderizar o form (mesmo racional de `Nascimentos`).
  useEffect(() => {
    if (deathAnimalUuid && !isValidGuid(deathAnimalUuid)) {
      navigate(DEATH_ANIMALS_LIST_ROUTE, { replace: true });
    }
  }, [deathAnimalUuid, navigate]);

  const canEdit = can('death_animals_edit');
  const canCreate = can('death_animals_create');
  const canSave = isEditing ? canEdit : canCreate;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<DeathAnimalFormType>({
    mode: 'onChange',
    resolver: deathAnimalSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      date: '',
      batch_uuid: null,
      animal_uuid: null,
      cause_uuid: null,
      note: '',
    },
  });

  // ---- Estado da foto (NÃO é campo RHF, mirror `Nascimentos`). ----
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | undefined>(undefined);

  // `code`/`user` — sempre readonly, NÃO são campo RHF. Dado cru do
  // servidor, populado só em `fillDeathAnimalForm` (edição).
  const [codeDisplay, setCodeDisplay] = useState<string | null>(null);
  const [userNameDisplay, setUserNameDisplay] = useState<string | null>(null);

  function handlePhotoSelected(file: File | null) {
    setPhotoFile(file);
    setPhotoError(undefined);
  }

  // Função NOMEADA, guarda EXPLÍCITA `Object.keys(dirtyFields).length === 0`
  // (NUNCA `isEmpty()`/`!isEmpty()` do utilitário mal-nomeado/INVERTIDO,
  // `src/utils/isEmpty.ts` retorna `true` quando o objeto TEM chaves — mesma
  // landmine documentada em `CreateOrUpdateBirthAnimal.tsx`).
  function fillDeathAnimalForm(data: DeathAnimalDetail, resetForce?: boolean) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (!(hasNoFormChanges || resetForce)) return;

    reset({
      date: data.date,
      batch_uuid: data.batch ? { label: data.batch.description, value: data.batch.uuid } : null,
      animal_uuid: data.animal
        ? { label: data.animal.identification, value: data.animal.uuid }
        : null,
      cause_uuid: { label: data.cause.description, value: data.cause.uuid },
      note: data.note ?? '',
    });

    setCodeDisplay(data.code);
    setUserNameDisplay(data.user?.name ?? null);

    // Foto — só sincroniza o preview "atual" quando o usuário ainda não
    // escolheu localmente um arquivo novo (mirror `CreateOrUpdateBirthAnimal.tsx`).
    if (!photoFile) {
      setCurrentPhotoUrl(data.photo_url);
    }
  }

  const deathAnimalQuery = useDeathAnimalForm({
    registrationId: isEditing ? deathAnimalUuid : undefined,
    fillForm: fillDeathAnimalForm,
  });

  const isLoading = isEditing && checkLoadingStatus([deathAnimalQuery as any]);

  const deathAnimalMutation = useRequest({
    asyncFunction: tryPersistDeathAnimal,
    entityName: text.singularLabel,
    queryKey: queryKey.deathAnimals.deathAnimals,
    queryKey2: queryKey.deathAnimals.deathAnimal,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Payload SEMPRE full-resource-replace — `animal_uuid`/`batch_uuid`
  // REENVIADOS mesmo em edição (`DeathAnimalRequest::rules()` os exige em
  // ambos os verbos; o servidor os ignora ao montar o `update()`).
  async function tryPersistDeathAnimal(data: DeathAnimalFormType) {
    const payload: DeathAnimalPayload = {
      date: data.date,
      animal_uuid: data.animal_uuid!.value,
      batch_uuid: data.batch_uuid!.value,
      cause_uuid: data.cause_uuid!.value,
      note: data.note || undefined,
      photo: photoFile || undefined,
    };

    return isEditing && deathAnimalUuid
      ? updateDeathAnimal(deathAnimalUuid, payload)
      : createDeathAnimal(payload);
  }

  // Guard `onSubmit`: sem campos sujos em edição E sem foto nova → nada a
  // salvar (mirror `CreateOrUpdateBirthAnimal.tsx`).
  async function onSubmit(data: DeathAnimalFormType) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    const hasPhotoChange = !!photoFile;
    if (isEditing && hasNoFormChanges && !hasPhotoChange) {
      navigate(-1);
    } else {
      await deathAnimalMutation.mutateAsync(data);
    }
  }

  const isSubmitting = deathAnimalMutation.isPending;

  // ---- Autofill Animal → Lote (Seção "Riscos" item 1 do contrato de tela) ----
  const watchedBatch = useWatch({ control, name: 'batch_uuid' });
  const watchedAnimal = useWatch({ control, name: 'animal_uuid' });

  function listAnimalsForSelect(params: { search?: string; page?: number; per_page?: number }) {
    return listAnimals({ ...params, batch: watchedBatch?.value || undefined });
  }

  // ---- Guarda `check-date` (NÃO-BLOQUEANTE, mirror `Nascimentos`) ----
  const watchedDate = useWatch({ control, name: 'date' });
  const lastCheckRef = useRef('');

  useEffect(() => {
    if (!watchedDate) return;

    const checkKey = `${watchedDate}|${watchedAnimal?.value ?? ''}|${watchedBatch?.value ?? ''}`;
    const timer = setTimeout(async () => {
      if (checkKey === lastCheckRef.current) return;
      lastCheckRef.current = checkKey;

      try {
        const result = await checkDeathAnimalDate({
          animal_uuid: watchedAnimal?.value,
          batch_uuid: watchedBatch?.value,
          date: watchedDate,
        });

        if (result.checks.animal?.valid === false && result.checks.animal.message) {
          toaster.create({
            type: 'warning',
            title: formText.dateWarning.title,
            description: result.checks.animal.message,
          });
        }
        if (result.checks.batch?.valid === false && result.checks.batch.message) {
          toaster.create({
            type: 'warning',
            title: formText.dateWarning.title,
            description: result.checks.batch.message,
          });
        }
      } catch {
        // aviso prévio não bloqueia o preenchimento — mirror Nascimentos.
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [watchedDate, watchedAnimal?.value, watchedBatch?.value]);

  if (deathAnimalUuid && !isValidGuid(deathAnimalUuid)) {
    return null;
  }

  const displayUserName = isEditing ? (userNameDisplay ?? '') : (user?.username ?? '');

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
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
      <Form id="death-animal-form" noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* 1. Foto (opcional) */}
        <Box mb={6}>
          <ImageUpload
            label={formText.fields.photo}
            hint={`${formText.hints.photoAccepted} ${formText.hints.photoMaxSize}`}
            currentImageUrl={currentPhotoUrl}
            file={photoFile}
            onFileSelected={handlePhotoSelected}
            disabled={!canSave || !!isLoading}
            error={photoError}
            dropzoneTitle={formText.image.dropzoneTitle}
            dropzoneDraggingTitle={formText.image.dropzoneDragging}
            changeLabel={formText.image.changeLabel}
            removeLabel={formText.image.removeLabel}
            errorTypeMessage={formText.image.errorType}
            errorSizeMessage={formText.image.errorSize}
          />
        </Box>

        <SimpleGrid columns={columnsForm.default} gap={6}>
          {/* 2. Código (gerado no servidor — SEMPRE texto estático). */}
          <InputReadOnly
            label={formText.fields.code}
            value={isEditing ? (codeDisplay ?? '') : formText.hints.codeGeneratedOnSave}
            loading={!!isLoading}
          />

          {/* 3. Data */}
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(value) => field.onChange(value ?? '')}
                label={formText.fields.date}
                error={errors.date?.message as string | undefined}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          {/* 4. Funcionário Responsável — sempre readonly. */}
          <InputReadOnly
            label={formText.fields.userName}
            value={displayUserName}
            loading={!!isLoading}
          />

          {/* 5. Lote — travado em edição (mirror `DietBeat`). */}
          <Controller
            name="batch_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.batch}
                placeholder={formText.placeholders.batch}
                error={errors.batch_uuid?.message as string | undefined}
                service={listBatchOptions}
                mapOptions={(item: BatchOption) => ({ label: item.label, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isDisabled={!canSave || isEditing || !!isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          {/* 6. Animal — travado em edição, autofill de Lote no onChange. */}
          <Controller
            name="animal_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.animal}
                placeholder={formText.placeholders.animal}
                error={errors.animal_uuid?.message as string | undefined}
                service={listAnimalsForSelect}
                mapOptions={(item: AnimalListItem) => ({
                  label: item.identification,
                  value: item.uuid,
                  // smuggled — SelectAsyncPaginate repassa o objeto inteiro ao onChange.
                  batch: item.batch,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                cacheUniqs={[watchedBatch?.value]}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  if (option?.batch) {
                    setValue(
                      'batch_uuid',
                      { label: option.batch.label, value: option.batch.uuid },
                      { shouldDirty: true }
                    );
                  }
                }}
                isRequired
                isDisabled={!canSave || isEditing || !!isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          {/* 7. Causa — options via `listDeathLossOptions` (cause=M), nunca travado. */}
          <Controller
            name="cause_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.cause}
                placeholder={formText.placeholders.cause}
                error={errors.cause_uuid?.message as string | undefined}
                service={listDeathLossOptions}
                mapOptions={(item: DeathLossOptionRef) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={() => ({ cause: 'M' })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isDisabled={!canSave || !!isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </SimpleGrid>

        {/* 8. Observação (opcional, sem `maxLength` — coluna TEXT). */}
        <Box mt={6}>
          <Textarea
            label={formText.fields.note}
            {...register('note')}
            error={errors.note?.message as string | undefined}
            loading={!!isLoading}
            disabled={!canSave}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
