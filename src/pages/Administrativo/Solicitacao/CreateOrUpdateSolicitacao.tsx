// src/pages/Administrativo/Solicitacao/CreateOrUpdateSolicitacao.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de Solicitação de Compras (RequestPurchase —
// Administrativo / Suprimentos, esteira 97-Esteiras/022, TASK-RP-FE-09).
// MESMO arquivo para os dois casos (`isEditing = isValidGuid(requestPurchaseId)`,
// mirror `CreateOrUpdateProduto.tsx`/`CreateOrUpdateEquipamento.tsx`). Rotas
// previstas `/administrativo/solicitacao/novo` e `/:requestPurchaseId`
// (`RequestPurchase-FrontEnd-contrato.md §4`) — wiring real de rota é
// `TASK-RP-FE-10` (NÃO tocado aqui).
//
// Dados Gerais (ESTE arquivo, inline) fica FIXO acima das abas (25/11); as
// abas (`Tabs.Root`, `useCustomSearch(1)`, valores mantidos para não quebrar
// `?tab=`): 1 "Itens" (`RequestItemRow`, TASK-RP-FE-07), 2
// "Anexos" (`RequestAttachmentRow`, TASK-RP-FE-07), 3 "Histórico"
// (`RequestMovementHistory`, TASK-RP-FE-07), 4 "Cotações"
// (`RequestQuotationTab`, Pattern 12 — Cards em Tab, TASK-CQ-FE-03) — as
// abas 3 e 4 ficam AUSENTES em modo criação (Modelo C Regra 1 do pattern:
// não existe `movements[]`/`RequestQuotation` antes do 1º `POST`).
//
// `useCustomFormQueryByGuid` (mirror `DiagnosisPregnancy`, NÃO um wrapper
// `useRequestPurchases.tsx` — mandato explícito da Tarefa) + `fillForm`
// nomeada com guarda `!isEmpty(dirtyFields) || resetForce` (Lei 2 — o `!` é
// OBRIGATÓRIO, `isEmpty()` é mal nomeada: retorna `true` quando HÁ chaves).
//
// `type` é IMUTÁVEL após a criação (regra 14, contrato de API §4) — `disabled`
// quando `isEditing`, com `helperText` explicando que é regra de negócio (não
// falta de permissão) — ADITIVO de i18n `form.hints.typeLockedOnEdit`
// (`TASK-RP-FE-03` não abriu essa chave, mesma classe de aditivo já registrada
// em `attachmentsSection.fileUpload`/`itemStatusOptions`).
//
// ⚠️ ERRO-FE corrigido (2026-08-06): o backend (`RequestPurchaseRequest::
// rules()`) exige `type` como `required` TAMBÉM no update (a imutabilidade é
// validada DEPOIS, comparando com o valor persistido) — o payload de update
// PRECISA carregar `type`, com o valor ORIGINAL/imutável. Como o campo fica
// `isDisabled` na UI (regra 14 acima), `tryPersistRequestPurchase` NÃO confia
// no valor submetido de `data.type` como fonte única — usa
// `requestPurchaseData.type` (o dado cru carregado do servidor, nunca editável
// pela UI) como fonte de verdade no update, com `data.type?.value` só como
// fallback defensivo caso o detalhe ainda não tenha resolvido. Isso garante o
// valor correto independente de qualquer comportamento de campo desabilitado
// do React Hook Form.
//
// Multipart (`FormData`, por causa de `attachments[].file`) — `tryPersist
// RequestPurchase` monta o `RequestPurchasePayload`, o SERVICE
// (`buildRequestPurchaseFormData`, TASK-RP-FE-06) é quem converte para
// `FormData` — este arquivo não duplica essa lógica, mas garante que `type`
// chega preenchido no payload (create e update) antes de chamar o service.
//
// -- Ações de trâmite (receive/transfer/change-status/finish/quotation-
//    justification) — leitura + divergência declarada (transparência) -------
// O task-packet desta Tarefa descreve as 5 ações como "visíveis conforme
// `available_status_transitions[]`" (DA-RP-11). Verificação real contra o
// contrato de API (`RequestPurchase-contrato.md` DA-RP-08/09/10/11 + §5
// Permissões): `available_status_transitions[]` é uma lista calculada
// SÓ PARA a ação `change-status` (as opções de novo status já filtradas
// server-side) — `receive`/`transfer`/`finish`/`quotation-justification` são
// endpoints independentes, cada um com sua própria regra de idempotência/
// permissão, sem depender do conteúdo desse array. Decisão adotada aqui (não
// escolhida em silêncio):
//   - "Mudar Status" só aparece quando `available_status_transitions.length >
//     0` (uso literal do array, fiel a DA-RP-11) + `request-purchases_edit`.
//   - "Receber" só aparece quando NINGUÉM assumiu ainda (`!responsible`,
//     idempotência negativa real de DA-RP-08) + `request-purchases_edit`.
//   - "Transferir" aparece com `request-purchases_transfer` (permissão
//     dedicada, §5 do contrato).
//   - "Finalizar"/"Justificativa de Cotação" aparecem com
//     `request-purchases_edit` (mesma permissão do `update`, §5).
//   - TODAS as 5 ficam ocultas quando o status atual já é terminal
//     (`pedidoFinalizado`/`pedidoCancelado`) — nenhuma ação de trâmite faz
//     sentido depois disso; guarda de UX, não uma regra literal do contrato.
// `transfer`/`change-status`/`quotation-justification` abrem `CustomDialog`
// (campo de justificativa/`Select` de novo status); `receive`/`finish` não
// têm payload — disparo direto do `useRequest` correspondente, cada um com
// `queryKey2: queryKey.requestPurchases.requestPurchase` para invalidar o
// detalhe (nome real do namespace, confirmado em `query-key.ts`/`index.tsx`
// desta mesma pasta — o task-packet cita "`queryKey.administrativo.
// requestPurchase`", namespace que NÃO existe no projeto, mesma classe de
// divergência já registrada no contrato de tela §2).
//
// UT-000743 — Safra, Solicitação pai e NF-e SAÍRAM do formulário de criar/editar
// (paridade com o legado) e o payload não carrega `harvest_uuid`/`parent_uuid`/
// `nfe` (a API preserva esses dados quando a chave é omitida no PUT). O Código
// é SOMENTE LEITURA em todos os modos: no criar mostra o PRÓXIMO CÓDIGO
// PREVISTO (`GET /request-purchases/next-code`, preview sem reserva — o
// definitivo vem no 201 e é informado no toast); em editar/visualizar vem do
// detalhe. Na visualização a NF-e continua visível, somente leitura.
//
// Guarda `onInvalid` (armadilha de formulário com abas — erro só visível numa
// aba que não é a atual): cobre o FORM TODO, navega para a 1ª aba com erro e
// mostra um toast com a mensagem REAL do 1º erro (mirror `CreateOrUpdate
// Equipamento.tsx`/`CreateOrUpdateProduto.tsx`).
//
// Botão de submit FORA do `<form>` (`FormContainer footer`, mirror
// `CreateOrUpdateTrough.tsx`): `<Form id="request-purchase-form">` + botão no
// footer com `type="submit" form="request-purchase-form"` — "Cancelar" à
// esquerda, "Salvar" à direita (regra global de UX nº2, botão SEMPRE
// "Salvar", nunca "Criar"/"Atualizar"/"Salvar e Adicionar").
//
// Sem Zustand (itens/anexos vivem no próprio `useForm` via `useFieldArray`,
// já implementado por `RequestItemRow`/`RequestAttachmentRow`, TASK-RP-FE-07)
// e sem guarda de `hasFarm` (DA-RP-02 — tenancy TENANT INTEIRO, não fazenda
// ativa; mesmo precedente já assumido pela listagem, `TASK-RP-FE-08`/
// `index.tsx` desta pasta, que também não gateia por `hasFarm`).
//
// -- Execução 081 / T-081-FE-05 (paridade com o legado) -----------------------
// - "Solicitante" e "Data do Pedido" SOMENTE LEITURA (data default = hoje);
//   "Prioridade" nasce Média; "Descrição/Chamado" e observação com máx. 800.
// - "Encarregado": opções de `GET request-purchases/authorizer-options`
//   (limitadas aos chefes do solicitante), obrigatório quando
//   `meta.requires_authorizer`; hidrata por `second_request_authorizer`.
// - Trocar o tipo (só na criação) recomeça os itens (1 linha) e, em F/E/U, os
//   anexos (1 linha), como as abas por tipo do legado.
// - Barra de trâmite pelas regras de `supplyActionRules`: "Transferir" abre o
//   `TransferResponsibleDialog` (novo responsável + justificativa), "Voltar
//   Etapa" abre o `StepBackDialog` (justificativa obrigatória, máx. 800) e
//   "Receber" não tem gate de permissão (T-081-API-03). O adaptador temporário
//   da FE-01 (diálogo "Mudar Status" inline) foi removido.
// - Visualização: seções extras em `RequestPurchaseViewSections`.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react';

