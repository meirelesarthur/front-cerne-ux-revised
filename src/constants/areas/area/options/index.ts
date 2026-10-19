// src/constants/areas/area/options/index.ts
// Barrel export das fábricas de options do módulo Áreas (TASK-FE-415).
// `recreation_area`/`is_enabled` (booleanos) reusam a fábrica GLOBAL
// `@/constants/options/boolean` (`boolean`) — sem fábrica local dedicada,
// mirror do racional já aplicado a outros módulos deste fork.

export { areaColorOptions } from './area-color-options';
export { areaTypeOptions } from './area-type-options';
