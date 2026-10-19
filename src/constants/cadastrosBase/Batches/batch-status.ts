// src/constants/cadastrosBase/Batches/batch-status.ts
// -----------------------------------------------------------------------------
// Enum espelho de `app/Enums/BatchStatus.php` (backend) — ACTIVE='A',
// PENDING='P', INACTIVE='I', ARCHIVED='R'. A listagem só traz `A`+`P`
// (contrato v1.1 §3, D3), mas o enum completo existe porque a cor de
// `ARCHIVED`/`INACTIVE` é usada em textos de confirmação da ação Arquivar
// (M5) e em qualquer exibição pontual fora da grid padrão.
//
// Enum + `*Color` CO-LOCADOS neste arquivo (mirror `account-status.ts`,
// `get_pwa_constants_and_mappers_pattern §4`); a fábrica de opções
// (Map + getLabel/getOption/options) vive separada em `options/batch-status-options.ts`.
// -----------------------------------------------------------------------------

export const batchStatus = {
  active: 'A',
  pending: 'P',
  inactive: 'I',
  archived: 'R',
} as const;

export type BatchStatus = (typeof batchStatus)[keyof typeof batchStatus];

// Badge de status na grid — estética, sem regra de negócio.
export const batchStatusColor: Record<BatchStatus, string> = {
  A: 'green',
  P: 'yellow',
  I: 'gray',
  R: 'red',
};
