// src/pages/Administrativo/Fabrica/CreateOrUpdateFood.tsx
// -----------------------------------------------------------------------------
// Formulário ÚNICO de criação/edição de Formulação (Food — Fábrica/Ração,
// TASK-FOOD-FE-06). Rotas `/administrativo/fabrica/formulacao/novo` (criar) e
// `/administrativo/fabrica/formulacao/:foodId` (editar) — conectadas em
// `TASK-FOOD-FE-07`, fora do escopo deste arquivo.
//
// UX-GAP confirmado (mesmo achado da Listagem, `TASK-FOOD-FE-05`) — nenhuma
// página Food/Formulação/Ração em `GB.Cerne.UX/src/pages`. Base = Blade
// legado (`_forms.blade.php:1-51`/`_card-item.blade.php`) + padrão de
// formulário consolidado (`CreateOrUpdateParameterWeights.tsx` —
// `InputReadOnly`/"Responsável" mirror exato; `CreateOrUpdateMovimento.tsx` —
// campo `date: string` via `<Input type="date">`, NÃO `InputDate`/Date
// object, porque `FoodForm.date`/`food-schema.ts` são tipados `string`, mesmo
// racional de `MovementForm.date`).
//
// ORDEM dos 8 campos de cabeçalho FIEL ao Blade legado
// (`_forms.blade.php:1-51`, confirmado por leitura direta nesta janela de
// execução): `code` (readonly) → `user_id`/"Responsável" (readonly, NÃO é
// campo RHF) → `date` → `is_enabled` → `product_id` → `quantity` →
// `measurement_id` → `type`. NÃO reordenar, NÃO renomear.
//
// Risco 1 (`code`)/Risco 2 (`user`) — mirror EXATO de `TASK-PW-FE-05`
// (ParameterWeight, `CreateOrUpdateParameterWeights.tsx`):
//   - "Responsável": CREATE → `useAuth().user?.username` (sem chamada de
//     API); EDIT → `foodDetail?.user?.name ?? '—'` (shape `{uuid,name}`,
//     `Food-contrato.md §4.4`). `InputReadOnly`, fora do payload, fora do
//     schema Yup, fora de `dirtyFields` — nunca campo RHF.
//   - "Código": só populado em modo edição (`foodDetail?.code`); em criação,
//     vazio até salvar (gerado server-side, `DA-FOOD-05`).
//
// Risco 3 (cascata Produto→Unidade no CABEÇALHO) — reusa
// `useProductMeasurementOptions` (`TASK-FOOD-FE-04`, mesmo hook da linha de
// composição em `FoodFeedstocksEditor.tsx`): ao trocar o Produto do
// cabeçalho, repopula as opções de `measurement_id` a partir de
// `product.measurement`/`product.measurement_second`, limpando a unidade
// selecionada quando o produto muda (mesma regra 12 da Doc Bruta já aplicada
// na linha de composição).
//
// ⚠️ DIVERGÊNCIA DOCUMENTADA da ficha (`## Componentes`, "MoneyInput —
// Quantidade Referência"): `quantity` é `decimal(12,2)` (Doc Bruta Food §2,
// `add_quantity_to_foods.php:15`) — uma QUANTIDADE, nunca um valor monetário
// (nenhum "R$" no legado; a classe CSS `money` do Blade só reaproveitava a
// máscara de milhar/decimal, não é moeda). Mesma correção JÁ documentada e
// aplicada em `FoodFeedstocksEditor.tsx` para `percentage`/quantidade de
// linha — aqui, no cabeçalho, o componente fiel ao dado real é `NumberInput`
// (`allowDot`, `decimalPlaces={2}`), não `MoneyInput`. O texto auxiliar
// mirror o `data-help` do legado (`_forms.blade.php:32-37`) — chave i18n
// `form.hints.quantityTooltip` (renomeada de `quantityHelp` na
// `TASK-FOOD-FE-08`, feedback de homologação: helper text abaixo do campo
// virou tooltip na label "Quantidade*", via `tooltip` de `NumberInput`/
// `Form/Field.tsx`, mesmo mecanismo já usado por `Input`/`Select`/
// `Textarea`).
//
// Trava de soma=100% (requisito inviolável do dono, exceção aprovada —
// Decisão 4 do `Food-contrato.md`, já documentada em `TASK-FOOD-FE-02`/
// `FoodFeedstocksEditor.tsx`): botão "Salvar" desabilitado quando
// `type==='P'` E `|total-100| >= 0.01`. `total` chega via `onTotalChange` do
// `FoodFeedstocksEditor` (estado local, cosmético, nunca no payload). Quando
// `type==='U'`, o botão nunca é desabilitado por este critério.
//
// `useFieldArray({ name: 'feedstocks' })` vive AQUI (formulário pai) —
// `FoodFeedstocksEditor` recebe `fields`/`append`/`remove` via props
// (decisão estrutural já documentada no cabeçalho daquele arquivo,
// `TASK-FOOD-FE-04`).
//
// PUT sempre envia o payload COMPLETO (`DA-FOOD-06`, `food-service.ts`) — a
// composição inteira substitui a anterior via `sync()` no backend; por isso
// (diferente de `CreateOrUpdateParameterWeights`) não há branch de update
// parcial por `dirtyFields` aqui.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { FOOD_TYPE } from '@/constants/foods/food-type';
import { foodTypeOptions } from '@/constants/foods/options/food-type-options';
import { queryKey } from '@/constants/query-key';

