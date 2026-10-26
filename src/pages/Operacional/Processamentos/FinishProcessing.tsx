// src/pages/Operacional/Processamentos/FinishProcessing.tsx
// -----------------------------------------------------------------------------
// Tela dedicada "Finalizar Processamento" (`finish`) — TASK-FE-039-PROC-03,
// REWORK de fidelidade (039, PROC-04/06/07/08/11). Rota
// `/operacional/processamentos/:uuid/finalizar`, gate `processing_create`
// (transição de ESCRITA, nunca `_view` — mirror `FinishMovementSale.tsx`).
//
// REWORK — supersede a decisão FD3 original ("SEM pré-preenchimento"): o
// `finish` continua o MESMO endpoint/payload, mas `animals[]` agora abre
// PRÉ-POPULADO via `GET .../prepare` (PROC-04), fechando o bug de
// duplicação #2 (`animal_uuid` ausente fazia o `finish` sempre CRIAR um
// Animal novo). Ordem de hidratação fixa: guard de status → prompt de
// rascunho (PROC-06) → se aceito, `reset(draft)` e `prepare` fica desativado
// (não sobrescreve); se recusado/inexistente, `prepare` hidrata
// normalmente, guardado por Lei 2 (`dirtyFields`).
//
// DEC-139 (decisão do dono, pós-planejamento) — a composição do repeater de
// animais deixou de ser plano: `ProcessingAnimalsSection` agora é um WIZARD
// 1-animal-por-vez (Próximo/Voltar, mirror do card-por-vez do legado). O
// CONTRATO DE DADOS não muda (mesmo `useFieldArray`/payload).
//
// PROC-07 — `ProcessingSummaryPanel` (resumos por categoria/lote + progresso
// textual) fica SEMPRE visível acima do wizard, nunca escondido por passo.
// PROC-11 — botão "Importar planilha" (Compra-only, `PENDING`) no header da
// casca (`headerActions`), abre `ProcessingImportModal`.
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useRef, useState } from 'react';

import { Box, SimpleGrid, Text, useDisclosure } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm, UseFieldArrayRemove } from 'react-hook-form';
import { FiUpload } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useFormDraftAutosave } from '@/hooks/useFormDraftAutosave';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { processingStatus } from '@/constants/processamentos/processing/processing-status';
import { queryKey } from '@/constants/query-key';

import { processingFinishSchemaResolver } from '@/validations/schemas/Processamentos/processing-schema';

import {
  finishProcessing,
  getProcessingByUuid,
  getProcessingPrepare,
} from '@/services/v2/Processamentos/processing-service';

import type { Option } from '@/@types/option';
import type {
  FinishProcessingForm,
  FinishProcessingRequest,
  ProcessingAnimalForm,
  ProcessingDetail,
  ProcessingPrepareData,
  ProcessingPrepareOption,
} from '@/@types/v2/Processamentos/processing';

import { ProcessingAnimalsSection } from './ProcessingAnimalsSection';
import { ProcessingImportModal } from './ProcessingImportModal';
import { isMovementPurchaseOrigin } from './processingOrigin';
import { emptySanitaryItem, ProcessingSanitarySection } from './ProcessingSanitarySection';
import { ProcessingSummaryPanel } from './ProcessingSummaryPanel';

const PROCESSAMENTOS_LIST_ROUTE = '/operacional/processamentos';

const emptyDefaultValues: FinishProcessingForm = {
  date: null,
  is_stock: false,
  arroba_value: null,
  sanitary: false,
  sanitary_items: [],
  animals: [],
};

function mapPrepareOption(option: ProcessingPrepareOption | null): Option<string> | null {
  return option ? { label: option.label, value: option.uuid } : null;
}

