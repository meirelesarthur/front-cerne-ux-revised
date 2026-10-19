// src/pages/Fiscal/NfeEmitidas/NfeItemsTab.tsx
// -----------------------------------------------------------------------------
// Aba "Itens & Totais" do formulário de NFe Emitida — TASK-FE-036-405.
// Repetidor de itens (`useFieldArray`, mirror `InvoiceItemsTab.tsx`) com o
// bloco fiscal denso (CFOP/CST/PIS/COFINS/IPI/CEST) + "Reforma Tributária"
// (IBS/CBS/IS) dentro de UM ÚNICO toggle/accordion "Dados Fiscais"
// (`CollapsibleSection`, mirror `InvoiceItemEquipmentPanel.tsx`, "hook por
// linha = componente por linha" para o estado local de expandir/ocultar) —
// REWORK D7 (correcoes-e2e-rodada-1, `MAPA-nfe-form-behavior.md` §D7,
// img18-21): o legado (`_card-item.blade.php:117-193`) tem 1 único
// `<div class="collapse">` "Dados Fiscais" envolvendo AMBOS os blocos; a
// Reforma Tributária NÃO tem toggle próprio, só um `<hr>` + título dentro do
// MESMO corpo colapsável. Antes desta correção, "Reforma Tributária" era um
// 2º accordion independente (divergência da hierarquia do legado) — fechada
// aqui. + bloco "Totais" com o cálculo CORRIGIDO (fecha GAP-036-402,
// contrato de tela §4.3/§6.3):
//
//   total_products (preview) = Σ (item.quantity × item.amount)
//   discount (cabeçalho, DERIVADO, InputReadOnly) = Σ (item.discount)
//   amount / total (preview) = total_products + shipping_value + added_value
//                               − discount
//
// `shipping_value`/`added_value` são `NumberInput` EDITÁVEIS neste bloco
// (campos do cabeçalho real, `NfeData.shipping_value`/`added_value`),
// recalculando `amount` a cada alteração, SEM debounce — IDÊNTICO em
// criação e edição (nenhuma ramificação, decisão do dono/GAP-036-402).
//
// Nomes de coluna fiscal 1:1 confirmados por leitura direta de
// `NfeRequest::rules()`/`NfeItemData`/`ItemNfeResource` (Lacuna do contrato
// de tela §16 do contrato de API, FECHADA por esta Tarefa) — nenhum nome
// inventado.
//
// REWORK DE FIDELIDADE pós-homologação (`audit-nfe-emitidas.md`, Grupo A):
// `cst_csosn`/`cst_csosn_exp`/`cst_pis`/`cst_cofins`/`cst_ipi`/`cenq_ipi`/
// `modality_bc`/`origem`/`cst_ibs_cbs`/`tp_cred_pres_ibs_zfm`/`ind_doacao`
// viraram `Select` catalogado (mirror `App\Product::listaCST*`/`origens()`,
// catálogos estáticos hardcoded, `nfe-fiscal-catalogs.ts`, `renderSelectField`
// abaixo) — eram `Input`/`NumberInput` livres. `quantity`(4 casas)/
// `amount`(6 casas) e os 13 campos percentuais de Reforma Tributária
// (4 casas, decisão do dono — diverge do `percentage` 2 casas do legado,
// campos novos sem equivalente legado) ganharam a precisão correta.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, Flex, Icon, IconButton, SimpleGrid, Text, useDisclosure } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi';

import { ProductFormModal } from '@/pages/CadastrosBase/Produtos/Catalogo/ProductFormModal';
import { usePackageOptionsList } from '@/pages/CadastrosBase/Produtos/Catalogo/useProducts';

import { Button } from '@/components/Button';
import { CollapsibleSection } from '@/components/Form/CollapsibleSection';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { columnsForm } from '@/constants/coluns-form';
import {
  isMotDesIcmsVisible,
  isPercDifVisible,
  isPercFcpVisible,
  isPercIpiDevolVisible,
  normalizePercFcp,
  sanitizeC1ForCst,
} from '@/constants/Fiscal/fiscal-field-visibility';
import { getMotDesIcmsOptions } from '@/constants/Fiscal/mot-des-icms-catalog';
import {
  nfeCenqIpiOptions,
  nfeCstCsosnOptions,
  nfeCstIbsCbsOptions,
  nfeCstIpiOptions,
  nfeCstPisCofinsOptions,
  nfeIndDoacaoOptions,
  nfeModalidadeBcOptions,
  nfeOrigemOptions,
  nfeTpCredPresIbsZfmOptions,
  nfeTypePaymentOptions,
} from '@/constants/Fiscal/nfe-fiscal-catalogs';
import { queryKey } from '@/constants/query-key';

import { isProductionGroup } from '@/validations/schemas/CadastrosBase/product-schema';
import { NFE_FINNFE_DEVOLUCAO } from '@/validations/schemas/Nfes/nfe-schema';

import { listAdditionalInfos } from '@/services/v2/AdditionalInfo/additional-info-service';
import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import {
  getProduct,
  getProductWarehouses,
  listProductOptions,
} from '@/services/v2/Products/product-service';

import type { Option } from '@/@types/option';
import type { AdditionalInfoListItem } from '@/@types/v2/AdditionalInfo';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { NatureOperationData } from '@/@types/v2/NatureOperations';
import type { NfeForm, NfeItemForm } from '@/@types/v2/Nfes';
import type { PackageOption } from '@/@types/v2/Packages';
import type { ProductData, ProductOption } from '@/@types/v2/Products';
import type { WarehouseWithStock } from '@/@types/v2/Warehouses';

import { applyNatureCfopToAllItems, applyNatureOverwriteToAllItems } from './nfe-nature-cascade';

