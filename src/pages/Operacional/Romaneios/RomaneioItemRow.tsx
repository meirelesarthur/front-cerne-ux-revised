// src/pages/Operacional/Romaneios/RomaneioItemRow.tsx
// -----------------------------------------------------------------------------
// Linha do repeater de Itens do Romaneio (TASK-TRF-FE-03, contrato de tela
// §5.4/§5.4.1/§5.4.2). Componente PRÓPRIO por linha (mirror
// `InvoiceItemRow`/`src/pages/Invoices/InvoiceItemsTab.tsx:396`) — recebe
// `control`/`index`/`watch`/`setValue`/`errors`/`isDisabled` por prop, NÃO
// instancia o próprio `useFieldArray` (contrato §"Estado").
//
// Cascata produto→UM (armadilha #6, §5.4.1) — `products/options` já devolve
// `measurement`/`measurement_second`/`factor`/`factor_type` na PRÓPRIA
// option, sem request extra. Ao trocar o produto: semeia
// `measurement_uuid` e guarda `factor`/`factor_type`/`measurement_second`
// em campos CLIENT-ONLY do próprio form (`items.${index}.factor` etc.,
// `watch`/`setValue`), NUNCA `useState` local — é exatamente o defeito que a
// TASK-FE-627 corrigiu no Invoices (`has_lot`). Trocar o produto NÃO limpa
// quantidade/valor (armadilha #7, diferente da cascata de Equipes).
//
// Bidirecionalidade `total_amount ⇄ amount` (armadilha #2, §5.4.2): o efeito
// que recalcula `total_amount = quantity * amount` PULA o 1º render (nunca
// sobrescreve o valor hidratado do servidor, 2 casas) e é SUPRIMIDO por 1
// ciclo logo após o usuário editar `total_amount` diretamente (que já
// recalculou `amount` ele mesmo) — mesma técnica de
// `InvoiceItemRow` (`skipNextTotalFlash`/`isFirstRender`).
//
// `discard_percentage` NÃO é campo do form — é hint puro computado na
// leitura (`discard_kg / quantity * 100`), nunca precisa ser "hidratado" nem
// pode dar drift (não é persistido em lugar nenhum, armadilha #3).
//
// `warehouse_uuid` nulo = "Sem estoque" (armadilha #10) — sentinela de UI é
// `Option<string>` com `value: ''` (1ª opção, sempre presente), convertido
// para `null` só no payload (`buildTransferItemPayload`, `useRomaneios.tsx`).
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import { listProductOptions } from '@/services/v2/Products/product-service';

