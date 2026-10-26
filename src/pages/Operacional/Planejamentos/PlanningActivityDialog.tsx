// src/pages/Operacional/Planejamentos/PlanningActivityDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo Criar/Editar Atividade (PlanningActivity, nível 3 da árvore de
// Planejamento) — TASK-FE-PLAN-05 (execução `97-Esteiras/007`, SUR-18..20).
// Acionado por `PlanningActivitySection.tsx`.
//
// Composição: PADRÃO 14 (`get_pwa_complex_screen_compositions_pattern`,
// "Modal Form com Dialog Chakra V3") — mirror EXATO
// `PlanningOperationDialog.tsx`/`PlanningCultivationDialog.tsx` (mesma
// feature, Tarefas imediatamente anteriores): `useRequest` para a mutação +
// fill via `useEffect`/`reset` (regra 6 — sem `useCustomFormQueryById`, o
// dado de edição já chega pronto via prop `activity`, populado pela árvore
// já hidratada de `PlanningTree.tsx`).
//
// `activity_uuid` (catálogo `LK-06`, `GET /activities/options?operation_uuid=`
// — armadilha 3 do Roteiro: escopado pela `Operation` CATÁLOGO da operação
// corrente, `operation.operation.uuid`, NUNCA o `planning_operation_uuid` da
// instância da árvore) — SEMPRE editável, inclusive ao editar (fidelidade ao
// legado, diferente de `operation_uuid` em `PlanningOperationDialog`: aqui
// NÃO existe campo imutável, `PlanningActivityRequest::rules()` exige os 4
// campos em AMBOS store/update, mirror exato do `update()` legado).
//
// Datas herdadas da operação pai ao CRIAR (`buildDefaultValues`, "Leitura do
// dev" da Tarefa) — pré-preenchidas pelo CLIENTE a partir de
// `operation.start_date`/`operation.end_date` (podem vir `null` se a
// operação auto-semeada ainda não teve o período definido), mas SEMPRE
// editáveis; o servidor valida o intervalo de qualquer forma
// (G-VALIDATION, `PlanningActivityRequest::validateDatesWithinOperationRange`,
// mensagem "As datas devem estar dentro do intervalo da operação.") — 422
// mapeado por campo via `setError`, NUNCA recalculado no cliente (mesma
// filosofia de `PlanningOperationDialog`/`PlanningCultivationDialog`).
//
// Invalidação REAL da árvore é manual em `actionSuccess` via
// `queryClient.invalidateQueries({queryKey: planningDetailQueryKey(...)})` —
// NUNCA a chave do form raiz, mesma armadilha 1 de `TASK-FE-PLAN-02`..`04`.
//
// `employee_id`/`description`/`use_app`/`anticipate` NÃO aparecem — código
// morto (`GAP-PLAN-ACT-EMPLOYEE-01`, `[AVALIADO]`).
//
// `onCreated` — reaproveita o padrão de auto-expansão consolidado em
// `PlanningCultivationDialog.tsx` (`GAP-PLAN-FE-03`, item 7): chamado só em
// modo CRIAR, com o `uuid` da atividade recém-criada, para que
// `PlanningActivitySection.tsx` auto-expanda o `Accordion.Item`
// correspondente (raiz de onde `TASK-FE-PLAN-06` monta os 3 sub-níveis de
// pivot) sem clique adicional.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Portal, SimpleGrid } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import {
  createPlanningActivity,
  listPlanningActivityCatalog,
  updatePlanningActivity,
} from '@/services/v2/Operacional/Planejamentos/planning-activity-service';

import type {
  PlanningActivityTreeItem,
  PlanningOperationTreeItem,
} from '@/@types/v2/Operacional/planning';
import type {
  PlanningActivityCatalogOption,
  PlanningActivityCreatePayload,
  PlanningActivityForm,
  PlanningActivityUpdatePayload,
} from '@/@types/v2/Operacional/planning-activity';

import { planningDetailQueryKey } from './planning-tree-query-key';

export interface PlanningActivityDialogProps {
  /** UUID do Planning pai — SEMPRE via prop (Regra 2 do Modelo C), usado só
   *  para invalidar a query dedicada da árvore. */
  planningUuid: string;
  /** Operação pai já hidratada — fonte de `planning_operation_uuid`
   *  (payload), do catálogo escopado (`operation.operation.uuid`, LK-06,
   *  armadilha 3) e das datas herdadas ao criar. Esta seção NUNCA busca dado
   *  sozinha (Regra 2 do Modelo C). */
  operation: PlanningOperationTreeItem;
  isOpen: boolean;
  /** `null` = modo CRIAR. Objeto presente = modo EDITAR (dado já hidratado
   *  pela árvore, sem query própria — Pattern 14 regra 6). */
  activity: PlanningActivityTreeItem | null;
  onClose: () => void;
  /** GAP-PLAN-FE-03 (item 7), reaproveitado neste nível — chamado SÓ em modo
   *  CRIAR, com o `uuid` da atividade recém-criada. */
  onCreated?: (uuid: string) => void;
}

function buildDefaultValues(
  source: PlanningActivityTreeItem | null,
  operation: PlanningOperationTreeItem
): PlanningActivityForm {
  return {
    activity_uuid: source?.activity
      ? { label: source.activity.name, value: source.activity.uuid }
      : null,
    // Datas herdadas da operação pai ao CRIAR (source === null) — a
    // operação auto-semeada pode ainda não ter período definido
    // (`start_date`/`end_date` nulos até "Definir Período"), caso em que
    // não há o que herdar.
    start_date: source?.start_date ?? operation.start_date ?? null,
    end_date: source?.end_date ?? operation.end_date ?? null,
  };
}

