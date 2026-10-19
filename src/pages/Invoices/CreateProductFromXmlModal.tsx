// src/pages/Invoices/CreateProductFromXmlModal.tsx
// -----------------------------------------------------------------------------
// Modal "Criar Produto a partir do XML" — TASK-FE-668 (DF-25, rework,
// execução 034, 4ª leva). Substitui o antigo botão "+" que abria o cadastro
// completo de Produto em NOVA ABA (`InvoiceItemsTab.tsx::
// handleCreateProductFromXml`, `window.open('/cadastros-base/produtos/
// novo?...')`) por um Dialog v3 DENTRO da própria tela de Invoice,
// pré-preenchido a partir do item de XML não casado (`product_matched===
// false`); ao salvar, o Produto criado volta selecionado no item do
// Invoice, sem navegação.
//
// DECISÃO DE IMPLEMENTAÇÃO (Fase 1 do task-packet, "decisão do Executor,
// documentar a escolha") — DUPLICAÇÃO, não extração: os campos deste Modal
// são um SUBCONJUNTO (sem a Aba 3 "Fiscal", ~40 campos, explicitamente fora
// de escopo per pedido do dono) do formulário completo de Produto
// (`CreateOrUpdateProduto.tsx`/`ProdutoEstoqueFinanceiroTab.tsx`). Em vez de
// extrair um componente de FORM BODY compartilhado (que exigiria refatorar
// a tela CRUD já em produção, fora do task-packet desta Tarefa — risco não
// justificado por este escopo), este Modal REAPROVEITA a ÚNICA fonte de
// verdade que importa para não divergir de regra de negócio — o schema Yup
// (`productSchemaResolver`/`isProductionGroup`, `product-schema.ts`) e os
// tipos (`ProductForm`/`ProductPayload`) — e DUPLICA só o JSX do
// subconjunto de campos + o payload builder (mirror `tryPersistProduto::
// tryPersistProduct`, adaptado). Os ~40 campos Fiscais (TODOS opcionais no
// schema real, confirmado em `product-schema.ts` — "ZERO regra de negócio
// nova", nenhum `required` condicional a `is_fiscal`) recebem os MESMOS
// defaults neutros de `CreateOrUpdateProduto.tsx` e nunca aparecem na UI
// deste Modal — o Produto criado aqui é 100% equivalente a criar pela tela
// cheia sem tocar a Aba 3.
//
// Prefill a partir do item de XML (`InvoiceXmlDraftItem`, via
// `InvoiceItemForm.xml_description`/`xml_ncm`/`xml_um` + `amount` do
// próprio item — já setados por `handleXmlImported`/`CreateOrUpdateInvoice.
// tsx`):
// - `description` ← `descriptionHint` (`xml_description`).
// - `ncm_uuid` ← resolvido por BUSCA EXATA por `code` no catálogo real
//   (`listNcmOptions({ search: ncmHint.code })`, mesmo endpoint do Select) —
//   `GAP-BE-660` (✅ CONCLUÍDO): o endpoint de Produto aceita `ncm_uuid`
//   (string uuid, mesmo valor de `NcmOptionResource.uuid`); resolvido por
//   CÓDIGO EXATO contra o catálogo, nunca fuzzy (mesma disciplina de
//   `findTypeTitleNfeOption`/`CreateOrUpdateInvoice.tsx`). Sem match: fica
//   `null` (usuário escolhe).
// - `measurement_uuid` (1ª Un. Medida) ← `suggestMeasurementOption`
//   (`@/utils/measurement-suggestion.ts`, EXTRAÍDO de
//   `CreateOrUpdateInvoice.tsx` para ser reaproveitado aqui SEM duplicar a
//   heurística) contra `measurementUmHint` (`xml_um`).
// - `las_price` (Vl Referência) ← `referencePriceHint` (`item.amount`, já o
//   Vl.Unit do XML).
// - `is_enabled` (Ativo) ← `true` fixo.
// -----------------------------------------------------------------------------

import { useEffect, useRef } from 'react';

import { Dialog, Portal, SimpleGrid, Text } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { SelectCultivation } from '@/components/Form/SelectCultivation';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { suggestMeasurementOption } from '@/utils/measurement-suggestion';

import { productFactorTypeOptions } from '@/constants/cadastrosBase/product/product-factor-type-options';
import { columnsForm } from '@/constants/coluns-form';

import {
  isProductionGroup,
  productSchemaResolver,
} from '@/validations/schemas/CadastrosBase/product-schema';

