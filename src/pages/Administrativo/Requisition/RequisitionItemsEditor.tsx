// src/pages/Administrativo/Requisition/RequisitionItemsEditor.tsx
// -----------------------------------------------------------------------------
// Editor de itens da tela de CRIAÇÃO em lote de Requisição/Saída
// (Requisition — Estoque, 97-Esteiras/002, Tarefa 05). Consumido por
// `CreateRequisition.tsx` (campo `items` de `RequisitionCreateForm`).
//
// Mirror ESTRUTURAL DIRETO de `WarehouseTransferItemsEditor.tsx`
// (`useFieldArray` vive no formulário PAI — `fields`/`append`/`remove`
// chegam via props). Desde `GAP-RS-11` (achado pós-entrega, screenshot real
// de produção), Armazém e Centro de Custo são POR ITEM (deixaram de ser
// campo único do cabeçalho) — cada linha gerencia sua PRÓPRIA cascata
// Armazém→Estoque, sem depender de nenhum estado compartilhado do
// formulário pai:
//   1. `cost_center_id` por linha — mirror DIRETO de
//      `WarehouseTransferItemRow::costCenterField`, com a ÚNICA diferença
//      de exigir `only_analytic: true` (`GAP-RS-08`, preservado — o irmão
//      não tem essa restrição por natureza).
//   2. `warehouse_id` por linha — DESENHO NOVO (sem mirror literal: nenhuma
//      feature irmã tem 2º nível de armazém por linha), mas usa o MESMO
//      idioma reativo (`useController` + `SelectAsyncPaginate` com
//      `cacheUniqs`). Trocar o armazém desta linha reseta só os campos
//      DESTA linha (produto/estoque/quantidade/valor/total) — mais simples
//      que o `replace()` de array inteiro que existia no cabeçalho, porque
//      agora afeta 1 linha só.
//   3. SEM `addressing` — `NAO_APLICAVEL` (`FLD-16`), sem campo persistido
//      equivalente nesta feature (confirmado por leitura direta de
//      `RequisitionResource`).
//
// Cascata Armazém→Estoque POR LINHA: `stock_id` só habilita depois do
// armazém DESTA linha ser escolhido (`listStocks({ warehouse_uuid })`);
// `cacheUniqs={[warehouseField.value]}` força o `AsyncPaginate` a descartar
// o cache de opções quando o armazém DESTA linha muda (mesmo mecanismo do
// irmão, só que escopado por linha em vez de compartilhado).
//
// Risco 1 (`value` SEMPRE readonly em criação, autofill de
// `Stock.average_cost`) — mirror EXATO do irmão. `amount` (Valor Total)
// SEMPRE readonly e calculado = `quantity × value` (`useEffect`,
// sincronizado ao RHF).
//
// Risco 2 (duplicidade de `stock_id` entre linhas) — client-side, via
// comparação contra as DEMAIS linhas do próprio `useWatch`, toast + limpa o
// campo, mesma técnica do irmão. Independe do armazém de cada linha (2
// linhas podem ter armazéns diferentes e estoques diferentes sem
// duplicidade — a checagem é só por `stock_id`).
//
// Risco 4 (validação de saldo insuficiente, `quantity > stock_quantity`) —
// client-side no `onBlur`, mirror EXATO do irmão (toast + limpa o campo). O
// backend também valida (422, bloqueia o lote inteiro) — client-side é só
// feedback antecipado, não substitui a validação real.
//
// GAP DECLARADO, não implementado nesta Tarefa (não-bloqueante, herdado do
// irmão): alerta de "estoque abaixo do mínimo" — `StockListItem` (`GET
// /stocks`, endpoint reusado para este dropdown) NÃO expõe `min_stock`.
//
// Todos os botões (`Adicionar Item`/remoção por linha) usam `type="button"`
// EXPLÍCITO — dentro de um `<form>`, um `<button>` sem `type` default para
// `submit` e dispararia o envio do formulário ao ser clicado.
// -----------------------------------------------------------------------------

