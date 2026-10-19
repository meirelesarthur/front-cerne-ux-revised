// src/pages/Operacional/Romaneios/CreateOrUpdateRomaneio.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de ROMANEIO (Transfer) — Operacional
// (TASK-TRF-FE-02, casca + aba Cabeçalho; TASK-TRF-FE-03 acrescenta o
// `useForm` raiz das Itens/Totais; TASK-TRF-FE-04 fecha o submit — payload
// completo de despesas, bloco 422 duplo, gate da aba — mantendo cada aba em
// arquivo próprio). Rotas: /operacional/romaneios/novo e
// /operacional/romaneios/:transferUuid (GUID), registradas em
// src/router/index.tsx (posições reservadas pela TASK-TRF-FE-01).
//
// Referência UX (GAP-TRF-FE-01 — UX-GAP, tela ausente no design system
// `cerne`, derivada por composição canônica + análogos):
//   GB.Cerne.UX @ 24bd91603a6ee4e19b58fa5efe2221835c83e306
//   Análogo estrutural: src/pages/financeiro/baixa-titulos/BaixaTitulosPage.tsx
//   Molde de código na SPA (sibling-first):
//     src/pages/Invoices/CreateOrUpdateInvoice.tsx:749-1140 (casca de abas,
//     1 useForm raiz, Tabs.Root com `value` string)
//     src/pages/Administrativo/Equipes/CreateOrUpdateEquipe.tsx (fillForm
//     nomeado com guarda, footer com onClick={handleSubmit(onSubmit)}
//     — armadilha #18 da Tarefa, guarda de saída sem salvar)
//
// Casca de 3 abas — Cabeçalho (campos deste arquivo) · Itens & Totais
// (`RomaneioItemsTab.tsx`/`RomaneioTotalsBlock.tsx`, TASK-TRF-FE-03) ·
// Despesas acessórias (`RomaneioExpensesTab.tsx`/`RomaneioExpenseRow.tsx`,
// TASK-TRF-FE-04, contrato §5.6) — a aba 2 só é renderizada sob
// `canSeeExpensesTab` (`canAny(['service_view','reversal_view'])`).
//
// GAP-TRF-FE-05 — banners de imutabilidade/origem (`TransferGuardBanners`,
// 5 casos) + `isReadOnly` quando falta `transfers_edit` OU o registro tem
// `has_fiscal_document`/`has_financial_posting` (contrato de tela §5.1).
//
// GAP-TRF-FE-14 — 403 em satélite OPCIONAL (`providers/options`/
// `proprietaries/options`) degrada graciosamente (select desabilitado +
// hint); 403 em satélite OBRIGATÓRIO (`clients`/`users`/`payment-terms`)
// bloqueia o Salvar com banner de erro no topo.
//
// Armadilhas de payload (contrato de tela §5.7, Tarefa #3/#4/#5/#6/#7/#8):
//   1. `payment_indicator` é `int` — `Option<number>`, conversão explícita.
//   2. `type_payment` é string com zero à esquerda ("01".."99").
//   3. `due_date` vazio → chave OMITIDA, nunca `null` explícito.
//   4. `type==='C'` → `fiscal_document=false`; `'V'` → `true`.
//   5. `farm_id`/`tenant_id` NUNCA no formulário/payload.
//   6. `PUT` é substituição integral — nunca delta de `dirtyFields`.
//   7. `serie`/`salesman` são read-only do Resource — NÃO existem aqui
//      (pertencem à visualização, TASK-TRF-FE-05).
//
// TASK-TRF-FE-04 — `expenses` é `present|array` (SEMPRE no payload, inclusive
// `[]`, D6 — inverso da armadilha de Equipes); gate da aba força `[]` quando
// falta `service_view`/`reversal_view` (ver `canSeeExpensesTab` abaixo).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, SimpleGrid, Tabs, Text, useDisclosure } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { PercentInput } from '@/components/Form/PercentInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { isValidGuid } from '@/utils/guid';
import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import {
  paymentIndicatorOptions,
  transferPaymentTypeOptions,
  transferTypeOptions,
} from '@/constants/transfers/options';

import { transferSchemaResolver } from '@/validations/schemas/Romaneios/transfer-schema';

