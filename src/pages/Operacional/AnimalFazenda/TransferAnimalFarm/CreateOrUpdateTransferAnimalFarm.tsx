// src/pages/Operacional/AnimalFazenda/TransferAnimalFarm/CreateOrUpdateTransferAnimalFarm.tsx
// -----------------------------------------------------------------------------
// Formulário de CRIAÇÃO de Transferência de Animal entre Fazendas
// (97-Esteiras/042, TASK-FE-042-104). Rota
// `/operacional/animal-fazenda/transferencias/novo`, guardada por
// `<RequirePermission permission="transfer_animal_farms_create">`.
// `POST /transfer-animal-farms` — payload EXATO de `TransferAnimalFarmRequest`
// (`date`/`farm_to_uuid`/`animal_uuids[]`); `employee_uuid`
// NÃO entra no payload — a API injeta o Responsável do usuário autenticado
// (FLD-005/006, mirror `CreateOrUpdateTransferBatchFarm.tsx`).
// `farm_from_id`/`status`/`user_id`/`code` NUNCA vão no payload (contexto
// server).
//
// Toggle "Gerar financeiro? Sim/Não": quando "Sim", exibe o MESMO bloco
// financeiro usado pela tela dedicada (TASK-105,
// `TransferAnimalFarmFinancialFieldsBlock.tsx`, reusado por import — NUNCA
// duplicado) e envia `generate_financial: true` + `financial` ATÔMICO no
// MESMO `POST` (payload atômico, mirror TASK-BE-041-LF-06 já replicado pela
// API desta feature).
//
// Diferença estrutural central vs. a irmã: onde `TransferBatchFarm` tem 1
// `SelectAsyncPaginate` de `batch_uuid`, esta tela tem o FILTRO
// `batch_uuid`/`category_filter_uuids[]` (FLD-008/009, não persistidos)
// alimentando o `AnimalCategorySelector` (§4.2.1), que produz `animal_uuids`
// (FLD-012, persistido). O legado NUNCA preenche `category_id` no `store()`
// — por isso NÃO existe campo "Categoria" persistido nesta tela (reprovação
// do dono, 063-est03-9-reprovacoes/Item A); o único campo de categoria é o
// FILTRO `category_filter_uuids` (mirror `categories[]` do legado) abaixo.
//
// Cascatas: `farm_to_uuid`/`date` → `check-date` (mirror IG-004/005 da
// irmã, SEM `batch_uuid` no check aqui — §4.2 do contrato-frontend). Trocar
// `batch_uuid`/`category_filter_uuids` LIMPA `animal_uuids` (mesma cascata
// documentada em `useCascadesWeaning`) e são filtros MUTUAMENTE EXCLUSIVOS
// (mirror da lição já registrada em `listBatchCandidateAnimals` — o backend
// trata como filtros alternativos, não cumulativos).
// -----------------------------------------------------------------------------

import { Alert, Box, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useAuth } from '@/hooks/useAuth';
import { useCurrentFarm } from '@/hooks/useCurrentFarm';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { todayLocalIso } from '@/utils/localDate';

import { boolean as booleanOptions } from '@/constants/options/boolean';
import { queryKey } from '@/constants/query-key';

import { transferAnimalFarmSchemaResolver } from '@/validations/schemas/Operacional/AnimalFazenda/transferAnimalFarm-schema';

import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import {
  checkTransferAnimalFarmDate,
  createTransferAnimalFarm,
} from '@/services/v2/Operacional/AnimalFazenda/transferAnimalFarm-service';

import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { BatchOption } from '@/@types/v2/Batches';
import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';
import type { FarmRef } from '@/@types/v2/Farms';
import type {
  CreateTransferAnimalFarmRequest,
  TransferAnimalFarmForm,
} from '@/@types/v2/Operacional/AnimalFazenda/transferAnimalFarm';

import { AnimalAggregatesPanel } from './AnimalAggregatesPanel';
import { AnimalCategorySelector } from './AnimalCategorySelector';
import {
  mapTransferAnimalFarmFinancialPayload,
  TransferAnimalFarmFinancialFieldsBlock,
} from './TransferAnimalFarmFinancialFieldsBlock';

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

function mapCategoryOption(item: CategoryAnimalOptionItem): Option<string> {
  return { label: item.label, value: item.uuid };
}

function mapBatchOption(item: BatchOption): Option<string> {
  return { label: item.label, value: item.uuid };
}

function mapFarmOption(item: FarmRef): Option<string> {
  return { label: item.description, value: item.uuid };
}

function todayIsoDate(): string {
  return todayLocalIso();
}

