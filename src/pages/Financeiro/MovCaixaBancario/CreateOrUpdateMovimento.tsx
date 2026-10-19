// src/pages/Financeiro/MovCaixaBancario/CreateOrUpdateMovimento.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO e EDIÇÃO do cabeçalho completo (22 campos) de MOVIMENTO
// CAIXA/BANCÁRIO (Movement — Financeiro, TASK-MV-FE-05). Rotas:
// `/financeiro/caixa/novo` (criar, guardada por `movements_create`) e
// `/financeiro/caixa/:uuid` (editar, GUID, mesma permissão — Decisão #7 do
// contrato de API reusa o slug `movements_create` para `update`).
//
// Mirror estrutural de `CadastrosBase/SaldoInicial/CreateSaldoInicial.tsx`
// (mesmo Model `Movement`, mesma casca `FormContainer`+`Form`+`useRequest`) E
// `CadastrosBase/CentroCusto/CreateOrUpdateCentroCusto.tsx` (mesmo padrão
// create/edit no MESMO componente via `useCustomFormQueryByGuid`+`fillForm`
// guardado por `dirtyFields`, Lei 2 do `get_pwa_form_query_pattern` — ver nota
// de "DESVIO DELIBERADO" mais abaixo sobre o nome de hook citado na ficha).
//
// 2 riscos deliberados (Movement-contrato-tela.md §1/TASK-MV-FE-05 "Leitura
// do dev"):
//   1. [REVISTO] `client`/`provider` agora voltam da API COM `name`
//      (`@/@types/v2/Movements::MovementClientRef/MovementProviderRef`) — o
//      `fillMovementForm` abaixo usa `data.client?.name`/`data.provider?.name`
//      direto como label (fallback no `uuid` se vier `null`); os lookups
//      `getClientByUuid`/`getProviderByUuid` foram REMOVIDOS por
//      redundância (fornecedor-nome-display).
//   2. `farm_uuid` chega como escalar cru (SEM objeto aninhado) — Ajuste 5
//      (TASK-MV-FE-09) acrescentou lookup dedicado (`getFarmByUuid`, mirror
//      `client`/`provider`) ANTES do `reset()`; se falhar (403 sem
//      `farms_view`, rede, etc.), cai no fallback HONESTO (label = uuid) até
//      a lista client-side de `useFarmsList()` carregar, quando um
//      `useEffect` dedicado substitui o label pelo `description` real (2ª
//      via — nunca bloqueia, nunca fabrica um nome).
//   3. Decisão #6 (apagar-e-recriar) — `PUT /movements/{uuid}` devolve um
//      `uuid` DIFERENTE do usado na URL. `actionSuccess` do `useRequest`
//      SEMPRE `navigate(-1)` (create E update) — nunca
//      `navigate(`/financeiro/caixa/${uuid}`)`, nunca um refetch pontual por
//      uuid antigo.
//
// `generated_obligation_draft` (Decisão #9, condicional) — UT-000796 r2:
// quando o servidor devolve o rascunho (Tp. Categoria F), o `actionSuccess`
// NAVEGA para Nova Conta a Pagar (E) / Nova Conta a Receber (S) pré-preenchida
// (`useObligationDraftRedirect` + `obligation-draft.ts`; rascunho em
// sessionStorage + `?fromMovement=<uuid>` + `state` de rota). `replace: true`:
// Cancelar/salvar o título voltam à LISTA de movimentos. Sem permissão no
// destino: toast de aviso e `navigate(-1)` (o movimento já está salvo). O
// create e o update passam pelo MESMO `useRequest`; o `movement_uuid` vem do
// rascunho (o update RECRIA o movimento), nunca da URL.
//
// Transferência pelo lado ESPELHO (API r2, `is_mirror=true`): o GET detalhe já
// devolve conta/Tipo/destino DA LINHA clicada; o form hidrata com eles, Tipo e
// Tp. Categoria seguem readonly (T) e o PUT envia o payload como hidratado. O
// uuid muda SEMPRE no update (apagar e recriar o par): a tela nunca navega por
// ele, sai para a lista.
//
// Saldo Inicial (A5): movimento `type_category === 'I'` aberto por URL direta
// fica somente leitura (`canSave=false` + aviso). Editar movimento com títulos
// gerados (`generated_obligations_count > 0`) pede confirmação de cascata.
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Box,
  Flex,
  Icon,
  IconButton,
  SimpleGrid,
  Skeleton,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { FiEdit, FiPlus } from 'react-icons/fi';
import { MdInfoOutline } from 'react-icons/md';
import { useNavigate, useParams } from 'react-router-dom';

