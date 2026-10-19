// src/pages/Operacional/Reproducao/Acasalamento/sections/SimplifiedRow.tsx
// -----------------------------------------------------------------------------
// Linha de `bm-subform-simplified` (BreedingMating, F-016, 97-Esteiras/001,
// TASK-BM-FE-05, contrato de tela §6.3.3, CLM-004, C10). 7 campos na ordem do
// legado: `Animal` · `Armazém` · `Produto` · `Un. Medida` ·
// `Estoque` (`InputReadOnly`, formatado) · `Quantidade` (`KgInput` sob
// `Controller`, extraindo `floatValue`) · `Funcionário/Inseminador`.
//
// Cascata C10 (3 encadeadas): `Armazém` → repopula `Produto`; `Produto` →
// preenche `Un. Medida` + `Estoque`; `Un. Medida` → reconverte `Estoque` pelo
// fator (`factor_type`: 'D' divide, 'M' multiplica — CLM-006). `Quantidade >
// Estoque` → trava a digitação e reverte (nunca envia estoque negativo ao
// servidor, mas o servidor é a autoridade final — DoD regra 11: nenhuma
// validação de estoque no submit, só a trava de digitação aqui).
//
// `Armazém` usa `lookups.warehouses` (EP-BM-03/04, fixo — contrato de tela
// §5.3), NUNCA o catálogo global paginado (`listWarehouseOptions`) — a API
// desta fatia já entrega o lookup fixo. `Produto` usa
// `GET /stocks/available?warehouse_uuid=&protocol=true` (mirror
// `ProtocolSeasonItemsFieldArray.tsx`, mesma ASSUNÇÃO documentada em
// `ProtocolTotalizer.tsx` sobre o filtro `protocol=true`). `Un. Medida` usa o
// catálogo global (`listMeasurementOptions`, mirror EXATO do mesmo sibling).
// `Animal` usa `listAnimalOptions` sem `batch_uuid` — o lote de reprodução é
// opcional/travado em modo Simplificado (CLM-004), não há lote para escopar.
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Box, Flex, Icon, SimpleGrid } from '@chakra-ui/react';
import { Control, Controller, UseFormSetValue, UseFormTrigger, useWatch } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { KgInput } from '@/components/Form/kgInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { columnsForm } from '@/constants/coluns-form';

import { listAnimalOptions } from '@/services/v2/Animals/animal-service';
import { listMeasurementOptions } from '@/services/v2/Measurements/measurement-service';
import { listStockAvailability } from '@/services/v2/Stocks/stock-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AnimalOptionListItem } from '@/@types/v2/Animals';
import type { BreedingMatingForm, EntityOptionRef } from '@/@types/v2/BreedingMating';
import type { MeasurementOption } from '@/@types/v2/Measurements';
import type { StockAvailabilityItem } from '@/@types/v2/Stocks';

// A seleção do Produto embute os dados da cascata (mirror EXATO
// `ProductCascadeOption` de `ProtocolSeasonItemsFieldArray.tsx`) — nunca
// persistido além de `value`/`label` (o mapper só lê `row.product!.value`).
interface ProductCascadeOption extends Option<string> {
  stock_uuid?: string | null;
  quantity?: number;
  measurement_uuid?: string;
  measurement_label?: string;
  second_measurement_uuid?: string | null;
  second_measurement_label?: string | null;
  factor?: number | null;
  factor_type?: 'M' | 'D' | null;
}

function mapAnimalOption(item: AnimalOptionListItem): Option<string> {
  return { label: item.label, value: item.uuid };
}

function mapEntityOptionRefToOption(ref: EntityOptionRef): Option<string> {
  return { label: ref.label, value: ref.uuid };
}

function mapMeasurementOption(item: MeasurementOption): Option<string> {
  return { label: item.description, value: item.uuid };
}

function mapProductOptionFromStock(item: StockAvailabilityItem): ProductCascadeOption {
  return {
    label: item.product.description,
    value: item.product.uuid,
    stock_uuid: item.uuid,
    quantity: item.quantity,
    measurement_uuid: item.measurement?.uuid,
    measurement_label: item.measurement?.description,
    second_measurement_uuid: item.measurement_second?.uuid ?? null,
    second_measurement_label: item.measurement_second?.description ?? null,
    factor: item.factor,
    factor_type: item.factor_type,
  };
}

