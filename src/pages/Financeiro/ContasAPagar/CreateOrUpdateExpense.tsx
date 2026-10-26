// src/pages/Financeiro/ContasAPagar/CreateOrUpdateExpense.tsx
// -----------------------------------------------------------------------------
// Tela ÂNCORA de criação/edição de Expense ("Contas a Pagar") — esteira 036,
// TASK-FE-036-104/105/107/108/109. 1 `useForm` RAIZ com resolver ÚNICO
// (`expenseSchemaResolver`, TASK-FE-036-111), casca de abas (`Tabs.Root`,
// mirror `CreateOrUpdateInvoice.tsx`) — "Cabeçalho" (com a seção "Baixa
// Automática" embutida) implementada AQUI; "Rateio"/"Parcelamento" são
// arquivos separados (`ExpenseApportionmentTab.tsx`/
// `ExpenseInstallmentsTab.tsx`).
//
// Divergências REAIS vs. o mirror `Invoices` (achados do contrato de tela,
// não preferência de estilo):
//   - Rateio (`categories`) NÃO é write-only — volta do backend em edição
//     (`ExpenseResource.categories`, eager-loaded) e é REIDRATADO/editável,
//     bloqueado só quando há baixa (`hasExpenseMoved`, GAP-FE-036-102/103).
//   - Aba "Parcelamento" e seção "Baixa Automática" só existem em CRIAÇÃO —
//     parcelamento materializa títulos independentes (não voltam como
//     array), baixa automática é evento de criação (contrato §6).
//   - Guarda de imutabilidade (`hasExpenseMoved`, GAP-FE-036-106/107):
//     campos financeiros + `dt_emission` + rateio ficam readonly quando há
//     baixa, mas SEMPRE reenviados idênticos no PUT (nunca omitidos).
//   - Apropriação (GAP-FE-036-101, B-09 Opção C parcial, `GAP-036-115`,
//     TASK-FE-036-123): 2 campos novos no Cabeçalho — `appropriation`
//     (Direta/Indireta, default Indireta preserva o payload atual) +
//     `appropriation_type` (habilitado só quando Direta; tipos oferecidos por
//     `GET /expenses/appropriation-types/options`, fallback nos 4). Tipo=Área
//     liga a coluna "Área" do rateio (`ExpenseApportionmentTab`).
//     Tipo=Agricultura é a Tarefa irmã (`TASK-FE-036-124`). UT-000795
//     (Execução 102): Pecuária e Manutenção liberadas (blocos em
//     `appropriation/`), sem o sufixo "(indisponível nesta versão)".
//   - `document_ids`/anexos: fora de escopo desta fatia (sem Tarefa de
//     upload nesta faixa 100-199) — nunca enviado no payload.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import {
  Alert,
  Box,
  Flex,
  Icon,
  IconButton,
  SimpleGrid,
  Tabs,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { FiDownload, FiEdit, FiPlus, FiUpload } from 'react-icons/fi';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useApplySavedProvider } from '@/pages/CadastrosBase/Fornecedores/useApplySavedProvider';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
// TASK-FE-036-124 (B-09 Opção C parcial, `GAP-036-115`, 2/2) — bloco
// "Agricultura" do Cabeçalho, mirror EXATO `AppropriationHeaderFields.tsx`/
// `InvoiceItemsTab.tsx` (cascata Operação→Atividade); componente pronto, NÃO
// um service cru.
import { SelectCultivation } from '@/components/Form/SelectCultivation';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';
// B-05 (TASK-FE-036-121/340/341, Onda 3 sub-onda 3f) — módulo COMPARTILHADO
// de Upload/Prefill de XML, mesma composição de `CreateOrUpdateIncome.tsx`
// (`segment='incomes'`) — aqui `segment='expenses'`, SEM tocar o componente.
import { XmlPrefillModal } from '@/components/XmlPrefill';

import { useAuth } from '@/hooks/useAuth';
import { useCurrentFarm } from '@/hooks/useCurrentFarm';
import { useLanguage } from '@/hooks/useLanguage';
import { useMyFarms } from '@/hooks/useMyFarms';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { downloadBlob } from '@/utils/downloadBlob';
import { hasExpenseMoved } from '@/utils/expense-guards';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';
import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import {
  expenseAppropriationIndex,
  expenseAppropriationOptions,
  buildExpenseAppropriationTypeOptions,
  expenseAppropriationTypeIndex,
  expenseAppropriationTypeOptions,
} from '@/constants/financeiro/expense/options/appropriation-options';
import { expenseClassificationOptions } from '@/constants/financeiro/expense/options/classification-options';
import {
  expensePaymentTypeIndex,
  expensePaymentTypeOptions,
} from '@/constants/financeiro/expense/options/payment-type-options';
import { expenseRecurrenceTypeOptions } from '@/constants/financeiro/expense/options/recurrence-type-options';
// `type_note` ("Tipo de Nota") reusa o MESMO enum físico legado
// (`\App\Invoice::types()`, `_forms.blade.php:59`) já modelado para o campo
// homônimo do Invoice — NUNCA duplicar um novo enum/i18n para o mesmo
// domínio (esteira 036fix, audit "Tipo de Nota select do enum legado").
import { invoiceDocumentTypeOptions } from '@/constants/invoices/options/document-type-options';
import { queryKey } from '@/constants/query-key';

import { expenseSchemaResolver } from '@/validations/schemas/Financeiro/expense-schema';

// TASK-FE-036-124 (B-09 Opção C parcial, `GAP-036-115`, 2/2) — ZERO service
// novo: os 4 lookups do bloco "Agricultura" já têm services prontos, os
// MESMOS já consumidos por `AppropriationHeaderFields.tsx`/
// `InvoiceItemsTab.tsx` (mirror EXATO, não reinventar cascata/mapOptions).
import { listActivities } from '@/services/v2/Activities/activity-service';
import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import {
  getTypeTitleByUuid,
  listTypeTitleOptions,
} from '@/services/v2/BaseRegistrations/typeTitles-service';
import {
  getAccountBalance,
  listAccounts,
} from '@/services/v2/CadastrosBase/Account/account-service';
import {
  getProprietaryByUuid,
  listProprietaries,
} from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import {
  getProviderByUuid,
  listProviders,
} from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listBranchesByProvider } from '@/services/v2/Financeiro/Branches/branch-service';
import {
  createExpense,
  listExpenseAppropriationTypeOptions,
  updateExpense,
} from '@/services/v2/Financeiro/Expenses/expense-service';
import { getHarvest, listHarvests } from '@/services/v2/Harvests/harvest-service';
import { listOperations } from '@/services/v2/Operations/operation-service';
// B-05 (TASK-FE-036-121/340) — módulo COMPARTILHADO, `downloadXml('expenses',
// uuid)` devolve o binário puro (SEM envelope `ApiResponse`), mirror
// `CreateOrUpdateIncome.tsx`/`IncomeDetalhe.tsx` — NENHUM wrapper próprio de
// domínio criado aqui (o serviço compartilhado já é `segment`-aware).
import { downloadXml } from '@/services/v2/XmlPrefill/xml-prefill-service';

import type { Option } from '@/@types/option';
import type { Response } from '@/@types/response-api';
import type { ActivityListItem } from '@/@types/v2/Activities';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { NfseExpenseDraft } from '@/@types/v2/BaseRegistrations/nfse';
import type { TypeTitleOptionItem } from '@/@types/v2/BaseRegistrations/typeTitles';
import type {
  ExpenseApportionmentPayload,
  ExpenseAppropriationTypeValue,
  ExpenseAppropriationValue,
  ExpenseDetail,
  ExpenseDuplicateDraft,
  ExpenseForm as ExpenseFormType,
  ExpensePayload,
} from '@/@types/v2/Financeiro/expense';
import type { Harvest } from '@/@types/v2/Harvests';
import type { InvoiceDocumentTypeValue } from '@/@types/v2/Invoices';
import type { OperationListItem } from '@/@types/v2/Operations';
import type { ExpenseXmlDraft } from '@/@types/v2/XmlPrefill';

import {
  buildAppropriationPayload,
  EMPTY_APPROPRIATION_FIELDS,
  extractAppropriationErrors,
  hydrateAppropriationDetail,
  isProviderRequiredForAppropriation,
} from './appropriation/expenseAppropriation';
import { ExpenseLivestockBlock } from './appropriation/ExpenseLivestockBlock';
import { ExpenseMaintenanceBlock } from './appropriation/ExpenseMaintenanceBlock';
import { EXPENSES_BASE_PATH } from './constants';
import { ExpenseApportionmentTab } from './ExpenseApportionmentTab';
import {
  extractCategoryHarvestErrors,
  resolveHeaderHarvestUuid,
  resolveRowHarvestUuid,
} from './expenseHarvest';
import { ExpenseInstallmentsTab } from './ExpenseInstallmentsTab';
import {
  mapNfseDraftExtraFields,
  toExpenseXmlDraft,
  type NfseDraftNavigationState,
} from './nfseDraft';
import { useExpenseForm } from './useExpenses';

// Item B15/B16 (homologação 036fix3) — import cruzado por caminho relativo,
// mesmo padrão já em uso em `CreateOrUpdateMovimento.tsx` (TASK-MV-FE-13):
// reusa 100% o modal genérico de Fornecedor (`ProviderFormModal`, sobre
// `useProviderFormController`/`ProviderFormFields`/schema+service da página
// cheia) — zero endpoint/schema/modal novo nesta tela.
import { ProviderFormModal } from '../../CadastrosBase/Fornecedores/ProviderFormModal';
// TASK-FE-036-124 (B-09 Opção C parcial, `GAP-036-115`, 2/2) — reaproveita o
// dicionário ÚNICO status→label de Apontamento (`Operacional/Appropriations`,
// `TASK-FE-2706`) para rotular o indicador `appropriation_generated.status`,
// NUNCA um novo dicionário duplicado.
import { getAppropriationStatusLegend } from '../../Operacional/Appropriations/appropriationStatus';
import {
  OBLIGATION_DRAFT_QUERY_PARAM,
  clearObligationDraft,
  isUsableObligationDraft,
  mapObligationDraftToExpenseFields,
  readObligationDraft,
  type ObligationDraftNavigationState,
} from '../MovCaixaBancario/obligation-draft';

// B-05 (TASK-FE-036-121, item 2 da Leitura do dev) — `ExpenseXmlDraft.type_id`
// é SEMPRE `18` (fixo, `ParseExpenseNfseXmlAction.php:81` — o parser só
// reconhece NFSe). `type_titles.id=18` no LEGADO (`agro365`, dump real,
// confirmado por leitura direta — mesma fonte de verdade que já resolveu
// `TYPE_TITLE_NFE_LABEL='Nota Fiscal - NFe'`/`id=4` em
// `CreateOrUpdateInvoice.tsx`) é `'Nota Fiscal Serviço - NFSe'`. `TypeTitle`
// é catálogo por TENANT no fork (sem id fixo herdável) — resolvido por MATCH
// DE LABEL no catálogo real (`/type-titles/options`, `search` ILIKE parcial
// em `description`), MESMO CONTORNO do Invoice; sem match exato, o campo
// fica MANUAL (usuário escolhe) — nunca um uuid adivinhado.
const TYPE_TITLE_NFSE_LABEL = 'Nota Fiscal Serviço - NFSe';

function findTypeTitleNfseOption(items: TypeTitleOptionItem[]): Option<string> | null {
  const normalizedTarget = TYPE_TITLE_NFSE_LABEL.trim().toLowerCase();
  const match = items.find((item) => item.description.trim().toLowerCase() === normalizedTarget);
  return match ? { label: match.description, value: match.uuid } : null;
}

type ExpenseTabKey = '0' | '1' | '2';

const TAB_FIELDS: Record<ExpenseTabKey, (keyof ExpenseFormType)[]> = {
  '0': [
    'number',
    'type_title_uuid',
    'provider_uuid',
    'branch_uuid',
    'proprietary_uuid',
    'harvest_uuid',
    'dt_emission',
    'due_date',
    'amount',
    'note',
    'fiscal_document',
    'payment_type',
    'recurrence_type',
    'classification',
    'type_note',
    'is_taxation',
    'discount',
    'penalty',
    'interest',
    'perc_interest',
    'increase',
    'automatic_writeoff',
    'account_uuid',
    'movement_date',
    'appropriation',
    'appropriation_type',
    'aprop_pec_area_uuid',
    'aprop_pec_grazing_uuid',
    'aprop_pec_batch_uuid',
    'aprop_pec_animal_uuid',
    'aprop_pec_operation_uuid',
    'aprop_pec_activity_uuid',
    'aprop_man_equipment_uuid',
    'aprop_man_hour_meter',
    'aprop_man_mileage',
    'farm_uuid',
  ],
  '1': ['categories'],
  '2': ['qtd_installments', 'installments'],
};

const FIELD_TAB_MAP: Partial<Record<keyof ExpenseFormType, ExpenseTabKey>> = Object.fromEntries(
  (Object.entries(TAB_FIELDS) as [ExpenseTabKey, (keyof ExpenseFormType)[]][]).flatMap(
    ([tab, fields]) => fields.map((field) => [field, tab])
  )
);

const getYesNoOptions = (languageGB: ReturnType<typeof useLanguage>['languageGB']) => [
  { label: languageGB.defaltStrings.yes, value: true },
  { label: languageGB.defaltStrings.no, value: false },
];

