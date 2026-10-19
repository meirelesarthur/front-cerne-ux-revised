// src/constants/operacional/reproducao/protocolSeason/protocol-item-service.ts
// -----------------------------------------------------------------------------
// Enum de serviço do item de protocolo (LKP-009) — 4 valores fixos
// hardcoded, `NAO_APLICAVEL` como endpoint (contrato-frontend §2.4). Mirror
// `ProtocolItemServiceEnum` do backend (`app/Enums/ProtocolItemServiceEnum.php`,
// backed `int`, valores 1..4 idênticos).
//
// RUNTIME const — vive em `src/constants/` (get_pwa_constants_and_mappers_
// pattern §2: enum + fábrica de opções CO-LOCADOS), NUNCA em `@/@types/` (um
// `.d.ts` é ambient-only; Rollup/Vite não o bundla como módulo real — um
// `export const` com valor lá quebra o `vite build` de produção).
// -----------------------------------------------------------------------------

export const PROTOCOL_ITEM_SERVICE = {
  Insemination: 1,
  Ultrasound: 2,
  PregnancyDiagnosis: 3,
  ImplantRemoval: 4,
} as const;

export type ProtocolItemService =
  (typeof PROTOCOL_ITEM_SERVICE)[keyof typeof PROTOCOL_ITEM_SERVICE];
