// src/pages/Operacional/Sanitario/SanitaryItemRow.tsx
// -----------------------------------------------------------------------------
// Linha do repeater de itens de produto do formulário de Sanitário — FI-01..11
// (F-062, TASK-SAN-FE-04, contrato-tela-lane-c-sanitario-frontend.md §6.4).
// Mirror ESTRUTURAL DIRETO de
// `FeedlotMapDashboard/dialogs/FeedlotSanitaryItemRow.tsx` (execução 042,
// linhas 29-368) — mesma cascata Armazém→Produto(=linha de `Stock` com
// lote)→Un.Medida→Estoque, mesmo par `convertStockToSelectedUnit`/
// `convertDoseToBaseUnit` (linhas 93-121 daquele arquivo) e mesmo aviso de
// saldo insuficiente client-side, NÃO-bloqueante (linhas 207-225). Adaptações
// desta Tarefa: serviço `sanitaries-service.ts` (EP-SAN-09/12, plural, NÃO
// `sanitary-service.ts` singular — ADR-FE-SAN-00), tipos `@/@types/v2/
// Sanitaries` (NÃO `@/@types/v2/FeedlotMap/sanitary`) e +1 campo `Centro de
// Custo` (`cost_center_uuid`, opcional, reuso `cost-center-service.ts`) que o
// FeedlotMap não tem (Tarefa, "Ação esperada").
//
// ACHADO desta Tarefa (leitura direta do código real da API,
// `GB.Cerne.Api/app/Http/Controllers/Api/V1/SanitaryRecordController.php`
// linhas 165-174 + `app/Http/Resources/V1/StockAvailabilityResource.php`):
// `EP-SAN-09` (`productsByWarehouse`) reusa a MESMA Action
// `ListFeedlotCorralSanitaryStockOptionsAction` do Mapa de Confinamento e
// devolve o MESMO Resource cru `StockAvailabilityResource` (`uuid`,
// `product:{uuid,description}`, `quantity`, `lot`, `measurement`,
// `measurement_second`, `factor`, `factor_type` — SEM `label`/`value`/
// `product_uuid` flat prontos). O tipo `SanitaryStockFieldOption` declarado em
// `@/@types/v2/Sanitaries/index.d.ts` (TASK-SAN-FE-01) já é o shape PÓS-
// `mapOptions` (o valor que fica no campo do form, decorado) — não o shape
// bruto do fio. `listSanitaryProductsByWarehouse` (`sanitaries-service.ts`)
// tipa o retorno como se já viesse decorado, o que diverge do Resource real
// (mesma classe de achado das Tarefas 02/03, mas fora do escopo de arquivos
// desta Tarefa — só os 2 arquivos novos + `CreateOrUpdateSanitario.tsx` — daí
// o cast local para o shape bruto real em vez de reabrir aquele arquivo).
// `SanitaryStockRawOption` abaixo é esse shape bruto; `mapOptions` monta o
// rótulo `CONCAT(description, " - Lote: ", lot)` (mirror `FeedlotSanitaryItemRow`
// linhas 282-295, que documenta a mesma montagem do legado
// `getProductsByWarehouse`).
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

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

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import {
  listSanitaryMeasurements,
  listSanitaryProductsByWarehouse,
} from '@/services/v2/Sanitaries/sanitaries-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { ResponsePagination } from '@/@types/response-api';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { MeasurementOption } from '@/@types/v2/Measurements';
import type { SanitaryFormValues, SanitaryStockFieldOption } from '@/@types/v2/Sanitaries';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

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

// Shape BRUTO real de `EP-SAN-09` (`StockAvailabilityResource`/
// `FeedlotCorralSanitaryStockOption`, ver nota de cabeçalho) — ANTES do
// `mapOptions` decorar com `label`/`value`.
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

