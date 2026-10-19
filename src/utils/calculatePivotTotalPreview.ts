// src/utils/calculatePivotTotalPreview.ts
// -----------------------------------------------------------------------------
// Fórmula CV-04 (preview CLIENTE, NÃO-AUTORITATIVO) — `Vl.Total = Vl.Unit
// (amount) × Qtd/ha (quantity) × Área total do planning (plantedArea)`.
// Compartilhada pelos 3 diálogos de pivot (Insumo/Equipamento/Serviço,
// TASK-FE-PLAN-06) — mesmo cálculo já usado inline em
// `PlanningOtherActivitiesDialog.tsx` (TASK-FE-PLAN-07), extraído aqui para
// reaproveitamento (Roteiro, arquivo F) em vez de reimplementar 3 vezes.
//
// **NÃO É FONTE DE VERDADE.** O valor exibido aqui é só feedback visual
// (`InputReadOnly`) antes do salvamento — o servidor SEMPRE recalcula
// `total` via `CalculatePivotTotalAction::handle()` (mirror exato desta
// mesma fórmula, `round($amount * $quantity * $plantedArea, 2)`,
// `GB.Cerne.Api/app/Actions/Planning/CalculatePivotTotalAction.php`) e
// ignora qualquer `total` enviado no payload (G-CALC-DUP). Pequena
// divergência de arredondamento entre o preview e o valor pós-save não é
// bug — é esperado e documentado (armadilha 2 do Roteiro).
// -----------------------------------------------------------------------------

export function calculatePivotTotalPreview(
  amount: number | null | undefined,
  quantity: number | null | undefined,
  plantedArea: number | null | undefined
): number {
  const total = (Number(amount) || 0) * (Number(quantity) || 0) * (Number(plantedArea) || 0);
  return Number(total.toFixed(2));
}
