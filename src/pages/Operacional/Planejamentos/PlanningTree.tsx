// src/pages/Operacional/Planejamentos/PlanningTree.tsx
// -----------------------------------------------------------------------------
// Casca da árvore de Planejamento (Planning) — TASK-FE-PLAN-02. Monta SÓ em
// modo edição (`CreateOrUpdatePlanning.tsx`,
// `{planningUuid && <PlanningTree planningUuid={planningUuid} />}`) — mirror
// da condição do legado ("widget React só monta se existir item.id").
// Recebe `planningUuid` via prop (Regra 2 do Modelo C — sub-componente nunca
// busca o id sozinho).
//
// Query de detalhe PRÓPRIA (`planningDetailQueryKey`, `['planning-detail',
// uuid]`) — INDEPENDENTE da query do form raiz (`useCustomFormQueryById`,
// `queryKey.plannings.planning`, ver `CreateOrUpdatePlanning.tsx`). Decisão
// de arquitetura FID-G3F ("Decisão de arquitetura de tela"): confundir as
// duas causaria refetch cruzado indevido (editar o form raiz refetcharia a
// árvore, perdendo estado de diálogos abertos das Tarefas seguintes).
//
// Não é `useCustomFormQueryById` nem `useCustomGridQueryById` — é um
// `useQuery` cru dedicado, porque a árvore não é um formulário (Lei 2) nem
// uma grid paginada (Lei 5): é UMA hidratação completa, sem paginação
// server-side (mesma exceção já reconhecida por `get_pwa_grid_query_pattern`
// para "filtro em árvore", estendida aqui ao estado de exibição da árvore
// inteira — ver "Decisão de arquitetura de tela" do manifesto FID-G3F).
//
// Esta Tarefa (TASK-FE-PLAN-02) entrega A CASCA: query + 3 estados
// (skeleton/empty/error). `TASK-FE-PLAN-03` (aditivo) delega o CONTEÚDO de
// sucesso do nível 1 (lista de cultivos, ações, diálogo) a
// `PlanningCultivationSection.tsx` — este arquivo permanece responsável só
// pela query de detalhe + estados de transporte (skeleton/erro da árvore
// inteira), nunca pelo conteúdo de nível 1 em si. Nenhuma Tabs (a árvore é
// uma seção contínua, não uma aba — armadilha 2 do Roteiro de
// `TASK-FE-PLAN-02`). Slots das Tarefas seguintes:
//   - `TASK-FE-PLAN-03` (SUR-10..12) — `PlanningCultivationSection.tsx`:
//     lista + ações de nível 1 (editar/excluir cultivo, dialog
//     `PlanningCultivationDialog`, CTA "Nova Cultura/Variedade").
//   - `TASK-FE-PLAN-04`..`07` — corpo de cada `Accordion.Item` (nível 2
//     Operações, dentro dela nível 3 Atividades, dentro nível 4
//     produtos/equipamentos/serviços + Outras Atividades do cultivo).
//
// Regra de invalidação (Decisão de arquitetura, reproduz o `reload()` do
// legado): qualquer mutação filha das Tarefas seguintes invalida
// `planningDetailQueryKey(planningUuid)` ao suceder — nenhuma implementa
// merge otimista de árvore.
//
// `TASK-FE-PLAN-08` (fecha o ciclo) acrescenta o rodapé de agregados
// (FLD-12, CV-05/CV-06 — `Vl. Planejado`/`Vl./área`), logo abaixo da lista de
// cultivos: `planning_total`/`planning_area` do MESMO payload de detalhe já
// hidratado por esta query (`CalculatePlanningAggregatesAction`,
// `TASK-PLAN-07`, fonte única) — nenhum cálculo client-side. Duplicado, de
// propósito, do rodapé já existente no form raiz (`CreateOrUpdatePlanning.
// tsx`, FLD-12, `TASK-FE-PLAN-02`) — mesma fonte, mesma formatação, só
// reposicionado para ficar visível sem rolar de volta ao topo do formulário.
// -----------------------------------------------------------------------------

import { type ElementType } from 'react';

