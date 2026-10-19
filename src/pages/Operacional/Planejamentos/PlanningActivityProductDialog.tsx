// src/pages/Operacional/Planejamentos/PlanningActivityProductDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo Criar/Editar Insumo (PlanningActivityProduct, nível 4a da árvore
// de Planejamento) — TASK-FE-PLAN-06 (execução `97-Esteiras/007`,
// SUR-21..23). Acionado por `PlanningActivityProductSection.tsx`.
//
// Composição: PADRÃO 14 — mirror EXATO `PlanningActivityEquipmentDialog.tsx`/
// `PlanningActivityDialog.tsx` (mesma feature).
//
// CASCATA (divergência de contrato documentada, `@/@types/v2/Operacional/
// planning-activity-product` + `GAP-PLAN-FE-06`, `[PARA ANÁLISE]`):
//   - `warehouse_uuid` (LK-09, `GET /warehouses/options`, ungated, nullable).
//   - `product_uuid` (catálogo GLOBAL do tenant, `GET /products/options`,
//     ungated) — NÃO filtrado pelo armazém selecionado (o legado filtrava
//     via `LK-08`/`GET /products?inputs=true&warehouse=`; a API migrada não
//     expõe esse filtro — catálogo completo é o superset seguro, mesmo
//     padrão de degradação já aceito em `TASK-FE-PLAN-07`).
//   - Ao MUDAR `product_uuid` (ação do usuário, `handleProductChange`):
//     autopreenche `measurement` (texto RESOLVIDO, não um Select de
//     unidades com conversão M/D — sem endpoint dedicado) e `amount`
//     (`average_cost`) via `GET /products/{uuid}` (`getProduct`), GATEADO
//     por `products_view` — fallback silencioso se sem permissão.
//   - Ao MUDAR `product_uuid` OU `warehouse_uuid` (com ambos definidos):
//     consulta `GET /stocks` (`listStocks`, filtrado por
//     `product_uuid`+`warehouse_uuid`) para o preview de estoque (`stock`,
//     FLD-27, readonly, só informativo — NUNCA bloqueia o submit mesmo se
//     "insuficiente", "Estados de UI" do Roteiro). Também GATEADO por
//     `stocks_view` — fallback silencioso.
//
// `total` (CV-04) é preview CLIENTE, NÃO-AUTORITATIVO
// (`calculatePivotTotalPreview`) — nunca enviado no payload; o servidor
// sempre recalcula via `CalculatePivotTotalAction` (G-CALC-DUP).
//
// Invalidação REAL da árvore é manual em `actionSuccess` (MESMA chave
// `planningDetailQueryKey`, NUNCA a do form raiz).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Dialog, Portal, SimpleGrid } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { calculatePivotTotalPreview } from '@/utils/calculatePivotTotalPreview';

import {
  createPlanningActivityProduct,
  updatePlanningActivityProduct,
} from '@/services/v2/Operacional/Planejamentos/planning-activity-product-service';
import { getProduct, listProductOptions } from '@/services/v2/Products/product-service';
import { listStocks } from '@/services/v2/Stocks/stock-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { PlanningActivityProductTreeItem } from '@/@types/v2/Operacional/planning';
import type {
  PlanningActivityProductCreatePayload,
  PlanningActivityProductForm,
  PlanningActivityProductUpdatePayload,
} from '@/@types/v2/Operacional/planning-activity-product';
import type { ProductOption } from '@/@types/v2/Products';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import { planningDetailQueryKey } from './planning-tree-query-key';

export interface PlanningActivityProductDialogProps {
  /** UUID do Planning pai — SEMPRE via prop, usado só para invalidar a
   *  query dedicada da árvore. */
  planningUuid: string;
  /** UUID da Atividade pai — payload `planning_activity_uuid`. */
  planningActivityUuid: string;
  /** Área plantada TOTAL do Planning (FLD-07) — preview client-side (CV-04). */
  plantedArea: number;
  isOpen: boolean;
  /** `null` = modo CRIAR. Objeto presente = modo EDITAR. */
  product: PlanningActivityProductTreeItem | null;
  onClose: () => void;
}

const EMPTY_FORM: PlanningActivityProductForm = {
  warehouse_uuid: null,
  product_uuid: null,
  measurement: '',
  quantity: null,
  amount: null,
};

function buildFormFromTreeItem(
  source: PlanningActivityProductTreeItem
): PlanningActivityProductForm {
  return {
    warehouse_uuid: source.warehouse
      ? { label: source.warehouse.description, value: source.warehouse.uuid }
      : null,
    product_uuid: source.product
      ? { label: source.product.description, value: source.product.uuid }
      : null,
    measurement: source.measurement || '',
    quantity: source.quantity,
    amount: source.amount,
  };
}

interface StockPreview {
  quantity: number;
  unit: string;
}

