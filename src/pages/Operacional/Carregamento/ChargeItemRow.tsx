// src/pages/Operacional/Carregamento/ChargeItemRow.tsx
// -----------------------------------------------------------------------------
// Linha do repeater de Itens do Carregamento (TASK-FE-CG-03, contrato FD-05..
// 17/24, IG-01/IG-02/IG-05/IG-06/IG-07). Componente PRÓPRIO por linha (mirror
// `RomaneioItemRow.tsx`) — recebe `control`/`index`/`watch`/`setValue`/
// `errors`/`isDisabled` por prop, NÃO instancia o próprio `useFieldArray`
// (contrato §"Estado" da Tarefa).
//
// Nota técnica 1 do plano de arquitetura (fonte dupla do select "Produto",
// cascata armazém→produto→estoque, IG-01/IG-02) — mirror `AppropriationStockTab.
// tsx`/`WarehouseTransferItemsEditor.tsx`: quando a linha TEM armazém
// escolhido, o catálogo do Produto passa a ser `GET /stocks/available`
// (`listStockAvailability`, saldo real NAQUELE armazém); sem armazém, volta ao
// catálogo genérico `listProductOptions` (mirror `RomaneioItemRow.tsx`). As
// DUAS fontes são normalizadas para o MESMO shape `{uuid, description}` por
// `listItemProducts` abaixo, então o `mapOptions` do `SelectAsyncPaginate` é
// único — não há gate de `isDisabled` no Produto por falta de Armazém (ao
// contrário de `AppropriationStockTab`): `warehouse_uuid` é OPCIONAL (fiel ao
// legado FD-06), então o Produto continua selecionável nos dois casos.
// Trocar o Armazém da linha LIMPA o Produto da MESMA linha (IG-01).
//
// `warehouse_uuid` nulo = "Sem estoque" (mesma convenção `RomaneioItemRow`) —
// sentinela de UI é `Option<string>` com `value: ''` (1ª opção, sempre
// presente), convertido para `null` só no payload (`buildChargeItemPayload`).
//
// Nota técnica 2 do plano — `total_amount`/`weight` são hints CLIENT-ONLY,
// NUNCA vão ao payload (servidor recalcula de verdade, sem recálculo
// bidirecional aqui — mais simples que `Romaneio`): `total_amount` é sempre
// `quantity × amount` computado AO VIVO (sem `useEffect`/`setValue`, direto no
// render); `weight` (`quantity_second`, CV-02) não tem seletor de unidade
// secundária nesta tela — exibe o último valor conhecido do servidor
// (hidratado por `chargeItemToForm`) até o próximo save, nunca fabrica um
// fator de conversão sem fonte real (SEM MOCK).
//
// `team_uuid`/`seller_uuid`/`provider_uuid` (FD-13/14/16) — GAP FIX (#4,
// execução 045, fix de API em paralelo): `ChargeItemPartyRef` agora expõe
// `{uuid, label}`; `chargeItemToForm` (`useCarregamentos.tsx`) hidrata com o
// `label` real quando presente, com fallback SEGURO para o próprio `uuid`
// (registro antigo sem nome resolvido) — mesma degradação documentada de
// `transferExpenseToForm.provider_uuid`, nunca nome inventado no cliente.
// -----------------------------------------------------------------------------

import { useCallback, useState } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

import { chargeItemTypeOptions } from '@/constants/carregamentos/charge/options';
import { columnsForm } from '@/constants/coluns-form';

import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import { listStockAvailability } from '@/services/v2/Stocks/stock-service';
import { listTeams } from '@/services/v2/Teams/team-service';

import type { Option } from '@/@types/option';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { ChargeForm, ChargeItemType } from '@/@types/v2/Carregamentos';
import type { ProductOption } from '@/@types/v2/Products';
import type { StockAvailabilityItem } from '@/@types/v2/Stocks';
import type { TeamListItem } from '@/@types/v2/Teams';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import { useChargeItemWarehouseOptions } from './useCarregamentos';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface ChargeItemRowProps {
  index: number;
  control: Control<ChargeForm>;
  errors: FieldErrors<ChargeForm>;
  watch: UseFormWatch<ChargeForm>;
  setValue: UseFormSetValue<ChargeForm>;
  isDisabled: boolean;
  onRemove: () => void;
}

