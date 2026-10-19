// src/pages/CadastrosBase/CategoriasProduto/CreateOrUpdateCategoriaProduto.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de CATEGORIA DE PRODUTO (mesmo arquivo para os
// dois casos, TASK-CP-FE-02). Rotas: /cadastros-base/produtos/categorias/novo
// (criar) e /cadastros-base/produtos/categorias/:categoryProductId (editar,
// GUID) — ambas registradas em src/router/index.tsx, guardadas por
// `categoryproducts_view` (DEC-006, legado).
//
// Estrutura é a INTERSEÇÃO de CausaMortePerda/CreateOrUpdateCausaMortePerda.tsx
// (1 SelectAsyncPaginate obrigatório + 1 Select estático, payload sempre
// completo, guard GUID) e PlanAccount/CreateOrUpdatePlanAccount.tsx (2º
// SelectAsyncPaginate OPCIONAL com `mapOptions` combinando `code`+`description`).
//
// GUARD vs. PAYLOAD no `onSubmit` (armadilha #3 do checklist — não confundir
// os dois): o GUARD que decide SE dispara o update usa a forma EXPLÍCITA
// `Object.keys(dirtyFields).length === 0` — NUNCA `isEmpty(dirtyFields)`/
// `!isEmpty(dirtyFields)` (a função `src/utils/isEmpty.ts` é MAL NOMEADA:
// retorna `true` quando o objeto NÃO está vazio — a dupla inversão `!` + nome
// invertido é a armadilha mais fácil de errar silenciosamente). Decisão
// deliberada desta Tarefa, divergindo do padrão antigo usado em
// GruposProduto/Racas/CausaMortePerda — ver TASK-CP-FE-02, seção "Guard vs.
// Payload".
//
// `CategoryProductRequest::rules()` é UNIFICADO para store/update — payload
// SEMPRE completo, nunca um delta de `dirtyFields`.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import {
  createCategoryProduct,
  updateCategoryProduct,
} from '@/services/v2/CategoryProducts/category-product-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { listProductGroupOptions } from '@/services/v2/ProductGroups/product-group-service';

import type { Option } from '@/@types/option';
import type {
  CategoryProductDetail,
  CategoryProductForm as CategoryProductFormType,
  CategoryProductPayload,
  CategoryProductTypeCode,
  CategoryProductTypeValue,
} from '@/@types/v2/CategoryProducts/category-product';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { ProductGroupOption } from '@/@types/v2/ProductGroups/product-group';

import { categoryProductSchemaResolver } from './category-product-schema';
import { useCategoryProductForm } from './useCategoryProducts';

