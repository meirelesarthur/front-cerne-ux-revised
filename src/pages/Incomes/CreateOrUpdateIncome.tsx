// src/pages/Incomes/CreateOrUpdateIncome.tsx
// -----------------------------------------------------------------------------
// Form raiz de CRIAÇÃO e EDIÇÃO de Contas a Receber (Income) — TASK-FE-036-313.
// Cabeçalho + orquestração create/update + bloqueio visual quando `is_locked`
// (GAP-FE-036-300). As abas de Parcelamento (314)/Rateio (315)/Baixa
// Automática (316) são componentes-irmãos que se acoplam a este form via
// `control`/`watch`/`setValue` — mesma composição de `CreateOrUpdateEquipamento.tsx`.
//
// Diferente de `CreateOrUpdateCentroCusto.tsx` (sem abas) e de
// `CreateOrUpdateEquipamento.tsx` (5 abas sempre visíveis, wizard
// Voltar/Próximo): aqui a aba "Parcelamento" só existe no CREATE (parcelas
// são imutáveis quanto à posição após a criação) e a aba "Rateio" fica
// desabilitada/informativa quando `is_locked` — sem wizard, navegação livre
// entre abas (mirror `Tabs.Root` nativo).
//
// GAP-FE-036-305 (achado desta Tarefa) — `IncomeDetail.client`/`.proprietary`/
// `.harvest` só devolvem `uuid` (Resource real não expõe nome/descrição) —
// a hidratação do `Option` desses 3 selects em edição usa o próprio `uuid`
// como rótulo (honesto, sem mock) até o usuário reabrir a busca.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, Icon, IconButton, SimpleGrid, Tabs, Text, useDisclosure } from '@chakra-ui/react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { FiEdit, FiPlus, FiUpload } from 'react-icons/fi';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

// Item 1 (036fix4, paridade com CaP/B15 e NFe TASK-MV-FE-11) — reusa 100% o
// modal genérico de Cliente (`ClientFormModal`, sobre
// `useClientFormController`/`ClientFormFields`/schema+service da página
// cheia) — zero endpoint/schema/modal novo nesta tela, mirror EXATO
// `CreateOrUpdateNfe.tsx`/`CreateOrUpdateExpense.tsx` (Fornecedor).
import { ClientFormModal } from '@/pages/CadastrosBase/Clientes/ClientFormModal';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';
import { toaster } from '@/components/ui/toaster';
// B-05 (TASK-FE-036-340/341/342, Onda 3 sub-onda 3f) — módulo COMPARTILHADO
// de Upload/Prefill de XML, mesma composição de `InvoiceXmlUploadModal.tsx`
// (`CreateOrUpdateInvoice.tsx`), generalizado por `segment`.
import { XmlPrefillModal } from '@/components/XmlPrefill';

import { useAuth } from '@/hooks/useAuth';
import { useCurrentFarm } from '@/hooks/useCurrentFarm';
import { useLanguage } from '@/hooks/useLanguage';
import { useMyFarms } from '@/hooks/useMyFarms';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { incomeSchemaResolver } from '@/validations/schemas/Incomes/income-schema';

import {
  getTypeTitleByUuid,
  listTypeTitleOptions,
} from '@/services/v2/BaseRegistrations/typeTitles-service';
import { getClientByUuid, listClients } from '@/services/v2/CadastrosBase/Client/client-service';
import {
  getProprietaryByUuid,
  listProprietaries,
} from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { getHarvest, listHarvests } from '@/services/v2/Harvests/harvest-service';
import { createIncome, updateIncome } from '@/services/v2/Incomes/income-service';

import type { Option } from '@/@types/option';
import type { TypeTitleOptionItem } from '@/@types/v2/BaseRegistrations/typeTitles';
import type { ClientListItem } from '@/@types/v2/CadastrosBase/client';
import type { ProprietaryListItem } from '@/@types/v2/CadastrosBase/proprietary';
import type { Harvest } from '@/@types/v2/Harvests';
import type {
  IncomeDetail,
  IncomeDuplicateDraft,
  IncomeForm as IncomeFormType,
  IncomePayload,
} from '@/@types/v2/Incomes';
import type { IncomeXmlDraft } from '@/@types/v2/XmlPrefill';

import { IncomeApportionmentTab } from './IncomeApportionmentTab';
import { IncomeAutomaticWriteoffSection } from './IncomeAutomaticWriteoffSection';
import { IncomeInstallmentsTab } from './IncomeInstallmentsTab';
import { useIncomeForm } from './useIncomes';

import {
  OBLIGATION_DRAFT_QUERY_PARAM,
  clearObligationDraft,
  isUsableObligationDraft,
  mapObligationDraftToIncomeFields,
  readObligationDraft,
  type ObligationDraftNavigationState,
} from '../Financeiro/MovCaixaBancario/obligation-draft';

// Item 2 (036fix4, paridade com CaP) — Baixa Automática deixou de ser aba
// própria; agora é uma seção dentro da aba "Dados" (mirror
// `CreateOrUpdateExpense.tsx`, seção embutida no Cabeçalho).
type IncomeTabKey = 'data' | 'installments' | 'apportionment';

const FIELD_TAB_MAP: Partial<Record<keyof IncomeFormType, IncomeTabKey>> = {
  number: 'data',
  type_title_uuid: 'data',
  client_uuid: 'data',
  proprietary_uuid: 'data',
  harvest_uuid: 'data',
  payment_type: 'data',
  dt_emission: 'data',
  due_date: 'data',
  amount: 'data',
  discount: 'data',
  penalty: 'data',
  interest: 'data',
  perc_interest: 'data',
  increase: 'data',
  note: 'data',
  fiscal_document: 'data',
  installments: 'installments',
  categories: 'apportionment',
  // INC-R21 — validação de conta/data agora vive no schema; garante que o
  // `onInvalid` leve o usuário para a aba correta. Baixa Automática não é
  // mais aba própria (item 2, 036fix4) — vive dentro de "Dados".
  account_uuid: 'data',
  movement_date: 'data',
  farm_uuid: 'data',
};