import { listCategoryProductOptions } from '@/services/v2/CategoryProducts/category-product-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { listKindOptions } from '@/services/v2/Kinds/kind-service';
import { listMeasurementOptions } from '@/services/v2/Measurements/measurement-service';
import { listNcmOptions } from '@/services/v2/Ncms/ncm-service';
import { listProductGroupOptions } from '@/services/v2/ProductGroups/product-group-service';
import { createProduct } from '@/services/v2/Products/product-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { CategoryProductOption } from '@/@types/v2/CategoryProducts';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { InvoiceXmlDraftItemNcm } from '@/@types/v2/Invoices';
import type { KindOption } from '@/@types/v2/Kinds';
import type { MeasurementOption } from '@/@types/v2/Measurements';
import type { NcmOption } from '@/@types/v2/Ncms';
import type { ProductGroupOption } from '@/@types/v2/ProductGroups/product-group';
import type { ProductForm as ProductFormType, ProductPayload } from '@/@types/v2/Products';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

// Mirror LOCAL de `CreateOrUpdateProduto.tsx::FLAT_CATALOG_PAGE_SIZE` — não
// importado do outro arquivo (decisão de duplicação registrada no cabeçalho
// deste arquivo, não acopla os 2 componentes por uma constante trivial).
const FLAT_CATALOG_PAGE_SIZE = 200;

export interface CreateProductFromXmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** `InvoiceItemForm.xml_description` da linha (descrição crua do XML). */
  descriptionHint: string;
  /** `InvoiceItemForm.xml_ncm` da linha — `null` quando o NCM não casou no
   *  banco (backend já fez o match; o Front NUNCA refaz). */
  ncmHint: InvoiceXmlDraftItemNcm | null;
  /** `InvoiceItemForm.xml_um` da linha (texto crú da unidade do XML). */
  measurementUmHint: string | null;
  /** `InvoiceItemForm.amount` da linha (Vl.Unit do XML) — prefill de "Vl
   *  Referência" (`las_price`). */
  referencePriceHint: number;
  onCreated: (product: {
    uuid: string;
    description: string;
    has_lot: boolean;
    /** TASK-FE-780 — Un. Medida do Produto recém-criado, mesmo shape
     *  `Option<string>` embutido na `option` de Produto pelo `mapOptions` de
     *  `InvoiceItemsTab.tsx` (GAP-BE-641/TASK-FE-669), pra o item já nascer
     *  com as opções de "Un. Medida" hidratadas. */
    measurement: Option<string> | null;
    /** TASK-FE-780 — 2ª Un. Medida do Produto recém-criado (idem acima). */
    measurementSecond: Option<string> | null;
  }) => void;
}

// Defaults NEUTROS para os campos fora do subconjunto renderizado por este
// Modal (Aba 2 residual + Aba 3 "Fiscal" completa) — MESMOS valores de
// `CreateOrUpdateProduto.tsx::defaultValues` (ver cabeçalho do arquivo: o
// schema Yup real não exige NENHUM deles, "ZERO regra de negócio nova").
const NEUTRAL_DEFAULTS: Omit<
  ProductFormType,
  | 'description'
  | 'measurement_uuid'
  | 'group_uuid'
  | 'category_uuid'
  | 'kind_uuid'
  | 'ncm_uuid'
  | 'is_enabled'
  | 'has_lot'
  | 'control_stock'
  | 'min_stock'
  | 'las_price'
  | 'financial_category_uuid'
  | 'default_cost_center_uuid'
  | 'default_warehouse_uuid'
  | 'cultivation_uuid'
  | 'quality'
  | 'second_measurement_uuid'
  | 'factor_type'
  | 'factor'
  | 'allow_pointing'
> = {
  is_equipment: false,
  active_principle: null,
  addressing_uuid: null,
  tax_rule_uuid: null,
  product_package_uuids: [],
  is_fiscal: false,
  reference: null,
  barcode: null,
  cfop_saida_interno: null,
  cfop_saida_externo: null,
  cst_csosn: null,
  cst_csosn_exp: null,
  cst_pis: null,
  cst_cofins: null,
  cst_ipi: null,
  perc_icms: null,
  perc_pis: null,
  perc_cofins: null,
  perc_ipi: null,
  percent_reduction: 0,
  origem: null,
  cest: null,
  modality_bc: 0,
  cenq_ipi: null,
  cbenef: null,
  c_class_trib: null,
  cst_ibs_cbs: null,
  perc_ibs_uf: null,
  perc_ibs_mun: null,
  perc_reducao_aliq_ibs_uf: null,
  perc_reducao_aliq_ibs_mun: null,
  perc_dif_ibs_uf: null,
  perc_dif_ibs_mun: null,
  perc_cbs: null,
  perc_reducao_aliq_cbs: null,
  perc_dif_cbs: null,
  cst_is: null,
  perc_is: null,
  perc_is_espec: null,
  u_trib_is: null,
  ad_rem_ibs: null,
  ad_rem_cbs: null,
  tp_cred_pres_ibs_zfm: null,
  ind_doacao: false,
};

