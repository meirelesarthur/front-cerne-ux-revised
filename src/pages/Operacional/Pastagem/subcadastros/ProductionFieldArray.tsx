// src/pages/Operacional/Pastagem/subcadastros/ProductionFieldArray.tsx
// -----------------------------------------------------------------------------
// Aba "Produção" — TASK-PAST-FE-04 + TASK-PAST-FIX-FE-03 (cascata fiel).
// `useFieldArray` de `productions`. Produção não decrementa estoque (é
// lançamento de saída) — Estoque aqui é SÓ DISPLAY, nunca enviado no
// payload (`PastureProductionPayload` inalterado:
// `product_uuid`/`measurement_uuid`/`quantity`/`note`).
//
// TASK-PAST-FIX-FE-03 — reconstrói a linha com a cascata fiel ao legado
// (`_production.blade.php`/`_card_production.blade.php`), reusando 100% de
// endpoints/lógica já em produção na feature irmã `Appropriations`
// (`AppropriationProductionTab.tsx`, GAP-BE-612/632/641/642, todos ✅
// CONCLUÍDOS) — NENHUM endpoint novo:
//   1. Armazém de Produção (`productions_warehouse_uuid`) → habilita o
//      Select de Produto. TASK-PAST-FIX-FE-03b (fidelidade de layout ao
//      legado, decisão do dono): o Select do Armazém RELOCOU do cabeçalho
//      (`HeaderFieldsPastagem.tsx`) para o TOPO desta aba, mirror exato do
//      legado (`_production.blade.php`: `Form::select('productions_warehouse_id',
//      ...)` no topo da própria aba, `readonly` quando `isset($item)`).
//      Mesmo nome de campo RHF/mesmo `control` raiz — só o componente que
//      renderiza o Controller mudou. Readonly em modo EDIÇÃO (`isEditing`,
//      não inventa condição nova); em criação, `SelectAsyncPaginate` normal.
//   2. Produto — `GET /products/options` (`listProductOptions`) filtrado
//      por `group_uuid[]` = uuid(s) do grupo "Produção" (`group_id=8`
//      legado), resolvido 1x via `listProductGroupOptions` + filtro por
//      RÓTULO EXATO (mirror `AppropriationProductionTab.tsx`). A option já
//      embute `measurement`/`measurement_second`/`factor`/`factor_type`
//      (`ProductOption`, GAP-BE-641/642) — sem round-trip extra.
//   3. Un. Medida — Select LOCAL (não `SelectAsyncPaginate`, catálogo já
//      resolvido em memória pela option do Produto): dedupe por uuid entre
//      `measurement`/`measurementSecond`; 1 opção válida → auto-seleciona.
//   4. Estoque (novo, readonly) — `GET /stocks/available?warehouse_uuid=&
//      product_uuid=` (`listStockAvailability`, JÁ usado por esta mesma
//      feature em `ProductsFieldArray.tsx`), SEM `allow_pointing` (mirror
//      do contrato do endpoint para a aba "Produção"). Conversão por fator
//      quando a UM escolhida é a SECUNDÁRIA do produto — direção Produção:
//      `factor_type==='M'` DIVIDE, `factor_type==='D'` MULTIPLICA (mirror
//      EXATO `AppropriationProductionTab.tsx`).
//
// Readonly em edição (CLM-64, mesmo racional de `ProductsFieldArray.tsx`/
// `EquipmentsFieldArray.tsx`/`ServicesFieldArray.tsx` desta feature): linha
// já persistida trava Produto/Un. Medida (`InputReadOnly`) — Estoque
// continua consultado normalmente (display-only, não é campo de
// identidade). Sem `factor`/`factor_type` embutido (linha hidratada do
// detalhe não passou pela option do catálogo), o Estoque cai no valor
// bruto — mesma salvaguarda defensiva de `AppropriationProductionTab.tsx`
// ("sem factor configurado, cai no bruto, nunca quebra a tela").
//
// `#newProductModal` — reuso do `ProductFormModal` já migrado, inalterado
// desde TASK-PAST-FE-04.
//
// OBSERVAÇÃO (não é Gap): `PastureProductionData` real não tem campo
// `final_quantity` (só `product_uuid`/`measurement_uuid`/`quantity`/`note`
// — ver `@/@types/v2/Pastures` cabeçalho); Produção de Pastagem não tem
// "Quantidade Final" (diferente de Appropriations) — o único campo de
// quantidade é `quantity`.
// -----------------------------------------------------------------------------

