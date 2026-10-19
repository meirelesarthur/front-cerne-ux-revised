// src/pages/Administrativo/Fabrica/FoodBeat/CreateOrUpdateFoodBeat.tsx
// -----------------------------------------------------------------------------
// Formulário ÚNICO de criação/edição de Batida (FoodBeat — Fábrica,
// TASK-FB-FE-06). Rotas `/administrativo/fabrica/batidas/novo` (criar) e
// `/administrativo/fabrica/batidas/:foodBeatId` (editar) — conectadas em
// `TASK-FB-FE-07`, fora do escopo deste arquivo.
//
// UX-GAP confirmado (mesmo commit-âncora das demais telas de Batida).
// Referência de ESTILO: `EstoqueInicialForm.tsx` (`ux_root`) + precedente
// REAL `CreateOrUpdateFood.tsx` (Food, `TASK-FOOD-FE-06` ✅) — mesma casca
// (`FormContainer` fullHeight+footer), mesma convenção de campo
// "Responsável" readonly.
//
// ⚠️ Decisão 1 do contrato (`FoodBeat-contrato.md ## 9`, dono, 2026-08-11):
// em modo EDIÇÃO, SOMENTE `date` é editável — trava REAL do dado (não
// visual). `fieldsLocked`/`isFieldDisabled` abaixo cobrem os demais 11
// campos do cabeçalho + os 2 editores de item; `isFieldDisabled` combina a
// trava de edição com a permissão (`food-beat_edit`), enquanto `date` é
// gated SÓ por permissão (mirror exato de `UpdateFoodBeatPayload={date}`,
// `@/@types/v2/FoodBeats`).
//
// ORDEM dos 13 campos de cabeçalho renderizados FIEL ao Blade legado
// (Doc Bruta `§12.1`, `FoodBeat-contrato.md §6`, confirmado por leitura
// direta na ficha): code → responsible → date → type → warehouse_id →
// food_id|product_id (condicional por `type`) → product_quantity →
// measurement → quantity → provider_lot|shelf_life (condicional por
// `has_lot`) → vl_total (só ramo Estoque). `farm_id` nunca é campo RHF
// (resolvido por `X-Farm-Id`, interceptor genérico de `@/services/api.ts`).
//
// `measurement` — texto SEMPRE readonly (autofill), NUNCA persistido
// (`FoodBeatResource`, `FoodBeat-contrato.md §4.4`, não devolve esse campo)
// — em EDIÇÃO fica vazio (estado honesto, SEM MOCK; o campo já está
// travado pela Decisão 1 e não afeta `UpdateFoodBeatPayload`). Em CRIAÇÃO,
// autofill: ramo F = `Food.measurement.description`; ramo E = valor FIXO
// (`STOCK_MEASUREMENT_FIXED_LABEL`, mirror literal `_forms.blade.php:40-50`
// e da própria ficha `TASK-FB-FE-06`, item 7).
//
// Risco 1 (lote duplicado, `provider_lot`) — 422 do backend (`DA-FB-13`)
// mapeado via `setError('provider_lot', ...)` no `catch` de
// `tryPersistFoodBeat`, mirror EXATO da técnica já usada em
// `CreateOrUpdateFuncao.tsx`/`CreateOrUpdateEvento.tsx` (o `throw` final
// preserva o toast genérico que `useRequest` já mostra).
//
// Risco 2 (categoria elegível do Select de Produto, ramo Estoque) — Gap já
// declarado em `TASK-FB-FE-03`/`food-beat-service.ts`: `listProductOptions`
// é consumido SEM `food_eligibility`/`category_type` equivalente a
// `DA-FB-06` — lista pode vir mais ampla que o legado. Aceito como Gap
// declarado, não resolvido aqui (ver comentário no wrapper local abaixo).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Alert, Box, SimpleGrid } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { FOOD_BEAT_TYPE } from '@/constants/food-beats/food-beat-type';
import { foodBeatTypeOptions } from '@/constants/food-beats/options/food-beat-type-options';
import { queryKey } from '@/constants/query-key';

import {
  foodBeatCreateSchemaResolver,
  foodBeatUpdateSchemaResolver,
} from '@/validations/schemas/FoodBeats/food-beat-schema';

