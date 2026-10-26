// src/pages/Operacional/Reproducao/Acasalamento/DiagnosticoGestacao/CreateDiagnosticoGestacao.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO do Diagnóstico de Gestação — `pd-screen-create`/`pd-form-main`
// (PregnancyDiagnosis, F-016, 97-Esteiras/001, TASK-BM-FE-08, contrato de
// tela §6.6). Rota ANINHADA
// `/operacional/acasalamento/:breedingMatingUuid/diagnostico-gestacao/novo`
// (wiring de rota é da TASK-BM-FE-09 — este arquivo só declara o nome do
// param esperado, `breedingMatingUuid`, igual ao resto da sub-árvore).
//
// Casca `FormContainer` + `footer` opt-in (`Cancelar` + `ButtonSaveAndNext`),
// `<Form id="diagnostico-gestacao-form">` + `<Button type="submit"
// form="diagnostico-gestacao-form">` no rodapé — mirror EXATO
// `CreateOrUpdateAcasalamento.tsx` (ADR-FE-BM-00, get_pwa_form_query_pattern).
// **Não existe `ContainerGrid`/`Tabs.*` aqui.**
//
// Título condicional (regra 3 da Tarefa): `follow_up === true` →
// "… - Acompanhamento", senão o título padrão.
//
// Três blocos, na ordem do legado: cabeçalho (`Código`/`Data`/`Funcionário
// Responsável`) → `BreedingMatingReadonlyBlock` (bloco `Acasalamento`) →
// `BatchFillSection` (preenchimento em lote, client-side) → lista de
// `AnimalDiagnosisCard` (`useFieldArray`).
//
// `availableAnimals` (regra 6/8) é DERIVADO dos animais já usados nos cards
// atuais — nenhum estado extra de "devolução ao lote" é necessário: ao
// remover um card, o animal reaparece no `SelectMulti` do `BatchFillSection`
// porque ele deixa de estar em `fields`.
//
// `BatchTransferDialog` é REUSADO integralmente da Tarefa 05 (regra 12),
// recebendo tudo por prop — nenhuma busca própria de dado.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, Skeleton, SimpleGrid, Text } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { pregnancyDiagnosisSchemaResolver } from '@/validations/schemas/BreedingMating/pregnancy-diagnosis-schema';

import { createPregnancyDiagnosis } from '@/services/v2/BreedingMating/pregnancy-diagnosis-service';

import type { Option } from '@/@types/option';
import type {
  PregnancyDiagnosisAnimalCardFormValue,
  PregnancyDiagnosisBatchFillFormValue,
  PregnancyDiagnosisCascadeRules,
  PregnancyDiagnosisData,
  PregnancyDiagnosisForm as PregnancyDiagnosisFormType,
} from '@/@types/v2/BreedingMating/pregnancyDiagnosis';

import { AnimalDiagnosisCard } from './AnimalDiagnosisCard';
import { BatchFillSection } from './BatchFillSection';
import { BreedingMatingReadonlyBlock } from './BreedingMatingReadonlyBlock';
import {
  buildAnimalCardFromBatchFill,
  buildDefaultDiagnosticoGestacaoFormValues,
  mapFormValuesToCreatePayload,
  mapServerFieldToFormField,
} from './diagnostico-gestacao-form-mapper';
import { usePregnancyDiagnosisCreateContext } from './useDiagnosticosGestacao';

import { BatchTransferDialog, useTransferBatchOptions } from '../BatchTransferDialog';

const ACASALAMENTO_LIST_ROUTE = '/operacional/acasalamento';

const EMPTY_CASCADE_RULES: PregnancyDiagnosisCascadeRules = {
  pregnant_diagnosis_pregnancy_uuids: [],
  resync_eligible_diagnosis_pregnancy_uuids: [],
};

