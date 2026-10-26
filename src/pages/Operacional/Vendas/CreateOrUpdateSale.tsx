// src/pages/Operacional/Vendas/CreateOrUpdateSale.tsx
// -----------------------------------------------------------------------------
// Formulário de CRIAÇÃO/EDIÇÃO de Venda COMERCIAL (Sale — venda de PRODUTOS,
// Operacional / Vendas, 97-Esteiras/043, SALE-FE-COM-03). Rotas
// `/operacional/vendas/novo` (`sales_create`) e
// `/operacional/vendas/:uuid/editar` (`sales_edit`), MESMO componente
// (mirror `Operacional/Pedidos/CreateOrUpdateOrder.tsx` — irmão comercial
// migrado).
//
// ESCOPO de SALE-FE-COM-03: casca `FormContainer`+`<Form id="sale-form">` +
// CABEÇALHO (`FM002`: `dt_sale`/`dt_shipping`/`due_date`/Responsável
// readonly) + bloco de TOTAIS/COMPLEMENTOS (`SaleTotalsBlock`, `FM004`) +
// SUBMIT ATÔMICO. `useFieldArray('items')` já é DECLARADO aqui (payload
// estruturalmente correto) com 1 linha vazia em criação — a seção de ITENS
// (`SaleItemsEditor`/`SaleItemRow`, cascatas de estoque/UM, IG002..007) nasce
// em SALE-FE-COM-04 (chokepoint deste arquivo, serializado `03` → `04`).
//
// PARADA-2 (default ativo, contrato-tela §6.3): os totais exibidos seguem a
// fórmula do SERVIDOR (`subtotal` BRUTO) — `subtotal`/`discount`/`total` são
// SEMPRE readonly e NUNCA vão ao payload (o servidor recalcula, CV002-CV004).
// `user_id` (Responsável) é readonly/decorativo, NUNCA no payload — o
// servidor resolve o usuário autenticado.
//
// A033 (corrigido, contrato-tela §7.3): o legado voltava para `orders.index`
// mesmo na venda avulsa — aqui Cancelar/sucesso navegam SEMPRE para
// `/operacional/vendas` (nunca `navigate(-1)`, que herdaria o bug de
// destino incorreto quando a navegação de entrada não veio da listagem).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isEmpty } from '@/utils/isEmpty';
import { todayLocalIso } from '@/utils/localDate';
import { regex } from '@/utils/regex-id';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { saleSchemaResolver } from '@/validations/schemas/Sales/sale-schema';

import { createSale, getSale, updateSale } from '@/services/v2/Sales/sale-service';

import type {
  CreateSaleRequest,
  SaleDetail,
  SaleForm,
  SaleItemForm,
  SaleItemPayload,
  SalePaymentMethod,
} from '@/@types/v2/Sales';

import { createEmptySaleItem } from './SaleItemRow';
import { SaleItemsEditor } from './SaleItemsEditor';
import { SaleTotalsBlock } from './SaleTotalsBlock';

const SALES_LIST_ROUTE = '/operacional/vendas';

