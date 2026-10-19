// src/pages/Operacional/Pedidos/GerarVendaFromOrder.tsx
// -----------------------------------------------------------------------------
// Tela "Gerar Venda a partir do Pedido" (Order → Sale, F-051, SALE-FE-COM-10,
// 97-Esteiras/063, `pedidos-f051-roteiro.md`). Backend 100% em produção desde
// a execução 043 (`SALE-02`/DEC-166) — `GET /orders/{uuid}/sale-draft`
// (hidratação + saldo por produto) + `POST /orders/{uuid}/sales`
// (`CreateSaleFromOrderAction`, atômico: cria `Sale`+itens e move
// `Order.status→2`). Rota `/operacional/pedidos/:uuid/gerar-venda`, guarda
// `sales_create` (`router/index.tsx`).
//
// Itens FECHADOS (roteiro §7, decisão default fiel ao contrato
// `SaleDraftResource`/`SaleFromOrderRequest`): só os produtos do Pedido com
// `remaining_quantity > 0`, sem adicionar/remover linha — só editar
// `quantity` (capado em `remaining_quantity`), `price`, `discount`,
// `warehouse`, `note`. `client_uuid`/`order_uuid`/`farm_id`/`status`/`code`
// NUNCA vão ao payload — herdados/resolvidos no servidor.
//
// Casca `FormContainer`+`<Form id>` com submit externo (mirror
// `CreateOrUpdateSale.tsx`); `get_pwa_form_query_pattern` — `fillForm`
// nomeado + guarda `isEmpty(dirtyFields)`, `useCustomFormQueryById` (id de
// contexto = `order.uuid`). Destino pós-submit (roteiro §7, default):
// `/operacional/vendas/{uuid}/detalhe`.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, Flex, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';
import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { saleFromOrderSchemaResolver } from '@/validations/schemas/Sales/sale-from-order-schema';

import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import type { ProprietaryOption } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { createSaleFromOrder, getOrderSaleDraft } from '@/services/v2/Orders/order-service';
import { listStockAvailability } from '@/services/v2/Stocks/stock-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type {
  CreateSaleFromOrderItemPayload,
  CreateSaleFromOrderRequest,
  SaleDraft,
  SaleFromOrderForm,
  SaleFromOrderItemForm,
} from '@/@types/v2/Sales';

import { useSaleWarehouseOptions } from '../Vendas/useSales';

import type { Control, FieldErrors } from 'react-hook-form';

const ORDERS_LIST_ROUTE = '/operacional/pedidos';
const TRANSPORTER_PROVIDER_TYPE = 4;

