// src/constants/fiscal/cteManifestacao/cte-manifestacao-tipo-classification.ts
// Mapeamento `tipo` → slot de `ClassificationBadge` (TASK-CTE-FE-12, roteiro:
// "Badge de tipo usa classification.* tokens", "Badge amarelo/azul —
// manifesto"). Mirror do padrão já usado em `cte-estado-classification.ts`/
// `dfe-manifest-event.ts` — nunca `colorPalette` fixo.
//
// `App\Enums\CteManifestaTipo`: 0=Pendente (ainda precisa manifestar —
// amarelo, chama atenção), 1=Desacordo (já manifestado — azul, informativo).

import type { ClassificationSlot } from '@/constants/Fiscal/dfe/dfe-manifest-event';

import type { CteManifestacaoTipo } from '@/@types/v2/Fiscal/cteManifestacao';

export const cteManifestacaoTipoClassification: Record<CteManifestacaoTipo, ClassificationSlot> = {
  0: 'slot6', // Pendente — amarelo
  1: 'slot1', // Desacordo (manifestado) — azul
};

export const getCteManifestacaoTipoSlot = (tipo?: number): ClassificationSlot =>
  tipo === 0 || tipo === 1 ? cteManifestacaoTipoClassification[tipo] : 'neutral';
