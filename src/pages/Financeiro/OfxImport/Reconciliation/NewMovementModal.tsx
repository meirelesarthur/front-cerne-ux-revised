// src/pages/Financeiro/OfxImport/Reconciliation/NewMovementModal.tsx
// -----------------------------------------------------------------------------
// Modal "Novo Movimento" (SURF-066) da Conciliação Bancária da Importação
// OFX (F-114, 97-Esteiras/064, TASK-064-OFX-FE-02). Cria 1 `Movement`
// (`POST /api/v1/movements`, reuso INTEGRAL — nenhuma Tarefa de API nova)
// a partir de UMA transação bancária PENDENTE (sem `matched_movement_uuid`)
// do preview de conciliação.
//
// Mirror ADAPTADO de `Financeiro/MovCaixaBancario/CreateOrUpdateMovimento.tsx`
// (MESMO Model/schema/`MovementAllocationEditor`, CV-04 herdado sem
// reescrita) — reduzido aos campos que o modal legado (`#modal-movement`)
// de fato expõe (FLD-16..29) e ENCAIXOTADO num `CustomDialog` em vez de
// rota própria. Campos vindos da própria transação (`type`/`date`/`value`,
// FLD-16/20/21) são SEMPRE somente-leitura aqui — o legado tinha
// `readonly()` num `<select>` que o HTML ignora (FLD-16,
// POSSIVEL_LEGACY_DEFECT); esta versão corrige o defeito de verdade
// (`disabled` real via RHF, o campo nunca é editável). `account_uuid`
// também é FIXO — é sempre a conta bancária da própria Importação OFX
// (mirror do legado, que só usa essa conta no fluxo de conciliação).
//
// `generates_obligation` (Movement-contrato.md, Decisão #9) NÃO tem campo
// visível aqui — o modal legado de conciliação (FLD-12..29) nunca teve essa
// opção (é exclusiva da tela cheia de Mov. Caixa/Bancário); UT-000796
// (D-102-05): enviado DERIVADO de `type_category === 'F'` (mesma função pura
// `deriveMovementFieldState` da tela principal), e o rascunho de obrigação
// devolvido pela API (Financiamento) vira o mesmo toast informativo da tela
// principal.
//
// UT-000796 (D-102-02/03): Tp. Categoria, Cliente, Fornecedor e Conta
// destino seguem a MESMA matriz da tela principal (`movement-field-state.ts`);
// a limpeza do que fica desabilitado acontece só no handler de troca da
// Tp. Categoria, e o payload é saneado antes do POST (a API recusa com 422
// combinações incoerentes).
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Icon, IconButton, SimpleGrid, Text, useDisclosure } from '@chakra-ui/react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { FiEdit, FiPlus } from 'react-icons/fi';

import { useApplySavedProvider } from '@/pages/CadastrosBase/Fornecedores/useApplySavedProvider';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { SelectCombobox } from '@/components/Form/SelectCombobox';
import { Textarea } from '@/components/Form/Textarea';
import { MovementAllocationEditor } from '@/components/MovementAllocationEditor/MovementAllocationEditor';
import { FormSurface, type FormSurfaceVariant } from '@/components/ui/FormSurface';
import { Switch } from '@/components/ui/switch';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { movementTypeCategoryOptions } from '@/constants/Financial/movement/options/movement-type-category-options';
import { movementTypeOptions } from '@/constants/Financial/movement/options/movement-type-options';
import { queryKey } from '@/constants/query-key';

import { movementSchemaResolver } from '@/validations/schemas/Movement/movement-schema';

import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import type { ClientOptionItem } from '@/services/v2/CadastrosBase/Client/client-service';
import { listClientOptions } from '@/services/v2/CadastrosBase/Client/client-service';
import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { createMovement } from '@/services/v2/Movements/movement-service';

// TASK-MV-FE-05 precedent — import cruzado por caminho relativo (mirror
// `CreateOrUpdateMovimento.tsx`), 3 níveis daqui (`Reconciliation` →
// `OfxImport` → `Financeiro` → `pages`) até `CadastrosBase/`.

