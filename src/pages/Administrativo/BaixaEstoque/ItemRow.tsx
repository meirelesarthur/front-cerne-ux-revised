// src/pages/Administrativo/BaixaEstoque/ItemRow.tsx
// -----------------------------------------------------------------------------
// Linha do bloco de itens dinâmico (`useFieldArray name="items"`) do form de
// criação de Baixa de Estoque (TASK-FE-3004). Molde ESTRUTURAL de
// `WarehouseTransferItemsEditor.tsx::WarehouseTransferItemRow` (cascata
// armazém→estoque via `listStocks`, `cacheUniqs`, autofill de
// `average_cost`) — ADAPTADO ao contrato REAL da Baixa:
//
//   - `value` (valor unitário) fica EDITÁVEL após o autofill (o legado deixa
//     o usuário corrigir o valor de baixa, diferente do Trans. Armazém, que
//     trava `value` readonly em criação) — contrato de tela §TASK-FE-3004.
//   - `amount` (total) é SÓ EXIBIÇÃO (`quantity * value`), nunca um campo
//     RHF — a API recalcula (`StockWriteoffRequest`, sem `amount` no wire).
//   - `quantity` usa o clamp NATIVO do `NumberInput` (`max={saldo}`, CV-002)
//     — ao perder o foco acima do saldo, o próprio componente grampeia para
//     o saldo (`NumberInput.handleBlur`), sem lógica extra aqui.
//   - Múltiplas linhas do MESMO produto com lotes DIFERENTES são válidas
//     (DV-003, API corrigida) — SEM checagem de duplicidade entre linhas
//     (diferente de `WarehouseTransferItemRow`, cujo domínio não permite
//     lotes distintos do mesmo produto).
//   - Aviso de estoque mínimo (CV-003) OMITIDO por decisão (D-FE-BE-01) —
//     `StockListItem`/`StockBalanceResource` não expõe `min_stock` (GAP
//     documentado, SEM MOCK do campo).
// -----------------------------------------------------------------------------

import { Box, Flex, Icon } from '@chakra-ui/react';
import { Control, useController } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { listStocks } from '@/services/v2/Stocks/stock-service';
import type { ListStocksParams } from '@/services/v2/Stocks/stock-service';

import type { StockListItem } from '@/@types/v2/Stocks';
import type { StockWriteoffForm, StockWriteoffStockOption } from '@/@types/v2/StockWriteoffs';

