// src/constants/Fiscal/dfe/dfe-manifest-event.ts
// Enum do evento de manifestação SEFAZ (Dfe — domínio Fiscal, execução 044,
// TASK-DFE-FE-03). Mirror do backend `App\Enums\DfeManifestEventEnum`
// (`CONTRATO-API-DFE.md §3.3`): Ciencia=1, Confirmacao=2, Desconhecimento=3,
// OperacaoNaoRealizada=4. Consumido pelo modal de manifestação
// (TASK-DFE-FE-06, `dfeManifestEventOptions` factory) e pelo badge de
// manifesto da grid (TASK-DFE-FE-05, `tipo_evento` inclui também `0` =
// "não manifestada", fora deste enum de AÇÃO — ver `dfe-status-options.ts`
// para o domínio completo 0..4 do filtro/badge).

export const dfeManifestEvent = {
  Ciencia: 1,
  Confirmacao: 2,
  Desconhecimento: 3,
  NaoRealizada: 4,
} as const;

export type DfeManifestEventValue = (typeof dfeManifestEvent)[keyof typeof dfeManifestEvent];

// ----------------------------------------------------------------------------
// Mapeamento categoria → slot de classificação (`classification.{slot}.*`,
// `get_pwa_ui_components_pattern §12.6-bis`/`§45`) — cor NUNCA `colorPalette`
// nem `feedBack.*` para categoria/manifesto (é taxonomia de domínio, não
// resultado de ação).
//
// LACUNA REGISTRADA (Lei do Registro de Lacuna): os tokens `classification.
// slot1..slot8`/`neutral` (bg/fg/border) NÃO existem ainda em
// `src/styles/theme/semantic/{light,dark}.ts` — nenhum módulo do projeto
// implementou o Badge de Classificação até esta Tarefa (`ClassificationBadge`
// também não existe em `src/components/`). Este mapa fica PRONTO (dado puro,
// sem custo de manter) para quando TASK-DFE-FE-05 renderizar o badge "Prazo
// Manifesto"/"Manifesto" — a Tarefa consumidora deve, antes de usar,
// confirmar/adicionar os tokens no tema (ou registrar um novo Gap se decidir
// não introduzir a paleta agora). Incluir `0` (não manifestada), fora do
// enum de AÇÃO acima, pois é o valor real de `DfeListItem.tipo_evento`.
// ----------------------------------------------------------------------------

export type ClassificationSlot =
  'slot1' | 'slot2' | 'slot3' | 'slot4' | 'slot5' | 'slot6' | 'slot7' | 'slot8' | 'neutral';

export const dfeManifestEventColor: Record<0 | DfeManifestEventValue, ClassificationSlot> = {
  0: 'neutral', // não manifestada
  [dfeManifestEvent.Ciencia]: 'slot1',
  [dfeManifestEvent.Confirmacao]: 'slot2',
  [dfeManifestEvent.Desconhecimento]: 'slot3',
  [dfeManifestEvent.NaoRealizada]: 'slot4',
};

export const getDfeManifestEventSlot = (tipoEvento?: number): ClassificationSlot =>
  (tipoEvento !== undefined &&
    tipoEvento in dfeManifestEventColor &&
    dfeManifestEventColor[tipoEvento as 0 | DfeManifestEventValue]) ||
  'neutral';
