// src/constants/options/years.ts
// -----------------------------------------------------------------------------
// Fábrica de opções de ano — mirror `months.ts` (fábrica tipada de opções,
// `get_pwa_constants_and_mappers_pattern §13`), diferença: SEM tradução (o
// rótulo é o próprio número, "ano" não tem forma linguística por locale).
//
// Primeiro uso: DRE Anual (F-258, TASK-DRE-FE-03, esteira 049), Select de
// `start_year`/`end_year`. Piso e teto NÃO são hardcoded aqui — recebidos por
// parâmetro pelo caller para manter a fábrica pura/testável
// (`yearOptions(2022, 2026)` determinístico, sem depender de `Date.now()`
// dentro do próprio arquivo). O piso default usado pela tela de DRE Anual
// (2022) é uma constante de negócio documentada no PONTO DE USO
// (`Dre/DreAnual/index.tsx`, `contrato-tela-dre-anual-fe.md` LC-FE-08), não
// aqui — "ano" não é conceito exclusivo da DRE, mirror do racional de
// `monthsOptions` já ser global.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export function yearOptions(floor: number, ceil: number): Option<number>[] {
  const options: Option<number>[] = [];
  for (let year = floor; year <= ceil; year += 1) {
    options.push({ label: String(year), value: year });
  }
  return options;
}
