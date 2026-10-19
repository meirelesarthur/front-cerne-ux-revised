// src/pages/Operacional/CompraAnimais/CreateOrUpdateMovementPurchase.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de COMPRA DE ANIMAIS (MovementPurchase) —
// TASK-CP-06 (cabeçalho+fornecedor+itens) + TASK-CP-07 (financeiro). Rotas:
// `/operacional/compra-animais/novo` e `/operacional/compra-animais/:uuid/editar`
// (mesmo componente), registradas em `src/router/index.tsx`.
//
// Mirror ESTRUTURAL `CreateOrUpdateMovementSale.tsx` (precedente aceito,
// contrato-frontend-compras-movimento.md §3) — `isEditing = isValidGuid(uuid)`,
// `fillForm` nomeado com guarda `dirtyFields`/`resetForce` (Lei 2), casca
// `FormContainer` com `footer` opt-in, guarda de saída (`isDirty` +
// `DeleteConfirmDialog`).
//
// ---- Ordem EXATA do cabeçalho (contrato-legado §`field_manifest`
// FLD-01..09, `_forms.blade.php:1-51`, CLM-21) -------------------------------
// code(readonly) → dt_sale(obrigatório, default hoje) → user_name(readonly,
// display do responsável — SEMPRE o usuário logado; `user_id` nunca é
// exposto pelo Resource, resolvido pela Action orquestradora, mirror
// `MovementPurchase` `$fillable`) → seller_uuid(opcional, Provider tipo 5) →
// provider_uuid(obrigatório, Provider tipo 1, botão "+" reusa
// `ProviderFormModal` JÁ existente — ver nota abaixo) → chave(máscara 44
// dígitos, CORRIGE CLM-23) → serie → number(1 único campo, CORRIGE CLM-22) →
// gtas. 088: `type_payment`/`note` ficam no bloco "Dados de Pagamento" logo
// ABAIXO de "Gerar Financeiro" e só com Gerar Financeiro = Sim (pedido do
// dono; o legado `_forms.blade.php:107-115` os exibia sempre, ANTES do select
// — divergência registrada, vence o pedido). `note` é a observação da COMPRA
// (`movement_purchases.note`), não do financeiro.
//
// ---- `chave`/`serie`/`number` EDITÁVEIS (achado de fidelidade) ------------
// DIFERENTE de `MovementSaleForm` (onde os 3 equivalentes NÃO existem no
// Resource e só existem via import XML, `TASK-CP-08`): aqui
// `MovementPurchaseRequest::rules()` REAL aceita os 3 como
// `sometimes|nullable` e `MovementPurchaseResource` os expõe
// incondicionalmente (`MovementPurchaseListItem`, usados até na coluna "NFe"
// da listagem, `TASK-CP-05`) — por isso são campos de texto EDITÁVEIS no
// cabeçalho, não gateados por `!!watch('chave')` como em Vendas. `chave` usa
// `InputMask` (44 dígitos puros, sem ponto — corrige CLM-23); `number` é 1
// único campo (corrige CLM-22, sem hidden duplicado — API não tem DOM).
//
// ---- Modal de Fornecedor — REUSO, não duplicação (roteiro item 4) --------
// `ProviderFormModal.tsx` (`src/pages/CadastrosBase/Fornecedores/`) JÁ é o
// componente canônico reutilizável de criar/editar Fornecedor (mirror
// `ClientFormModal.tsx`, 4+ consumidores confirmados no repositório:
// `GerarFinanceiroPage`/`CreateOrUpdateExpense`/`CreateOrUpdateMovimento`/
// `CreateOrUpdateInvoice`). NÃO foi criado `CreateProviderQuickModal.tsx`
// (o arquivo previsto no Roteiro Cirúrgico) — reusar o modal existente é
// mais fiel ao padrão do repositório do que duplicar 100+ linhas de form de
// Fornecedor.
//
// ---- Sub-bloco "Dados Fiscais (NFe)" — NÃO CONSTRUÍDO (decisão de escopo
// já tomada pelo Maestro, RUN-047) ------------------------------------------
// `MovementPurchaseItemData`/`MovementPurchaseRequest::rules()` REAIS não
// aceitam NENHUM dos 15 campos fiscais (`cst_*`/`perc_*`/`origem`/`cest`/
// `cenq_ipi`/`red_bc`/`vbc`/`cfop`/`ncm`) — só `category_uuid`/`batch_uuid`/
// `grazing_uuid`/`center_uuid`/`quantity`/`value_unit`/`amount`/`note`/
// `item_description`. Renderizar esses campos violaria SEM MOCK (o servidor
// rejeitaria/descartaria o payload). `batch_uuid`/`grazing_uuid`/
// `center_uuid` também NÃO são renderizados (ausentes do card de item
// visível do legado, `_card-item.blade.php` — decisão §4.2 do contrato de
// frontend), mesmo a API aceitando-os — ver `MovementPurchaseItemRow.tsx`.
//
// ---- Bloco financeiro (088 D3-FE-T4) --------------------------------------
// Com `has_financial=Sim` a tela monta, nesta ordem: cabeçalho do título
// (`MovementPurchaseFinancialHeader`), gerador + parcelas
// (`MovementPurchaseInstallmentsSection`, gerador só pelo botão "Gerar" com
// confirmação — decisão do dono P-FE-2) e rateio com valor/% e conta contábil
// (`MovementPurchaseExpenseAllocation`). Schemas compostos em
// `movement-purchase-schema.ts`; payload/hidratação/422 em `useMovementPurchases`.
//
// Recálculo por mudança de TOTAL (D3-b + P-FE-3, debounce 500 ms): com parcelas
// existentes (de qualquer origem) elas são REESCALADAS mantendo datas e entrada
// (resíduo na última) e o rateio é recalculado preservando categoria/conta/centro.
// O recálculo parte SEMPRE da baseline (linhas vigentes quando o usuário ou a
// carga as mudaram) — nunca do resultado anterior. Com parcela baixada (D2) ou
// processamento finalizado nada recalcula; regenerar do zero só pelo botão Gerar.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, Flex, Icon, IconButton, SimpleGrid, Text, useDisclosure } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { FiEdit, FiPlus } from 'react-icons/fi';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { ProviderFormModal } from '@/pages/CadastrosBase/Fornecedores/ProviderFormModal';
import { useApplySavedProvider } from '@/pages/CadastrosBase/Fornecedores/useApplySavedProvider';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputMask } from '@/components/Form/InputMask';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { isValidGuid } from '@/utils/guid';
import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import { movementPurchaseTypePaymentOptions } from '@/constants/GestaoAnimal/MovementPurchase/options';
import { queryKey } from '@/constants/query-key';

