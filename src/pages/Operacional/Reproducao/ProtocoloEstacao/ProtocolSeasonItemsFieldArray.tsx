// src/pages/Operacional/Reproducao/ProtocoloEstacao/ProtocolSeasonItemsFieldArray.tsx
// -----------------------------------------------------------------------------
// Subcadastro GRID repetível `protocol_season_products` (TASK-FE-1055 —
// estrutura/XOR + TASK-FE-1056 — cascata armazém→estoque/produto, conversão
// de unidade CAL-004, clamp de quantidade CAL-009). 9 campos RENDERIZADOS dos
// 11 do `field_manifest` item (`identification` calculado por TASK-FE-1057;
// `selected_measurement_id` NAO_APLICAVEL — absorvido por `measurement_uuid`).
//
// `useFieldArray({ control, name: 'items' })` vive no formulário PAI
// (`CreateOrUpdateProtocolSeason.tsx`) — mirror EXATO `BatchesFieldArray.tsx`:
// `control`/`fields`/`append`/`remove` chegam por prop, este componente só
// RENDERIZA linhas e decide cascata/XOR/clamp POR LINHA (não há decisão de
// negócio compartilhada entre linhas, diferente do dedupe de
// `BatchesFieldArray`/`check-date`).
//
// Cascata armazém→produto/estoque (SURF-040, LKP-004/007/008): options do
// Produto embutem `stock_uuid`/`measurement_uuid`/`measurement_second_uuid`/
// `factor`/`factor_type`/`quantity` diretamente no `Option` selecionado
// (mirror `has_lot` embutido em `EntradaInsumosItemsTab.tsx`) — sem round-trip
// adicional por seleção. `group_uuid`/recorte de catálogo (LKP-004, DECISÃO 5
// herdada) FECHADO por TASK-FE-2778/TASK-BE-1076: os dois ramos (com e sem
// armazém) passam `protocol=true`, mirror do trio group 15/cat 28/kinds do
// legado — achado antigo TASK-FE-1051 bloqueio 3 encerrado.
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text, useDisclosure } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormSetValue,
  UseFormTrigger,
  useWatch,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';
import { protocolSeasonServiceOptions } from '@/constants/operacional/reproducao/protocolSeason';

import { listProductOptions } from '@/services/v2/Products/product-service';
import { listStockAvailability } from '@/services/v2/Stocks/stock-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { ProtocolSeasonForm } from '@/@types/v2/Operacional/Reproducao/protocolSeason';
import type { ProductOption } from '@/@types/v2/Products';
import type { StockAvailabilityItem } from '@/@types/v2/Stocks';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import { formatStockDisplay } from './utils/formatStockDisplay';

// `Option<string>` estendida — a seleção do Produto embute os dados da
// cascata (LKP-004 sem armazém / LKP-007-008 com armazém), mirror `has_lot`
// de `EntradaInsumosItemsTab.tsx`. Nunca persistido além de `value`/`label`
// (o payload real usa só `product_uuid`/`measurement_uuid`/`stock_uuid`,
// TASK-FE-1059).
interface ProductCascadeOption extends Option<string> {
  stock_uuid?: string | null;
  quantity?: number;
  /** TASK-FE-2778 (§2 da Tarefa) — `products.min_stock`, aditivo. Alimenta o
   *  aviso de estoque mínimo; a UI ainda não o consome, mas o dado deixa de
   *  ser descartado no mapper (mirror legado `data-min-stock`). */
  min_stock?: number | null;
  measurement_uuid?: string;
  measurement_label?: string;
  second_measurement_uuid?: string | null;
  second_measurement_label?: string | null;
  factor?: number | null;
  factor_type?: 'M' | 'D' | null;
}