function todayIso(): string {
  return todayLocalIso();
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Espelha `computeItemDiscountPercent` de `Pedidos/CreateOrUpdateOrder.tsx`
// (CLM-030, guarda div-by-zero) — hidratação de edição precisa exibir
// `discount_percent` consistente com `discount`/`total` já persistidos. UI
// puro (IG005/006, SALE-FE-COM-04); nunca submetido.
function computeItemDiscountPercent(discount: number, quantity: number, price: number): number {
  const base = roundTo2(quantity * price);
  if (base <= 0) return 0;
  return roundTo2((discount / base) * 100);
}

export default function CreateOrUpdateSale() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();
  const text = languageGB.sales.sale;
  const header = text.form.fields.header;

  const isEditing = !!uuid;
  const canSave = can(isEditing ? 'sales_edit' : 'sales_create');

  // Guard de navegação — `uuid` malformado não deve chegar ao hook de query
  // (mirror `get_pwa_form_query_pattern`, "Guard de navegação").
  useEffect(() => {
    if (!uuid) return;
    if (uuid.length !== 36 || uuid.replace(regex, '').length > 0) {
      navigate(SALES_LIST_ROUTE);
    }
  }, [uuid, navigate]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<SaleForm>({
    mode: 'onChange',
    resolver: saleSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      dt_sale: todayIso(),
      dt_shipping: todayIso(),
      due_date: null,
      client: null,
      payment_method: null,
      transporter: null,
      proprietary: null,
      driver: null,
      note: null,
      icms: 0,
      freight: 0,
      other_values: 0,
      // Modo CRIAÇÃO já nasce com 1 linha vazia (`items.min` de
      // `sale-schema.ts` — apertado em `04`); em EDIÇÃO, `fillSaleForm`
      // hidrata o array real assim que a query resolve.
      items: isEditing ? [] : [createEmptySaleItem()],
    },
  });

  // SALE-FE-COM-04 — `useFieldArray('items')` vive no formulário PAI (aqui),
  // `SaleItemsEditor`/`SaleItemRow` recebem `control`/`fields`/`append`/
  // `remove` por prop (mirror `CreateOrUpdateOrder.tsx`/DEC-PED-FE-ITENS).
  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({ control, name: 'items' });

  // ✅ LEI 2 — função nomeada com guarda de `dirtyFields`, `resetForce` na
  // carga inicial (`useCustomFormQueryById` sempre chama com `true`).
  function fillSaleForm(data: SaleDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        dt_sale: data.dt_sale,
        dt_shipping: data.dt_shipping,
        due_date: data.due_date,
        client: data.client ? { label: data.client.info, value: data.client.uuid } : null,
        payment_method: data.payment_method
          ? { label: data.payment_method.label, value: data.payment_method.value }
          : null,
        transporter: data.transporter
          ? { label: data.transporter.name ?? '—', value: data.transporter.uuid }
          : null,
        proprietary: data.proprietary
          ? { label: data.proprietary.name ?? '—', value: data.proprietary.uuid }
          : null,
        driver: data.driver,
        note: data.note,
        icms: data.icms,
        freight: data.freight,
        other_values: data.other_values,
        items: data.items.map((item): SaleItemForm => ({
          uuid: item.uuid,
          warehouse: item.warehouse
            ? { label: item.warehouse.name, value: item.warehouse.uuid }
            : null,
          product: { label: item.product.description, value: item.product.uuid },
          qtd_stock: null,
          um: item.product.measurement ?? '',
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          discount_percent: computeItemDiscountPercent(item.discount, item.quantity, item.price),
          total_amount: item.total,
          note: item.note,
        })),
      });
    }
  }

  const saleQuery = useCustomFormQueryById<SaleDetail>({
    registrationId: uuid ?? '',
    asyncFunction: getSale,
    queryKey: queryKey.sales.sale,
    fillForm: fillSaleForm,
  });

  // `useCustomFormQueryById` devolve o `useQuery` cru mas TIPADO como
  // `Response<TData>` — `as any` é o idioma já usado nesta base (mirror
  // `CreateOrUpdateOrder.tsx`).
  const isLoadingSaleQuery = isEditing && checkLoadingStatus([saleQuery as any]);

  const saleMutation = useRequest({
    asyncFunction: tryPersistSale,
    entityName: text.singularLabel,
    queryKey: queryKey.sales.sale,
    queryKey2: queryKey.sales.sales,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      // A033 (corrigido) — destino SEMPRE a listagem de Vendas, nunca
      // `orders.index` (bug do legado) nem `navigate(-1)`.
      navigate(SALES_LIST_ROUTE);
    },
  });

  // ✅ LEI 3 — wrapper nomeado; monta o payload atômico real. `subtotal`/
  // `discount`/`total`/`farm_id`/`tenant_id`/`user_id`/`code`/`status`/
  // `order_id`/`installment_details` NUNCA entram — sempre gerados/
  // recalculados no servidor (contrato-api §3.1, PARADA-2).
  async function tryPersistSale(data: SaleForm) {
    const payload: CreateSaleRequest = {
      dt_sale: data.dt_sale,
      dt_shipping: data.dt_shipping,
      due_date: data.due_date || null,
      client_uuid: data.client!.value,
      payment_method: data.payment_method!.value as SalePaymentMethod,
      note: data.note || null,
      driver: data.driver || null,
      transporter_uuid: data.transporter?.value || null,
      proprietary_uuid: data.proprietary?.value || null,
      icms: Number(data.icms) || 0,
      freight: Number(data.freight) || 0,
      other_values: Number(data.other_values) || 0,
      items: data.items.map((item): SaleItemPayload => ({
        // Presente = atualiza este item; ausente = cria (substitui
        // `olds[]` do legado, SE003) — nunca inventado pelo cliente.
        uuid: item.uuid,
        product_uuid: item.product!.value,
        warehouse_uuid: item.warehouse?.value || null,
        quantity: Number(item.quantity),
        price: Number(item.price),
        discount: item.discount ?? null,
        note: item.note ?? null,
      })),
    };

    if (isEditing && uuid) {
      return await updateSale(uuid, payload);
    }
    return await createSale(payload);
  }

  async function onSubmit(data: SaleForm) {
    // ERRO-FE-001 (mirror `CreateOrUpdateOrder.tsx`) — `!isEmpty(dirtyFields)`
    // é "HÁ algo sujo" (polaridade OPOSTA à guarda de `fillSaleForm`).
    if (isEditing && !isEmpty(dirtyFields)) return; // nada dirty — nada a salvar
    await saleMutation.mutateAsync(data);
  }

  const isSaving = saleMutation.isPending || isSubmitting;

  // Guarda de saída sem salvar — mirror `CreateOrUpdateOrder.tsx`.
  const hasUnsavedChanges = !isEmpty(dirtyFields);
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);

  const isLoadingSale = isLoadingSaleQuery;
  // Estado obrigatório "erro (msg+retry)" na hidratação da edição (contrato-
  // tela §2) — reusa `text.list.error` (sem inventar chave de tradução nova,
  // `sales` já é CHOKEPOINT fechado por SALE-FE-COM-01).
  const hasSaleLoadError = isEditing && !isLoadingSale && !!(saleQuery as any)?.isError;

  return (
    <>
      <FormContainer
        title={isEditing ? text.form.title.edit : text.form.title.create}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings?.cancel || 'Cancelar'}
              variant="secondary"
              type="button"
              onClick={() => guardedNavigate(SALES_LIST_ROUTE)}
            />
            {canSave && (
              <ButtonSaveAndNext
                create={!isEditing}
                dirtyFields={dirtyFields}
                type="submit"
                form="sale-form"
                languageGB={languageGB}
                loading={isSaving}
                disabled={isSaving || isLoadingSale}
              />
            )}
          </>
        }
      >
        {isLoadingSale ? (
          <VStack align="stretch" gap={4}>
            <Skeleton height="60px" />
            <Skeleton height="60px" />
            <Skeleton height="200px" />
          </VStack>
        ) : hasSaleLoadError ? (
          <VStack gap={3} py={12}>
            <Text color="fg.muted">{text.list.error.message}</Text>
            <Button
              variant="outline"
              title={text.list.error.retry}
              onClick={() => (saleQuery as any)?.refetch?.()}
            />
          </VStack>
        ) : (
          <Form noPadding id="sale-form" onSubmit={handleSubmit(onSubmit)}>
            {/* Cabeçalho (`FM002`) — `dt_sale`/`dt_shipping` obrigatórios
                (default hoje) · `due_date` opcional · Responsável readonly
                (decorativo — NUNCA no schema/payload, o servidor resolve o
                usuário autenticado). `farm_id`/`tenant_id`: NAO_APLICAVEL
                (contexto autenticado + `X-Farm-Id`). */}
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

              <InputReadOnly label={header.user} value={authUser?.username ?? '—'} />
            </SimpleGrid>

            {/* Seção de ITENS (`SaleItemsEditor`/`SaleItemRow`,
                `useFieldArray('items')`, SALE-FE-COM-04 — cascatas armazém/
                produto→estoque/UM, cálculos e descontos, `IG002..IG011`). */}
            <Box mt={6}>
              <SaleItemsEditor
                control={control}
                fields={itemFields}
                append={appendItem}
                remove={removeItem}
                errors={errors}
                isEditingSale={isEditing}
                languageGB={languageGB}
                disabled={!canSave}
              />
            </Box>

            {/* Bloco de TOTAIS + COMPLEMENTOS (`FM004`) — `SaleTotalsBlock`
                (SALE-FE-COM-03). */}
            <SaleTotalsBlock
              control={control}
              register={register}
              errors={errors}
              languageGB={languageGB}
              disabled={!canSave}
            />
          </Form>
        )}
      </FormContainer>

      <DeleteConfirmDialog
        isOpen={isConfirmOpen}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        tone="warning"
        colorPalette="orange"
        title={text.form.unsavedChangesDialog.title}
        description={text.form.unsavedChangesDialog.description}
        confirmButtonText={text.form.unsavedChangesDialog.confirmButton}
        hideQuestionMark
        warningText=""
      />
    </>
  );
}