import { useApplySavedProvider } from '@/pages/CadastrosBase/Fornecedores/useApplySavedProvider';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { SelectCombobox } from '@/components/Form/SelectCombobox';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { MovementAllocationEditor } from '@/components/MovementAllocationEditor/MovementAllocationEditor';
import type { AllocationsFieldValues } from '@/components/MovementAllocationEditor/MovementAllocationEditor';
import { Tooltip } from '@/components/TooLtip';
import { Switch } from '@/components/ui/switch';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { movementTypeCategoryOptions } from '@/constants/Financial/movement/options/movement-type-category-options';
import { movementTypeOptions } from '@/constants/Financial/movement/options/movement-type-options';
import { queryKey } from '@/constants/query-key';

import { movementSchemaResolver } from '@/validations/schemas/Movement/movement-schema';

import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import { listClients } from '@/services/v2/CadastrosBase/Client/client-service';
import { listProviders } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { getFarmByUuid } from '@/services/v2/Farms/farm-admin-service';
import {
  createMovement,
  getMovement,
  updateMovement,
} from '@/services/v2/Movements/movement-service';

import type { Option } from '@/@types/option';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type { ClientListItem } from '@/@types/v2/CadastrosBase/client';
import type { ProviderListItem } from '@/@types/v2/CadastrosBase/provider';
import type {
  MovementAllocationPayload,
  MovementDetail,
  MovementForm as MovementFormType,
  MovementPayload,
} from '@/@types/v2/Movements';

// TASK-MV-FE-11 — import cruzado por caminho relativo, mesmo padrão já em
// uso abaixo para `useAccounts` (`CadastrosBase/` → `Financeiro/`).
import {
  deriveAllocationCategoryParams,
  deriveMovementFieldState,
  planOnTypeCategoryChange,
  planOnTypeChange,
  resetPlanToOperations,
  sanitizeMovementParties,
  type FieldResetPlan,
  type MovementTypeCategoryCode,
} from './movement-field-state';
import { generatedObligationsCount, isOpeningBalanceRow } from './movement-list-totals';
import { applyServerFieldErrors } from './movement-server-errors';
import { useObligationDraftRedirect } from './useObligationDraftRedirect';

import { ClientFormModal } from '../../CadastrosBase/Clientes/ClientFormModal';
import {
  useFarmsList,
  useProprietariesList,
} from '../../CadastrosBase/ContasBancarias/useAccounts';
// TASK-MV-FE-13 — mesmo padrão de import cruzado do bloco de Cliente acima.
import { ProviderFormModal } from '../../CadastrosBase/Fornecedores/ProviderFormModal';

import type { UseFieldArrayAppend } from 'react-hook-form';

// Função de busca reaproveitada por TODOS os `SelectAsyncPaginate` deste
// formulário (conta/conta destino/cliente/fornecedor) — mesmo formato de
// `findParams` já usado em `CreateSaldoInicial.tsx`/`CreateOrUpdateCentroCusto.tsx`.
function findParamsFromSearch(search: string | { search: string }) {
  return { search: typeof search === 'string' ? search : search.search };
}

