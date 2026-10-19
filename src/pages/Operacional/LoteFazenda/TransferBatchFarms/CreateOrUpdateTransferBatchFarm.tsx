// src/pages/Operacional/LoteFazenda/TransferBatchFarms/CreateOrUpdateTransferBatchFarm.tsx
// -----------------------------------------------------------------------------
// Formulário de CRIAÇÃO de Transferência de Lote entre Fazendas (SCR-CREATE,
// 97-Esteiras/041, TASK-FE-041-LF-01). Rota
// `/operacional/lote-fazenda/transferencias/novo`, guardada por
// `<RequirePermission permission="transfer_batch_farms_create">`.
// `POST /transfer-batch-farms` — payload EXATO de `TransferBatchFarmRequest`
// (`date`/`batch_uuid`/`farm_to_uuid`/`category_uuid`); `employee_uuid` NÃO
// entra mais no payload — a API injeta o `Responsável` do usuário autenticado
// (TASK-FE-041-LF-05, mirror `CreateOrUpdateRainfall.tsx`, campo `user`
// readonly). `farm_from_id`/`status`/`user_id`/`code` NUNCA vão no payload
// (contexto server).
//
// Toggle "Gerar financeiro? Sim/Não" (TASK-FE-041-LF-06, commit backend
// `2d8bc411`): quando "Sim", exibe o MESMO bloco financeiro da tela `SCR-FIN`
// (`TransferBatchFarmFinancialFieldsBlock.tsx`, reusado por import — NUNCA
// duplicado) e envia `generate_financial: true` + `financial` ATÔMICO no
// MESMO `POST /transfer-batch-farms` (`TransferBatchFarmRequest::rules()`
// aceita o bloco condicional via trait `HasTransferBatchFarmFinancialRules`).
// Quando "Não" (default), `create` simples — comportamento LF-01/05
// intocado. `SCR-FIN` standalone continua existindo para gerar financeiro
// DEPOIS (ACT-11). Decisão de fidelidade histórica em
// `transferBatchFarm-schema.ts`.
//
// Cascatas (INT-01..07, `plano-front-lote-fazenda.md §4 SCR-CREATE`):
//  - `category_uuid` → filtra as opções de `batch_uuid` (`eligible-batches`).
//  - `batch_uuid` → dispara `eligible-animals` (CAL-03, preview de contagem)
//    + `check-date`.
//  - `farm_to_uuid` → dispara `check-date`.
//  - `date` → dispara `check-date` quando `batch_uuid`/`farm_to_uuid` já
//    selecionados.
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

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

import { transferBatchFarmSchemaResolver } from '@/validations/schemas/LoteFazenda/transferBatchFarm-schema';

import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import {
  checkTransferBatchFarmDate,
  createTransferBatchFarm,
  listEligibleAnimalsForTransferBatchFarm,
  listEligibleBatchesForTransferBatchFarm,
} from '@/services/v2/LoteFazenda/transferBatchFarm-service';

import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';
import type { FarmRef } from '@/@types/v2/Farms';
import type {
  CreateTransferBatchFarmRequest,
  TransferBatchFarmForm,
  TransferBatchFarmRefOption,
} from '@/@types/v2/LoteFazenda/transferBatchFarm';

import { TransferBatchFarmEligibleAnimalsPreview } from './TransferBatchFarmEligibleAnimalsPreview';
import {
  mapTransferBatchFarmFinancialPayload,
  TransferBatchFarmFinancialFieldsBlock,
} from './TransferBatchFarmFinancialFieldsBlock';

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

// `findCategoryParams` — DEDICADA ao Select de Categoria (063-est03-9-
// reprovacoes, TASK-FE-063-13/QA2 item 1). NÃO reusar `findParamsFromSearch`
// acima: ela é COMPARTILHADA com o Select "Fazenda destino"
// (`listFarmToOptions`, serviço DIFERENTE) — adicionar `is_enabled`/
// `tenant_cost_center_scoped` ali contaminaria esse outro Select, que não
// aceita/não deve receber esses parâmetros.
// `tenant_cost_center_scoped: true` (QA2, decisão do dono) — escopa
// `CategoryAnimal` pelos centros de custo do tenant, mirror da tela irmã
// `TransferAnimalFarm` (`CreateOrUpdateTransferAnimalFarm.tsx`). Diverge
// deliberadamente do legado (lista ampla cross-espécie); combinável com
// `is_enabled` (modo COMBINADO já suportado pelo endpoint/serviço).
const findCategoryParams = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
  is_enabled: true,
  tenant_cost_center_scoped: true,
});