import { ElementType, useCallback, useEffect, useRef } from 'react';

import { Box, Flex, Grid, Icon, Text } from '@chakra-ui/react';
import {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  useController,
  useWatch,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listStocks } from '@/services/v2/Stocks/stock-service';
import type { ListStocksParams } from '@/services/v2/Stocks/stock-service';
import { listWarehouses } from '@/services/v2/Warehouses/warehouse-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { RequisitionCreateForm, RequisitionItemForm } from '@/@types/v2/Requisitions';
import type { StockListItem } from '@/@types/v2/Stocks';
import type { WarehouseListItem } from '@/@types/v2/Warehouses';

// Select "Armazém" por linha — mirror `CreateRequisition.tsx` (versão
// anterior a `GAP-RS-11`)/`CreateWarehouseTransfer.tsx::mapWarehouseOption`.
function mapWarehouseOption(item: WarehouseListItem) {
  return { label: `${item.initials} — ${item.description}`, value: item.uuid };
}

export interface RequisitionItemsFieldValues {
  items: RequisitionItemForm[];
}

export interface RequisitionItemsEditorProps {
  /** `control` do `useForm` do formulário PAI (`RequisitionCreateForm`, Tarefa 05). */
  control: Control<RequisitionCreateForm>;
  /** `fields` do `useFieldArray({ control, name: 'items' })` do PAI. */
  fields: FieldArrayWithId<RequisitionItemsFieldValues, 'items', 'id'>[];
  /** `append` do mesmo `useFieldArray` do PAI. */
  append: UseFieldArrayAppend<RequisitionItemsFieldValues, 'items'>;
  /** `remove` do mesmo `useFieldArray` do PAI. */
  remove: UseFieldArrayRemove;
  /** `formState.errors` do formulário PAI. */
  errors: FieldErrors<RequisitionCreateForm>;
  languageGB: LanguageDate;
  /** Gate de permissão do formulário PAI — opcional, default habilitado. */
  disabled?: boolean;
}

