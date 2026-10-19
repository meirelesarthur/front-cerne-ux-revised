// src/pages/Operacional/Planejamentos/planning-tree-query-key.ts
// -----------------------------------------------------------------------------
// Chave de query COMPARTILHADA da árvore de Planejamento (Planning) —
// TASK-FE-PLAN-02, "Decisão de arquitetura de tela" do manifesto FID-G3F
// (`97-Esteiras/007/CONTRATOS/fid-g3f-planejamentos.md`): UMA query de
// detalhe DEDICADA (`useQuery`, NÃO `queryKey.plannings.planning` do form
// raiz) alimenta toda a árvore (`PlanningTree.tsx`, montada por
// `CreateOrUpdatePlanning.tsx` só em modo edição).
//
// Qualquer mutação FILHA (criar/editar/excluir cultivo/operação/atividade/
// pivot/outra-atividade — `TASK-FE-PLAN-03`..`07`) DEVE invalidar esta MESMA
// chave (`queryClient.invalidateQueries({ queryKey: planningDetailQueryKey(
// planningUuid) })`) ao suceder — reproduz fielmente o `reload()` do legado
// (refaz `GET /api/v1/plannings/{uuid}` inteiro), SEM merge otimista de
// árvore nem estado paralelo (nenhuma Tarefa de árvore implementa isso).
//
// Armadilha 1 do Roteiro de `TASK-FE-PLAN-02`: NUNCA usar a mesma query key
// para o form raiz (`queryKey.plannings.planning`, `CreateOrUpdatePlanning.
// tsx`) e para a árvore (esta chave) — são dados e ciclos de vida
// diferentes; confundi-las causaria refetch cruzado indevido (editar um
// campo do form raiz dispararia refetch da árvore, perdendo estado de
// diálogos abertos das Tarefas seguintes).
// -----------------------------------------------------------------------------

export function planningDetailQueryKey(
  planningUuid: string | undefined
): readonly [string, string | undefined] {
  return ['planning-detail', planningUuid] as const;
}