import { foodSchemaResolver } from '@/validations/schemas/Food/food-schema';

import { createFood, updateFood } from '@/services/v2/Foods/food-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';

import type { Option } from '@/@types/option';
import type {
  FoodDetail,
  FoodFeedstockPayload,
  FoodForm as FoodFormType,
  FoodPayload,
} from '@/@types/v2/Foods';

import { FoodFeedstocksEditor } from './FoodFeedstocksEditor';
import { useFoodForm } from './useFoodForm';
import { useProductMeasurementOptions } from './useProductMeasurementOptions';

import type { FeedstocksFieldValues } from './FoodFeedstocksEditor';
import type { UseFieldArrayAppend } from 'react-hook-form';

// Select de Ração (cabeçalho `product_id`) — mirror EXATO de
// `listProductOptions` com `food_eligibility: 'food'`, mesma reconciliação já
// documentada em `FilterSideFabrica.tsx`/`FoodFeedstocksEditor.tsx`.
async function listFoodProductOptions(params: { search?: string; page?: number }) {
  return listProductOptions({ ...params, food_eligibility: 'food' });
}

function mapProductOption(item: ProductOptionItem) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

// Listagem de Formulação — destino explícito do redirect pós-salvar. `navigate(-1)`
// (voltar no histórico) não redirecionava de forma confiável para a listagem
// inicial (ex.: acesso direto a `/novo` ou histórico alterado); navegar para a
// rota da lista é determinístico.
const FOOD_LIST_PATH = '/administrativo/fabrica/formulacao';