import { Box, EmptyState, Flex, Icon, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { getPlanningTree } from '@/services/v2/Operacional/Planejamentos/planning-service';

import { planningDetailQueryKey } from './planning-tree-query-key';
import { PlanningCultivationSection } from './PlanningCultivationSection';

// FLD-12 (rodapé, CV-05/CV-06) — mesma formatação de `CreateOrUpdatePlanning.
// tsx::formatMoney` (mirror EXATO, sem `style: 'currency'`, mesmo padrão do
// rodapé já existente no form raiz). Fonte única `planning_total`/
// `planning_area` do payload de detalhe — NUNCA somado no cliente
// (G-CALC-DUP, `TASK-FE-PLAN-08`).
function formatMoney(value: number): string {
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export interface PlanningTreeProps {
  /** UUID do Planning pai — SEMPRE via prop (Regra 2 do Modelo C). */
  planningUuid: string;
}

export function PlanningTree({ planningUuid }: PlanningTreeProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.plannings.planning.tree;
  // Rótulos compartilhados com o rodapé FLD-12 do form raiz
  // (`CreateOrUpdatePlanning.tsx`) — MESMO campo, mesmo texto, mirror
  // exato ("Vl. Planejado"/"Vl./área").
  const fieldsText = languageGB.plannings.planning.form.fields;

  const treeQuery = useQuery({
    queryKey: planningDetailQueryKey(planningUuid),
    queryFn: () => getPlanningTree(planningUuid),
    enabled: !!planningUuid,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const isLoading = treeQuery.isPending;
  const isError = !isLoading && treeQuery.isError;
  const cultivations = treeQuery.data?.cultivations ?? [];
  // FLD-07, área plantada TOTAL do Planning — repassada até
  // `PlanningOtherActivitiesSection` (TASK-FE-PLAN-07) só para o preview
  // client-side NÃO-AUTORITATIVO do total (CV-04).
  const plantedArea = treeQuery.data?.planted_area ?? 0;
  // FLD-12 (rodapé, CV-05/CV-06) — `CalculatePlanningAggregatesAction`
  // (`TASK-PLAN-07`, fonte única) já vem no MESMO payload de detalhe
  // (`treeQuery.data`, `PlanningTreeData`) — nenhum cálculo client-side,
  // nunca somado a partir de `cultivations` (armadilha 2 do Roteiro de
  // `TASK-FE-PLAN-08`). Duplicado, de propósito, do rodapé já existente no
  // form raiz (`CreateOrUpdatePlanning.tsx`, FLD-12) — aqui fica visível
  // logo abaixo da árvore, sem exigir rolagem de volta ao topo do form.
  const planningTotal = treeQuery.data?.planning_total ?? 0;
  const planningArea = treeQuery.data?.planning_area ?? 0;

  return (
    <Box mt={8}>
      <Text fontSize="lg" fontWeight="600" color="fg.default" mb={4}>
        {text.title}
      </Text>

      {isLoading && (
        <VStack align="stretch" gap={3}>
          <Skeleton height="52px" borderRadius="md" />
          <Skeleton height="52px" borderRadius="md" />
        </VStack>
      )}

      {isError && (
        <Flex direction="column" align="center" justify="center" py={10} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle as ElementType} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{text.error.title}</EmptyState.Title>
                <EmptyState.Description>{text.error.description}</EmptyState.Description>
              </VStack>
              <Button
                title={languageGB.defaltStrings.tryAgain}
                icon={FiRefreshCw as ElementType}
                variant="outline"
                size="sm"
                onClick={() => treeQuery.refetch()}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      )}

      {/* TASK-FE-PLAN-03 — nível 1 (Cultura/Variedade): lista, CTA de
          estado vazio, ações e diálogo. `PlanningCultivationSection` nunca
          busca dado sozinho (Regra 2 do Modelo C) — recebe `cultivations`
          já hidratado por esta query. */}
      {!isLoading && !isError && (
        <>
          <PlanningCultivationSection
            planningUuid={planningUuid}
            cultivations={cultivations}
            plantedArea={plantedArea}
          />

          {/* FLD-12 — rodapé de agregados (CV-05/CV-06), fonte única do
              servidor (ver comentário de `planningTotal`/`planningArea`
              acima). */}
          <Box mt={8} pt={4} borderTop="1px solid" borderColor="border.subtle">
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InputReadOnly
                name="tree_planning_total"
                label={fieldsText.planningTotal}
                value={formatMoney(planningTotal)}
              />
              <InputReadOnly
                name="tree_planning_area"
                label={fieldsText.planningArea}
                value={formatMoney(planningArea)}
              />
            </SimpleGrid>
          </Box>
        </>
      )}
    </Box>
  );
}
