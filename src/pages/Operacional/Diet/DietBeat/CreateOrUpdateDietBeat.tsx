// src/pages/Operacional/Diet/DietBeat/CreateOrUpdateDietBeat.tsx
// -----------------------------------------------------------------------------
// Formulário ÚNICO de criação/edição de Batida (DietBeat — Operacional/
// Pecuária, TASK-FE-DIET-06). Rotas `/operacional/dietas/batidas/novo`
// (criar) e `/operacional/dietas/batidas/:dietBeatId` (editar) — conectadas
// em TASK-FE-DIET-07.
//
// Molde 1:1 `CreateOrUpdateFoodBeat.tsx` (ramo Formulação) +
// `FoodBeatFormulationItemsEditor.tsx` + `useFoodBeatForm.ts` — SEM branch
// F/E (DietBeat sempre deriva itens da Dieta escolhida). `diet_id` é
// readonly em modo EDIÇÃO (FD-DB-H-07, "mode_diff") — decisão de UX do
// contrato, NÃO uma restrição real do backend (confirmado por leitura
// direta: `DietBeatRequest::rules()` valida o MESMO conjunto completo em
// store/update, diferente de `FoodBeatRequest`/Decisão 1) — os demais
// campos permanecem editáveis por permissão.
//
// Cascata `diet_id` → `getDiet(uuid)` → `replace(itens)` — 1 linha por
// `Diet.ingredients[]`, mirror EXATO `handleFoodChange` de
// `CreateOrUpdateFoodBeat.tsx`. Em EDIÇÃO, os itens vêm hidratados de
// `DietBeatDetail.items` (preservando `uuid` de cada linha — AD-04,
// reconciliação por identidade no PUT) e a Dieta completa (`quantity`/
// `type`) é buscada separadamente (`getDiet`) só para alimentar as fórmulas
// de preview (CV-06/08/09) dos itens já existentes — SEM `replace()` (não
// perde a identidade das linhas persistidas).
//
// Conversão de unidade é SEMPRE server-side (AD-05) — este formulário nunca
// converte quantidade entre unidades; `quantity_realized` é enviado na
// unidade em que a linha já está.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

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
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

// Reuso EXPLÍCITO instruído pelo contrato — molde 1:1 de Food (não
// duplicado): cascata Produto→Unidade de Medida.

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { dietBeatSchemaResolver } from '@/validations/schemas/DietBeats/diet-beat-schema';

import { createDietBeat, updateDietBeat } from '@/services/v2/DietBeats/diet-beat-service';
import { getDiet, listDietOptionsPaginated } from '@/services/v2/Diets/diet-service';
import { listEquipmentCatalogOptions } from '@/services/v2/Equipments/equipment-service';

import type { Option } from '@/@types/option';
import type {
  DietBeatDetail,
  DietBeatForm as DietBeatFormType,
  DietBeatItemForm,
  DietBeatItemPayload,
  DietBeatPayload,
} from '@/@types/v2/DietBeats';
import type { DietDetail } from '@/@types/v2/Diets';
import type { EquipmentOption } from '@/@types/v2/Equipments';

import { DietBeatItemsEditor } from './DietBeatItemsEditor';
import { useDietBeatForm } from './useDietBeatForm';

function mapEquipmentOption(item: EquipmentOption) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

