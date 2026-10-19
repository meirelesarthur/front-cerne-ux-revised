// src/pages/Administrativo/FarmTransfer/CreateFarmTransfer.tsx
// -----------------------------------------------------------------------------
// Formulário de CRIAÇÃO (lote) de Trans. Fazendas (FarmTransfer — Estoque,
// Tarefas 02/03). Rota `/administrativo/transf-fazendas/novo`, guardada por
// `<RequirePermission permission="warehouse-transfer-farm_create">`.
// `POST /farm-transfers` em lote (`items[]`, 1 `code` gerado no servidor) +
// subfluxo financeiro opcional (`has_financial`).
//
// Mirror ESTRUTURAL DIRETO de `CreateWarehouseTransfer.tsx`
// (`FormContainer` fullHeight+footer, `useFieldArray` no pai para `items`,
// `useRequest` para o submit), acrescido da cascata NOVA "fazenda destino →
// armazém destino" (`GAP-FARMTRANSFER-FE-02`) e do subfluxo financeiro
// (`GAP-FARMTRANSFER-FE-03`).
//
// Cascata `destination_farm_id` (Option, client-only, `GAP-FARMTRANSFER-FE-02`)
// → `destination_warehouse_id`: fonte = `listFarms()` (`GET
// /farms/current-tenant`, `src/services/v2/Farms/farm-service.ts`, já
// reaproveitado noutras telas) — correção pós-entrega: `useMyFarms()` (`GET
// /me/farms`) trazia fazendas de QUALQUER tenant do usuário autenticado
// (perfil multi-tenant), permitindo escolher no select uma fazenda de OUTRO
// tenant que a busca de armazéns já rejeitava com 422 (validação de
// backend correta, mantida como defesa em profundidade — o achado era só a
// UI oferecer uma opção fadada a falhar). `/farms/current-tenant` já
// devolve SÓ as fazendas do tenant CORRENTE, filtrada client-side para
// EXCLUIR a fazenda ATIVA (`AuthContext.activeFarmUuid`, mesmo contexto que
// já alimenta o header `X-Farm-Id`). Ao trocar a fazenda destino, dispara
// `GET /warehouses/options?farm_uuid=` (extensão aditiva de
// `warehouse-service.ts`) para popular o Select "Armazém Destino" — se a
// fazenda escolhida não tiver armazéns ativos, o campo trava vazio SEM
// mensagem de erro (mirror `CL-21`, preservado).
//
// `origin_warehouse_id` (Armazém origem) segue 100% o idioma do irmão:
// filtro CLIENT-ONLY compartilhado por TODAS as linhas de `items`
// (`DA-WT-12`), trocar limpa os VALORES das linhas já adicionadas
// preservando o length do array (`replace()`, nunca `remove()+append()`).
//
// Subfluxo financeiro (Tarefa 03) — `has_financial` desligado: nenhum
// campo financeiro é renderizado nem enviado (payload idêntico ao da
// Tarefa 02, regressão zero). Ligado: exige `vl_total` + rateio Income
// (origem) + rateio Expense (destino), cada um fechando 100%/`vl_total`
// (Yup `.test()`, tolerância `0.01`) + parcelas fechando o mesmo total.
// `income_category_percent`/`expense_category_percent` são CALCULADOS no
// submit (nunca vivem no RHF, mirror `MovementAllocationEditor`) — a API
// os recebe por fidelidade de payload mas nunca os lê na persistência.
// -----------------------------------------------------------------------------

import { useCallback, useMemo } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useContextSelector } from 'use-context-selector';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { SelectCombobox } from '@/components/Form/SelectCombobox';
import { FormContainer } from '@/components/Layout/FormContainer';

import { AuthContext } from '@/contexts/AuthContext';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import formatDate from '@/utils/formatDate';
import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { farmTransferCreateSchemaResolver } from '@/validations/schemas/FarmTransfers/farm-transfer-create-schema';

import { listFarms } from '@/services/v2/Farms/farm-service';
import {
  createFarmTransfer,
  listFarmTransfers,
} from '@/services/v2/FarmTransfers/farm-transfer-service';
import { listWarehouseOptions, listWarehouses } from '@/services/v2/Warehouses/warehouse-service';
import type { ListWarehouseOptionsParams } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { FarmRef } from '@/@types/v2/Farms';
import type {
  CreateFarmTransferPayload,
  FarmTransferCreateForm,
  FarmTransferItemForm,
} from '@/@types/v2/FarmTransfers';
import type { WarehouseListItem, WarehouseOption } from '@/@types/v2/Warehouses';

