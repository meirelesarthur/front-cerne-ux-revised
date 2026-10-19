// src/constants/marcacao/marking/marking-done-status.ts
// -----------------------------------------------------------------------------
// Enum espelho de `App\Enums\MarkingDoneStatusEnum` (backend) — TASK-MC-FE-06
// (onda 2). Backed STRING (`char(1)` no schema físico, mirror EXATO de
// `App\MarkingDone::opStatus()` do legado — confirmado por leitura direta do
// enum real): `'1'`=Aberto (`OPEN`), `'2'`=Parcial (`PARTIAL`),
// `'3'`=Concluído (`DONE`). A última linha enviada com `status==='3'` promove
// `Marking::status` para Realizado no servidor (`CLM-DONE-SINGLE-CREATE`) —
// front só reflete/consome o valor, nunca recalcula a promoção.
//
// Mesma convenção de `marking-status.ts` (enum + fábrica de opções separada
// em `options/marking-done-status-options.ts`).
// -----------------------------------------------------------------------------

export const markingDoneStatus = {
  aberto: '1',
  parcial: '2',
  concluido: '3',
} as const;

export type MarkingDoneStatusValue = (typeof markingDoneStatus)[keyof typeof markingDoneStatus];