import { Box, Flex, SimpleGrid, Tabs, Text, useDisclosure } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { StepBackDialog } from '@/components/Suprimentos/StepBackDialog';
import {
  canReceive as canReceiveRule,
  canStepBack,
  canTransfer as canTransferRule,
  isResponsible,
} from '@/components/Suprimentos/supplyActionRules';
import { TransferResponsibleDialog } from '@/components/Suprimentos/TransferResponsibleDialog';
import { useSupplyActionContext } from '@/components/Suprimentos/useSupplyActionContext';
import { StatusTag } from '@/components/ui/StatusTag';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomSearch } from '@/hooks/useCustomSearch';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import {
  requestPurchasePriorityOptions,
  requestPurchaseTypeOptions,
} from '@/constants/RequestPurchases/options';
import { requestPurchasePriority } from '@/constants/RequestPurchases/request-purchase-priority';
import {
  requestPurchaseStatus,
  requestPurchaseStatusDotToken,
} from '@/constants/RequestPurchases/request-purchase-status';
import type { RequestPurchaseStatus } from '@/constants/RequestPurchases/request-purchase-status';

import { requestPurchaseSchemaResolver } from '@/validations/schemas/RequestPurchases/request-purchase-schema';

import {
  addQuotationJustification,
  createRequestPurchase,
  finishRequestPurchase,
  getNextRequestPurchaseCode,
  getRequestPurchase,
  listAuthorizerOptions,
  receiveRequestPurchase,
  updateRequestPurchase,
} from '@/services/v2/RequestPurchases/request-purchase-service';
import type { AddQuotationJustificationPayload } from '@/services/v2/RequestPurchases/request-purchase-service';

import type { Option } from '@/@types/option';
import type {
  RequestPurchaseData,
  RequestPurchaseForm as RequestPurchaseFormType,
} from '@/@types/v2/RequestPurchases';

import { getInitialRequestType } from './initialRequestType';
import { attachmentsRequired, emptyAttachmentRow, emptyItemRow } from './itemRowGuards';
import { RequestAttachmentRow } from './RequestAttachmentRow';
import { RequestItemRow } from './RequestItemRow';
import { RequestMovementHistory } from './RequestMovementHistory';
import { buildAuthorizerOption } from './requestPurchaseLabels';
import { buildRequestPurchasePayload } from './requestPurchasePayload';
import {
  availableViewSections,
  RequestPurchaseViewSections,
  type RequestPurchaseViewSection,
} from './RequestPurchaseViewSections';
import { RequestQuotationAuthorizerDialog } from './RequestQuotationAuthorizerDialog';
import { RequestQuotationTab } from './RequestQuotationTab';
import { PurchaseOrderProcessBar } from './prototype/PurchaseOrderProcessBar';
import { PrototypeItemsTable } from './prototype/PrototypeItemsTable';
import { PrototypeApprovalsTable } from './prototype/PrototypeApprovalsTable';
import { DuplicateOrderDialog } from './prototype/DuplicateOrderDialog';
import { PrototypeOrderActions } from './prototype/PrototypeOrderActions';
import { categoryOfType, markOfType } from './prototype/purchaseOrderCategories';
import { isDuplicateOrderState } from './prototype/duplicateOrder';
import type { PrototypePurchaseOrder } from './prototype/prototypeFields';
import { PURCHASE_ORDER_PROTOTYPE } from '@/config/v2/purchaseOrderPrototype';