// Sem armazém — LKP-004, `protocol=true` (TASK-BE-1076). LABEL = `description`
// puro: o legado NUNCA mostra o código do produto neste select (achado
// TASK-FE-2778, removido o prefixo `código — ` que o mapper antigo inventava).
function mapProductOptionWithoutWarehouse(item: ProductOption): ProductCascadeOption {
  return {
    label: item.description,
    value: item.uuid,
    stock_uuid: null,
    quantity: 0,
    min_stock: null,
    measurement_uuid: item.measurement?.uuid,
    measurement_label: item.measurement?.description,
    second_measurement_uuid: item.measurement_second?.uuid ?? null,
    second_measurement_label: item.measurement_second?.description ?? null,
    factor: item.factor ?? null,
    factor_type: item.factor_type?.value ?? null,
  };
}

// Com armazém — LKP-007/008, `GET /stocks/available`. LABEL implementado
// LITERALMENTE como o legado (`_forms.blade.php:159-163`/`:258-263`,
// TASK-FE-2778 §1): o condicional é por `lot` (discriminante "tem lote"), o
// texto exibido é `provider_lot` — nunca simplificar para `provider_lot ?
// ... `. Separador exato: `" - Lote: "`.
function mapProductOptionFromStock(item: StockAvailabilityItem): ProductCascadeOption {
  const label = item.lot
    ? `${item.product.description} - Lote: ${item.provider_lot ?? ''}`
    : item.product.description;

  return {
    label,
    value: item.product.uuid,
    stock_uuid: item.uuid,
    quantity: item.quantity,
    min_stock: item.min_stock,
    measurement_uuid: item.measurement?.uuid,
    measurement_label: item.measurement?.description,
    second_measurement_uuid: item.measurement_second?.uuid ?? null,
    second_measurement_label: item.measurement_second?.description ?? null,
    factor: item.factor,
    factor_type: item.factor_type,
  };
}

function mapWarehouseOption(item: WarehouseOption): Option<string> {
  return { label: `${item.initials} — ${item.description}`, value: item.uuid };
}

// Item 1 (FID-G1 Q1) — a Unidade NÃO é mais um catálogo GLOBAL
// (`listMeasurementOptions`/`GET /measurements/options`): a option do Produto
// JÁ EMBUTE a(s) unidade(s) do próprio produto (primária `measurement_uuid` +
// secundária opcional `second_measurement_uuid`, mappers acima). Sem produto
// selecionado não há unidade derivável — options vazio, mirror
// `option:selected.data('ums').units` do legado.
function buildMeasurementOptions(product: ProductCascadeOption | null): Option<string>[] {
  if (!product) return [];

  const options: Option<string>[] = [];

  if (product.measurement_uuid) {
    options.push({ value: product.measurement_uuid, label: product.measurement_label ?? '' });
  }

  if (product.second_measurement_uuid) {
    options.push({
      value: product.second_measurement_uuid,
      label: product.second_measurement_label ?? '',
    });
  }

  return options;
}

export interface ProtocolSeasonItemsFieldArrayProps {
  control: Control<ProtocolSeasonForm>;
  fields: FieldArrayWithId<ProtocolSeasonForm, 'items', 'id'>[];
  append: UseFieldArrayAppend<ProtocolSeasonForm, 'items'>;
  remove: UseFieldArrayRemove;
  errors: FieldErrors<ProtocolSeasonForm>;
  setValue: UseFormSetValue<ProtocolSeasonForm>;
  trigger: UseFormTrigger<ProtocolSeasonForm>;
  headerDate: string;
  disabled?: boolean;
}