export default function CreateOrUpdateIncome() {
  const { incomeId } = useParams<{ incomeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.incomes.income;

  const isEditing = isValidGuid(incomeId);
  // TASK-FE-036-320 (Onda 1 segurança/FID-G3F AM07) — reatribuído mais abaixo
  // (após `incomeData` carregar) para incorporar `!isAdvancePaymentLocked`;
  // por isso `let`, não `const`.
  let canSave = isEditing ? can('incomes_edit') : can('incomes_create');

  // GAP-FE-036-300 — a distinção correta para bloqueio de campos financeiros
  // é `isLocked`, NUNCA `isEditing` (uma edição SEM baixa ainda permite
  // editar tudo normalmente). `IncomeResource.is_locked` já vem calculado do
  // backend — nunca recalculado aqui a partir de `balance`/`amount` brutos.
  const [isLocked, setIsLocked] = useState(false);

  // INC-R19 (REAUDITORIA-036-2a-rodada) — o legado inicia Dedutível
  // (`fiscal_document`) conforme `tenant.use_fiscal` e o torna readonly
  // quando o fiscal está desativado (`_forms.blade.php:40`). `GET
  // /me/farms/current` (`useCurrentFarm`) já devolve `tenant.use_fiscal` —
  // reaproveitado aqui, sem endpoint novo.
  const currentFarmQuery = useCurrentFarm();
  const tenantUseFiscal = currentFarmQuery.data?.tenant?.use_fiscal;
  const isFiscalDocumentReadonly = tenantUseFiscal === false;

  // DEC-115 (TASK-FE-036-344, §6, mirror `TASK-FE-036-125`) — Select
  // "Fazenda de destino", gateado DIRETO por `tenant.list_all_farms` (MESMO
  // flag do backend, `StoreIncomeAction`), independente do toggle da
  // listagem (rotas diferentes, sem estado compartilhado confiável entre
  // navegações). Visível só em CRIAÇÃO.
  const { activeFarmUuid } = useAuth();
  const listAllFarmsEnabled = currentFarmQuery.data?.tenant?.list_all_farms === true;
  const showFarmDestinationField = !isEditing && listAllFarmsEnabled;
  // `useMyFarms()` — MESMA fonte do `FarmSwitcher` (`GET /me/farms`),
  // universo pequeno, sem paginação/busca server-side (por isso `Select`
  // comum, não `SelectAsyncPaginate`).
  const myFarmsQuery = useMyFarms();

  const [tabValue, setTabValue] = useState<IncomeTabKey>('data');

  // Item 1 (036fix4, B15/CaP/NFe) — disclosure do modal de criar/editar
  // Cliente + chave de invalidação do cache do `SelectAsyncPaginate` (mirror
  // EXATO `CreateOrUpdateExpense.tsx`/`CreateOrUpdateNfe.tsx`).
  const clientModalDisclosure = useDisclosure();
  const [clientOptionsCacheKey, setClientOptionsCacheKey] = useState(0);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<IncomeFormType>({
    mode: 'onChange',
    // Context reativo (isLocked/isEditing) — consumido pelos `.test()` de
    // `income-schema.ts` (GAP-FE-036-300/301/302).
    resolver: incomeSchemaResolver(languageGB),
    context: { isLocked, isEditing },
    reValidateMode: 'onChange',
    defaultValues: {
      number: '',
      type_title_uuid: null,
      client_uuid: null,
      proprietary_uuid: null,
      harvest_uuid: null,
      payment_type: 1,
      dt_emission: null,
      due_date: null,
      amount: null,
      discount: 0,
      penalty: 0,
      interest: 0,
      perc_interest: 0,
      increase: 0,
      note: '',
      fiscal_document: false,
      is_locked: false,
      has_down_payment: false,
      down_payment_date: null,
      down_payment_value: null,
      qtd_installments: 1,
      first_due_date: null,
      interval_days: 30,
      installments: [],
      categories: [],
      automatic_writeoff: false,
      account_uuid: null,
      movement_date: null,
      xml_key: null,
      // DEC-115 (TASK-FE-036-344, §6, mirror `TASK-FE-036-125`) — populado
      // assim que `useMyFarms()` resolver (useEffect abaixo), com a fazenda
      // ATIVA pré-selecionada. `null` até lá é seguro: o campo só existe no
      // DOM quando `showFarmDestinationField` vale, e o payload só lê
      // `farm_uuid` nesse mesmo gate.
      farm_uuid: null,
    },
  });

  function fillForm(data: IncomeDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      setIsLocked(!!data.is_locked);
      reset({
        uuid: data.uuid,
        number: data.number,
        type_title_uuid: data.type ? { label: data.type.description, value: data.type.uuid } : null,
        // L-06/B-06 (auditoria de fidelidade 2026-08) — `IncomeResource`
        // agora devolve `.name`; usa o nome quando presente, cai para o
        // uuid só como fallback honesto (relação sem nome/ainda sem
        // hidratação — nunca inventa rótulo).
        client_uuid: data.client
          ? { label: data.client.name ?? data.client.uuid, value: data.client.uuid }
          : null,
        proprietary_uuid: data.proprietary
          ? { label: data.proprietary.name ?? data.proprietary.uuid, value: data.proprietary.uuid }
          : null,
        harvest_uuid: data.harvest
          ? { label: data.harvest.name ?? data.harvest.uuid, value: data.harvest.uuid }
          : null,
        payment_type: data.payment_type,
        dt_emission: data.dt_emission,
        due_date: data.due_date,
        amount: data.amount,
        discount: data.discount,
        penalty: data.penalty,
        interest: data.interest,
        perc_interest: data.perc_interest,
        increase: data.increase,
        note: data.note ?? '',
        fiscal_document: !!data.fiscal_document,
        is_locked: !!data.is_locked,
        // Aba Parcelamento não existe em edição (contrato §4.3) — permanece vazia.
        has_down_payment: false,
        down_payment_date: null,
        down_payment_value: null,
        qtd_installments: data.qtd_installments,
        first_due_date: null,
        interval_days: 30,
        installments: [],
        // GAP-FE-036-301 — Resource devolve `value` (monetário), não
        // `percentage` — reconvertido aqui pela MESMA fórmula inversa do
        // preview (§5.2 do contrato: `value = percentage/100 * amount`).
        categories: (data.categories ?? []).map((category) => ({
          category_uuid: category.category_uuid,
          plan_account_uuid: null,
          center_uuid: category.center_uuid,
          percentage:
            data.amount > 0 ? Math.round((category.value / data.amount) * 10000) / 100 : 0,
        })),
        automatic_writeoff: false,
        account_uuid: null,
        movement_date: null,
      });
    }
  }

  // B-05 (TASK-FE-036-342, Onda 3 sub-onda 3f) — SÓ na criação, mirror
  // `xmlUploadModal`/`CreateOrUpdateInvoice.tsx:288` (o legado não oferece
  // reprocessamento de XML em edição, `DOC-BRUTA-B05 §C`).
  const xmlUploadModal = useDisclosure();

  // Hidrata o form a partir do DRAFT (`IncomeXmlDraft`, Tarefa 340) via
  // `setValue` — NUNCA `reset()` (diferente de `CreateOrUpdateInvoice.tsx`,
  // que reseta o form inteiro): aqui só os campos que o draft de fato
  // preenche são tocados, o resto do form (Forma de Pagamento/Vencimento/
  // Rateio/Parcelamento) permanece como o usuário já tiver preenchido.
  //
  // ⚠️ Achados críticos da Tarefa 340 — os 2 campos `*_matched` têm
  // semânticas DIFERENTES, NÃO tratar com a mesma régua:
  //   - `client_matched` — find-or-create REAL, `client_uuid` é SEMPRE um
  //     uuid válido mesmo quando `false` (aviso só INFORMATIVO).
  //   - `proprietary_matched` — busca simples (nunca cria), só relevante no
  //     ramo NFe; `false`+`proprietary_uuid=null` é ausência REAL (aviso de
  //     fato, campo fica vazio para o usuário selecionar manualmente).
  function handleXmlImported(draft: IncomeXmlDraft) {
    setValue('number', draft.number, { shouldDirty: true });
    setValue('dt_emission', draft.dt_emission ? draft.dt_emission.slice(0, 10) : null, {
      shouldDirty: true,
    });
    setValue('amount', draft.amount, { shouldDirty: true });
    setValue('note', draft.note ?? '', { shouldDirty: true });

    // B-05 (Achado crítico 1, Tarefa 340) — envio DEFENSIVO/forward-
    // compatible: o backend HOJE ignora este campo no `store()` (Gap de API
    // pendente, ver comentário de `IncomePayload.xml_key`). Custo zero
    // manter aqui mesmo assim.
    setValue('xml_key', draft.xml_key, { shouldDirty: true });

    // `client_uuid` — o draft não devolve `name`, só `uuid` (mesmo limite já
    // documentado em `IncomeDetail.client`/GAP-FE-036-305) — reaproveita a
    // MESMA convenção "uuid truncado como rótulo" já usada por `fillForm`
    // acima, não inventa uma resolução de nome separada.
    setValue(
      'client_uuid',
      { value: draft.client_uuid, label: draft.client_uuid.slice(0, 8) },
      { shouldDirty: true, shouldValidate: true }
    );
    if (!draft.client_matched) {
      toaster.info({
        title: text.form.xmlImport.buttonLabel,
        description: text.form.xmlImport.clientAutoCreatedNotice,
        duration: 8000,
      });
    }

    // `proprietary_uuid` — só populado no ramo NFe; `null` no ramo NFSe OU
    // quando genuinamente NÃO ENCONTRADO (`proprietary_matched===false` E
    // `proprietary_uuid===null`). NUNCA fabricar um valor aqui.
    if (draft.proprietary_uuid) {
      setValue(
        'proprietary_uuid',
        { value: draft.proprietary_uuid, label: draft.proprietary_uuid.slice(0, 8) },
        { shouldDirty: true }
      );
    } else {
      setValue('proprietary_uuid', null, { shouldDirty: true });
      if (draft.document_type === 'nfe' && !draft.proprietary_matched) {
        toaster.warning({
          title: text.form.xmlImport.buttonLabel,
          description: text.form.xmlImport.proprietaryNotFoundWarning,
          duration: 8000,
        });
      }
    }

    // `type_title_uuid` — Item 2 da Leitura do dev (TASK-FE-036-342): `type_id`
    // do draft é um inteiro FIXO do legado (Income sempre `18`), sem
    // correspondência determinística com o catálogo `type_titles` (tenant-
    // scoped por uuid). Mirror do que `CreateOrUpdateInvoice.tsx` já faz
    // para o problema análogo seria resolver por BUSCA DE LABEL
    // (`listTypeTitleOptions({ search: <label conhecido> })`) — mas isso
    // exige confirmar com o dono/negócio qual label do catálogo corresponde
    // a cada `document_type` (NFe/NFSe) desta feature, o que não foi
    // confirmado nesta execução (decisão de escopo já registrada na Leitura
    // do dev da Tarefa). Por isso `type_title_uuid` é deixado MANUAL — o
    // usuário escolhe — em vez de adivinhar uma string de busca. Não é um
    // bloqueador da Tarefa, é a lacuna documentada explicitamente aqui.
  }

  const incomeQuery = useIncomeForm({
    registrationId: isEditing ? incomeId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([incomeQuery as any]);
  const incomeData = incomeQuery.data as IncomeDetail | undefined;

  // TASK-FE-036-320 (Onda 1 segurança/FID-G3F AM07, Decisão do Dono nº 6) —
  // trava de defesa-em-profundidade nº2: mesmo que o item "Editar" já esteja
  // oculto no menu da listagem (`IncomeActionsMenu.tsx`), navegação DIRETA
  // por URL para `/financeiro/receber/{uuid}` de um Adiantamento precisa
  // bloquear o form aqui também. Usa o valor JÁ PERSISTIDO (`incomeData`,
  // vindo de `incomeQuery`/`useIncomeForm`) — NUNCA o "ao vivo" de
  // `watch('payment_type')` (`isAdvancePayment`, abaixo): a trava é sobre
  // "esta parcela É um Adiantamento hoje", não sobre o que o usuário está
  // digitando no select (que continua existindo por decisão já ratificada,
  // FLD10 da matriz). Braço `!ticket_id` do legado fica PENDENTE (Boleto/
  // Ticket MISSING na API migrada, decisão de escopo já registrada em
  // FID-G3A — não inventar campo `ticket_id`/`has_ticket` aqui).
  const isAdvancePaymentLocked = isEditing && incomeData?.payment_type === 4;
  canSave = canSave && !isAdvancePaymentLocked;

  // ---- Duplicar (AM11, TASK-FE-036-320, B-11) — hidrata o form a partir do
  // DRAFT recebido via `state` do router (`duplicateDraft`, populado pela
  // listagem, `IncomeActionsMenu`/`index.tsx`, MESMA chave da Tarefa irmã
  // de Contas a Pagar, TASK-FE-036-122). Reaproveita a MESMA lógica de
  // mapeamento campo-a-campo de `fillForm` (edição) — com os 2 resets
  // gerais da doc-bruta: (1) `payment_type`/`dt_emission`/`due_date` sempre
  // o default de CRIAÇÃO (o draft já traz os 3 `null`, mas `payment_type`
  // do form não é nullable — reseta para `1`/Única, MESMO default de uma
  // criação em branco, `defaultValues.payment_type` acima); (2)
  // `categories` sempre reseta para `[]`, MESMO default de criação (Income
  // não seeda linha alguma no mount, diferente de Expense — nunca herda o
  // rateio original). `write_offs`/`documents` também não são clonados
  // (draft não os inclui). O draft só devolve `*_uuid` PLANOS (sem label)
  // — os selects reidratados resolvem o rótulo pelos MESMOS serviços já
  // usados na edição (`getClientByUuid`, etc.), fallback honesto ao uuid
  // truncado em caso de falha de rede, NUNCA inventado. ----
  const duplicateDraftAppliedRef = useRef(false);

  useEffect(() => {
    if (isEditing || duplicateDraftAppliedRef.current) return;
    const draft = (location.state as { duplicateDraft?: IncomeDuplicateDraft } | null)
      ?.duplicateDraft;
    if (!draft) return;

    duplicateDraftAppliedRef.current = true;
    // Limpa o `state` de navegação IMEDIATAMENTE — nunca reaplica o draft
    // num refresh/voltar da página de criação (DoD da Tarefa).
    navigate(location.pathname, { replace: true, state: null });
    void applyDuplicateDraft(draft);
  }, [isEditing, location.state, location.pathname, navigate]);

  async function applyDuplicateDraft(draft: IncomeDuplicateDraft) {
    let clientOption: Option<string> | null = null;
    if (draft.client_uuid) {
      try {
        const clientResponse = await getClientByUuid(draft.client_uuid);
        clientOption = { label: clientResponse.data.name, value: draft.client_uuid };
      } catch {
        // Fallback honesto (SEM MOCK) — mirror `handleXmlImported`.
        clientOption = { label: draft.client_uuid.slice(0, 8), value: draft.client_uuid };
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
      typeTitleOption = { label: draft.type_title_uuid.slice(0, 8), value: draft.type_title_uuid };
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
      client_uuid: clientOption,
      proprietary_uuid: proprietaryOption,
      harvest_uuid: harvestOption,
      // MESMO default de uma criação em branco (`defaultValues.payment_type`
      // acima) — `IncomeForm.payment_type` não é nullable; o draft já traz
      // `null`, doc-bruta CL-D03 (zerado junto com dt_emission/due_date).
      payment_type: 1,
      dt_emission: null,
      due_date: null,
      amount: draft.amount,
      discount: draft.discount ?? 0,
      penalty: draft.penalty ?? 0,
      interest: draft.interest ?? 0,
      perc_interest: draft.perc_interest ?? 0,
      increase: draft.increase ?? 0,
      note: draft.note ?? '',
      fiscal_document: !!draft.fiscal_document,
      is_locked: false,
      // Parcelamento nunca é clonado (relations_not_cloned_into_form).
      has_down_payment: false,
      down_payment_date: null,
      down_payment_value: null,
      qtd_installments: 1,
      first_due_date: null,
      interval_days: 30,
      installments: [],
      // Rateio SEMPRE volta ao default de criação (`[]`, Income não seeda
      // linha no mount) — nunca herda o rateio do título original.
      categories: [],
      // Baixa automática nunca é clonada (relations_not_cloned_into_form).
      automatic_writeoff: false,
      account_uuid: null,
      movement_date: null,
      xml_key: null,
      // DEC-115 (TASK-FE-036-344, §6, mirror `TASK-FE-036-125`) — o
      // `reset()` completo acima zera TODOS os campos não listados aqui
      // (RHF sem `keepValues`), inclusive um `farm_uuid` que o efeito de
      // default já tivesse hidratado antes do clique em "Duplicar" —
      // recalcula explicitamente aqui (mesma fórmula do efeito) em vez de
      // confiar num re-disparo do efeito (nenhuma dependência dele muda com
      // este `reset()`).
      farm_uuid:
        showFarmDestinationField && activeFarmUuid
          ? (() => {
              const activeFarm = myFarmsQuery.data?.find((farm) => farm.uuid === activeFarmUuid);
              return activeFarm ? { label: activeFarm.description, value: activeFarm.uuid } : null;
            })()
          : null,
    });

    toaster.success({
      title: text.list.actions.duplicate,
      description: text.form.hints.duplicateApplied,
    });
  }

  // ---- Gera Obrigação (UT-000796 r2) — pré-preenche a Nova Conta a Receber a
  // partir do rascunho do movimento Financiamento de SAÍDA (nomenclatura
  // invertida do legado: Saída gera Conta a RECEBER, cliente). Mesmo molde de
  // `CreateOrUpdateExpense.tsx`: `state.movementObligationDraft` (1º paint)
  // OU sessionStorage pelo ponteiro `?fromMovement=<uuid>` (refresh); NÃO
  // limpa ponteiro/storage ao aplicar; só criação; só APLICA valores
  // (`setValue`, sem `reset`/`isEmpty`/limpeza em efeito). O form de Contas a
  // Receber NÃO tem o campo Apropriação: `appropriation` do rascunho é
  // ignorado. `movement_uuid` (não visível no RHF) vai ao POST como chave
  // condicional.
  const [searchParams] = useSearchParams();
  const movementDraftAppliedRef = useRef(false);
  const [movementUuid, setMovementUuid] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing || movementDraftAppliedRef.current) return;
    const navState = location.state as
      (ObligationDraftNavigationState & { duplicateDraft?: unknown }) | null;
    if (navState?.duplicateDraft) return;

    const pointer = searchParams.get(OBLIGATION_DRAFT_QUERY_PARAM);
    const fromState = navState?.movementObligationDraft;
    if (!fromState && !pointer) return;

    movementDraftAppliedRef.current = true;
    const draft = isUsableObligationDraft(fromState, 'income', pointer)
      ? fromState
      : readObligationDraft(pointer, 'income');

    if (!draft) {
      toaster.info({
        title: text.singularLabel,
        description: text.form.hints.obligationDraftExpired,
      });
      navigate(location.pathname, { replace: true, state: null });
      return;
    }
    if (fromState) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
    void applyMovementObligationDraft(draft);
  }, [isEditing, location.state, location.pathname, location.search, navigate]);

  async function applyMovementObligationDraft(
    draft: NonNullable<ObligationDraftNavigationState['movementObligationDraft']>
  ) {
    const fields = mapObligationDraftToIncomeFields(draft);
    setMovementUuid(fields.movement_uuid);

    setValue('note', fields.note, { shouldDirty: true });
    setValue('amount', fields.amount, { shouldDirty: true, shouldValidate: true });
    setValue('interest', fields.interest, { shouldDirty: true });
    setValue('dt_emission', fields.dt_emission, { shouldDirty: true, shouldValidate: true });

    if (fields.client_uuid) {
      let clientLabel = fields.client_uuid.slice(0, 8);
      try {
        const clientResponse = await getClientByUuid(fields.client_uuid);
        clientLabel = clientResponse.data.name;
      } catch {
        // Fallback honesto (SEM MOCK): uuid truncado, usuário confirma.
      }
      setValue(
        'client_uuid',
        { label: clientLabel, value: fields.client_uuid },
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
      description: text.form.hints.obligationDraftApplied,
    });
  }

  // Cancelar: o movimento permanece salvo SEM título (legado). Apaga o
  // rascunho e avisa como recuperar (editar o movimento e salvar de novo).
  function handleCancel() {
    if (movementUuid) {
      clearObligationDraft(movementUuid);
      toaster.info({
        title: text.singularLabel,
        description: text.form.hints.obligationDraftDiscarded,
      });
    }
    navigate(-1);
  }

  const incomeMutation = useRequest({
    asyncFunction: tryPersistIncome,
    entityName: text.singularLabel,
    queryKey: queryKey.incomes.incomes,
    queryKey2: queryKey.incomes.income,
    typesRequest: isEditing ? 'update' : 'create',
    personalizedMessage: text.form.savedToast,
    actionSuccess: () => {
      // Rascunho de uma única abertura (legado): consumido no sucesso do POST.
      clearObligationDraft(movementUuid);
      navigate(-1);
    },
  });

  // Payload de escrita — divergência CRÍTICA vs. `tryPersistInvoice` (contrato
  // §3.4): no UPDATE, `installments[]` NUNCA é populado (o backend não o usa
  // nesse verbo) e `categories[]` só é enviado quando `!isLocked` (quando
  // bloqueado, a aba de Rateio nem é editável — GAP-FE-036-300).
  async function tryPersistIncome(data: IncomeFormType) {
    if (isEditing && incomeId) {
      // P0 (item 4, 036fix4) — o PUT NUNCA envia `installments` (nem `[]`):
      // a edição parcial de metadados de uma parcela (mudar só o "Número",
      // por exemplo — inclusive com o título JÁ BLOQUEADO por baixa ou em
      // forma Única) não carrega parcelamento algum; a chave nem é
      // aceita/usada pelo backend neste verbo (contrato §3.4/§4.3,
      // `IncomePayload.installments` — "o backend NÃO USA este campo no
      // PUT"). Enviar `installments: []` disparava a validação de array
      // (`installments deve ter pelo menos 1 itens`) mesmo sem nenhuma
      // intenção de mexer em parcelas — mirror `CreateOrUpdateExpense.tsx`,
      // que também OMITE (nunca envia `[]`) qualquer campo de parcelamento/
      // baixa automática fora do escopo do verbo atual.
      const payload: Partial<IncomePayload> = {
        number: data.number.trim(),
        client_uuid: data.client_uuid?.value ?? '',
        // Opcional (achado B-02) — NUNCA `''` quando ausente: a Request
        // valida `uuid` de verdade, string vazia falharia a regra (`null`
        // passa pelo `nullable`).
        proprietary_uuid: data.proprietary_uuid?.value ?? null,
        harvest_uuid: data.harvest_uuid?.value ?? null,
        note: data.note.trim(),
        fiscal_document: !!data.fiscal_document,
      };

      // Fix (036fix5, item 4) — `categories` NUNCA é enviado (nem `[]`)
      // quando o título está bloqueado por baixa: mirror EXATO do que já é
      // feito com `installments` (chave inteiramente OMITIDA no PUT, nunca
      // `[]`). Antes, a base do payload sempre incluía `categories: []`
      // mesmo bloqueado — o backend interpretava a chave PRESENTE (ainda
      // que vazia) como intenção de reescrever o rateio e cobrava
      // `categories` no 422, apesar da aba de Rateio estar visivelmente
      // desabilitada na UI (GAP-FE-036-300). O backend está relaxando essa
      // regra em paralelo; aqui garante que o front nunca dispara o
      // gatilho, com ou sem esse relaxamento.
      if (!isLocked) {
        payload.type_title_uuid = data.type_title_uuid?.value ?? '';
        payload.payment_type = data.payment_type;
        payload.dt_emission = data.dt_emission ?? '';
        payload.due_date = data.due_date ?? '';
        payload.amount = Number(data.amount);
        payload.discount = Number(data.discount ?? 0);
        payload.penalty = Number(data.penalty ?? 0);
        payload.interest = Number(data.interest ?? 0);
        payload.perc_interest = Number(data.perc_interest ?? 0);
        payload.increase = Number(data.increase ?? 0);
        payload.categories = data.categories.map((category) => ({
          category_uuid: category.category_uuid!,
          percentage: Number(category.percentage),
          center_uuid: category.center_uuid!,
          plan_account_uuid: category.plan_account_uuid ?? null,
        }));
      }

      return await updateIncome(incomeId, payload);
    }

    // CREATE — `installments[]` com N entradas (aba 314), `categories[]`
    // replicado a todas as parcelas pelo backend (Ponto Aberto §10.3 do
    // contrato, default: 1 bloco de rateio para o título todo).
    //
    // P0 (BLOQUEADOR, 036fix3) — Única(1)/Adiantamento(4) NÃO exigem
    // parcelamento manual (mirror `_forms.blade.php:720`, `handlePaymentType()`
    // só abre o modal de geração de parcelas para `paymentType==2`; e
    // `IncomeController::store` legado ~454: `qtd_installments=1` sempre que
    // não há `date_installments`, derivando a parcela única do próprio
    // `amount`/`due_date` do cabeçalho). A aba "Parcelamento" só existe/valida
    // para PARCELADA(2) (`showInstallmentsTab` abaixo, mirror
    // `CreateOrUpdateExpense.tsx::showInstallmentsTab`) — para as demais
    // formas, a ÚNICA parcela é derivada aqui, nunca gerada manualmente pelo
    // usuário.
    const isParcelada = data.payment_type === 2;
    const installmentsPayload = isParcelada
      ? data.installments.map((installment) => ({
          due_date: installment.due_date!,
          value: Number(installment.value),
        }))
      : [{ due_date: data.due_date ?? '', value: Number(data.amount) }];

    const payload: IncomePayload = {
      // Só no POST (o PUT ignora); a CHAVE é omitida — nunca `null`/`''`.
      ...(movementUuid ? { movement_uuid: movementUuid } : {}),
      number: data.number.trim(),
      type_title_uuid: data.type_title_uuid?.value ?? '',
      client_uuid: data.client_uuid?.value ?? '',
      // Opcional (achado B-02) — NUNCA `''`, ver comentário equivalente no
      // ramo de UPDATE acima.
      proprietary_uuid: data.proprietary_uuid?.value ?? null,
      payment_type: data.payment_type,
      dt_emission: data.dt_emission ?? '',
      due_date: data.due_date ?? '',
      amount: Number(data.amount),
      note: data.note.trim(),
      fiscal_document: !!data.fiscal_document,
      harvest_uuid: data.harvest_uuid?.value ?? null,
      discount: Number(data.discount ?? 0),
      penalty: Number(data.penalty ?? 0),
      interest: Number(data.interest ?? 0),
      perc_interest: Number(data.perc_interest ?? 0),
      increase: Number(data.increase ?? 0),
      installments: installmentsPayload,
      categories: data.categories.map((category) => ({
        category_uuid: category.category_uuid!,
        percentage: Number(category.percentage),
        center_uuid: category.center_uuid!,
        plan_account_uuid: category.plan_account_uuid ?? null,
      })),
      // B-05 (TASK-FE-036-340/342) — envio DEFENSIVO/forward-compatible:
      // populado SÓ quando o título foi criado a partir de um XML importado
      // (`handleXmlImported`). O backend HOJE IGNORA este campo no `store()`
      // (Achado crítico 1, TASK-FE-036-340 — nenhum dos 2 Form Requests de
      // Expense/Income tem `xml_key` em `rules()`), Gap de API já registrado
      // para fechar essa lacuna (mirror `chave`/`InvoiceRequest`, que já
      // persiste corretamente). Custo zero enviar mesmo assim — ativa
      // sozinho quando o Gap fechar.
      xml_key: data.xml_key ?? null,
      // DEC-115 (TASK-FE-036-344, §6, mirror `TASK-FE-036-125`) — enviado SÓ
      // quando o Select "Fazenda de destino" está visível (gate ligado); a
      // CHAVE é omitida (`undefined`), NUNCA `null`/`''`, quando o gate está
      // desligado — mirror da disciplina já documentada para uuids
      // opcionais (`proprietary_uuid` acima, `IncomePayload`).
      ...(showFarmDestinationField && data.farm_uuid?.value
        ? { farm_uuid: data.farm_uuid.value }
        : {}),
    };

    // Baixa automática — GAP-FE-036-303, elegível `payment_type` UNICA(1) OU
    // ADIANTAMENTO(4) + exatamente 1 parcela (guarda replicada aqui, mesma
    // condição de renderização da seção — nunca confiar só na UI estar
    // oculta). Achado B-04 (auditoria de fidelidade 2026-08): o legado força
    // baixa automática = Sim para Adiantamento — API já aceita
    // `automatic_writeoff` também para ADIANTAMENTO
    // (`StoreIncomeAction::in_array($data->payment_type, [UNICA, ADIANTAMENTO])`).
    const isEligibleForAutomaticWriteoff =
      (data.payment_type === 1 || data.payment_type === 4) && installmentsPayload.length === 1;
    if (isEligibleForAutomaticWriteoff && (data.automatic_writeoff || data.payment_type === 4)) {
      payload.automatic_writeoff = true;
      payload.account_uuid = data.account_uuid?.value ?? null;
      payload.movement_date = data.movement_date ?? null;
    }

    return await createIncome(payload);
  }

  // P0 (INC-R01/V-01, REAUDITORIA-036-2a-rodada + BLOQUEADOR 036fix3) — a
  // condição estava INVERTIDA: `isEmpty()` (`src/utils/isEmpty.ts`,
  // ERRO-FE-001) é MAL NOMEADA — retorna `true` quando o objeto TEM chaves,
  // não quando está vazio. `isEditing && isEmpty(dirtyFields)` (sem `!`)
  // significava "editando E COM alterações" → navegava para trás SEM
  // persistir exatamente no caso em que a edição precisava salvar; edição
  // sem nenhuma alteração (`dirtyFields` de fato vazio) caía no `else` e
  // disparava um PUT à toa. Corrigido com `!isEmpty(dirtyFields)` (mesmo
  // padrão do CaP, `CreateOrUpdateExpense.tsx::onSubmit`): só volta sem PUT
  // quando editando e NADA mudou (nada a salvar); qualquer outro caso
  // (criação, ou edição com campos sujos) persiste de verdade.
  async function onSubmit(data: IncomeFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await incomeMutation.mutateAsync(data);
    }
  }

  // Guarda `onInvalid` — cobre o FORM TODO, navega para a 1ª aba com erro e
  // mostra a mensagem real do 1º erro (mirror `CreateOrUpdateEquipamento.tsx`).
  function onInvalid(formErrors: FieldErrors<IncomeFormType>) {
    const erroredFieldNames = Object.keys(formErrors) as (keyof IncomeFormType)[];
    if (erroredFieldNames.length === 0) return;

    const erroredTab = erroredFieldNames
      .map((field) => FIELD_TAB_MAP[field])
      .find((tab): tab is IncomeTabKey => !!tab && tab !== tabValue);

    if (erroredTab) {
      setTabValue(erroredTab);
    }

    const firstErrorMessage = Object.values(formErrors).find(
      (fieldError): fieldError is { message?: string } =>
        !!fieldError && typeof fieldError === 'object' && 'message' in fieldError
    )?.message;

    toaster.error({
      title: isEditing ? text.form.title.edit : text.form.title.create,
      description: firstErrorMessage,
      duration: 6000,
    });
  }

  const isSubmitting = incomeMutation.isPending;

  const paymentTypeOptions = [
    { value: 1, label: text.form.paymentTypeOptions.unica },
    { value: 2, label: text.form.paymentTypeOptions.parcelada },
    { value: 4, label: text.form.paymentTypeOptions.adiantamento },
  ];

  const watchedPaymentType = watch('payment_type');
  const watchedAmount = watch('amount') ?? 0;
  const watchedNote = watch('note') ?? '';

  const isAdvancePayment = watchedPaymentType === 4;

  // Achado B-04/GAP-FE-036-303 (auditoria de fidelidade 2026-08) — o legado
  // força `automatic_writeoff=1` assim que a forma vira Adiantamento
  // (`_forms.blade.php:741-747`, `handlePaymentType()`). A lógica anterior
  // era INVERTIDA: a seção inteira sumia para o tipo 4 em vez de forçar
  // "Sim". A API já aceita baixa automática para ADIANTAMENTO
  // (`StoreIncomeAction`), então basta forçar o campo aqui.
  useEffect(() => {
    if (isAdvancePayment) {
      setValue('automatic_writeoff', true, { shouldDirty: true });
    }
  }, [isAdvancePayment, setValue]);

  // P0 (BLOQUEADOR, 036fix3) — limpa o array de parcelas geradas manualmente
  // ao sair de PARCELADA (mirror `CreateOrUpdateExpense.tsx`, mesmo racional:
  // evita que parcelas antigas fiquem "penduradas" no form state ao trocar de
  // Forma de Pagamento, mesmo não sendo mais enviadas no payload de Única/
  // Adiantamento — hidrata limpo se o usuário voltar para Parcelada depois).
  useEffect(() => {
    if (isEditing || watchedPaymentType === 2) return;
    setValue('installments', []);
    setValue('qtd_installments', 1);
    setValue('first_due_date', null);
  }, [watchedPaymentType, isEditing, setValue]);

  // INC-R19 (REAUDITORIA-036-2a-rodada) — só define o default na CRIAÇÃO
  // (mirror `_forms.blade.php:40`: `isset($item) ? $item->fiscal_document :
  // (use_fiscal == 0 ? '0' : '1')` — em edição o valor vem do próprio
  // registro, via `fillForm`). Roda 1x quando `tenantUseFiscal` deixa de ser
  // `undefined` (carregamento do farm atual).
  useEffect(() => {
    if (!isEditing && tenantUseFiscal !== undefined) {
      setValue('fiscal_document', tenantUseFiscal, { shouldDirty: false });
    }
  }, [isEditing, tenantUseFiscal, setValue]);

  // DEC-115 (TASK-FE-036-344, §6, mirror `TASK-FE-036-125`) — default do
  // Select "Fazenda de destino" = fazenda ATIVA (`activeFarmUuid`,
  // `useAuth()`), assim que `useMyFarms()` resolver a lista (precisa do
  // `description` para o label do Select). Mirror EXATO do racional do
  // efeito de `fiscal_document` acima: `dirtyFields.farm_uuid` como guarda
  // para nunca sobrescrever uma escolha manual do usuário enquanto a lista
  // ainda carrega.
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

  // P0 (BLOQUEADOR, 036fix3) — a aba "Parcelamento" só existe para
  // Forma de Pagamento=PARCELADA(2), mirror `_forms.blade.php:720`
  // (`handlePaymentType()` só abre o gerador de parcelas nesse caso) e
  // `CreateOrUpdateExpense.tsx::showInstallmentsTab`. Única(1)/Adiantamento(4)
  // NUNCA mostram/exigem parcelamento manual — a parcela única é derivada do
  // cabeçalho (`tryPersistIncome`, ver comentário no payload de criação).
  const showInstallmentsTab = !isEditing && watchedPaymentType === 2;
  // `watchedInstallments` só é populado quando a aba acima existe
  // (PARCELADA); para Única/Adiantamento a quantidade de parcelas é SEMPRE 1
  // (derivada do cabeçalho), então o gate extra `.length === 1` sobre um
  // array que nunca é preenchido pela UI nesses casos é redundante/obsoleto
  // — removido junto com a correção do bloqueador acima.
  //
  // Item 2 (036fix4, paridade com CaP) — Baixa Automática deixou de ser aba
  // própria (`Tabs.Trigger`/`Tabs.Content` removidos); a mesma condição de
  // elegibilidade agora só decide a exibição da SEÇÃO dentro da aba "Dados"
  // (mirror `CreateOrUpdateExpense.tsx`, seção sempre dentro do Cabeçalho).
  const showAutomaticWriteoffSection = !isEditing && (watchedPaymentType === 1 || isAdvancePayment);

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      subtitle={isEditing ? text.form.subtitle.edit : text.form.subtitle.create}
      headerActions={
        // B-05 (TASK-FE-036-342) — SÓ na criação, mirror do legado
        // (`DOC-BRUTA-B05 §C`, "Edit... não há upload/reprocessamento XML
        // alcançável") e do precedente `CreateOrUpdateInvoice.tsx:756-765`.
        !isEditing ? (
          <Button
            title={text.form.xmlImport.buttonLabel}
            icon={FiUpload as any}
            variant="outline"
            size="sm"
            onClick={xmlUploadModal.onOpen}
            disabled={isSubmitting}
          />
        ) : undefined
      }
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={handleCancel}
          />
          {canSave && (
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit, onInvalid)}
              languageGB={languageGB}
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
          segment="incomes"
          onImported={handleXmlImported}
          texts={text.form.xmlImport}
        />
      )}

      <Form noPadding onSubmit={handleSubmit(onSubmit, onInvalid)}>
        {isLocked && (
          <Field mb={6}>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="fg.error"
              bg="feedBack.error"
              borderRadius="md"
              px={4}
              py={3}
              width="full"
            >
              {text.form.lockedBanner.title} — {text.form.lockedBanner.description}
            </Text>
          </Field>
        )}

        {/* TASK-FE-036-320 — mesmo padrão visual do banner `isLocked` acima
            (reaproveitado, não reinventado — Passo UX), motivo distinto:
            Adiantamento, não parcela com baixa. */}
        {isAdvancePaymentLocked && (
          <Field mb={6}>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="fg.error"
              bg="feedBack.error"
              borderRadius="md"
              px={4}
              py={3}
              width="full"
            >
              {text.form.advancePaymentLockedBanner.title} —{' '}
              {text.form.advancePaymentLockedBanner.description}
            </Text>
          </Field>
        )}

        {/* @ts-ignore - custom variant */}
        <Tabs.Root
          value={tabValue}
          onValueChange={(details: { value: string }) => setTabValue(details.value as IncomeTabKey)}
          variant="outline"
        >
          {/* @ts-ignore - Tab List fixa (sticky) no topo do body: as abas ficam
              sempre visíveis; só o conteúdo da aba rola. `bg` cobre o conteúdo
              que passa por baixo ao rolar. */}
          <Tabs.List position="sticky" top="0" zIndex={1} bg="formBG">
            {/* @ts-ignore */}
            <Tabs.Trigger value="data">{text.form.tabs.data}</Tabs.Trigger>
            {showInstallmentsTab && (
              // @ts-ignore
              <Tabs.Trigger value="installments">{text.form.tabs.installments}</Tabs.Trigger>
            )}
            {/* @ts-ignore */}
            <Tabs.Trigger value="apportionment">{text.form.tabs.apportionment}</Tabs.Trigger>
          </Tabs.List>

          {/* @ts-ignore */}
          <Tabs.Content value="data">
            <SimpleGrid columns={columnsForm.default} gap={6} pt={4}>
              <Input
                label={text.form.fields.number}
                placeholder={text.form.placeholders.number}
                // TASK-FE-036-326 (FID-G3F FLD07/OQ02) — o back migrado
                // padronizou em 15 (resolvendo a divergência legada 15/14 a
                // favor do maior valor); `maxLength` só trava a digitação,
                // o Yup abaixo (`income-schema.ts`) bloqueia o submit.
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
                    label={text.form.fields.typeTitle}
                    placeholder={text.form.placeholders.typeTitle}
                    // P0 (item D-1 da auditoria de fidelidade 2026-08) —
                    // `listTypeTitles` batia em `/type-titles`, gateado por
                    // `typetitles_view` (permissão do CRUD próprio de Tipos de
                    // Título) — usuário com `incomes_create`/`incomes_edit`
                    // mas SEM `typetitles_view` via 403/select vazio. Mirror
                    // `CreateOrUpdateInvoice.tsx` — `/type-titles/options` é
                    // ungated (`auth:sanctum` só) e já força `is_enabled=true`
                    // no servidor (`ListTypeTitleOptionsAction`), fechando
                    // também o achado D-2 sem precisar de parâmetro extra.
                    service={listTypeTitleOptions}
                    mapOptions={(item: TypeTitleOptionItem) => ({
                      label: item.description,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={errors.type_title_uuid?.message as string | undefined}
                    isRequired
                    isDisabled={!canSave || isLocked}
                  />
                )}
              />

              <Controller
                name="client_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.form.fields.client}
                    placeholder={text.form.placeholders.client}
                    service={listClients}
                    mapOptions={(item: ClientListItem) => ({
                      label: item.name,
                      value: item.uuid,
                    })}
                    // INC-R23 (REAUDITORIA-036-2a-rodada) — o serviço não
                    // enviava `is_enabled=true`; clientes inativos podiam
                    // aparecer no select e serem rejeitados só no submit.
                    // Mirror `CreateOrUpdateContratoVenda.tsx`.
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                      is_enabled: true,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={errors.client_uuid?.message as string | undefined}
                    isRequired
                    isDisabled={!canSave}
                    // Item 1 (036fix4) — força reler a página 1 depois
                    // de criar/editar um cliente pelo modal ao lado,
                    // mirror EXATO `CreateOrUpdateExpense.tsx`.
                    cacheUniqs={[clientOptionsCacheKey]}
                    // EST-07 — botão ÚNICO criar/editar Cliente migrado do
                    // `IconButton` avulso para o `labelAction`, reusa 100% o
                    // `ClientFormModal` genérico. Ícone contextual: `FiPlus`
                    // vazio (criar), `FiEdit` com cliente selecionado
                    // (editar aquele mesmo registro).
                    labelActionTooltip={
                      field.value
                        ? text.form.actions.editClientAria
                        : text.form.actions.addClientAria
                    }
                    labelAction={
                      <IconButton
                        aria-label={
                          field.value
                            ? text.form.actions.editClientAria
                            : text.form.actions.addClientAria
                        }
                        variant="ghost"
                        size="2xs"
                        minH="0"
                        h="20px"
                        w="20px"
                        minW="0"
                        p="0"
                        disabled={!canSave || !(can('clients_create') || can('clients_edit'))}
                        onClick={clientModalDisclosure.onOpen}
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
                name="proprietary_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.form.fields.proprietary}
                    placeholder={text.form.placeholders.proprietary}
                    service={listProprietaries}
                    mapOptions={(item: ProprietaryListItem) => ({
                      label: item.name,
                      value: item.uuid,
                    })}
                    // INC-R23 — mesma correção de `client_uuid` acima.
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                      is_enabled: true,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={errors.proprietary_uuid?.message as string | undefined}
                    // Opcional (achado B-02, auditoria de fidelidade 2026-08)
                    // — o legado não exige proprietário; `IncomeRequest`
                    // valida `proprietary_uuid` como `nullable`.
                    isDisabled={!canSave}
                  />
                )}
              />

              <Controller
                name="harvest_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.form.fields.harvest}
                    placeholder={text.form.placeholders.harvest}
                    service={listHarvests}
                    mapOptions={(item: Harvest) => ({ label: item.description, value: item.uuid })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isDisabled={!canSave}
                  />
                )}
              />

              {/* DEC-115 (TASK-FE-036-344, §6, mirror `TASK-FE-036-125`) —
                  Select "Fazenda de destino", visível só em CRIAÇÃO com
                  `tenant.list_all_farms===true`; universo pequeno
                  (`useMyFarms()`, MESMA fonte do `FarmSwitcher`), por isso
                  `Select` comum (não `SelectAsyncPaginate` — não pagina nem
                  busca server-side). */}
              {showFarmDestinationField && (
                <Controller
                  name="farm_uuid"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={text.form.fields.farmDestination}
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

              <Controller
                name="payment_type"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.form.fields.paymentType}
                    name={name}
                    value={paymentTypeOptions.find((o) => o.value === value) ?? null}
                    onChange={(opt: any) => onChange(opt?.value)}
                    options={paymentTypeOptions}
                    isRequired
                    isDisabled={!canSave || isLocked}
                  />
                )}
              />

              <Controller
                name="dt_emission"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Field
                    label={text.form.fields.dtEmission}
                    isRequired
                    errorText={errors.dt_emission?.message}
                  >
                    <DateInput value={value} onChange={onChange} disabled={!canSave} />
                  </Field>
                )}
              />

              <Controller
                name="due_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Field
                    label={text.form.fields.dueDate}
                    isRequired
                    errorText={errors.due_date?.message}
                  >
                    <DateInput value={value} onChange={onChange} disabled={!canSave || isLocked} />
                  </Field>
                )}
              />

              <Controller
                name="amount"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <MoneyInput
                    name={name}
                    label={text.form.fields.amount}
                    value={value}
                    onValueChange={onChange}
                    error={error?.message}
                    isRequired
                    disabled={!canSave || isLocked}
                  />
                )}
              />

              <Controller
                name="discount"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <MoneyInput
                    name={name}
                    label={text.form.fields.discount}
                    value={value}
                    onValueChange={onChange}
                    disabled={!canSave || isLocked}
                  />
                )}
              />

              <Controller
                name="penalty"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <MoneyInput
                    name={name}
                    label={text.form.fields.penalty}
                    value={value}
                    onValueChange={onChange}
                    disabled={!canSave || isLocked}
                  />
                )}
              />

              <Controller
                name="interest"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <MoneyInput
                    name={name}
                    label={text.form.fields.interest}
                    value={value}
                    onValueChange={onChange}
                    disabled={!canSave || isLocked}
                  />
                )}
              />

              <Controller
                name="perc_interest"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <NumberInput
                    name={name}
                    label={text.form.fields.percInterest}
                    value={value}
                    onValueChange={onChange}
                    allowDot
                    decimalPlaces={2}
                    disabled={!canSave || isLocked}
                  />
                )}
              />

              <Controller
                name="increase"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <MoneyInput
                    name={name}
                    label={text.form.fields.increase}
                    value={value}
                    onValueChange={onChange}
                    disabled={!canSave || isLocked}
                  />
                )}
              />

              <Controller
                name="fiscal_document"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Field label={text.form.fields.fiscalDocument}>
                    <Switch
                      checked={!!value}
                      onCheckedChange={(d: { checked: boolean }) => onChange(d.checked)}
                      // INC-R19 — readonly quando `tenant.use_fiscal=false`
                      // (mirror legado, independe de create/edição).
                      disabled={!canSave || isFiscalDocumentReadonly}
                    />
                  </Field>
                )}
              />
            </SimpleGrid>

            {/* Fix (036fix5, item 1) — `mt` NÃO pode ir direto na prop do
                `Textarea`: o componente espalha `...rest` só no
                `ChakraTextarea` interno (dentro do `Field`, abaixo do
                label), nunca no `Field.Root` — o resultado empurrava o
                CAMPO para longe do próprio label (gap entre os dois),
                destoando do restante do form. Mirror `CreateOrUpdateExpense.
                tsx` (`<Box mt={2}>` envolvendo o Textarea de "Histórico"
                por fora) — o espaçamento fica no CONTAINER, label e campo
                permanecem colados como os demais. */}
            <Box mt={6}>
              <Textarea
                label={text.form.fields.note}
                placeholder={text.form.placeholders.note}
                {...register('note')}
                error={errors.note?.message}
                // Histórico obrigatório + máximo 800 + contador — mirror
                // legado (`_forms.blade.php` histórico `required` +
                // `maxlength="800"` com contador visível, auditoria de
                // fidelidade 2026-08).
                isRequired
                maxLength={800}
                helperText={text.form.noteCounterLabel.replace(
                  '{count}',
                  String(watchedNote.length)
                )}
                disabled={!canSave}
              />
            </Box>

            {/* Item 2 (036fix4, paridade com CaP) — seção "Baixa Automática"
                embutida na aba "Dados" (mirror `CreateOrUpdateExpense.tsx`,
                seção sempre dentro do Cabeçalho) — deixou de ser aba
                separada. Mesma condição de elegibilidade de antes
                (`showAutomaticWriteoffSection`, payment_type UNICA/
                ADIANTAMENTO + criação). */}
            {showAutomaticWriteoffSection && (
              <Box mt={6} p={4} bg="bg.muted" borderRadius="lg">
                <Text fontSize="sm" fontWeight="semibold" mb={4}>
                  {text.form.sections.automaticWriteoff}
                </Text>
                <IncomeAutomaticWriteoffSection
                  control={control}
                  watch={watch}
                  setValue={setValue}
                  isLoading={!!isLoading}
                  canSave={canSave}
                  forcedByAdvance={isAdvancePayment}
                />
              </Box>
            )}
          </Tabs.Content>

          {showInstallmentsTab && (
            // @ts-ignore
            <Tabs.Content value="installments">
              <IncomeInstallmentsTab
                control={control}
                errors={errors}
                watch={watch}
                setValue={setValue}
                isLoading={!!isLoading}
                canSave={canSave}
                totalAmount={watchedAmount}
              />
            </Tabs.Content>
          )}

          {/* @ts-ignore */}
          <Tabs.Content value="apportionment">
            <IncomeApportionmentTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canSave}
              isLocked={isLocked}
              totalAmount={watchedAmount}
              incomeData={incomeData}
            />
          </Tabs.Content>
        </Tabs.Root>
      </Form>

      {/* Item 1 (036fix4, paridade com CaP/B15) — modal de criar/editar
          Cliente. `client_uuid` lido direto de `watch` (não um `useState`
          paralelo) — o modal sempre reflete o valor ATUAL do campo deste
          formulário, mirror EXATO `CreateOrUpdateExpense.tsx`/
          `CreateOrUpdateNfe.tsx`. */}
      <ClientFormModal
        isOpen={clientModalDisclosure.open}
        onClose={clientModalDisclosure.onClose}
        clientUuid={watch('client_uuid')?.value}
        onSaved={(client) => {
          setValue(
            'client_uuid',
            { value: client.uuid, label: client.label },
            { shouldDirty: true, shouldValidate: true }
          );
          setClientOptionsCacheKey((key) => key + 1);
        }}
      />
    </FormContainer>
  );
}