function mapDietOption(item: Option<string>) {
  return { label: item.label, value: item.value };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

export default function CreateOrUpdateDietBeat() {
  const { dietBeatId } = useParams<{ dietBeatId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();
  const text = languageGB.dietBeats.dietBeat;
  const header = text.form.fields.header;

  const isEditing = isValidGuid(dietBeatId);

  const canSave = isEditing ? can('diet-beats_edit') : can('diet-beats_create');

  // uuid de cada ingrediente da Dieta, alinhado por índice a `items` —
  // resolvido ao carregar a Dieta (`getDiet`) ou, em edição, a partir dos
  // próprios itens persistidos (`item.stock.product.uuid`).
  const [ingredientProductUuids, setIngredientProductUuids] = useState<(string | null)[]>([]);

  // uuid do PRODUTO da Dieta escolhida — governa a cascata de unidade de
  // medida do cabeçalho (`measurement_id`), reusando `useProductMeasurementOptions`.
  const [dietProductUuid, setDietProductUuid] = useState<string | null>(null);

  // Meta da Dieta escolhida (quantity/type) — só o necessário para as
  // fórmulas de preview CV-06/08/09 dos itens (NÃO é o Resource completo).
  const [dietMeta, setDietMeta] = useState<{ quantity: number; isPercentage: boolean }>({
    quantity: 0,
    isPercentage: false,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<DietBeatFormType>({
    mode: 'onChange',
    resolver: dietBeatSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      equipment_id: null,
      diet_id: null,
      measurement_id: null,
      quantity: '',
      date: '',
      items: [],
    },
  });

  const { fields, replace } = useFieldArray({ control, name: 'items' });

  function fillForm(data: DietBeatDetail, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length > 0 && !resetForce) return;

    reset({
      equipment_id: data.equipment
        ? { label: data.equipment.description, value: data.equipment.uuid }
        : null,
      diet_id: data.diet
        ? {
            label: `${data.diet.code} — ${data.diet.product?.description ?? ''}`,
            value: data.diet.uuid,
          }
        : null,
      measurement_id: data.measurement
        ? { label: data.measurement.name, value: data.measurement.uuid }
        : null,
      quantity: Number(data.quantity) || 0,
      date: data.date ? data.date.slice(0, 10) : '',
      items: (data.items ?? []).map((item) => ({
        uuid: item.uuid,
        product_label: item.stock?.product
          ? `${item.stock.product.code} — ${item.stock.product.description}`
          : '—',
        measurement_label: item.measurement?.name ?? '—',
        stock_id: item.stock
          ? { label: item.stock.warehouse?.description ?? '—', value: item.stock.uuid }
          : null,
        dry_matter: Number(item.dry_matter) || 0,
        cost_value: Number(item.cost_value) || 0,
        quantity: Number(item.quantity) || 0,
        quantity_realized: Number(item.quantity_realized) || 0,
        percentage: Number(item.percentage) || 0,
        difference: Number(item.difference) || 0,
      })),
    });

    setIngredientProductUuids((data.items ?? []).map((item) => item.stock?.product?.uuid ?? null));
  }

  const dietBeatQuery = useDietBeatForm({
    registrationId: isEditing ? dietBeatId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([dietBeatQuery as any]);
  const dietBeatDetail = (dietBeatQuery as any)?.data as DietBeatDetail | undefined;

  // Em EDIÇÃO, busca a Dieta completa (só `quantity`/`type`) para alimentar
  // os cálculos de preview dos itens já persistidos — SEM `replace()` (não
  // perde a identidade das linhas, AD-04).
  useEffect(() => {
    if (!isEditing || !dietBeatDetail?.diet?.uuid) return;
    getDiet(dietBeatDetail.diet.uuid)
      .then((response) => {
        const diet: DietDetail = response.data;
        setDietMeta({ quantity: Number(diet.quantity) || 0, isPercentage: diet.type === 'P' });
        setDietProductUuid(diet.product?.uuid ?? null);
      })
      .catch(() => {
        // Falha ao buscar meta da Dieta não impede a edição — apenas os
        // valores de preview (CV-06/08/09) ficam zerados até nova tentativa.
      });
  }, [isEditing, dietBeatDetail?.diet?.uuid]);

  const watchedHeaderQuantity = Number(watch('quantity')) || 0;

  // Cascata Dieta → Unidade de Medida (do PRODUTO da Dieta) — mesmo hook
  // reusado pelas demais telas do módulo.
  const { options: measurementOptions } = useProductMeasurementOptions(dietProductUuid);

  // Troca de Dieta (CRIAÇÃO) — `getDiet(uuid)` hidrata `ingredients[]` →
  // popula `items` (1 linha por ingrediente, `stock_id: null` — o usuário
  // escolhe o estoque de origem) + autofill `measurement_id`/`quantity` do
  // cabeçalho (mirror `handleFoodChange`).
  async function handleDietChange(option: Option<string> | null) {
    const previousUuid = watch('diet_id')?.value ?? null;
    setValue('diet_id', option ?? null, { shouldDirty: true });

    if (!option) {
      replace([]);
      setIngredientProductUuids([]);
      setDietMeta({ quantity: 0, isPercentage: false });
      setDietProductUuid(null);
      setValue('measurement_id', null);
      return;
    }
    if (option.value === previousUuid) return;

    try {
      const response = await getDiet(option.value);
      const diet: DietDetail = response.data;

      setDietMeta({ quantity: Number(diet.quantity) || 0, isPercentage: diet.type === 'P' });
      setDietProductUuid(diet.product?.uuid ?? null);
      setValue(
        'measurement_id',
        diet.measurement ? { label: diet.measurement.name, value: diet.measurement.uuid } : null
      );

      const rows: DietBeatItemForm[] = diet.ingredients.map((item) => ({
        product_label: item.product ? `${item.product.code} — ${item.product.description}` : '—',
        measurement_label: item.measurement?.name ?? '—',
        stock_id: null,
        dry_matter: Number(item.dry_matter) || 0,
        cost_value: Number(item.cost_value) || 0,
        quantity: 0,
        quantity_realized: 0,
        percentage: Number(item.quantity) || 0,
        difference: 0,
      }));
      replace(rows);
      setIngredientProductUuids(diet.ingredients.map((item) => item.product?.uuid ?? null));
    } catch {
      toaster.error({
        title: text.singularLabel,
        description: languageGB.common.errorLog.unknownError,
      });
    }
  }

  const dietBeatMutation = useRequest({
    asyncFunction: tryPersistDietBeat,
    entityName: text.singularLabel,
    queryKey: queryKey.dietBeats.dietBeats,
    queryKey2: queryKey.dietBeats.dietBeat,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistDietBeat(data: DietBeatFormType) {
    const itemsPayload: DietBeatItemPayload[] = data.items.map((item) => ({
      uuid: item.uuid,
      stock_uuid: item.stock_id!.value,
      dry_matter: Number(item.dry_matter),
      cost_value: Number(item.cost_value),
      quantity: Number(item.quantity),
      quantity_realized: Number(item.quantity_realized),
      percentage: Number(item.percentage),
      difference: Number(item.difference),
    }));

    const payload: DietBeatPayload = {
      diet_uuid: data.diet_id!.value,
      equipment_uuid: data.equipment_id!.value,
      measurement_uuid: data.measurement_id!.value,
      quantity: Number(data.quantity),
      date: data.date,
      items: itemsPayload,
    };

    if (isEditing && dietBeatId) {
      return await updateDietBeat(dietBeatId, payload);
    }
    return await createDietBeat(payload);
  }

  async function onSubmit(data: DietBeatFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }
    await dietBeatMutation.mutateAsync(data);
  }

  const isSubmitting = dietBeatMutation.isPending;

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
              disabled={isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
          <InputReadOnly
            name="code"
            label={header.code}
            value={isEditing ? (dietBeatDetail?.code ?? '—') : '—'}
            loading={!!isLoading}
          />

          <InputReadOnly
            label={header.responsible}
            value={isEditing ? (dietBeatDetail?.user?.name ?? '—') : (authUser?.username ?? '—')}
            loading={!!isLoading}
          />

          <Controller
            name="equipment_id"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={header.equipment}
                service={listEquipmentCatalogOptions}
                mapOptions={mapEquipmentOption}
                findParams={findParamsFromSearch}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
              />
            )}
          />

          {/* `diet_id` — readonly em EDIÇÃO (FD-DB-H-07, "mode_diff", decisão
              de UX do contrato — não uma restrição real do backend). */}
          <Controller
            name="diet_id"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={header.diet}
                service={listDietOptionsPaginated}
                mapOptions={mapDietOption}
                findParams={findParamsFromSearch}
                value={field.value ?? undefined}
                onChange={handleDietChange as any}
                error={error?.message}
                isRequired
                isDisabled={!canSave || isEditing}
              />
            )}
          />

          <Controller
            name="measurement_id"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={header.measurement}
                name={field.name}
                value={field.value ?? undefined}
                onChange={field.onChange}
                options={
                  measurementOptions.length > 0
                    ? measurementOptions
                    : field.value
                      ? [field.value]
                      : []
                }
                isDisabled={!canSave}
                error={error?.message}
                isRequired
              />
            )}
          />

          <Controller
            name="quantity"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <NumberInput
                name={field.name}
                label={header.quantity}
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

          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(value) => field.onChange(value ?? '')}
                label={header.date}
                error={errors.date?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />
        </SimpleGrid>

        <Box mt={6}>
          <DietBeatItemsEditor
            control={control}
            fields={fields}
            errors={errors}
            languageGB={languageGB}
            disabled={!canSave}
            headerQuantity={watchedHeaderQuantity}
            dietReferenceQuantity={dietMeta.quantity}
            isPercentageDiet={dietMeta.isPercentage}
            ingredientProductUuids={ingredientProductUuids}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
