// src/utils/dateOnlyToYmd.ts
// Normaliza uma data-calendário (string `Y-m-d`/ISO ou `Date`) para
// `yyyy-MM-dd`, SEM conversão de fuso horário — usado por telas que enviam
// filtro de data direto a endpoints que só aceitam `Y-m-d` puro (ex.:
// Programa ABC Corte, `GAP-FE-247`).
//
// Duas origens possíveis para o valor:
//   - `string` `Y-m-d`/ISO: já é a data de calendário correta — usa o
//     prefixo direto (`slice`), sem `parseISO`+`format` (evitaria uma volta
//     desnecessária por fuso local). ISO fora do padrão cai no parse do
//     date-fns.
//   - `Date`: SEMPRE originada de `new Date('yyyy-MM-dd')` — o motor JS
//     interpreta essa forma como MEIA-NOITE UTC (não local). Usar
//     getters locais (`format` do date-fns, `getDate()`) deslocaria o dia
//     em fusos negativos (ex. `America/Sao_Paulo`, UTC-3: 2026-01-01T00:00Z
//     vira 31/12/2025 23:00 local). `toISOString().slice(0, 10)` lê os
//     componentes UTC originais, sem esse deslocamento.
//
// Consumida por `FilterSideAbcIndicators` (cascata Safra→datas,
// `ABC-CASCADE-01`) e por `AbcIndicators/index.tsx` (montagem do request) —
// esta última PRECISA do fallback `Date`: `usePaginatedQueryUrl`
// (`reviveFilterData`) reidrata `startDate`/`endDate` como `Date` a cada
// sincronização com a URL, mesmo já normalizados para `yyyy-MM-dd` na
// cascata (o `axios` serializaria esse `Date` via `toISOString()` completo,
// que o backend rejeita com 422 "não corresponde ao formato Y-m-d").

import { format, isValid, parseISO } from 'date-fns';

export function dateOnlyToYmd(value: string | Date | null | undefined): string | null {
  if (!value) return null;

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    const parsed = parseISO(value);
    return isValid(parsed) ? format(parsed, 'yyyy-MM-dd') : null;
  }

  return isValid(value) ? value.toISOString().slice(0, 10) : null;
}
