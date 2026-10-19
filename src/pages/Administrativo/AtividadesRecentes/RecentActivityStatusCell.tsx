// src/pages/Administrativo/AtividadesRecentes/RecentActivityStatusCell.tsx
// Célula da coluna "Status" (D-092-13): badge de domínio, texto de auditoria ou "—".

import { Badge, Box, Text } from '@chakra-ui/react';

import { getRecentActivityStatusView } from '@/constants/RecentActivities/recent-activity-status';

import type { LanguageDate } from '@/@types/language';
import type { RecentActivityListItem } from '@/@types/v2/RecentActivities';

interface RecentActivityStatusCellProps {
  item: RecentActivityListItem;
  languageGB: LanguageDate;
}

export function RecentActivityStatusCell({ item, languageGB }: RecentActivityStatusCellProps) {
  const view = getRecentActivityStatusView(item, languageGB);

  if (view.kind === 'empty') {
    return (
      <Text fontSize="sm" color="fg.muted">
        —
      </Text>
    );
  }

  if (view.kind === 'text') {
    return (
      // Pode quebrar em 2 linhas ("Criado em" / data) quando a coluna é estreita.
      <Text fontSize="xs" lineHeight="short" color="fg.muted" whiteSpace="normal">
        {view.text}
      </Text>
    );
  }

  // Hex da API: ponto colorido + fundo neutro (contraste seguro em light/dark).
  if (view.color.kind === 'hex') {
    return (
      <Badge variant="subtle" colorPalette="gray" gap={1.5} data-status-color={view.color.value}>
        <Box
          as="span"
          boxSize={2}
          borderRadius="full"
          flexShrink={0}
          style={{ backgroundColor: view.color.value }}
          aria-hidden="true"
        />
        {view.label}
      </Badge>
    );
  }

  return (
    <Badge variant="subtle" colorPalette={view.color.value}>
      {view.label}
    </Badge>
  );
}
