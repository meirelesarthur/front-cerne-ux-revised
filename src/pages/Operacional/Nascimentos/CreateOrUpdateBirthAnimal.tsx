// src/pages/Operacional/Nascimentos/CreateOrUpdateBirthAnimal.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de NASCIMENTO (BirthAnimal — Operacional >
// Pecuária, TASK-NASC-FE-02, frontend-contract-nascimentos.md §7). Rotas:
// `/operacional/nascimentos/novo` e `/operacional/nascimentos/:birthAnimalUuid/editar`
// (guardadas por `birth_animals_view`; botão Salvar gateado por
// `birth_animals_create`/`birth_animals_edit`, ver `router/index.tsx`).
//
// Molde MECÂNICO PRINCIPAL: `CadastrosBase/Rebanho/CreateOrUpdateAnimal.tsx`
// (casca `FormContainer`, `fillBirthAnimalForm` nomeada com guarda EXPLÍCITA
// de `dirtyFields`, `useFieldArray` no pai, upload de foto multipart, cascata
// Espécie→Categoria/Raça DIRETO no `onChange`) — mirror ESTRUTURAL, adaptado
// a nomes de campo/endpoint do domínio Nascimentos (contrato §1/§7). O molde
// de listagem/detalhe/gate (`Romaneios`) NÃO se aplica aqui.
//
// ⚠️ CHECKLIST OBRIGATÓRIO desta Tarefa (TASK-NASC-FE-02):
//
// 1) `fillBirthAnimalForm` é função NOMEADA, guarda EXPLÍCITA
//    `Object.keys(dirtyFields).length === 0 || resetForce` — NUNCA
//    `isEmpty()`/`!isEmpty()` do utilitário mal-nomeado/INVERTIDO
//    (`src/utils/isEmpty.ts` retorna `true` quando o objeto TEM chaves —
//    landmine documentada, mirror `CreateOrUpdateAnimal.tsx`).
// 2) Payload sempre FULL-RESOURCE-REPLACE (nunca um delta de `dirtyFields`,
//    contrato §3 — `update` do servidor usa `sometimes`, mas o front sempre
//    envia o recurso inteiro).
// 3) `mother_uuid` — OBRIGATÓRIO no client (`GAP-NASC-12`, decisão de UX já
//    tomada, NÃO reabrir) mesmo sendo `nullable` no servidor.
// 4) Upload de foto (`@/components/Form/ImageUpload`) NÃO é campo RHF —
//    estado dedicado `photoFile`/`removePhoto`/`currentPhotoUrl`/
//    `photoError` (mirror `CreateOrUpdateAnimal.tsx`). `GAP-NASC-10`
//    (decisão de paridade já tomada na API — preservar exatamente):
//    `BirthAnimalData` NÃO tem campo `remove_photo`/`remove_image` — "Remover"
//    no `ImageUpload` só limpa o preview LOCAL, NUNCA envia flag de remoção
//    ao servidor (`buildBirthAnimalFormData`, `birth-animal-service.ts`, já
//    implementado assim na Tarefa 18/fundação — não reabrir). Se não houver
//    `photoFile` novo no submit, a foto persistida permanece inalterada
//    (mirror fiel do bug legado, decisão explícita do dono/API).
// 5) Cascata Espécie→Categoria/Raça — trocar Espécie reseta Categoria E Raça
//    DIRETO no `onChange` do Controller de Espécie (NUNCA `useEffect`).
//    Diferente de `CreateOrUpdateAnimal.tsx` (onde Raça NÃO filtra mais por
//    Espécie, `TASK-FE-919`/D1): aqui `breed_uuid` FILTRA por `specie_uuid`
//    (`GAP-NASC-07`, extensão aditiva confirmada no backend) — a cascata
//    completa (Categoria + Raça) permanece, mirror do comportamento ORIGINAL
//    de `CreateOrUpdateAnimal.tsx` antes da reversão D1.
// 6) Identificação dinâmica (`useFieldArray`) — MÍNIMO 1 LINHA SEMPRE,
//    incondicional (`BirthAnimalIdentificationsSection.tsx`/
//    `BirthAnimalIdentificationRow.tsx`, contrato §7.2) — diferente de
//    Animal, nunca oculta.
// 7) Verificação de identificação (debounce por linha, contrato §7.3) e
//    aviso de consistência de data de lote (`date`/`batch_uuid`/
//    `transfer_batch_uuid`, contrato §7.4) são NÃO-BLOQUEANTES — nunca
//    impedem o submit.
// 8) 422 do backend mapeado por campo — `id_animals.N.*` (nome de campo do
//    SERVIDOR) precisa ser traduzido para `identifications.N.*` (nome do
//    campo do FORM), mirror `mapServerFieldToFormField` de
//    `CreateOrUpdateAnimal.tsx` (mesmo racional, chaves de wire diferentes
//    do nome do campo RHF só neste ponto — os demais campos batem 1:1).
// 9) Modo leitura (usuário só com `birth_animals_view` OU
//    `has_weaning === true`) redireciona para a rota de Detalhe — NUNCA
//    renderiza o form com campos `disabled` (contrato §7.5).
//
// ⚠️ Achado/decisão registrada (não é Gap, é disclosure de leitura de
// contrato): o contrato de tela lista, em paralelo, `father_text` como
// `Input` TEXTO LIVRE (§7.1, tabela de campos — fonte mais específica e
// autoritativa para ESTE campo) e também o endpoint
// `GET /birth-animals/candidate-fathers` como "select2 assíncrono" (§3,
// tabela de consumo de API) — os dois trechos DIVERGEM entre si dentro do
// mesmo documento. Optei pela leitura LITERAL de §7.1 (Input texto livre),
// que bate 1:1 com o wire real (`BirthAnimalRequest::rules()`:
// `father_text` => ['nullable','string','max:191'], SEM `Rule::exists` —
// confirma que não há resolução de FK client-side) — `listCandidateFathers`
// (já exportado por `birth-animal-service.ts`, Tarefa 18) fica disponível
// para um satélite futuro, não consumido nesta Tarefa. Reportado ao dono
// para confirmação, não bloqueia o fechamento desta Tarefa.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { ImageUpload } from '@/components/Form/ImageUpload';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { birthAnimalSchemaResolver } from '@/validations/schemas/BirthAnimals/birth-animal-schema';