// Mapeamento de campo → aba (0 Dados Gerais / 1 Itens / 2 Anexos) — usado só
// pelo `onInvalid` para navegar até a 1ª aba com erro. "Histórico" (3) nunca
// tem erro (read-only).
// Abas extras da visualização (depois de Cotações = 4).
const VIEW_SECTION_TAB: Record<RequestPurchaseViewSection, number> = {
  authorization: 5,
  receipt: 6,
  ratio: 7,
  children: 8,
  delivery: 9, // protótipo
  links: 10, // protótipo
  payment: 11, // protótipo
  invoices: 12, // protótipo
};

const FIELD_TAB_MAP: Partial<Record<keyof RequestPurchaseFormType, number>> = {
  type: 0,
  request_date: 0,
  justification: 0,
  description: 0,
  priority: 0,
  authorizer_uuid: 0,
  observation: 0,
  items: 1,
  attachments: 2,
};

export default function CreateOrUpdateSolicitacao() {
  const { requestPurchaseId } = useParams<{ requestPurchaseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Modo somente-leitura: rota `/:id/visualizar` (paridade com a ação
  // "Visualizar" do legado, sempre disponível independente do status). Reusa o
  // mesmo componente, padrão dos módulos /visualizar do projeto.
  const isViewRoute = location.pathname.replace(/\/+$/, '').endsWith('/visualizar');
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:requestPurchaseId`).
  const isEditing = isValidGuid(requestPurchaseId);
  const initialRequestType = getInitialRequestType(location.search, isEditing);

  // Guard de navegação: `requestPurchaseId` presente mas NÃO é um GUID válido
  // (URL adulterada) — redireciona para a listagem (mirror
  // `CreateOrUpdateProduto.tsx`/`CreateOrUpdateEquipamento.tsx`).
  useEffect(() => {
    if (requestPurchaseId && !isValidGuid(requestPurchaseId)) {
      navigate('/administrativo/solicitacao', { replace: true });
    }
  }, [requestPurchaseId, navigate]);

  const text = languageGB.requestPurchases.requestPurchase;

  const canCreate = can('request-purchases_create');
  const canEdit = can('request-purchases_edit');
  const { user: loggedUser } = useAuth();
  const supplyContext = useSupplyActionContext();

  // Encarregados permitidos ao solicitante (DEP-API-04): `meta.requires_authorizer`
  // diz se o campo é obrigatório. Sem consulta na visualização (campo só leitura).
  const authorizerOptionsQuery = useQuery({
    queryKey: [queryKey.requestPurchases.authorizerOptions],
    queryFn: listAuthorizerOptions,
    enabled: !isViewRoute,
    refetchOnWindowFocus: false,
  });
  const requiresAuthorizer = authorizerOptionsQuery.data?.requiresAuthorizer ?? false;

  // UT-000743 — Código PREVISTO (só no criar; preview sem reserva, fora do
  // `useForm`: o código nunca entra no payload). Falha/403 → estado de erro
  // local do campo, sem bloquear o salvar.
  const nextCodeQuery = useQuery({
    queryKey: [queryKey.requestPurchases.nextCode],
    queryFn: getNextRequestPurchaseCode,
    enabled: !isEditing && !isViewRoute && canCreate,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, dirtyFields },
  } = useForm<RequestPurchaseFormType>({
    mode: 'onChange',
    resolver: requestPurchaseSchemaResolver(languageGB, { requiresAuthorizer }) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      // Nova OS: `?tipo=S` (porta "O que você precisa?") pré-seleciona o tipo na criação.
      type: initialRequestType
        ? requestPurchaseTypeOptions.getOption(initialRequestType, languageGB)
        : null,
      // "Data do Pedido" somente leitura, default hoje (legado FM03).
      request_date: format(new Date(), 'yyyy-MM-dd'),
      justification: '',
      description: '',
      // "Prioridade" nasce Média (legado FM04).
      priority:
        requestPurchasePriorityOptions
          .options(languageGB)
          .find((option) => option.value === requestPurchasePriority.media) ?? null,
      authorizer_uuid: null,
      observation: '',
      items: [],
      attachments: [],
    },
  });

  // UT-000757 — o Encarregado salvo (`second_request_authorizer`, hidratado
  // por `fillForm`/`buildAuthorizerOption`) pode não estar entre as opções de
  // `authorizer-options` (chefes do USUÁRIO LOGADO agora, que podem divergir
  // do solicitante original) — e em `/visualizar` as opções nem são buscadas
  // (`authorizerOptionsQuery` tem `enabled: !isViewRoute`, options sempre
  // `[]`). O `Select` (Chakra v3/zag) só exibe o rótulo quando o `value`
  // bate com uma option da `collection` (`Select.tsx`) — sem essa opção
  // injetada o campo aparece vazio mesmo com o form corretamente hidratado.
  // Fix: compor a lista com o valor atualmente selecionado quando ele não
  // estiver entre as opções carregadas, sem duplicar por `value`. NÃO muda a
  // regra de quem aparece como opção (chefes do usuário logado) nem a API.
  const selectedAuthorizerOption = watch('authorizer_uuid');
  const authorizerSelectOptions: Option<string>[] = useMemo(() => {
    const baseOptions: Option<string>[] = (authorizerOptionsQuery.data?.options ?? []).map(
      (item) => ({ label: item.name, value: item.uuid })
    );
    if (
      selectedAuthorizerOption &&
      !baseOptions.some((option) => option.value === selectedAuthorizerOption.value)
    ) {
      return [selectedAuthorizerOption, ...baseOptions];
    }
    return baseOptions;
  }, [authorizerOptionsQuery.data, selectedAuthorizerOption]);

  // Abas (`useCustomSearch(0)`, mandato explícito da Tarefa) — 0 Dados
  // Gerais / 1 Itens / 2 Anexos / 3 Histórico (só em edição).
  const { tabIndex, handleTabsChange } = useCustomSearch(1);
  // Dados Gerais saiu das abas (fica fixo acima delas): `?tab=0` ou ausente
  // abre Itens, a 1ª aba.
  const activeTab = tabIndex === 0 ? 1 : tabIndex;
  const generalRef = useRef<HTMLDivElement>(null);

  function fillForm(data: RequestPurchaseData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        type: { label: data.type_label, value: data.type },
        request_date: data.request_date,
        justification: data.justification,
        description: data.description,
        priority:
          data.priority !== null && data.priority !== undefined
            ? { label: data.priority_label, value: data.priority }
            : null,
        // DD-078-04 — `authorizer` expõe `{uuid, name}` (`requestAuthorizer.
        // user.name`). Sem `name` no payload → placeholder honesto, NUNCA o
        // uuid; o `value` (uuid) segue preservado para salvar sem alterar.
        authorizer_uuid: buildAuthorizerOption(data),
        observation: data.observation ?? '',
        items: (data.items ?? []).map((row) => ({
          item_uuid: row.uuid,
          product_uuid: row.product
            ? { label: row.product.description, value: row.product.uuid }
            : null,
          quantity: row.quantity ?? null,
          amount: row.amount ?? null,
          name: row.name ?? null,
          nif: row.nif ?? null,
          phone: row.phone ?? null,
          // ADITIVO — gap de caminho-de-escrita corrigido nesta Tarefa (Doc
          // Bruta §12): `description` existia na LEITURA mas nunca chegava
          // ao form (`fillForm`), mirror `service_description` abaixo.
          description: row.description ?? null,
          service_description: row.service_description ?? null,
          daily_quantity: row.daily_quantity ?? null,
          brand: row.brand ?? null,
          observation: row.observation ?? null,
          delivery_date: row.delivery_date ?? null,
        })),
        // `attachments` vem eager-loaded no detalhe (T-081-API-04, PR-E05): a edição
        // reenvia as linhas mantidas por `attachment_uuid`.
        attachments: (data.attachments ?? []).map((row) => ({
          attachment_uuid: row.uuid,
          name: row.name ?? null,
          file: null,
        })),
      });
    }
  }

  // PROTÓTIPO — Duplicar: na CRIAÇÃO, vem preenchida com o estado de navegação
  // montado pelo `DuplicateOrderDialog` (`buildDuplicateState`); o estado é
  // limpo em seguida para não reaplicar ao recarregar. Roda a cada navegação
  // (`location.key`): a rota /visualizar e a /novo reaproveitam esta instância.
  const [isDuplicateOpen, setDuplicateOpen] = useState(false);
  useEffect(() => {
    if (!PURCHASE_ORDER_PROTOTYPE || isEditing || !isDuplicateOrderState(location.state)) return;
    const { values, duplicateOf } = location.state;
    reset({ ...getValues(), ...values });
    toaster.info({
      title: text.form.prototype.duplicate.toastTitle,
      description: text.form.prototype.duplicate.toastDescription.replace('{code}', duplicateOf.code ?? '—'),
    });
    navigate(location.pathname + location.search, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const requestPurchaseQuery = useCustomFormQueryByGuid<RequestPurchaseData>({
    registrationId: isEditing ? requestPurchaseId : undefined,
    queryKey: queryKey.requestPurchases.requestPurchase,
    asyncFunction: getRequestPurchase,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([requestPurchaseQuery as any]);
  const requestPurchaseData = (requestPurchaseQuery as any)?.data as
    RequestPurchaseData | undefined;

  // Regra de negócio (paridade com o legado, index.blade.php:119): a edição só
  // é permitida enquanto a solicitação estiver no status inicial "Solicitação".
  // Fora dele o formulário fica somente leitura (campos e botão Salvar usam
  // `canSave`); o trâmite/mudança de status segue disponível pela barra própria.
  const isEditableStatus =
    !isEditing || requestPurchaseData?.status === requestPurchaseStatus.solicitacao;
  const canSave = (isEditing ? canEdit : canCreate) && isEditableStatus && !isViewRoute;

  // -- Persistência (create/update, multipart via service TASK-RP-FE-06) --
  async function tryPersistRequestPurchase(data: RequestPurchaseFormType) {
    // UT-000743 — montagem pura (sem `harvest_uuid`/`parent_uuid`/`nfe`; `type`
    // imutável no update vem do dado persistido). Ver `requestPurchasePayload.ts`.
    const payload = buildRequestPurchasePayload(data, {
      isEditing,
      persistedType: requestPurchaseData?.type,
    });

    if (isEditing && requestPurchaseId) {
      return await updateRequestPurchase(requestPurchaseId, payload);
    }
    return await createRequestPurchase(payload);
  }

  const requestPurchaseMutation = useRequest({
    asyncFunction: tryPersistRequestPurchase,
    entityName: text.singularLabel,
    queryKey: queryKey.requestPurchases.requestPurchasesList,
    queryKey2: queryKey.requestPurchases.requestPurchase,
    typesRequest: isEditing ? 'update' : 'create',
    // UT-000743 (P-FE-02) — no criar, o toast informa o código DEFINITIVO do
    // 201 (o previsto pode divergir sob concorrência). Editar mantém o padrão.
    resolveSuccessToast: (created) =>
      !isEditing && created?.code
        ? {
            type: 'success',
            description: text.actions.createdWithCodeToast.replace('{code}', created.code),
          }
        : undefined,
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // "editar sem alterar nada = Cancelar" (ERRO-FE-001: `isEmpty()` retorna
  // `true` quando HÁ chaves — o `!` é OBRIGATÓRIO, mirror
  // `CreateOrUpdateDiagnosisPregnancy.tsx`).
  async function onSubmit(data: RequestPurchaseFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await requestPurchaseMutation.mutateAsync(data);
    }
  }

  // Guarda `onInvalid` (armadilha de formulário com abas) — cobre o FORM
  // TODO, navega para a 1ª aba com erro e mostra a mensagem REAL do 1º erro
  // (já 100% localizada pelo Yup, TASK-RP-FE-05).
  function onInvalid(formErrors: FieldErrors<RequestPurchaseFormType>) {
    const erroredFieldNames = Object.keys(formErrors) as (keyof RequestPurchaseFormType)[];
    if (erroredFieldNames.length === 0) return;

    const erroredTabs = erroredFieldNames.map((field) => FIELD_TAB_MAP[field]);

    // 0 = Dados Gerais, fixo acima das abas: rola até ele em vez de trocar aba.
    if (erroredTabs.includes(0)) {
      generalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const erroredTab = erroredTabs.find(
        (tab): tab is number => tab !== undefined && tab !== activeTab
      );
      if (erroredTab !== undefined) {
        handleTabsChange(erroredTab);
      }
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

  // Trocar o tipo (só na criação) recomeça os itens com 1 linha do tipo e, em
  // F/E/U, os anexos com 1 linha — as abas por tipo do legado (IG01/IG02).
  function handleTypeChange(option: Option<string> | null) {
    setValue('items', [emptyItemRow(option?.value)], { shouldDirty: true });
    setValue('attachments', attachmentsRequired(option?.value) ? [emptyAttachmentRow()] : [], {
      shouldDirty: true,
    });
  }

  const isSubmitting = requestPurchaseMutation.isPending;

  // ============================================
  // Ações de trâmite (receive/transfer/change-status/finish/quotation-
  // justification) — leitura + divergência declarada no cabeçalho do arquivo.
  // ============================================
  const transferDisclosure = useDisclosure();
  const changeStatusDisclosure = useDisclosure();
  const quotationJustificationDisclosure = useDisclosure();
  // Encadeamento "Salvar e Enviar para Autorização" (AM-10, CL-042 fechado —
  // `03-roteiro-frontend-cotacoes.md` §2): abre-se SÓ depois do `await` real
  // do sucesso da justificativa (`quotationJustificationMutation.actionSuccess`
  // abaixo, TASK-CQ-FE-14) — reaproveita o MESMO `RequestQuotationAuthorizerDialog`
  // já pronto para isso (TASK-CQ-FE-07), sem recriar Dialog/lógica.
  const quotationAuthorizerDisclosure = useDisclosure();

  const [quotationJustificationText, setQuotationJustificationText] = useState('');

  const receiveMutation = useRequest({
    asyncFunction: async () => receiveRequestPurchase(requestPurchaseId as string),
    entityName: text.singularLabel,
    queryKey: queryKey.requestPurchases.requestPurchasesList,
    queryKey2: queryKey.requestPurchases.requestPurchase,
    typesRequest: 'update',
    personalizedMessage: text.actions.receiveToast,
    actionSuccess: () => {},
  });

  const finishMutation = useRequest({
    asyncFunction: async () => finishRequestPurchase(requestPurchaseId as string),
    entityName: text.singularLabel,
    queryKey: queryKey.requestPurchases.requestPurchasesList,
    queryKey2: queryKey.requestPurchases.requestPurchase,
    typesRequest: 'update',
    personalizedMessage: text.actions.finishToast,
    actionSuccess: () => {},
  });

  const quotationJustificationMutation = useRequest({
    asyncFunction: async (payload: AddQuotationJustificationPayload) =>
      addQuotationJustification(requestPurchaseId as string, payload),
    entityName: text.singularLabel,
    queryKey: queryKey.requestPurchases.requestPurchasesList,
    queryKey2: queryKey.requestPurchases.requestPurchase,
    typesRequest: 'update',
    personalizedMessage: text.actions.quotationJustificationToast,
    actionSuccess: () => {
      quotationJustificationDisclosure.onClose();
      setQuotationJustificationText('');
      // Fluxo legado "Salvar e Enviar para Autorização" (AM-10/CL-042): só
      // avança para o envio ao autorizador DEPOIS do sucesso real (`onSuccess`
      // do `useRequest` acima) — em erro, o próprio `useRequest` já mostra o
      // toast e NÃO chama `actionSuccess`, então este Dialog nunca abre
      // (correção consciente do defeito fire-and-forget do legado).
      quotationAuthorizerDisclosure.onOpen();
    },
  });

  const anyActionPending =
    receiveMutation.isPending ||
    finishMutation.isPending ||
    quotationJustificationMutation.isPending;

  const isTerminalStatus =
    requestPurchaseData?.status === requestPurchaseStatus.pedidoFinalizado ||
    requestPurchaseData?.status === requestPurchaseStatus.pedidoCancelado;

  const availableStatusTransitions = requestPurchaseData?.available_status_transitions ?? [];
  const hasStatusTransitions = availableStatusTransitions.length > 0;

  // Regras de exibição das ações de trâmite (`supplyActionRules`, A-01): Receber
  // sem gate de permissão; Transferir com `request-purchases_edit` + (responsável
  // ou `_transfer`) fora dos status 3 e 4; Voltar Etapa só o responsável; a
  // justificativa da cotação segue `request-quotation_view` + responsável (DA-4).
  const ruleRow = requestPurchaseData
    ? {
        status: requestPurchaseData.status,
        type: requestPurchaseData.type,
        responsible: requestPurchaseData.responsible,
      }
    : undefined;
  const canReceive = !!ruleRow && canReceiveRule(ruleRow);
  const canTransfer = !!ruleRow && canTransferRule(ruleRow, supplyContext);
  const canStepBackAction =
    !!ruleRow && canStepBack(ruleRow, supplyContext) && hasStatusTransitions;
  const canQuotationJustification =
    !!ruleRow && isResponsible(ruleRow, supplyContext) && can('request-quotation_view');

  function handleQuotationJustificationConfirm() {
    quotationJustificationMutation.mutate({
      quotation_justification: quotationJustificationText.trim(),
    });
  }

  const viewSections: RequestPurchaseViewSection[] =
    isViewRoute && requestPurchaseData ? availableViewSections(requestPurchaseData) : [];
  const viewSectionText = text.form.viewSections;
  const viewSectionLabel: Record<RequestPurchaseViewSection, string> = {
    delivery: text.form.prototype.delivery.tab,
    links: text.form.prototype.links.tab,
    payment: text.form.prototype.payment.tab,
    invoices: text.form.prototype.invoices.tab,
    authorization: viewSectionText.authorizationTitle,
    receipt: viewSectionText.receiptTitle,
    ratio: viewSectionText.ratioTitle,
    children: viewSectionText.childrenTitle,
  };

  const showTramiteBar =
    isEditing &&
    !isViewRoute &&
    !!requestPurchaseData &&
    !isTerminalStatus &&
    (canReceive || canTransfer || canStepBackAction || canEdit || canQuotationJustification);

  return (
    <FormContainer
      title={
        isViewRoute
          ? text.form.title.view
          : isEditing
            ? text.form.title.edit
            : text.form.title.create
      }
      subtitle={
        isViewRoute
          ? text.form.subtitle.view
          : isEditing
            ? text.form.subtitle.edit
            : text.form.subtitle.create
      }
      // Situação, código e responsável na linha do título (sem faixa própria).
      headerActions={
        isEditing && requestPurchaseData ? (
          <Flex gap={3} align="center" wrap="wrap" justify="flex-end">
            {requestPurchaseData.responsible?.name && (
              <Text fontSize="sm" color="fg.muted" display={{ base: 'none', md: 'block' }}>
                {text.form.statusBar.responsible}:{' '}
                <Text as="span" color="strongText" fontWeight="medium">
                  {requestPurchaseData.responsible.name}
                </Text>
              </Text>
            )}
            {requestPurchaseData.code && (
              <Text fontFamily="mono" fontSize="sm" fontWeight="medium" color="strongText">
                {requestPurchaseData.code}
              </Text>
            )}
            <StatusTag
              label={requestPurchaseData.status_label}
              color={requestPurchaseStatusDotToken[requestPurchaseData.status as RequestPurchaseStatus]}
            />
          </Flex>
        ) : undefined
      }
      // Rodapé no padrão dos formulários: Cancelar à esquerda; à direita as
      // ações de trâmite (quando a pessoa pode executá-las) e Salvar.
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          />
          <Flex gap={2} wrap="wrap" justify="flex-end">
            {/* PROTÓTIPO: Duplicar a ordem (itens escolhidos), para quem pode criar. */}
            {PURCHASE_ORDER_PROTOTYPE && isEditing && requestPurchaseData && canCreate && (
              <Button
                title={text.form.prototype.duplicate.button}
                variant="outline"
                type="button"
                onClick={() => setDuplicateOpen(true)}
                disabled={anyActionPending}
              />
            )}
            {/* PROTÓTIPO (lote 4): registrar recebimento, cancelar saldo, reabrir. */}
            {PURCHASE_ORDER_PROTOTYPE && isEditing && requestPurchaseData && (
              <PrototypeOrderActions data={requestPurchaseData as PrototypePurchaseOrder} />
            )}
            {showTramiteBar && canReceive && !PURCHASE_ORDER_PROTOTYPE && (
              <Button
                title={text.actions.receiveButton}
                variant="outline"
                type="button"
                onClick={() => receiveMutation.mutate(undefined)}
                loading={receiveMutation.isPending}
                disabled={anyActionPending}
              />
            )}
            {showTramiteBar && canTransfer && (
              <Button
                title={text.actions.transferButton}
                variant="outline"
                type="button"
                onClick={transferDisclosure.onOpen}
                disabled={anyActionPending}
              />
            )}
            {showTramiteBar && canStepBackAction && (
              <Button
                title={text.actions.changeStatusButton}
                variant="outline"
                type="button"
                onClick={changeStatusDisclosure.onOpen}
                disabled={anyActionPending}
              />
            )}
            {showTramiteBar && canQuotationJustification && (
              <Button
                title={text.actions.quotationJustificationButton}
                variant="outline"
                type="button"
                onClick={quotationJustificationDisclosure.onOpen}
                disabled={anyActionPending}
              />
            )}
            {showTramiteBar && canEdit && (
              <Button
                title={text.actions.finishButton}
                variant="outline"
                type="button"
                onClick={() => finishMutation.mutate(undefined)}
                loading={finishMutation.isPending}
                disabled={anyActionPending}
              />
            )}
            {canSave && (
              <Button
                title={languageGB.defaltStrings.save}
                type="submit"
                form="request-purchase-form"
                loading={isSubmitting}
                disabled={isSubmitting || isLoading}
              />
            )}
          </Flex>
        </>
      }
    >
      {/* PROTÓTIPO (só com dados de demonstração): etapas do processo,
          fornecedor e comprador no topo da ordem já salva. */}
      {PURCHASE_ORDER_PROTOTYPE && isEditing && requestPurchaseData && (
        <PurchaseOrderProcessBar data={requestPurchaseData} canChangeForecast={!isViewRoute} />
      )}

      <Form id="request-purchase-form" onSubmit={handleSubmit(onSubmit, onInvalid)} noPadding>
        {/* Dados Gerais FIXO acima das abas (25/11): sempre visível como
            cabeçalho da OC; as abas abaixo (Itens, Anexos, Histórico,
            Cotações) só trocam o conteúdo de baixo. */}
        <Box ref={generalRef} mb={6}>
            <Flex direction="column" pt={0}>
            {/* Identificação sem título de seção (25/11): o bloco abre a tela. */}
            {/* 3 colunas: Código/Tipo/Prioridade; Data/Solicitante/Encarregado. */}
            {/* Visualização: 4 colunas (Código, Tipo, Prioridade, Data | Solicitante,
                Encarregado, NF-e) — sem espaço vazio e as abas sobem. */}
            <SimpleGrid
              columns={isViewRoute ? columnsForm.default : columnsForm.threeColumns}
              columnGap={5}
              rowGap={6}
              mb={6}
            >
              {/* `code` — SOMENTE LEITURA em todos os modos, gerado pelo servidor
                  (fora do `useForm`/payload). Criar: código PREVISTO (hint avisa
                  que o definitivo é atribuído ao salvar); editar/visualizar:
                  código gravado. Primeiro campo: é o que a pessoa procura. */}
              <InputReadOnly
                label={text.form.fields.code}
                value={
                  isEditing ? (requestPurchaseData?.code ?? '—') : (nextCodeQuery.data?.code ?? '—')
                }
                helperText={
                  isEditing
                    ? undefined
                    : nextCodeQuery.isError
                      ? text.form.hints.codePreviewUnavailable
                      : text.form.hints.codePreview
                }
                loading={
                  isEditing
                    ? isLoading
                    : nextCodeQuery.isPending && nextCodeQuery.fetchStatus !== 'idle'
                }
              />

              <Controller
                name="type"
                control={control}
                render={({ field, fieldState }) => (
                  <Select
                    label={text.form.fields.type}
                    placeholder={text.form.placeholders.type}
                    name={field.name}
                    value={field.value}
                    onChange={(option: Option<string> | null) => {
                      field.onChange(option ?? null);
                      handleTypeChange(option);
                    }}
                    options={requestPurchaseTypeOptions.options(languageGB)}
                    error={fieldState.error?.message}
                    tooltip={isEditing ? text.form.hints.typeLockedOnEdit : undefined}
                    isRequired
                    noClearable
                    isDisabled={isEditing || !canSave || isLoading}
                    loading={isLoading}
                  />
                )}
              />

              {/* PROTÓTIPO (lote 5): Categoria no lugar do Tipo, derivada dele;
                  Emergencial e Compra efetuada aparecem como marcação (decisão de 25/11). */}
              {PURCHASE_ORDER_PROTOTYPE && (
                <InputReadOnly
                  label={text.form.prototype.categories.label}
                  value={(() => {
                    const type = watch('type')?.value;
                    const category = categoryOfType(type);
                    if (!category) return '—';
                    const mark = markOfType(type);
                    const name = text.form.prototype.categories.names[category];
                    return mark ? `${name} · ${text.form.prototype.marks.names[mark]}` : name;
                  })()}
                  loading={isLoading}
                />
              )}

              <Controller
                name="priority"
                control={control}
                render={({ field, fieldState }) => (
                  <Select
                    label={text.form.fields.priority}
                    name={field.name}
                    value={field.value}
                    onChange={(option: Option<number> | null) => field.onChange(option ?? null)}
                    options={requestPurchasePriorityOptions.options(languageGB)}
                    error={fieldState.error?.message}
                    isDisabled={!canSave || isLoading}
                    loading={isLoading}
                  />
                )}
              />

              {/* "Data do Pedido" somente leitura (default hoje na criação). */}
              <InputReadOnly
                label={text.form.fields.requestDate}
                value={formatDate(watch('request_date') ?? '')}
                loading={isLoading}
              />

              {/* "Solicitante" (somente leitura): o logado na criação, o autor na edição. */}
              <InputReadOnly
                label={text.form.fields.requester}
                value={(isEditing ? requestPurchaseData?.user?.name : loggedUser?.username) ?? '—'}
                loading={isLoading}
              />

              {/* "Encarregado": só os chefes do solicitante (authorizer-options);
                  obrigatório quando `meta.requires_authorizer`. */}
              <Controller
                name="authorizer_uuid"
                control={control}
                render={({ field, fieldState }) => (
                  <Select
                    label={text.form.fields.authorizer}
                    placeholder={text.form.placeholders.authorizer}
                    name={field.name}
                    value={field.value ?? null}
                    onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                    options={authorizerSelectOptions}
                    error={
                      fieldState.error?.message ??
                      (authorizerOptionsQuery.isError
                        ? text.form.hints.authorizerLoadError
                        : undefined)
                    }
                    isRequired={requiresAuthorizer}
                    isDisabled={!canSave || isLoading}
                    loading={isLoading || (!isViewRoute && authorizerOptionsQuery.isPending)}
                  />
                )}
              />

              {/* NF-e: só leitura, só na visualização (C-009) — o criar/editar
                  não a edita e o PUT preserva o valor gravado. */}
              {isViewRoute && (
                <InputReadOnly
                  label={text.form.fields.nfe}
                  value={requestPurchaseData?.nfe || '—'}
                  loading={isLoading}
                />
              )}
            </SimpleGrid>

            {/* Descrição, Justificativa e Observação sem título de seção (25/11). */}
            <SimpleGrid columns={columnsForm.threeColumns} columnGap={5} rowGap={6}>
              {/* Ordem de leitura: o que é pedido, por quê, e observações. */}
              <Textarea
                label={text.form.fields.description}
                placeholder={text.form.placeholders.description}
                maxLength={800}
                rows={isViewRoute ? 2 : 3}
                {...register('description')}
                error={errors.description?.message}
                isRequired
                loading={isLoading}
                disabled={!canSave}
              />

              <Textarea
                label={text.form.fields.justification}
                placeholder={text.form.placeholders.justification}
                maxLength={800}
                rows={isViewRoute ? 2 : 3}
                {...register('justification')}
                error={errors.justification?.message}
                isRequired
                loading={isLoading}
                disabled={!canSave}
              />

              <Textarea
                label={text.form.fields.observation}
                placeholder={text.form.placeholders.observation}
                maxLength={800}
                rows={isViewRoute ? 2 : 3}
                {...register('observation')}
                error={errors.observation?.message}
                loading={isLoading}
                disabled={!canSave}
              />
            </SimpleGrid>
            </Flex>
        </Box>

        {/* @ts-ignore - custom variant */}
        <Tabs.Root
          value={String(activeTab)}
          onValueChange={(details: { value: string }) => handleTabsChange(Number(details.value))}
          variant="outline"
        >
          {/* @ts-ignore - Tab List sticky no topo do body: abas sempre visíveis, só o conteúdo rola. */}
          <Tabs.List position="sticky" top="0" zIndex={1} bg="formBG">
            {/* @ts-ignore */}
            <Tabs.Trigger value="1">{text.form.tabs.items}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="2">{text.form.tabs.attachments}</Tabs.Trigger>
            {/* Histórico — AUSENTE em modo criação (Modelo C Regra 1,
                `get_pwa_complex_screen_compositions_pattern`): não existe
                `movements[]` antes do 1º `POST`. */}
            {isEditing && (
              // @ts-ignore
              <Tabs.Trigger value="3">{text.form.tabs.history}</Tabs.Trigger>
            )}
            {/* Cotações (`RequestQuotationTab`, TASK-CQ-FE-03) — AUSENTE em
                modo criação, mesma regra de "Histórico": uma `RequestQuotation`
                só existe amarrada a uma `RequestPurchase` já persistida. */}
            {isEditing && (
              // @ts-ignore
              <Tabs.Trigger value="4">{text.form.tabs.quotations}</Tabs.Trigger>
            )}
            {/* Visualização: seções extras do legado (show.blade) como abas,
                só as que têm dado (`RequestPurchaseViewSections`). */}
            {viewSections.map((section) => (
              // @ts-ignore
              <Tabs.Trigger key={section} value={String(VIEW_SECTION_TAB[section])}>
                {viewSectionLabel[section]}
              </Tabs.Trigger>
            ))}
          </Tabs.List>


          {/* ---- ABA 2: Itens (`RequestItemRow`, TASK-RP-FE-07) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="1">
            {/* PROTÓTIPO: na visualização, itens com unitário, recebido e saldo. */}
            {PURCHASE_ORDER_PROTOTYPE && isViewRoute && requestPurchaseData ? (
              <PrototypeItemsTable data={requestPurchaseData as PrototypePurchaseOrder} />
            ) : (
              <RequestItemRow
                control={control}
                errors={errors}
                watch={watch}
                isLoading={!!isLoading}
                canSave={canSave}
              />
            )}
          </Tabs.Content>

          {/* ---- ABA 3: Anexos (`RequestAttachmentRow`, TASK-RP-FE-07) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="2">
            <RequestAttachmentRow
              control={control}
              errors={errors}
              watch={watch}
              isLoading={!!isLoading}
              canSave={canSave}
              requestPurchaseData={requestPurchaseData}
            />
          </Tabs.Content>

          {/* ---- ABA 4: Histórico (`RequestMovementHistory`, read-only,
              SÓ EM EDIÇÃO — TASK-RP-FE-07) ---- */}
          {isEditing && (
            // @ts-ignore
            <Tabs.Content value="3">
              {/* PROTÓTIPO: aprovações por nível de alçada, acima da linha do tempo. */}
              {PURCHASE_ORDER_PROTOTYPE &&
                !!(requestPurchaseData as PrototypePurchaseOrder | undefined)?.approvals?.length && (
                  <PrototypeApprovalsTable
                    approvals={(requestPurchaseData as PrototypePurchaseOrder).approvals ?? []}
                  />
                )}
              <RequestMovementHistory movements={requestPurchaseData?.movements ?? []} />
            </Tabs.Content>
          )}

          {/* ---- ABA 5: Cotações (`RequestQuotationTab`, Pattern 12 — Cards
              em Tab, SÓ EM EDIÇÃO — TASK-CQ-FE-03) ---- */}
          {isEditing && (
            // @ts-ignore
            <Tabs.Content value="4">
              <RequestQuotationTab
                requestPurchaseUuid={requestPurchaseId as string}
                requestPurchaseStatus={requestPurchaseData?.status}
                requestPurchaseCode={requestPurchaseData?.code ?? null}
                requestPurchaseDescription={requestPurchaseData?.description ?? null}
                requestPurchaseFarmDescription={requestPurchaseData?.farm?.description ?? null}
              />
            </Tabs.Content>
          )}

          {requestPurchaseData &&
            viewSections.map((section) => (
              // @ts-ignore
              <Tabs.Content key={section} value={String(VIEW_SECTION_TAB[section])}>
                <RequestPurchaseViewSections data={requestPurchaseData} section={section} />
              </Tabs.Content>
            ))}
        </Tabs.Root>
      </Form>

      {/* ---- Diálogo: Transferir Responsável (compartilhado, execução 081) ---- */}
      <TransferResponsibleDialog
        isOpen={transferDisclosure.open}
        onClose={transferDisclosure.onClose}
        requestPurchaseUuid={requestPurchaseId ?? null}
      />

      {/* ---- Diálogo: Voltar Etapa (compartilhado, execução 081) ---- */}
      <StepBackDialog
        isOpen={changeStatusDisclosure.open}
        onClose={changeStatusDisclosure.onClose}
        requestPurchaseUuid={requestPurchaseId ?? null}
        onSuccess={changeStatusDisclosure.onClose}
      />

      {/* ---- Diálogo: Justificativa de Cotação ---- */}
      <CustomDialog
        isOpen={quotationJustificationDisclosure.open}
        onClose={quotationJustificationDisclosure.onClose}
        title={text.actions.quotationJustificationDialogTitle}
        footer={
          <Flex gap={3}>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="secondary"
              type="button"
              onClick={quotationJustificationDisclosure.onClose}
              disabled={quotationJustificationMutation.isPending}
            />
            <Button
              title={languageGB.defaltStrings.confirm}
              type="button"
              onClick={handleQuotationJustificationConfirm}
              loading={quotationJustificationMutation.isPending}
              disabled={quotationJustificationMutation.isPending}
            />
          </Flex>
        }
      >
        <Textarea
          name="quotation-justification"
          label={text.actions.quotationJustificationLabel}
          maxLength={800}
          value={quotationJustificationText}
          onChange={(event) => setQuotationJustificationText(event.target.value)}
          disabled={quotationJustificationMutation.isPending}
        />
      </CustomDialog>

      {/* ---- Diálogo: Enviar para Autorização (encadeado após salvar a
          justificativa — AM-10/CL-042, TASK-CQ-FE-14) — MESMO componente já
          usado pelo card da cotação (`RequestQuotationTab`/AM-12,
          TASK-CQ-FE-07), instância própria porque a disclosure daquele é
          interna ao Tab e não é exposta ao pai. ---- */}
      {isEditing && requestPurchaseId && (
        <RequestQuotationAuthorizerDialog
          isOpen={quotationAuthorizerDisclosure.open}
          onClose={quotationAuthorizerDisclosure.onClose}
          requestPurchaseUuid={requestPurchaseId}
        />
      )}

      {/* PROTÓTIPO: Duplicar ordem (escolha dos itens). */}
      {PURCHASE_ORDER_PROTOTYPE && requestPurchaseData && (
        <DuplicateOrderDialog
          isOpen={isDuplicateOpen}
          onClose={() => setDuplicateOpen(false)}
          data={requestPurchaseData}
        />
      )}
    </FormContainer>
  );
}
