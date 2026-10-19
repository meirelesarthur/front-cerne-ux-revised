// src/pages/Operacional/Carregamento/GenerateTransferDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo "Gerar Romaneio" (AM-07, TASK-FE-CG-05) — acionado a partir da
// listagem (`index.tsx`), SEM rota própria. Fluxo em 2 passos:
//   1. Ao abrir, calcula o rascunho (`POST /charges/{uuid}/transfer`,
//      `useBuildChargeTransferDraft`, Action de LEITURA PURA) e resolve os
//      satélites uuid-only do rascunho (cliente/transportador/produtos) só
//      para EXIBIÇÃO — fire-and-forget, nunca bloqueia o resumo.
//   2. O usuário confirma o pedaço de dado que o rascunho NÃO cobre (campos
//      genuinamente novos de `Transfer`, sem equivalente em `Charge`) e o
//      diálogo chama `createTransfer` (`POST /transfers`, JÁ EXISTENTE) —
//      o Charge NUNCA persiste o romaneio diretamente (decisão d1 do dono).
//
// MAPEAMENTO campo a campo `ChargeTransferDraft` (`ChargeTransferDraftResource`)
// → `CreateTransferRequest`/`TransferItemPayload` (Passo 0 desta Tarefa):
//   draft.client_uuid          → CreateTransferRequest.client_uuid    (direto; rótulo resolvido só para exibição via `getClientByUuid`)
//   draft.transporter_uuid     → CreateTransferRequest.transporter_uuid (direto, nullable)
//   draft.dt_sale              → CreateTransferRequest.dt_sale        (direto, YYYY-MM-DD)
//   draft.dt_shipping          → CreateTransferRequest.dt_shipping    (direto, YYYY-MM-DD)
//   draft.items[].product_uuid → TransferItemPayload.product_uuid     (direto)
//   draft.items[].quantity     → TransferItemPayload.quantity         (direto)
//   draft.items[].amount       → TransferItemPayload.amount           (direto)
//   draft.items[].item_uuid    → NÃO mapeado — identidade do `ItemCharge` (Carregamento), sem relação com a
//                                 identidade de item do `Transfer` (tabela diferente); o romaneio SEMPRE nasce
//                                 com itens NOVOS (`POST` puro) — `item_uuid` do payload fica `null`.
//   (ausente no draft) items[].measurement_uuid → resolvido por PRODUTO (`getProduct(product_uuid).measurement.
//                                 uuid`, a MESMA unidade primária cadastrada no produto, mirror da cascata
//                                 produto→UM de `RomaneioItemRow.tsx`) — default automático, SEM perguntar ao
//                                 usuário; o Confirmar fica desabilitado enquanto algum produto não resolveu.
//   (ausente no draft) warehouse_uuid/package_uuid/lot/discard_kg/area_uuid/note → omitidos (opcionais no
//                                 servidor; o usuário edita depois na tela do romaneio recém-criado).
//   (ausente no draft) user_uuid → default automático = responsável do PRÓPRIO Carregamento (`charge.user.uuid`,
//                                 já disponível na listagem, sem request extra) — dado real, não fabricado; sem
//                                 pergunta ao usuário (evita inflar o diálogo com mais um catálogo obrigatório).
//                                 `charge.user` pode ser `null` (carregamento sem responsável) — nesse caso não há
//                                 default seguro e o Confirmar fica desabilitado (`canConfirm`), sem inventar valor.
//   (ausente no draft) type/payment_term_uuid/type_payment/payment_indicator/type_title_uuid/fiscal_document →
//                                 SEM default seguro possível (dado fiscal/financeiro que não existe em
//                                 Carregamento) — perguntados no PRÓPRIO diálogo, reaproveitando os MESMOS
//                                 catálogos/Enums/labels de `Romaneios` (o diálogo produz um `Transfer` de
//                                 verdade, mesmo vocabulário — `languageGB.transfers.transfer.form.fields.*`).
//   (ausente no draft) due_date/seller_uuid/proprietary_uuid/driver/nfe/note/commission/funrural_percentage/
//                                 icms/freight/others_values/discount → omitidos (opcionais no servidor,
//                                 editáveis depois na tela do romaneio).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Dialog, Portal, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Switch } from '@/components/ui/switch';

import { useRequest } from '@/hooks/useRequest';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';
import {
  paymentIndicatorOptions,
  transferPaymentTypeOptions,
  transferTypeOptions,
} from '@/constants/transfers/options';

