// src/pages/Operacional/Planejamentos/PlanningOtherActivitiesSection.tsx
// -----------------------------------------------------------------------------
// Grupo fixo "Outros" do cultivo — Outras Atividades (PlanningOtherActivities)
// — TASK-FE-PLAN-07 (execução `97-Esteiras/007`, SUR-30..32). Renderizado
// DENTRO de cada `Accordion.Item` de cultivo (`PlanningCultivationSection.
// tsx`), como IRMÃO de `PlanningOperationSection` — ARMADILHA 1 confirmada do
// Roteiro: `PlanningOtherActivities` é filha do CULTIVO, NÃO da atividade;
// esta seção NUNCA é renderizada dentro de `PlanningActivitySection.tsx`,
// mesmo estando visualmente perto da árvore de atividades no legado.
//
// Recebe `cultivation` já hidratado via prop (Regra 2 do Modelo C —
// sub-componente nunca busca dado sozinho); NENHUMA query própria — a única
// query da árvore continua sendo a de `PlanningTree.tsx` (Decisão de
// arquitetura FID-G3F). `plantedArea` (FLD-07, área plantada TOTAL do
// Planning) chega via prop separada — só usada pelo diálogo para o preview
// client-side NÃO-AUTORITATIVO do total (CV-04).
//
// Lista PLANA (sem `Accordion.Item` — ao contrário de Cultivo/Operação/
// Atividade, `PlanningOtherActivities` não tem nível filho a revelar,
// armadilha 2: sem sub-registro nenhum). Ação de criar (`PlanningOther
// ActivitiesDialog.tsx`, SÓ diálogo de criação) + excluir (`ModalAction`,
// Pattern 6) — ARMADILHA 2 confirmada: SEM ação de "Editar" na UI, mirror
// exato do legado (`AM-17`/`C-26`, `OtherActivities/index.js` só expõe
// "Excluir").
//
// Exclusão via `ModalAction` (Pattern 6) + `useRequest` — `typesRequest:
// 'update'` (não existe variante 'delete' em `TypesRequest`,
// `useRequest.tsx`), mirror EXATO `PlanningOperationSection.tsx`/
// `PlanningActivitySection.tsx`. Invalidação REAL da árvore é manual em
// `actionSuccess` (MESMA chave `planningDetailQueryKey`, NUNCA a do form
// raiz).
// -----------------------------------------------------------------------------

import { useState, type ElementType } from 'react';

import { Box, EmptyState, Flex, HStack, Icon, Text, VStack, useDisclosure } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { FiClipboard, FiPlus, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ModalAction } from '@/components/ModalAction';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { deletePlanningOtherActivities } from '@/services/v2/Operacional/Planejamentos/planning-other-activities-service';

import type {
  PlanningCultivationTreeItem,
  PlanningOtherActivityTreeItem,
} from '@/@types/v2/Operacional/planning';

import { planningDetailQueryKey } from './planning-tree-query-key';
import { PlanningOtherActivitiesDialog } from './PlanningOtherActivitiesDialog';

export interface PlanningOtherActivitiesSectionProps {
  /** UUID do Planning pai — SEMPRE via prop (Regra 2 do Modelo C). */
  planningUuid: string;
  /** Cultivo já hidratado pela query de detalhe de `PlanningTree.tsx` —
   *  `cultivation.other_activities` — esta seção NUNCA busca dado sozinha.
   *  ARMADILHA 1: filha do CULTIVO, nunca recebe uma `PlanningActivityTree
   *  Item` como pai. */
  cultivation: PlanningCultivationTreeItem;
  /** Área plantada TOTAL do Planning (FLD-07) — só para o preview
   *  client-side NÃO-AUTORITATIVO do total (CV-04) no diálogo. */
  plantedArea: number;
}

