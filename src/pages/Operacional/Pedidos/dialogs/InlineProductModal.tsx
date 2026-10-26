// src/pages/Operacional/Pedidos/dialogs/InlineProductModal.tsx
// -----------------------------------------------------------------------------
// PED-FE-08 — Modal inline Criar/Editar Produto do form de Pedido (SURF-020..
// 025, IG-022..026, F-054..F-076, 97-Esteiras/043). Botão "+"/"editar" ao
// lado do select de produto de cada linha de item em `OrderItemRow.tsx`.
//
// DESBLOQUEIO GAP-API-FE-02 / PARADA-M (decisão do dono, mesmo racional que
// desbloqueou GAP-API-FE-01/PED-FE-07) — o `ProductRequest`/`POST-PUT
// /products` real JÁ aceita TODOS os campos legados F-057..F-074 deste
// modal: prova por evidência de produção, não presunção — os MESMOS
// service/schema/tipos (`createProduct`/`updateProduct`/`productSchemaResolver`/
// `ProductForm`/`ProductPayload`) já sustentam DOIS consumidores em produção
// hoje (`ProductFormModal.tsx`, wizard completo de 3 abas da tela cheia de
// Cadastros Base, e `Invoices/CreateProductFromXmlModal.tsx`, modal-em-form
// dentro de Invoice/NFe). Nenhum campo do inventário F-057..F-074 está
// ausente do `ProductPayload` real (conferido linha a linha contra
// `useProductFormController.ts::tryPersistProduct`). GAP-API-FE-02 fica
// RESOLVIDO por evidência de produção — não há gap a despachar ao
// api-architect.
//
// F-075/F-076 (`default_warehouse_id`/`default_cost_center_id`) — "NÃO
// RENDERIZADO no contexto Orders" (controller legado não passava essas
// listas pro form). Mesmo tratamento já dado a `is_enabled` no
// `InlineClientModal` (campo omitido da UI, sem mudança de contrato): os 2
// campos NUNCA aparecem neste modal — o payload os envia como `null`
// (aceitos como `nullable` pelo schema real, mesmo default do
// `buildDefaultValues`/`NEUTRAL_DEFAULTS` de `CreateProductFromXmlModal`).
//
// DECISÃO DE IMPLEMENTAÇÃO (mirror da decisão JÁ registrada em
// `CreateProductFromXmlModal.tsx`) — DUPLICAÇÃO do JSX, não extração/reuso
// do wizard completo (`ProductFormModal`/`ProductFormFields`): o formulário
// migrado de Produto é um wizard de 3 ABAS (~100 campos, incluindo os ~40
// campos Fiscais) MUITO maior que o `product_modal` legado deste contexto
// (23 campos, form único, Salvar sempre visível). Forçar o usuário a navegar
// 3 abas ("Próximo"/"Voltar" antes de "Salvar" aparecer) para criar um
// produto RÁPIDO de dentro de um item de Pedido não é fidelidade — é
// regressão de UX. Em vez de refatorar a tela CRUD já em produção (fora do
// escopo desta Tarefa, risco de regressão para TODOS os outros callers), este
// modal reaproveita a ÚNICA fonte de verdade que importa para não divergir
// de regra de negócio — o schema Yup (`productSchemaResolver`/
// `isProductionGroup`) e os tipos/services (`ProductForm`/`ProductPayload`/
// `createProduct`/`updateProduct`/`getProduct`) — e DUPLICA só o JSX do
// subconjunto F-057..F-074 + o payload builder (mirror EXATO do racional já
// documentado em `CreateProductFromXmlModal.tsx`). Os ~80 campos fora deste
// subconjunto (Fiscal completo + Aba 2 residual: `is_equipment`,
// `addressing_uuid`, `tax_rule_uuid`, `product_package_uuids`,
// `default_warehouse_uuid`, `default_cost_center_uuid`) recebem os MESMOS
// defaults neutros do form completo — o Produto criado aqui é 100%
// equivalente a criar pela tela cheia sem tocar Aba 2 residual/Aba 3.
//
// Diferença vs. `CreateProductFromXmlModal` — este modal suporta EDIÇÃO
// (`productUuid` presente → `GET /products/{uuid}` hidrata, IG-022) além de
// CRIAÇÃO; aquele é só-criação. Fill via `useEffect`+`reset` (Pattern 14
// regra 6, mirror `RequestQuotationFormDialog.tsx`) dependente de
// `[isOpen, productDetailQuery.data]`.
//
// CLM-031 ("clearProductModal não limpa financial_category_id") — NÃO
// reproduzido: `useForm` nasce com `defaultValues` neutros a cada abertura
// (`isOpen` no dep-array do `useEffect` de reset) — não há estado anterior
// vazando entre uma sessão de CRIAR e a próxima (mirror do racional já
// registrado em `InlineClientModal.tsx` para o mesmo defeito legado do lado
// Cliente).
//
// Cascatas (IG-023/024) + NCM (IG-025) — MESMO padrão de
// `ProductFormFields.tsx`/`CreateProductFromXmlModal.tsx`: `category_uuid`
// via `listCategoryProductOptions({ group_uuid })`, `kind_uuid` via
// `listKindOptions({ category_uuid })`, `cacheUniqs` reseta a paginação ao
// trocar o pai; `ncm_uuid` via `listNcmOptions` (o PRÓPRIO service já
// curto-circuita buscas < 3 caracteres — IG-025 sem lógica nova aqui).
// Grupo "Produção" (D8/`group_id=8`) habilita+exige `cultivation_uuid`/
// `quality`/`ncm_uuid` — `isProductionGroup`, única fonte da string,
// reexportada de `product-schema.ts` (nunca duplicada).
//
// `disablePortal` em TODOS os Selects (TASK-FE-706/DF-31, mirror
// `CreateProductFromXmlModal`/`RequestQuotationFormDialog`) — este modal
// SEMPRE monta dentro de `Dialog.Root`; sem isso, os menus portalizados em
// `document.body` ficam visíveis porém NÃO-CLICÁVEIS.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Portal, SimpleGrid, Text } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { usePermissions } from '@/hooks/usePermissions';