function todayIso(): string {
  return todayLocalIso();
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Rodada 2 (V2) — mirror `SaleItemRow.tsx:93` (formatação do campo readonly
// de estoque, 4 casas decimais).
function formatQuantity4(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

// Endurecimento defensivo (QA2, TASK-FE-063-SALE-FE-COM-10-D) — a correção
// principal é na API (`SaleDraftResource` alinhado a `SaleItemResource`, que
// já devolve `measurement` como STRING); esta função é rede de segurança
// contra drift futuro de contrato, mirror do padrão já usado em
// `SaleItemRow.tsx` (`stockItem.measurement?.name` /
// `cached?.measurement?.description`) — aceita string, objeto `{name}`/
// `{description}` ou vazio, nunca deixa objeto cru chegar ao form/
// `InputReadOnly`.
function normalizeMeasurement(measurement: unknown): string {
  if (typeof measurement === 'string') return measurement;
  if (measurement && typeof measurement === 'object') {
    const candidate = measurement as { name?: string; description?: string };
    return candidate.name ?? candidate.description ?? '';
  }
  return '';
}

function computeTotals(
  items: SaleFromOrderForm['items'],
  icms: number,
  freight: number,
  otherValues: number
) {
  const subtotal = items.reduce(
    (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0),
    0
  );
  const discount = items.reduce((acc, item) => acc + (Number(item.discount) || 0), 0);
  const total = subtotal + icms + freight + otherValues - discount;
  return { subtotal: roundTo2(subtotal), discount: roundTo2(discount), total: roundTo2(total) };
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

function mapProviderOption(item: ProviderOptionItem): Option<string> {
  return { label: item.label, value: item.uuid };
}

function mapProprietaryOption(item: ProprietaryOption): Option<string> {
  return { label: item.label, value: item.uuid };
}

interface ListProprietaryOptionsPaginatedParams extends PaginationQueryParams {
  search?: string;
}

async function listProprietaryOptionsPaginated(params: ListProprietaryOptionsPaginatedParams) {
  const items = await listProprietaryOptions(params.search);
  return {
    success: true,
    message: '',
    data: {
      items,
      pagination: {
        total: items.length,
        count: items.length,
        per_page: items.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" mb={1}>
        {label}
      </Text>
      <Text fontSize="sm" color="fg.default">
        {value}
      </Text>
    </Box>
  );
}

// ---- Linha de item FECHADA (produto/UM/saldo readonly — hidratados do
// `sale-draft`; warehouse/quantity/price/discount/note são os ÚNICOS
// editáveis, roteiro §5). Mirror `SaleItemRow.tsx` sem a cascata de
// PRODUTO (não se aplica — produto é fixo, vem do Pedido); mantém a cascata
// de ESTOQUE (IG002) já que só o armazém varia por linha. ----------------
//
// Rodada 2 (V1+V2, TASK-FE-065-R2-GERAR-VENDA-01):
//   - V1: Armazém é o 1º campo da linha (mirror `SaleItemRow.tsx:373-469`).
//   - V2: o antigo campo "Saldo Disponível" (que exibia `remaining_quantity`
//     — saldo do PEDIDO, rótulo enganoso apontado pelo dono) foi REMOVIDO da
//     tela; `remaining_quantity` continua hidratado no form e usado na
//     trava de quantidade do `onBlur` abaixo (inalterada — o backend também
//     valida em `CreateSaleFromOrderAction:86`). Um novo campo readonly
//     "Saldo Disponível" foi adicionado, agora alimentado pelo ESTOQUE real
//     do armazém selecionado (`GET /stocks/available`, mirror IG002 de
//     `SaleItemRow.tsx:238-265`) — SÓ informativo, nunca bloqueia o submit
//     (onda-I P2/P4: nem `rules()` nem `store()` legados checam saldo).
interface GerarVendaItemRowProps {
  control: Control<SaleFromOrderForm>;
  index: number;
  errors: FieldErrors<SaleFromOrderForm>;
  languageGB: LanguageDate;
  disabled: boolean;
}

function GerarVendaItemRow({
  control,
  index,
  errors,
  languageGB,
  disabled,
}: GerarVendaItemRowProps) {
  const text = languageGB.sales.sale.form;
  const itemText = text.fields.item;
  const orderItemText = languageGB.orders.order.generateSaleScreen.item;

  const warehouseQuery = useSaleWarehouseOptions();
  const noStockOption: Option<string> = { label: itemText.noStockOption, value: '' };
  const warehouseCatalogOptions: Option<string>[] = (warehouseQuery.data?.data.items ?? []).map(
    (item) => ({ label: `${item.initials} — ${item.description}`, value: item.uuid })
  );

  const item = useWatch({ control, name: `items.${index}` }) as SaleFromOrderItemForm;
  const rowError = errors.items?.[index];

  // ---- V2 — IG002 (mirror `SaleItemRow.tsx:238-265`): lookup de estoque SÓ
  // com armazém+produto preenchidos. Produto é FIXO por linha (vem do
  // Pedido) — só o armazém varia, sem cascata de produto/UM aqui. ----------
  const warehouseUuid = item?.warehouse?.value || undefined;
  const productUuid = item?.product?.value || undefined;

  const stockQuery = useQuery({
    queryKey: [queryKey.sales.saleStockAvailability, warehouseUuid, productUuid],
    queryFn: () =>
      listStockAvailability({ warehouse_uuid: warehouseUuid, product_uuid: productUuid }),
    enabled: !!warehouseUuid && !!productUuid,
    staleTime: 15 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const stockItem = stockQuery.data?.data.items?.[0];

  // Sem armazém → '—' (query nem dispara). Com armazém, sem linha de
  // estoque para o produto → '0,0000' (produto sem saldo naquele armazém).
  // NUNCA bloqueia o submit — só informativo (onda-I P2/P4).
  const availableStockDisplay = !warehouseUuid
    ? '—'
    : stockItem
      ? formatQuantity4(stockItem.quantity)
      : stockQuery.isFetched
        ? formatQuantity4(0)
        : '—';

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name={`items.${index}.warehouse`}
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={itemText.warehouse}
              placeholder={itemText.warehousePlaceholder}
              value={field.value ?? noStockOption}
              onChange={(option: Option<string> | null) => field.onChange(option ?? noStockOption)}
              options={[noStockOption, ...warehouseCatalogOptions]}
              loading={warehouseQuery.isLoading}
              noClearable
              isDisabled={disabled}
            />
          )}
        />

        <InputReadOnly label={itemText.product} value={item?.product?.label ?? '—'} />

        <InputReadOnly label={orderItemText.availableStock} value={availableStockDisplay} />

        <InputReadOnly label={itemText.um} value={item?.um || '—'} />
        <InputReadOnly
          label={orderItemText.orderedQuantity}
          value={item ? Number(item.ordered_quantity).toFixed(4) : '—'}
        />

        <Controller
          name={`items.${index}.quantity`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={itemText.quantity}
              allowDot
              decimalPlaces={4}
              value={Number(field.value) || 0}
              onValueChange={(value) => field.onChange(value ?? '')}
              onBlur={() => {
                const remaining = Number(item?.remaining_quantity) || 0;
                if (Number(field.value) > remaining) {
                  toaster.warning({
                    title: itemText.quantity,
                    description: orderItemText.remainingQuantity,
                  });
                  field.onChange(remaining);
                }
              }}
              error={rowError?.quantity?.message}
              isRequired
              disabled={disabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.price`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={itemText.price}
              allowDot
              decimalPlaces={4}
              value={Number(field.value) || 0}
              onValueChange={(value) => field.onChange(value ?? '')}
              error={rowError?.price?.message}
              isRequired
              disabled={disabled}
            />
          )}
        />

        <Controller
          name={`items.${index}.discount`}
          control={control}
          render={({ field }) => (
            <MoneyInput
              name={field.name}
              label={itemText.discount}
              value={field.value ?? 0}
              onValueChange={(value) => field.onChange(value)}
              error={rowError?.discount?.message}
              disabled={disabled}
            />
          )}
        />

        <InputReadOnly
          label={itemText.total}
          value={formatCurrencyBRL(
            roundTo2(
              (Number(item?.quantity) || 0) * (Number(item?.price) || 0) -
                (Number(item?.discount) || 0)
            )
          )}
        />

        <Controller
          name={`items.${index}.note`}
          control={control}
          render={({ field }) => (
            <Input
              label={itemText.note}
              name={field.name}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
              disabled={disabled}
            />
          )}
        />
      </SimpleGrid>

      {stockQuery.isError && (
        <Text fontSize="xs" color="fg.muted" mt={2}>
          {orderItemText.stockLoadError}
        </Text>
      )}
    </Box>
  );
}

export default function GerarVendaFromOrder() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.orders.order.generateSaleScreen;
  const saleText = languageGB.sales.sale.form;
  const header = saleText.fields.header;
  const footerText = saleText.fields.footer;

  const canSave = can('sales_create');
  const hasValidUuid = isValidGuid(uuid ?? null);

  // Guarda de navegação — `uuid` ausente/mal-formado NUNCA dispara a
  // chamada de rede (mirror `OrderDetalhe.tsx`/`get_pwa_form_query_pattern`).
  useEffect(() => {
    if (!hasValidUuid) {
      navigate(ORDERS_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid, navigate]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<SaleFromOrderForm>({
    mode: 'onChange',
    resolver: saleFromOrderSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      dt_sale: todayIso(),
      dt_shipping: todayIso(),
      due_date: null,
      payment_method: null,
      transporter: null,
      proprietary: null,
      driver: null,
      note: null,
      icms: 0,
      freight: 0,
      other_values: 0,
      items: [],
    },
  });

  const { fields: itemFields } = useFieldArray({ control, name: 'items' });

  // ✅ LEI 2 — função nomeada com guarda de `dirtyFields`, `resetForce` na
  // carga inicial (`useCustomFormQueryById` sempre chama com `true`). Só os
  // itens com `remaining_quantity > 0` entram na tela (roteiro §7 — itens
  // fechados, sem saldo não são exibidos nem submetidos).
  function fillSaleFromOrderForm(data: SaleDraft, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        dt_sale: todayIso(),
        dt_shipping: todayIso(),
        due_date: null,
        payment_method: null,
        transporter: null,
        proprietary: null,
        driver: null,
        note: null,
        icms: 0,
        freight: 0,
        other_values: 0,
        items: data.items
          .filter((item) => item.remaining_quantity > 0)
          .map((item): SaleFromOrderItemForm => ({
            product: { label: item.product.description, value: item.product.uuid },
            um: normalizeMeasurement(item.product.measurement),
            ordered_quantity: item.ordered_quantity,
            remaining_quantity: item.remaining_quantity,
            warehouse: null,
            quantity: item.remaining_quantity,
            price: '',
            discount: 0,
            note: null,
          })),
      });
    }
  }

  const saleDraftQuery = useCustomFormQueryById<SaleDraft>({
    registrationId: hasValidUuid ? (uuid as string) : '',
    asyncFunction: getOrderSaleDraft,
    queryKey: queryKey.orders.saleDraft,
    fillForm: fillSaleFromOrderForm,
  });

  const isLoading = hasValidUuid && checkLoadingStatus([saleDraftQuery as any]);
  const hasLoadError = hasValidUuid && !isLoading && !!(saleDraftQuery as any)?.isError;
  const draft = saleDraftQuery.data as unknown as SaleDraft | undefined;

  const paymentMethodOptions: Option<string>[] = (draft?.payment_methods ?? []).map((option) => ({
    label: option.label,
    value: option.value,
  }));

  const saleFromOrderMutation = useRequest({
    asyncFunction: tryPersistSaleFromOrder,
    entityName: languageGB.sales.sale.singularLabel,
    personalizedMessage: text.successToast,
    queryKey: queryKey.sales.sales,
    queryKey2: queryKey.orders.orders,
    queryKey3: queryKey.orders.order,
    typesRequest: 'create',
    actionSuccess: (data: any) => {
      navigate(`/operacional/vendas/${data.uuid}/detalhe`);
    },
  });

  async function tryPersistSaleFromOrder(data: SaleFromOrderForm) {
    const payload: CreateSaleFromOrderRequest = {
      dt_sale: data.dt_sale,
      dt_shipping: data.dt_shipping,
      due_date: data.due_date || null,
      payment_method: data.payment_method!.value as any,
      note: data.note || null,
      driver: data.driver || null,
      transporter_uuid: data.transporter?.value || null,
      proprietary_uuid: data.proprietary?.value || null,
      icms: Number(data.icms) || 0,
      freight: Number(data.freight) || 0,
      other_values: Number(data.other_values) || 0,
      items: data.items.map((item): CreateSaleFromOrderItemPayload => ({
        product_uuid: item.product.value,
        warehouse_uuid: item.warehouse?.value || null,
        quantity: Number(item.quantity),
        price: Number(item.price),
        discount: item.discount ?? null,
        note: item.note ?? null,
      })),
    };

    return await createSaleFromOrder(uuid as string, payload);
  }

  async function onSubmit(data: SaleFromOrderForm) {
    await saleFromOrderMutation.mutateAsync(data);
  }

  const isSaving = saleFromOrderMutation.isPending || isSubmitting;
  const hasUnsavedChanges = !isEmpty(dirtyFields);
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);

  const items = useWatch({ control, name: 'items' }) ?? [];
  const icms = Number(useWatch({ control, name: 'icms' })) || 0;
  const freight = Number(useWatch({ control, name: 'freight' })) || 0;
  const otherValues = Number(useWatch({ control, name: 'other_values' })) || 0;
  const { subtotal, discount, total } = computeTotals(items, icms, freight, otherValues);

  const isEmptyEligibleItems = !isLoading && !hasLoadError && itemFields.length === 0;

  if (!hasValidUuid) {
    return null;
  }

  return (
    <>
      <FormContainer
        title={text.pageTitle}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings?.cancel || 'Cancelar'}
              variant="outline"
              type="button"
              onClick={() => guardedNavigate(`/operacional/pedidos/${uuid}/detalhe`)}
            />
            {canSave && !isEmptyEligibleItems && !hasLoadError && (
              <ButtonSaveAndNext
                create
                dirtyFields={dirtyFields}
                type="submit"
                form="sale-from-order-form"
                languageGB={languageGB}
                loading={isSaving}
                disabled={isSaving || isLoading}
              />
            )}
          </>
        }
      >
        {isLoading ? (
          <VStack align="stretch" gap={4}>
            <Skeleton height="60px" />
            <Skeleton height="60px" />
            <Skeleton height="200px" />
          </VStack>
        ) : hasLoadError ? (
          <VStack gap={3} py={12}>
            <Text color="fg.muted">{text.loadError.message}</Text>
            <Button
              variant="outline"
              title={text.loadError.retry}
              onClick={() => (saleDraftQuery as any)?.refetch?.()}
            />
          </VStack>
        ) : isEmptyEligibleItems ? (
          <VStack gap={2} py={12}>
            <Text fontWeight="semibold">{text.emptyEligibleItems.title}</Text>
            <Text color="fg.muted">{text.emptyEligibleItems.description}</Text>
          </VStack>
        ) : (
          <Form noPadding id="sale-from-order-form" onSubmit={handleSubmit(onSubmit)}>
            {/* Seção — Pedido de Origem (readonly, contexto herdado). */}
            <Box mb={6}>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                mb={4}
                pb={2}
                borderBottom="1px solid"
                borderColor="border.subtle"
              >
                {text.sections.order}
              </Text>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField label={text.orderFields.code} value={draft?.order.code ?? '—'} />
                <InfoField
                  label={text.orderFields.client}
                  value={draft?.order.client.info ?? '—'}
                />
                <InfoField
                  label={text.orderFields.status}
                  value={draft?.order.status.label ?? '—'}
                />
              </SimpleGrid>
            </Box>

            {/* Cabeçalho da Venda (`FM002`, mirror `CreateOrUpdateSale.tsx`) —
                `client` NUNCA aparece aqui, herdado do Pedido no servidor. */}
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {header.dtSale}
                </Text>
                <Controller
                  name="dt_sale"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <DateInput
                        value={field.value ?? null}
                        onChange={(value) => field.onChange(value ?? '')}
                        disabled={!canSave}
                      />
                      {error?.message && (
                        <Text fontSize="xs" color="fg.error" mt={1}>
                          {error.message}
                        </Text>
                      )}
                    </>
                  )}
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {header.dtShipping}
                </Text>
                <Controller
                  name="dt_shipping"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <DateInput
                        value={field.value ?? null}
                        onChange={(value) => field.onChange(value ?? '')}
                        disabled={!canSave}
                      />
                      {error?.message && (
                        <Text fontSize="xs" color="fg.error" mt={1}>
                          {error.message}
                        </Text>
                      )}
                    </>
                  )}
                />
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {header.dueDate}
                </Text>
                <Controller
                  name="due_date"
                  control={control}
                  render={({ field }) => (
                    <DateInput
                      value={field.value ?? null}
                      onChange={(value) => field.onChange(value ?? null)}
                      disabled={!canSave}
                    />
                  )}
                />
              </Box>

              <Controller
                name="payment_method"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Select
                    name={field.name}
                    label={header.paymentMethod}
                    options={paymentMethodOptions}
                    value={field.value ?? null}
                    onChange={(option) => field.onChange(option ?? null)}
                    error={error?.message}
                    isRequired
                    isDisabled={!canSave}
                  />
                )}
              />

              <Controller
                name="transporter"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={header.transporter}
                    service={(params) =>
                      listProviderOptions({ ...params, type: TRANSPORTER_PROVIDER_TYPE })
                    }
                    mapOptions={mapProviderOption}
                    findParams={findParamsFromSearch}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    isDisabled={!canSave}
                  />
                )}
              />

              <Controller
                name="proprietary"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={header.proprietary}
                    service={listProprietaryOptionsPaginated}
                    mapOptions={mapProprietaryOption}
                    findParams={findParamsFromSearch}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    isDisabled={!canSave}
                  />
                )}
              />

              <Input
                label={header.driver}
                maxLength={250}
                error={errors.driver?.message}
                disabled={!canSave}
                {...register('driver')}
              />
            </SimpleGrid>

            <Box mt={6}>
              <Textarea
                label={header.note}
                maxLength={200}
                rows={4}
                error={errors.note?.message}
                disabled={!canSave}
                {...register('note')}
              />
            </Box>

            {/* Itens elegíveis (FECHADOS — produtos do Pedido com saldo>0,
                sem adicionar/remover linha, roteiro §5/§7). */}
            <Box
              mt={6}
              bg="bg.muted"
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="lg"
              p={4}
            >
              <Text fontSize="sm" fontWeight="semibold" mb={4}>
                {text.sections.items}
              </Text>
              <Flex direction="column" gap={4}>
                {itemFields.map((field, index) => (
                  <GerarVendaItemRow
                    key={field.id}
                    control={control}
                    index={index}
                    errors={errors}
                    languageGB={languageGB}
                    disabled={!canSave}
                  />
                ))}
              </Flex>
            </Box>

            {/* Totais (preview local — fórmula do servidor é a autoridade,
                mirror `SaleTotalsBlock.tsx`, PARADA-2). */}
            <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
              <InputReadOnly label={footerText.subtotal} value={formatCurrencyBRL(subtotal)} />

              <Controller
                name="icms"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <MoneyInput
                    name={field.name}
                    label={footerText.icms}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={error?.message}
                    disabled={!canSave}
                  />
                )}
              />

              <Controller
                name="freight"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <MoneyInput
                    name={field.name}
                    label={footerText.freight}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={error?.message}
                    disabled={!canSave}
                  />
                )}
              />

              <Controller
                name="other_values"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <MoneyInput
                    name={field.name}
                    label={footerText.otherValues}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={error?.message}
                    disabled={!canSave}
                  />
                )}
              />

              <InputReadOnly label={footerText.discount} value={formatCurrencyBRL(discount)} />
              <InputReadOnly label={footerText.total} value={formatCurrencyBRL(total)} />
            </SimpleGrid>
          </Form>
        )}
      </FormContainer>

      <DeleteConfirmDialog
        isOpen={isConfirmOpen}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        tone="warning"
        colorPalette="orange"
        title={saleText.unsavedChangesDialog.title}
        description={saleText.unsavedChangesDialog.description}
        confirmButtonText={saleText.unsavedChangesDialog.confirmButton}
        hideQuestionMark
        warningText=""
      />
    </>
  );
}
