// src/pages/Operacional/LoteFazenda/TransferBatchFarms/NewBatchModal.tsx
// -----------------------------------------------------------------------------
// Modal "Novo Lote" (DLG-BATCH/FRM-BATCH, 97-Esteiras/041, TASK-FE-041-LF-03)
// — chamado de dentro do wizard de Processamentos (`ProcessingAnimalRow.tsx`,
// botão "Abrir Novo Lote", ACT-27). Padrão Pattern 14 (Modal Form,
// `Dialog.Root` v3 — Portal+Backdrop+Positioner, `<form id>` no Body +
// `Button form=` no Footer, `useMutation` direto com toaster local).
//
// `POST /batches` (ACT-29, R-28) — cria um Lote VAZIO (SEM `animal_uuids`,
// F-BT01-13; o wizard popula os animais depois). Campos: `date`,
// `parameter_weight_uuid` (opcional), `specie_uuid` (dispara cascata
// `category_uuids` por Espécie), `category_uuids` (multiselect),
// `description` (obrigatório, max 200), `corral_uuid` (opcional — TASK-063-
// PROC-QA3-06, ver nota abaixo).
//
// Sucesso repopula o select de lote aberto no wizard (INT-36) — via
// `onCreated(batch)`, o pai (`ProcessingAnimalRow`) seleciona o Lote novo E
// bumpa o `cacheUniqs` do `SelectAsyncPaginate` de `batch_uuid` (só 1 card do
// wizard é montado por vez — `ProcessingAnimalsSection.tsx` — dispensa
// invalidação cross-componente).
//
// 063-est03-9-reprovacoes (rejeição QA3, roteiro
// `processamento-novolote-roteiro-qa3.md`) —
// TASK-063-PROC-QA3-03: a cascata Espécie→Categoria prometida acima (linha
// 11) NÃO estava implementada de fato (Categoria sem `specie_uuid`/
// `cacheUniqs`) — corrigido, mirror 1:1 de
// `CadastrosBase/Batches/CreateOrUpdateBatch/index.tsx:632-644`.
// TASK-063-PROC-QA3-04 (melhoria pedida pelo dono, SEM lastro no legado) —
// quando o contratante só tem 1 Espécie acessível (`GET /species/options`),
// o campo já vem pré-selecionado e travado (mirror
// `CreateOrUpdateParameterAnimal/index.tsx:163-191`, TASK-FE-1088).
// TASK-063-PROC-QA3-06 — campo opcional "Curral Confinamento" adicionado
// (mirror `batch_modal.blade.php:41-45`, `@if(isset($corrals))`, opcional,
// SEM travar o submit): consome o endpoint NOVO
// `GET /feedlot-corrals/available-for-batch` (`listFeedlotCorralAvailableForBatch`,
// `feedlot-corral-service.ts`), que já devolve currais com vaga rotulados
// `"{nome} | Capacidade: x/y | Situação: ..."`. `corral_uuid` já era aceito
// pelo schema (`newBatch-schema.ts`) e por `CreateBatchRequest` — só
// faltava o Controller/payload (a lacuna documentada acima, linha 13-15,
// está resolvida).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Portal, SimpleGrid } from '@chakra-ui/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { queryKey } from '@/constants/query-key';

import { newBatchSchemaResolver } from '@/validations/schemas/LoteFazenda/newBatch-schema';

import { listParameterWeights } from '@/services/v2/BaseRegistrations/parameterWeights-service';
import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';
import { listFeedlotCorralAvailableForBatch } from '@/services/v2/FeedlotCorrals/feedlot-corral-service';
import { createBatch } from '@/services/v2/LoteFazenda/transferBatchFarm-service';
import { listSpecieOptions } from '@/services/v2/Species/species-service';

import type { Option } from '@/@types/option';
import type { ParameterWeightListItem } from '@/@types/v2/BaseRegistrations/parameterWeights';
import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';
import type { FeedlotCorralAvailableForBatchOption } from '@/@types/v2/FeedlotCorrals';
import type { BatchDetail, CreateBatchRequest } from '@/@types/v2/LoteFazenda/transferBatchFarm';
import type { SpecieOptionItem } from '@/@types/v2/Species/species';

interface NewBatchFormValues {
  description: string;
  date: string | null;
  specie_uuid: Option<string> | null;
  category_uuids: Option<string>[];
  parameter_weight_uuid: Option<string> | null;
  corral_uuid: Option<string> | null;
}

const emptyFormValues: NewBatchFormValues = {
  description: '',
  date: null,
  specie_uuid: null,
  category_uuids: [],
  parameter_weight_uuid: null,
  corral_uuid: null,
};

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

export interface NewBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (batch: BatchDetail) => void;
}