import { listPaymentTerms } from '@/services/v2/BaseRegistrations/paymentTerms-service';
import { listTypeTitleOptions } from '@/services/v2/BaseRegistrations/typeTitles-service';
import { getClientByUuid } from '@/services/v2/CadastrosBase/Client/client-service';
import { getProviderByUuid } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { getProduct } from '@/services/v2/Products/product-service';
import { createTransfer } from '@/services/v2/Transfers/transfer-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { PaymentTermListItem } from '@/@types/v2/BaseRegistrations/paymentTerms';
import type { TypeTitleOptionItem } from '@/@types/v2/BaseRegistrations/typeTitles';
import type { ChargeListItem, ChargeTransferDraft } from '@/@types/v2/Carregamentos';
import type {
  CreateTransferRequest,
  PaymentIndicator,
  TransferDetail,
  TransferPaymentType,
  TransferType,
} from '@/@types/v2/Transfers';

import { useBuildChargeTransferDraft } from './useCarregamentos';

export interface GenerateTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  charge: ChargeListItem | null;
  languageGB: LanguageDate;
}

interface GenerateTransferDialogForm {
  type: Option<TransferType> | null;
  payment_term_uuid: Option<string> | null;
  type_payment: Option<TransferPaymentType> | null;
  payment_indicator: Option<PaymentIndicator> | null;
  type_title_uuid: Option<string> | null;
  fiscal_document: boolean;
}

const pristineFormValues: GenerateTransferDialogForm = {
  type: null,
  payment_term_uuid: null,
  type_payment: null,
  payment_indicator: null,
  type_title_uuid: null,
  fiscal_document: false,
};