import { listBirthNoteOptions } from '@/services/v2/BaseRegistrations/birthNote-service';
import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import {
  checkBatchBirthDate,
  createBirthAnimal,
  listCandidateMothers,
  updateBirthAnimal,
} from '@/services/v2/BirthAnimals/birth-animal-service';
import { listBreedOptions } from '@/services/v2/Breeds/breed-service';
import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';
import { listSpecieOptions } from '@/services/v2/Species/species-service';

import type { BirthNoteOptionItem } from '@/@types/v2/BaseRegistrations/birthNote';
import type { BatchOption } from '@/@types/v2/Batches';
import type {
  BirthAnimalDetail,
  BirthAnimalForm as BirthAnimalFormType,
  BirthAnimalOption,
  BirthAnimalPayload,
} from '@/@types/v2/BirthAnimals';
import type { BreedOptionItem } from '@/@types/v2/Breeds/breed';
import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';
import type { SpecieOptionItem } from '@/@types/v2/Species/species';

import { BirthAnimalIdentificationsSection } from './BirthAnimalIdentificationsSection';
import { useBirthAnimalForm } from './useBirthAnimals';

const NASCIMENTOS_LIST_ROUTE = '/operacional/nascimentos';

// Traduz o nome de campo do SERVIDOR (`id_animals.N.*`) para o nome do campo
// do FORM (`identifications.N.*`) — único ponto de divergência de wire
// (checklist item 8). Os demais campos (`date`/`weight`/`specie_uuid`/
// `category_uuid`/`breed_uuid`/`birth_note_uuid`/`mother_uuid`/
// `father_text`/`batch_uuid`/`transfer_batch_uuid`/`fur_description`/`note`)
// batem 1:1 entre `BirthAnimalRequest::rules()` e `BirthAnimalForm` — sem
// necessidade de mapeamento.
function mapServerFieldToFormField(field: string): string {
  const identificationMatch = field.match(/^id_animals\.(\d+)\.(id_animal_uuid|identification)$/);
  if (identificationMatch) {
    return `identifications.${identificationMatch[1]}.${identificationMatch[2]}`;
  }
  return field;
}

// Normaliza o sentinela `"0"` (`{ uuid: "0", label: "Sem lote" }`, injetado
// pelo backend em PRIMEIRO na lista de `/batches/options`,
// `batch-service.ts`) para `null` antes de montar payload/params de rede.
// `BirthAnimalRequest::rules()` valida `batch_uuid`/`transfer_batch_uuid`
// como `['nullable','uuid',...]` — NÃO aceita a string literal "0" (422,
// diferente do filtro de listagem `AnimalIndexRequest`, que aceita "0" de
// propósito). O sentinela é só um artifício de UI para "nenhum lote
// selecionado" dentro do Select — nunca deve ser enviado à API.
function normalizeBatchUuid(value: string | undefined | null): string | null {
  return value && value !== '0' ? value : null;
}