export default function CreateOrUpdateExpense() {
  const { expenseId } = useParams<{ expenseId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const applySavedProvider = useApplySavedProvider();
  const { can } = usePermissions();
  const location = useLocation();
  const queryClient = useQueryClient();

  const isEditing = isValidGuid(expenseId);
  // Rota "/visualizar" (contrato §3) reaproveita o MESMO componente,
  // forçada somente-leitura independente de o usuário também ter
  // `expenses_edit` — mirror `ServiceExpenses` (sem tela Blade-like
  // separada, ver `router/index.tsx`).
  const isViewOnlyRoute = location.pathname.endsWith('/visualizar');

  const text = languageGB.financial.expense;
  const formText = text.form;

  const canSave = !isViewOnlyRoute && (isEditing ? can('expenses_edit') : can('expenses_create'));

  // EXP-R04/R19 (P0) — `tenant.use_fiscal` (mirror legado, `_forms.blade.
  // php:63-68`/`edit.blade.php` idêntico) já é REAL e acessível pelo mesmo
  // endpoint que alimenta o `FarmSwitcher`/quota de usuários
  // (`GET /me/farms/current`, `FarmResource::tenant.use_fiscal`,
  // confirmado em `api_root`) — SEM Gap-API. Dedutível (`fiscal_document`)
  // fica READONLY em AMBOS os verbos quando o fiscal do tenant está
  // desativado; o DEFAULT por tenant só se aplica na CRIAÇÃO (edição
  // sempre reidrata o valor real do registro, `fillExpenseForm`, nunca
  // sobrescrito por esta configuração).
  const { data: currentFarm } = useCurrentFarm();
  const useFiscal = currentFarm?.tenant?.use_fiscal;
  const isFiscalDocumentReadOnly = useFiscal === false;

  // DEC-115 (TASK-FE-036-125, §6) — Select "Fazenda de destino", gateado
  // DIRETO por `tenant.list_all_farms` (MESMO flag do backend,
  // `StoreExpenseAction`), independente do toggle da listagem (rotas
  // diferentes, sem estado compartilhado confiável entre navegações — ver
  // Leitura do dev da Tarefa). Visível só em CRIAÇÃO.
  const listAllFarmsEnabled = currentFarm?.tenant?.list_all_farms === true;
  const showFarmDestinationField = !isEditing && listAllFarmsEnabled;
  // `useMyFarms()` — MESMA fonte do `FarmSwitcher` (`GET /me/farms`), universo
  // pequeno, sem paginação/busca server-side (por isso `Select` comum, não
  // `SelectAsyncPaginate`).
  const myFarmsQuery = useMyFarms();

  // TASK-FE-036-123 (B-09 Opção C parcial, `GAP-036-115`, §11.4 do contrato
  // de tela) — `listAreas` exige `farm_uuid` (`AreaIndexRequest::rules()`,
  // tenant-wide sem esse filtro), mirror EXATO do wrapper já em produção em
  // `CreateOrUpdateAppropriation.tsx:392-394`/`InvoiceItemsTab.tsx:432-434`
  // (`activeFarmUuid` via `useAuth()`, NÃO `useCurrentFarm()` — shape
  // diferente, não expõe `activeFarmUuid`). Reaproveitada tanto pela coluna
  // "Área" do rateio (`ExpenseApportionmentTab`) quanto pelo bloco
  // Agricultura da Tarefa irmã (`TASK-FE-036-124`) — nunca duplicada.
  const { activeFarmUuid } = useAuth();
  function listAreasForActiveFarm(params: { search?: string; page?: number; per_page?: number }) {
    return listAreas({ ...params, farm_uuid: activeFarmUuid ?? '' });
  }

  useEffect(() => {
    if (expenseId && !isValidGuid(expenseId)) {
      navigate(EXPENSES_BASE_PATH, { replace: true });
    }
  }, [expenseId, navigate]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    setError,
    clearErrors,
    formState: { errors, dirtyFields },
  } = useForm<ExpenseFormType>({
    mode: 'onChange',
    resolver: expenseSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    context: { isEditing },
    defaultValues: {
      number: '',
      type_title_uuid: null,
      provider_uuid: null,
      branch_uuid: null,
      proprietary_uuid: null,
      harvest_uuid: null,
      dt_emission: null,
      due_date: null,
      amount: null,
      note: '',
      fiscal_document: null,
      payment_type: null,
      recurrence_type: null,
      classification: { label: formText.classificationOptions.notClassified, value: 'N' },
      type_note: null,
      // TASK-FE-036-123 (B-09 Opção C parcial, `GAP-036-115`) — default
      // Indireta preserva o comportamento em produção (`appropriation:2`)
      // enquanto o usuário não tocar o Select "Modalidade".
      appropriation: {
        label: expenseAppropriationOptions.getLabel(expenseAppropriationIndex.INDIRETA, languageGB),
        value: expenseAppropriationIndex.INDIRETA,
      },
      appropriation_type: null,
      // TASK-FE-036-124 (B-09 Opção C parcial, `GAP-036-115`, 2/2) — bloco
      // "Agricultura", visível/obrigatório só quando Direta+Tipo=Agricultura
      // (JSX condicional abaixo).
      aprop_agri_area_uuid: null,
      aprop_agri_activity_uuid: null,
      aprop_agri_operation_uuid: null,
      aprop_agri_cultivation_uuid: null,
      // UT-000795 — blocos Pecuária/Manutenção (visíveis só com Direta+Tipo 2/4).
      ...EMPTY_APPROPRIATION_FIELDS,
      is_taxation: { label: languageGB.defaltStrings.no, value: false },
      discount: 0,
      penalty: 0,
      interest: 0,
      perc_interest: 0,
      increase: 0,
      qtd_installments: null,
      installments: [],
      // EXP-R18 (P1) — legado inicia o rateio com 1 linha já em 100% do
      // título (mirror `_forms.blade.php:268`, linha única de criação —
      // NUNCA vazia); a sincronização dessa 1ª linha com "Valor" do
      // Cabeçalho vive em `ExpenseApportionmentTab` (mesmo mirror de
      // `_forms.blade.php:383-387`). Edição continua reidratando do
      // backend em `fillExpenseForm`, nunca seedada aqui.
      categories: isEditing
        ? []
        : [
            {
              category_uuid: null,
              center_uuid: null,
              value: null,
              plan_account_uuid: null,
              percent: 100,
              area_uuid: null,
              harvest_uuid: null,
            },
          ],
      automatic_writeoff: false,
      account_uuid: null,
      movement_date: null,
      xml_key: null,
      // DEC-115 (TASK-FE-036-125, §6) — populado assim que `useMyFarms()`
      // resolver (useEffect abaixo), com a fazenda ATIVA pré-selecionada.
      // `null` até lá é seguro: o campo só existe no DOM quando
      // `showFarmDestinationField` vale, e o payload só lê `farm_uuid`
      // nesse mesmo gate.
      farm_uuid: null,
    },
  });

  // ---- Guarda de imutabilidade (GAP-FE-036-106/107/109) — único ponto de
  // verdade, consumido por Cabeçalho + Rateio. Em criação nunca há baixa. ----
  const [loadedExpense, setLoadedExpense] = useState<ExpenseDetail | null>(null);
  const hasMoved = isEditing && !!loadedExpense && hasExpenseMoved(loadedExpense);

  function fillExpenseForm(data: ExpenseDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      setLoadedExpense(data);
      reset({
        number: data.number,
        // GAP-FE-036-P0 (audit `audit-contas-a-pagar.md`, itens 1-2/E-04) —
        // a API JÁ devolve a relação `type` (Tipo de Título, eager-loaded
        // tanto no `show`/`store`/`update` quanto no `index`,
        // `ExpenseResource::type`/`ExpenseRepository::findByApiUuidOrFail`).
        // Reidratar o Select com ela, NUNCA forçar `null` — o campo é
        // obrigatório no schema; zerá-lo na edição obrigava reescolha
        // espúria a cada abertura do formulário.
        type_title_uuid: data.type ? { label: data.type.description, value: data.type.uuid } : null,
        provider_uuid: data.provider
          ? { label: data.provider.name, value: data.provider.uuid }
          : null,
        branch_uuid: data.branch ? { label: data.branch.name, value: data.branch.uuid } : null,
        proprietary_uuid: data.proprietary
          ? { label: data.proprietary.name, value: data.proprietary.uuid }
          : null,
        // `harvest.description` (esteira 036fix, GAP-API resolvido, E-12) —
        // a API agora devolve a descrição da Safra junto do uuid; o label
        // do Select nunca mais é o uuid cru.
        harvest_uuid: data.harvest
          ? { label: data.harvest.description, value: data.harvest.uuid }
          : null,
        dt_emission: data.dt_emission,
        due_date: data.due_date,
        amount: data.amount,
        note: data.note ?? '',
        fiscal_document: {
          label: data.fiscal_document ? languageGB.defaltStrings.yes : languageGB.defaltStrings.no,
          value: data.fiscal_document,
        },
        payment_type: data.payment_type
          ? {
              label: expensePaymentTypeOptions.getLabel(data.payment_type, languageGB),
              value: data.payment_type,
            }
          : null,
        recurrence_type: data.recurrence_type
          ? {
              label: expenseRecurrenceTypeOptions.getLabel(data.recurrence_type, languageGB),
              value: data.recurrence_type,
            }
          : null,
        classification: data.classification
          ? {
              label: expenseClassificationOptions.getLabel(data.classification, languageGB),
              value: data.classification,
            }
          : { label: formText.classificationOptions.notClassified, value: 'N' },
        type_note:
          data.type_note != null
            ? {
                label: invoiceDocumentTypeOptions.getLabel(
                  data.type_note as InvoiceDocumentTypeValue,
                  languageGB
                ),
                value: data.type_note,
              }
            : null,
        // TASK-FE-036-123 (B-09 Opção C parcial, `GAP-036-115`) — reidrata a
        // Modalidade/Tipo reais do título (antes ausentes do reset, sempre
        // implícitos como Indireta/`null`). `appropriation` sempre presente
        // no Resource (`Rule::in([1,2])`); fallback defensivo para Indireta
        // só no caso raro de vir `null`/`undefined` de um título legado.
        appropriation: {
          label: expenseAppropriationOptions.getLabel(
            data.appropriation ?? expenseAppropriationIndex.INDIRETA,
            languageGB
          ),
          value: data.appropriation ?? expenseAppropriationIndex.INDIRETA,
        },
        appropriation_type:
          data.appropriation_type != null
            ? {
                label: expenseAppropriationTypeOptions.getLabel(
                  data.appropriation_type as ExpenseAppropriationTypeValue,
                  languageGB
                ),
                value: data.appropriation_type as ExpenseAppropriationTypeValue,
              }
            : null,
        // TASK-FE-036-124 (B-09 Opção C parcial, `GAP-036-115`, 2/2) —
        // decisão de escopo DOCUMENTADA (Leitura do dev): o backend não
        // reidrata esses 4 valores de entrada, só o indicador
        // `appropriation_generated` (lido direto de `loadedExpense`, abaixo)
        // — os 4 campos do bloco "Agricultura" nascem SEMPRE vazios em
        // edição, mesmo quando o título já é Direta+Agricultura. Editar e
        // salvar de novo RECRIA o Appropriation (mirror legado exclui+recria).
        aprop_agri_area_uuid: null,
        aprop_agri_activity_uuid: null,
        aprop_agri_operation_uuid: null,
        aprop_agri_cultivation_uuid: null,
        // UT-000795 (D-102-14) — Pecuária/Manutenção REIDRATAM a partir de
        // `appropriation_detail` (option única; nenhuma requisição no load;
        // número cru no medidor, sem ×10). Dentro do MESMO `reset`.
        ...hydrateAppropriationDetail(data.appropriation_detail),
        is_taxation: {
          label: data.is_taxation ? languageGB.defaltStrings.yes : languageGB.defaltStrings.no,
          value: data.is_taxation,
        },
        discount: data.discount ?? 0,
        penalty: data.penalty ?? 0,
        interest: data.interest ?? 0,
        perc_interest: data.perc_interest ?? 0,
        increase: data.increase ?? 0,
        // Parcelamento não se aplica a edição (contrato §6) — sempre vazio.
        qtd_installments: null,
        installments: [],
        // Rateio VOLTA do backend e é REIDRATADO (achado real, GAP-FE-036-103)
        // — diferente do Invoice, write-only.
        categories: (data.categories ?? []).map((row) => ({
          category_uuid: { label: row.category.description, value: row.category.uuid },
          center_uuid: row.center
            ? { label: row.center.description, value: row.center.uuid }
            : null,
          value: row.value,
          plan_account_uuid: row.plan_account
            ? { label: row.plan_account.description, value: row.plan_account.uuid }
            : null,
          // CORREÇÃO de bug pré-existente de round-trip (TASK-FE-036-123,
          // Handshake backend `HANDSHAKE-FE-036-B09`, independente do Tipo
          // escolhido) — `row.area`/`row.harvest` (já devolvidos pela API,
          // `ExpenseResource::categories[].area/harvest`) eram lidos e
          // DESCARTADOS aqui; um título com área já salva no rateio reabria
          // a edição com o campo vazio e reenviava `area_uuid: null` no PUT
          // mesmo com o backend já tendo persistido um valor. Mesmo padrão
          // 3 linhas acima (`plan_account_uuid`).
          area_uuid: row.area ? { label: row.area.description, value: row.area.uuid } : null,
          harvest_uuid: row.harvest
            ? { label: row.harvest.description, value: row.harvest.uuid }
            : null,
          // `percent` (esteira 036fix) — recomputado na reidratação, só
          // exibição/edição client-side (nunca volta do backend).
          percent: data.amount ? Math.round((row.value / data.amount) * 10000) / 100 : null,
        })),
        // Baixa automática não se aplica a edição (evento de criação).
        automatic_writeoff: false,
        account_uuid: null,
        movement_date: null,
        // B-05 (TASK-FE-036-121/340) — reidratado só para exibir/gatear o
        // link "Baixar XML" (`loadedExpense.xml_key`, abaixo); reimportação
        // de XML não existe em edição (mirror `CreateOrUpdateIncome.tsx`).
        xml_key: data.xml_key ?? null,
      });
    }
  }

  const expenseQuery = useExpenseForm({
    registrationId: isEditing ? expenseId : undefined,
    fillForm: fillExpenseForm,
  });

  const isLoading = isEditing && checkLoadingStatus([expenseQuery as any]);

  // ---- Duplicar (AM11, TASK-FE-036-122, B-11) — hidrata o form a partir do
  // DRAFT recebido via `state` do router (`duplicateDraft`, populado pela
  // listagem, `ExpenseActionsMenu`/`index.tsx`, chave combinada com a
  // Tarefa irmã de Contas a Receber). Reaproveita a MESMA lógica de
  // mapeamento campo-a-campo de `fillExpenseForm` (Leitura do dev desta
  // Tarefa) — 3 diferenças: (1) fonte é o draft, não `ExpenseDetail` vindo
  // de `getExpense`; (2) `payment_type`/`dt_emission`/`due_date` sempre
  // `null` (o draft já os traz `null`, reforçado aqui); (3) `categories`
  // sempre reseta para o default de criação (1 linha, 100%, mirror
  // `defaultValues.categories` acima), nunca herdando o rateio original. O
  // draft só devolve `*_uuid` PLANOS (sem label) — os selects reidratados
  // resolvem o rótulo pelos MESMOS serviços já usados na edição/import de
  // XML (`getProviderByUuid`, etc.), com fallback honesto ao uuid truncado
  // em caso de falha de rede (mirror `handleXmlImported`), NUNCA inventado.
  const duplicateDraftAppliedRef = useRef(false);

  useEffect(() => {
    if (isEditing || duplicateDraftAppliedRef.current) return;
    const draft = (location.state as { duplicateDraft?: ExpenseDuplicateDraft } | null)
      ?.duplicateDraft;
    if (!draft) return;

    duplicateDraftAppliedRef.current = true;
    // Limpa o `state` de navegação IMEDIATAMENTE — nunca reaplica o draft
    // num refresh/voltar da página de criação (DoD da Tarefa).
    navigate(location.pathname, { replace: true, state: null });
    void applyDuplicateDraft(draft);
  }, [isEditing, location.state, location.pathname, navigate]);

  async function applyDuplicateDraft(draft: ExpenseDuplicateDraft) {
    let providerOption: Option<string> | null = null;
    let branchOption: Option<string> | null = null;

    if (draft.provider_uuid) {
      try {
        const providerResponse = await getProviderByUuid(draft.provider_uuid);
        providerOption = { label: providerResponse.data.name, value: draft.provider_uuid };
      } catch {
        // Fallback honesto (SEM MOCK) — mirror `handleXmlImported`.
        providerOption = { label: draft.provider_uuid.slice(0, 8), value: draft.provider_uuid };
      }

      if (draft.branch_uuid) {
        try {
          const branchesResponse = await listBranchesByProvider(draft.provider_uuid);
          const match = branchesResponse.data.find((branch) => branch.uuid === draft.branch_uuid);
          branchOption = match
            ? { label: match.name, value: match.uuid }
            : { label: draft.branch_uuid.slice(0, 8), value: draft.branch_uuid };
        } catch {
          branchOption = { label: draft.branch_uuid.slice(0, 8), value: draft.branch_uuid };
        }
      }
    }

    let typeTitleOption: Option<string> | null = null;
    try {
      const typeTitleResponse = await getTypeTitleByUuid(draft.type_title_uuid);
      typeTitleOption = {
        label: typeTitleResponse.data.description,
        value: typeTitleResponse.data.uuid,
      };
    } catch {
      typeTitleOption = {
        label: draft.type_title_uuid.slice(0, 8),
        value: draft.type_title_uuid,
      };
    }

    let proprietaryOption: Option<string> | null = null;
    if (draft.proprietary_uuid) {
      try {
        const proprietaryResponse = await getProprietaryByUuid(draft.proprietary_uuid);
        proprietaryOption = {
          label: proprietaryResponse.data.name,
          value: proprietaryResponse.data.uuid,
        };
      } catch {
        proprietaryOption = {
          label: draft.proprietary_uuid.slice(0, 8),
          value: draft.proprietary_uuid,
        };
      }
    }

    let harvestOption: Option<string> | null = null;
    if (draft.harvest_uuid) {
      try {
        const harvestResponse = await getHarvest(draft.harvest_uuid);
        harvestOption = {
          label: harvestResponse.data.description,
          value: harvestResponse.data.uuid,
        };
      } catch {
        harvestOption = { label: draft.harvest_uuid.slice(0, 8), value: draft.harvest_uuid };
      }
    }

    reset({
      number: draft.number,
      type_title_uuid: typeTitleOption,
      provider_uuid: providerOption,
      branch_uuid: branchOption,
      proprietary_uuid: proprietaryOption,
      harvest_uuid: harvestOption,
      // CL-D03 (doc-bruta) — sempre `null` (o draft já os traz assim;
      // reforçado aqui como fonte única de verdade do form).
      dt_emission: null,
      due_date: null,
      amount: draft.amount,
      note: draft.note ?? '',
      fiscal_document: {
        label: draft.fiscal_document ? languageGB.defaltStrings.yes : languageGB.defaltStrings.no,
        value: draft.fiscal_document,
      },
      payment_type: null,
      recurrence_type: null,
      classification: {
        label: expenseClassificationOptions.getLabel(draft.classification, languageGB),
        value: draft.classification,
      },
      type_note:
        draft.type_note != null
          ? {
              label: invoiceDocumentTypeOptions.getLabel(
                draft.type_note as InvoiceDocumentTypeValue,
                languageGB
              ),
              value: draft.type_note,
            }
          : null,
      // TASK-FE-036-123 (B-09 Opção C parcial) — Modalidade/Tipo NUNCA
      // clonados (mesma regra já aplicada a `categories`/parcelamento/baixa
      // automática nesta função, "relations_not_cloned_into_form"): o
      // rateio duplicado sempre reseta para 1 linha em branco (abaixo), sem
      // `area_uuid` — herdar `appropriation_type=AREA(3)` do título original
      // sem herdar a Área de cada linha deixaria o form inconsistente
      // (Tipo=Área exigindo um campo que a própria função zera). Sempre
      // Indireta/`null`, mirror do default de criação.
      appropriation: {
        label: expenseAppropriationOptions.getLabel(expenseAppropriationIndex.INDIRETA, languageGB),
        value: expenseAppropriationIndex.INDIRETA,
      },
      appropriation_type: null,
      // TASK-FE-036-124 (B-09 Opção C parcial, `GAP-036-115`, 2/2) — bloco
      // "Agricultura" NUNCA clonado (mesma regra `relations_not_cloned_
      // into_form` já aplicada acima a `appropriation`/`categories`).
      aprop_agri_area_uuid: null,
      aprop_agri_activity_uuid: null,
      aprop_agri_operation_uuid: null,
      aprop_agri_cultivation_uuid: null,
      // UT-000795 — Pecuária/Manutenção NUNCA clonadas (legado: duplicar não
      // carrega apontamento).
      ...EMPTY_APPROPRIATION_FIELDS,
      is_taxation: {
        label: draft.is_taxation ? languageGB.defaltStrings.yes : languageGB.defaltStrings.no,
        value: draft.is_taxation,
      },
      discount: draft.discount ?? 0,
      penalty: draft.penalty ?? 0,
      interest: draft.interest ?? 0,
      perc_interest: draft.perc_interest ?? 0,
      increase: draft.increase ?? 0,
      // Parcelamento nunca é clonado (relations_not_cloned_into_form).
      qtd_installments: null,
      installments: [],
      // DEC-115 (TASK-FE-036-125, §6) — o `reset()` completo abaixo zera
      // TODOS os campos não listados aqui (RHF sem `keepValues`), inclusive
      // um `farm_uuid` que o efeito de default já tivesse hidratado antes do
      // clique em "Duplicar" — recalcula explicitamente aqui (mesma
      // fórmula do efeito) em vez de confiar num re-disparo do efeito
      // (nenhuma dependência dele muda com este `reset()`).
      farm_uuid:
        showFarmDestinationField && activeFarmUuid
          ? (() => {
              const activeFarm = myFarmsQuery.data?.find((farm) => farm.uuid === activeFarmUuid);
              return activeFarm ? { label: activeFarm.description, value: activeFarm.uuid } : null;
            })()
          : null,
      // Rateio SEMPRE volta ao default de criação — nunca herda o rateio do
      // título original (mirror `defaultValues.categories`/`_forms.blade.
      // php:268`).
      categories: [
        {
          category_uuid: null,
          center_uuid: null,
          value: null,
          plan_account_uuid: null,
          percent: 100,
          area_uuid: null,
          harvest_uuid: null,
        },
      ],
      // Baixa automática nunca é clonada (relations_not_cloned_into_form).
      automatic_writeoff: false,
      account_uuid: null,
      movement_date: null,
      // O draft de duplicar não tem XML de origem — nunca copiado do título
      // original (divergência deliberada do `ExpenseDuplicateDraftData`).
      xml_key: null,
    });

    toaster.success({
      title: formText.actions.duplicate,
      description: formText.hints.duplicateApplied,
    });
  }

  // ---- Lançar NFS-e Recebida (UT-000754, T-754-FE-03) — hidrata o form a
  // partir de `state.nfseDraft` (`POST /nfses/{uuid}/expense-draft`, populado
  // por `pages/BaseRegistrations/NfseRecebidas`). Mesmo mecanismo do
  // `duplicateDraft` acima: ref impede reaplicar, `state` é limpo no mount.
  // O shape é superconjunto de `ExpenseXmlDraft`, então number/datas/valor/
  // nota/chave/fornecedor/tipo reaproveitam `handleXmlImported`; o restante
  // (vencimento, tomador, forma, apropriação, fiscal, tributação, fazenda)
  // é aplicado aqui. NÃO usa `isEmpty` (ERRO-FE-001).
  const nfseDraftAppliedRef = useRef(false);
  const [nfseDraftKey, setNfseDraftKey] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing || nfseDraftAppliedRef.current) return;
    const draft = (location.state as NfseDraftNavigationState | null)?.nfseDraft;
    if (!draft) return;

    nfseDraftAppliedRef.current = true;
    navigate(location.pathname, { replace: true, state: null });
    void applyNfseDraft(draft);
  }, [isEditing, location.state, location.pathname, navigate]);

  async function applyNfseDraft(draft: NfseExpenseDraft) {
    setNfseDraftKey(draft.xml_key);
    const extra = mapNfseDraftExtraFields(draft, languageGB);

    setValue('due_date', extra.due_date, { shouldDirty: true });
    setValue('payment_type', extra.payment_type, { shouldDirty: true, shouldValidate: true });
    setValue('appropriation', extra.appropriation, { shouldDirty: true });
    setValue('fiscal_document', extra.fiscal_document, { shouldDirty: true });
    setValue('is_taxation', extra.is_taxation, { shouldDirty: true });

    if (showFarmDestinationField && draft.farm_uuid) {
      const farm = myFarmsQuery.data?.find((item) => item.uuid === draft.farm_uuid);
      if (farm) setValue('farm_uuid', { label: farm.description, value: farm.uuid });
    }

    if (draft.proprietary_uuid) {
      let proprietaryLabel = draft.proprietary_uuid.slice(0, 8);
      try {
        const proprietaryResponse = await getProprietaryByUuid(draft.proprietary_uuid);
        proprietaryLabel = proprietaryResponse.data.name;
      } catch {
        // Fallback honesto (SEM MOCK): uuid truncado, usuário confirma.
      }
      setValue(
        'proprietary_uuid',
        { label: proprietaryLabel, value: draft.proprietary_uuid },
        { shouldDirty: true, shouldValidate: true }
      );
    }

    await handleXmlImported(toExpenseXmlDraft(draft));

    toaster.info({
      title: text.singularLabel,
      description: formText.hints.nfseDraftApplied,
    });
  }

  // ---- Gera Obrigação (UT-000796 r2) — pré-preenche a Nova Conta a Pagar a
  // partir do rascunho do movimento Financiamento (Entrada gera Conta a PAGAR,
  // nomenclatura invertida do legado). Fonte: `state.movementObligationDraft`
  // (1º paint) OU sessionStorage pelo ponteiro `?fromMovement=<uuid>`
  // (sobrevive ao refresh). Diferenças deliberadas vs. `nfseDraft` acima: NÃO
  // limpa o ponteiro/storage ao aplicar (é o que permite o refresh; só
  // consumido no sucesso do POST ou no Cancelar) e só aplica em CRIAÇÃO — os
  // 3 fluxos (duplicar/NFS-e/movimento) são excludentes. Só APLICA valores
  // (`setValue`): nenhuma limpeza em efeito, nenhum `reset`, nenhum `isEmpty`
  // (ERRO-FE-001). `movement_uuid` não é campo visível do RHF (equivale ao
  // `hidden movement_id` do legado): vai ao POST como chave condicional.
  const [searchParams] = useSearchParams();
  const movementDraftAppliedRef = useRef(false);
  const [movementUuid, setMovementUuid] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing || movementDraftAppliedRef.current) return;
    const navState = location.state as
      | (NfseDraftNavigationState & ObligationDraftNavigationState & { duplicateDraft?: unknown })
      | null;
    if (navState?.nfseDraft || navState?.duplicateDraft) return;

    const pointer = searchParams.get(OBLIGATION_DRAFT_QUERY_PARAM);
    const fromState = navState?.movementObligationDraft;
    if (!fromState && !pointer) return;

    movementDraftAppliedRef.current = true;
    const draft = isUsableObligationDraft(fromState, 'expense', pointer)
      ? fromState
      : readObligationDraft(pointer, 'expense');

    if (!draft) {
      toaster.info({
        title: text.singularLabel,
        description: formText.hints.obligationDraftExpired,
      });
      navigate(location.pathname, { replace: true, state: null });
      return;
    }
    // O `state` é só atalho do 1º paint: limpa, preservando a query (o
    // ponteiro que permite o refresh).
    if (fromState) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
    void applyMovementObligationDraft(draft);
  }, [isEditing, location.state, location.pathname, location.search, navigate]);

  async function applyMovementObligationDraft(
    draft: NonNullable<ObligationDraftNavigationState['movementObligationDraft']>
  ) {
    const fields = mapObligationDraftToExpenseFields(draft);
    setMovementUuid(fields.movement_uuid);

    setValue('note', fields.note, { shouldDirty: true });
    setValue('amount', fields.amount, { shouldDirty: true, shouldValidate: true });
    setValue('interest', fields.interest, { shouldDirty: true });
    setValue('dt_emission', fields.dt_emission, { shouldDirty: true, shouldValidate: true });
    // Apropriação Indireta (legado L6) — EDITÁVEL.
    const appropriation = fields.appropriation as ExpenseAppropriationValue;
    setValue(
      'appropriation',
      {
        label: expenseAppropriationOptions.getLabel(appropriation, languageGB),
        value: appropriation,
      },
      { shouldDirty: true }
    );

    if (fields.provider_uuid) {
      let providerLabel = fields.provider_uuid.slice(0, 8);
      try {
        const providerResponse = await getProviderByUuid(fields.provider_uuid);
        providerLabel = providerResponse.data.name;
      } catch {
        // Fallback honesto (SEM MOCK): uuid truncado, usuário confirma.
      }
      setValue(
        'provider_uuid',
        { label: providerLabel, value: fields.provider_uuid },
        { shouldDirty: true, shouldValidate: true }
      );
    }

    if (fields.proprietary_uuid) {
      let proprietaryLabel = fields.proprietary_uuid.slice(0, 8);
      try {
        const proprietaryResponse = await getProprietaryByUuid(fields.proprietary_uuid);
        proprietaryLabel = proprietaryResponse.data.name;
      } catch {
        // Fallback honesto (SEM MOCK).
      }
      setValue(
        'proprietary_uuid',
        { label: proprietaryLabel, value: fields.proprietary_uuid },
        { shouldDirty: true, shouldValidate: true }
      );
    }

    toaster.info({
      title: text.singularLabel,
      description: formText.hints.obligationDraftApplied,
    });
  }

  // Cancelar: o movimento permanece salvo SEM título (legado). Apaga o
  // rascunho e avisa como recuperar (editar o movimento e salvar de novo).
  function handleCancel() {
    if (movementUuid) {
      clearObligationDraft(movementUuid);
      toaster.info({
        title: text.singularLabel,
        description: formText.hints.obligationDraftDiscarded,
      });
    }
    navigate(-1);
  }

  const expenseMutation = useRequest({
    asyncFunction: tryPersistExpense,
    entityName: text.singularLabel,
    queryKey: queryKey.expenses.list,
    queryKey2: queryKey.expenses.detail,
    // UT-000754 — a linha da NFS-e Recebida passa a "Lançada" após salvar.
    queryKey3: queryKey.baseRegistrations.nfses,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      // Rascunho de uma única abertura (legado): consumido no sucesso do POST.
      clearObligationDraft(movementUuid);
      navigate(-1);
    },
  });

  async function tryPersistExpense(data: ExpenseFormType) {
    // Triggers (esteira 036fix, audit "Tipo Lançamento=Parcelada → abre
    // gerador"/"demais tipos Baixa=Não readonly") — parcelamento SÓ existe
    // quando `payment_type=PARCELADA(2)` (aba "Parcelamento" só é montada
    // nesse caso, ver JSX); qualquer outro tipo cria uma Expense única
    // (`qtd_installments` omitido, backend assume 1).
    const isParcelada = data.payment_type?.value === expensePaymentTypeIndex.PARCELADA;
    // EXP-R08 (P1) — "Parcelada" com 1 ÚNICA linha gerada NÃO pode virar
    // título único silenciosamente: `qtd_installments` reflete SEMPRE a
    // quantidade real de linhas (`data.installments.length`, mesmo com só
    // 1), nunca `1` por omissão/nulificação do hidden state do form root.
    const qtdInstallments = isParcelada
      ? data.installments.length || Number(data.qtd_installments) || 1
      : 1;

    // TASK-FE-036-123 (B-09 Opção C parcial, `GAP-036-115`) — `area_uuid`
    // reflete o que o usuário preencheu por linha (o `useEffect` de limpeza
    // abaixo já zera todas as linhas ao voltar para Indireta, então nunca
    // sobra um valor órfão aqui); `harvest_uuid` reenviado inalterado
    // (correção de round-trip, item 3 do Roteiro — nunca descartado).
    const categories: ExpenseApportionmentPayload[] = data.categories.map((row) => ({
      category_uuid: row.category_uuid!.value,
      center_uuid: row.center_uuid!.value,
      value: Number(row.value),
      plan_account_uuid: row.plan_account_uuid?.value ?? null,
      area_uuid: row.area_uuid?.value ?? null,
      // Criação: Safra só no Cabeçalho (linha sempre null); edição: por linha.
      harvest_uuid: resolveRowHarvestUuid(isEditing, row.harvest_uuid),
    }));

    const payload: ExpensePayload = {
      // Só no POST (o PUT ignora); a CHAVE é omitida — nunca `null`/`''`.
      ...(!isEditing && movementUuid ? { movement_uuid: movementUuid } : {}),
      number: data.number.trim(),
      type_title_uuid: data.type_title_uuid!.value,
      provider_uuid: data.provider_uuid?.value ?? null,
      branch_uuid: data.branch_uuid?.value ?? null,
      proprietary_uuid: data.proprietary_uuid?.value ?? null,
      // UT-000765 (FE-765-D, D-101-06) — Safra por modo, igual ao legado:
      // CRIAR envia a Safra do Cabeçalho (a API propaga para as linhas sem
      // Safra); EDITAR envia `null` (a Safra e por linha do Rateio e a API
      // ignora/deriva o cabeçalho das linhas).
      harvest_uuid: resolveHeaderHarvestUuid(isEditing, data.harvest_uuid),
      dt_emission: data.dt_emission!,
      due_date: data.due_date!,
      amount: Number(data.amount),
      note: data.note.trim(),
      fiscal_document: !!data.fiscal_document?.value,
      payment_type: data.payment_type!.value,
      recurrence_type: data.recurrence_type?.value ?? null,
      classification: data.classification?.value ?? 'N',
      type_note: data.type_note?.value ?? null,
      is_taxation: !!data.is_taxation?.value,
      discount: Number(data.discount ?? 0),
      penalty: Number(data.penalty ?? 0),
      interest: Number(data.interest ?? 0),
      perc_interest: Number(data.perc_interest ?? 0),
      increase: Number(data.increase ?? 0),
      categories,
      // DEC-115 (TASK-FE-036-125, §6) — enviado SÓ quando o Select "Fazenda
      // de destino" está visível (gate ligado); a CHAVE é omitida
      // (`undefined`), NUNCA `null`/`''`, quando o gate está desligado —
      // mirror da disciplina já documentada para uuids opcionais
      // (`IncomePayload`, ver comentário de `xml_key` abaixo).
      ...(showFarmDestinationField && data.farm_uuid?.value
        ? { farm_uuid: data.farm_uuid.value }
        : {}),
      // TASK-FE-036-123 (B-09 Opção C parcial, `GAP-036-115`) — Indireta
      // (default, nenhum campo tocado) mantém o payload IDÊNTICO ao
      // comportamento anterior (`appropriation:2, appropriation_type:null`,
      // REGRESSÃO ZERO). Direta envia o Tipo escolhido; nunca envia Tipo
      // fora de Direta (mirror `Rule::requiredIf`, `ExpenseRequest::rules()`).
      // UT-000795 — bloco de apropriação inteiro (modalidade/tipo + 4 chaves
      // Agricultura OU 6 Pecuária OU Manutenção com só o medidor aplicável),
      // função pura testada. Indireta/Área mantêm o payload anterior.
      ...buildAppropriationPayload(data),
      // Parcelamento/baixa automática/anexos: SÓ em criação.
      ...(isEditing
        ? {}
        : {
            qtd_installments: isParcelada ? qtdInstallments : undefined,
            // EXP-R08 (P1) — SEMPRE enviado junto quando Parcelada, mesmo
            // com 1 linha só (o gate anterior `qtdInstallments > 1` omitia
            // o array inteiro nesse caso, materializando o Tipo de
            // Lançamento como um título único comum e descartando o
            // due_date/value que o usuário preencheu na linha gerada).
            installments: isParcelada
              ? data.installments.map((installment) => ({
                  due_date: installment.due_date!,
                  value: Number(installment.value),
                }))
              : undefined,
            // Baixa automática nunca se aplica a Parcelada (aba de
            // parcelamento cobre esse fluxo) — para os demais tipos, o
            // valor já reflete a regra por Tipo de Lançamento aplicada nos
            // `useEffect` (Única=editável, Adiantamento=forçado Sim,
            // Recorrente/Fatura=forçado Não), mirror `handlePaymentType()`
            // do legado (`_forms.blade.php:816-822`).
            automatic_writeoff: !isParcelada ? !!data.automatic_writeoff : false,
            account_uuid: !isParcelada ? (data.account_uuid?.value ?? null) : null,
            movement_date: !isParcelada ? data.movement_date || null : null,
            // B-05 (TASK-FE-036-121/340) — envio DEFENSIVO, só em criação:
            // populado SÓ quando o título foi criado a partir de um XML
            // importado (`handleXmlImported`); o backend JÁ persiste este
            // campo no `store()` (`ExpenseRequest`/`StoreExpenseAction`,
            // `fd57e50db`).
            xml_key: data.xml_key ?? null,
          }),
    };

    try {
      if (isEditing && expenseId) {
        return await updateExpense(expenseId, payload);
      }
      return await createExpense(payload);
    } catch (error) {
      // UT-000765 (FE-765-D) — 422 flat `categories.N.harvest_uuid` (Safra de
      // outro tenant/invalida) mapeado na linha do Rateio; o erro segue
      // propagado para o toast padrao do `useRequest`.
      const harvestErrors = extractCategoryHarvestErrors(error);
      harvestErrors.forEach(({ key, message }) => setError(key, { type: 'server', message }));
      if (harvestErrors.length > 0) setTabValue('1');
      // UT-000795 — 422 flat dos campos de Apropriação (aprop_pec_*/aprop_man_*,
      // provider_uuid, appropriation_type) mapeado por campo na aba do Cabeçalho.
      const appropriationErrors = extractAppropriationErrors(error);
      appropriationErrors.forEach(({ key, message }) => setError(key, { type: 'server', message }));
      if (appropriationErrors.length > 0) setTabValue('0');
      throw error;
    }
  }

  const isSubmitting = expenseMutation.isPending;

  // P0 (homologação 036fix3, item 5/BLOQUEADOR "Edição não persiste o
  // Vencimento") — a guarda continuava INVERTIDA apesar do comentário
  // anterior alegar correção: faltava o `!`. `utils/isEmpty()` é MAL
  // NOMEADA — retorna `true` quando HÁ chaves (landmine ERRO-FE-001, mesma
  // armadilha já documentada em `CreateOrUpdateEmbalagem.tsx`/
  // `CreateOrUpdateSolicitacao.tsx`/`CreateOrUpdateInvoice.tsx`, o mirror
  // direto desta tela). Sem o `!`, QUALQUER campo sujo (não só
  // `due_date`) fazia `navigate(-1)` e DESCARTAVA a alteração ANTES de
  // chamar a mutation — nunca chegava a montar o payload/PUT. Fórmula
  // VERIFICADA (`!isEmpty(dirtyFields)`): só volta sem PUT quando editando
  // e NADA mudou (nada a salvar); qualquer outro caso (criação, ou edição
  // com campos sujos) persiste de verdade.
  async function onSubmit(data: ExpenseFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await expenseMutation.mutateAsync(data);
    }
  }

  const [tabValue, setTabValue] = useState<ExpenseTabKey>('0');

  // Item 2 (homologação 036fix3, B15/B16) — disclosure do modal de
  // criar/editar Fornecedor + chave de invalidação do cache do
  // `SelectAsyncPaginate` (mirror EXATO `CreateOrUpdateMovimento.tsx`).
  const providerModalDisclosure = useDisclosure();
  const [providerOptionsCacheKey, setProviderOptionsCacheKey] = useState(0);

  // B-05 (TASK-FE-036-121, Onda 3 sub-onda 3f) — SÓ na criação, mirror
  // `xmlUploadModal`/`CreateOrUpdateIncome.tsx`/`CreateOrUpdateInvoice.tsx`
  // (o legado não oferece reprocessamento de XML em edição).
  const xmlUploadModal = useDisclosure();

  // Hidrata o form a partir do DRAFT (`ExpenseXmlDraft`, TASK-FE-036-340) via
  // `setValue` — só os campos que o draft de fato preenche são tocados, o
  // resto do form (Filial/Safra/Rateio/Parcelamento/Baixa Automática)
  // permanece como o usuário já tiver preenchido (mirror
  // `CreateOrUpdateIncome.tsx::handleXmlImported`).
  //
  // ⚠️ Achado crítico (Leitura do dev, item 1) — `ExpenseXmlDraft` é MAIS
  // SIMPLES que `IncomeXmlDraft`: só existe `provider_matched` (find-or-create
  // REAL, mirror `client_matched` — `provider_uuid` SEMPRE válido mesmo
  // quando `false`). NÃO existe a assimetria `proprietary_matched` de
  // Income aqui — `provider_uuid` é SEMPRE hidratado, nunca `null` por causa
  // de `matched===false`.
  async function handleXmlImported(draft: ExpenseXmlDraft) {
    setValue('number', draft.number, { shouldDirty: true });
    // DF-13 (mesmo racional de `CreateOrUpdateInvoice.tsx:352-361`) —
    // truncamento defensivo para `yyyy-MM-dd`: no-op se o draft já vier só
    // com a data (10 chars), necessário se vier com timestamp completo.
    setValue('dt_emission', draft.dt_emission ? draft.dt_emission.slice(0, 10) : null, {
      shouldDirty: true,
    });
    setValue('amount', draft.amount, { shouldDirty: true });
    setValue('note', draft.note ?? '', { shouldDirty: true });

    // B-05 (Achado 3, Tarefa 121) — envio DEFENSIVO/forward-compatible: o
    // backend JÁ persiste este campo no `store()` (`fd57e50db`).
    setValue('xml_key', draft.xml_key, { shouldDirty: true });

    // `provider_uuid` — SEMPRE hidratado (Achado 1 acima), com o LABEL real
    // resolvido via `getProviderByUuid` (mesmo serviço já usado em
    // `FilterSideExpense.tsx::resolveProviderOption`, reaproveitado — não
    // duplicado). Falha de rede/404 aqui NUNCA bloqueia a hidratação: cai
    // para o uuid truncado como rótulo honesto (mesma convenção já usada
    // por `CreateOrUpdateIncome.tsx` quando o draft não tem nome pronto).
    let providerLabel = draft.provider_uuid.slice(0, 8);
    try {
      const providerResponse = await getProviderByUuid(draft.provider_uuid);
      providerLabel = providerResponse.data.name;
    } catch {
      // Mantém o fallback truncado — SEM MOCK, usuário confirma manualmente.
    }
    setValue(
      'provider_uuid',
      { value: draft.provider_uuid, label: providerLabel },
      { shouldDirty: true, shouldValidate: true }
    );
    if (!draft.provider_matched) {
      toaster.info({
        title: formText.xmlImport.buttonLabel,
        description: formText.xmlImport.providerAutoCreatedNotice,
        duration: 8000,
      });
    }

    // `type_note` (Tipo de Nota) — `draft.type_note_id` é SEMPRE `3` (fixo,
    // `ParseExpenseNfseXmlAction.php:80`), que É o próprio valor NFSE do
    // MESMO enum físico já reusado pelo Select deste campo
    // (`invoiceDocumentTypeOptions`/`invoiceDocumentTypeIndex.NFSE===3`,
    // comentário de `ExpenseForm.type_note`) — sem ambiguidade, mapeamento
    // DIRETO (não é um id legado sem correspondência, como `type_id` abaixo).
    const typeNoteValue = draft.type_note_id as InvoiceDocumentTypeValue;
    setValue(
      'type_note',
      {
        label: invoiceDocumentTypeOptions.getLabel(typeNoteValue, languageGB),
        value: typeNoteValue,
      },
      { shouldDirty: true }
    );

    // `type_title_uuid` (Tipo de Título) — Item 2 da Leitura do dev:
    // `draft.type_id` é SEMPRE `18` (fixo, inteiro do LEGADO), sem
    // correspondência determinística com o catálogo `type_titles` (tenant-
    // scoped por uuid no fork). Resolvido por BUSCA DE LABEL no catálogo
    // real (`TYPE_TITLE_NFSE_LABEL`/`findTypeTitleNfseOption`, confirmado
    // por leitura direta do dump do legado — `type_titles.id=18` = "Nota
    // Fiscal Serviço - NFSe" — MESMO CONTORNO de
    // `CreateOrUpdateInvoice.tsx::findTypeTitleNfeOption`). Sem match exato
    // no tenant atual, o campo fica MANUAL (usuário escolhe) — não-
    // bloqueador, mesma decisão já registrada na fatia irmã de CaR.
    try {
      const typeTitleResponse = await listTypeTitleOptions({
        search: TYPE_TITLE_NFSE_LABEL,
        per_page: 20,
      });
      const typeTitleNfseOption = findTypeTitleNfseOption(typeTitleResponse.data.items ?? []);
      if (typeTitleNfseOption) {
        setValue('type_title_uuid', typeTitleNfseOption, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    } catch {
      // Sem match — campo permanece manual, usuário escolhe (SEM MOCK).
    }
  }

  // ---- Baixar XML (B-05, TASK-FE-036-121/340) — gated por
  // `loadedExpense.xml_key` presente (nunca por outro proxy), visível na
  // edição/visualização (`isViewOnlyRoute` reusa este MESMO componente).
  const [isDownloadingXml, setIsDownloadingXml] = useState(false);

  async function handleDownloadXml() {
    if (!loadedExpense?.xml_key) return;
    setIsDownloadingXml(true);
    try {
      const blob = await downloadXml('expenses', loadedExpense.uuid);
      downloadBlob(blob, `${loadedExpense.xml_key}.xml`);
    } catch {
      toaster.error({
        title: formText.actions.downloadXml,
        description: formText.xml.downloadError,
      });
    } finally {
      setIsDownloadingXml(false);
    }
  }

  function onInvalid(formErrors: FieldErrors<ExpenseFormType>) {
    const erroredFieldNames = Object.keys(formErrors) as (keyof ExpenseFormType)[];
    if (erroredFieldNames.length === 0) return;

    const erroredTab = erroredFieldNames
      .map((field) => FIELD_TAB_MAP[field])
      .find((tab): tab is ExpenseTabKey => !!tab && tab !== tabValue);

    if (erroredTab) {
      setTabValue(erroredTab);
    }

    const firstErrorMessage = Object.values(formErrors).find(
      (fieldError): fieldError is { message?: string } =>
        !!fieldError && typeof fieldError === 'object' && 'message' in fieldError
    )?.message;

    toaster.error({
      title: isEditing ? formText.title.edit : formText.title.create,
      description: firstErrorMessage ?? formText.errors.invalidFields,
      duration: 6000,
    });
  }

  const isTaxationValue = watch('is_taxation')?.value;
  const paymentTypeValue = watch('payment_type')?.value;
  const providerUuid = watch('provider_uuid')?.value;
  const automaticWriteoffValue = watch('automatic_writeoff');
  const accountUuidValue = watch('account_uuid')?.value;
  const movementDateValue = watch('movement_date');
  const appropriationValue = watch('appropriation')?.value;
  const appropriationTypeValue = watch('appropriation_type')?.value;

  // TASK-FE-036-123 (B-09 Opção C parcial, `GAP-036-115`) — Select "Tipo"
  // habilitado só quando Direta.
  const isAppropriationDirect = appropriationValue === expenseAppropriationIndex.DIRETA;

  // TASK-FE-036-124 (B-09 Opção C parcial, `GAP-036-115`, 2/2) — condição do
  // bloco "Agricultura" + gate de `provider_uuid` (Decisão 2 do Gap).
  const isAppropriationAgriculture =
    isAppropriationDirect && appropriationTypeValue === expenseAppropriationTypeIndex.AGRICULTURA;
  // UT-000795 (D-102-12) — blocos Pecuária/Manutenção + Fornecedor obrigatório
  // nos tipos 1, 2 e 4 (Direta), independente de `is_taxation`.
  const isAppropriationLivestock =
    isAppropriationDirect && appropriationTypeValue === expenseAppropriationTypeIndex.PECUARIA;
  const isAppropriationMaintenance =
    isAppropriationDirect && appropriationTypeValue === expenseAppropriationTypeIndex.MANUTENCAO;
  const isProviderRequiredByAppropriation = isProviderRequiredForAppropriation(
    appropriationValue,
    appropriationTypeValue
  );

  // UT-000795 — limpa os campos dos blocos Pecuária/Manutenção SOMENTE quando o
  // USUÁRIO troca Modalidade/Tipo (handler de `onChange`). NUNCA em `useEffect`:
  // o efeito rodaria na hidratação e apagaria o dado gravado.
  function clearLivestockAndMaintenanceFields() {
    (
      Object.keys(EMPTY_APPROPRIATION_FIELDS) as (keyof typeof EMPTY_APPROPRIATION_FIELDS)[]
    ).forEach((name) => {
      setValue(name, null, { shouldDirty: true });
      clearErrors(name);
    });
  }

  // Trocar de Direta para Indireta limpa `appropriation_type` E qualquer
  // `area_uuid` já preenchido nas linhas do rateio (evita reenviar um valor
  // órfão — mirror do `useEffect` já existente que limpa `recurrence_type`
  // fora de Recorrente, item "CL-P02" abaixo).
  useEffect(() => {
    if (isAppropriationDirect) return;
    setValue('appropriation_type', null);
    const rows = watch('categories') ?? [];
    rows.forEach((_, index) => {
      setValue(`categories.${index}.area_uuid`, null);
    });
  }, [isAppropriationDirect, setValue]);

  // TASK-FE-036-124 (B-09 Opção C parcial, `GAP-036-115`, 2/2) — trocar para
  // outro Tipo (ou voltar para Indireta) limpa os 4 campos do bloco
  // "Agricultura" — o bloco some (JSX condicional) e o payload nunca mais os
  // envia (`tryPersistExpense` já gateado pela mesma condição), mas o VALOR
  // do form também não pode sobreviver órfão (mirror do `useEffect` acima,
  // que já limpa `appropriation_type`/`area_uuid` do rateio na mesma troca).
  useEffect(() => {
    if (isAppropriationAgriculture) return;
    setValue('aprop_agri_area_uuid', null);
    setValue('aprop_agri_activity_uuid', null);
    setValue('aprop_agri_operation_uuid', null);
    setValue('aprop_agri_cultivation_uuid', null);
  }, [isAppropriationAgriculture, setValue]);

  // ---- Triggers dirigidos por "Tipo de Lançamento" (esteira 036fix, audit
  // "parcelamento dirigido pelo Tipo de Lançamento"/"demais tipos Baixa=Não
  // readonly") — mirror `handlePaymentType()` do legado
  // (`_forms.blade.php:794-822`):
  //   - PARCELADA(2): abre a aba "Parcelamento" (só ela dirige qtd/valor de
  //     parcelas); Baixa Automática não se aplica.
  //   - PARCELA_UNICA(1): libera Baixa Automática (editável).
  //   - ADIANTAMENTO(4): força Baixa Automática=Sim.
  //   - RECORRENTE(3)/FATURA(5): força Baixa Automática=Não, readonly.
  const isParceladaSelected = paymentTypeValue === expensePaymentTypeIndex.PARCELADA;
  const isAutomaticWriteoffEditable = paymentTypeValue === expensePaymentTypeIndex.PARCELA_UNICA;
  const isAutomaticWriteoffLocked = !isAutomaticWriteoffEditable;

  const showInstallmentsTab = !isEditing && isParceladaSelected;

  // Tab "Parcelamento" só existe para PARCELADA — se o usuário trocar o
  // Tipo de Lançamento enquanto ela está aberta, volta para "Cabeçalho".
  useEffect(() => {
    if (tabValue === '2' && !showInstallmentsTab) {
      setTabValue('0');
    }
  }, [showInstallmentsTab, tabValue]);

  // Limpa parcelamento ao sair de PARCELADA (evita enviar `qtd_installments`
  // obsoleto se o usuário gerou parcelas e depois trocou o tipo).
  useEffect(() => {
    if (isEditing || isParceladaSelected) return;
    setValue('qtd_installments', null);
    setValue('installments', []);
  }, [isParceladaSelected, isEditing, setValue]);

  // CL-P02 (doc-bruta "duplicar-recorrente", achado desta Tarefa,
  // TASK-FE-036-122) — o legado tenta limpar `recurrence_type` ao trocar
  // para um Tipo de Lançamento não-recorrente, mas usa um seletor com o id
  // errado (defeito real do JS legado) — o MESMO risco existia aqui: o
  // campo só ficava invisível (condicional de render, ver Select abaixo),
  // mas o valor antigo permanecia no `useForm` e ERA reenviado no payload
  // (`tryPersistExpense`, `recurrence_type: data.recurrence_type?.value ??
  // null`, sem checar `payment_type` atual). CORRIGIR, não replicar o bug
  // (mesma lógica de DEC-013 — fidelidade não obriga herdar defeito). Corre
  // TANTO em criação quanto em edição manual do campo (o risco já existia
  // sem duplicar — "Duplicar" só o torna CONCRETO, ver Leitura do dev) —
  // por isso SEM o guard `isEditing` dos 2 efeitos de parcelamento acima.
  useEffect(() => {
    if (paymentTypeValue !== expensePaymentTypeIndex.RECORRENTE) {
      setValue('recurrence_type', null);
    }
  }, [paymentTypeValue, setValue]);

  // Força o valor de Baixa Automática conforme o Tipo de Lançamento —
  // Adiantamento sempre Sim, Recorrente/Fatura/Parcelada sempre Não (Única
  // fica livre para o usuário escolher).
  useEffect(() => {
    if (isEditing) return;
    if (paymentTypeValue === expensePaymentTypeIndex.ADIANTAMENTO) {
      setValue('automatic_writeoff', true, { shouldDirty: true });
    } else if (!isAutomaticWriteoffEditable) {
      setValue('automatic_writeoff', false, { shouldDirty: true });
      setValue('account_uuid', null);
      setValue('movement_date', null);
    }
  }, [paymentTypeValue, isEditing, isAutomaticWriteoffEditable, setValue]);

  // Baixa=Sim exige conta+data, com a data default HOJE (audit "Baixa=Sim
  // exige conta+data com default hoje") — mirror legado
  // (`_forms.blade.php:834-840`, `new Date().toISOString()...`).
  useEffect(() => {
    if (automaticWriteoffValue && !movementDateValue) {
      setValue('movement_date', todayLocalIso(), { shouldDirty: true });
    }
  }, [automaticWriteoffValue, movementDateValue, setValue]);

  // EXP-R04/R19 (P0) — default de "Dedutível" por `tenant.use_fiscal` SÓ em
  // criação (mirror `_forms.blade.php:63-68`, `session('farm')['tenant']
  // ['use_fiscal']`), nunca sobrescrevendo uma escolha manual do usuário
  // enquanto a fazenda ainda carrega (`dirtyFields` como guarda).
  useEffect(() => {
    if (isEditing || useFiscal === undefined || dirtyFields.fiscal_document) return;
    setValue('fiscal_document', {
      label: useFiscal ? languageGB.defaltStrings.yes : languageGB.defaltStrings.no,
      value: useFiscal,
    });
  }, [useFiscal, isEditing, dirtyFields.fiscal_document, setValue, languageGB]);

  // DEC-115 (TASK-FE-036-125, §6) — default do Select "Fazenda de destino" =
  // fazenda ATIVA (`activeFarmUuid`, `useAuth()`), assim que `useMyFarms()`
  // resolver a lista (precisa do `description` para o label do Select).
  // Mirror EXATO do racional do efeito de `fiscal_document` acima:
  // `dirtyFields.farm_uuid` como guarda para nunca sobrescrever uma escolha
  // manual do usuário enquanto a lista ainda carrega.
  useEffect(() => {
    if (
      isEditing ||
      !showFarmDestinationField ||
      dirtyFields.farm_uuid ||
      !myFarmsQuery.data ||
      !activeFarmUuid
    ) {
      return;
    }
    const activeFarm = myFarmsQuery.data.find((farm) => farm.uuid === activeFarmUuid);
    if (activeFarm) {
      setValue('farm_uuid', { label: activeFarm.description, value: activeFarm.uuid });
    }
  }, [
    isEditing,
    showFarmDestinationField,
    dirtyFields.farm_uuid,
    myFarmsQuery.data,
    activeFarmUuid,
    setValue,
  ]);

  // EXP-R09 (P1) — mirror legado `handleTaxation()` (`_forms.blade.php:660-
  // 669`): "É tributo?=Sim" TORNA O FORNECEDOR READONLY (não só remove a
  // obrigatoriedade, que já era feito via `isRequired={!isTaxationValue}`
  // no schema/Controller) e LIMPA o valor selecionado — o Cerne mantinha o
  // select habilitado e o valor preenchido. `branch_uuid` (dependente de
  // `provider_uuid`) some junto, mesma cascata já usada na troca manual de
  // fornecedor.
  // `GAP-FE-036-121` Decisão 2 (TASK-FE-036-124) — guarda NOVA: não limpa
  // `provider_uuid`/`branch_uuid` quando Tipo=Agricultura está ativo (o
  // backend também exige `provider_uuid` nesse caminho, independente de
  // `is_taxation` — mirror do OR já aplicado no schema/`isDisabled` abaixo).
  // Sem esta guarda, um usuário com `is_taxation=Sim` + Tipo=Agricultura
  // ficava preso num 422 permanente (campo obrigatório e limpo ao mesmo
  // tempo).
  useEffect(() => {
    if (isTaxationValue && !isProviderRequiredByAppropriation) {
      setValue('provider_uuid', null, { shouldDirty: true });
      setValue('branch_uuid', null, { shouldDirty: true });
    }
  }, [isTaxationValue, isProviderRequiredByAppropriation, setValue]);

  // ---- Cascata provider→branch (contrato §5.1) — habilitada SÓ com
  // provider_uuid preenchido, sem 404 se não houver. ----
  async function listBranchesForProvider() {
    if (!providerUuid) return { data: [] };
    const response = await listBranchesByProvider(providerUuid);
    return { data: response.data };
  }

  // Item 3 (homologação 036fix3, "Filial: bloquear o select quando o
  // fornecedor não tem filiais") — `SelectAsyncPaginate` não expõe callback
  // de "0 resultados" pro CALLER (só troca a mensagem interna do dropdown
  // para "Sem opções"); sem precedente pronto na base para esse gate
  // específico (achado do Explore desta Tarefa), a única forma de saber que
  // a lista voltou VAZIA de verdade é uma query própria, dedicada, side-by-
  // side com o `service` do Select (mesma chamada, cache próprio via
  // TanStack Query — não reaproveita o cache interno do AsyncPaginate).
  const providerBranchesQuery = useQuery({
    queryKey: ['expense-provider-branches', providerUuid],
    queryFn: () => listBranchesByProvider(providerUuid!),
    enabled: !!providerUuid,
  });
  const providerHasNoBranches =
    !!providerUuid &&
    providerBranchesQuery.isSuccess &&
    providerBranchesQuery.data.data.length === 0;

  // Se a busca resolver 0 filiais para o fornecedor atual, garante que o
  // form nunca fique com um `branch_uuid` órfão (ex.: troca de fornecedor
  // para um sem filiais enquanto uma já estava selecionada).
  useEffect(() => {
    if (providerHasNoBranches) {
      setValue('branch_uuid', null);
    }
  }, [providerHasNoBranches, setValue]);

  // ---- Preview de saldo "na data" (Baixa Automática, GAP-FE-036-105) —
  // dispara SÓ com account_uuid + movement_date preenchidos. Erro na
  // chamada: catch silencioso (mirror legado), preview mostra "—". ----
  const [accountBalancePreview, setAccountBalancePreview] = useState<number | null>(null);
  useEffect(() => {
    if (!accountUuidValue || !movementDateValue) {
      setAccountBalancePreview(null);
      return;
    }
    let cancelled = false;
    getAccountBalance(accountUuidValue, movementDateValue)
      .then((response: Response<{ balance: number }>) => {
        if (!cancelled) setAccountBalancePreview(response.data.balance);
      })
      .catch(() => {
        if (!cancelled) setAccountBalancePreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [accountUuidValue, movementDateValue]);

  const amountValue = Number(watch('amount')) || 0;
  const balanceInsufficient = accountBalancePreview !== null && accountBalancePreview < amountValue;

  // TASK-FE-036-117 (FL28/IG20) — contador visível `X/1500` do campo
  // "Histórico" + aviso ao se aproximar/atingir o limite (mirror do
  // precedente já em produção, `CreateOrUpdateAdditionalInfo.tsx`, campo
  // "info"/`maxLength=1000`).
  const NOTE_MAX_LENGTH = 1500;
  const noteValue = watch('note');
  const noteLength = (noteValue ?? '').length;
  const isNoteApproachingLimit = noteLength >= NOTE_MAX_LENGTH * 0.9;

  const paymentTypeOptions = expensePaymentTypeOptions.options(languageGB);
  const recurrenceTypeOptions = expenseRecurrenceTypeOptions.options(languageGB);
  const classificationOptions = expenseClassificationOptions.options(languageGB);
  const typeNoteOptions = invoiceDocumentTypeOptions.options(languageGB);
  const appropriationOptions = expenseAppropriationOptions.options(languageGB);
  // UT-000795 (D-102-15) — tipos oferecidos por centro de custo do tenant, via
  // `GET /expenses/appropriation-types/options`. Fallback SEGURO nos 4 tipos
  // (carregando/erro/vazio): é só filtro de tela, nunca bloqueia o form nem
  // gera toast. O tipo já gravado fora da lista é injetado (Select não fica
  // em branco).
  const appropriationTypesQuery = useQuery({
    queryKey: [queryKey.expenses.appropriationTypes, activeFarmUuid],
    queryFn: async () => (await listExpenseAppropriationTypeOptions()).data,
    enabled: !!activeFarmUuid,
    staleTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const appropriationTypeOptions = buildExpenseAppropriationTypeOptions(
    languageGB,
    appropriationTypesQuery.data,
    (loadedExpense?.appropriation_type as ExpenseAppropriationTypeValue | null | undefined) ?? null
  );

  const isFinancialReadOnly = hasMoved;

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      subtitle={isEditing ? formText.subtitle.edit : formText.subtitle.create}
      showDivider
      headerActions={
        // B-05 (TASK-FE-036-121) — "Importar XML" só na CRIAÇÃO (mirror
        // `CreateOrUpdateIncome.tsx`/`CreateOrUpdateInvoice.tsx`); "Baixar
        // XML" só quando `loadedExpense.xml_key` presente (edição/
        // visualização, `isViewOnlyRoute` inclusive — MESMO componente).
        // Mutuamente exclusivos por construção (`loadedExpense` só existe
        // em edição), mas cada botão gateado pela própria condição.
        !isEditing || loadedExpense?.xml_key ? (
          <Flex align="center" gap={2}>
            {!isEditing && (
              <Button
                title={formText.xmlImport.buttonLabel}
                icon={FiUpload as any}
                variant="outline"
                size="sm"
                onClick={xmlUploadModal.onOpen}
                disabled={isSubmitting}
              />
            )}
            {loadedExpense?.xml_key && (
              <Button
                title={formText.actions.downloadXml}
                icon={FiDownload as any}
                variant="outline"
                size="sm"
                loading={isDownloadingXml}
                disabled={isDownloadingXml}
                onClick={handleDownloadXml}
              />
            )}
          </Flex>
        ) : undefined
      }
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            onClick={handleCancel}
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
      {!isEditing && (
        <XmlPrefillModal
          isOpen={xmlUploadModal.open}
          onClose={xmlUploadModal.onClose}
          segment="expenses"
          onImported={handleXmlImported}
          texts={formText.xmlImport}
        />
      )}

      <Form onSubmit={handleSubmit(onSubmit, onInvalid)} noPadding>
        {/* @ts-ignore - custom variant */}
        <Tabs.Root
          value={tabValue}
          onValueChange={(details: { value: string }) =>
            setTabValue(details.value as ExpenseTabKey)
          }
          variant="outline"
        >
          {/* @ts-ignore - Tab List fixa (sticky) no topo do body: as abas ficam
              sempre visíveis; só o conteúdo da aba rola. `bg` cobre o conteúdo
              que passa por baixo ao rolar. */}
          <Tabs.List position="sticky" top="0" zIndex={1} bg="formBG">
            {/* @ts-ignore */}
            <Tabs.Trigger value="0">{formText.tabs.header}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="1">{formText.tabs.apportionment}</Tabs.Trigger>
            {/* Aba "Parcelamento" (esteira 036fix, audit "parcelamento
                dirigido pelo Tipo de Lançamento") — SÓ existe quando
                `payment_type=PARCELADA(2)`, mirror legado
                (`handlePaymentType()` só abre o gerador nesse caso),
                NUNCA "sempre em criação". */}
            {showInstallmentsTab && (
              // @ts-ignore
              <Tabs.Trigger value="2">{formText.tabs.installments}</Tabs.Trigger>
            )}
          </Tabs.List>

          {/* ---- ABA 1: Cabeçalho ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="0">
            {hasMoved && (
              <Box bg="orange.50" borderRadius="md" p={3} mb={4}>
                <Text fontSize="sm" color="orange.700">
                  {formText.hints.hasMovedWarning}
                </Text>
              </Box>
            )}

            <SimpleGrid columns={columnsForm.default} gap={6} pt={4}>
              <Input
                label={formText.fields.number}
                placeholder={formText.placeholders.number}
                maxLength={15}
                {...register('number')}
                error={errors.number?.message}
                isRequired
                loading={!!isLoading}
                disabled={!canSave}
              />

              <Controller
                name="type_title_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.typeTitle}
                    placeholder={formText.placeholders.typeTitle}
                    error={errors.type_title_uuid?.message as string | undefined}
                    // P0 (audit `audit-contas-a-pagar.md`, item E-03) — `/type-
                    // titles` exige `typetitles_view` (CRUD completo); o
                    // lookup `/type-titles/options` NÃO tem esse gate (só
                    // `auth:sanctum`), corrigindo o toast "Sem permissão"
                    // para quem só tem `expenses_create`/`expenses_edit`.
                    service={listTypeTitleOptions}
                    mapOptions={(item: TypeTitleOptionItem) => ({
                      label: item.description,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                      // Aditivo/documental — o backend já força `is_enabled=
                      // true` sempre nesta rota, independente do valor
                      // enviado (`ListTypeTitleOptionsAction`).
                      is_enabled: 'true' as const,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isRequired
                    isDisabled={!canSave || !!isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Controller
                name="is_taxation"
                control={control}
                render={({ field }) => (
                  <Select
                    label={formText.fields.isTaxation}
                    name={field.name}
                    options={getYesNoOptions(languageGB)}
                    value={field.value}
                    onChange={(option: Option<boolean> | null) => field.onChange(option)}
                    error={errors.is_taxation?.message as string | undefined}
                    isRequired
                    noClearable
                    isDisabled={!canSave || !!isLoading}
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
                    service={listProviders}
                    mapOptions={(item: { uuid: string; name: string }) => ({
                      label: item.name,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => {
                      field.onChange(option ?? null);
                      setValue('branch_uuid', null);
                    }}
                    // `GAP-FE-036-121` Decisão 2 (TASK-FE-036-124) — OR
                    // com o backend: obrigatório/habilitado quando
                    // `is_taxation=Não` OU Tipo=Agricultura está ativo
                    // (independente de `is_taxation`), mirror do
                    // `.when()` de `provider_uuid` no schema.
                    isRequired={!isTaxationValue || isProviderRequiredByAppropriation}
                    isDisabled={
                      !canSave ||
                      !!isLoading ||
                      (!!isTaxationValue && !isProviderRequiredByAppropriation)
                    }
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    // Item 2 (homologação 036fix3, B15/B16) — força
                    // reler a página 1 depois de criar/editar um
                    // fornecedor pelo modal ao lado, mirror EXATO
                    // `CreateOrUpdateMovimento.tsx` (TASK-MV-FE-13).
                    cacheUniqs={[providerOptionsCacheKey]}
                    // EST-07 — botão ÚNICO criar/editar Fornecedor migrado
                    // do `IconButton` avulso ao lado do select para o
                    // `labelAction` (ação no label), mirror EXATO do padrão
                    // `CreateOrUpdateNfe.tsx`. Mesmo gate de `disabled`
                    // (inclui "É tributo?"=Sim) e mesmo `onOpen`.
                    labelActionTooltip={
                      field.value
                        ? formText.actions.editProviderAria
                        : formText.actions.addProviderAria
                    }
                    labelAction={
                      <IconButton
                        aria-label={
                          field.value
                            ? formText.actions.editProviderAria
                            : formText.actions.addProviderAria
                        }
                        variant="ghost"
                        size="2xs"
                        minH="0"
                        h="20px"
                        w="20px"
                        minW="0"
                        p="0"
                        disabled={
                          !canSave ||
                          !!isLoading ||
                          (!!isTaxationValue && !isProviderRequiredByAppropriation) ||
                          !(can('providers_create') || can('providers_edit'))
                        }
                        onClick={providerModalDisclosure.onOpen}
                      >
                        <Icon
                          as={field.value ? FiEdit : FiPlus}
                          boxSize="16px"
                          color="primaryMain"
                        />
                      </IconButton>
                    }
                  />
                )}
              />

              <Controller
                name="branch_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.branch}
                    helperText={
                      !providerUuid
                        ? formText.hints.branchRequiresProvider
                        : providerHasNoBranches
                          ? formText.hints.providerHasNoBranches
                          : undefined
                    }
                    service={listBranchesForProvider as any}
                    mapOptions={(item: { uuid: string; name: string }) => ({
                      label: item.name,
                      value: item.uuid,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    // Item 3 (homologação 036fix3) — além de exigir
                    // `provider_uuid`, bloqueia de vez quando a query
                    // dedicada (`providerBranchesQuery`) já confirmou que o
                    // fornecedor atual não tem NENHUMA filial (antes ficava
                    // habilitado mostrando só "Sem opções" dentro do
                    // dropdown, sem sinalizar nada pro usuário fora dele).
                    isDisabled={!canSave || !!isLoading || !providerUuid || providerHasNoBranches}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Controller
                name="proprietary_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.proprietary}
                    placeholder={formText.placeholders.proprietary}
                    service={listProprietaries}
                    mapOptions={(item: { uuid: string; name: string }) => ({
                      label: item.name,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isDisabled={!canSave || !!isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              {/* DEC-115 (TASK-FE-036-125, §6) — Select "Fazenda de
                  destino", visível só em CRIAÇÃO com
                  `tenant.list_all_farms===true`; universo pequeno
                  (`useMyFarms()`, MESMA fonte do `FarmSwitcher`), por isso
                  `Select` comum (não `SelectAsyncPaginate` — não pagina nem
                  busca server-side). */}
              {/* UT-000754 (P-FE-04) — chave da NFS-e (50) só leitura, só quando
                  veio do rascunho de NFS-e Recebidas. */}
              {!isEditing && nfseDraftKey && (
                <InputReadOnly label={formText.fields.nfseKey} value={nfseDraftKey} />
              )}

              {showFarmDestinationField && (
                <Controller
                  name="farm_uuid"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={formText.fields.farmDestination}
                      name={field.name}
                      options={(myFarmsQuery.data ?? []).map((farm) => ({
                        label: farm.description,
                        value: farm.uuid,
                      }))}
                      value={field.value ?? undefined}
                      onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                      isRequired
                      noClearable
                      isDisabled={!canSave || !!isLoading || myFarmsQuery.isLoading}
                    />
                  )}
                />
              )}

              {/* `dt_emission` — readonly quando há baixa (GAP-FE-036-107,
                  mesmo grupo visual dos campos financeiros, apesar de o
                  backend nem validar/persistir uma mudança nesse campo
                  especificamente durante `hasMoved`). */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {formText.fields.dtEmission}
                </Text>
                <Controller
                  name="dt_emission"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <DateInput
                      value={value ?? null}
                      onChange={onChange}
                      disabled={!canSave || !!isLoading || isFinancialReadOnly}
                    />
                  )}
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {formText.fields.dueDate}
                </Text>
                <Controller
                  name="due_date"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <DateInput
                      value={value ?? null}
                      onChange={onChange}
                      disabled={!canSave || !!isLoading || isFinancialReadOnly}
                    />
                  )}
                />
              </Box>

              <Controller
                name="amount"
                control={control}
                render={({ field, fieldState }) => (
                  <MoneyInput
                    name={field.name}
                    label={formText.fields.amount}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    error={fieldState.error?.message}
                    isRequired
                    disabled={!canSave || !!isLoading || isFinancialReadOnly}
                  />
                )}
              />

              <Controller
                name="payment_type"
                control={control}
                render={({ field }) => (
                  <Select
                    label={formText.fields.paymentType}
                    name={field.name}
                    options={paymentTypeOptions}
                    value={field.value}
                    onChange={(option: Option<number> | null) => field.onChange(option)}
                    error={errors.payment_type?.message as string | undefined}
                    isRequired
                    isDisabled={!canSave || !!isLoading}
                  />
                )}
              />

              {paymentTypeValue === expensePaymentTypeIndex.RECORRENTE && (
                <Controller
                  name="recurrence_type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={formText.fields.recurrenceType}
                      name={field.name}
                      options={recurrenceTypeOptions}
                      value={field.value}
                      onChange={(option: Option<number> | null) => field.onChange(option)}
                      error={errors.recurrence_type?.message as string | undefined}
                      isRequired
                      isDisabled={!canSave || !!isLoading}
                    />
                  )}
                />
              )}

              <Controller
                name="classification"
                control={control}
                render={({ field }) => (
                  <Select
                    label={formText.fields.classification}
                    name={field.name}
                    options={classificationOptions}
                    value={field.value}
                    onChange={(option: Option<string> | null) => field.onChange(option)}
                    error={errors.classification?.message as string | undefined}
                    isRequired
                    noClearable
                    isDisabled={!canSave || !!isLoading}
                  />
                )}
              />

              {/* TASK-FE-036-123 (B-09 Opção C parcial, `GAP-036-115`) —
                  Select "Modalidade" (Direta/Indireta), default Indireta
                  preserva o payload atual enquanto intocado. */}
              <Controller
                name="appropriation"
                control={control}
                render={({ field }) => (
                  <Select
                    label={formText.fields.appropriation}
                    name={field.name}
                    options={appropriationOptions}
                    value={field.value}
                    onChange={(option: Option<number> | null) => {
                      field.onChange(option);
                      clearLivestockAndMaintenanceFields();
                    }}
                    error={errors.appropriation?.message as string | undefined}
                    isRequired
                    noClearable
                    isDisabled={!canSave || !!isLoading}
                  />
                )}
              />

              {/* Select "Tipo" — habilitado só quando Direta; opções vindas da
                  API por centro de custo (fallback: os 4 tipos), sem o
                  sufixo "indisponível" (UT-000795). */}
              <Controller
                name="appropriation_type"
                control={control}
                render={({ field }) => (
                  <Select
                    label={formText.fields.appropriationType}
                    name={field.name}
                    options={appropriationTypeOptions}
                    value={field.value}
                    onChange={(option: Option<number> | null) => {
                      field.onChange(option);
                      clearLivestockAndMaintenanceFields();
                    }}
                    error={errors.appropriation_type?.message as string | undefined}
                    isRequired={isAppropriationDirect}
                    isDisabled={!canSave || !!isLoading || !isAppropriationDirect}
                  />
                )}
              />

              {/* `type_note` (esteira 036fix, audit "Tipo de Nota select do
                  enum legado") — `ExpenseRequest::rules()` só valida
                  `nullable|integer`, sem `Rule::in`, mas o LEGADO popula
                  este mesmo select com `\App\Invoice::types()`
                  (`_forms.blade.php:59`) — o MESMO enum físico já modelado
                  para o Invoice (`invoiceDocumentTypeOptions`). Reusar essa
                  fonte real (não inventada) troca o `NumberInput` cru por
                  um Select fiel ao legado. */}
              <Controller
                name="type_note"
                control={control}
                render={({ field, fieldState }) => (
                  <Select
                    name={field.name}
                    label={formText.fields.typeNote}
                    options={typeNoteOptions}
                    value={field.value}
                    onChange={(option: Option<number> | null) => field.onChange(option)}
                    error={fieldState.error?.message}
                    isDisabled={!canSave || !!isLoading}
                  />
                )}
              />

              <Controller
                name="fiscal_document"
                control={control}
                render={({ field }) => (
                  <Select
                    label={formText.fields.fiscalDocument}
                    name={field.name}
                    options={getYesNoOptions(languageGB)}
                    value={field.value}
                    onChange={(option: Option<boolean> | null) => field.onChange(option)}
                    error={errors.fiscal_document?.message as string | undefined}
                    isRequired
                    noClearable
                    isDisabled={!canSave || !!isLoading || isFiscalDocumentReadOnly}
                  />
                )}
              />

              {/* UT-000765 (FE-765-D, D-101-06) — "Safra" no Cabeçalho SÓ em
                  CRIAÇÃO (após "Dedutível", mirror `_forms.blade.php:70-72`),
                  opcional, aplicada a todas as linhas do Rateio. Em EDIÇÃO a
                  Safra é por linha (coluna do Rateio). */}
              {!isEditing && (
                <Controller
                  name="harvest_uuid"
                  control={control}
                  render={({ field, fieldState }) => (
                    <SelectAsyncPaginate
                      name={field.name}
                      label={formText.fields.harvest}
                      placeholder={formText.placeholders.harvest}
                      service={listHarvests}
                      mapOptions={(item: Harvest) => ({
                        label: item.description,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                      })}
                      value={field.value ?? undefined}
                      onChange={(option: any) => field.onChange(option ?? null)}
                      error={fieldState.error?.message}
                      isDisabled={!canSave || !!isLoading}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  )}
                />
              )}

              <Controller
                name="discount"
                control={control}
                render={({ field, fieldState }) => (
                  <MoneyInput
                    name={field.name}
                    label={formText.fields.discount}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    error={fieldState.error?.message}
                    disabled={!canSave || !!isLoading || isFinancialReadOnly}
                  />
                )}
              />

              <Controller
                name="penalty"
                control={control}
                render={({ field, fieldState }) => (
                  <MoneyInput
                    name={field.name}
                    label={formText.fields.penalty}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    error={fieldState.error?.message}
                    disabled={!canSave || !!isLoading || isFinancialReadOnly}
                  />
                )}
              />

              <Controller
                name="interest"
                control={control}
                render={({ field, fieldState }) => (
                  <MoneyInput
                    name={field.name}
                    label={formText.fields.interest}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    error={fieldState.error?.message}
                    disabled={!canSave || !!isLoading || isFinancialReadOnly}
                  />
                )}
              />

              <Controller
                name="perc_interest"
                control={control}
                render={({ field, fieldState }) => (
                  // P1 (audit "% Juros ... WIDGET_DIVERGENTE") — legado
                  // usa a MESMA máscara `money` (decimal, vírgula, 2 casas)
                  // do resto do bloco financeiro (`_forms.blade.php:125-
                  // 127`); `NumberInput` cru trocado pelo componente
                  // compartilhado de percentual, coerente com o significado
                  // do campo (`% Juros`, não um valor monetário).
                  <PercentInput
                    name={field.name}
                    label={formText.fields.percInterest}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    error={fieldState.error?.message}
                    disabled={!canSave || !!isLoading || isFinancialReadOnly}
                  />
                )}
              />

              <Controller
                name="increase"
                control={control}
                render={({ field, fieldState }) => (
                  <MoneyInput
                    name={field.name}
                    label={formText.fields.increase}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    error={fieldState.error?.message}
                    disabled={!canSave || !!isLoading || isFinancialReadOnly}
                  />
                )}
              />
            </SimpleGrid>

            <Box mt={2}>
              <Controller
                name="note"
                control={control}
                render={({ field, fieldState }) => (
                  <Textarea
                    {...field}
                    label={formText.fields.note}
                    maxLength={NOTE_MAX_LENGTH}
                    error={fieldState.error?.message}
                    helperText={
                      fieldState.error?.message ? undefined : `${noteLength}/${NOTE_MAX_LENGTH}`
                    }
                    isRequired
                    disabled={!canSave || !!isLoading}
                  />
                )}
              />
              {isNoteApproachingLimit && (
                <Text fontSize="xs" color="orange.600" mt={1}>
                  {formText.hints.noteApproachingLimit}
                </Text>
              )}
            </Box>

            {/* ---- Bloco "Agricultura" (TASK-FE-036-124, B-09 Opção C
                parcial, `GAP-036-115`, 2/2) — visível só quando
                Direta+Tipo=Agricultura, mirror estrutural da seção "Baixa
                Automática" abaixo (Box colapsável, só aparece com a condição
                ativa). 4 campos (Área/Atividade obrigatórios, Operação/
                Cultura opcionais, cascata Operação→Atividade), mirror EXATO
                `AppropriationHeaderFields.tsx`/`InvoiceItemsTab.tsx` — ZERO
                service novo. Indicador read-only `appropriation_generated`
                (code+status) embutido no MESMO bloco, visível só em edição
                quando o backend já gerou um Apontamento real para este
                título (nasce ausente na criação). ---- */}
            {isAppropriationAgriculture && (
              <Box mt={6} p={4} bg="bg.muted" borderRadius="lg">
                <Text fontSize="sm" fontWeight="semibold" mb={4}>
                  {formText.sections.agriculture}
                </Text>
                <SimpleGrid columns={columnsForm.fourColumns} gap={4}>
                  <Controller
                    name="aprop_agri_area_uuid"
                    control={control}
                    render={({ field }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={formText.fields.agriArea}
                        placeholder={formText.placeholders.agriArea}
                        error={errors.aprop_agri_area_uuid?.message as string | undefined}
                        service={listAreasForActiveFarm}
                        mapOptions={(item: AreaListItem) => ({
                          label: item.description,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                        })}
                        value={field.value ?? undefined}
                        onChange={(option: any) => field.onChange(option ?? null)}
                        isRequired
                        isDisabled={!canSave || !!isLoading}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    )}
                  />

                  <Controller
                    name="aprop_agri_operation_uuid"
                    control={control}
                    render={({ field }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={formText.fields.agriOperation}
                        placeholder={formText.placeholders.agriOperation}
                        service={listOperations}
                        // `id` numérico embutido na option (OperationResource
                        // expõe id+uuid) — necessário para o filtro
                        // `operation_id` (int) de `listActivities` (mirror
                        // EXATO `AppropriationHeaderFields.tsx`/
                        // `InvoiceItemsTab.tsx`).
                        mapOptions={(item: OperationListItem) => ({
                          label: item.name,
                          value: item.uuid,
                          id: item.id,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                        })}
                        value={field.value ?? undefined}
                        onChange={(option: any) => {
                          field.onChange(option ?? null);
                          // CASCATA — trocar a Operação invalida a Atividade
                          // escolhida (pode não pertencer à nova Operação).
                          setValue('aprop_agri_activity_uuid', null);
                        }}
                        isDisabled={!canSave || !!isLoading}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    )}
                  />

                  <Controller
                    name="aprop_agri_activity_uuid"
                    control={control}
                    render={({ field }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={formText.fields.agriActivity}
                        placeholder={formText.placeholders.agriActivity}
                        error={errors.aprop_agri_activity_uuid?.message as string | undefined}
                        service={listActivities}
                        mapOptions={(item: ActivityListItem) => ({
                          label: item.name,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                          // Cascata — filtro real do backend é `operation_id`
                          // (int, id interno de `operations`, NÃO uuid). `id`
                          // vem embutido na option de Operação (acima).
                          operation_id: (watch('aprop_agri_operation_uuid') as any)?.id,
                        })}
                        // Descarta o cache de opções quando a Operação muda —
                        // senão o menu continuaria oferecendo Atividades da
                        // Operação anterior.
                        cacheUniqs={[(watch('aprop_agri_operation_uuid') as any)?.id]}
                        value={field.value ?? null}
                        onChange={(option: any) => field.onChange(option ?? null)}
                        isRequired
                        // Gate de sequência (mirror EXATO
                        // `AppropriationHeaderFields.tsx`) — em CRIAÇÃO,
                        // Atividade só habilita após escolher Operação; em
                        // EDIÇÃO, nunca desabilitar (dados históricos podem
                        // ter Atividade sem Operação persistida).
                        isDisabled={
                          !canSave ||
                          !!isLoading ||
                          (!isEditing && !watch('aprop_agri_operation_uuid'))
                        }
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    )}
                  />

                  <Controller
                    name="aprop_agri_cultivation_uuid"
                    control={control}
                    render={({ field }) => (
                      <SelectCultivation
                        name={field.name}
                        label={formText.fields.agriCultivation}
                        placeholder={formText.placeholders.agriCultivation}
                        value={field.value ?? null}
                        onChange={(option) => field.onChange(option ?? null)}
                        isDisabled={!canSave || !!isLoading}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    )}
                  />
                </SimpleGrid>

                {/* Indicador READ-ONLY do `Appropriation` real gerado
                    (`appropriation_generated`, `TASK-BE-036-126`) — visível
                    só em edição quando presente; ausente na criação (só
                    existe após o 1º submit bem-sucedido). NÃO reidrata os 4
                    campos acima (decisão de escopo documentada — editar e
                    salvar de novo RECRIA o Appropriation). */}
                {loadedExpense?.appropriation_generated && (
                  <Box mt={4}>
                    <Text fontSize="xs" fontWeight="semibold" mb={2}>
                      {formText.fields.appropriationGenerated}
                    </Text>
                    <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
                      <InputReadOnly
                        label={formText.fields.appropriationGeneratedCode}
                        value={loadedExpense.appropriation_generated.code ?? '—'}
                      />
                      <InputReadOnly
                        label={formText.fields.appropriationGeneratedStatus}
                        value={
                          getAppropriationStatusLegend(languageGB).find(
                            (item) => item.status === loadedExpense.appropriation_generated!.status
                          )?.label ?? loadedExpense.appropriation_generated.status
                        }
                      />
                    </SimpleGrid>
                  </Box>
                )}
              </Box>
            )}

            {/* ---- UT-000795 (F-109) — blocos "Pecuária" e "Manutenção",
                mesmo contêiner visual do bloco Agricultura. Em edição/
                visualização reidratam de `appropriation_detail`. Em
                visualização (`canSave=false`) ficam desabilitados. ---- */}
            {isAppropriationLivestock && (
              <ExpenseLivestockBlock
                control={control}
                errors={errors}
                setValue={setValue}
                getValues={getValues}
                clearErrors={clearErrors}
                isEditing={isEditing}
                isDisabled={!canSave || !!isLoading}
                detail={loadedExpense?.appropriation_detail?.livestock}
              />
            )}
            {isAppropriationMaintenance && (
              <ExpenseMaintenanceBlock
                control={control}
                errors={errors}
                setValue={setValue}
                clearErrors={clearErrors}
                isDisabled={!canSave || !!isLoading}
                detail={loadedExpense?.appropriation_detail?.maintenance}
              />
            )}

            {/* ---- Seção "Baixa Automática" (GAP-FE-036-105) — SÓ em
                criação, agora SEMPRE visível (mirror legado, seção sempre
                renderizada — `_forms.blade.php:311-320`); o que muda por
                Tipo de Lançamento é se o campo é EDITÁVEL/forçado, nunca se
                a seção existe (esteira 036fix, audit "Cerne condiciona ao
                número de linhas, não ao tipo"). ---- */}
            {!isEditing && (
              <Box mt={6} p={4} bg="bg.muted" borderRadius="lg">
                <Text fontSize="sm" fontWeight="semibold" mb={4}>
                  {formText.sections.automaticWriteoff}
                </Text>
                <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
                  <Controller
                    name="automatic_writeoff"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label={formText.fields.automaticWriteoff}
                        name={field.name}
                        options={getYesNoOptions(languageGB)}
                        value={
                          getYesNoOptions(languageGB).find(
                            (option) => option.value === field.value
                          ) ?? null
                        }
                        onChange={(option: Option<boolean> | null) =>
                          field.onChange(!!option?.value)
                        }
                        helperText={
                          isAutomaticWriteoffLocked
                            ? formText.hints.automaticWriteoffDeterminedByPaymentType
                            : undefined
                        }
                        noClearable
                        isDisabled={!canSave || isAutomaticWriteoffLocked}
                      />
                    )}
                  />

                  {automaticWriteoffValue && (
                    <>
                      <Controller
                        name="account_uuid"
                        control={control}
                        render={({ field }) => (
                          <SelectAsyncPaginate
                            name={field.name}
                            label={formText.fields.account}
                            service={listAccounts}
                            mapOptions={(item: {
                              uuid: string;
                              bank: string;
                              agency: string;
                              account: string;
                            }) => ({
                              label: `${item.bank} — Ag. ${item.agency} / Cta. ${item.account}`,
                              value: item.uuid,
                            })}
                            findParams={(search: string | { search: string }) => ({
                              search: typeof search === 'string' ? search : search.search,
                            })}
                            value={field.value ?? undefined}
                            onChange={(option: any) => field.onChange(option ?? null)}
                            error={errors.account_uuid?.message as string | undefined}
                            isRequired
                            isDisabled={!canSave}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                          />
                        )}
                      />

                      <Box>
                        <Text fontSize="sm" fontWeight="medium" mb={1}>
                          {formText.fields.movementDate}
                        </Text>
                        <Controller
                          name="movement_date"
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <DateInput
                              value={value ?? null}
                              onChange={onChange}
                              disabled={!canSave}
                            />
                          )}
                        />
                      </Box>

                      <InputReadOnly
                        label={formText.fields.accountBalancePreview}
                        value={
                          accountBalancePreview !== null
                            ? accountBalancePreview.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              })
                            : '—'
                        }
                      />
                    </>
                  )}
                </SimpleGrid>

                {/* IG18 (esteira 036, TASK-FE-036-117) — alerta MAIS
                    PROEMINENTE que o `Text` discreto anterior (mirror do
                    padrão `Alert.Root` já em produção, ex.:
                    `CreateOrUpdateApportionment.tsx`), continuando
                    NÃO-BLOQUEANTE — o usuário ainda pode submeter. */}
                {automaticWriteoffValue && balanceInsufficient && (
                  <Alert.Root status="warning" borderRadius="md" mt={3}>
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>{formText.hints.insufficientBalanceWarning}</Alert.Title>
                    </Alert.Content>
                  </Alert.Root>
                )}
              </Box>
            )}
          </Tabs.Content>

          {/* ---- ABA 2: Rateio ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="1">
            <ExpenseApportionmentTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canSave}
              hasMoved={hasMoved}
              isEditing={isEditing}
              showHarvestColumn={isEditing}
              listAreasForActiveFarm={listAreasForActiveFarm}
            />
          </Tabs.Content>

          {/* ---- ABA 3: Parcelamento — SÓ em criação + SÓ Tipo de
              Lançamento=Parcelada (contrato §6, esteira 036fix) ---- */}
          {showInstallmentsTab && (
            // @ts-ignore
            <Tabs.Content value="2">
              <ExpenseInstallmentsTab
                control={control}
                errors={errors}
                watch={watch}
                setValue={setValue}
                isLoading={!!isLoading}
                canSave={canSave}
              />
            </Tabs.Content>
          )}
        </Tabs.Root>
      </Form>

      {/* Item 2 (homologação 036fix3, B15/B16) — modal de criar/editar
          Fornecedor. `providerUuid` lido direto de `watch` (não um
          `useState` paralelo) — o modal sempre reflete o valor ATUAL do
          campo `provider_uuid` deste formulário, mirror EXATO
          `CreateOrUpdateMovimento.tsx` (TASK-MV-FE-13). */}
      <ProviderFormModal
        isOpen={providerModalDisclosure.open}
        onClose={providerModalDisclosure.onClose}
        providerUuid={watch('provider_uuid')?.value}
        onSaved={(provider) => {
          // Só limpa `branch_uuid` quando o fornecedor TROCOU de fato
          // (criação de um novo, ou seleção de outro pelo autocomplete
          // dentro do modal) — editar os dados do MESMO fornecedor já
          // selecionado não deve descartar a filial já escolhida.
          applySavedProvider(provider, () => {
            if (watch('provider_uuid')?.value !== provider.uuid) {
              setValue('branch_uuid', null);
            }
            setValue(
              'provider_uuid',
              { value: provider.uuid, label: provider.label },
              { shouldDirty: true, shouldValidate: true }
            );
          });
          setProviderOptionsCacheKey((key) => key + 1);
          // Item 2 (fix5) — o select de Filial fica bloqueado
          // ("Este fornecedor não possui filiais") mesmo depois de cadastrar
          // uma filial nova pelo modal, porque `providerBranchesQuery`
          // (que decide `providerHasNoBranches`) fica com o cache antigo
          // (0 filiais) quando o fornecedor editado é o MESMO já selecionado
          // no form — a chave da query não muda, então nunca refaz o fetch
          // por conta própria. Invalida explicitamente para o uuid recém-
          // salvo (mesmo em criação, é um no-op inofensivo — a chave nova
          // ainda não tinha sido buscada).
          queryClient.invalidateQueries({
            queryKey: ['expense-provider-branches', provider.uuid],
          });
        }}
      />
    </FormContainer>
  );
}