import type { Option } from '@/@types/option';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type { OfxReconciliationItem } from '@/@types/v2/Financeiro/ofxImport/reconciliation';
import type {
  MovementAllocationPayload,
  MovementForm as MovementFormType,
  MovementPayload,
} from '@/@types/v2/Movements';

import { InlineClienteFornecedorDialog } from './dialogs/InlineClienteFornecedorDialog';

import {
  useFarmsList,
  useProprietariesList,
} from '../../../CadastrosBase/ContasBancarias/useAccounts';
import {
  deriveAllocationCategoryParams,
  deriveMovementFieldState,
  planOnTypeCategoryChange,
  resetPlanToOperations,
  sanitizeMovementParties,
  type MovementTypeCategoryCode,
} from '../../MovCaixaBancario/movement-field-state';
import { applyServerFieldErrors } from '../../MovCaixaBancario/movement-server-errors';

// TASK-065-OFX-FE-02 — affordance "+ novo" de Cliente/Fornecedor (mirror
// `MovCaixaBancario/CreateOrUpdateMovimento.tsx::ClientFormModal`/
// `ProviderFormModal`, adaptado aqui via o wrapper ÚNICO
// `InlineClienteFornecedorDialog` — ver cabeçalho do arquivo importado.

function findParamsFromSearch(search: string | { search: string }) {
  return { search: typeof search === 'string' ? search : search.search };
}

export interface NewMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Transação bancária PENDENTE que originou o modal (`fit_id`, mirror
   *  `INT-02` — autofill de type/date/value/note). */
  item: OfxReconciliationItem | null;
  /** Conta bancária da própria Importação OFX — FIXA neste modal, mirror
   *  do legado (o modal só é aberto no contexto de UMA conciliação). */
  accountUuid: string;
  accountLabel: string;
  onSuccess: () => void;
  /** `panel` = formulário inline no painel de conciliação (sem modal). Default: `dialog`. */
  variant?: FormSurfaceVariant;
  /** Tp. Categoria inicial (ex.: `T` na aba Transferência). Default: derivado do tipo da transação. */
  initialTypeCategory?: MovementTypeCategoryCode;
}

export function NewMovementModal({
  isOpen,
  onClose,
  item,
  accountUuid,
  accountLabel,
  onSuccess,
  variant = 'dialog',
  initialTypeCategory,
}: NewMovementModalProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.ofxImports.ofxImport.reconciliation.newMovementModal;

  if (!isOpen || !item) return null;

  return (
    <NewMovementModalBody
      isOpen={isOpen}
      title={text.title}
      item={item}
      accountUuid={accountUuid}
      accountLabel={accountLabel}
      onClose={onClose}
      onSuccess={onSuccess}
      variant={variant}
      initialTypeCategory={initialTypeCategory}
    />
  );
}

interface NewMovementModalBodyProps {
  isOpen: boolean;
  title: string;
  item: OfxReconciliationItem;
  accountUuid: string;
  accountLabel: string;
  onClose: () => void;
  onSuccess: () => void;
  variant: FormSurfaceVariant;
  initialTypeCategory?: MovementTypeCategoryCode;
}

