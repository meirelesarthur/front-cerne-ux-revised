// src/constants/ModuleWeighing/module-weighing-status.ts
// Enum `status` de ModuleWeighing (Pesagem Rodoviária — Operacional,
// execução 044, F-045, TASK-MWG-FE-02). Mirror EXATO de
// `App\Enums\ModuleWeighingStatus` (backend, int-backed,
// `CONTRATO-API-PESAGEM.md §3`) — 5 valores fechados, também tipados como
// union em `@/@types/v2/ModuleWeighing/module-weighing.ts`
// (`ModuleWeighingStatus`, fonte única do tipo — este arquivo só acrescenta
// o valor RUNTIME + o mapa de cor, `get_pwa_constants_and_mappers_pattern §3`).
//
// `moduleWeighingStatusColor` — sugestão visual do Executor (não é regra de
// negócio, mirror `orderStatusColor`) — usada no dot indicator da coluna
// LM-001 (`formatting: status_color`, contrato-pesagem-norm.md).

import type { ModuleWeighingStatus } from '@/@types/v2/ModuleWeighing/module-weighing';

export const moduleWeighingStatus = {
  preCadastro: 1,
  pesagemInicial: 2,
  classificacao: 3,
  pesagemFinal: 4,
  finalizado: 5,
} as const;

export const moduleWeighingStatusColor: Record<ModuleWeighingStatus, string> = {
  1: 'gray',
  2: 'blue',
  3: 'purple',
  4: 'orange',
  5: 'green',
};
