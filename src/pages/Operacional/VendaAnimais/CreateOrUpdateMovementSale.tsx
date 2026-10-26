// src/pages/Operacional/VendaAnimais/CreateOrUpdateMovementSale.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de VENDA DE ANIMAIS (MovementSale) —
// TASK-VD-FE-02, contrato de tela §7. Rotas: /operacional/venda-animais/novo
// e /operacional/venda-animais/:saleUuid/editar (mesmo componente),
// registradas em src/router/index.tsx.
//
// Referência UX (UX-GAP confirmado, `GAP-VENDAS-FE-01`) — mirror estrutural:
//   Cabeçalho + casca: `Operacional/Romaneios/CreateOrUpdateRomaneio.tsx`
//   Itens dinâmicos + totais: `RomaneioItemsTab`/`RomaneioItemRow`/`RomaneioTotalsBlock`
//   Modal "+ Novo Cliente": padrão canônico atual do fork (`ClientFormModal`,
//     ver `CreateClientQuickModal.tsx`)
//
// ⚠️ Achados de fidelidade (confirmados contra o código real da API,
// `GB.Cerne.Api` branch `feature/vendas-nascimentos-for-api`, nesta Tarefa):
//   1. `user_uuid` NÃO existe em `MovementSaleRequest`/`MovementSaleData` —
//      o `user_id` é SEMPRE resolvido do usuário autenticado
//      (`CreateMovementSaleAction`), nunca do payload. Contrato §7.1 previa
//      um campo hidden/readonly; removido do form (nenhuma função real).
//   2. ATUALIZAÇÃO (Tarefa 23, `GAP-VD-14` FECHADO) — `MovementSaleResource`
//      HOJE expõe `type_payment`/`note` em toda leitura (list e detail); ao
//      EDITAR uma venda existente, os 2 campos reidratam do GET
//      (`fillMovementSaleForm` abaixo).
//   2b. ATUALIZAÇÃO (VD-FE-04, `GAP-API-FE-01/02/03` FECHADOS pela api) —
//      `chave`/`number`/`serie`/`has_financial` agora são top-level
//      incondicionais do Resource; `incomes[]` (parcelas + `allocations[]`
//      do rateio, com `plan_account_uuid`) é `whenLoaded` no detalhe.
//      `fillMovementSaleForm` reidrata os 2 arrays financeiros
//      (`movementSaleIncomeAllocationsToForm`/
//      `movementSaleIncomesToInstallmentsForm`, `useMovementSales.tsx`) —
//      editar uma venda com financeiro já gerado reabre as seções
//      Rateio/Parcelamento PREENCHIDAS. Os rótulos de categoria/centro/conta
//      contábil do rateio nascem como o próprio uuid (o Resource não embute
//      descrição) e são resolvidos por 1 lookup cada ao montar
//      (`MovementSaleIncomeAllocation.tsx`, mesma mecânica de
//      `IncomeApportionmentTab.tsx`) — sem MOCK, nunca um rótulo inventado.
//   3. `items.*.value_real/value_arroba/value_head/value_unit` são
//      `required` no `MovementSaleRequest` real — diverge de "no submit,
//      item não carrega preço" do contrato §7.3; o preço é digitado 1x por
//      CATEGORIA na UI (`MovementSaleCategoriesTab.tsx`) e replicado em cada
//      item no payload (`buildMovementSaleItemPayload`, `useMovementSales.tsx`).
//   4. Tabela de categorias + bloco financeiro renderizados SEMPRE (não só
//      `type_sale===1`) — o `MovementSaleRequest` real exige `categories`
//      (`required|array|min:1`) para QUALQUER `type_sale`; esconder a única
//      forma de preenchê-la para Abate impediria o submit. `pricing_type`
//      continua travado (readonly) quando `type_sale===1` (Recria) e/ou sem
//      itens, mirror literal do contrato §7.1.
//   5. `GET /movement-sales/animal-by-batch` exige `batch_uuid` (real,
//      `Rule::exists`) — não pode ser usado para busca INDIVIDUAL sem lote
//      (IG2 do contrato assumia o mesmo endpoint "sem request extra"); a
//      busca individual usa `/animals/options` (`listAnimalOptions`, já
//      existente). Ver docblock de `MovementSaleItemRow.tsx`.
//   6. Handoff Desmama→Venda (TASK-WN-FE-07, Opção B/`GAP-WN-FE-01`, decisão
//      do dono `DEC-070` Addendum/MARCO 105) — em modo CRIAÇÃO, esta tela lê
//      `model`/`model_id` de `useSearchParams` (escritos por
//      `CreateOrUpdateWeaning.tsx` ao criar uma Desmama tipo Venda) e os
//      inclui no payload de `tryPersistMovementSale` SÓ NO SUBMIT — nenhuma
//      `MovementSale` é criada por navegar para esta tela (sem "Venda
//      fantasma"). Fluxo normal (sem `model`/`model_id` na URL, ou em modo
//      edição) segue IDÊNTICO ao anterior a esta Tarefa —
//      `payload.model`/`payload.model_id` ficam `undefined`. Backend resolve
//      `model_id` como `uuid` de `Weaning` (`TASK-WN-04`, `LinkWeaningAction`);
//      `model_id` malformado (não uuid) é descartado silenciosamente, nunca
//      propagado ao servidor.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, Icon, IconButton, SimpleGrid, Text, useDisclosure } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { FiEdit, FiPlus } from 'react-icons/fi';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { FileUpload } from '@/components/Form/FileUpload';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { isValidGuid } from '@/utils/guid';
import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import {
  movementSalePricingTypeOptions,
  movementSaleTypeOptions,
  movementSaleTypePaymentOptions,
} from '@/constants/GestaoAnimal/MovementSale/options';
import { queryKey } from '@/constants/query-key';

