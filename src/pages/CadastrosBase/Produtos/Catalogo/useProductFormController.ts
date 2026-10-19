// src/pages/CadastrosBase/Produtos/Catalogo/useProductFormController.ts
// -----------------------------------------------------------------------------
// TASK-FE-036-B16 — EXTRAÍDO de `CreateOrUpdateProduto.tsx` (recorte-e-cola,
// nenhuma linha de lógica reescrita), mirror EXATO da extração já feita para
// Cliente (`useClientFormController.ts`/`TASK-MV-FE-10`): toda a orquestração
// de estado/submit do formulário de Produto (useForm/wizard de 3 abas/
// cascata Grupo→Categoria→Classe/pivot Embalagens/persistência) migra para
// este hook — pré-requisito do `ProductFormModal` (reuso deste MESMO hook
// dentro do Contrato de Venda/NFe, sem endpoint/schema/service novo).
//
// Diferença deliberada vs. `useClientFormController` — aqui o hook chama a
// PRÓPRIA query de detalhe (`useProductForm`) internamente (em vez de receber
// `initialData` já resolvido do caller): o padrão de hidratação de Produto
// SEMPRE foi via `reset()` guardado por `!isEmpty(dirtyFields)` (nunca
// gated-mount/defaultValues síncronos como Cliente) — preservar esse padrão
// aqui é MENOS risco do que reescrever a tela cheia para o outro estilo.
// `usePermissions().hasFarm` também é lido direto aqui (guard `farm.context`
// ESTRITO, Product-contrato.md §8) — cada caller (página cheia/Modal) só
// decide o que RENDERIZAR quando `isEditing && !hasFarm`.
//
// `onPersisted` (NOVO, mirror `useClientFormController`) — só o
// `ProductFormModal` passa; a página cheia OMITE de propósito, preservando o
// `navigate(-1)` original ao concluir create/update (comportamento intocado).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { isAxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isEmpty } from '@/utils/isEmpty';

import { sanitizeC1ForCst } from '@/constants/Fiscal/fiscal-field-visibility';
import { queryKey } from '@/constants/query-key';

import {
  isProductionGroup,
  productSchemaResolver,
} from '@/validations/schemas/CadastrosBase/product-schema';

import { createProduct, updateProduct } from '@/services/v2/Products/product-service';

import type {
  ProductData,
  ProductForm as ProductFormType,
  ProductPayload,
} from '@/@types/v2/Products';

import { useProductForm } from './useProducts';

import type { FieldErrors } from 'react-hook-form';

// Mirror LOCAL de `CreateOrUpdateProduto.tsx::FLAT_CATALOG_PAGE_SIZE` — não
// exportado/importado entre os 2 arquivos (constante trivial, mesma decisão
// já registrada em `ProdutoEstoqueFinanceiroTab.tsx`).
export const PRODUCT_FORM_FLAT_CATALOG_PAGE_SIZE = 200;

export type ProductTabKey = '0' | '1' | '2';

const TAB_FIELDS: Record<ProductTabKey, (keyof ProductFormType)[]> = {
  '0': [
    'description',
    'measurement_uuid',
    'second_measurement_uuid',
    'factor_type',
    'factor',
    'group_uuid',
    'category_uuid',
    'kind_uuid',
    'is_enabled',
    'is_equipment',
    'has_lot',
    'ncm_uuid',
  ],
  '1': [
    'control_stock',
    'min_stock',
    'las_price',
    'active_principle',
    'financial_category_uuid',
    'default_cost_center_uuid',
    'default_warehouse_uuid',
    'cultivation_uuid',
    'quality',
    'addressing_uuid',
    'product_package_uuids',
  ],
  '2': [
    'tax_rule_uuid',
    'is_fiscal',
    'allow_pointing',
    'reference',
    'barcode',
    'cfop_saida_interno',
    'cfop_saida_externo',
    'cst_csosn',
    'cst_csosn_exp',
    'cst_pis',
    'cst_cofins',
    'cst_ipi',
    'perc_icms',
    'perc_pis',
    'perc_cofins',
    'perc_ipi',
    'percent_reduction',
    'mot_des_icms',
    'perc_dif',
    'perc_fcp',
    'origem',
    'cest',
    'modality_bc',
    'cenq_ipi',
    'cbenef',
    'c_class_trib',
    'cst_ibs_cbs',
    'perc_ibs_uf',
    'perc_ibs_mun',
    'perc_reducao_aliq_ibs_uf',
    'perc_reducao_aliq_ibs_mun',
    'perc_dif_ibs_uf',
    'perc_dif_ibs_mun',
    'perc_cbs',
    'perc_reducao_aliq_cbs',
    'perc_dif_cbs',
    'cst_is',
    'perc_is',
    'perc_is_espec',
    'u_trib_is',
    'ad_rem_ibs',
    'ad_rem_cbs',
    'tp_cred_pres_ibs_zfm',
    'ind_doacao',
  ],
};