import { FarmTransferExpenseAllocation } from './FarmTransferExpenseAllocation';
import { FarmTransferFinancialSection } from './FarmTransferFinancialSection';
import { FarmTransferIncomeAllocation } from './FarmTransferIncomeAllocation';
import { FarmTransferInstallments } from './FarmTransferInstallments';
import { FarmTransferItemsEditor } from './FarmTransferItemsEditor';

import type { FarmTransferExpenseAllocationFieldValues } from './FarmTransferExpenseAllocation';
import type { FarmTransferAllocationFieldValues } from './FarmTransferIncomeAllocation';
import type { FarmTransferInstallmentsFieldValues } from './FarmTransferInstallments';
import type { FarmTransferItemsFieldValues } from './FarmTransferItemsEditor';
import type { UseFieldArrayAppend } from 'react-hook-form';

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

function mapWarehouseOption(item: WarehouseListItem) {
  return { label: `${item.initials} — ${item.description}`, value: item.uuid };
}

function mapWarehouseOptionLookup(item: WarehouseOption) {
  return { label: `${item.initials} — ${item.description}`, value: item.uuid };
}

function mapFarmOption(farm: FarmRef): Option<string> {
  return { label: farm.description, value: farm.uuid };
}

function emptyItem(): FarmTransferItemForm {
  return {
    stock_id: null,
    measurement: '',
    stock_quantity: 0,
    quantity: '',
    value: 0,
    amount: 0,
    cost_center_id: null,
  };
}