import { listPaymentTerms } from '@/services/v2/BaseRegistrations/paymentTerms-service';
import { listTypeTitleOptions } from '@/services/v2/BaseRegistrations/typeTitles-service';
import { listClients } from '@/services/v2/CadastrosBase/Client/client-service';
import { createTransfer, updateTransfer } from '@/services/v2/Transfers/transfer-service';
import { listUsers } from '@/services/v2/Users/user-service';

import type { Option } from '@/@types/option';
import type { PaymentTermListItem } from '@/@types/v2/BaseRegistrations/paymentTerms';
import type { TypeTitleOptionItem } from '@/@types/v2/BaseRegistrations/typeTitles';
import type { ClientListItem } from '@/@types/v2/CadastrosBase/client';
import type {
  CreateTransferRequest,
  TransferDetail,
  TransferForm as TransferFormValues,
  TransferPaymentType,
  TransferType,
} from '@/@types/v2/Transfers';
import type { UserListItem } from '@/@types/v2/Users';

import { RomaneioExpensesTab } from './RomaneioExpensesTab';
import { RomaneioItemsTab } from './RomaneioItemsTab';
import { TransferGuardBanners } from './TransferGuardBanners';
import {
  buildTransferExpensePayload,
  buildTransferItemPayload,
  createEmptyTransferItem,
  NOT_INFORMED_LABEL,
  transferExpenseToForm,
  transferItemToForm,
  useTransferForm,
  useTransferProprietaryCatalogOptions,
  useTransferProviderCatalogOptions,
} from './useRomaneios';

type RomaneioTabKey = '0' | '1' | '2';

function todayIso(): string {
  return todayLocalIso();
}