export function ProtocolSeasonItemsFieldArray({
  control,
  fields,
  append,
  remove,
  errors,
  setValue,
  trigger,
  headerDate,
  disabled = false,
}: ProtocolSeasonItemsFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.protocolSeasons.protocolSeason.form.items;

  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const { open: isRemoveOpen, onOpen: onOpenRemove, onClose: onCloseRemove } = useDisclosure();

  const arrayError = (errors.items as any)?.message as string | undefined;

  function handleAdd() {
    append({
      identification: '',
      date: headerDate || '',
      time: null,
      warehouse_uuid: null,
      stock_uuid: null,
      product_uuid: null,
      service: null,
      measurement_uuid: null,
      stock_display: formatStockDisplay(0),
      quantity: null,
      description: '',
    });
  }

  function handleRequestRemove(index: number) {
    setRemoveIndex(index);
    onOpenRemove();
  }

  function handleConfirmRemove() {
    if (removeIndex !== null) {
      remove(removeIndex);
    }
    setRemoveIndex(null);
    onCloseRemove();
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {text.sectionTitle}
      </Text>

      {arrayError && (
        <Box mb={4}>
          <Text fontSize="sm" color="fg.error">
            {arrayError}
          </Text>
        </Box>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || text.sectionTitle}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <ProtocolSeasonItemRow
              key={field.id}
              index={index}
              control={control}
              errors={errors}
              setValue={setValue}
              trigger={trigger}
              disabled={disabled}
              onRequestRemove={handleRequestRemove}
            />
          ))}
        </Flex>
      )}

      <Button
        type="button"
        title={text.addButton}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />

      <DeleteConfirmDialog
        isOpen={isRemoveOpen}
        onClose={() => {
          onCloseRemove();
          setRemoveIndex(null);
        }}
        onConfirm={handleConfirmRemove}
        title={text.removeDialog.title}
        description={text.removeDialog.description}
        confirmButtonText={text.removeDialog.confirmButton}
        hideQuestionMark
        warningText=""
      />
    </Box>
  );
}

// -----------------------------------------------------------------------------
// Linha de item.
// -----------------------------------------------------------------------------

interface ProtocolSeasonItemRowProps {
  index: number;
  control: Control<ProtocolSeasonForm>;
  errors: FieldErrors<ProtocolSeasonForm>;
  setValue: UseFormSetValue<ProtocolSeasonForm>;
  trigger: UseFormTrigger<ProtocolSeasonForm>;
  disabled: boolean;
  onRequestRemove: (index: number) => void;
}