import { isValidGuid } from '@/utils/guid';

import { productFactorTypeOptions } from '@/constants/cadastrosBase/product/product-factor-type-options';
import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import {
  isProductionGroup,
  productSchemaResolver,
} from '@/validations/schemas/CadastrosBase/product-schema';

import { listCategoryProductOptions } from '@/services/v2/CategoryProducts/category-product-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { listKindOptions } from '@/services/v2/Kinds/kind-service';
import { listMeasurementOptions } from '@/services/v2/Measurements/measurement-service';
import { listNcmOptions } from '@/services/v2/Ncms/ncm-service';
import { listProductGroupOptions } from '@/services/v2/ProductGroups/product-group-service';
import { createProduct, getProduct, updateProduct } from '@/services/v2/Products/product-service';

import type { Option } from '@/@types/option';
import type { CategoryProductOption } from '@/@types/v2/CategoryProducts';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { KindOption } from '@/@types/v2/Kinds';
import type { MeasurementOption } from '@/@types/v2/Measurements';
import type { NcmOption } from '@/@types/v2/Ncms';
import type { ProductGroupOption } from '@/@types/v2/ProductGroups/product-group';
import type {
  ProductData,
  ProductForm as ProductFormType,
  ProductPayload,
} from '@/@types/v2/Products';

// Catálogos "flat" (`/options`, sem paginação real) — mirror
// `ProdutoEstoqueFinanceiroTab.tsx`/`ProductFormFields.tsx`.
const FLAT_CATALOG_PAGE_SIZE = 200;

