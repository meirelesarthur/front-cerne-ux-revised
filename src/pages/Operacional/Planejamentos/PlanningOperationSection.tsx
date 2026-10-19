// src/pages/Operacional/Planejamentos/PlanningOperationSection.tsx
// -----------------------------------------------------------------------------
// Nível 2 da árvore de Planejamento — Operações do cultivo (PlanningOperation)
// — TASK-FE-PLAN-04 (execução `97-Esteiras/007`, SUR-13..17). Renderizado
// DENTRO de cada `Accordion.Item` de cultivo (`PlanningCultivationSection.
// tsx`, slot reservado por `TASK-FE-PLAN-03`).
//
// Cobre 3 superfícies:
//   - SUR-13/SUR-14 — lista as operações JÁ auto-semeadas pelo servidor
//     (SE-01, side-effect servidor→servidor disparado no `store()` do
//     cultivo, `TASK-PLAN-02`/`SeedBlankOperationsAction`) — SEM ação de UI
//     própria para "criar" uma auto-semeada; elas só aparecem já existindo,
//     com datas nulas. A única ação sobre uma operação pré-semeada é
//     "Definir Período".
//   - SUR-15/16 — diálogo ÚNICO (`PlanningOperationDialog.tsx`, armadilha 1)
//     cobre "Definir Período" (operação existente, `operation_uuid`
//     desabilitado, FLD-20) E "Criar Operação" manual (catálogo `use=2`,
//     `operation_uuid` habilitado) + exclusão (`ModalAction`, Pattern 6,
//     mirror EXATO `PlanningCultivationSection.tsx`).
//   - SUR-17 — linha fixa "1. Produção" (armadilha 2: NÃO é uma
//     `PlanningOperation` própria — reaproveita a MESMA entidade
//     `PlanningCultivation` via `update`, `PlanningProductionDialog.tsx`,
//     campo dedicado `production_quantity`).
//
// Recebe `cultivation` já hidratado via prop (Regra 2 do Modelo C —
// sub-componente nunca busca dado sozinho); NENHUMA query própria — a única
// query da árvore continua sendo a de `PlanningTree.tsx` (Decisão de
// arquitetura FID-G3F). Invalidação de TODAS as mutações desta seção usa a
// MESMA chave (`planningDetailQueryKey`) — NUNCA a do form raiz (mesma
// armadilha 1 de `TASK-FE-PLAN-02`/`03`).
//
// Exclusão via `ModalAction` (Pattern 6) + `useRequest` — `typesRequest:
// 'update'` (não existe variante 'delete' em `TypesRequest`, `useRequest.
// tsx`), mirror EXATO `PlanningCultivationSection.tsx`.
//
// Estado local (`useState`/`useDisclosure`, não é `paginatedQuery` — árvore
// não paginada, exceção já reconhecida pelo padrão): `dialogState` guarda
// "diálogo de operação aberto para qual operação" (`'create' | { uuid:
// string } | null`) — resolvido por `find()` no array já hidratado (sem
// query dedicada, Pattern 14 regra 6), mirror `PlanningCultivationSection`.
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
import { FiCalendar, FiDollarSign, FiEdit, FiPlus, FiTool, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ModalAction } from '@/components/ModalAction';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { deletePlanningOperation } from '@/services/v2/Operacional/Planejamentos/planning-operation-service';

import type {
  PlanningCultivationTreeItem,
  PlanningOperationTreeItem,
} from '@/@types/v2/Operacional/planning';

import { planningDetailQueryKey } from './planning-tree-query-key';
import { PlanningActivitySection } from './PlanningActivitySection';
import { PlanningOperationDialog } from './PlanningOperationDialog';
import { PlanningProductionDialog } from './PlanningProductionDialog';

export interface PlanningOperationSectionProps {
  /** UUID do Planning pai — SEMPRE via prop (Regra 2 do Modelo C). */
  planningUuid: string;
  /** Cultivo já hidratado pela query de detalhe de `PlanningTree.tsx` —
   *  `cultivation.operations` já vem auto-semeado pelo servidor (SE-01).
   *  Esta seção NUNCA busca dado sozinha. */
  cultivation: PlanningCultivationTreeItem;
  /** Área plantada TOTAL do Planning (FLD-07) — roteada por prop (Regra 2 do
   *  Modelo C) até `PlanningActivitySection`/pivots (`TASK-FE-PLAN-06`), só
   *  para o preview client-side NÃO-AUTORITATIVO do total (CV-04). */
  plantedArea: number;
}

/** "diálogo de operação aberto para qual operação" (Roteiro, seção "Estado"). */
type OperationDialogState = 'create' | { uuid: string } | null;

function formatDisplayDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('pt-BR');
}

