// src/pages/Operacional/Planejamentos/PlanningProductionDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo "Definir Produção" (linha fixa "1. Produção" da árvore de
// Planejamento) — TASK-FE-PLAN-04 (execução `97-Esteiras/007`, SUR-17,
// FLD-37). Acionado por `PlanningOperationSection.tsx`.
//
// ARMADILHA 2 confirmada do Roteiro: "Definir Produção" NÃO é uma entidade
// própria — reaproveita o MESMO endpoint `update` de `PlanningCultivation`
// (`PUT /planning-cultivations/{uuid}`, MESMO endpoint de `TASK-FE-PLAN-03`,
// mirror exato `TASK-PLAN-02`), com um payload parcial DEDICADO enviando
// SÓ `production_quantity` (`sometimes` no servidor — aceita parcial,
// `updatePlanningCultivationProduction`, `planning-operation-service.ts`).
// NUNCA reaproveitar `updatePlanningCultivation`/`PlanningCultivationUpdate
// Payload` de `TASK-FE-PLAN-03` — enviaria os 6 campos do form de
// Cultura/Variedade fora do escopo desta ação.
//
// Único campo editável do modal (`production_quantity`, FLD-37); Cultura/
// Variedade exibida como contexto READONLY (dado já hidratado via prop
// `cultivation`, sem query própria — Pattern 14 regra 6, mirror
// `PlanningCultivationDialog.tsx §forecast`).
//
// Invalidação REAL da árvore é manual em `actionSuccess` — MESMA chave
// (`planningDetailQueryKey`), NUNCA a do form raiz (armadilha 1 de
// `TASK-FE-PLAN-02`/`03`, mesma direção).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Portal, SimpleGrid } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { updatePlanningCultivationProduction } from '@/services/v2/Operacional/Planejamentos/planning-operation-service';

import type { PlanningCultivationTreeItem } from '@/@types/v2/Operacional/planning';
import type {
  PlanningProductionForm,
  PlanningProductionUpdatePayload,
} from '@/@types/v2/Operacional/planning-operation';

import { planningDetailQueryKey } from './planning-tree-query-key';

export interface PlanningProductionDialogProps {
  /** UUID do Planning pai — SEMPRE via prop (Regra 2 do Modelo C), usado só
   *  para invalidar a query dedicada da árvore. */
  planningUuid: string;
  isOpen: boolean;
  /** Cultivo já hidratado pela árvore — "Definir Produção" edita o PRÓPRIO
   *  cultivo (armadilha 2: não é uma entidade separada). */
  cultivation: PlanningCultivationTreeItem | null;
  onClose: () => void;
}

function buildDefaultValues(source: PlanningCultivationTreeItem | null): PlanningProductionForm {
  return {
    production_quantity: source?.production_quantity ?? null,
  };
}

export function PlanningProductionDialog({
  planningUuid,
  isOpen,
  cultivation,
  onClose,
}: PlanningProductionDialogProps) {
  const { languageGB } = useLanguage();
  const queryClient = useQueryClient();
  const text = languageGB.plannings.planning.tree.production;

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PlanningProductionForm>({
    mode: 'onChange',
    defaultValues: buildDefaultValues(null),
  });

  // Fill via `useEffect` + `reset` — Pattern 14 regra 6.
  useEffect(() => {
    if (!isOpen) return;
    reset(buildDefaultValues(cultivation));
  }, [isOpen, cultivation, reset]);

  // ---- Mutação (`useRequest`) — payload parcial DEDICADO (armadilha 2). ----
  const productionMutation = useRequest<PlanningCultivationTreeItem>({
    asyncFunction: tryPersistProduction,
    entityName: text.singularLabel,
    queryKey: 'planning-production-mutation',
    typesRequest: 'update',
    personalizedMessage: text.dialog.updatedToast,
    actionSuccess: () => {
      // Reproduz o `reload()` do legado (Decisão de arquitetura FID-G3F) —
      // invalida a MESMA chave da árvore, NUNCA a do form raiz.
      queryClient.invalidateQueries({ queryKey: planningDetailQueryKey(planningUuid) });
      onClose();
    },
  });

  async function tryPersistProduction(data: PlanningProductionForm) {
    if (!cultivation) {
      throw new Error('PlanningProductionDialog: cultivation ausente.');
    }

    const payload: PlanningProductionUpdatePayload = {
      production_quantity: Number(data.production_quantity ?? 0),
    };

    try {
      return await updatePlanningCultivationProduction(cultivation.uuid, payload);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof PlanningProductionForm, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
      throw error;
    }
  }

  function onSubmit(data: PlanningProductionForm) {
    productionMutation.mutate(data);
  }

  function handleClose() {
    if (productionMutation.isPending) return;
    onClose();
  }

  const cultivationLabel = cultivation
    ? `${cultivation.cultivation?.name ?? '—'} / ${cultivation.variety?.name ?? '—'}`
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
              <Dialog.Title>{text.dialog.title}</Dialog.Title>
            </Dialog.Header>

            <Form noPadding onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  {/* Cultura/Variedade — contexto READONLY, demais campos do
                      modal legado ("produto exibido") — sem edição aqui. */}
                  <InputReadOnly
                    name="cultivation"
                    label={text.dialog.fields.cultivation}
                    value={cultivationLabel}
                  />

                  {/* production_quantity (FLD-37) — único campo editável. */}
                  <Controller
                    name="production_quantity"
                    control={control}
                    rules={{ required: text.dialog.errors.required }}
                    render={({ field }) => (
                      <NumberInput
                        name={field.name}
                        label={text.dialog.fields.productionQuantity}
                        allowDot
                        decimalPlaces={2}
                        min={0}
                        value={field.value ?? null}
                        onValueChange={(value) => field.onChange(value)}
                        error={errors.production_quantity?.message as string | undefined}
                        disabled={productionMutation.isPending}
                      />
                    )}
                  />
                </SimpleGrid>
              </Dialog.Body>

              <Dialog.Footer>
                <Button
                  title={languageGB.defaltStrings.cancel}
                  variant="outline"
                  type="button"
                  onClick={handleClose}
                  disabled={productionMutation.isPending}
                />
                <Button
                  title={languageGB.defaltStrings.update}
                  type="submit"
                  loading={productionMutation.isPending}
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
