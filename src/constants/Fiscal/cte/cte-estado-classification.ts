// src/constants/fiscal/cte/cte-estado-classification.ts
// Mapeamento `estado` → slot de `ClassificationBadge` (TASK-CTE-FE-02, DoD:
// "badge de estado usa `classification.*` com fallback `neutral`", nunca
// `colorPalette` fixo). Mirror EXATO de `App\Enums\CteEstado::color()`
// (backend): novo=neutral(gray), aprovado=slot2(green), rejeitado=slot4(red),
// cancelado=slot3(orange) — mesma taxonomia de cor, adaptada aos slots já
// existentes em `classification.*` (`src/styles/theme/semantic/{light,dark}.ts`,
// introduzidos na execução 044/Dfe).

import type { ClassificationSlot } from '@/constants/Fiscal/dfe/dfe-manifest-event';

import type { CteEstado } from '@/@types/v2/Fiscal/cte';

export const cteEstadoClassification: Record<CteEstado, ClassificationSlot> = {
  novo: 'neutral',
  aprovado: 'slot2',
  rejeitado: 'slot4',
  cancelado: 'slot3',
};

export const getCteEstadoSlot = (estado?: string): ClassificationSlot =>
  estado && estado in cteEstadoClassification
    ? cteEstadoClassification[estado as CteEstado]
    : 'neutral';