const FIELD_TAB_MAP: Partial<Record<keyof ProductFormType, ProductTabKey>> = Object.fromEntries(
  (Object.entries(TAB_FIELDS) as [ProductTabKey, (keyof ProductFormType)[]][]).flatMap(
    ([tab, fields]) => fields.map((field) => [field, tab])
  )
);

/** Hint OPCIONAL de NCM vindo da querystring (`?ncm_code=&ncm_description=`)
 *  — só a página cheia lê (`CreateOrUpdateProduto.tsx`, fluxo legado do
 *  botão "+ Criar Produto" de `InvoiceItemsTab.tsx`, superado por
 *  `CreateProductFromXmlModal` mas mantido por navegação direta). O
 *  `ProductFormModal` nunca passa este hint. */
export interface ProductFormXmlNcmHint {
  code: string | null;
  description: string | null;
}

export interface UseProductFormControllerProps {
  /** uuid do Produto para EDITAR; `undefined` = modo CRIAR. */
  productId?: string;
  isEditing: boolean;
  canSave: boolean;
  /** NOVO (mirror `useClientFormController`) — só o `ProductFormModal` usa.
   *  Página cheia continua `navigate(-1)` (comportamento intocado,
   *  `onPersisted` OMITIDO na chamada do hook). */
  onPersisted?: (product: ProductData) => void;
  /** Hint OPCIONAL da querystring — só a página cheia repassa (ver
   *  `ProductFormXmlNcmHint`). */
  xmlDescriptionHint?: string;
  xmlNcmHint?: ProductFormXmlNcmHint | null;
}