function formatStockQuantity(value: number | null): string {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Mirror EXATO `FeedlotSanitaryItemRow.convertStockToSelectedUnit` (linhas
// 93-106 daquele arquivo) — secundária com `factor_type==='D'` divide pelo
// fator; qualquer outro `factor_type` multiplica.
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

// Mirror EXATO `FeedlotSanitaryItemRow.convertDoseToBaseUnit` (linhas 108-121).
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

export interface SanitaryItemRowProps {
  control: Control<SanitaryFormValues>;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  /** `animal_uuids.length` do form pai — usado no aviso de saldo (IG-06). */
  animalsCount: number;
  languageGB: LanguageDate;
  isDisabled?: boolean;
}

export function SanitaryItemRow({
  control,
  index,
  canRemove,
  onRemove,
  animalsCount,
  languageGB,
  isDisabled,
}: SanitaryItemRowProps) {
  const text = languageGB.sanitary.sanitary.form;

  const { field: warehouseField, fieldState: warehouseFieldState } = useController({
    control,
    name: `items.${index}.warehouse_uuid`,
  });
  const { field: productField, fieldState: productFieldState } = useController({
    control,
    name: `items.${index}.product`,
  });
  const { field: measurementField, fieldState: measurementFieldState } = useController({
    control,
    name: `items.${index}.measurement_uuid`,
  });
  const { field: quantityField, fieldState: quantityFieldState } = useController({
    control,
    name: `items.${index}.quantity`,
  });
  const { field: costCenterField } = useController({
    control,
    name: `items.${index}.cost_center_uuid`,
  });
  const { field: noteField } = useController({ control, name: `items.${index}.note` });

  const warehouseUuid = warehouseField.value?.value ?? null;
  // `productField.value` é a linha de `Stock` (produto+lote) selecionada;
  // `productUuid` (para a cascata de Un.Medida, EP-SAN-12) vem de
  // `.product_uuid`, NUNCA de `.value` (uuid do `Stock`, vira `stock_uuid`).
  const productUuid = productField.value?.product_uuid ?? null;

  const measurementsQuery = useQuery({
    queryKey: [queryKey.sanitary.sanitary, 'measurements', productUuid],
    queryFn: async () => (await listSanitaryMeasurements(productUuid as string)).data,
    enabled: !!productUuid,
  });

  const measurementOptionsFromQuery: Option<string>[] = (measurementsQuery.data ?? []).map(
    (item: MeasurementOption) => ({ label: item.description || item.name, value: item.uuid })
  );

  // BUGFIX (dono, correção ao vivo BUG-SAN-EDIT-01, 2026-08-28) — "Un.
  // Medida continua vindo vazio ao abrir a edição": `measurementField.value`
  // já vem hidratado por `mapSanitaryItemsToFormValues` (item.stock.measurement
  // real, `SanitaryResource` — confirmado por `curl` real na investigação
  // desta correção), mas o `<Select>` só EXIBE o rótulo de um valor que esteja
  // presente em `options` — enquanto `measurementsQuery` (EP-SAN-12) ainda não
  // respondeu (ou, em produção, demora/falha), a lista fica vazia e o campo
  // aparenta estar sem valor mesmo com o dado certo já no form. Fixa isso
  // incluindo o valor JÁ hidratado como opção válida sempre que ele ainda não
  // aparecer na lista vinda da query — assim que a query resolver com esse
  // mesmo uuid, a entrada da query o substitui normalmente (não duplica).
  const hydratedValue = measurementField.value;
  const measurementOptions: Option<string>[] =
    hydratedValue &&
    !measurementOptionsFromQuery.some((option) => option.value === hydratedValue.value)
      ? [hydratedValue, ...measurementOptionsFromQuery]
      : measurementOptionsFromQuery;

  useEffect(() => {
    // Regra 3 da Tarefa — auto-seleciona quando a cascata devolve exatamente
    // 1 opção (mirror `AppropriationStockTab.tsx`/`ProcessingSanitaryItemRow.tsx`).
    if (measurementOptions.length === 1 && !measurementField.value) {
      measurementField.onChange(measurementOptions[0]);
    }
    // eslint-disable-next-line
  }, [measurementsQuery.data, productUuid]);

  // Regra da Tarefa ("Riscos + solução" item 3) — Estoque vem DIRETO da opção
  // de Stock selecionada (`quantity`), SEM 2ª chamada a `EP-SAN-11` (mirror
  // GAP-FE-244 item 1 do `FeedlotSanitaryItemRow`, linhas 185-189).
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

  // Guarda a transição "suficiente" → "insuficiente" para o aviso abaixo —
  // BUGFIX (dono, screenshot de dezenas de toasts empilhados): o `useEffect`
  // reavalia a cada resolução assíncrona de QUALQUER dependência (measurements,
  // factor info etc.), o que na hidratação de edição dispara o mesmo
  // `toaster.create` repetidas vezes sem o usuário ter mudado nada. Só
  // dispara o toast na transição false→true; permite disparar de novo se
  // sair do estado insuficiente e voltar a entrar nele.
  const wasInsufficientRef = useRef(false);

  useEffect(() => {
    // Regra 5 da Tarefa — client-side, NÃO bloqueia submit (mirror `swal` do
    // legado, `stockInsufficientWarning`).
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
    const totalDose = doseBase * animalsCount;
    const isInsufficient = totalDose > stockBalance;
    if (isInsufficient && !wasInsufficientRef.current) {
      toaster.create({
        type: 'warning',
        title: text.sections.items,
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

  // Regra 1 da Tarefa / Regra da FID-G3F IG-03 — cascata CONFIRMADA como
  // Armazém→Produto, NUNCA o reverso: sem armazém selecionado, a lista de
  // produtos fica vazia (Select desabilitado) — sem fallback para um
  // catálogo geral de produtos (mirror GAP-FE-244 item 3).
  async function listRowProducts(): Promise<ResponsePagination<SanitaryStockRawOption[]>> {
    if (!warehouseUuid) return EMPTY_STOCK_OPTIONS_PAGE;
    // Cast documentado no cabeçalho do arquivo — o service tipa o retorno
    // como já decorado (`SanitaryStockFieldOption[]`), mas o Resource real
    // (`StockAvailabilityResource`) devolve o shape bruto sem `label`/`value`.
    return listSanitaryProductsByWarehouse(warehouseUuid) as unknown as Promise<
      ResponsePagination<SanitaryStockRawOption[]>
    >;
  }

  function handleWarehouseChange(option: Option<string> | null) {
    warehouseField.onChange(option ?? null);
    // Armazém trocado invalida o produto/lote já escolhido (mirror
    // `handleWarehouseChange` do `FeedlotSanitaryItemRow`).
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
              // `FeedlotSanitaryItemRow`/legado `getProductsByWarehouse`.
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
          <InputReadOnly label={text.fields.stock} value={formatStockQuantity(displayedStock)} />
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

        <Box flex="1" minW="200px">
          <SelectAsyncPaginate
            name={costCenterField.name}
            label={text.fields.costCenter}
            service={listCostCenterOptions}
            mapOptions={(item: CostCenterRef) => ({
              label: `${item.code} — ${item.description}`,
              value: item.uuid,
            })}
            findParams={findParamsFromSearch}
            value={costCenterField.value ?? null}
            onChange={(option: unknown) =>
              costCenterField.onChange((option as Option<string>) ?? null)
            }
            menuPortalTarget={document.body}
            menuPosition="fixed"
            isDisabled={isDisabled}
          />
        </Box>

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

export default SanitaryItemRow;
