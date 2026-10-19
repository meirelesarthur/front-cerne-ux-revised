// src/pages/Operacional/Appropriations/useAppropriateItems.tsx
// -----------------------------------------------------------------------------
// Deriva 3 listas AGRUPADAS por seção rateável do legado a partir de
// `AppropriationDetail` — `{ labor, equipment, stock }` — TASK-FE-720
// (execução 034, rodada "REDESIGN COMPLETO Apropriar"). Supersede o shape
// PLANO anterior (`AppropriateFlatItem[]` único, TASK-FE-711): o legado
// (`appropriation.blade.php`, 263 linhas) tem 3 blocos visuais distintos, cada
// um com campos readonly PRÓPRIOS (Executador+Un.Med. / Máq.Equip.+Un.Med.+
// VL.Hora / Armazém+Produto+Un.Med.) — uma lista plana com 1 label genérico
// não consegue expressar isso, por isso cada item já sai daqui com os
// rótulos de exibição PRONTOS (sem a tela precisar montar `typeLabels`/
// concatenar strings).
//
// Produção continua EXCLUÍDA (fidelidade ao legado, Doc Bruta 07 §8.2, 3
// evidências já citadas em `TASK-FE-711`, agora supersedida por esta
// Tarefa): `appropriation.blade.php` não itera `productions`;
// `AppropriationController::appropriation()` (GET) não carrega `productions`;
// `::appropriate()` (PUT) carrega mas nunca usa — Produção não é rateável por
// Centro de Custo no legado. `detail.production_items` nunca é lido aqui.
//
// `reference_uuid` é o uuid do PRÓPRIO item já lançado (produto/equipamento/
// pessoa), presente na resposta de cada coleção:
//   stock_items[].product.uuid · equipment_items[].equipment.uuid ·
//   labor_items[].person.uuid
// `equipment[].currentAmount` = `equipment_items[].amount` — valor ATUAL de
// VL. Hora do equipamento (mirror `appropriation.blade.php:154`,
// `->value(money($equipment->pivot->amount))`), hidrata o `NumberInput` de
// `TASK-FE-722` (não `total_amount`, não `quantity`).
// `labor[].type` já vem normalizado (`labor_items[].type`,
// `'employee'|'function'|'provider'`) — compatível 1:1 com os 3 valores
// esperados pelo `AppropriateAppropriationRequest`.
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import type { AppropriationDetail } from '@/@types/v2/Appropriations';

export interface AppropriateLaborFlatItem {
  type: 'employee' | 'function' | 'provider';
  reference_uuid: string;
  /** `labor_items[].person.name`. */
  executorLabel: string;
  /** `labor_items[].measurement?.description ?? '—'` (TASK-FE-751 — antes `.name`). */
  measurementLabel: string;
}

export interface AppropriateEquipmentFlatItem {
  reference_uuid: string;
  /** `equipment_items[].equipment.description`. */
  equipmentLabel: string;
  /** `equipment_items[].measurement?.description ?? '—'` (TASK-FE-751 — antes `.name`). */
  measurementLabel: string;
  /** `equipment_items[].amount` — VL. Hora ATUAL, hidrata o `NumberInput` de `TASK-FE-722`. */
  currentAmount: number;
}

export interface AppropriateStockFlatItem {
  reference_uuid: string;
  /** `stock_items[].warehouse?.description ?? '—'`. */
  warehouseLabel: string;
  /** `stock_items[].product.description`. */
  productLabel: string;
  /** `stock_items[].measurement?.description ?? '—'` (TASK-FE-751 — antes `.name`). */
  measurementLabel: string;
}

export interface AppropriateGroupedItems {
  labor: AppropriateLaborFlatItem[];
  equipment: AppropriateEquipmentFlatItem[];
  stock: AppropriateStockFlatItem[];
}

export function useAppropriateItems(
  detail: AppropriationDetail | undefined
): AppropriateGroupedItems {
  return useMemo(() => {
    if (!detail) return { labor: [], equipment: [], stock: [] };

    const labor: AppropriateLaborFlatItem[] = detail.labor_items.map((item) => ({
      type: item.type,
      reference_uuid: item.person.uuid,
      executorLabel: item.person.name,
      // TASK-FE-751 (destravada por ERRO-BE-018) — `description` (texto
      // completo) no lugar de `name` (abreviação); fallback por segurança.
      measurementLabel: item.measurement?.description || item.measurement?.name || '—',
    }));

    const equipment: AppropriateEquipmentFlatItem[] = detail.equipment_items.map((item) => ({
      reference_uuid: item.equipment.uuid,
      equipmentLabel: item.equipment.description,
      measurementLabel: item.measurement?.description || item.measurement?.name || '—',
      currentAmount: item.amount,
    }));

    const stock: AppropriateStockFlatItem[] = detail.stock_items.map((item) => ({
      reference_uuid: item.product.uuid,
      warehouseLabel: item.warehouse?.description ?? '—',
      productLabel: item.product.description,
      measurementLabel: item.measurement?.description || item.measurement?.name || '—',
    }));

    return { labor, equipment, stock };
  }, [detail]);
}
