// src/constants/RecentActivities/recent-activity-type.ts
// -----------------------------------------------------------------------------
// Enum `RecentActivityType` (UT-000690 / F-349 Atividades Recentes) — os 19
// tipos ATIVOS do contrato da API (ARQ-API-UT690 §2). Os 4 tipos excluídos
// pelo dono (D-092-06: registrar animal, rebanho inicial, trato diário e
// leitura de cocho) NÃO existem aqui de propósito.
// -----------------------------------------------------------------------------

export const recentActivityType = {
  serviceOrder: 'service_order',
  animalBatchTransfer: 'animal_batch_transfer',
  batchAreaTransfer: 'batch_area_transfer',
  separation: 'separation',
  deathAnimal: 'death_animal',
  lossAnimal: 'loss_animal',
  birthAnimal: 'birth_animal',
  weaning: 'weaning',
  weighing: 'weighing',
  sanitary: 'sanitary',
  pasture: 'pasture',
  dietBeat: 'diet_beat',
  feeding: 'feeding',
  appropriation: 'appropriation',
  marking: 'marking',
  breedingMating: 'breeding_mating',
  pregnancyDiagnosis: 'pregnancy_diagnosis',
  supply: 'supply',
  maintenance: 'maintenance',
} as const;

export type RecentActivityType = (typeof recentActivityType)[keyof typeof recentActivityType];