function buildDefaultValues(descriptionHint: string, referencePriceHint: number): ProductFormType {
  return {
    ...NEUTRAL_DEFAULTS,
    description: descriptionHint,
    measurement_uuid: null,
    group_uuid: null,
    category_uuid: null,
    kind_uuid: null,
    ncm_uuid: null,
    is_enabled: true,
    has_lot: false,
    control_stock: false,
    min_stock: null,
    las_price: referencePriceHint,
    financial_category_uuid: null,
    default_cost_center_uuid: null,
    default_warehouse_uuid: null,
    cultivation_uuid: null,
    quality: null,
    second_measurement_uuid: null,
    factor_type: null,
    factor: null,
    allow_pointing: false,
  };
}

// Payload builder — mirror EXATO de `CreateOrUpdateProduto.tsx::
// tryPersistProduct` para os campos deste Modal + os defaults neutros acima
// para os demais (decisão de duplicação, ver cabeçalho do arquivo).
function buildPayload(data: ProductFormType): ProductPayload {
  return {
    description: data.description.trim(),
    measurement_uuid: data.measurement_uuid!.value,
    group_uuid: data.group_uuid!.value,
    category_uuid: data.category_uuid!.value,
    kind_uuid: data.kind_uuid?.value ?? null,
    has_lot: !!data.has_lot,
    is_equipment: !!data.is_equipment,
    is_enabled: !!data.is_enabled,
    control_stock: !!data.control_stock,
    las_price: Number(data.las_price ?? 0),
    min_stock: data.min_stock ?? null,
    active_principle: data.active_principle?.trim() || null,
    financial_category_uuid: data.financial_category_uuid?.value ?? null,
    default_cost_center_uuid: data.default_cost_center_uuid?.value ?? null,
    default_warehouse_uuid: data.default_warehouse_uuid?.value ?? null,
    ncm_uuid: data.ncm_uuid?.value ?? null,
    cultivation_uuid: data.cultivation_uuid?.value ?? null,
    quality: data.quality?.trim() || null,
    addressing_uuid: data.addressing_uuid?.value ?? null,
    tax_rule_uuid: data.tax_rule_uuid?.value ?? null,
    second_measurement_uuid: data.second_measurement_uuid?.value ?? null,
    factor_type: data.factor_type ?? null,
    factor: data.factor ?? null,
    is_fiscal: !!data.is_fiscal,
    allow_pointing: !!data.allow_pointing,
    reference: data.reference?.trim() || null,
    barcode: data.barcode || null,
    cfop_saida_interno: data.cfop_saida_interno || null,
    cfop_saida_externo: data.cfop_saida_externo || null,
    cst_csosn: data.cst_csosn || null,
    cst_csosn_exp: data.cst_csosn_exp || null,
    cst_pis: data.cst_pis || null,
    cst_cofins: data.cst_cofins || null,
    cst_ipi: data.cst_ipi || null,
    perc_icms: data.perc_icms ?? null,
    perc_pis: data.perc_pis ?? null,
    perc_cofins: data.perc_cofins ?? null,
    perc_ipi: data.perc_ipi ?? null,
    percent_reduction: data.percent_reduction ?? 0,
    origem: data.origem ?? null,
    cest: data.cest || null,
    modality_bc: data.modality_bc ?? 0,
    cenq_ipi: data.cenq_ipi?.trim() || null,
    cbenef: data.cbenef?.trim() || null,
    c_class_trib: data.c_class_trib?.trim() || null,
    cst_ibs_cbs: data.cst_ibs_cbs || null,
    perc_ibs_uf: data.perc_ibs_uf ?? null,
    perc_ibs_mun: data.perc_ibs_mun ?? null,
    perc_reducao_aliq_ibs_uf: data.perc_reducao_aliq_ibs_uf ?? null,
    perc_reducao_aliq_ibs_mun: data.perc_reducao_aliq_ibs_mun ?? null,
    perc_dif_ibs_uf: data.perc_dif_ibs_uf ?? null,
    perc_dif_ibs_mun: data.perc_dif_ibs_mun ?? null,
    perc_cbs: data.perc_cbs ?? null,
    perc_reducao_aliq_cbs: data.perc_reducao_aliq_cbs ?? null,
    perc_dif_cbs: data.perc_dif_cbs ?? null,
    cst_is: data.cst_is?.trim() || null,
    perc_is: data.perc_is ?? null,
    perc_is_espec: data.perc_is_espec ?? null,
    u_trib_is: data.u_trib_is?.trim() || null,
    ad_rem_ibs: data.ad_rem_ibs ?? null,
    ad_rem_cbs: data.ad_rem_cbs ?? null,
    tp_cred_pres_ibs_zfm: data.tp_cred_pres_ibs_zfm ?? null,
    ind_doacao: !!data.ind_doacao,
  };
}

