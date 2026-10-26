// src/pages/Administrativo/WarehouseTransfer/UpdateWarehouseTransfer.tsx
// -----------------------------------------------------------------------------
// Formulário de EDIÇÃO de UMA linha de Trans. Armazém (WarehouseTransfer —
// Estoque, TASK-WT-FE-04). Rota `/administrativo/transf-armazens/:uuid`,
// guardada por `<RequirePermission permission="warehouse-transfer_view">`
// (a ROTA é gated por `_view`; o botão de submit dentro do form é quem checa
// `_edit` — mirror `FoodBeat`/`Food`). Dobra como tela de VISUALIZAÇÃO — sem
// tela de "show" separada (decisão de arquitetura desta Tarefa, ver ficha:
// nenhuma tela `*transfer*`/`*transferencia*` de leitura pedida no escopo).
//
// `GET`/`PUT /warehouse-transfers/{uuid}` — full-resource de verdade
// (`UpdateWarehouseTransferPayload`: date, stock_uuid,
// destination_warehouse_uuid, quantity, amount, cost_center_uuid). DIFERENTE
// de `CreateOrUpdateFoodBeat.tsx` (Decisão 1 do contrato FoodBeat, só `date`
// editável) — aqui TODOS os campos são editáveis de verdade quando o usuário
// tem `warehouse-transfer_edit`. NÃO copiar `fieldsLocked`/`isFieldDisabled`
// daquele arquivo.
//
// Inspeção obrigatória (JÁ LIDOS nesta sessão):
// `agro365/resources/views/warehouse-transfer/_forms-edit.blade.php`+
// `edit.blade.php`, `WarehouseTransfer-contrato.md ## 4.6`/`## 9`.
//
// ORDEM dos campos FIEL a `_forms-edit.blade.php` (linhas 1-57):
//   1. code (readonly) → 2. user (readonly, quem EDITA agora) → 3. date
//   (editável) → 4. destination_warehouse_id (topo do Blade) →
//   5. origin_warehouse_id (corpo, CLIENT-ONLY, `DA-WT-12`, nunca payload) →
//   6. stock_id (Produto) → 7. measurement (readonly, autofill) →
//   8. stock_quantity (readonly, soma de devolução) → 9. quantity (editável)
//   → 10. value (EDITÁVEL aqui — Risco 1, diferente da criação) →
//   11. amount (readonly, recalcula no blur de quantity/value) →
//   12. cost_center_id (opcional, diferente da criação).
//
// Risco 1 (`value` editável) — mirror `_forms-edit.blade.php:51`
// (`value-edit`, sem `readonly()`). Ao trocar `stock_id`, o script legado
// (`_forms-edit.blade.php:109-117`) TAMBÉM reautofilla `value` a partir de
// `data-average-cost` do estoque escolhido — replicado abaixo
// (`handleStockChange`) — mas o campo permanece editável depois (o usuário
// pode sobrescrever). `amount` é SEMPRE readonly, recalculado no `blur` de
// `quantity`/`value` (mirror `_forms-edit.blade.php:119-124`, JS real —
// NÃO um `useEffect` de recompute a cada tecla, como na criação).
//
// Risco 2 (`origin_warehouse_id`) — só EXIBIÇÃO/filtro client-side do select
// de `stock_id` (o `#inp-warehouse_id` do Blade edit); ao trocar, repopula as
// opções de `stock_id` via `listStocks({ warehouse_uuid })`, mas NUNCA vai ao
// payload (`DA-WT-12`, mesma regra da criação). Pré-carregado a partir de
// `data.origin?.warehouse?.uuid` no `fillForm`.
//
// Risco 3 (`stock_quantity` soma de devolução, `_forms-edit.blade.php:33`,
// `data-quantity="{{ $item->stock->quantity + $item->quantity }}"`) —
// `WarehouseTransferResource` NÃO expõe `stock.quantity` (`## 4.6`). GAP
// resolvido via opção (a) do task-packet: 1 lookup extra em `listStocks({
// product_uuid, warehouse_uuid })` disparado de dentro do `fillForm` (só na
// carga inicial, `resetForce`), localizando o registro por `stock.uuid ===
// origin.stock.uuid` e somando `stock.quantity + data.quantity`. Se o lookup
// não encontrar o registro (linha pode ter sido movida/consumida entre o GET
// do formulário e este lookup — janela de corrida rara), o formulário
// permanece com o estado honesto do `fillForm` inicial
// (`measurement`/`stock_quantity` vazios/0, SEM MOCK) — não bloqueia a
// edição dos demais campos.
//
// Risco 4 / Guard de navegação de UUID inválido
// (`get_pwa_form_query_pattern`, seção "Guard de navegação") — valida `uuid`
// ANTES de chamar `useCustomFormQueryByGuid` (que já desabilita a query
// internamente, mas não redireciona); a TELA é responsável pelo redirect.
// Esta rota é SEMPRE de edição (sem ramo "create") — `uuid`
// ausente/malformado não tem estado válido, redireciona para a listagem.
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useRef } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { warehouseTransferUpdateSchemaResolver } from '@/validations/schemas/WarehouseTransfers/warehouse-transfer-update-schema';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listStocks } from '@/services/v2/Stocks/stock-service';
import type { ListStocksParams } from '@/services/v2/Stocks/stock-service';
import { listWarehouses } from '@/services/v2/Warehouses/warehouse-service';
import {
  getWarehouseTransfer,
  updateWarehouseTransfer,
} from '@/services/v2/WarehouseTransfers/warehouse-transfer-service';