// Fábrica única do item vazio — usada por `handleAdd` e pelo seed de
// `defaultValues.items` em `CreateRequisition.tsx` (UT-000775: o form já
// nasce com 1 card). Semear SOMENTE via `defaultValues` (nunca useEffect+append:
// StrictMode duplicaria o card).
export function createEmptyRequisitionItem(): RequisitionItemForm {
  return {
    stock_id: null,
    measurement: '',
    stock_quantity: 0,
    quantity: '',
    value: 0,
    amount: 0,
    warehouse_id: null,
    cost_center_id: null,
  };
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

interface RequisitionItemRowProps {
  control: Control<RequisitionItemsFieldValues>;
  index: number;
  remove: UseFieldArrayRemove;
  languageGB: LanguageDate;
  disabled: boolean;
  /** Último card não é removível (UT-000775 / D2): item é obrigatório. */
  canRemove: boolean;
  /** `stock_id.value` das DEMAIS linhas — usado só para o bloqueio de duplicidade. */
  otherRowsStockUuids: string[];
}

function RequisitionItemRow({
  control,
  index,
  remove,
  languageGB,
  disabled,
  canRemove,
  otherRowsStockUuids,
}: RequisitionItemRowProps) {
  const text = languageGB.requisitions.requisition;
  const itemText = text.form.fields.item;

  // Cache local (`uuid` -> registro completo do `StockListItem`) — mesmo
  // racional documentado em `WarehouseTransferItemsEditor.tsx`. Dado real da
  // MESMA resposta que popula o dropdown, sem endpoint novo.
  const stockCacheRef = useRef(new Map<string, StockListItem>());

  const { field: stockField, fieldState: stockFieldState } = useController({
    control,
    name: `items.${index}.stock_id`,
  });
  const { field: measurementField } = useController({
    control,
    name: `items.${index}.measurement`,
  });
  const { field: stockQuantityField } = useController({
    control,
    name: `items.${index}.stock_quantity`,
  });
  const { field: quantityField, fieldState: quantityFieldState } = useController({
    control,
    name: `items.${index}.quantity`,
  });
  const { field: valueField } = useController({
    control,
    name: `items.${index}.value`,
  });
  const { field: amountField, fieldState: amountFieldState } = useController({
    control,
    name: `items.${index}.amount`,
  });
  // Armazém DESTA linha (`GAP-RS-11`) — filtro CLIENT-ONLY da cascata de
  // Estoque DESTA linha (`GAP-RS-02`, preservado), sem estado compartilhado
  // com as demais linhas.
  const { field: warehouseField, fieldState: warehouseFieldState } = useController({
    control,
    name: `items.${index}.warehouse_id`,
  });
  // Centro de Custo DESTA linha (`GAP-RS-11`) — mirror direto de
  // `WarehouseTransferItemRow::costCenterField`, com `only_analytic: true`
  // (`GAP-RS-08`, preservado).
  const { field: costCenterField, fieldState: costCenterFieldState } = useController({
    control,
    name: `items.${index}.cost_center_id`,
  });

  const warehouseUuid = warehouseField.value?.value ?? null;

  // `listStocks({ warehouse_uuid })` — Produto/estoque, filtrado pelo
  // Armazém DESTA linha (`GAP-RS-02`/`GAP-RS-11`). NUNCA
  // `listStockAvailability`/`/stocks/available` (sem `uuid`/`average_cost`,
  // ver `warehouse-transfer-service.ts`).
  const listRowStocks = useCallback(
    async (params: ListStocksParams) => {
      const response = await listStocks({
        ...params,
        warehouse_uuid: warehouseUuid ?? undefined,
      });
      response.data.items.forEach((item) => stockCacheRef.current.set(item.uuid, item));
      return response;
    },
    [warehouseUuid]
  );

  const stockQuantity = Number(stockQuantityField.value) || 0;
  const value = Number(valueField.value) || 0;
  const quantity = Number(quantityField.value) || 0;
  const roundedAmount = roundTo2(quantity * value);

  // Troca do Armazém DESTA linha — reseta SÓ os campos desta linha
  // (produto/estoque/quantidade/valor/total), nunca as outras linhas
  // (`GAP-RS-11`, desenho novo — mais simples que o `replace()` de array
  // inteiro que existia no cabeçalho, porque agora afeta 1 linha só).
  function handleWarehouseChange(option: Option<string> | null) {
    const previousUuid = warehouseUuid;
    warehouseField.onChange(option ?? null);

    if ((option?.value ?? null) === previousUuid) return;

    stockField.onChange(null);
    measurementField.onChange('');
    stockQuantityField.onChange(0);
    valueField.onChange(0);
    quantityField.onChange('');
  }

  // `amount` precisa estar sincronizado no RHF — `CreateRequisition` extrai
  // `items[i].amount` para `RequisitionItemPayload.amount` (confiar no
  // cliente, sem recompute no servidor).
  useEffect(() => {
    if (Number(amountField.value) !== roundedAmount) {
      amountField.onChange(roundedAmount);
    }
  }, [roundedAmount]);

  function handleStockChange(option: Option<string> | null) {
    if (option && otherRowsStockUuids.includes(option.value)) {
      toaster.error({
        title: text.singularLabel,
        description: itemText.duplicateStock,
      });
      // Duplicidade rejeita a seleção e limpa o valor já digitado, mirror
      // EXATO `WarehouseTransferItemsEditor.tsx::handleStockChange`.
      stockField.onChange(null);
      measurementField.onChange('');
      stockQuantityField.onChange(0);
      valueField.onChange(0);
      quantityField.onChange('');
      return;
    }

    stockField.onChange(option ?? null);
    const stock = option ? stockCacheRef.current.get(option.value) : undefined;
    measurementField.onChange(stock?.unit ?? '');
    stockQuantityField.onChange(stock?.quantity ?? 0);
    // Risco 1 — `value` autofill de `Stock.average_cost`, SEMPRE readonly em
    // criação (nunca editado pelo usuário).
    valueField.onChange(stock?.average_cost ?? 0);

    if (!option) {
      quantityField.onChange('');
    }
  }

  function handleQuantityBlur() {
    if (!stockField.value) return;
    const enteredQuantity = Number(quantityField.value) || 0;
    if (enteredQuantity > stockQuantity) {
      quantityField.onChange('');
      toaster.error({
        title: text.singularLabel,
        description: itemText.insufficientStock,
      });
    }
  }

  // Grid (e não `columnsForm`): nenhum preset cobre as trilhas com pesos.
  // >= lg: 2 linhas por card. Linha 1 = Armazém | Produto | Centro de Custo
  // (2fr 2fr 1fr). Linha 2 = Estoque | Unidade | Quantidade | Valor Unitário |
  // Valor Total (5 iguais) + lixeira (auto). Abaixo de lg os wrappers de linha
  // viram `display: contents` e os campos fluem em 2 colunas (sm/md) ou 1 (base).
  // DOM já na ordem visual (Armazém, Produto, CC, Estoque, Un., Qtd, Unit., Total, lixeira).
  return (
    <Grid
      gap={3}
      alignItems="start"
      templateColumns={{ base: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'minmax(0, 1fr)' }}
    >
      <Grid
        display={{ base: 'contents', lg: 'grid' }}
        gap={3}
        alignItems="start"
        templateColumns={{ lg: 'minmax(0,2fr) minmax(0,2fr) minmax(0,1fr)' }}
      >
        {/* `warehouse_id` DESTA linha (`GAP-RS-11`, desenho novo) — filtro
          CLIENT-ONLY da cascata de Produto/Estoque desta linha
          (`GAP-RS-02`, preservado), OBRIGATÓRIO e validado pelo backend
          (`items.*.warehouse_uuid`). */}
        <Box minW={0}>
          <SelectAsyncPaginate
            name={warehouseField.name}
            label={itemText.warehouse}
            service={listWarehouses}
            mapOptions={mapWarehouseOption}
            findParams={findParamsFromSearch}
            value={warehouseField.value ?? null}
            onChange={handleWarehouseChange as any}
            error={warehouseFieldState.error?.message}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            isRequired
            isDisabled={disabled}
          />
        </Box>

        <Box minW={0}>
          <SelectAsyncPaginate
            name={stockField.name}
            label={itemText.product}
            service={listRowStocks}
            mapOptions={(item: StockListItem) => ({
              label: `${item.product.code} — ${item.info}`,
              value: item.uuid,
            })}
            findParams={findParamsFromSearch}
            value={stockField.value ?? null}
            onChange={handleStockChange as any}
            error={stockFieldState.error?.message}
            cacheUniqs={[warehouseUuid]}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            isRequired
            isDisabled={disabled || !warehouseUuid}
          />
        </Box>

        {/* `cost_center_id` DESTA linha (`GAP-RS-11`) — mirror direto de
          `WarehouseTransferItemRow::costCenterField`, com `only_analytic:
          true` (`GAP-RS-08`, preservado — o backend já rejeita Sintético
          com 422). */}
        <Box minW={0}>
          <SelectAsyncPaginate
            name={costCenterField.name}
            label={itemText.costCenter}
            service={(params) => listCostCenterOptions({ ...params, only_analytic: true })}
            mapOptions={(item: CostCenterRef) => ({
              label: `${item.code} — ${item.description}`,
              value: item.uuid,
            })}
            findParams={findParamsFromSearch}
            value={costCenterField.value ?? null}
            onChange={(option: any) => costCenterField.onChange(option ?? null)}
            error={costCenterFieldState.error?.message}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            isRequired
            isDisabled={disabled}
          />
        </Box>
      </Grid>

      <Grid
        display={{ base: 'contents', lg: 'grid' }}
        gap={3}
        alignItems="start"
        templateColumns={{ lg: 'repeat(5, minmax(0,1fr)) auto' }}
      >
        <Box minW={0}>
          <InputReadOnly
            name={stockQuantityField.name}
            label={itemText.stockAvailable}
            value={formatNumber(stockQuantity)}
          />
        </Box>

        <Box minW={0}>
          <InputReadOnly
            name={measurementField.name}
            label={itemText.measurement}
            value={measurementField.value || '—'}
          />
        </Box>

        <Box minW={0}>
          <NumberInput
            name={quantityField.name}
            label={itemText.quantity}
            allowDot
            decimalPlaces={2}
            min={0}
            value={quantity}
            onValueChange={(nextValue) => quantityField.onChange(nextValue ?? 0)}
            onBlur={handleQuantityBlur}
            disabled={disabled || !stockField.value}
            error={quantityFieldState.error?.message}
          />
        </Box>

        {/* Risco 1 — SEMPRE readonly em criação (autofill de `average_cost`). */}
        <Box minW={0}>
          <InputReadOnly
            name={valueField.name}
            label={itemText.unitValue}
            value={formatNumber(value)}
          />
        </Box>

        <Box minW={0}>
          <InputReadOnly
            name={amountField.name}
            label={itemText.totalValue}
            value={formatNumber(roundedAmount)}
            error={amountFieldState.error?.message}
          />
        </Box>

        <Flex
          direction="column"
          gap="1.5"
          gridColumn={{ base: '1 / -1', lg: 'auto' }}
          alignItems={{ base: 'flex-end', lg: 'stretch' }}
        >
          <Flex alignItems="center" fontSize="14px" visibility="hidden">
            {itemText.removeItem}
          </Flex>
          <IconButtonTable
            type="button"
            aria-label={itemText.removeItem}
            mensegerTooltip={itemText.removeItem}
            size="sm"
            color="red.500"
            variant="ghost"
            disabled={disabled || !canRemove}
            onClick={() => remove(index)}
          >
            <Icon as={FiTrash2} />
          </IconButtonTable>
        </Flex>
      </Grid>
    </Grid>
  );
}

export function RequisitionItemsEditor({
  control,
  fields,
  append,
  remove,
  errors,
  languageGB,
  disabled = false,
}: RequisitionItemsEditorProps) {
  const text = languageGB.requisitions.requisition;
  const itemText = text.form.fields.item;

  // Cast local (não vaza na API pública) — mesmo racional do irmão.
  const genericControl = control as unknown as Control<RequisitionItemsFieldValues>;

  const arrayError = (errors as any)?.items?.message as string | undefined;

  const watchedItems = useWatch({ control: genericControl, name: 'items' }) ?? [];
  const grandTotal = watchedItems.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
  const roundedGrandTotal = roundTo2(grandTotal);

  function handleAdd() {
    append(createEmptyRequisitionItem());
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" fontWeight="semibold">
          {itemText.sectionTitle}
        </Text>
        <Flex align="center" gap={2}>
          <Text fontSize="sm" color="fg.muted">
            {itemText.footerTotalLabel}:
          </Text>
          <Text fontSize="sm" fontWeight="semibold">
            {formatNumber(roundedGrandTotal)}
          </Text>
        </Flex>
      </Flex>

      {arrayError && fields.length > 0 && (
        <Box mb={4}>
          <Text fontSize="sm" color="fg.error">
            {arrayError}
          </Text>
        </Box>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || itemText.sectionTitle}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => {
            const otherRowsStockUuids = watchedItems
              .filter((_, otherIndex) => otherIndex !== index)
              .map((item) => item?.stock_id?.value)
              .filter((value): value is string => !!value);

            return (
              <RequisitionItemRow
                key={field.id}
                control={genericControl}
                index={index}
                remove={remove}
                languageGB={languageGB}
                disabled={disabled}
                canRemove={fields.length > 1}
                otherRowsStockUuids={otherRowsStockUuids}
              />
            );
          })}
        </Flex>
      )}

      <Button
        type="button"
        title={itemText.addItem}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}

export default RequisitionItemsEditor;
