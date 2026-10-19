// Mapeamento ÚNICO `NutritionItemData` (GET /nutritions/{uuid}) → item do
// form RHF. Compartilhado pela edição (`CreateOrUpdateNutrition`) e pela
// visualização (`ViewNutrition`) — TASK-095-FE-R2-01 (reabertura P0 do
// Visualizar): as duas telas precisam hidratar armazém/produto/estoque/um do
// mesmo jeito.
import type { NutritionForm, NutritionItemData } from '@/@types/v2/Nutritions';

export function mapNutritionItemToForm(item: NutritionItemData): NutritionForm['items'][number] {
  return {
    uuid: item.uuid,
    // Armazém vem do GET (`item.warehouse`), inclusive armazém excluído
    // logicamente; o rótulo "(excluído)" é aplicado no editor, que conhece o
    // catálogo de armazéns ativos.
    warehouse_id: item.warehouse
      ? { label: item.warehouse.description, value: item.warehouse.uuid }
      : null,
    product_id: item.product ? { label: item.product.description, value: item.product.uuid } : null,
    // Dieta automática — SEM UI nesta Tarefa, sempre `null`.
    diet_beat_id: null,
    // Seed imediato com a medida persistida; o editor refaz LK-05 ao vivo.
    product_um: item.um ?? item.product?.measurement ?? '',
    // `DA-NT-04` — nunca lido de campo persistido; resolvido ao vivo no editor.
    qnt_stock: null,
    quantity: Number(item.quantity) || 0,
    area_id: item.area ? { label: item.area.description, value: item.area.uuid } : null,
    grazing_id: item.grazing ? { label: item.grazing.description, value: item.grazing.uuid } : null,
    trough_id: item.trough ? { label: item.trough.description, value: item.trough.uuid } : null,
    note_item: item.note_item ?? '',
    cost_center_id: item.cost_center
      ? { label: item.cost_center.description, value: item.cost_center.uuid }
      : null,
    batches: item.batches.map((batch) => batch.uuid),
    // `GAP-NT-07` — ver LACUNA declarada, sempre `null`.
    measurement_id: null,
  };
}