// Shape NORMALIZADO comum às duas fontes do Produto (`listStockAvailability`/
// `listProductOptions`) — nota técnica 1 do plano. `quantity`/`measurement`
// (FD-30/FD-31, CL-46) embutidos aqui (mirror `AppropriationStockTab.tsx`,
// IG-02) — alimentam "Estoque"/"Un. Medida" direto da option selecionada,
// sem request extra por linha. `quantity` só vem preenchida no ramo
// `listStockAvailability` (saldo real NAQUELE armazém); no ramo catálogo
// genérico fica `undefined` (sem armazém escolhido, sem saldo a mostrar).
interface ChargeItemProductOption {
  uuid: string;
  description: string;
  quantity?: number;
  measurement?: { uuid: string; description: string } | null;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Mesmo racional de `ensureCurrentOption` em `RomaneioItemRow.tsx` — mantém a
// opção CORRENTE visível mesmo antes do catálogo carregar.
function ensureCurrentOption<T>(
  current: Option<T> | null | undefined,
  options: Option<T>[]
): Option<T>[] {
  if (!current) return options;
  if (options.some((option) => option.value === current.value)) return options;
  return [current, ...options];
}

export function ChargeItemRow({
  index,
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  onRemove,
}: ChargeItemRowProps) {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.carregamentos.charge.form.fields.item;

  const rowErrors = errors.items?.[index];

  const typeOptions = chargeItemTypeOptions.options(languageGB);

  // ---- Hints client-only (nota técnica 2) ---------------------------------
  const quantity = Number(watch(`items.${index}.quantity`)) || 0;
  const amount = Number(watch(`items.${index}.amount`)) || 0;
  const liveTotalAmount = round(quantity * amount, 2);
  const weightHint = watch(`items.${index}.weight`);
  // FD-30/FD-31 (CL-46) — hints client-only, populados no `onChange` do
  // Produto (IG-02) ou resolvidos via `resolveItemMeasurements` na
  // hidratação de linha existente (`CreateOrUpdateCharge.tsx`).
  const stockHint = watch(`items.${index}.qtd_stock`);
  const measurementUnitHint = watch(`items.${index}.um`);

  // ---- Satélite PLANO de Armazém (nota técnica 1, `useQuery` — mirror
  // `useTransferItemWarehouseOptions`) ---------------------------------------
  const warehouseQuery = useChargeItemWarehouseOptions();
  const warehouseCatalogOptions: Option<string>[] = (warehouseQuery.data?.data.items ?? []).map(
    (item: WarehouseOption) => ({
      label: `${item.initials} — ${item.description}`,
      value: item.uuid,
    })
  );
  const noStockOption: Option<string> = { label: text.noStock, value: '' };
  const currentWarehouse = watch(`items.${index}.warehouse_uuid`);
  const warehouseOptions = ensureCurrentOption(currentWarehouse, [
    noStockOption,
    ...warehouseCatalogOptions,
  ]);
  const isNoStock = !currentWarehouse || currentWarehouse.value === '';

  // ---- Fonte dupla do Produto (nota técnica 1, IG-01/IG-02) — normalizada
  // para `{uuid, description}` nos DOIS ramos, `mapOptions` único abaixo. ----
  const listItemProducts = useCallback(
    async (params: { search?: string; page?: number; per_page?: number }) => {
      if (currentWarehouse?.value) {
        const response = await listStockAvailability({
          ...params,
          warehouse_uuid: currentWarehouse.value,
        });
        return {
          ...response,
          data: {
            ...response.data,
            items: response.data.items.map(
              (item: StockAvailabilityItem): ChargeItemProductOption => ({
                uuid: item.product.uuid,
                description: item.product.description,
                // FD-30 ("Estoque") — saldo real NESTE armazém.
                quantity: item.quantity,
                // FD-31 ("Un. Medida") — mirror `AppropriationStockTab.tsx`
                // (fallback `name` quando `description` vier vazia).
                measurement: item.measurement
                  ? {
                      uuid: item.measurement.uuid,
                      description: item.measurement.description || item.measurement.name,
                    }
                  : null,
              })
            ),
          },
        };
      }

      const response = await listProductOptions(params);
      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map((item: ProductOption): ChargeItemProductOption => ({
            uuid: item.uuid,
            description: item.code ? `${item.code} — ${item.description}` : item.description,
            // Catálogo genérico (sem Armazém escolhido) — sem saldo a
            // mostrar (FD-30 fica `null`); "Un. Medida" (FD-31) continua
            // disponível quando o catálogo a traz.
            measurement: item.measurement
              ? { uuid: item.measurement.uuid, description: item.measurement.description }
              : null,
          })),
        },
      };
    },
    [currentWarehouse?.value]
  );

  // ---- Satélites PAGINADOS (SelectAsyncPaginate, FD-13/14/16) --------------
  function listAreasForActiveFarm(params: { search?: string; page?: number; per_page?: number }) {
    return listAreas({ ...params, farm_uuid: activeFarmUuid ?? '' });
  }

  // ---- Remoção com confirmação (mirror `RomaneioItemRow`) -------------------
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name={`items.${index}.warehouse_uuid`}
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={text.warehouse}
              name={name}
              value={value ?? noStockOption}
              onChange={(option) => {
                onChange(option ?? noStockOption);
                // IG-01 — trocar o Armazém da linha limpa o Produto da MESMA
                // linha (fonte de dados mudou).
                setValue(`items.${index}.product_uuid`, null);
                // Mirror IG-01 — a fonte de "Estoque" (FD-30) também mudou
                // (era saldo do Armazém anterior); limpa junto.
                setValue(`items.${index}.qtd_stock`, null);
              }}
              options={warehouseOptions}
              loading={warehouseQuery.isLoading}
              noClearable
              isDisabled={isDisabled}
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
              error={rowErrors?.product_uuid?.message as string | undefined}
              service={listItemProducts}
              mapOptions={(item: ChargeItemProductOption) => ({
                label: item.description,
                value: item.uuid,
                // FD-30/FD-31 (IG-02) — embutidos na option para "Estoque"/
                // "Un. Medida" (abaixo) sem request extra por linha, mirror
                // `AppropriationStockTab.tsx`.
                quantity: item.quantity,
                measurement: item.measurement,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              cacheUniqs={[currentWarehouse?.value]}
              value={field.value ?? null}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                // IG-02 — "Estoque" (FD-30) só vem preenchido no ramo
                // `listStockAvailability` (option.quantity definida); no
                // catálogo genérico fica `null`. "Un. Medida" (FD-31) vem de
                // QUALQUER um dos 2 ramos, quando disponível.
                setValue(`items.${index}.qtd_stock`, option?.quantity ?? null);
                setValue(`items.${index}.um`, option?.measurement?.description ?? null);
              }}
              isRequired
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`items.${index}.quantity`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={text.quantity}
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

        <Controller
          name={`items.${index}.amount`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={text.amount}
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

        <InputReadOnly label={text.totalAmount} value={formatCurrencyBRL(liveTotalAmount)} />

        <InputReadOnly
          label={text.weight}
          value={weightHint != null ? weightHint.toLocaleString('pt-BR') : '—'}
        />

        {/* FD-30/FD-31 (CL-46) — "Estoque"/"Un. Medida", campos de APOIO à
            digitação (mirror do legado, readonly). Hints client-only —
            NUNCA vão a `ChargeItemPayload` (confirmado por leitura de
            `buildChargeItemPayload`, `useCarregamentos.tsx`). */}
        <InputReadOnly
          label={text.stock}
          value={stockHint != null ? stockHint.toLocaleString('pt-BR') : '—'}
        />
        <InputReadOnly label={text.measurementUnit} value={measurementUnitHint ?? '—'} />

        <Controller
          name={`items.${index}.type`}
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={text.type}
              name={name}
              value={value}
              onChange={(option: Option<ChargeItemType> | null) => onChange(option ?? null)}
              options={typeOptions}
              isDisabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.calibre`}
          control={control}
          render={({ field }) => (
            <Input
              label={text.calibre}
              name={field.name}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
              maxLength={30}
              error={rowErrors?.calibre?.message as string | undefined}
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.team_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.team}
              service={listTeams}
              mapOptions={(item: TeamListItem) => ({ label: item.name, value: item.uuid })}
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
          name={`items.${index}.seller_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.seller}
              service={listProviderOptions}
              mapOptions={(item: ProviderOptionItem) => ({ label: item.label, value: item.uuid })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
                // FD-14 — `Provider::person() type=5` (Vendedor/Comissionado).
                type: 5,
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
          name={`items.${index}.area_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.area}
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
          name={`items.${index}.provider_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.provider}
              service={listProviderOptions}
              mapOptions={(item: ProviderOptionItem) => ({ label: item.label, value: item.uuid })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
                // FD-16 — `Provider::person() type=1` (Fornecedor do item).
                type: 1,
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
              label={text.note}
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
          {text.noStock}
        </Text>
      )}

      <Flex justify="flex-end" mt={3}>
        <IconButtonTable
          aria-label={languageGB.carregamentos.charge.form.itemRow.removeButton}
          mensegerTooltip={languageGB.carregamentos.charge.form.itemRow.removeButton}
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
        title={languageGB.carregamentos.charge.form.itemRow.removeConfirm.title}
        description={languageGB.carregamentos.charge.form.itemRow.removeConfirm.message}
        warningText=""
        hideQuestionMark
        colorPalette="red"
      />
    </Box>
  );
}
