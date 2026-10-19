// src/pages/Operacional/PesagemRodoviaria/components/ScaleConnectionBadge.tsx
// -----------------------------------------------------------------------------
// Indicador de status mínimo do `useModuleWeighingScale` (TASK-MWG-FE-04) —
// reaproveitável pelas telas que consomem o hook (wizard, `TASK-MWG-FE-05`/
// `06`; diálogo tutorial, `TASK-MWG-FE-12`). Não abre conexão por conta
// própria — só reflete o `status` já produzido pelo consumidor do hook.
// -----------------------------------------------------------------------------

import { Badge } from '@chakra-ui/react';

import type { ModuleWeighingScaleStatus } from '../hooks/useModuleWeighingScale';

export interface ScaleConnectionBadgeProps {
  status: ModuleWeighingScaleStatus;
  labels: {
    connecting: string;
    connected: string;
    disconnected: string;
  };
}

const STATUS_COLOR: Record<ModuleWeighingScaleStatus, string> = {
  connecting: 'yellow',
  connected: 'green',
  disconnected: 'gray',
};

export function ScaleConnectionBadge({ status, labels }: ScaleConnectionBadgeProps) {
  return (
    <Badge colorPalette={STATUS_COLOR[status]} variant="subtle">
      {labels[status]}
    </Badge>
  );
}

export default ScaleConnectionBadge;
