// src/pages/Operacional/FeedlotCorrals/steps/BatchModal.tsx
// -----------------------------------------------------------------------------
// Sub-modal "Novo/Editar Lote" da Etapa 3 (Lotes) do wizard de Curral —
// TASK-043-CUR-T05 (`05-Wizard-Etapa3-Lotes.md`, contrato de tela §6 Etapa 3,
// AC-017/IG-023/IG-024, FID-G3F SR-R18..20/B15-B17/B26/B27/F08).
//
// Mirror ESTRUTURAL de `InlineTroughModal.tsx` (2 `Dialog.Root` empilhados,
// `useMutation` + callback `onSaved` popula o select da linha pai e fecha SÓ
// este sub-modal — o wizard permanece aberto) trocando o conteúdo pelos
// campos de `NewBatchModal.tsx` (`Operacional/GrouperBatches`) — REUSO 100%
// de `batchSchemaResolver`/`createBatch`/`updateBatch`/`listSpecieOptions`/
// `listCategoryAnimalOptions`/`listParameterWeights` (já em produção), SEM
// duplicar regra de validação nem endpoint.
//
// Campos (legado `batch_modal`, FM-059/062/063/064/065): `date` ·
// `parameter_weight_uuid` (LK-013, opcional) · `specie_uuid` (LK-014,
// obrigatório) → cascata IG-024 `category-animals/options?specie_uuid=`
// (JÁ resolvido na API migrada — `specie_uuid`, não `specie_id`, GAP-API-06
// fechado neste ponto) · `categories[]` (LK-017, obrigatório) · `description`
// (obrigatório, max:100 — `batchSchema` já aplica o teto real do backend).
//
// PARADA-DEF-C (DEF-015, default do contrato "corrigir — upsert real"): o
// legado sempre fazia POST, mesmo reabrindo um lote já selecionado (criava
// cópia). Aqui `targetUuid` decide o verbo — presente → `updateBatch` (PUT);
// ausente → `createBatch` (POST). `targetUuid` vem da linha (`batch_uuid`
// selecionado) que chamou o modal (`StepLotes.tsx`, ícone Pencil/Plus).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Portal, SimpleGrid } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import { batchSchemaResolver } from '@/validations/schemas/CadastrosBase/batch-schema';

import { listParameterWeights } from '@/services/v2/BaseRegistrations/parameterWeights-service';
import { createBatch, getBatchById, updateBatch } from '@/services/v2/Batches/batch-service';
import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';
import { listSpecieOptions } from '@/services/v2/Species/species-service';

import type { Option } from '@/@types/option';
import type { ParameterWeightListItem } from '@/@types/v2/BaseRegistrations/parameterWeights';
import type { BatchData, BatchForm } from '@/@types/v2/Batches';
import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';
import type { SpecieOptionItem } from '@/@types/v2/Species/species';

interface BatchModalFormValues {
  description: string;
  date: string | null;
  specie_uuid: Option<string> | null;
  category_uuids: Option<string>[];
  parameter_weight_uuid: Option<string> | null;
}

const EMPTY_VALUES: BatchModalFormValues = {
  description: '',
  date: null,
  specie_uuid: null,
  category_uuids: [],
  parameter_weight_uuid: null,
};

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

export interface BatchModalProps {
  isOpen: boolean;
  /** uuid do lote a editar (upsert real, PARADA-DEF-C) — `null`/`undefined` = criar. */
  targetUuid?: string | null;
  onClose: () => void;
  onSaved: (option: { uuid: string; description: string }) => void;
}

