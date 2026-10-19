// src/constants/Separations/separation-processing-status.ts
// -----------------------------------------------------------------------------
// Mapper booleano→label+cor de `finished_processing` (Separation — Operacional
// > Pecuária, 97-Esteiras/005 Tarefa 24, frontend-contract-apartacao.md §5).
//
// Co-locado (mapa de cor) mirror `batch-status.ts`
// (get_pwa_constants_and_mappers_pattern §4/§5.1) — o rótulo vem de
// `languageGB.separations.separation.list.table.processingStatus` (i18n,
// nunca hardcoded); a cor é decisão puramente estética, sem regra de negócio.
// Usado tanto na Listagem quanto no Detalhe (mesmo Badge, mesma fonte).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';

export const separationProcessingStatusColor: Record<'processed' | 'pending', string> = {
  processed: 'green',
  pending: 'yellow',
};

function getLabel(finishedProcessing: boolean, languageGB: LanguageDate): string {
  const text = languageGB.separations.separation.list.table.processingStatus;
  return finishedProcessing ? text.processed : text.pending;
}

function getColor(finishedProcessing: boolean): string {
  return finishedProcessing
    ? separationProcessingStatusColor.processed
    : separationProcessingStatusColor.pending;
}

export const separationProcessingStatus = { getLabel, getColor };
