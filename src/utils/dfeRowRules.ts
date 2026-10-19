// src/utils/dfeRowRules.ts
// -----------------------------------------------------------------------------
// Regras PURAS de elegibilidade por linha da grid de DFe Recebidas (UT-000752,
// T-752-FE-01; matriz C-24 do contrato legado FIS20). Extraído de
// `pages/Fiscal/Dfe/index.tsx` para ser testável sem render. `tipo_evento`:
// 0 = não manifestada, 1 = Ciência, 2 = Confirmação, 3 = Desconhecimento,
// 4 = Operação não realizada. NÃO usa `@/utils/isEmpty` (ERRO-FE-001).
// -----------------------------------------------------------------------------

import type { DfeListItem } from '@/@types/v2/Fiscal/dfe';

type RowRuleInput = Pick<
  DfeListItem,
  'tipo_evento' | 'launched_in' | 'is_personal' | 'is_shipment'
>;

// Checkbox / seleção em lote: só `tipo_evento ∈ {0,1}` (C-23/IG-06).
export function isRowSelectable(tipoEvento: number): boolean {
  return tipoEvento === 0 || tipoEvento === 1;
}

// Manifestar por LINHA: legado oferece para `tipo_evento ∈ {0,1,3,4}` (C-24).
export function canManifestRow(tipoEvento: number): boolean {
  return [0, 1, 3, 4].includes(tipoEvento);
}

// Elegibilidade comum aos lançamentos: `{1,2}`, não lançada, !pessoal, !remessa.
export function isLaunchEligible(item: RowRuleInput): boolean {
  return (
    [1, 2].includes(item.tipo_evento) &&
    item.launched_in === null &&
    !item.is_personal &&
    !item.is_shipment
  );
}

// Lançar Produto / Animal: `tipo !== '0'` + elegibilidade comum.
export function canLaunchInvoiceOrAnimal(item: RowRuleInput & Pick<DfeListItem, 'tipo'>): boolean {
  return item.tipo !== '0' && isLaunchEligible(item);
}

// Lançar Retorno: `tipo === '0'` + elegibilidade comum.
export function canLaunchReturn(item: RowRuleInput & Pick<DfeListItem, 'tipo'>): boolean {
  return item.tipo === '0' && isLaunchEligible(item);
}

// DANFE / XML: `tipo_evento ∈ {1,2,3}`.
export function canDocuments(tipoEvento: number): boolean {
  return [1, 2, 3].includes(tipoEvento);
}

// Toggle Pessoal: oculto se lançada ou marcada como remessa.
export function canTogglePersonal(item: Pick<DfeListItem, 'launched_in' | 'is_shipment'>): boolean {
  return !(item.launched_in !== null || item.is_shipment);
}

// Toggle Remessa: oculto se lançada ou marcada como pessoal.
export function canToggleShipment(item: Pick<DfeListItem, 'launched_in' | 'is_personal'>): boolean {
  return !(item.launched_in !== null || item.is_personal);
}