export function BatchModal({ isOpen, targetUuid, onClose, onSaved }: BatchModalProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotCorrals.feedlotCorral.wizard.lots.batchModal;
  const queryClient = useQueryClient();
  const isEditing = !!targetUuid;

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BatchModalFormValues>({
    mode: 'onChange',
    resolver: batchSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: EMPTY_VALUES,
  });

  // IG-023 — abrir com um lote selecionado hidrata os campos (GET, `batch_view`);
  // abrir vazio limpa o form (mirror `clearBatchModal` do legado).
  const batchDetailQuery = useQuery({
    queryKey: [queryKey.batches.detail, targetUuid],
    queryFn: () => getBatchById(targetUuid as string),
    enabled: isOpen && isEditing,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (!isEditing) {
      reset(EMPTY_VALUES);
      return;
    }
    const data = batchDetailQuery.data?.data;
    if (!data) return;
    reset({
      description: data.description,
      date: data.date,
      specie_uuid: data.specie ? { label: data.specie.description, value: data.specie.uuid } : null,
      category_uuids: (data.categories ?? []).map((category) => ({
        label: category.description,
        value: category.uuid,
      })),
      parameter_weight_uuid: data.parameter_weight
        ? { label: data.parameter_weight.description, value: data.parameter_weight.uuid }
        : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditing, batchDetailQuery.data]);

  // Cascata Espécie→Categoria (IG-024) — trocar a Espécie invalida as
  // Categorias já selecionadas (mirror `NewBatchModal.tsx`/`CreateOrUpdateBatch`).
  const watchedSpecie = useWatch({ control, name: 'specie_uuid' });

  const mutation = useMutation({
    mutationFn: async (payload: BatchForm) => {
      if (targetUuid) return updateBatch(targetUuid, payload);
      return createBatch(payload);
    },
    onSuccess: (response: { data: BatchData }) => {
      toaster.success({
        title: isEditing ? text.titleEdit : text.titleCreate,
        description: isEditing ? text.updatedToast : text.createdToast,
      });
      queryClient.invalidateQueries({ queryKey: [queryKey.batches.options] });
      if (targetUuid) {
        queryClient.invalidateQueries({ queryKey: [queryKey.batches.detail, targetUuid] });
      }
      onSaved({ uuid: response.data.uuid, description: response.data.description });
    },
    onError: (error) => {
      toaster.error({
        title: isEditing ? text.titleEdit : text.titleCreate,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    },
  });

  function onSubmit(data: BatchModalFormValues) {
    const payload: BatchForm = {
      description: data.description.trim(),
      date: data.date as string,
      specie_uuid: data.specie_uuid!.value,
      category_uuids: data.category_uuids.map((option) => option.value),
      parameter_weight_uuid: data.parameter_weight_uuid?.value ?? null,
    };
    mutation.mutate(payload);
  }

  const isSubmitting = mutation.isPending;
  const isLoadingDetail = isEditing && batchDetailQuery.isPending;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !isSubmitting) onClose();
      }}
      size="lg"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>{isEditing ? text.titleEdit : text.titleCreate}</Dialog.Title>
            </Dialog.Header>

            <form id="feedlot-corral-batch-modal-form" onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field
                        label={text.fields.date}
                        isRequired
                        errorText={fieldState.error?.message}
                      >
                        <DateInput
                          value={field.value ?? null}
                          onChange={field.onChange}
                          disabled={isSubmitting || isLoadingDetail}
                        />
                      </Field>
                    )}
                  />

                  <Controller
                    name="parameter_weight_uuid"
                    control={control}
                    render={({ field, fieldState }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={text.fields.parameterWeight}
                        service={listParameterWeights}
                        mapOptions={(item: ParameterWeightListItem) => ({
                          label: item.description,
                          value: item.uuid,
                        })}
                        findParams={findParamsFromSearch}
                        value={field.value ?? null}
                        onChange={(option: any) => field.onChange(option ?? null)}
                        error={fieldState.error?.message}
                        isDisabled={isSubmitting || isLoadingDetail}
                        disablePortal
                      />
                    )}
                  />

                  <Controller
                    name="specie_uuid"
                    control={control}
                    render={({ field, fieldState }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={text.fields.specie}
                        service={listSpecieOptions}
                        mapOptions={(item: SpecieOptionItem) => ({
                          label: item.label,
                          value: item.uuid,
                        })}
                        findParams={findParamsFromSearch}
                        value={field.value ?? null}
                        onChange={(option: any) => {
                          const isSameSpecie = option?.value === field.value?.value;
                          field.onChange(option ?? null);
                          if (!isSameSpecie) {
                            setValue('category_uuids', [], { shouldDirty: true });
                          }
                        }}
                        error={fieldState.error?.message}
                        isRequired
                        isDisabled={isSubmitting || isLoadingDetail}
                        disablePortal
                      />
                    )}
                  />

                  <Controller
                    name="category_uuids"
                    control={control}
                    render={({ field, fieldState }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={text.fields.categories}
                        service={listCategoryAnimalOptions}
                        mapOptions={(item: CategoryAnimalOptionItem) => ({
                          label: item.label,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                          specie_uuid: watchedSpecie?.value,
                        })}
                        cacheUniqs={[watchedSpecie?.value]}
                        value={field.value ?? []}
                        onChange={(options: any) => field.onChange(options ?? [])}
                        error={fieldState.error?.message}
                        isRequired
                        isMulti
                        isDisabled={isSubmitting || isLoadingDetail || !watchedSpecie}
                        disablePortal
                      />
                    )}
                  />

                  <Input
                    label={text.fields.description}
                    isRequired
                    maxLength={100}
                    {...register('description')}
                    error={errors.description?.message}
                    disabled={isSubmitting || isLoadingDetail}
                  />
                </SimpleGrid>
              </Dialog.Body>
            </form>

            <Dialog.Footer>
              <Button
                title={text.cancelButton}
                variant="secondary"
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
              />
              <Button
                title={text.submitButton}
                type="submit"
                form="feedlot-corral-batch-modal-form"
                loading={isSubmitting}
                disabled={isLoadingDetail}
              />
            </Dialog.Footer>
            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
