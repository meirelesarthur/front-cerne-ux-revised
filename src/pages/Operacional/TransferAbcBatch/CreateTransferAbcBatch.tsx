// src/pages/Operacional/TransferAbcBatch/CreateTransferAbcBatch.tsx
// -----------------------------------------------------------------------------
// Formulário de CRIAÇÃO de Transferência ABC de Animais entre Lotes
// (TransferAbcBatch — Operacional > Pecuária > Transferências,
// 97-Esteiras/039, TASK-FE-039-ABC-03). Rota
// `/operacional/transferencias/novo`, guardada por
// `<RequirePermission permission="transfer_abc_batch_create">`.
// `POST /transfer-abc-batches` — payload EXATO de `TransferAbcBatchRequest`
// (cabeçalho + `animals[]` + `financial{}`); `farm_id`/`user_id` NUNCA vão
// no payload (contexto server, DEC-013 não herdado).
//
// Mirror ESTRUTURAL DIRETO de `CreateFarmTransfer.tsx` (`FormContainer`
// fullHeight+footer, `useFieldArray` no pai para `animals`/`installments`/
// `categories`, `useRequest` para o submit), acrescido da cascata `type`
// (IG-001, recíproco `provider_uuid`/`client_uuid`) e da fonte de animais
// do lote origem (`listBatchCandidateAnimals`, FD2).
//
// Cascata `type` (1=Entrada/despesa, 2=Saída/receita) → mostra/obriga
// `provider_uuid` XOR `client_uuid`, limpando o campo oculto (mirror
// `prohibited_if` do backend). Cascata `origin_batch_uuid` → refetch dos
// animais candidatos do lote + limpa o repeater `animals[]` (IG-003).
// `vl_total` (Σ `animals[].total_value`) é recomputado a cada mudança do
// repeater e usado como referência de fechamento do rateio/parcelas — nunca
// enviado ao servidor (só exibido; `total_value` é recalculado no backend).
// -----------------------------------------------------------------------------

import { useEffect, useMemo } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Textarea } from '@/components/Form/InputTextArea';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { todayLocalIso } from '@/utils/localDate';

import { transferAbcTypeOptions } from '@/constants/livestock/transferAbcBatch/options/transferAbcType-options';
import { boolean as booleanOptions } from '@/constants/options/boolean';
import { queryKey } from '@/constants/query-key';

import { transferAbcBatchSchemaResolver } from '@/validations/schemas/TransferAbcBatch/transferAbcBatch-schema';

import { listTypeTitleOptions } from '@/services/v2/BaseRegistrations/typeTitles-service';
import {
  listBatchCandidateAnimals,
  listBatchOptionsForForm,
} from '@/services/v2/Batches/batch-service';
import { listClients } from '@/services/v2/CadastrosBase/Client/client-service';
import { listProprietaries } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { createTransferAbcBatch } from '@/services/v2/Livestock/transferAbcBatch-service';

import type { Option } from '@/@types/option';
import type { TypeTitleOptionItem } from '@/@types/v2/BaseRegistrations/typeTitles';
import type { BatchOption } from '@/@types/v2/Batches';
import type { ClientListItem } from '@/@types/v2/CadastrosBase/client';
import type { ProprietaryListItem } from '@/@types/v2/CadastrosBase/proprietary';
import type {
  CreateTransferAbcBatchRequest,
  TransferAbcBatchForm,
  TransferAbcType,
} from '@/@types/v2/Livestock/transferAbcBatch';

import { TransferAbcAnimalsEditor } from './TransferAbcAnimalsEditor';
import { TransferAbcCategoriesAllocation } from './TransferAbcCategoriesAllocation';
import { TransferAbcInstallments } from './TransferAbcInstallments';

import type { TransferAbcAnimalsFieldValues } from './TransferAbcAnimalsEditor';
import type { TransferAbcCategoriesFieldValues } from './TransferAbcCategoriesAllocation';
import type { TransferAbcInstallmentsFieldValues } from './TransferAbcInstallments';
import type { UseFieldArrayAppend, UseFieldArrayReplace } from 'react-hook-form';

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

