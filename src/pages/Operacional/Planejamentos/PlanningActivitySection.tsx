// src/pages/Operacional/Planejamentos/PlanningActivitySection.tsx
// -----------------------------------------------------------------------------
// Nível 3 da árvore de Planejamento — Atividades da operação
// (PlanningActivity) — TASK-FE-PLAN-05 (execução `97-Esteiras/007`,
// SUR-18..20). Renderizado DENTRO de cada `Accordion.Item` de operação
// (`PlanningOperationSection.tsx`, slot reservado por `TASK-FE-PLAN-04`).
// É a RAIZ de onde `TASK-FE-PLAN-06` monta os 3 sub-níveis de pivot
// (Insumo/Equipamento/Serviço) — por isso cada atividade também é um
// `Accordion.Item` (mirror estrutural de `PlanningOperationSection.tsx`),
// não uma linha simples.
//
// Recebe `operation` já hidratada via prop (Regra 2 do Modelo C —
// sub-componente nunca busca dado sozinho); NENHUMA query própria — a única
// query da árvore continua sendo a de `PlanningTree.tsx` (Decisão de
// arquitetura FID-G3F). Invalidação de TODAS as mutações desta seção usa a
// MESMA chave (`planningDetailQueryKey`) — NUNCA a do form raiz.
//
// Exclusão via `ModalAction` (Pattern 6) + `useRequest` — `typesRequest:
// 'update'` (não existe variante 'delete' em `TypesRequest`,
// `useRequest.tsx`), mirror EXATO `PlanningOperationSection.tsx`. Mensagem
// de erro do servidor exibida COMO ESTÁ na exclusão — sem FK tratada de
// forma especial nesta entidade (diferente do Planning raiz, `AM-13`,
// "Leitura do dev" da Tarefa).
//
// `Accordion.Root` CONTROLADO + auto-expansão da atividade recém-criada via
// `onCreated` de `PlanningActivityDialog` — reaproveita o padrão consolidado
// por `GAP-PLAN-FE-03` (item 7) em `PlanningCultivationSection.tsx`,
// aplicável aqui porque este nível também tem conteúdo filho a revelar
// (pivots de `TASK-FE-PLAN-06`).
//
// Estado local (`useState`, não é `paginatedQuery` — árvore não paginada,
// exceção já reconhecida pelo padrão): `dialogState` guarda "diálogo aberto
// para qual atividade" (`'create' | { uuid: string } | null`) — resolvido
// por `find()` no array já hidratado (sem query dedicada, Pattern 14 regra
// 6), mirror `PlanningOperationSection`/`PlanningCultivationSection`.
// -----------------------------------------------------------------------------

import { useState, type ElementType } from 'react';

import {
  Accordion,
  Box,
  EmptyState,
  Flex,
  HStack,
  Icon,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { FiCheckSquare, FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ModalAction } from '@/components/ModalAction';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { deletePlanningActivity } from '@/services/v2/Operacional/Planejamentos/planning-activity-service';

import type {
  PlanningActivityTreeItem,
  PlanningOperationTreeItem,
} from '@/@types/v2/Operacional/planning';

import { planningDetailQueryKey } from './planning-tree-query-key';
import { PlanningActivityDialog } from './PlanningActivityDialog';
import { PlanningActivityEquipmentSection } from './PlanningActivityEquipmentSection';
import { PlanningActivityFunctionSection } from './PlanningActivityFunctionSection';
import { PlanningActivityProductSection } from './PlanningActivityProductSection';

export interface PlanningActivitySectionProps {
  /** UUID do Planning pai — SEMPRE via prop (Regra 2 do Modelo C). */
  planningUuid: string;
  /** Operação já hidratada pela query de detalhe de `PlanningTree.tsx` —
   *  esta seção NUNCA busca dado sozinha. */
  operation: PlanningOperationTreeItem;
  /** Área plantada TOTAL do Planning (FLD-07) — roteada por prop desde
   *  `PlanningTree.tsx` (Regra 2 do Modelo C) até os 3 diálogos de pivot
   *  (`TASK-FE-PLAN-06`), só para o preview client-side NÃO-AUTORITATIVO do
   *  total (CV-04). */
  plantedArea: number;
}

/** "diálogo de atividade aberto para qual atividade" (Roteiro, seção "Estado"). */
type ActivityDialogState = 'create' | { uuid: string } | null;

function formatDisplayDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('pt-BR');
}

