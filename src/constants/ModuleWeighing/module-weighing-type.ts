// src/constants/ModuleWeighing/module-weighing-type.ts
// Enum `type` de ModuleWeighing (Pesagem Rodoviária — Operacional, execução
// 044, F-045, TASK-MWG-FE-02). Mirror EXATO de `App\Enums\ModuleWeighingType`
// (backend, int-backed, `CONTRATO-API-PESAGEM.md §3`) — 5 valores fechados,
// também tipados como union em
// `@/@types/v2/ModuleWeighing/module-weighing.ts` (`ModuleWeighingType`).
// Usado na coluna LM-007 (`formatting: enum_label`) e nas condicionais de
// tipo do form/wizard (Tarefas 03/05/07).

export const moduleWeighingType = {
  vendaSaida: 0,
  compraEntrada: 1,
  avulsa: 2,
  entradaColheita: 3,
  entradaTerceiros: 4,
} as const;
