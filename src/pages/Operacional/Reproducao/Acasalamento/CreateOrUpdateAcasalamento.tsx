// src/pages/Operacional/Reproducao/Acasalamento/CreateOrUpdateAcasalamento.tsx
// -----------------------------------------------------------------------------
// Casca do formulário ÚNICO de criação/edição de Acasalamento — BreedingMating
// (F-016, 97-Esteiras/001, TASK-BM-FE-04, contrato de tela §2.1/§6.3).
// Rotas `/operacional/acasalamento/novo` e
// `/operacional/acasalamento/:breedingMatingUuid/editar` (wiring da rota é
// da TASK-BM-FE-09 — este arquivo só declara o nome do param esperado,
// `breedingMatingUuid`, para a Tarefa 09 registrar igual).
//
// Casca `FormContainer` + `footer` opt-in (`Cancelar` + `ButtonSaveAndNext`),
// `<Form id="acasalamento-form">` + `<Button type="submit"
// form="acasalamento-form">` no rodapé (ADR-FE-BM-00, get_pwa_form_query_pattern).
// **Esta tela NÃO tem abas** (`Tabs.*` PROIBIDO, ADR-FE-BM-01/GAP-FE-BM-02) —
// as 3 seções (Natural/Protocolo/Simplificado) são renderizadas
// condicionalmente (exatamente uma por vez), materializadas em
// `sections/*.tsx` (TASK-BM-FE-05, contrato de tela §6.3.1/§6.3.2/§6.3.3).
//
// Hidratação pela Lei 2 (`get_pwa_form_query_pattern`): `useCustomFormQueryByGuid`
// com `fillForm` função nomeada e guarda `!isEmpty(dirtyFields) || resetForce`.
//
// `BatchTransferDialog` (`bm-dialog-batch-transfer`, TASK-BM-FE-05, §6.3.5) —
// dois acionadores compartilhando o mesmo diálogo: pré-submit (CLM-017,
// `handleValidSubmit`) e o botão `+` de `ProtocolRow`
// (`handleRequestRowBatchTransfer`, GAP-FE-BM-03 §3/CLM-023 — não
// autoatribui o lote escolhido).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { isAxiosError } from 'axios';
import { useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { breedingMatingLaunchTypeOptions } from '@/constants/breedingMating/options/breeding-mating-launch-type-options';
import { queryKey } from '@/constants/query-key';

import { breedingMatingSchemaResolver } from '@/validations/schemas/BreedingMating/breeding-mating-schema';

import {
  createBreedingMating,
  getBreedingMatingEditContext,
  updateBreedingMating,
} from '@/services/v2/BreedingMating/breeding-mating-service';

import type { Option } from '@/@types/option';
import type {
  AnimalOptionRef,
  BreedingMatingData,
  BreedingMatingForm as BreedingMatingFormType,
  BreedingMatingFormContext,
} from '@/@types/v2/BreedingMating';

import {
  buildDefaultAcasalamentoFormValues,
  mapBreedingMatingDataToFormValues,
  mapFormValuesToCreatePayload,
  mapFormValuesToUpdatePayload,
} from './acasalamento-form-mapper';
import { findSeasonProtocolItems, findSeasonSeedProducts } from './acasalamento-protocol-products';
import { AcasalamentoHeaderFields } from './AcasalamentoHeaderFields';
import { BatchTransferDialog, useTransferBatchOptions } from './BatchTransferDialog';
import { NaturalSection } from './sections/NaturalSection';
import { ProtocolSection } from './sections/ProtocolSection';
import { SimplifiedSection } from './sections/SimplifiedSection';
import {
  useBreedingBatchAnimalsCascade,
  useBreedingMatingCreateContext,
  useBreedingSeasonCascade,
} from './useAcasalamentos';

const ACASALAMENTO_LIST_ROUTE = '/operacional/acasalamento';

// 422 do servidor mapeado por campo (get_pwa_form_query_pattern — "erro-422-
// por-campo", MANDATORY). Os caminhos de `protocol_animals.N.*`/
// `simplified_animals.N.*` são melhor esforço nesta Tarefa (as linhas são
// placeholders; a TASK-BM-FE-05 materializa `useFieldArray` e pode precisar
// ajustar o mapeamento fino por sub-campo).
function mapServerFieldToFormField(field: string): string | null {
  const directMap: Record<string, string> = {
    date: 'date',
    type: 'type',
    launch_type: 'launch_type',
    breeding_season_uuid: 'breeding_season',
    bull_seed_season_uuid: 'bull_seed_season',
    protocol_uuid: 'protocol',
    breeding_batch_uuid: 'breeding_batch',
  };
  if (directMap[field]) return directMap[field];
  if (field === 'natural.bull_uuid') return 'natural.bull';
  if (field === 'natural.cow_uuids') return 'natural.cows';

  const protocolMatch = field.match(/^protocol_animals\.(\d+)\.(\w+)$/);
  if (protocolMatch) return `protocol_animals.${protocolMatch[1]}.${protocolMatch[2]}`;

  const simplifiedMatch = field.match(/^simplified_animals\.(\d+)\.(\w+)$/);
  if (simplifiedMatch) return `simplified_animals.${simplifiedMatch[1]}.${simplifiedMatch[2]}`;

  return null;
}

export default function CreateOrUpdateAcasalamento() {
  const { breedingMatingUuid } = useParams<{ breedingMatingUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();

  const text = languageGB.breedingMatings.breedingMating;
  const formText = text.form;

  // Guard de navegação: uuid malformado redireciona para a listagem ANTES
  // de renderizar o form (mirror `CreateOrUpdateLoteReproducao.tsx`).
  const hasMalformedRouteParam =
    breedingMatingUuid !== undefined && !isValidGuid(breedingMatingUuid);

  useEffect(() => {
    if (hasMalformedRouteParam) {
      navigate(ACASALAMENTO_LIST_ROUTE, { replace: true });
    }
  }, [hasMalformedRouteParam, navigate]);

  const isEditing = isValidGuid(breedingMatingUuid);
  const canSave = isEditing ? can('breeding-matings_edit') : can('breeding-matings_create');

  const defaultValues: BreedingMatingFormType = (() => {
    const base = buildDefaultAcasalamentoFormValues();
    if (!isEditing) {
      return {
        ...base,
        launch_type: breedingMatingLaunchTypeOptions.getOption(1, languageGB),
      };
    }
    return base;
  })();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    trigger,
    watch,
    formState: { dirtyFields, errors },
  } = useForm<BreedingMatingFormType>({
    mode: 'onChange',
    resolver: breedingMatingSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues,
  });

  // ---- Guarda de saída sem salvar ----------------------------------------
  const hasUnsavedChanges = !isEmpty(dirtyFields);
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);

  // ---- "Funcionário Responsável" — SEMPRE read-only. Criação: usuário
  // autenticado local. Edição: `responsible_name` do registro hidratado,
  // sem fallback para o usuário da sessão atual (mirror `LoteReproducao`).
  const [responsibleName, setResponsibleName] = useState<string>('—');

  useEffect(() => {
    if (!isEditing) {
      setResponsibleName(authUser?.username ?? '—');
    }
  }, [isEditing, authUser?.username]);

  // ---- Contexto de CRIAÇÃO (`EP-BM-03`) — `next_code`+`field_matrix`+
  // `locked_fields`+`lookups`. Nunca chamado em edição. -------------------
  const createContextQuery = useBreedingMatingCreateContext(!isEditing);

  useEffect(() => {
    if (!isEditing && createContextQuery.data?.data?.next_code) {
      setValue('code', createContextQuery.data.data.next_code, { shouldDirty: false });
    }
  }, [isEditing, createContextQuery.data]);

  // ---- Hidratação de EDIÇÃO (`EP-BM-04`) — Lei 2: `fillForm` função
  // nomeada com guarda `!isEmpty(dirtyFields) || resetForce`. `EP-BM-04`
  // devolve o MESMO shape de contexto (`field_matrix`/`locked_fields`/
  // `lookups`) mais `breeding_mating` (registro hidratado). ---------------
  function fillForm(context: BreedingMatingFormContext, resetForce?: boolean) {
    if ((!isEmpty(dirtyFields) || resetForce) && context.breeding_mating) {
      const record: BreedingMatingData = context.breeding_mating;
      reset(mapBreedingMatingDataToFormValues(record, languageGB, context.locked_fields));
      setResponsibleName(record.responsible_name ?? '—');
    }
  }

  const editContextQuery = useCustomFormQueryByGuid<BreedingMatingFormContext>({
    registrationId: isEditing ? breedingMatingUuid : undefined,
    queryKey: queryKey.breedingMatings.breedingMating,
    asyncFunction: getBreedingMatingEditContext,
    fillForm,
  });

  const formContext: BreedingMatingFormContext | undefined = isEditing
    ? (editContextQuery as any).data
    : createContextQuery.data?.data;

  const isLoading = isEditing
    ? checkLoadingStatus([editContextQuery as any])
    : createContextQuery.isLoading;

  // ---- Mutação (`EP-BM-05`/`EP-BM-06`) — `useRequest`, sem axios direto. -
  const breedingMatingMutation = useRequest<BreedingMatingData>({
    asyncFunction: tryPersistAcasalamento,
    entityName: text.singularLabel,
    queryKey: queryKey.breedingMatings.breedingMatingsList,
    queryKey2: queryKey.breedingMatings.breedingMating,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(ACASALAMENTO_LIST_ROUTE);
    },
  });

  async function tryPersistAcasalamento(data: BreedingMatingFormType) {
    try {
      if (isEditing && breedingMatingUuid) {
        const payload = mapFormValuesToUpdatePayload(data);
        return await updateBreedingMating(breedingMatingUuid, payload);
      }

      const payload = mapFormValuesToCreatePayload(data);
      return await createBreedingMating(payload);
    } catch (error) {
      // 422 mapeado por campo (get_pwa_form_query_pattern — MANDATORY).
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

  const isSubmitting = breedingMatingMutation.isPending;

  // Seleção da seção — exatamente uma, nunca abas (ADR-FE-BM-01,
  // GAP-FE-BM-02). Materializadas na TASK-BM-FE-05 em `sections/*.tsx`.
  const type = watch('type');
  const launchType = watch('launch_type');
  const isNaturalSectionVisible = type?.value === 1;
  const isProtocolSectionVisible = type?.value !== 1 && launchType?.value === 1;
  const isSimplifiedSectionVisible = type?.value !== 1 && launchType?.value === 2;

  const sectionsDisabled = !canSave || isLoading || isSubmitting;

  // ---- Cascata C6 (`EP-BM-11`) — animais elegíveis do lote de reprodução,
  // consumida por `NaturalSection` (touro/vacas) e `ProtocolSection`
  // (`Animal` de cada linha). Aberta na TASK-BM-FE-04, materializada aqui. -
  const breedingBatch = watch('breeding_batch');
  const eligibleAnimalsQuery = useBreedingBatchAnimalsCascade(breedingBatch?.value);
  const eligibleAnimals = eligibleAnimalsQuery.data ?? [];

  // ---- `EP-BM-13` (`bm-endpoint-batches-to-transfer`) — lotes de destino,
  // compartilhado entre `ProtocolRow` (`Transferência/Lote`) e o próprio
  // `BatchTransferDialog` (`Novo lote`). ---------------------------------
  const transferBatchOptionsQuery = useTransferBatchOptions(breedingBatch?.value);
  const transferBatchOptions = transferBatchOptionsQuery.data ?? [];

  const breedingSeasonCascadeContext = useBreedingSeasonCascade(watch('breeding_season')?.value)
    .data?.data;
  const selectedProtocolUuid = watch('protocol')?.value;
  const selectedBullSeedSeasonUuid = watch('bull_seed_season')?.value;
  const protocolIdentification = watch('protocol_identification');
  const protocolItems = useMemo(
    () =>
      findSeasonProtocolItems(
        breedingSeasonCascadeContext,
        selectedProtocolUuid,
        protocolIdentification
      ),
    [breedingSeasonCascadeContext, selectedProtocolUuid, protocolIdentification]
  );
  const seedProducts = useMemo(
    () => findSeasonSeedProducts(breedingSeasonCascadeContext, selectedBullSeedSeasonUuid),
    [breedingSeasonCascadeContext, selectedBullSeedSeasonUuid]
  );

  // ---- Linhas dinâmicas — `useFieldArray` vive no formulário PAI (mirror
  // `CreateOrUpdateLoteReproducao.tsx`/`BatchesFieldArray.tsx`); as seções só
  // renderizam. ------------------------------------------------------------
  const {
    fields: protocolAnimalFields,
    append: appendProtocolAnimalRow,
    remove: removeProtocolAnimalRow,
  } = useFieldArray({ control, name: 'protocol_animals' });

  const {
    fields: simplifiedAnimalFields,
    append: appendSimplifiedAnimalRow,
    remove: removeSimplifiedAnimalRow,
  } = useFieldArray({ control, name: 'simplified_animals' });

  // ---- `BatchTransferDialog` (`bm-dialog-batch-transfer`) — dois
  // acionadores, um único diálogo (regra 9/10/12 da Tarefa, §6.3.5):
  //   1. pré-submit (CLM-017) — `pendingSubmitData` guarda o formulário para
  //      reenviar após a transferência confirmar.
  //   2. botão `+` de `ProtocolRow` (linha isolada) — sem
  //      `pendingSubmitData`, sem reenvio.
  // -------------------------------------------------------------------------
  const [isBatchTransferOpen, setIsBatchTransferOpen] = useState(false);
  const [batchTransferAnimals, setBatchTransferAnimals] = useState<
    { uuid: string; code: string }[]
  >([]);
  const [batchTransferWarning, setBatchTransferWarning] = useState<string | undefined>(undefined);
  const [pendingSubmitData, setPendingSubmitData] = useState<BreedingMatingFormType | null>(null);

  function handleRequestRowBatchTransfer(_index: number, animal: Option<string>) {
    setBatchTransferAnimals([{ uuid: animal.value, code: animal.label }]);
    setBatchTransferWarning(undefined);
    setPendingSubmitData(null);
    setIsBatchTransferOpen(true);
  }

  function handleBatchTransferSuccess() {
    if (pendingSubmitData) {
      const dataToSubmit = pendingSubmitData;
      setPendingSubmitData(null);
      // "Reenvia o formulário principal", como no legado (regra 9 da
      // Tarefa) — só no fluxo 1 (pré-submit), `pendingSubmitData` presente.
      void breedingMatingMutation.mutateAsync(dataToSubmit);
    }
  }

  // CLM-017 — mirror do legado (_forms.blade.php:816-818): o aviso só é
  // relevante quando o Lote de Reprodução tem MAIS animais elegíveis do que
  // linhas de protocolo já preenchidas/persistidas — nunca como
  // recomputação de identidade contra o lote vivo em toda edição. Antes do
  // submit, se o tipo não é Natural e o número de linhas de protocolo é
  // menor que o de animais elegíveis do lote, avisa e abre o diálogo de
  // transferência ANTES de persistir; o submit real só ocorre depois de
  // confirmado (`handleBatchTransferSuccess`) ou é abortado se o usuário
  // cancelar o diálogo.
  function handleValidSubmit(data: BreedingMatingFormType) {
    if (isProtocolSectionVisible) {
      const hasFewerRowsThanEligibleAnimals = data.protocol_animals.length < eligibleAnimals.length;

      if (hasFewerRowsThanEligibleAnimals) {
        const selectedAnimalUuids = new Set(
          data.protocol_animals
            .map((row) => row.animal?.value)
            .filter((uuid): uuid is string => !!uuid)
        );
        const unassignedAnimals: AnimalOptionRef[] = eligibleAnimals.filter(
          (animal) => !selectedAnimalUuids.has(animal.uuid)
        );

        if (unassignedAnimals.length > 0) {
          setBatchTransferAnimals(
            unassignedAnimals.map((animal) => ({ uuid: animal.uuid, code: animal.code }))
          );
          setBatchTransferWarning(text.form.batchTransferDialog.warningMessage);
          setPendingSubmitData(data);
          setIsBatchTransferOpen(true);
          return;
        }
      }
    }

    void breedingMatingMutation.mutateAsync(data);
  }

  function onInvalid() {
    toaster.create({
      title: text.singularLabel,
      description: formText.errors.invalidFields,
      type: 'error',
    });
  }

  if (hasMalformedRouteParam) {
    return null;
  }

  return (
    <>
      <FormContainer
        title={isEditing ? formText.title.edit : formText.title.create}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="outline"
              type="button"
              onClick={() => guardedNavigate(-1)}
              disabled={isSubmitting}
            />
            {canSave && (
              <ButtonSaveAndNext
                type="submit"
                form="acasalamento-form"
                create={!isEditing}
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
          id="acasalamento-form"
          onSubmit={handleSubmit(handleValidSubmit, onInvalid)}
          noPadding
        >
          <AcasalamentoHeaderFields
            control={control}
            watch={watch}
            setValue={setValue}
            languageGB={languageGB}
            canSave={canSave}
            isEditing={isEditing}
            isLoading={isLoading || isSubmitting}
            nextCode={watch('code')}
            responsibleName={responsibleName}
            formContext={formContext}
          />

          {/* Seções de subcadastro (contrato de tela §6.3.1/§6.3.2/§6.3.3) —
              exatamente uma renderizada por vez, nunca via `Tabs.*`
              (ADR-FE-BM-01/GAP-FE-BM-02). */}
          {isNaturalSectionVisible && (
            <NaturalSection
              control={control}
              setValue={setValue}
              eligibleAnimals={eligibleAnimals}
              isLoadingAnimals={eligibleAnimalsQuery.isFetching}
              disabled={sectionsDisabled}
              languageGB={languageGB}
            />
          )}

          {isProtocolSectionVisible && (
            <ProtocolSection
              control={control}
              setValue={setValue}
              fields={protocolAnimalFields}
              append={appendProtocolAnimalRow}
              remove={removeProtocolAnimalRow}
              arrayErrorMessage={(errors.protocol_animals as any)?.message}
              languageGB={languageGB}
              disabled={sectionsDisabled}
              breedingMatingType={type?.value}
              eligibleAnimals={eligibleAnimals}
              isLoadingAnimals={eligibleAnimalsQuery.isFetching}
              bodyScoreOptions={formContext?.lookups?.body_scores ?? []}
              providerOptions={formContext?.lookups?.providers ?? []}
              batchOptions={transferBatchOptions.map((batch) => ({
                label: batch.label,
                value: batch.uuid,
              }))}
              isLoadingBatchOptions={transferBatchOptionsQuery.isFetching}
              protocolItems={protocolItems}
              seedProducts={seedProducts}
              onRequestBatchTransfer={handleRequestRowBatchTransfer}
            />
          )}

          {isSimplifiedSectionVisible && (
            <SimplifiedSection
              control={control}
              setValue={setValue}
              trigger={trigger}
              fields={simplifiedAnimalFields}
              append={appendSimplifiedAnimalRow}
              remove={removeSimplifiedAnimalRow}
              arrayErrorMessage={(errors.simplified_animals as any)?.message}
              languageGB={languageGB}
              disabled={sectionsDisabled}
              warehouseOptions={formContext?.lookups?.warehouses ?? []}
              providerOptions={formContext?.lookups?.providers ?? []}
            />
          )}
        </Form>
      </FormContainer>

      <BatchTransferDialog
        isOpen={isBatchTransferOpen}
        onClose={() => {
          setIsBatchTransferOpen(false);
          setPendingSubmitData(null);
        }}
        animals={batchTransferAnimals}
        batchOptions={transferBatchOptions}
        isLoadingBatchOptions={transferBatchOptionsQuery.isFetching}
        warningMessage={batchTransferWarning}
        languageGB={languageGB}
        onSuccess={handleBatchTransferSuccess}
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