export function GenerateTransferDialog({
  isOpen,
  onClose,
  charge,
  languageGB,
}: GenerateTransferDialogProps) {
  const navigate = useNavigate();
  const text = languageGB.carregamentos.charge.transfer;
  const transferFieldsText = languageGB.transfers.transfer.form.fields;

  const [draft, setDraft] = useState<ChargeTransferDraft | null>(null);
  const [clientLabel, setClientLabel] = useState<string | null>(null);
  const [transporterLabel, setTransporterLabel] = useState<string | null>(null);
  const [productLabels, setProductLabels] = useState<Record<string, string>>({});
  const [measurementByProduct, setMeasurementByProduct] = useState<Record<string, string>>({});
  const [isResolvingSatellites, setIsResolvingSatellites] = useState(false);

  const draftMutation = useBuildChargeTransferDraft();

  const { control, handleSubmit, watch, setValue, reset } = useForm<GenerateTransferDialogForm>({
    defaultValues: pristineFormValues,
  });

  // Reidrata do zero a cada abertura — o rascunho é PURO (nunca cacheado
  // entre carregamentos diferentes) e o form do diálogo não deve carregar
  // escolhas de uma sessão anterior.
  useEffect(() => {
    if (!isOpen || !charge) return;

    reset(pristineFormValues);
    setDraft(null);
    setClientLabel(null);
    setTransporterLabel(null);
    setProductLabels({});
    setMeasurementByProduct({});

    draftMutation.mutate(charge.uuid, {
      onSuccess: (response) => {
        setDraft(response.data);
        void resolveDraftSatellites(response.data);
      },
    });
    // Reexecuta só quando o diálogo abre/troca de Carregamento — `reset`/
    // `draftMutation`/`resolveDraftSatellites` são estáveis entre renders
    // (closures do próprio `useForm`/`useMutation`, mesmo racional já aceito
    // em `WeaningReportModal.tsx`).
  }, [isOpen, charge?.uuid]);

  async function resolveDraftSatellites(currentDraft: ChargeTransferDraft) {
    setIsResolvingSatellites(true);

    const [clientResult, transporterResult] = await Promise.allSettled([
      currentDraft.client_uuid ? getClientByUuid(currentDraft.client_uuid) : Promise.resolve(null),
      currentDraft.transporter_uuid
        ? getProviderByUuid(currentDraft.transporter_uuid)
        : Promise.resolve(null),
    ]);
    if (clientResult.status === 'fulfilled' && clientResult.value) {
      setClientLabel(clientResult.value.data.name);
    }
    if (transporterResult.status === 'fulfilled' && transporterResult.value) {
      setTransporterLabel(transporterResult.value.data.name);
    }

    const uniqueProductUuids = Array.from(
      new Set(
        currentDraft.items.map((item) => item.product_uuid).filter((uuid): uuid is string => !!uuid)
      )
    );
    const productResults = await Promise.allSettled(
      uniqueProductUuids.map((uuid) => getProduct(uuid))
    );

    const labels: Record<string, string> = {};
    const measurements: Record<string, string> = {};
    productResults.forEach((result, resultIndex) => {
      const uuid = uniqueProductUuids[resultIndex];
      if (result.status === 'fulfilled') {
        labels[uuid] = result.value.data.code
          ? `${result.value.data.code} — ${result.value.data.description}`
          : result.value.data.description;
        measurements[uuid] = result.value.data.measurement.uuid;
      }
    });
    setProductLabels(labels);
    setMeasurementByProduct(measurements);
    setIsResolvingSatellites(false);
  }

  const confirmMutation = useRequest<TransferDetail>({
    asyncFunction: (payload: CreateTransferRequest) => createTransfer(payload),
    queryKey: queryKey.transfers.transfers,
    queryKey2: queryKey.carregamentos.charges,
    queryKey3: queryKey.carregamentos.charge,
    typesRequest: 'create',
    entityName: languageGB.carregamentos.charge.singularLabel,
    personalizedMessage: text.successToast,
    actionSuccess: (created) => {
      onClose();
      navigate(`/operacional/romaneios/${created.uuid}`);
    },
  });

  const isDraftLoading = draftMutation.isPending;
  const isDraftError = draftMutation.isError;
  const isConfirming = confirmMutation.isPending;

  const type = watch('type');
  const paymentTermUuid = watch('payment_term_uuid');
  const typePayment = watch('type_payment');
  const paymentIndicator = watch('payment_indicator');
  const typeTitleUuid = watch('type_title_uuid');

  const allItemsResolved =
    !!draft &&
    draft.items.every((item) => !!item.product_uuid && !!measurementByProduct[item.product_uuid]);

  const canConfirm =
    !!draft &&
    !!draft.client_uuid &&
    !!charge &&
    // `user` pode ser `null` (carregamento sem responsável definido — dado
    // real, não ausência de eager-load) — sem responsável não há default
    // seguro para `user_uuid` (obrigatório em `CreateTransferRequest`), então
    // o Confirmar fica desabilitado (mesmo padrão silencioso já usado para
    // os demais campos obrigatórios acima, sem inventar rótulo/valor).
    !!charge.user &&
    allItemsResolved &&
    !isResolvingSatellites &&
    !!type &&
    !!paymentTermUuid &&
    !!typePayment &&
    !!paymentIndicator &&
    !!typeTitleUuid;

  function onSubmit(data: GenerateTransferDialogForm) {
    if (!canConfirm || !draft || !charge || !charge.user) return;

    const payload: CreateTransferRequest = {
      type: data.type!.value,
      dt_sale: draft.dt_sale,
      dt_shipping: draft.dt_shipping,
      client_uuid: draft.client_uuid!,
      // Default automático — responsável do PRÓPRIO Carregamento (ver
      // mapeamento no cabeçalho do arquivo), sem pergunta ao usuário.
      user_uuid: charge.user.uuid,
      transporter_uuid: draft.transporter_uuid ?? null,
      payment_term_uuid: data.payment_term_uuid!.value,
      type_payment: data.type_payment!.value,
      payment_indicator: data.payment_indicator!.value,
      type_title_uuid: data.type_title_uuid!.value,
      fiscal_document: !!data.fiscal_document,
      items: draft.items.map((item) => ({
        // Romaneio SEMPRE nasce com itens NOVOS (`POST` puro) — o
        // `item_uuid` do rascunho é do `ItemCharge`, sem relação de sync.
        item_uuid: null,
        product_uuid: item.product_uuid!,
        measurement_uuid: measurementByProduct[item.product_uuid!],
        quantity: item.quantity,
        amount: item.amount,
      })),
      expenses: [],
    };

    confirmMutation.mutate(payload);
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !isConfirming) onClose();
      }}
      lazyMount
      unmountOnExit
      size="lg"
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>{text.title}</Dialog.Title>
            </Dialog.Header>

            <Form noPadding onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <VStack align="stretch" gap={5}>
                  <Text fontSize="sm" color="fg.muted">
                    {text.description}
                  </Text>

                  {isDraftError && (
                    <Box p={3} borderRadius="md" bg="feedBack.error">
                      <Text fontSize="sm" color="feedBack.errorMain">
                        {extractApiErrorMessage(draftMutation.error) ?? text.draftErrorFallback}
                      </Text>
                    </Box>
                  )}

                  {draft && !isDraftError && (
                    <Box p={3} borderRadius="md" bg="bg.muted">
                      <SimpleGrid columns={2} gap={2} mb={2}>
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="medium">
                            {transferFieldsText.client}:{' '}
                          </Text>
                          {clientLabel ?? text.summary.unknownLabel}
                        </Text>
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="medium">
                            {transferFieldsText.transporter}:{' '}
                          </Text>
                          {transporterLabel ?? text.summary.unknownLabel}
                        </Text>
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="medium">
                            {transferFieldsText.dtSale}:{' '}
                          </Text>
                          {draft.dt_sale}
                        </Text>
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="medium">
                            {transferFieldsText.dtShipping}:{' '}
                          </Text>
                          {draft.dt_shipping}
                        </Text>
                      </SimpleGrid>

                      <Text fontSize="sm" fontWeight="medium" mt={2} mb={1}>
                        {text.summary.itemsTitle}
                      </Text>
                      <VStack align="stretch" gap={1}>
                        {draft.items.map((item) => (
                          <Text key={item.item_uuid} fontSize="xs" color="fg.muted">
                            {item.product_uuid
                              ? (productLabels[item.product_uuid] ?? text.summary.unknownLabel)
                              : text.summary.unknownLabel}{' '}
                            — {item.quantity.toLocaleString('pt-BR')} ×{' '}
                            {item.amount.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </Text>
                        ))}
                      </VStack>

                      <Text fontSize="sm" fontWeight="medium" mt={3}>
                        {text.summary.totalProducts}:{' '}
                        {draft.total_products.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </Text>
                    </Box>
                  )}

                  <SimpleGrid columns={2} gap={4}>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field: { name, value, onChange } }) => (
                        <Select
                          label={transferFieldsText.type}
                          name={name}
                          value={value}
                          onChange={(option: Option<TransferType> | null) => {
                            onChange(option ?? null);
                            if (option) {
                              setValue('fiscal_document', option.value === 'V');
                            }
                          }}
                          options={transferTypeOptions.options(languageGB)}
                          isRequired
                          isDisabled={!draft || isDraftLoading}
                        />
                      )}
                    />

                    <Controller
                      name="payment_term_uuid"
                      control={control}
                      render={({ field }) => (
                        <SelectAsyncPaginate
                          name={field.name}
                          label={transferFieldsText.paymentTerm}
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
                          isRequired
                          isDisabled={!draft || isDraftLoading}
                          // Dentro de `Dialog.Root` (Ark UI/Zag.js) o Dialog
                          // aplica `aria-hidden`/`inert` em tudo fora da sua
                          // própria árvore de `Portal` — o menu portado em
                          // `document.body` (comportamento default do
                          // `react-select-async-paginate`) fica visível porém
                          // NÃO-CLICÁVEL (mesma família do bug já corrigido em
                          // `DateInput`/`persistentElements`). `disablePortal`
                          // renderiza o menu INLINE, dentro da árvore do
                          // Dialog (GAP homologação, execução 045, FIX A).
                          disablePortal
                        />
                      )}
                    />

                    <Controller
                      name="type_payment"
                      control={control}
                      render={({ field: { name, value, onChange } }) => (
                        <Select
                          label={transferFieldsText.typePayment}
                          name={name}
                          value={value}
                          onChange={(option: Option<TransferPaymentType> | null) =>
                            onChange(option ?? null)
                          }
                          options={transferPaymentTypeOptions.options(languageGB)}
                          isRequired
                          isDisabled={!draft || isDraftLoading}
                        />
                      )}
                    />

                    <Controller
                      name="payment_indicator"
                      control={control}
                      render={({ field: { name, value, onChange } }) => (
                        <Select
                          label={transferFieldsText.paymentIndicator}
                          name={name}
                          value={value}
                          onChange={(option) => onChange(option ?? null)}
                          options={paymentIndicatorOptions.options(languageGB)}
                          isRequired
                          isDisabled={!draft || isDraftLoading}
                        />
                      )}
                    />

                    <Controller
                      name="type_title_uuid"
                      control={control}
                      render={({ field }) => (
                        <SelectAsyncPaginate
                          name={field.name}
                          label={transferFieldsText.typeTitle}
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
                          isRequired
                          isDisabled={!draft || isDraftLoading}
                          // Mesmo fix do `payment_term_uuid` acima (FIX A).
                          disablePortal
                        />
                      )}
                    />

                    <Controller
                      name="fiscal_document"
                      control={control}
                      render={({ field }) => (
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          h="full"
                        >
                          <Text fontSize="sm" fontWeight="medium">
                            {transferFieldsText.fiscalDocument}
                          </Text>
                          {/* @ts-ignore - Chakra UI v3 Switch API */}
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={(d: any) => field.onChange(d.checked)}
                            colorPalette="green"
                            disabled={!draft || isDraftLoading}
                            aria-label={transferFieldsText.fiscalDocument}
                          />
                        </Box>
                      )}
                    />
                  </SimpleGrid>
                </VStack>
              </Dialog.Body>

              <Dialog.Footer>
                <Button
                  title={text.cancelButton}
                  variant="outline"
                  type="button"
                  onClick={onClose}
                  disabled={isConfirming}
                />
                <Button
                  title={text.confirmButton}
                  type="submit"
                  loading={isConfirming || isDraftLoading}
                  disabled={!canConfirm || isConfirming}
                />
              </Dialog.Footer>
            </Form>

            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