export default function CreateOrUpdateTransferAnimalFarm() {
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { data: currentFarm } = useCurrentFarm();
  const { user } = useAuth();
  const text = languageGB.animalFazenda.transferAnimalFarm;
  const header = text.form.fields.header;
  const selectorText = text.form.fields.animalSelector;

  const canSave = can('transfer_animal_farms_create');

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<TransferAnimalFarmForm>({
    mode: 'onChange',
    resolver: transferAnimalFarmSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      date: todayIsoDate(),
      farm_to_uuid: null,
      batch_uuid: null,
      category_filter_uuids: [],
      animal_uuids: [],
      has_financial: null,
      financial: {
        vl_total: 0,
        // DIV-07 (063-est03-9-reprovacoes) — default "Dedutível" = Sim.
        fiscal_document: booleanOptions.getOption(true, languageGB),
        proprietary_uuid: null,
        qtd_installments: null,
        first_installment_date: null,
        // DIV-09 (063-est03-9-reprovacoes) — default "intervalo de parcelas" = 30.
        int_installments: 30,
        installments: [],
        income_categories: [],
        expense_categories: [],
        // DIV-08 (063-est03-9-reprovacoes) — bloco "Possui entrada?" front-only
        // (mirror `CreateOrUpdateTransferBatchFarm.tsx`, mesma esteira/decisão).
        has_input: null,
        input_date: null,
        input_value: null,
      },
    },
  });

  const date = useWatch({ control, name: 'date' });
  const farmToOption = useWatch({ control, name: 'farm_to_uuid' });
  const farmToUuid = farmToOption?.value ?? null;
  const batchOption = useWatch({ control, name: 'batch_uuid' });
  const batchUuid = batchOption?.value ?? null;
  const categoryFilterOptions = useWatch({ control, name: 'category_filter_uuids' }) ?? [];
  const categoryFilterUuids = categoryFilterOptions.map((option) => option.value);
  const animalUuids = useWatch({ control, name: 'animal_uuids' }) ?? [];
  const hasFinancialOption = useWatch({ control, name: 'has_financial' });
  const showFinancialBlock = hasFinancialOption?.value === true;

  const installmentsArray = useFieldArray({ control, name: 'financial.installments' });
  const incomeArray = useFieldArray({ control, name: 'financial.income_categories' });
  const expenseArray = useFieldArray({ control, name: 'financial.expense_categories' });

  // Fazendas do tenant, exceto a fazenda ativa (mirror legado, filtro
  // CLIENTE — endpoint `farms/current-tenant` não pagina/filtra por id).
  async function listFarmToOptions(params: PaginationQueryParams & { search?: string }) {
    const farms = await listFarms();
    const search = (params.search ?? '').trim().toLowerCase();
    const filtered = farms
      .filter((farm) => farm.uuid !== currentFarm?.uuid)
      .filter((farm) => !search || farm.description.toLowerCase().includes(search));
    return {
      success: true,
      message: '',
      data: {
        items: filtered,
        pagination: {
          total: filtered.length,
          count: filtered.length,
          per_page: filtered.length,
          current_page: 1,
          total_pages: 1,
        },
      },
    };
  }

  // Options do filtro multi de categorias (FLD-009) — carregadas de uma vez
  // (sem paginação real, mirror `booleanOptions`/`transferAnimalFarmStatusOptions`).
  // DIV-01 (063-est03-9-reprovacoes) — `tenant_cost_center_scoped: true` escopa
  // o lookup pelos centros de custo do tenant (mirror legado
  // `ChangeAnimalFarmController::create()`), opt-in aditivo — API paralela
  // (TASK-API-063-01).
  const categoryOptionsQuery = useQuery({
    queryKey: [queryKey.categoryAnimals.categoryAnimalsList, 'options', 'tenant-cost-center'],
    queryFn: () => listCategoryAnimalOptions({ tenant_cost_center_scoped: true }),
  });
  const categoryFilterSelectOptions: Option<string>[] = (
    categoryOptionsQuery.data?.data?.items ?? []
  ).map(mapCategoryOption);

  // IG-004/005 — verificação de consistência de data vs. fazenda destino
  // (SEM `batch_uuid` no check-date desta feature, §4.2 do contrato-frontend
  // — diferente da irmã).
  const checkDateQuery = useQuery({
    queryKey: [queryKey.animalFazenda.transferAnimalFarm, 'check-date', date, farmToUuid],
    queryFn: () =>
      checkTransferAnimalFarmDate({
        date: date as string,
        farm_uuid: farmToUuid,
      }),
    enabled: !!date && !!farmToUuid,
  });
  const dateCheck = checkDateQuery.data?.data;
  const dateCheckMessages = [
    dateCheck?.checks.batch?.message,
    dateCheck?.checks.farm?.message,
  ].filter((message): message is string => !!message);

  // IG-008/009 — trocar o filtro (lote OU categorias) LIMPA a seleção de
  // animais anterior; os dois filtros são MUTUAMENTE EXCLUSIVOS (envia
  // SOMENTE um deles a `eligible-animals`).
  function handleBatchFilterChange(option: Option<string> | null) {
    setValue('batch_uuid', option, { shouldDirty: true });
    if (option) {
      setValue('category_filter_uuids', [], { shouldDirty: true });
    }
    setValue('animal_uuids', [], { shouldDirty: true });
  }

  function handleCategoryFilterChange(options: Option<string>[]) {
    setValue('category_filter_uuids', options, { shouldDirty: true });
    if (options.length > 0) {
      setValue('batch_uuid', null, { shouldDirty: true });
    }
    setValue('animal_uuids', [], { shouldDirty: true });
  }

  const transferAnimalFarmMutation = useRequest({
    asyncFunction: tryPersistTransferAnimalFarm,
    entityName: text.singularLabel,
    queryKey: queryKey.animalFazenda.transferAnimalFarms,
    typesRequest: 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistTransferAnimalFarm(data: TransferAnimalFarmForm) {
    const payload: CreateTransferAnimalFarmRequest = {
      date: data.date as string,
      farm_to_uuid: data.farm_to_uuid!.value,
      animal_uuids: data.animal_uuids,
    };

    // Payload atômico: `generate_financial`+`financial` no MESMO POST, nunca
    // uma 2ª chamada a `.../financial`. "Não"/`null` = `create` simples,
    // `financial` nem entra no payload.
    if (data.has_financial?.value === true && data.financial) {
      payload.generate_financial = true;
      payload.financial = mapTransferAnimalFarmFinancialPayload(data.financial);
    }

    return await createTransferAnimalFarm(payload);
  }

  async function onSubmit(data: TransferAnimalFarmForm) {
    await transferAnimalFarmMutation.mutateAsync(data);
  }

  const isDisabled = !canSave;
  const submitting = isSubmitting || transferAnimalFarmMutation.isPending;

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

          <InputReadOnly label={header.employee} value={user?.username ?? ''} />

          <Controller
            name="farm_to_uuid"
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={header.farmTo}
                service={listFarmToOptions}
                mapOptions={mapFarmOption}
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
            name="has_financial"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                name={field.name}
                label={header.hasFinancial}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                // DIV-04 (063-est03-9-reprovacoes) — ordem Não-primeiro,
                // variante ADITIVA (nunca inverter o catálogo global `options()`).
                options={booleanOptions.optionsReversed(languageGB)}
                error={fieldState.error?.message}
                isDisabled={isDisabled}
              />
            )}
          />
        </SimpleGrid>

        {dateCheckMessages.length > 0 && (
          <Alert.Root status="warning" borderRadius="md" mt={4}>
            <Alert.Indicator />
            <Alert.Content>
              {dateCheckMessages.map((message) => (
                <Alert.Title key={message}>{message}</Alert.Title>
              ))}
            </Alert.Content>
          </Alert.Root>
        )}

        <Box mt={6}>
          <Text fontSize="sm" fontWeight="semibold" mb={4}>
            {selectorText.aggregatesTitle}
          </Text>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mb={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {selectorText.batchFilter}
              </Text>
              <SelectAsyncPaginate
                name="batch_uuid"
                service={listBatchOptionsForForm}
                mapOptions={mapBatchOption}
                findParams={findParamsFromSearch}
                value={batchOption ?? null}
                onChange={(option: any) => handleBatchFilterChange(option ?? null)}
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </Box>

            <Select
              name="category_filter_uuids"
              label={selectorText.categoryFilter}
              tooltip={text.form.hints.categoryFilterHelp}
              value={categoryFilterOptions}
              onChange={(options: any) => handleCategoryFilterChange(options ?? [])}
              options={categoryFilterSelectOptions}
              multiple
              isDisabled={isDisabled}
            />
          </SimpleGrid>

          <AnimalCategorySelector
            batchUuid={batchUuid}
            categoryFilterUuids={categoryFilterUuids}
            value={animalUuids}
            onChange={(value) => setValue('animal_uuids', value, { shouldDirty: true })}
            disabled={isDisabled}
          />
          {errors.animal_uuids?.message && (
            <Text fontSize="xs" color="fg.error" mt={2}>
              {errors.animal_uuids.message as string}
            </Text>
          )}

          <Box mt={6}>
            <AnimalAggregatesPanel animalUuids={animalUuids} />
          </Box>
        </Box>

        {showFinancialBlock && (
          <Box mt={6}>
            <TransferAnimalFarmFinancialFieldsBlock
              control={control}
              errors={errors}
              languageGB={languageGB}
              isDisabled={isDisabled}
              setValue={setValue}
              namePrefix="financial."
              installmentsArray={installmentsArray}
              incomeArray={incomeArray}
              expenseArray={expenseArray}
            />
          </Box>
        )}
      </Form>
    </FormContainer>
  );
}
