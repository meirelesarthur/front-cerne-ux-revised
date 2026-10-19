// src/pages/Operacional/Planejamentos/PlanningCultivationSection.tsx
// -----------------------------------------------------------------------------
// Nível 1 da árvore de Planejamento — Cultura/Variedade (PlanningCultivation)
// — TASK-FE-PLAN-03 (execução `97-Esteiras/007`, SUR-10..12). Renderizado
// DENTRO da casca `PlanningTree.tsx` (`TASK-FE-PLAN-02`), que continua
// responsável só pela query de detalhe + estados de transporte
// (skeleton/error da árvore inteira). Este componente cobre o CONTEÚDO de
// sucesso do nível 1: lista de cultivos (`Accordion.Item` por cultivo,
// cabeçalho com Cultura/Variedade + período + previsão de colheita),
// diálogo de criar/editar (`PlanningCultivationDialog.tsx`) e exclusão
// (`ModalAction`, Pattern 6).
//
// Recebe `cultivations` já hidratado via prop (Regra 2 do Modelo C —
// sub-componente nunca busca dado sozinho); NENHUMA query própria — a única
// query da árvore é a de `PlanningTree.tsx` (Decisão de arquitetura FID-G3F).
//
// Estado local (`useState`, não é `paginatedQuery` — árvore não paginada,
// exceção já reconhecida pelo padrão): `dialogState` guarda "diálogo aberto
// para qual cultivo" (`'create' | { uuid: string } | null`, conforme o
// Roteiro) — o cultivo em edição é resolvido por `find()` no array já
// hidratado (sem query dedicada, Pattern 14 regra 6).
//
// Exclusão via `ModalAction` (Pattern 6) + `useRequest` — mirror EXATO
// `index.tsx` (`typesRequest: 'update'`, já que `'delete'` não existe em
// `TypesRequest`, `useRequest.tsx`); a invalidação REAL da árvore é manual
// em `actionSuccess` (mesma razão documentada em `PlanningCultivationDialog.
// tsx` — `queryKey` do hook é `string`, incompatível com a chave composta).
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
import { FiEdit, FiFolder, FiPlus, FiTrash2 } from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ModalAction } from '@/components/ModalAction';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { deletePlanningCultivation } from '@/services/v2/Operacional/Planejamentos/planning-cultivation-service';

import type { PlanningCultivationTreeItem } from '@/@types/v2/Operacional/planning';

import { planningDetailQueryKey } from './planning-tree-query-key';
import { PlanningCultivationDialog } from './PlanningCultivationDialog';
import { PlanningOperationSection } from './PlanningOperationSection';
import { PlanningOtherActivitiesSection } from './PlanningOtherActivitiesSection';

export interface PlanningCultivationSectionProps {
  /** UUID do Planning pai — SEMPRE via prop (Regra 2 do Modelo C). */
  planningUuid: string;
  /** Cultivos já hidratados pela query de detalhe de `PlanningTree.tsx` —
   *  esta seção NUNCA busca dado sozinha. */
  cultivations: PlanningCultivationTreeItem[];
  /** Área plantada TOTAL do Planning (FLD-07) — repassada só para
   *  `PlanningOtherActivitiesSection` (TASK-FE-PLAN-07), preview
   *  client-side NÃO-AUTORITATIVO do total (CV-04). */
  plantedArea: number;
}

/** "diálogo aberto para qual cultivo" (Roteiro, seção "Estado"). */
type CultivationDialogState = 'create' | { uuid: string } | null;

function formatDisplayDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('pt-BR');
}

