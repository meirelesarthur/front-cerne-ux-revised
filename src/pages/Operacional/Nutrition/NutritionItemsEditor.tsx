// src/pages/Operacional/Nutrition/NutritionItemsEditor.tsx
// -----------------------------------------------------------------------------
// Editor de itens dinâmicos do formulário de Nutrição (Nutrition — Operacional,
// F-050, esteira 066, TASK-NT-FE-03). `useFieldArray` vive no PAI
// (`CreateOrUpdateNutrition.tsx`), mirror ESTRUTURAL (não literal) de
// `WarehouseTransferItemsEditor.tsx`/`FoodBeatStockItemsEditor.tsx` — este
// editor NÃO reusa a cascata deles (1 nível cada); é uma regra de negócio
// PRÓPRIA de 3 cascatas encadeadas (`field_manifest FLD-05..14`,
// `nutricao-legacy-contract.DRAFT.md`):
//
//   1. `warehouse_id` → `product_id` (LK-04/LK-03) → trocar produto/armazém
//      dispara LK-05 (`getWarehouseStock`) preenchendo `qnt_stock`/`product_um`
//      — DISPLAY-ONLY, NUNCA no payload (`DA-NT-04`, correção do round-trip
//      quebrado do legado — `CLM-02` — reparado também na EDIÇÃO, ver
//      `CreateOrUpdateNutrition.tsx::fillForm`, que lê `item.warehouse`).
//   2. `area_id` ↔ `grazing_id` mutuamente exclusivos — selecionar um LIMPA o
//      outro e reseta `trough_id` (cascata de 2º nível).
//   3. `area_id`/`grazing_id` → `trough_id` (LK-06) — repopula os cochos
//      disponíveis; obrigatório mesmo sem área/pastejo selecionado (a API
//      aceita os 2 filtros como opcionais, `farm_id` sempre implícito).
//
// Guard de `onSubmit` (Checklist de nova tela, item 3) — TODAS as queries de
// cascata desta tela (warehouses/products-by-warehouse/warehouse-stock/
// troughs) são tagueadas sob o MESMO prefixo `NUTRITION_CASCADE_QK`,
// consumido pelo pai via `useIsFetching({ queryKey: [NUTRITION_CASCADE_QK] })`
// para desabilitar o botão salvar enquanto qualquer uma estiver `isFetching`
// (evita submeter com `qnt_stock`/`trough_id` desatualizados de uma troca
// recente).
//
// Lookups PRÓPRIOS de Nutrição (`nutrition-lookup-service.ts`, `DA-NT-05`) são
// Collection PLANA — `Select`+`useQuery`, NUNCA `SelectAsyncPaginate` (mirror
// documentado no próprio service): `warehouse_id`/`product_id`/`product_um`
// (readonly)/`trough_id`. Os demais (`area_id`/`grazing_id`/`cost_center_id`)
// usam os serviços genéricos JÁ MIGRADOS (`areas-service`/`grazings-service`/
// `cost-center-service`), paginados de verdade — `SelectAsyncPaginate`, com
// `menuPortalTarget={document.body}`+`menuPosition="fixed"` OBRIGATÓRIOS
// (Checklist de nova tela, item 4 — armadilha já documentada em
// `WarehouseTransferItemsEditor.tsx`: sem portal, o menu é cortado pelo
// scroll da lista de cards).
//
// `diet_beat_id` (dieta automática, `CALC-01`) — decisão pragmática da Tarefa
// (ver "Leitura do dev" da ficha): SEM UI nesta rodada, sempre `null` — só
// `product_id` é exibido (fluxo manual, 100% especificado). Se o dono
// confirmar necessidade de UI própria para dieta automática, trata-se como
// Gap de UI incremental, não bloqueia esta entrega.
//
// `measurement_id` (`DA-NT-13`/`GAP-NT-07`, ADITIVO da fundação) — LACUNA
// DECLARADA nesta Tarefa: nenhum lookup consumido aqui
// (`WarehouseStockLookup`/`ProductLookupItem`) expõe o UUID da medida
// primária/secundária do produto, só descrições em texto
// (`measurement`/`measurement_second`). Sem uma fonte real de UUID, o campo
// permanece SEMPRE `null` (nunca enviado — `measurement_uuid` ausente = medida
// primária sem conversão, comportamento honesto já suportado pelo backend,
// `## 1 DA-NT-13`) — SEM MOCK, nenhum UUID fabricado. `product_um` é exibido
// como `InputReadOnly` (autofill da medida PRIMÁRIA retornada pelo lookup de
// estoque), fiel à seção "Componentes" da Tarefa.
//
// `batches` (`FLD-14`) — `CheckboxListField` (não `SelectAsyncPaginate
// isMulti`, mesma convenção de `CreateOrUpdateRainfall.tsx`/
// `CreateOrUpdateEmissor.tsx`), catálogo COMPARTILHADO entre todas as linhas
// (1 única chamada, lookup `getBatches` — só lotes ativos da fazenda ativa), busca CONTROLADA local por
// linha (`useState` no próprio row, filtro client-side sobre a lista
// compartilhada). Default de novo item: TODOS marcados em CRIAÇÃO, NENHUM em
// EDIÇÃO (mirror exato do legado — "criar: todos marcados default; editar: só
// vinculados", nunca o mesmo default nos 2 modos) — decidido em
// `CreateOrUpdateNutrition.tsx::handleAddItem` (prop `isEditing` chega aqui só
// para decidir o default do NOVO card, a hidratação de cards EXISTENTES é do
// pai via `fillForm`).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormSetValue,
  useController,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { CheckboxListField, type CheckboxListItem } from '@/components/Form/CheckboxListField';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useAuth } from '@/hooks/useAuth';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import { listGrazings } from '@/services/v2/BaseRegistrations/grazings-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import {
  getBatches,
  getProductsByWarehouse,
  getTroughs,
  getWarehouseStock,
  getWarehouses,
} from '@/services/v2/Nutritions/nutrition-lookup-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { GrazingListItem } from '@/@types/v2/BaseRegistrations/grazings';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { NutritionBatchRef, NutritionForm, NutritionItemForm } from '@/@types/v2/Nutritions';

