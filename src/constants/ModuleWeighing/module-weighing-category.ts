// src/constants/ModuleWeighing/module-weighing-category.ts
// Enum `category` de ModuleWeighing (Pesagem Rodoviária — Operacional,
// execução 044, F-045, TASK-MWG-FE-02). Mirror EXATO de
// `App\Enums\ModuleWeighingCategory` (backend, string-backed,
// `CONTRATO-API-PESAGEM.md §3`) — 2 valores fechados ('E' default/'I'),
// também tipados como union em
// `@/@types/v2/ModuleWeighing/module-weighing.ts` (`ModuleWeighingCategory`).
// Usado na coluna LM-008 (`formatting: enum_label`) e na condicional
// `client_uuid` obrigatório (`category=Externa`, form/schema da Tarefa 03).

export const moduleWeighingCategory = {
  externa: 'E',
  interna: 'I',
} as const;
