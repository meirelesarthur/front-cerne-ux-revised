// src/pages/Operacional/Processamentos/ProcessingSanitaryItemRow.tsx
// -----------------------------------------------------------------------------
// Linha do bloco "Item Sanitário" (Onda 2, TASK-FE-039-PROCFID-04) — molde
// estrutural DIRETO de `BaixaEstoque/ItemRow.tsx`, adaptado para a cascata
// Armazém→Produto do legado (`_card-sanitary-item.blade.php`), diferente de
// `ItemRow.tsx` (que só cascata de 1 lado, armazém→estoque):
//   - Armazém escolhido primeiro → Produto é filtrado por
//     `listSanitaryProductsByWarehouse` (só produtos com saldo no armazém).
//   - Produto escolhido primeiro → Armazém é filtrado por
//     `listSanitaryWarehousesByProduct` (só armazéns com saldo do produto).
//   - Sem Armazém ainda: TASK-063-PROC-QA3-02 (rejeição QA rodada 3, Opção
//     B — decisão do dono) — o Produto fica DESABILITADO e vazio (nunca cai
//     no catálogo GERAL `listProductOptions`, que listava qualquer produto,
//     inclusive pneus/insumos não-sanitários). O Armazém continua usando o
//     catálogo geral (`listWarehouseOptions`) quando nenhum Produto foi
//     escolhido ainda — só o lado Produto ganhou a trava.
// Trocar Produto dispara `listSanitaryMeasurements` (popula "Un.Medida",
// auto-seleciona quando sobra 1 opção, mirror `AppropriationStockTab.tsx`) e,
// se Armazém já selecionado, `getSanitaryWarehouseStock` (Estoque,
// readonly). Trocar Armazém também recalcula o Estoque quando Produto já
// selecionado (`cacheUniqs` cruzado em ambos os Selects).
// Aviso de saldo insuficiente (`quantity × nº animais > saldo`) é
// client-side, NÃO bloqueia submit — mirror do `swal` do legado (mesma
// classe de aviso não-bloqueante documentada em `ItemRow.tsx`).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, Icon } from '@chakra-ui/react';
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
  getSanitaryWarehouseStock,
  listSanitaryMeasurements,
  listSanitaryProductsByWarehouse,
  listSanitaryWarehousesByProduct,
} from '@/services/v2/Sanitary/sanitary-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { MeasurementOption } from '@/@types/v2/Measurements';
import type { FinishProcessingForm } from '@/@types/v2/Processamentos/processing';
import type { ProductOption } from '@/@types/v2/Products';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