export function PlanningActivityProductDialog({
  planningUuid,
  planningActivityUuid,
  plantedArea,
  isOpen,
  product,
  onClose,
}: PlanningActivityProductDialogProps) {
  const { languageGB } = useLanguage();
  const queryClient = useQueryClient();
  const text = languageGB.plannings.planning.tree.product;

  const isEditing = !!product;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    setError,
    formState: { errors },
  } = useForm<PlanningActivityProductForm>({
    mode: 'onChange',
    defaultValues: EMPTY_FORM,
  });

  // Preview de estoque (FLD-27) — informativo, NUNCA parte do payload (não é
  // campo do `PlanningActivityProductRequest`). `null` = "sem dado" (sem
  // armazém selecionado, sem permissão `stocks_view` ou sem registro de
  // estoque para a combinação produto+armazém).
  const [stockPreview, setStockPreview] = useState<StockPreview | null>(null);
  const [isAutofillPending, setIsAutofillPending] = useState(false);

  // Fill via `useEffect` + `reset` — Pattern 14 regra 6. `reset()` NUNCA
  // passa pelo `onChange` dos Controllers — os autofills abaixo só disparam
  // em seleção real do usuário, nunca ao abrir/editar.
  useEffect(() => {
    if (!isOpen) return;
    reset(product ? buildFormFromTreeItem(product) : EMPTY_FORM);
    setStockPreview(null);
    // Em modo EDITAR, com armazém já vinculado, busca o preview de estoque
    // informativo (não recalcula `measurement`/`amount` — esses já vêm da
    // linha salva, mirror Pattern 14 regra 6).
    if (product?.product && product?.warehouse) {
      refreshStockPreview(product.product.uuid, product.warehouse.uuid);
    }
  }, [isOpen, product, reset]);

  const quantityWatch = watch('quantity');
  const amountWatch = watch('amount');
  const totalPreview = calculatePivotTotalPreview(amountWatch, quantityWatch, plantedArea);

  // GET /stocks?product_uuid=&warehouse_uuid= — preview de estoque (FLD-27),
  // GATEADO por `stocks_view` (GAP-PLAN-FE-06). Fallback silencioso: sem
  // permissão ou sem registro → `stockPreview = null` (exibido como "—").
  async function refreshStockPreview(productUuid?: string, warehouseUuid?: string) {
    if (!productUuid || !warehouseUuid) {
      setStockPreview(null);
      return;
    }
    try {
      const res = await listStocks({
        product_uuid: productUuid,
        warehouse_uuid: warehouseUuid,
        page: 1,
        per_page: 1,
      });
      const row = res.data.items[0];
      setStockPreview(row ? { quantity: row.quantity, unit: row.unit } : null);
    } catch {
      setStockPreview(null);
    }
  }

  // IG-10 — `change product_uuid`: autopreenche `measurement`+`amount`
  // (`average_cost`) via `getProduct` (GATEADO por `products_view`,
  // GAP-PLAN-FE-06). Disparado SÓ pelo `onChange` do Select (ação do
  // usuário) — nunca pelo `reset()` de abertura/edição.
  async function handleProductChange(option: { label: string; value: string } | null) {
    if (!option) {
      setStockPreview(null);
      return;
    }
    setIsAutofillPending(true);
    try {
      const res = await getProduct(option.value);
      setValue('measurement', res.data.measurement?.description ?? '', { shouldDirty: true });
      setValue('amount', res.data.average_cost ?? 0, { shouldDirty: true });
    } catch {
      // Fallback silencioso (403 sem `products_view` ou qualquer outra
      // falha) — `measurement`/`amount` seguem editáveis manualmente.
    } finally {
      setIsAutofillPending(false);
    }
    const warehouseUuid = getValues('warehouse_uuid')?.value;
    refreshStockPreview(option.value, warehouseUuid);
  }

  // IG-09 — `change warehouse_uuid`: refaz o preview de estoque (FLD-27)
  // para o produto já selecionado, se houver.
  function handleWarehouseChange() {
    const productUuid = getValues('product_uuid')?.value;
    const warehouseUuid = getValues('warehouse_uuid')?.value;
    refreshStockPreview(productUuid, warehouseUuid);
  }

  const productMutation = useRequest<PlanningActivityProductTreeItem>({
    asyncFunction: tryPersistProduct,
    entityName: text.singularLabel,
    queryKey: 'planning-activity-product-mutation',
    typesRequest: isEditing ? 'update' : 'create',
    personalizedMessage: isEditing ? text.dialog.updatedToast : text.dialog.createdToast,
    actionSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planningDetailQueryKey(planningUuid) });
      onClose();
    },
  });

  async function tryPersistProduct(data: PlanningActivityProductForm) {
    const basePayload = {
      planning_activity_uuid: planningActivityUuid,
      product_uuid: data.product_uuid!.value,
      warehouse_uuid: data.warehouse_uuid?.value ?? null,
      measurement: data.measurement,
      quantity: Number(data.quantity ?? 0),
      amount: Number(data.amount ?? 0),
    };

    try {
      if (isEditing && product) {
        const payload: PlanningActivityProductUpdatePayload = basePayload;
        return await updatePlanningActivityProduct(product.uuid, payload);
      }

      const payload: PlanningActivityProductCreatePayload = basePayload;
      return await createPlanningActivityProduct(payload);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof PlanningActivityProductForm, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
      throw error;
    }
  }

  function onSubmit(data: PlanningActivityProductForm) {
    productMutation.mutate(data);
  }

  function handleClose() {
    if (productMutation.isPending) return;
    onClose();
  }

  const stockDisplayValue = stockPreview
    ? `${stockPreview.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${stockPreview.unit}`
    : '—';

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open) handleClose();
      }}
      closeOnInteractOutside={false}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>
                {isEditing ? text.dialog.title.edit : text.dialog.title.create}
              </Dialog.Title>
            </Dialog.Header>

            <Form noPadding onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  {/* warehouse_uuid (LK-09) — nullable, catálogo ungated
                      (`/warehouses/options`). */}
                  <Controller
                    name="warehouse_uuid"
                    control={control}
                    render={({ field }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={text.dialog.fields.warehouse}
                        placeholder={text.dialog.placeholders.warehouse}
                        error={errors.warehouse_uuid?.message as string | undefined}
                        service={listWarehouseOptions}
                        mapOptions={(item: WarehouseOption) => ({
                          label: item.description,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                        })}
                        value={field.value ?? null}
                        onChange={(option: any) => {
                          field.onChange(option ?? null);
                          handleWarehouseChange();
                        }}
                        isDisabled={productMutation.isPending}
                        disablePortal
                      />
                    )}
                  />

                  {/* product_uuid — catálogo GLOBAL, NÃO escopado pelo
                      armazém (GAP-PLAN-FE-06). */}
                  <Controller
                    name="product_uuid"
                    control={control}
                    rules={{ required: text.dialog.errors.required }}
                    render={({ field }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={text.dialog.fields.product}
                        placeholder={text.dialog.placeholders.product}
                        error={errors.product_uuid?.message as string | undefined}
                        service={listProductOptions}
                        mapOptions={(item: ProductOption) => ({
                          label: item.description,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                        })}
                        value={field.value ?? null}
                        onChange={(option: any) => {
                          field.onChange(option ?? null);
                          handleProductChange(option ?? null);
                        }}
                        isRequired
                        isDisabled={productMutation.isPending}
                        disablePortal
                      />
                    )}
                  />

                  {/* measurement (FLD-26) — texto RESOLVIDO (autofill de
                      `getProduct`), NUNCA um Select de conversão M/D (sem
                      endpoint dedicado, GAP-PLAN-FE-06). */}
                  <InputReadOnly
                    name="measurement"
                    label={text.dialog.fields.measurement}
                    value={watch('measurement') || '—'}
                    loading={isAutofillPending}
                    error={errors.measurement?.message as string | undefined}
                  />

                  {/* stock (FLD-27) — preview informativo, NUNCA bloqueia o
                      submit ("Estados de UI" do Roteiro). */}
                  <InputReadOnly
                    name="stock"
                    label={text.dialog.fields.stock}
                    value={stockDisplayValue}
                    tooltip={text.dialog.stockHelperText}
                  />

                  {/* quantity (Qtd/ha) — recalcula o preview de total (CV-04). */}
                  <Controller
                    name="quantity"
                    control={control}
                    rules={{ required: text.dialog.errors.required }}
                    render={({ field }) => (
                      <NumberInput
                        name={field.name}
                        label={text.dialog.fields.quantity}
                        allowDot
                        decimalPlaces={2}
                        min={0}
                        value={field.value ?? null}
                        onValueChange={(value) => field.onChange(value)}
                        error={errors.quantity?.message as string | undefined}
                        disabled={productMutation.isPending}
                      />
                    )}
                  />

                  {/* amount (Vl. Unitário) — autofill via `handleProductChange`
                      (IG-10), sempre editável (GAP-PLAN-FE-06). */}
                  <Controller
                    name="amount"
                    control={control}
                    rules={{ required: text.dialog.errors.required }}
                    render={({ field }) => (
                      <MoneyInput
                        name={field.name}
                        label={text.dialog.fields.amount}
                        value={field.value ?? null}
                        onValueChange={(value) => field.onChange(value)}
                        error={errors.amount?.message as string | undefined}
                        disabled={productMutation.isPending || isAutofillPending}
                      />
                    )}
                  />

                  {/* total — preview CLIENTE, NÃO-AUTORITATIVO (CV-04). */}
                  <InputReadOnly
                    name="total"
                    label={text.dialog.fields.total}
                    value={totalPreview.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                    helperText={text.dialog.totalHelperText}
                  />
                </SimpleGrid>
              </Dialog.Body>

              <Dialog.Footer>
                <Button
                  title={languageGB.defaltStrings.cancel}
                  variant="outline"
                  type="button"
                  onClick={handleClose}
                  disabled={productMutation.isPending}
                />
                <Button
                  title={
                    isEditing ? languageGB.defaltStrings.update : languageGB.defaltStrings.create
                  }
                  type="submit"
                  loading={productMutation.isPending}
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