export default function CreateDiagnosticoGestacao() {
  const { breedingMatingUuid } = useParams<{ breedingMatingUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();

  const text = languageGB.breedingMatings.pregnancyDiagnosis;
  const formText = text.form;

  const PD_LIST_ROUTE = `/operacional/acasalamento/${breedingMatingUuid}/diagnostico-gestacao`;

  // Guard de navegação — o uuid do Acasalamento pai é SEMPRE obrigatório
  // nesta rota aninhada (mirror `DiagnosticoGestacaoDetalhe.tsx`).
  const hasValidRouteParam = isValidGuid(breedingMatingUuid ?? null);
  const hasMalformedRouteParam = !hasValidRouteParam;

  useEffect(() => {
    if (hasMalformedRouteParam) {
      navigate(ACASALAMENTO_LIST_ROUTE, { replace: true });
    }
  }, [hasMalformedRouteParam, navigate]);

  const canSave = can('pregnancy-diagnosis_create');

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { dirtyFields, errors },
  } = useForm<PregnancyDiagnosisFormType>({
    mode: 'onChange',
    resolver: pregnancyDiagnosisSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: buildDefaultDiagnosticoGestacaoFormValues(),
  });

  // ---- Guarda de saída sem salvar (contrato de tela §6.7) -----------------
  const hasUnsavedChanges = !isEmpty(dirtyFields);
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);

  // ---- "Funcionário Responsável" — sempre o usuário autenticado local
  // (não existe modo edição nesta sub-árvore). --------------------------
  const [responsibleName, setResponsibleName] = useState<string>(authUser?.username ?? '—');

  useEffect(() => {
    setResponsibleName(authUser?.username ?? '—');
  }, [authUser?.username]);

  // ---- Contexto de criação (`EP-PD-02`) -----------------------------------
  const contextQuery = usePregnancyDiagnosisCreateContext(
    hasValidRouteParam ? breedingMatingUuid : undefined
  );
  const context = contextQuery.data;
  const isLoading = checkLoadingStatus([contextQuery]);

  useEffect(() => {
    if (context?.next_code) {
      setValue('code', context.next_code, { shouldDirty: false });
    }
  }, [context?.next_code]);

  const followUp = context?.follow_up ?? false;
  const resyncFieldVisible = context?.batch_fill_enabled.resync ?? false;
  const cascadeRules = context?.cascade_rules ?? EMPTY_CASCADE_RULES;

  const headerDate = watch('date');

  // ---- Linhas dinâmicas — `useFieldArray` vive no PAI (mirror
  // `CreateOrUpdateAcasalamento.tsx`); os cards só renderizam. ------------
  const { fields, append, remove } = useFieldArray({ control, name: 'animals' });

  // Animais disponíveis no `SelectMulti` do lote — exclui os já usados em
  // cards existentes; ao remover um card, o animal reaparece aqui por
  // construção (regra 6/8 da Tarefa — "devolve o animal ao SelectMulti").
  const usedAnimalUuids = new Set(
    fields
      .map((_, idx) => watch(`animals.${idx}.animal`)?.value)
      .filter((uuid): uuid is string => !!uuid)
  );
  const availableAnimals = (context?.eligible_animals ?? []).filter(
    (animal) => !usedAnimalUuids.has(animal.uuid)
  );

  function handleApplyBatchFill(values: PregnancyDiagnosisBatchFillFormValue) {
    const newCards: PregnancyDiagnosisAnimalCardFormValue[] = values.animals.map((animal) =>
      buildAnimalCardFromBatchFill(animal, values)
    );
    append(newCards);
  }

  // ---- Remoção de card — confirma "Tem certeza?" (regra 8 da Tarefa) -----
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null);

  function handleConfirmRemove() {
    if (pendingRemoveIndex !== null) {
      remove(pendingRemoveIndex);
      setPendingRemoveIndex(null);
    }
  }

  // ---- `BatchTransferDialog` reusado (Tarefa 05) — botão `+` do card
  // (regra 12 da Tarefa). Lotes de destino vêm de `EP-BM-13`, escopados
  // pelo `breeding_batch` do Acasalamento pai (bloco readonly). -----------
  const breedingBatchUuid = context?.breeding_mating.breeding_batch?.uuid;
  const transferBatchOptionsQuery = useTransferBatchOptions(breedingBatchUuid);
  const transferBatchOptions = transferBatchOptionsQuery.data ?? [];

  const [isBatchTransferOpen, setIsBatchTransferOpen] = useState(false);
  const [batchTransferAnimals, setBatchTransferAnimals] = useState<
    { uuid: string; code: string }[]
  >([]);

  function handleRequestBatchTransfer(animal: Option<string>) {
    setBatchTransferAnimals([{ uuid: animal.value, code: animal.label }]);
    setIsBatchTransferOpen(true);
  }

  // Fluxo 2 (botão `+` por card) — só invalida o lookup, NÃO autoatribui o
  // lote escolhido ao campo da linha (GAP-FE-BM-03 §3/CLM-023, defeito
  // preservado por decisão do dono, mirror `ProtocolRow`).
  function handleBatchTransferSuccess() {
    // invalidação já feita dentro do próprio `BatchTransferDialog`.
  }

  // 422 do servidor mapeado por campo (get_pwa_form_query_pattern —
  // MANDATORY).
  async function tryPersistDiagnosticoGestacao(data: PregnancyDiagnosisFormType) {
    try {
      const payload = mapFormValuesToCreatePayload(data);
      return await createPregnancyDiagnosis(breedingMatingUuid!, payload);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          const mappedField = mapServerFieldToFormField(field);
          if (mappedField && messages?.[0]) {
            setError(mappedField as any, { type: 'server', message: messages[0] });
          }
        });
      }
      throw error;
    }
  }

  // ---- Mutação (`EP-PD-03`) — invalida as TRÊS queries (regra 14 da
  // Tarefa): listagem de DG, detalhe do Acasalamento pai e listagem de
  // Acasalamento (o clone de ressincronização precisa aparecer sem reload,
  // `bm-effect-resync-clone`). --------------------------------------------
  const pregnancyDiagnosisMutation = useRequest<PregnancyDiagnosisData>({
    asyncFunction: tryPersistDiagnosticoGestacao,
    entityName: text.singularLabel,
    queryKey: queryKey.breedingMatings.pregnancyDiagnosesList,
    queryKey2: queryKey.breedingMatings.breedingMating,
    queryKey3: queryKey.breedingMatings.breedingMatingsList,
    typesRequest: 'create',
    actionSuccess: () => {
      navigate(PD_LIST_ROUTE);
    },
  });

  const isSubmitting = pregnancyDiagnosisMutation.isPending;
  const fieldsDisabled = !canSave || isLoading || isSubmitting;

  function handleValidSubmit(data: PregnancyDiagnosisFormType) {
    void pregnancyDiagnosisMutation.mutateAsync(data);
  }

  // Mirror `CreateOrUpdateAcasalamento.tsx` (GAP-FE-BM-07/TASK-BM-FE-12) —
  // sem `onInvalid`, o clique em Salvar não dava NENHUM feedback quando a
  // validação falhava.
  function onInvalid() {
    toaster.create({
      title: text.singularLabel,
      description: formText.errors.invalidFields,
      type: 'error',
    });
  }

  const animalsArrayErrorMessage = (errors.animals as { message?: string } | undefined)?.message;

  if (hasMalformedRouteParam) {
    return null;
  }

  return (
    <>
      <FormContainer
        title={followUp ? formText.titleFollowUp : formText.title}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="secondary"
              type="button"
              onClick={() => guardedNavigate(-1)}
              disabled={isSubmitting}
            />
            {canSave && (
              <ButtonSaveAndNext
                type="submit"
                form="diagnostico-gestacao-form"
                create
                dirtyFields={dirtyFields}
                languageGB={languageGB}
                loading={isSubmitting}
                disabled={isSubmitting || isLoading}
              />
            )}
          </>
        }
      >
        <Form
          id="diagnostico-gestacao-form"
          onSubmit={handleSubmit(handleValidSubmit, onInvalid)}
          noPadding
        >
          <Skeleton loading={isLoading}>
            <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
              <InputReadOnly name="code" label={formText.fields.code} value={watch('code')} />

              <Controller
                name="date"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <DateInput
                    label={formText.fields.date}
                    value={field.value ?? null}
                    onChange={(value) => field.onChange(value ?? '')}
                    isRequired
                    disabled={fieldsDisabled}
                    error={error?.message}
                  />
                )}
              />

              <InputReadOnly
                name="responsible_name"
                label={formText.fields.responsible}
                value={responsibleName}
              />
            </SimpleGrid>
          </Skeleton>

          <BreedingMatingReadonlyBlock
            block={context?.breeding_mating}
            loading={isLoading}
            languageGB={languageGB}
          />

          <BatchFillSection
            availableAnimals={availableAnimals}
            isLoadingAnimals={isLoading}
            providerOptions={context?.lookups.providers ?? []}
            techniqueOptions={context?.lookups.diagnostic_techniques ?? []}
            diagnosisOptions={context?.lookups.diagnoses ?? []}
            batchOptions={context?.lookups.batches ?? []}
            resyncFieldVisible={resyncFieldVisible}
            disabled={fieldsDisabled}
            languageGB={languageGB}
            onApply={handleApplyBatchFill}
          />

          <Box mt={6}>
            {fields.length === 0 ? (
              <Box py={2}>
                <Text fontSize="sm" color={animalsArrayErrorMessage ? 'fg.error' : 'fg.muted'}>
                  {animalsArrayErrorMessage ?? formText.validation.animalsMinRequired}
                </Text>
              </Box>
            ) : (
              <Flex direction="column" gap={4}>
                {fields.map((field, index) => (
                  <AnimalDiagnosisCard
                    key={field.id}
                    index={index}
                    control={control}
                    setValue={setValue}
                    languageGB={languageGB}
                    disabled={fieldsDisabled}
                    headerDate={headerDate}
                    lastProtocolDate={context?.last_protocol_date ?? null}
                    cascadeRules={cascadeRules}
                    resyncFieldVisible={resyncFieldVisible}
                    followUp={followUp}
                    inseminatorOptions={context?.lookups.providers ?? []}
                    techniqueOptions={context?.lookups.diagnostic_techniques ?? []}
                    diagnosisOptions={context?.lookups.diagnoses ?? []}
                    batchOptions={context?.lookups.batches ?? []}
                    bullOptions={context?.lookups.bulls ?? []}
                    onRequestBatchTransfer={handleRequestBatchTransfer}
                    onRemove={() => setPendingRemoveIndex(index)}
                  />
                ))}
              </Flex>
            )}
          </Box>
        </Form>
      </FormContainer>

      <BatchTransferDialog
        isOpen={isBatchTransferOpen}
        onClose={() => setIsBatchTransferOpen(false)}
        animals={batchTransferAnimals}
        batchOptions={transferBatchOptions}
        isLoadingBatchOptions={transferBatchOptionsQuery.isFetching}
        languageGB={languageGB}
        onSuccess={handleBatchTransferSuccess}
      />

      {/* Remoção de card — "Tem certeza?" (regra 8 da Tarefa). */}
      <DeleteConfirmDialog
        isOpen={pendingRemoveIndex !== null}
        onClose={() => setPendingRemoveIndex(null)}
        onConfirm={handleConfirmRemove}
        title={formText.animalCard.removeConfirm}
        hideQuestionMark
      />

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