export function PlanningCultivationSection({
  planningUuid,
  cultivations,
  plantedArea,
}: PlanningCultivationSectionProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.plannings.planning.tree;

  const canCreate = can('plannings_create');
  const canEdit = can('plannings_edit');
  const canDelete = can('plannings_delete');

  const [dialogState, setDialogState] = useState<CultivationDialogState>(null);
  const [cultivationToDelete, setCultivationToDelete] =
    useState<PlanningCultivationTreeItem | null>(null);
  const { open: isDeleteOpen, onOpen: onOpenDelete, onClose: onCloseDelete } = useDisclosure();

  // GAP-PLAN-FE-03 (item 7) — `Accordion.Root` controlado (antes
  // não-controlado, `defaultValue={[]}`, sempre iniciando todo cultivo
  // colapsado, inclusive um recém-criado). Cultivos pré-existentes
  // continuam colapsados por padrão (sem mudança de UX no fluxo de
  // navegação/browse já em produção) — só o cultivo recém-criado é
  // auto-expandido via `onCreated` de `PlanningCultivationDialog`.
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // `typesRequest: 'update'` — não existe variante 'delete' em
  // `TypesRequest` (`useRequest.tsx`), mirror EXATO `index.tsx` (exclusão de
  // Planning). Invalidação REAL da árvore é manual em `actionSuccess` (ver
  // cabeçalho do arquivo).
  const deleteMutation = useRequest({
    asyncFunction: async (uuid: string) => deletePlanningCultivation(uuid),
    queryKey: 'planning-cultivation-mutation',
    typesRequest: 'update',
    entityName: text.cultivation.singularLabel,
    personalizedMessage: text.cultivation.deletedToast,
    actionSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planningDetailQueryKey(planningUuid) });
      onCloseDelete();
      setCultivationToDelete(null);
    },
  });

  function handleDeleteClick(cultivation: PlanningCultivationTreeItem) {
    setCultivationToDelete(cultivation);
    onOpenDelete();
  }

  const editingCultivation =
    dialogState !== null && typeof dialogState === 'object'
      ? (cultivations.find((item) => item.uuid === dialogState.uuid) ?? null)
      : null;

  const hasActionsMenu = canEdit || canDelete;

  return (
    <Box>
      <Flex justify="flex-end" mb={cultivations.length > 0 ? 3 : 0}>
        {canCreate && (
          <Button
            title={text.cultivation.actions.new}
            icon={FiPlus as ElementType}
            variant="outline"
            size="sm"
            onClick={() => setDialogState('create')}
          />
        )}
      </Flex>

      {cultivations.length === 0 ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiFolder as ElementType} boxSize={8} color="fg.muted" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1}>
              <EmptyState.Title>{text.empty.title}</EmptyState.Title>
              <EmptyState.Description>{text.empty.description}</EmptyState.Description>
            </VStack>
            {canCreate && (
              <Button
                title={text.cultivation.actions.new}
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
          {cultivations.map((cultivation) => (
            <Accordion.Item
              key={cultivation.uuid}
              value={cultivation.uuid}
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="md"
              overflow="hidden"
              mb={3}
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
                      {cultivation.cultivation?.name ?? '—'} / {cultivation.variety?.name ?? '—'}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {formatDisplayDate(cultivation.start_date)} –{' '}
                      {formatDisplayDate(cultivation.end_date)} ·{' '}
                      {text.cultivation.dialog.fields.forecast}:{' '}
                      {formatDisplayDate(cultivation.forecast)}
                    </Text>
                  </VStack>
                </Flex>

                {hasActionsMenu && (
                  <HStack gap={1} onClick={(event) => event.stopPropagation()}>
                    <Actions size="sm" languageGB={languageGB}>
                      {canEdit && (
                        <Actions.Item
                          icon={<Icon as={FiEdit} />}
                          onClick={() => setDialogState({ uuid: cultivation.uuid })}
                        >
                          {text.cultivation.actions.edit}
                        </Actions.Item>
                      )}
                      {canDelete && (
                        <>
                          {canEdit && <Actions.Separator />}
                          <Actions.Item
                            icon={<Icon as={FiTrash2} />}
                            tone="danger"
                            onClick={() => handleDeleteClick(cultivation)}
                          >
                            {text.cultivation.actions.delete}
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
                  {/* TASK-FE-PLAN-04 (nível 2, Operações + "Definir
                      Período"/"Definir Produção") — `cultivation` já vem
                      hidratado por esta seção, sem query própria (Regra 2
                      do Modelo C). */}
                  <PlanningOperationSection
                    planningUuid={planningUuid}
                    cultivation={cultivation}
                    plantedArea={plantedArea}
                  />

                  {/* TASK-FE-PLAN-07 (grupo fixo "Outros", SUR-30..32) —
                      IRMÃO de `PlanningOperationSection`, NUNCA dentro dela
                      (armadilha 1: filha do CULTIVO, não da atividade). */}
                  <Box mt={4}>
                    <PlanningOtherActivitiesSection
                      planningUuid={planningUuid}
                      cultivation={cultivation}
                      plantedArea={plantedArea}
                    />
                  </Box>
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      )}

      <PlanningCultivationDialog
        planningUuid={planningUuid}
        isOpen={dialogState !== null}
        cultivation={editingCultivation}
        onClose={() => setDialogState(null)}
        onCreated={(uuid) => setExpandedItems((prev) => [...prev, uuid])}
      />

      <ModalAction
        isOpen={isDeleteOpen}
        onClose={onCloseDelete}
        asyncFunction={() => cultivationToDelete && deleteMutation.mutate(cultivationToDelete.uuid)}
        clearData={() => setCultivationToDelete(null)}
        languageGB={languageGB}
        header={text.cultivation.deleteConfirm.header}
        body={text.cultivation.deleteConfirm.body}
      />
    </Box>
  );
}
