// src/pages/Operacional/Reproducao/LoteReproducao/CreateOrUpdateLoteReproducao.tsx
// -----------------------------------------------------------------------------
// Formulário ÚNICO de criação/edição de Lote de Reprodução — Operacional /
// Reprodução (97-Esteiras/048, Tarefa 06, contrato de tela §5 — ponto crítico
// de fidelidade). Rotas `/operacional/lotes-reproducao/nova` e
// `/operacional/lotes-reproducao/:breedingBatchUuid/editar`, registradas na
// Tarefa 07, guardadas por `breeding-batch_create`/`_edit` (NUNCA `batch_*`,
// achado #2/CLM-03).
//
// Esqueleto geral mirror `EstacaoDeMonta/CreateOrUpdateEstacaoDeMonta.tsx`
// (`isEditing = isValidGuid(id)`, guard de navegação para uuid malformado,
// `useCustomFormQueryByGuid`, `fillForm` nomeada com guarda
// `!isEmpty(dirtyFields) || resetForce`, `useUnsavedChangesGuard` +
// `DeleteConfirmDialog` de saída sem salvar, `code`/"Responsável" SEMPRE
// `InputReadOnly`, `date` como `Input type="date"` único em todos os modos —
// contrato de tela §3, achado #5 do backend, a divergência `d/m/Y`×cru do
// legado não existe aqui por construção). Guard de "nada mudou" do `onSubmit`
// mirror EXATO da versão CORRIGIDA de `BullSeedSeason` (`!isEmpty(dirtyFields)`
// — `src/utils/isEmpty.ts` tem nome invertido: retorna `true` quando o objeto
// TEM alguma chave própria; sem a negação, o Salvar navegaria de volta sem
// chamar a API em QUALQUER edição, bug já documentado no módulo-irmão).
//
// "Responsável" (`responsible_name`) NUNCA tem fallback para o usuário
// logado em EDIÇÃO (achado #6 do backend/contrato de tela §3) — só em
// CRIAÇÃO mostra o usuário autenticado local; em edição, exibe exatamente o
// que vem do servidor (pode ser `'—'` em registro legado sem `user_id`).
//
// Subcadastro `batches[]` (`BatchesFieldArray.tsx`) — 3 comportamentos que os
// módulos-irmãos (`AnimalsFieldArray`/`ProductsFieldArray`) NÃO têm e este
// PRECISA ter (contrato de tela §5.1, fidelidade obrigatória ao legado):
//   1. `.min(1)` no schema Yup (Tarefa 04) — bloqueia submit com 0 linhas
//      ANTES do 422.
//   2. Dedupe client-side (IG-01/IG-02) — decidido AQUI (`handleBatchRowChange`),
//      nunca dentro do componente de linha.
//   3. `check-date` por linha, SEMPRE 1 `batch_uuid` por chamada (nunca em
//      lote, contrato de API §5/§8), com cascata: alterar o `date` do
//      CABEÇALHO reexecuta a validação para TODAS as linhas já preenchidas
//      (IG-03/IG-04) — hook dedicado abaixo, vive SÓ aqui no formulário PAI.
//
// `batch-options` é 1 única chamada compartilhada por TODAS as linhas do
// repetidor (contrato §5.2, resolvida aqui, repassada por prop); em edição,
// leva `exclude_breeding_batch_uuid` (LK-03) — em criação, sem esse parâmetro
// (LK-02).
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { breedingBatchSchemaResolver } from '@/validations/schemas/BreedingBatch/breeding-batch-schema';

import {
  checkBatchDate,
  createBreedingBatch,
  getBreedingBatch,
  getBreedingBatchNextCode,
  listBatchOptions,
  listBreedingSeasonOptions,
  updateBreedingBatch,
} from '@/services/v2/BreedingBatch/breeding-batch-service';

import type { Option } from '@/@types/option';
import type {
  BatchOptionRef,
  BreedingBatchDetail,
  BreedingBatchForm as BreedingBatchFormType,
  BreedingBatchPayload,
  BreedingSeasonOptionRef,
} from '@/@types/v2/BreedingBatch';

import { BatchesFieldArray } from './BatchesFieldArray';

import type { BatchesFieldValues } from './BatchesFieldArray';
import type { UseFieldArrayAppend } from 'react-hook-form';

const LOTE_REPRODUCAO_LIST_ROUTE = '/operacional/lotes-reproducao';

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Mirror EXATO `mapBreedingSeasonOption` já usado em `BullSeedSeason` para o
// MESMO tipo de lookup (`breeding-season-options`, resposta plana) — só
// `description` no label, sem `code` (convenção já em produção para esta
// entidade específica).
function mapBreedingSeasonOption(item: BreedingSeasonOptionRef): Option<string> {
  return { label: item.description, value: item.uuid };
}

