// src/constants/Marker/marker-type.ts
// -----------------------------------------------------------------------------
// Enum de negócio `type` do Marcador (Marker) — TASK-MK-FE-01.
// Espelha `App\Enums\MarkerTypeEnum` (api_root): ACTIVITY=1/INFRASTRUCTURE=2.
// Enviado/lido sempre como INTEIRO (nunca o nome do case) — armadilha #2 do
// task-packet, já responsável por 422 real em PlanAccount/CategoryProduct.
// -----------------------------------------------------------------------------

export const markerType = { activity: 1, infrastructure: 2 } as const;

export type MarkerType = (typeof markerType)[keyof typeof markerType];
