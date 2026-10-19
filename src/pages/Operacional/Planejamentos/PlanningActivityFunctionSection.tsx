// src/pages/Operacional/Planejamentos/PlanningActivityFunctionSection.tsx
// -----------------------------------------------------------------------------
// Nível 4c da árvore de Planejamento — MO/Serviços de uma Atividade
// (PlanningActivityFunction) — TASK-FE-PLAN-06 (execução `97-Esteiras/007`,
// SUR-27..29). Renderizado DENTRO de cada `Accordion.Item` de atividade
// (`PlanningActivitySection.tsx`), ao lado de
// `PlanningActivityProductSection`/`PlanningActivityEquipmentSection`.
//
// Recebe `activity` já hidratada via prop (Regra 2 do Modelo C); NENHUMA
// query própria. Lista PLANA (pivot é FOLHA da árvore), COM ação de
// "Editar" (`PUT` real por `uuid`, `TASK-PLAN-05`).
//
// A linha da lista NÃO exibe o `employee.uuid` cru (`PlanningActivityFunction
// Resource` só expõe `uuid` do funcionário, sem nome — invariante do
// projeto: nunca renderizar uuid cru) — mostra só um indicador textual
// genérico quando há funcionário vinculado.
//
// Exclusão via `ModalAction` (Pattern 6) + `useRequest` — `typesRequest:
// 'update'`, mirror EXATO `PlanningActivityEquipmentSection.tsx`. Rota real
// `DELETE /planning-activity-functions/{uuid}` (corrige `C-32` — verbo HTTP
// correto, sem tratamento especial no front).
// -----------------------------------------------------------------------------

import { useState, type ElementType } from 'react';

import { Box, EmptyState, Flex, HStack, Icon, Text, VStack, useDisclosure } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { FiEdit, FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ModalAction } from '@/components/ModalAction';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { deletePlanningActivityFunction } from '@/services/v2/Operacional/Planejamentos/planning-activity-function-service';

import type {
  PlanningActivityFunctionTreeItem,
  PlanningActivityTreeItem,
} from '@/@types/v2/Operacional/planning';

import { planningDetailQueryKey } from './planning-tree-query-key';
import { PlanningActivityFunctionDialog } from './PlanningActivityFunctionDialog';

export interface PlanningActivityFunctionSectionProps {
  /** UUID do Planning pai — SEMPRE via prop (Regra 2 do Modelo C). */
  planningUuid: string;
  /** Atividade já hidratada pela query de detalhe de `PlanningTree.tsx` —
   *  `activity.functions` — esta seção NUNCA busca dado sozinha. */
  activity: PlanningActivityTreeItem;
  /** Área plantada TOTAL do Planning (FLD-07) — repassada ao diálogo só
   *  para o preview client-side NÃO-AUTORITATIVO do total (CV-04). */
  plantedArea: number;
}

type FunctionDialogState = 'create' | { uuid: string } | null;

function formatQuantity(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function PlanningActivityFunctionSection({
  planningUuid,
  activity,
  plantedArea,
}: PlanningActivityFunctionSectionProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.plannings.planning.tree.function;

  const canCreate = can('plannings_create');
  const canEdit = can('plannings_edit');
  const canDelete = can('plannings_delete');

  const services = activity.functions ?? [];

  const [dialogState, setDialogState] = useState<FunctionDialogState>(null);
  const [itemToDelete, setItemToDelete] = useState<PlanningActivityFunctionTreeItem | null>(null);
  const { open: isDeleteOpen, onOpen: onOpenDelete, onClose: onCloseDelete } = useDisclosure();

  // `DELETE` REAL (corrige `C-32`) — `deletePlanningActivityFunction` já
  // chama o verbo correto; `typesRequest: 'update'` só reflete a
  // convenção interna do `useRequest`/`TypesRequest`, sem relação com o
  // verbo HTTP de fato usado.
  const deleteMutation = useRequest({
    asyncFunction: async (uuid: string) => deletePlanningActivityFunction(uuid),
    queryKey: 'planning-activity-function-mutation',
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.deletedToast,
    actionSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planningDetailQueryKey(planningUuid) });
      onCloseDelete();
      setItemToDelete(null);
    },
  });

  function handleDeleteClick(item: PlanningActivityFunctionTreeItem) {
    setItemToDelete(item);
    onOpenDelete();
  }

  const editingService =
    dialogState !== null && typeof dialogState === 'object'
      ? (services.find((item) => item.uuid === dialogState.uuid) ?? null)
      : null;

  const hasActionsMenu = canEdit || canDelete;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={services.length > 0 ? 3 : 0}>
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

      {services.length === 0 ? (
        <EmptyState.Root size="sm">
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiUsers as ElementType} boxSize={8} color="fg.muted" />
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
          {services.map((item) => (
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
                <Icon as={FiUsers as ElementType} color="fg.muted" />
                <VStack align="flex-start" gap={0} minW={0}>
                  <Text fontWeight="600" fontSize="sm" color="fg.default" truncate>
                    {item.function?.name ?? '—'}
                    {/* Nunca renderiza `employee.uuid` cru — só um indicador
                        textual genérico quando há funcionário vinculado. */}
                    {item.employee ? ` · ${text.employeeAssignedBadge}` : ''}
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

      <PlanningActivityFunctionDialog
        planningUuid={planningUuid}
        planningActivityUuid={activity.uuid}
        plantedArea={plantedArea}
        isOpen={dialogState !== null}
        service={editingService}
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