import { useState } from 'react';
import type { ElementType } from 'react';

import { Box, Flex, Icon, IconButton, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { ProductFormModal } from '@/pages/CadastrosBase/Produtos/Catalogo/ProductFormModal';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listProductGroupOptions } from '@/services/v2/ProductGroups/product-group-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import { listStockAvailability } from '@/services/v2/Stocks/stock-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { PastureForm } from '@/@types/v2/Pastures';
import type { ProductOption } from '@/@types/v2/Products';
import type { StockAvailabilityItem } from '@/@types/v2/Stocks';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import type { ProductFormModalSavedPayload } from '@/pages/CadastrosBase/Produtos/Catalogo/ProductFormModal';
import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

// TASK-PAST-FIX-FE-03 — grupo elegível à aba Produção de Pastagem, mirror
// EXATO do legado (`group_id=8`, `GroupProductReference::PRODUCTION`,
// `app/Enums/GroupProductReference.php` do fork API — confirmado por
// leitura direta do Enum/Seeder, rótulo seedado verbatim "Produção"). O
// lookup enxuto (`GET /product-groups/options`) só expõe `{uuid,label}` —
// sem id/slug — então a resolução é por RÓTULO EXATO, mesma técnica de
// `AppropriationProductionTab.tsx`. DIFERENTE da feature irmã: Pastagem só
// cita `group_id=8` no legado (`_production.blade.php`) — o grupo 18
// ("Ração/Alimentação/Nutrição", elegível em Appropriations) NÃO se aplica
// aqui, por instrução explícita do Arquiteto desta Tarefa.
const PASTURE_PRODUCTION_ELIGIBLE_GROUP_LABELS = ['Produção'];

type ProductOptionWithMeasurement = Option<string> & {
  measurement?: Option<string> | null;
  measurementSecond?: Option<string> | null;
  factor?: number | null;
  factorType?: { value: 'M' | 'D'; label: string } | null;
};

export interface ProductionFieldArrayProps {
  control: Control<PastureForm>;
  errors: FieldErrors<PastureForm>;
  watch: UseFormWatch<PastureForm>;
  setValue: UseFormSetValue<PastureForm>;
  isLoading: boolean;
  canSave: boolean;
  /** TASK-PAST-FIX-FE-03b — modo edição (mirror `isset($item)` do legado):
   *  trava "Armazém de Produção" como `InputReadOnly`. */
  isEditing: boolean;
}

