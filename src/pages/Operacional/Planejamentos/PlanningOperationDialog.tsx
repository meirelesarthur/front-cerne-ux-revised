// src/pages/Operacional/Planejamentos/PlanningOperationDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo ÚNICO "Definir Período" / "Criar Operação" (PlanningOperation,
// nível 2 da árvore de Planejamento) — TASK-FE-PLAN-04 (execução
// `97-Esteiras/007`, SUR-15). Acionado por `PlanningOperationSection.tsx`.
//
// ARMADILHA 1 confirmada do Roteiro: NÃO existem dois diálogos separados —
// é o MESMO componente, variando só se `operation` (prop) está presente:
//   - `operation !== null` → "Definir Período" de uma operação já existente
//     (auto-semeada pelo servidor, SE-01, ou manual criada antes). O campo
//     `operation_uuid` fica DESABILITADO (`FLD-20`) e só as datas são
//     editáveis/enviadas (`PlanningOperationUpdatePayload`).
//   - `operation === null` (dialog aberto via `dialogState === 'create'`) →
//     "Criar Operação" manual. `operation_uuid` fica HABILITADO, catálogo
//     `GET /operations/options?category=2` (armadilha 3 — NÃO é o mesmo
//     catálogo do auto-seed, que é 100% server-side, sem UI própria).
//
// Composição: PADRÃO 14 (`get_pwa_complex_screen_compositions_pattern`,
// "Modal Form com Dialog Chakra V3") — mirror EXATO
// `PlanningCultivationDialog.tsx` (mesma feature, Tarefa imediatamente
// anterior): `useRequest` para a mutação (divergência já aceita do Roteiro
// sugerido `useMutation` puro do Pattern 14) + fill via `useEffect`/`reset`
// (regra 6 — sem `useCustomFormQueryById`, o dado de edição já chega pronto
// via prop `operation`, populado pela árvore já hidratada de
// `PlanningTree.tsx`).
//
// Invalidação REAL da árvore é manual em `actionSuccess` via
// `queryClient.invalidateQueries({queryKey: planningDetailQueryKey(...)})` —
// NUNCA a chave do form raiz (`queryKey.plannings.planning`), mesma armadilha
// 1 de `TASK-FE-PLAN-02`/`03`.
//
// G-VALIDATION (datas dentro do intervalo do cultivo pai, mensagem "As datas
// devem estar dentro do intervalo do plantio.") é validado NO SERVIDOR
// (`PlanningOperationRequest::validateDatesWithinCultivationRange`) — 422
// mapeado por campo (`start_date`) via `setError`, NUNCA recalculado no
// cliente (mesma filosofia de `PlanningCultivationDialog` para o G-VALIDATION
// de cascata de datas).
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
  createPlanningOperation,
  listPlanningOperationCatalog,
  updatePlanningOperation,
} from '@/services/v2/Operacional/Planejamentos/planning-operation-service';

import type { PlanningOperationTreeItem } from '@/@types/v2/Operacional/planning';
import type {
  PlanningOperationCatalogOption,
  PlanningOperationCreatePayload,
  PlanningOperationForm,
  PlanningOperationUpdatePayload,
} from '@/@types/v2/Operacional/planning-operation';

import { planningDetailQueryKey } from './planning-tree-query-key';

export interface PlanningOperationDialogProps {
  /** UUID do Planning pai — SEMPRE via prop (Regra 2 do Modelo C), usado só
   *  para invalidar a query dedicada da árvore. */
  planningUuid: string;
  /** UUID do cultivo pai — necessário só na criação MANUAL (payload
   *  `planning_cultivation_uuid`, imutável após a criação). */
  cultivationUuid: string;
  isOpen: boolean;
  /** `null` = modo "Criar Operação" manual. Objeto presente = modo "Definir
   *  Período" (dado já hidratado pela árvore, sem query própria — Pattern 14
   *  regra 6). */
  operation: PlanningOperationTreeItem | null;
  onClose: () => void;
}

function buildDefaultValues(source: PlanningOperationTreeItem | null): PlanningOperationForm {
  return {
    operation_uuid: source?.operation
      ? { label: source.operation.name, value: source.operation.uuid }
      : null,
    start_date: source?.start_date ?? null,
    end_date: source?.end_date ?? null,
  };
}