export function PlanningActivityDialog({
  planningUuid,
  operation,
  isOpen,
  activity,
  onClose,
  onCreated,
}: PlanningActivityDialogProps) {
  const { languageGB } = useLanguage();
  const queryClient = useQueryClient();
  const text = languageGB.plannings.planning.tree.activity;

  const isEditing = !!activity;
  const catalogOperationUuid = operation.operation?.uuid;

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PlanningActivityForm>({
    mode: 'onChange',
    defaultValues: buildDefaultValues(null, operation),
  });

  // Fill via `useEffect` + `reset` — Pattern 14 regra 6.
  useEffect(() => {
    if (!isOpen) return;
    reset(buildDefaultValues(activity, operation));
  }, [isOpen, activity, operation, reset]);

  // ---- Mutação (`useRequest`, mirror `PlanningOperationDialog.tsx`). ----
  const activityMutation = useRequest<PlanningActivityTreeItem>({
    asyncFunction: tryPersistActivity,
    entityName: text.singularLabel,
    queryKey: 'planning-activity-mutation',
    typesRequest: isEditing ? 'update' : 'create',
    personalizedMessage: isEditing ? text.dialog.updatedToast : text.dialog.createdToast,
    actionSuccess: (data) => {
      // Reproduz o `reload()` do legado (Decisão de arquitetura FID-G3F) —
      // invalida a MESMA chave da árvore, NUNCA a do form raiz.
      queryClient.invalidateQueries({ queryKey: planningDetailQueryKey(planningUuid) });
      // Auto-expande a atividade recém-criada, SÓ em modo CRIAR (mirror
      // `GAP-PLAN-FE-03` item 7, `PlanningCultivationDialog.tsx`).
      if (!isEditing) {
        onCreated?.(data.uuid);
      }
      onClose();
    },
  });

  async function tryPersistActivity(data: PlanningActivityForm) {
    const basePayload = {
      planning_operation_uuid: operation.uuid,
      activity_uuid: data.activity_uuid!.value,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
    };

    try {
      if (isEditing && activity) {
        const payload: PlanningActivityUpdatePayload = basePayload;
        return await updatePlanningActivity(activity.uuid, payload);
      }

      const payload: PlanningActivityCreatePayload = basePayload;
      return await createPlanningActivity(payload);
    } catch (error) {
      // 422 (G-VALIDATION — intervalo de datas da operação pai) mapeado por
      // campo — mirror `tryPersistOperation`.
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof PlanningActivityForm, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
      throw error;
    }
  }

  function onSubmit(data: PlanningActivityForm) {
    activityMutation.mutate(data);
  }

  function handleClose() {
    if (activityMutation.isPending) return;
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
                  {/* activity_uuid (LK-06) — catálogo escopado pela
                      OPERAÇÃO CATÁLOGO corrente (armadilha 3); SEMPRE
                      editável, inclusive ao editar (fidelidade ao legado). */}
                  <Controller
                    name="activity_uuid"
                    control={control}
                    rules={{ required: text.dialog.errors.required }}
                    render={({ field }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={text.dialog.fields.activity}
                        placeholder={text.dialog.placeholders.activity}
                        error={errors.activity_uuid?.message as string | undefined}
                        service={listPlanningActivityCatalog}
                        mapOptions={(item: PlanningActivityCatalogOption) => ({
                          label: item.name,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                          operation_uuid: catalogOperationUuid,
                        })}
                        cacheUniqs={[catalogOperationUuid]}
                        value={field.value ?? null}
                        onChange={(option: any) => field.onChange(option ?? null)}
                        isRequired
                        isDisabled={activityMutation.isPending}
                        disablePortal
                      />
                    )}
                  />

                  {/* start_date/end_date — herdadas da operação ao criar,
                      SEMPRE editáveis; validadas NO SERVIDOR contra o
                      intervalo da operação pai (G-VALIDATION); 422 mapeado
                      aqui, nunca recalculado no cliente. */}
                  <Controller
                    name="start_date"
                    control={control}
                    rules={{ required: text.dialog.errors.required }}
                    render={({ field }) => (
                      <DateInput
                        label={text.dialog.fields.startDate}
                        value={field.value}
                        onChange={(value) => field.onChange(value)}
                        isRequired
                        disabled={activityMutation.isPending}
                        error={errors.start_date?.message as string | undefined}
                        disablePortal
                      />
                    )}
                  />

                  <Controller
                    name="end_date"
                    control={control}
                    rules={{ required: text.dialog.errors.required }}
                    render={({ field }) => (
                      <DateInput
                        label={text.dialog.fields.endDate}
                        value={field.value}
                        onChange={(value) => field.onChange(value)}
                        isRequired
                        disabled={activityMutation.isPending}
                        error={errors.end_date?.message as string | undefined}
                        disablePortal
                      />
                    )}
                  />
                </SimpleGrid>
              </Dialog.Body>

              <Dialog.Footer>
                <Button
                  title={languageGB.defaltStrings.cancel}
                  variant="secondary"
                  type="button"
                  onClick={handleClose}
                  disabled={activityMutation.isPending}
                />
                <Button
                  title={
                    isEditing ? languageGB.defaltStrings.update : languageGB.defaltStrings.create
                  }
                  type="submit"
                  loading={activityMutation.isPending}
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
