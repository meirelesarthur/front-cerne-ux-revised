// src/pages/Fiscal/NfeEmitidas/CreateOrUpdateNfe.tsx
// -----------------------------------------------------------------------------
// Tela ÂNCORA de criação/edição de NFe Emitida (domínio Fiscal) —
// TASK-FE-036-404, REWORK DE FIDELIDADE pós-homologação
// (`audit-nfe-emitidas.md`, Grupo A). 1 `useForm` RAIZ com o resolver ÚNICO
// (`nfeSchemaResolver`, TASK-FE-036-402), casca de 2 abas (`Tabs.Root`, mirror
// `CreateOrUpdateInvoice.tsx`) — aba "Cabeçalho" implementada AQUI, inline;
// "Itens & Totais" é `NfeItemsTab.tsx` (TASK-FE-036-405), que recebe
// `control`/`errors`/`watch`/`setValue` do MESMO form raiz. SEM aba de
// Parcelamento/Rateio (contrato de tela §4, GAP-FE-036-401 — bloco Financeiro
// adiado, Group B do rework — NÃO implementado aqui).
//
// `tipo` (Operação)/`finnfe` (Finalidade)/`type_payment`/`type_debt`/
// `type_credit`/`type_guide`/`shipping_type` — o backend (`NfeRequest`) SEM
// `Rule::in()`; o FRONT agora renderiza `Select` catalogado mirror dos enums
// hardcoded do legado (`App\Nfe`/`App\NatureOperation`/`App\Product`,
// `nfe-fiscal-catalogs.ts`) em vez de `NumberInput`/`Input` livre — fecha os
// itens P1 "widgets divergentes" do audit. `additional_info` continua NÃO
// existindo no `$fillable` real — OMITIDO (nenhum campo fora do contrato
// real é inventado). O backend real também tem ~15 campos de transporte/
// volumes/peso que o contrato de tela original não citava
// (`transp_*`/`shipping_*`/`specie`/`number_volumes`/`quantity_volumes`/
// `gross_weight`/`net_weight`/`antt`/`type_debt`/`type_credit`) — TODOS
// representados aqui (DoD "nenhum campo do `$fillable` fora", ver
// `@/@types/v2/Nfes`).
//
// Guarda de edição bloqueada (contrato de tela §4.1): ao carregar
// `GET /nfes/{uuid}` em modo edição, se `data.estado` NÃO estiver em
// `{novo, rejeitado}` (`isNfeEditable`), redireciona para a Visualização com
// `toaster.warning` — mirror do padrão `isValidGuid`+`navigate(replace:true)`
// já usado em `CreateOrUpdateInvoice.tsx`.
//
// **Correção pós-auditoria (A-01/D-04/D-08/E-02/E-03):** `client`/
// `provider`/`harvest`/`issuer` (emissor)/`transp_city` do `NfeResource` real
// AGORA devolvem nome/descrição (não mais só `{ uuid }`) — os Selects são
// reidratados em edição com o rótulo REAL. `state_registration_client` virou
// `Select` alimentado por `GET /clients/{uuid}` (`state_registrations[]`,
// `ClientDetailResource`), recarregado sempre que o Cliente muda
// (`useClientForm`, `@/pages/CadastrosBase/Clientes/useClientes`).
// `transp_city_uuid` é reidratado e SEMPRE reenviado no PUT (nunca mais
// forçado a `null`) — o backend (`UpdateNfeAction`) também preserva o valor
// já persistido se o campo não vier no payload, dupla proteção contra apagar
// a cidade do transportador.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

import { Box, Icon, IconButton, SimpleGrid, Tabs, Text, useDisclosure } from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { BiPlusCircle } from 'react-icons/bi';
import { MdOutlineEdit } from 'react-icons/md';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { ClientFormModal } from '@/pages/CadastrosBase/Clientes/ClientFormModal';
import { useClientForm } from '@/pages/CadastrosBase/Clientes/useClientes';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { onlyDigits } from '@/utils/cpfCnpj';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { isValidGuid } from '@/utils/guid';
import { formatCpfCnpjProgressive } from '@/utils/masks/document';
import { formatPlateProgressive } from '@/utils/masks/plate';

import { ufOptions } from '@/constants/BaseRegistrations/options/uf-options';
import { columnsForm } from '@/constants/coluns-form';
import { sanitizeC1ForCst } from '@/constants/Fiscal/fiscal-field-visibility';
import { isNfeEditable } from '@/constants/Fiscal/nfe-estado-options';
import {
  nfeFinalidadeOptions,
  nfeShippingTypeOptions,
  nfeTipoOperacaoOptions,
  nfeTypeCreditOptions,
  nfeTypeDebtOptions,
  nfeTypeEmissionOptions,
  nfeTypeGuideOptions,
} from '@/constants/Fiscal/nfe-fiscal-catalogs';
import { queryKey } from '@/constants/query-key';

import { NFE_FINNFE_DEVOLUCAO, nfeSchemaResolver } from '@/validations/schemas/Nfes/nfe-schema';

import { getAdditionalInfo } from '@/services/v2/AdditionalInfo/additional-info-service';
import { listClients } from '@/services/v2/CadastrosBase/Client/client-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listCityOptions } from '@/services/v2/Cities/city-service';
import { createNfe, updateNfe } from '@/services/v2/Fiscal/nfe-service';
import { listHarvests } from '@/services/v2/Harvests/harvest-service';
import { listIssuers } from '@/services/v2/Issuers/issuer-service';
import {
  getNatureOperation,
  listNatureOperations,
} from '@/services/v2/NatureOperations/nature-operation-service';
import { getProduct } from '@/services/v2/Products/product-service';
import {
  getStockWriteoffNfeDraft,
  linkNfeToStockWriteoff,
} from '@/services/v2/StockWriteoffs/stock-writeoff-service';

import type { Option } from '@/@types/option';
import type { ClientListItem } from '@/@types/v2/CadastrosBase/client';
import type { CityListItem } from '@/@types/v2/Cities';
import type { ModuleWeighingNfePrefill } from '@/@types/v2/ModuleWeighing/module-weighing';
import type { MovementSaleNfeHandoffPayload } from '@/@types/v2/MovementSales';
import type { NatureOperationListItem } from '@/@types/v2/NatureOperations';
import type { NfeDetail, NfeForm as NfeFormType, NfeItemForm, NfePayload } from '@/@types/v2/Nfes';
import type { SaleNfeDraft } from '@/@types/v2/Sales';

import { applyNatureCfopToAllItems, applyNatureOverwriteToAllItems } from './nfe-nature-cascade';
import { NfeAgroDefensivosBlock } from './NfeAgroDefensivosBlock';
import { NfeFinancialTab } from './NfeFinancialTab';
import { emptyNfeItem, formatSize, NfeItemsTab } from './NfeItemsTab';
import { useNfeDetail } from './useNfeDetail';
import { useNfeForm } from './useNfes';

type NfeTabKey = '0' | '1' | '2';

const TAB_FIELDS: Record<NfeTabKey, (keyof NfeFormType)[]> = {
  '0': [
    'client_uuid',
    'state_registration_client',
    'tipo',
    'natureza_uuid',
    'type_emission',
    'finnfe',
    'departure_date',
    'delivery_date',
    'percent_icms',
    'icms_base',
    'has_financial',
    'type_debt',
    'type_credit',
    'harvest_uuid',
    'ref_nfe',
    'order_number',
    'emissor_uuid',
    'provider_uuid',
    'type_guide',
    'uf_guide',
    'number_guide',
    'serie_guide',
    'gta',
    'transp_name',
    'transp_cnpj',
    'transp_address',
    'transp_city_uuid',
    'shipping_type',
    'shipping_board_vehicle',
    'shipping_uf_shipping',
    'antt',
    'shipping_value',
    'specie',
    'number_volumes',
    'quantity_volumes',
    'gross_weight',
    'net_weight',
  ],
  '1': ['items', 'added_value', 'discount', 'type_payment', 'note'],
  // TASK-FE-036-D2-2 — bloco Financeiro (aba condicional, só quando
  // `has_financial===true`). Sem entrada própria em `items`/campos que já
  // pertencem às abas 0/1.
  '2': [
    'financial_type_title_uuid',
    'financial_proprietary_uuid',
    'financial_installments',
    'financial_categories',
  ],
};

const FIELD_TAB_MAP: Partial<Record<keyof NfeFormType, NfeTabKey>> = Object.fromEntries(
  (Object.entries(TAB_FIELDS) as [NfeTabKey, (keyof NfeFormType)[]][]).flatMap(([tab, fields]) =>
    fields.map((field) => [field, tab])
  )
);

