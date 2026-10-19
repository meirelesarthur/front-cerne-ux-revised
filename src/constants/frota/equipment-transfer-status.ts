// src/constants/frota/equipment-transfer-status.ts
// -----------------------------------------------------------------------------
// Espelho de `DB-ENUM-01` (EquipmentTransfer::status(), backend) — usado
// SOMENTE pela legenda da listagem (`etr-status-legend`). A célula da grid
// NUNCA usa este arquivo: consome `status.label`/`status.color` diretamente
// da resposta da API (fid-g3f-transferencia-maquinas.md §FE-08).
//
// Os hex abaixo são DADO DO CONTRATO DE API (`DB-ENUM-01`), não decisão de
// tema — é o ÚNICO ponto desta feature com hex literal, justificado como
// espelho de contrato (DEC-FE-ETR-04).
//
// PROIBIDO adicionar um 4º estado ("Em Processamento", `#ff9900`): a Blade
// legada desenhava 4 estados na legenda mas `EquipmentTransfer::status()` só
// mapeia 3 chaves reais (CL-16/OQ-06) — OD-004 mandou corrigir. NÃO copiar
// `TransferAnimalFarmStatus` (feature vizinha, 4 casos, `2 = Em
// Processamento` laranja) — aqui `2 = Finalizado`.
//
// Rótulos NUNCA ficam aqui — vêm sempre de `languageGB.equipmentTransfers.
// equipmentTransfer.list.legend.*` (i18n, Lei 10).
// -----------------------------------------------------------------------------

export interface EquipmentTransferStatusLegendItem {
  value: 1 | 2 | 3;
  color: string;
}

export const EQUIPMENT_TRANSFER_STATUS_LEGEND: EquipmentTransferStatusLegendItem[] = [
  { value: 1, color: '#b1b1b1' }, // Em Aberto
  { value: 2, color: '#1cc872' }, // Finalizado — NÃO "Em Processamento"
  { value: 3, color: '#ff0000' }, // Cancelado
];