function mapProviderOption(item: ProviderOptionItem): Option<string> {
  return { label: item.label, value: item.uuid };
}

function mapClientOption(item: ClientListItem): Option<string> {
  return { label: item.name, value: item.uuid };
}

function mapBatchOption(item: BatchOption): Option<string> {
  return { label: item.label, value: item.uuid };
}

function mapTypeTitleOption(item: TypeTitleOptionItem): Option<string> {
  return { label: item.description, value: item.uuid };
}

// Campo Proprietário: mesmo endpoint da NFe emitidas (NfeFinancialTab) —
// `listProprietaries` (`GET /proprietaries`, índice paginado) é diretamente
// compatível com `SelectAsyncPaginate` (retorna `ResponsePagination`), sem
// wrapper/adaptação local.

function todayIsoDate(): string {
  return todayLocalIso();
}

export default function CreateTransferAbcBatch() {
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.livestock.transferAbcBatch;
  const header = text.form.fields.header;

  const canSave = can('transfer_abc_batch_create');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<TransferAbcBatchForm>({
    mode: 'onChange',
    resolver: transferAbcBatchSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      date: todayIsoDate(),
      type: transferAbcTypeOptions.getOption(1, languageGB),
      description: '',
      provider_uuid: null,
      client_uuid: null,
      origin_batch_uuid: null,
      destination_batch_uuid: null,
      animals: [],
      vl_total: 0,
      financial_number: '',
      financial_type_title_uuid: null,
      financial_proprietary_uuid: null,
      financial_note: '',
      financial_fiscal_document: booleanOptions.getOption(false, languageGB),
      financial_has_input: booleanOptions.getOption(false, languageGB),
      financial_input_date: null,
      financial_input_value: null,
      financial_qtd_installments: null,
      financial_first_installment_date: null,
      financial_int_installments: null,
      installments: [],
      // Rateio exige ao menos 1 linha (`categories.min(1)`); já exibe uma linha
      // vazia por padrão para o caso comum de rateio único, evitando o clique
      // obrigatório em "Adicionar Linha". Mesmo shape do append (addLine).
      categories: [
        { category_uuid: null, center_uuid: null, plan_account_uuid: null, value: null },
      ],
    },
  });

  const animalsArray = useFieldArray({ control, name: 'animals' });
  const installmentsArray = useFieldArray({ control, name: 'installments' });
  const categoriesArray = useFieldArray({ control, name: 'categories' });

  const typeOption = watch('type');
  const transferType = (typeOption?.value ?? null) as TransferAbcType | null;

  const originBatchOption = watch('origin_batch_uuid');
  const originBatchUuid = originBatchOption?.value ?? null;

  const hasInputOption = watch('financial_has_input');
  const hasInput = hasInputOption?.value ?? false;
  const inputDate = watch('financial_input_date');
  const inputValue = watch('financial_input_value');

  // Cascata `type` (IG-001) — recíproco `provider_uuid`/`client_uuid`,
  // mirror `prohibited_if` do backend: limpa o campo oculto ao trocar.
  function handleTypeChange(option: Option<TransferAbcType> | null) {
    setValue('type', option ?? null, { shouldDirty: true });
    if (option?.value === 1) {
      setValue('client_uuid', null, { shouldDirty: true });
    } else if (option?.value === 2) {
      setValue('provider_uuid', null, { shouldDirty: true });
    }
  }

  // Cascata `origin_batch_uuid` (IG-003) — limpa o repeater de animais ao
  // trocar de lote origem (universo de candidatos muda por completo).
  // ABC-R3-02 — colisão Origem×Destino: rejeita a seleção que colide
  // (limpa o campo recém-selecionado) e avisa via toast, reusando a mesma
  // mensagem do backstop de submit (`batchesMustDiffer`, schema Yup).
  function handleOriginBatchChange(option: Option<string> | null) {
    const destinationUuid = watch('destination_batch_uuid')?.value ?? null;
    if (option && option.value === destinationUuid) {
      setValue('origin_batch_uuid', null, { shouldDirty: true });
      toaster.error({
        title: text.singularLabel,
        description: text.form.validation.batchesMustDiffer,
      });
      return;
    }

    const previousUuid = originBatchUuid;
    setValue('origin_batch_uuid', option ?? null, { shouldDirty: true });
    if ((option?.value ?? null) !== previousUuid) {
      animalsArray.replace([]);
    }
  }

  function handleDestinationBatchChange(option: Option<string> | null) {
    const originUuid = watch('origin_batch_uuid')?.value ?? null;
    if (option && option.value === originUuid) {
      setValue('destination_batch_uuid', null, { shouldDirty: true });
      toaster.error({
        title: text.singularLabel,
        description: text.form.validation.batchesMustDiffer,
      });
      return;
    }

    setValue('destination_batch_uuid', option ?? null, { shouldDirty: true });
  }

  // Animais candidatos do lote origem — `GET /animal-batches/
  // candidate-animals?batch_uuid=` (FD2, `batch_view`; achado: o lookup
  // dedicado de TransferAbcBatch, `/animals/options`, não filtra por lote
  // nem expõe peso). Coleção JÁ CARREGADA (sem paginação real) — consumida
  // por `SelectCombobox` client-side em cada linha do repeater.
  const candidateAnimalsQuery = useQuery({
    queryKey: [queryKey.livestock.transferAbcBatch, 'candidate-animals', originBatchUuid],
    queryFn: () =>
      listBatchCandidateAnimals({
        batch_uuid: originBatchUuid as string,
        category_uuids: [],
      }),
    enabled: !!originBatchUuid,
  });

  const animalOptions: Option<string>[] = useMemo(
    () =>
      (candidateAnimalsQuery.data ?? []).map((animal) => ({
        label: animal.identification,
        value: animal.uuid,
      })),
    [candidateAnimalsQuery.data]
  );

  const weightByAnimalUuid: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    (candidateAnimalsQuery.data ?? []).forEach((animal) => {
      map[animal.uuid] = animal.weight;
    });
    return map;
  }, [candidateAnimalsQuery.data]);

  // `vl_total` (CV-003) — Σ `animals[].total_value`, recomputado a cada
  // mudança do repeater; referência de fechamento do rateio/parcelas
  // (nunca enviado ao servidor).
  // `useWatch` (não `watch`) é obrigatório aqui: RHF muta `animals` in
  // place em `setValue('animals.N.total_value', …)`, então a referência do
  // array de `watch()` nunca troca e o `useMemo` abaixo trava em `0`
  // (mirror do mecanismo que já funciona em `TransferAbcAnimalsEditor.tsx`).
  const watchedAnimals = useWatch({ control, name: 'animals' }) ?? [];
  const vlTotal = useMemo(
    () =>
      Math.round(
        watchedAnimals.reduce((sum, row) => sum + (Number(row?.total_value) || 0), 0) * 100
      ) / 100,
    [watchedAnimals]
  );
  useEffect(() => {
    setValue('vl_total', vlTotal);
  }, [vlTotal]);

  const transferAbcBatchMutation = useRequest({
    asyncFunction: tryPersistTransferAbcBatch,
    entityName: text.singularLabel,
    queryKey: queryKey.livestock.transferAbcBatch,
    queryKey2: queryKey.livestock.transferAbcBatches,
    typesRequest: 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistTransferAbcBatch(data: TransferAbcBatchForm) {
    const payload: CreateTransferAbcBatchRequest = {
      date: data.date,
      type: data.type!.value,
      description: data.description,
      origin_batch_uuid: data.origin_batch_uuid!.value,
      destination_batch_uuid: data.destination_batch_uuid!.value,
      animals: data.animals.map((animal) => ({
        animal_uuid: animal.animal_uuid!.value,
        last_weight: Number(animal.last_weight) || 0,
        actual_weight: Number(animal.actual_weight) || 0,
        value: Number(animal.value) || 0,
      })),
      financial: {
        number: data.financial_number,
        type_title_uuid: data.financial_type_title_uuid!.value,
        proprietary_uuid: data.financial_proprietary_uuid!.value,
        note: data.financial_note,
        fiscal_document: data.financial_fiscal_document?.value ?? false,
        has_input: data.financial_has_input?.value ?? false,
        installments: data.installments.map((row) => ({
          due_date: row.due_date as string,
          value: Number(row.value) || 0,
        })),
        categories: data.categories.map((row) => ({
          category_uuid: row.category_uuid!.value,
          center_uuid: row.center_uuid!.value,
          value: Number(row.value) || 0,
          plan_account_uuid: row.plan_account_uuid?.value ?? undefined,
        })),
      },
    };

    if (data.type?.value === 1) {
      payload.provider_uuid = data.provider_uuid?.value;
    } else if (data.type?.value === 2) {
      payload.client_uuid = data.client_uuid?.value;
    }

    if (data.financial_has_input?.value) {
      payload.financial.input_date = data.financial_input_date as string;
      payload.financial.input_value = Number(data.financial_input_value) || 0;
    }

    return await createTransferAbcBatch(payload);
  }

  async function onSubmit(data: TransferAbcBatchForm) {
    await transferAbcBatchMutation.mutateAsync(data);
  }

  const isDisabled = !canSave;
  const submitting = isSubmitting || transferAbcBatchMutation.isPending;

  return (
    <FormContainer
      title={text.form.title.create}
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
              create
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={submitting}
              disabled={submitting}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* Cabeçalho */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
          <InputReadOnly name="code" label={header.code} value="—" />

          <Controller
            name="date"
            control={control}
            render={({ field, fieldState }) => (
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {header.date}
                </Text>
                <DateInput
                  value={field.value ?? null}
                  onChange={field.onChange}
                  disabled={isDisabled}
                />
                {fieldState.error?.message && (
                  <Text fontSize="xs" color="fg.error" mt={1}>
                    {fieldState.error.message}
                  </Text>
                )}
              </Box>
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                name={field.name}
                label={header.type}
                value={field.value ?? null}
                onChange={handleTypeChange as any}
                options={transferAbcTypeOptions.options(languageGB)}
                error={fieldState.error?.message}
                isRequired
                isDisabled={isDisabled}
              />
            )}
          />

          <Input
            label={header.description}
            isRequired
            disabled={isDisabled}
            {...control.register('description')}
            error={errors.description?.message}
          />

          {transferType === 1 && (
            <Controller
              name="provider_uuid"
              control={control}
              render={({ field, fieldState }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={header.provider}
                  service={listProviderOptions}
                  mapOptions={mapProviderOption}
                  findParams={findParamsFromSearch}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={fieldState.error?.message}
                  isRequired
                  isDisabled={isDisabled}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          )}

          {transferType === 2 && (
            <Controller
              name="client_uuid"
              control={control}
              render={({ field, fieldState }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={header.client}
                  service={listClients}
                  mapOptions={mapClientOption}
                  findParams={findParamsFromSearch}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={fieldState.error?.message}
                  isRequired
                  isDisabled={isDisabled}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          )}

          <Controller
            name="origin_batch_uuid"
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={header.originBatch}
                tooltip={text.form.hints.originBatchHelp}
                // R4-FE-02 — `origin_batch_uuid` é `required|uuid|different|exists`.
                service={listBatchOptionsForForm}
                mapOptions={mapBatchOption}
                findParams={findParamsFromSearch}
                value={field.value ?? null}
                onChange={handleOriginBatchChange as any}
                error={fieldState.error?.message}
                isRequired
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="destination_batch_uuid"
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={header.destinationBatch}
                // R4-FE-02 — `destination_batch_uuid` é `required|uuid|exists`.
                service={listBatchOptionsForForm}
                mapOptions={mapBatchOption}
                findParams={findParamsFromSearch}
                value={field.value ?? null}
                onChange={handleDestinationBatchChange as any}
                error={fieldState.error?.message}
                isRequired
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </SimpleGrid>

        {/* Animais (repeater) — `useFieldArray` vive AQUI (pai). */}
        <Box mt={6}>
          <TransferAbcAnimalsEditor
            control={control}
            fields={animalsArray.fields}
            append={
              animalsArray.append as unknown as UseFieldArrayAppend<
                TransferAbcAnimalsFieldValues,
                'animals'
              >
            }
            remove={animalsArray.remove}
            errors={errors}
            languageGB={languageGB}
            animalOptions={animalOptions}
            weightByAnimalUuid={weightByAnimalUuid}
            originBatchUuid={originBatchUuid}
            disabled={isDisabled}
          />
        </Box>

        {/* Financeiro — cabeçalho */}
        <Box
          mt={6}
          bg="bg.muted"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          p={4}
        >
          <Text fontSize="sm" fontWeight="semibold" mb={4}>
            {text.form.fields.financial.sectionTitle}
          </Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            <Input
              label={text.form.fields.financial.number}
              isRequired
              disabled={isDisabled}
              {...control.register('financial_number')}
              error={errors.financial_number?.message}
            />

            <Controller
              name="financial_type_title_uuid"
              control={control}
              render={({ field, fieldState }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.financial.typeTitle}
                  service={listTypeTitleOptions}
                  mapOptions={mapTypeTitleOption}
                  findParams={findParamsFromSearch}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={fieldState.error?.message}
                  isRequired
                  isDisabled={isDisabled}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <Controller
              name="financial_proprietary_uuid"
              control={control}
              render={({ field, fieldState }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.financial.proprietary}
                  service={listProprietaries}
                  mapOptions={(item: ProprietaryListItem) => ({
                    label: item.name,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    is_enabled: true,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={fieldState.error?.message}
                  isRequired
                  isDisabled={isDisabled}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <Controller
              name="financial_fiscal_document"
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  name={field.name}
                  label={text.form.fields.financial.fiscalDocument}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  options={booleanOptions.options(languageGB)}
                  error={fieldState.error?.message}
                  isRequired
                  isDisabled={isDisabled}
                />
              )}
            />

            <Controller
              name="financial_has_input"
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  name={field.name}
                  label={text.form.fields.financial.hasInput}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  options={booleanOptions.options(languageGB)}
                  error={fieldState.error?.message}
                  isRequired
                  isDisabled={isDisabled}
                />
              )}
            />

            {hasInput && (
              <>
                <Controller
                  name="financial_input_date"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={1}>
                        {text.form.fields.financial.inputDate}
                      </Text>
                      <DateInput
                        value={field.value ?? null}
                        onChange={field.onChange}
                        disabled={isDisabled}
                      />
                      {fieldState.error?.message && (
                        <Text fontSize="xs" color="fg.error" mt={1}>
                          {fieldState.error.message}
                        </Text>
                      )}
                    </Box>
                  )}
                />

                <Controller
                  name="financial_input_value"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MoneyInput
                      name={field.name}
                      label={text.form.fields.financial.inputValue}
                      value={field.value ?? null}
                      onValueChange={(value) => field.onChange(value)}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={isDisabled}
                    />
                  )}
                />
              </>
            )}
          </SimpleGrid>

          <Box mt={4}>
            <Textarea
              label={text.form.fields.financial.note}
              isRequired
              maxLength={200}
              disabled={isDisabled}
              {...control.register('financial_note')}
              error={errors.financial_note?.message}
            />
          </Box>
        </Box>

        {/* Parcelas */}
        <Box mt={6}>
          <TransferAbcInstallments
            control={control}
            fields={installmentsArray.fields}
            replace={
              installmentsArray.replace as unknown as UseFieldArrayReplace<
                TransferAbcInstallmentsFieldValues,
                'installments'
              >
            }
            vlTotal={vlTotal}
            hasInput={hasInput}
            inputDate={inputDate}
            inputValue={inputValue}
            errors={errors}
            languageGB={languageGB}
            disabled={isDisabled}
          />
        </Box>

        {/* Rateio (categorias financeiras) */}
        <Box mt={6}>
          <TransferAbcCategoriesAllocation
            control={control}
            fields={categoriesArray.fields}
            append={
              categoriesArray.append as unknown as UseFieldArrayAppend<
                TransferAbcCategoriesFieldValues,
                'categories'
              >
            }
            remove={categoriesArray.remove}
            setValue={setValue}
            vlTotal={vlTotal}
            transferType={transferType}
            errors={errors}
            languageGB={languageGB}
            disabled={isDisabled}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
