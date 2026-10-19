// src/pages/Operacional/Planejamentos/PlanningActivityFunctionDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo Criar/Editar MO/Serviço (PlanningActivityFunction, nível 4c da
// árvore de Planejamento) — TASK-FE-PLAN-06 (execução `97-Esteiras/007`,
// SUR-27..29). Acionado por `PlanningActivityFunctionSection.tsx`.
//
// Composição: PADRÃO 14 — mirror EXATO `PlanningActivityEquipmentDialog.tsx`
// (mesma Tarefa, cascata análoga).
//
// `function_uuid` (Função/cargo — executor, LK-12, `GET /functions/options`,
// ungated) — ao MUDAR (ação do usuário, `handleFunctionChange`), autopreenche
// `measurement`='H' (fixo) e `amount` = `vl_time_productive` (IG-14) via
// `GET /functions/{uuid}` (`getFunction`), GATEADO por `functions_view` —
// fallback silencioso se sem permissão (`GAP-PLAN-FE-06`).
//
// `employee_uuid` (FLD-34, OPCIONAL) — o legado (LK-13) filtrava o catálogo
// de Funcionário pela Função/cargo selecionada (`GET /employees?function=`);
// a API migrada (`GET /employees/options`) NÃO aceita esse filtro — o Select
// aqui lista TODOS os funcionários ativos do tenant (degradação documentada,
// `GAP-PLAN-FE-06`, mesmo padrão já aceito em `TASK-FE-PLAN-07` para
// catálogos sem filtro server-side equivalente).
//
// `total` (CV-04) é preview CLIENTE, NÃO-AUTORITATIVO
// (`calculatePivotTotalPreview`) — nunca enviado no payload.
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
  getEmployeeByUuid,
  listEmployeeOptions,
} from '@/services/v2/CadastrosBase/Employee/employee-service';
import { getFunction, listFunctionOptions } from '@/services/v2/Functions/function-service';
import {
  createPlanningActivityFunction,
  updatePlanningActivityFunction,
} from '@/services/v2/Operacional/Planejamentos/planning-activity-function-service';

import type { EmployeeOption } from '@/@types/v2/CadastrosBase/employee';
import type { FunctionOption } from '@/@types/v2/Functions';
import type { PlanningActivityFunctionTreeItem } from '@/@types/v2/Operacional/planning';
import type {
  PlanningActivityFunctionCreatePayload,
  PlanningActivityFunctionForm,
  PlanningActivityFunctionUpdatePayload,
} from '@/@types/v2/Operacional/planning-activity-function';

import { planningDetailQueryKey } from './planning-tree-query-key';

export interface PlanningActivityFunctionDialogProps {
  /** UUID do Planning pai — SEMPRE via prop, usado só para invalidar a
   *  query dedicada da árvore. */
  planningUuid: string;
  /** UUID da Atividade pai — payload `planning_activity_uuid`. */
  planningActivityUuid: string;
  /** Área plantada TOTAL do Planning (FLD-07) — preview client-side (CV-04). */
  plantedArea: number;
  isOpen: boolean;
  /** `null` = modo CRIAR. Objeto presente = modo EDITAR. */
  service: PlanningActivityFunctionTreeItem | null;
  onClose: () => void;
}

/** SEMPRE 'H' — fixo, mirror `ModalService` legado. */
const FIXED_MEASUREMENT = 'H';

const EMPTY_FORM: PlanningActivityFunctionForm = {
  function_uuid: null,
  employee_uuid: null,
  measurement: FIXED_MEASUREMENT,
  quantity: null,
  amount: null,
};

// `PlanningActivityFunctionResource.php` expõe `employee` só com `uuid`
// (`App\Employee`, legado não migrado, sem campo de nome próprio nesta
// Resource) — o label inicial é um placeholder NEUTRO (nunca o `uuid` cru,
// invariante do projeto: "nunca renderizar `employee.uuid` cru"),
// substituído pelo nome real assim que `resolveEmployeeLabel` (abaixo)
// resolver via `getEmployeeByUuid` (GATEADO por `employees_view` — mesmo
// tema de permissão do `GAP-PLAN-FE-06`; se não resolver, o placeholder
// permanece, nunca o uuid).
function buildFormFromTreeItem(
  source: PlanningActivityFunctionTreeItem,
  employeeUnresolvedLabel: string
): PlanningActivityFunctionForm {
  return {
    function_uuid: source.function
      ? { label: source.function.name, value: source.function.uuid }
      : null,
    employee_uuid: source.employee
      ? { label: employeeUnresolvedLabel, value: source.employee.uuid }
      : null,
    measurement: source.measurement || FIXED_MEASUREMENT,
    quantity: source.quantity,
    amount: source.amount,
  };
}