import type { Option } from '@/@types/option';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { MeasurementOption } from '@/@types/v2/Measurements';
import type { PackageOption } from '@/@types/v2/Packages';
import type { ProductOption } from '@/@types/v2/Products';
import type { TransferForm } from '@/@types/v2/Transfers';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import {
  useTransferItemMeasurementOptions,
  useTransferItemPackageOptions,
  useTransferItemWarehouseOptions,
} from './useRomaneios';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface RomaneioItemRowProps {
  index: number;
  control: Control<TransferForm>;
  errors: FieldErrors<TransferForm>;
  watch: UseFormWatch<TransferForm>;
  setValue: UseFormSetValue<TransferForm>;
  isDisabled: boolean;
  onRemove: () => void;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatPercentBR(value: number): string {
  return `${value.toFixed(2).replace('.', ',')}%`;
}

// Mantém a opção CORRENTE visível no `Select` mesmo antes do catálogo
// terminar de carregar (ou se, por algum motivo, ela não estiver na página
// atual) — mesmo racional de `sellerOptions`/`transporterOptions` em
// `CreateOrUpdateRomaneio.tsx` (aba Cabeçalho, TASK-TRF-FE-02).
function ensureCurrentOption<T>(
  current: Option<T> | null | undefined,
  options: Option<T>[]
): Option<T>[] {
  if (!current) return options;
  if (options.some((option) => option.value === current.value)) return options;
  return [current, ...options];
}

export function RomaneioItemRow({
  index,
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  onRemove,
}: RomaneioItemRowProps) {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.transfers.transfer.form.itemRow;

  const rowErrors = errors.items?.[index];

  // ---- Bidirecionalidade total_amount ⇄ amount (armadilha #2) ------------
  const skipNextTotalRecalc = useRef(false);
  const isFirstRender = useRef(true);
  const quantity = Number(watch(`items.${index}.quantity`)) || 0;
  const amount = Number(watch(`items.${index}.amount`)) || 0;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (skipNextTotalRecalc.current) {
      skipNextTotalRecalc.current = false;
      return;
    }
    setValue(`items.${index}.total_amount`, round(quantity * amount, 2), {
      shouldValidate: false,
    });
  }, [quantity, amount]);

  // ---- Hint de conversão para a UM secundária (§5.4.1) — client-only ------
  const factor = watch(`items.${index}.factor`);
  const factorType = watch(`items.${index}.factor_type`);
  const measurementSecond = watch(`items.${index}.measurement_second`);
  const showConversionHint = !!factor && !!factorType && !!measurementSecond && quantity > 0;
  const convertedQuantity = showConversionHint
    ? factorType === 'M'
      ? quantity * (factor ?? 0)
      : (factor ?? 0) > 0
        ? quantity / (factor as number)
        : 0
    : 0;

  // ---- discard_percentage — hint puro, NÃO é campo do form (armadilha #3) --
  const discardKg = Number(watch(`items.${index}.discard_kg`)) || 0;
  const discardPercentage = quantity > 0 ? round((discardKg / quantity) * 100, 2) : 0;

  // ---- Satélites planos (armadilha #1 — Select + useQuery, nunca
  // SelectAsyncPaginate) ----------------------------------------------------
  const warehouseQuery = useTransferItemWarehouseOptions('producao');
  const warehouseCatalogOptions: Option<string>[] = (warehouseQuery.data?.data.items ?? []).map(
    (item: WarehouseOption) => ({
      label: `${item.initials} — ${item.description}`,
      value: item.uuid,
    })
  );
  const noStockOption: Option<string> = { label: text.fields.noStock, value: '' };
  const currentWarehouse = watch(`items.${index}.warehouse_uuid`);
  const warehouseOptions = ensureCurrentOption(currentWarehouse, [
    noStockOption,
    ...warehouseCatalogOptions,
  ]);
  const isNoStock = !currentWarehouse || currentWarehouse.value === '';

  const measurementQuery = useTransferItemMeasurementOptions();
  const measurementCatalogOptions: Option<string>[] = (measurementQuery.data?.data.items ?? []).map(
    (item: MeasurementOption) => ({ label: item.description, value: item.uuid })
  );
  const currentMeasurement = watch(`items.${index}.measurement_uuid`);
  const measurementOptions = ensureCurrentOption(currentMeasurement, measurementCatalogOptions);

  const packageQuery = useTransferItemPackageOptions();
  const packageCatalogOptions: Option<string>[] = (packageQuery.data ?? []).map(
    (item: PackageOption) => ({ label: item.description, value: item.uuid })
  );
  const currentPackage = watch(`items.${index}.package_uuid`);
  const packageOptions = ensureCurrentOption(currentPackage, packageCatalogOptions);

  // `/areas` exige `farm_uuid` obrigatório na query (armadilha #11) — mirror
  // `listAreasForActiveFarm` de `InvoiceItemsTab.tsx`.
  function listAreasForActiveFarm(params: { search?: string; page?: number; per_page?: number }) {
    return listAreas({ ...params, farm_uuid: activeFarmUuid ?? '' });
  }

  // ---- Remoção com confirmação (cópia literal do legado, contrato §2.5) ---
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name={`items.${index}.warehouse_uuid`}
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={text.fields.warehouse}
              placeholder={text.placeholders.warehouse}
              name={name}
              value={value ?? noStockOption}
              onChange={(option) => onChange(option ?? noStockOption)}
              options={warehouseOptions}
              loading={warehouseQuery.isLoading}
              noClearable
              isDisabled={isDisabled}
            />
          )}
        />

        <Box>
          <Controller
            name={`items.${index}.product_uuid`}
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.fields.product}
                placeholder={text.placeholders.product}
                error={rowErrors?.product_uuid?.message as string | undefined}
                service={listProductOptions}
                mapOptions={(item: ProductOption) => ({
                  label: item.code ? `${item.code} — ${item.description}` : item.description,
                  value: item.uuid,
                  measurement: item.measurement ?? null,
                  measurementSecond: item.measurement_second ?? null,
                  factor: item.factor ?? null,
                  factorType: item.factor_type?.value ?? null,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ? { label: option.label, value: option.value } : null);
                  // Cascata produto→UM (armadilha #6) — SEM request extra, a
                  // option já traz tudo. Trocar o produto NÃO limpa
                  // quantidade/valor (armadilha #7).
                  setValue(
                    `items.${index}.measurement_uuid`,
                    option?.measurement
                      ? { label: option.measurement.description, value: option.measurement.uuid }
                      : null,
                    { shouldValidate: true }
                  );
                  setValue(
                    `items.${index}.measurement_second`,
                    option?.measurementSecond?.description ?? null
                  );
                  setValue(`items.${index}.factor`, option?.factor ?? null);
                  setValue(`items.${index}.factor_type`, option?.factorType ?? null);
                }}
                isRequired
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </Box>

        <Controller
          name={`items.${index}.measurement_uuid`}
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={text.fields.measurement}
              placeholder={text.placeholders.measurement}
              name={name}
              value={value}
              onChange={(option) => onChange(option ?? null)}
              options={measurementOptions}
              loading={measurementQuery.isLoading}
              error={rowErrors?.measurement_uuid?.message as string | undefined}
              isRequired
              isDisabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.package_uuid`}
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={text.fields.package}
              placeholder={text.placeholders.package}
              name={name}
              value={value}
              onChange={(option) => onChange(option ?? null)}
              options={packageOptions}
              loading={packageQuery.isLoading}
              isDisabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.lot`}
          control={control}
          render={({ field }) => (
            <Input
              label={text.fields.lot}
              name={field.name}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
              maxLength={20}
              disabled={isDisabled}
            />
          )}
        />

        <Box>
          <Controller
            name={`items.${index}.quantity`}
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={text.fields.quantity}
                allowDot
                decimalPlaces={4}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                error={rowErrors?.quantity?.message as string | undefined}
                isRequired
                disabled={isDisabled}
              />
            )}
          />
          {showConversionHint && (
            <Text fontSize="xs" color="fg.muted" mt={1}>
              {text.conversionHintTemplate
                .replace('{value}', round(convertedQuantity, 2).toString())
                .replace('{unit}', measurementSecond ?? '')}
            </Text>
          )}
        </Box>

        <Controller
          name={`items.${index}.amount`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={text.fields.amount}
              allowDot
              decimalPlaces={4}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              error={rowErrors?.amount?.message as string | undefined}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.total_amount`}
          control={control}
          render={({ field }) => (
            <MoneyInput
              name={field.name}
              label={text.fields.totalAmount}
              value={field.value ?? null}
              onValueChange={(value) => {
                field.onChange(value);
                // Bidirecional (armadilha #2) — só recalcula `amount` no
                // EDIT do usuário, nunca na hidratação/reset.
                if (quantity > 0) {
                  skipNextTotalRecalc.current = true;
                  setValue(`items.${index}.amount`, round(value / quantity, 4), {
                    shouldValidate: true,
                  });
                }
              }}
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.discard_kg`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={text.fields.discardKg}
              allowDot
              decimalPlaces={2}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              error={rowErrors?.discard_kg?.message as string | undefined}
              disabled={isDisabled}
            />
          )}
        />

        <InputReadOnly
          label={text.fields.discardPercentage}
          value={formatPercentBR(discardPercentage)}
        />

        <Controller
          name={`items.${index}.area_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.fields.area}
              placeholder={text.placeholders.area}
              service={listAreasForActiveFarm}
              mapOptions={(item: AreaListItem) => ({ label: item.description, value: item.uuid })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? null}
              onChange={(option: any) => field.onChange(option ?? null)}
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`items.${index}.note`}
          control={control}
          render={({ field }) => (
            <Input
              label={text.fields.note}
              name={field.name}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
              disabled={isDisabled}
            />
          )}
        />
      </SimpleGrid>

      {isNoStock && (
        <Text fontSize="xs" color="fg.muted" mt={2}>
          {text.noStockHint}
        </Text>
      )}

      <Flex justify="flex-end" mt={3}>
        <IconButtonTable
          aria-label={text.removeButton}
          mensegerTooltip={text.removeButton}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={isDisabled}
          onClick={() => setConfirmRemoveOpen(true)}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>

      <DeleteConfirmDialog
        isOpen={confirmRemoveOpen}
        onClose={() => setConfirmRemoveOpen(false)}
        onConfirm={() => {
          setConfirmRemoveOpen(false);
          onRemove();
        }}
        title={text.removeConfirm.title}
        description={text.removeConfirm.message}
        warningText=""
        hideQuestionMark
        colorPalette="red"
      />
    </Box>
  );
}