import { movementPurchaseSchemaResolver } from '@/validations/schemas/MovementPurchases/movement-purchase-schema';

import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';
import {
  createMovementPurchase,
  updateMovementPurchase,
} from '@/services/v2/MovementPurchases/movement-purchase-service';
import type {
  MovementPurchaseXmlDraft,
  MovementPurchaseXmlDraftWarning,
} from '@/services/v2/MovementPurchases/movement-purchase-service';

import type { Option } from '@/@types/option';
import type {
  MovementPurchaseDetail,
  MovementPurchaseForm as MovementPurchaseFormValues,
} from '@/@types/v2/MovementPurchases';

import { MovementPurchaseExpenseAllocation } from './MovementPurchaseExpenseAllocation';
import {
  type AllocationBaselineRow,
  type MovementPurchaseFinancialBaseline,
  applyRecalculationToRows,
  captureFinancialBaseline,
  financialRowsSignature,
} from './movementPurchaseFinancialBaseline';
import { MovementPurchaseFinancialHeader } from './MovementPurchaseFinancialHeader';
import { fromCents, recalculateForTotal, sumCents, toCents } from './movementPurchaseFinancialMath';
import { MovementPurchaseInstallmentsSection } from './MovementPurchaseInstallmentsSection';
import { MovementPurchaseItemsSection } from './MovementPurchaseItemsSection';
import {
  buildMovementPurchaseXmlApplication,
  resolveXmlWarningMessage,
} from './movementPurchaseXmlDraft';
import { MovementPurchaseXmlImportDialog } from './MovementPurchaseXmlImport';
import {
  buildMovementPurchasePayload,
  computeMovementPurchaseItemAmount,
  createEmptyMovementPurchaseItem,
  emptyMovementPurchaseFinancialForm,
  movementPurchaseFinancialToForm,
  movementPurchaseItemDetailToForm,
  resolveMovementPurchaseServerErrors,
  useMovementPurchaseForm,
} from './useMovementPurchases';

import type { FieldErrors, FieldPath } from 'react-hook-form';

const COMPRA_ANIMAIS_LIST_ROUTE = '/operacional/compra-animais';
// Debounce do recálculo por mudança de total (D3-b, plano §4.3).
const FINANCIAL_RECALC_DEBOUNCE_MS = 500;
const CHAVE_MASK = '9'.repeat(44);