import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { StockListItem } from '@/@types/v2/Stocks';
import type { WarehouseListItem } from '@/@types/v2/Warehouses';
import type {
  UpdateWarehouseTransferPayload,
  WarehouseTransferListItem,
  WarehouseTransferUpdateForm,
} from '@/@types/v2/WarehouseTransfers';

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

// Select "Armazém Destino"/"Armazém (origem)" — mirror EXATO
// `CreateWarehouseTransfer.tsx::mapWarehouseOption`.
function mapWarehouseOption(item: WarehouseListItem) {
  return { label: `${item.initials} — ${item.description}`, value: item.uuid };
}

export default function UpdateWarehouseTransfer() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();
  const text = languageGB.warehouseTransfers.warehouseTransfer;
  const header = text.form.fields.header;
  const itemText = text.form.fields.item;

  const isValidId = isValidGuid(uuid);
  const canEdit = can('warehouse-transfer_edit');

  // Guard de navegação — ID inválido NÃO deve chegar ao hook de query
  // renderizado (mirror `get_pwa_form_query_pattern`/`CreateOrUpdateSafra.tsx`).
  useEffect(() => {
    if (!isValidId) {
      navigate('/administrativo/transf-armazens', { replace: true });
    }
  }, [isValidId, navigate]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<WarehouseTransferUpdateForm>({
    mode: 'onChange',
    resolver: warehouseTransferUpdateSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      date: '',
      origin_warehouse_id: null,
      stock_id: null,
      measurement: '',
      stock_quantity: 0,
      quantity: '',
      value: 0,
      amount: 0,
      destination_warehouse_id: null,
      cost_center_id: null,
    },
  });

  // Cache local (`uuid` -> registro completo do `StockListItem`) — mesmo
  // racional de `WarehouseTransferItemsEditor.tsx::stockCacheRef`. Também
  // recebe o registro resolvido pelo lookup do Risco 3 (devolução).
  const stockCacheRef = useRef(new Map<string, StockListItem>());

  // Linha ORIGINALMENTE persistida (`stock.uuid` + `quantity` já debitada) —
  // usado para decidir se a soma de devolução (Risco 3) ainda se aplica
  // quando o usuário reseleciona o MESMO estoque após trocar de armazém
  // (origem) e voltar. `null` até o `fillForm` inicial rodar.
  const persistedStockRef = useRef<{ stockUuid: string; quantity: number } | null>(null);

  // Lookup do Risco 3 — só roda na carga inicial (`resetForce`), reusa
  // `listStocks` (SEM endpoint novo). Estado honesto se não encontrar o
  // registro (SEM MOCK, ver docblock do arquivo).
  async function resolveStockQuantity(data: WarehouseTransferListItem) {
    const stockUuid = data.origin?.stock?.uuid;
    const productUuid = data.origin?.product?.uuid;
    const warehouseUuid = data.origin?.warehouse?.uuid;
    if (!stockUuid || !productUuid || !warehouseUuid) return;

    try {
      const response = await listStocks({
        product_uuid: productUuid,
        warehouse_uuid: warehouseUuid,
      });
      const stock = response.data.items.find((item) => item.uuid === stockUuid);
      if (!stock) return; // Gap: registro não encontrado — estado honesto mantido (fillForm inicial), SEM MOCK.

      stockCacheRef.current.set(stock.uuid, stock);
      setValue('measurement', stock.unit ?? '');
      setValue('stock_quantity', (Number(stock.quantity) || 0) + (Number(data.quantity) || 0));
    } catch {
      // Silencioso — estado honesto (measurement/stock_quantity permanecem
      // como vieram do fillForm inicial), sem toast bloqueante; o resto do
      // formulário segue editável normalmente.
    }
  }

  // fillForm (Lei 2 — guarda `dirtyFields`), mirror EXATO do bloco da ficha.
  // Defesa em profundidade em TODO acesso aninhado (`origin`/
  // `destination_warehouse`/`cost_center` podem vir `null`, mirror
  // `CreateOrUpdateFoodBeat.tsx::fillForm`).
  function fillForm(data: WarehouseTransferListItem, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length > 0 && !resetForce) return;

    reset({
      date: data.date ?? '',
      destination_warehouse_id: data.destination_warehouse
        ? { label: data.destination_warehouse.description, value: data.destination_warehouse.uuid }
        : null,
      origin_warehouse_id: data.origin?.warehouse
        ? { label: data.origin.warehouse.description, value: data.origin.warehouse.uuid }
        : null,
      stock_id: data.origin?.stock
        ? { label: data.origin.product?.description ?? '', value: data.origin.stock.uuid }
        : null,
      measurement: '', // Risco 3 — populado por `resolveStockQuantity` abaixo
      stock_quantity: 0, // idem
      quantity: Number(data.quantity) || 0,
      value: Number(data.quantity) > 0 ? Number(data.amount) / Number(data.quantity) : 0,
      amount: Number(data.amount) || 0,
      cost_center_id: data.cost_center
        ? { label: data.cost_center.description, value: data.cost_center.uuid }
        : null,
    });

    if (resetForce) {
      persistedStockRef.current = data.origin?.stock
        ? { stockUuid: data.origin.stock.uuid, quantity: Number(data.quantity) || 0 }
        : null;
      void resolveStockQuantity(data);
    }
  }

  const warehouseTransferQuery = useCustomFormQueryByGuid<WarehouseTransferListItem>({
    registrationId: uuid,
    queryKey: queryKey.warehouseTransfers.warehouseTransfer,
    asyncFunction: getWarehouseTransfer,
    fillForm,
  });

  const isLoading = checkLoadingStatus([warehouseTransferQuery as any]);
  const warehouseTransferDetail = (warehouseTransferQuery as any)?.data as
    WarehouseTransferListItem | undefined;

  const originWarehouseOption = watch('origin_warehouse_id');
  const originWarehouseUuid = originWarehouseOption?.value ?? null;
  const stockIdOption = watch('stock_id');

  // `listStocks({ warehouse_uuid })` — Produto/estoque de origem, filtrado
  // pelo Armazém (origem) do corpo (`DA-WT-12`). NUNCA
  // `listStockAvailability` (sem `uuid`/`average_cost`, ver
  // `warehouse-transfer-service.ts`).
  const listRowStocks = useCallback(
    async (params: ListStocksParams) => {
      const response = await listStocks({
        ...params,
        warehouse_uuid: originWarehouseUuid ?? undefined,
      });
      response.data.items.forEach((item) => stockCacheRef.current.set(item.uuid, item));
      return response;
    },
    [originWarehouseUuid]
  );

  // Troca do Armazém (origem, corpo) — filtro CLIENT-ONLY (`DA-WT-12`, Risco
  // 2). Ao mudar, limpa `stock_id`/`measurement`/`stock_quantity`/`value`
  // (produto pertencia ao armazém anterior) — mesma disciplina de
  // `CreateWarehouseTransfer.tsx::handleOriginWarehouseChange`, para 1 linha.
  function handleOriginWarehouseChange(option: Option<string> | null) {
    const previousUuid = originWarehouseUuid;
    setValue('origin_warehouse_id', option ?? null, { shouldDirty: true });
    if ((option?.value ?? null) === previousUuid) return;

    setValue('stock_id', null, { shouldDirty: true });
    setValue('measurement', '', { shouldDirty: true });
    setValue('stock_quantity', 0, { shouldDirty: true });
    setValue('value', 0, { shouldDirty: true });
  }

  // Troca do Produto/Estoque — mirror `_forms-edit.blade.php:109-117`
  // (`#inp-stock_id` change: refilla um/qtd_stock/value do estoque
  // escolhido). Se o estoque escolhido for O MESMO já persistido
  // (`persistedStockRef`), a soma de devolução (Risco 3) se aplica de novo;
  // senão, mostra o saldo CRU do estoque recém-selecionado (a devolução
  // pertence à linha antiga, não ao novo estoque).
  function handleStockChange(option: Option<string> | null) {
    setValue('stock_id', option ?? null, { shouldDirty: true });

    const stock = option ? stockCacheRef.current.get(option.value) : undefined;
    setValue('measurement', stock?.unit ?? '', { shouldDirty: true });

    const baseQuantity = Number(stock?.quantity) || 0;
    const isOriginalStock = !!option && option.value === persistedStockRef.current?.stockUuid;
    const displayedStockQuantity = option
      ? isOriginalStock
        ? baseQuantity + (persistedStockRef.current?.quantity ?? 0)
        : baseQuantity
      : 0;
    setValue('stock_quantity', displayedStockQuantity, { shouldDirty: true });

    // Mirror do Blade — reautofilla `value` do `average_cost` do estoque
    // escolhido; o campo PERMANECE editável depois (Risco 1).
    setValue('value', option ? Number(stock?.average_cost) || 0 : 0, { shouldDirty: true });
  }

  // `amount` recalcula SÓ no `blur` de `quantity`/`value` (mirror
  // `_forms-edit.blade.php:119-124`, JS real — NÃO `useEffect` a cada tecla).
  function recalcAmount() {
    const quantity = Number(watch('quantity')) || 0;
    const value = Number(watch('value')) || 0;
    setValue('amount', roundTo2(quantity * value), { shouldDirty: true });
  }

  // Alerta de saldo insuficiente — reusa a MESMA lógica de
  // `WarehouseTransferItemsEditor.tsx::handleQuantityBlur` (toast + limpa o
  // campo); a soma de devolução já contabilizada em `stock_quantity` (Risco
  // 3) torna a comparação coerente aqui também (ficha, item 9).
  function handleQuantityBlur() {
    const enteredQuantity = Number(watch('quantity')) || 0;
    const currentStockQuantity = Number(watch('stock_quantity')) || 0;

    if (stockIdOption && enteredQuantity > currentStockQuantity) {
      setValue('quantity', '', { shouldDirty: true });
      toaster.error({
        title: text.singularLabel,
        description: itemText.insufficientStock,
      });
      return;
    }

    recalcAmount();
  }

  const warehouseTransferMutation = useRequest({
    asyncFunction: tryPersistWarehouseTransfer,
    entityName: text.singularLabel,
    queryKey: queryKey.warehouseTransfers.warehouseTransfer,
    queryKey2: queryKey.warehouseTransfers.warehouseTransfers,
    typesRequest: 'update',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Wrapper nomeado (Lei 3) — payload de UPDATE full-resource SEMPRE
  // (Checklist item 3, nunca por `dirtyFields` — o Request exige os campos
  // independentemente de terem mudado). `?? undefined` (nunca `|| undefined`)
  // em `cost_center_uuid` — Checklist item 16/19. `origin_warehouse_id`
  // NUNCA no payload (`DA-WT-12`).
  async function tryPersistWarehouseTransfer(data: WarehouseTransferUpdateForm) {
    const payload: UpdateWarehouseTransferPayload = {
      date: data.date,
      stock_uuid: data.stock_id!.value,
      destination_warehouse_uuid: data.destination_warehouse_id!.value,
      quantity: Number(data.quantity),
      amount: Number(data.amount),
      cost_center_uuid: data.cost_center_id?.value ?? undefined,
    };
    return await updateWarehouseTransfer(uuid!, payload);
  }

  // Guard `onSubmit` EXPLÍCITO (`Object.keys(dirtyFields).length`), NUNCA
  // `isEmpty()`/`!isEmpty()` (Checklist item 2) — editar SEM mudança navega
  // sem chamar a API; editar COM mudança salva.
  async function onSubmit(data: WarehouseTransferUpdateForm) {
    if (Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }
    await warehouseTransferMutation.mutateAsync(data);
  }

  const isSubmitting = warehouseTransferMutation.isPending;

  if (!isValidId) return null;

  return (
    <FormContainer
      title={text.form.title.edit}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canEdit && (
            <ButtonSaveAndNext
              create={false}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* Cabeçalho — ORDEM FIEL ao Blade legado (`_forms-edit.blade.php:1-17`):
            code → user (Responsável) → date → destination_warehouse_id. */}
        <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
          {/* `code` — readonly, valor persistido. */}
          <InputReadOnly
            name="code"
            label={header.code}
            value={warehouseTransferDetail?.code ?? '—'}
            loading={isLoading}
          />

          {/* "Responsável" — readonly, usuário que EDITA agora
              (`useAuth().user`), NÃO o autor original (fiel ao Blade:
              `user_id` hidden = `auth()->id()` de quem edita). */}
          <InputReadOnly
            label={header.user}
            value={authUser?.username ?? '—'}
            loading={isLoading}
          />

          {/* `date` — editável. */}
          <Controller
            name="date"
            control={control}
            render={({ field, fieldState }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={header.date}
                error={fieldState.error?.message}
                isRequired
                disabled={!canEdit || isLoading}
              />
            )}
          />

          {/* `destination_warehouse_id` — topo do Blade de edição. */}
          <Controller
            name="destination_warehouse_id"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={header.destinationWarehouse}
                service={listWarehouses}
                mapOptions={mapWarehouseOption}
                findParams={findParamsFromSearch}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                isRequired
                isDisabled={!canEdit || isLoading}
              />
            )}
          />
        </SimpleGrid>

        {/* Corpo — ORDEM FIEL ao Blade legado (`_forms-edit.blade.php:22-58`):
            origin_warehouse_id (Armazém, client-only) → stock_id (Produto) →
            measurement (Unidade) → stock_quantity (Estoque) → quantity →
            value (Valor Unitário, EDITÁVEL aqui) → amount (Valor Total) →
            cost_center_id (opcional). */}
        <SimpleGrid columns={columnsForm.fourColumns} gap={6} mt={6}>
          {/* `origin_warehouse_id` — CLIENT-ONLY (`DA-WT-12`), NUNCA vai ao
              payload. Filtra as opções de `stock_id` abaixo. */}
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
                isDisabled={!canEdit || isLoading}
              />
            )}
          />

          {/* `stock_id` (Produto) — pré-selecionado com o `stock.uuid`
              persistido; `listStocks({ warehouse_uuid: origin_warehouse_id })`. */}
          <Controller
            name="stock_id"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={itemText.product}
                service={listRowStocks}
                mapOptions={(item: StockListItem) => ({
                  label: `${item.product.code} — ${item.info}`,
                  value: item.uuid,
                })}
                findParams={findParamsFromSearch}
                value={field.value ?? null}
                onChange={handleStockChange as any}
                error={error?.message}
                cacheUniqs={[originWarehouseUuid]}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                isRequired
                isDisabled={!canEdit || isLoading || !originWarehouseUuid}
              />
            )}
          />

          {/* `measurement` — readonly, autofill. */}
          <InputReadOnly
            name="measurement"
            label={itemText.measurement}
            value={watch('measurement') || '—'}
            loading={isLoading}
          />

          {/* `stock_quantity` — readonly, com a soma de devolução (Risco 3). */}
          <InputReadOnly
            name="stock_quantity"
            label={itemText.stockAvailable}
            value={formatNumber(Number(watch('stock_quantity')) || 0)}
            loading={isLoading}
          />

          {/* `quantity` — editável, `onBlur` recalcula `amount` + valida
              saldo (Risco 3/checklist item 9). */}
          <Controller
            name="quantity"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberInput
                name={field.name}
                label={itemText.quantity}
                allowDot
                decimalPlaces={2}
                min={0}
                value={Number(field.value) || 0}
                onValueChange={(value) => field.onChange(value ?? 0)}
                onBlur={handleQuantityBlur}
                isRequired
                disabled={!canEdit || isLoading}
                error={error?.message}
              />
            )}
          />

          {/* `value` (Valor Unitário) — EDITÁVEL aqui (Risco 1, diferente da
              criação), `onBlur` recalcula `amount`. */}
          <Controller
            name="value"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberInput
                name={field.name}
                label={itemText.unitValue}
                allowDot
                decimalPlaces={2}
                min={0}
                value={Number(field.value) || 0}
                onValueChange={(value) => field.onChange(value ?? 0)}
                onBlur={recalcAmount}
                disabled={!canEdit || isLoading}
                error={error?.message}
              />
            )}
          />

          {/* `amount` (Valor Total) — SEMPRE readonly, `quantity × value`. */}
          <InputReadOnly
            name="amount"
            label={itemText.totalValue}
            value={formatNumber(Number(watch('amount')) || 0)}
            error={errors.amount?.message}
            loading={isLoading}
          />

          {/* `cost_center_id` — OPCIONAL (fiel a `_forms-edit.blade.php:57`,
              sem `.required()` — diferente do create). */}
          <Controller
            name="cost_center_id"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={itemText.costCenter}
                service={listCostCenterOptions}
                mapOptions={(item: CostCenterRef) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={findParamsFromSearch}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                isDisabled={!canEdit || isLoading}
              />
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