// `ProductOption` já traz `measurement`/`measurement_second`/`factor`/
// `factor_type` (GAP-BE-641) — mirror do gesto de `CategoryAnimalOptionWithFlag`
// (`ProcessingAnimalRow.tsx`): captura os campos extras DIRETO da opção
// selecionada em vez de um novo fetch a `/products/{uuid}` (gate
// `products_view`, diferente do gate `processing_create` desta tela).
interface ProductOptionWithFactor {
  label: string;
  value: string;
  measurement?: { uuid: string; description: string };
  measurement_second?: { uuid: string; description: string } | null;
  factor?: number | null;
  factor_type?: { value: 'M' | 'D'; label: string } | null;
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

// Máscara BR do Estoque (ALVO B — legado `main.js:1348-1352`): milhar `.`,
// decimal `,`, 2 casas fixas — mirror `formatLastWeight`
// (`ProcessingAnimalRow.tsx`). `InputReadOnly` é readonly puro, sem risco de
// round-trip com o RHF.
function formatStockQuantity(value: number | null): string {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Converte o saldo BRUTO (unidade principal, `stocks.quantity`) para a
// unidade selecionada no card — ALVO B (`_card-sanitary-item.blade.php:
// 212-230`): secundária com `factor_type==='D'` divide pelo fator; qualquer
// outro `factor_type` multiplica.
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

// Converte a dose informada (na unidade selecionada) para a unidade BASE
// (principal, mesma unidade do saldo bruto) — ALVO B
// (`ProcessingController.php:894-909`): operação inversa de
// `convertStockToSelectedUnit`, usada só para o comparativo CV-006.
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

export interface ProcessingSanitaryItemRowProps {
  /** `control` do `useForm<FinishProcessingForm>` do formulário PAI. */
  control: Control<FinishProcessingForm>;
  index: number;
  isDisabled: boolean;
  /** `fields.length > 1` do PAI — mínimo 1 linha quando `sanitary===true` (mirror `guardSanitaryItems`). */
  canRemove: boolean;
  onRemove: () => void;
  /** `animals.length` do formulário PAI — usado no aviso de saldo (CV-006, dose × nº animais). */
  animalsCount: number;
  languageGB: LanguageDate;
}

export function ProcessingSanitaryItemRow({
  control,
  index,
  isDisabled,
  canRemove,
  onRemove,
  animalsCount,
  languageGB,
}: ProcessingSanitaryItemRowProps) {
  const text = languageGB.processamentos.processing.form.fields.sanitaryItem;

  const { field: warehouseField, fieldState: warehouseFieldState } = useController({
    control,
    name: `sanitary_items.${index}.warehouse_uuid`,
  });
  const { field: productField, fieldState: productFieldState } = useController({
    control,
    name: `sanitary_items.${index}.product_uuid`,
  });
  const { field: measurementField, fieldState: measurementFieldState } = useController({
    control,
    name: `sanitary_items.${index}.measurement_uuid`,
  });
  const { field: quantityField, fieldState: quantityFieldState } = useController({
    control,
    name: `sanitary_items.${index}.quantity`,
  });
  const { field: observationField } = useController({
    control,
    name: `sanitary_items.${index}.observation`,
  });

  const warehouseUuid = warehouseField.value?.value ?? null;
  const productUuid = productField.value?.value ?? null;

  // "Un.Medida" — cascata do Produto (unidade principal + secundária).
  const measurementsQuery = useQuery({
    queryKey: [queryKey.processamentos.sanitaryMeasurements, productUuid],
    queryFn: async () => {
      const response = await listSanitaryMeasurements(productUuid!);
      return response.data;
    },
    enabled: !!productUuid,
  });

  const measurementOptions: Option<string>[] = (measurementsQuery.data ?? []).map(
    (item: MeasurementOption) => ({ label: item.description || item.name, value: item.uuid })
  );

  useEffect(() => {
    // Auto-seleciona quando sobra 1 única opção (mirror
    // `AppropriationStockTab.tsx` — dedupe/auto-select da Un.Medida).
    if (measurementOptions.length === 1 && !measurementField.value) {
      measurementField.onChange(measurementOptions[0]);
    }
  }, [measurementsQuery.data, productUuid]);

  // "Estoque" — cascata Produto+Armazém (readonly, só quando os 2 já
  // escolhidos).
  const stockQuery = useQuery({
    queryKey: [queryKey.processamentos.sanitaryWarehouseStock, warehouseUuid, productUuid],
    queryFn: async () => {
      const response = await getSanitaryWarehouseStock(warehouseUuid!, productUuid!);
      return response.data;
    },
    enabled: !!warehouseUuid && !!productUuid,
  });

  const stockBalance = stockQuery.data?.quantity ?? null;

  // `factor`/`factor_type`/`measurement_second` do Produto selecionado
  // (ALVO B: conversão de unidade do Estoque exibido e da dose para o
  // comparativo CV-006) — capturados DIRETO da opção do Select em
  // `handleProductChange` (ver `ProductOptionWithFactor` acima), zerados
  // quando o Produto é limpo ou troca.
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

  // CV-006 — aviso client-side (NÃO bloqueia submit, mirror `swal` do
  // legado): dose × nº de animais REAIS do wizard (NÃO replicar o bug
  // legado `.animal.length===0` do Processamento) > saldo do armazém,
  // convertendo a dose para a unidade BASE antes do comparativo (ambas as
  // pontas na mesma unidade do saldo bruto).
  useEffect(() => {
    if (stockBalance === null || !quantityField.value) return;
    const doseBase = convertDoseToBaseUnit(
      Number(quantityField.value),
      selectedMeasurementUuid,
      secondMeasurementUuid,
      factorType,
      factor
    );
    const totalDose = doseBase * animalsCount;
    if (totalDose > stockBalance) {
      toaster.create({
        type: 'warning',
        title: text.sectionTitle,
        description: text.stockInsufficientWarning,
      });
    }
  }, [
    quantityField.value,
    stockBalance,
    animalsCount,
    selectedMeasurementUuid,
    secondMeasurementUuid,
    factorType,
    factor,
    text.sectionTitle,
    text.stockInsufficientWarning,
  ]);

  // Cascata Armazém→Produto: com Armazém escolhido, restringe ao catálogo
  // sanitário; sem Armazém, cai no catálogo geral de Produtos (mirror do
  // legado, que permite entrar por qualquer lado).
  async function listRowWarehouses(params: PaginationQueryParams) {
    if (productUuid) {
      return listSanitaryWarehousesByProduct(productUuid);
    }
    return listWarehouseOptions(params);
  }

  // TASK-063-PROC-QA3-02 (Opção B): sem Armazém selecionado, NÃO consulta o
  // catálogo geral de produtos — devolve lista vazia (o Select fica também
  // `isDisabled` abaixo). Elimina o vetor "lista tudo" do front (o outro
  // vetor, a ausência de filtro sanitário na API, é a TASK-063-PROC-QA3-01,
  // fora do escopo desta tarefa).
  async function listRowProducts() {
    if (!warehouseUuid) {
      return {
        success: true,
        data: {
          items: [],
          pagination: { total: 0, count: 0, per_page: 0, current_page: 1, total_pages: 1 },
        },
      };
    }
    return listSanitaryProductsByWarehouse(warehouseUuid);
  }

  function handleWarehouseChange(option: Option<string> | null) {
    warehouseField.onChange(option ?? null);
  }

  function handleProductChange(option: ProductOptionWithFactor | null) {
    productField.onChange(option ?? null);
    // Produto novo — a Un.Medida hidratada para o produto anterior não é
    // mais válida, o `useEffect` acima repopula quando sobrar 1 opção.
    measurementField.onChange(null);
    setProductFactorInfo(
      option
        ? {
            secondMeasurementUuid: option.measurement_second?.uuid ?? null,
            factorType: option.factor_type?.value ?? null,
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
            label={text.warehouse}
            service={listRowWarehouses}
            mapOptions={(item: WarehouseOption) => ({
              label: `${item.initials} — ${item.description}`,
              value: item.uuid,
            })}
            findParams={findParamsFromSearch}
            value={warehouseField.value ?? null}
            onChange={handleWarehouseChange as (option: unknown) => void}
            error={warehouseFieldState.error?.message}
            cacheUniqs={[productUuid]}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            isRequired
            isDisabled={isDisabled}
          />
        </Box>

        <Box flex="2" minW="220px">
          <SelectAsyncPaginate
            name={productField.name}
            label={text.product}
            service={listRowProducts}
            mapOptions={(item: ProductOption): ProductOptionWithFactor => ({
              label: item.description,
              value: item.uuid,
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
            menuPortalTarget={document.body}
            menuPosition="fixed"
            isRequired
            // TASK-063-PROC-QA3-02 (Opção B, decisão do dono): Produto só
            // habilita depois do Armazém escolhido — mirror do gating de
            // `listRowProducts` acima (sem armazém, lista vazia).
            isDisabled={isDisabled || !warehouseUuid}
          />
        </Box>

        <Box w={{ base: 'full', sm: '160px' }}>
          <Select
            label={text.measurement}
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
          <InputReadOnly label={text.stock} value={formatStockQuantity(displayedStock)} />
        </Box>

        <Box w={{ base: 'full', sm: '130px' }}>
          <NumberInput
            name={quantityField.name}
            label={text.quantity}
            allowDot
            decimalPlaces={2}
            min={0}
            value={quantityField.value}
            onValueChange={(nextValue) => quantityField.onChange(nextValue)}
            error={quantityFieldState.error?.message}
            isRequired
            disabled={isDisabled}
          />
        </Box>

        <Box flex="2" minW="200px">
          <Input
            name={observationField.name}
            label={text.observation}
            value={observationField.value ?? ''}
            onChange={(event) => observationField.onChange(event.target.value || null)}
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

export default ProcessingSanitaryItemRow;