// Tem o `useForm`/mutação — renderiza o próprio `CustomDialog` para que o
// footer (Cancelar/Confirmar, que dependem de `isSubmitting`/`handleSubmit`)
// vá para o SLOT `footer` real do dialog — header/footer fixos, só o body
// rola, SEM footer-in-body sticky (que deixava faixa morta abaixo do
// footer).
function NewMovementModalBody({
  isOpen,
  title,
  item,
  accountUuid,
  accountLabel,
  onClose,
  onSuccess,
  variant,
  initialTypeCategory,
}: NewMovementModalBodyProps) {
  const { languageGB } = useLanguage();
  const applySavedProvider = useApplySavedProvider();
  const { can } = usePermissions();
  const { activeFarmUuid } = useAuth();
  const movementText = languageGB.movements.movement;
  const text = languageGB.ofxImports.ofxImport.reconciliation.newMovementModal;

  // TASK-065-OFX-FE-02 — affordance "+ novo" de Cliente/Fornecedor (mirror
  // `CreateOrUpdateMovimento.tsx::clientModalDisclosure`/
  // `providerModalDisclosure`). Só 1 disclosure/cache-key aqui porque só UM
  // dos 2 campos é editável por vez neste modal (`type` da transação é FIXO,
  // ver FLD-16 acima) — o `InlineClienteFornecedorDialog` ramifica
  // internamente por `isIncome`.
  const participantModalDisclosure = useDisclosure();
  const [participantOptionsCacheKey, setParticipantOptionsCacheKey] = useState(0);

  // Painel inline é estreito (~450px): no máx. 2 colunas; no modal mantém o grid original.
  const cols = (n: number) => (variant === 'panel' ? { base: 1, sm: Math.min(n, 2) } : { base: 1, md: n });

  const accountOption: Option<string> = { label: accountLabel, value: accountUuid };
  // FLD-26 — autofill do `note` truncado a 40 chars (mesmo limite do
  // legado), o campo em si continua editável (maxLength real do schema,
  // 600).
  const initialNote = (item.memo || '').slice(0, 40);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    getValues,
    watch,
    formState: { errors, isSubmitting: isValidating },
  } = useForm<MovementFormType>({
    resolver: movementSchemaResolver(languageGB),
    defaultValues: {
      date: item.date,
      // FLD-16 — `type` vem 1:1 da transação (CV-02), SEMPRE disabled
      // (correção do defeito legado, ver cabeçalho do arquivo).
      type: movementTypeOptions.getOption(item.type, languageGB),
      // Autofill legado (INT-02): isIncome ? 'E' : 'S' — mesmo valor de
      // `type` como ponto de partida, o usuário pode trocar para T/F.
      type_category: movementTypeCategoryOptions.getOption(initialTypeCategory ?? item.type, languageGB),
      account_uuid: accountOption,
      destination_account_uuid: null,
      farm_uuid: null,
      proprietary_uuid: null,
      client_uuid: null,
      provider_uuid: null,
      value: item.value,
      interest: null,
      document: '',
      note: initialNote,
      fiscal_document: false,
      generates_obligation: false,
      allocations: [
        {
          category_uuid: null,
          center_uuid: null,
          plan_account_uuid: null,
          harvest_uuid: null,
          value: item.value,
        },
      ],
    },
  });

  const {
    fields: allocationFields,
    append: appendAllocation,
    remove: removeAllocation,
  } = useFieldArray({ control, name: 'allocations' });

  const farmsQuery = useFarmsList();
  const farmOptions = (farmsQuery.data ?? []).map((farm) => ({
    label: farm.description,
    value: farm.uuid,
  }));

  // UT-000739 — escopo FAZENDA (não tenant): mirror do legado
  // (`OfxImportController.php:319-325`, `farm_proprietary`) e do mesmo
  // hook já usado por `CreateOrUpdateContaBancaria.tsx`
  // (`useProprietariesByFarms`). `activeFarmUuid` é a MESMA fonte
  // (`AuthContext`/`localStorage['app-active-farm']`) que o interceptor
  // Axios usa para montar o header `X-Farm-Id` (`services/api.ts`) — nunca
  // uma fonte nova. Entra na `queryKey` do hook (`useAccounts.tsx`), então
  // a lista refaz o fetch sozinha se o usuário trocar de fazenda ativa com
  // o modal aberto (mirror `cacheUniqs`/reset na troca de fazenda).
  const proprietariesQuery = useProprietariesList(activeFarmUuid ?? undefined);
  const proprietaryOptions = (proprietariesQuery.data ?? []).map((option) => ({
    label: option.label,
    value: option.uuid,
  }));

  // FLD-18 — autofill: se só existir 1 opção de proprietário, seleciona
  // automaticamente (mirror legado).
  useEffect(() => {
    if (proprietaryOptions.length === 1 && !watch('proprietary_uuid')) {
      setValue('proprietary_uuid', proprietaryOptions[0], { shouldDirty: false });
    }
    // Deps: roda só quando o TAMANHO da lista de opções muda (autofill
    // único, FLD-18) — `watch`/`setValue` são estáveis do RHF e
    // `proprietaryOptions` é recriado a cada render (não é uma dep útil).
  }, [proprietaryOptions.length]);

  const movementMutation = useRequest({
    asyncFunction: async (data: MovementFormType) => {
      // Saneia pelo estado derivado: nada desabilitado/oculto vai ao servidor.
      const submitState = deriveMovementFieldState({
        type: data.type?.value ?? null,
        typeCategory: data.type_category?.value ?? null,
        mode: 'create',
      });
      const parties = sanitizeMovementParties(submitState, {
        client: data.client_uuid,
        provider: data.provider_uuid,
        destination: data.destination_account_uuid,
      });
      const allocations: MovementAllocationPayload[] = data.allocations.map((row) => ({
        category_uuid: row.category_uuid!.value,
        center_uuid: row.center_uuid!.value,
        plan_account_uuid: row.plan_account_uuid?.value ?? null,
        harvest_uuid: row.harvest_uuid?.value ?? null,
        value: Number(row.value),
      }));

      const payload: MovementPayload = {
        date: data.date,
        type: data.type!.value,
        type_category: data.type_category!.value,
        account_uuid: data.account_uuid!.value,
        destination_account_uuid: parties.destination?.value ?? null,
        farm_uuid: data.farm_uuid?.value ?? null,
        proprietary_uuid: data.proprietary_uuid?.value ?? null,
        client_uuid: parties.client?.value ?? null,
        provider_uuid: parties.provider?.value ?? null,
        value: Number(data.value),
        document: data.document?.trim() || null,
        note: data.note?.trim() || null,
        fiscal_document: !!data.fiscal_document,
        generates_obligation: submitState.generatesObligation,
        allocations,
      };
      if (data.interest !== null && data.interest !== undefined) {
        payload.interest = Number(data.interest);
      }
      return await createMovement(payload);
    },
    entityName: movementText.singularLabel,
    queryKey: queryKey.financial.movements,
    typesRequest: 'create',
    personalizedMessage: text.successToast,
    actionSuccess: (movement: any) => {
      // Financiamento (F): quando a API devolve o rascunho de obrigação, só um
      // toast informativo — decisão do Atlas (P-r2-2): o modal OFX NÃO
      // redireciona para o título (o legado também não redireciona aqui). O
      // redirecionamento com rascunho vale na tela principal (create/update).
      if (movement?.generated_obligation_draft) {
        toaster.create({
          type: 'info',
          title: movementText.form.obligationDraftGenerated.title,
          description: movementText.form.obligationDraftGenerated.ofxNotice,
          duration: 9000,
        });
      }
      onSuccess();
      onClose();
    },
  });

  async function onSubmit(data: MovementFormType) {
    try {
      await movementMutation.mutateAsync(data);
    } catch (error) {
      applyServerFieldErrors(error, setError as any);
    }
  }

  const isSubmitting = movementMutation.isPending || isValidating;
  const watchedType = watch('type');
  const watchedTypeCategory = watch('type_category');
  const watchedValue = watch('value');
  // UT-000796 — mesmo estado derivado da tela principal (Tipo é FIXO aqui).
  const fieldState = deriveMovementFieldState({
    type: watchedType?.value ?? null,
    typeCategory: watchedTypeCategory?.value ?? null,
    mode: 'create',
  });
  const isTransfer = fieldState.destinationAccountVisible;
  // A parte permitida pela matriz (Financiamento inverte a parte): decide qual
  // campo/diálogo está ativo — não mais o Tipo isolado.
  const isIncome = fieldState.clientEnabled;
  const isExpense = fieldState.providerEnabled;
  const typeValue = watchedType?.value ?? null;
  // O2 (UT-000796 r2): o rateio do modal OFX restringe as Categorias pelo Tipo
  // × Tp. Categoria, com o MESMO mapa da tela principal (D-102-07). A limpeza
  // do rateio ao trocar o Tipo já existe (`handleTypeSelect`); nada novo aqui.
  const allocationCategoryParams = useMemo(
    () => deriveAllocationCategoryParams(typeValue, watchedTypeCategory?.value ?? null),
    [typeValue, watchedTypeCategory?.value]
  );
  const isTypeCategoryOptionDisabled = useCallback(
    (option: Option<any>) =>
      deriveMovementFieldState({ type: typeValue, typeCategory: null, mode: 'create' })
        .typeCategoryDisabledOptions[option.value as MovementTypeCategoryCode],
    [typeValue]
  );

  // Limpeza SOMENTE na ação do usuário (troca da Tp. Categoria).
  function handleTypeCategoryChange(option: Option<MovementTypeCategoryCode> | null) {
    const plan = planOnTypeCategoryChange(getValues('type')?.value ?? null, option?.value ?? null);
    resetPlanToOperations(plan, { allocationCount: 0 }).forEach(({ name, value }) => {
      setValue(name as any, value as any, {
        shouldDirty: name !== 'generates_obligation',
      });
      clearErrors(name as any);
    });
  }

  // TASK-065-OFX-FE-02 — uuid ATUAL do participante relevante (client OU
  // provider, nunca os 2 — `type` é fixo por transação), lido direto de
  // `watch` (mesmo racional de `CreateOrUpdateMovimento.tsx`: o modal
  // inline sempre reflete o valor corrente do campo, sem `useState` paralelo).
  const watchedClientUuid = watch('client_uuid');
  const watchedProviderUuid = watch('provider_uuid');
  const participantUuid = isIncome ? watchedClientUuid?.value : watchedProviderUuid?.value;

  return (
    <>
      <FormSurface
        variant={variant}
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size="xl"
        maxH="85vh"
        scrollableBody
        footer={
          <>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            />
            <Button
              title={text.submitButton}
              type="button"
              onClick={handleSubmit(onSubmit)}
              loading={isSubmitting}
            />
          </>
        }
      >
        <Form noPadding onSubmit={handleSubmit(onSubmit)}>
          <Text fontSize="sm" color="fg.muted" mb={4}>
            {text.hint}
          </Text>

          <SimpleGrid columns={cols(4)} gap={4}>
            <InputReadOnly
              label={movementText.form.fields.date}
              value={new Date(`${item.date}T00:00:00`).toLocaleDateString('pt-BR')}
            />
            <InputReadOnly
              label={movementText.form.fields.type}
              value={movementTypeOptions.getLabel(item.type, languageGB)}
            />
            <InputReadOnly label={movementText.form.fields.account} value={accountLabel} />
            <InputReadOnly
              label={movementText.form.fields.value}
              value={Number(item.value).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            />
          </SimpleGrid>

          <SimpleGrid columns={cols(3)} gap={4} mt={4}>
            <Controller
              name="type_category"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Select
                  label={text.typeCategoryLabel}
                  name={field.name}
                  options={movementTypeCategoryOptions.options(languageGB)}
                  value={field.value}
                  onChange={(option) => {
                    field.onChange(option ?? null);
                    handleTypeCategoryChange(option ?? null);
                  }}
                  isOptionDisabled={isTypeCategoryOptionDisabled}
                  error={error?.message}
                  isRequired
                  isDisabled={isSubmitting}
                />
              )}
            />

            {isTransfer && (
              <Controller
                name="destination_account_uuid"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={
                      fieldState.destinationAccountLabelKey === 'origin'
                        ? movementText.form.fields.originAccount
                        : movementText.form.fields.destinationAccount
                    }
                    placeholder={
                      fieldState.destinationAccountLabelKey === 'origin'
                        ? movementText.form.placeholders.originAccount
                        : movementText.form.placeholders.destinationAccount
                    }
                    service={listAccounts}
                    mapOptions={(accountItem: AccountListItem) => ({
                      label: `${accountItem.bank} — ${accountItem.agency}/${accountItem.account}`,
                      value: accountItem.uuid,
                    })}
                    findParams={findParamsFromSearch}
                    value={field.value ?? undefined}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={error?.message}
                    isRequired
                    isDisabled={isSubmitting}
                  />
                )}
              />
            )}

            <Controller
              name="proprietary_uuid"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectCombobox
                  name={field.name}
                  label={movementText.form.fields.proprietary}
                  placeholder={movementText.form.placeholders.proprietary}
                  options={proprietaryOptions}
                  loading={proprietariesQuery.isLoading}
                  value={field.value ?? null}
                  onChange={(option) => field.onChange(option ?? null)}
                  error={error?.message}
                  isRequired
                  disabled={isSubmitting}
                />
              )}
            />

            <Controller
              name="farm_uuid"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectCombobox
                  name={field.name}
                  label={movementText.form.fields.farm}
                  placeholder={movementText.form.placeholders.farm}
                  options={farmOptions}
                  value={field.value ?? null}
                  onChange={(option) => field.onChange(option ?? null)}
                  error={error?.message}
                  disabled={isSubmitting}
                />
              )}
            />
          </SimpleGrid>

          <SimpleGrid columns={cols(2)} gap={4} mt={4}>
            <Controller
              name="client_uuid"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={movementText.form.fields.client}
                  placeholder={movementText.form.placeholders.client}
                  service={listClientOptions}
                  mapOptions={(clientItem: ClientOptionItem) => ({
                    label: clientItem.name,
                    value: clientItem.uuid,
                  })}
                  findParams={findParamsFromSearch}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={error?.message}
                  isDisabled={isSubmitting || !isIncome}
                  // TASK-065-OFX-FE-02 — força reler a página 1 depois de
                  // criar/editar um cliente pelo modal ao lado (mirror
                  // `CreateOrUpdateMovimento.tsx`).
                  cacheUniqs={[participantOptionsCacheKey]}
                  // EST-07 — botão criar/editar Cliente inline
                  // (`InlineClienteFornecedorDialog`) migrado do `IconButton`
                  // avulso para o `labelAction`, mirror EXATO de
                  // `CreateOrUpdateMovimento.tsx`. Ícone condicional: `FiPlus`
                  // vazio, `FiEdit` já selecionado.
                  labelActionTooltip={
                    field.value
                      ? movementText.form.actions.editClientAria
                      : movementText.form.actions.addClientAria
                  }
                  labelAction={
                    <IconButton
                      aria-label={
                        field.value
                          ? movementText.form.actions.editClientAria
                          : movementText.form.actions.addClientAria
                      }
                      variant="ghost"
                      size="2xs"
                      minH="0"
                      h="20px"
                      w="20px"
                      minW="0"
                      p="0"
                      disabled={
                        isSubmitting || !isIncome || !(can('clients_create') || can('clients_edit'))
                      }
                      onClick={participantModalDisclosure.onOpen}
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
                  label={movementText.form.fields.provider}
                  placeholder={movementText.form.placeholders.provider}
                  service={listProviderOptions}
                  mapOptions={(providerItem: ProviderOptionItem) => ({
                    label: providerItem.label,
                    value: providerItem.uuid,
                  })}
                  findParams={findParamsFromSearch}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={error?.message}
                  isDisabled={isSubmitting || !isExpense}
                  // TASK-065-OFX-FE-02 — força reler a página 1 depois de
                  // criar/editar um fornecedor pelo modal ao lado.
                  cacheUniqs={[participantOptionsCacheKey]}
                  // EST-07 — botão criar/editar Fornecedor inline migrado do
                  // `IconButton` avulso para o `labelAction`, mirror EXATO do
                  // botão de Cliente acima.
                  labelActionTooltip={
                    field.value
                      ? movementText.form.actions.editProviderAria
                      : movementText.form.actions.addProviderAria
                  }
                  labelAction={
                    <IconButton
                      aria-label={
                        field.value
                          ? movementText.form.actions.editProviderAria
                          : movementText.form.actions.addProviderAria
                      }
                      variant="ghost"
                      size="2xs"
                      minH="0"
                      h="20px"
                      w="20px"
                      minW="0"
                      p="0"
                      disabled={
                        isSubmitting ||
                        !isExpense ||
                        !(can('providers_create') || can('providers_edit'))
                      }
                      onClick={participantModalDisclosure.onOpen}
                    >
                      <Icon as={field.value ? FiEdit : FiPlus} boxSize="16px" color="primaryMain" />
                    </IconButton>
                  }
                />
              )}
            />
          </SimpleGrid>

          <SimpleGrid columns={cols(2)} gap={4} mt={4}>
            <Controller
              name="interest"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <MoneyInput
                  name={field.name}
                  label={movementText.form.fields.interest}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  error={error?.message}
                  disabled={isSubmitting}
                />
              )}
            />

            <Input
              label={movementText.form.fields.document}
              maxLength={100}
              {...register('document')}
              error={errors.document?.message}
              disabled={isSubmitting}
            />
          </SimpleGrid>

          <Box mt={4}>
            <Textarea
              label={movementText.form.fields.note}
              maxLength={600}
              {...register('note')}
              error={errors.note?.message}
              disabled={isSubmitting}
            />
          </Box>

          <Box mt={4}>
            <Controller
              name="fiscal_document"
              control={control}
              render={({ field }) => (
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Text fontSize="sm" fontWeight="medium">
                    {movementText.form.fields.fiscalDocument}
                  </Text>
                  {/* @ts-ignore - Chakra UI v3 Switch API */}
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={(d: any) => field.onChange(d.checked)}
                    colorPalette="green"
                    disabled={isSubmitting}
                    aria-label={movementText.form.fields.fiscalDocument}
                  />
                </Box>
              )}
            />
          </Box>

          <Box mt={4}>
            <MovementAllocationEditor
              control={control}
              fields={allocationFields}
              append={appendAllocation as any}
              remove={removeAllocation}
              headerValue={Number(watchedValue) || 0}
              errors={errors}
              languageGB={languageGB}
              disabled={isSubmitting}
              // Fidelidade ao legado (`#modal-movement`, FLD-12..29) — o modal
              // de conciliação OFX NUNCA teve campo Safra visível; entrou só
              // porque o backend aceita `allocations[].harvest_uuid`
              // (`present, nullable`). UI escondida aqui, valor continua
              // `null` em cada linha (`defaultValues`/`handleAdd` do editor) e
              // o submit abaixo continua enviando a CHAVE presente.
              showHarvest={false}
              categoryOptionsParams={allocationCategoryParams}
            />
          </Box>
        </Form>
      </FormSurface>

      {/* TASK-065-OFX-FE-02 — modal ÚNICO de criar/editar Cliente/Fornecedor
          (ramifica internamente por `isIncome`). `participantUuid` lido
          direto de `watch` acima — o modal sempre reflete o campo ATUAL. */}
      <InlineClienteFornecedorDialog
        isOpen={participantModalDisclosure.open}
        onClose={participantModalDisclosure.onClose}
        isIncome={isIncome}
        participantUuid={participantUuid}
        onSaved={(participant) => {
          if (isIncome) {
            setValue(
              'client_uuid',
              { value: participant.uuid, label: participant.label },
              { shouldDirty: true, shouldValidate: true }
            );
          } else {
            applySavedProvider(participant, () =>
              setValue(
                'provider_uuid',
                { value: participant.uuid, label: participant.label },
                { shouldDirty: true, shouldValidate: true }
              )
            );
          }
          setParticipantOptionsCacheKey((key) => key + 1);
        }}
      />
    </>
  );
}