function formatProductionQuantity(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PlanningOperationSection({
  planningUuid,
  cultivation,
  plantedArea,
}: PlanningOperationSectionProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.plannings.planning.tree;

  const canCreate = can('plannings_create');
  const canEdit = can('plannings_edit');
  const canDelete = can('plannings_delete');

  const operations = cultivation.operations ?? [];

  const [dialogState, setDialogState] = useState<OperationDialogState>(null);
  const [operationToDelete, setOperationToDelete] = useState<PlanningOperationTreeItem | null>(
    null
  );
  const { open: isDeleteOpen, onOpen: onOpenDelete, onClose: onCloseDelete } = useDisclosure();
  const {
    open: isProductionOpen,
    onOpen: onOpenProduction,
    onClose: onCloseProduction,
  } = useDisclosure();

  // `typesRequest: 'update'` — não existe variante 'delete' em
  // `TypesRequest` (`useRequest.tsx`), mirror EXATO
  // `PlanningCultivationSection.tsx`. Invalidação REAL da árvore é manual em
  // `actionSuccess`.
  const deleteMutation = useRequest({
    asyncFunction: async (uuid: string) => deletePlanningOperation(uuid),
    queryKey: 'planning-operation-mutation',
    typesRequest: 'update',
    entityName: text.operation.singularLabel,
    personalizedMessage: text.operation.deletedToast,
    actionSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planningDetailQueryKey(planningUuid) });
      onCloseDelete();
      setOperationToDelete(null);
    },
  });

  function handleDeleteClick(operation: PlanningOperationTreeItem) {
    setOperationToDelete(operation);
    onOpenDelete();
  }

  const editingOperation =
    dialogState !== null && typeof dialogState === 'object'
      ? (operations.find((item) => item.uuid === dialogState.uuid) ?? null)
      : null;

  const hasActionsMenu = canEdit || canDelete;

  return (
    <Box>
      {/* SUR-17 — linha fixa "1. Produção" (armadilha 2: NÃO é uma
          PlanningOperation — reaproveita a MESMA entidade PlanningCultivation
          via update, PlanningProductionDialog.tsx). */}
      <Flex
        align="center"
        justify="space-between"
        border="1px solid"
        borderColor="border.subtle"
        borderRadius="md"
        px={4}
        py={3}
        mb={3}
        bg="bg.subtle"
      >
        <HStack gap={2} minW={0}>
          <Icon as={FiDollarSign as ElementType} color="fg.muted" />
          <VStack align="flex-start" gap={0} minW={0}>
            <Text fontWeight="600" fontSize="sm" color="fg.default">
              {text.production.rowLabel}
            </Text>
            <Text fontSize="xs" color="fg.muted">
              {text.production.dialog.fields.productionQuantity}:{' '}
              {formatProductionQuantity(cultivation.production_quantity)}
            </Text>
          </VStack>
        </HStack>

        {canEdit && (
          <Actions size="sm" languageGB={languageGB}>
            <Actions.Item icon={<Icon as={FiEdit} />} onClick={onOpenProduction}>
              {text.production.actions.edit}
            </Actions.Item>
          </Actions>
        )}
      </Flex>

      <Flex justify="flex-end" mb={operations.length > 0 ? 3 : 0}>
        {canCreate && (
          <Button
            title={text.operation.actions.new}
            icon={FiPlus as ElementType}
            variant="outline"
            size="sm"
            onClick={() => setDialogState('create')}
          />
        )}
      </Flex>

      {operations.length === 0 ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiTool as ElementType} boxSize={8} color="fg.muted" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1}>
              <EmptyState.Title>{text.operation.empty.title}</EmptyState.Title>
              <EmptyState.Description>{text.operation.empty.description}</EmptyState.Description>
            </VStack>
            {canCreate && (
              <Button
                title={text.operation.actions.new}
                size="sm"
                onClick={() => setDialogState('create')}
              />
            )}
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <Accordion.Root multiple collapsible defaultValue={[]}>
          {operations.map((operation) => (
            <Accordion.Item
              key={operation.uuid}
              value={operation.uuid}
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
                      {operation.operation?.name ?? '—'}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {formatDisplayDate(operation.start_date)} –{' '}
                      {formatDisplayDate(operation.end_date)}
                    </Text>
                  </VStack>
                </Flex>

                {hasActionsMenu && (
                  <HStack gap={1} onClick={(event) => event.stopPropagation()}>
                    <Actions size="sm" languageGB={languageGB}>
                      {canEdit && (
                        <Actions.Item
                          icon={<Icon as={FiCalendar} />}
                          onClick={() => setDialogState({ uuid: operation.uuid })}
                        >
                          {text.operation.actions.definePeriod}
                        </Actions.Item>
                      )}
                      {canDelete && (
                        <>
                          {canEdit && <Actions.Separator />}
                          <Actions.Item
                            icon={<Icon as={FiTrash2} />}
                            tone="danger"
                            onClick={() => handleDeleteClick(operation)}
                          >
                            {text.operation.actions.delete}
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
                  {/* TASK-FE-PLAN-05 (nível 3, Atividades) — `operation` já
                      vem hidratado por esta seção, sem query própria (Regra
                      2 do Modelo C). `plantedArea` repassada até
                      `TASK-FE-PLAN-06` (pivots). */}
                  <PlanningActivitySection
                    planningUuid={planningUuid}
                    operation={operation}
                    plantedArea={plantedArea}
                  />
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      )}

      <PlanningOperationDialog
        planningUuid={planningUuid}
        cultivationUuid={cultivation.uuid}
        isOpen={dialogState !== null}
        operation={editingOperation}
        onClose={() => setDialogState(null)}
      />

      <PlanningProductionDialog
        planningUuid={planningUuid}
        isOpen={isProductionOpen}
        cultivation={cultivation}
        onClose={onCloseProduction}
      />

      <ModalAction
        isOpen={isDeleteOpen}
        onClose={onCloseDelete}
        asyncFunction={() => operationToDelete && deleteMutation.mutate(operationToDelete.uuid)}
        clearData={() => setOperationToDelete(null)}
        languageGB={languageGB}
        header={text.operation.deleteConfirm.header}
        body={text.operation.deleteConfirm.body}
      />
    </Box>
  );
}