// NFE-VD-01 (Tarefa 17.c, task-packet §2.4/§3 — handoff de emissão de NFe a
// partir de Venda de Animais) — item BASE para os itens do HANDOFF, mirror
// `emptyNfeItem` (`NfeItemsTab.tsx`, não exportado — nunca duplicar a lista
// de campos fiscais lá; este arquivo só replica os MESMOS defaults de item
// novo, `cenq_ipi: '999'` incluso, mirror legado
// `_card-item.blade.php:149`). Só `product_uuid`/`quantity`/`amount` vêm do
// payload (homônimos de `MovementSaleNfeHandoffItem`); todo o resto nasce
// nulo/default, exatamente como um item adicionado manualmente hoje.
const HANDOFF_ITEM_BASE: Omit<NfeItemForm, 'product_uuid' | 'quantity' | 'amount'> = {
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

export default function CreateOrUpdateNfe() {
  const { nfeId } = useParams<{ nfeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { languageGB } = useLanguage();
  const { can, hasFarm } = usePermissions();

  const isEditing = isValidGuid(nfeId);

  // NFE-R2-004 (REAUDITORIA-036-2a-rodada.md) — "Duplicar" navega para cá com
  // `location.state.duplicateFromUuid` (mirror legado `NfeController::
  // duplicateNfe()`: monta o payload da NFe de origem e abre a CRIAÇÃO
  // pré-preenchida — NÃO depende de emissão SEFAZ, NÃO é edição). Só faz
  // sentido fora do modo edição.
  const duplicateFromUuid = !isEditing
    ? ((location.state as { duplicateFromUuid?: string } | null)?.duplicateFromUuid ?? undefined)
    : undefined;

  // Handoff "Emitir NFe" da Baixa de Estoque (exec-038, TASK-FE-3006,
  // D-FE-BE-05) — mirror legado `StockWriteoffController@nfe()`
  // (`session('nfe')` + `redirect()->route('nfe.create')`) e MESMO padrão
  // estrutural de `duplicateFromUuid` acima: `Administrativo/BaixaEstoque/
  // {index,BaixaEstoqueDetalhe}.tsx::handleEmitirNfeClick` navega para cá só
  // com o uuid da baixa via `location.state` — o rascunho (`GET
  // /stock-writeoffs/{uuid}/nfe-draft`) é buscado AQUI (`stockWriteoffNfe
  // DraftQuery` abaixo), não no chamador. Só faz sentido fora do modo edição
  // (mesmo racional de duplicar — a baixa gera uma Nfe NOVA, nunca edita
  // uma existente).
  const stockWriteoffUuidForNfe = !isEditing
    ? ((location.state as { stockWriteoffUuidForNfe?: string } | null)?.stockWriteoffUuidForNfe ??
      undefined)
    : undefined;

  const text = languageGB.nfes.nfe;
  const formText = text.form;
  const stockWriteoffText = languageGB.stockWriteoffs.stockWriteoff;

  const canSave = isEditing ? can('nfe_edit') : can('nfe_create');

  useEffect(() => {
    if (nfeId && !isValidGuid(nfeId)) {
      navigate('/fiscal/nfe-emitidas', { replace: true });
    }
  }, [nfeId, navigate]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    watch,
    getValues,
    formState: { errors },
  } = useForm<NfeFormType>({
    mode: 'onChange',
    resolver: nfeSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      client_uuid: null,
      natureza_uuid: null,
      state_registration_client: null,
      type_payment: null,
      emissor_uuid: null,
      harvest_uuid: null,
      // D4/§D4 do MAPA `nfe-form-behavior.md` — "Prestador de Serviço" do
      // bloco Transportadora (FK real `provider_uuid`, nunca antes
      // renderizado no formulário de criação/edição).
      provider_uuid: null,
      type_debt: null,
      type_credit: null,
      transp_name: null,
      transp_cnpj: null,
      transp_address: null,
      transp_city_uuid: null,
      // D-101-16 — padrão '0 – Por conta do emitente' (mirror legado).
      shipping_type: 0,
      shipping_board_vehicle: null,
      shipping_uf_shipping: null,
      shipping_value: 0,
      specie: null,
      number_volumes: null,
      quantity_volumes: null,
      gross_weight: null,
      net_weight: null,
      departure_date: null,
      delivery_date: null,
      discount: 0,
      added_value: 0,
      percent_icms: null,
      icms_base: null,
      gta: null,
      type_guide: null,
      uf_guide: null,
      number_guide: null,
      serie_guide: null,
      agro_defensivos: [],
      order_number: null,
      ref_nfe: null,
      note: null,
      antt: null,
      tipo: null,
      finnfe: null,
      // Tipo Emissão — default legado `1` "Emissão normal"
      // (`_forms.blade.php:65`, `->value(isset($item) ? $item->type_emission
      // : 1)`). E2E do dono, esteira 036fix5.
      type_emission: 1,
      // "Gerar financeiro?" — E2E do dono, esteira 036fix5. Só o
      // campo/valor (a geração financeira em si é fase posterior); default
      // `true` (mirror o comportamento mais comum do legado para NFe de
      // saída — sem cascata automática da Natureza nesta fatia).
      has_financial: true,
      // Bloco Financeiro (TASK-FE-036-D2-2) — vazio por default; só
      // relevante/validado quando `has_financial===true` (aba condicional).
      financial_type_title_uuid: null,
      financial_proprietary_uuid: null,
      financial_installments: [],
      financial_categories: [],
      items: [],
    },
  });

  const [tabValue, setTabValue] = useState<NfeTabKey>('0');

  // NFE-R2-004 — flag de uma tirada: setada logo antes de chamar
  // `fillNfeForm` a partir do fluxo de Duplicar (abaixo), consumida e
  // resetada dentro da própria função. Mantém `fillNfeForm` com a MESMA
  // assinatura `(data, resetForce?: boolean)` exigida por
  // `useCustomFormQueryByGuid` (hook genérico partilhado, não deve ser
  // alterado por esta tela).
  const skipNextEditableGuardRef = useRef(false);

  function fillNfeForm(data: NfeDetail, resetForce?: boolean) {
    reset({
      // Correção pós-auditoria de fidelidade (audit-nfe-emitidas.md A-01/
      // E-02/E-03) — `client`/`provider`/`harvest`/`issuer` (emissor) do
      // `NfeResource` real agora devolvem nome/descrição; reidrata com o
      // rótulo REAL (fallback ao uuid só se o nome vier `null`, nunca mock).
      client_uuid: data.client
        ? { label: data.client.name ?? data.client.uuid, value: data.client.uuid }
        : null,
      natureza_uuid: data.nature ? { label: data.nature.descricao, value: data.nature.uuid } : null,
      state_registration_client: data.state_registration_client ?? null,
      type_payment: data.type_payment ?? null,
      emissor_uuid: data.issuer
        ? {
            label: data.issuer.razao_social ?? data.issuer.nome_fantasia ?? data.issuer.uuid,
            value: data.issuer.uuid,
          }
        : null,
      harvest_uuid: data.harvest
        ? { label: data.harvest.descricao ?? data.harvest.uuid, value: data.harvest.uuid }
        : null,
      // D4/§D4 do MAPA `nfe-form-behavior.md` — reidrata "Prestador de
      // Serviço" a partir de `NfeDetail.provider` (mesmo FK real que a
      // Visualização, `NfeDetalhe.tsx`, já exibe sob o rótulo "Fornecedor").
      provider_uuid: data.provider
        ? { label: data.provider.name ?? data.provider.uuid, value: data.provider.uuid }
        : null,
      type_debt: data.type_debt ?? null,
      type_credit: data.type_credit ?? null,
      transp_name: data.transp_name ?? null,
      transp_cnpj: data.transp_cnpj ? formatCpfCnpjProgressive(data.transp_cnpj) : null,
      transp_address: data.transp_address ?? null,
      // Correção pós-auditoria (E-02) — `NfeResource` agora devolve
      // `transp_city`; reidrata com o nome real em vez de forçar `null`
      // (causa raiz do apagamento da cidade em edição).
      transp_city_uuid: data.transp_city
        ? { label: data.transp_city.name, value: data.transp_city.uuid }
        : null,
      shipping_type: data.shipping_type ?? null,
      shipping_board_vehicle: data.shipping_board_vehicle
        ? formatPlateProgressive(data.shipping_board_vehicle)
        : null,
      shipping_uf_shipping: data.shipping_uf_shipping ?? null,
      shipping_value: data.shipping_value ?? 0,
      specie: data.specie ?? null,
      number_volumes: data.number_volumes ?? null,
      quantity_volumes: data.quantity_volumes ?? null,
      gross_weight: data.gross_weight ?? null,
      net_weight: data.net_weight ?? null,
      departure_date: data.departure_date ?? null,
      delivery_date: data.delivery_date ?? null,
      discount: data.discount ?? 0,
      added_value: data.added_value ?? 0,
      percent_icms: data.percent_icms ?? null,
      icms_base: data.icms_base ?? null,
      gta: data.gta ?? null,
      type_guide: data.type_guide ?? null,
      uf_guide: data.uf_guide ?? null,
      number_guide: data.number_guide ?? null,
      serie_guide: data.serie_guide ?? null,
      // UT-000776 / T-776-FE-05 — GET traz `[{uuid,n_receituario,cpf_resp_tec}]`; o form
      // guarda só os 2 campos editáveis (a lista inteira substitui no update).
      agro_defensivos: (data.agro_defensivos ?? []).map((row) => ({
        n_receituario: row.n_receituario,
        cpf_resp_tec: row.cpf_resp_tec,
      })),
      order_number: data.order_number ?? null,
      ref_nfe: data.ref_nfe ?? null,
      note: data.note ?? null,
      antt: data.antt ?? null,
      tipo: data.tipo ?? null,
      finnfe: data.finnfe ?? null,
      // Tipo Emissão — PERSISTIDO, reidrata com o valor real do servidor
      // (`NfeResource.type_emission`), cai no default legado `1` só se
      // ainda vier vazio.
      type_emission: data.type_emission ?? 1,
      // "Gerar financeiro?" — ajuste do coordenador (esteira 036fix5):
      // `nves` NÃO tem coluna própria; `NfeResource` agora DERIVA e
      // devolve `has_financial` (TASK-FE-036-D2D/GAP-036-404) — reidrata
      // com o valor do servidor quando presente, cai no default legado
      // "Sim" (`true`) só se a resposta ainda não trouxer a chave.
      has_financial: data.has_financial ?? true,
      // Bloco Financeiro (TASK-FE-036-D2-2) — reidratação DEFENSIVA/
      // forward-compatible (mirror `IncomePayload.xml_key`): os `?? []`/
      // `?? null` abaixo garantem que a aba reabre vazia (gap declarado,
      // SEM MOCK) quando `data.financial_*` ainda vier `undefined`, e
      // ativam sozinhos a reidratação real quando o backend expuser o
      // bloco, sem precisar reabrir este arquivo.
      financial_type_title_uuid: data.financial_type_title_uuid
        ? { label: data.financial_type_title_uuid, value: data.financial_type_title_uuid }
        : null,
      financial_proprietary_uuid: data.financial_proprietary_uuid
        ? { label: data.financial_proprietary_uuid, value: data.financial_proprietary_uuid }
        : null,
      financial_installments: (data.financial_installments ?? []).map((installment) => ({
        due_date: installment.due_date,
        value: installment.value,
      })),
      financial_categories: (data.financial_categories ?? []).map((category) => ({
        category_uuid: category.category_uuid,
        plan_account_uuid: category.plan_account_uuid ?? null,
        center_uuid: category.center_uuid,
        percentage: category.percentage,
      })),
      items: (data.items ?? []).map((item): NfeItemForm => ({
        product_uuid: item.product
          ? { label: item.product.description, value: item.product.uuid }
          : null,
        quantity: item.quantity,
        amount: item.amount,
        // TASK-FE-036-B17-2 — DISPLAY-ONLY, mirror legado `.um[]` readonly.
        // NUNCA incluído em `NfeItemPayload`/`tryPersistNfe` abaixo.
        product_measurement_label: item.product?.measurement?.description ?? null,
        // TASK-FE-036-B17-2 (fecha GAP 9) — rótulo completo `descrição -
        // tamanho`, reusa o MESMO `formatSize` de `TASK-FE-036-B17-1`
        // (`NfeItemsTab.tsx`, nenhum formatador duplicado). Antes mostrava
        // o próprio uuid como texto.
        package_uuid: item.package
          ? {
              label: `${item.package.description} - ${formatSize(item.package.size)}`,
              value: item.package.uuid,
            }
          : null,
        area_uuid: item.area ? { label: item.area.uuid, value: item.area.uuid } : null,
        warehouse_uuid: item.warehouse
          ? { label: item.warehouse.description, value: item.warehouse.uuid }
          : null,
        discount: item.discount ?? 0,
        order_item: item.order_item ?? null,
        cfop: item.cfop ?? null,
        cfop_saida_interno: item.cfop_saida_interno ?? null,
        cfop_saida_externo: item.cfop_saida_externo ?? null,
        cst_csosn: item.cst_csosn ?? null,
        cst_csosn_exp: item.cst_csosn_exp ?? null,
        cst_pis: item.cst_pis ?? null,
        cst_cofins: item.cst_cofins ?? null,
        cst_ipi: item.cst_ipi ?? null,
        cenq_ipi: item.cenq_ipi ?? null,
        perc_icms: item.perc_icms ?? null,
        perc_pis: item.perc_pis ?? null,
        perc_cofins: item.perc_cofins ?? null,
        perc_ipi: item.perc_ipi ?? null,
        cest: item.cest ?? null,
        barcode: item.barcode ?? null,
        percent_reduction: item.percent_reduction ?? null,
        mot_des_icms: item.mot_des_icms ?? null,
        perc_dif: item.perc_dif ?? null,
        perc_fcp: item.perc_fcp ?? null,
        perc_ipi_devol: item.perc_ipi_devol ?? null,
        modality_bc: item.modality_bc ?? null,
        origem: item.origem ?? null,
        reference: item.reference ?? null,
        cbenef: item.cbenef ?? null,
        c_class_trib: item.c_class_trib ?? null,
        cst_ibs_cbs: item.cst_ibs_cbs ?? null,
        perc_ibs_uf: item.perc_ibs_uf ?? null,
        perc_ibs_mun: item.perc_ibs_mun ?? null,
        perc_reducao_aliq_ibs_uf: item.perc_reducao_aliq_ibs_uf ?? null,
        perc_reducao_aliq_ibs_mun: item.perc_reducao_aliq_ibs_mun ?? null,
        perc_dif_ibs_uf: item.perc_dif_ibs_uf ?? null,
        perc_dif_ibs_mun: item.perc_dif_ibs_mun ?? null,
        perc_cbs: item.perc_cbs ?? null,
        perc_reducao_aliq_cbs: item.perc_reducao_aliq_cbs ?? null,
        perc_dif_cbs: item.perc_dif_cbs ?? null,
        cst_is: item.cst_is ?? null,
        perc_is: item.perc_is ?? null,
        perc_is_espec: item.perc_is_espec ?? null,
        u_trib_is: item.u_trib_is ?? null,
        ad_rem_ibs: item.ad_rem_ibs ?? null,
        ad_rem_cbs: item.ad_rem_cbs ?? null,
        tp_cred_pres_ibs_zfm: item.tp_cred_pres_ibs_zfm ?? null,
        ind_doacao: item.ind_doacao ?? null,
        ref_access_key: item.ref_access_key ?? null,
        ref_item_number: item.ref_item_number ?? null,
      })),
    });

    // NFE-R2-011 (REAUDITORIA-036-2a-rodada.md) — reconciliação EXPLÍCITA do
    // valor persistido/duplicado com a cascata cliente→inscrição estadual e
    // natureza→fiscal: sincroniza os refs de "último valor conhecido" com o
    // que acabou de ser hidratado, em vez de depender apenas do sentinela
    // `undefined` do primeiro render. Fecha a janela em que a Inscrição
    // Estadual poderia ser limpa antes da nova lista chegar (reidratação em
    // edição/duplicação) e garante que a cascata fiscal da Natureza só
    // dispare em troca REAL feita pelo usuário, nunca na hidratação inicial
    // (mirror legado — `setNaturezas()` usa `.val()` sem `.trigger('change')`
    // no carregamento).
    previousClientUuidRef.current = data.client?.uuid ?? undefined;
    previousNaturezaUuidRef.current = data.nature?.uuid ?? undefined;

    void resetForce;
    const skipEditableGuard = skipNextEditableGuardRef.current;
    skipNextEditableGuardRef.current = false;

    // Guarda de estado (contrato de tela §4.1) — redireciona para a
    // Visualização quando a NFe não pode mais ser editada. Roda DEPOIS do
    // `reset()` acima (não impede o preenchimento, só decide se o usuário
    // permanece na tela). NFE-R2-004 — pulada em modo Duplicar: a
    // duplicação sempre abre uma CRIAÇÃO nova, nunca uma edição da NFe de
    // origem, então o estado dela é irrelevante.
    if (!skipEditableGuard && !isNfeEditable(data.estado)) {
      toaster.warning({
        title: formText.editBlockedToast.title,
        description: formText.editBlockedToast.description,
      });
      navigate(`/fiscal/nfe-emitidas/${data.uuid}/visualizar`, { replace: true });
    }
  }

  const nfeQuery = useNfeForm({
    registrationId: isEditing ? nfeId : undefined,
    fillForm: fillNfeForm,
  });

  // NFE-R2-004 — busca a NFe de origem para pré-preencher a CRIAÇÃO quando
  // veio de "Duplicar" (mirror `NfeController::duplicateNfe()`, que também
  // parte de `Nfe::with('items', ...)->findOrFail($id)`).
  const duplicateSourceQuery = useNfeDetail(duplicateFromUuid, !!duplicateFromUuid);
  const hasAppliedDuplicateRef = useRef(false);
  useEffect(() => {
    if (
      !isEditing &&
      duplicateFromUuid &&
      duplicateSourceQuery.data &&
      !hasAppliedDuplicateRef.current
    ) {
      hasAppliedDuplicateRef.current = true;
      skipNextEditableGuardRef.current = true;
      fillNfeForm(duplicateSourceQuery.data);
    }
  }, [duplicateSourceQuery.data, isEditing, duplicateFromUuid]);

  // Rascunho da Baixa de Estoque (handoff "Emitir NFe", exec-038) — leitura
  // pura (`GET .../nfe-draft`, sem efeito colateral no backend). Falha ao
  // carregar NÃO bloqueia a tela: o usuário ainda pode criar a Nfe do zero
  // (mirror a mesma tolerância que o antigo `EmitirNfeModal.tsx` já tinha
  // para o draft — "conveniência, não pré-requisito").
  const stockWriteoffNfeDraftQuery = useQuery({
    queryKey: ['stock-writeoff-nfe-draft', stockWriteoffUuidForNfe],
    queryFn: async () => {
      const response = await getStockWriteoffNfeDraft(stockWriteoffUuidForNfe!);
      return response.data;
    },
    enabled: !isEditing && !!stockWriteoffUuidForNfe,
    retry: false,
  });

  // Aplica o rascunho ADITIVAMENTE — só `items[]` (produto/quantidade/valor
  // unitário/armazém, CV-007/CV-008); todo o resto do cabeçalho continua com
  // os `defaultValues` normais de criação (contrato §2 desta Tarefa: "sem
  // prefill não deve quebrar o fluxo normal"). Usa `reset({ ...getValues(),
  // items })` — MESMO mecanismo já usado por `fillNfeForm` acima — em vez de
  // `setValue('items', ...)`: RHF NÃO suporta substituir um `useFieldArray`
  // inteiro via `setValue` (o array renderizado por `NfeItemsTab.tsx` fica
  // fora de sincronia); `reset()` já é o padrão comprovado deste arquivo
  // para popular `items` (edição/duplicar, acima). Roda ANTES de qualquer
  // edição do usuário (efeito dispara assim que o draft chega, cedo no
  // mount), então `getValues()` só devolve os `defaultValues` intactos.
  // `package_uuid`/`area_uuid` ficam `null` (mirror EXATO legado
  // `StockWriteoffController@nfe()`: `package_id: null`, `area_id: null`) —
  // `warehouse_uuid` só tem uuid no draft (sem `description`), rótulo cai no
  // próprio uuid (mesmo fallback já usado em `fillNfeForm` para `client`/
  // `provider`/etc quando o nome não vem). NENHUMA cascata fiscal (CFOP/CST/
  // tributos por Natureza/Produto) é disparada aqui — GAP documentado no
  // handover: os campos fiscais por item ficam nos defaults de
  // `emptyNfeItem` e dependem de revisão manual do usuário antes de salvar.
  const hasAppliedStockWriteoffPrefillRef = useRef(false);
  useEffect(() => {
    const draft = stockWriteoffNfeDraftQuery.data;
    if (
      isEditing ||
      !stockWriteoffUuidForNfe ||
      !draft ||
      hasAppliedStockWriteoffPrefillRef.current
    ) {
      return;
    }
    hasAppliedStockWriteoffPrefillRef.current = true;

    const warehouseOption: Option<string> | null = draft.warehouse_uuid
      ? { label: draft.warehouse_uuid, value: draft.warehouse_uuid }
      : null;

    const items: NfeItemForm[] = draft.items.map((item) => ({
      ...emptyNfeItem,
      product_uuid: item.product_uuid
        ? { label: item.product_description || item.product_uuid, value: item.product_uuid }
        : null,
      quantity: item.quantity ?? null,
      amount: item.unit_value ?? null,
      warehouse_uuid: warehouseOption,
    }));

    reset({ ...getValues(), items });
  }, [stockWriteoffNfeDraftQuery.data, isEditing, stockWriteoffUuidForNfe, reset, getValues]);

  useEffect(() => {
    if (stockWriteoffNfeDraftQuery.isError) {
      toaster.warning({
        title: stockWriteoffText.nfeHandoff.draftErrorToast.title,
        description: stockWriteoffText.nfeHandoff.draftErrorToast.description,
      });
    }
  }, [stockWriteoffNfeDraftQuery.isError]);

  // NFE-VD-01 (Tarefa 17.c, task-packet §2.4/§3, matriz FID-G3F #3) —
  // Handoff de Emissão de NFe a partir de Venda de Animais
  // (`MovementSaleEmitNfeDialog` → `POST movement-sales/{uuid}/nfe-issue` →
  // `navigate('/fiscal/nfe-emitidas/novo', { state: { movementSaleHandoff } })`).
  // Mudança ADITIVA e OPCIONAL, mesmo racional de `duplicateFromUuid` acima
  // — só existe (a) fora do modo edição e (b) quando o state REALMENTE veio
  // preenchido. SEM ele, nada abaixo executa: zero `setValue`, zero efeito
  // colateral, comportamento IDÊNTICO ao de hoje (condição de zero
  // regressão do módulo NFe, provada pelo Tester — checklist de saída da
  // Tarefa).
  //
  // `guide_number` (payload da Tarefa 17) → `number_guide` (campo REAL do
  // `NfeRequest` — nomes DIVERGENTES entre os 2 módulos). `type_guide`/
  // `uf_guide` são homônimos (`string | null` em `NfeForm`, mesmo racional
  // de `shipping_uf_shipping` — código CRU da UF, nunca `Option<string>`).
  // `items[].{product_uuid,quantity,amount}` são homônimos de
  // `NfeItemForm`/`NfeItemPayload` — `product_uuid` vira `Option<string>`
  // com o PRÓPRIO uuid como label (o payload de handoff não traz descrição
  // do produto, mesmo racional já usado acima para `area_uuid` quando não
  // há descrição disponível — SEM MOCK, nunca inventado).
  //
  // `amount` de TOPO do payload (total da guia) NÃO tem campo de cabeçalho
  // correspondente em `NfeForm` — o total da nota AQUI é sempre DERIVADO
  // (`nfeTotalAmount`, soma de `items[].amount` + frete + acréscimo −
  // desconto), então mapear os itens já basta para o total recomputar
  // sozinho, sem inventar um campo novo de cabeçalho.
  //
  // `model`/`model_uuid`/`block_financial` do payload NÃO existem no
  // `NfeRequest` real — DECISAO_DE_ESCOPO (task-packet, matriz FID-G3F #3a,
  // não reaberta): DELIBERADAMENTE não consumidos aqui.
  const movementSaleHandoff = !isEditing
    ? ((location.state as { movementSaleHandoff?: MovementSaleNfeHandoffPayload } | null)
        ?.movementSaleHandoff ?? undefined)
    : undefined;
  const hasAppliedHandoffRef = useRef(false);
  useEffect(() => {
    if (isEditing || !movementSaleHandoff || hasAppliedHandoffRef.current) return;
    hasAppliedHandoffRef.current = true;

    setValue('type_guide', movementSaleHandoff.type_guide ?? null, { shouldDirty: true });
    setValue('uf_guide', movementSaleHandoff.uf_guide ?? null, { shouldDirty: true });
    setValue('number_guide', movementSaleHandoff.guide_number ?? null, { shouldDirty: true });
    setValue(
      'items',
      movementSaleHandoff.items.map((item): NfeItemForm => ({
        ...HANDOFF_ITEM_BASE,
        product_uuid: { label: item.product_uuid, value: item.product_uuid },
        quantity: item.quantity,
        amount: item.amount,
      })),
      { shouldDirty: true }
    );
  }, [isEditing, movementSaleHandoff, setValue]);

  // SALE-FE-COM-06 (97-Esteiras/043, task-packet §"Componentes" — handoff de
  // emissão de NFe a partir da Venda COMERCIAL, `Sale`, `SaleEmitNfeDialog`
  // → `GET sales/{uuid}/nfe-draft` → `navigate('/fiscal/nfe-emitidas/novo',
  // { state: { saleHandoff } })`). Mudança ADITIVA e OPCIONAL, MESMO
  // racional de `movementSaleHandoff` acima: só existe (a) fora do modo
  // edição e (b) quando o state REALMENTE veio preenchido — sem ele, nada
  // abaixo executa (zero regressão do módulo NFe, critério de aceite
  // provado pelo Tester).
  //
  // GAP-043-SALE-FE-COM-02 `[RESOLVIDO]` (modelo de HANDOFF, sem
  // `nfe-emit`): o humano completa o bloco fiscal (CFOP/CST/PIS/COFINS) e
  // emite pelo fluxo `/nfes` já migrado — este efeito só PRÉ-PREENCHE o que
  // é 1:1 mapeável (`client_uuid`, `type_payment`, itens), nunca inventa
  // valor fiscal ausente do draft.
  //
  // `client_uuid` (Option, rótulo = `client.info`, já hidratado pelo
  // `SaleClientRef` — nunca o uuid cru) e `type_payment` (mesmo catálogo
  // SEFAZ de `type_payment`/`payment_method`, string crua, sem `Option`)
  // são homônimos diretos de `NfeForm`. `items[].{product_uuid,quantity,
  // amount,warehouse_uuid,discount}` idem — reusa `HANDOFF_ITEM_BASE` para
  // o resto dos ~40 campos fiscais por item (nascem nulos/default, exatamente
  // como um item adicionado manualmente hoje).
  //
  // `icms`/`freight`/`other_values`/`discount` de TOPO do draft NÃO têm
  // homônimo direto em `NfeForm` (`percent_icms`/`shipping_value`/
  // `discount` do cabeçalho têm semânticas DIFERENTES — percentual vs.
  // valor, frete vs. ICMS) — DELIBERADAMENTE não mapeados (SEM MOCK, nunca
  // inventar correspondência ambígua).
  const saleHandoff = !isEditing
    ? ((location.state as { saleHandoff?: SaleNfeDraft } | null)?.saleHandoff ?? undefined)
    : undefined;
  const hasAppliedSaleHandoffRef = useRef(false);
  useEffect(() => {
    if (isEditing || !saleHandoff || hasAppliedSaleHandoffRef.current) return;
    hasAppliedSaleHandoffRef.current = true;

    if (saleHandoff.client) {
      setValue(
        'client_uuid',
        { label: saleHandoff.client.info, value: saleHandoff.client.uuid },
        { shouldDirty: true }
      );
    }
    setValue('type_payment', saleHandoff.type_payment ?? null, { shouldDirty: true });
    setValue(
      'items',
      saleHandoff.items.map((item): NfeItemForm => ({
        ...HANDOFF_ITEM_BASE,
        product_uuid: item.product
          ? { label: item.product.description, value: item.product.uuid }
          : null,
        quantity: item.quantity,
        amount: item.amount,
        warehouse_uuid: item.warehouse
          ? { label: item.warehouse.name, value: item.warehouse.uuid }
          : null,
        discount: item.discount,
      })),
      { shouldDirty: true }
    );
  }, [isEditing, saleHandoff, setValue]);

  // UT-000715 / TASK-FE-715-02 / D-097-08 / PLD-1 — handoff "Emitir NFe" da Pesagem Rodoviária
  // (`navigate('/fiscal/nfe-emitidas/novo', { state: { moduleWeighingNfePrefill } })`).
  // ADITIVO, mesmo racional de `saleHandoff`: só ativo fora da edição e com o state presente.
  // Pré-preenche produto (rótulo resolvido via GET /products/{uuid}, com cascata fiscal por
  // `cascadeOnMount`), quantidade (líquido) e pesos bruto REAL/líquido. NÃO consome cliente,
  // placa, `block_financial` nem `module_weighing_uuid` (D-097-08).
  const queryClient = useQueryClient();
  const moduleWeighingNfePrefill = !isEditing
    ? ((location.state as { moduleWeighingNfePrefill?: ModuleWeighingNfePrefill } | null)
        ?.moduleWeighingNfePrefill ?? undefined)
    : undefined;
  const hasAppliedModuleWeighingRef = useRef(false);
  // Guarda de desmontagem (e não `cancelled` por execução): o efeito é one-shot via ref, então um
  // cleanup por execução (StrictMode/troca de deps) abortaria o handoff sem reexecutá-lo.
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const [cascadeOnMount, setCascadeOnMount] = useState(false);
  const [isResolvingModuleWeighingProduct, setIsResolvingModuleWeighingProduct] = useState(false);
  useEffect(() => {
    if (isEditing || !moduleWeighingNfePrefill || hasAppliedModuleWeighingRef.current) return;
    hasAppliedModuleWeighingRef.current = true;

    async function applyModuleWeighingPrefill(prefill: ModuleWeighingNfePrefill) {
      const netWeight = prefill.net_weight == null ? NaN : Number(prefill.net_weight);
      const grossWeight = prefill.gross_weight == null ? NaN : Number(prefill.gross_weight);
      if (!Number.isNaN(netWeight)) setValue('net_weight', netWeight, { shouldDirty: true });
      if (!Number.isNaN(grossWeight)) setValue('gross_weight', grossWeight, { shouldDirty: true });

      const sourceItems = prefill.items ?? [];
      if (sourceItems.length === 0) return;

      setIsResolvingModuleWeighingProduct(true);
      try {
        const resolved = await Promise.all(
          sourceItems.map(async (item): Promise<NfeItemForm> => {
            // MESMA queryKey/queryFn de `NfeItemRow`: aquece o cache p/ a cascata no mount.
            const product = await queryClient.fetchQuery({
              queryKey: [queryKey.products.product, item.product_uuid],
              queryFn: async () => (await getProduct(item.product_uuid)).data,
            });
            const description = product?.description ?? '';
            const label = product?.code ? `${product.code} — ${description}` : description;
            return {
              ...HANDOFF_ITEM_BASE,
              product_uuid: { label, value: item.product_uuid },
              quantity: Number(item.quantity),
              amount: 0,
              warehouse_uuid: null,
            };
          })
        );
        if (!isMountedRef.current) return;
        // `setValue('items')` e a flag no MESMO tick (batch React 18): a flag já é true no mount das linhas.
        setValue('items', resolved, { shouldDirty: true });
        setCascadeOnMount(true);
      } catch (error) {
        if (!isMountedRef.current) return;
        toaster.error({
          title: languageGB.nfes.nfe.form.fields.product,
          description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        });
      } finally {
        if (isMountedRef.current) setIsResolvingModuleWeighingProduct(false);
      }
    }

    void applyModuleWeighingPrefill(moduleWeighingNfePrefill);
  }, [isEditing, moduleWeighingNfePrefill, setValue, queryClient, languageGB]);

  const isLoading =
    isResolvingModuleWeighingProduct ||
    (isEditing && hasFarm && checkLoadingStatus([nfeQuery as any])) ||
    (!!duplicateFromUuid && checkLoadingStatus([duplicateSourceQuery as any])) ||
    (!!stockWriteoffUuidForNfe && checkLoadingStatus([stockWriteoffNfeDraftQuery as any]));

  // ---- Cliente: botão contextual criar/editar (mirror TASK-MV-FE-11,
  // `CreateOrUpdateMovimento.tsx`) + cascata de Inscrição Estadual (D-04 do
  // audit) -------------------------------------------------------------
  const clientModalDisclosure = useDisclosure();
  const [clientOptionsCacheKey, setClientOptionsCacheKey] = useState(0);
  const watchedClientUuid = watch('client_uuid')?.value;

  // `useClientForm` (`@/pages/CadastrosBase/Clientes/useClientes`) já existe
  // — `fillForm` NO-OP, só usado aqui para LER `clientDetailQuery.data`
  // (`GET /clients/{uuid}` devolve `state_registrations[]`, confirmado em
  // `ClientDetailResource`). Trigger "Cliente muda → recria select de
  // Inscrição Estadual" (bloco C do audit, mirror `_forms.blade.php:308-329`).
  const clientDetailQuery = useClientForm({ registrationId: watchedClientUuid });
  const stateRegistrationOptions: Option<string>[] = (
    clientDetailQuery.data?.state_registrations ?? []
  ).map((registration) => ({ label: registration, value: registration }));

  // Limpa a Inscrição Estadual só quando o Cliente MUDA depois do form já
  // estar de pé (create: 1ª seleção; edit: troca manual pós-hidratação) —
  // NUNCA na hidratação inicial de edição/duplicação (`fillNfeForm` já
  // sincroniza este ref explicitamente com `data.client?.uuid`, NFE-R2-011).
  // `undefined` como sentinela de "ainda sem interação" — mesmo mecanismo do
  // `previousTipoRef` abaixo.
  const previousClientUuidRef = useRef<string | undefined>(watchedClientUuid);
  useEffect(() => {
    if (
      previousClientUuidRef.current !== undefined &&
      previousClientUuidRef.current !== watchedClientUuid
    ) {
      setValue('state_registration_client', null, { shouldValidate: false });
    }
    previousClientUuidRef.current = watchedClientUuid;
  }, [watchedClientUuid]);

  // ---- Operação → Natureza de Operação (D-01 do audit): filtra por `tipo`
  // e recarrega ao trocar a Operação -------------------------------------
  const watchedTipo = watch('tipo');
  const previousTipoRef = useRef<number | null>(watchedTipo ?? null);
  useEffect(() => {
    if (previousTipoRef.current !== null && previousTipoRef.current !== (watchedTipo ?? null)) {
      setValue('natureza_uuid', null, { shouldValidate: false });
    }
    previousTipoRef.current = watchedTipo ?? null;
  }, [watchedTipo]);

  // ---- Info. Complementares (NFE-R2-008) — campo AUXILIAR, não persistido
  // (o `$fillable`/`NfeRequest` real não têm FK própria para
  // `additional_info`, mirror `@/@types/v2/Nfes`); serve só para preencher
  // Observações, exatamente como o select equivalente do legado
  // (`_forms.blade.php:152,331-342`). Nunca entra no payload de escrita.
  const [additionalInfoOption, setAdditionalInfoOption] = useState<Option<string> | null>(null);

  async function applyAdditionalInfoToNote(additionalInfoUuid: string) {
    try {
      const response = await getAdditionalInfo(additionalInfoUuid);
      setValue('note', response.data.info, { shouldValidate: false });
    } catch {
      // Falha ao buscar a informação complementar não deve travar o
      // formulário (mirror legado — sem tratamento de erro explícito no JS).
    }
  }

  function handleAdditionalInfoChange(option: Option<string> | null) {
    setAdditionalInfoOption(option);
    if (!option) {
      setValue('note', '', { shouldValidate: false });
      return;
    }
    void applyAdditionalInfoToNote(option.value);
  }

  // ---- Natureza → cascata fiscal (NFE-R2-006/007/008 do audit) ----------
  // O `NatureOperationResource` real já devolve `overwrite_product`/
  // `sobrescreve_cfop_produto`/CFOPs/tributos/`automatic_calculation`/
  // `additional_info_uuid` (confirmado por leitura direta,
  // `NatureOperationResource.php`), mas o front só gravava a opção
  // selecionada. `getNatureOperation` busca o detalhe completo (o item da
  // lista assíncrona só carrega `{uuid, descricao}` no `Option`).
  const watchedNaturezaUuid = watch('natureza_uuid')?.value;
  const natureOperationDetailQuery = useQuery({
    queryKey: [queryKey.natureOperations.detail, watchedNaturezaUuid],
    queryFn: async () => {
      if (!watchedNaturezaUuid) return null;
      const response = await getNatureOperation(watchedNaturezaUuid);
      return response.data;
    },
    enabled: !!watchedNaturezaUuid,
  });

  // NFE-R2-007 — `automatic_calculation` controla show/hide + obrigatoriedade
  // do bloco ICMS (mirror `_forms.blade.php:633-639`: `.calc-icms` some por
  // padrão e só some/exige quando `automatic_calculation === false`).
  // Enquanto a Natureza não resolveu, assume o default legado (oculto).
  const icmsAutomaticCalculation = natureOperationDetailQuery.data?.automatic_calculation ?? true;

  // Ref de "última Natureza aplicada" — sincronizado explicitamente em
  // `fillNfeForm` (NFE-R2-011) para NUNCA disparar a cascata na hidratação
  // inicial de edição/duplicação, só em troca REAL do usuário (mirror
  // legado: `setNaturezas()` usa `.val()` sem `.trigger('change')` no load).
  const previousNaturezaUuidRef = useRef<string | undefined>(watchedNaturezaUuid);
  useEffect(() => {
    const natureData = natureOperationDetailQuery.data;
    if (!watchedNaturezaUuid || !natureData) return;
    if (previousNaturezaUuidRef.current === watchedNaturezaUuid) return;
    previousNaturezaUuidRef.current = watchedNaturezaUuid;

    // NFE-R2-006 — sobrescreve CFOP/tributos fiscais de TODOS os itens,
    // respeitando `overwrite_product`/`sobrescreve_cfop_produto` (mirror
    // `_forms.blade.php:647-729` — seletores de classe globais `.cfopsi`/
    // `.cst-csosn`/etc no legado aplicam a TODAS as linhas de item, não só à
    // que disparou o evento). TASK-FE-036-D6/DEC-122 — rotina EXTRAÍDA para
    // `nfe-nature-cascade.ts` (função nomeada reutilizável), pois a cascata
    // Produto→item (`NfeItemsTab.tsx`) precisa reaplicar a MESMA rotina a
    // TODOS os itens quando `overwrite_product` está ligado, sem duplicar os
    // ~24 `setValue` entre os dois `useEffect`s.
    const currentTipo = watch('tipo');
    const currentItems = watch('items') ?? [];

    applyNatureCfopToAllItems(natureData, currentTipo, currentItems, setValue);
    applyNatureOverwriteToAllItems(natureData, currentItems, setValue);

    // NFE-R2-008 — Info. Complementares em cascata: a Natureza devolve
    // `additional_info_uuid`; ao mudar a Natureza, seleciona a mesma
    // informação complementar e preenche Observações (mirror
    // `_forms.blade.php:693`, `$('#inp-additional_info').val(data
    // .additional_info_id).trigger('change')`).
    if (natureData.additional_info_uuid) {
      setAdditionalInfoOption({
        label: natureData.additional_info?.description ?? natureData.additional_info_uuid,
        value: natureData.additional_info_uuid,
      });
      void applyAdditionalInfoToNote(natureData.additional_info_uuid);
    }
  }, [natureOperationDetailQuery.data, watchedNaturezaUuid]);

  function listNatureOperationsByTipo(params: {
    search?: string;
    page?: number;
    per_page?: number;
  }) {
    return listNatureOperations({ ...params, tipo: watchedTipo ?? undefined });
  }

  // ---- Finalidade → Tipo Débito/Crédito (E-11 do audit): obrigatórios
  // condicionais, sem limpar o valor já digitado ao trocar a Finalidade
  // (mirror `_forms.blade.php:565-588`, JS só alterna obrigatoriedade) -----
  const watchedFinnfe = watch('finnfe');
  const watchedTypeGuide = watch('type_guide');
  // UT-000776 / T-776-FE-05 (P-FE-05) — guia e defensivos agrícolas são exclusivos: quem tem
  // dado desabilita o outro bloco com aviso.
  const watchedUfGuide = watch('uf_guide');
  const watchedNumberGuide = watch('number_guide');
  const watchedSerieGuide = watch('serie_guide');
  const watchedAgroDefensivos = watch('agro_defensivos');
  const guideHasData = [
    watchedTypeGuide,
    watchedUfGuide,
    watchedNumberGuide,
    watchedSerieGuide,
  ].some((value) => !!value && String(value).trim() !== '');
  const hasAgroDefensivos = (watchedAgroDefensivos?.length ?? 0) > 0;

  // ---- Transportador: máscara dinâmica CPF↔CNPJ (mirror `CreateOrUpdate
  // Emissor.tsx`, inferida pela contagem de dígitos — a Nfe não tem um
  // `owner_type` irmão, diferente de `EquipamentoFiscalVeiculoTab.tsx`) ----

  // ---- Bloco Financeiro (TASK-FE-036-D2-2) — aba condicional só quando
  // "Gerar financeiro? = Sim" -------------------------------------------
  const watchedHasFinancial = watch('has_financial');
  const watchedItemsForTotal = watch('items') ?? [];
  const watchedShippingValue = Number(watch('shipping_value')) || 0;
  const watchedAddedValue = Number(watch('added_value')) || 0;
  const watchedHeaderDiscount = Number(watch('discount')) || 0;
  // Total da NF-e — MESMA fórmula de `NfeItemsTab.tsx`/`nfe-schema.ts`
  // (`nfe-total-must-be-positive`): base da distribuição de parcelas/rateio
  // do bloco Financeiro.
  const nfeTotalAmount =
    watchedItemsForTotal.reduce(
      (total, item) => total + (Number(item?.quantity) || 0) * (Number(item?.amount) || 0),
      0
    ) +
    watchedShippingValue +
    watchedAddedValue -
    watchedHeaderDiscount;

  // Guarda de aba órfã — se o usuário estiver na aba "Financeiro" e marcar
  // "Gerar financeiro? = Não", a `Tabs.Trigger`/`Tabs.Content` value="2"
  // deixam de existir (render condicional acima); volta para "Cabeçalho"
  // em vez de deixar `tabValue` apontando para uma aba inexistente.
  useEffect(() => {
    if (!watchedHasFinancial && tabValue === '2') {
      setTabValue('0');
    }
  }, [watchedHasFinancial, tabValue]);

  // Auto-vínculo do handoff "Emitir NFe" (exec-038, follow-up NFe) — GAP
  // documentado em `useStockWriteoffs.tsx`: até aqui a Nfe nascia pré-
  // preenchida a partir da Baixa, mas `nfe_uuid` NUNCA era setado na baixa,
  // então a action "Emitir NFe" nunca desaparecia (comportamento legado
  // confirmado pelo dono: some, sobra só Visualizar/Excluir). Chamada
  // isolada (`useMutation` direto, sem `useRequest`) — efeito silencioso de
  // pós-escrita que NUNCA pode derrubar a Nfe já salva com sucesso; por
  // isso o próprio `.catch` trata a falha com `toaster.warning`, em vez de
  // deixar o `onError` padrão de `useRequest` (que dispara `toaster.error`)
  // competir com o toast de sucesso da Nfe.
  async function linkStockWriteoffNfeAfterCreate(nfeUuid: string) {
    if (!stockWriteoffUuidForNfe) return;
    try {
      await linkNfeToStockWriteoff(stockWriteoffUuidForNfe, { nfe_uuid: nfeUuid });
      queryClient.invalidateQueries({ queryKey: [queryKey.stockWriteoffs.stockWriteoffsList] });
      queryClient.invalidateQueries({ queryKey: [queryKey.stockWriteoffs.stockWriteoff] });
    } catch {
      toaster.warning({
        title: stockWriteoffText.nfeHandoff.autoLinkErrorToast.title,
        description: stockWriteoffText.nfeHandoff.autoLinkErrorToast.description,
      });
    }
  }

  const nfeMutation = useRequest({
    asyncFunction: tryPersistNfe,
    entityName: text.singularLabel,
    queryKey: queryKey.nfes.nfesList,
    queryKey2: queryKey.nfes.nfe,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: (data) => {
      if (!isEditing && stockWriteoffUuidForNfe) {
        void linkStockWriteoffNfeAfterCreate(data.uuid);
      }
      navigate(-1);
    },
  });

  async function tryPersistNfe(data: NfeFormType) {
    const isDevolucaoPayload = Number(data.finnfe) === NFE_FINNFE_DEVOLUCAO;
    const items = data.items.map((item) => ({
      product_uuid: item.product_uuid!.value,
      quantity: Number(item.quantity),
      amount: Number(item.amount),
      package_uuid: item.package_uuid?.value ?? null,
      area_uuid: item.area_uuid?.value ?? null,
      // TASK-FE-036-B17-2 — "Sem Estoque" (opção sintética, `NfeItemsTab.tsx`)
      // carrega `value: ''`, tratado aqui como ausência de armazém (`||`, não
      // `??`) — mirror Regra E.6, armazém NÃO obrigatório.
      warehouse_uuid: item.warehouse_uuid?.value || null,
      discount: Number(item.discount ?? 0),
      order_item: item.order_item?.trim() || null,
      cfop: item.cfop?.trim() || null,
      cfop_saida_interno: item.cfop_saida_interno?.trim() || null,
      cfop_saida_externo: item.cfop_saida_externo?.trim() || null,
      cst_csosn: item.cst_csosn?.trim() || null,
      cst_csosn_exp: item.cst_csosn_exp?.trim() || null,
      cst_pis: item.cst_pis?.trim() || null,
      cst_cofins: item.cst_cofins?.trim() || null,
      cst_ipi: item.cst_ipi?.trim() || null,
      cenq_ipi: item.cenq_ipi?.trim() || null,
      perc_icms: item.perc_icms ?? null,
      perc_pis: item.perc_pis ?? null,
      perc_cofins: item.perc_cofins ?? null,
      perc_ipi: item.perc_ipi ?? null,
      cest: item.cest?.trim() || null,
      barcode: item.barcode?.trim() || null,
      percent_reduction: item.percent_reduction ?? null,
      // C1 (D-101-19): oculto pelo CST do item => null; FCP 0/vazio => null (P-F2).
      ...sanitizeC1ForCst(item.cst_csosn, {
        mot_des_icms: item.mot_des_icms,
        perc_dif: item.perc_dif,
        perc_fcp: item.perc_fcp,
      }),
      modality_bc: item.modality_bc ?? null,
      origem: item.origem?.trim() || null,
      reference: item.reference?.trim() || null,
      cbenef: item.cbenef?.trim() || null,
      c_class_trib: item.c_class_trib?.trim() || null,
      cst_ibs_cbs: item.cst_ibs_cbs?.trim() || null,
      perc_ibs_uf: item.perc_ibs_uf ?? null,
      perc_ibs_mun: item.perc_ibs_mun ?? null,
      perc_reducao_aliq_ibs_uf: item.perc_reducao_aliq_ibs_uf ?? null,
      perc_reducao_aliq_ibs_mun: item.perc_reducao_aliq_ibs_mun ?? null,
      perc_dif_ibs_uf: item.perc_dif_ibs_uf ?? null,
      perc_dif_ibs_mun: item.perc_dif_ibs_mun ?? null,
      perc_cbs: item.perc_cbs ?? null,
      perc_reducao_aliq_cbs: item.perc_reducao_aliq_cbs ?? null,
      perc_dif_cbs: item.perc_dif_cbs ?? null,
      cst_is: item.cst_is?.trim() || null,
      perc_is: item.perc_is ?? null,
      perc_is_espec: item.perc_is_espec ?? null,
      u_trib_is: item.u_trib_is?.trim() || null,
      ad_rem_ibs: item.ad_rem_ibs ?? null,
      ad_rem_cbs: item.ad_rem_cbs ?? null,
      tp_cred_pres_ibs_zfm: item.tp_cred_pres_ibs_zfm ?? null,
      ind_doacao: item.ind_doacao?.trim() || null,
      // UT-000776 / T-776-FE-04 — referência por item SÓ em devolução
      // (finnfe=4); nas demais finalidades as chaves nem vão no payload.
      ...(isDevolucaoPayload
        ? {
            ref_access_key: item.ref_access_key?.trim() || undefined,
            ref_item_number: item.ref_item_number ?? undefined,
            // 05b: perc_ipi_devol so em devolucao (finnfe=4); fora, a chave nem vai no payload.
            perc_ipi_devol: item.perc_ipi_devol ?? null,
          }
        : {}),
    }));

    const payload: NfePayload = {
      client_uuid: data.client_uuid!.value,
      natureza_uuid: data.natureza_uuid!.value,
      state_registration_client: data.state_registration_client!.trim(),
      type_payment: data.type_payment!.trim(),
      emissor_uuid: data.emissor_uuid?.value ?? undefined,
      harvest_uuid: data.harvest_uuid?.value ?? undefined,
      // D4/§D4 do MAPA `nfe-form-behavior.md` — "Prestador de Serviço".
      provider_uuid: data.provider_uuid?.value ?? undefined,
      type_debt: data.type_debt?.trim() || undefined,
      type_credit: data.type_credit?.trim() || undefined,
      transp_name: data.transp_name?.trim() || undefined,
      transp_cnpj: data.transp_cnpj?.trim() || undefined,
      transp_address: data.transp_address?.trim() || undefined,
      transp_city_uuid: data.transp_city_uuid?.value ?? undefined,
      shipping_type: data.shipping_type ?? undefined,
      shipping_board_vehicle: data.shipping_board_vehicle?.trim() || undefined,
      shipping_uf_shipping: data.shipping_uf_shipping || undefined,
      shipping_value: Number(data.shipping_value ?? 0),
      specie: data.specie?.trim() || undefined,
      number_volumes: data.number_volumes ?? undefined,
      quantity_volumes: data.quantity_volumes ?? undefined,
      gross_weight: data.gross_weight ?? undefined,
      net_weight: data.net_weight ?? undefined,
      departure_date: data.departure_date || undefined,
      delivery_date: data.delivery_date || undefined,
      // DERIVADO (soma dos itens, `NfeItemsTab.tsx`) — sempre enviado, o
      // servidor grava o valor recebido sem recalcular a soma sozinho
      // (contrato de tela §4.3).
      discount: Number(data.discount ?? 0),
      added_value: Number(data.added_value ?? 0),
      percent_icms: data.percent_icms ?? undefined,
      icms_base: data.icms_base ?? undefined,
      gta: data.gta?.trim() || undefined,
      type_guide: data.type_guide?.trim() || undefined,
      uf_guide: data.uf_guide || undefined,
      number_guide: data.number_guide?.trim() || undefined,
      serie_guide: data.serie_guide?.trim() || undefined,
      // UT-000776 / T-776-FE-05 — SEMPRE enviado (mesmo vazio) para que remover todos os
      // defensivos limpe no servidor (a lista substitui; omitir preservaria).
      agro_defensivos: (data.agro_defensivos ?? []).map((row) => ({
        n_receituario: row.n_receituario.trim(),
        cpf_resp_tec: onlyDigits(row.cpf_resp_tec),
      })),
      order_number: data.order_number?.trim() || undefined,
      ref_nfe: data.ref_nfe?.trim() || undefined,
      note: data.note?.trim() || undefined,
      antt: data.antt?.trim() || undefined,
      tipo: data.tipo ?? undefined,
      finnfe: data.finnfe ?? undefined,
      // Tipo Emissão / "Gerar financeiro?" — E2E do dono, esteira 036fix5,
      // backend habilitando a persistência em paralelo.
      type_emission: data.type_emission ?? undefined,
      has_financial: !!data.has_financial,
      // Bloco Financeiro real (TASK-FE-036-D2-2) — os 4 campos SÓ entram no
      // payload quando `has_financial===true` (mirror DoD "marcar Não
      // oculta e limpa os 4 campos do payload"); `undefined` é OMITIDO pelo
      // client HTTP (mesmo racional de `provider_uuid`/`harvest_uuid`
      // acima), nunca enviado como array vazio/uuid vazio.
      ...(data.has_financial
        ? {
            financial_type_title_uuid: data.financial_type_title_uuid?.value,
            financial_proprietary_uuid: data.financial_proprietary_uuid?.value ?? null,
            financial_installments: data.financial_installments.map((installment) => ({
              due_date: installment.due_date!,
              value: Number(installment.value),
            })),
            financial_categories: data.financial_categories.map((category) => ({
              category_uuid: category.category_uuid!,
              percentage: Number(category.percentage),
              center_uuid: category.center_uuid!,
              plan_account_uuid: category.plan_account_uuid ?? null,
            })),
          }
        : {}),
      items,
    };

    try {
      if (isEditing && nfeId) {
        return await updateNfe(nfeId, payload);
      }
      return await createNfe(payload);
    } catch (error) {
      // UT-000776 / T-776-FE-04 — 422 flat `items.N.ref_access_key|
      // ref_item_number` aparece no campo da linha; o `throw` preserva o
      // toast padrão de `useRequest`.
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([key, messages]) => {
          // UT-000776 / T-776-FE-05 — `agro_defensivos` (raiz) e `agro_defensivos.N.*` (por linha).
          const agroMatch = /^agro_defensivos(?:\.(\d+)\.(n_receituario|cpf_resp_tec))?$/.exec(key);
          if (agroMatch && messages?.[0]) {
            setError(
              (agroMatch[1] !== undefined
                ? `agro_defensivos.${Number(agroMatch[1])}.${agroMatch[2]}`
                : 'agro_defensivos') as any,
              { type: 'server', message: messages[0] }
            );
            return;
          }
          if (key === 'shipping_type' && messages?.[0]) {
            setError('shipping_type', { type: 'server', message: messages[0] });
            return;
          }
          const match =
            /^items\.(\d+)\.(ref_access_key|ref_item_number|mot_des_icms|perc_dif|perc_fcp|perc_ipi_devol)$/.exec(
              key
            );
          if (match && messages?.[0]) {
            setError(
              `items.${Number(match[1])}.${match[2] as keyof NfeItemForm}` as `items.${number}.${keyof NfeItemForm}`,
              {
                type: 'server',
                message: messages[0],
              }
            );
          }
        });
      }
      throw error;
    }
  }

  // `ref_nfe`/`number_guide` — só dígitos (mirror `_forms.blade.php:75-78`/
  // `:201-204`, `oninput` do legado). Campo 100% uncontrolled
  // (`register()` puro): muta o `event.target.value` ANTES de repassar ao
  // `onChange` original de `register()` — mesmo padrão mutate-event já
  // usado em `CreateOrUpdateProprietario.tsx#registerStateRegistration`
  // (`event.target` é o nó DOM real por trás do `ref` que o RHF lê).
  function registerDigitsOnly(name: 'ref_nfe' | 'number_guide') {
    const field = register(name);
    return {
      ...field,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        event.target.value = onlyDigits(event.target.value);
        return field.onChange(event);
      },
    };
  }

  const isSubmitting = nfeMutation.isPending;

  async function onSubmit(data: NfeFormType) {
    // NFE-R2-007 (REAUDITORIA-036-2a-rodada.md) — quando a Natureza NÃO usa
    // cálculo automático de ICMS, `percent_icms`/`icms_base` passam a ser
    // obrigatórios (mirror `_forms.blade.php:639`,
    // `$('.calc-icms').find('input').prop('required', !automaticCalculation)`).
    // Checagem manual (pós-Yup) — a obrigatoriedade depende de dado externo
    // ao form (a Natureza buscada à parte), não de um campo irmão do schema.
    if (!icmsAutomaticCalculation) {
      if (data.percent_icms === null || data.percent_icms === undefined) {
        setError('percent_icms', {
          type: 'manual',
          message: formText.validation.percentIcmsRequired,
        });
        setTabValue('0');
        return;
      }
      if (data.icms_base === null || data.icms_base === undefined) {
        setError('icms_base', { type: 'manual', message: formText.validation.icmsBaseRequired });
        setTabValue('0');
        return;
      }
    }

    await nfeMutation.mutateAsync(data);
  }

  function onInvalid(formErrors: FieldErrors<NfeFormType>) {
    const erroredFieldNames = Object.keys(formErrors) as (keyof NfeFormType)[];
    if (erroredFieldNames.length === 0) return;

    const erroredTab = erroredFieldNames
      .map((field) => FIELD_TAB_MAP[field])
      .find((tab): tab is NfeTabKey => !!tab && tab !== tabValue);

    if (erroredTab) {
      setTabValue(erroredTab);
    }

    const firstErrorMessage = Object.values(formErrors).find(
      (fieldError): fieldError is { message?: string } =>
        !!fieldError && typeof fieldError === 'object' && 'message' in fieldError
    )?.message;

    toaster.error({
      title: isEditing ? formText.title.edit : formText.title.create,
      description: firstErrorMessage,
      duration: 6000,
    });
  }

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      subtitle={isEditing ? formText.subtitle.edit : formText.subtitle.create}
      showDivider
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            onClick={() => navigate(-1)}
            type="button"
            disabled={isSubmitting}
          />
          {canSave && (
            <Button
              title={languageGB.defaltStrings.save}
              type="button"
              onClick={handleSubmit(onSubmit, onInvalid)}
              loading={isSubmitting}
              disabled={isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form onSubmit={handleSubmit(onSubmit, onInvalid)} noPadding>
        {/* @ts-ignore - custom variant */}
        <Tabs.Root
          value={tabValue}
          onValueChange={(details: { value: string }) => setTabValue(details.value as NfeTabKey)}
          variant="outline"
        >
          {/* @ts-ignore Tab List fixa (sticky) no topo do body: abas sempre
              visíveis, só o conteúdo da aba rola. */}
          <Tabs.List position="sticky" top="0" zIndex={1} bg="formBG">
            {/* @ts-ignore */}
            <Tabs.Trigger value="0">{formText.tabs.header}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="1">{formText.tabs.items}</Tabs.Trigger>
            {/* TASK-FE-036-D2-2 — aba condicional, só existe quando "Gerar
                financeiro? = Sim" (mesmo padrão de exibição condicional já
                usado pelo bloco ICMS manual/Tipo Débito/Crédito acima). */}
            {watchedHasFinancial && (
              // @ts-ignore
              <Tabs.Trigger value="2">{formText.tabs.financial}</Tabs.Trigger>
            )}
          </Tabs.List>

          {/* ---- ABA 1: Cabeçalho (TASK-FE-036-404, ESTE arquivo) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="0">
            {/* REWORK DE FIDELIDADE (E2E do dono, esteira 036fix5) — ordem
                mirror `_forms.blade.php:9-99`: Cliente | Inscrição Estadual
                | Operação, depois Natureza (linha cheia no legado). Sem
                "Fornecedor" (não existe no cabeçalho do legado — só
                Cliente). `Safra`/`Emissor` não têm equivalente literal na
                1ª linha do legado, mantidos aqui (campos reais do backend,
                sem GAP aberto). */}
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="fg.muted"
              textTransform="uppercase"
              mt={4}
              mb={2}
            >
              {formText.sections.identification}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <Controller
                name="client_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.client}
                    placeholder={formText.placeholders.client}
                    error={errors.client_uuid?.message as string | undefined}
                    service={listClients}
                    mapOptions={(item: ClientListItem) => ({
                      label: item.name,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isRequired
                    isDisabled={!canSave || isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    // TASK-MV-FE-11 (mirror) — força reler a página 1
                    // depois de criar/editar um cliente pelo modal ao lado.
                    cacheUniqs={[clientOptionsCacheKey]}
                    // EST-07 (ajuste UX, esteira 006 — item separado do
                    // datepicker): o antigo `IconButton` avulso ao lado do
                    // select (P1 do audit — legado tinha 2 botões, aqui 1 só
                    // contextual: `BiPlusCircle` vazio / `MdOutlineEdit` com
                    // cliente, mesmo par de ícones do `SelectAsyncPaginateEditable`)
                    // virou uma ação no próprio label do select, via
                    // `labelAction`. Mesma regra de `disabled`/aria-label de
                    // antes; o `Field` isola o clique (stopPropagation) para
                    // não focar/abrir o select por associação de `<label>`.
                    // Refinamento visual (esteira 006, item separado — 2ª
                    // rodada): a pedido do dono o botão perdeu o fill sólido
                    // e ficou só-ícone (`variant="ghost"`, sem fundo). A cor
                    // do ícone passou a ser puxada diretamente do token
                    // semântico `primaryMain` (mesmo verde-marca theme-aware
                    // que o `buttonSolidBG` usava — `blue.500`/`blue.400` no
                    // mapeamento local do app, que renderiza verde em light
                    // e dark) para manter o ícone verde sem depender do fill.
                    labelActionTooltip={
                      field.value ? formText.actions.editClientAria : formText.actions.addClientAria
                    }
                    labelAction={
                      <IconButton
                        aria-label={
                          field.value
                            ? formText.actions.editClientAria
                            : formText.actions.addClientAria
                        }
                        variant="ghost"
                        size="2xs"
                        minH="0"
                        h="20px"
                        w="20px"
                        minW="0"
                        p="0"
                        disabled={
                          !canSave || isLoading || !(can('clients_create') || can('clients_edit'))
                        }
                        onClick={clientModalDisclosure.onOpen}
                      >
                        <Icon
                          as={field.value ? MdOutlineEdit : BiPlusCircle}
                          boxSize="16px"
                          color="primaryMain"
                        />
                      </IconButton>
                    }
                  />
                )}
              />

              {/* Inscrição Estadual — mirror `_forms.blade.php:36-46`, logo
                  após o Cliente na mesma linha (E2E do dono, esteira 036fix5,
                  item 2). */}
              <Controller
                name="state_registration_client"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.stateRegistrationClient}
                    tooltip={formText.hints.clientNoLabel}
                    name={name}
                    value={
                      stateRegistrationOptions.find((option) => option.value === value) ?? null
                    }
                    onChange={(option: Option<string> | null) => onChange(option?.value ?? null)}
                    options={stateRegistrationOptions}
                    error={errors.state_registration_client?.message}
                    isRequired
                    loading={isLoading || checkLoadingStatus([clientDetailQuery as any])}
                    isDisabled={!canSave || !watchedClientUuid}
                  />
                )}
              />

              {/* Operação (tipo) — mirror `_forms.blade.php:48-52`, 3ª
                  posição da 1ª linha do legado (Cliente | IE | Operação). */}
              <Controller
                name="tipo"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.tipo}
                    name={name}
                    value={nfeTipoOperacaoOptions.find((option) => option.value === value) ?? null}
                    onChange={(option: Option<number> | null) => onChange(option?.value ?? null)}
                    options={nfeTipoOperacaoOptions}
                    error={errors.tipo?.message}
                    isRequired
                    noClearable
                    isDisabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="natureza_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.natureza}
                    placeholder={formText.placeholders.natureza}
                    error={errors.natureza_uuid?.message as string | undefined}
                    service={listNatureOperationsByTipo}
                    mapOptions={(item: NatureOperationListItem) => ({
                      label: item.descricao,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isRequired
                    isDisabled={!canSave || isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    // D-01 do audit — recarrega ao trocar a Operação (`tipo`).
                    cacheUniqs={[watchedTipo]}
                  />
                )}
              />

              <Controller
                name="harvest_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.harvest}
                    placeholder={formText.placeholders.harvest}
                    service={listHarvests}
                    mapOptions={(item: { uuid: string; description: string }) => ({
                      label: item.description,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isDisabled={!canSave || isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Controller
                name="emissor_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.emissor}
                    placeholder={formText.placeholders.emissor}
                    service={listIssuers}
                    mapOptions={(item: { uuid: string; razao_social: string }) => ({
                      label: item.razao_social,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isDisabled={!canSave || isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
            </SimpleGrid>

            {/* REWORK DE FIDELIDADE (E2E do dono, esteira 036fix5) — ordem
                mirror `_forms.blade.php:61-99`: Tipo Emissão | Finalidade |
                Dt. Saída | Dt. Entrega | [ICMS manual] | Gerar Financeiro |
                NFe Referência | Número Pedido | Tipo Débito | Tipo Crédito.
                `type_emission`/`has_financial` NOVOS (itens 3/4, backend
                habilitando a persistência em paralelo). `type_debt`/
                `type_credit`/`ref_nfe`/`order_number` MOVIDOS para cá (antes
                na seção Pagamento/Observações — o legado os tem no MESMO
                bloco de cabeçalho, não junto de Tipo de Pagamento/
                Observações).
                CORREÇÃO PÓS-E2E (rodada 1, Achado D3) — o campo POR-NOTA
                "Calcular ICMS Desonerado?" foi REMOVIDO daqui: o legado NÃO
                tem esse campo na nota; o ICMS desonerado é controlado por um
                PARÂMETRO DA FAZENDA (`calc_icms_desonerado`, Select Sim/Não
                em Parâmetros do tenant — `TenantParameters/index.tsx`), que
                o backend deve ler no cálculo do `vNF`. Ver Gap registrado
                para a API (o payload/response desta tela ainda expunham
                `calc_icms_unburdened` por-nota antes desta correção). */}
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="fg.muted"
              textTransform="uppercase"
              mt={6}
              mb={2}
            >
              {formText.sections.issuanceFiscal}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <Controller
                name="type_emission"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.typeEmission}
                    name={name}
                    value={nfeTypeEmissionOptions.find((option) => option.value === value) ?? null}
                    onChange={(option: Option<number> | null) => onChange(option?.value ?? 1)}
                    options={nfeTypeEmissionOptions}
                    error={errors.type_emission?.message}
                    isRequired
                    noClearable
                    isDisabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="finnfe"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.finnfe}
                    name={name}
                    value={nfeFinalidadeOptions.find((option) => option.value === value) ?? null}
                    onChange={(option: Option<number> | null) => onChange(option?.value ?? null)}
                    options={nfeFinalidadeOptions}
                    error={errors.finnfe?.message}
                    isRequired
                    noClearable
                    isDisabled={!canSave || isLoading}
                  />
                )}
              />

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {formText.fields.departureDate}
                </Text>
                <Controller
                  name="departure_date"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <DateInput
                      value={value ?? null}
                      onChange={onChange}
                      disabled={!canSave || isLoading}
                    />
                  )}
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {formText.fields.deliveryDate}
                </Text>
                <Controller
                  name="delivery_date"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <DateInput
                      value={value ?? null}
                      onChange={onChange}
                      disabled={!canSave || isLoading}
                    />
                  )}
                />
              </Box>

              {/* NFE-R2-007 (REAUDITORIA-036-2a-rodada.md) — bloco ICMS
                  manual só aparece (e só é obrigatório) quando a Natureza
                  NÃO usa cálculo automático (mirror `_forms.blade.php:
                  633-639`, `.calc-icms` some por padrão). Obrigatoriedade
                  aplicada no submit (`onSubmit`), abaixo. */}
              {!icmsAutomaticCalculation && (
                <>
                  <Controller
                    name="percent_icms"
                    control={control}
                    render={({ field }) => (
                      <NumberInput
                        name={field.name}
                        label={formText.fields.percentIcms}
                        allowDot
                        decimalPlaces={2}
                        value={field.value ?? null}
                        onValueChange={(value) => field.onChange(value)}
                        error={errors.percent_icms?.message}
                        isRequired
                        disabled={!canSave || isLoading}
                      />
                    )}
                  />

                  <Controller
                    name="icms_base"
                    control={control}
                    render={({ field }) => (
                      <NumberInput
                        name={field.name}
                        label={formText.fields.icmsBase}
                        allowDot
                        decimalPlaces={2}
                        value={field.value ?? null}
                        onValueChange={(value) => field.onChange(value)}
                        error={errors.icms_base?.message}
                        isRequired
                        disabled={!canSave || isLoading}
                      />
                    )}
                  />
                </>
              )}

              {/* "Gerar financeiro?" — NOVO (item 4, E2E do dono). Só o
                  campo/valor; a geração financeira em si é fase posterior
                  (backend habilitando a persistência em paralelo). */}
              <Controller
                name="has_financial"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.hasFinancial}
                    name={name}
                    value={
                      [
                        { value: true, label: languageGB.defaltStrings.yes },
                        { value: false, label: languageGB.defaltStrings.no },
                      ].find((option) => option.value === !!value) ?? null
                    }
                    onChange={(option: Option<boolean> | null) => onChange(!!option?.value)}
                    options={[
                      { value: true, label: languageGB.defaltStrings.yes },
                      { value: false, label: languageGB.defaltStrings.no },
                    ]}
                    noClearable
                    isDisabled={!canSave || isLoading}
                  />
                )}
              />

              {/* D5 (correcoes-e2e-rodada-1, img14) — Chrome sugere
                  "preenchimento automático de formas de pagamento" (aviso de
                  conexão insegura, HTTP) em inputs numéricos livres perto de
                  Tipo de Pagamento/Tipo de Débito/Crédito. `autoComplete="off"`
                  suprime o heurístico do navegador sem mudar validação/
                  persistência (padrão a reaplicar em outros forms com o
                  mesmo agrupamento, se reincidir). */}
              {/* D1 (T-DEF02-FE-01) — em devolução a referência vai SÓ por item (NT 2025.002,
                  VC02-14/1010): o campo do cabeçalho é atalho de preenchimento dos itens. */}
              <Input
                label={
                  Number(watchedFinnfe) === NFE_FINNFE_DEVOLUCAO
                    ? formText.fields.refNfeDevolucao
                    : formText.fields.refNfe
                }
                helperText={
                  Number(watchedFinnfe) === NFE_FINNFE_DEVOLUCAO
                    ? formText.fields.refNfeDevolucaoHint
                    : undefined
                }
                maxLength={44}
                error={errors.ref_nfe?.message}
                autoComplete="off"
                {...registerDigitsOnly('ref_nfe')}
                disabled={!canSave || isLoading}
              />

              <Input
                label={formText.fields.orderNumber}
                maxLength={20}
                autoComplete="off"
                {...register('order_number')}
                disabled={!canSave || isLoading}
              />

              <Controller
                name="type_debt"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.typeDebt}
                    name={name}
                    value={nfeTypeDebtOptions.find((option) => option.value === value) ?? null}
                    onChange={(option: Option<string> | null) => onChange(option?.value ?? null)}
                    options={nfeTypeDebtOptions}
                    error={errors.type_debt?.message}
                    // E-11 do audit — obrigatório só para Finalidade
                    // "Nota de débito" (`finnfe === 6`).
                    isRequired={watchedFinnfe === 6}
                    isDisabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="type_credit"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.typeCredit}
                    name={name}
                    value={nfeTypeCreditOptions.find((option) => option.value === value) ?? null}
                    onChange={(option: Option<string> | null) => onChange(option?.value ?? null)}
                    options={nfeTypeCreditOptions}
                    error={errors.type_credit?.message}
                    // E-11 do audit — obrigatório só para Finalidade
                    // "Nota de crédito" (`finnfe === 5`).
                    isRequired={watchedFinnfe === 5}
                    isDisabled={!canSave || isLoading}
                  />
                )}
              />
            </SimpleGrid>

            {/* REWORK DE FIDELIDADE (correcoes-e2e-rodada-1, D4/img12,13) —
                a seção única "Guia/Transporte" foi separada em 3 painéis
                irmãos, na MESMA ordem do legado (mirror
                `_forms.blade.php:172-266`, confirmado em
                `MAPA-nfe-form-behavior.md` §D4): Transportadora → Frete →
                Volume. Nomes de campo/rótulo EXATOS do mapa; nenhum campo
                inventado. */}

            {/* ---- Transportadora ---- */}
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="fg.muted"
              textTransform="uppercase"
              mt={6}
              mb={2}
            >
              {formText.sections.transportadora}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <Controller
                name="transp_cnpj"
                control={control}
                render={({ field, fieldState }) => (
                  <MaskedInput
                    kind="cpfCnpj"
                    label={formText.fields.transpCnpj}
                    name={field.name}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Input
                label={formText.fields.transpName}
                maxLength={80}
                {...register('transp_name')}
                disabled={!canSave || isLoading}
              />

              <Controller
                name="transp_city_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.transpCity}
                    placeholder={formText.placeholders.transpCity}
                    service={listCityOptions}
                    mapOptions={(item: CityListItem) => ({ label: item.title, value: item.uuid })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isDisabled={!canSave || isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Input
                label={formText.fields.transpAddress}
                maxLength={80}
                {...register('transp_address')}
                disabled={!canSave || isLoading}
              />

              {/* D4/§D4 do MAPA — "Prestador de Serviço" (`provider_id` no
                  legado, `_forms.blade.php:172-209`). Reaproveita o FK real
                  `provider_uuid` de `NfeRequest`/`NfePayload` (já exposto na
                  Visualização como "Fornecedor"), nunca antes renderizado
                  neste formulário. Lookup enxuto `/providers/options`
                  (mirror `listWarehouseOptions`/`listProductOptions`, sem o
                  gate do CRUD `providers_view`). */}
              <Controller
                name="provider_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.providerService}
                    placeholder={formText.placeholders.providerService}
                    service={listProviderOptions}
                    mapOptions={(item: ProviderOptionItem) => ({
                      label: item.label,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isDisabled={!canSave || isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Controller
                name="type_guide"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.typeGuide}
                    name={name}
                    value={nfeTypeGuideOptions.find((option) => option.value === value) ?? null}
                    onChange={(option: Option<string> | null) => onChange(option?.value ?? null)}
                    options={nfeTypeGuideOptions}
                    isDisabled={!canSave || isLoading || hasAgroDefensivos}
                  />
                )}
              />

              <Controller
                name="uf_guide"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.ufGuide}
                    name={name}
                    value={ufOptions.find((option) => option.value === value) ?? null}
                    onChange={(option: Option<string> | null) => onChange(option?.value ?? null)}
                    options={ufOptions}
                    error={errors.uf_guide?.message}
                    // E-11 do audit — obrigatório só quando um Tipo de Guia
                    // é selecionado (`toggleRequiredGuideFields` do legado).
                    isRequired={!!watchedTypeGuide}
                    isDisabled={!canSave || isLoading || hasAgroDefensivos}
                  />
                )}
              />

              <Input
                label={formText.fields.numberGuide}
                maxLength={9}
                error={errors.number_guide?.message}
                isRequired={!!watchedTypeGuide}
                {...registerDigitsOnly('number_guide')}
                disabled={!canSave || isLoading || hasAgroDefensivos}
              />

              <Input
                label={formText.fields.serieGuide}
                maxLength={9}
                {...register('serie_guide')}
                disabled={!canSave || isLoading || hasAgroDefensivos}
              />

              {/* DIVERGÊNCIA sinalizada (não corrigida nesta leva, fora do
                  escopo de D4 que é só regrupamento de layout) — o MAPA
                  (`nfe-form-behavior.md` §D4) confirma que o legado NÃO tem
                  um campo "GTA" separado: GTA é apenas a opção "1 - GTA -
                  Guia de Trânsito Animal" do próprio Tipo de Guia
                  (`legacy:app/Nfe.php:271-281`). Este front, porém, já
                  persiste `gta` como coluna própria real (`NfeDetail`/
                  `NfePayload.gta`) — mantido aqui para não perder dado/
                  funcionalidade já em produção; ver GAP a abrir pelo
                  Arquiteto para decidir manter/descontinuar. */}
              <Input
                label={formText.fields.gta}
                {...register('gta')}
                disabled={!canSave || isLoading}
              />
            </SimpleGrid>

            {/* UT-000776 / T-776-FE-05 — Defensivos agrícolas (exclusivo com a guia, P-FE-05). */}
            {hasAgroDefensivos && (
              <Text role="status" fontSize="sm" color="fg.muted" mt={2}>
                {formText.agroDefensivos.guideDisabledByDefensivos}
              </Text>
            )}
            <NfeAgroDefensivosBlock
              control={control}
              guideHasData={guideHasData}
              disabled={!canSave || isLoading}
            />

            {/* ---- Frete ---- */}
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="fg.muted"
              textTransform="uppercase"
              mt={6}
              mb={2}
            >
              {formText.sections.frete}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <Controller
                name="shipping_type"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.shippingType}
                    name={name}
                    value={nfeShippingTypeOptions.find((option) => option.value === value) ?? null}
                    onChange={(option: Option<number> | null) => onChange(option?.value ?? null)}
                    options={nfeShippingTypeOptions}
                    noClearable
                    isRequired
                    error={errors.shipping_type?.message}
                    isDisabled={!canSave || isLoading}
                  />
                )}
              />

              <Input
                label={formText.fields.antt}
                maxLength={15}
                {...register('antt')}
                disabled={!canSave || isLoading}
              />

              <Controller
                name="shipping_board_vehicle"
                control={control}
                render={({ field, fieldState }) => (
                  <MaskedInput
                    kind="plate"
                    label={formText.fields.shippingBoardVehicle}
                    name={field.name}
                    // Placa antiga (ABC-1234) e Mercosul (ABC-1D99): mirror do
                    // jquery.mask do legado (`AAA-0A00`, `A` = alfanumérico),
                    // 5ª posição aceita letra OU dígito (UT-000783).
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="shipping_uf_shipping"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.shippingUfShipping}
                    name={name}
                    value={ufOptions.find((option) => option.value === value) ?? null}
                    onChange={(option: Option<string> | null) => onChange(option?.value ?? null)}
                    options={ufOptions}
                    isDisabled={!canSave || isLoading}
                  />
                )}
              />

              {/* Valor do Frete — mirror `_forms.blade.php:236`, campo da
                  seção "Frete" do legado (E2E do dono, esteira 036fix5,
                  item 6 — antes vivia, DUPLICADO, na seção Totais de
                  `NfeItemsTab.tsx`; o cálculo do Total da NFe continua
                  lendo o MESMO `shipping_value` do form raiz). */}
              <Controller
                name="shipping_value"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    name={field.name}
                    label={formText.totalsFields.shippingValue}
                    allowDot
                    decimalPlaces={2}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    disabled={!canSave || isLoading}
                  />
                )}
              />
            </SimpleGrid>

            {/* ---- Volume ---- */}
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="fg.muted"
              textTransform="uppercase"
              mt={6}
              mb={2}
            >
              {formText.sections.volume}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <Input
                label={formText.fields.specie}
                maxLength={30}
                {...register('specie')}
                disabled={!canSave || isLoading}
              />

              <Controller
                name="number_volumes"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    name={field.name}
                    label={formText.fields.numberVolumes}
                    allowDot
                    decimalPlaces={2}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="quantity_volumes"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    name={field.name}
                    label={formText.fields.quantityVolumes}
                    allowDot
                    decimalPlaces={2}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="net_weight"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    name={field.name}
                    label={formText.fields.netWeight}
                    allowDot
                    decimalPlaces={2}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="gross_weight"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    name={field.name}
                    label={formText.fields.grossWeight}
                    allowDot
                    decimalPlaces={2}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    disabled={!canSave || isLoading}
                  />
                )}
              />
            </SimpleGrid>
          </Tabs.Content>

          {/* ---- ABA 2: Itens & Totais (TASK-FE-036-405) ----
              REWORK DE FIDELIDADE (E2E do dono, esteira 036fix5, item 6) —
              Tipo de Pagamento/Info. Complementares/Observações MOVIDOS
              para dentro do bloco "Totais" de `NfeItemsTab.tsx` (mirror
              `_forms.blade.php:133-159`: o legado tem esses 3 campos no
              MESMO painel-footer dos totais, não numa seção à parte). */}
          {/* @ts-ignore */}
          <Tabs.Content value="1">
            <NfeItemsTab
              control={control}
              errors={errors}
              additionalInfoOption={additionalInfoOption}
              onAdditionalInfoChange={handleAdditionalInfoChange}
              watch={watch}
              setValue={setValue}
              clearErrors={clearErrors}
              isLoading={!!isLoading}
              canSave={canSave}
              // TASK-FE-036-D6/DEC-122 — a cascata Produto→item precisa ler
              // `overwrite_product`/`sobrescreve_cfop_produto`/CFOPs da MESMA
              // Natureza já resolvida aqui (evita 2º `GET
              // /nature-operations/{uuid}` redundante por linha de item).
              natureOperationData={natureOperationDetailQuery.data ?? null}
              cascadeOnMount={cascadeOnMount}
            />
          </Tabs.Content>

          {/* ---- ABA 3: Financeiro (TASK-FE-036-D2-2, condicional) ---- */}
          {watchedHasFinancial && (
            // @ts-ignore
            <Tabs.Content value="2">
              <NfeFinancialTab
                control={control}
                errors={errors}
                watch={watch}
                setValue={setValue}
                isLoading={!!isLoading}
                canSave={canSave}
                totalAmount={nfeTotalAmount}
              />
            </Tabs.Content>
          )}
        </Tabs.Root>
      </Form>

      {/* Botão contextual de Cliente (P1 do audit, mirror TASK-MV-FE-11) —
          `clientUuid` lido direto de `watch`, não um `useState` paralelo, o
          modal sempre reflete o valor ATUAL do campo neste formulário. */}
      <ClientFormModal
        isOpen={clientModalDisclosure.open}
        onClose={clientModalDisclosure.onClose}
        clientUuid={watch('client_uuid')?.value}
        onSaved={(client) => {
          setValue(
            'client_uuid',
            { value: client.uuid, label: client.label },
            {
              shouldDirty: true,
              shouldValidate: true,
            }
          );
          setClientOptionsCacheKey((key) => key + 1);
        }}
      />
    </FormContainer>
  );
}