export function PlanningOperationDialog({
  planningUuid,
  cultivationUuid,
  isOpen,
  operation,
  onClose,
}: PlanningOperationDialogProps) {
  const { languageGB } = useLanguage();
  const queryClient = useQueryClient();
  const text = languageGB.plannings.planning.tree.operation;

  // "Definir Período" (operação já existe) vs. "Criar Operação" manual —
  // ARMADILHA 1: é o MESMO diálogo, nunca dois componentes separados.
  const isEditing = !!operation;

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PlanningOperationForm>({
    mode: 'onChange',
    defaultValues: buildDefaultValues(null),
  });

  // Fill via `useEffect` + `reset` — Pattern 14 regra 6.
  useEffect(() => {
    if (!isOpen) return;
    reset(buildDefaultValues(operation));
  }, [isOpen, operation, reset]);

  // ---- Mutação (`useRequest`, mirror `PlanningCultivationDialog.tsx`). ----
  const operationMutation = useRequest<PlanningOperationTreeItem>({
    asyncFunction: tryPersistOperation,
    entityName: text.singularLabel,
    queryKey: 'planning-operation-mutation',
    typesRequest: isEditing ? 'update' : 'create',
    personalizedMessage: isEditing ? text.dialog.updatedToast : text.dialog.createdToast,
    actionSuccess: () => {
      // Reproduz o `reload()` do legado (Decisão de arquitetura FID-G3F) —
      // invalida a MESMA chave da árvore, NUNCA a do form raiz.
      queryClient.invalidateQueries({ queryKey: planningDetailQueryKey(planningUuid) });
      onClose();
    },
  });

  async function tryPersistOperation(data: PlanningOperationForm) {
    const basePayload = {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
    };

    try {
      if (isEditing && operation) {
        // "Definir Período" — só datas (armadilha 1: `operation_uuid`
        // imutável, nunca reenviado).
        const payload: PlanningOperationUpdatePayload = basePayload;
        return await updatePlanningOperation(operation.uuid, payload);
      }

      const payload: PlanningOperationCreatePayload = {
        planning_cultivation_uuid: cultivationUuid,
        operation_uuid: data.operation_uuid!.value,
        ...basePayload,
      };
      return await createPlanningOperation(payload);
    } catch (error) {
      // 422 (G-VALIDATION — intervalo de datas do cultivo pai) mapeado por
      // campo — mirror `tryPersistCultivation`.
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof PlanningOperationForm, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
      throw error;
    }
  }

  function onSubmit(data: PlanningOperationForm) {
    operationMutation.mutate(data);
  }

  function handleClose() {
    if (operationMutation.isPending) return;
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
                {isEditing ? text.dialog.title.definePeriod : text.dialog.title.create}
              </Dialog.Title>
            </Dialog.Header>

            <Form noPadding onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  {/* operation_uuid (FLD-20) — DESABILITADO ao "Definir
                      Período" de operação pré-existente (armadilha 1);
                      catálogo `use=2` só na criação manual (armadilha 3). */}
                  <Controller
                    name="operation_uuid"
                    control={control}
                    rules={{ required: text.dialog.errors.required }}
                    render={({ field }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={text.dialog.fields.operation}
                        placeholder={text.dialog.placeholders.operation}
                        error={errors.operation_uuid?.message as string | undefined}
                        service={listPlanningOperationCatalog}
                        mapOptions={(item: PlanningOperationCatalogOption) => ({
                          label: item.name,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                        })}
                        value={field.value ?? null}
                        onChange={(option: any) => field.onChange(option ?? null)}
                        isRequired
                        isDisabled={isEditing || operationMutation.isPending}
                        disablePortal
                      />
                    )}
                  />

                  {/* start_date/end_date (FLD-21) — validadas NO SERVIDOR
                      contra o intervalo do cultivo pai (G-VALIDATION); 422
                      mapeado aqui, nunca recalculado no cliente. */}
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
                        disabled={operationMutation.isPending}
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
                        disabled={operationMutation.isPending}
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
                  disabled={operationMutation.isPending}
                />
                <Button
                  title={
                    isEditing
                      ? text.dialog.actions.definePeriodSubmit
                      : languageGB.defaltStrings.create
                  }
                  type="submit"
                  loading={operationMutation.isPending}
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