export default function CreateOrUpdateMovimento() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const applySavedProvider = useApplySavedProvider();
  const { can } = usePermissions();
  const { activeFarmUuid } = useAuth();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(uuid);

  const text = languageGB.movements.movement;
  // §2.5 do contrato de tela — `PUT` reusa o slug `movements_create`
  // (Decisão #7, sem permissão dedicada de update).
  const hasSavePermission = can('movements_create');
  const { redirectIfDraft } = useObligationDraftRedirect();

  // TASK-MV-FE-11 — modal de criar/editar Cliente ao lado do campo.
  // `clientOptionsCacheKey` força o próximo `menuOpen` do
  // `SelectAsyncPaginate` de Cliente a reler a página 1 da API (prop
  // `cacheUniqs` já existente no componente, uso NOVO — mirror
  // `CreateOrUpdateAnimal.tsx:1018`/`CreateOrUpdateProduto.tsx:966`).
  const clientModalDisclosure = useDisclosure();
  const [clientOptionsCacheKey, setClientOptionsCacheKey] = useState(0);

  // TASK-MV-FE-13 — modal de criar/editar Fornecedor ao lado do campo.
  // `providerOptionsCacheKey` força o próximo `menuOpen` do
  // `SelectAsyncPaginate` de Fornecedor a reler a página 1 da API (mesmo
  // mecanismo `cacheUniqs` já usado acima para Cliente).
  const providerModalDisclosure = useDisclosure();
  const [providerOptionsCacheKey, setProviderOptionsCacheKey] = useState(0);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    getValues,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<MovementFormType>({
    mode: 'onChange',
    resolver: movementSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      date: '',
      type: null,
      type_category: null,
      account_uuid: null,
      destination_account_uuid: null,
      farm_uuid: null,
      proprietary_uuid: null,
      client_uuid: null,
      provider_uuid: null,
      value: null,
      interest: null,
      document: '',
      note: '',
      fiscal_document: false,
      generates_obligation: false,
      // TASK-MV-FE-08 (Ajuste 1) — ≥1 linha é sempre obrigatória
      // (allocations.min(1), TASK-MV-FE-01); a CRIAÇÃO já nasce com 1 linha
      // vazia pronta para editar, evitando o clique obrigatório em
      // "Adicionar Rateio +". Só na criação — a EDIÇÃO sobrescreve este
      // default via `reset()` dentro de `fillMovementForm` com as linhas
      // reais do movimento (nunca soma/concatena com este default).
      allocations: isEditing
        ? []
        : [
            {
              category_uuid: null,
              center_uuid: null,
              plan_account_uuid: null,
              harvest_uuid: null,
              value: null,
            },
          ],
    },
  });

  const {
    fields: allocationFields,
    append: appendAllocation,
    remove: removeAllocation,
  } = useFieldArray({ control, name: 'allocations' });

  // Risco 1 (cabeçalho do arquivo) [REVISTO] — `client`/`provider` agora
  // chegam com `name` direto da API; o label usa `data.client?.name`/
  // `data.provider?.name` (fallback no `uuid`), sem lookup adicional. Função
  // NOMEADA (Lei 2 do `get_pwa_form_query_pattern`) — guardada por
  // `dirtyFields` como qualquer `fillForm`, mesmo sendo `async`.
  async function fillMovementForm(data: MovementDetail, resetForce?: boolean) {
    if (isEmpty(dirtyFields) && !resetForce) return;

    const [farmDetail] = await Promise.all([
      // Ajuste 5 (TASK-MV-FE-09) — lookup dedicado para `farm_uuid` (escalar
      // cru, sem objeto aninhado). Se falhar (403 por falta de `farms_view`,
      // rede, etc.), cai no fallback honesto (label=uuid) já existente, que o
      // useEffect de `useFarmsList()` abaixo tenta corrigir numa 2ª via —
      // nunca um estado piorado.
      data.farm_uuid ? getFarmByUuid(data.farm_uuid).catch(() => null) : Promise.resolve(null),
    ]);

    reset({
      date: data.date ? data.date.slice(0, 10) : '',
      type: movementTypeOptions.getOption(data.type, languageGB),
      // `I` (Saldo Inicial) só chega aqui por URL direta: o rótulo resolve via
      // `getLabel`, mas o form fica somente leitura (`canSave=false`).
      type_category: movementTypeCategoryOptions.getOption(
        data.type_category as MovementTypeCategoryCode,
        languageGB
      ),
      account_uuid: {
        label: `${data.account.bank} — ${data.account.agency}/${data.account.account}`,
        value: data.account.uuid,
      },
      destination_account_uuid: data.destination_account
        ? {
            label: `${data.destination_account.bank} — ${data.destination_account.agency}/${data.destination_account.account}`,
            value: data.destination_account.uuid,
          }
        : null,
      // Risco 2 (cabeçalho do arquivo) / Ajuste 5 (TASK-MV-FE-09) —
      // `farm_uuid` é escalar cru, SEM objeto/label. Lookup direto
      // (`farmDetail`, mirror client/provider) resolve o nome ANTES do
      // `reset()`; se falhar (sem `farms_view`, rede, etc.), cai no fallback
      // HONESTO (label = uuid) até o `useEffect` abaixo resolver o rótulo
      // real via `useFarmsList()` (2ª via, client-side, já carregado para o
      // próprio Combobox deste campo) — nunca um nome fabricado.
      farm_uuid: data.farm_uuid
        ? { label: farmDetail?.data?.description ?? data.farm_uuid, value: data.farm_uuid }
        : null,
      proprietary_uuid: data.proprietary
        ? { label: data.proprietary.name, value: data.proprietary.uuid }
        : null,
      client_uuid: data.client
        ? { label: data.client?.name ?? data.client?.uuid, value: data.client.uuid }
        : null,
      provider_uuid: data.provider
        ? { label: data.provider?.name ?? data.provider?.uuid, value: data.provider.uuid }
        : null,
      value: Number(data.value),
      interest:
        data.interest !== null && data.interest !== undefined ? Number(data.interest) : null,
      document: data.document ?? '',
      note: data.note ?? '',
      fiscal_document: !!data.fiscal_document,
      generates_obligation: !!data.generates_obligation,
      allocations: (data.allocations ?? []).map((row) => ({
        category_uuid: {
          label: `${row.category.code} — ${row.category.description}`,
          value: row.category.uuid,
        },
        center_uuid: row.center
          ? { label: `${row.center.code} — ${row.center.description}`, value: row.center.uuid }
          : null,
        plan_account_uuid: row.plan_account
          ? {
              label: `${row.plan_account.code} — ${row.plan_account.description}`,
              value: row.plan_account.uuid,
            }
          : null,
        harvest_uuid: row.harvest
          ? { label: row.harvest.description, value: row.harvest.uuid }
          : null,
        value: Number(row.value),
      })),
    });
  }

  // DESVIO DELIBERADO do nome literal citado na ficha (`useCustomFormQueryById`)
  // — mesmo racional já registrado em `BaseRegistrations/Parameters/
  // CreateOrUpdateParameters.tsx`: `useCustomFormQueryById` (apesar do nome)
  // é a variante LEGADA de ID numérico; `useCustomFormQueryByGuid` é o
  // precedente REAL e dominante (~40 módulos, ex. `CentroCusto`/
  // `ContasBancarias`) para forms create/edit por GUID neste projeto. Fonte
  // de verdade real > texto genérico da ficha.
  const movementQuery = useCustomFormQueryByGuid<MovementDetail>({
    registrationId: isEditing ? uuid : undefined,
    asyncFunction: getMovement,
    queryKey: queryKey.financial.movement,
    fillForm: fillMovementForm,
  });

  const isLoading = isEditing && checkLoadingStatus([movementQuery as any]);
  const movementData = (movementQuery as any)?.data as MovementDetail | undefined;

  // Saldo Inicial: somente leitura (a exclusão/edição mora na tela Saldo
  // Inicial; a API também recusa o PUT com 422). Sem limpar nada na hidratação.
  const isOpeningBalanceMovement = isEditing && !!movementData && isOpeningBalanceRow(movementData);
  const canSave = hasSavePermission && !isOpeningBalanceMovement;
  // Cascata (legado + API r2): editar/regravar apaga os títulos gerados.
  const obligationsCount = isEditing && movementData ? generatedObligationsCount(movementData) : 0;
  const [pendingCascadeData, setPendingCascadeData] = useState<MovementFormType | null>(null);

  // UT-000796 — estado derivado das dependências Tipo × Tp. Categoria ×
  // Cliente × Fornecedor × Conta destino × Gera Obrigação (função PURA em
  // `movement-field-state.ts`). `originalTypeCategory` é o valor CARREGADO da
  // API (não o do form) — só ele trava a edição de uma Transferência (D-102-06).
  const watchedType = watch('type');
  const watchedTypeCategory = watch('type_category');
  const watchedValue = watch('value');
  const typeValue = watchedType?.value ?? null;
  const typeCategoryValue = watchedTypeCategory?.value ?? null;
  const fieldState = deriveMovementFieldState({
    type: typeValue,
    typeCategory: typeCategoryValue,
    mode: isEditing ? 'edit' : 'create',
    originalTypeCategory: (movementData?.type_category as MovementTypeCategoryCode) ?? null,
  });
  const isTypeCategoryOptionDisabled = useCallback(
    (option: Option<any>) =>
      deriveMovementFieldState({ type: typeValue, typeCategory: null, mode: 'create' })
        .typeCategoryDisabledOptions[option.value as MovementTypeCategoryCode],
    [typeValue]
  );
  const allocationCategoryParams = useMemo(
    () => deriveAllocationCategoryParams(typeValue, typeCategoryValue),
    [typeValue, typeCategoryValue]
  );

  // Limpeza SOMENTE em handlers de ação do usuário (D-102-03/08). O `onChange`
  // do `Controller` só dispara por interação — nunca no `reset()` da
  // hidratação da edição (proibido `useEffect` observando type/type_category).
  function applyResetPlan(plan: FieldResetPlan) {
    const operations = resetPlanToOperations(plan, {
      allocationCount: (getValues('allocations') ?? []).length,
    });
    operations.forEach(({ name, value }) => {
      const isDerived = name === 'generates_obligation';
      setValue(name as any, value as any, {
        shouldDirty: !isDerived,
        shouldValidate: name === 'type_category',
      });
      clearErrors(name as any);
    });
  }

  // Fazenda (opcional, `SelectCombobox` client-side) — reaproveita
  // `useFarmsList()` já existente em `ContasBancarias/useAccounts.tsx`
  // (nenhum hook/service novo, mesmo racional de `useProprietariesList`
  // reaproveitado por `CreateSaldoInicial.tsx`).
  const farmsQuery = useFarmsList();
  const farmOptions = (farmsQuery.data ?? []).map((farm) => ({
    label: farm.description,
    value: farm.uuid,
  }));

  // Risco 2 — substitui o fallback honesto (label = uuid) pelo rótulo real
  // assim que `useFarmsList()` resolve, sem tocar em `dirtyFields` (o
  // usuário nunca "suja" este campo por conta de um patch de label).
  useEffect(() => {
    const rawFarmUuid = movementData?.farm_uuid;
    if (!rawFarmUuid || !farmsQuery.data) return;
    const match = farmsQuery.data.find((farm) => farm.uuid === rawFarmUuid);
    if (match) {
      setValue(
        'farm_uuid',
        { label: match.description, value: match.uuid },
        { shouldDirty: false }
      );
    }
  }, [movementData?.farm_uuid, farmsQuery.data, setValue]);

  // Proprietário (`SelectCombobox`/`listProprietaryOptions`) — mesmo hook
  // reaproveitado de `CreateSaldoInicial.tsx`, mas escopado pela FAZENDA
  // ATIVA (`activeFarmUuid`, mesma fonte do `X-Farm-Id`) — mirror
  // `NewMovementModal.tsx`/`BulkInvestmentBanner.tsx`. Escopo TENANT
  // (sem `farmUuid`) omitia proprietários cadastrados só na fazenda ativa,
  // deixando o select vazio na edição. `farmUuid` entra na `queryKey` do
  // hook (`useAccounts.tsx`), então a lista refaz o fetch na troca de
  // fazenda.
  const proprietariesQuery = useProprietariesList(activeFarmUuid ?? undefined);
  const proprietaryOptions = (proprietariesQuery.data ?? []).map((item) => ({
    label: item.label,
    value: item.uuid,
  }));

  const movementMutation = useRequest({
    asyncFunction: tryPersistMovement,
    entityName: text.singularLabel,
    queryKey: queryKey.financial.movements,
    queryKey2: queryKey.financial.movement,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: (movement: MovementDetail) => {
      // UT-000796 r2 (Gera Obrigação) — com rascunho e permissão no destino,
      // navega (replace) para Nova Conta a Pagar/Receber pré-preenchida; o
      // rascunho vem do create E do update (`movement_uuid` do movimento
      // recriado). Sem rascunho/permissão, segue a saída padrão abaixo.
      if (redirectIfDraft(movement, { replace: true })) return;

      // Risco 3 (cabeçalho do arquivo) — Decisão #6, "apagar e recriar": o
      // `uuid` do recurso MUDA pós-update. SEMPRE navegar para longe (nunca
      // tentar reler/continuar editando com o uuid antigo), mesmo
      // comportamento do `create`.
      navigate(-1);
    },
  });

  async function tryPersistMovement(data: MovementFormType) {
    // Saneia o payload pelo estado derivado: o que a tela desabilitou/ocultou
    // nunca vai ao servidor (coerente com as 422 da API — D-102-03/05).
    const submitState = deriveMovementFieldState({
      type: data.type?.value ?? null,
      typeCategory: data.type_category?.value ?? null,
      mode: isEditing ? 'edit' : 'create',
      originalTypeCategory: (movementData?.type_category as MovementTypeCategoryCode) ?? null,
    });
    const parties = sanitizeMovementParties(submitState, {
      client: data.client_uuid,
      provider: data.provider_uuid,
      destination: data.destination_account_uuid,
    });

    const allocations: MovementAllocationPayload[] = data.allocations.map((item) => ({
      category_uuid: item.category_uuid!.value,
      center_uuid: item.center_uuid!.value,
      plan_account_uuid: item.plan_account_uuid?.value ?? null,
      harvest_uuid: item.harvest_uuid?.value ?? null,
      value: Number(item.value),
    }));

    const payload: MovementPayload = {
      date: data.date,
      type: data.type!.value,
      type_category: data.type_category!.value,
      account_uuid: data.account_uuid!.value,
      // Obrigatório visualmente/backend só quando `type_category === 'T'`
      // (`required_if:type_category,T`) — fora disso, SEMPRE `null`.
      destination_account_uuid: parties.destination?.value ?? null,
      farm_uuid: data.farm_uuid?.value ?? null,
      proprietary_uuid: data.proprietary_uuid?.value ?? null,
      client_uuid: parties.client?.value ?? null,
      provider_uuid: parties.provider?.value ?? null,
      value: Number(data.value),
      document: data.document?.trim() || null,
      note: data.note?.trim() || null,
      fiscal_document: !!data.fiscal_document,
      // Derivado de `type_category === 'F'` (D-102-05); a API valida (422) a divergência.
      generates_obligation: submitState.generatesObligation,
      allocations,
    };

    // Opcional/nullable puro — omitido do payload quando vazio.
    if (data.interest !== null && data.interest !== undefined) {
      payload.interest = Number(data.interest);
    }

    // `code`/`appropriation` NUNCA vão no payload de escrita — sempre
    // gerados pelo servidor (Movement-contrato.md §2, campos #1/#17); nem
    // existem em `MovementForm`/`MovementPayload`, então não há chave a
    // omitir aqui — a ausência é estrutural, não uma guarda em runtime.
    if (isEditing && uuid) {
      return await updateMovement(uuid, payload);
    }
    return await createMovement(payload);
  }

  async function persistMovement(data: MovementFormType) {
    try {
      await movementMutation.mutateAsync(data);
    } catch (error) {
      applyServerFieldErrors(error, setError as any);
    }
  }

  async function onSubmit(data: MovementFormType) {
    // Editar movimento com títulos gerados apaga os títulos e as baixas deles
    // (cascata, como no legado): confirma antes de enviar o PUT.
    if (obligationsCount > 0) {
      setPendingCascadeData(data);
      return;
    }
    await persistMovement(data);
  }

  async function handleConfirmCascade() {
    const data = pendingCascadeData;
    setPendingCascadeData(null);
    if (data) await persistMovement(data);
  }

  const isSubmitting = movementMutation.isPending;

  const isTransfer = fieldState.destinationAccountVisible;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      subtitle={isEditing ? text.form.subtitle.edit : text.form.subtitle.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && (
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {isOpeningBalanceMovement && (
          <Box
            role="note"
            bg="feedBack.info"
            color="feedBack.infoMain"
            borderRadius="lg"
            px={4}
            py={3}
            mb={6}
          >
            <Text fontSize="sm">{text.form.openingBalanceNotice}</Text>
          </Box>
        )}

        {/* Código gerado pelo servidor — read-only, só em modo edição
            (create nunca tem `code` ainda, mirror `CreateOrUpdateCentroCusto.tsx`). */}
        {isEditing && (
          <Box
            bg="bg.muted"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="lg"
            px={4}
            py={3}
            mb={6}
          >
            <Skeleton loading={isLoading} borderRadius="md">
              <InputReadOnly
                name="code"
                label={text.list.table.code}
                value={movementData?.code ?? ''}
              />
            </Skeleton>
          </Box>
        )}

        {/* Linha 1 — Data | Tipo | Tp. Categoria | Conta */}
        <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
          <Controller
            name="date"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={text.form.fields.date}
                error={error?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={text.form.fields.type}
                name={field.name}
                options={movementTypeOptions.options(languageGB)}
                value={field.value}
                onChange={(option) => {
                  field.onChange(option ?? null);
                  applyResetPlan(planOnTypeChange());
                }}
                error={error?.message}
                isRequired
                isDisabled={!canSave || fieldState.typeReadOnly}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="type_category"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={text.form.fields.typeCategory}
                name={field.name}
                options={movementTypeCategoryOptions.options(languageGB)}
                value={field.value}
                onChange={(option) => {
                  field.onChange(option ?? null);
                  applyResetPlan(
                    planOnTypeCategoryChange(
                      getValues('type')?.value ?? null,
                      option?.value ?? null
                    )
                  );
                }}
                isOptionDisabled={isTypeCategoryOptionDisabled}
                error={error?.message}
                isRequired
                isDisabled={!canSave || fieldState.typeCategoryReadOnly}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="account_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.account}
                placeholder={text.form.placeholders.account}
                service={listAccounts}
                mapOptions={(item: AccountListItem) => ({
                  label: `${item.bank} — ${item.agency}/${item.account}`,
                  value: item.uuid,
                })}
                findParams={findParamsFromSearch}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
              />
            )}
          />
        </SimpleGrid>

        {/* Linha condicional — Conta Destino, SÓ quando Tp. Categoria === 'T'
            (Transferência) — `required_if:type_category,T` refletido no
            Yup (`movement-schema.ts`). */}
        {isTransfer && (
          <Box mt={6}>
            <Controller
              name="destination_account_uuid"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={
                    fieldState.destinationAccountLabelKey === 'origin'
                      ? text.form.fields.originAccount
                      : text.form.fields.destinationAccount
                  }
                  placeholder={
                    fieldState.destinationAccountLabelKey === 'origin'
                      ? text.form.placeholders.originAccount
                      : text.form.placeholders.destinationAccount
                  }
                  service={listAccounts}
                  mapOptions={(item: AccountListItem) => ({
                    label: `${item.bank} — ${item.agency}/${item.account}`,
                    value: item.uuid,
                  })}
                  findParams={findParamsFromSearch}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave}
                />
              )}
            />
          </Box>
        )}

        {/* Linha 2 — Fazenda | Proprietário | Cliente | Fornecedor */}
        <SimpleGrid columns={columnsForm.fourColumns} gap={6} mt={6}>
          <Controller
            name="farm_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectCombobox
                name={field.name}
                label={text.form.fields.farm}
                placeholder={text.form.placeholders.farm}
                options={farmOptions}
                value={field.value ?? null}
                onChange={(option) => field.onChange(option ?? null)}
                error={error?.message}
                disabled={!canSave}
              />
            )}
          />

          <Controller
            name="proprietary_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectCombobox
                name={field.name}
                label={text.form.fields.proprietary}
                placeholder={text.form.placeholders.proprietary}
                options={proprietaryOptions}
                loading={proprietariesQuery.isLoading}
                value={field.value ?? null}
                onChange={(option) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          <Controller
            name="client_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.client}
                placeholder={text.form.placeholders.client}
                service={listClients}
                mapOptions={(item: ClientListItem) => ({ label: item.name, value: item.uuid })}
                findParams={findParamsFromSearch}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isDisabled={!canSave || !fieldState.clientEnabled}
                // TASK-MV-FE-11 — força reler a página 1 depois de
                // criar/editar um cliente pelo modal ao lado.
                cacheUniqs={[clientOptionsCacheKey]}
                // EST-07 — botão criar/editar Cliente migrado do `IconButton`
                // avulso para o `labelAction` (ação no label), mirror EXATO
                // do padrão `CreateOrUpdateNfe.tsx`. Ícone condicional
                // (regra 11): `FiPlus` vazio / `FiEdit` com cliente
                // selecionado. Mesmo gate de `disabled` e mesmo `onOpen`.
                labelActionTooltip={
                  field.value ? text.form.actions.editClientAria : text.form.actions.addClientAria
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
                    disabled={
                      !canSave ||
                      !fieldState.clientAddButtonEnabled ||
                      !(can('clients_create') || can('clients_edit'))
                    }
                    onClick={clientModalDisclosure.onOpen}
                  >
                    <Icon as={field.value ? FiEdit : FiPlus} boxSize="16px" color="primaryMain" />
                  </IconButton>
                }
              />
            )}
          />

          <Controller
            name="provider_uuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.provider}
                placeholder={text.form.placeholders.provider}
                service={listProviders}
                mapOptions={(item: ProviderListItem) => ({
                  label: item.name,
                  value: item.uuid,
                })}
                findParams={findParamsFromSearch}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isDisabled={!canSave || !fieldState.providerEnabled}
                // TASK-MV-FE-13 — força reler a página 1 depois de
                // criar/editar um fornecedor pelo modal ao lado.
                cacheUniqs={[providerOptionsCacheKey]}
                // EST-07 — botão criar/editar Fornecedor migrado do
                // `IconButton` avulso para o `labelAction`, mirror EXATO do
                // botão de Cliente acima. Ícone condicional: `FiPlus` vazio
                // / `FiEdit` com fornecedor selecionado. Mesmo gate de
                // `disabled` e mesmo `onOpen`.
                labelActionTooltip={
                  field.value
                    ? text.form.actions.editProviderAria
                    : text.form.actions.addProviderAria
                }
                labelAction={
                  <IconButton
                    aria-label={
                      field.value
                        ? text.form.actions.editProviderAria
                        : text.form.actions.addProviderAria
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
                      !fieldState.providerAddButtonEnabled ||
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
        </SimpleGrid>

        {/* Linha 3 — Valor | Juros | Documento */}
        <SimpleGrid columns={columnsForm.threeColumns} gap={6} mt={6}>
          <Controller
            name="value"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <MoneyInput
                name={field.name}
                label={text.form.fields.value}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                error={error?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          <Controller
            name="interest"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <MoneyInput
                name={field.name}
                label={text.form.fields.interest}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                error={error?.message}
                disabled={!canSave}
              />
            )}
          />

          <Input
            label={text.form.fields.document}
            placeholder={text.form.placeholders.document}
            tooltip={text.form.hints.documentTooltip}
            maxLength={100}
            {...register('document')}
            error={errors.document?.message}
            disabled={!canSave}
          />
        </SimpleGrid>

        {/* Linha 4 — Histórico (full width) */}
        <Box mt={6}>
          <Textarea
            label={text.form.fields.note}
            placeholder={text.form.placeholders.note}
            maxLength={600}
            {...register('note')}
            error={errors.note?.message}
            disabled={!canSave}
          />
        </Box>

        {/* Linha 5 — Documento Fiscal | Gera Título (booleanos reais — Switch) */}
        <SimpleGrid columns={columnsForm.twoColumns} gap={6} mt={6}>
          <Controller
            name="fiscal_document"
            control={control}
            render={({ field }) => (
              <Flex align="center" justify="space-between" h="full">
                <Flex align="center" fontSize="sm" fontWeight="medium">
                  <Text>{text.form.fields.fiscalDocument}</Text>
                  {/* Ajuste 7 (TASK-MV-FE-09), mirror `Field.tsx` — este
                      campo é um `<Flex>` custom com `Switch` (não usa
                      `Field`/`Input`), por isso o par `Tooltip`+`Icon` é
                      colado manualmente. */}
                  <Tooltip label={text.form.hints.fiscalDocumentTooltip}>
                    <Icon as={MdInfoOutline} ml="1" color="gray.500" />
                  </Tooltip>
                </Flex>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  disabled={!canSave}
                  aria-label={text.form.fields.fiscalDocument}
                />
              </Flex>
            )}
          />

          {/* D-102-05 — SOMENTE LEITURA, derivado de `type_category === 'F'`.
              O valor do RHF é sincronizado nos handlers (`applyResetPlan`). */}
          <Box>
            <Flex align="center" justify="space-between" h="full">
              <Text fontSize="sm" fontWeight="medium">
                {text.form.fields.generatesObligation}
              </Text>
              {/* @ts-ignore - Chakra UI v3 Switch API */}
              <Switch
                checked={fieldState.generatesObligation}
                colorPalette="green"
                disabled
                aria-label={text.form.fields.generatesObligation}
              />
            </Flex>
            {errors.generates_obligation?.message && (
              <Text color="fg.error" fontSize="xs" mt={1}>
                {errors.generates_obligation.message}
              </Text>
            )}
          </Box>
        </SimpleGrid>

        {/* Rateio (campos #18-22 do contrato) — componente reutilizável
            TASK-MV-FE-03, `useFieldArray` vive AQUI no pai. */}
        <Box mt={6}>
          <MovementAllocationEditor
            control={control}
            fields={allocationFields}
            // Cast pragmático — mesmo racional documentado no cabeçalho de
            // `MovementAllocationEditor.tsx`: `append` do `useFieldArray<MovementForm>`
            // é estruturalmente idêntico ao que o componente espera
            // (mesmo elemento `MovementAllocationItemForm`), o `ArrayPath<T>`
            // do react-hook-form só não prova isso sozinho através do tipo
            // genérico fixado do componente.
            append={
              appendAllocation as unknown as UseFieldArrayAppend<
                AllocationsFieldValues,
                'allocations'
              >
            }
            remove={removeAllocation}
            headerValue={Number(watchedValue) || 0}
            errors={errors}
            languageGB={languageGB}
            disabled={!canSave}
            categoryOptionsParams={allocationCategoryParams}
          />
        </Box>
      </Form>

      {/* TASK-MV-FE-11 — modal de criar/editar Cliente. `clientUuid` lido
          direto de `watch` (não um `useState` paralelo) — o modal sempre
          reflete o valor ATUAL do campo no formulário de Movimento. */}
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

      {/* TASK-MV-FE-13 — modal de criar/editar Fornecedor. `providerUuid`
          lido direto de `watch` (não um `useState` paralelo) — o modal
          sempre reflete o valor ATUAL do campo no formulário de Movimento. */}
      <ProviderFormModal
        isOpen={providerModalDisclosure.open}
        onClose={providerModalDisclosure.onClose}
        providerUuid={watch('provider_uuid')?.value}
        onSaved={(provider) => {
          applySavedProvider(provider, () =>
            setValue(
              'provider_uuid',
              { value: provider.uuid, label: provider.label },
              { shouldDirty: true, shouldValidate: true }
            )
          );
          setProviderOptionsCacheKey((key) => key + 1);
        }}
      />

      {/* Cascata ao editar movimento com títulos gerados (legado + API r2). */}
      <DeleteConfirmDialog
        isOpen={pendingCascadeData !== null}
        onClose={() => setPendingCascadeData(null)}
        onConfirm={handleConfirmCascade}
        title={text.form.cascadeSave.title}
        description={text.form.cascadeSave.description.replace('{count}', String(obligationsCount))}
        hideQuestionMark
        warningText=""
        confirmButtonText={text.form.cascadeSave.confirm}
        colorPalette="orange"
        tone="warning"
      />
    </FormContainer>
  );
}