import { movementSaleSchemaResolver } from '@/validations/schemas/MovementSales/movement-sale-schema';

import { getAnimalByUuid } from '@/services/v2/Animals/animal-service';
import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import { listClients } from '@/services/v2/CadastrosBase/Client/client-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { getCorralAnimalsForSalePrefill } from '@/services/v2/FeedlotMap/feedlot-map-service';
import type { FeedlotCorralAnimalForSalePrefill } from '@/services/v2/FeedlotMap/feedlot-map-service';
import {
  createMovementSale,
  importMovementSaleXml,
  updateMovementSale,
} from '@/services/v2/MovementSales/movement-sale-service';

import type { Option } from '@/@types/option';
import type { ClientListItem } from '@/@types/v2/CadastrosBase/client';
import type {
  MovementSaleDetail,
  MovementSaleForm as MovementSaleFormValues,
  MovementSaleItemForm,
  MovementSalePricingType,
  MovementSaleType,
} from '@/@types/v2/MovementSales';

import { CreateClientQuickModal } from './CreateClientQuickModal';
import { MovementSaleCategoriesTab } from './MovementSaleCategoriesTab';
import { MovementSaleIncomeAllocation } from './MovementSaleIncomeAllocation';
import { MovementSaleInstallmentsSection } from './MovementSaleInstallmentsSection';
import { createEmptyMovementSaleItem, MovementSaleItemsSection } from './MovementSaleItemsSection';
import { MovementSaleTotalsBlock } from './MovementSaleTotalsBlock';
import {
  buildMovementSalePayload,
  movementSaleCategoryDetailToForm,
  movementSaleIncomeAllocationsToForm,
  movementSaleIncomesToInstallmentsForm,
  movementSaleItemDetailToForm,
  useMovementSaleForm,
  useMovementSalePaymentTypeOptions,
} from './useMovementSales';

import type { MovementSaleAllocationFieldValues } from './MovementSaleIncomeAllocation';
import type { MovementSaleInstallmentFieldValues } from './MovementSaleInstallmentsSection';
import type { UseFieldArrayAppend, UseFieldArrayReplace } from 'react-hook-form';

const VENDA_ANIMAIS_LIST_ROUTE = '/operacional/venda-animais';

function todayIso(): string {
  return todayLocalIso();
}

// `total`/`total_products` do form (`useForm` abaixo) são preenchidos com
// `0` fixo no `defaultValues`/`reset()` e NUNCA reescritos por `setValue`
// pelos blocos de exibição (`MovementSaleTotalsBlock`/`MovementSaleCategoriesTab`
// calculam localmente via `watch()`, mirror `RomaneioTotalsBlock.tsx` — só
// prévia, nunca persistido de volta no form). O schema de validação do
// subfluxo financeiro (`movement-sale-schema.ts`, Tarefa 21) compara a soma
// do rateio/parcelamento contra `ctx.parent.total` — que ficaria sempre `0`
// sem este sync. Mantém os 2 campos sincronizados com a MESMA fórmula de
// `MovementSaleTotalsBlock.tsx` (CV5), só para alimentar essa validação (o
// payload de escrita recalcula os totais do zero em `buildMovementSalePayload`,
// nunca lê este campo do form).
function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// Extraído do `useForm({defaultValues})` original (Tarefa 02) para reuso pelo
// prelink Mapa→Venda de Animais (`corral_id`, abaixo): o `reset()` que aplica
// os itens pré-carregados do curral precisa da MESMA base de valores default
// (não um objeto parcial — `reset()` reidrataria os campos omitidos com
// `undefined`, mirror do racional já usado por `handleXmlSelected`, que
// também reconstrói o form inteiro). `items` sempre nasce com 1 linha vazia
// aqui; o caller de edição (`useForm` abaixo) sobrescreve para `[]`.
function buildDefaultMovementSaleFormValues(
  languageGB: ReturnType<typeof useLanguage>['languageGB']
): MovementSaleFormValues {
  return {
    code: '',
    dt_sale: todayIso(),
    seller_uuid: null,
    batch_sale: false,
    batch_uuid: null,
    client_uuid: null,
    type_sale: null,
    pricing_type: {
      label: movementSalePricingTypeOptions.getLabel(1, languageGB),
      value: 1,
    },
    chave: null,
    number: null,
    serie: null,
    type_payment: null,
    gtas: '',
    note: '',
    has_financial: false,
    financial_allocations: [],
    financial_installments: [],
    items: [createEmptyMovementSaleItem()],
    categories: [],
    average_weight_kg: null,
    total_products: 0,
    freight: 0,
    other_values: 0,
    discount: 0,
    total: 0,
  };
}

