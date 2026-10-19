// src/pages/Operacional/DiscountTable/CreateOrUpdateDiscountTable.tsx
// -----------------------------------------------------------------------------
// Formulário ÚNICO de criação/edição/visualização de Tabela de Desconto
// (DiscountTable — Operacional/Agricultura, F-032, TASK-DT-FE-03). Rotas
// `/operacional/discount-tables/create` (criar) e
// `/operacional/discount-tables/:id` (editar/visualizar) — conectadas em
// TASK-DT-FE-04, fora do escopo deste arquivo. Modo VIEW por flag
// (`!canSave` desabilita todos os campos, mirror EXATO
// `CreateOrUpdateFeedingPhase.tsx`/`CreateOrUpdateDiet.tsx` — sem rota
// dedicada de "show", contrato de tela §2 nota SURF-SHOW).
//
// ORDEM dos campos de cabeçalho (contrato de tela §4.1): `code` (readonly,
// server-gen, FORA do payload) → `name` (max 181) → `calculation_base`
// (Select GW/PD) → `is_active` (Select 1/0, ordem 1 antes de 0).
//
// `useFieldArray({ name: 'products' })` vive AQUI (formulário pai) —
// `DiscountTableProductCard` recebe `control`/`productIndex`/`remove` via
// props (mirror `FeedingPhaseItemsEditor`/`DietIngredientsEditor`).
//
// Update sempre envia o payload COMPLETO (a API reconcilia, TR-03) — SEM
// `code`, SEM uuid de regra. BR-03 NÃO migrado: só linhas explicitamente
// adicionadas (e validadas) entram no wire.
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { Box, Flex, SimpleGrid, Text, useDisclosure } from '@chakra-ui/react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { DISCOUNT_RULE_TYPES } from '@/constants/discount-table/discount-rule-type';
import {
  calculationBaseOptions,
  discountTableStatusOptions,
} from '@/constants/discount-table/options';
import { queryKey } from '@/constants/query-key';

import { discountTableSchemaResolver } from '@/validations/schemas/DiscountTables/discount-table-schema';

import {
  createDiscountTable,
  updateDiscountTable,
} from '@/services/v2/DiscountTables/discount-table-service';

import type {
  DiscountRulePayload,
  DiscountTableDetail,
  DiscountTableForm as DiscountTableFormType,
  DiscountTablePayload,
  DiscountTableProductForm,
  ProductOption,
} from '@/@types/v2/DiscountTables';

import { DiscountTableProductCard } from './DiscountTableProductCard';
import { ProductPickerModal } from './ProductPickerModal';
import { useDiscountTableForm } from './useDiscountTableForm';

// Buckets de regra vazios (BR-03 não migrado — nenhuma linha zerada
// automática, o produto novo nasce com as 6 abas SEM linhas).
function emptyRuleBuckets(): DiscountTableProductForm['rules'] {
  return {
    impureza: [],
    umidade: [],
    quebrado: [],
    esverdeado: [],
    avariado: [],
    taxa_recepcao: [],
  };
}