function todayIso(): string {
  return todayLocalIso();
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CreateOrUpdateMovementPurchase() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { languageGB } = useLanguage();
  const applySavedProvider = useApplySavedProvider();
  const { can } = usePermissions();
  const { user } = useAuth();

  const text = languageGB.movementPurchases.movementPurchase;
  const formText = text.form;

  const isEditing = isValidGuid(uuid);

  // Flag de ORIGEM (estado da tela, não campo do form) — true só quando a
  // compra salva tem chave ou os itens vieram da importação de XML.
  const [isFiscalLocked, setIsFiscalLocked] = useState(false);

  // T6 (088) — processamento finalizado: tela em LEITURA (sem Salvar).
  const [isFinishedProcessing, setIsFinishedProcessing] = useState(false);
  // T6 (088) — responsável ORIGINAL (`user` do show), nunca o usuário logado.
  const [originalResponsible, setOriginalResponsible] = useState<string | null>(null);
  // Pacote 2 / P-1 — compra antiga cujo rateio gravado não fecha com as parcelas:
  // banner até o usuário ajustar (o schema barra o submit pela regra Σ rateio = total).
  const [hasLegacyAllocationDiff, setHasLegacyAllocationDiff] = useState(false);

  // Guard — GUID malformado na rota de edição → listagem (mirror
  // `CreateOrUpdateMovementSale.tsx`).
  useEffect(() => {
    if (!uuid) return;
    if (!isValidGuid(uuid)) {
      navigate(COMPRA_ANIMAIS_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const canSave = isEditing ? can('mov_purchase_edit') : can('mov_purchase_create');

  useEffect(() => {
    if (isEditing && !canSave && !can('mov_purchase_view')) {
      navigate(COMPRA_ANIMAIS_LIST_ROUTE, { replace: true });
    }
  }, [isEditing, canSave, navigate, can]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    setValue,
    getValues,
    watch,
    formState: { errors, dirtyFields, isDirty },
  } = useForm<MovementPurchaseFormValues>({
    mode: 'onChange',
    resolver: movementPurchaseSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      dt_sale: todayIso(),
      provider_uuid: null,
      seller_uuid: null,
      chave: null,
      serie: null,
      number: null,
      type_payment: null,
      gtas: '',
      note: '',
      total_products: 0,
      freight: 0,
      other_values: 0,
      discount: 0,
      total: 0,
      items: isEditing ? [] : [createEmptyMovementPurchaseItem()],
      ...emptyMovementPurchaseFinancialForm(),
    },
  });

  // Lei 2 (`get_pwa_form_query_pattern`) — função NOMEADA com guarda de
  // `dirtyFields`; NUNCA `reset()` solto em `useEffect`.
  function fillMovementPurchaseForm(data: MovementPurchaseDetail, resetForce?: boolean) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (!(hasNoFormChanges || resetForce)) return;

    // Trava fiscal por ORIGEM: compra salva com chave (paridade legado
    // `_card-item.blade.php:17`). Chave digitada à mão não trava.
    const hasChave = !!data.chave?.trim();
    setIsFiscalLocked(hasChave);
    setIsFinishedProcessing(data.finished_processing === true);
    setOriginalResponsible(data.user?.name ?? null);
    setHasLegacyAllocationDiff(
      !!data.financial &&
        toCents(data.financial.allocations_total) !== toCents(data.financial.installments_total)
    );

    const financialFromShow = movementPurchaseFinancialToForm(data);
    reset({
      code: data.code,
      dt_sale: data.dt_sale,
      provider_uuid: data.provider
        ? { label: data.provider.name ?? data.provider.uuid, value: data.provider.uuid }
        : null,
      seller_uuid: data.seller
        ? { label: data.seller.name ?? data.seller.uuid, value: data.seller.uuid }
        : null,
      chave: data.chave,
      serie: data.serie,
      number: data.number,
      // 088 — sem financeiro o campo fica oculto; o "90" padrão gravado pela
      // API não deve reaparecer pré-selecionado ao alternar para Sim.
      type_payment:
        data.type_payment && financialFromShow.has_financial
          ? {
              label: movementPurchaseTypePaymentOptions.getLabel(data.type_payment, languageGB),
              value: data.type_payment,
            }
          : null,
      gtas: data.gtas ?? '',
      note: data.note ?? '',
      total_products: data.total_products,
      freight: data.freight,
      other_values: data.other_values,
      discount: data.discount,
      total: data.total,
      items: data.items.map((item) => movementPurchaseItemDetailToForm(item, hasChave)),
      // T2 (088) — financeiro hidratado do show (`has_financial`, parcelas,
      // rateio): salvar sem mudanças NÃO perde o financeiro (a API recria a
      // partir do payload) e, com parcela baixada, o payload bate com o
      // persistido (D2).
      ...financialFromShow,
    });
  }

  const purchaseQuery = useMovementPurchaseForm({
    registrationId: isEditing ? uuid : undefined,
    fillForm: fillMovementPurchaseForm,
  });

  const isLoading = isEditing && checkLoadingStatus([purchaseQuery as any]);
  // T6 — processamento finalizado: tudo somente leitura.
  const isReadOnly = isEditing && isFinishedProcessing;
  const isDisabledField = !canSave || isLoading || isReadOnly;
  // D2 — parcela baixada: campos com efeito financeiro (provider/data/itens/
  // totais/financeiro) travados; observação/série/número/chave/GTA/vendedor/
  // tipo de pagamento seguem editáveis.
  const isFinancialLocked = !!watch('financial_write_off');
  const isFinancialFieldDisabled = isDisabledField || isFinancialLocked;

  const watchedItems = watch('items') ?? [];

  // ---- Totais (mirror `MovementSaleTotalsBlock`/`buildMovementPurchasePayload`
  // — `total_products`/`total` são PRÉVIA, recalculada aqui a cada render;
  // o payload de escrita recalcula do zero, nunca lê este campo). ----------
  const totalProductsValue = round(
    watchedItems.reduce(
      (sum, item) => sum + (item ? computeMovementPurchaseItemAmount(item) : 0),
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
    setValue('total', totalValue);
  }, [totalProductsValue, totalValue, setValue]);

  // ---- Subfluxo financeiro — `useFieldArray` no PAI, mirror
  // `CreateOrUpdateMovementSale.tsx`. --------------------------------------
  const financialInstallmentsArray = useFieldArray({ control, name: 'financial_installments' });
  const financialAllocationsArray = useFieldArray({ control, name: 'financial_allocations' });

  const hasFinancial = !!watch('has_financial');
  const financialMessages = languageGB.movementPurchases.movementPurchase.form.financial.messages;

  function clearFinancialSubflow() {
    financialInstallmentsArray.replace([]);
    financialAllocationsArray.replace([]);
  }

  // ---- Recálculo por mudança de total (D3-b + P-FE-3) ---------------------
  const totalCents = toCents(totalValue);
  const totalCentsRef = useRef(totalCents);
  totalCentsRef.current = totalCents;

  const watchedInstallments = watch('financial_installments');
  const watchedAllocations = watch('financial_allocations');
  const rowsSignature = financialRowsSignature(watchedInstallments, watchedAllocations);

  // Baseline = linhas vigentes quando o USUÁRIO ou a CARGA as mudaram (nunca o
  // resultado do recálculo, sem deriva de centavos). `ownWriteSignatureRef` marca
  // a escrita do próprio recálculo; `recalculatedTotalRef` evita refazer o mesmo total.
  const baselineRef = useRef<MovementPurchaseFinancialBaseline | null>(null);
  const ownWriteSignatureRef = useRef<string | null>(null);
  const recalculatedTotalRef = useRef<number | null>(null);

  useEffect(() => {
    if (ownWriteSignatureRef.current === rowsSignature) return;
    ownWriteSignatureRef.current = null;
    recalculatedTotalRef.current = null;
    baselineRef.current = captureFinancialBaseline(getValues(), totalCentsRef.current);
    // `getValues` é estável; a assinatura das linhas é o gatilho.
  }, [rowsSignature]);

  function runFinancialRecalculation() {
    const baseline = baselineRef.current;
    if (!baseline) return;
    const newTotalCents = totalCentsRef.current;
    recalculatedTotalRef.current = newTotalCents;

    const values = getValues();
    const entry =
      values.financial_has_input === true &&
      values.financial_input_date &&
      toCents(values.financial_input_value) > 0
        ? {
            due_date: values.financial_input_date,
            amountCents: toCents(values.financial_input_value),
          }
        : null;

    const result = recalculateForTotal<AllocationBaselineRow>(baseline, newTotalCents, entry);

    if (result.installmentsError === 'INPUT_GE_TOTAL') {
      setError('financial_input_value', {
        type: 'recalculation',
        message: financialMessages.inputLessThanTotal,
      });
    } else if (result.installmentsError === 'INSTALLMENT_ZERO') {
      toaster.warning({
        description: financialMessages.installmentPositive.replace(
          '{{position}}',
          String(result.position ?? 1)
        ),
      });
    }

    const applied = applyRecalculationToRows(result, {
      financial_installments: values.financial_installments,
      financial_allocations: values.financial_allocations,
    });
    if (!applied.applyInstallments && !applied.applyAllocations) return;

    ownWriteSignatureRef.current = financialRowsSignature(
      applied.installments,
      applied.allocations
    );

    if (applied.applyInstallments) {
      financialInstallmentsArray.replace(applied.installments);
      if (sumCents(applied.installments.map((row) => toCents(row.amount))) === newTotalCents) {
        clearErrors('financial_installments');
      }
    }
    if (applied.applyAllocations) {
      // `setValue` por linha preserva os `id` do field array (refs de cascata da T3).
      applied.allocations.forEach((row, index) => {
        setValue(`financial_allocations.${index}.value`, row.value, { shouldDirty: true });
        setValue(`financial_allocations.${index}.percent`, row.percent, { shouldDirty: true });
      });
      if (sumCents(applied.allocations.map((row) => toCents(row.value))) === newTotalCents) {
        clearErrors('financial_allocations');
      }
    }

    toaster.create({ type: 'info', description: financialMessages.recalculated });
  }

  const isRecalculationEnabled =
    hasFinancial && !isFinancialLocked && !isReadOnly && !isLoading && canSave;

  useEffect(() => {
    if (!isRecalculationEnabled) return;
    const baseline = baselineRef.current;
    if (!baseline || baseline.installments.length === 0) return;
    // Total que as linhas ATUAIS representam: o da baseline, ou o do último recálculo.
    if (totalCents === (recalculatedTotalRef.current ?? baseline.totalCents)) return;

    const timer = setTimeout(runFinancialRecalculation, FINANCIAL_RECALC_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // `runFinancialRecalculation` lê tudo por refs/getValues no disparo.
  }, [totalCents, isRecalculationEnabled]);

  // Banner `legacyAllocationDiff`: compra antiga com rateio ≠ parcelas, enquanto
  // a diferença persistir.
  const allocatedCents = sumCents((watchedAllocations ?? []).map((row) => toCents(row?.value)));
  const installmentsCents = sumCents(
    (watchedInstallments ?? []).map((row) => toCents(row?.amount))
  );
  const showLegacyAllocationDiff =
    hasFinancial && hasLegacyAllocationDiff && allocatedCents !== installmentsCents;

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

  // ---- Modal de Fornecedor (REUSO de `ProviderFormModal`, ver docblock) --
  const providerModalDisclosure = useDisclosure();
  const [providerOptionsCacheKey, setProviderOptionsCacheKey] = useState(0);

  // ---- Importação de XML (TASK-CP-08, contrato §4.5 + D4-FE-T1) — só em
  // modo criação, diálogo com passo de preview ANTES de aplicar (ver docblock
  // de `MovementPurchaseXmlImport.tsx`). 088 D4: o XML TRAZ o financeiro
  // (duplicatas como vieram, defaults do título, Classificação, 1 linha de
  // rateio) — ver `movementPurchaseXmlDraft.ts`. ---------------------------
  const xmlImportDisclosure = useDisclosure();
  const [xmlWarnings, setXmlWarnings] = useState<MovementPurchaseXmlDraftWarning[]>([]);

  function handleApplyXmlDraft(draft: MovementPurchaseXmlDraft) {
    setIsFiscalLocked(true);
    const application = buildMovementPurchaseXmlApplication(
      draft,
      {
        code: watch('code'),
        seller_uuid: watch('seller_uuid'),
        type_payment: watch('type_payment'),
        gtas: watch('gtas'),
        other_values: watch('other_values'),
      },
      todayIso()
    );
    setXmlWarnings(application.warnings);
    reset(application.values);
  }

  // TASK-DFE-FE-08 (lançamento cross-módulo "Lançar Animal" — DFe Recebidas
  // já baixou o XML e chamou `importMovementPurchaseXml` DIRETO, ver
  // `Fiscal/Dfe/index.tsx::handleLaunchAnimal`) — o draft já resolvido chega
  // pronto via `state` de navegação; aplica o MESMO `handleApplyXmlDraft` do
  // diálogo de upload manual, SEM abrir `MovementPurchaseXmlImportDialog` (o
  // picker não faz sentido, o arquivo já foi processado). Roda 1x no mount,
  // só em criação — mirror "SÓ disponível em modo CRIAÇÃO" já documentado no
  // cabeçalho de `MovementPurchaseXmlImport.tsx`.
  useEffect(() => {
    if (isEditing) return;
    const incomingDraft = (location.state as { dfeXmlDraft?: MovementPurchaseXmlDraft } | null)
      ?.dfeXmlDraft;
    if (!incomingDraft) return;

    handleApplyXmlDraft(incomingDraft);
    // Limpa o `state` da entrada de histórico — evita reaplicar o draft ao
    // voltar/atualizar a página.
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  // ---- Submit -------------------------------------------------------------
  const [businessError, setBusinessErrorState] = useState<string | undefined>(undefined);

  const purchaseMutation = useRequest({
    asyncFunction: tryPersistMovementPurchase,
    entityName: text.singularLabel,
    queryKey: queryKey.movementPurchases.movementPurchases,
    queryKey2: queryKey.movementPurchases.movementPurchase,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistMovementPurchase(data: MovementPurchaseFormValues) {
    setBusinessErrorState(undefined);
    const payload = buildMovementPurchasePayload(data);

    try {
      return isEditing && uuid
        ? await updateMovementPurchase(uuid, payload)
        : await createMovementPurchase(payload);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          // §4.7 — chave `financial.*` da API → campo do form; chave desconhecida
          // vira `businessError` (nunca descartada em silêncio).
          const resolved = resolveMovementPurchaseServerErrors(fieldErrors);
          resolved.fields.forEach(({ name, message }) => {
            setError(name as FieldPath<MovementPurchaseFormValues>, { type: 'server', message });
          });
          if (resolved.business.length > 0) {
            setBusinessErrorState(resolved.business.join(' '));
          }
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

  async function onSubmit(data: MovementPurchaseFormValues) {
    if (isReadOnly) return;
    try {
      await purchaseMutation.mutateAsync(data);
    } catch {
      // O toast de erro é do `useRequest` e o 422 já foi mapeado por campo em
      // `tryPersistMovementPurchase` — evita rejeição não tratada no submit do RHF.
    }
  }

  // Submit barrado por regra do financeiro (Σ parcelas/rateio ≠ total, linha
  // incompleta...): avisa por toast além da mensagem no campo.
  function onInvalid(formErrors: FieldErrors<MovementPurchaseFormValues>) {
    const financialKeys = [
      'financial_number',
      'financial_type_title',
      'financial_note',
      'financial_has_input',
      'financial_input_date',
      'financial_input_value',
      'generator',
      'financial_installments',
      'financial_allocations',
    ] as const;
    const hit = financialKeys.find((key) => !!formErrors[key]);
    if (!hit) return;
    const entry = formErrors[hit] as { message?: string; root?: { message?: string } } | undefined;
    toaster.warning({
      description: entry?.message ?? entry?.root?.message ?? financialMessages.requiredFields,
    });
  }

  const isSubmitting = purchaseMutation.isPending;

  const typePaymentOptions = movementPurchaseTypePaymentOptions.options(languageGB);
  const booleanOptions: Option<boolean>[] = [
    { label: languageGB.defaltStrings.yes, value: true },
    { label: languageGB.defaltStrings.no, value: false },
  ];

  // FLD-03 / T6 (088) — em EDIÇÃO, o responsável é o `user` ORIGINAL do show
  // (nunca o usuário logado); em criação, o usuário logado (a Action resolve
  // `user_id`). SEM MOCK: show sem `user` => '—'.
  const responsibleName = isEditing ? (originalResponsible ?? '—') : (user?.username ?? '—');

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            type="button"
            onClick={guardedBack}
          />
          {canSave && !isReadOnly && (
            <Button
              title={languageGB.defaltStrings.save}
              type="submit"
              form="movement-purchase-form"
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
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

      {xmlWarnings.length > 0 && (
        <Box
          mb={4}
          p={3}
          borderRadius="md"
          bg="feedBack.info"
          role="status"
          data-testid="xml-warnings"
        >
          <Text fontSize="sm" fontWeight="semibold" color="feedBack.infoMain">
            {formText.xmlImport.warningsTitle}
          </Text>
          {xmlWarnings.map((warning) => (
            <Text key={warning.code} fontSize="sm" color="feedBack.infoMain">
              {resolveXmlWarningMessage(warning, formText.xmlImport.warnings)}
            </Text>
          ))}
        </Box>
      )}

      {isReadOnly && (
        <Box mb={4} p={3} borderRadius="md" bg="feedBack.warn" role="status">
          <Text fontSize="sm" color="feedBack.warnMain">
            {formText.finishedReadOnlyMessage}
          </Text>
        </Box>
      )}

      {isFinancialLocked && !isReadOnly && (
        <Box mb={4} p={3} borderRadius="md" bg="feedBack.warn" role="status">
          <Text fontSize="sm" color="feedBack.warnMain">
            {formText.writeOffLockMessage}
          </Text>
        </Box>
      )}

      <Form id="movement-purchase-form" noPadding onSubmit={handleSubmit(onSubmit, onInvalid)}>
        {/* ---- Importação de XML (TASK-CP-08, contrato §4.5) — só criação ---- */}
        {!isEditing && (
          <Flex justify="flex-end" mb={6}>
            <Button
              title={formText.xmlImport.label}
              variant="outline"
              type="button"
              onClick={xmlImportDisclosure.onOpen}
              disabled={isDisabledField}
            />
          </Flex>
        )}

        {/* ---- Cabeçalho (FLD-01..09, ordem exata) ---- */}
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
                <DateInput
                  value={value ?? null}
                  onChange={onChange}
                  disabled={isFinancialFieldDisabled}
                />
              )}
            />
            {errors.dt_sale?.message && (
              <Text fontSize="xs" color="fg.error" mt={1}>
                {errors.dt_sale.message}
              </Text>
            )}
          </Box>

          <InputReadOnly label={formText.fields.userName} value={responsibleName} />

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
            name="provider_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.provider}
                placeholder={formText.placeholders.provider}
                error={errors.provider_uuid?.message as string | undefined}
                service={(params) => listProviderOptions({ ...params, type: 1 })}
                mapOptions={(item: ProviderOptionItem) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isDisabled={isFinancialFieldDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                cacheUniqs={[providerOptionsCacheKey]}
                // EST-07 — botão criar/editar Fornecedor migrado do
                // `IconButton` avulso para o `labelAction`, mirror EXATO do
                // padrão `CreateOrUpdateNfe.tsx`.
                labelActionTooltip={formText.placeholders.provider}
                labelAction={
                  <IconButton
                    aria-label={formText.placeholders.provider}
                    variant="ghost"
                    size="2xs"
                    minH="0"
                    h="20px"
                    w="20px"
                    minW="0"
                    p="0"
                    disabled={
                      isFinancialFieldDisabled ||
                      !(can('providers_create') || can('providers_edit'))
                    }
                    onClick={providerModalDisclosure.onOpen}
                  >
                    <Icon as={field.value ? FiEdit : FiPlus} boxSize="16px" color="primaryMain" />
                  </IconButton>
                }
              />
            )}
          />

          {/* `chave` — máscara 44 dígitos puros, sem ponto (corrige CLM-23).
              Editável (achado de fidelidade, ver docblock de topo). */}
          <Controller
            name="chave"
            control={control}
            render={({ field }) => (
              <InputMask
                label={formText.fields.chave}
                mask={CHAVE_MASK}
                maskPlaceholder=""
                name={field.name}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value || null)}
                onBlur={field.onBlur}
                error={errors.chave?.message as string | undefined}
                disabled={isDisabledField}
              />
            )}
          />

          <Input label={formText.fields.serie} {...register('serie')} disabled={isDisabledField} />

          {/* `number` — 1 único campo (corrige CLM-22, sem hidden duplicado). */}
          <Input
            label={formText.fields.number}
            {...register('number')}
            disabled={isDisabledField}
          />

          <Input
            label={formText.fields.gtas}
            {...register('gtas')}
            error={errors.gtas?.message}
            loading={isLoading}
            disabled={isDisabledField}
          />
        </SimpleGrid>

        {/* ---- Itens dinâmicos (SUBREG-ITEMS) ---- */}
        <MovementPurchaseItemsSection
          control={control}
          errors={errors}
          watch={watch}
          isDisabled={isFinancialFieldDisabled}
          isFiscalLocked={isFiscalLocked}
        />

        {/* ---- Totais (FLD-10..14) ---- */}
        <Box mt={8} pt={4} borderTop="1px solid" borderColor="border.subtle">
          <Text fontSize="sm" fontWeight="semibold" mb={4}>
            {formText.sections.totals}
          </Text>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <InputReadOnly
              label={formText.totals.totalProducts}
              value={formatCurrencyBRL(totalProductsValue)}
            />

            <Controller
              name="freight"
              control={control}
              render={({ field }) => (
                <MoneyInput
                  name={field.name}
                  label={formText.totals.freight}
                  value={field.value ?? 0}
                  onValueChange={(value) => field.onChange(value)}
                  disabled={isFinancialFieldDisabled}
                />
              )}
            />

            <Controller
              name="other_values"
              control={control}
              render={({ field }) => (
                <MoneyInput
                  name={field.name}
                  label={formText.totals.otherValues}
                  value={field.value ?? 0}
                  onValueChange={(value) => field.onChange(value)}
                  disabled={isFinancialFieldDisabled}
                />
              )}
            />

            <Controller
              name="discount"
              control={control}
              render={({ field }) => (
                <MoneyInput
                  name={field.name}
                  label={formText.totals.discount}
                  value={field.value ?? 0}
                  onValueChange={(value) => field.onChange(value)}
                  disabled={isFinancialFieldDisabled}
                />
              )}
            />

            <InputReadOnly label={formText.totals.total} value={formatCurrencyBRL(totalValue)} />
          </SimpleGrid>
        </Box>

        {/* ---- Dados de Pagamento (FLD-15..17, posição mirror Vendas —
            `type_payment`/`note` DEPOIS dos itens/totais) ---- */}
        <Box mt={8}>
          <Text fontWeight="semibold" mb={3}>
            {formText.sections.payment}
          </Text>
          <SimpleGrid columns={columnsForm.default} gap={6}>
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
                    if (nextValue && getValues('financial_allocations').length === 0) {
                      // 1ª linha de rateio = total da compra (100 %).
                      financialAllocationsArray.append({
                        category: null,
                        plan_account: null,
                        center: null,
                        value: totalCents > 0 ? fromCents(totalCents) : null,
                        percent: totalCents > 0 ? 100 : null,
                      });
                    }
                    if (!nextValue) {
                      clearFinancialSubflow();
                      // 088 — campos ocultos sem financeiro: limpa para não
                      // enviar/validar valor invisível.
                      setValue('type_payment', null, { shouldDirty: true });
                      setValue('note', '', { shouldDirty: true });
                    }
                  }}
                  options={booleanOptions}
                  isRequired
                  isDisabled={isFinancialFieldDisabled}
                  noClearable
                />
              )}
            />
          </SimpleGrid>

          {/* 088 — Forma de Pagamento e Observação ABAIXO de Gerar Financeiro e
              SÓ com Gerar Financeiro = Sim (pedido do dono; o legado os
              exibia sempre, antes de Gerar Financeiro). */}
          {hasFinancial && (
            <Box data-testid="purchase-payment-fields">
              <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
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
            </Box>
          )}

          {/* ---- Subfluxo financeiro (D3-FE-T4): cabeçalho do título → gerador +
              parcelas → rateio. ---- */}
          {hasFinancial && (
            <>
              {showLegacyAllocationDiff && (
                <Box mt={6} p={3} borderRadius="md" bg="feedBack.warn" role="alert">
                  <Text fontSize="sm" color="feedBack.warnMain">
                    {financialMessages.legacyAllocationDiff
                      .replace('{{allocated}}', formatCurrencyBRL(fromCents(allocatedCents)))
                      .replace('{{total}}', formatCurrencyBRL(fromCents(installmentsCents)))}
                  </Text>
                </Box>
              )}

              <Box mt={6}>
                <MovementPurchaseFinancialHeader
                  control={control}
                  setValue={setValue}
                  errors={errors}
                  languageGB={languageGB}
                  disabled={isFinancialFieldDisabled}
                />
              </Box>

              <Box mt={6}>
                <MovementPurchaseInstallmentsSection
                  control={control}
                  fields={financialInstallmentsArray.fields}
                  append={financialInstallmentsArray.append}
                  remove={financialInstallmentsArray.remove}
                  replace={financialInstallmentsArray.replace}
                  vlTotal={totalValue}
                  errors={errors}
                  languageGB={languageGB}
                  disabled={isFinancialFieldDisabled}
                />
              </Box>

              <Box mt={6}>
                <MovementPurchaseExpenseAllocation
                  control={control}
                  fields={financialAllocationsArray.fields}
                  append={financialAllocationsArray.append}
                  remove={financialAllocationsArray.remove}
                  setValue={setValue}
                  errors={errors}
                  languageGB={languageGB}
                  disabled={isFinancialFieldDisabled}
                />
              </Box>
            </>
          )}
        </Box>
      </Form>

      <ProviderFormModal
        isOpen={providerModalDisclosure.open}
        onClose={providerModalDisclosure.onClose}
        onSaved={(provider) => {
          applySavedProvider(provider, () =>
            setValue(
              'provider_uuid',
              { value: provider.uuid, label: provider.label },
              { shouldDirty: true, shouldValidate: true }
            )
          );
          setProviderOptionsCacheKey((key) => key + 1);
          providerModalDisclosure.onClose();
        }}
      />

      <MovementPurchaseXmlImportDialog
        isOpen={xmlImportDisclosure.open}
        onClose={xmlImportDisclosure.onClose}
        onApply={handleApplyXmlDraft}
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
