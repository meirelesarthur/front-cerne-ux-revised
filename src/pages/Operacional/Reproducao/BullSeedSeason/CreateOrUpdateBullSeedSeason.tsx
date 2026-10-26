// src/pages/Operacional/Reproducao/BullSeedSeason/CreateOrUpdateBullSeedSeason.tsx
// -----------------------------------------------------------------------------
// Formulário ÚNICO de criação/edição de Touros/Sêmen/Embrião — Operacional /
// Reprodução (Tarefa 25, contrato de tela §5). Rotas
// `/operacional/touros-semen-embriao/novo` e
// `/operacional/touros-semen-embriao/:bullSeedSeasonUuid/editar`, guardadas
// por `bull-seed-season_create`/`_edit`.
//
// Esqueleto geral mirror `EstacaoDeMonta/CreateOrUpdateEstacaoDeMonta.tsx`
// (`isEditing = isValidGuid(id)`, guard de navegação para uuid malformado,
// `useCustomFormQueryByGuid`, `fillForm` nomeada com guarda
// `!isEmpty(dirtyFields) || resetForce`, `useUnsavedChangesGuard` +
// `DeleteConfirmDialog`) + bloco de código sugerido mirror
// `CreateFarmTransfer.tsx`/`CreateOrUpdateEstacaoDeMonta.tsx` (`InputReadOnly`
// + `useQuery` sobre `next-code`, só em criação).
//
// Os 2 subcadastros dinâmicos (`AnimalsFieldArray`/`ProductsFieldArray`) são
// componentes PRÓPRIOS que recebem `control`/`fields`/`append`/`remove` do
// `useFieldArray` que vive AQUI (mirror `CreateRequisition.tsx` +
// `RequisitionItemsEditor.tsx`). `animal-options`/`warehouse-options`/
// `breeding-season-options` são resolvidos AQUI (1 chamada compartilhada
// cada, contrato §5.2) e repassados por prop — nenhum dos 2 repetidores
// refaz essas 3 chamadas por linha.
//
// TODOS os 6 lookups desta tela são `Select`+`useQuery` — ZERO
// `SelectAsyncPaginate` (armadilha 1, nenhum dos 6 endpoints pagina).
//
// `animals[]`/`products[]` SEM `.min(1)` no schema (`GAP-BSS-06`, mirror
// exato) — a tela aceita salvar sem nenhum vínculo, paridade com o legado.
// Em EDIÇÃO, o `PUT` substitui os 2 arrays por COMPLETO no servidor
// (`sync()`, mirror `CL-11`) — o formulário sempre envia o array INTEIRO
// desejado, nunca um delta (armadilha 10).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { bullSeedSeasonSchemaResolver } from '@/validations/schemas/BullSeedSeason/bull-seed-season-schema';

import {
  createBullSeedSeason,
  getBullSeedSeason,
  getBullSeedSeasonNextCode,
  listAnimalOptions,
  listBreedingSeasonOptions,
  listWarehouseOptions,
  updateBullSeedSeason,
} from '@/services/v2/BullSeedSeason/bull-seed-season-service';

import type { Option } from '@/@types/option';
import type {
  AnimalOption,
  BreedingSeasonOption,
  BullSeedSeasonDetail,
  BullSeedSeasonForm as BullSeedSeasonFormType,
  BullSeedSeasonUpsertPayload,
  WarehouseOption,
} from '@/@types/v2/BullSeedSeason';

import { AnimalsFieldArray } from './AnimalsFieldArray';
import { ProductsFieldArray } from './ProductsFieldArray';

import type { AnimalsFieldValues } from './AnimalsFieldArray';
import type { ProductsFieldValues } from './ProductsFieldArray';
import type { UseFieldArrayAppend } from 'react-hook-form';

const BULL_SEED_SEASON_LIST_ROUTE = '/operacional/touros-semen-embriao';

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function mapAnimalOption(item: AnimalOption): Option<string> {
  return { label: item.identification, value: item.uuid };
}

function mapWarehouseOption(item: WarehouseOption): Option<string> {
  return { label: item.description, value: item.uuid };
}

function mapBreedingSeasonOption(item: BreedingSeasonOption): Option<string> {
  return { label: item.description, value: item.uuid };
}

// 422 do servidor mapeado por campo (contrato de tela §5.5) — traduz o path
// do servidor (`animals.0`, `products.0.product_uuid`, ...) para o path do
// formulário (`animals.0.animal`, `products.0.product`, ...).
function mapServerFieldToFormField(field: string): string | null {
  if (field === 'code' || field === 'date' || field === 'description') return field;
  if (field === 'breeding_season_uuid') return 'breeding_season';

  const animalMatch = field.match(/^animals\.(\d+)$/);
  if (animalMatch) return `animals.${animalMatch[1]}.animal`;

  const productMatch = field.match(/^products\.(\d+)\.(warehouse_uuid|product_uuid|quantity)$/);
  if (productMatch) {
    const [, index, suffix] = productMatch;
    const subField =
      suffix === 'warehouse_uuid'
        ? 'warehouse'
        : suffix === 'product_uuid'
          ? 'product'
          : 'quantity';
    return `products.${index}.${subField}`;
  }

  return null;
}