function formatQuantity(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function PlanningOtherActivitiesSection({
  planningUuid,
  cultivation,
  plantedArea,
}: PlanningOtherActivitiesSectionProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.plannings.planning.tree.otherActivity;

  const canCreate = can('plannings_create');
  const canDelete = can('plannings_delete');

  const otherActivities = cultivation.other_activities ?? [];

  const { open: isDialogOpen, onOpen: onOpenDialog, onClose: onCloseDialog } = useDisclosure();
  const [itemToDelete, setItemToDelete] = useState<PlanningOtherActivityTreeItem | null>(null);
  const { open: isDeleteOpen, onOpen: onOpenDelete, onClose: onCloseDelete } = useDisclosure();

  // `typesRequest: 'update'` — não existe variante 'delete' em
  // `TypesRequest` (`useRequest.tsx`), mirror EXATO
  // `PlanningOperationSection.tsx`. Invalidação REAL da árvore é manual em
  // `actionSuccess`. Rota `DELETE /planning-other-activities/{uuid}` — ÚNICA,
  // sem colisão com `planning-activities/{uuid}` (confirmado pelo cenário
  // `T-OTHER-ACT-ROUTING` do Tester de API, `TASK-PLAN-06` ✅ CONCLUÍDO).
  const deleteMutation = useRequest({
    asyncFunction: async (uuid: string) => deletePlanningOtherActivities(uuid),
    queryKey: 'planning-other-activities-mutation',
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.deletedToast,
    actionSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planningDetailQueryKey(planningUuid) });
      onCloseDelete();
      setItemToDelete(null);
    },
  });

  function handleDeleteClick(item: PlanningOtherActivityTreeItem) {
    setItemToDelete(item);
    onOpenDelete();
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={otherActivities.length > 0 ? 3 : 0}>
        <Text fontSize="sm" fontWeight="600" color="fg.default">
          {text.singularLabel}
        </Text>
        {canCreate && (
          <Button
            title={text.actions.new}
            icon={FiPlus as ElementType}
            variant="outline"
            size="sm"
            onClick={onOpenDialog}
          />
        )}
      </Flex>

      {otherActivities.length === 0 ? (
        <EmptyState.Root size="sm">
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiClipboard as ElementType} boxSize={8} color="fg.muted" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1}>
              <EmptyState.Title>{text.empty.title}</EmptyState.Title>
              <EmptyState.Description>{text.empty.description}</EmptyState.Description>
            </VStack>
            {canCreate && <Button title={text.actions.new} size="sm" onClick={onOpenDialog} />}
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <VStack align="stretch" gap={2}>
          {otherActivities.map((item) => (
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
                <Icon as={FiClipboard as ElementType} color="fg.muted" />
                <VStack align="flex-start" gap={0} minW={0}>
                  <Text fontWeight="600" fontSize="sm" color="fg.default" truncate>
                    {item.activity?.name ?? '—'}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {text.dialog.fields.quantity}: {formatQuantity(item.quantity)} ·{' '}
                    {text.dialog.fields.amount}: {formatCurrency(item.amount)} ·{' '}
                    {text.dialog.fields.total}: {formatCurrency(item.total)}
                  </Text>
                </VStack>
              </HStack>

              {/* ARMADILHA 2 — SEM ação de "Editar" (mirror exato do
                  legado, `AM-17`/`C-26`, só "Excluir"). */}
              {canDelete && (
                <Actions size="sm" languageGB={languageGB}>
                  <Actions.Item
                    icon={<Icon as={FiTrash2} />}
                    tone="danger"
                    onClick={() => handleDeleteClick(item)}
                  >
                    {text.actions.delete}
                  </Actions.Item>
                </Actions>
              )}
            </Flex>
          ))}
        </VStack>
      )}

      <PlanningOtherActivitiesDialog
        planningUuid={planningUuid}
        cultivationUuid={cultivation.uuid}
        plantedArea={plantedArea}
        isOpen={isDialogOpen}
        onClose={onCloseDialog}
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
