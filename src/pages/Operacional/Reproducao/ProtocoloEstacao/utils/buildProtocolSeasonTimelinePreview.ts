// src/pages/Operacional/Reproducao/ProtocoloEstacao/utils/buildProtocolSeasonTimelinePreview.ts
// -----------------------------------------------------------------------------
// CAL-006 — preview de timeline client-side (SURF-018), agrupamento por
// `date` com `interval_days` (contra o grupo anterior) e `weekday`, mirror EXATO
// do algoritmo server-side `BuildProtocolSeasonTimelineAction` (CAL-007) —
// porém aplicado sobre itens AINDA NÃO PERSISTIDOS (formulário de criação/
// edição), sem depender de um `GET show` que ainda não existe.
//
// Função PURA — sem dependência de React/RHF, só usada pelo componente de
// preview (`ProtocolSeasonTimelinePreview.tsx`) com debounce.
// -----------------------------------------------------------------------------

import type {
  ProtocolItemData,
  ProtocolSeasonTimelineGroup,
} from '@/@types/v2/Operacional/Reproducao/protocolSeason';

import { daysBetween } from './computeProtocolIdentification';

export function buildProtocolSeasonTimelinePreview(
  items: ProtocolItemData[]
): ProtocolSeasonTimelineGroup[] {
  const byDate = new Map<string, ProtocolItemData[]>();

  items.forEach((item) => {
    if (!item.date) return;
    const bucket = byDate.get(item.date) ?? [];
    bucket.push(item);
    byDate.set(item.date, bucket);
  });

  const sortedDates = Array.from(byDate.keys()).sort();

  let previousDate: string | null = null;

  return sortedDates.map((date) => {
    const intervalDays = previousDate ? daysBetween(previousDate, date) : null;
    previousDate = date;
    const weekday = new Date(`${date}T00:00:00`).getDay();

    return {
      date,
      interval_days: intervalDays,
      weekday,
      items: byDate.get(date)!,
    };
  });
}

export default buildProtocolSeasonTimelinePreview;