// GAP-TRF-FE-14 — sonda LEVE (`per_page=1`) para os 3 satélites OBRIGATÓRIOS
// (`clients`/`users`/`payment-terms`): o `SelectAsyncPaginate` interativo já
// resolve o 403 com um toast próprio (não propaga estado ao pai), então a
// única forma de saber ANTES do clique se o catálogo obrigatório está
// acessível é uma requisição dedicada, mínima, só para inspecionar o status.
// Devolve `true` quando a resposta foi 403 (forbidden).
function useTransferForbiddenProbe(
  queryKeySuffix: string,
  probe: () => Promise<unknown>,
  enabled: boolean
): boolean {
  const probeQuery = useQuery({
    queryKey: ['transfers-form-required-satellite-probe', queryKeySuffix],
    queryFn: probe,
    enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  return isAxiosError(probeQuery.error) && probeQuery.error.response?.status === 403;
}

export default function CreateOrUpdateRomaneio() {
  const { transferUuid } = useParams<{ transferUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can, canAny } = usePermissions();

  // GAP-TRF-FE-14/contrato §"Tela/Rota" — a aba de Despesas acessórias só
  // existe quando o usuário tem PELO MENOS UMA das permissões (paridade
  // literal do `@canany` legado). Sem elas, o formulário tem 2 abas e o
  // payload segue enviando `expenses: []` (comportamento correto do
  // `present|array`, D6) — sem nenhum código extra, é só o `useFieldArray`
  // nunca sendo tocado.
  const canSeeExpensesTab = canAny(['service_view', 'reversal_view']);

  const text = languageGB.transfers.transfer;
  const formText = text.form;

  // Detecção de modo (convenção do fork) — "novo" não é GUID.
  const isEditing = isValidGuid(transferUuid);

  // Guard — `transferUuid` presente e malformado não pode chegar ao hook de
  // detalhe (`useCustomFormQueryByGuid` só desabilita a query, não
  // redireciona). Rota "/novo" (`transferUuid` undefined) não passa por aqui.
  useEffect(() => {
    if (!transferUuid) return;
    if (!isValidGuid(transferUuid)) {
      navigate('/operacional/romaneios', { replace: true });
    }
  }, [transferUuid, navigate]);

  const canSave = isEditing ? can('transfers_edit') : can('transfers_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, dirtyFields, isDirty },
  } = useForm<TransferFormValues>({
    mode: 'onChange',
    resolver: transferSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      dt_sale: todayIso(),
      dt_shipping: todayIso(),
      due_date: null,
      type: null,
      client_uuid: null,
      user_uuid: null,
      seller_uuid: null,
      commission: null,
      nfe: '',
      payment_term_uuid: null,
      // Decisão D7/§6 — default explícito "01" (Dinheiro), não "1ª da lista".
      type_payment: {
        label: transferPaymentTypeOptions.getLabel('01', languageGB),
        value: '01',
      },
      // Default "A Vista" (contrato §5.3/FC-HDR-14).
      payment_indicator: {
        label: paymentIndicatorOptions.getLabel(0, languageGB),
        value: 0,
      },
      type_title_uuid: null,
      transporter_uuid: null,
      proprietary_uuid: null,
      driver: '',
      fiscal_document: true,
      note: '',
      // Create inicia com 1 linha vazia (contrato §5.4 "Adicionar/remover
      // linha"); edição chega vazia aqui e é substituída pelo `reset()` de
      // `fillTransferForm` assim que o `GET` resolve.
      items: isEditing ? [] : [createEmptyTransferItem()],
      expenses: [],
      // Bloco "Totais" (TASK-TRF-FE-03, contrato §5.5) — default `0`, mesmo
      // shape do payload de exemplo do contrato §5.7.
      icms: 0,
      freight: 0,
      others_values: 0,
      discount: 0,
      funrural_percentage: 0,
    },
  });

  // Lei do fork (`get_pwa_form_query_pattern`) — função NOMEADA com guarda de
  // `dirtyFields`; NUNCA `reset()` solto em `useEffect` (armadilha #12 da
  // Tarefa — apagaria o que o usuário digitou num refetch).
  function fillTransferForm(data: TransferDetail, resetForce?: boolean) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (!(hasNoFormChanges || resetForce)) return;

    reset({
      dt_sale: data.dt_sale,
      dt_shipping: data.dt_shipping,
      due_date: data.due_date ?? null,
      type: { label: transferTypeOptions.getLabel(data.type, languageGB), value: data.type },
      // DD-078-04 — `client`/`seller`/`transporter`/`proprietary` vêm como
      // `{uuid, name}` (`people.name`): rótulo já no 1º render, sem GET
      // satélite. Sem `name` → placeholder (NUNCA o uuid).
      client_uuid: data.client
        ? { label: data.client.name || NOT_INFORMED_LABEL, value: data.client.uuid }
        : null,
      // `user` é o único satélite que o Resource já hidrata com rótulo.
      user_uuid: data.user ? { label: data.user.label, value: data.user.uuid } : null,
      seller_uuid: data.seller
        ? { label: data.seller.name || NOT_INFORMED_LABEL, value: data.seller.uuid }
        : null,
      commission: data.commission ?? null,
      nfe: data.nfe ?? '',
      payment_term_uuid: data.payment_term
        ? { label: data.payment_term.description, value: data.payment_term.uuid }
        : null,
      type_payment: {
        label: transferPaymentTypeOptions.getLabel(data.type_payment, languageGB),
        value: data.type_payment,
      },
      payment_indicator: {
        label: paymentIndicatorOptions.getLabel(data.payment_indicator, languageGB),
        value: data.payment_indicator,
      },
      type_title_uuid: data.type_title
        ? { label: data.type_title.description, value: data.type_title.uuid }
        : null,
      transporter_uuid: data.transporter
        ? { label: data.transporter.name || NOT_INFORMED_LABEL, value: data.transporter.uuid }
        : null,
      proprietary_uuid: data.proprietary
        ? { label: data.proprietary.name || NOT_INFORMED_LABEL, value: data.proprietary.uuid }
        : null,
      driver: data.driver ?? '',
      fiscal_document: !!data.fiscal_document,
      note: data.note ?? '',
      // Itens (TASK-TRF-FE-03) — `item_uuid` SEMPRE preservado (armadilha
      // #1: perdê-lo faz o servidor apagar/recriar a linha e movimentar
      // estoque duas vezes). `total_amount` hidrata com o valor do PRÓPRIO
      // servidor (2 casas) — nunca recalculado de `quantity*amount` aqui
      // (armadilha #2, drift de centavos).
      items: data.items.map(transferItemToForm),
      // Despesas acessórias (TASK-TRF-FE-04, contrato §5.6/§DoD) — gate
      // `canSeeExpensesTab` (`canAny(['service_view','reversal_view'])`,
      // paridade literal do `@canany` legado): SEM a permissão, a aba não
      // existe e o formulário nunca hidrata despesa nenhuma — `expenses`
      // fica `[]` mesmo que o `GET` traga despesas reais (o servidor não
      // filtra por permissão), porque o payload é sempre construído a
      // partir do ESTADO DO FORM, nunca do servidor. É o comportamento
      // aprovado no gate (`gaps-front-romaneios.md`, `FE-07`/`FE-14`) — não
      // uma perda acidental. COM a permissão, hidratação real via
      // `transferExpenseToForm` (mapper campo a campo, NUNCA spread cru do
      // GET — defesa em profundidade da armadilha #2).
      expenses: canSeeExpensesTab
        ? data.expenses.map((expense) => transferExpenseToForm(expense, languageGB))
        : [],
      // Bloco "Totais" (TASK-TRF-FE-03) — hidratado com os valores do
      // PRÓPRIO servidor (`discount` é o único monetário que pode vir
      // `null`, contrato §4.1).
      icms: data.icms,
      freight: data.freight,
      others_values: data.others_values,
      discount: data.discount ?? 0,
      funrural_percentage: data.funrural_percentage,
    });
  }

  const transferQuery = useTransferForm({
    registrationId: isEditing ? transferUuid : undefined,
    fillForm: fillTransferForm,
  });

  const transferDetail = transferQuery.data as TransferDetail | undefined;
  const isLoading = isEditing && checkLoadingStatus([transferQuery as any]);

  // GAP-TRF-FE-05 — `isReadOnly` quando falta `transfers_edit` OU o registro
  // já tem NF-e/financeiro lançado (contrato de tela §5.1). Enquanto o
  // detalhe ainda não chegou, o formulário fica no estado padrão (os campos
  // já ficam `isDisabled` por `isLoading`).
  const isReadOnly =
    isEditing &&
    !!transferDetail &&
    (!can('transfers_edit') ||
      transferDetail.has_fiscal_document ||
      transferDetail.has_financial_posting);

  const isDisabledField = !canSave || isReadOnly || isLoading;

  // ---- Satélites planos (`providers/options`/`proprietaries/options`) —
  // GAP-TRF-FE-14: 403 degrada graciosamente (select desabilitado + hint),
  // nunca derruba a tela. Em read-only NÃO chamados (403 esperado; o rótulo
  // já veio hidratado por `fillTransferForm`), mesmo racional de
  // `CreateOrUpdateEquipe.tsx`.
  const providerCatalogQuery = useTransferProviderCatalogOptions({ enabled: !isReadOnly });
  const providerCatalogForbidden =
    isAxiosError(providerCatalogQuery.error) && providerCatalogQuery.error.response?.status === 403;
  const providerCatalogOptions: Option<string>[] = (
    providerCatalogQuery.data?.data.items ?? []
  ).map((item) => ({ label: item.label, value: item.uuid }));

  const proprietaryCatalogQuery = useTransferProprietaryCatalogOptions({ enabled: !isReadOnly });
  const proprietaryCatalogForbidden =
    isAxiosError(proprietaryCatalogQuery.error) &&
    proprietaryCatalogQuery.error.response?.status === 403;
  const proprietaryCatalogOptions: Option<string>[] = (proprietaryCatalogQuery.data ?? []).map(
    (item) => ({ label: item.label, value: item.uuid })
  );

  // Mesma armadilha de `CreateOrUpdateEquipe.tsx` (`currentSupervisor`): em
  // read-only OU antes do catálogo carregar, o valor hidratado precisa ser
  // semeado na lista de opções, senão o `Select` mostraria o campo em
  // branco mesmo com `field.value` corretamente preenchido.
  const currentSeller = watch('seller_uuid');
  const sellerOptions =
    currentSeller && !providerCatalogOptions.some((option) => option.value === currentSeller.value)
      ? [currentSeller, ...providerCatalogOptions]
      : providerCatalogOptions;

  const currentTransporter = watch('transporter_uuid');
  const transporterOptions =
    currentTransporter &&
    !providerCatalogOptions.some((option) => option.value === currentTransporter.value)
      ? [currentTransporter, ...providerCatalogOptions]
      : providerCatalogOptions;

  const currentProprietary = watch('proprietary_uuid');
  const proprietaryOptions =
    currentProprietary &&
    !proprietaryCatalogOptions.some((option) => option.value === currentProprietary.value)
      ? [currentProprietary, ...proprietaryCatalogOptions]
      : proprietaryCatalogOptions;

  // ---- Satélites OBRIGATÓRIOS (`clients`/`users`/`payment-terms`) —
  // GAP-TRF-FE-14: 403 aqui bloqueia o Salvar com banner no topo (o
  // `SelectAsyncPaginate` interativo engole o erro num toast próprio e não
  // propaga estado — uma sonda LEVE, `per_page=1`, é o único jeito de saber
  // ANTES do clique se o catálogo obrigatório está acessível).
  const clientsAccessProbe = useTransferForbiddenProbe(
    'clients',
    () => listClients({ page: 1, per_page: 1 }),
    !isReadOnly
  );
  const usersAccessProbe = useTransferForbiddenProbe(
    'users',
    () => listUsers({ page: 1, per_page: 1 }),
    !isReadOnly
  );
  const paymentTermsAccessProbe = useTransferForbiddenProbe(
    'payment-terms',
    () => listPaymentTerms({ page: 1, per_page: 1 }),
    !isReadOnly
  );

  const requiredSatelliteErrors: string[] = [];
  if (clientsAccessProbe) requiredSatelliteErrors.push(formText.requiredSatelliteError.clients);
  if (usersAccessProbe) requiredSatelliteErrors.push(formText.requiredSatelliteError.users);
  if (paymentTermsAccessProbe) {
    requiredSatelliteErrors.push(formText.requiredSatelliteError.paymentTerms);
  }
  const hasRequiredSatelliteError = requiredSatelliteErrors.length > 0;

  // ---- Saída com alterações não salvas (contrato de tela §5.1) -----------
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

  const [businessError, setBusinessErrorState] = useState<string | undefined>(undefined);

  const transferMutation = useRequest({
    asyncFunction: tryPersistTransfer,
    entityName: text.singularLabel,
    queryKey: queryKey.transfers.transfers,
    queryKey2: queryKey.transfers.transfer,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistTransfer(data: TransferFormValues) {
    setBusinessErrorState(undefined);

    const payload: CreateTransferRequest = {
      type: data.type!.value,
      dt_sale: data.dt_sale!,
      dt_shipping: data.dt_shipping!,
      // Armadilha #5/#8 — chave OMITIDA quando vazia, nunca `null` explícito
      // (o servidor deriva de `dt_sale` + condição de pagamento; sobrescrever
      // com `null` apagaria um vencimento já gravado na edição).
      ...(data.due_date ? { due_date: data.due_date } : {}),
      client_uuid: data.client_uuid!.value,
      user_uuid: data.user_uuid!.value,
      seller_uuid: data.seller_uuid?.value ?? null,
      transporter_uuid: data.transporter_uuid?.value ?? null,
      proprietary_uuid: data.proprietary_uuid?.value ?? null,
      payment_term_uuid: data.payment_term_uuid!.value,
      // Armadilha #4 — string com zero à esquerda ("01".."99"), nunca number.
      type_payment: data.type_payment!.value,
      // Armadilha #3 — `int` (0/1), nunca string.
      payment_indicator: data.payment_indicator!.value,
      type_title_uuid: data.type_title_uuid!.value,
      fiscal_document: !!data.fiscal_document,
      driver: data.driver.trim() || null,
      nfe: data.nfe.trim() || null,
      note: data.note.trim() || null,
      commission: data.commission ?? undefined,
      // Bloco "Totais" (TASK-TRF-FE-03, contrato §5.5) — só os 5 campos que
      // vão ao payload; `total_products`/`funrural`/`total` NUNCA (são
      // prévia pura, calculada em `RomaneioTotalsBlock.tsx`).
      funrural_percentage: data.funrural_percentage ?? 0,
      icms: data.icms ?? 0,
      freight: data.freight ?? 0,
      others_values: data.others_values ?? 0,
      discount: data.discount ?? 0,
      // Itens (TASK-TRF-FE-03) — descarta TODOS os derivados/client-only
      // (`total_amount`, `factor`, `factor_type`, `measurement_second` —
      // armadilha #3) via `buildTransferItemPayload`. `items: []` é 422
      // esperado (`required|min:1`) mas a tela nunca permite chegar lá (a
      // aba trava a remoção da última linha, armadilha #13).
      items: (data.items ?? []).map(buildTransferItemPayload),
      // Despesas acessórias (TASK-TRF-FE-04) — `expenses` é `present|array`
      // no servidor: SEMPRE presente no payload, inclusive `[]` (D6, o
      // inverso da armadilha de Equipes). `buildTransferExpensePayload`
      // descarta o client-only `use_kg` e o derivado `value` (armadilha #5).
      expenses: (data.expenses ?? []).map(buildTransferExpensePayload),
    };

    try {
      // Armadilha #6 — `PUT` é SEMPRE o recurso COMPLETO (nunca delta de
      // `dirtyFields`); `payload` acima já é sempre full-resource.
      return isEditing && transferUuid
        ? await updateTransfer(transferUuid, payload)
        : await createTransfer(payload);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          // Com `errors` → `setError` campo a campo. As chaves indexadas
          // (`items.0.product_uuid`) casam com o `useFieldArray` das Tarefas
          // irmãs — aqui `items`/`expenses` estão sempre vazios, então só o
          // erro de `items` (min:1) é esperado nesta fatia.
          Object.entries(fieldErrors).forEach(([field, fieldMessages]) => {
            if (fieldMessages?.[0]) {
              setError(field as any, { type: 'server', message: fieldMessages[0] });
            }
          });
        } else {
          // Sem `errors` (regra de negócio: NF-e/financeiro vinculado, ou
          // estoque insuficiente) → mensagem no TOPO do formulário.
          const serverMessage = (error.response.data as any)?.message;
          setBusinessErrorState(
            typeof serverMessage === 'string'
              ? serverMessage
              : (extractApiErrorMessage(error) ?? formText.businessErrorFallback)
          );
        }
      }
      // `throw` preserva o toast genérico do `useRequest`.
      throw error;
    }
  }

  async function onSubmit(data: TransferFormValues) {
    await transferMutation.mutateAsync(data);
  }

  const isSubmitting = transferMutation.isPending;

  const typeOptions = transferTypeOptions.options(languageGB);
  const typePaymentOptions = transferPaymentTypeOptions.options(languageGB);
  const paymentIndicatorSelectOptions = paymentIndicatorOptions.options(languageGB);

  const [tabValue, setTabValueState] = useState<RomaneioTabKey>('0');

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      subtitle={isEditing ? formText.subtitle.edit : formText.subtitle.create}
      footer={
        <>
          <Button
            title={isReadOnly ? formText.backButton : languageGB.defaltStrings.cancel}
            variant="outline"
            type="button"
            onClick={guardedBack}
          />
          {canSave && !isReadOnly && (
            <Button
              title={languageGB.defaltStrings.save}
              type="button"
              onClick={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading || hasRequiredSatelliteError}
            />
          )}
        </>
      }
    >
      <TransferGuardBanners detail={transferDetail} languageGB={languageGB} />

      {hasRequiredSatelliteError && (
        <Box mb={4} p={3} borderRadius="md" bg="feedBack.error">
          {requiredSatelliteErrors.map((message) => (
            <Text key={message} fontSize="sm" color="feedBack.errorMain">
              {message}
            </Text>
          ))}
        </Box>
      )}

      {businessError && (
        <Box mb={4} p={3} borderRadius="md" bg="feedBack.error">
          <Text fontSize="sm" color="feedBack.errorMain">
            {businessError}
          </Text>
        </Box>
      )}

      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* @ts-ignore - custom variant */}
        <Tabs.Root
          value={tabValue}
          onValueChange={(details: { value: string }) =>
            setTabValueState(details.value as RomaneioTabKey)
          }
          variant="outline"
        >
          {/* @ts-ignore - Tab List sticky no topo do body: abas sempre visíveis, só o conteúdo rola. */}
          <Tabs.List position="sticky" top="0" zIndex={1} bg="formBG">
            {/* @ts-ignore */}
            <Tabs.Trigger value="0">{formText.tabs.header}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="1">{formText.tabs.items}</Tabs.Trigger>
            {/* GAP-TRF-FE-14/contrato §"Tela/Rota" — a aba só EXISTE sob
                `canAny(['service_view','reversal_view'])`, paridade literal
                do `@canany` legado. Sem a permissão, o formulário tem 2
                abas e o payload segue com `expenses: []` (ver
                `tryPersistTransfer`/`fillTransferForm` acima). */}
            {canSeeExpensesTab && (
              // @ts-ignore
              <Tabs.Trigger value="2">{formText.tabs.expenses}</Tabs.Trigger>
            )}
          </Tabs.List>

          {/* ---- ABA 0: Cabeçalho (TASK-TRF-FE-02, ESTE arquivo) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="0">
            <Text fontWeight="semibold" mb={3} mt={4}>
              {formText.sections.general}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
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
                      disabled={isDisabledField}
                    />
                  )}
                />
                {errors.dt_sale?.message && (
                  <Text fontSize="xs" color="fg.error" mt={1}>
                    {errors.dt_sale.message}
                  </Text>
                )}
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {formText.fields.dtShipping}
                  <Text as="span" color="fg.error">
                    {' '}
                    *
                  </Text>
                </Text>
                <Controller
                  name="dt_shipping"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <DateInput
                      value={value ?? null}
                      onChange={onChange}
                      disabled={isDisabledField}
                    />
                  )}
                />
                {errors.dt_shipping?.message && (
                  <Text fontSize="xs" color="fg.error" mt={1}>
                    {errors.dt_shipping.message}
                  </Text>
                )}
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
                      disabled={isDisabledField}
                    />
                  )}
                />
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  {formText.hints.dueDateAuto}
                </Text>
              </Box>

              <Controller
                name="type"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.type}
                    placeholder={formText.placeholders.type}
                    name={name}
                    value={value}
                    onChange={(option: Option<TransferType> | null) => {
                      onChange(option ?? null);
                      // Armadilha #6 — cascata literal do legado.
                      if (option) {
                        setValue('fiscal_document', option.value === 'V', { shouldDirty: true });
                      }
                    }}
                    options={typeOptions}
                    error={errors.type?.message as string | undefined}
                    isRequired
                    isDisabled={isDisabledField}
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
                    service={listClients}
                    mapOptions={(item: ClientListItem) => ({ label: item.name, value: item.uuid })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={errors.client_uuid?.message as string | undefined}
                    isRequired
                    isDisabled={isDisabledField}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Controller
                name="user_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.user}
                    placeholder={formText.placeholders.user}
                    service={listUsers}
                    mapOptions={(item: UserListItem) => ({ label: item.name, value: item.uuid })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={errors.user_uuid?.message as string | undefined}
                    isRequired
                    isDisabled={isDisabledField}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Controller
                name="seller_uuid"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.seller}
                    placeholder={formText.placeholders.seller}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={sellerOptions}
                    loading={!isReadOnly && providerCatalogQuery.isLoading}
                    isDisabled={isDisabledField || providerCatalogForbidden}
                    helperText={
                      providerCatalogForbidden ? formText.hints.satelliteForbidden : undefined
                    }
                  />
                )}
              />

              <Controller
                name="commission"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <PercentInput
                    name={name}
                    label={formText.fields.commission}
                    value={value}
                    onValueChange={onChange}
                    error={errors.commission?.message}
                    disabled={isDisabledField}
                  />
                )}
              />
            </SimpleGrid>

            <Text fontWeight="semibold" mb={3} mt={8}>
              {formText.sections.billing}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <Input
                label={formText.fields.nfe}
                {...register('nfe')}
                error={errors.nfe?.message}
                maxLength={15}
                loading={isLoading}
                disabled={isDisabledField}
              />

              <Controller
                name="payment_term_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.paymentTerm}
                    placeholder={formText.placeholders.paymentTerm}
                    service={listPaymentTerms}
                    mapOptions={(item: PaymentTermListItem) => ({
                      label: item.description,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={errors.payment_term_uuid?.message as string | undefined}
                    isRequired
                    isDisabled={isDisabledField}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Controller
                name="type_payment"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.typePayment}
                    placeholder={formText.placeholders.typePayment}
                    name={name}
                    value={value}
                    onChange={(option: Option<TransferPaymentType> | null) =>
                      onChange(option ?? null)
                    }
                    options={typePaymentOptions}
                    error={errors.type_payment?.message as string | undefined}
                    isRequired
                    isDisabled={isDisabledField}
                  />
                )}
              />

              <Controller
                name="payment_indicator"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.paymentIndicator}
                    placeholder={formText.placeholders.paymentIndicator}
                    name={name}
                    value={value}
                    onChange={(option) => onChange(option ?? null)}
                    options={paymentIndicatorSelectOptions}
                    error={errors.payment_indicator?.message as string | undefined}
                    isRequired
                    isDisabled={isDisabledField}
                  />
                )}
              />

              <Controller
                name="type_title_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.typeTitle}
                    placeholder={formText.placeholders.typeTitle}
                    service={listTypeTitleOptions}
                    mapOptions={(item: TypeTitleOptionItem) => ({
                      label: item.description,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={errors.type_title_uuid?.message as string | undefined}
                    isRequired
                    isDisabled={isDisabledField}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Controller
                name="transporter_uuid"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.transporter}
                    placeholder={formText.placeholders.transporter}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={transporterOptions}
                    loading={!isReadOnly && providerCatalogQuery.isLoading}
                    isDisabled={isDisabledField || providerCatalogForbidden}
                    helperText={
                      providerCatalogForbidden ? formText.hints.satelliteForbidden : undefined
                    }
                  />
                )}
              />

              <Controller
                name="proprietary_uuid"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={formText.fields.proprietary}
                    placeholder={formText.placeholders.proprietary}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={proprietaryOptions}
                    loading={!isReadOnly && proprietaryCatalogQuery.isLoading}
                    isDisabled={isDisabledField || proprietaryCatalogForbidden}
                    helperText={
                      proprietaryCatalogForbidden ? formText.hints.satelliteForbidden : undefined
                    }
                  />
                )}
              />

              <Input
                label={formText.fields.driver}
                {...register('driver')}
                error={errors.driver?.message}
                maxLength={50}
                loading={isLoading}
                disabled={isDisabledField}
              />

              <Controller
                name="fiscal_document"
                control={control}
                render={({ field }) => (
                  <Box display="flex" alignItems="center" justifyContent="space-between" h="full">
                    <Text fontSize="sm" fontWeight="medium">
                      {formText.fields.fiscalDocument}
                    </Text>
                    {/* @ts-ignore - Chakra UI v3 Switch API */}
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={(d: any) => field.onChange(d.checked)}
                      colorPalette="green"
                      disabled={isDisabledField}
                      aria-label={formText.fields.fiscalDocument}
                    />
                  </Box>
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
          </Tabs.Content>

          {/* ---- ABA 1: Itens — STUB (TASK-TRF-FE-03) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="1">
            <RomaneioItemsTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isDisabled={isDisabledField}
              // GAP-TRF-FE-05/FC-ITEM-13 — repeater somente-leitura quando a
              // origem é Carga/Pesagem (banner já vem de
              // `TransferGuardBanners`, acima).
              isItemsLocked={!!transferDetail?.is_from_charge || !!transferDetail?.is_from_weighing}
            />
          </Tabs.Content>

          {/* ---- ABA 2: Despesas acessórias (TASK-TRF-FE-04) ----
              Gate `canSeeExpensesTab` — sem `service_view`/`reversal_view`,
              a aba nem existe (contrato §"Tela/Rota"). */}
          {canSeeExpensesTab && (
            // @ts-ignore
            <Tabs.Content value="2">
              <RomaneioExpensesTab
                control={control}
                errors={errors}
                watch={watch}
                setValue={setValue}
                isDisabled={isDisabledField}
              />
            </Tabs.Content>
          )}
        </Tabs.Root>
      </Form>

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