export function PlanningActivityFunctionDialog({
  planningUuid,
  planningActivityUuid,
  plantedArea,
  isOpen,
  service,
  onClose,
}: PlanningActivityFunctionDialogProps) {
  const { languageGB } = useLanguage();
  const queryClient = useQueryClient();
  const text = languageGB.plannings.planning.tree.function;

  const isEditing = !!service;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<PlanningActivityFunctionForm>({
    mode: 'onChange',
    defaultValues: EMPTY_FORM,
  });

  // Fill via `useEffect` + `reset` — Pattern 14 regra 6. Ao editar um
  // serviço com `employee` vinculado, resolve o nome real de forma
  // assíncrona (`resolveEmployeeLabel`) — o `reset()` inicial usa um
  // placeholder neutro, nunca o `uuid` cru.
  useEffect(() => {
    if (!isOpen) return;
    reset(
      service ? buildFormFromTreeItem(service, text.dialog.employeeUnresolvedLabel) : EMPTY_FORM
    );
    if (service?.employee) {
      resolveEmployeeLabel(service.employee.uuid);
    }
  }, [isOpen, service, reset]);

  async function resolveEmployeeLabel(employeeUuid: string) {
    try {
      const res = await getEmployeeByUuid(employeeUuid);
      setValue('employee_uuid', { label: res.data.name, value: employeeUuid });
    } catch {
      // Fallback silencioso (403 sem `employees_view` ou qualquer outra
      // falha, GAP-PLAN-FE-06) — o placeholder neutro definido em
      // `buildFormFromTreeItem` permanece (nunca o uuid cru).
    }
  }

  const quantityWatch = watch('quantity');
  const amountWatch = watch('amount');
  const totalPreview = calculatePivotTotalPreview(amountWatch, quantityWatch, plantedArea);

  const [isAutofillPending, setIsAutofillPending] = useState(false);

  // IG-14 — `change function_uuid` (executor): autopreenche `amount`
  // (`vl_time_productive`) via `getFunction` (GATEADO por `functions_view`,
  // GAP-PLAN-FE-06). Disparado SÓ pelo `onChange` do Select.
  async function handleFunctionChange(option: { label: string; value: string } | null) {
    if (!option) return;
    setIsAutofillPending(true);
    try {
      const res = await getFunction(option.value);
      const vlTimeProductive = Number(res.data.vl_time_productive) || 0;
      setValue('amount', vlTimeProductive, { shouldDirty: true });
    } catch {
      // Fallback silencioso (403 sem `functions_view` ou qualquer outra
      // falha) — GAP-PLAN-FE-06.
    } finally {
      setIsAutofillPending(false);
    }
  }

  const functionMutation = useRequest<PlanningActivityFunctionTreeItem>({
    asyncFunction: tryPersistFunction,
    entityName: text.singularLabel,
    queryKey: 'planning-activity-function-mutation',
    typesRequest: isEditing ? 'update' : 'create',
    personalizedMessage: isEditing ? text.dialog.updatedToast : text.dialog.createdToast,
    actionSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planningDetailQueryKey(planningUuid) });
      onClose();
    },
  });

  async function tryPersistFunction(data: PlanningActivityFunctionForm) {
    const basePayload = {
      planning_activity_uuid: planningActivityUuid,
      function_uuid: data.function_uuid!.value,
      employee_uuid: data.employee_uuid?.value ?? null,
      measurement: FIXED_MEASUREMENT,
      quantity: Number(data.quantity ?? 0),
      amount: Number(data.amount ?? 0),
    };

    try {
      if (isEditing && service) {
        const payload: PlanningActivityFunctionUpdatePayload = basePayload;
        return await updatePlanningActivityFunction(service.uuid, payload);
      }

      const payload: PlanningActivityFunctionCreatePayload = basePayload;
      return await createPlanningActivityFunction(payload);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof PlanningActivityFunctionForm, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
      throw error;
    }
  }

  function onSubmit(data: PlanningActivityFunctionForm) {
    functionMutation.mutate(data);
  }

  function handleClose() {
    if (functionMutation.isPending) return;
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
                  {/* function_uuid (executor, LK-12) — catálogo ungated
                      (`/functions/options`). */}
                  <Controller
                    name="function_uuid"
                    control={control}
                    rules={{ required: text.dialog.errors.required }}
                    render={({ field }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={text.dialog.fields.executor}
                        placeholder={text.dialog.placeholders.executor}
                        error={errors.function_uuid?.message as string | undefined}
                        service={listFunctionOptions}
                        mapOptions={(item: FunctionOption) => ({
                          label: item.name,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                        })}
                        value={field.value ?? null}
                        onChange={(option: any) => {
                          field.onChange(option ?? null);
                          handleFunctionChange(option ?? null);
                        }}
                        isRequired
                        isDisabled={functionMutation.isPending}
                        disablePortal
                      />
                    )}
                  />

                  {/* employee_uuid (FLD-34, OPCIONAL) — catálogo NÃO
                      escopado pela função (armadilha degradada, GAP-PLAN-FE-06). */}
                  <Controller
                    name="employee_uuid"
                    control={control}
                    render={({ field }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={text.dialog.fields.employee}
                        placeholder={text.dialog.placeholders.employee}
                        error={errors.employee_uuid?.message as string | undefined}
                        service={listEmployeeOptions}
                        mapOptions={(item: EmployeeOption) => ({
                          label: item.name,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                        })}
                        value={field.value ?? null}
                        onChange={(option: any) => field.onChange(option ?? null)}
                        isDisabled={functionMutation.isPending}
                        disablePortal
                      />
                    )}
                  />

                  {/* measurement — SEMPRE 'H' fixo, readonly. */}
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
                        disabled={functionMutation.isPending}
                      />
                    )}
                  />

                  {/* amount (Vl. Unitário) — autofill via `handleFunctionChange`
                      (IG-14), sempre editável (GAP-PLAN-FE-06). */}
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
                        disabled={functionMutation.isPending || isAutofillPending}
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
                  disabled={functionMutation.isPending}
                />
                <Button
                  title={
                    isEditing ? languageGB.defaltStrings.update : languageGB.defaltStrings.create
                  }
                  type="submit"
                  loading={functionMutation.isPending}
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