function formatNumberPtBr(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

export interface ItemRowProps {
  /** `control` do `useForm<StockWriteoffForm>` do formulário PAI. */
  control: Control<StockWriteoffForm>;
  index: number;
  /** `warehouse.value` do CABEÇALHO — escopa `GET /stocks?warehouse_uuid=`
   *  (IG-003/IG-004); `null` desabilita o select desta linha. */
  warehouseUuid: string | null;
  isDisabled: boolean;
  /** `fields.length > 1` do PAI — mínimo 1 linha (contrato de tela §3.2,
   *  `items` exige `min:1` no backend); `false` desabilita o botão de
   *  remover em vez de um clique sem efeito. */
  canRemove: boolean;
  onRemove: () => void;
}

export function ItemRow({
  control,
  index,
  warehouseUuid,
  isDisabled,
  canRemove,
  onRemove,
}: ItemRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.stockWriteoffs.stockWriteoff.form.items;

  const { field: stockField, fieldState: stockFieldState } = useController({
    control,
    name: `items.${index}.stock`,
  });
  const { field: quantityField, fieldState: quantityFieldState } = useController({
    control,
    name: `items.${index}.quantity`,
  });
  const { field: valueField, fieldState: valueFieldState } = useController({
    control,
    name: `items.${index}.value`,
  });

  const stock = stockField.value as StockWriteoffStockOption | null;
  const saldo = stock?.saldo ?? 0;
  const quantity = Number(quantityField.value) || 0;
  const value = Number(valueField.value) || 0;
  const amount = roundTo2(quantity * value);

  // `GET /stocks?warehouse_uuid=` — cascata IG-003/IG-004; `cacheUniqs`
  // descarta o cache de opções do `AsyncPaginate` quando o Armazém do
  // cabeçalho muda (mirror `WarehouseTransferItemRow`/`ServiceOrderProductTab`).
  async function listRowStocks(params: ListStocksParams) {
    return await listStocks({ ...params, warehouse_uuid: warehouseUuid ?? undefined });
  }

  function handleStockChange(option: StockWriteoffStockOption | null) {
    stockField.onChange(option ?? null);
    // Autofill de `average_cost` (convite, permanece EDITÁVEL — diferente
    // do Trans. Armazém) — só sobrescreve quando a linha ainda não tinha
    // valor digitado, para não perder correção manual ao reabrir o select.
    if (option && (valueField.value === null || valueField.value === undefined)) {
      valueField.onChange(option.average_cost);
    }
    if (!option) {
      valueField.onChange(null);
      quantityField.onChange(null);
    }
  }

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      {/* BAIXA-08 (execução 038, homolog R1, feedback E2E do dono) — "Produto/
          Lote" com o DOBRO da largura anterior (`minW` 240px→480px, `flex`
          2→4), demais campos redistribuídos (larguras reduzidas) para abrir
          espaço. `wrap="wrap"` (já existente) cobre a quebra para a linha de
          baixo quando a linha não couber — sem lógica adicional de layout. */}
      <Flex gap={3} align="flex-start" wrap="wrap">
        <Box flex="4" minW="480px">
          <SelectAsyncPaginate
            name={stockField.name}
            label={text.stock}
            placeholder={text.stockPlaceholder}
            service={listRowStocks}
            mapOptions={(item: StockListItem): StockWriteoffStockOption => ({
              label: item.lot
                ? `${item.product.description} — ${item.lot}`
                : item.product.description,
              value: item.uuid,
              product_uuid: item.product.uuid,
              lot: item.lot,
              unit: item.unit,
              saldo: item.quantity,
              average_cost: item.average_cost,
            })}
            findParams={findParamsFromSearch}
            value={stockField.value ?? null}
            onChange={handleStockChange as (option: unknown) => void}
            error={stockFieldState.error?.message}
            cacheUniqs={[warehouseUuid]}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            isRequired
            isDisabled={isDisabled || !warehouseUuid}
          />
        </Box>

        <Box w={{ base: 'full', sm: '100px' }}>
          <InputReadOnly label={text.saldo} value={formatNumberPtBr(saldo)} />
        </Box>

        <Box w={{ base: 'full', sm: '80px' }}>
          <InputReadOnly label={text.unit} value={stock?.unit || '—'} />
        </Box>

        <Box w={{ base: 'full', sm: '100px' }}>
          <InputReadOnly label={text.lot} value={stock?.lot || '—'} />
        </Box>

        <Box w={{ base: 'full', sm: '130px' }}>
          <NumberInput
            name={quantityField.name}
            label={text.quantity}
            allowDot
            decimalPlaces={2}
            min={0}
            max={saldo > 0 ? saldo : undefined}
            value={quantityField.value}
            onValueChange={(nextValue) => quantityField.onChange(nextValue)}
            error={quantityFieldState.error?.message}
            isRequired
            disabled={isDisabled || !stock}
          />
        </Box>

        <Box w={{ base: 'full', sm: '130px' }}>
          <NumberInput
            name={valueField.name}
            label={text.value}
            allowDot
            decimalPlaces={2}
            min={0}
            value={valueField.value}
            onValueChange={(nextValue) => valueField.onChange(nextValue)}
            error={valueFieldState.error?.message}
            isRequired
            disabled={isDisabled || !stock}
          />
        </Box>

        <Box w={{ base: 'full', sm: '130px' }}>
          <InputReadOnly label={text.amount} value={formatNumberPtBr(amount)} />
        </Box>

        <Flex direction="column" gap="1.5">
          <Flex alignItems="center" fontSize="14px" visibility="hidden">
            {text.removeItem}
          </Flex>
          <IconButtonTable
            type="button"
            aria-label={text.removeItem}
            mensegerTooltip={text.removeItem}
            size="sm"
            color="red.500"
            variant="ghost"
            disabled={isDisabled || !canRemove}
            onClick={onRemove}
          >
            <Icon as={FiTrash2} />
          </IconButtonTable>
        </Flex>
      </Flex>

      {/* CV-003 (aviso de estoque mínimo) OMITIDO — `StockListItem` não
          expõe `min_stock` (GAP D-FE-BE-01, não bloqueia o form). */}
    </Box>
  );
}

export default ItemRow;
