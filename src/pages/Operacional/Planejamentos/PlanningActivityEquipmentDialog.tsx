// src/pages/Operacional/Planejamentos/PlanningActivityEquipmentDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo Criar/Editar Equipamento (PlanningActivityEquipment, nível 4b da
// árvore de Planejamento) — TASK-FE-PLAN-06 (execução `97-Esteiras/007`,
// SUR-24..26). Acionado por `PlanningActivityEquipmentSection.tsx`.
//
// Composição: PADRÃO 14 (`get_pwa_complex_screen_compositions_pattern`,
// "Modal Form com Dialog Chakra V3") — mirror EXATO `PlanningActivityDialog.
// tsx`/`PlanningOtherActivitiesDialog.tsx` (mesma feature): `useRequest` para
// a mutação + fill via `useEffect`/`reset` (Pattern 14 regra 6).
//
// `equipment_uuid` (catálogo `LK-11`, `GET /equipments/options`, ungated) —
// ao MUDAR (ação do usuário, nunca no `reset()` de abertura/edição — ver
// `handleEquipmentChange`), autopreenche `measurement`='H' (fixo) e `amount`
// = `vl_time_productive` do equipamento (IG-13). O autofill usa `GET
// /equipments/{uuid}` (`getEquipment`), GATEADO por `equipments_view` — se o
// usuário não tiver essa permissão (cenário que o legado nunca teve,
// `permission: nenhuma`), o autofill falha SILENCIOSAMENTE (sem toast) e o
// usuário preenche `amount` manualmente; o CRUD do pivot não depende disso
// (`GAP-PLAN-FE-06`, `[PARA ANÁLISE]`).
//
// `total` (CV-04) é preview CLIENTE, NÃO-AUTORITATIVO
// (`calculatePivotTotalPreview`, `@/utils`) — nunca enviado no payload; o
// servidor sempre recalcula via `CalculatePivotTotalAction` (G-CALC-DUP).
//
// Invalidação REAL da árvore é manual em `actionSuccess` via
// `queryClient.invalidateQueries({queryKey: planningDetailQueryKey(...)})` —
// NUNCA a chave do form raiz (mesma armadilha 1 de `TASK-FE-PLAN-02`..`05`).
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
  getEquipment,
  listEquipmentCatalogOptions,
} from '@/services/v2/Equipments/equipment-service';
import {
  createPlanningActivityEquipment,
  updatePlanningActivityEquipment,
} from '@/services/v2/Operacional/Planejamentos/planning-activity-equipment-service';

import type { EquipmentOption } from '@/@types/v2/Equipments';
import type { PlanningActivityEquipmentTreeItem } from '@/@types/v2/Operacional/planning';
import type {
  PlanningActivityEquipmentCreatePayload,
  PlanningActivityEquipmentForm,
  PlanningActivityEquipmentUpdatePayload,
} from '@/@types/v2/Operacional/planning-activity-equipment';

import { planningDetailQueryKey } from './planning-tree-query-key';

export interface PlanningActivityEquipmentDialogProps {
  /** UUID do Planning pai — SEMPRE via prop (Regra 2 do Modelo C), usado só
   *  para invalidar a query dedicada da árvore. */
  planningUuid: string;
  /** UUID da Atividade pai — payload `planning_activity_uuid`. */
  planningActivityUuid: string;
  /** Área plantada TOTAL do Planning (FLD-07) — só para o preview
   *  client-side NÃO-AUTORITATIVO do total (CV-04). */
  plantedArea: number;
  isOpen: boolean;
  /** `null` = modo CRIAR. Objeto presente = modo EDITAR. */
  equipment: PlanningActivityEquipmentTreeItem | null;
  onClose: () => void;
}

/** SEMPRE 'H' — fixo (FLD-32, `IG-13`), mirror `ModalEquipment` legado. */
const FIXED_MEASUREMENT = 'H';

const EMPTY_FORM: PlanningActivityEquipmentForm = {
  equipment_uuid: null,
  measurement: FIXED_MEASUREMENT,
  quantity: null,
  amount: null,
};

function buildFormFromTreeItem(
  source: PlanningActivityEquipmentTreeItem
): PlanningActivityEquipmentForm {
  return {
    equipment_uuid: source.equipment
      ? { label: source.equipment.description, value: source.equipment.uuid }
      : null,
    measurement: source.measurement || FIXED_MEASUREMENT,
    quantity: source.quantity,
    amount: source.amount,
  };
}