export default function CreateOrUpdateDiscountTable() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.discountTables.discountTable;

  // É edição quando existe um GUID válido na rota ("create" não é GUID) —
  // mirror `CreateOrUpdateFeedingPhase`/`CreateOrUpdateDiet`.
  const isEditing = isValidGuid(id);

  const canSave = isEditing ? can('discount-tables_edit') : can('discount-tables_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<DiscountTableFormType>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: discountTableSchemaResolver(languageGB),
    defaultValues: {
      name: '',
      calculation_base: calculationBaseOptions.getOption('GW', languageGB)!,
      is_active: discountTableStatusOptions.getOption(1, languageGB)!,
      products: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'products' });

  const { open: isPickerOpen, onOpen: onOpenPicker, onClose: onClosePicker } = useDisclosure();

  // Lei 2 — função NOMEADA com guarda de `dirtyFields` (nunca `reset` inline
  // em `useEffect`).
  function fillForm(data: DiscountTableDetail, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length > 0 && !resetForce) return;

    reset({
      name: data.name,
      calculation_base: calculationBaseOptions.getOption(data.calculation_base.value, languageGB)!,
      is_active: discountTableStatusOptions.getOption(data.is_active, languageGB)!,
      products: data.products.map((product) => {
        const rules = emptyRuleBuckets();
        product.rules.forEach((rule) => {
          rules[rule.type.value].push({
            initial_limit_percent: rule.initial_limit_percent,
            final_limit_percent: rule.final_limit_percent,
            discount_percent: rule.discount_percent,
          });
        });

        return {
          product_uuid: product.product.uuid,
          product_label: `${product.product.description} (${product.product.code})`,
          rules,
        };
      }),
    });
  }

  const discountTableQuery = useDiscountTableForm({
    registrationId: isEditing ? id : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([discountTableQuery as any]);
  const discountTableDetail = (discountTableQuery as any)?.data as DiscountTableDetail | undefined;

  const discountTableMutation = useRequest({
    asyncFunction: tryPersistDiscountTable,
    entityName: text.singularLabel,
    queryKey: queryKey.discountTables.discountTables,
    queryKey2: queryKey.discountTables.discountTable,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistDiscountTable(data: DiscountTableFormType) {
    // Achata os 6 buckets de cada produto num array PLANO de regras com
    // `type` (wire) — só linhas presentes no array (adicionadas
    // explicitamente e validadas pelo schema) são enviadas.
    const products = data.products.map((product) => {
      const rules: DiscountRulePayload[] = [];
      DISCOUNT_RULE_TYPES.forEach((type) => {
        (product.rules[type] ?? []).forEach((row) => {
          rules.push({
            type,
            initial_limit_percent: Number(row.initial_limit_percent),
            final_limit_percent: Number(row.final_limit_percent),
            discount_percent: Number(row.discount_percent),
          });
        });
      });

      return { product_uuid: product.product_uuid, rules };
    });

    // Update sempre envia o payload COMPLETO (a API reconcilia, TR-03) —
    // SEM `code`, SEM uuid de regra.
    const payload: DiscountTablePayload = {
      name: data.name,
      calculation_base: data.calculation_base.value,
      is_active: data.is_active.value,
      products,
    };

    if (isEditing && id) {
      return await updateDiscountTable(id, payload);
    }
    return await createDiscountTable(payload);
  }

  // Guard EXPLÍCITO (`Object.keys(dirtyFields).length === 0`), mirror
  // `CreateOrUpdateFeedingPhase`/`CreateOrUpdateDiet`.
  async function onSubmit(data: DiscountTableFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }
    await discountTableMutation.mutateAsync(data);
  }

  function handleSelectProduct(product: ProductOption) {
    append({
      product_uuid: product.uuid,
      product_label: `${product.description} (${product.code})`,
      rules: emptyRuleBuckets(),
    });
  }

  const isSubmittingForm = isSubmitting || discountTableMutation.isPending;
  const arrayError = (errors as any)?.products?.message as string | undefined;

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
              loading={isSubmittingForm}
              disabled={isSubmittingForm || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* Cabeçalho, ORDEM FIEL ao contrato de tela §4.1: code (readonly)
            → name → calculation_base → is_active. */}
        <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
          <InputReadOnly
            name="code"
            label={text.form.fields.code}
            value={isEditing ? (discountTableDetail?.code ?? '—') : '—'}
            loading={isLoading}
          />

          <Input
            label={text.form.fields.name}
            maxLength={181}
            placeholder={text.form.fields.namePlaceholder}
            {...register('name')}
            error={errors.name?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="calculation_base"
            control={control}
            render={({ field }) => (
              <Select
                label={text.form.fields.calculationBase}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={calculationBaseOptions.options(languageGB)}
                isDisabled={!canSave}
                isRequired
                noClearable
                loading={isLoading}
                error={errors.calculation_base?.message as string | undefined}
              />
            )}
          />

          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <Select
                label={text.form.fields.status}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={discountTableStatusOptions.options(languageGB)}
                isDisabled={!canSave}
                isRequired
                noClearable
                loading={isLoading}
                error={errors.is_active?.message as string | undefined}
              />
            )}
          />
        </SimpleGrid>

        {/* Subcadastro Produtos (`useFieldArray` vive AQUI, no pai). */}
        <Box mt={6}>
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="sm" fontWeight="semibold">
              {text.form.products.title}
            </Text>
            <Button
              title={text.form.products.addProduct}
              icon={FiPlus as ElementType}
              variant="outline"
              size="sm"
              onClick={onOpenPicker}
              disabled={!canSave}
            />
          </Flex>

          {arrayError && fields.length === 0 && (
            <Text fontSize="sm" color="fg.error" mb={3}>
              {arrayError}
            </Text>
          )}

          {fields.length === 0 ? (
            <Box py={2}>
              <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
                {text.form.products.emptyState}
              </Text>
            </Box>
          ) : (
            <Flex direction="column" gap={4}>
              {fields.map((field, index) => (
                <DiscountTableProductCard
                  key={field.id}
                  control={control}
                  productIndex={index}
                  remove={remove}
                  errors={errors}
                  languageGB={languageGB}
                  disabled={!canSave}
                />
              ))}
            </Flex>
          )}
        </Box>
      </Form>

      <ProductPickerModal
        isOpen={isPickerOpen}
        onClose={onClosePicker}
        onSelect={handleSelectProduct}
        alreadyAddedUuids={fields.map((field) => field.product_uuid)}
        languageGB={languageGB}
      />
    </FormContainer>
  );
}
