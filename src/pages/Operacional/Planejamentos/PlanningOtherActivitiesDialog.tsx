// src/pages/Operacional/Planejamentos/PlanningOtherActivitiesDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo "Adicionar Atividade" do grupo fixo "Outros" do cultivo
// (PlanningOtherActivities) — TASK-FE-PLAN-07 (execução `97-Esteiras/007`,
// SUR-31). Acionado por `PlanningOtherActivitiesSection.tsx`.
//
// ARMADILHA 2 confirmada do Roteiro: SEM edição exposta — a UI legada só
// tinha "Adicionar" e "Excluir" (`AM-17`/`C-26`, preservado exatamente). Este
// diálogo é SÓ de criação, diferente de `PlanningActivityDialog`/
// `PlanningOperationDialog` (que cobrem criar+editar no mesmo componente).
//
// Composição: PADRÃO 14 (`get_pwa_complex_screen_compositions_pattern`,
// "Modal Form com Dialog Chakra V3") — mirror estrutural
// `PlanningActivityDialog.tsx`/`PlanningOperationDialog.tsx` (mesma
// feature): `useRequest` para a mutação de criação.
//
// `activity_uuid` (catálogo `LK-07`, `GET /activities/options?
// operation_uuid=`) — ARMADILHA 4 do Roteiro: escopado pelo catálogo
// "Outros" de Operations, resolvido por NOME ESTÁVEL (`findOtherActivities
// CatalogGroup`, `planning-other-activities-service.ts`), NUNCA pelo id
// numérico hardcoded do legado (`operation=11`, `LK-07`). Enquanto a
// resolução do catálogo "Outros" está em voo, o select fica desabilitado; se
// o registro "Outros" não existir no tenant, o catálogo degrada para TODAS
// as atividades do tenant (decisão default documentada em
// `@/@types/v2/Operacional/planning-other-activities`, sem Gap — o servidor
// já não impõe essa restrição).
//
// `quantity`/`amount`/`total` (FLD-36, mesma fórmula CV-04 das demais
// entidades de pivot: `Vl.Unit(amount) × Qtd/ha(quantity) × Área total do
// planning`) — `total` é preview CLIENTE, NÃO-AUTORITATIVO (nunca enviado no
// payload; o servidor sempre recalcula via `CalculatePivotTotalAction`,
// G-CALC-DUP). `plantedArea` chega via prop (Regra 2 do Modelo C — a área
// plantada vive no `PlanningResource` raiz, não no cultivo).
//
// Invalidação REAL da árvore é manual em `actionSuccess` via
// `queryClient.invalidateQueries({queryKey: planningDetailQueryKey(...)})` —
// NUNCA a chave do form raiz, mesma armadilha 1 de `TASK-FE-PLAN-02`..`06`.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Portal, SimpleGrid } from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

import { listPlanningActivityCatalog } from '@/services/v2/Operacional/Planejamentos/planning-activity-service';
import {
  createPlanningOtherActivities,
  findOtherActivitiesCatalogGroup,
} from '@/services/v2/Operacional/Planejamentos/planning-other-activities-service';

import type { PlanningOtherActivityTreeItem } from '@/@types/v2/Operacional/planning';
import type { PlanningActivityCatalogOption } from '@/@types/v2/Operacional/planning-activity';
import type {
  PlanningOtherActivitiesCreatePayload,
  PlanningOtherActivitiesForm,
} from '@/@types/v2/Operacional/planning-other-activities';

import { planningDetailQueryKey } from './planning-tree-query-key';