import type {
  Control,
  FieldErrors,
  UseFormClearErrors,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';

export interface NfeItemsTabProps {
  control: Control<NfeForm>;
  errors: FieldErrors<NfeForm>;
  watch: UseFormWatch<NfeForm>;
  setValue: UseFormSetValue<NfeForm>;
  // D-101-15 — opcional: limpa erros obsoletos dos campos preenchidos pela cascata Produto→item.
  clearErrors?: UseFormClearErrors<NfeForm>;
  isLoading: boolean;
  canSave: boolean;
  // REWORK DE FIDELIDADE (E2E do dono, esteira 036fix5, item 6) — "Info.
  // Complementares" preenche Observações (mirror `_forms.blade.php:
  // 152,331-342`); estado/handler continuam no form RAIZ
  // (`CreateOrUpdateNfe.tsx`, cascata da Natureza — NFE-R2-008), só a
  // renderização do Select migrou para dentro do bloco "Totais" aqui.
  additionalInfoOption: Option<string> | null;
  onAdditionalInfoChange: (option: Option<string> | null) => void;
  // TASK-FE-036-D6/GAP-FE-036-237/DEC-122 — Natureza JÁ resolvida pelo form
  // raiz (`CreateOrUpdateNfe.tsx`, `natureOperationDetailQuery`), reaproveitada
  // aqui pela cascata Produto→item (evita 2º `GET /nature-operations/{uuid}`
  // redundante por linha de item).
  natureOperationData: NatureOperationData | null;
  // UT-000715 / TASK-FE-715-03 (L-3) — opt-in: itens injetados por handoff ANTES do mount
  // das linhas disparam a cascata fiscal do Produto no 1º render (default false = inalterado).
  cascadeOnMount?: boolean;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formata `size` (Embalagem) com 2 casas pt-BR — TASK-FE-036-B17-1, MESMO
 * formatador já usado pela listagem de Embalagens (`Embalagens/index.tsx`,
 * coluna `size`), nenhum formato novo inventado.
 * @param {number} value - `size` bruto da Embalagem (decimal(8,2), chega
 * como number do backend).
 * @return {string} `size` formatado, ex. "12,50".
 */
export function formatSize(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Formata `quantity` (4 casas pt-BR) — TASK-FE-036-B17-2, MESMO formatador já
 * usado pela Visualização desta MESMA tela (`NfeDetalhe.tsx#formatQuantity`,
 * mirror `_card-item.blade.php:90`, `money($transferItem->quantity, 4)`).
 * Reaproveitado no rótulo do Select síncrono de Armazém
 * (`{description} Qtde: {formatQuantity(quantity)}`).
 * @param {number} value - `quantity` bruto do estoque do armazém.
 * @return {string} `quantity` formatado, ex. "12,5000".
 */
function formatQuantity(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

/**
 * Σ (item.quantity × item.amount) — mirror `computeVlItems` (Invoices),
 * fonte ÚNICA do preview `total_products` (sem 2ª fórmula divergente).
 * @param {NfeItemForm[]} items - Itens do form (`watch('items')`).
 * @return {number} `total_products` calculado no client (preview).
 */
function computeTotalProducts(items: NfeItemForm[]): number {
  return items.reduce((total, item) => {
    const quantity = Number(item?.quantity) || 0;
    const amount = Number(item?.amount) || 0;
    return total + quantity * amount;
  }, 0);
}

/**
 * Σ (item.discount) — `discount` do cabeçalho é DERIVADO, nunca editável
 * diretamente (contrato de tela §4.3, decisão do dono — diverge do molde
 * `Invoices`, onde `vl_discount` É editável).
 * @param {NfeItemForm[]} items - Itens do form (`watch('items')`).
 * @return {number} `discount` do cabeçalho calculado no client.
 */
function computeHeaderDiscount(items: NfeItemForm[]): number {
  return items.reduce((total, item) => total + (Number(item?.discount) || 0), 0);
}

// Exportado (exec-038, TASK-FE-3006/handoff Baixa→Nfe) — `CreateOrUpdateNfe.
// tsx` reusa o MESMO baseline de campos ao montar `items[]` a partir do
// rascunho `GET /stock-writeoffs/{uuid}/nfe-draft`, em vez de duplicar a
// lista de ~50 campos com seus defaults aqui.
export const emptyNfeItem: NfeItemForm = {
  product_uuid: null,
  quantity: null,
  amount: null,
  product_measurement_label: null,
  package_uuid: null,
  area_uuid: null,
  warehouse_uuid: null,
  discount: 0,
  order_item: null,
  cfop: null,
  cfop_saida_interno: null,
  cfop_saida_externo: null,
  cst_csosn: null,
  cst_csosn_exp: null,
  cst_pis: null,
  cst_cofins: null,
  cst_ipi: null,
  // Default legado '999' (`_card-item.blade.php:149`, `App\Product::
  // listaCenqIPI()` — "999 - Outros - Tributação normal IPI").
  cenq_ipi: '999',
  perc_icms: null,
  perc_pis: null,
  perc_cofins: null,
  perc_ipi: null,
  cest: null,
  barcode: null,
  percent_reduction: null,
  mot_des_icms: null,
  perc_dif: null,
  perc_fcp: null,
  perc_ipi_devol: null,
  modality_bc: null,
  origem: null,
  reference: null,
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
  ind_doacao: null,
  ref_access_key: null,
  ref_item_number: null,
};

export function NfeItemsTab({
  control,
  errors,
  watch,
  setValue,
  clearErrors,
  isLoading,
  canSave,
  additionalInfoOption,
  onAdditionalInfoChange,
  natureOperationData,
  cascadeOnMount = false,
}: NfeItemsTabProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.nfes.nfe.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const isDisabled = !canSave || isLoading;

  // TASK-FE-036-B17-1 — 1 fetch de Embalagens POR TELA (nunca por linha),
  // MESMO racional já usado por `natureOperationData` (D6): reusa 1:1 o
  // hook já aprovado do cadastro de Produtos (`usePackageOptionsList`,
  // MESMA `queryKey.packages.options`/`staleTime`, invalidado pelas 3
  // mutations de Package) em vez de reimplementar a mesma query aqui —
  // subido para este componente pai e repassado por prop a `NfeItemRow`.
  const { hasFarm } = usePermissions();
  const packageOptionsQuery = usePackageOptionsList(hasFarm);
  const packageOptions = packageOptionsQuery.data ?? [];

  const watchedItems = watch('items') ?? [];
  const totalProducts = computeTotalProducts(watchedItems);
  const shippingValue = Number(watch('shipping_value')) || 0;
  const addedValue = Number(watch('added_value')) || 0;
  const headerDiscount = computeHeaderDiscount(watchedItems);
  // Fórmula ÚNICA (contrato de tela §4.3, GAP-036-402 fechado) — IDÊNTICA em
  // criação e edição, sem ramificação.
  const amount = totalProducts + shippingValue + addedValue - headerDiscount;

  const arrayError = errors.items?.message as string | undefined;

  // Mantém `discount` (cabeçalho, DERIVADO) sincronizado no form raiz — a
  // chave em `itemsDiscountKey` evita loop (só reage quando a SOMA muda de
  // verdade, mirror `apportionmentItemsKey` de `CreateOrUpdateInvoice.tsx`).
  const itemsDiscountKey = JSON.stringify(watchedItems.map((item) => item?.discount ?? 0));
  useEffect(() => {
    setValue('discount', headerDiscount, { shouldValidate: false });
  }, [itemsDiscountKey]);

  function handleAdd() {
    append({ ...emptyNfeItem });
  }

  return (
    <Box pt={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={2}>
        {formText.tabs.items}
      </Text>

      {arrayError && (
        <Text fontSize="xs" color="fg.error" mb={2}>
          {arrayError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {formText.itemRow.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <NfeItemRow
              key={field.id}
              index={index}
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              clearErrors={clearErrors}
              natureOperationData={natureOperationData}
              cascadeOnMount={cascadeOnMount}
              packageOptions={packageOptions}
              isDisabled={isDisabled}
              onRemove={() => remove(index)}
            />
          ))}
        </Flex>
      )}

      <Button
        title={formText.itemRow.addButton}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={isDisabled}
      />

      {/* ---- Bloco "Totais" ----
          REWORK DE FIDELIDADE (E2E do dono, esteira 036fix5, item 6) —
          mirror `_forms.blade.php:133-159` (`painel-footer`): Total de
          produtos | Acréscimo | Desconto | Total da NFe | Tipo de
          Pagamento, depois Info. Complementares + Observações no MESMO
          bloco. "Valor do Frete" NÃO fica mais aqui (duplicado — pertence
          à seção Frete do cabeçalho, `CreateOrUpdateNfe.tsx`); o cálculo
          abaixo continua lendo `watch('shipping_value')` do MESMO form
          raiz, então o Total da NFe não muda de fórmula. */}
      <Box mt={8} pt={4} borderTop="1px solid" borderColor="border.subtle">
        <Text fontSize="sm" fontWeight="semibold" mb={4}>
          {formText.sections.totals}
        </Text>

        <SimpleGrid columns={columnsForm.default} gap={6}>
          <InputReadOnly
            label={formText.totalsFields.totalProducts}
            value={formatCurrencyBRL(totalProducts)}
          />

          <Controller
            name="added_value"
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={formText.totalsFields.addedValue}
                allowDot
                decimalPlaces={2}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                disabled={isDisabled}
              />
            )}
          />

          <InputReadOnly
            label={formText.totalsFields.discount}
            value={formatCurrencyBRL(headerDiscount)}
          />

          <Box
            key={`nfe-amount-${amount}`}
            css={{
              animation: 'nfeTotalFlash 0.3s ease',
              '@keyframes nfeTotalFlash': {
                '0%': { backgroundColor: 'var(--chakra-colors-green-100)' },
                '100%': { backgroundColor: 'transparent' },
              },
            }}
            borderRadius="md"
          >
            <InputReadOnly label={formText.totalsFields.amount} value={formatCurrencyBRL(amount)} />
          </Box>

          <Controller
            name="type_payment"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={formText.fields.typePayment}
                name={name}
                value={nfeTypePaymentOptions.find((option) => option.value === value) ?? null}
                onChange={(option: Option<string> | null) => onChange(option?.value ?? null)}
                options={nfeTypePaymentOptions}
                error={errors.type_payment?.message}
                isRequired
                noClearable
                isDisabled={isDisabled}
              />
            )}
          />

          {/* NFE-R2-008 (REAUDITORIA-036-2a-rodada.md) — "Info.
              Complementares", mirror `_forms.blade.php:152,331-342`. Campo
              AUXILIAR (não persistido — sem FK própria no `$fillable`
              real, ver `@/@types/v2/Nfes`): ao selecionar, preenche
              Observações com o texto da informação complementar; ao
              limpar, limpa Observações também. */}
          <SelectAsyncPaginate
            name="additional_info_uuid"
            label={formText.fields.additionalInfo}
            placeholder={formText.placeholders.additionalInfo}
            service={listAdditionalInfos}
            mapOptions={(item: AdditionalInfoListItem) => ({
              label: item.description,
              value: item.uuid,
            })}
            findParams={(search: string | { search: string }) => ({
              search: typeof search === 'string' ? search : search.search,
            })}
            value={additionalInfoOption ?? undefined}
            onChange={(option: any) => onAdditionalInfoChange(option ?? null)}
            isDisabled={isDisabled}
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </SimpleGrid>

        <Box mt={6} w="full">
          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <Textarea
                label={formText.fields.note}
                name={field.name}
                maxLength={1000}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                error={errors.note?.message}
                disabled={isDisabled}
              />
            )}
          />
        </Box>
      </Box>
    </Box>
  );
}