export function ProductionFieldArray({
  control,
  watch,
  setValue,
  isLoading,
  canSave,
  isEditing,
}: ProductionFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.pastures.pasture.form;
  const productionText = text.productions;

  const { fields, append, remove } = useFieldArray({ control, name: 'productions' });
  const isDisabled = !canSave || isLoading;

  const [newProductRowIndex, setNewProductRowIndex] = useState<number | null>(null);

  // TASK-PAST-FIX-FE-03b — "Armazém de Produção" agora é renderizado por
  // ESTE componente (relocado do cabeçalho); lido via `watch` (já prop
  // desta aba) para escopar Produto/Estoque — mesmo racional de antes, só
  // a origem do dado mudou de "prop vindo do pai" para "watch local".
  const productionsWarehouseUuid = watch('productions_warehouse_uuid')?.value;

  function listProductionsWarehouseOptions(params: {
    search?: string;
    page?: number;
    per_page?: number;
  }) {
    return listWarehouseOptions({ ...params, type: 'producao' });
  }

  // TASK-PAST-FIX-FE-03 — resolve o uuid do grupo elegível (id 8, "Produção")
  // UMA vez, via o lookup já existente sem gate (mirror
  // `AppropriationProductionTab.tsx`, `productionEligibleGroupUuidsQuery`).
  const eligibleGroupUuidsQuery = useQuery({
    queryKey: ['pasture-production-eligible-group-uuids'],
    queryFn: async () => {
      const response = await listProductGroupOptions({});
      return response.data.items
        .filter((group) => PASTURE_PRODUCTION_ELIGIBLE_GROUP_LABELS.includes(group.label))
        .map((group) => group.uuid);
    },
    staleTime: 5 * 60 * 1000,
  });

  function handleAdd() {
    append({ product_uuid: null, measurement_uuid: null, quantity: null, note: null });
  }

  function handleProductSaved(payload: ProductFormModalSavedPayload) {
    if (newProductRowIndex !== null) {
      setValue(`productions.${newProductRowIndex}.product_uuid`, {
        label: payload.label,
        value: payload.uuid,
      });
    }
    setNewProductRowIndex(null);
  }

  return (
    <Box pt={4}>
      {/* "Armazém de Produção" — TASK-PAST-FIX-FE-03b, campo ÚNICO de
          cabeçalho DE ABA (mirror `warehouse_production_uuid` em
          `AppropriationProductionTab.tsx`), NÃO item de `productions[]`;
          fora do `useFieldArray`. Readonly em edição (`isEditing`, mirror
          `isset($item)` do legado). */}
      <SimpleGrid columns={columnsForm.default} gap={4} mb={5}>
        <Controller
          name="productions_warehouse_uuid"
          control={control}
          render={({ field }) =>
            isEditing ? (
              <InputReadOnly
                label={text.fields.productionsWarehouse}
                value={field.value?.label ?? '—'}
              />
            ) : (
              <SelectAsyncPaginate
                name={field.name}
                label={text.fields.productionsWarehouse}
                placeholder={text.placeholders.productionsWarehouse}
                service={listProductionsWarehouseOptions}
                mapOptions={(item: WarehouseOption) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )
          }
        />
      </SimpleGrid>

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.emptyRow}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <ProductionItemRow
              key={field.id}
              index={index}
              control={control}
              watch={watch}
              setValue={setValue}
              isDisabled={isDisabled}
              eligibleGroupUuids={eligibleGroupUuidsQuery.data}
              productionsWarehouseUuid={productionsWarehouseUuid}
              productionText={productionText}
              removeItemLabel={text.removeItem}
              onNewProduct={() => setNewProductRowIndex(index)}
              onRemove={() => remove(index)}
            />
          ))}
        </Flex>
      )}

      <Button
        title={text.addItem}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={isDisabled}
      />

      <ProductFormModal
        isOpen={newProductRowIndex !== null}
        onClose={() => setNewProductRowIndex(null)}
        onSaved={handleProductSaved}
      />
    </Box>
  );
}

// -----------------------------------------------------------------------------
// Linha de item — componente próprio (1 componente por linha, mirror
// `ProductionItemRow` de `AppropriationProductionTab.tsx`) para permitir o
// `useQuery` de "Estoque" por linha sem violar Rules of Hooks dentro do
// `.map()` de `useFieldArray`.
// -----------------------------------------------------------------------------

interface ProductionTextShape {
  fields: { product: string; measurement: string; stock: string; quantity: string; note: string };
  placeholders: { product: string; measurement: string };
  newProductButton: string;
}

interface ProductionItemRowProps {
  index: number;
  control: Control<PastureForm>;
  watch: UseFormWatch<PastureForm>;
  setValue: UseFormSetValue<PastureForm>;
  isDisabled: boolean;
  eligibleGroupUuids: string[] | undefined;
  productionsWarehouseUuid?: string;
  productionText: ProductionTextShape;
  removeItemLabel: string;
  onNewProduct: () => void;
  onRemove: () => void;
}