export interface PlanningOtherActivitiesDialogProps {
  /** UUID do Planning pai — SEMPRE via prop (Regra 2 do Modelo C), usado só
   *  para invalidar a query dedicada da árvore. */
  planningUuid: string;
  /** UUID do cultivo pai — payload `planning_cultivation_uuid` (armadilha 1
   *  da Tarefa: filha do CULTIVO, não da atividade). */
  cultivationUuid: string;
  /** Área plantada total do Planning (FLD-07) — só para o preview
   *  client-side NÃO-AUTORITATIVO do total (CV-04); o servidor sempre
   *  recalcula via `CalculatePivotTotalAction` (G-CALC-DUP). */
  plantedArea: number;
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_FORM: PlanningOtherActivitiesForm = {
  activity_uuid: null,
  quantity: null,
  amount: null,
};

export function PlanningOtherActivitiesDialog({
  planningUuid,
  cultivationUuid,
  plantedArea,
  isOpen,
  onClose,
}: PlanningOtherActivitiesDialogProps) {
  const { languageGB } = useLanguage();
  const queryClient = useQueryClient();
  const text = languageGB.plannings.planning.tree.otherActivity;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<PlanningOtherActivitiesForm>({
    mode: 'onChange',
    defaultValues: EMPTY_FORM,
  });

  // Fill via `useEffect` + `reset` — Pattern 14 regra 6 (formulário sempre
  // limpo, sem edição exposta — armadilha 2).
  useEffect(() => {
    if (!isOpen) return;
    reset(EMPTY_FORM);
  }, [isOpen, reset]);

  // Resolve o catálogo "Outros" (LK-07, armadilha 4) por NOME estável, só
  // enquanto o diálogo está aberto — evita round-trip desnecessário.
  const catalogGroupQuery = useQuery({
    queryKey: ['planning-other-activities-catalog-group'],
    queryFn: findOtherActivitiesCatalogGroup,
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const isCatalogGroupResolving = isOpen && catalogGroupQuery.isPending;
  const otherActivitiesOperationUuid = catalogGroupQuery.data?.uuid;

  // Preview CLIENTE, NÃO-AUTORITATIVO (CV-04) — nunca enviado no payload.
  const quantityWatch = watch('quantity');
  const amountWatch = watch('amount');
  const totalPreview = Number(
    (
      (Number(amountWatch) || 0) *
      (Number(quantityWatch) || 0) *
      (Number(plantedArea) || 0)
    ).toFixed(2)
  );

  // ---- Mutação (`useRequest`, mirror `PlanningActivityDialog.tsx`). ----
  const otherActivityMutation = useRequest<PlanningOtherActivityTreeItem>({
    asyncFunction: tryPersistOtherActivity,
    entityName: text.singularLabel,
    queryKey: 'planning-other-activities-mutation',
    typesRequest: 'create',
    personalizedMessage: text.dialog.createdToast,
    actionSuccess: () => {
      // Reproduz o `reload()` do legado (Decisão de arquitetura FID-G3F) —
      // invalida a MESMA chave da árvore, NUNCA a do form raiz.
      queryClient.invalidateQueries({ queryKey: planningDetailQueryKey(planningUuid) });
      onClose();
    },
  });

  async function tryPersistOtherActivity(data: PlanningOtherActivitiesForm) {
    const payload: PlanningOtherActivitiesCreatePayload = {
      planning_cultivation_uuid: cultivationUuid,
      activity_uuid: data.activity_uuid!.value,
      quantity: Number(data.quantity ?? 0),
      amount: Number(data.amount ?? 0),
    };

    try {
      return await createPlanningOtherActivities(payload);
    } catch (error) {
      // 422 mapeado por campo — mirror `tryPersistActivity`. Erros de posse
      // do cultivo (`planning_cultivation_uuid`) não têm campo próprio no
      // formulário — caem no toast genérico de `useRequest.onError`.
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof PlanningOtherActivitiesForm, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
      throw error;
    }
  }

  function onSubmit(data: PlanningOtherActivitiesForm) {
    otherActivityMutation.mutate(data);
  }

  function handleClose() {
    if (otherActivityMutation.isPending) return;
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
              <Dialog.Title>{text.dialog.title}</Dialog.Title>
            </Dialog.Header>

            <Form noPadding onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  {/* activity_uuid (LK-07) — catálogo escopado pelo grupo
                      "Outros" resolvido por nome estável (armadilha 4); sem
                      opção de edição no diálogo (armadilha 2). */}
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
                          operation_uuid: otherActivitiesOperationUuid,
                        })}
                        cacheUniqs={[otherActivitiesOperationUuid]}
                        value={field.value ?? null}
                        onChange={(option: any) => field.onChange(option ?? null)}
                        isRequired
                        isDisabled={isCatalogGroupResolving || otherActivityMutation.isPending}
                        disablePortal
                      />
                    )}
                  />

                  {/* quantity (Qtd/ha, FLD-36) — recalcula o preview de total
                      (CV-04), mirror `NumberInput` de `production_quantity`
                      (`PlanningProductionDialog.tsx`). */}
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
                        disabled={otherActivityMutation.isPending}
                      />
                    )}
                  />

                  {/* amount (Vl. Unitário, FLD-36) — recalcula o preview de
                      total (CV-04). */}
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
                        disabled={otherActivityMutation.isPending}
                      />
                    )}
                  />

                  {/* total (FLD-36) — preview CLIENTE, NÃO-AUTORITATIVO
                      (CV-04); nunca enviado no payload, o servidor sempre
                      recalcula (G-CALC-DUP). */}
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
                  disabled={otherActivityMutation.isPending}
                />
                <Button
                  title={languageGB.defaltStrings.create}
                  type="submit"
                  loading={otherActivityMutation.isPending}
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