export default function CreateFarmTransfer() {
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();
  const text = languageGB.farmTransfers.farmTransfer;
  const header = text.form.fields.header;

  const canSave = can('warehouse-transfer-farm_create');

  // Fonte do select "Fazenda destino" (`GAP-FARMTRANSFER-FE-02`, correção
  // pós-entrega): `listFarms()` (`GET /farms/current-tenant`) em vez de
  // `useMyFarms()` (`GET /me/farms`) — `/me/farms` devolve TODAS as fazendas
  // do usuário autenticado em QUALQUER tenant (usuário multi-tenant, ex.
  // suporte/admin, via `Gestor_Plataf`), permitindo escolher no select uma
  // fazenda de OUTRO tenant que `GET /warehouses/options?farm_uuid=` rejeita
  // com 422 (`Rule::exists('farms','uuid')->where('tenant_id', ...)`,
  // decisão de tenancy já fechada e correta). `/farms/current-tenant` já
  // devolve SÓ as fazendas do tenant CORRENTE (contexto `X-Farm-Id`) —
  // elimina o erro na origem, sem tirar a validação de backend como defesa
  // em profundidade. Mesmo shape (`FarmRef[]`) de `useMyFarms()`, mesmo
  // `queryKey.farms.list` já usado por este service noutras telas
  // (`useIssuers.tsx`/`useAccounts.tsx`/`StepProprietario.tsx`). Filtro
  // client-side continua excluindo a fazenda ATIVA (mesmo contexto do
  // `X-Farm-Id`).
  const activeFarmUuid = useContextSelector(AuthContext, (ctx) => ctx.activeFarmUuid);
  const { data: myFarms = [] } = useQuery({
    queryKey: [queryKey.farms.list],
    queryFn: listFarms,
  });
  const destinationFarmOptions = useMemo(
    () => myFarms.filter((farm) => farm.uuid !== activeFarmUuid).map(mapFarmOption),
    [myFarms, activeFarmUuid]
  );

  // "Fazenda (origem)" — correção pós-entrega (achado do dono): campo NOVO,
  // readonly, mostrando o nome da fazenda ATIVA (mesma fonte já usada acima
  // para excluir a fazenda ativa das opções de destino).
  const originFarm = useMemo(
    () => myFarms.find((farm) => farm.uuid === activeFarmUuid) ?? null,
    [myFarms, activeFarmUuid]
  );

  // Prévia do próximo `code` (simplificação pedida pelo dono, 97-Esteiras/002
  // `GAP-RS-10`): o endpoint dedicado `next-code` foi removido — o Front
  // agora calcula a prévia a partir da própria listagem já paginada (página
  // 1, 1 item, mais recente primeiro, já escopada pela fazenda ATIVA via
  // `X-Farm-Id`), MESMO padrão já correto usado por `store()`
  // (`nextSequentialCodeBetweenFarms`, por fazenda). Sem histórico → "0001".
  // Falha na consulta → mantém "—" (fallback, não quebra o formulário).
  const nextCodePreviewQuery = useQuery({
    queryKey: [queryKey.farmTransfers.farmTransfers, 'next-code-preview'],
    queryFn: () => listFarmTransfers({ page: 1, per_page: 1 }),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const nextCode = useMemo(() => {
    if (nextCodePreviewQuery.isError) return '—';

    const topCode = nextCodePreviewQuery.data?.data.items[0]?.code;
    if (!topCode) return '0001';

    return String(parseInt(topCode, 10) + 1).padStart(4, '0');
  }, [nextCodePreviewQuery.data, nextCodePreviewQuery.isError]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<FarmTransferCreateForm>({
    mode: 'onChange',
    resolver: farmTransferCreateSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      date: todayLocalIso(),
      origin_warehouse_id: null,
      destination_farm_id: null,
      destination_warehouse_id: null,
      items: [],
      has_financial: false,
      vl_total: null,
      income_allocations: [],
      expense_allocations: [],
      installments: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'items' });
  const incomeAllocationsArray = useFieldArray({ control, name: 'income_allocations' });
  const expenseAllocationsArray = useFieldArray({ control, name: 'expense_allocations' });
  const installmentsArray = useFieldArray({ control, name: 'installments' });

  const originWarehouseOption = watch('origin_warehouse_id');
  const originWarehouseUuid = originWarehouseOption?.value ?? null;

  const destinationFarmOption = watch('destination_farm_id');
  const destinationFarmUuid = destinationFarmOption?.value ?? null;

  const hasFinancial = watch('has_financial');
  const vlTotalValue = Number(watch('vl_total')) || 0;

  // Troca do Armazém (origem) — mirror EXATO `CreateWarehouseTransfer.tsx`:
  // limpa os VALORES das linhas já adicionadas (produto/unidade/estoque/
  // quantidade/valor/total) SEM remover as linhas (`replace()` preserva o
  // length do array).
  function handleOriginWarehouseChange(option: Option<string> | null) {
    const previousUuid = originWarehouseUuid;
    setValue('origin_warehouse_id', option ?? null, { shouldDirty: true });

    if ((option?.value ?? null) === previousUuid) return;

    const currentItems = watch('items');
    if (currentItems.length > 0) {
      replace(currentItems.map(() => emptyItem()));
    }
  }

  // Troca da Fazenda destino (`GAP-FARMTRANSFER-FE-02`) — cascata para
  // `destination_warehouse_id`. Ao trocar de fazenda, o armazém destino já
  // escolhido deixa de ser válido para o novo universo — limpa o campo
  // (mirror do racional já aplicado no irmão para `origin_warehouse_id`).
  function handleDestinationFarmChange(option: Option<string> | null) {
    const previousUuid = destinationFarmUuid;
    setValue('destination_farm_id', option ?? null, { shouldDirty: true });

    if ((option?.value ?? null) !== previousUuid) {
      setValue('destination_warehouse_id', null, { shouldDirty: true });
    }
  }

  // `listWarehouseOptions({ farm_uuid })` — extensão aditiva de
  // `warehouse-service.ts` (Tarefa 02). `cacheUniqs` força o
  // `AsyncPaginate` a descartar o cache de opções quando a fazenda destino
  // muda (mesmo mecanismo de `originWarehouseUuid` no editor de itens).
  const listDestinationWarehouseOptions = useCallback(
    async (params: ListWarehouseOptionsParams) =>
      listWarehouseOptions({ ...params, farm_uuid: destinationFarmUuid ?? undefined }),
    [destinationFarmUuid]
  );

  const farmTransferMutation = useRequest({
    asyncFunction: tryPersistFarmTransfer,
    entityName: text.singularLabel,
    queryKey: queryKey.farmTransfers.farmTransfer,
    queryKey2: queryKey.farmTransfers.farmTransfers,
    typesRequest: 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Wrapper nomeado (Lei 3) — payload de criação em lote + subfluxo
  // financeiro opcional. `origin_warehouse_id`/`destination_farm_id`/`value`/
  // `stock_quantity`/`measurement` NUNCA entram (client-only).
  async function tryPersistFarmTransfer(data: FarmTransferCreateForm) {
    const payload: CreateFarmTransferPayload = {
      date: data.date,
      destination_warehouse_uuid: data.destination_warehouse_id!.value,
      items: data.items.map((item) => ({
        stock_uuid: item.stock_id!.value,
        quantity: Number(item.quantity),
        amount: Number(item.amount),
        cost_center_uuid: item.cost_center_id?.value ?? undefined,
      })),
    };

    if (data.has_financial) {
      const vlTotal = Number(data.vl_total) || 0;
      // `*_category_percent` — CALCULADO aqui (nunca vive no RHF, mirror
      // `MovementAllocationEditor`). Enviado por fidelidade de payload ao
      // legado (`FarmTransferRequest`: `required_if:has_financial,true`),
      // ainda que nunca lido na persistência (`GAP-FARMTRANSFER-02` Opção B).
      const toPercent = (value: number) =>
        vlTotal > 0 ? Number(((value / vlTotal) * 100).toFixed(4)) : 0;

      payload.has_financial = true;
      payload.vl_total = vlTotal;
      payload.income_categories = data.income_allocations.map((row) => row.category_uuid!.value);
      payload.income_centers = data.income_allocations.map((row) => row.center_uuid!.value);
      payload.income_category_values = data.income_allocations.map((row) => Number(row.value) || 0);
      payload.income_category_percent = data.income_allocations.map((row) =>
        toPercent(Number(row.value) || 0)
      );
      payload.expense_categories = data.expense_allocations.map((row) => row.category_uuid!.value);
      payload.expense_centers = data.expense_allocations.map((row) => row.center_uuid!.value);
      payload.expense_category_values = data.expense_allocations.map(
        (row) => Number(row.value) || 0
      );
      payload.expense_category_percent = data.expense_allocations.map((row) =>
        toPercent(Number(row.value) || 0)
      );
      payload.date_installments = data.installments.map((row) => row.date as string);
      payload.value_installments = data.installments.map((row) => Number(row.value) || 0);
    }

    return await createFarmTransfer(payload);
  }

  // Tela de CRIAÇÃO pura — SEM guard de `dirtyFields` (`items.min(1)` do
  // schema já impede submeter lote vazio).
  async function onSubmit(data: FarmTransferCreateForm) {
    await farmTransferMutation.mutateAsync(data);
  }

  const isSubmitting = farmTransferMutation.isPending;

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
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* Cabeçalho — correção pós-entrega (achados do dono em teste manual):
            code → user (Responsável) → date (BLOQUEADA, readonly) →
            Fazenda (origem, readonly, NOVO) → Fazenda (destino) →
            Armazém (origem) → Armazém (destino), nessa ordem exata pedida
            pelo dono. `type` (decorativo, sempre "Transferência") não fazia
            parte da reclamação de ordem — mantido, deslocado para o fim do
            cabeçalho. */}
        <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
          <InputReadOnly
            name="code"
            label={header.code}
            value={nextCode}
            loading={nextCodePreviewQuery.isLoading}
          />

          <InputReadOnly label={header.user} value={authUser?.username ?? '—'} />

          {/* `date` — BLOQUEADA (achado do dono): sempre a data de hoje,
              sem possibilidade de edição. Continua indo ao payload via
              `defaultValues` (nunca houve `register`/input editável ligado
              a este campo). */}
          <InputReadOnly label={header.date} value={formatDate(watch('date'))} />

          {/* "Fazenda (origem)" — NOVO (achado do dono): antes implícita
              (fazenda ativa da sessão/`X-Farm-Id`), agora exibida
              explicitamente, readonly. Mesma fonte de `destinationFarmOptions`
              acima (`listFarms()` + `activeFarmUuid`). */}
          <InputReadOnly label={header.originFarm} value={originFarm?.description ?? '—'} />

          {/* `destination_farm_id` — NOVO vs. o irmão (`GAP-FARMTRANSFER-FE-02`),
              CLIENT-ONLY (nunca vai ao payload — a fazenda de destino é
              sempre DERIVADA de `destination_warehouse_uuid` no servidor).
              Fonte: `listFarms()` (`GET /farms/current-tenant`, tenant-scoped
              — correção pós-entrega, ver nota de cabeçalho) filtrado da
              fazenda ATIVA — coleção JÁ CARREGADA (não paginada), por isso
              `SelectCombobox` (busca client-side), NUNCA `SelectAsyncPaginate`
              (achado do dono: buscar num `SelectAsyncPaginate` contra
              endpoint não-paginado só filtraria a 1ª página já carregada,
              enganoso — mesmo precedente de correção do ERRO-02 de
              Autorizadores). */}
          <Controller
            name="destination_farm_id"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectCombobox
                name={field.name}
                label={header.destinationFarm}
                tooltip={text.form.hints.destinationFarmHelp}
                options={destinationFarmOptions}
                value={field.value ?? null}
                onChange={(option) => handleDestinationFarmChange(option)}
                error={error?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          {/* `origin_warehouse_id` — CLIENT-ONLY (`DA-WT-12`), NUNCA vai ao
              payload. Compartilhado por TODAS as linhas do editor de
              itens. */}
          <Controller
            name="origin_warehouse_id"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={header.originWarehouse}
                tooltip={text.form.hints.originWarehouseHelp}
                service={listWarehouses}
                mapOptions={mapWarehouseOption}
                findParams={findParamsFromSearch}
                value={field.value ?? null}
                onChange={handleOriginWarehouseChange as any}
                error={error?.message}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                isRequired
                isDisabled={!canSave}
              />
            )}
          />

          {/* `destination_warehouse_id` — vira `destination_warehouse_uuid`
              no payload. Cascata: `GET /warehouses/options?farm_uuid=`
              (extensão aditiva). Sem armazéns ativos na fazenda escolhida:
              trava vazio SEM erro (mirror `CL-21`). */}
          <Controller
            name="destination_warehouse_id"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={header.destinationWarehouse}
                service={listDestinationWarehouseOptions}
                mapOptions={mapWarehouseOptionLookup}
                findParams={findParamsFromSearch}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                cacheUniqs={[destinationFarmUuid]}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                isRequired
                isDisabled={!canSave || !destinationFarmUuid}
              />
            )}
          />

          <InputReadOnly label={header.type} value={header.typeValue} />
        </SimpleGrid>

        {/* Editor de itens dinâmico — `useFieldArray` vive AQUI (pai). */}
        <Box mt={6}>
          <FarmTransferItemsEditor
            control={control}
            fields={fields}
            append={append as unknown as UseFieldArrayAppend<FarmTransferItemsFieldValues, 'items'>}
            remove={remove}
            errors={errors}
            languageGB={languageGB}
            originWarehouseUuid={originWarehouseUuid}
            disabled={!canSave}
          />
        </Box>

        {/* Subfluxo financeiro opcional (Tarefa 03, `GAP-FARMTRANSFER-FE-03`)
            — desligado: nenhum campo renderizado/enviado (payload idêntico
            à Tarefa 02). Ligado: `vl_total` + 2 blocos de rateio + parcelas. */}
        <Box mt={6}>
          <FarmTransferFinancialSection
            control={control}
            hasFinancial={!!hasFinancial}
            errors={errors}
            languageGB={languageGB}
            disabled={!canSave}
          />
        </Box>

        {hasFinancial && (
          <>
            <Box mt={6}>
              <FarmTransferIncomeAllocation
                control={control}
                fields={incomeAllocationsArray.fields}
                append={
                  incomeAllocationsArray.append as unknown as UseFieldArrayAppend<
                    FarmTransferAllocationFieldValues,
                    'income_allocations'
                  >
                }
                remove={incomeAllocationsArray.remove}
                setValue={setValue}
                vlTotal={vlTotalValue}
                errors={errors}
                languageGB={languageGB}
                disabled={!canSave}
              />
            </Box>

            <Box mt={6}>
              <FarmTransferExpenseAllocation
                control={control}
                fields={expenseAllocationsArray.fields}
                append={
                  expenseAllocationsArray.append as unknown as UseFieldArrayAppend<
                    FarmTransferExpenseAllocationFieldValues,
                    'expense_allocations'
                  >
                }
                remove={expenseAllocationsArray.remove}
                setValue={setValue}
                vlTotal={vlTotalValue}
                errors={errors}
                languageGB={languageGB}
                disabled={!canSave}
              />
            </Box>

            <Box mt={6}>
              <FarmTransferInstallments
                control={control}
                fields={installmentsArray.fields}
                append={
                  installmentsArray.append as unknown as UseFieldArrayAppend<
                    FarmTransferInstallmentsFieldValues,
                    'installments'
                  >
                }
                remove={installmentsArray.remove}
                vlTotal={vlTotalValue}
                errors={errors}
                languageGB={languageGB}
                disabled={!canSave}
              />
            </Box>
          </>
        )}
      </Form>
    </FormContainer>
  );
}