export function NewBatchModal({ isOpen, onClose, onCreated }: NewBatchModalProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.loteFazenda.newBatch;

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors },
  } = useForm<NewBatchFormValues>({
    mode: 'onChange',
    resolver: newBatchSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: emptyFormValues,
  });

  useEffect(() => {
    if (isOpen) reset(emptyFormValues);
  }, [isOpen, reset]);

  // TASK-063-PROC-QA3-03 — Espécie observada para filtrar a Categoria pela
  // cascata (mirror `CreateOrUpdateBatch/index.tsx:632-644`).
  const watchedSpecie = useWatch({ control, name: 'specie_uuid' });

  // TASK-063-PROC-QA3-04 (melhoria pedida pelo dono, sem lastro no legado) —
  // `listSpecieOptions` não pagina de verdade (devolve a lista INTEIRA numa
  // única resposta, mesmo truque estrutural documentado em
  // `species-service.ts`), então `.length` já é a contagem REAL de espécies
  // acessíveis ao contratante — mirror EXATO de `CreateOrUpdateParameterAnimal/
  // index.tsx:163-191` (TASK-FE-1088), único precedente do fork para
  // auto-lock de Espécie única.
  const speciesOptionsQuery = useQuery({
    queryKey: [queryKey.loteFazenda.newBatchSpecieOptions],
    queryFn: () => listSpecieOptions({}),
    enabled: isOpen,
  });
  const isSpecieLocked = (speciesOptionsQuery.data?.data.items.length ?? 0) === 1;

  useEffect(() => {
    if (!isOpen) return;
    const options = speciesOptionsQuery.data?.data.items ?? [];
    if (options.length !== 1) return;
    const [onlySpecie] = options;
    setValue(
      'specie_uuid',
      { label: onlySpecie.label, value: onlySpecie.uuid },
      { shouldValidate: true }
    );
    // A cascata da QA3-03 (`findParams`/`cacheUniqs` do Select de Categoria,
    // abaixo) já reage a `watchedSpecie` — não precisa de um `setValue`
    // adicional em `category_uuids` aqui.
  }, [isOpen, speciesOptionsQuery.data, setValue]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateBatchRequest) => createBatch(payload),
    onSuccess: (response) => {
      toaster.success({ title: text.title, description: text.createdToast, duration: 7000 });
      onCreated(response.data);
      onClose();
    },
    onError: (error) => {
      const message = isAxiosError(error) ? (error.response?.data as any)?.message : undefined;
      toaster.error({
        title: text.title,
        description: message ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  function onSubmit(data: NewBatchFormValues) {
    const payload: CreateBatchRequest = {
      description: data.description.trim(),
      date: data.date as string,
      specie_uuid: data.specie_uuid!.value,
      category_uuids: data.category_uuids.map((option) => option.value),
      parameter_weight_uuid: data.parameter_weight_uuid?.value ?? undefined,
      // TASK-063-PROC-QA3-06 — opcional, mirror `batch_modal.blade.php:41-45`.
      corral_uuid: data.corral_uuid?.value ?? undefined,
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

            <form id="new-batch-form" onSubmit={handleSubmit(onSubmit)}>
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
                          // TASK-063-PROC-QA3-03 — trocar a Espécie esvazia
                          // as Categorias já selecionadas (mirror
                          // `batch_modal.blade.php`, o legado zera em
                          // silêncio — sem toast, decisão do roteiro).
                          if (!isSameSpecie) {
                            setValue('category_uuids', [], { shouldDirty: true });
                          }
                        }}
                        error={fieldState.error?.message}
                        isRequired
                        // TASK-063-PROC-QA3-04 — trava quando só há 1
                        // espécie acessível ao contratante.
                        isDisabled={isSubmitting || isSpecieLocked}
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
                        // TASK-063-PROC-QA3-03 — cascata Espécie→Categorias
                        // (mirror `CreateOrUpdateBatch/index.tsx:632-644`):
                        // `GET /category-animals/options?specie_uuid=` já
                        // existe e aceita o parâmetro OPCIONAL.
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
                        // Sem Espécie selecionada, a Categoria fica
                        // DESABILITADA (mirror `CreateOrUpdateBatch`/
                        // `ParameterAnimals`, TASK-FE-1088/1089).
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

                  <Controller
                    name="corral_uuid"
                    control={control}
                    render={({ field, fieldState }) => (
                      // `GET /feedlot-corrals/available-for-batch` não aceita
                      // parâmetro de busca (`ListFeedlotCorralAvailableForBatchAction::
                      // handle(farmId)`, sem `search`) — SEM `findParams`, para não
                      // sugerir um filtro que a API não implementa (SEM MOCK).
                      <SelectAsyncPaginate
                        name={field.name}
                        label={text.fields.corral}
                        service={listFeedlotCorralAvailableForBatch}
                        mapOptions={(item: FeedlotCorralAvailableForBatchOption) => ({
                          label: item.label,
                          value: item.value,
                        })}
                        value={field.value ?? null}
                        onChange={(option: any) => field.onChange(option ?? null)}
                        error={fieldState.error?.message}
                        isDisabled={isSubmitting}
                        isClearable
                        disablePortal
                      />
                    )}
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
                form="new-batch-form"
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
