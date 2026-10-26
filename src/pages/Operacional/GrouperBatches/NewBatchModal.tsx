// src/pages/Operacional/GrouperBatches/NewBatchModal.tsx
// -----------------------------------------------------------------------------
// Modal "Novo Lote" (GrouperBatch, execução 042, TASK-FE-042-305) — mirror
// QUASE literal de
// `Operacional/LoteFazenda/TransferBatchFarms/NewBatchModal.tsx`, trocando
// SOMENTE o service/schema/tipo de origem: aqui usa `createBatch`/`BatchForm`/
// `batchSchemaResolver` de `Batches/` (endpoint REAL migrado
// `/animal-batches`), D-front-6.
//
// SEM `onCreated` — sucesso só fecha o modal e invalida `queryKey.batches.list`
// (D-front-7); a própria listagem desta tela já reflete o novo lote no
// refetch. SEM `animal_uuids` no payload (chave OMITIDA, não `[]` — o schema
// aceita a ausência, `nullable`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Portal, SimpleGrid } from '@chakra-ui/react';
import { format } from 'date-fns';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import { batchSchemaResolver } from '@/validations/schemas/CadastrosBase/batch-schema';

import { listParameterWeights } from '@/services/v2/BaseRegistrations/parameterWeights-service';
import { createBatch } from '@/services/v2/Batches/batch-service';
import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';
import { listSpecieOptions } from '@/services/v2/Species/species-service';

import type { Option } from '@/@types/option';
import type { ParameterWeightListItem } from '@/@types/v2/BaseRegistrations/parameterWeights';
import type { BatchData, BatchForm } from '@/@types/v2/Batches';
import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';
import type { SpecieOptionItem } from '@/@types/v2/Species/species';

interface NewBatchFormValues {
  description: string;
  date: string | null;
  specie_uuid: Option<string> | null;
  category_uuids: Option<string>[];
  parameter_weight_uuid: Option<string> | null;
}

const emptyFormValues: NewBatchFormValues = {
  description: '',
  date: null,
  specie_uuid: null,
  category_uuids: [],
  parameter_weight_uuid: null,
};

// Constrói os valores de abertura do modal SEMPRE recalculando a data de HOJE
// no momento da chamada (nunca uma constante congelada no import) — o modal
// pode ficar aberto/fechado por horas/dias na mesma sessão SPA.
function buildOpenFormValues(): NewBatchFormValues {
  return { ...emptyFormValues, date: format(new Date(), 'yyyy-MM-dd') };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

export interface NewBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewBatchModal({ isOpen, onClose }: NewBatchModalProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.grouperBatches.grouperBatch.newBatch;

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors },
  } = useForm<NewBatchFormValues>({
    mode: 'onChange',
    resolver: batchSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: emptyFormValues,
  });

  useEffect(() => {
    if (isOpen) reset(buildOpenFormValues());
  }, [isOpen, reset]);

  // Cascata Espécie→Categoria (SF-028/IG-016) — trocar a Espécie invalida as
  // Categorias já selecionadas (podem não pertencer mais à nova Espécie),
  // mirror `CreateOrUpdateBatch/index.tsx`, SEM o toast de aviso (este modal
  // não tem seleção de animal para justificar o aviso, D-front-6).
  const watchedSpecie = useWatch({ control, name: 'specie_uuid' });

  const createMutation = useRequest<BatchData>({
    asyncFunction: (payload: BatchForm) => createBatch(payload),
    typesRequest: 'create',
    entityName: text.title,
    personalizedMessage: text.createdToast,
    queryKey: queryKey.batches.list,
    actionSuccess: onClose,
  });

  function onSubmit(data: NewBatchFormValues) {
    const payload: BatchForm = {
      description: data.description.trim(),
      date: data.date as string,
      specie_uuid: data.specie_uuid!.value,
      category_uuids: data.category_uuids.map((option) => option.value),
      parameter_weight_uuid: data.parameter_weight_uuid?.value ?? null,
    };
    createMutation.mutate(payload);
  }

  const isSubmitting = createMutation.isPending;

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
              <Dialog.Title>{text.title}</Dialog.Title>
            </Dialog.Header>

            <form id="new-grouper-batch-form" onSubmit={handleSubmit(onSubmit)}>
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
                          disabled={isSubmitting}
                          disablePortal
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
                        isDisabled={isSubmitting}
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
                        isDisabled={isSubmitting}
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
                        isDisabled={isSubmitting || !watchedSpecie}
                        disablePortal
                      />
                    )}
                  />

                  <Input
                    label={text.fields.description}
                    isRequired
                    maxLength={200}
                    {...register('description')}
                    error={errors.description?.message}
                    disabled={isSubmitting}
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
                form="new-grouper-batch-form"
                loading={isSubmitting}
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
