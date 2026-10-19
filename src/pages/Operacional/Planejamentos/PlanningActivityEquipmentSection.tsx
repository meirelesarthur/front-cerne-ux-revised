// src/pages/Operacional/Planejamentos/PlanningActivityEquipmentSection.tsx
// -----------------------------------------------------------------------------
// Nível 4b da árvore de Planejamento — Equipamentos de uma Atividade
// (PlanningActivityEquipment) — TASK-FE-PLAN-06 (execução `97-Esteiras/007`,
// SUR-24..26). Renderizado DENTRO de cada `Accordion.Item` de atividade
// (`PlanningActivitySection.tsx`, slot reservado por `TASK-FE-PLAN-05`), ao
// lado de `PlanningActivityProductSection`/`PlanningActivityFunctionSection`.
//
// Recebe `activity` já hidratada via prop (Regra 2 do Modelo C); NENHUMA
// query própria (Decisão de arquitetura FID-G3F). Lista PLANA (sem
// `Accordion.Item` — pivot é FOLHA da árvore, sem sub-nível a revelar,
// mirror `PlanningOtherActivitiesSection.tsx`), MAS com ação de "Editar"
// (diferente de Outras Atividades — aqui existe `PUT` real por `uuid`,
// `TASK-PLAN-05`).
//
// Exclusão via `ModalAction` (Pattern 6) + `useRequest` — `typesRequest:
// 'update'` (não existe variante 'delete' em `TypesRequest`), mirror EXATO
// `PlanningActivitySection.tsx`. Invalidação REAL da árvore é manual em
// `actionSuccess` (MESMA chave `planningDetailQueryKey`).
// -----------------------------------------------------------------------------

import { useState, type ElementType } from 'react';

import { Box, EmptyState, Flex, HStack, Icon, Text, VStack, useDisclosure } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { FiEdit, FiPlus, FiTool, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ModalAction } from '@/components/ModalAction';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { deletePlanningActivityEquipment } from '@/services/v2/Operacional/Planejamentos/planning-activity-equipment-service';

import type {
  PlanningActivityEquipmentTreeItem,
  PlanningActivityTreeItem,
} from '@/@types/v2/Operacional/planning';

import { planningDetailQueryKey } from './planning-tree-query-key';
import { PlanningActivityEquipmentDialog } from './PlanningActivityEquipmentDialog';

export interface PlanningActivityEquipmentSectionProps {
  /** UUID do Planning pai — SEMPRE via prop (Regra 2 do Modelo C). */
  planningUuid: string;
  /** Atividade já hidratada pela query de detalhe de `PlanningTree.tsx` —
   *  `activity.equipments` — esta seção NUNCA busca dado sozinha. */
  activity: PlanningActivityTreeItem;
  /** Área plantada TOTAL do Planning (FLD-07) — repassada ao diálogo só
   *  para o preview client-side NÃO-AUTORITATIVO do total (CV-04). */
  plantedArea: number;
}

type EquipmentDialogState = 'create' | { uuid: string } | null;

function formatQuantity(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function PlanningActivityEquipmentSection({
  planningUuid,
  activity,
  plantedArea,
}: PlanningActivityEquipmentSectionProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.plannings.planning.tree.equipment;

  const canCreate = can('plannings_create');
  const canEdit = can('plannings_edit');
  const canDelete = can('plannings_delete');

  const equipments = activity.equipments ?? [];

  const [dialogState, setDialogState] = useState<EquipmentDialogState>(null);
  const [itemToDelete, setItemToDelete] = useState<PlanningActivityEquipmentTreeItem | null>(null);
  const { open: isDeleteOpen, onOpen: onOpenDelete, onClose: onCloseDelete } = useDisclosure();

  const deleteMutation = useRequest({
    asyncFunction: async (uuid: string) => deletePlanningActivityEquipment(uuid),
    queryKey: 'planning-activity-equipment-mutation',
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.deletedToast,
    actionSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planningDetailQueryKey(planningUuid) });
      onCloseDelete();
      setItemToDelete(null);
    },
  });

  function handleDeleteClick(item: PlanningActivityEquipmentTreeItem) {
    setItemToDelete(item);
    onOpenDelete();
  }

  const editingEquipment =
    dialogState !== null && typeof dialogState === 'object'
      ? (equipments.find((item) => item.uuid === dialogState.uuid) ?? null)
      : null;

  const hasActionsMenu = canEdit || canDelete;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={equipments.length > 0 ? 3 : 0}>
        <Text fontSize="sm" fontWeight="600" color="fg.default">
          {text.singularLabel}
        </Text>
        {canCreate && (
          <Button
            title={text.actions.new}
            icon={FiPlus as ElementType}
            variant="outline"
            size="sm"
            onClick={() => setDialogState('create')}
          />
        )}
      </Flex>

      {equipments.length === 0 ? (
        <EmptyState.Root size="sm">
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiTool as ElementType} boxSize={8} color="fg.muted" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1}>
              <EmptyState.Title>{text.empty.title}</EmptyState.Title>
              <EmptyState.Description>{text.empty.description}</EmptyState.Description>
            </VStack>
            {canCreate && (
              <Button title={text.actions.new} size="sm" onClick={() => setDialogState('create')} />
            )}
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <VStack align="stretch" gap={2}>
          {equipments.map((item) => (
            <Flex
              key={item.uuid}
              align="center"
              justify="space-between"
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="md"
              px={4}
              py={3}
              bg="bg.subtle"
            >
              <HStack gap={2} minW={0}>
                <Icon as={FiTool as ElementType} color="fg.muted" />
                <VStack align="flex-start" gap={0} minW={0}>
                  <Text fontWeight="600" fontSize="sm" color="fg.default" truncate>
                    {item.equipment?.description ?? '—'}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {text.dialog.fields.quantity}: {formatQuantity(item.quantity)} ·{' '}
                    {text.dialog.fields.amount}: {formatCurrency(item.amount)} ·{' '}
                    {text.dialog.fields.total}: {formatCurrency(item.total)}
                  </Text>
                </VStack>
              </HStack>

              {hasActionsMenu && (
                <Actions size="sm" languageGB={languageGB}>
                  {canEdit && (
                    <Actions.Item
                      icon={<Icon as={FiEdit} />}
                      onClick={() => setDialogState({ uuid: item.uuid })}
                    >
                      {text.actions.edit}
                    </Actions.Item>
                  )}
                  {canDelete && (
                    <>
                      {canEdit && <Actions.Separator />}
                      <Actions.Item
                        icon={<Icon as={FiTrash2} />}
                        tone="danger"
                        onClick={() => handleDeleteClick(item)}
                      >
                        {text.actions.delete}
                      </Actions.Item>
                    </>
                  )}
                </Actions>
              )}
            </Flex>
          ))}
        </VStack>
      )}

      <PlanningActivityEquipmentDialog
        planningUuid={planningUuid}
        planningActivityUuid={activity.uuid}
        plantedArea={plantedArea}
        isOpen={dialogState !== null}
        equipment={editingEquipment}
        onClose={() => setDialogState(null)}
      />

      <ModalAction
        isOpen={isDeleteOpen}
        onClose={onCloseDelete}
        asyncFunction={() => itemToDelete && deleteMutation.mutate(itemToDelete.uuid)}
        clearData={() => setItemToDelete(null)}
        languageGB={languageGB}
        header={text.deleteConfirm.header}
        body={text.deleteConfirm.body}
      />
    </Box>
  );
}