function ProductionItemRow({
  index,
  control,
  watch,
  setValue,
  isDisabled,
  eligibleGroupUuids,
  productionsWarehouseUuid,
  productionText,
  removeItemLabel,
  onNewProduct,
  onRemove,
}: ProductionItemRowProps) {
  const isExistingRow = !!watch(`productions.${index}.uuid`);

  const productOption = watch(`productions.${index}.product_uuid`) as
    ProductOptionWithMeasurement | null | undefined;
  const productUuid = productOption?.value;
  const selectedMeasurementUuid = (
    watch(`productions.${index}.measurement_uuid`) as Option<string> | null | undefined
  )?.value;

  // TASK-PAST-FIX-FE-03 — Estoque REAL via `GET /stocks/available`, SEM
  // `allow_pointing` (mirror da aba Produção de Appropriations). Habilitado
  // só com Armazém de Produção (cabeçalho) E Produto (desta linha)
  // escolhidos; funciona tanto para linha nova quanto já persistida.
  const stockQuery = useQuery({
    queryKey: ['pasture-production-stock', productionsWarehouseUuid, productUuid],
    queryFn: async () => {
      const response = await listStockAvailability({
        warehouse_uuid: productionsWarehouseUuid,
        product_uuid: productUuid,
      });
      const items = response.data.items ?? [];
      return (
        items.find((item: StockAvailabilityItem) => item.product.uuid === productUuid) ??
        items[0] ??
        null
      );
    },
    enabled: Boolean(productionsWarehouseUuid) && Boolean(productUuid),
    staleTime: 60 * 1000,
    retry: false,
  });

  const rawStockQuantity = stockQuery.data ? Number(stockQuery.data.quantity) : null;

  // Conversão por fator — direção de PRODUÇÃO (`_production.blade.php:
  // 150-156`): `factor_type==='M'` DIVIDE, `factor_type==='D'` MULTIPLICA.
  // Sem `factor`/`factor_type` embutido na option (linha já persistida,
  // hidratada do detalhe — não passou pelo catálogo), cai no bruto (nunca
  // quebra a tela, mirror `AppropriationProductionTab.tsx`).
  function convertProductionStock(raw: number): number {
    const nativeMeasurementUuid = productOption?.measurement?.value;
    const isNativeMeasurement =
      !selectedMeasurementUuid || selectedMeasurementUuid === nativeMeasurementUuid;
    if (isNativeMeasurement) return raw;

    const factor = productOption?.factor;
    const factorType = productOption?.factorType?.value;
    if (!factor || factor <= 0) return raw;

    if (factorType === 'M') return raw / factor;
    if (factorType === 'D') return raw * factor;
    return raw;
  }

  const stockDisplayValue =
    rawStockQuantity !== null
      ? convertProductionStock(rawStockQuantity).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '—';

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name={`productions.${index}.product_uuid`}
          control={control}
          render={({ field: rowField }) =>
            isExistingRow ? (
              <InputReadOnly
                label={productionText.fields.product}
                value={rowField.value?.label ?? '—'}
              />
            ) : (
              <SelectAsyncPaginate
                name={rowField.name}
                label={productionText.fields.product}
                placeholder={productionText.placeholders.product}
                service={listProductOptions}
                mapOptions={(item: ProductOption) => ({
                  label: item.code ? `${item.code} — ${item.description}` : item.description,
                  value: item.uuid,
                  // TASK-PAST-FIX-FE-03 — embute as 1-2 unidades válidas
                  // DO PRODUTO na própria option (mirror
                  // `AppropriationProductionTab.tsx`), sem round-trip
                  // extra: o Select de "Un. Medida" abaixo lê estes
                  // campos da option corrente.
                  measurement: item.measurement
                    ? { label: item.measurement.description, value: item.measurement.uuid }
                    : null,
                  measurementSecond: item.measurement_second
                    ? {
                        label: item.measurement_second.description,
                        value: item.measurement_second.uuid,
                      }
                    : null,
                  factor: item.factor ?? null,
                  factorType: item.factor_type ?? null,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  group_uuid: eligibleGroupUuids ?? [],
                })}
                cacheUniqs={[eligibleGroupUuids?.join(',')]}
                value={rowField.value ?? undefined}
                onChange={(option: any) => {
                  rowField.onChange(option ?? null);
                  // Trocar o Produto invalida a Un. Medida escolhida —
                  // mirror cascata Armazém→Produto já usada nesta
                  // feature. Dedupe por uuid: 1 opção válida após
                  // dedupe → auto-seleciona; 2 opções → escolha manual.
                  const dedupedMeasurements = Array.from(
                    new Map(
                      [option?.measurement, option?.measurementSecond]
                        .filter((candidate): candidate is Option<string> => Boolean(candidate))
                        .map((candidate) => [candidate.value, candidate])
                    ).values()
                  );
                  setValue(
                    `productions.${index}.measurement_uuid`,
                    dedupedMeasurements.length === 1 ? dedupedMeasurements[0] : null
                  );
                }}
                isRequired
                // Nuance registrada (Arquiteto, não do dono): o Produto
                // é filtrado só por grupo (Stock é que liga
                // Produto+Armazém), mas o Select fica travado até o
                // Armazém de Produção ser escolhido — preserva o fluxo
                // sequenciado do legado sem exigir filtro novo na API.
                isDisabled={isDisabled || !eligibleGroupUuids || !productionsWarehouseUuid}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                // EST-07 — botão "novo produto" migrado do
                // `IconButtonTable` avulso ao lado do select para o
                // `labelAction`, mirror EXATO do padrão
                // `CreateOrUpdateNfe.tsx`. Create-only (sem alternância de
                // ícone editar).
                labelActionTooltip={productionText.newProductButton}
                labelAction={
                  <IconButton
                    aria-label={productionText.newProductButton}
                    variant="ghost"
                    size="2xs"
                    minH="0"
                    h="20px"
                    w="20px"
                    minW="0"
                    p="0"
                    disabled={isDisabled}
                    onClick={onNewProduct}
                  >
                    <Icon as={FiPlus} boxSize="16px" color="primaryMain" />
                  </IconButton>
                }
              />
            )
          }
        />

        {/* Un. Medida — Select LOCAL (catálogo já resolvido em memória pela
            option do Produto, sem endpoint novo), dedupe por uuid. Gateado
            até o Produto ser escolhido. */}
        <Controller
          name={`productions.${index}.measurement_uuid`}
          control={control}
          render={({ field: rowField }) => {
            if (isExistingRow) {
              return (
                <InputReadOnly
                  label={productionText.fields.measurement}
                  value={rowField.value?.label ?? '—'}
                />
              );
            }

            const measurementOptions = Array.from(
              new Map(
                [productOption?.measurement, productOption?.measurementSecond]
                  .filter((option): option is Option<string> => Boolean(option))
                  .map((option) => [option.value, option])
              ).values()
            );

            return (
              <Select
                name={rowField.name}
                label={productionText.fields.measurement}
                placeholder={productionText.placeholders.measurement}
                value={rowField.value ?? null}
                onChange={(option) => rowField.onChange(option ?? null)}
                options={measurementOptions}
                isDisabled={isDisabled || !productUuid || measurementOptions.length <= 1}
              />
            );
          }}
        />

        {/* Estoque — TASK-PAST-FIX-FE-03. Readonly, display-only, NUNCA
            enviado no payload (`PastureProductionPayload` inalterado). */}
        <InputReadOnly label={productionText.fields.stock} value={stockDisplayValue} />

        <Controller
          name={`productions.${index}.quantity`}
          control={control}
          render={({ field: rowField }) => (
            <NumberInput
              name={rowField.name}
              label={productionText.fields.quantity}
              allowDot
              decimalPlaces={2}
              value={rowField.value ?? null}
              onValueChange={(value) => rowField.onChange(value)}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`productions.${index}.note`}
          control={control}
          render={({ field: rowField }) => (
            <Textarea
              label={productionText.fields.note}
              name={rowField.name}
              value={rowField.value ?? ''}
              onChange={(e) => rowField.onChange(e.target.value)}
              disabled={isDisabled}
            />
          )}
        />
      </SimpleGrid>

      <Flex justify="flex-end" mt={3}>
        <IconButtonTable
          aria-label={removeItemLabel}
          mensegerTooltip={removeItemLabel}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={isDisabled}
          onClick={onRemove}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Box>
  );
}