export function CreateProductFromXmlModal({
  isOpen,
  onClose,
  descriptionHint,
  ncmHint,
  measurementUmHint,
  referencePriceHint,
  onCreated,
}: CreateProductFromXmlModalProps) {
  const { languageGB } = useLanguage();
  const modalText = languageGB.invoices.invoice.form.createProductFromXmlModal;
  const productText = languageGB.products.product;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormType>({
    mode: 'onChange',
    resolver: productSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: buildDefaultValues(descriptionHint, referencePriceHint),
  });

  const groupValue = watch('group_uuid');
  const categoryValue = watch('category_uuid');
  const ncmRequiredForGroup = isProductionGroup(groupValue ?? undefined);

  // Prefill assíncrono (`ncm_uuid` resolvido por código exato no catálogo real
  // + `measurement_uuid` sugerido a partir de `measurementUmHint`) — roda
  // 1x quando o Modal abre (mirror do racional já usado em
  // `handleXmlImported`/`CreateOrUpdateInvoice.tsx`: awaits sequenciais,
  // `catch` silencioso, nunca força um valor que não casou).
  const prefillRanForRef = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      prefillRanForRef.current = false;
      return;
    }
    if (prefillRanForRef.current) return;
    prefillRanForRef.current = true;

    reset(buildDefaultValues(descriptionHint, referencePriceHint));

    async function prefillAsync() {
      let ncmOption: Option<string> | null = null;
      if (ncmHint?.code) {
        try {
          const response = await listNcmOptions({ search: ncmHint.code, per_page: 20 });
          const found = (response.data.items ?? []).find(
            (item: NcmOption) => item.code === ncmHint.code
          );
          ncmOption = found
            ? {
                label: found.code ? `${found.code} — ${found.description}` : found.description,
                value: found.uuid,
              }
            : null;
        } catch {
          ncmOption = null;
        }
      }
      if (ncmOption) setValue('ncm_uuid', ncmOption);

      let measurementOption: Option<string> | null = null;
      if (measurementUmHint) {
        try {
          const measurementResponse = await listMeasurementOptions({});
          measurementOption = suggestMeasurementOption(
            measurementUmHint,
            measurementResponse.data.items ?? []
          );
        } catch {
          measurementOption = null;
        }
      }
      if (measurementOption) setValue('measurement_uuid', measurementOption);
    }

    prefillAsync();
    // Deps intencionalmente restritas a `isOpen` — o prefill roda 1x por
    // abertura do Modal (guarda `prefillRanForRef`); `descriptionHint`/
    // `ncmHint`/`measurementUmHint`/`referencePriceHint`/`reset`/`setValue`
    // são estáveis por render do caller (mirror do racional já documentado
    // em `handleXmlImported`/`CreateOrUpdateInvoice.tsx`).
  }, [isOpen]);

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (data) => {
      toaster.success({ title: modalText.title, description: modalText.successToast });
      onCreated({
        uuid: data.data.uuid,
        description: data.data.description,
        has_lot: data.data.has_lot,
        // TASK-FE-780 — mirror EXATO do `mapOptions` de Produto em
        // `InvoiceItemsTab.tsx` (GAP-BE-641/TASK-FE-669): `POST /products`
        // já retorna `measurement`/`measurement_second` no mesmo shape
        // `{uuid, description}` da listagem, sem endpoint novo.
        measurement: data.data.measurement
          ? { label: data.data.measurement.description, value: data.data.measurement.uuid }
          : null,
        measurementSecond: data.data.measurement_second
          ? {
              label: data.data.measurement_second.description,
              value: data.data.measurement_second.uuid,
            }
          : null,
      });
    },
    onError: (error) => {
      const resData = isAxiosError(error) ? (error.response?.data as any) : null;
      toaster.error({
        title: modalText.title,
        description: resData?.message ?? productText.form.errors.invalidFieldsCurrentTab,
        duration: 7000,
      });
    },
  });

  const isSubmitting = createMutation.isPending;

  async function onSubmit(data: ProductFormType) {
    await createMutation.mutateAsync(buildPayload(data));
  }

  function handleClose() {
    if (isSubmitting) return;
    onClose();
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open) handleClose();
      }}
      // TASK-FE-707/DF-32 — `size="xl"` (DF-27, leva anterior) já é quase o
      // teto útil do recipe do Dialog v3 (só `"cover"`/`"full"` são maiores,
      // sem `"2xl"` intermediário); `"cover"` ocupa a viewport inteira menos
      // padding, preservando a moldura de Dialog (mais espaço por coluna,
      // combinado com a redução de colunas abaixo).
      size="cover"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>{modalText.title}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Text fontSize="sm" color="fg.muted" mb={4}>
                {modalText.subtitle}
              </Text>

              {/* ---- Identificação/Classificação (subconjunto Aba 1) ---- */}
              {/* TASK-FE-707/DF-32 — Un. Medida/2ª Un. Medida/NCM concentram
                  os textos mais longos do modal; `threeColumns` (em vez de
                  `default`, 4 colunas) dá ~33% mais largura por campo,
                  independente do tamanho do modal. */}
              <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
                <Input
                  label={productText.form.fields.description}
                  placeholder={productText.form.placeholders.description}
                  maxLength={181}
                  {...register('description')}
                  error={errors.description?.message}
                  isRequired
                  disabled={isSubmitting}
                />

                <Controller
                  name="measurement_uuid"
                  control={control}
                  render={({ field }) => (
                    <SelectAsyncPaginate
                      name={field.name}
                      label={productText.form.fields.measurement}
                      placeholder={productText.form.placeholders.measurement}
                      error={errors.measurement_uuid?.message as string | undefined}
                      service={listMeasurementOptions}
                      pageSize={FLAT_CATALOG_PAGE_SIZE}
                      mapOptions={(item: MeasurementOption) => ({
                        label: item.description,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                      })}
                      value={field.value ?? undefined}
                      onChange={(option: any) => field.onChange(option ?? null)}
                      isRequired
                      isDisabled={isSubmitting}
                      // TASK-FE-706/DF-31 — `disablePortal` (mirror
                      // `GerarDepreciacaoModal.tsx`): o menu do
                      // `SelectAsyncPaginate` renderiza inline dentro da
                      // árvore do `Dialog.Root`, evitando o bloqueio de
                      // clique/foco que o Dialog v3 aplica a elementos
                      // portalizados direto em `document.body`.
                      disablePortal
                    />
                  )}
                />

                <Controller
                  name="second_measurement_uuid"
                  control={control}
                  render={({ field }) => (
                    <SelectAsyncPaginate
                      name={field.name}
                      label={productText.form.fields.secondMeasurement}
                      placeholder={productText.form.placeholders.secondMeasurement}
                      error={errors.second_measurement_uuid?.message as string | undefined}
                      service={listMeasurementOptions}
                      pageSize={FLAT_CATALOG_PAGE_SIZE}
                      mapOptions={(item: MeasurementOption) => ({
                        label: item.description,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                      })}
                      value={field.value ?? undefined}
                      onChange={(option: any) => field.onChange(option ?? null)}
                      isDisabled={isSubmitting}
                      // TASK-FE-706/DF-31 — `disablePortal` (mirror
                      // `GerarDepreciacaoModal.tsx`): o menu do
                      // `SelectAsyncPaginate` renderiza inline dentro da
                      // árvore do `Dialog.Root`, evitando o bloqueio de
                      // clique/foco que o Dialog v3 aplica a elementos
                      // portalizados direto em `document.body`.
                      disablePortal
                    />
                  )}
                />

                <Controller
                  name="factor_type"
                  control={control}
                  render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                    <Select
                      label={productText.form.fields.factorType}
                      name={name}
                      value={
                        productFactorTypeOptions
                          .options(languageGB)
                          .find((o) => o.value === value) ?? null
                      }
                      onChange={(opt: Option<'M' | 'D'> | null) => onChange(opt?.value ?? null)}
                      options={productFactorTypeOptions.options(languageGB)}
                      error={error?.message}
                      isDisabled={isSubmitting}
                      disablePortal
                    />
                  )}
                />

                <Controller
                  name="factor"
                  control={control}
                  render={({ field, fieldState }) => (
                    <NumberInput
                      name={field.name}
                      label={productText.form.fields.factor}
                      allowDot
                      decimalPlaces={2}
                      value={field.value ?? null}
                      onValueChange={(value) => field.onChange(value)}
                      error={fieldState.error?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />

                <Controller
                  name="ncm_uuid"
                  control={control}
                  render={({ field }) => (
                    <SelectAsyncPaginate
                      name={field.name}
                      label={productText.form.fields.ncm}
                      placeholder={productText.form.placeholders.ncm}
                      helperText={
                        ncmRequiredForGroup
                          ? productText.form.hints.ncmRequiredForProductionGroup
                          : productText.form.hints.ncmSearchMinLength
                      }
                      error={errors.ncm_uuid?.message as string | undefined}
                      service={listNcmOptions}
                      mapOptions={(item: NcmOption) => ({
                        label: item.code ? `${item.code} — ${item.description}` : item.description,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                      })}
                      value={field.value ?? undefined}
                      onChange={(option: any) => field.onChange(option ?? null)}
                      isRequired={ncmRequiredForGroup}
                      isDisabled={isSubmitting}
                      // TASK-FE-706/DF-31 — `disablePortal` (mirror
                      // `GerarDepreciacaoModal.tsx`): o menu do
                      // `SelectAsyncPaginate` renderiza inline dentro da
                      // árvore do `Dialog.Root`, evitando o bloqueio de
                      // clique/foco que o Dialog v3 aplica a elementos
                      // portalizados direto em `document.body`.
                      disablePortal
                    />
                  )}
                />
              </SimpleGrid>

              {/* TASK-FE-707/DF-32 — "Grupo" (texto longo) concentrado
                  nesta seção; `threeColumns` mirror da seção acima. */}
              <SimpleGrid columns={columnsForm.threeColumns} gap={4} mt={4}>
                <Controller
                  name="group_uuid"
                  control={control}
                  render={({ field }) => (
                    <SelectAsyncPaginate
                      name={field.name}
                      label={productText.form.fields.group}
                      placeholder={productText.form.placeholders.group}
                      error={errors.group_uuid?.message as string | undefined}
                      service={listProductGroupOptions}
                      mapOptions={(item: ProductGroupOption) => ({
                        label: item.label,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                      })}
                      value={field.value ?? null}
                      onChange={(option: any) => {
                        field.onChange(option ?? null);
                        setValue('category_uuid', null, { shouldDirty: true });
                        setValue('kind_uuid', null, { shouldDirty: true });
                      }}
                      isRequired
                      isDisabled={isSubmitting}
                      // TASK-FE-706/DF-31 — `disablePortal` (mirror
                      // `GerarDepreciacaoModal.tsx`): o menu do
                      // `SelectAsyncPaginate` renderiza inline dentro da
                      // árvore do `Dialog.Root`, evitando o bloqueio de
                      // clique/foco que o Dialog v3 aplica a elementos
                      // portalizados direto em `document.body`.
                      disablePortal
                    />
                  )}
                />

                <Controller
                  name="category_uuid"
                  control={control}
                  render={({ field }) => (
                    <SelectAsyncPaginate
                      name={field.name}
                      label={productText.form.fields.category}
                      placeholder={
                        groupValue
                          ? productText.form.placeholders.category
                          : productText.form.placeholders.categoryDisabledHint
                      }
                      error={errors.category_uuid?.message as string | undefined}
                      isDisabled={!groupValue || isSubmitting}
                      service={listCategoryProductOptions}
                      mapOptions={(item: CategoryProductOption) => ({
                        label: item.label,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                        group_uuid: groupValue?.value,
                      })}
                      cacheUniqs={[groupValue?.value]}
                      value={field.value ?? null}
                      onChange={(option: any) => {
                        field.onChange(option ?? null);
                        setValue('kind_uuid', null, { shouldDirty: true });
                      }}
                      isRequired
                      // TASK-FE-706/DF-31 — `disablePortal` (mirror
                      // `GerarDepreciacaoModal.tsx`): o menu do
                      // `SelectAsyncPaginate` renderiza inline dentro da
                      // árvore do `Dialog.Root`, evitando o bloqueio de
                      // clique/foco que o Dialog v3 aplica a elementos
                      // portalizados direto em `document.body`.
                      disablePortal
                    />
                  )}
                />

                <Controller
                  name="kind_uuid"
                  control={control}
                  render={({ field }) => (
                    <SelectAsyncPaginate
                      name={field.name}
                      label={productText.form.fields.kind}
                      placeholder={
                        categoryValue
                          ? productText.form.placeholders.kind
                          : productText.form.placeholders.kindDisabledHint
                      }
                      error={errors.kind_uuid?.message as string | undefined}
                      isDisabled={!categoryValue || isSubmitting}
                      service={listKindOptions}
                      mapOptions={(item: KindOption) => ({
                        label: item.label,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                        category_uuid: categoryValue?.value,
                      })}
                      cacheUniqs={[categoryValue?.value]}
                      value={field.value ?? null}
                      onChange={(option: any) => field.onChange(option ?? null)}
                      isRequired
                      // TASK-FE-706/DF-31 — `disablePortal` (mirror
                      // `GerarDepreciacaoModal.tsx`): o menu do
                      // `SelectAsyncPaginate` renderiza inline dentro da
                      // árvore do `Dialog.Root`, evitando o bloqueio de
                      // clique/foco que o Dialog v3 aplica a elementos
                      // portalizados direto em `document.body`.
                      disablePortal
                    />
                  )}
                />

                {/* "Variedade" (`cultivation_uuid`) — mirror EXATO de
                    `ProdutoEstoqueFinanceiroTab.tsx`: só habilitado/exigido
                    quando o Grupo selecionado é "Produção" (D8,
                    `isProductionGroup`, única fonte da string, nunca
                    duplicada). */}
                <Controller
                  name="cultivation_uuid"
                  control={control}
                  render={({ field }) => (
                    <SelectCultivation
                      name={field.name}
                      label={productText.form.fields.cultivation}
                      placeholder={productText.form.placeholders.cultivation}
                      tooltip={
                        isProductionGroup(groupValue ?? undefined)
                          ? productText.form.hints.cultivationRequiredForProductionGroup
                          : productText.form.hints.cultivationDisabledOutsideProductionGroup
                      }
                      error={errors.cultivation_uuid?.message as string | undefined}
                      value={field.value ?? null}
                      onChange={(option) => field.onChange(option ?? null)}
                      isRequired={isProductionGroup(groupValue ?? undefined)}
                      isDisabled={!isProductionGroup(groupValue ?? undefined) || isSubmitting}
                      // TASK-FE-761/DF-34 — sem `menuPortalTarget`: mirror do
                      // padrão `disablePortal` já usado pelos demais Selects
                      // deste modal (TASK-FE-706/DF-31) — o menu renderiza
                      // inline dentro da árvore do `Dialog.Root`, evitando o
                      // bloqueio de clique/foco que o Dialog v3 aplica a
                      // elementos portalizados direto em `document.body`.
                      // `SelectCultivation` não expõe `disablePortal`; omitir
                      // `menuPortalTarget` produz o mesmo efeito (react-select
                      // só portala quando o target é passado).
                    />
                  )}
                />

                <Controller
                  name="quality"
                  control={control}
                  render={({ field }) => (
                    <Input
                      label={productText.form.fields.quality}
                      placeholder={productText.form.placeholders.quality}
                      maxLength={191}
                      name={field.name}
                      value={field.value ?? ''}
                      onChange={(event) => field.onChange(event.target.value)}
                      tooltip={
                        !isProductionGroup(groupValue ?? undefined)
                          ? productText.form.hints.qualityDisabledOutsideProductionGroup
                          : undefined
                      }
                      error={errors.quality?.message as string | undefined}
                      disabled={!isProductionGroup(groupValue ?? undefined) || isSubmitting}
                    />
                  )}
                />
              </SimpleGrid>

              {/* ---- Estoque/Financeiro (subconjunto Aba 2) ---- */}
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="fg.muted"
                textTransform="uppercase"
                mt={6}
                mb={2}
              >
                {productText.form.tabs.stockFinancial}
              </Text>
              <SimpleGrid columns={columnsForm.default} gap={4}>
                <Controller
                  name="has_lot"
                  control={control}
                  render={({ field: { name, value, onChange } }) => (
                    <Select
                      label={productText.form.fields.hasLot}
                      name={name}
                      value={
                        [
                          { value: true, label: languageGB.defaltStrings.yes },
                          { value: false, label: languageGB.defaltStrings.no },
                        ].find((o) => o.value === value) ?? null
                      }
                      onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                      options={[
                        { value: true, label: languageGB.defaltStrings.yes },
                        { value: false, label: languageGB.defaltStrings.no },
                      ]}
                      isRequired
                      isDisabled={isSubmitting}
                      noClearable
                      disablePortal
                    />
                  )}
                />

                <Controller
                  name="control_stock"
                  control={control}
                  render={({ field: { name, value, onChange } }) => (
                    <Select
                      label={productText.form.fields.controlStock}
                      name={name}
                      value={
                        [
                          { value: true, label: languageGB.defaltStrings.yes },
                          { value: false, label: languageGB.defaltStrings.no },
                        ].find((o) => o.value === value) ?? null
                      }
                      onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                      options={[
                        { value: true, label: languageGB.defaltStrings.yes },
                        { value: false, label: languageGB.defaltStrings.no },
                      ]}
                      isRequired
                      isDisabled={isSubmitting}
                      noClearable
                      disablePortal
                    />
                  )}
                />

                <Controller
                  name="min_stock"
                  control={control}
                  render={({ field, fieldState }) => (
                    <NumberInput
                      name={field.name}
                      label={productText.form.fields.minStock}
                      allowDot
                      decimalPlaces={2}
                      min={0}
                      value={field.value ?? null}
                      onValueChange={(value) => field.onChange(value)}
                      error={fieldState.error?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />

                <Controller
                  name="las_price"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MoneyInput
                      name={field.name}
                      label={productText.form.fields.lasPrice}
                      value={field.value ?? null}
                      onValueChange={(value) => field.onChange(value)}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={isSubmitting}
                    />
                  )}
                />

                <Controller
                  name="is_enabled"
                  control={control}
                  render={({ field: { name, value, onChange } }) => (
                    <Select
                      label={productText.form.fields.isEnabled}
                      name={name}
                      value={
                        [
                          { value: true, label: languageGB.defaltStrings.yes },
                          { value: false, label: languageGB.defaltStrings.no },
                        ].find((o) => o.value === value) ?? null
                      }
                      onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                      options={[
                        { value: true, label: languageGB.defaltStrings.yes },
                        { value: false, label: languageGB.defaltStrings.no },
                      ]}
                      isRequired
                      isDisabled={isSubmitting}
                      noClearable
                      disablePortal
                    />
                  )}
                />

                <Controller
                  name="allow_pointing"
                  control={control}
                  render={({ field: { name, value, onChange } }) => (
                    <Select
                      label={productText.form.fields.allowPointing}
                      name={name}
                      value={
                        [
                          { value: true, label: languageGB.defaltStrings.yes },
                          { value: false, label: languageGB.defaltStrings.no },
                        ].find((o) => o.value === !!value) ?? null
                      }
                      onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                      options={[
                        { value: true, label: languageGB.defaltStrings.yes },
                        { value: false, label: languageGB.defaltStrings.no },
                      ]}
                      isDisabled={isSubmitting}
                      noClearable
                      disablePortal
                    />
                  )}
                />
              </SimpleGrid>

              {/* TASK-FE-707/DF-32 — Cat.Financeira/Armazém/Centro de Custo
                  também concentram textos longos (código+descrição);
                  `threeColumns` mirror das seções acima, evita corte de
                  placeholder nestes campos também. */}
              <SimpleGrid columns={columnsForm.threeColumns} gap={4} mt={4}>
                <Controller
                  name="financial_category_uuid"
                  control={control}
                  render={({ field }) => (
                    <SelectAsyncPaginate
                      name={field.name}
                      label={productText.form.fields.financialCategory}
                      placeholder={productText.form.placeholders.financialCategory}
                      service={listFinancialCategoryOptions}
                      mapOptions={(item: FinancialCategoryOption) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                      })}
                      value={field.value ?? undefined}
                      onChange={(option: any) => field.onChange(option ?? null)}
                      isDisabled={isSubmitting}
                      // TASK-FE-706/DF-31 — `disablePortal` (mirror
                      // `GerarDepreciacaoModal.tsx`): o menu do
                      // `SelectAsyncPaginate` renderiza inline dentro da
                      // árvore do `Dialog.Root`, evitando o bloqueio de
                      // clique/foco que o Dialog v3 aplica a elementos
                      // portalizados direto em `document.body`.
                      disablePortal
                    />
                  )}
                />

                <Controller
                  name="default_warehouse_uuid"
                  control={control}
                  render={({ field }) => (
                    <SelectAsyncPaginate
                      name={field.name}
                      label={productText.form.fields.defaultWarehouse}
                      placeholder={productText.form.placeholders.defaultWarehouse}
                      service={listWarehouseOptions}
                      pageSize={FLAT_CATALOG_PAGE_SIZE}
                      mapOptions={(item: WarehouseOption) => ({
                        label: `${item.initials} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                      })}
                      value={field.value ?? undefined}
                      onChange={(option: any) => field.onChange(option ?? null)}
                      isDisabled={isSubmitting}
                      // TASK-FE-706/DF-31 — `disablePortal` (mirror
                      // `GerarDepreciacaoModal.tsx`): o menu do
                      // `SelectAsyncPaginate` renderiza inline dentro da
                      // árvore do `Dialog.Root`, evitando o bloqueio de
                      // clique/foco que o Dialog v3 aplica a elementos
                      // portalizados direto em `document.body`.
                      disablePortal
                    />
                  )}
                />

                <Controller
                  name="default_cost_center_uuid"
                  control={control}
                  render={({ field }) => (
                    <SelectAsyncPaginate
                      name={field.name}
                      label={productText.form.fields.defaultCostCenter}
                      placeholder={productText.form.placeholders.defaultCostCenter}
                      service={listCostCenterOptions}
                      mapOptions={(item: CostCenterRef) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                        only_analytic: true,
                      })}
                      value={field.value ?? undefined}
                      onChange={(option: any) => field.onChange(option ?? null)}
                      isDisabled={isSubmitting}
                      // TASK-FE-706/DF-31 — `disablePortal` (mirror
                      // `GerarDepreciacaoModal.tsx`): o menu do
                      // `SelectAsyncPaginate` renderiza inline dentro da
                      // árvore do `Dialog.Root`, evitando o bloqueio de
                      // clique/foco que o Dialog v3 aplica a elementos
                      // portalizados direto em `document.body`.
                      disablePortal
                    />
                  )}
                />
              </SimpleGrid>
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                title={modalText.cancelButton}
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              />
              <Button
                title={modalText.saveButton}
                onClick={handleSubmit(onSubmit)}
                loading={isSubmitting}
                disabled={isSubmitting}
              />
            </Dialog.Footer>
            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
