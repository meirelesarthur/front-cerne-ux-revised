// src/pages/Operacional/Pesagem/WeighingSanitaryItemRow.tsx
// -----------------------------------------------------------------------------
// Linha do bloco sanitário embutido de Pesagem — `WeighingSanitaryItemRow`
// (F-071, TASK-PES-FE-06, contrato-tela-lane-c-pesagem-frontend.md §6.6,
// ADR-FE-PES-00 §2.1). Mirror ESTRUTURAL DIRETO de
// `Sanitario/SanitaryItemRow.tsx` (TASK-SAN-FE-04) — mesma cascata
// Armazém→Produto(=linha de `Stock`)→Un.Medida→Estoque, mesmo par
// `convertStockToSelectedUnit`/`convertDoseToBaseUnit` e mesmo aviso de saldo
// insuficiente client-side não-bloqueante. NÃO é componente compartilhado —
// decisão explícita registrada em ADR-FE-PES-00 (contrato-tela §2.1): as
// formas divergem (sem Centro de Custo/mão de obra) e cada bounded context
// mantém seu próprio mirror-adaptado, mesmo precedente já aceito no projeto
// (`FeedlotSanitaryItemRow.tsx` vs `SanitaryItemRow.tsx`).
//
// Adaptações desta Tarefa (Regras da Tarefa 39/TASK-PES-FE-06):
//   - Regra 1: SEM `cost_center_uuid` — `WeighingSanitaryItemData` (CTR-PES
//     §4) não tem esse campo (sub-form de Pesagem nunca teve Centro de
//     Custo, diferente do CRUD raiz de Sanitário).
//   - Regra 2: SEM seletor de animais próprio — reusa os MESMOS
//     `animal_uuid`s do bloco principal; `animalsCount` é só a CONTAGEM
//     (`animals.length`), repassada pelo componente pai (contrato-tela
//     §2.2/§6.6) — o servidor deriva os animais de verdade
//     (`StoreWeighingAction`, CTR-PES §5.1), este componente NUNCA monta uma
//     seleção própria.
//   - Regra 6: +1 campo `Total` (`Text`, calculado client-side `quantity ×
//     animalsCount`, só exibição) — `WeighingSanitaryItemPayload` NÃO tem
//     esse campo, o servidor calcula (mirror FI-07 de Sanitário).
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Control, useController } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { queryKey } from '@/constants/query-key';

import {
  listSanitaryMeasurements,
  listSanitaryProductsByWarehouse,
} from '@/services/v2/Sanitaries/sanitaries-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { ResponsePagination } from '@/@types/response-api';
import type { MeasurementOption } from '@/@types/v2/Measurements';
import type { SanitaryStockFieldOption } from '@/@types/v2/Sanitaries';
import type { WarehouseOption } from '@/@types/v2/Warehouses';
import type { WeighingFormValues } from '@/@types/v2/Weighing';

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

const EMPTY_STOCK_OPTIONS_PAGE: ResponsePagination<SanitaryStockRawOption[]> = {
  success: true,
  message: '',
  data: {
    items: [],
    pagination: { total: 0, count: 0, per_page: 0, current_page: 1, total_pages: 1 },
  },
};

// Shape BRUTO real de `EP-SAN-09` — mirror EXATO da nota de cabeçalho de
// `SanitaryItemRow.tsx` (mesmo Resource/Action reusados, `CTR-PES §5.4`):
// `productsByWarehouse` devolve `StockAvailabilityResource` cru, SEM
// `label`/`value`/`product_uuid` flat prontos — este shape ANTES do
// `mapOptions` decorar.
interface SanitaryStockRawOption {
  uuid: string;
  product: { uuid: string; description: string };
  quantity: number;
  min_stock: number | null;
  lot: string | null;
  provider_lot: string | null;
  warehouse_uuid: string | null;
  measurement: { uuid: string; name: string; description: string } | null;
  measurement_second: { uuid: string; name: string; description: string } | null;
  factor: number | null;
  factor_type: 'M' | 'D' | null;
}

