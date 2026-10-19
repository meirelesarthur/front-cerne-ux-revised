// src/constants/FamilyEquipmentDepreciationType.ts
// Mapa local de constantes do enum de depreciação de FamilyEquipment —
// espelha EXATAMENTE app/Enums/FamilyEquipmentDepreciationType.php (api_root):
// `SEM_RESIDUAL = 0`, `COM_RESIDUAL = 1` (DA-FE-15, mapeamento
// confirmado/corrigido — NUNCA inverter, quebraria a leitura de todo registro
// `family_equipments.type_depreciation` já existente).

export const FamilyEquipmentDepreciationType = {
  SEM_RESIDUAL: 0,
  COM_RESIDUAL: 1,
} as const;

export type FamilyEquipmentDepreciationTypeValue =
  (typeof FamilyEquipmentDepreciationType)[keyof typeof FamilyEquipmentDepreciationType];