function buildFinishProcessingPayload(formValues: FinishProcessingForm): FinishProcessingRequest {
  return {
    date: formValues.date!,
    // Boolean REAL, nunca string — mirror do fix documentado no próprio
    // backend (`Rule::requiredIf` com `$this->boolean()`), item de alto
    // risco p/ E2E do task-packet.
    is_stock: !!formValues.is_stock,
    ...(formValues.is_stock ? { arroba_value: formValues.arroba_value ?? undefined } : {}),
    // Onda 1 (PROCFID-01) — flag; Onda 2 (PROCFID-04) — `sanitary_items[]` abaixo.
    sanitary: !!formValues.sanitary,
    sanitary_items: formValues.sanitary
      ? formValues.sanitary_items.map((item) => ({
          product_uuid: item.product_uuid!.value,
          warehouse_uuid: item.warehouse_uuid!.value,
          measurement_uuid: item.measurement_uuid!.value,
          quantity: item.quantity!,
          ...(item.observation ? { observation: item.observation } : {}),
        }))
      : [],
    animals: formValues.animals.map((animal) => ({
      // round-5 — `is_reproductive` é campo de UI do RHF; como este map
      // monta o item chave por chave (sem spread), ele NUNCA vaza para o
      // payload — intencional, não esquecimento.
      ...(animal.animal_uuid ? { animal_uuid: animal.animal_uuid } : {}),
      category_uuid: animal.category_uuid!.value,
      breed_uuid: animal.breed_uuid!.value,
      batch_uuid: animal.batch_uuid!.value,
      weight: animal.weight!,
      value: animal.value!,
      // PROC-R3-02 (Rota B) — Optional real no servidor.
      ...(animal.category_matrice_uuid
        ? { category_matrice_uuid: animal.category_matrice_uuid.value }
        : {}),
      // Onda 1 (PROCFID-02) — Optional real: omitidos quando não preenchidos.
      ...(animal.birth_date ? { birth_date: animal.birth_date } : {}),
      ...(animal.has_ultrasound
        ? {
            has_ultrasound: true,
            ...(animal.aol != null ? { aol: animal.aol } : {}),
            ...(animal.egs != null ? { egs: animal.egs } : {}),
            ...(animal.marm != null ? { marm: animal.marm } : {}),
            ...(animal.classification ? { classification: animal.classification } : {}),
          }
        : {}),
      identifications: animal.identifications.map((identification) => ({
        id_animal_uuid: identification.id_animal_uuid!.value,
        identification: identification.identification,
      })),
    })),
  };
}

