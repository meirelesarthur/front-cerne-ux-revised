// src/pages/Administrativo/AtividadesRecentes/OpenRecentActivityAction.tsx
// -----------------------------------------------------------------------------
// Botão "Abrir" de uma linha de Atividades Recentes (TC-ACT-01..04, ARQ-FE §5).
//   - `spa_path` ausente/inseguro → desabilitado + `Tooltip` + `aria-disabled`.
//   - linha em abertura (troca de fazenda) → loading; as demais → desabilitadas.
// A lógica vive em `hooks/useOpenRecentActivity` (injetada por props).
// -----------------------------------------------------------------------------

import { Box, Button } from '@chakra-ui/react';

import { Tooltip } from '@/components/ui/tooltip';

import type { LanguageDate } from '@/@types/language';
import type { RecentActivityListItem } from '@/@types/v2/RecentActivities';

import { isSafeSpaPath, recentActivityRowKey } from './hooks/useOpenRecentActivity';

interface OpenRecentActivityActionProps {
  item: RecentActivityListItem;
  languageGB: LanguageDate;
  /** Chave (`type:uuid`) da linha em abertura, ou `null`. */
  openingKey: string | null;
  onOpen: (item: RecentActivityListItem) => void;
}

export function OpenRecentActivityAction({
  item,
  languageGB,
  openingKey,
  onOpen,
}: OpenRecentActivityActionProps) {
  const text = languageGB.recentActivities.recentActivity.list.actions;
  const available = isSafeSpaPath(item.spa_path);
  const isOpeningThis = openingKey === recentActivityRowKey(item);
  const isBusyElsewhere = openingKey !== null && !isOpeningThis;
  const disabled = !available || isBusyElsewhere;

  return (
    <Tooltip content={text.openUnavailable} disabled={available}>
      {/* span garante o hover do tooltip mesmo com o botão desabilitado */}
      <Box as="span" display="inline-block">
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          aria-disabled={disabled}
          loading={isOpeningThis}
          loadingText={text.opening}
          onClick={() => onOpen(item)}
        >
          {text.open}
        </Button>
      </Box>
    </Tooltip>
  );
}