function mapCategoryOption(item: CategoryAnimalOptionItem): Option<string> {
  return { label: item.label, value: item.uuid };
}

function mapBatchOption(item: TransferBatchFarmRefOption): Option<string> {
  return { label: item.label, value: item.uuid };
}

function mapFarmOption(item: FarmRef): Option<string> {
  return { label: item.description, value: item.uuid };
}

function todayIsoDate(): string {
  return todayLocalIso();
}

export default function CreateOrUpdateTransferBatchFarm() {
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { data: currentFarm } = useCurrentFarm();
  const { user } = useAuth();
  const text = languageGB.loteFazenda.transferBatchFarm;
  const header = text.form.fields.header;

  const canSave = can('transfer_batch_farms_create');

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<TransferBatchFarmForm>({
    mode: 'onChange',
    resolver: transferBatchFarmSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      date: todayIsoDate(),
      category_uuid: null,
      batch_uuid: null,
      farm_to_uuid: null,
      // Item 8 (reprovação AD F-022) — "Não" pré-selecionado (não em branco).
      has_financial: booleanOptions.getOption(false, languageGB),
      financial: {
        vl_total: 0,
        // Item 6 (reprovação AD F-022) — default "Dedutível" = Sim (mirror
        // legado `fiscal_document` select 0/1, default 1).
        fiscal_document: booleanOptions.getOption(true, languageGB),
        proprietary_uuid: null,
        qtd_installments: null,
        first_installment_date: null,
        int_installments: null,
        installments: [],
        income_categories: [],
        expense_categories: [],
        // Item 4 (reprovação AD F-022) — bloco "Possui entrada?" front-only
        // (mirror `transfer_form.blade.php`, nunca vai ao payload).
        has_input: null,
        input_date: null,
        input_value: null,
      },
    },
  });

  const date = useWatch({ control, name: 'date' });
  const categoryOption = useWatch({ control, name: 'category_uuid' });
  const categoryUuid = categoryOption?.value ?? null;
  const batchOption = useWatch({ control, name: 'batch_uuid' });
  const batchUuid = batchOption?.value ?? null;
  const farmToOption = useWatch({ control, name: 'farm_to_uuid' });
  const farmToUuid = farmToOption?.value ?? null;
  const hasFinancialOption = useWatch({ control, name: 'has_financial' });
  const showFinancialBlock = hasFinancialOption?.value === true;

  // `installments`/`income_categories`/`expense_categories` embutidos em
  // `financial.*` (TASK-FE-041-LF-06) — mirror EXATO de `SCR-FIN`
  // (`TransferBatchFarmFinancial.tsx`), só que aninhados sob o form único
  // de criação (schema `financial: yup.object().when('has_financial', ...)`).
  const installmentsArray = useFieldArray({ control, name: 'financial.installments' });
  const incomeArray = useFieldArray({ control, name: 'financial.income_categories' });
  const expenseArray = useFieldArray({ control, name: 'financial.expense_categories' });

  // Fazendas do tenant, exceto a fazenda ativa (mirror legado
  // `ChangeBatchFarmController::create()`: `Farm::where('tenant_id',
  // ...)->where('id', '!=', session('farm')['id'])`) — filtro CLIENTE
  // (endpoint `farms/current-tenant` não pagina/filtra por id).
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

  // CAL-03 — contagem de animais elegíveis do lote selecionado (preview,
  // NUNCA a coleção que efetivamente move no `receive`/`prepare` — DIV-04/05
  // do doc-bruta, ver docblock de `TransferBatchFarmEligibleAnimalsByCategory`).
  const eligibleAnimalsQuery = useQuery({
    queryKey: [queryKey.loteFazenda.eligibleAnimals, batchUuid],
    queryFn: () => listEligibleAnimalsForTransferBatchFarm(batchUuid as string),
    enabled: !!batchUuid,
  });
  const eligibleAnimalsCount = useMemo(() => {
    const byCategory = eligibleAnimalsQuery.data?.data ?? {};
    return Object.values(byCategory).reduce((sum, animals) => sum + animals.length, 0);
  }, [eligibleAnimalsQuery.data]);

  // INT-01/04/05/06 — verificação de consistência de data (batch/fazenda
  // destino), dispara sempre que qualquer um dos 3 valores muda.
  const checkDateQuery = useQuery({
    queryKey: [queryKey.loteFazenda.transferBatchFarm, 'check-date', date, batchUuid, farmToUuid],
    queryFn: () =>
      checkTransferBatchFarmDate({
        date: date as string,
        batch_uuid: batchUuid,
        farm_uuid: farmToUuid,
      }),
    enabled: !!date && (!!batchUuid || !!farmToUuid),
  });
  const dateCheck = checkDateQuery.data?.data;
  const dateCheckMessages = [
    dateCheck?.checks.batch?.message,
    dateCheck?.checks.farm?.message,
  ].filter((message): message is string => !!message);

  const transferBatchFarmMutation = useRequest({
    asyncFunction: tryPersistTransferBatchFarm,
    entityName: text.singularLabel,
    queryKey: queryKey.loteFazenda.transferBatchFarms,
    typesRequest: 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistTransferBatchFarm(data: TransferBatchFarmForm) {
    const payload: CreateTransferBatchFarmRequest = {
      date: data.date as string,
      batch_uuid: data.batch_uuid!.value,
      farm_to_uuid: data.farm_to_uuid!.value,
      category_uuid: data.category_uuid?.value ?? undefined,
    };

    // Atômico (TASK-FE-041-LF-06): `generate_financial`+`financial` no MESMO
    // POST — nunca uma 2ª chamada a `.../financial` (perderia a transação
    // compartilhada do backend). "Não"/`null` = comportamento LF-01/05
    // intocado, `financial` nem entra no payload.
    if (data.has_financial?.value === true && data.financial) {
      payload.generate_financial = true;
      payload.financial = mapTransferBatchFarmFinancialPayload(data.financial);
    }

    return await createTransferBatchFarm(payload);
  }

  async function onSubmit(data: TransferBatchFarmForm) {
    await transferBatchFarmMutation.mutateAsync(data);
  }

  const isDisabled = !canSave;
  const submitting = isSubmitting || transferBatchFarmMutation.isPending;

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
            name="category_uuid"
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={header.category}
                tooltip={text.form.hints.batchHelp}
                service={listCategoryAnimalOptions}
                mapOptions={mapCategoryOption}
                findParams={findCategoryParams}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={fieldState.error?.message}
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="batch_uuid"
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={header.batch}
                service={listEligibleBatchesForTransferBatchFarm}
                mapOptions={mapBatchOption}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  category_uuid: categoryUuid,
                })}
                cacheUniqs={[categoryUuid]}
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
                // Item 8 (reprovação AD F-022) — ordem Não-primeiro, variante
                // ADITIVA (nunca inverter o catálogo global `options()`).
                options={booleanOptions.optionsReversed(languageGB)}
                error={fieldState.error?.message}
                isDisabled={isDisabled}
              />
            )}
          />
        </SimpleGrid>

        {!!batchUuid && (
          <>
            <Text mt={4} fontSize="sm" color="fg.muted">
              {eligibleAnimalsCount} {text.form.animalsCountLabel}
            </Text>
            {/* QA2 item 2 — animais separados por categoria (fiel ao legado,
                a API já devolve o agrupamento; ver componente para detalhe). */}
            <TransferBatchFarmEligibleAnimalsPreview
              byCategory={eligibleAnimalsQuery.data?.data ?? {}}
            />
          </>
        )}

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

        {showFinancialBlock && (
          <Box mt={6}>
            <TransferBatchFarmFinancialFieldsBlock
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