// `batch-options` é lookup NOVO desta feature (sem precedente 1:1) — convenção
// já usada em várias telas do fork para lookups com `code`+`description`
// (ex.: `InvoiceItemsTab.tsx`/`ExpenseApportionmentTab.tsx`:
// `${item.code} — ${item.description}`), aplicada aqui pela mesma razão:
// desambiguar lotes com descrições parecidas.
function mapBatchOption(item: BatchOptionRef): Option<string> {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

// 422 do servidor mapeado por campo (contrato de tela §5.2, mirror
// `mapServerFieldToFormField` do `BullSeedSeason`) — `batch_uuids`/
// `batch_uuids.N` traduzidos para o path do repetidor `batches.N.batch`.
function mapServerFieldToFormField(field: string): string | null {
  if (field === 'code' || field === 'date' || field === 'description') return field;
  if (field === 'breeding_season_uuid') return 'breeding_season';
  if (field === 'batch_uuids') return 'batches';

  const batchMatch = field.match(/^batch_uuids\.(\d+)$/);
  if (batchMatch) return `batches.${batchMatch[1]}.batch`;

  return null;
}

export default function CreateOrUpdateLoteReproducao() {
  const { breedingBatchUuid } = useParams<{ breedingBatchUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();

  const text = languageGB.breedingBatches.breedingBatch;
  const formText = text.form;

  // Guard de navegação: `breedingBatchUuid` presente mas NÃO é um GUID válido
  // (URL adulterada) — redireciona para a listagem ANTES de renderizar o
  // form (mirror `CreateOrUpdateEstacaoDeMonta.tsx`/`CreateOrUpdateBullSeedSeason.tsx`).
  const hasMalformedRouteParam = breedingBatchUuid !== undefined && !isValidGuid(breedingBatchUuid);

  useEffect(() => {
    if (hasMalformedRouteParam) {
      navigate(LOTE_REPRODUCAO_LIST_ROUTE, { replace: true });
    }
  }, [hasMalformedRouteParam, navigate]);

  const isEditing = isValidGuid(breedingBatchUuid);
  const canSave = isEditing ? can('breeding-batch_edit') : can('breeding-batch_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    getValues,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<BreedingBatchFormType>({
    mode: 'onChange',
    resolver: breedingBatchSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      date: todayIsoDate(),
      description: '',
      breeding_season: null,
      // 1 linha vazia inicial (mirror do roteiro §"Cenários — smoke" 1) —
      // diferente de `AnimalsFieldArray`/`ProductsFieldArray` (`animals: []`),
      // pois `batches` exige `.min(1)` (achado #3) e o legado sempre abre com
      // 1 linha de lote disponível para seleção.
      batches: [{ batch: null }],
    },
  });

  const batchesFieldArray = useFieldArray({ control, name: 'batches' });

  // ---- Guarda de saída sem salvar ----------------------------------------
  const hasUnsavedChanges = !isEmpty(dirtyFields);
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);

  // ---- Código sugerido (SÓ em modo criação, `GET .../next-code`) --------
  // Armadilha 3 (mirror `EstacaoDeMonta`/`BullSeedSeason`): `next-code`
  // NUNCA é chamado em edição.
  const nextCodeQuery = useQuery({
    queryKey: [queryKey.breedingBatches.breedingBatch, 'next-code'],
    queryFn: getBreedingBatchNextCode,
    enabled: !isEditing,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isEditing && nextCodeQuery.data?.data?.code) {
      setValue('code', nextCodeQuery.data.data.code, { shouldDirty: false });
    }
  }, [isEditing, nextCodeQuery.data]);

  // ---- "Responsável" — SEMPRE read-only (contrato de tela §3, achado #6).
  // Criação: usuário autenticado local. Edição: `responsible_name` do
  // detalhe carregado, semeado por `fillForm`, SEM fallback para o usuário
  // da sessão atual. ------------------------------------------------------
  const [responsibleName, setResponsibleName] = useState<string>('—');

  useEffect(() => {
    if (!isEditing) {
      setResponsibleName(authUser?.username ?? '—');
    }
  }, [isEditing, authUser?.username]);

  // ---- Lookup plano `breeding-season-options` (1 chamada compartilhada) --
  const breedingSeasonOptionsQuery = useQuery({
    queryKey: [queryKey.breedingBatches.breedingBatch, 'breeding-season-options'],
    queryFn: listBreedingSeasonOptions,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const breedingSeasonOptions = (breedingSeasonOptionsQuery.data ?? []).map(
    mapBreedingSeasonOption
  );

  // ---- `batch-options` — 1 única chamada compartilhada por TODAS as
  // linhas do `BatchesFieldArray` (contrato §5.1/§5.2); em edição, com
  // `exclude_breeding_batch_uuid` (LK-03) — em criação, sem esse parâmetro
  // (LK-02). `queryKey` inclui o uuid para nunca reaproveitar cache entre
  // criação/edição de registros diferentes. -------------------------------
  const batchOptionsQuery = useQuery({
    queryKey: [
      queryKey.breedingBatches.breedingBatch,
      'batch-options',
      isEditing,
      breedingBatchUuid ?? null,
    ],
    queryFn: () => listBatchOptions(isEditing ? breedingBatchUuid : undefined),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const batchOptions = (batchOptionsQuery.data ?? []).map(mapBatchOption);

  // =========================================================================
  // Hook dedicado da cascata `check-date` + dedupe (IG-01..IG-04) — vive
  // SÓ AQUI no formulário PAI (contrato de tela §5.1), NUNCA dentro de
  // `BatchesFieldArray`. SEMPRE 1 `batch_uuid` por chamada (contrato de API
  // §5/§8) — grep confirma zero chamada em lote/array.
  // =========================================================================

  function isDuplicateBatchSelection(index: number, value: string): boolean {
    return getValues('batches').some(
      (row, rowIndex) => rowIndex !== index && row.batch?.value === value
    );
  }

  async function runCheckDateForRow(index: number, batchUuid: string, date: string) {
    try {
      const result = await checkBatchDate({ batch_uuid: batchUuid, date });
      if (!result.valid) {
        // Mirror do `swal` legado adaptado para erro de campo do `cerne` —
        // mensagem VERBATIM do endpoint (contrato de API §7), com fallback
        // só se o servidor não mandar `message`.
        setValue(`batches.${index}.batch`, null, { shouldDirty: true });
        setError(`batches.${index}.batch`, {
          type: 'server',
          message: result.message || formText.validation.batchInvalidDate,
        });
        return;
      }
      clearErrors(`batches.${index}.batch`);
    } catch {
      // Falha de rede/inesperada na validação ANTECIPADA — não bloqueia a
      // linha silenciosamente; o submit real ainda passa pelo 422 do
      // servidor como rede de segurança.
      clearErrors(`batches.${index}.batch`);
    }
  }

  // Disparado pelo `onChange` de CADA linha do `BatchesFieldArray`
  // (`onRowChange`). Dedupe SEMPRE checado ANTES do `check-date` — se
  // duplicado, bloqueia e NUNCA propaga a chamada de rede (contrato §5.1
  // item 2/3).
  async function handleBatchRowChange(index: number, option: Option<string> | null) {
    if (!option) {
      clearErrors(`batches.${index}.batch`);
      return;
    }

    if (isDuplicateBatchSelection(index, option.value)) {
      setValue(`batches.${index}.batch`, null, { shouldDirty: true });
      setError(`batches.${index}.batch`, {
        type: 'duplicate',
        message: formText.validation.batchDuplicate,
      });
      return;
    }

    const headerDate = getValues('date');
    if (!headerDate) {
      clearErrors(`batches.${index}.batch`);
      return;
    }

    await runCheckDateForRow(index, option.value, headerDate);
  }

  // Cascata IG-03/IG-04: alterar o `date` do CABEÇALHO reexecuta o
  // `check-date` para TODAS as linhas já preenchidas — 1 chamada POR LINHA,
  // nunca em lote. Guard por `ref`: só dispara quando `date` MUDOU de
  // verdade (evita loop no primeiro render/hidratação do `fillForm`).
  const watchedHeaderDate = watch('date');
  const previousHeaderDateRef = useRef(watchedHeaderDate);

  useEffect(() => {
    if (previousHeaderDateRef.current === watchedHeaderDate) return;
    previousHeaderDateRef.current = watchedHeaderDate;

    if (!watchedHeaderDate) return;

    getValues('batches').forEach((row, index) => {
      if (row.batch) {
        void runCheckDateForRow(index, row.batch.value, watchedHeaderDate);
      }
    });
  }, [watchedHeaderDate]);

  // ---- Guarda EXPLÍCITA `!isEmpty(dirtyFields) || resetForce` (Lei 2) ----
  function fillForm(data: BreedingBatchDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) && !resetForce) return;

    reset({
      code: data.code,
      date: data.date,
      description: data.description,
      breeding_season: {
        label: data.breeding_season.description,
        value: data.breeding_season.uuid,
      },
      batches:
        data.batches && data.batches.length > 0
          ? data.batches.map((batch) => ({
              batch: { label: `${batch.code} — ${batch.description}`, value: batch.uuid },
            }))
          : [{ batch: null }],
    });
    setResponsibleName(data.responsible_name ?? '—');
  }

  const breedingBatchQuery = useCustomFormQueryByGuid<BreedingBatchDetail>({
    registrationId: isEditing ? breedingBatchUuid : undefined,
    queryKey: queryKey.breedingBatches.breedingBatch,
    asyncFunction: getBreedingBatch,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([breedingBatchQuery as any]);

  const breedingBatchMutation = useRequest({
    asyncFunction: tryPersistLoteReproducao,
    entityName: text.singularLabel,
    queryKey: queryKey.breedingBatches.breedingBatchesList,
    queryKey2: queryKey.breedingBatches.breedingBatch,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(LOTE_REPRODUCAO_LIST_ROUTE);
    },
  });

  async function tryPersistLoteReproducao(data: BreedingBatchFormType) {
    // Payload NUNCA contém user_id/farm_id/tenant_id (contrato de tela §3).
    // `batch_uuids` é sempre o array INTEIRO desejado (o backend faz
    // `sync()`, mirror `CL-11`/`SE-01`/`SE-02`), nunca um delta.
    const payload: BreedingBatchPayload = {
      code: data.code,
      date: data.date,
      description: data.description,
      breeding_season_uuid: data.breeding_season!.value,
      batch_uuids: data.batches.map((b) => b.batch!.value),
    };

    try {
      return isEditing && breedingBatchUuid
        ? await updateBreedingBatch(breedingBatchUuid, payload)
        : await createBreedingBatch(payload);
    } catch (error) {
      // 422 do backend mapeado por campo (contrato de tela §5.2).
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

  // Guarda `isEditing && !isEmpty(dirtyFields)` — mirror EXATO da versão
  // CORRIGIDA já em produção em `BullSeedSeason` (ver nota de cabeçalho:
  // `isEmpty()` deste projeto tem nome invertido — sem a negação, o Salvar
  // navegaria de volta sem chamar a API em QUALQUER edição).
  async function onSubmit(data: BreedingBatchFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
      return;
    }
    await breedingBatchMutation.mutateAsync(data);
  }

  const isSubmitting = breedingBatchMutation.isPending;

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
              title={languageGB.defaltStrings?.cancel || 'Cancelar'}
              variant="secondary"
              type="button"
              onClick={() => guardedNavigate(-1)}
            />
            {canSave && (
              <ButtonSaveAndNext
                create={!isEditing}
                dirtyFields={dirtyFields}
                type="button"
                onClick={handleSubmit(onSubmit)}
                languageGB={languageGB}
                loading={isSubmitting}
                disabled={isSubmitting || !!isLoading}
              />
            )}
          </>
        }
      >
        <Form noPadding onSubmit={handleSubmit(onSubmit)}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <InputReadOnly
              name="code"
              label={formText.fields.code}
              value={watch('code') || '—'}
              loading={!isEditing && nextCodeQuery.isLoading}
            />

            <InputReadOnly
              name="responsible"
              label={formText.fields.responsible}
              value={responsibleName}
              loading={!!isLoading}
            />

            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DateInput
                  label={formText.fields.date}
                  value={field.value ?? null}
                  onChange={(value) => field.onChange(value ?? '')}
                  error={errors.date?.message}
                  isRequired
                  disabled={!canSave || !!isLoading}
                />
              )}
            />

            <Input
              label={formText.fields.description}
              {...register('description')}
              error={errors.description?.message}
              isRequired
              loading={!!isLoading}
              disabled={!canSave}
            />

            <Controller
              name="breeding_season"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Select
                  name={field.name}
                  label={formText.fields.breedingSeason}
                  options={breedingSeasonOptions}
                  value={field.value ?? null}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  error={error?.message}
                  loading={breedingSeasonOptionsQuery.isLoading}
                  isRequired
                  isDisabled={!canSave}
                />
              )}
            />
          </SimpleGrid>

          <Box mt={6}>
            <BatchesFieldArray
              control={control}
              fields={batchesFieldArray.fields}
              append={
                batchesFieldArray.append as unknown as UseFieldArrayAppend<
                  BatchesFieldValues,
                  'batches'
                >
              }
              remove={batchesFieldArray.remove}
              errors={errors}
              batchOptions={batchOptions}
              batchOptionsLoading={batchOptionsQuery.isLoading}
              onRowChange={handleBatchRowChange}
              languageGB={languageGB}
              disabled={!canSave}
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