function formatQuantity(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface SimplifiedRowProps {
  index: number;
  control: Control<BreedingMatingForm>;
  setValue: UseFormSetValue<BreedingMatingForm>;
  trigger: UseFormTrigger<BreedingMatingForm>;
  languageGB: LanguageDate;
  disabled: boolean;
  warehouseOptions: EntityOptionRef[];
  providerOptions: EntityOptionRef[];
  onRemove: () => void;
}

export function SimplifiedRow({
  index,
  control,
  setValue,
  trigger,
  languageGB,
  disabled,
  warehouseOptions,
  providerOptions,
  onRemove,
}: SimplifiedRowProps) {
  const text = languageGB.breedingMatings.breedingMating.form.sections.simplified;

  const warehouseSelectOptions = warehouseOptions.map(mapEntityOptionRefToOption);
  const providerSelectOptions = providerOptions.map(mapEntityOptionRefToOption);

  const warehouse = useWatch({ control, name: `simplified_animals.${index}.warehouse` });
  const product = useWatch({
    control,
    name: `simplified_animals.${index}.product`,
  }) as ProductCascadeOption | null;
  const stock = useWatch({ control, name: `simplified_animals.${index}.stock` }) ?? 0;
  const quantity = useWatch({ control, name: `simplified_animals.${index}.quantity` });
  const hasWarehouse = !!warehouse?.value;

  // CLM-006 — conversão só quando a medida escolhida é a SECUNDÁRIA do
  // produto, com fator conhecido: 'D' divide, 'M' multiplica.
  function recomputeStock(cascadeProduct: ProductCascadeOption | null, measurementUuid?: string) {
    if (!cascadeProduct || cascadeProduct.quantity === undefined) {
      setValue(`simplified_animals.${index}.stock`, 0, { shouldDirty: true });
      return;
    }

    let nextStock = cascadeProduct.quantity;
    if (
      measurementUuid &&
      cascadeProduct.second_measurement_uuid &&
      measurementUuid === cascadeProduct.second_measurement_uuid &&
      cascadeProduct.factor
    ) {
      nextStock =
        cascadeProduct.factor_type === 'D'
          ? nextStock / cascadeProduct.factor
          : nextStock * cascadeProduct.factor;
    }

    setValue(`simplified_animals.${index}.stock`, nextStock, { shouldDirty: true });
    if (quantity !== null && quantity !== undefined) {
      void trigger(`simplified_animals.${index}.quantity`);
    }
  }

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name={`simplified_animals.${index}.animal`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.animal}
              service={listAnimalOptions}
              mapOptions={mapAnimalOption as any}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? null}
              onChange={(option: any) => field.onChange(option ?? null)}
              error={error?.message}
              isDisabled={disabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`simplified_animals.${index}.warehouse`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Select
              name={field.name}
              label={text.warehouse}
              options={warehouseSelectOptions}
              value={field.value}
              onChange={(option: Option<string> | null) => {
                field.onChange(option ?? null);
                // C10 (1/3) — Armazém muda: catálogo de Produto muda de
                // fonte, limpa a cascata inteira à frente.
                setValue(`simplified_animals.${index}.product`, null, { shouldDirty: true });
                setValue(`simplified_animals.${index}.measurement`, null, { shouldDirty: true });
                setValue(`simplified_animals.${index}.stock`, 0, { shouldDirty: true });
              }}
              error={error?.message}
              isDisabled={disabled}
            />
          )}
        />

        <Controller
          name={`simplified_animals.${index}.product`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.product}
              service={(params) =>
                listStockAvailability({
                  ...params,
                  warehouse_uuid: warehouse?.value,
                  protocol: true,
                })
              }
              mapOptions={mapProductOptionFromStock as any}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              cacheUniqs={[warehouse?.value]}
              value={field.value ?? null}
              onChange={(option: any) => {
                const cascadeOption = option as ProductCascadeOption | null;
                field.onChange(cascadeOption ?? null);
                // C10 (2/3) — Produto muda: preenche Un. Medida + Estoque.
                setValue(
                  `simplified_animals.${index}.measurement`,
                  cascadeOption?.measurement_uuid
                    ? {
                        value: cascadeOption.measurement_uuid,
                        label: cascadeOption.measurement_label ?? '',
                      }
                    : null,
                  { shouldDirty: true }
                );
                recomputeStock(cascadeOption, cascadeOption?.measurement_uuid);
              }}
              error={error?.message}
              isDisabled={disabled || !hasWarehouse}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`simplified_animals.${index}.measurement`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.measurement}
              service={listMeasurementOptions}
              mapOptions={mapMeasurementOption as any}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? null}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                // C10 (3/3) — Un. Medida muda MANUALMENTE: reconverte
                // Estoque pelo fator embutido na seleção atual do Produto.
                recomputeStock(product, option?.value ?? undefined);
              }}
              error={error?.message}
              isDisabled={disabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <InputReadOnly
          name={`simplified-stock-${index}`}
          label={text.stock}
          value={formatQuantity(stock)}
        />

        <Controller
          name={`simplified_animals.${index}.quantity`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <KgInput
              name={field.name}
              label={text.quantity}
              allowDot
              decimalPlaces={3}
              value={field.value ?? ''}
              onChange={(_event, _masked, floatValue) => {
                // Trava a digitação quando excede o estoque disponível — a
                // exibição reverte porque `field.value` não muda (DoD regra
                // 11 / bm-effect-stock-decrement: nenhuma validação de
                // estoque acontece no submit, só esta trava de digitação).
                if (floatValue > stock) return;
                field.onChange(floatValue);
              }}
              error={error?.message}
              isRequired
              isReadOnly={disabled}
            />
          )}
        />

        <Controller
          name={`simplified_animals.${index}.provider`}
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={text.responsible}
              options={providerSelectOptions}
              value={field.value}
              onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
              isDisabled={disabled}
            />
          )}
        />
      </SimpleGrid>

      <Flex justify="flex-end" mt={3}>
        <IconButtonTable
          aria-label={languageGB.defaltStrings.delete}
          mensegerTooltip={languageGB.defaltStrings.delete}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={disabled}
          onClick={onRemove}
        >
          <Icon as={FiTrash2 as ElementType} />
        </IconButtonTable>
      </Flex>
    </Box>
  );
}

export default SimplifiedRow;