function ProtocolSeasonItemRow({
  index,
  control,
  errors,
  setValue,
  trigger,
  disabled,
  onRequestRemove,
}: ProtocolSeasonItemRowProps) {
  const { languageGB } = useLanguage();
  const itemsText = languageGB.protocolSeasons.protocolSeason.form.items;
  const text = itemsText.fields;

  const rowErrors = (errors.items as any)?.[index];

  const warehouseOption = useWatch({
    control,
    name: `items.${index}.warehouse_uuid`,
  }) as Option<string> | null;
  const productOption = useWatch({
    control,
    name: `items.${index}.product_uuid`,
  }) as ProductCascadeOption | null;
  const identification = useWatch({ control, name: `items.${index}.identification` }) as string;
  const stockDisplay = useWatch({ control, name: `items.${index}.stock_display` }) as string;
  const quantityValue = useWatch({ control, name: `items.${index}.quantity` });
  const hasWarehouse = !!warehouseOption?.value;

  function recomputeStockDisplay(
    product: ProductCascadeOption | null,
    measurementUuid?: string | null
  ) {
    if (!product || product.quantity === undefined || product.quantity === null) {
      setValue(`items.${index}.stock_display`, formatStockDisplay(0), { shouldDirty: true });
      return;
    }

    let quantity = product.quantity;
    // CAL-004 — conversão só quando a medida escolhida é a SECUNDÁRIA do
    // produto (`measurement_second`), com fator conhecido: 'D' divide, 'M'
    // multiplica (mirror exato do legado). Qualquer outra medida do
    // catálogo global (fora do par primária/secundária do produto) mantém o
    // saldo bruto — sem fator de conversão conhecido para converter.
    if (
      measurementUuid &&
      product.second_measurement_uuid &&
      measurementUuid === product.second_measurement_uuid &&
      product.factor
    ) {
      quantity =
        product.factor_type === 'D' ? quantity / product.factor : quantity * product.factor;
    }

    setValue(`items.${index}.stock_display`, formatStockDisplay(quantity), { shouldDirty: true });

    if (quantityValue !== null && quantityValue !== undefined) {
      void trigger(`items.${index}.quantity`);
    }
  }

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <InputReadOnly
          name={`items.${index}.identification`}
          label={text.identification}
          value={identification || '—'}
        />

        <Controller
          name={`items.${index}.date`}
          control={control}
          render={({ field }) => (
            <DateInput
              label={text.date}
              value={field.value ?? null}
              onChange={(value) => field.onChange(value ?? '')}
              error={rowErrors?.date?.message as string | undefined}
              isRequired
              disabled={disabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.time`}
          control={control}
          render={({ field }) => (
            <Input
              type="time"
              label={text.time}
              name={field.name}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value || null)}
              error={rowErrors?.time?.message as string | undefined}
              disabled={disabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.warehouse_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.warehouse}
              service={listWarehouseOptions}
              pageSize={200}
              mapOptions={mapWarehouseOption as any}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              // TASK-FE-2778 (§4, XOR) — `?? null`, NUNCA `?? undefined`: o
              // react-select fica NÃO-CONTROLADO com `undefined` e mantém o
              // rótulo interno mesmo depois do `setValue(..., null)` do XOR
              // com Serviço (causa raiz confirmada estaticamente da Tarefa).
              value={field.value ?? null}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                // troca de armazém invalida a seleção anterior de
                // produto/estoque desta linha (catálogo muda de fonte,
                // LKP-004 <-> LKP-007/008) — `setValue({shouldDirty:true})`,
                // NUNCA `reset()` (Lei 2 / anti-padrão de reset parcial).
                setValue(`items.${index}.product_uuid`, null, { shouldDirty: true });
                setValue(`items.${index}.measurement_uuid`, null, { shouldDirty: true });
                setValue(`items.${index}.stock_uuid`, null, { shouldDirty: true });
                setValue(`items.${index}.stock_display`, formatStockDisplay(0), {
                  shouldDirty: true,
                });
              }}
              error={rowErrors?.warehouse_uuid?.message as string | undefined}
              isDisabled={disabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`items.${index}.product_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.product}
              // Cascata SURF-040 (TASK-FE-2778/TASK-BE-1076): armazém vazio →
              // `GET /products/options?protocol=true` (LKP-004, recorte de
              // apontamento — achado TASK-FE-1051 bloqueio 3 encerrado);
              // armazém preenchido → `GET /stocks/available?warehouse_uuid=
              // &protocol=true` (LKP-007/008), sem round-trip extra por seleção.
              service={
                hasWarehouse
                  ? (((params: any) =>
                      listStockAvailability({
                        ...params,
                        warehouse_uuid: warehouseOption!.value,
                        protocol: true,
                      })) as any)
                  : (((params: any) => listProductOptions({ ...params, protocol: true })) as any)
              }
              mapOptions={
                (hasWarehouse ? mapProductOptionFromStock : mapProductOptionWithoutWarehouse) as any
              }
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              cacheUniqs={[warehouseOption?.value]}
              // TASK-FE-2778 (§4, XOR) — idem Armazém: `?? null`, nunca
              // `?? undefined` (react-select não-controlado).
              value={field.value ?? null}
              onChange={(option: any) => {
                const cascadeOption = option as ProductCascadeOption | null;
                field.onChange(cascadeOption ?? null);
                // Item 3 (FID-G1 Q3) — Produto e Serviço COEXISTEM: selecionar
                // Produto NÃO limpa Serviço (o `setValue('service', null, ...)`
                // do XOR antigo, mirror INT-006, saiu — Item 2 trocou o XOR
                // "exatamente um" por "pelo menos um"). Mantém só a cascata
                // própria do produto (estoque/unidade/saldo).
                setValue(`items.${index}.stock_uuid`, cascadeOption?.stock_uuid ?? null, {
                  shouldDirty: true,
                });
                setValue(
                  `items.${index}.measurement_uuid`,
                  cascadeOption?.measurement_uuid
                    ? {
                        value: cascadeOption.measurement_uuid,
                        label: cascadeOption.measurement_label ?? '',
                      }
                    : null,
                  { shouldDirty: true }
                );
                recomputeStockDisplay(cascadeOption, cascadeOption?.measurement_uuid ?? null);
              }}
              error={rowErrors?.product_uuid?.message as string | undefined}
              isDisabled={disabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`items.${index}.service`}
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={text.service}
              options={protocolSeasonServiceOptions.options(languageGB)}
              value={field.value ?? null}
              onChange={(option: Option<number> | null) => {
                field.onChange(option ?? null);
                // Item 3 (FID-G1 Q3) — Serviço e Produto/Armazém COEXISTEM:
                // o clear de `product_uuid`/`warehouse_uuid`/`stock_uuid`/
                // `measurement_uuid`/`stock_display` (mirror INT-007, XOR
                // antigo) saiu. Selecionar Serviço na mesma linha não apaga
                // o que já estava preenchido do lado do Produto.
              }}
              error={rowErrors?.service?.message as string | undefined}
              isDisabled={disabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.measurement_uuid`}
          control={control}
          render={({ field }) => (
            // Item 1 (FID-G1 Q1) — de catálogo GLOBAL (`SelectAsyncPaginate`
            // + `listMeasurementOptions`) para `Select` estático cujas
            // `options` são DERIVADAS do `productOption` da linha (primária +
            // secundária, `buildMeasurementOptions`). Sem produto → sem
            // opção derivável (casa com Item 2, `measurement_uuid` deixa de
            // ser obrigatório sempre).
            <Select
              name={field.name}
              label={text.measurement}
              options={buildMeasurementOptions(productOption)}
              value={field.value ?? null}
              onChange={(option: Option<string> | null) => {
                field.onChange(option ?? null);
                // Troca MANUAL de medida (produto com mais de uma unidade,
                // INT do contrato legado) — recalcula `stock_display` (CAL-004).
                // Limite conhecido: a conversão só é aplicada quando a medida
                // escolhida corresponde à secundária EMBUTIDA na option do
                // produto (ver `recomputeStockDisplay`); para medidas fora do
                // par primária/secundária do produto o saldo bruto é mantido,
                // sem inventar fator.
                recomputeStockDisplay(productOption, option?.value ?? null);
              }}
              error={rowErrors?.measurement_uuid?.message as string | undefined}
              isRequired={Boolean(productOption)}
              isDisabled={disabled || !productOption}
            />
          )}
        />

        <InputReadOnly
          name={`items.${index}.stock_display`}
          label={text.stock}
          value={stockDisplay || formatStockDisplay(0)}
        />

        <Controller
          name={`items.${index}.quantity`}
          control={control}
          render={({ field }) => (
            // FID-G5 (execução 040, correção 1) — QUANTIDADE DE PRODUTO, não
            // valor monetário: o legado usava máscara `moeda()` por quirk
            // (achado do dono), NUNCA herdado aqui. `NumberInput` puro, sem
            // prefixo `R$`, 3 casas decimais — mirror `EntradaInsumosItemsTab.
            // tsx::items.quantity` (mesma semântica "quantidade de produto"
            // cascateada por armazém/estoque, `allowDot` + `decimalPlaces={3}`).
            // Contrato de valor idêntico ao `MoneyInput` que substitui —
            // `value?: number | null` / `onValueChange(value: number | null)`,
            // número puro (não centavos) — round-trip de criação/edição
            // (`quantity: item.quantity` em `fillForm`) e o clamp Yup
            // (`moreThan(0)` + `quantity-within-stock`, schema inalterado)
            // continuam operando sobre o mesmo número, sem conversão.
            <NumberInput
              name={field.name}
              label={text.quantity}
              allowDot
              decimalPlaces={3}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              error={rowErrors?.quantity?.message as string | undefined}
              isRequired={Boolean(productOption)}
              disabled={disabled}
            />
          )}
        />
      </SimpleGrid>

      <Flex justify="flex-end" mt={3}>
        <IconButtonTable
          aria-label={itemsText.removeButton}
          mensegerTooltip={itemsText.removeButton}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={disabled}
          onClick={() => onRequestRemove(index)}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Box>
  );
}

export default ProtocolSeasonItemsFieldArray;