export default function FinishProcessing() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.processamentos.processing;
  const formText = text.form;
  const summaryText = formText.summary;
  const draftText = formText.draft;

  useEffect(() => {
    if (!isValidGuid(uuid)) {
      navigate(PROCESSAMENTOS_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const [detail, setDetail] = useState<ProcessingDetail | undefined>(undefined);

  const {
    control,
    handleSubmit,
    watch,
    getValues,
    setValue,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<FinishProcessingForm>({
    mode: 'onChange',
    resolver: processingFinishSchemaResolver(languageGB) as any,
    defaultValues: emptyDefaultValues,
  });

  // Lei 2 — função NOMEADA. Alimenta só o resumo read-only do topo/guard de
  // status — a hidratação de `animals[]` é responsabilidade separada do
  // `prepare` (abaixo), nunca misturada neste `fillForm`.
  function fillForm(data: ProcessingDetail) {
    setDetail(data);
  }

  const processingQuery = useCustomFormQueryByGuid<ProcessingDetail>({
    registrationId: isValidGuid(uuid) ? uuid : undefined,
    asyncFunction: getProcessingByUuid,
    fillForm,
    queryKey: queryKey.processamentos.processing,
  });

  const isLoading = checkLoadingStatus([processingQuery as any]);

  const canFinish = can('processing_create') && detail?.status === processingStatus.pending;
  const isDisabledField = !canFinish || isLoading;

  const animalsArray = useFieldArray({ control, name: 'animals' });

  // Onda 2 (PROCFID-04) — bloco "Item Sanitário", header-level (não por
  // animal), condicionado a `watch('sanitary')===true` abaixo.
  const sanitaryItemsArray = useFieldArray({ control, name: 'sanitary_items' });

  // PROC-04 — `category_locked` por índice (badge informativo), sincronizado
  // com `animalsArray` via os wrappers abaixo (append/remove) para nunca
  // dessincronizar do array real de animais.
  const [categoryLockedByIndex, setCategoryLockedByIndex] = useState<boolean[]>([]);

  // PROCFID-02 (§3.5) — "Último Peso" por índice, MESMO padrão de
  // `categoryLockedByIndex`: NUNCA via RHF, NUNCA reenviado no payload — só
  // leitura, hidratado do `prepare` (`last_weight`/`last_weight_date`).
  const [lastWeighingByIndex, setLastWeighingByIndex] = useState<
    { weight: number | null; date: string | null }[]
  >([]);

  const removeAnimalRow: UseFieldArrayRemove = (index) => {
    animalsArray.remove(index);
    setCategoryLockedByIndex((prev) => {
      if (index === undefined) return [];
      const indexes = Array.isArray(index) ? index : [index];
      return prev.filter((_, itemIndex) => !indexes.includes(itemIndex));
    });
    setLastWeighingByIndex((prev) => {
      if (index === undefined) return [];
      const indexes = Array.isArray(index) ? index : [index];
      return prev.filter((_, itemIndex) => !indexes.includes(itemIndex));
    });
  };

  // ---- PROC-06 — Autosave + recuperação de rascunho ------------------------
  const draftStorageKey = uuid ? `processing-draft:${uuid}` : '';
  const draftAcceptedRef = useRef(false);
  const draftPromptShownRef = useRef(false);
  const [draftPromptOpen, setDraftPromptOpen] = useState(false);
  const [draftResolved, setDraftResolved] = useState(false);

  const { hasDraft, draftTimestamp, restoreDraft, discardDraft } =
    useFormDraftAutosave<FinishProcessingForm>({
      storageKey: draftStorageKey,
      watch,
      getValues,
      reset,
      enabled: canFinish,
      // Hidratação do `prepare` (`animalsArray.replace()`) dispara o
      // `watch()` do autosave sem marcar `dirtyFields` — sem este guard, um
      // rascunho "fantasma" era recriado sozinho segundos após "Descartar"
      // (TASK-FE-039-PROCFID-01 §3.7, achado real via teste de regressão).
      // `isEmpty()` deste repositório é INVERTIDA (retorna `true` quando HÁ
      // chaves, ver `src/utils/isEmpty.ts`) — `isEmpty(dirtyFields)===true`
      // já significa "há edição do usuário", SEM negação.
      isDirty: isEmpty(dirtyFields),
    });

  // Ordem fixa (PROC-04 §Riscos): guard de status já resolvido (`canFinish`)
  // → prompt de rascunho PRIMEIRO → só então o `prepare` fica liberado.
  useEffect(() => {
    if (draftPromptShownRef.current || !canFinish) return;
    draftPromptShownRef.current = true;
    if (hasDraft) {
      setDraftPromptOpen(true);
    } else {
      setDraftResolved(true);
    }
  }, [canFinish, hasDraft]);

  function handleAcceptDraft() {
    restoreDraft();
    draftAcceptedRef.current = true;
    setDraftPromptOpen(false);
    setDraftResolved(true);

    // D-02.2 (round-4, PROC-R4-02) — rascunho salvo ANTES desta correção
    // pode conter o sentinela "Sem lote" (`value: '0'`) em `batch_uuid`,
    // que reproduziria o 422 de `required|uuid` mesmo com o select já
    // corrigido. Anula para o campo voltar a pedir escolha visivelmente.
    getValues('animals').forEach((animal, index) => {
      if (animal.batch_uuid?.value === '0') {
        setValue(`animals.${index}.batch_uuid`, null, { shouldDirty: true });
      }
    });
  }

  function handleDiscardDraft() {
    discardDraft();
    setDraftPromptOpen(false);
    setDraftResolved(true);
  }

  // ---- PROC-04 — Hidratação via `prepare` -----------------------------------
  // `useQuery` orquestrado (decisão do Executor, `get_pwa_form_query_pattern`
  // permite esta variante quando o guard de Lei 2 precisa ser condicional —
  // `useCustomFormQueryByGuid` força `resetForce=true` sempre, o que
  // destruiria a guarda de edição concorrente exigida pelo DoD desta Tarefa).
  const shouldFetchPrepare = draftResolved && !draftAcceptedRef.current && canFinish;

  const prepareQuery = useQuery({
    queryKey: [queryKey.processamentos.processingPrepare, uuid],
    queryFn: async () => {
      const response = await getProcessingPrepare(uuid!);
      return response.data;
    },
    enabled: shouldFetchPrepare && isValidGuid(uuid),
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Lei 2 — função NOMEADA com guarda de `dirtyFields` (`isEmpty()` deste
  // repositório é INVERTIDA: retorna `true` quando HÁ chaves — ver
  // `src/utils/isEmpty.ts`. `isEmpty(dirtyFields)===true` ⇒ o usuário JÁ
  // editou algo ⇒ a hidratação NÃO sobrescreve).
  function fillAnimalsFromPrepare(data: ProcessingPrepareData) {
    if (isEmpty(dirtyFields)) return;

    const mapped: ProcessingAnimalForm[] = data.animals.map((item) => ({
      animal_uuid: item.animal_uuid ?? null,
      category_uuid: mapPrepareOption(item.category),
      breed_uuid: mapPrepareOption(item.breed),
      // Sempre vazio — nenhuma origem prefila lote, mirror exato do legado.
      batch_uuid: null,
      weight: item.weight,
      value: item.value,
      // round-5 — vem do `category` do `prepare`; é ESTE ponto que fecha o
      // defeito da categoria travada (o `onChange` do select nunca dispara
      // quando `category_locked===true`).
      is_reproductive: item.category?.is_reproductive ?? false,
      // PROC-R3-02 (Rota B) — hidratação do `prepare` (mesmo par
      // `{uuid,label}` de `category`/`breed`/`specie`); null → vazio.
      category_matrice_uuid: mapPrepareOption(item.category_matrice),
      // PROCFID-02 (§3.2) — sugestão inicial do `prepare` (Optional, editável).
      birth_date: item.birth_date,
      has_ultrasound: false,
      aol: null,
      egs: null,
      marm: null,
      classification: null,
      identifications:
        item.identifications.length > 0
          ? item.identifications.map((identification) => ({
              id_animal_uuid: mapPrepareOption(identification.id_animal),
              identification: identification.identification,
            }))
          : [{ id_animal_uuid: null, identification: '' }],
    }));

    animalsArray.replace(mapped);
    setCategoryLockedByIndex(data.animals.map((item) => item.category_locked));
    setLastWeighingByIndex(
      data.animals.map((item) => ({ weight: item.last_weight, date: item.last_weight_date }))
    );
  }

  useEffect(() => {
    if (prepareQuery.isSuccess && prepareQuery.data) {
      fillAnimalsFromPrepare(prepareQuery.data);
    }
  }, [prepareQuery.isSuccess, prepareQuery.data]);

  useEffect(() => {
    if (prepareQuery.isError) {
      // Falha do `prepare` (404/500) — NÃO trava a tela: degrada para o
      // comportamento manual (repeater abre vazio), nunca pior que a fatia
      // já commitada.
      toaster.create({
        type: 'warning',
        title: formText.title.finish,
        description: formText.prepareErrorToast,
      });
    }
  }, [prepareQuery.isError]);

  // ---- PROC-07 — Resumos ao vivo --------------------------------------------
  const watchedAnimals = watch('animals');

  const watchedIsStock = watch('is_stock');
  const watchedSanitary = watch('sanitary');
  const booleanOptions: Option<boolean>[] = [
    { label: languageGB.defaltStrings.yes, value: true },
    { label: languageGB.defaltStrings.no, value: false },
  ];

  const hasUnsavedChanges = !isEmpty(dirtyFields);
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);
  const unsavedChangesText = formText.unsavedChangesDialog;

  const finishMutation = useRequest<ProcessingDetail>({
    asyncFunction: async ({
      uuid: id,
      payload,
    }: {
      uuid: string;
      payload: FinishProcessingRequest;
    }) => finishProcessing(id, payload),
    queryKey: queryKey.processamentos.processings,
    queryKey2: queryKey.processamentos.processing,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.finishedToast,
    actionSuccess: () => {
      discardDraft();
      navigate(`${PROCESSAMENTOS_LIST_ROUTE}/${uuid}`);
    },
  });

  function onSubmit(formValues: FinishProcessingForm) {
    if (!uuid) return;
    finishMutation.mutate({ uuid, payload: buildFinishProcessingPayload(formValues) });
  }

  function onInvalid() {
    toaster.error({
      title: formText.title.finish,
      description: formText.invalidFieldsToast,
      duration: 6000,
    });
  }

  // ---- PROC-11 — Import de planilha (Compra-only) ---------------------------
  // `detail.type` = FQCN do morph (`App\Models\X`; legado `App\X`) — normalizado por `isMovementPurchaseOrigin`.
  // NUNCA `type_label` (rótulo PT-BR). PROC-11 e PROC-08 dependem dele.
  const { open: isImportOpen, onOpen: onOpenImport, onClose: onCloseImport } = useDisclosure();
  const canImportSpreadsheet =
    isMovementPurchaseOrigin(detail?.type) && detail?.status === processingStatus.pending;

  function handleImported() {
    discardDraft();
    onCloseImport();
    navigate(`${PROCESSAMENTOS_LIST_ROUTE}/${uuid}`);
  }

  if (!isValidGuid(uuid)) {
    return null;
  }

  // Guard visual (§3.4) — ANTES de qualquer campo: 404 real (outra
  // fazenda/uuid inexistente) OU status já diferente de PENDING.
  const showGuard =
    !isLoading &&
    ((processingQuery as any).isError || (detail && detail.status !== processingStatus.pending));

  if (showGuard) {
    return (
      <FormContainer title={formText.title.finish}>
        <Text color="fg.error">{formText.guard.notPendingDescription}</Text>
        <Box mt={4}>
          <Button
            title={formText.guard.backButton}
            variant="outline"
            onClick={() => navigate(PROCESSAMENTOS_LIST_ROUTE)}
          />
        </Box>
      </FormContainer>
    );
  }

  return (
    <>
      <FormContainer
        title={formText.title.finish}
        headerActions={
          canImportSpreadsheet ? (
            <Button
              title={formText.importModal.button}
              variant="outline"
              type="button"
              icon={FiUpload as ElementType}
              onClick={onOpenImport}
              disabled={isDisabledField}
            />
          ) : undefined
        }
        footer={
          <>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="secondary"
              type="button"
              onClick={() => guardedNavigate(-1)}
              disabled={finishMutation.isPending}
            />
            <Button
              title={languageGB.defaltStrings.save}
              type="button"
              onClick={handleSubmit(onSubmit, onInvalid)}
              loading={finishMutation.isPending}
              disabled={finishMutation.isPending || isDisabledField}
            />
          </>
        }
      >
        <Form id="processing-finish-form" noPadding onSubmit={handleSubmit(onSubmit, onInvalid)}>
          {/* ---- Cabeçalho em faixa única, fiel ao Blade legado
               (`_forms.blade.php:7-27`): Código→Data→Tipo→Fazer Sanitário→
               Movimentação ABC Corte→Preço do @ (PROCFID-01, §3.4). ---- */}
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            <InputReadOnly label={summaryText.code} value={detail?.code ?? '—'} />

            <Controller
              name="date"
              control={control}
              render={({ field, fieldState }) => (
                <Field
                  label={formText.fields.header.date}
                  isRequired
                  errorText={fieldState.error?.message}
                >
                  <DateInput
                    value={field.value ?? null}
                    onChange={field.onChange}
                    disabled={isDisabledField}
                  />
                </Field>
              )}
            />

            <InputReadOnly label={summaryText.type} value={detail?.type_label ?? '—'} />

            <Controller
              name="sanitary"
              control={control}
              render={({ field }) => (
                <Select
                  label={formText.fields.header.sanitary}
                  name={field.name}
                  value={booleanOptions.find((option) => option.value === !!field.value) ?? null}
                  onChange={(option: Option<boolean> | null) => {
                    const nextValue = !!option?.value;
                    field.onChange(nextValue);
                    if (!nextValue) {
                      // Ao desligar, zera o bloco sanitário — mirror exato
                      // do gesto já usado para `arroba_value` ao desligar
                      // `is_stock` (§3.4/§4.5 do roteiro).
                      setValue('sanitary_items', [], { shouldDirty: true });
                    } else if (getValues('sanitary_items').length === 0) {
                      // Smoke DoD: ligar `sanitary=true` abre com 1 linha
                      // vazia (mirror `handleAdd` de `CreateBaixaEstoque.tsx`).
                      sanitaryItemsArray.append(emptySanitaryItem);
                    }
                  }}
                  options={booleanOptions}
                  isRequired
                  isDisabled={isDisabledField}
                  noClearable
                />
              )}
            />

            <Controller
              name="is_stock"
              control={control}
              render={({ field }) => (
                <Select
                  label={formText.fields.header.isStock}
                  name={field.name}
                  value={booleanOptions.find((option) => option.value === !!field.value) ?? null}
                  onChange={(option: Option<boolean> | null) => {
                    const nextValue = !!option?.value;
                    field.onChange(nextValue);
                    // Ao desligar, limpa `arroba_value` — evita dado órfão
                    // no payload (mirror `has_financial` em
                    // `FinishMovementSale.tsx:380-391`).
                    if (!nextValue) {
                      setValue('arroba_value', null, { shouldDirty: true });
                    }
                  }}
                  options={booleanOptions}
                  isRequired
                  isDisabled={isDisabledField}
                  noClearable
                />
              )}
            />

            {watchedIsStock && (
              <Controller
                name="arroba_value"
                control={control}
                render={({ field, fieldState }) => (
                  <MoneyInput
                    name={field.name}
                    label={formText.fields.header.arrobaValue}
                    value={field.value ?? null}
                    onValueChange={(nextValue) => field.onChange(nextValue)}
                    error={fieldState.error?.message}
                    isRequired
                    disabled={isDisabledField}
                  />
                )}
              />
            )}
          </SimpleGrid>

          {/* ---- Onda 2 (PROCFID-04) — bloco "Item Sanitário", header-level,
               logo após o cabeçalho e ANTES do wizard de animais (mirror
               `_forms.blade.php:45-72`, `sanitary-div`). ---- */}
          {watchedSanitary && (
            <Box mt={8}>
              <ProcessingSanitarySection
                control={control}
                fields={sanitaryItemsArray.fields}
                append={sanitaryItemsArray.append}
                remove={sanitaryItemsArray.remove}
                disabled={isDisabledField}
                animalsCount={watchedAnimals?.length ?? 0}
                languageGB={languageGB}
              />
            </Box>
          )}

          {/* ---- PROC-07 — Resumos ao vivo (sempre visível, DEC-139) ---- */}
          <Box mt={8}>
            <ProcessingSummaryPanel animals={watchedAnimals ?? []} languageGB={languageGB} />
          </Box>

          {/* ---- Wizard `animals[]` (DEC-139) ---- */}
          <Box mt={8}>
            <ProcessingAnimalsSection
              control={control}
              setValue={setValue}
              getValues={getValues}
              errors={errors}
              fields={animalsArray.fields}
              remove={removeAnimalRow}
              disabled={isDisabledField}
              languageGB={languageGB}
              categoryLockedByIndex={categoryLockedByIndex}
              lastWeighingByIndex={lastWeighingByIndex}
              originType={detail?.type}
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
        title={unsavedChangesText.title}
        description={unsavedChangesText.description}
        confirmButtonText={unsavedChangesText.confirmButton}
        hideQuestionMark
        warningText=""
      />

      {/* PROC-06 — prompt de recuperação de rascunho (tone info, não é exclusão). */}
      <DeleteConfirmDialog
        isOpen={draftPromptOpen}
        onClose={handleDiscardDraft}
        onConfirm={handleAcceptDraft}
        tone="info"
        colorPalette="blue"
        title={draftText.title}
        description={
          draftTimestamp
            ? draftText.descriptionTemplate.replace(
                '{timestamp}',
                formatDate(draftTimestamp, 'dd/MM/yyyy HH:mm')
              )
            : draftText.description
        }
        confirmButtonText={draftText.confirmButton}
        cancelButtonText={draftText.discardButton}
        hideQuestionMark
        warningText=""
      />

      {/* PROC-11 — import de planilha (Compra-only). */}
      {uuid && (
        <ProcessingImportModal
          isOpen={isImportOpen}
          onClose={onCloseImport}
          uuid={uuid}
          onImported={handleImported}
        />
      )}
    </>
  );
}