export default function CreateOrUpdateMovementSale() {
  const { saleUuid } = useParams<{ saleUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.movementSales.movementSale;
  const formText = text.form;

  const isEditing = isValidGuid(saleUuid);

  // ---- Handoff Desmama→Venda (TASK-WN-FE-07, Opção B) --------------------
  // Pré-vínculo lido da URL só em modo CRIAÇÃO. Guardado aqui, incluído no
  // payload só no submit (`tryPersistMovementSale`, abaixo) — nada é
  // persistido por só abrir esta tela. `model_id` que não seja um uuid válido
  // é descartado (nunca propagado ao servidor, mirror do guard de `saleUuid`
  // acima via `isValidGuid`).
  const [searchParams] = useSearchParams();
  const prelinkModel = !isEditing ? searchParams.get('model') : null;
  const rawPrelinkModelId = !isEditing ? searchParams.get('model_id') : null;
  const prelinkModelId =
    prelinkModel && rawPrelinkModelId && isValidGuid(rawPrelinkModelId) ? rawPrelinkModelId : null;

  // ---- Prelink Mapa de Confinamento→Venda (religação `DEC-FE-MAP-03`) ----
  // Mirror `handleSaleAnimals`/`Setor.js` (agro365) + `MovementSaleController
  // @create` (`corral_id` → `preloadItems`/`corralBatchIds`) — só em modo
  // CRIAÇÃO, só com `corral_id` válido (uuid). NENHUMA persistência por só
  // abrir esta tela; os itens são só PRÉ-CARREGADOS no form local
  // (`corralAnimalsQuery`/efeito abaixo), o usuário ainda salva
  // normalmente pelo submit já existente.
  const rawPrelinkCorralId = !isEditing ? searchParams.get('corral_id') : null;
  const prelinkCorralId =
    rawPrelinkCorralId && isValidGuid(rawPrelinkCorralId) ? rawPrelinkCorralId : null;

  // Guard — GUID malformado na rota de edição → listagem (mirror
  // `CreateOrUpdateRomaneio.tsx`/`MovementSaleDetalhe.tsx`).
  useEffect(() => {
    if (!saleUuid) return;
    if (!isValidGuid(saleUuid)) {
      navigate(VENDA_ANIMAIS_LIST_ROUTE, { replace: true });
    }
  }, [saleUuid, navigate]);

  const canSave = isEditing ? can('mov_sale_edit') : can('mov_sale_create');

  // Checklist §7.8 — usuário só com `mov_sale_view` chegando via URL
  // direta de edição: a experiência real de "só ver" é a rota de Detalhe
  // (§6), não este form desabilitado.
  useEffect(() => {
    if (isEditing && !canSave && !can('mov_sale_view')) {
      navigate(VENDA_ANIMAIS_LIST_ROUTE, { replace: true });
    } else if (isEditing && !canSave) {
      navigate(`${VENDA_ANIMAIS_LIST_ROUTE}/${saleUuid}`, { replace: true });
    }
  }, [isEditing, canSave, saleUuid, navigate, can]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    trigger,
    clearErrors,
    formState: { errors, dirtyFields, isDirty, isValid },
  } = useForm<MovementSaleFormValues>({
    mode: 'onChange',
    resolver: movementSaleSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      ...buildDefaultMovementSaleFormValues(languageGB),
      items: isEditing ? [] : [createEmptyMovementSaleItem()],
    },
  });

  // `isValid` do RHF nasce `true` no mount, ANTES de rodar a 1ª validação
  // (mirror `CreateOrUpdateGrazing.tsx`) — força o cálculo real logo na
  // montagem para o botão Salvar já nascer com o estado correto.
  useEffect(() => {
    trigger().then(() => clearErrors());
  }, [trigger, clearErrors]);

  // Lei do fork (`get_pwa_form_query_pattern`) — função NOMEADA com guarda de
  // `dirtyFields`; NUNCA `reset()` solto em `useEffect`.
  function fillMovementSaleForm(data: MovementSaleDetail, resetForce?: boolean) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (!(hasNoFormChanges || resetForce)) return;

    reset({
      code: data.code,
      dt_sale: data.dt_sale,
      seller_uuid: data.seller
        ? { label: data.seller.name ?? data.seller.uuid, value: data.seller.uuid }
        : null,
      batch_sale: data.batch_sale,
      batch_uuid: data.batch
        ? { label: data.batch.description ?? data.batch.uuid, value: data.batch.uuid }
        : null,
      client_uuid: data.client
        ? { label: data.client.name ?? data.client.uuid, value: data.client.uuid }
        : null,
      type_sale: {
        label: movementSaleTypeOptions.getLabel(data.type_sale, languageGB),
        value: data.type_sale,
      },
      pricing_type: {
        label: movementSalePricingTypeOptions.getLabel(data.pricing_type, languageGB),
        value: data.pricing_type,
      },
      // VD-API-01 (`GAP-API-FE-01` FECHADO) — `chave`/`number`/`serie` agora
      // reidratam direto do GET (top-level incondicional do Resource); só
      // relevantes em vendas importadas de XML (`null` nas demais, sem MOCK).
      chave: data.chave,
      number: data.number,
      serie: data.serie,
      // `GAP-VD-14` FECHADO (Tarefa 23) — `type_payment`/`note` reidratam do
      // GET (`MovementSaleResource`, chave incondicional).
      type_payment: data.type_payment
        ? {
            label: movementSaleTypePaymentOptions.getLabel(data.type_payment, languageGB),
            value: data.type_payment,
          }
        : null,
      gtas: data.gtas ?? '',
      note: data.note ?? '',
      // VD-API-01 (`GAP-API-FE-01` FECHADO, VD-FE-04) — `has_financial`/
      // parcelas/rateio reidratam de `data.incomes[]` (`whenLoaded`, vazio
      // quando a venda não tem financeiro gerado). Mappers em
      // `useMovementSales.tsx`.
      has_financial: data.has_financial,
      financial_allocations: movementSaleIncomeAllocationsToForm(data.incomes),
      financial_installments: movementSaleIncomesToInstallmentsForm(data.incomes),
      items: data.items.map(movementSaleItemDetailToForm),
      categories: data.categories.map(movementSaleCategoryDetailToForm),
      average_weight_kg: null,
      total_products: data.total_products,
      freight: data.freight,
      other_values: data.other_values,
      discount: data.discount,
      total: data.total,
    });
    // `reset()` não recalcula `isValid` com resolver assíncrono do RHF — sem
    // isto o botão Salvar poderia ficar travado em modo edição (mirror
    // `CreateOrUpdateGrazing.tsx`). Defensivo e barato.
    trigger().then(() => clearErrors());
  }

  const saleQuery = useMovementSaleForm({
    registrationId: isEditing ? saleUuid : undefined,
    fillForm: fillMovementSaleForm,
  });

  const isLoading = isEditing && checkLoadingStatus([saleQuery as any]);
  const isDisabledField = !canSave || isLoading;

  // ---- Prelink Mapa→Venda (continuação) — carrega os animais ATIVOS do
  // curral (`GET /feedlot-map/corrals/{uuid}/animals`, endpoint JÁ EXISTENTE
  // reusado por `FeedlotCorralWeighingDialog.tsx`) e pré-preenche 1 item por
  // animal. `retry:false`/`refetchOnWindowFocus:false` — mesmo racional de
  // `useMovementSalePaymentTypeOptions` (lookup auxiliar, não crítico ao
  // ponto de re-tentar agressivamente).
  const corralAnimalsQuery = useQuery({
    queryKey: [queryKey.movementSales.movementSale, 'corral-sale-prefill', prelinkCorralId],
    queryFn: async () => (await getCorralAnimalsForSalePrefill(prelinkCorralId as string)).data,
    enabled: !!prelinkCorralId,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const corralPrefillAppliedRef = useRef(false);

  // Enriquece cada animal do curral com `category`/`entry_date` (mesmo
  // lookup — `getAnimalByUuid` — que `MovementSaleItemRow.handleAnimalChange`
  // faz ao SELECIONAR um animal manualmente; `GET .../animals` não devolve
  // categoria, só identificação/peso, achado de fidelidade documentado em
  // `feedlot-map-service.ts`). Falha isolada por animal degrada
  // graciosamente (categoria/peso anterior/data ficam vazios, SEM MOCK) —
  // mirror do próprio `catch` de `handleAnimalChange`.
  async function buildCorralPrefillItems(
    animals: FeedlotCorralAnimalForSalePrefill[]
  ): Promise<MovementSaleItemForm[]> {
    return Promise.all(
      animals.map(async (animal) => {
        const baseItem: MovementSaleItemForm = {
          animal_uuid: { label: animal.identification ?? animal.uuid, value: animal.uuid },
          category_uuid: null,
          previous_weight_kg: animal.last_weight ?? null,
          entry_date: null,
          weight_kg: animal.last_weight ?? null,
          performance: null,
          gain: null,
          gmd: null,
          carcass_weight: null,
          note: '',
        };

        try {
          const detail = await getAnimalByUuid(animal.uuid);
          const animalDetail = detail.data;
          return {
            ...baseItem,
            category_uuid: animalDetail.category
              ? { label: animalDetail.category.label, value: animalDetail.category.uuid }
              : null,
            entry_date: animalDetail.entry_date ?? null,
          };
        } catch {
          return baseItem;
        }
      })
    );
  }

  useEffect(() => {
    if (isEditing || !prelinkCorralId) return;
    if (corralPrefillAppliedRef.current) return;
    if (!corralAnimalsQuery.data) return;
    // Form já alterado pelo usuário (ex.: já digitou algo antes do lookup
    // resolver) — nunca sobrescreve, mirror da guarda `hasNoFormChanges` de
    // `fillMovementSaleForm`.
    if (Object.keys(dirtyFields).length > 0) return;
    // Curral sem animal ativo (`preloadItems` vazio no legado) — mantém o
    // item único vazio padrão, sem fabricar linha.
    if (corralAnimalsQuery.data.length === 0) return;

    corralPrefillAppliedRef.current = true;

    buildCorralPrefillItems(corralAnimalsQuery.data).then((items) => {
      reset({ ...buildDefaultMovementSaleFormValues(languageGB), items });
      trigger().then(() => clearErrors());
    });
  }, [
    isEditing,
    prelinkCorralId,
    corralAnimalsQuery.data,
    dirtyFields,
    languageGB,
    reset,
    trigger,
    clearErrors,
  ]);

  const typeSaleValue = watch('type_sale')?.value ?? null;
  const pricingTypeValue = watch('pricing_type')?.value ?? null;
  const batchSale = watch('batch_sale');
  const watchedItems = watch('items') ?? [];

  // ---- Subfluxo financeiro (GAP-VENDAS-FE-05 §2/§3, Tarefa 21 —
  // `useFieldArray` vive no formulário PAI, mirror `CreateFarmTransfer.tsx`)
  // ---------------------------------------------------------------------
  const financialAllocationsArray = useFieldArray({ control, name: 'financial_allocations' });
  const financialInstallmentsArray = useFieldArray({ control, name: 'financial_installments' });

  const hasFinancial = !!watch('has_financial');
  // Gate `IG5` (`GAP-VENDAS-FE-05` §2.8, legado `toggleFinancialContainer`) —
  // venda de Abate NÃO oferece "Gerar Financeiro" na criação/edição; o
  // financeiro dela é lançado só na Finalização (Tarefa 22).
  const isSlaughterSale = typeSaleValue === 2;

  // `total`/`total_products` do form — sync com a MESMA fórmula de
  // `MovementSaleTotalsBlock.tsx` (CV5), só para alimentar o `ctx.parent.total`
  // do schema (ver nota do helper `round`, acima); o payload de escrita
  // nunca lê este campo.
  const watchedCategoriesForTotal = watch('categories') ?? [];
  const totalProductsValue = round(
    watchedCategoriesForTotal.reduce(
      (sum, category) => sum + (Number(category?.value_total) || 0),
      0
    ),
    2
  );
  const freightValue = Number(watch('freight')) || 0;
  const otherValuesValue = Number(watch('other_values')) || 0;
  const discountValue = Number(watch('discount')) || 0;
  const totalValue = round(totalProductsValue + freightValue + otherValuesValue - discountValue, 2);

  useEffect(() => {
    setValue('total_products', totalProductsValue);
    setValue('total', totalValue, { shouldValidate: true });
  }, [totalProductsValue, totalValue, setValue]);

  // Desligou o toggle (manual) OU caiu no gate IG5 (Abate) — limpa os 2
  // arrays financeiros, nunca deixa linhas órfãs escondidas (contrato §2.7).
  function clearFinancialSubflow() {
    financialAllocationsArray.replace([]);
    financialInstallmentsArray.replace([]);
  }

  // ---- Saída com alterações não salvas -----------------------------------
  const exitGuard = useDisclosure();

  function guardedBack() {
    if (isDirty) {
      exitGuard.onOpen();
    } else {
      navigate(-1);
    }
  }

  function confirmExit() {
    exitGuard.onClose();
    navigate(-1);
  }

  // ---- Modal "+ Novo Cliente" (contrato §7.6) ----------------------------
  const clientModalDisclosure = useDisclosure();
  const [clientOptionsCacheKey, setClientOptionsCacheKey] = useState(0);

  // ---- Importação de XML (contrato §7.7) — só em modo criação ------------
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [isImportingXml, setIsImportingXml] = useState(false);

  async function handleXmlSelected(file: File | null) {
    setXmlFile(file);
    if (!file) return;

    setIsImportingXml(true);
    try {
      const response = await importMovementSaleXml(file);
      const draft = response.data;

      const categoriesFromDraft = draft.categories.map((category) => ({
        category_uuid: category.category_uuid ?? category.description,
        description: category.description,
        quantity: category.quantity,
        value_real: category.quantity > 0 ? category.value_total / category.quantity : 0,
        value_arroba: category.quantity > 0 ? (category.value_total / category.quantity) * 30 : 0,
        value_head: category.value_head,
        value_total: category.value_total,
      }));

      reset({
        code: '',
        dt_sale: draft.dt_sale,
        seller_uuid: null,
        batch_sale: false,
        batch_uuid: null,
        client_uuid: draft.client.matched
          ? { label: draft.client.name, value: draft.client.uuid as string }
          : null,
        type_sale: watch('type_sale'),
        pricing_type: watch('pricing_type'),
        chave: draft.chave,
        number: draft.number,
        serie: draft.series,
        type_payment: null,
        gtas: watch('gtas'),
        note: draft.note ?? '',
        has_financial: false,
        financial_allocations: [],
        financial_installments: [],
        // XML não identifica animais individuais — itens continuam vazios,
        // o usuário adiciona os cards manualmente (mirror legado honesto).
        items: [createEmptyMovementSaleItem()],
        categories: categoriesFromDraft,
        average_weight_kg: null,
        total_products: draft.total_products,
        freight: draft.freight,
        other_values: 0,
        discount: draft.discount,
        total: draft.total,
      });
      trigger().then(() => clearErrors());

      toaster.success({ title: text.singularLabel, description: formText.xmlImport.successToast });
      if (!draft.client.matched) {
        toaster.create({
          type: 'warning',
          title: text.singularLabel,
          description: formText.xmlImport.clientNotMatchedToast,
        });
      }
    } catch (error) {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? formText.xmlImport.errorToast,
        duration: 7000,
      });
      setXmlFile(null);
    } finally {
      setIsImportingXml(false);
    }
  }

  // ---- Submit -------------------------------------------------------------
  const [businessError, setBusinessErrorState] = useState<string | undefined>(undefined);

  const saleMutation = useRequest({
    asyncFunction: tryPersistMovementSale,
    entityName: text.singularLabel,
    queryKey: queryKey.movementSales.movementSales,
    queryKey2: queryKey.movementSales.movementSale,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistMovementSale(data: MovementSaleFormValues) {
    setBusinessErrorState(undefined);
    const payload = buildMovementSalePayload(data);

    // Handoff Desmama→Venda (Opção B) — só em criação, só com os 2
    // parâmetros de pré-vínculo válidos; fluxo normal (sem params, ou
    // edição) segue com `model`/`model_id` `undefined`, comportamento
    // idêntico ao anterior a esta Tarefa.
    if (!isEditing && prelinkModel && prelinkModelId) {
      payload.model = prelinkModel;
      payload.model_id = prelinkModelId;
    }

    try {
      return isEditing && saleUuid
        ? await updateMovementSale(saleUuid, payload)
        : await createMovementSale(payload);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          Object.entries(fieldErrors).forEach(([field, fieldMessages]) => {
            if (fieldMessages?.[0]) {
              setError(field as any, { type: 'server', message: fieldMessages[0] });
            }
          });
        } else {
          const serverMessage = (error.response.data as any)?.message;
          setBusinessErrorState(
            typeof serverMessage === 'string'
              ? serverMessage
              : (extractApiErrorMessage(error) ?? formText.businessErrorFallback)
          );
        }
      }
      throw error;
    }
  }

  async function onSubmit(data: MovementSaleFormValues) {
    await saleMutation.mutateAsync(data);
  }

  // Submit inválido silencioso (mirror `CreateOrUpdateGrazing.tsx` `onInvalid`)
  // — sem isto, clicar em Salvar com campos obrigatórios vazios/incorretos
  // não dava nenhum feedback visível além do erro sob o campo.
  function onInvalid() {
    toaster.error({
      title: isEditing ? formText.title.edit : formText.title.create,
      description: formText.invalidFieldsToast,
      duration: 6000,
    });
  }

  const isSubmitting = saleMutation.isPending;

  const typeSaleOptions = movementSaleTypeOptions.options(languageGB);
  const pricingTypeOptions = movementSalePricingTypeOptions.options(languageGB);
  // VD-FE-03 (PARADA-FE-1 aceita, backend TASK-41 ✅) — `type_payment` passa
  // a vir de `GET /movement-sales/payment-types/options`; catálogo local
  // `movementSaleTypePaymentOptions` some SÓ como FALLBACK em `isError`
  // (nunca select vazio, DoD da Tarefa).
  const typePaymentOptionsQuery = useMovementSalePaymentTypeOptions();
  const typePaymentOptions =
    typePaymentOptionsQuery.data && !typePaymentOptionsQuery.isError
      ? typePaymentOptionsQuery.data.data
      : movementSaleTypePaymentOptions.options(languageGB);
  const booleanOptions: Option<boolean>[] = [
    { label: languageGB.defaltStrings.yes, value: true },
    { label: languageGB.defaltStrings.no, value: false },
  ];

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={guardedBack}
          />
          {canSave && (
            <Button
              title={languageGB.defaltStrings.save}
              type="button"
              onClick={handleSubmit(onSubmit, onInvalid)}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading || !isValid}
            />
          )}
        </>
      }
    >
      {businessError && (
        <Box mb={4} p={3} borderRadius="md" bg="feedBack.error">
          <Text fontSize="sm" color="feedBack.errorMain">
            {businessError}
          </Text>
        </Box>
      )}

      <Form noPadding onSubmit={handleSubmit(onSubmit, onInvalid)}>
        {/* ---- Importação de XML (contrato §7.7) — só criação ---- */}
        {!isEditing && (
          <Box mb={6}>
            <FileUpload
              label={formText.xmlImport.label}
              hint={formText.xmlImport.hint}
              accept=".xml,.txt"
              maxSizeMb={10}
              file={xmlFile}
              onFileSelected={handleXmlSelected}
              onRemove={() => setXmlFile(null)}
              disabled={isImportingXml || isDisabledField}
              dropzoneTitle={formText.xmlImport.dropzoneTitle}
              dropzoneDraggingTitle={formText.xmlImport.dropzoneDraggingTitle}
              changeLabel={formText.xmlImport.changeLabel}
              removeLabel={formText.xmlImport.removeLabel}
              errorTypeMessage={formText.xmlImport.errorTypeMessage}
              errorSizeMessage={formText.xmlImport.errorSizeMessage}
            />
          </Box>
        )}

        {/* ---- Cabeçalho (contrato §7.1) ---- */}
        <Text fontWeight="semibold" mb={3}>
          {formText.sections.header}
        </Text>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <InputReadOnly label={formText.fields.code} value={watch('code') || '—'} />

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {formText.fields.dtSale}
              <Text as="span" color="fg.error">
                {' '}
                *
              </Text>
            </Text>
            <Controller
              name="dt_sale"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput value={value ?? null} onChange={onChange} disabled={isDisabledField} />
              )}
            />
            {errors.dt_sale?.message && (
              <Text fontSize="xs" color="fg.error" mt={1}>
                {errors.dt_sale.message}
              </Text>
            )}
          </Box>

          <Controller
            name="seller_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.seller}
                placeholder={formText.placeholders.seller}
                service={(params) => listProviderOptions({ ...params, type: 5 })}
                mapOptions={(item: ProviderOptionItem) => ({ label: item.label, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={isDisabledField}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="batch_sale"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={formText.fields.batchSale}
                name={name}
                value={booleanOptions.find((option) => option.value === !!value) ?? null}
                onChange={(option: Option<boolean> | null) => {
                  onChange(!!option?.value);
                  if (!option?.value) {
                    setValue('batch_uuid', null, { shouldDirty: true });
                  }
                }}
                options={booleanOptions}
                isRequired
                isDisabled={isDisabledField || !!watch('chave')}
                noClearable
              />
            )}
          />

          <Controller
            name="batch_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.batch}
                placeholder={formText.placeholders.batch}
                error={errors.batch_uuid?.message as string | undefined}
                // R4-FE-02 (P1) — `batch_uuid` de formulário, sem "Sem lote".
                service={listBatchOptionsForForm}
                mapOptions={(item: { uuid: string; label: string }) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired={batchSale}
                isDisabled={isDisabledField || !batchSale}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

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
                mapOptions={(item: ClientListItem) => ({ label: item.name, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isDisabled={isDisabledField}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                cacheUniqs={[clientOptionsCacheKey]}
                // EST-07 — botão criar/editar Cliente migrado do
                // `IconButton` avulso para o `labelAction`, mirror EXATO do
                // padrão `CreateOrUpdateNfe.tsx`.
                labelActionTooltip={formText.createClientModal.addClientAria}
                labelAction={
                  <IconButton
                    aria-label={formText.createClientModal.addClientAria}
                    variant="ghost"
                    size="2xs"
                    minH="0"
                    h="20px"
                    w="20px"
                    minW="0"
                    p="0"
                    disabled={isDisabledField || !(can('clients_create') || can('clients_edit'))}
                    onClick={clientModalDisclosure.onOpen}
                  >
                    <Icon as={field.value ? FiEdit : FiPlus} boxSize="16px" color="primaryMain" />
                  </IconButton>
                }
              />
            )}
          />

          <Controller
            name="type_sale"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={formText.fields.typeSale}
                placeholder={formText.placeholders.typeSale}
                name={name}
                value={value}
                onChange={(option: Option<MovementSaleType> | null) => {
                  onChange(option ?? null);
                  // IG5 (precificação) — Recria (1) sempre precifica por Kg/Arroba.
                  if (option?.value === 1) {
                    setValue(
                      'pricing_type',
                      { label: movementSalePricingTypeOptions.getLabel(1, languageGB), value: 1 },
                      { shouldDirty: true }
                    );
                  }
                  // Gate IG5 (financeiro, `GAP-VENDAS-FE-05` §2.8, legado
                  // `toggleFinancialContainer`) — Abate (2) não lança
                  // financeiro na criação/edição; força o desligamento e
                  // limpa os 2 arrays financeiros, mesmo se já preenchidos.
                  if (option?.value === 2) {
                    setValue('has_financial', false, { shouldDirty: true });
                    clearFinancialSubflow();
                  }
                }}
                options={typeSaleOptions}
                error={errors.type_sale?.message as string | undefined}
                isRequired
                isDisabled={isDisabledField}
              />
            )}
          />

          <Controller
            name="pricing_type"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={formText.fields.pricingType}
                placeholder={formText.placeholders.pricingType}
                name={name}
                value={value}
                onChange={(option: Option<MovementSalePricingType> | null) =>
                  onChange(option ?? null)
                }
                options={pricingTypeOptions}
                error={errors.pricing_type?.message as string | undefined}
                isRequired
                isDisabled={isDisabledField || typeSaleValue === 1 || watchedItems.length === 0}
              />
            )}
          />

          {!!watch('chave') && (
            <>
              <InputReadOnly label={formText.fields.chave} value={watch('chave') ?? '—'} />
              <InputReadOnly label={formText.fields.number} value={watch('number') ?? '—'} />
              <InputReadOnly label={formText.fields.serie} value={watch('serie') ?? '—'} />
            </>
          )}

          <Input
            label={formText.fields.gtas}
            {...register('gtas')}
            error={errors.gtas?.message}
            loading={isLoading}
            disabled={isDisabledField}
            isRequired
          />
        </SimpleGrid>

        {/* ---- Itens dinâmicos (contrato §7.2/§7.4) ---- */}
        <MovementSaleItemsSection
          control={control}
          errors={errors}
          watch={watch}
          setValue={setValue}
          isDisabled={isDisabledField}
        />

        {/* ---- Categorias agregadas (contrato §7.3) ---- */}
        <Box mt={8}>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            {formText.categoriesTab.title}
          </Text>
          <MovementSaleCategoriesTab
            control={control}
            watch={watch}
            setValue={setValue}
            pricingType={pricingTypeValue}
            isDisabled={isDisabledField}
          />
        </Box>

        {/* ---- Totais (contrato §7.5) ---- */}
        <MovementSaleTotalsBlock control={control} watch={watch} isDisabled={isDisabledField} />

        {/* ---- Dados de Pagamento (GAP-VENDAS-FE-05 §1) — posição legada:
            depois dos Totais, `type_payment` → `note` → `has_financial`
            (`_forms.blade.php:198-213`). `type_payment` só MUDOU DE LUGAR —
            mesmo `Controller`/`Select`/`movementSaleTypePaymentOptions`,
            zero mudança de comportamento/payload. ---- */}
        <Box mt={8}>
          <Text fontWeight="semibold" mb={3}>
            {formText.financial.paymentSectionTitle}
          </Text>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="type_payment"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={formText.fields.typePayment}
                  placeholder={formText.placeholders.typePayment}
                  name={name}
                  value={value}
                  onChange={(option: Option<string> | null) => onChange(option ?? null)}
                  options={typePaymentOptions}
                  loading={typePaymentOptionsQuery.isPending}
                  error={errors.type_payment?.message as string | undefined}
                  isRequired
                  isDisabled={isDisabledField}
                />
              )}
            />
          </SimpleGrid>

          <Box mt={6} w="full">
            <Textarea
              label={formText.fields.note}
              {...register('note')}
              error={errors.note?.message}
              disabled={isDisabledField}
            />
          </Box>

          <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
            <Box>
              <Controller
                name="has_financial"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.hasFinancial}
                    name={name}
                    value={booleanOptions.find((option) => option.value === !!value) ?? null}
                    onChange={(option: Option<boolean> | null) => {
                      const nextValue = !!option?.value;
                      onChange(nextValue);
                      // Desligou o toggle — limpa os 2 arrays financeiros
                      // (contrato §2.7), nunca deixa linhas órfãs escondidas.
                      if (!nextValue) clearFinancialSubflow();
                    }}
                    options={booleanOptions}
                    isRequired
                    // Gate IG5 — Abate não oferece "Gerar Financeiro" na
                    // criação/edição (financeiro lançado só na Finalização).
                    isDisabled={isDisabledField || isSlaughterSale}
                    noClearable
                  />
                )}
              />
              {isSlaughterSale && (
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  {formText.fields.hasFinancialSlaughterHint}
                </Text>
              )}
            </Box>
          </SimpleGrid>

          {/* ---- Cascata do Gerar Financeiro (GAP-VENDAS-FE-05 §2) — Sim
              revela as 2 seções JUNTAS (mirror container `#financial` único
              do legado); gate IG5 impede a montagem em venda de Abate mesmo
              que `has_financial` fique preso em `true` por algum caminho
              anterior. ---- */}
          {hasFinancial && !isSlaughterSale && (
            <>
              <Box mt={6}>
                <MovementSaleInstallmentsSection
                  control={control}
                  fields={financialInstallmentsArray.fields}
                  append={
                    financialInstallmentsArray.append as unknown as UseFieldArrayAppend<
                      MovementSaleInstallmentFieldValues,
                      'financial_installments'
                    >
                  }
                  remove={financialInstallmentsArray.remove}
                  replace={
                    financialInstallmentsArray.replace as unknown as UseFieldArrayReplace<
                      MovementSaleInstallmentFieldValues,
                      'financial_installments'
                    >
                  }
                  vlTotal={totalValue}
                  errors={errors}
                  languageGB={languageGB}
                  disabled={isDisabledField}
                />
              </Box>

              <Box mt={6}>
                <MovementSaleIncomeAllocation
                  control={control}
                  fields={financialAllocationsArray.fields}
                  append={
                    financialAllocationsArray.append as unknown as UseFieldArrayAppend<
                      MovementSaleAllocationFieldValues,
                      'financial_allocations'
                    >
                  }
                  remove={financialAllocationsArray.remove}
                  setValue={setValue}
                  vlTotal={totalValue}
                  errors={errors}
                  languageGB={languageGB}
                  disabled={isDisabledField}
                />
              </Box>
            </>
          )}
        </Box>
      </Form>

      <CreateClientQuickModal
        isOpen={clientModalDisclosure.open}
        onClose={clientModalDisclosure.onClose}
        onCreated={(client) => {
          setValue(
            'client_uuid',
            { value: client.uuid, label: client.label },
            { shouldDirty: true, shouldValidate: true }
          );
          setClientOptionsCacheKey((key) => key + 1);
        }}
      />

      <DeleteConfirmDialog
        isOpen={exitGuard.open}
        onClose={exitGuard.onClose}
        onConfirm={confirmExit}
        title={formText.unsavedChanges.title}
        description={formText.unsavedChanges.message}
        warningText=""
        confirmButtonText={formText.unsavedChanges.confirm}
        colorPalette="orange"
      />
    </FormContainer>
  );
}