import { createFoodBeat, updateFoodBeat } from '@/services/v2/FoodBeats/food-beat-service';
import { getFood, listFoods } from '@/services/v2/Foods/food-service';
import type { ListFoodsParams } from '@/services/v2/Foods/food-service';
import { getProduct, listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';
import {
  listWarehouseOptions,
  type ListWarehouseOptionsParams,
} from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type {
  CreateFoodBeatPayload,
  FoodBeatDetail,
  FoodBeatForm as FoodBeatFormType,
  FoodBeatFormulationItemForm,
  FoodBeatType,
} from '@/@types/v2/FoodBeats';
import type { FoodDetail, FoodListItem } from '@/@types/v2/Foods';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import { FoodBeatFormulationItemsEditor } from './FoodBeatFormulationItemsEditor';
import { FoodBeatStockItemsEditor } from './FoodBeatStockItemsEditor';
import { useFoodBeatForm } from './useFoodBeatForm';

import type { FormulationItemsFieldValues } from './FoodBeatFormulationItemsEditor';
import type { StockItemsFieldValues } from './FoodBeatStockItemsEditor';
import type { UseFieldArrayAppend } from 'react-hook-form';

// `measurement` fixo do ramo Estoque — valor de DADO (não rótulo de campo),
// mirror literal da ficha (`TASK-FB-FE-06`, item 7: "autofill
// measurement='Unidade' fixo") e de `_forms.blade.php:40-50`. Sem chave i18n
// dedicada nas fichas da fundação (`TASK-FB-FE-01`) — tratado como constante
// de domínio (mesmo racional do default numérico `quantity: 1` de
// `CreateOrUpdateFood.tsx`), não como string de UI a traduzir.
const STOCK_MEASUREMENT_FIXED_LABEL = 'Unidade';

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

// Lookup de armazéns NÃO paginado (`GET /warehouses/options`): `pageSize` acima
// do volume real evita 2ª página fantasma no `SelectAsyncPaginate`.
const FLAT_CATALOG_PAGE_SIZE = 200;

// Select "Armazém Destino" — fazenda ativa + tipo `producao` + ativos (paridade
// legado). `/warehouses/options` filtra pela fazenda ativa e não exige
// `warehouses_view` (o index listava armazéns de outras fazendas).
async function listProductionWarehouses(params: ListWarehouseOptionsParams) {
  return listWarehouseOptions({ search: params.search, type: 'producao' });
}

function mapWarehouseOption(item: WarehouseOption) {
  return { label: `${item.initials} — ${item.description}`, value: item.uuid };
}

// Select "Ração" (ramo Formulação) — mirror `listFoods({ is_enabled: '1' })`.
async function listActiveFoodOptions(params: ListFoodsParams) {
  return listFoods({ ...params, is_enabled: '1' });
}

function mapFoodOption(item: FoodListItem) {
  return { label: `${item.code} — ${item.product.description}`, value: item.uuid };
}

// Select "Produto" (ramo Estoque) — Gap declarado (`DA-FB-06`,
// `food-beat-service.ts`): SEM `food_eligibility`/`category_type` dedicado
// (o contrato de Batida não expõe um parâmetro equivalente ao de Food) —
// lista pode vir mais ampla que o legado. Não resolvido nesta Tarefa.
async function listStockProductOptions(params: { search?: string; page?: number }) {
  return listProductOptions(params);
}

function mapProductOption(item: ProductOptionItem) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

function formatQuantity(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CreateOrUpdateFoodBeat() {
  const { foodBeatId } = useParams<{ foodBeatId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();
  const text = languageGB.foodBeats.foodBeat;
  const header = text.form.fields.header;

  // "novo" não é GUID — mirror `CreateOrUpdateFood`/`CreateOrUpdateParameterWeights`.
  const isEditing = isValidGuid(foodBeatId);

  const canSave = isEditing ? can('food-beat_edit') : can('food-beat_create');

  // Decisão 1 (`## 9`) — trava REAL, independente de permissão: em edição,
  // TODOS os campos exceto `date` ficam desabilitados de verdade.
  const fieldsLocked = isEditing;
  const isFieldDisabled = fieldsLocked || !canSave;

  // `has_lot` do Produto selecionado (ramo Estoque) — resolve visibilidade/
  // obrigatoriedade condicional de `provider_lot`/`shelf_life` (contexto do
  // schema Yup, `food-beat-schema.ts`). Em edição, mostra os campos sempre
  // que já houver dado persistido — sem refetch do Produto (campos travados
  // mesmo assim pela Decisão 1).
  const [hasLot, setHasLot] = useState(false);

  // uuid de cada matéria-prima de `Food.feedstocks[]`, alinhado por índice a
  // `formulationItems` — resolvido ao carregar a Ração (`getFood`) ou, em
  // edição, a partir dos próprios itens persistidos (`TASK-FB-FE-04`,
  // `feedstockProductUuids` prop do editor).
  const [feedstockProductUuids, setFeedstockProductUuids] = useState<(string | null)[]>([]);

  // Total do rodapé `vl_total` (ramo Estoque) — 100% cosmético, refletido
  // pelo próprio editor (`onTotalChange`, mirror `FoodFeedstocksEditor`).
  const [stockItemsTotal, setStockItemsTotal] = useState(0);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<FoodBeatFormType>({
    mode: 'onChange',
    // 2 schemas trocados por modo (`TASK-FB-FE-02`) — NÃO 1 schema com
    // `.when('mode', ...)` (Decisão 1 exige `update` isolado, só `date`).
    resolver: isEditing
      ? foodBeatUpdateSchemaResolver(languageGB)
      : foodBeatCreateSchemaResolver(languageGB),
    // `hasLot` chega ao Yup via `context` do próprio `useForm` — o
    // `@hookform/resolvers/yup` mescla este valor na chamada de
    // `schema.validate(...)` a cada validação (ver `food-beat-schema.ts`).
    context: { hasLot },
    reValidateMode: 'onChange',
    defaultValues: {
      type: FOOD_BEAT_TYPE.FORMULATION,
      warehouse_id: null,
      food_id: null,
      product_id: null,
      date: '',
      quantity: '',
      product_quantity: 0,
      measurement: '',
      provider_lot: '',
      shelf_life: '',
      formulationItems: [],
      stockItems: [],
    },
  });

  const {
    fields: formulationFields,
    append: appendFormulation,
    remove: removeFormulation,
    replace: replaceFormulation,
  } = useFieldArray({ control, name: 'formulationItems' });

  const {
    fields: stockFields,
    append: appendStock,
    remove: removeStock,
    replace: replaceStock,
  } = useFieldArray({ control, name: 'stockItems' });

  // fillForm (Lei 2, guarda `Object.keys(dirtyFields).length > 0`) — mapeia
  // `FoodBeatDetail` → `FoodBeatForm`, incluindo os 2 arrays de itens a
  // partir de `detail.items` (achatando de volta para o shape RHF do ramo
  // correspondente a `detail.type`).
  function fillForm(data: FoodBeatDetail, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length > 0 && !resetForce) return;

    const isFormulation = data.type === FOOD_BEAT_TYPE.FORMULATION;

    reset({
      type: data.type,
      // DEFESA EM PROFUNDIDADE (`TASK-FB-FE-13`) — `warehouse`/`product`/
      // `food`/`item.stock` são relações que o backend pode devolver
      // `null`/`undefined` (dado órfão/inconsistente); optional chaining +
      // fallback em TODO acesso aninhado do edit-load, para o campo exibir
      // vazio/"—" em vez de lançar `TypeError` e derrubar a tela. NÃO altera
      // a lógica de negócio — só a resiliência de leitura.
      warehouse_id: {
        label: data.warehouse?.description ?? '',
        value: data.warehouse?.uuid ?? '',
      },
      food_id:
        isFormulation && data.food ? { label: data.food.description, value: data.food.uuid } : null,
      product_id:
        !isFormulation && data.product
          ? {
              label: `${data.product?.code ?? ''} — ${data.product?.description ?? ''}`,
              value: data.product.uuid,
            }
          : null,
      date: data.date ? data.date.slice(0, 10) : '',
      quantity: Number(data.quantity),
      product_quantity: Number(data.product_quantity),
      // Ver nota de topo do arquivo — `measurement` não vem no Resource.
      measurement: '',
      provider_lot: data.provider_lot ?? '',
      shelf_life: data.shelf_life ? data.shelf_life.slice(0, 10) : '',
      formulationItems: isFormulation
        ? data.items.map((item) => ({
            stock_id: {
              label: `${item.stock?.product?.code ?? ''} — ${item.stock?.warehouse?.description ?? ''}`,
              value: item.stock?.uuid ?? '',
            },
            feedstock_product_id: `${item.stock?.product?.code ?? ''} — ${item.stock?.product?.description ?? ''}`,
            feedstock_measurement_id: null,
            stock_quantity: 0,
            percentage: Number(item.percentage) || 0,
            feedstock_quantity: Number(item.quantity) || 0,
            feedstock_quantity_realized: Number(item.quantity_realized) || 0,
            feedstock_difference: Number(item.difference) || 0,
            feedstock_amount: Number(item.amount) || 0,
            feedstock_total: Number(item.total) || 0,
          }))
        : [],
      stockItems: !isFormulation
        ? data.items.map((item) => ({
            warehouse_id: {
              label: item.stock?.warehouse?.description ?? '',
              value: item.stock?.warehouse?.uuid ?? '',
            },
            stock_id: {
              label: `${item.stock?.product?.code ?? ''} — ${item.stock?.warehouse?.description ?? ''}`,
              value: item.stock?.uuid ?? '',
            },
            measurement_id: null,
            stock_quantity: 0,
            quantity: Number(item.quantity) || 0,
            amount: Number(item.amount) || 0,
            total: Number(item.total) || 0,
          }))
        : [],
    });

    // Guarda de leitura (`TASK-FB-FE-13`) — `null` é mantido no lugar (NÃO
    // filtrado): o array é `(string | null)[]` e PRECISA permanecer alinhado
    // por índice a `formulationItems`/`data.items` (consumido por índice em
    // `FoodBeatFormulationItemsEditor.tsx:413`,
    // `feedstockProductUuids[index] ?? null`); filtrar deslocaria os
    // índices e quebraria esse alinhamento.
    setFeedstockProductUuids(
      isFormulation ? data.items.map((item) => item.stock?.product?.uuid ?? null) : []
    );
  }

  const foodBeatQuery = useFoodBeatForm({
    registrationId: isEditing ? foodBeatId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([foodBeatQuery as any]);
  const foodBeatDetail = (foodBeatQuery as any)?.data as FoodBeatDetail | undefined;

  const watchedType = watch('type');
  const isFormulationType = watchedType === FOOD_BEAT_TYPE.FORMULATION;
  const showLotFields = !isFormulationType && (hasLot || isEditing);
  const headerQuantity = Number(watch('quantity')) || 0;
  const headerProductQuantity = Number(watch('product_quantity')) || 0;
  const measurementValue = watch('measurement');
  const providerLotValue = watch('provider_lot');

  const typeOptions = foodBeatTypeOptions.options(languageGB);

  // Ração selecionada (ramo Formulação) — `getFood(uuid)` hidrata
  // `feedstocks[]` → popula `formulationItems` (1 linha por matéria-prima,
  // `stock_id: null` — o usuário escolhe o estoque de origem) + autofill
  // `measurement`/`product_quantity` do cabeçalho (ficha, item 7).
  async function handleFoodChange(option: Option<string> | null) {
    const previousUuid = watch('food_id')?.value ?? null;
    setValue('food_id', option ?? null, { shouldDirty: true });

    if (!option) {
      replaceFormulation([]);
      setFeedstockProductUuids([]);
      setValue('measurement', '');
      setValue('product_quantity', 0);
      return;
    }
    if (option.value === previousUuid) return;

    try {
      const response = await getFood(option.value);
      const food: FoodDetail = response.data;

      setValue('measurement', food.measurement?.description ?? '');
      setValue('product_quantity', Number(food.quantity) || 0);

      const rows: FoodBeatFormulationItemForm[] = food.feedstocks.map((item) => ({
        stock_id: null,
        feedstock_product_id: `${item.product.code} — ${item.product.description}`,
        feedstock_measurement_id: item.measurement?.description ?? null,
        stock_quantity: 0,
        percentage: Number(item.percentage) || 0,
        feedstock_quantity: 0,
        feedstock_quantity_realized: 0,
        feedstock_difference: 0,
        feedstock_amount: 0,
        feedstock_total: 0,
      }));
      replaceFormulation(rows);
      setFeedstockProductUuids(food.feedstocks.map((item) => item.product.uuid));
    } catch {
      toaster.error({
        title: text.singularLabel,
        description: languageGB.common.errorLog.unknownError,
      });
    }
  }

  // Produto selecionado (ramo Estoque) — autofill FIXO (`measurement`=
  // "Unidade"/`product_quantity`=1, ficha item 7) + resolve `has_lot` via
  // `getProduct(uuid)` para mostrar/exigir `provider_lot`/`shelf_life`
  // (mirror `_forms.blade.php:40-50`).
  async function handleProductChange(option: Option<string> | null) {
    const previousUuid = watch('product_id')?.value ?? null;
    setValue('product_id', option ?? null, { shouldDirty: true });

    if (!option) {
      setHasLot(false);
      setValue('measurement', '');
      setValue('product_quantity', 0);
      return;
    }

    setValue('measurement', STOCK_MEASUREMENT_FIXED_LABEL);
    setValue('product_quantity', 1);

    if (option.value === previousUuid) return;

    try {
      const response = await getProduct(option.value);
      setHasLot(!!response.data.has_lot);
    } catch {
      setHasLot(false);
      toaster.error({
        title: text.singularLabel,
        description: languageGB.common.errorLog.unknownError,
      });
    }
  }

  // Troca de `type` em modo CRIAÇÃO — limpa estado do ramo anterior (mirror
  // `_forms.blade.php:170-206`): nenhum campo/linha do ramo anterior deve
  // sobreviver à troca. Em edição, `type` está sempre `disabled`
  // (`isFieldDisabled`), este handler nunca dispara.
  function handleTypeChange(option: Option<FoodBeatType> | null) {
    const nextType = option?.value ?? FOOD_BEAT_TYPE.FORMULATION;
    setValue('type', nextType, { shouldDirty: true });
    setValue('food_id', null);
    setValue('product_id', null);
    setValue('measurement', '');
    setValue('product_quantity', 0);
    setValue('provider_lot', '');
    setValue('shelf_life', '');
    setHasLot(false);
    setFeedstockProductUuids([]);
    replaceFormulation([]);
    // Ramo Estoque — semeia 1 linha vazia (UX: evita clicar "Adicionar Item"
    // no caso comum de 1 item só). Shape idêntico ao `handleAdd` de
    // `FoodBeatStockItemsEditor.tsx`. Ramo Formulação mantém `[]` (limpa).
    replaceStock(
      nextType === FOOD_BEAT_TYPE.STOCK
        ? [
            {
              warehouse_id: null,
              stock_id: null,
              measurement_id: null,
              stock_quantity: 0,
              quantity: '',
              amount: 0,
              total: 0,
            },
          ]
        : []
    );
  }

  const foodBeatMutation = useRequest({
    asyncFunction: tryPersistFoodBeat,
    entityName: text.singularLabel,
    queryKey: queryKey.foodBeats.foodBeat,
    queryKey2: queryKey.foodBeats.foodBeats,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Wrapper `tryPersistFoodBeat` (Lei 3, nomeado) — em edição, monta
  // LITERALMENTE `{date}` (Decisão 1, `## 9`); em criação, bifurca F/E
  // (`DA-FB-04`, endpoint único). `amount`/`total`/`percentage`/`quantity`/
  // `difference` (Formulação) enviados EXATAMENTE como calculados nos
  // editores (`DA-FB-08`, nenhum recompute aqui) — `quantity`/`difference`
  // corrigidos em `TASK-FB-FE-08` (faltavam no payload, causando 422).
  async function tryPersistFoodBeat(data: FoodBeatFormType) {
    try {
      if (isEditing && foodBeatId) {
        return await updateFoodBeat(foodBeatId, { date: data.date });
      }

      const base = {
        type: data.type,
        warehouse_uuid: data.warehouse_id!.value,
        date: data.date,
        quantity: Number(data.quantity),
      };

      if (data.type === FOOD_BEAT_TYPE.FORMULATION) {
        const payload: CreateFoodBeatPayload = {
          ...base,
          food_uuid: data.food_id!.value,
          feedstocks: data.formulationItems.map((item) => ({
            stock_uuid: item.stock_id!.value,
            quantity_realized: Number(item.feedstock_quantity_realized),
            // `feedstocks.*.quantity` (previsto) — `FoodBeatRequest::rules()`
            // exige `required` (correção mecânica `TASK-FB-03`, `DA-FB-08`);
            // já calculado e sincronizado ao RHF pelo próprio editor
            // (`FoodBeatFormulationItemsEditor`, mirror do `difference`
            // abaixo) — sem recompute aqui (TASK-FB-FE-08, fix P0).
            quantity: Number(item.feedstock_quantity),
            percentage: Number(item.percentage),
            // `feedstocks.*.difference` — mesma exigência `required` do
            // backend; mesmo racional acima (TASK-FB-FE-08, fix P0).
            difference: Number(item.feedstock_difference),
            amount: Number(item.feedstock_amount),
            total: Number(item.feedstock_total),
          })),
        };
        return await createFoodBeat(payload);
      }

      const payload: CreateFoodBeatPayload = {
        ...base,
        product_uuid: data.product_id!.value,
        provider_lot: data.provider_lot || undefined,
        shelf_life: data.shelf_life || undefined,
        items: data.stockItems.map((item) => ({
          stock_uuid: item.stock_id!.value,
          quantity: Number(item.quantity),
          amount: Number(item.amount),
          total: Number(item.total),
        })),
      };
      return await createFoodBeat(payload);
    } catch (error) {
      // 422 de lote duplicado (`DA-FB-13`) mapeado para o campo — mesma
      // técnica de `CreateOrUpdateFuncao.tsx`/`CreateOrUpdateEvento.tsx` (o
      // `throw` preserva o toast genérico que `useRequest` já mostra).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        if (fieldErrors?.provider_lot?.[0]) {
          setError('provider_lot', { type: 'server', message: fieldErrors.provider_lot[0] });
        }
      }
      throw error;
    }
  }

  // Guard EXPLÍCITO (`Object.keys(dirtyFields).length === 0`), NÃO
  // `isEmpty()` — anti-padrão proibido do protocolo, mesma correção já
  // aplicada em `CreateOrUpdateFood.tsx`/`CreateOrUpdateFuncao.tsx`.
  async function onSubmit(data: FoodBeatFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }
    await foodBeatMutation.mutateAsync(data);
  }

  const isSubmitting = foodBeatMutation.isPending;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && (
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* Alert de aviso — SOMENTE em modo edição (Decisão 1, `## 9`):
            explica por que os campos aparecem preenchidos mas travados. */}
        {isEditing && (
          <Alert.Root status="info" borderRadius="md" mb={6}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{text.form.hints.editReadonlyNotice}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {/* 13 campos de cabeçalho renderizados, ORDEM FIEL ao Blade legado
            (ver cabeçalho do arquivo). `farm_id` nunca é campo RHF. */}
        <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
          {/* `code` — readonly, só populado em edição; em criação, gerado
              server-side (`DA-FB-12`), sem prévia. */}
          <InputReadOnly
            name="code"
            label={header.code}
            value={isEditing ? (foodBeatDetail?.code ?? '—') : '—'}
            loading={!!isLoading}
          />

          {/* "Responsável" — readonly, fora do payload, schema e
              `dirtyFields` (mirror EXATO `CreateOrUpdateFood.tsx`). CREATE:
              usuário logado. EDIT: quem cadastrou. */}
          <InputReadOnly
            label={header.responsible}
            value={isEditing ? (foodBeatDetail?.user?.name ?? '—') : (authUser?.username ?? '—')}
            loading={!!isLoading}
          />

          {/* `date` — `<Input type="date">` cru (`FoodBeatForm.date: string`,
              mirror `MovementForm.date`/`FoodForm.date`). ÚNICO campo
              editável em modo edição — gated SÓ por permissão. */}
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={header.date}
                error={errors.date?.message}
                isRequired
                disabled={!canSave || !!isLoading}
              />
            )}
          />

          {/* `type` — Select 2 opções. Disabled REAL em edição (Decisão 1),
              não só `readOnly` visual. */}
          <Controller
            name="type"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={header.type}
                name={field.name}
                value={foodBeatTypeOptions.getOption(field.value, languageGB)}
                onChange={handleTypeChange}
                options={typeOptions}
                error={error?.message}
                isRequired
                isDisabled={isFieldDisabled}
              />
            )}
          />

          {/* `warehouse_id` (Armazém Destino) — `listWarehouseOptions({ type:
              'producao' })`, mirror filtro de armazéns tipo PRODUCTION. */}
          <Controller
            name="warehouse_id"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={header.warehouse}
                service={listProductionWarehouses}
                pageSize={FLAT_CATALOG_PAGE_SIZE}
                mapOptions={mapWarehouseOption}
                findParams={findParamsFromSearch}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                isDisabled={isFieldDisabled}
              />
            )}
          />

          {/* `food_id`/`product_id` — condicional por `type`, 1 dos 2 por
              vez. Ao selecionar, hidrata composição/`has_lot` (ver handlers
              acima). */}
          {isFormulationType ? (
            <Controller
              name="food_id"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={header.food}
                  service={listActiveFoodOptions}
                  mapOptions={mapFoodOption}
                  findParams={findParamsFromSearch}
                  value={field.value ?? undefined}
                  onChange={handleFoodChange as any}
                  error={error?.message}
                  isRequired
                  isDisabled={isFieldDisabled}
                />
              )}
            />
          ) : (
            <Controller
              name="product_id"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={header.product}
                  service={listStockProductOptions}
                  mapOptions={mapProductOption}
                  findParams={findParamsFromSearch}
                  value={field.value ?? undefined}
                  onChange={handleProductChange as any}
                  error={error?.message}
                  isRequired
                  isDisabled={isFieldDisabled}
                />
              )}
            />
          )}

          {/* `product_quantity` (Quantidade Referência) — SEMPRE readonly
              (autofill, nunca editado pelo usuário em nenhum modo). */}
          <Controller
            name="product_quantity"
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={header.productQuantity}
                allowDot
                decimalPlaces={2}
                value={Number(field.value) || 0}
                onValueChange={() => {}}
                disabled
              />
            )}
          />

          {/* `measurement` — texto SEMPRE readonly (autofill). Ver nota de
              topo do arquivo sobre a lacuna de hidratação em edição. */}
          <InputReadOnly label={header.measurement} value={measurementValue || '—'} />

          {/* `quantity` (Quantidade Produzida) — editável SÓ em CRIAÇÃO. */}
          <Controller
            name="quantity"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberInput
                name={field.name}
                label={header.quantity}
                allowDot
                decimalPlaces={2}
                min={0.01}
                value={Number(field.value) || 0}
                onValueChange={(value) => field.onChange(value ?? 0)}
                isRequired
                disabled={isFieldDisabled}
                error={error?.message}
              />
            )}
          />

          {/* `provider_lot`/`shelf_life` — condicional (`has_lot` do produto
              selecionado, ramo Estoque). */}
          {showLotFields && (
            <Input
              maxLength={15}
              label={header.providerLot}
              {...register('provider_lot')}
              value={providerLotValue}
              error={errors.provider_lot?.message}
              disabled={isFieldDisabled}
            />
          )}

          {showLotFields && (
            <Controller
              name="shelf_life"
              control={control}
              render={({ field }) => (
                <DateInput
                  value={field.value ?? null}
                  onChange={(v) => field.onChange(v ?? '')}
                  label={header.shelfLife}
                  error={errors.shelf_life?.message}
                  disabled={isFieldDisabled}
                />
              )}
            />
          )}

          {/* `vl_total` — texto readonly, só ramo Estoque (valor vem do
              `onTotalChange` do `FoodBeatStockItemsEditor`). */}
          {!isFormulationType && (
            <InputReadOnly label={header.total} value={formatQuantity(stockItemsTotal)} />
          )}
        </SimpleGrid>

        {/* Composição — 1 dos 2 editores por vez, conforme `type`
            (`TASK-FB-FE-04`). `useFieldArray` vive AQUI (pai). */}
        <Box mt={6}>
          {isFormulationType ? (
            <FoodBeatFormulationItemsEditor
              control={control}
              fields={formulationFields}
              // Cast pragmático — mesmo racional de `FoodFeedstocksEditor`/
              // `CreateOrUpdateFood.tsx::append`: `append`/`remove` do
              // `useFieldArray<FoodBeatFormType>` são estruturalmente
              // idênticos ao que o editor espera (mesmo elemento
              // `FoodBeatFormulationItemForm`); o `ArrayPath<T>` do RHF só
              // não prova isso sozinho pelo tipo genérico fixado do editor.
              append={
                appendFormulation as unknown as UseFieldArrayAppend<
                  FormulationItemsFieldValues,
                  'formulationItems'
                >
              }
              remove={removeFormulation}
              errors={errors}
              languageGB={languageGB}
              disabled={isFieldDisabled}
              headerQuantity={headerQuantity}
              headerProductQuantity={headerProductQuantity}
              feedstockProductUuids={feedstockProductUuids}
            />
          ) : (
            <FoodBeatStockItemsEditor
              control={control}
              fields={stockFields}
              // Cast pragmático — mesmo racional acima (`appendFormulation`).
              append={
                appendStock as unknown as UseFieldArrayAppend<StockItemsFieldValues, 'stockItems'>
              }
              remove={removeStock}
              errors={errors}
              languageGB={languageGB}
              disabled={isFieldDisabled}
              onTotalChange={setStockItemsTotal}
            />
          )}
        </Box>
      </Form>
    </FormContainer>
  );
}