interface ProductFactorInfo {
  secondMeasurementUuid: string | null;
  factorType: 'M' | 'D' | null;
  factor: number | null;
}

const EMPTY_PRODUCT_FACTOR_INFO: ProductFactorInfo = {
  secondMeasurementUuid: null,
  factorType: null,
  factor: null,
};

function formatQuantity(value: number | null, decimals = 2): string {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Mirror EXATO `SanitaryItemRow.convertStockToSelectedUnit` — secundária com
// `factor_type==='D'` divide pelo fator; qualquer outro `factor_type` multiplica.
function convertStockToSelectedUnit(
  rawStock: number,
  selectedMeasurementUuid: string | null,
  secondMeasurementUuid: string | null | undefined,
  factorType: 'M' | 'D' | null | undefined,
  factor: number | null | undefined
): number {
  const isSecondaryUnit =
    !!selectedMeasurementUuid &&
    !!secondMeasurementUuid &&
    selectedMeasurementUuid === secondMeasurementUuid;
  if (!isSecondaryUnit || !factor) return rawStock;
  return factorType === 'D' ? rawStock / factor : rawStock * factor;
}

// Mirror EXATO `SanitaryItemRow.convertDoseToBaseUnit`.
function convertDoseToBaseUnit(
  dose: number,
  selectedMeasurementUuid: string | null,
  secondMeasurementUuid: string | null | undefined,
  factorType: 'M' | 'D' | null | undefined,
  factor: number | null | undefined
): number {
  const isSecondaryUnit =
    !!selectedMeasurementUuid &&
    !!secondMeasurementUuid &&
    selectedMeasurementUuid === secondMeasurementUuid;
  if (!isSecondaryUnit || !factor) return dose;
  return factorType === 'D' ? dose * factor : dose / factor;
}

export interface WeighingSanitaryItemRowProps {
  control: Control<WeighingFormValues>;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  /** `animals.length` do bloco principal — mirror `animalsCount` de `SanitaryItemRow` (§2.2 do contrato-tela, sem seletor próprio). */
  animalsCount: number;
  languageGB: LanguageDate;
  isDisabled?: boolean;
}

export function WeighingSanitaryItemRow({
  control,
  index,
  canRemove,
  onRemove,
  animalsCount,
  languageGB,
  isDisabled,
}: WeighingSanitaryItemRowProps) {
  const text = languageGB.weighing.weighing.form;

  const { field: warehouseField, fieldState: warehouseFieldState } = useController({
    control,
    name: `sanitary_items.${index}.warehouse_uuid`,
  });
  const { field: productField, fieldState: productFieldState } = useController({
    control,
    name: `sanitary_items.${index}.product`,
  });
  const { field: measurementField, fieldState: measurementFieldState } = useController({
    control,
    name: `sanitary_items.${index}.measurement_uuid`,
  });
  const { field: quantityField, fieldState: quantityFieldState } = useController({
    control,
    name: `sanitary_items.${index}.quantity`,
  });
  const { field: noteField } = useController({ control, name: `sanitary_items.${index}.note` });

  const warehouseUuid = warehouseField.value?.value ?? null;
  // `productField.value` é a linha de `Stock` (produto+lote) selecionada;
  // `productUuid` (cascata de Un.Medida, EP-SAN-12) vem de `.product_uuid`,
  // NUNCA de `.value` (uuid do `Stock`, vira `stock_uuid` no submit).
  const productUuid = productField.value?.product_uuid ?? null;

  const measurementsQuery = useQuery({
    queryKey: [queryKey.sanitary.sanitary, 'measurements', productUuid],
    queryFn: async () => (await listSanitaryMeasurements(productUuid as string)).data,
    enabled: !!productUuid,
  });

  const measurementOptions: Option<string>[] = (measurementsQuery.data ?? []).map(
    (item: MeasurementOption) => ({ label: item.description || item.name, value: item.uuid })
  );

  useEffect(() => {
    // Auto-seleciona quando a cascata devolve exatamente 1 opção (mirror
    // `SanitaryItemRow.tsx`/`AppropriationStockTab.tsx`/`ProcessingSanitaryItemRow.tsx`).
    if (measurementOptions.length === 1 && !measurementField.value) {
      measurementField.onChange(measurementOptions[0]);
    }
    // eslint-disable-next-line
  }, [measurementsQuery.data, productUuid]);

  // Estoque vem DIRETO da opção de Stock selecionada — SEM 2ª chamada a
  // `EP-SAN-11` (mirror `SanitaryItemRow.tsx`).
  const stockBalance = productField.value?.quantity ?? null;

  const [productFactorInfo, setProductFactorInfo] =
    useState<ProductFactorInfo>(EMPTY_PRODUCT_FACTOR_INFO);
  const { secondMeasurementUuid, factorType, factor } = productFactorInfo;
  const selectedMeasurementUuid = measurementField.value?.value ?? null;

  const displayedStock =
    stockBalance != null
      ? convertStockToSelectedUnit(
          stockBalance,
          selectedMeasurementUuid,
          secondMeasurementUuid,
          factorType,
          factor
        )
      : null;

  // Regra 6 da Tarefa — `Total` é só EXIBIÇÃO client-side (`quantity ×
  // animalsCount do bloco principal`), NUNCA enviado no payload
  // (`WeighingSanitaryItemPayload` não tem esse campo, servidor calcula).
  const doseValue = quantityField.value === '' ? null : Number(quantityField.value);
  const totalDose = doseValue != null ? doseValue * animalsCount : null;

  // Guarda a transição "suficiente" → "insuficiente" para o aviso abaixo —
  // BUGFIX (dono, screenshot de dezenas de toasts empilhados em
  // `SanitaryItemRow.tsx`, mesmo `useEffect` mirrorado aqui): o efeito
  // reavalia a cada resolução assíncrona de QUALQUER dependência
  // (measurements, factor info etc.), o que na hidratação de edição disparava
  // o mesmo `toaster.create` repetidas vezes sem o usuário ter mudado nada.
  // Só dispara o toast na transição false→true; permite disparar de novo se
  // sair do estado insuficiente e voltar a entrar nele.
  const wasInsufficientRef = useRef(false);

  useEffect(() => {
    // Aviso de saldo insuficiente — client-side, NÃO bloqueia submit (mirror
    // `SanitaryItemRow.tsx`/`swal` do legado).
    if (stockBalance === null || !quantityField.value) {
      wasInsufficientRef.current = false;
      return;
    }
    const doseBase = convertDoseToBaseUnit(
      Number(quantityField.value),
      selectedMeasurementUuid,
      secondMeasurementUuid,
      factorType,
      factor
    );
    const totalDoseBase = doseBase * animalsCount;
    const isInsufficient = totalDoseBase > stockBalance;
    if (isInsufficient && !wasInsufficientRef.current) {
      toaster.create({
        type: 'warning',
        title: text.sections.sanitary,
        description: text.stockInsufficientWarning,
      });
    }
    wasInsufficientRef.current = isInsufficient;
    // eslint-disable-next-line
  }, [
    quantityField.value,
    stockBalance,
    animalsCount,
    selectedMeasurementUuid,
    secondMeasurementUuid,
    factorType,
    factor,
  ]);

  // Cascata CONFIRMADA como Armazém→Produto, NUNCA o reverso — sem armazém
  // selecionado, a lista de produtos fica vazia (Select desabilitado), mirror
  // `SanitaryItemRow.tsx`.
  async function listRowProducts(): Promise<ResponsePagination<SanitaryStockRawOption[]>> {
    if (!warehouseUuid) return EMPTY_STOCK_OPTIONS_PAGE;
    return listSanitaryProductsByWarehouse(warehouseUuid) as unknown as Promise<
      ResponsePagination<SanitaryStockRawOption[]>
    >;
  }

  function handleWarehouseChange(option: Option<string> | null) {
    warehouseField.onChange(option ?? null);
    // Armazém trocado invalida o produto/lote já escolhido (mirror
    // `SanitaryItemRow.tsx`).
    productField.onChange(null);
    measurementField.onChange(null);
    setProductFactorInfo(EMPTY_PRODUCT_FACTOR_INFO);
  }

  function handleProductChange(option: SanitaryStockFieldOption | null) {
    productField.onChange(option ?? null);
    measurementField.onChange(null);
    setProductFactorInfo(
      option
        ? {
            secondMeasurementUuid: option.measurement_second?.uuid ?? null,
            factorType: option.factor_type ?? null,
            factor: option.factor ?? null,
          }
        : EMPTY_PRODUCT_FACTOR_INFO
    );
  }

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <Flex gap={3} align="flex-start" wrap="wrap">
        <Box flex="2" minW="220px">
          <SelectAsyncPaginate
            name={warehouseField.name}
            label={text.fields.warehouse}
            placeholder={text.placeholders.warehouse}
            service={listWarehouseOptions}
            mapOptions={(item: WarehouseOption) => ({
              label: `${item.initials} — ${item.description}`,
              value: item.uuid,
            })}
            findParams={findParamsFromSearch}
            value={warehouseField.value ?? null}
            onChange={handleWarehouseChange as (option: unknown) => void}
            error={warehouseFieldState.error?.message}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            isRequired
            isDisabled={isDisabled}
          />
        </Box>

        <Box flex="2" minW="220px">
          <SelectAsyncPaginate
            name={productField.name}
            label={text.fields.product}
            placeholder={text.placeholders.product}
            service={listRowProducts}
            mapOptions={(item: SanitaryStockRawOption): SanitaryStockFieldOption => ({
              // Rótulo `CONCAT(description, " - Lote: ", lot)` — mirror
              // `SanitaryItemRow.tsx`/legado `getProductsByWarehouse`.
              label: item.lot
                ? `${item.product.description} - Lote: ${item.lot}`
                : item.product.description,
              value: item.uuid,
              product_uuid: item.product.uuid,
              quantity: item.quantity,
              lot: item.lot,
              measurement: item.measurement,
              measurement_second: item.measurement_second,
              factor: item.factor,
              factor_type: item.factor_type,
            })}
            findParams={findParamsFromSearch}
            value={productField.value ?? null}
            onChange={handleProductChange as (option: unknown) => void}
            error={productFieldState.error?.message}
            cacheUniqs={[warehouseUuid]}
            isDisabled={isDisabled || !warehouseUuid}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            isRequired
          />
        </Box>

        <Box w={{ base: 'full', sm: '160px' }}>
          <Select
            label={text.fields.measurement}
            name={measurementField.name}
            value={measurementField.value ?? null}
            onChange={(option: Option<string> | null) => measurementField.onChange(option ?? null)}
            options={measurementOptions}
            error={measurementFieldState.error?.message}
            isRequired
            isDisabled={isDisabled || !productUuid}
          />
        </Box>

        <Box w={{ base: 'full', sm: '110px' }}>
          <InputReadOnly label={text.fields.stock} value={formatQuantity(displayedStock)} />
        </Box>

        <Box w={{ base: 'full', sm: '130px' }}>
          <NumberInput
            name={quantityField.name}
            label={text.fields.dose}
            allowDot
            decimalPlaces={2}
            min={0}
            value={quantityField.value === '' ? null : Number(quantityField.value)}
            onValueChange={(value) => quantityField.onChange(value ?? '')}
            error={quantityFieldState.error?.message}
            isRequired
            disabled={isDisabled}
          />
        </Box>

        <Flex direction="column" gap="1.5" minW="90px">
          <Text fontSize="sm" fontWeight="medium">
            {text.fields.total}
          </Text>
          <Text fontSize="sm">{formatQuantity(totalDose)}</Text>
        </Flex>

        <Box flex="2" minW="200px">
          <Input
            name={noteField.name}
            label={text.fields.note}
            value={noteField.value ?? ''}
            onChange={(event) => noteField.onChange(event.target.value)}
            disabled={isDisabled}
          />
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
    </Box>
  );
}

export default WeighingSanitaryItemRow;
