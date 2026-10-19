// src/pages/Operacional/Planejamentos/PlanningCultivationDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo Criar/Editar Cultura/Variedade (PlanningCultivation, nível 1 da
// árvore de Planejamento) — TASK-FE-PLAN-03 (execução `97-Esteiras/007`,
// SUR-10/SUR-11). Acionado por `PlanningCultivationSection.tsx`.
//
// Composição: PADRÃO 14 (`get_pwa_complex_screen_compositions_pattern`,
// "Modal Form com Dialog Chakra V3") — `Dialog.Root > Portal > Backdrop +
// Positioner > Content`, `<Form>` (já É o `<form>`) envolvendo `Dialog.Body`
// + `Dialog.Footer`. Fill via `useEffect` + `reset` (Pattern 14 regra 6 —
// sem `useCustomFormQueryById`; o dado de edição já chega pronto via prop
// `cultivation`, populado pela árvore já hidratada de `PlanningTree.tsx`,
// mesma técnica de `RequestQuotationFormDialog.tsx`).
//
// DECISÃO DE EXECUÇÃO (divergência resolvida sem Gap): o Roteiro sugere
// `useRequest` para a mutação — mantido aqui (mirror `CreateOrUpdatePlanning.
// tsx`, mesma feature, tarefa imediatamente anterior), mas a invalidação
// REAL da árvore é feita manualmente em `actionSuccess` via
// `queryClient.invalidateQueries({queryKey: planningDetailQueryKey(...)})`
// (`useRequest.queryKey` é `string` — incompatível com a chave composta
// `['planning-detail', uuid]` — por isso recebe um placeholder que não
// colide com nenhuma query real, mirror comentário de `index.tsx`: "não
// existe variante 'delete'/chave composta em `useRequest.tsx`"). NUNCA
// invalidar `queryKey.plannings.planning` (chave do form raiz) a partir
// daqui — forçaria `useCustomFormQueryById` a resetar o form raiz com
// `resetForce=true`, apagando edições não salvas do usuário (armadilha 1 de
// `TASK-FE-PLAN-02`, mesma classe de risco, direção inversa).
//
// Cascata Cultura→Variedade (LK-04): reaproveita o endpoint de árvore JÁ
// migrado (`GET /cultivations/tree`, C-35, `TASK-PLAN-02` Passo 0.3) via
// `useCultivationTree` (mesmo hook/cache do módulo Cultura/Variedade,
// `useCultivation.tsx`) — NENHUM endpoint novo criado (armadilha 3 do
// Roteiro: `variety_uuid` usa a MESMA fonte de `cultivation_uuid`,
// parent/children). Select comum + `useQuery` (não `SelectAsyncPaginate` —
// a árvore inteira já vem de uma vez, mirror `RequestQuotationFormDialog`
// §"Cascata provider_uuid → branch_uuid").
//
// `forecast` (CV-01) NUNCA é recalculado no cliente — só existe em edição
// (dado já hidratado pela árvore) e é exibido `InputReadOnly`; em criação
// não há preview (o dialog fecha no sucesso, mirror reload() do legado —
// o valor aparece no cabeçalho do `Accordion.Item` após o refetch).
//
// 422 (G-VALIDATION — cascata de datas contra o cultivo anterior) mapeado
// por campo via `setError` — mirror `tryPersistPlanning`/
// `RequestQuotationFormDialog`.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Portal, SimpleGrid } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';

import { useCultivationTree } from '@/pages/BaseRegistrations/Cultivation/useCultivation';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import {
  createPlanningCultivation,
  updatePlanningCultivation,
} from '@/services/v2/Operacional/Planejamentos/planning-cultivation-service';

import type { Option } from '@/@types/option';
import type { PlanningCultivationTreeItem } from '@/@types/v2/Operacional/planning';
import type {
  PlanningCultivationCreatePayload,
  PlanningCultivationForm,
  PlanningCultivationUpdatePayload,
} from '@/@types/v2/Operacional/planning-cultivation';

import { planningDetailQueryKey } from './planning-tree-query-key';

export interface PlanningCultivationDialogProps {
  /** UUID do Planning pai — SEMPRE via prop (Regra 2 do Modelo C). */
  planningUuid: string;
  isOpen: boolean;
  /** `null` = modo CRIAR. Objeto presente = modo EDITAR (dado já hidratado
   *  pela árvore, sem query própria — Pattern 14 regra 6). */
  cultivation: PlanningCultivationTreeItem | null;
  onClose: () => void;
  /**
   * GAP-PLAN-FE-03 (item 7) — chamado SÓ em modo CRIAR, com o `uuid` do
   * cultivo recém-criado, para que `PlanningCultivationSection.tsx`
   * auto-expanda o `Accordion.Item` correspondente e revele a seção de
   * Operações auto-semeada (SE-01) sem clique adicional, mirror do
   * `reload()` do legado (`Cultivations/index.js`). Nunca chamado em modo
   * EDITAR — não há necessidade de auto-expandir um item que o usuário já
   * tinha aberto para editar.
   */
  onCreated?: (uuid: string) => void;
}

function formatDisplayDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('pt-BR');
}

function buildDefaultValues(source: PlanningCultivationTreeItem | null): PlanningCultivationForm {
  return {
    cultivation_uuid: source?.cultivation
      ? { label: source.cultivation.name, value: source.cultivation.uuid }
      : null,
    variety_uuid: source?.variety
      ? { label: source.variety.name, value: source.variety.uuid }
      : null,
    start_date: source?.start_date ?? null,
    end_date: source?.end_date ?? null,
    start_planting_date: source?.start_planting_date ?? null,
    cycle: source?.cycle ?? null,
  };
}

export function PlanningCultivationDialog({
  planningUuid,
  isOpen,
  cultivation,
  onClose,
  onCreated,
}: PlanningCultivationDialogProps) {
  const { languageGB } = useLanguage();
  const queryClient = useQueryClient();
  const text = languageGB.plannings.planning.tree.cultivation;

  const isEditing = !!cultivation;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<PlanningCultivationForm>({
    mode: 'onChange',
    defaultValues: buildDefaultValues(null),
  });

  // Fill via `useEffect` + `reset` — Pattern 14 regra 6.
  useEffect(() => {
    if (!isOpen) return;
    reset(buildDefaultValues(cultivation));
  }, [isOpen, cultivation, reset]);

  // ---- Cascata Cultura→Variedade (LK-04) — endpoint de árvore JÁ migrado,
  // reaproveitado (armadilha 3 do Roteiro). ----
  const cultivationTreeQuery = useCultivationTree();
  const cultivationRoots = (cultivationTreeQuery.data ?? []).filter(
    (node) => node.type === 'cultura'
  );
  const cultivationOptions: Option<string>[] = cultivationRoots.map((root) => ({
    label: root.name,
    value: root.uuid,
  }));

  const selectedCultivationOption = watch('cultivation_uuid');
  const selectedRoot = cultivationRoots.find(
    (root) => root.uuid === selectedCultivationOption?.value
  );
  const varietyOptions: Option<string>[] = (selectedRoot?.children ?? []).map((child) => ({
    label: child.name,
    value: child.uuid,
  }));

  // ---- Mutação (`useRequest`, mirror `CreateOrUpdatePlanning.tsx`) — ver
  // "Decisão de execução" no cabeçalho do arquivo. ----
  const cultivationMutation = useRequest<PlanningCultivationTreeItem>({
    asyncFunction: tryPersistCultivation,
    entityName: text.singularLabel,
    queryKey: 'planning-cultivation-mutation',
    typesRequest: isEditing ? 'update' : 'create',
    personalizedMessage: isEditing ? text.dialog.updatedToast : text.dialog.createdToast,
    actionSuccess: (data) => {
      // Reproduz o `reload()` do legado (Decisão de arquitetura FID-G3F) —
      // invalida a MESMA chave da árvore, NUNCA a do form raiz.
      queryClient.invalidateQueries({ queryKey: planningDetailQueryKey(planningUuid) });
      // GAP-PLAN-FE-03 (item 7) — auto-expande o cultivo recém-criado, SÓ
      // em modo CRIAR (mirror `reload()` do legado, revela a seção de
      // Operações auto-semeada sem clique adicional).
      if (!isEditing) {
        onCreated?.(data.uuid);
      }
      onClose();
    },
  });

  async function tryPersistCultivation(data: PlanningCultivationForm) {
    const basePayload = {
      cultivation_uuid: data.cultivation_uuid!.value,
      variety_uuid: data.variety_uuid!.value,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      start_planting_date: data.start_planting_date as string,
      cycle: Number(data.cycle),
    };

    try {
      if (isEditing && cultivation) {
        const payload: PlanningCultivationUpdatePayload = basePayload;
        return await updatePlanningCultivation(cultivation.uuid, payload);
      }

      const payload: PlanningCultivationCreatePayload = {
        planning_uuid: planningUuid,
        ...basePayload,
      };
      return await createPlanningCultivation(payload);
    } catch (error) {
      // 422 (G-VALIDATION — cascata de datas) mapeado por campo — mirror
      // `tryPersistPlanning`/`RequestQuotationFormDialog`.
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof PlanningCultivationForm, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
      throw error;
    }
  }

  function onSubmit(data: PlanningCultivationForm) {
    cultivationMutation.mutate(data);
  }

  function handleClose() {
    if (cultivationMutation.isPending) return;
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
                  {/* Cultura (LK-04, cascata) */}
                  <Controller
                    name="cultivation_uuid"
                    control={control}
                    rules={{ required: text.dialog.errors.required }}
                    render={({ field }) => (
                      <Select
                        name={field.name}
                        label={text.dialog.fields.cultivation}
                        placeholder={text.dialog.placeholders.cultivation}
                        error={errors.cultivation_uuid?.message as string | undefined}
                        options={cultivationOptions}
                        value={field.value ?? null}
                        onChange={(option) => {
                          field.onChange(option ?? null);
                          // Cascata: trocar de cultura invalida a variedade
                          // já escolhida — só em interação real do usuário.
                          if ((option?.value ?? null) !== (field.value?.value ?? null)) {
                            setValue('variety_uuid', null, { shouldDirty: true });
                          }
                        }}
                        isRequired
                        isDisabled={cultivationMutation.isPending}
                        loading={cultivationTreeQuery.isLoading}
                        disablePortal
                      />
                    )}
                  />

                  {/* Variedade — dependente de Cultura (LK-04, armadilha 3) */}
                  <Controller
                    name="variety_uuid"
                    control={control}
                    rules={{ required: text.dialog.errors.required }}
                    render={({ field }) => (
                      <Select
                        name={field.name}
                        label={text.dialog.fields.variety}
                        placeholder={
                          selectedCultivationOption
                            ? text.dialog.placeholders.variety
                            : text.dialog.placeholders.varietyNoCultivation
                        }
                        error={errors.variety_uuid?.message as string | undefined}
                        options={varietyOptions}
                        value={field.value ?? null}
                        onChange={(option) => field.onChange(option ?? null)}
                        isRequired
                        isDisabled={!selectedCultivationOption || cultivationMutation.isPending}
                        disablePortal
                      />
                    )}
                  />

                  {/* start_planting_date — usada pelo servidor p/ calcular
                      forecast (CV-01, armadilha 1). */}
                  <Controller
                    name="start_planting_date"
                    control={control}
                    rules={{ required: text.dialog.errors.required }}
                    render={({ field }) => (
                      <DateInput
                        label={text.dialog.fields.startPlantingDate}
                        value={field.value}
                        onChange={(value) => field.onChange(value)}
                        isRequired
                        disabled={cultivationMutation.isPending}
                        error={errors.start_planting_date?.message as string | undefined}
                        disablePortal
                      />
                    )}
                  />

                  {/* cycle (dias) — CV-01 */}
                  <Controller
                    name="cycle"
                    control={control}
                    rules={{
                      required: text.dialog.errors.required,
                      min: { value: 1, message: text.dialog.errors.required },
                    }}
                    render={({ field }) => (
                      <NumberInput
                        name={field.name}
                        label={text.dialog.fields.cycle}
                        min={1}
                        value={field.value ?? null}
                        onValueChange={(value) => field.onChange(value)}
                        error={errors.cycle?.message as string | undefined}
                        disabled={cultivationMutation.isPending}
                      />
                    )}
                  />

                  {/* start_date — validado em CASCATA contra o forecast do
                      cultivo anterior no SERVIDOR (G-VALIDATION); 422
                      mapeado aqui — NUNCA recalculado no cliente (armadilha
                      2 do Roteiro). */}
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
                        disabled={cultivationMutation.isPending}
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
                        disabled={cultivationMutation.isPending}
                        error={errors.end_date?.message as string | undefined}
                        disablePortal
                      />
                    )}
                  />

                  {/* forecast — SEMPRE calculado pelo servidor (CV-01);
                      readonly, só existe em edição (armadilha 1). Em
                      criação não há preview — o diálogo fecha no sucesso
                      (mirror reload() do legado) e o valor aparece no
                      cabeçalho do `Accordion.Item` após o refetch. */}
                  {isEditing && cultivation && (
                    <InputReadOnly
                      name="forecast"
                      label={text.dialog.fields.forecast}
                      value={formatDisplayDate(cultivation.forecast)}
                    />
                  )}
                </SimpleGrid>
              </Dialog.Body>

              <Dialog.Footer>
                <Button
                  title={languageGB.defaltStrings.cancel}
                  variant="outline"
                  type="button"
                  onClick={handleClose}
                  disabled={cultivationMutation.isPending}
                />
                <Button
                  title={
                    isEditing ? languageGB.defaltStrings.update : languageGB.defaltStrings.create
                  }
                  type="submit"
                  loading={cultivationMutation.isPending}
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