export function PlanningActivityEquipmentDialog({
  planningUuid,
  planningActivityUuid,
  plantedArea,
  isOpen,
  equipment,
  onClose,
}: PlanningActivityEquipmentDialogProps) {
  const { languageGB } = useLanguage();
  const queryClient = useQueryClient();
  const text = languageGB.plannings.planning.tree.equipment;

  const isEditing = !!equipment;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<PlanningActivityEquipmentForm>({
    mode: 'onChange',
    defaultValues: EMPTY_FORM,
  });

  // Fill via `useEffect` + `reset` — Pattern 14 regra 6. `reset()` NUNCA
  // passa pelo `onChange` do Controller — o autofill de `handleEquipmentChange`
  // abaixo só dispara em seleção real do usuário, nunca ao abrir/editar.
  useEffect(() => {
    if (!isOpen) return;
    reset(equipment ? buildFormFromTreeItem(equipment) : EMPTY_FORM);
  }, [isOpen, equipment, reset]);

  // Preview CLIENTE, NÃO-AUTORITATIVO (CV-04) — nunca enviado no payload.
  const quantityWatch = watch('quantity');
  const amountWatch = watch('amount');
  const totalPreview = calculatePivotTotalPreview(amountWatch, quantityWatch, plantedArea);

  // Suprime toast de erro genérico do `SelectAsyncPaginate` quando o
  // autofill de detalhe falha por falta de `equipments_view`
  // (`GAP-PLAN-FE-06`) — não é responsabilidade deste diálogo alertar sobre
  // uma permissão de outro módulo; o usuário preenche manualmente.
  const [isAutofillPending, setIsAutofillPending] = useState(false);

  // IG-13 — `change equipment_uuid`: autopreenche `amount` (`vl_time_productive`)
  // via `getEquipment` (GATEADO por `equipments_view`, GAP-PLAN-FE-06).
  // Disparado SÓ pelo `onChange` do Select (ação do usuário) — nunca pelo
  // `reset()` de abertura/edição.
  async function handleEquipmentChange(option: { label: string; value: string } | null) {
    if (!option) return;
    setIsAutofillPending(true);
    try {
      const res = await getEquipment(option.value);
      setValue('amount', res.data.vl_time_productive ?? 0, { shouldDirty: true });
    } catch {
      // Fallback silencioso (403 sem `equipments_view` ou qualquer outra
      // falha) — GAP-PLAN-FE-06. `amount` permanece editável manualmente.
    } finally {
      setIsAutofillPending(false);
    }
  }

  // ---- Mutação (`useRequest`, mirror `PlanningActivityDialog.tsx`). ----
  const equipmentMutation = useRequest<PlanningActivityEquipmentTreeItem>({
    asyncFunction: tryPersistEquipment,
    entityName: text.singularLabel,
    queryKey: 'planning-activity-equipment-mutation',
    typesRequest: isEditing ? 'update' : 'create',
    personalizedMessage: isEditing ? text.dialog.updatedToast : text.dialog.createdToast,
    actionSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planningDetailQueryKey(planningUuid) });
      onClose();
    },
  });

  async function tryPersistEquipment(data: PlanningActivityEquipmentForm) {
    const basePayload = {
      planning_activity_uuid: planningActivityUuid,
      equipment_uuid: data.equipment_uuid!.value,
      measurement: FIXED_MEASUREMENT,
      quantity: Number(data.quantity ?? 0),
      amount: Number(data.amount ?? 0),
    };

    try {
      if (isEditing && equipment) {
        const payload: PlanningActivityEquipmentUpdatePayload = basePayload;
        return await updatePlanningActivityEquipment(equipment.uuid, payload);
      }

      const payload: PlanningActivityEquipmentCreatePayload = basePayload;
      return await createPlanningActivityEquipment(payload);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof PlanningActivityEquipmentForm, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
      throw error;
    }
  }

  function onSubmit(data: PlanningActivityEquipmentForm) {
    equipmentMutation.mutate(data);
  }

  function handleClose() {
    if (equipmentMutation.isPending) return;
    onClose();
  }

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
                  {/* equipment_uuid (LK-11) — catálogo ungated
                      (`/equipments/options`). */}
                  <Controller
                    name="equipment_uuid"
                    control={control}
                    rules={{ required: text.dialog.errors.required }}
                    render={({ field }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={text.dialog.fields.equipment}
                        placeholder={text.dialog.placeholders.equipment}
                        error={errors.equipment_uuid?.message as string | undefined}
                        service={listEquipmentCatalogOptions}
                        mapOptions={(item: EquipmentOption) => ({
                          label: item.description,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                        })}
                        value={field.value ?? null}
                        onChange={(option: any) => {
                          field.onChange(option ?? null);
                          handleEquipmentChange(option ?? null);
                        }}
                        isRequired
                        isDisabled={equipmentMutation.isPending}
                        disablePortal
                      />
                    )}
                  />

                  {/* measurement (FLD-32) — SEMPRE 'H' fixo, readonly. */}
                  <InputReadOnly
                    name="measurement"
                    label={text.dialog.fields.measurement}
                    value={FIXED_MEASUREMENT}
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
                        disabled={equipmentMutation.isPending}
                      />
                    )}
                  />

                  {/* amount (Vl. Unitário) — autofill via `handleEquipmentChange`
                      (IG-13), sempre editável (GAP-PLAN-FE-06). */}
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
                        disabled={equipmentMutation.isPending || isAutofillPending}
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
                  disabled={equipmentMutation.isPending}
                />
                <Button
                  title={
                    isEditing ? languageGB.defaltStrings.update : languageGB.defaltStrings.create
                  }
                  type="submit"
                  loading={equipmentMutation.isPending}
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
