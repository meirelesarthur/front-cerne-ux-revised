// src/pages/Operacional/Reproducao/Acasalamento/acasalamento-protocol-products.ts
// -----------------------------------------------------------------------------
// Regras puras da tabela de produtos do Protocolo (UT-000705), mirror
// `_forms.blade.php:450-491` (produtos da identificação, todos selecionados) e
// `:1025-1205` (`updateTotalizers`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type {
  BreedingMatingProtocolAnimalFormValue,
  BreedingProtocolStockItem,
  BreedingSeasonCascadeContext,
  BreedingSeedStockProduct,
} from '@/@types/v2/BreedingMating';

export type ProtocolTotalizerRowInput = Partial<
  Pick<
    BreedingMatingProtocolAnimalFormValue,
    'eligible' | 'animal' | 'products' | 'semen_or_embryo'
  >
>;

export interface ProtocolTotalizerLine {
  key: string;
  label: string;
  measurementLabel: string;
  stock: number | null;
  quantity: number;
  hasStock: boolean;
  exceedsStock: boolean;
}

export function selectProtocolItemsForIdentification(
  items: BreedingProtocolStockItem[] | undefined,
  identification: string | null | undefined
): BreedingProtocolStockItem[] {
  return (items ?? []).filter(
    (item) => !!item.product && (!identification || item.identification === identification)
  );
}

export function findSeasonProtocolItems(
  context: BreedingSeasonCascadeContext | undefined,
  protocolUuid: string | null | undefined,
  identification: string | null | undefined
): BreedingProtocolStockItem[] {
  if (!protocolUuid) return [];
  const protocol = context?.protocols?.find((entry) => entry.uuid === protocolUuid);
  return selectProtocolItemsForIdentification(protocol?.items, identification);
}

export function findSeasonSeedProducts(
  context: BreedingSeasonCascadeContext | undefined,
  bullSeedSeasonUuid: string | null | undefined
): BreedingSeedStockProduct[] {
  if (!bullSeedSeasonUuid) return [];
  return (
    context?.bull_seed_seasons?.find((entry) => entry.uuid === bullSeedSeasonUuid)?.products ?? []
  );
}

export function buildProtocolProductOptions(items: BreedingProtocolStockItem[]): Option<string>[] {
  const options = new Map<string, Option<string>>();
  items.forEach((item) => {
    if (item.product && !options.has(item.product.uuid)) {
      options.set(item.product.uuid, { label: item.product.description, value: item.product.uuid });
    }
  });
  return Array.from(options.values());
}

export function buildSeedProductOptions(products: BreedingSeedStockProduct[]): Option<string>[] {
  return products.map((product) => ({ label: product.description, value: product.uuid }));
}

function isCountableRow(row: ProtocolTotalizerRowInput): boolean {
  return row.eligible !== false && !!row.animal;
}

function convertStockToItemUnit(item: BreedingProtocolStockItem): number | null {
  if (item.stock_balance === null || item.stock_balance === undefined) return null;
  const dose = Number(item.dose);
  const doseInStockUnit = Number(item.dose_in_stock_unit);
  if (dose > 0 && doseInStockUnit > 0 && dose !== doseInStockUnit) {
    return (Number(item.stock_balance) * dose) / doseInStockUnit;
  }
  return Number(item.stock_balance);
}

function finalizeLine(line: Omit<ProtocolTotalizerLine, 'exceedsStock'>): ProtocolTotalizerLine {
  return {
    ...line,
    exceedsStock: line.hasStock && line.stock !== null && line.quantity > line.stock,
  };
}

export function buildProtocolProductTotals(
  rows: ProtocolTotalizerRowInput[],
  items: BreedingProtocolStockItem[]
): ProtocolTotalizerLine[] {
  const totals = new Map<string, Omit<ProtocolTotalizerLine, 'exceedsStock'>>();

  rows.filter(isCountableRow).forEach((row) => {
    (row.products ?? []).forEach((selected) => {
      const item = items.find((entry) => entry.product?.uuid === selected.value);
      if (!item || !item.product) return;

      const key = `${item.product.uuid}_${item.warehouse?.uuid ?? 'no_warehouse'}`;
      const dose = Number(item.dose) || 1;
      const existing = totals.get(key);
      if (existing) {
        existing.quantity += dose;
        return;
      }

      const stock = convertStockToItemUnit(item);
      totals.set(key, {
        key,
        label: item.product_description || item.product.description,
        measurementLabel: item.measurement ?? item.product_measurement ?? '—',
        stock,
        quantity: dose,
        hasStock: item.has_valid_stock && !!item.warehouse && stock !== null,
      });
    });
  });

  return Array.from(totals.values()).map(finalizeLine);
}

export function buildSeedProductTotals(
  rows: ProtocolTotalizerRowInput[],
  products: BreedingSeedStockProduct[]
): ProtocolTotalizerLine[] {
  const totals = new Map<string, Omit<ProtocolTotalizerLine, 'exceedsStock'>>();

  rows.filter(isCountableRow).forEach((row) => {
    const seedUuid = row.semen_or_embryo?.value;
    if (!seedUuid) return;
    const product = products.find((entry) => entry.uuid === seedUuid);
    if (!product) return;

    const key = `${product.uuid}_${product.warehouse?.uuid ?? 'no_warehouse'}`;
    const dose = Number(product.dose) || 1;
    const existing = totals.get(key);
    if (existing) {
      existing.quantity += dose;
      return;
    }

    const stock = product.has_valid_stock ? Number(product.stock_balance ?? 0) : null;
    totals.set(key, {
      key,
      label: product.description,
      measurementLabel: product.measurement_name ?? '—',
      stock,
      quantity: dose,
      hasStock: product.has_valid_stock && stock !== null,
    });
  });

  return Array.from(totals.values()).map(finalizeLine);
}