export interface InlineProductModalSavedPayload {
  uuid: string;
  code: string;
  description: string;
  has_lot: boolean;
  /** Shape `Option<string>` embutido — mesmo formato que
   *  `ProductOptionResource.measurement` já devolve, pra o item do Pedido
   *  nascer com "UM" hidratado sem 2º request (mirror `OrderItemRow.tsx`::
   *  `productCacheRef`). */
  measurement: Option<string> | null;
  measurementSecond: Option<string> | null;
}

export interface InlineProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** uuid do Produto para EDITAR (IG-022, hidrata via `GET
   *  products/{uuid}`); `undefined`/vazio = modo CRIAR. */
  productUuid?: string;
  /** Disparado após criar/editar com sucesso (IG-026) — o pai
   *  (`OrderItemRow`) seleciona a option no select de produto da linha; o
   *  modal fecha sozinho. */
  onSaved: (product: InlineProductModalSavedPayload) => void;
}

// Defaults NEUTROS para os campos fora do subconjunto F-057..F-074
// renderizado por este Modal (Aba 2 residual + Aba 3 "Fiscal" completa +
// F-075/076 NÃO_RENDERIZADO) — MESMOS valores de
// `CreateOrUpdateProduto.tsx::defaultValues`/`CreateProductFromXmlModal.tsx::
// NEUTRAL_DEFAULTS` (schema real não exige NENHUM deles).
function buildDefaultValues(): ProductFormType {
  return {
    description: '',
    measurement_uuid: null,
    second_measurement_uuid: null,
    factor_type: null,
    factor: null,
    group_uuid: null,
    category_uuid: null,
    kind_uuid: null,
    ncm_uuid: null,
    is_enabled: true,
    is_equipment: false,
    has_lot: false,
    control_stock: false,
    min_stock: null,
    las_price: 0,
    active_principle: null,
    financial_category_uuid: null,
    // F-075/076 — NÃO_RENDERIZADO no contexto Pedidos (controller legado não
    // passava warehouses/costCenters pro form). Payload sempre `null` — o
    // schema aceita (`nullable`).
    default_cost_center_uuid: null,
    default_warehouse_uuid: null,
    cultivation_uuid: null,
    quality: null,
    addressing_uuid: null,
    tax_rule_uuid: null,
    product_package_uuids: [],
    allow_pointing: false,
    // -- Aba 3 "Fiscal" (~40 campos) — fora de escopo deste modal, ZERO
    // regra de negócio nova (todos opcionais/nullable no schema real).
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
}

// Hidratação em modo EDITAR (IG-022) — mirror `useProductFormController.ts::
// fillForm` para o subconjunto renderizado; os campos fora do subconjunto
// mantêm o mesmo neutro de `buildDefaultValues` (o Produto existente pode já
// ter Fiscal/Aba 2 residual preenchidos por outra tela — este modal NUNCA os
// edita nem os apaga, pois `ProductPayload` é FULL PAYLOAD: precisamos
// reenviar o valor ORIGINAL, não o neutro, para não regredir dado já salvo).
function buildFormValuesFromProduct(data: ProductData): ProductFormType {
  return {
    ...buildDefaultValues(),
    description: data.description,
    measurement_uuid: { label: data.measurement.description, value: data.measurement.uuid },
    second_measurement_uuid: data.measurement_second
      ? { label: data.measurement_second.description, value: data.measurement_second.uuid }
      : null,
    factor_type: data.factor_type?.value ?? null,
    factor: data.factor ?? null,
    group_uuid: { label: data.group.description, value: data.group.uuid },
    category_uuid: { label: data.category.description, value: data.category.uuid },
    kind_uuid: data.kind ? { label: data.kind.description, value: data.kind.uuid } : null,
    ncm_uuid: data.ncm
      ? {
          label: data.ncm.code
            ? `${data.ncm.code} — ${data.ncm.description}`
            : data.ncm.description,
          value: data.ncm.uuid,
        }
      : null,
    is_enabled: !!data.is_enabled,
    is_equipment: !!data.is_equipment,
    has_lot: !!data.has_lot,
    control_stock: !!data.control_stock,
    min_stock: data.min_stock ?? null,
    las_price: Number(data.las_price ?? 0),
    active_principle: data.active_principle ?? null,
    financial_category_uuid: data.financial_category
      ? { label: data.financial_category.description, value: data.financial_category.uuid }
      : null,
    // Preserva o valor ORIGINAL (não-neutro) — este modal não renderiza estes
    // 2 campos (F-075/076), mas o PUT é full-payload; reenviar `null`
    // apagaria um valor que outra tela (Cadastros Base/Produtos) já salvou.
    default_cost_center_uuid: data.default_cost_center
      ? {
          label: `${data.default_cost_center.code} — ${data.default_cost_center.description}`,
          value: data.default_cost_center.uuid,
        }
      : null,
    default_warehouse_uuid: data.default_warehouse
      ? { label: data.default_warehouse.description, value: data.default_warehouse.uuid }
      : null,
    cultivation_uuid: data.cultivation
      ? { label: data.cultivation.description, value: data.cultivation.uuid }
      : null,
    quality: data.quality ?? null,
    addressing_uuid: data.addressing
      ? { label: data.addressing.description, value: data.addressing.uuid }
      : null,
    tax_rule_uuid: data.tax_rule
      ? { label: data.tax_rule.description, value: data.tax_rule.uuid }
      : null,
    product_package_uuids: data.package_uuids ?? [],
    allow_pointing: !!data.allow_pointing,
    // -- Fiscal (fora de escopo, preserva original — mesmo racional acima) --
    is_fiscal: !!data.is_fiscal,
    reference: data.reference ?? null,
    barcode: data.barcode ?? null,
    cfop_saida_interno: data.cfop_saida_interno ?? null,
    cfop_saida_externo: data.cfop_saida_externo ?? null,
    cst_csosn: data.cst_csosn ?? null,
    cst_csosn_exp: data.cst_csosn_exp ?? null,
    cst_pis: data.cst_pis ?? null,
    cst_cofins: data.cst_cofins ?? null,
    cst_ipi: data.cst_ipi ?? null,
    perc_icms: data.perc_icms ?? null,
    perc_pis: data.perc_pis ?? null,
    perc_cofins: data.perc_cofins ?? null,
    perc_ipi: data.perc_ipi ?? null,
    percent_reduction: data.percent_reduction ?? 0,
    origem: data.origem ?? null,
    cest: data.cest ?? null,
    modality_bc: data.modality_bc ?? 0,
    cenq_ipi: data.cenq_ipi ?? null,
    cbenef: data.cbenef ?? null,
    c_class_trib: data.c_class_trib ?? null,
    cst_ibs_cbs: data.cst_ibs_cbs ?? null,
    perc_ibs_uf: data.perc_ibs_uf ?? null,
    perc_ibs_mun: data.perc_ibs_mun ?? null,
    perc_reducao_aliq_ibs_uf: data.perc_reducao_aliq_ibs_uf ?? null,
    perc_reducao_aliq_ibs_mun: data.perc_reducao_aliq_ibs_mun ?? null,
    perc_dif_ibs_uf: data.perc_dif_ibs_uf ?? null,
    perc_dif_ibs_mun: data.perc_dif_ibs_mun ?? null,
    perc_cbs: data.perc_cbs ?? null,
    perc_reducao_aliq_cbs: data.perc_reducao_aliq_cbs ?? null,
    perc_dif_cbs: data.perc_dif_cbs ?? null,
    cst_is: data.cst_is ?? null,
    perc_is: data.perc_is ?? null,
    perc_is_espec: data.perc_is_espec ?? null,
    u_trib_is: data.u_trib_is ?? null,
    ad_rem_ibs: data.ad_rem_ibs ?? null,
    ad_rem_cbs: data.ad_rem_cbs ?? null,
    tp_cred_pres_ibs_zfm: data.tp_cred_pres_ibs_zfm ?? null,
    ind_doacao: !!data.ind_doacao,
  };
}

// Payload builder — mirror EXATO de `useProductFormController.ts::
// tryPersistProduct`/`CreateProductFromXmlModal.tsx::buildPayload` (mesma
// fonte de verdade, zero regra de negócio nova).
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

export function InlineProductModal({
  isOpen,
  onClose,
  productUuid,
  onSaved,
}: InlineProductModalProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const productText = languageGB.products.product;

  const isEditing = isValidGuid(productUuid);
  const canSave = isEditing ? can('products_edit') : can('products_create');

  const productDetailQuery = useQuery({
    queryKey: [queryKey.products.product, productUuid],
    queryFn: async () => (await getProduct(productUuid!)).data,
    enabled: isOpen && isEditing,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<ProductFormType>({
    mode: 'onChange',
    resolver: productSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: buildDefaultValues(),
  });

  // Fill via `useEffect`+`reset` (Pattern 14 regra 6, mirror
  // `RequestQuotationFormDialog.tsx`) — em CRIAR, reseta pros neutros a cada
  // abertura (corrige CLM-031 por construção); em EDITAR, aguarda o `GET`
  // resolver e hidrata (IG-022).
  useEffect(() => {
    if (!isOpen) return;
    if (isEditing) {
      if (productDetailQuery.data) {
        reset(buildFormValuesFromProduct(productDetailQuery.data));
      }
      return;
    }
    reset(buildDefaultValues());
  }, [isOpen, isEditing, productDetailQuery.data]);

  const groupValue = watch('group_uuid');
  const categoryValue = watch('category_uuid');
  const ncmRequiredForGroup = isProductionGroup(groupValue ?? undefined);

  const productMutation = useMutation({
    mutationFn: (payload: ProductPayload) =>
      isEditing && productUuid ? updateProduct(productUuid, payload) : createProduct(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [queryKey.products.productsList] });
      queryClient.invalidateQueries({ queryKey: [queryKey.products.product] });
      // IG-026 — mensagens literais do legado.
      toaster.success({
        title: productText.singularLabel,
        description: isEditing ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.',
        duration: 7000,
      });
      onSaved({
        uuid: response.data.uuid,
        code: response.data.code,
        description: response.data.description,
        has_lot: response.data.has_lot,
        measurement: response.data.measurement
          ? { label: response.data.measurement.description, value: response.data.measurement.uuid }
          : null,
        measurementSecond: response.data.measurement_second
          ? {
              label: response.data.measurement_second.description,
              value: response.data.measurement_second.uuid,
            }
          : null,
      });
      onClose();
    },
    onError: (error: unknown) => {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof ProductFormType, { type: 'server', message: messages[0] });
          }
        });
      }

      const resData = isAxiosError(error) ? (error.response?.data as any) : null;
      toaster.error({
        title: productText.singularLabel,
        description: resData?.message ?? productText.form.errors.invalidFieldsCurrentTab,
        duration: 7000,
      });
    },
  });

  const isSubmitting = productMutation.isPending;
  const isLoadingDetail = isEditing && productDetailQuery.isLoading;

  function onSubmit(data: ProductFormType) {
    productMutation.mutate(buildPayload(data));
  }

  function handleClose() {
    if (isSubmitting) return;
    onClose();
  }

  const yesNoOptions: Option<boolean>[] = [
    { value: true, label: languageGB.defaltStrings.yes },
    { value: false, label: languageGB.defaltStrings.no },
  ];

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open) handleClose();
      }}
      size="xl"
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
              <Dialog.Title>
                {isEditing ? productText.form.title.edit : productText.form.title.create}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              {isLoadingDetail ? (
                <Text fontSize="sm" color="fg.muted">
                  {languageGB.defaltStrings.loading}
                </Text>
              ) : (
                // Pattern 14, regra 3 (`get_pwa_complex_screen_compositions_pattern`)
                // — `<form id>` no `Dialog.Body` + `Button type="submit" form="..."`
                // no `Dialog.Footer` (evita `onClick={handleSubmit(...)}`, preserva
                // validação nativa do form).
                <form id="product-modal-form" onSubmit={handleSubmit(onSubmit)}>
                  <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
                    <Input
                      label={productText.form.fields.description}
                      placeholder={productText.form.placeholders.description}
                      maxLength={181}
                      {...register('description')}
                      error={errors.description?.message}
                      isRequired
                      disabled={isSubmitting || !canSave}
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
                          isDisabled={isSubmitting || !canSave}
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
                          isDisabled={isSubmitting || !canSave}
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
                          isDisabled={isSubmitting || !canSave}
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
                          disabled={isSubmitting || !canSave}
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
                            label: item.code
                              ? `${item.code} — ${item.description}`
                              : item.description,
                            value: item.uuid,
                          })}
                          findParams={(search: string | { search: string }) => ({
                            search: typeof search === 'string' ? search : search.search,
                          })}
                          value={field.value ?? undefined}
                          onChange={(option: any) => field.onChange(option ?? null)}
                          isRequired={ncmRequiredForGroup}
                          isDisabled={isSubmitting || !canSave}
                          disablePortal
                        />
                      )}
                    />
                  </SimpleGrid>

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
                          isDisabled={isSubmitting || !canSave}
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
                          isDisabled={!groupValue || isSubmitting || !canSave}
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
                          isDisabled={!categoryValue || isSubmitting || !canSave}
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
                          disablePortal
                        />
                      )}
                    />

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
                          isDisabled={
                            !isProductionGroup(groupValue ?? undefined) || isSubmitting || !canSave
                          }
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
                          disabled={
                            !isProductionGroup(groupValue ?? undefined) || isSubmitting || !canSave
                          }
                        />
                      )}
                    />
                  </SimpleGrid>

                  <SimpleGrid columns={columnsForm.default} gap={4} mt={4}>
                    <Controller
                      name="has_lot"
                      control={control}
                      render={({ field: { name, value, onChange } }) => (
                        <Select
                          label={productText.form.fields.hasLot}
                          name={name}
                          value={yesNoOptions.find((o) => o.value === value) ?? null}
                          onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                          options={yesNoOptions}
                          isRequired
                          isDisabled={isSubmitting || !canSave}
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
                          value={yesNoOptions.find((o) => o.value === value) ?? null}
                          onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                          options={yesNoOptions}
                          isRequired
                          isDisabled={isSubmitting || !canSave}
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
                          disabled={isSubmitting || !canSave}
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
                          disabled={isSubmitting || !canSave}
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
                          value={yesNoOptions.find((o) => o.value === value) ?? null}
                          onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                          options={yesNoOptions}
                          isRequired
                          isDisabled={isSubmitting || !canSave}
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
                          value={yesNoOptions.find((o) => o.value === !!value) ?? null}
                          onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                          options={yesNoOptions}
                          isRequired
                          isDisabled={isSubmitting || !canSave}
                          noClearable
                          disablePortal
                        />
                      )}
                    />
                  </SimpleGrid>

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
                          isDisabled={isSubmitting || !canSave}
                          disablePortal
                        />
                      )}
                    />
                  </SimpleGrid>
                </form>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                title={languageGB.defaltStrings.cancel}
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              />
              {canSave && (
                <Button
                  title={languageGB.defaltStrings.save}
                  type="submit"
                  form="product-modal-form"
                  loading={isSubmitting}
                  disabled={isSubmitting || isLoadingDetail}
                />
              )}
            </Dialog.Footer>
            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