// -----------------------------------------------------------------------------
// Linha de item — componente próprio (1 componente por linha, mirror
// "hook por linha = componente por linha" — `useAuth`/estado local do bloco
// Reforma Tributária colapsável, sem violar Rules of Hooks).
// -----------------------------------------------------------------------------

interface NfeItemRowProps {
  index: number;
  control: Control<NfeForm>;
  errors: FieldErrors<NfeForm>;
  watch: UseFormWatch<NfeForm>;
  setValue: UseFormSetValue<NfeForm>;
  // D-101-15 — opcional: limpa erros obsoletos dos campos preenchidos pela cascata Produto→item.
  clearErrors?: UseFormClearErrors<NfeForm>;
  natureOperationData: NatureOperationData | null;
  // TASK-FE-036-B17-1 — lista de Embalagens do tenant, buscada 1x pelo
  // componente pai (`NfeItemsTab`) e repassada por prop (mesmo racional de
  // `natureOperationData`, D6) — NUNCA refetch por linha.
  packageOptions: PackageOption[];
  isDisabled: boolean;
  onRemove: () => void;
  cascadeOnMount: boolean;
}

const PRODUCT_CASCADE_FIELDS = [
  'ad_rem_cbs',
  'ad_rem_ibs',
  'barcode',
  'c_class_trib',
  'cbenef',
  'cenq_ipi',
  'cest',
  'cfop_saida_externo',
  'cfop_saida_interno',
  'cst_cofins',
  'cst_csosn',
  'cst_csosn_exp',
  'cst_ibs_cbs',
  'cst_ipi',
  'cst_is',
  'cst_pis',
  'ind_doacao',
  'modality_bc',
  'origem',
  'package_uuid',
  'perc_cbs',
  'perc_cofins',
  'perc_dif_cbs',
  'perc_dif_ibs_mun',
  'perc_dif_ibs_uf',
  'perc_ibs_mun',
  'perc_ibs_uf',
  'perc_icms',
  'perc_ipi',
  'perc_is',
  'perc_is_espec',
  'perc_pis',
  'perc_reducao_aliq_cbs',
  'perc_reducao_aliq_ibs_mun',
  'perc_reducao_aliq_ibs_uf',
  'percent_reduction',
  'mot_des_icms',
  'perc_dif',
  'perc_fcp',
  'reference',
  'tp_cred_pres_ibs_zfm',
] as const satisfies readonly (keyof NfeItemForm)[];