export default function CreateOrUpdateBullSeedSeason() {
  const { bullSeedSeasonUuid } = useParams<{ bullSeedSeasonUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.bullSeedSeason.bullSeedSeason;
  const formText = text.form;

  // Guard de navegação: `bullSeedSeasonUuid` presente mas NÃO é um GUID
  // válido (URL adulterada) — redireciona para a listagem ANTES de
  // renderizar o form (mirror `CreateOrUpdateEstacaoDeMonta.tsx`).
  const hasMalformedRouteParam =
    bullSeedSeasonUuid !== undefined && !isValidGuid(bullSeedSeasonUuid);

  useEffect(() => {
    if (hasMalformedRouteParam) {
      navigate(BULL_SEED_SEASON_LIST_ROUTE, { replace: true });
    }
  }, [hasMalformedRouteParam, navigate]);

  const isEditing = isValidGuid(bullSeedSeasonUuid);
  const canSave = isEditing ? can('bull-seed-season_edit') : can('bull-seed-season_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<BullSeedSeasonFormType>({
    mode: 'onChange',
    resolver: bullSeedSeasonSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      date: todayIsoDate(),
      description: '',
      breeding_season: null,
      animals: [],
      products: [],
    },
  });

  const animalsFieldArray = useFieldArray({ control, name: 'animals' });
  const productsFieldArray = useFieldArray({ control, name: 'products' });

  // ---- Guarda de saída sem salvar --------------------------------------
  const hasUnsavedChanges = !isEmpty(dirtyFields);
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);

  // ---- Código sugerido (SÓ em modo criação, `GET .../next-code`) --------
  const nextCodeQuery = useQuery({
    queryKey: [queryKey.bullSeedSeason.bullSeedSeason, 'next-code'],
    queryFn: getBullSeedSeasonNextCode,
    enabled: !isEditing,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isEditing && nextCodeQuery.data?.data?.code) {
      setValue('code', nextCodeQuery.data.data.code, { shouldDirty: false });
    }
  }, [isEditing, nextCodeQuery.data]);

  // ---- 3 lookups PLANOS resolvidos aqui (1 chamada compartilhada cada) --
  const breedingSeasonOptionsQuery = useQuery({
    queryKey: [queryKey.bullSeedSeason.bullSeedSeason, 'breeding-season-options'],
    queryFn: listBreedingSeasonOptions,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const breedingSeasonOptions = (breedingSeasonOptionsQuery.data ?? []).map(
    mapBreedingSeasonOption
  );

  // 1 única chamada compartilhada por TODAS as linhas do repetidor de
  // animais (contrato §5.2) — nunca refeita por linha.
  const animalOptionsQuery = useQuery({
    queryKey: [queryKey.bullSeedSeason.bullSeedSeason, 'animal-options'],
    queryFn: listAnimalOptions,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const animalOptions = (animalOptionsQuery.data ?? []).map(mapAnimalOption);

  // Compartilhado entre todas as linhas do repetidor de produtos.
  const warehouseOptionsQuery = useQuery({
    queryKey: [queryKey.bullSeedSeason.bullSeedSeason, 'warehouse-options'],
    queryFn: listWarehouseOptions,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const warehouseOptions = (warehouseOptionsQuery.data ?? []).map(mapWarehouseOption);

  // ---- Guarda EXPLÍCITA `!isEmpty(dirtyFields) || resetForce` (Lei 2) ----
  // Hidrata os 2 repetidores com TODAS as linhas existentes (armadilha 10) —
  // `animals`/`products` do detalhe (uuids) convertidos para o shape do
  // repetidor (`{ animal: Option }[]`/`{ warehouse: Option|null, product:
  // Option, quantity: number }[]`).
  function fillForm(data: BullSeedSeasonDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) && !resetForce) return;

    reset({
      code: data.code,
      date: data.date,
      description: data.description,
      breeding_season: {
        label: data.breeding_season.description,
        value: data.breeding_season.uuid,
      },
      animals: (data.animals ?? []).map((animal) => ({
        animal: { label: animal.identification, value: animal.uuid },
      })),
      products: (data.products ?? []).map((product) => ({
        warehouse: product.warehouse
          ? { label: product.warehouse.description, value: product.warehouse.uuid }
          : null,
        product: { label: product.description, value: product.uuid },
        quantity: product.quantity,
      })),
    });
  }

  const bullSeedSeasonQuery = useCustomFormQueryByGuid<BullSeedSeasonDetail>({
    registrationId: isEditing ? bullSeedSeasonUuid : undefined,
    queryKey: queryKey.bullSeedSeason.bullSeedSeason,
    asyncFunction: getBullSeedSeason,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([bullSeedSeasonQuery as any]);

  const bullSeedSeasonMutation = useRequest({
    asyncFunction: tryPersistBullSeedSeason,
    entityName: text.singularLabel,
    queryKey: queryKey.bullSeedSeason.bullSeedSeasonsList,
    queryKey2: queryKey.bullSeedSeason.bullSeedSeason,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(BULL_SEED_SEASON_LIST_ROUTE);
    },
  });

  async function tryPersistBullSeedSeason(data: BullSeedSeasonFormType) {
    // Payload NUNCA contém farm_id/user_id/employee_id (contrato de tela
    // §5.4/§8). `animals` é array de uuids PUROS (armadilha 9).
    const payload: BullSeedSeasonUpsertPayload = {
      code: data.code,
      date: data.date,
      description: data.description,
      breeding_season_uuid: data.breeding_season!.value,
      animals: data.animals.map((item) => item.animal!.value),
      products: data.products.map((item) => ({
        warehouse_uuid: item.warehouse?.value ?? null,
        product_uuid: item.product!.value,
        quantity: Number(item.quantity),
      })),
    };

    try {
      return isEditing && bullSeedSeasonUuid
        ? await updateBullSeedSeason(bullSeedSeasonUuid, payload)
        : await createBullSeedSeason(payload);
    } catch (error) {
      // 422 do backend mapeado por campo (contrato de tela §5.5).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          const mappedField = mapServerFieldToFormField(field);
          if (mappedField && messages?.[0]) {
            setError(mappedField as keyof BullSeedSeasonFormType, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
      throw error;
    }
  }

  // Guarda `isEditing && !isEmpty(dirtyFields)` (Lei 2, mirror EXATO
  // `CreateOrUpdateEstagioReprodutivo.tsx`/`useProductFormController.ts`) —
  // `isEmpty()` deste projeto retorna `true` quando o objeto TEM alguma
  // chave própria (nome invertido do utilitário, `src/utils/isEmpty.ts`),
  // então o guard de "nada mudou → só navega" precisa da negação `!`. Sem
  // ela, `isEmpty(dirtyFields)` era `true` sempre que HAVIA alteração —
  // fazendo o Salvar navegar de volta sem chamar a API em QUALQUER edição
  // (campo simples ou subcadastro). Bug real reportado em teste manual.
  async function onSubmit(data: BullSeedSeasonFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
      return;
    }
    await bullSeedSeasonMutation.mutateAsync(data);
  }

  const isSubmitting = bullSeedSeasonMutation.isPending;

  if (hasMalformedRouteParam) {
    return null;
  }

  return (
    <>
      <FormContainer
        title={isEditing ? formText.title.edit : formText.title.create}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings?.cancel || 'Cancelar'}
              variant="secondary"
              type="button"
              onClick={() => guardedNavigate(-1)}
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
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <InputReadOnly
              name="code"
              label={formText.fields.code}
              value={nextCodeQuery.data?.data?.code || ''}
              loading={!isEditing && nextCodeQuery.isLoading}
            />

            <Controller
              name="date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Field label={formText.fields.date} errorText={errors.date?.message} isRequired>
                  <DateInput
                    value={value ?? null}
                    onChange={onChange}
                    disabled={!canSave || !!isLoading}
                  />
                </Field>
              )}
            />

            <Input
              label={formText.fields.description}
              {...register('description')}
              error={errors.description?.message}
              isRequired
              loading={!!isLoading}
              disabled={!canSave}
            />

            <Controller
              name="breeding_season"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Select
                  name={field.name}
                  label={formText.fields.breedingSeason}
                  options={breedingSeasonOptions}
                  value={field.value ?? null}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  error={error?.message}
                  loading={breedingSeasonOptionsQuery.isLoading}
                  isRequired
                  isDisabled={!canSave}
                />
              )}
            />
          </SimpleGrid>

          <Box mt={6}>
            <AnimalsFieldArray
              control={control}
              fields={animalsFieldArray.fields}
              append={
                animalsFieldArray.append as unknown as UseFieldArrayAppend<
                  AnimalsFieldValues,
                  'animals'
                >
              }
              remove={animalsFieldArray.remove}
              animalOptions={animalOptions}
              animalOptionsLoading={animalOptionsQuery.isLoading}
              languageGB={languageGB}
              disabled={!canSave}
            />
          </Box>

          <Box mt={6}>
            <ProductsFieldArray
              control={control}
              fields={productsFieldArray.fields}
              append={
                productsFieldArray.append as unknown as UseFieldArrayAppend<
                  ProductsFieldValues,
                  'products'
                >
              }
              remove={productsFieldArray.remove}
              errors={errors}
              warehouseOptions={warehouseOptions}
              warehouseOptionsLoading={warehouseOptionsQuery.isLoading}
              languageGB={languageGB}
              disabled={!canSave}
            />
          </Box>
        </Form>
      </FormContainer>

      <DeleteConfirmDialog
        isOpen={isConfirmOpen}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        tone="warning"
        colorPalette="orange"
        title={formText.unsavedChangesDialog.title}
        description={formText.unsavedChangesDialog.description}
        confirmButtonText={formText.unsavedChangesDialog.confirmButton}
        hideQuestionMark
        warningText=""
      />
    </>
  );
}
