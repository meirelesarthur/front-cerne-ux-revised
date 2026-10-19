// src/pages/Fiscal/NfeEmitidas/nfe-event-limits.ts
// -----------------------------------------------------------------------------
// Limites do `motivo` dos eventos fiscais da NF-e (UT-000748 / T-748-API-02,
// mirror 1:1 de `NfeEventRequest`): cancelamento 15..255, CC-e 15..1000.
// -----------------------------------------------------------------------------

export const NFE_EVENT_MOTIVO_MIN = 15;
export const NFE_CANCEL_MOTIVO_MAX = 255;
export const NFE_CORRECTION_MOTIVO_MAX = 1000;