export default function CreateOrUpdateFood() {
  const { foodId } = useParams<{ foodId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();
  const text = languageGB.foods.food;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID) — mirror
  // `CreateOrUpdateParameterWeights`/`CreateOrUpdateMovimento`.
  const isEditing = isValidGuid(foodId);

  const canSave = isEditing ? can('food_edit') : can('food_create');

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<FoodFormType>({
    mode: 'onChange',
    resolver: foodSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      product_id: null,
      date: '',
      is_enabled: true,
      // Mirror `_forms.blade.php:32` — valor padrão do legado no create é
      // '1,00' (fator de escala neutro), mesmo default `1` da migration
      // (`add_quantity_to_foods.php:15`).
      quantity: 1,
      measurement_id: null,
      type: FOOD_TYPE.PERCENTAGE,
      // Mirror `_forms.blade.php:70-76` — o create SEMPRE nasce com 1 linha
      // de composição vazia pronta para editar (`@include('foods._card-item')`
      // fora do `@if(isset($item))`), evitando o clique obrigatório em
      // "Adicionar Matéria-Prima". Só na criação — a EDIÇÃO sobrescreve este
      // default via `reset()` dentro de `fillForm` com as linhas reais.
      feedstocks: isEditing
        ? []
        : [{ feedstock_product_id: null, measurements: null, percentage: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'feedstocks' });

  function fillForm(data: FoodDetail, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length > 0 && !resetForce) return;

    reset({
      product_id: {
        label: `${data.product.code} — ${data.product.description}`,
        value: data.product.uuid,
      },
      date: data.date ? data.date.slice(0, 10) : '',
      is_enabled: !!data.is_enabled,
      quantity: Number(data.quantity),
      measurement_id: data.measurement
        ? { label: data.measurement.description, value: data.measurement.uuid }
        : null,
      type: data.type,
      feedstocks: (data.feedstocks ?? []).map((item) => ({
        feedstock_product_id: {
          label: `${item.product.code} — ${item.product.description}`,
          value: item.product.uuid,
        },
        measurements: item.measurement
          ? { label: item.measurement.description, value: item.measurement.uuid }
          : null,
        percentage: Number(item.percentage),
      })),
    });
  }

  const foodQuery = useFoodForm({
    registrationId: isEditing ? foodId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([foodQuery as any]);
  const foodDetail = (foodQuery as any)?.data as FoodDetail | undefined;

  // Cascata Produto→Unidade de Medida do CABEÇALHO (Risco 3) — mesmo hook
  // reusado pela linha de composição (`FoodFeedstocksEditor.tsx`).
  const headerProductUuid = watch('product_id')?.value ?? null;
  const { options: headerMeasurementOptions, isLoading: isLoadingHeaderMeasurement } =
    useProductMeasurementOptions(headerProductUuid);

  const watchedType = watch('type');
  const isPercentageType = watchedType === FOOD_TYPE.PERCENTAGE;

  // Total da composição — cosmético (`useWatch` dentro de
  // `FoodFeedstocksEditor`), nunca no payload. Governa só a trava de submit.
  const [feedstocksTotal, setFeedstocksTotal] = useState(0);
  const isSumInvalid = isPercentageType && Math.abs(feedstocksTotal - 100) >= 0.01;

  const foodMutation = useRequest({
    asyncFunction: tryPersistFood,
    entityName: text.singularLabel,
    queryKey: queryKey.foods.foods,
    queryKey2: queryKey.foods.food,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(FOOD_LIST_PATH);
    },
  });

  async function tryPersistFood(data: FoodFormType) {
    const feedstocksPayload: FoodFeedstockPayload[] = data.feedstocks.map((item) => ({
      product_uuid: item.feedstock_product_id!.value,
      measurement_uuid: item.measurements?.value ?? null,
      percentage: Number(item.percentage),
    }));

    // PUT sempre envia o payload COMPLETO (`DA-FOOD-06`) — sem branch de
    // update parcial por `dirtyFields` (diferente de `ParameterWeights`).
    const payload: FoodPayload = {
      product_uuid: data.product_id!.value,
      date: data.date,
      is_enabled: !!data.is_enabled,
      type: data.type,
      measurement_uuid: data.measurement_id?.value ?? null,
      quantity: Number(data.quantity),
      feedstocks: feedstocksPayload,
    };

    if (isEditing && foodId) {
      return await updateFood(foodId, payload);
    }
    return await createFood(payload);
  }

  // Guard EXPLÍCITO (`Object.keys(dirtyFields).length === 0`), NÃO
  // `isEmpty()` — anti-padrão proibido do protocolo (`padrao-frontend-gb-
  // cerne-v2`, "não criar lógica nova sobre `isEmpty`, semântica invertida"),
  // mesma correção já aplicada em `CreateOrUpdateParameterWeights.tsx`.
  async function onSubmit(data: FoodFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(FOOD_LIST_PATH);
      return;
    }
    await foodMutation.mutateAsync(data);
  }

  const isSubmitting = foodMutation.isPending;

  const statusOptions: Option<string>[] = [
    { value: 'true', label: text.list.columns.activeLabel },
    { value: 'false', label: text.list.columns.inactiveLabel },
  ];

  const typeOptions = foodTypeOptions.options(languageGB);

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="secondary"
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
              disabled={isSubmitting || isLoading || isSumInvalid}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* 8 campos de cabeçalho, ORDEM FIEL ao Blade legado
            (`_forms.blade.php:1-51`): code → user (Responsável) → date →
            is_enabled → product_id → quantity → measurement_id → type. */}
        <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
          {/* `code` — readonly, só populado em edição (Risco 2, mirror
              `TASK-PW-FE-05`); em criação, gerado server-side
              (`DA-FOOD-05`), sem prévia. */}
          <InputReadOnly
            name="code"
            label={text.form.fields.code}
            value={isEditing ? (foodDetail?.code ?? '—') : '—'}
            loading={isLoading}
          />

          {/* `user_id`/"Responsável" — readonly, fora do payload, fora do
              schema Yup, NUNCA campo RHF (Risco 1, mirror EXATO de
              `TASK-PW-FE-05`). CREATE: usuário logado (`useAuth()`, sem
              chamada de API). EDIT: quem cadastrou (`foodDetail.user.name`). */}
          <InputReadOnly
            label={text.form.fields.responsible}
            value={isEditing ? (foodDetail?.user?.name ?? '—') : (authUser?.username ?? '—')}
            loading={isLoading}
          />

          {/* `date` — `<Input type="date">` cru + `register('date')`, NÃO
              `InputDate`/objeto `Date`: `FoodForm.date`/`food-schema.ts` são
              tipados `string` (mesma convenção de `MovementForm.date`,
              mirror `CreateOrUpdateMovimento.tsx`). */}
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={text.form.fields.date}
                error={errors.date?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          {/* `is_enabled` — `Select` "Ativo"/"Inativo" (regra global #4 do
              protocolo, rótulos idênticos aos da grid,
              `text.list.columns.activeLabel`/`inactiveLabel`). O DADO
              permanece boolean — a conversão string↔boolean acontece só na
              fronteira do campo (mirror `CreateOrUpdateCentroCusto.tsx`). */}
          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.status}
                name={name}
                value={statusOptions.find((o) => o.value === (value ? 'true' : 'false')) ?? null}
                onChange={(opt: Option<string> | null) => onChange(opt?.value === 'true')}
                options={statusOptions}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          {/* `product_id`/"Produto" (rótulo corrigido na `TASK-FOOD-FE-08`,
              feedback de homologação — era "Ração") — `SelectAsyncPaginate`,
              `food_eligibility: 'food'`. Ao trocar o produto, limpa a
              unidade selecionada (Risco 3, regra 12 da Doc Bruta — mirror
              `FoodFeedstockRow::handleProductChange`). */}
          <Controller
            name="product_id"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.product}
                service={listFoodProductOptions}
                mapOptions={mapProductOption}
                findParams={findParamsFromSearch}
                value={field.value ?? undefined}
                onChange={(option: any) => {
                  const previousUuid = field.value?.value ?? null;
                  field.onChange(option ?? null);
                  if ((option?.value ?? null) !== previousUuid) {
                    setValue('measurement_id', null);
                  }
                }}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
              />
            )}
          />

          {/* `quantity` — "Quantidade Referência". `NumberInput` (NÃO
              `MoneyInput` — ver divergência documentada no cabeçalho do
              arquivo). Texto mirror o `data-help` do legado, exibido via
              `tooltip` na label "Quantidade*" (`TASK-FOOD-FE-08`, feedback
              de homologação — antes era `helperText` abaixo do campo). */}
          <Controller
            name="quantity"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberInput
                name={field.name}
                label={text.form.fields.quantity}
                tooltip={text.form.hints.quantityTooltip}
                allowDot
                decimalPlaces={2}
                min={0.01}
                value={Number(field.value) || 0}
                onValueChange={(value) => field.onChange(value ?? 0)}
                isRequired
                disabled={!canSave}
                error={error?.message}
              />
            )}
          />

          {/* `measurement_id` — populado por `useProductMeasurementOptions`
              a partir do `product_id` do CABEÇALHO (Risco 3). Nullable no
              contrato (`measurement_uuid`) — sem `isRequired`. */}
          <Controller
            name="measurement_id"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={text.form.fields.measurement}
                name={field.name}
                value={field.value ?? undefined}
                onChange={field.onChange}
                options={headerMeasurementOptions}
                isDisabled={!canSave || !headerProductUuid}
                loading={isLoadingHeaderMeasurement}
                error={error?.message}
              />
            )}
          />

          {/* `type` — P/U, `foodTypeOptions` (`TASK-FOOD-FE-01`, via i18n,
              nunca hardcoded). Governa o rótulo dinâmico de
              `FoodFeedstocksEditor` e a trava de soma=100%. */}
          <Controller
            name="type"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={text.form.fields.type}
                name={field.name}
                value={foodTypeOptions.getOption(field.value, languageGB)}
                onChange={(opt: Option<string> | null) =>
                  field.onChange(opt?.value ?? FOOD_TYPE.PERCENTAGE)
                }
                options={typeOptions}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
              />
            )}
          />
        </SimpleGrid>

        {/* Composição (matérias-primas) — `FoodFeedstocksEditor`
            (`TASK-FOOD-FE-04`). `useFieldArray` vive AQUI (pai); o total
            calculado ali (cosmético) alimenta a trava de submit acima via
            `onTotalChange`. */}
        <Box mt={6}>
          <FoodFeedstocksEditor
            control={control}
            fields={fields}
            // Cast pragmático — mesmo racional de `MovementAllocationEditor`/
            // `CreateOrUpdateMovimento.tsx`: `append` do
            // `useFieldArray<FoodFormType>` é estruturalmente idêntico ao que
            // o componente espera (mesmo elemento `FoodFeedstockItemForm`); o
            // `ArrayPath<T>` do react-hook-form só não prova isso sozinho
            // através do tipo genérico fixado do componente.
            append={append as unknown as UseFieldArrayAppend<FeedstocksFieldValues, 'feedstocks'>}
            remove={remove}
            type={watchedType}
            errors={errors}
            languageGB={languageGB}
            disabled={!canSave}
            onTotalChange={setFeedstocksTotal}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
