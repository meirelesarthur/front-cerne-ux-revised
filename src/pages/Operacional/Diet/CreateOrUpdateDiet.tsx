// src/pages/Operacional/Diet/CreateOrUpdateDiet.tsx
// -----------------------------------------------------------------------------
// Formulário ÚNICO de criação/edição/visualização de Dieta (Diet —
// Operacional/Pecuária, TASK-FE-DIET-03). Rotas `/operacional/dietas/novo`
// (criar) e `/operacional/dietas/:dietId` (editar) — conectadas em
// TASK-FE-DIET-07, fora do escopo deste arquivo. Modo VIEW por flag
// (`!canSave` desabilita todos os campos, mirror EXATO
// `CreateOrUpdateFood.tsx` — sem rota dedicada de "show").
//
// UX-GAP confirmado (`ux-map.md`) — nenhuma tela de Dieta no design system
// `cerne`. Molde 1:1 `CreateOrUpdateFood.tsx` + `FoodFeedstocksEditor.tsx` +
// `useFoodForm.ts`, adaptado aos campos REAIS de Diet (confirmados por
// leitura direta de `DietRequest`/`DietData`/`DietResource` no worktree
// `diet-api`, ver `@/@types/v2/Diets`).
//
// ORDEM dos campos de cabeçalho (FD-DIETS-H-01..09): `code` (readonly) →
// `user`/"Responsável" (readonly, NÃO é campo RHF) → `date` → `product_id`
// (SelectAsyncPaginate `food_eligibility=food`, GAP-DIET-FE-01) → `quantity`
// ("Quantidade Referência") → `measurement_id` (cascata do produto,
// OBRIGATÓRIO — ⚠️ diverge de Food, que é nullable) → `objective` (select
// estático) → `type` (select P/U, default server-side `U` — ⚠️ diverge de
// Food, que é `P`) → `observation` (Textarea, CL-024, max 1500).
//
// Trava de soma=100% (`type==='P'`, SR-BTN-07) é EXCLUSIVAMENTE client-side
// (ver `diet-ingredients-sum-schema.ts`) — botão "Salvar" desabilitado
// quando a soma de `ingredients[].quantity` diverge de 100.
//
// `useFieldArray({ name: 'ingredients' })` vive AQUI (formulário pai) —
// `DietIngredientsEditor` recebe `fields`/`append`/`remove` via props.
//
// PUT sempre envia o payload COMPLETO (mirror `DA-FOOD-06`) — confirmado por
// leitura direta: `IngredientData` não transporta `uuid`, a composição
// inteira é substituída em cada `PUT` (sem reconciliação por identidade,
// diferente de `DietBeat.items`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { useProductMeasurementOptions } from '@/pages/Administrativo/Fabrica/useProductMeasurementOptions';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { DIET_TYPE } from '@/constants/diet/diet-type';
import { dietObjectiveOptions } from '@/constants/diet/options/diet-objective-options';
import { dietTypeOptions } from '@/constants/diet/options/diet-type-options';
import { queryKey } from '@/constants/query-key';

import { dietSchemaResolver } from '@/validations/schemas/Diet/diet-schema';

import { createDiet, updateDiet } from '@/services/v2/Diets/diet-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';

// Reuso EXPLÍCITO instruído pelo contrato — molde 1:1 de Food (não
// duplicado): cascata Produto→Unidade de Medida do CABEÇALHO.

import type {
  DietDetail,
  DietForm as DietFormType,
  DietIngredientPayload,
  DietPayload,
} from '@/@types/v2/Diets';

import { DietIngredientsEditor } from './DietIngredientsEditor';
import { useDietForm } from './useDietForm';

import type { DietIngredientsFieldValues } from './DietIngredientRow';
import type { UseFieldArrayAppend } from 'react-hook-form';

// Select de Produto (cabeçalho `product_id`) — mirror EXATO de
// `listProductOptions` com `food_eligibility: 'food'` (GAP-DIET-FE-01:
// reuso do padrão de Food, paridade a confirmar pelo Tester).
async function listDietProductOptions(params: { search?: string; page?: number }) {
  return listProductOptions({ ...params, food_eligibility: 'food' });
}

function mapProductOption(item: ProductOptionItem) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