export default function CreateOrUpdateBirthAnimal() {
  const { birthAnimalUuid } = useParams<{ birthAnimalUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.birthAnimals.birthAnimal;
  const formText = text.form;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(birthAnimalUuid);

  // Guard de GUID malformado na rota de edição (checklist Lei 2/3/4 do
  // contrato §7.5) — redireciona para a listagem ANTES de renderizar o form.
  useEffect(() => {
    if (birthAnimalUuid && !isValidGuid(birthAnimalUuid)) {
      navigate(NASCIMENTOS_LIST_ROUTE, { replace: true });
    }
  }, [birthAnimalUuid, navigate]);

  const canEdit = can('birth_animals_edit');
  const canCreate = can('birth_animals_create');
  const canSave = isEditing ? canEdit : canCreate;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<BirthAnimalFormType>({
    mode: 'onChange',
    resolver: birthAnimalSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      date: '',
      specie_uuid: null,
      category_uuid: null,
      breed_uuid: null,
      birth_note_uuid: null,
      weight: null,
      mother_uuid: null,
      father_text: '',
      batch_uuid: null,
      transfer_batch_uuid: null,
      fur_description: '',
      note: '',
      identifications: [{ id_animal_uuid: null, identification: '' }],
    },
  });

  const {
    fields: identificationFields,
    append: appendIdentification,
    remove: removeIdentification,
  } = useFieldArray({ control, name: 'identifications' });

  // ---- Estado da foto (NÃO é campo RHF — checklist item 4). ----
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | undefined>(undefined);

  // `code` — sempre readonly, NÃO é campo RHF (não existe endpoint de
  // sugestão de código pré-submit nesta feature, contrato §7.1). Dado cru do
  // servidor, populado só em `fillBirthAnimalForm` (edição).
  const [codeDisplay, setCodeDisplay] = useState<string | null>(null);

  function handlePhotoSelected(file: File | null) {
    setPhotoFile(file);
    setPhotoError(undefined);
  }

  // "Remover" (checklist item 4, `GAP-NASC-10`) — só limpa o preview LOCAL.
  // NUNCA seta uma flag de remoção a ser enviada ao servidor (`BirthAnimalPayload`
  // não tem esse campo) — se o submit não tiver `photoFile` novo, a foto
  // persistida permanece inalterada no servidor (comportamento do backend,
  // não desta tela).
  function handleRemovePhoto() {
    setPhotoFile(null);
    setCurrentPhotoUrl(null);
    setPhotoError(undefined);
  }

  // Checklist item 1 — função NOMEADA, guarda EXPLÍCITA
  // `Object.keys(dirtyFields).length === 0 || resetForce` (NUNCA
  // `isEmpty`/`!isEmpty`).
  function fillBirthAnimalForm(data: BirthAnimalDetail, resetForce?: boolean) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (!(hasNoFormChanges || resetForce)) return;

    reset({
      date: data.date,
      specie_uuid: data.specie ? { label: data.specie.description, value: data.specie.uuid } : null,
      category_uuid: data.category
        ? { label: data.category.description, value: data.category.uuid }
        : null,
      breed_uuid: data.breed ? { label: data.breed.description, value: data.breed.uuid } : null,
      birth_note_uuid: data.birth_note
        ? { label: data.birth_note.description, value: data.birth_note.uuid }
        : null,
      weight: data.weight,
      mother_uuid: data.mother
        ? { label: data.mother.identification, value: data.mother.uuid }
        : null,
      father_text: data.father_text,
      batch_uuid: data.batch ? { label: data.batch.description, value: data.batch.uuid } : null,
      // `GAP-NASC-16` (OQ7/C43) — hidratado SEMPRE de `transfer_batch`, NUNCA
      // de `batch` — correção deliberada do bug de hidratação do legado.
      transfer_batch_uuid: data.transfer_batch
        ? { label: data.transfer_batch.description, value: data.transfer_batch.uuid }
        : null,
      fur_description: data.fur_description,
      note: data.note,
      identifications:
        data.id_animals.length > 0
          ? data.id_animals.map((item) => ({
              id_animal_uuid: { label: item.description, value: item.uuid },
              identification: item.identification,
            }))
          : [{ id_animal_uuid: null, identification: '' }],
    });

    setCodeDisplay(data.code);

    // Foto — só sincroniza o preview "atual" quando o usuário ainda não
    // escolheu localmente um arquivo novo (mirror `CreateOrUpdateAnimal.tsx`).
    if (!photoFile) {
      setCurrentPhotoUrl(data.photo_url);
    }
  }

  const birthAnimalQuery = useBirthAnimalForm({
    registrationId: isEditing ? birthAnimalUuid : undefined,
    fillForm: fillBirthAnimalForm,
  });

  const isLoading = isEditing && checkLoadingStatus([birthAnimalQuery as any]);
  const loadedData = birthAnimalQuery.data as BirthAnimalDetail | undefined;

  // Checklist item 9 (contrato §7.5) — modo leitura: usuário só com
  // `birth_animals_view` (sem `birth_animals_edit`) OU `has_weaning === true`
  // redireciona para a rota de Detalhe — NUNCA renderiza o form desabilitado.
  useEffect(() => {
    if (!isEditing || !loadedData) return;
    if (!canEdit || loadedData.has_weaning) {
      navigate(`${NASCIMENTOS_LIST_ROUTE}/${birthAnimalUuid}`, { replace: true });
    }
  }, [isEditing, loadedData, canEdit, birthAnimalUuid, navigate]);

  const birthAnimalMutation = useRequest({
    asyncFunction: tryPersistBirthAnimal,
    entityName: text.singularLabel,
    queryKey: queryKey.birthAnimals.birthAnimalsList,
    queryKey2: queryKey.birthAnimals.birthAnimal,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Checklist item 2 — payload SEMPRE full-resource-replace.
  async function tryPersistBirthAnimal(data: BirthAnimalFormType) {
    const payload: BirthAnimalPayload = {
      date: data.date,
      specie_uuid: data.specie_uuid!.value,
      category_uuid: data.category_uuid!.value,
      breed_uuid: data.breed_uuid?.value ?? null,
      birth_note_uuid: data.birth_note_uuid?.value ?? null,
      weight: data.weight!,
      mother_uuid: data.mother_uuid?.value ?? null,
      father_text: data.father_text || null,
      batch_uuid: normalizeBatchUuid(data.batch_uuid?.value),
      transfer_batch_uuid: normalizeBatchUuid(data.transfer_batch_uuid?.value),
      fur_description: data.fur_description || null,
      note: data.note || null,
      identifications: data.identifications.map((item) => ({
        id_animal_uuid: item.id_animal_uuid!.value,
        identification: item.identification,
      })),
      photo: photoFile,
    };

    try {
      return isEditing && birthAnimalUuid
        ? await updateBirthAnimal(birthAnimalUuid, payload)
        : await createBirthAnimal(payload);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        // `photo` NÃO é campo RHF (checklist item 4) — intercepta ANTES do
        // loop genérico, roteado para `photoError`.
        if (fieldErrors?.photo?.[0]) {
          setPhotoError(fieldErrors.photo[0]);
        }
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (field === 'photo') return;
          if (messages?.[0]) {
            setError(mapServerFieldToFormField(field) as keyof BirthAnimalFormType, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
      throw error;
    }
  }

  // Guard `onSubmit`: `Object.keys(dirtyFields).length === 0` EXPLÍCITO
  // (checklist item 1) + fator adicional `hasPhotoChange` (a foto não é
  // campo RHF, mirror `CreateOrUpdateAnimal.tsx`).
  async function onSubmit(data: BirthAnimalFormType) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    const hasPhotoChange = !!photoFile;
    if (isEditing && hasNoFormChanges && !hasPhotoChange) {
      navigate(-1);
    } else {
      await birthAnimalMutation.mutateAsync(data);
    }
  }

  const isSubmitting = birthAnimalMutation.isPending;

  // ---- Cascata Espécie→Categoria→Raça (checklist item 5) ----
  const watchedSpecie = watch('specie_uuid');
  const watchedNote = watch('note');
  const noteLength = (watchedNote ?? '').length;

  // ---- Aviso de consistência de data de lote (contrato §7.4, IG5/IG6) —
  // NÃO-BLOQUEANTE, debounce de ~600ms disparado por `date`/`batch_uuid`/
  // `transfer_batch_uuid` (checklist item 7). ----
  const watchedDate = useWatch({ control, name: 'date' });
  const watchedBatch = useWatch({ control, name: 'batch_uuid' });
  const watchedTransferBatch = useWatch({ control, name: 'transfer_batch_uuid' });
  const lastBatchDateCheckRef = useRef<string>('');

  useEffect(() => {
    if (!watchedDate) return;

    const normalizedBatchUuid = normalizeBatchUuid(watchedBatch?.value);
    const normalizedTransferBatchUuid = normalizeBatchUuid(watchedTransferBatch?.value);

    const checkKey = `${watchedDate}|${normalizedBatchUuid ?? ''}|${normalizedTransferBatchUuid ?? ''}`;
    const timer = setTimeout(async () => {
      if (checkKey === lastBatchDateCheckRef.current) return;
      lastBatchDateCheckRef.current = checkKey;

      try {
        const result = await checkBatchBirthDate({
          batch_uuid: normalizedBatchUuid ?? undefined,
          transfer_batch_uuid: normalizedTransferBatchUuid ?? undefined,
          date: watchedDate,
        });

        if (result.checks.batch?.valid === false && result.checks.batch.message) {
          toaster.create({
            type: 'warning',
            title: formText.batchDateWarning.title,
            description: result.checks.batch.message,
          });
        }
        if (result.checks.transfer_batch?.valid === false && result.checks.transfer_batch.message) {
          toaster.create({
            type: 'warning',
            title: formText.batchDateWarning.title,
            description: result.checks.transfer_batch.message,
          });
        }
      } catch {
        // Falha de rede/servidor no aviso não deve travar o preenchimento do
        // formulário — checagem prévia informativa, nunca parte do caminho
        // crítico de submit (contrato §7.4).
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [watchedDate, watchedBatch?.value, watchedTransferBatch?.value]);

  if (birthAnimalUuid && !isValidGuid(birthAnimalUuid)) {
    return null;
  }

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
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
        {/* ---- Foto (contrato §7.1, GAP-NASC-10) ---- */}
        <Box mb={6}>
          <ImageUpload
            label={formText.fields.photo}
            currentImageUrl={currentPhotoUrl}
            file={photoFile}
            onFileSelected={handlePhotoSelected}
            onRemove={handleRemovePhoto}
            disabled={!canSave || isLoading}
            error={photoError}
            dropzoneTitle={formText.image.dropzoneTitle}
            dropzoneDraggingTitle={formText.image.dropzoneDragging}
            changeLabel={formText.image.changeLabel}
            removeLabel={formText.image.removeLabel}
            errorTypeMessage={formText.image.errorType}
            errorSizeMessage={formText.image.errorSize}
          />
        </Box>

        {/* ---- Cabeçalho (contrato §7.1) ---- */}
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <InputReadOnly
            label={formText.fields.code}
            value={isEditing ? (codeDisplay ?? '') : formText.hints.codeGeneratedOnSave}
            loading={isLoading}
          />

          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={formText.fields.date}
                error={errors.date?.message as string | undefined}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Controller
            name="specie_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.specie}
                placeholder={formText.placeholders.specie}
                error={errors.specie_uuid?.message as string | undefined}
                service={listSpecieOptions}
                mapOptions={(item: SpecieOptionItem) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  // Checklist item 5 — cascata: trocar a Espécie reseta
                  // Categoria E Raça, DIRETO no onChange (nunca useEffect).
                  setValue('category_uuid', null, { shouldDirty: true });
                  setValue('breed_uuid', null, { shouldDirty: true });
                }}
                isRequired
                isDisabled={!canSave || isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="category_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.category}
                placeholder={
                  watchedSpecie ? formText.placeholders.category : formText.hints.specieRequired
                }
                error={errors.category_uuid?.message as string | undefined}
                isDisabled={!watchedSpecie || !canSave || isLoading}
                // `GAP-NASC-08` — `birth_categories=true` restringe às
                // categorias de faixa etária mais jovem (`start_month = 0`),
                // confirmado por consulta real ao catálogo (specie_id=1 →
                // "Fêmeas 0 a 12 meses"/"Machos 0 a 12 meses"; specie_id=3 →
                // equivalentes "Leite" — cobertura por DESCRIÇÃO consistente
                // com o legado, sem divergência).
                service={listCategoryAnimalOptions}
                mapOptions={(item: CategoryAnimalOptionItem) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  specie_uuid: watchedSpecie?.value,
                  birth_categories: true,
                })}
                cacheUniqs={[watchedSpecie?.value]}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="breed_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.breed}
                placeholder={formText.placeholders.breed}
                error={errors.breed_uuid?.message as string | undefined}
                isDisabled={!canSave || isLoading}
                // `GAP-NASC-07` — filtrado por Espécie (extensão aditiva já
                // aplicada na API), diferente de `CreateOrUpdateAnimal.tsx`
                // (que parou de filtrar Raça por Espécie, `TASK-FE-919`/D1).
                service={listBreedOptions}
                mapOptions={(item: BreedOptionItem) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  specie_uuid: watchedSpecie?.value,
                })}
                cacheUniqs={[watchedSpecie?.value]}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="birth_note_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.birthNote}
                placeholder={formText.placeholders.birthNote}
                error={errors.birth_note_uuid?.message as string | undefined}
                // `listBirthNoteOptions` (UT-000729) — lookup ENXUTO
                // `GET /birth-notes/options`, SEM gate de
                // `permission:birth_note_view`. Quem cria Nascimento sem a
                // permissão de gestão de Observação de Nascimento não deve
                // tomar 403 neste select (decisão do dono). A tela de GESTÃO
                // (`BaseRegistrations/BirthNotes`) continua usando
                // `listBirthNotes` (index gateado, correto lá).
                service={listBirthNoteOptions}
                mapOptions={(item: BirthNoteOptionItem) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isDisabled={!canSave || isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="weight"
            control={control}
            render={({ field, fieldState }) => (
              <MoneyInput
                name={field.name}
                label={formText.fields.weight}
                value={field.value}
                onValueChange={(value) => field.onChange(value)}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Controller
            name="mother_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.mother}
                placeholder={formText.placeholders.mother}
                error={errors.mother_uuid?.message as string | undefined}
                service={listCandidateMothers}
                mapOptions={(item: BirthAnimalOption) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isDisabled={!canSave || isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          {/* `father_text` — Input texto livre (contrato §7.1, ver disclosure
              no cabeçalho do arquivo). Servidor resolve `animal_father_id`
              por busca textual, fallback silencioso se não encontrar. */}
          <Input
            label={formText.fields.fatherText}
            placeholder={formText.placeholders.fatherText}
            maxLength={191}
            {...register('father_text')}
            error={errors.father_text?.message as string | undefined}
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="batch_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.batch}
                placeholder={formText.placeholders.batch}
                error={errors.batch_uuid?.message as string | undefined}
                // R4-FE-02 (P1) — `batch_uuid` de formulário, sem "Sem lote"
                // (`normalizeBatchUuid` acima segue como cinto e suspensório).
                service={listBatchOptionsForForm}
                mapOptions={(item: BatchOption) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  // IG4 — trocar o Lote (filtro Mãe) reseta a Mãe.
                  setValue('mother_uuid', null, { shouldDirty: true });
                }}
                isDisabled={!canSave || isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="transfer_batch_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.transferBatch}
                placeholder={formText.placeholders.transferBatch}
                error={errors.transfer_batch_uuid?.message as string | undefined}
                // R4-FE-02 (P1) — `transfer_batch_uuid` de formulário, sem "Sem lote".
                service={listBatchOptionsForForm}
                mapOptions={(item: BatchOption) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={!canSave || isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Input
            label={formText.fields.furDescription}
            maxLength={100}
            {...register('fur_description')}
            error={errors.fur_description?.message as string | undefined}
            loading={isLoading}
            disabled={!canSave}
          />
        </SimpleGrid>

        <Box mt={6}>
          <Textarea
            label={formText.fields.note}
            maxLength={1000}
            helperText={errors.note?.message ? undefined : `${noteLength}/1000`}
            {...register('note')}
            error={errors.note?.message as string | undefined}
            loading={isLoading}
            disabled={!canSave}
          />
        </Box>

        {/* ---- Identificações do bezerro (contrato §7.2/§7.3, checklist
            item 6) — mínimo 1 linha SEMPRE. ---- */}
        <Box mt={6}>
          <BirthAnimalIdentificationsSection
            fields={identificationFields}
            control={control}
            errors={errors}
            setValue={setValue}
            onAdd={() => appendIdentification({ id_animal_uuid: null, identification: '' })}
            onRemove={removeIdentification}
            canSave={canSave}
            isLoading={!!isLoading}
            text={formText}
            isEditing={isEditing}
            excludeUuid={isEditing ? birthAnimalUuid : undefined}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