export function useProductFormController({
  productId,
  isEditing,
  canSave,
  onPersisted,
  xmlDescriptionHint = '',
  xmlNcmHint = null,
}: UseProductFormControllerProps) {
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { hasFarm, can } = usePermissions();
  const text = languageGB.products.product;

  const xmlNcmHintLabel =
    xmlNcmHint?.code && xmlNcmHint?.description
      ? `${xmlNcmHint.code} — ${xmlNcmHint.description}`
      : null;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    trigger,
    formState: { errors, dirtyFields },
  } = useForm<ProductFormType>({
    mode: 'onChange',
    resolver: productSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: xmlDescriptionHint,
      measurement_uuid: null,
      group_uuid: null,
      category_uuid: null,
      kind_uuid: null,
      is_enabled: true,
      is_equipment: false,
      has_lot: false,
      ncm_uuid: null,
      // -- Aba 2 — passthrough cru, ver nota de topo do arquivo original --
      control_stock: false,
      min_stock: null,
      las_price: 0,
      active_principle: null,
      financial_category_uuid: null,
      default_cost_center_uuid: null,
      default_warehouse_uuid: null,
      cultivation_uuid: null,
      quality: null,
      addressing_uuid: null,
      tax_rule_uuid: null,
      second_measurement_uuid: null,
      factor_type: null,
      factor: null,
      product_package_uuids: [],
      // -- Aba 3 "Fiscal" (~40 campos) — ZERO obrigatoriedade por `is_fiscal`.
      // `modality_bc`/`percent_reduction` partem de `0` (colunas físicas NOT
      // NULL, mesmo default do schema real) — nunca `null`.
      is_fiscal: false,
      allow_pointing: false,
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
      // C1 (D-101-19): colunas NULLABLE (nao entram no grupo NOT NULL default 0).
      mot_des_icms: null,
      perc_dif: null,
      perc_fcp: null,
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
    },
  });

  // Observados para habilitar/desabilitar Categoria/Classe (cascata) e para
  // o gate condicional de `ncm_uuid` (D8, "Produção").
  const groupValue = watch('group_uuid');
  const categoryValue = watch('category_uuid');
  const ncmRequiredForGroup = isProductionGroup(groupValue ?? undefined);

  // Presence-aware de `product_package_uuids` — substitui
  // `dirtyFields.product_package_uuids` (armadilha RHF 7.51.2 com array, ver
  // cabeçalho de `ProdutoEstoqueFinanceiroTab.tsx`).
  const [packageUuidsTouched, setPackageUuidsTouched] = useState(false);

  // Wizard de abas — `Tabs.Root` controlado, rodapé ÚNICO fora de
  // `Tabs.Content` (Voltar/Próximo nas abas 0/1, Salvar só na 2 "Fiscal").
  const [tabValue, setTabValue] = useState<ProductTabKey>('0');

  function fillForm(data: ProductData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      setPackageUuidsTouched(false);
      reset({
        description: data.description,
        measurement_uuid: { label: data.measurement.description, value: data.measurement.uuid },
        group_uuid: { label: data.group.description, value: data.group.uuid },
        category_uuid: { label: data.category.description, value: data.category.uuid },
        kind_uuid: data.kind ? { label: data.kind.description, value: data.kind.uuid } : null,
        is_enabled: !!data.is_enabled,
        is_equipment: !!data.is_equipment,
        has_lot: !!data.has_lot,
        ncm_uuid: data.ncm
          ? {
              label: data.ncm.code
                ? `${data.ncm.code} — ${data.ncm.description}`
                : data.ncm.description,
              value: data.ncm.uuid,
            }
          : null,
        control_stock: !!data.control_stock,
        min_stock: data.min_stock ?? null,
        las_price: Number(data.las_price ?? 0),
        active_principle: data.active_principle ?? null,
        financial_category_uuid: data.financial_category
          ? { label: data.financial_category.description, value: data.financial_category.uuid }
          : null,
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
        second_measurement_uuid: data.measurement_second
          ? { label: data.measurement_second.description, value: data.measurement_second.uuid }
          : null,
        factor_type: data.factor_type?.value ?? null,
        factor: data.factor ?? null,
        product_package_uuids: data.package_uuids ?? [],
        is_fiscal: !!data.is_fiscal,
        allow_pointing: !!data.allow_pointing,
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
        mot_des_icms: data.mot_des_icms ?? null,
        perc_dif: data.perc_dif ?? null,
        perc_fcp: data.perc_fcp ?? null,
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
      });
    }
  }

  // Guarda de fazenda ativa (`farm.context` ESTRITO, Product-contrato.md §8)
  // — a query de detalhe só dispara com `hasFarm`; cada caller decide o que
  // renderizar quando `isEditing && !hasFarm` (EmptyState na página cheia,
  // aviso inline no Modal).
  const productQuery = useProductForm({
    registrationId: isEditing ? productId : undefined,
    fillForm,
    enabled: hasFarm,
  });

  const isLoading = isEditing && hasFarm && checkLoadingStatus([productQuery as any]);
  const productData = productQuery.data;

  const productMutation = useRequest({
    asyncFunction: tryPersistProduct,
    entityName: text.singularLabel,
    queryKey: queryKey.products.productsList,
    queryKey2: queryKey.products.product,
    typesRequest: isEditing ? 'update' : 'create',
    // NOVO (mirror `useClientFormController`) — único ponto de orquestração
    // que muda entre página cheia e Modal: página cheia NÃO passa
    // `onPersisted` (preserva `navigate(-1)` 1:1); o `ProductFormModal` passa
    // `onPersisted` e fecha o modal + devolve uuid/label ao pai em vez de
    // navegar.
    actionSuccess: (data) => {
      if (onPersisted) {
        onPersisted(data);
      } else if (!isEditing && data?.is_equipment && data?.uuid && can('equipments_create')) {
        // UT-000781: produto NOVO marcado como equipamento segue para o
        // cadastro de inventário já com o produto pré-selecionado. `replace`
        // evita que o "Cancelar"/"Salvar" do inventário (navigate(-1)) volte
        // ao form de produto recém-salvo. Sem a permissão, mantém o fluxo
        // atual (navigate(-1)).
        navigate(`/cadastros-base/inventario/novo?product_uuid=${data.uuid}`, { replace: true });
      } else {
        navigate(-1);
      }
    },
  });

  async function tryPersistProduct(data: ProductFormType) {
    const payload: ProductPayload = {
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
      // C1 (D-101-19): oculto pelo CST => null; vazio nunca vira 0 (FCP 0 => null, P-F2).
      ...sanitizeC1ForCst(data.cst_csosn, {
        mot_des_icms: data.mot_des_icms,
        perc_dif: data.perc_dif,
        perc_fcp: data.perc_fcp,
      }),
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

    const isProductionGroupSelected = isProductionGroup(data.group_uuid ?? undefined);
    if (!isEditing) {
      if (isProductionGroupSelected) {
        payload.product_package_uuids = data.product_package_uuids ?? [];
      }
    } else if (packageUuidsTouched) {
      payload.product_package_uuids = data.product_package_uuids ?? [];
    }

    try {
      if (isEditing && productId) {
        return await updateProduct(productId, payload);
      }
      return await createProduct(payload);
    } catch (error) {
      // 422 flat por campo (mot_des_icms/perc_dif/perc_fcp e demais): a mensagem pt-BR da API
      // aparece no campo; o `throw` preserva o toast generico do useRequest.
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messagesForField]) => {
          if (field in FIELD_TAB_MAP && messagesForField?.[0]) {
            setError(field as keyof ProductFormType, {
              type: 'server',
              message: messagesForField[0],
            });
          }
        });
      }
      throw error;
    }
  }

  async function onSubmit(data: ProductFormType) {
    if (isEditing && !isEmpty(dirtyFields) && !packageUuidsTouched) {
      if (!onPersisted) navigate(-1);
      return;
    }
    await productMutation.mutateAsync(data);
  }

  function onInvalid(formErrors: FieldErrors<ProductFormType>) {
    const erroredFieldNames = Object.keys(formErrors) as (keyof ProductFormType)[];
    if (erroredFieldNames.length === 0) return;

    const erroredTab = erroredFieldNames
      .map((field) => FIELD_TAB_MAP[field])
      .find((tab): tab is ProductTabKey => !!tab && tab !== tabValue);

    if (erroredTab) {
      setTabValue(erroredTab);
    }

    toaster.error({
      title: isEditing ? text.form.title.edit : text.form.title.create,
      description: erroredTab
        ? text.form.errors.invalidFieldsOtherTab
        : text.form.errors.invalidFieldsCurrentTab,
      duration: 6000,
    });
  }

  async function handleNext() {
    if (tabValue === '2') {
      await handleSubmit(onSubmit, onInvalid)();
      return;
    }
    const valid = await trigger(TAB_FIELDS[tabValue] as any);
    if (!valid) return;
    setTabValue(tabValue === '0' ? '1' : '2');
  }

  function handleBack() {
    if (tabValue === '2') setTabValue('1');
    else if (tabValue === '1') setTabValue('0');
  }

  const isSubmitting = productMutation.isPending;

  return {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    errors,
    dirtyFields,
    groupValue,
    categoryValue,
    ncmRequiredForGroup,
    packageUuidsTouched,
    setPackageUuidsTouched,
    tabValue,
    setTabValue,
    onSubmit,
    onInvalid,
    handleNext,
    handleBack,
    isSubmitting,
    isLoading,
    productData,
    hasFarm,
    canSave,
    xmlNcmHintLabel,
  };
}

export { TAB_FIELDS, FIELD_TAB_MAP };