export default function CreateOrUpdateDiet() {
  const { dietId } = useParams<{ dietId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();
  const text = languageGB.diets.diet;

  // É edição quando existe um GUID válido na rota ("novo" não é GUID) —
  // mirror `CreateOrUpdateFood`.
  const isEditing = isValidGuid(dietId);

  const canSave = isEditing ? can('diets_edit') : can('diets_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<DietFormType>({
    mode: 'onChange',
    resolver: dietSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      product_id: null,
      measurement_id: null,
      quantity: 1,
      date: '',
      objective: 'AD',
      // Default server-side é `U` (⚠️ diverge de Food, cujo default é `P`).
      type: DIET_TYPE.UNIT,
      observation: '',
      // Mirror `CreateOrUpdateFood` — o create nasce com 1 linha de
      // composição vazia pronta para editar; a EDIÇÃO sobrescreve este
      // default via `reset()` dentro de `fillForm` com as linhas reais.
      ingredients: isEditing
        ? []
        : [{ product_id: null, measurement_id: null, dry_matter: 0, cost_value: 0, quantity: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' });

  function fillForm(data: DietDetail, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length > 0 && !resetForce) return;

    reset({
      product_id: data.product
        ? { label: `${data.product.code} — ${data.product.description}`, value: data.product.uuid }
        : null,
      measurement_id: data.measurement
        ? { label: data.measurement.name, value: data.measurement.uuid }
        : null,
      quantity: Number(data.quantity) || 0,
      date: data.date ? data.date.slice(0, 10) : '',
      objective: data.objective,
      type: data.type,
      observation: data.observation ?? '',
      ingredients: (data.ingredients ?? []).map((item) => ({
        product_id: item.product
          ? {
              label: `${item.product.code} — ${item.product.description}`,
              value: item.product.uuid,
            }
          : null,
        measurement_id: item.measurement
          ? { label: item.measurement.name, value: item.measurement.uuid }
          : null,
        dry_matter: Number(item.dry_matter) || 0,
        cost_value: Number(item.cost_value) || 0,
        quantity: Number(item.quantity) || 0,
      })),
    });
  }

  const dietQuery = useDietForm({
    registrationId: isEditing ? dietId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([dietQuery as any]);
  const dietDetail = (dietQuery as any)?.data as DietDetail | undefined;

  // Cascata Produto→Unidade de Medida do CABEÇALHO — mesmo hook reusado
  // pela linha de composição (`DietIngredientRow.tsx`).
  const headerProductUuid = watch('product_id')?.value ?? null;
  const { options: headerMeasurementOptions, isLoading: isLoadingHeaderMeasurement } =
    useProductMeasurementOptions(headerProductUuid);

  const watchedType = watch('type');
  const isPercentageType = watchedType === DIET_TYPE.PERCENTAGE;

  // Total da composição — cosmético (`useWatch` dentro de
  // `DietIngredientsEditor`), nunca no payload. Governa só a trava de
  // submit (SR-BTN-07).
  const [ingredientsTotal, setIngredientsTotal] = useState(0);
  const isSumInvalid = isPercentageType && Math.abs(ingredientsTotal - 100) >= 0.01;

  const dietMutation = useRequest({
    asyncFunction: tryPersistDiet,
    entityName: text.singularLabel,
    queryKey: queryKey.diets.diets,
    queryKey2: queryKey.diets.diet,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistDiet(data: DietFormType) {
    const ingredientsPayload: DietIngredientPayload[] = data.ingredients.map((item) => ({
      product_uuid: item.product_id!.value,
      measurement_uuid: item.measurement_id!.value,
      dry_matter: Number(item.dry_matter),
      cost_value: Number(item.cost_value),
      quantity: Number(item.quantity),
    }));

    // PUT sempre envia o payload COMPLETO (mirror `DA-FOOD-06`) — sem branch
    // de update parcial por `dirtyFields`.
    const payload: DietPayload = {
      product_uuid: data.product_id!.value,
      measurement_uuid: data.measurement_id!.value,
      quantity: Number(data.quantity),
      date: data.date,
      objective: data.objective,
      type: data.type,
      observation: data.observation || null,
      ingredients: ingredientsPayload,
    };

    if (isEditing && dietId) {
      return await updateDiet(dietId, payload);
    }
    return await createDiet(payload);
  }

  // Guard EXPLÍCITO (`Object.keys(dirtyFields).length === 0`), mirror
  // `CreateOrUpdateFood`.
  async function onSubmit(data: DietFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }
    await dietMutation.mutateAsync(data);
  }

  const isSubmitting = dietMutation.isPending;

  const objectiveOptions = dietObjectiveOptions.options(languageGB);
  const typeOptions = dietTypeOptions.options(languageGB);

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
              disabled={isSubmitting || isLoading || isSumInvalid}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* Cabeçalho, ORDEM FIEL às Tarefas (FD-DIETS-H-01..09): code →
            user (Responsável) → date → product_id → quantity →
            measurement_id → objective → type → observation. */}
        <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
          <InputReadOnly
            name="code"
            label={text.form.fields.code}
            value={isEditing ? (dietDetail?.code ?? '—') : '—'}
            loading={isLoading}
          />

          <InputReadOnly
            label={text.form.fields.responsible}
            value={isEditing ? (dietDetail?.user?.name ?? '—') : (authUser?.username ?? '—')}
            loading={isLoading}
          />

          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(value) => field.onChange(value ?? '')}
                label={text.form.fields.date}
                error={errors.date?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          <Controller
            name="product_id"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.product}
                service={listDietProductOptions}
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

          {/* `measurement_id` — OBRIGATÓRIO (⚠️ diverge de Food, nullable). */}
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
                isRequired
              />
            )}
          />

          <Controller
            name="objective"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={text.form.fields.objective}
                name={field.name}
                value={dietObjectiveOptions.getOption(field.value, languageGB)}
                onChange={(opt: any) => field.onChange(opt?.value ?? 'AD')}
                options={objectiveOptions}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={text.form.fields.type}
                name={field.name}
                value={dietTypeOptions.getOption(field.value, languageGB)}
                onChange={(opt: any) => field.onChange(opt?.value ?? DIET_TYPE.UNIT)}
                options={typeOptions}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
              />
            )}
          />
        </SimpleGrid>

        <Box mt={6}>
          <Textarea
            label={text.form.fields.observation}
            maxLength={1500}
            {...register('observation')}
            error={errors.observation?.message}
            disabled={!canSave}
          />
        </Box>

        {/* Composição (ingredientes) — `DietIngredientsEditor`.
            `useFieldArray` vive AQUI (pai); o total calculado ali
            (cosmético) alimenta a trava de submit acima via
            `onTotalChange`. */}
        <Box mt={6}>
          <DietIngredientsEditor
            control={control}
            fields={fields}
            // Cast pragmático — mesmo racional de `CreateOrUpdateFood`.
            append={
              append as unknown as UseFieldArrayAppend<DietIngredientsFieldValues, 'ingredients'>
            }
            remove={remove}
            type={watchedType}
            errors={errors}
            languageGB={languageGB}
            disabled={!canSave}
            onTotalChange={setIngredientsTotal}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