export function PlanningActivitySection({
  planningUuid,
  operation,
  plantedArea,
}: PlanningActivitySectionProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.plannings.planning.tree;

  const canCreate = can('plannings_create');
  const canEdit = can('plannings_edit');
  const canDelete = can('plannings_delete');

  const activities = operation.activities ?? [];

  const [dialogState, setDialogState] = useState<ActivityDialogState>(null);
  const [activityToDelete, setActivityToDelete] = useState<PlanningActivityTreeItem | null>(null);
  const { open: isDeleteOpen, onOpen: onOpenDelete, onClose: onCloseDelete } = useDisclosure();

  // Auto-expansão da atividade recém-criada (padrão consolidado por
  // `GAP-PLAN-FE-03` item 7, reaproveitado aqui — ver cabeçalho do arquivo).
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // `typesRequest: 'update'` — não existe variante 'delete' em
  // `TypesRequest` (`useRequest.tsx`), mirror EXATO
  // `PlanningOperationSection.tsx`. Invalidação REAL da árvore é manual em
  // `actionSuccess`. Mensagem de erro do servidor exibida como está (sem FK
  // tratada de forma especial nesta entidade, "Leitura do dev" da Tarefa).
  const deleteMutation = useRequest({
    asyncFunction: async (uuid: string) => deletePlanningActivity(uuid),
    queryKey: 'planning-activity-mutation',
    typesRequest: 'update',
    entityName: text.activity.singularLabel,
    personalizedMessage: text.activity.deletedToast,
    actionSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planningDetailQueryKey(planningUuid) });
      onCloseDelete();
      setActivityToDelete(null);
    },
  });

  function handleDeleteClick(activity: PlanningActivityTreeItem) {
    setActivityToDelete(activity);
    onOpenDelete();
  }

  const editingActivity =
    dialogState !== null && typeof dialogState === 'object'
      ? (activities.find((item) => item.uuid === dialogState.uuid) ?? null)
      : null;

  const hasActionsMenu = canEdit || canDelete;

  return (
    <Box>
      <Flex justify="flex-end" mb={activities.length > 0 ? 3 : 0}>
        {canCreate && (
          <Button
            title={text.activity.actions.new}
            icon={FiPlus as ElementType}
            variant="outline"
            size="sm"
            onClick={() => setDialogState('create')}
          />
        )}
      </Flex>

      {activities.length === 0 ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiCheckSquare as ElementType} boxSize={8} color="fg.muted" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1}>
              <EmptyState.Title>{text.activity.empty.title}</EmptyState.Title>
              <EmptyState.Description>{text.activity.empty.description}</EmptyState.Description>
            </VStack>
            {canCreate && (
              <Button
                title={text.activity.actions.new}
                size="sm"
                onClick={() => setDialogState('create')}
              />
            )}
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <Accordion.Root
          multiple
          collapsible
          value={expandedItems}
          onValueChange={(details: { value: string[] }) => setExpandedItems(details.value)}
        >
          {activities.map((activity) => (
            <Accordion.Item
              key={activity.uuid}
              value={activity.uuid}
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="md"
              overflow="hidden"
              mb={2}
            >
              <Accordion.ItemTrigger
                px={4}
                py={3}
                bg="bg.muted"
                cursor="pointer"
                _hover={{ opacity: 0.85 }}
              >
                <Flex flex="1" align="center" gap={2} minW={0}>
                  <VStack align="flex-start" gap={0} minW={0}>
                    <Text fontWeight="600" fontSize="sm" color="fg.default" truncate>
                      {activity.activity?.name ?? '—'}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {formatDisplayDate(activity.start_date)} –{' '}
                      {formatDisplayDate(activity.end_date)}
                    </Text>
                  </VStack>
                </Flex>

                {hasActionsMenu && (
                  <HStack gap={1} onClick={(event) => event.stopPropagation()}>
                    <Actions size="sm" languageGB={languageGB}>
                      {canEdit && (
                        <Actions.Item
                          icon={<Icon as={FiEdit} />}
                          onClick={() => setDialogState({ uuid: activity.uuid })}
                        >
                          {text.activity.actions.edit}
                        </Actions.Item>
                      )}
                      {canDelete && (
                        <>
                          {canEdit && <Actions.Separator />}
                          <Actions.Item
                            icon={<Icon as={FiTrash2} />}
                            tone="danger"
                            onClick={() => handleDeleteClick(activity)}
                          >
                            {text.activity.actions.delete}
                          </Actions.Item>
                        </>
                      )}
                    </Actions>
                  </HStack>
                )}

                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody px={4} py={4}>
                  {/* TASK-FE-PLAN-06 (nível 4, 3 pivots: Insumo/Equipamento/
                      Serviço) — `activity` já vem hidratada por esta seção,
                      sem query própria (Regra 2 do Modelo C). Cada pivot é
                      lista PLANA independente (armadilha 4 do Roteiro: 3
                      cascatas DIFERENTES, sem generalizar um componente
                      único). */}
                  <VStack align="stretch" gap={4}>
                    <PlanningActivityProductSection
                      planningUuid={planningUuid}
                      activity={activity}
                      plantedArea={plantedArea}
                    />
                    <PlanningActivityEquipmentSection
                      planningUuid={planningUuid}
                      activity={activity}
                      plantedArea={plantedArea}
                    />
                    <PlanningActivityFunctionSection
                      planningUuid={planningUuid}
                      activity={activity}
                      plantedArea={plantedArea}
                    />
                  </VStack>
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      )}

      <PlanningActivityDialog
        planningUuid={planningUuid}
        operation={operation}
        isOpen={dialogState !== null}
        activity={editingActivity}
        onClose={() => setDialogState(null)}
        onCreated={(uuid) => setExpandedItems((prev) => [...prev, uuid])}
      />

      <ModalAction
        isOpen={isDeleteOpen}
        onClose={onCloseDelete}
        asyncFunction={() => activityToDelete && deleteMutation.mutate(activityToDelete.uuid)}
        clearData={() => setActivityToDelete(null)}
        languageGB={languageGB}
        header={text.activity.deleteConfirm.header}
        body={text.activity.deleteConfirm.body}
      />
    </Box>
  );
}