// Prefixo COMPARTILHADO de todas as queries de cascata desta tela — consumido
// pelo pai via `useIsFetching({ queryKey: [NUTRITION_CASCADE_QK] })` (Guard de
// `onSubmit`, Checklist de nova tela item 3). Derivado da chave canônica do
// módulo (nunca string literal solta).
export const NUTRITION_CASCADE_QK = [queryKey.nutritions.nutrition, 'cascade'];

export interface NutritionItemsFieldValues {
  items: NutritionItemForm[];
}

export interface NutritionItemsEditorProps {
  /** `control` do `useForm` do formulário PAI (`NutritionForm`). */
  control: Control<NutritionForm>;
  /** `setValue` do PAI — usado SÓ para os campos DISPLAY-ONLY
   *  (`qnt_stock`/`product_um`), que nunca devem marcar `dirtyFields`
   *  (mirror `UpdateWarehouseTransfer.tsx::resolveStockQuantity`). */
  setValue: UseFormSetValue<NutritionForm>;
  /** `fields` do `useFieldArray({ control, name: 'items' })` do PAI. */
  fields: FieldArrayWithId<NutritionItemsFieldValues, 'items', 'id'>[];
  append: UseFieldArrayAppend<NutritionItemsFieldValues, 'items'>;
  remove: UseFieldArrayRemove;
  errors: FieldErrors<NutritionForm>;
  languageGB: LanguageDate;
  /** Decide o default de `batches` do PRÓXIMO item adicionado — TODOS
   *  marcados em criação, NENHUM em edição (mirror exato do legado). */
  isEditing: boolean;
  disabled?: boolean;
  /** Lotes já gravados nos itens do registro (edição/visualização). Os que
   *  não vierem no lookup (fazenda ativa) continuam exibidos/marcados. */
  savedBatches?: NutritionBatchRef[];
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const emptyFindParams = () => ({});

interface NutritionItemRowProps {
  control: Control<NutritionItemsFieldValues>;
  setValue: UseFormSetValue<NutritionForm>;
  index: number;
  remove: UseFieldArrayRemove;
  languageGB: LanguageDate;
  disabled: boolean;
  warehouseOptions: Option<string>[];
  warehouseOptionsLoading: boolean;
  batchItems: CheckboxListItem<string>[];
  batchItemsLoading: boolean;
}

function NutritionItemRow({
  control,
  setValue,
  index,
  remove,
  languageGB,
  disabled,
  warehouseOptions,
  warehouseOptionsLoading,
  batchItems,
  batchItemsLoading,
}: NutritionItemRowProps) {
  const { activeFarmUuid } = useAuth();
  const text = languageGB.nutritions.nutrition;
  const itemText = text.form.fields.item;

  const [batchSearch, setBatchSearch] = useState('');

  const { field: warehouseField, fieldState: warehouseFieldState } = useController({
    control,
    name: `items.${index}.warehouse_id`,
  });
  const { field: productField, fieldState: productFieldState } = useController({
    control,
    name: `items.${index}.product_id`,
  });
  const { field: productUmField } = useController({
    control,
    name: `items.${index}.product_um`,
  });
  const { field: qntStockField } = useController({
    control,
    name: `items.${index}.qnt_stock`,
  });
  const { field: quantityField, fieldState: quantityFieldState } = useController({
    control,
    name: `items.${index}.quantity`,
  });
  const { field: areaField } = useController({ control, name: `items.${index}.area_id` });
  const { field: grazingField } = useController({ control, name: `items.${index}.grazing_id` });
  const { field: troughField, fieldState: troughFieldState } = useController({
    control,
    name: `items.${index}.trough_id`,
  });
  const { field: noteField } = useController({ control, name: `items.${index}.note_item` });
  const { field: costCenterField, fieldState: costCenterFieldState } = useController({
    control,
    name: `items.${index}.cost_center_id`,
  });
  const { field: batchesField, fieldState: batchesFieldState } = useController({
    control,
    name: `items.${index}.batches`,
  });

  const warehouseUuid = warehouseField.value?.value ?? null;

  // TASK-095-FE-R2-01 — armazém excluído logicamente continua vindo no GET,
  // mas não está no catálogo de ativos: acrescenta-o identificável
  // ("(excluído)") para o valor aparecer; a API recusa salvar com ele e o
  // usuário precisa trocar.
  const currentWarehouse = warehouseField.value ?? null;
  const isDeletedWarehouse =
    !!currentWarehouse &&
    !warehouseOptionsLoading &&
    !warehouseOptions.some((option) => option.value === currentWarehouse.value);
  const rowWarehouseOptions: Option<string>[] =
    isDeletedWarehouse && currentWarehouse
      ? [
          ...warehouseOptions,
          {
            label: `${currentWarehouse.label} ${itemText.warehouseDeletedSuffix}`,
            value: currentWarehouse.value,
          },
        ]
      : warehouseOptions;
  const productUuid = productField.value?.value ?? null;
  const areaUuid = areaField.value?.value ?? null;
  const grazingUuid = grazingField.value?.value ?? null;

  // Cascata 1a — `warehouse_id` → catálogo de `product_id` (LK-03).
  const productsByWarehouseQuery = useQuery({
    queryKey: [...NUTRITION_CASCADE_QK, 'products-by-warehouse', warehouseUuid],
    queryFn: () => getProductsByWarehouse(warehouseUuid!),
    enabled: !!warehouseUuid,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const productOptions: Option<string>[] = (productsByWarehouseQuery.data ?? []).map((item) => ({
    label: item.description,
    value: item.uuid,
  }));

  // Cascata 1b — `warehouse_id`+`product_id` → estoque ao vivo (LK-05,
  // `DA-NT-04`). `qnt_stock`/`product_um` são sincronizados via `setValue`
  // (NUNCA `field.onChange`) — nunca marcam `dirtyFields` (client-only).
  const warehouseStockQuery = useQuery({
    queryKey: [...NUTRITION_CASCADE_QK, 'warehouse-stock', warehouseUuid, productUuid],
    queryFn: () => getWarehouseStock(warehouseUuid!, productUuid!),
    enabled: !!warehouseUuid && !!productUuid,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });

  if (
    warehouseStockQuery.data &&
    !warehouseStockQuery.isFetching &&
    qntStockField.value !== warehouseStockQuery.data.quantity
  ) {
    // Sincronização direta (sem `useEffect`) — mirror do padrão já usado no
    // projeto para hints client-only derivados de query (`ChargeItemRow.tsx`
    // usa `setValue` no `onChange`; aqui a fonte é a PRÓPRIA query, então a
    // sincronização acontece no render seguinte ao `isFetching` virar falso).
    setValue(`items.${index}.qnt_stock`, warehouseStockQuery.data.quantity, {
      shouldDirty: false,
      shouldValidate: false,
    });
    setValue(`items.${index}.product_um`, warehouseStockQuery.data.measurement ?? '', {
      shouldDirty: false,
      shouldValidate: false,
    });
  }

  // Cascata 3 — `area_id`/`grazing_id` → `trough_id` (LK-06). Collection
  // PLANA (mirror doc do lookup service) — `Select`+`useQuery`, NUNCA
  // `SelectAsyncPaginate`.
  const troughsQuery = useQuery({
    queryKey: [...NUTRITION_CASCADE_QK, 'troughs', areaUuid, grazingUuid],
    queryFn: () =>
      getTroughs({ area_uuid: areaUuid ?? undefined, grazing_uuid: grazingUuid ?? undefined }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const troughOptions: Option<string>[] = (troughsQuery.data ?? []).map((item) => ({
    label: item.description,
    value: item.uuid,
  }));

  function listAreasForActiveFarm(params: { search?: string; page?: number; per_page?: number }) {
    return listAreas({ ...params, farm_uuid: activeFarmUuid ?? '' });
  }

  // `warehouse_id` — trocar reseta `product_id`/`product_um`/`qnt_stock`/
  // `quantity` (produto pertencia ao armazém anterior, mirror
  // `WarehouseTransferItemsEditor.tsx::handleStockChange`).
  function handleWarehouseChange(option: Option<string> | null) {
    const previousUuid = warehouseUuid;
    warehouseField.onChange(option ?? null);
    if ((option?.value ?? null) === previousUuid) return;

    productField.onChange(null);
    quantityField.onChange('');
    setValue(`items.${index}.product_um`, '', { shouldDirty: false, shouldValidate: false });
    setValue(`items.${index}.qnt_stock`, null, { shouldDirty: false, shouldValidate: false });
  }

  // `product_id` — trocar/limpar reseta `quantity` (readonly até produto
  // selecionado, `FLD-09`); `qnt_stock`/`product_um` recalculam sozinhos via
  // `warehouseStockQuery` acima quando `productUuid` muda.
  function handleProductChange(option: Option<string> | null) {
    productField.onChange(option ?? null);
    if (!option) {
      quantityField.onChange('');
      setValue(`items.${index}.product_um`, '', { shouldDirty: false, shouldValidate: false });
      setValue(`items.${index}.qnt_stock`, null, { shouldDirty: false, shouldValidate: false });
    }
  }

  // `area_id`/`grazing_id` — mutuamente exclusivos (`FLD-10`): selecionar um
  // LIMPA o outro + reseta `trough_id` (cascata de 2º nível).
  function handleAreaChange(option: Option<string> | null) {
    areaField.onChange(option ?? null);
    grazingField.onChange(null);
    troughField.onChange(null);
  }

  function handleGrazingChange(option: Option<string> | null) {
    grazingField.onChange(option ?? null);
    areaField.onChange(null);
    troughField.onChange(null);
  }

  const filteredBatchItems = batchItems.filter((item) =>
    item.label.toLowerCase().includes(batchSearch.toLowerCase())
  );

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.fourColumns} gap={4}>
        {/* `warehouse_id` (FLD-05) — Collection PLANA (`getWarehouses`,
            compartilhada entre todas as linhas), `Select` puro. */}
        <Select
          name={warehouseField.name}
          label={itemText.warehouse}
          options={rowWarehouseOptions}
          value={
            rowWarehouseOptions.find((option) => option.value === currentWarehouse?.value) ??
            currentWarehouse
          }
          onChange={handleWarehouseChange}
          loading={warehouseOptionsLoading}
          error={warehouseFieldState.error?.message}
          isRequired
          isDisabled={disabled}
        />

        {/* `product_id` (FLD-06) — catálogo depende de `warehouse_id`
            (LK-03), desabilitado sem armazém escolhido. */}
        <Select
          name={productField.name}
          label={itemText.product}
          options={productOptions}
          value={productField.value ?? null}
          onChange={handleProductChange}
          loading={productsByWarehouseQuery.isFetching}
          error={productFieldState.error?.message}
          isRequired
          isDisabled={disabled || !warehouseUuid}
        />

        {/* `product_um` (FLD-07) — readonly, autofill da medida PRIMÁRIA do
            lookup de estoque (LK-05). `measurement_uuid` — ver LACUNA
            declarada no cabeçalho do arquivo (sem fonte de UUID). */}
        <InputReadOnly
          name={productUmField.name}
          label={itemText.um}
          value={productUmField.value || '—'}
        />

        {/* `qnt_stock` (FLD-08) — readonly, DISPLAY-ONLY ao vivo (`DA-NT-04`),
            NUNCA no payload. */}
        <InputReadOnly
          name={qntStockField.name}
          label={itemText.stock}
          value={qntStockField.value != null ? formatNumber(qntStockField.value) : '—'}
        />

        {/* `quantity` (FLD-09) — desabilitado até produto selecionado. */}
        <NumberInput
          name={quantityField.name}
          label={itemText.quantity}
          allowDot
          decimalPlaces={2}
          min={0}
          value={Number(quantityField.value) || 0}
          onValueChange={(value) => quantityField.onChange(value ?? '')}
          error={quantityFieldState.error?.message}
          isRequired
          disabled={disabled || !productUuid}
        />

        {/* `area_id` (FLD-10) — mutuamente exclusivo com `grazing_id`, serviço
            genérico JÁ MIGRADO (`listAreas`, paginado de verdade). */}
        <SelectAsyncPaginate
          name={areaField.name}
          label={itemText.area}
          service={listAreasForActiveFarm}
          mapOptions={(item: AreaListItem) => ({ label: item.description, value: item.uuid })}
          findParams={(search: string | { search: string }) => ({
            search: typeof search === 'string' ? search : search.search,
          })}
          value={areaField.value ?? null}
          onChange={handleAreaChange as any}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          isDisabled={disabled}
        />

        {/* `grazing_id` (FLD-10) — mutuamente exclusivo com `area_id`;
            `listGrazings` não tem busca (Doc Bruta do módulo Pastejo, sem
            `search` — browse paginado puro). */}
        <SelectAsyncPaginate
          name={grazingField.name}
          label={itemText.grazing}
          service={listGrazings}
          mapOptions={(item: GrazingListItem) => ({
            label: item.description,
            value: item.uuid,
          })}
          findParams={emptyFindParams}
          value={grazingField.value ?? null}
          onChange={handleGrazingChange as any}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          isDisabled={disabled}
        />

        {/* `trough_id` (FLD-11) — Collection PLANA (LK-06), obrigatório
            mesmo sem área/pastejo selecionado (a API aceita os 2 filtros
            como opcionais). */}
        <Select
          name={troughField.name}
          label={itemText.trough}
          options={troughOptions}
          value={troughField.value ?? null}
          onChange={(option: Option<string> | null) => troughField.onChange(option ?? null)}
          loading={troughsQuery.isFetching}
          error={troughFieldState.error?.message}
          isRequired
          isDisabled={disabled}
        />

        {/* `cost_center_id` (FLD-13) — opcional, serviço genérico já usado em
            `WarehouseTransferItemsEditor.tsx`. */}
        <SelectAsyncPaginate
          name={costCenterField.name}
          label={itemText.costCenter}
          service={listCostCenterOptions}
          mapOptions={(item: CostCenterRef) => ({
            label: `${item.code} — ${item.description}`,
            value: item.uuid,
          })}
          findParams={(search: string | { search: string }) => ({
            search: typeof search === 'string' ? search : search.search,
          })}
          value={costCenterField.value ?? null}
          onChange={(option: any) => costCenterField.onChange(option ?? null)}
          error={costCenterFieldState.error?.message}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          isDisabled={disabled}
        />

        {/* `note_item` (FLD-12) — ajuste de layout pedido pelo dono: último
            campo da grade de 10 itens em `columnsForm.fourColumns`
            (base:1/sm:2/md:3/lg:4), então sobra espaço na linha em md/lg
            (mirror do mecanismo `gridColumn` já usado em
            `CreateBaixaEstoque.tsx`/`ProviderFormFields.tsx`). Em md (3 col)
            é o único item da última linha → estica a linha toda (`1 / -1`);
            em lg (4 col) começa na col2 (após `cost_center_id`) → estica até
            a última coluna (`2 / -1`). Em base/sm cada linha já fecha exata,
            sem sobra — `auto` mantém o comportamento padrão. */}
        <Box gridColumn={{ base: 'auto', md: '1 / -1', lg: '2 / -1' }}>
          <Input
            label={itemText.note}
            name={noteField.name}
            value={noteField.value ?? ''}
            onChange={(e) => noteField.onChange(e.target.value)}
            disabled={disabled}
          />
        </Box>
      </SimpleGrid>

      {/* `batches` (FLD-14) — `CheckboxListField`, catálogo compartilhado. */}
      <Box mt={4}>
        <CheckboxListField<string>
          label={itemText.batches}
          items={filteredBatchItems}
          selectedValues={batchesField.value ?? []}
          onChange={(values) => batchesField.onChange(values)}
          searchValue={batchSearch}
          onSearchChange={setBatchSearch}
          searchPlaceholder={itemText.batchesSearchPlaceholder}
          selectedCountLabel={itemText.batchesSelectedCountLabel}
          isLoading={batchItemsLoading}
          isDisabled={disabled}
        />
        {batchesFieldState.error?.message && (
          <Text fontSize="xs" color="fg.error" mt={1}>
            {batchesFieldState.error.message}
          </Text>
        )}
      </Box>

      <Flex justify="flex-end" mt={3}>
        <IconButtonTable
          type="button"
          aria-label={itemText.removeItem}
          mensegerTooltip={itemText.removeItem}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={disabled}
          onClick={() => remove(index)}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Box>
  );
}

export function NutritionItemsEditor({
  control,
  setValue,
  fields,
  append,
  remove,
  errors,
  languageGB,
  isEditing,
  disabled = false,
  savedBatches,
}: NutritionItemsEditorProps) {
  const { activeFarmUuid } = useAuth();
  const text = languageGB.nutritions.nutrition;
  const itemText = text.form.fields.item;

  // Cast local (não vaza na API pública) — mesmo racional de
  // `WarehouseTransferItemsEditor.tsx::genericControl`.
  const genericControl = control as unknown as Control<NutritionItemsFieldValues>;

  const arrayError = (errors as any)?.items?.message as string | undefined;

  // Catálogo COMPARTILHADO de armazéns (`getWarehouses`, LK-01) — 1 única
  // chamada para TODAS as linhas.
  const warehousesQuery = useQuery({
    queryKey: [...NUTRITION_CASCADE_QK, 'warehouses'],
    queryFn: () => getWarehouses(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const warehouseOptions: Option<string>[] = (warehousesQuery.data ?? []).map((item) => ({
    label: item.description,
    value: item.uuid,
  }));

  // Catálogo COMPARTILHADO de Lotes (`batches`, FLD-14) — 1 única chamada
  // para TODAS as linhas. Fonte: lookup de Nutrição (`getBatches`) — só lotes
  // ATIVOS da fazenda ativa. `activeFarmUuid` na queryKey evita reaproveitar
  // cache ao trocar de fazenda.
  const batchOptionsQuery = useQuery({
    queryKey: [...NUTRITION_CASCADE_QK, 'batches', activeFarmUuid],
    queryFn: () => getBatches(),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const lookupBatchItems: CheckboxListItem<string>[] = (batchOptionsQuery.data ?? []).map(
    (item) => ({
      value: item.uuid,
      label: item.label,
    })
  );
  // Seleção já gravada que não está no lookup (ex.: lote inativo/de outra
  // fazenda) permanece visível e marcada — nunca perde a seleção salva.
  const lookupBatchUuids = new Set(lookupBatchItems.map((item) => item.value));
  const savedOnlyBatchItems: CheckboxListItem<string>[] = [];
  (savedBatches ?? []).forEach((batch) => {
    if (!lookupBatchUuids.has(batch.uuid)) {
      lookupBatchUuids.add(batch.uuid);
      savedOnlyBatchItems.push({ value: batch.uuid, label: batch.name });
    }
  });
  const batchItems: CheckboxListItem<string>[] = [...lookupBatchItems, ...savedOnlyBatchItems];
  const allBatchUuids = lookupBatchItems.map((item) => item.value);

  // Novo item — default de `batches` FIEL ao legado: TODOS marcados em
  // CRIAÇÃO, NENHUM em EDIÇÃO (mirror exato, nunca o mesmo default nos 2
  // modos — Risco 2 da ficha).
  function handleAdd() {
    const item: NutritionItemForm = {
      warehouse_id: null,
      product_id: null,
      diet_beat_id: null,
      product_um: '',
      qnt_stock: null,
      quantity: '',
      area_id: null,
      grazing_id: null,
      trough_id: null,
      note_item: '',
      cost_center_id: null,
      batches: isEditing ? [] : allBatchUuids,
      measurement_id: null,
    };
    append(item as any);
  }

  // UX — ajuste do dono (pós-entrega TASK-NT-FE-03): em CRIAÇÃO, o form já
  // abre com 1 item VAZIO (mesmo shape de `handleAdd`, batches inclusos),
  // evitando o clique extra em "Adicionar Item" no caso comum de 1 item.
  // Guard `fields.length === 0` garante disparo ÚNICO (após o append, deixa
  // de valer e o efeito não repete). Gate em `!batchOptionsQuery.isLoading`
  // — espera o catálogo de Lotes resolver para que o default "todos
  // marcados" (Risco 2 da ficha) saia correto no item auto-criado, mesmo
  // racional de `handleAdd` acima; NÃO se aplica a EDIÇÃO/VISUALIZAÇÃO
  // (`isEditing`/hidratação são 100% do pai via `fillForm`, inalterados).
  useEffect(() => {
    if (!isEditing && fields.length === 0 && !batchOptionsQuery.isLoading) {
      handleAdd();
    }
  }, [isEditing, fields.length, batchOptionsQuery.isLoading]);

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {itemText.sectionTitle}
      </Text>

      {arrayError && fields.length === 0 && (
        <Box mb={4}>
          <Text fontSize="sm" color="fg.error">
            {arrayError}
          </Text>
        </Box>
      )}

      {fields.length > 0 && (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <NutritionItemRow
              key={field.id}
              control={genericControl}
              setValue={setValue}
              index={index}
              remove={remove}
              languageGB={languageGB}
              disabled={disabled}
              warehouseOptions={warehouseOptions}
              warehouseOptionsLoading={warehousesQuery.isLoading}
              batchItems={batchItems}
              batchItemsLoading={batchOptionsQuery.isLoading}
            />
          ))}
        </Flex>
      )}

      <Button
        type="button"
        title={itemText.addItem}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}

export default NutritionItemsEditor;