function NfeItemRow({
  index,
  control,
  errors,
  watch,
  setValue,
  clearErrors,
  natureOperationData,
  packageOptions,
  isDisabled,
  onRemove,
  cascadeOnMount,
}: NfeItemRowProps) {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const { can } = usePermissions();
  const formText = languageGB.nfes.nfe.form;

  // ---- TASK-FE-036-D6/GAP-FE-036-237/DEC-122 — Produto → cascata fiscal do
  // item -----------------------------------------------------------------
  // Mirror EXATO do padrão já usado pela cascata Natureza→itens
  // (`CreateOrUpdateNfe.tsx`, `previousNaturezaUuidRef`): 1 `useQuery` por
  // linha busca o Produto selecionado, e 1 `useEffect` com ref de "último
  // Produto aplicado" garante que a cascata só dispare em troca REAL do
  // usuário, nunca na hidratação inicial de edição/duplicação (o ref é
  // inicializado com o valor JÁ presente no 1º render).
  const productUuid = watch(`items.${index}.product_uuid`)?.value;

  const productDetailQuery = useQuery({
    queryKey: [queryKey.products.product, productUuid],
    queryFn: async () => {
      if (!productUuid) return null;
      const response = await getProduct(productUuid);
      return response.data;
    },
    enabled: !!productUuid,
  });

  const productData = productDetailQuery.data as ProductData | null | undefined;

  // TASK-FE-036-B17-2 — Armazém filtrado por Produto, com saldo exibido
  // (`GET /products/{uuid}/warehouses`, TASK-BE-036-B17 Entrega 1). Mirror
  // EXATO do racional de `productDetailQuery` acima (1 `useQuery` POR LINHA,
  // `enabled: !!productUuid`) — sem Produto selecionado, lista vazia +
  // campo desabilitado (DoD).
  const productWarehousesQuery = useQuery({
    queryKey: [queryKey.warehouses.list, 'by-product', productUuid],
    queryFn: async () => {
      if (!productUuid) return [];
      const response = await getProductWarehouses(productUuid);
      return response.data;
    },
    enabled: !!productUuid,
  });

  const productWarehouses = (productWarehousesQuery.data ?? []) as WarehouseWithStock[];

  // Opção sintética no topo, mirror legado (Regra E.6 — armazém NÃO
  // obrigatório): "Sem Estoque" é uma opção SELECIONÁVEL de valor vazio,
  // NUNCA um placeholder desabilitado. Sem Produto selecionado: lista
  // VAZIA (nem a opção sintética), campo desabilitado (DoD).
  const warehouseSelectOptions: Option<string>[] = productUuid
    ? [
        { label: formText.placeholders.noStock, value: '' },
        ...productWarehouses.map((warehouse) => ({
          label: `${warehouse.description} Qtde: ${formatQuantity(warehouse.quantity)}`,
          value: warehouse.uuid,
        })),
      ]
    : [];

  // TASK-FE-036-B17-1 — Embalagem só é OFERECIDA quando o Produto pertence
  // ao grupo "Produção" (mirror `group_id == 8` hardcoded do legado,
  // `_forms.blade.php:504-538`), com as opções restritas às vinculadas ao
  // Produto (`productData.package_uuids`) e rótulo `{description} - {size}`.
  // `isProductionGroup()` é a MESMA função já aprovada em Produtos — nenhuma
  // duplicação da string 'Produção'. Sem Produto selecionado/carregado ainda
  // → desabilitado, lista vazia (mesmo tratamento de "fora do grupo").
  const isPackagingEnabled = isProductionGroup({ label: productData?.group?.description });
  const packageSelectOptions = productData
    ? packageOptions
        .filter((pkg) => productData.package_uuids?.includes(pkg.uuid))
        .map((pkg) => ({
          label: `${pkg.description} - ${formatSize(pkg.size)}`,
          value: pkg.uuid,
        }))
    : [];

  // UT-000715 (L-3): com `cascadeOnMount` o ref nasce `undefined` e a cascata roda no mount.
  const previousProductUuidRef = useRef<string | undefined>(
    cascadeOnMount ? undefined : productUuid
  );
  useEffect(() => {
    if (!productUuid || !productData) return;
    if (previousProductUuidRef.current === productUuid) return;
    previousProductUuidRef.current = productUuid;

    // 0) Unidade (TASK-FE-036-B17-2) — DISPLAY-ONLY, mirror legado `.um[]`
    // readonly, NUNCA persistida (ver `NfeItemForm.product_measurement_label`).
    setValue(
      `items.${index}.product_measurement_label`,
      productData.measurement?.description ?? null,
      { shouldValidate: false }
    );
    // Armazém (TASK-FE-036-B17-2, mirror GAP 8 "limpar armazém anterior") —
    // troca de Produto limpa a seleção anterior; a lista filtrada
    // (`warehouseSelectOptions`, acima) já reflete o Produto novo assim que
    // `productWarehousesQuery` resolver.
    setValue(`items.${index}.warehouse_uuid`, null, { shouldValidate: false });

    // 1) Mapeamento Produto → item (TASK-FE-036-D6, tabela completa —
    // `u_trib_is` NÃO copiado, defeito legado conhecido/FORA de escopo).
    // Fallback `?? 0` nos percentuais/`ad_rem_*` nulos (MAPA §D6, "0,00" em
    // vez de vazio).
    setValue(`items.${index}.cfop_saida_interno`, productData.cfop_saida_interno, {
      shouldValidate: false,
    });
    setValue(`items.${index}.cfop_saida_externo`, productData.cfop_saida_externo, {
      shouldValidate: false,
    });
    setValue(`items.${index}.cst_csosn`, productData.cst_csosn, { shouldValidate: false });
    setValue(`items.${index}.cst_csosn_exp`, productData.cst_csosn_exp, { shouldValidate: false });
    setValue(`items.${index}.cst_pis`, productData.cst_pis, { shouldValidate: false });
    setValue(`items.${index}.cst_cofins`, productData.cst_cofins, { shouldValidate: false });
    setValue(`items.${index}.cst_ipi`, productData.cst_ipi, { shouldValidate: false });
    setValue(`items.${index}.cenq_ipi`, productData.cenq_ipi, { shouldValidate: false });
    setValue(`items.${index}.perc_icms`, productData.perc_icms ?? 0, { shouldValidate: false });
    setValue(`items.${index}.perc_pis`, productData.perc_pis ?? 0, { shouldValidate: false });
    setValue(`items.${index}.perc_cofins`, productData.perc_cofins ?? 0, {
      shouldValidate: false,
    });
    setValue(`items.${index}.perc_ipi`, productData.perc_ipi ?? 0, { shouldValidate: false });
    // `origem` — Produto expõe `number` (coluna inteira); o item/Natureza usam
    // a STRING crua (`nfeOrigemOptions`, mesmo Select catalogado) — conversão
    // explícita, nenhum contrato novo.
    setValue(
      `items.${index}.origem`,
      productData.origem !== null && productData.origem !== undefined
        ? String(productData.origem)
        : null,
      { shouldValidate: false }
    );
    setValue(`items.${index}.cest`, productData.cest, { shouldValidate: false });
    setValue(`items.${index}.reference`, productData.reference, { shouldValidate: false });
    setValue(`items.${index}.barcode`, productData.barcode, { shouldValidate: false });
    setValue(`items.${index}.percent_reduction`, productData.percent_reduction ?? 0, {
      shouldValidate: false,
    });
    // C1 (D-101-19) — cascata Produto -> item igual a `percent_reduction`, filtrada pelo CST
    // do produto (CST sem grupo => null).
    const productC1 = sanitizeC1ForCst(productData.cst_csosn, {
      mot_des_icms: productData.mot_des_icms,
      perc_dif: productData.perc_dif,
      perc_fcp: productData.perc_fcp,
    });
    setValue(`items.${index}.mot_des_icms`, productC1.mot_des_icms, { shouldValidate: false });
    setValue(`items.${index}.perc_dif`, productC1.perc_dif, { shouldValidate: false });
    setValue(`items.${index}.perc_fcp`, productC1.perc_fcp, { shouldValidate: false });
    setValue(`items.${index}.modality_bc`, productData.modality_bc, { shouldValidate: false });
    setValue(`items.${index}.cbenef`, productData.cbenef, { shouldValidate: false });
    setValue(`items.${index}.c_class_trib`, productData.c_class_trib, { shouldValidate: false });
    setValue(`items.${index}.cst_ibs_cbs`, productData.cst_ibs_cbs, { shouldValidate: false });
    setValue(`items.${index}.perc_ibs_uf`, productData.perc_ibs_uf ?? 0, {
      shouldValidate: false,
    });
    setValue(`items.${index}.perc_ibs_mun`, productData.perc_ibs_mun ?? 0, {
      shouldValidate: false,
    });
    setValue(`items.${index}.perc_reducao_aliq_ibs_uf`, productData.perc_reducao_aliq_ibs_uf ?? 0, {
      shouldValidate: false,
    });
    setValue(
      `items.${index}.perc_reducao_aliq_ibs_mun`,
      productData.perc_reducao_aliq_ibs_mun ?? 0,
      { shouldValidate: false }
    );
    setValue(`items.${index}.perc_dif_ibs_uf`, productData.perc_dif_ibs_uf ?? 0, {
      shouldValidate: false,
    });
    setValue(`items.${index}.perc_dif_ibs_mun`, productData.perc_dif_ibs_mun ?? 0, {
      shouldValidate: false,
    });
    setValue(`items.${index}.perc_cbs`, productData.perc_cbs ?? 0, { shouldValidate: false });
    setValue(`items.${index}.perc_reducao_aliq_cbs`, productData.perc_reducao_aliq_cbs ?? 0, {
      shouldValidate: false,
    });
    setValue(`items.${index}.perc_dif_cbs`, productData.perc_dif_cbs ?? 0, {
      shouldValidate: false,
    });
    setValue(`items.${index}.cst_is`, productData.cst_is, { shouldValidate: false });
    setValue(`items.${index}.perc_is`, productData.perc_is ?? 0, { shouldValidate: false });
    setValue(`items.${index}.perc_is_espec`, productData.perc_is_espec ?? 0, {
      shouldValidate: false,
    });
    // `u_trib_is` — NÃO copiado (defeito legado conhecido, sem controle
    // correspondente na tela nova, ver Gap/MAPA §D6 "POSSÍVEL DEFEITO LEGADO").
    setValue(`items.${index}.ad_rem_ibs`, productData.ad_rem_ibs ?? 0, { shouldValidate: false });
    setValue(`items.${index}.ad_rem_cbs`, productData.ad_rem_cbs ?? 0, { shouldValidate: false });
    setValue(`items.${index}.tp_cred_pres_ibs_zfm`, productData.tp_cred_pres_ibs_zfm, {
      shouldValidate: false,
    });
    // `ind_doacao` — Produto expõe `boolean`; item/Natureza usam a mesma
    // conversão '1'/'' já usada na cascata Natureza.
    setValue(`items.${index}.ind_doacao`, productData.ind_doacao ? '1' : '', {
      shouldValidate: false,
    });

    // 1.1) Embalagem (TASK-FE-036-B17-1) — fora do grupo "Produção" → limpa
    // sempre. Dentro do grupo, mas a embalagem atual não pertence mais a
    // `productData.package_uuids` (troca de Produto) → limpa também (mirror
    // GAP 8, "limpar embalagem anterior"). Dentro do grupo E ainda vinculada
    // → preserva (nenhum valor forçado, só passa a permitir seleção — a
    // lista de opções já vem filtrada no render, ver `packageSelectOptions`).
    const isPackagingEnabledForProduct = isProductionGroup({
      label: productData.group?.description,
    });
    if (!isPackagingEnabledForProduct) {
      setValue(`items.${index}.package_uuid`, null, { shouldValidate: false });
    } else {
      const currentPackageUuid = watch(`items.${index}.package_uuid`)?.value;
      if (currentPackageUuid && !productData.package_uuids?.includes(currentPackageUuid)) {
        setValue(`items.${index}.package_uuid`, null, { shouldValidate: false });
      }
    }

    // 2) Precedência Natureza × Produto (MAPA §D6, DEC-122) — reaplicada
    // IMEDIATAMENTE após copiar do Produto, a TODOS os itens (mirror
    // `.trigger('change')` global do legado, não só este item):
    //   - CFOP: sem efeito se `sobrescreve_cfop_produto`/`overwrite_product`
    //     estiverem desligados (o CFOP do Produto, já aplicado acima,
    //     PREVALECE);
    //   - demais ~24 campos: sem efeito se `overwrite_product` estiver
    //     desligado (o restante do Produto, já aplicado acima, PREVALECE).
    if (natureOperationData) {
      const currentTipo = watch('tipo');
      const currentItems = watch('items') ?? [];
      applyNatureCfopToAllItems(natureOperationData, currentTipo, currentItems, setValue);
      applyNatureOverwriteToAllItems(natureOperationData, currentItems, setValue);
    }

    // 3) D-101-15 — `setValue` acima usa `shouldValidate:false`; erro pré-existente
    // (ex.: "must be a string type, but the final value was: null") ficaria obsoleto
    // com o campo já preenchido. `clearErrors` (e não `trigger`) limpa SÓ os campos
    // que a cascata preencheu com valor real do item, sem disparar validação nova em
    // campos que o usuário ainda não tocou; campo que segue vazio mantém o erro.
    if (clearErrors) {
      const filled = PRODUCT_CASCADE_FIELDS.filter((field) => {
        const value = watch(`items.${index}.${field}`);
        return value !== null && value !== undefined && value !== '';
      }).map((field) => `items.${index}.${field}` as const);
      if (filled.length > 0) clearErrors(filled);
    }
  }, [productDetailQuery.data, productUuid, natureOperationData, index, setValue, watch]);

  // TASK-FE-036-B16 — botão criar/editar Produto ao lado do select do item
  // (mirror legado `_card-item.blade.php`, que tem esse botão junto do
  // select de Produto). 1 disclosure/cache-key POR LINHA (não no form-pai,
  // `CreateOrUpdateNfe.tsx`) — mesmo racional de "hook por linha = estado
  // por linha" já usado pela seção Reforma Tributária colapsável desta MESMA
  // linha: cada item do array tem seu PRÓPRIO produto, então seu PRÓPRIO
  // modal/disclosure, sem prop-drilling desde o form raiz.
  const productModalDisclosure = useDisclosure();
  const [productOptionsCacheKey, setProductOptionsCacheKey] = useState(0);

  const rowErrors = errors.items?.[index];

  // UT-000776 / T-776-FE-04 (P-11) — referência por item só em devolução;
  // ao entrar em devolução a chave do item nasce com `ref_nfe` do cabeçalho
  // se estiver vazia (nunca sobrescreve valor já presente).
  const isDevolucao = Number(watch('finnfe')) === NFE_FINNFE_DEVOLUCAO;
  // C1: visibilidade dos campos pelo CST do proprio item (helper unico) e finnfe=4 (05b).
  const watchedItemCst = watch(`items.${index}.cst_csosn`);
  const showMotDesIcms = isMotDesIcmsVisible(watchedItemCst);
  const showPercDif = isPercDifVisible(watchedItemCst);
  const showPercFcp = isPercFcpVisible(watchedItemCst);
  const motDesIcmsOptions = getMotDesIcmsOptions(watchedItemCst);
  const showPercIpiDevol = isPercIpiDevolVisible(watch('finnfe'));
  const itemPercIpiDevol = watch(`items.${index}.perc_ipi_devol`);
  useEffect(() => {
    // Saiu de devolucao (finnfe != 4): o valor oculto e limpo (e nem vai no payload).
    if (!showPercIpiDevol && itemPercIpiDevol != null) {
      setValue(`items.${index}.perc_ipi_devol`, null, { shouldDirty: true });
    }
  }, [showPercIpiDevol, itemPercIpiDevol, index, setValue]);

  // Troca de CST do item: zera o que deixa de pertencer ao novo CST.
  function applyC1ForCst(cst: string | null | undefined) {
    const clean = sanitizeC1ForCst(cst, {
      mot_des_icms: watch(`items.${index}.mot_des_icms`),
      perc_dif: watch(`items.${index}.perc_dif`),
      perc_fcp: watch(`items.${index}.perc_fcp`),
    });
    (Object.keys(clean) as (keyof typeof clean)[]).forEach((key) => {
      if ((watch(`items.${index}.${key}`) ?? null) !== clean[key]) {
        setValue(`items.${index}.${key}`, clean[key], { shouldDirty: true });
      }
    });
  }

  const headerRefNfe = (watch('ref_nfe') ?? '').trim();
  const itemRefAccessKey = watch(`items.${index}.ref_access_key`);
  useEffect(() => {
    if (!isDevolucao || !headerRefNfe || itemRefAccessKey) return;
    setValue(`items.${index}.ref_access_key`, headerRefNfe, { shouldDirty: true });
  }, [isDevolucao, headerRefNfe, itemRefAccessKey, index, setValue]);

  // `listAreas` exige `farm_uuid` (`AreaIndexRequest::rules()`, tenant-wide
  // sem esse filtro) — a fazenda ativa é injetada aqui via closure, mesmo
  // padrão de `InvoiceItemsTab.tsx#listAreasForActiveFarm`.
  function listAreasForActiveFarm(params: { search?: string; page?: number; per_page?: number }) {
    return listAreas({ ...params, farm_uuid: activeFarmUuid ?? '' });
  }

  // Correção NFE-R2-010 (REAUDITORIA-036-2a-rodada.md) — o legado só lista
  // produtos fiscais no select do item (`NfeController.php:246-258`,
  // `_card-item.blade.php:26-43`); a API (`NfeRequest.php:127-132`) já exige
  // produto fiscal no submit, mas o front consumia `listProducts` sem o
  // filtro, permitindo selecionar um produto não-fiscal e só descobrir o
  // 422 tarde.
  //
  // GAP-VENDAS-FE-07 (EST-03, execução 016, item 4) — trocado de `listProducts`
  // (CRUD `GET /products`, `ProductTenantScope` dava bypass TOTAL de tenant a
  // `Gestor_Plataf`) para `listProductOptions` (`GET /products/options`, lookup
  // JÁ estrito por tenant, mesmo endpoint usado por Contrato/RequestPurchase/
  // Apontamento). `is_fiscal` aqui é `boolean` (mesma convenção de
  // `protocol`/`supply_only` do lookup, NÃO a string 'true'/'false' do filtro
  // do CRUD) — fecha o 422 `items.0.product_uuid` que `Gestor_Plataf` via ao
  // selecionar produto de outro tenant só visível por causa do bypass do CRUD.
  function listFiscalProducts(params: { search?: string; page?: number; per_page?: number }) {
    return listProductOptions({ ...params, is_fiscal: true });
  }

  function renderTextField(name: keyof NfeItemForm, label: string, maxLength?: number) {
    return (
      <Controller
        key={name}
        name={`items.${index}.${name}` as const}
        control={control}
        render={({ field }) => (
          <Input
            label={label}
            name={field.name}
            maxLength={maxLength}
            value={(field.value as string) ?? ''}
            onChange={(e) => field.onChange(e.target.value)}
            disabled={isDisabled}
          />
        )}
      />
    );
  }

  function renderNumberField(
    name: keyof NfeItemForm,
    label: string,
    decimalPlaces = 2,
    extra?: { helperText?: string; max?: number; normalize?: (v: any) => any }
  ) {
    return (
      <Controller
        key={name}
        name={`items.${index}.${name}` as const}
        control={control}
        render={({ field }) => (
          <NumberInput
            name={field.name}
            label={label}
            allowDot
            decimalPlaces={decimalPlaces}
            value={(field.value as number) ?? null}
            onValueChange={(value) =>
              field.onChange(extra?.normalize ? extra.normalize(value) : value)
            }
            helperText={extra?.helperText}
            max={extra?.max}
            error={(rowErrors as any)?.[name]?.message as string | undefined}
            disabled={isDisabled}
          />
        )}
      />
    );
  }

  // Rework de fidelidade (audit-nfe-emitidas.md, Grupo A "Catálogos fiscais
  // como select") — mirror `App\Product::listaCST*`/`origens()`, catálogos
  // ESTÁTICOS (`nfe-fiscal-catalogs.ts`), sem endpoint novo. `isRequired`
  // reflete o schema (`nfe-schema.ts`) — os 7 catálogos que o legado torna
  // obrigatórios (`->required()`) usam a mesma prop aqui.
  function renderSelectField(
    name: keyof NfeItemForm,
    label: string,
    options: Option<any>[],
    isFieldRequired = false,
    extra?: { helperText?: string; onAfterChange?: (value: any) => void }
  ) {
    return (
      <Controller
        key={name}
        name={`items.${index}.${name}` as const}
        control={control}
        render={({ field: { name: fieldName, value, onChange } }) => (
          <Select
            label={label}
            name={fieldName}
            value={options.find((option) => option.value === value) ?? null}
            onChange={(option: Option<any> | null) => {
              onChange(option?.value ?? null);
              extra?.onAfterChange?.(option?.value ?? null);
            }}
            options={options}
            helperText={extra?.helperText}
            error={(rowErrors as any)?.[name]?.message as string | undefined}
            isRequired={isFieldRequired}
            isDisabled={isDisabled}
          />
        )}
      />
    );
  }

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      {/* ---- Produto & Quantidade ---- */}
      <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" mb={2}>
        {formText.sections.itemProductAndQuantity}
      </Text>
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name={`items.${index}.product_uuid`}
          control={control}
          render={({ field }) => (
            <>
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.product}
                placeholder={formText.placeholders.product}
                error={rowErrors?.product_uuid?.message as string | undefined}
                service={listFiscalProducts}
                mapOptions={(item: ProductOption) => ({
                  label: item.code ? `${item.code} — ${item.description}` : item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                // TASK-FE-036-B16 — força reler a página 1 depois de
                // criar/editar um produto pelo modal ao lado (mirror
                // EXATO do mecanismo já usado por Cliente em
                // `CreateOrUpdateNfe.tsx`/`CreateOrUpdateContratoVenda.tsx`).
                cacheUniqs={[productOptionsCacheKey]}
                // EST-07 — botão criar/editar Produto migrado do
                // `IconButton` avulso ao lado do select para o
                // `labelAction`, mirror EXATO do padrão `CreateOrUpdateNfe.tsx`.
                // Reusa 100% o `ProductFormModal` genérico.
                labelActionTooltip={
                  field.value ? formText.actions.editProductAria : formText.actions.addProductAria
                }
                labelAction={
                  <IconButton
                    aria-label={
                      field.value
                        ? formText.actions.editProductAria
                        : formText.actions.addProductAria
                    }
                    variant="ghost"
                    size="2xs"
                    minH="0"
                    h="20px"
                    w="20px"
                    minW="0"
                    p="0"
                    disabled={isDisabled || !(can('products_create') || can('products_edit'))}
                    onClick={productModalDisclosure.onOpen}
                  >
                    <Icon as={field.value ? FiEdit : FiPlus} boxSize="16px" color="primaryMain" />
                  </IconButton>
                }
              />

              <ProductFormModal
                isOpen={productModalDisclosure.open}
                onClose={productModalDisclosure.onClose}
                productUuid={field.value?.value}
                onSaved={(product) => {
                  field.onChange({ value: product.uuid, label: product.label });
                  setProductOptionsCacheKey((key) => key + 1);
                }}
              />
            </>
          )}
        />

        <Controller
          name={`items.${index}.package_uuid`}
          control={control}
          render={({ field }) => (
            // TASK-FE-036-B17-1 — trocado de `SelectAsyncPaginate` (listava
            // TODAS as embalagens do tenant, sempre habilitado) para `Select`
            // síncrono alimentado pela lista JÁ filtrada ao Produto
            // (`packageSelectOptions`, computado acima) — sem reintroduzir
            // paginação. `field.value` continua `Option<string> | null`
            // (mesmo shape de antes, mesmo mapeamento no submit,
            // `CreateOrUpdateNfe.tsx#package_uuid: item.package_uuid?.value`).
            <Select
              name={field.name}
              label={formText.fields.packageField}
              placeholder={formText.placeholders.packageField}
              options={packageSelectOptions}
              value={
                packageSelectOptions.find((option) => option.value === field.value?.value) ?? null
              }
              onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
              isDisabled={isDisabled || !isPackagingEnabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.area_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.fields.area}
              placeholder={formText.placeholders.area}
              service={listAreasForActiveFarm}
              mapOptions={(item: AreaListItem) => ({ label: item.description, value: item.uuid })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`items.${index}.warehouse_uuid`}
          control={control}
          render={({ field }) => (
            // TASK-FE-036-B17-2 — trocado de `SelectAsyncPaginate` (listava
            // TODOS os armazéns do tenant, sem saldo) para `Select` síncrono
            // alimentado por `productWarehousesQuery` (armazéns da fazenda
            // ativa COM linha de estoque para o Produto, `formatQuantity`
            // no rótulo). "Sem Estoque" (valor `''`) é opção SELECIONÁVEL,
            // mirror legado (Regra E.6 — armazém não obrigatório). Sem
            // Produto selecionado → lista vazia + desabilitado.
            <Select
              name={field.name}
              label={formText.fields.warehouse}
              placeholder={formText.placeholders.warehouse}
              options={warehouseSelectOptions}
              value={
                warehouseSelectOptions.find((option) => option.value === field.value?.value) ?? null
              }
              onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
              isDisabled={isDisabled || !productUuid}
            />
          )}
        />

        <Controller
          name={`items.${index}.quantity`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.quantity}
              allowDot
              // Mirror legado — moeda com 4 casas (`_card-item.blade.php:90`,
              // `money($transferItem->quantity, 4)`).
              decimalPlaces={4}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              error={rowErrors?.quantity?.message as string | undefined}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        {/* TASK-FE-036-B17-2 — Unidade do Produto, DISPLAY-ONLY (mirror
            legado `.um[]` readonly, NUNCA persistida), ao lado de
            Quantidade. Mesmo componente já usado para `total_amount`. */}
        <InputReadOnly
          label={formText.fields.measurement}
          value={watch(`items.${index}.product_measurement_label`) ?? ''}
        />

        <Controller
          name={`items.${index}.amount`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.amount}
              allowDot
              // Mirror legado — moeda com 6 casas (`_card-item.blade.php:96`,
              // `money($transferItem->amount, 6)`).
              decimalPlaces={6}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              error={rowErrors?.amount?.message as string | undefined}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.discount`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.discount}
              allowDot
              decimalPlaces={2}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.order_item`}
          control={control}
          render={({ field }) => (
            <Input
              label={formText.fields.orderItem}
              name={field.name}
              maxLength={20}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
              disabled={isDisabled}
            />
          )}
        />
      </SimpleGrid>

      {/* ---- Dados Fiscais — toggle/accordion ÚNICO (D7,
          correcoes-e2e-rodada-1, img18-21) ----
          REWORK DE FIDELIDADE — mirror `_card-item.blade.php:117-193`: o
          legado tem 1 único `<div class="collapse">` "Dados Fiscais"
          envolvendo TANTO o bloco fiscal clássico (CFOP/CST/PIS/COFINS/
          IPI/CEST) QUANTO a Reforma Tributária (IBS/CBS/IS) — a Reforma NÃO
          tem toggle próprio, só um `<hr>` + título separando as duas
          dentro do MESMO corpo colapsável (`MAPA-nfe-form-behavior.md`
          §D7). Antes desta correção, "Reforma Tributária" era um 2º
          `CollapsibleSection` independente — corrigido para ficar DENTRO do
          toggle "Dados Fiscais", nunca mais como accordion irmão. */}
      <Box mt={4}>
        <CollapsibleSection title={formText.sections.itemFiscalToggleTitle} defaultOpen={false}>
          <SimpleGrid columns={columnsForm.fourColumns} gap={4}>
            {renderTextField('cfop', formText.fields.cfop, 191)}
            {renderTextField('cfop_saida_interno', formText.fields.cfopSaidaInterno, 191)}
            {renderTextField('cfop_saida_externo', formText.fields.cfopSaidaExterno, 191)}
            {renderSelectField('cst_csosn', formText.fields.cstCsosn, nfeCstCsosnOptions, true, {
              onAfterChange: applyC1ForCst,
            })}
            {renderSelectField('cst_csosn_exp', formText.fields.cstCsosnExp, nfeCstCsosnOptions)}
            {renderSelectField('cst_pis', formText.fields.cstPis, nfeCstPisCofinsOptions, true)}
            {renderSelectField(
              'cst_cofins',
              formText.fields.cstCofins,
              nfeCstPisCofinsOptions,
              true
            )}
            {renderSelectField('cst_ipi', formText.fields.cstIpi, nfeCstIpiOptions, true)}
            {renderSelectField('cenq_ipi', formText.fields.cenqIpi, nfeCenqIpiOptions, true)}
            {renderNumberField('perc_icms', formText.fields.percIcmsItem)}
            {renderNumberField('perc_pis', formText.fields.percPis)}
            {renderNumberField('perc_cofins', formText.fields.percCofins)}
            {renderNumberField('perc_ipi', formText.fields.percIpi)}
            {renderTextField('cest', formText.fields.cest, 10)}
            {renderTextField('barcode', formText.fields.barcode, 13)}
            {renderNumberField('percent_reduction', formText.fields.percentReduction)}
            {showMotDesIcms &&
              renderSelectField(
                'mot_des_icms',
                formText.fields.motDesIcms,
                motDesIcmsOptions,
                false,
                {
                  helperText: formText.fields.motDesIcmsHint,
                }
              )}
            {showPercDif &&
              renderNumberField('perc_dif', formText.fields.percDif, 4, {
                helperText: formText.fields.percDifHint,
                max: 100,
              })}
            {showPercFcp &&
              renderNumberField('perc_fcp', formText.fields.percFcp, 4, {
                helperText: formText.fields.percFcpHint,
                max: 100,
                normalize: normalizePercFcp,
              })}
            {renderSelectField(
              'modality_bc',
              formText.fields.modalityBc,
              nfeModalidadeBcOptions,
              true
            )}
            {renderSelectField('origem', formText.fields.origem, nfeOrigemOptions, true)}
            {renderTextField('reference', formText.fields.reference, 60)}
            {renderTextField('cbenef', formText.fields.cbenef, 30)}
          </SimpleGrid>

          {/* Reforma Tributária (IBS/CBS/IS) — subseção DENTRO do mesmo
              corpo colapsável (mirror `<hr>` + título do legado, nunca um
              accordion próprio). */}
          <Box mt={6} pt={4} borderTop="1px solid" borderColor="border.subtle">
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="fg.muted"
              textTransform="uppercase"
              mb={2}
            >
              {formText.sections.itemFiscalReform}
            </Text>
            <SimpleGrid columns={columnsForm.fourColumns} gap={4}>
              {renderTextField('c_class_trib', formText.fields.cClassTrib, 6)}
              {renderSelectField('cst_ibs_cbs', formText.fields.cstIbsCbs, nfeCstIbsCbsOptions)}
              {/* Reforma tributária — 4 casas (não 2), decisão do dono do
                  contrato de tela (diverge da máscara `percentage` de 2
                  casas do legado, campos novos sem equivalente legado). */}
              {renderNumberField('perc_ibs_uf', formText.fields.percIbsUf, 4)}
              {renderNumberField('perc_ibs_mun', formText.fields.percIbsMun, 4)}
              {renderNumberField(
                'perc_reducao_aliq_ibs_uf',
                formText.fields.percReducaoAliqIbsUf,
                4
              )}
              {renderNumberField(
                'perc_reducao_aliq_ibs_mun',
                formText.fields.percReducaoAliqIbsMun,
                4
              )}
              {renderNumberField('perc_dif_ibs_uf', formText.fields.percDifIbsUf, 4)}
              {renderNumberField('perc_dif_ibs_mun', formText.fields.percDifIbsMun, 4)}
              {renderNumberField('perc_cbs', formText.fields.percCbs, 4)}
              {renderNumberField('perc_reducao_aliq_cbs', formText.fields.percReducaoAliqCbs, 4)}
              {renderNumberField('perc_dif_cbs', formText.fields.percDifCbs, 4)}
              {renderTextField('cst_is', formText.fields.cstIs, 3)}
              {renderNumberField('perc_is', formText.fields.percIs, 4)}
              {renderNumberField('perc_is_espec', formText.fields.percIsEspec, 4)}
              {renderTextField('u_trib_is', formText.fields.uTribIs, 6)}
              {renderNumberField('ad_rem_ibs', formText.fields.adRemIbs, 4)}
              {renderNumberField('ad_rem_cbs', formText.fields.adRemCbs, 4)}
              {renderSelectField(
                'tp_cred_pres_ibs_zfm',
                formText.fields.tpCredPresIbsZfm,
                nfeTpCredPresIbsZfmOptions
              )}
              {renderSelectField('ind_doacao', formText.fields.indDoacao, nfeIndDoacaoOptions)}
            </SimpleGrid>
          </Box>

          {/* UT-000776 / T-776-FE-04 — referência por item, SÓ em devolução
              (finnfe=4). Chave (44 dígitos) + nº do item de origem (1..990). */}
          {isDevolucao && (
            <Box mt={6} pt={4} borderTop="1px solid" borderColor="border.subtle">
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="fg.muted"
                textTransform="uppercase"
                mb={2}
              >
                {formText.sections.itemFiscalDevolucao}
              </Text>
              <SimpleGrid columns={columnsForm.fourColumns} gap={4}>
                <Controller
                  name={`items.${index}.ref_access_key`}
                  control={control}
                  render={({ field }) => (
                    <MaskedInput
                      kind="digits"
                      label={formText.fields.refAccessKey}
                      name={field.name}
                      maxLength={44}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={rowErrors?.ref_access_key?.message}
                      isRequired
                      disabled={isDisabled}
                    />
                  )}
                />
                <Controller
                  name={`items.${index}.ref_item_number`}
                  control={control}
                  render={({ field }) => (
                    <MaskedInput
                      kind="integer"
                      label={formText.fields.refItemNumber}
                      name={field.name}
                      value={field.value ?? null}
                      onValueChange={(value) => field.onChange(value)}
                      onBlur={field.onBlur}
                      error={rowErrors?.ref_item_number?.message}
                      isRequired
                      disabled={isDisabled}
                    />
                  )}
                />
                {renderNumberField('perc_ipi_devol', formText.fields.percIpiDevol, 4, {
                  helperText: formText.fields.percIpiDevolHint,
                  max: 100,
                })}
              </SimpleGrid>
            </Box>
          )}
        </CollapsibleSection>
      </Box>

      <Flex justify="flex-end" mt={3}>
        <IconButtonTable
          aria-label={formText.itemRow.removeButton}
          mensegerTooltip={formText.itemRow.removeButton}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={isDisabled}
          onClick={onRemove}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Box>
  );
}