export default function CreateOrUpdateCategoriaProduto() {
  const { categoryProductId } = useParams<{ categoryProductId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:categoryProductId` — é uma rota irmã distinta registrada em
  // router/index.tsx).
  const isEditing = isValidGuid(categoryProductId);

  // Guard de navegação: um `categoryProductId` presente mas que NÃO é um GUID
  // válido (ex.: URL adulterada manualmente) não deve chegar ao hook de query
  // nem renderizar um form "fantasma" — redireciona para a listagem, mesmo
  // racional de CreateOrUpdateGrupoProduto.tsx/CreateOrUpdateCausaMortePerda.tsx.
  useEffect(() => {
    if (categoryProductId && !isValidGuid(categoryProductId)) {
      navigate('/cadastros-base/produtos/categorias', { replace: true });
    }
  }, [categoryProductId, navigate]);

  const text = languageGB.categoryProducts.categoryProduct;

  const enabledOptions: Option<string>[] = [
    { value: 'true', label: text.form.isEnabledOptions.active },
    { value: 'false', label: text.form.isEnabledOptions.inactive },
  ];

  // TASK-CP-FE-FIX-02 — bug de homologação: criar Categoria de Produto
  // retornava 422 "The selected type is invalid". Causa-raiz:
  // `App\Enums\CategoryProductType` é `int`-backed (INPUT=1/EQUIPMENT=2/
  // PRODUCTION=3) e `CategoryProductRequest::rules()` valida `type` no
  // POST/PUT com `Rule::enum(...)`, que para um enum `int`-backed exige o
  // valor INTEIRO — o Select enviava o NOME ("INPUT") no payload. O GET
  // (`CategoryProductResource`) devolve o nome (`type->name`), não o código
  // — por isso o mapa abaixo converte nome → código só para re-hidratar o
  // Select na edição; o payload de escrita usa o código diretamente (o
  // `value` da option já é o código, `CategoryProductTypeCode`).
  const CATEGORY_PRODUCT_TYPE_CODE: Record<CategoryProductTypeValue, CategoryProductTypeCode> = {
    INPUT: 1,
    EQUIPMENT: 2,
    PRODUCTION: 3,
  };

  const typeOptions: Option<CategoryProductTypeCode>[] = [
    { value: CATEGORY_PRODUCT_TYPE_CODE.INPUT, label: text.form.fields.typeOptions.input },
    { value: CATEGORY_PRODUCT_TYPE_CODE.EQUIPMENT, label: text.form.fields.typeOptions.equipment },
    {
      value: CATEGORY_PRODUCT_TYPE_CODE.PRODUCTION,
      label: text.form.fields.typeOptions.production,
    },
  ];

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<CategoryProductFormType>({
    mode: 'onChange',
    resolver: categoryProductSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      is_enabled: { value: 'true', label: text.form.isEnabledOptions.active },
      type: null,
      group_uuid: null,
      financial_category_uuid: null,
    },
  });

  // Reconstrução dos 2 Selects assíncronos a partir do Resource (uuid + label
  // juntos, sem novo fetch) — mesmo padrão de `fillAgreementForm`/`fillForm` de
  // PlanAccount/CausaMortePerda.
  function fillForm(data: CategoryProductDetail, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length === 0 || resetForce) {
      reset({
        description: data.description,
        is_enabled: enabledOptions.find((o) => o.value === String(data.is_enabled)) ?? null,
        // `data.type` vem do GET como NOME ("INPUT"/"EQUIPMENT"/"PRODUCTION")
        // — converte para o CÓDIGO inteiro antes de casar com `typeOptions`
        // (cujo `value` já é o código, ver mapa `CATEGORY_PRODUCT_TYPE_CODE`).
        type: typeOptions.find((o) => o.value === CATEGORY_PRODUCT_TYPE_CODE[data.type]) ?? null,
        group_uuid: { label: data.group.description, value: data.group.uuid },
        financial_category_uuid: data.financial_category
          ? {
              label: `${data.financial_category.code} — ${data.financial_category.description}`,
              value: data.financial_category.uuid,
            }
          : null,
      });
    }
  }

  const categoryProductQuery = useCategoryProductForm({
    registrationId: isEditing ? categoryProductId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([categoryProductQuery as any]);

  // Sem flags de autorização por item no `CategoryProductResource` —
  // permissão GLOBAL basta (DEC-006, mesmo padrão de GruposProduto/Racas).
  const canSave = isEditing ? can('categoryproducts_edit') : can('categoryproducts_create');

  const categoryProductMutation = useRequest({
    asyncFunction: tryPersistCategoryProduct,
    entityName: text.singularLabel,
    queryKey: queryKey.categoryProducts.list,
    queryKey2: queryKey.categoryProducts.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Payload: SEMPRE completo, nunca só o delta de `dirtyFields` (ver cabeçalho).
  async function tryPersistCategoryProduct(data: CategoryProductFormType) {
    const payload: CategoryProductPayload = {
      description: data.description.trim(),
      is_enabled: data.is_enabled?.value === 'true',
      // Já é o CÓDIGO inteiro (1/2/3) — `value` da option vem de
      // `CATEGORY_PRODUCT_TYPE_CODE` (ver `typeOptions` acima). Enviar o
      // nome ("INPUT") aqui é exatamente o bug corrigido em TASK-CP-FE-FIX-02.
      type: data.type!.value,
      group_uuid: data.group_uuid!.value,
      financial_category_uuid: data.financial_category_uuid?.value ?? null,
    };

    if (isEditing && categoryProductId) {
      return await updateCategoryProduct(categoryProductId, payload);
    }
    return await createCategoryProduct(payload);
  }

  // Guard (DECIDE SE dispara a chamada de update): forma EXPLÍCITA
  // `Object.keys(dirtyFields).length` — PROIBIDO `isEmpty(dirtyFields)`/
  // `!isEmpty(dirtyFields)` nesta Tarefa (ver cabeçalho do arquivo).
  async function onSubmit(data: CategoryProductFormType) {
    const hasChanges = Object.keys(dirtyFields).length > 0;

    if (isEditing && !hasChanges) {
      navigate(-1); // nada mudou, não chama a API
      return;
    }

    await categoryProductMutation.mutateAsync(data); // cria OU atualiza, payload sempre completo
  }

  const isSubmitting = categoryProductMutation.isPending;

  const watchedDescription = watch('description');
  const descriptionLength = (watchedDescription ?? '').length;

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
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Input
            label={text.form.fields.description}
            placeholder={text.form.placeholders.description}
            helperText={errors.description?.message ? undefined : `${descriptionLength}/100`}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.type}
                name={name}
                value={value}
                onChange={onChange}
                options={typeOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.isEnabled}
                name={name}
                value={value}
                onChange={onChange}
                options={enabledOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />
        </SimpleGrid>

        {/* Grupo de Produto — SelectAsyncPaginate OBRIGATÓRIO. TASK-FE-973
            repontou de `listProductGroups` (CRUD gateado) para
            `listProductGroupOptions` (`/product-groups/options`, SEM gate de
            `product-groups_view`) — sem filtro de ativos, igual antes
            (DA-CP-07). `mapOptions` usa `item.label` (Resource dedicado),
            não `item.description` (shape do CRUD). */}
        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <Controller
            name="group_uuid"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.group}
                placeholder={text.form.placeholders.group}
                error={errors.group_uuid?.message as string | undefined}
                service={listProductGroupOptions}
                mapOptions={(item: ProductGroupOption) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                // Armadilha #10 do checklist: `?? null` NUNCA `?? undefined`.
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isDisabled={!canSave}
                // Armadilha #7 — portalizado por padrão (mesmo fix
                // TASK-BREED-FORM-SELECT-PORTAL de CreateOrUpdateCausaMortePerda.tsx).
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          {/* Categoria Financeira — SelectAsyncPaginate OBRIGATÓRIO (fidelidade
              ao legado: Admin/CategoryProductController::rules() exige
              `financial_category_id`), reaproveita `listFinancialCategoryOptions`,
              label `code — description` (mesmo padrão de `mapOptions` de
              PlanAccount/CreateOrUpdatePlanAccount.tsx). */}
          <Controller
            name="financial_category_uuid"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                isRequired
                label={text.form.fields.financialCategory}
                placeholder={text.form.placeholders.financialCategory}
                error={errors.financial_category_uuid?.message as string | undefined}
                // TASK-FE-979 (GAP-FE-181 resolvido por TASK-BE-612) —
                // repontado de `listFinancialCategories` (CRUD, gateado por
                // `financialcategories_view`) para `listFinancialCategoryOptions`
                // (`/financial-categories/options`, SEM gate), que passou a
                // aceitar `type_id`/`class` (mesmos nomes do índice). Shape
                // idêntico (`FinancialCategoryOption {uuid,code,description}`,
                // mesmos 3 campos de `FinancialCategoryListItem`).
                service={listFinancialCategoryOptions}
                mapOptions={(item: FinancialCategoryOption) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
                // TASK-CP-FE-FIX-03 — bug de homologação: o Select trazia o
                // conjunto ERRADO de Categorias Financeiras (faltava replicar
                // o filtro do legado). Confirmado em banco real:
                // `type_id: 1` = CategoryType "Saídas", `class: 2` = analíticas
                // — só essas devem aparecer para vínculo com Categoria de
                // Produto (lista correta começa em
                // "2.01.001.0001 - Energia Elétrica Administração"). Sem isso
                // o Select listava TODAS as Categorias Financeiras (entradas,
                // sintéticas, etc.), divergindo do legado. PRESERVADO 1:1 no
                // repontamento da TASK-FE-979 — os 2 parâmetros continuam
                // sendo enviados, agora suportados pelo `/options`
                // (`TASK-BE-612`).
                // `global: 'true'` (backend TASK-CP-GLOBAL) — recorta só as
                // categorias GLOBAIS (tenant_id IS NULL), fechando o mirror do
                // legado (whereNull('tenant_id') + class=2 + type_id=1). Sem
                // isso o /options somava categorias de tenant que o store
                // rejeitava com 404 "Recurso não encontrado".
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  type_id: 1,
                  class: 2,
                  global: 'true',
                })}
                // Armadilha #10 do checklist: `?? null` NUNCA `?? undefined` —
                // ao editar uma Categoria com `financial_category: null` e o
                // usuário limpar o campo, o Select só reflete o clear se o
                // `value` computado for `null` (comentário
                // TASK-BREED-FILTER-CLEAR-FIX em SelectAsyncPaginate.tsx).
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={!canSave}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
