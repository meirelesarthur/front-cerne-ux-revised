// src/pages/Dashboards/FeedlotDashboard/blocks/HistoricoStatus.tsx
// Bloco "Histórico recente de status" (`LC-TABLE-01`, execução 046,
// TASK-LC-FE-08) — grid `1fr 2fr 1fr`: Curral | Badge(de)→Badge(para) | Data.
// Fonte real do fork (`feedlot_corral_status_histories`), ver
// `CONTRATO-API-046-02-feedlot-dashboard.md §4`.

import { Badge, Flex, Grid, Text } from '@chakra-ui/react';
import { FiArrowRight } from 'react-icons/fi';

import { DashboardCard } from '@/components/Dashboard';
import { Icon } from '@/components/Icon';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import { feedlotCorralStatusColor } from '@/constants/FeedlotCorrals/feedlot-corral-status-color';
import { feedlotCorralStatusOptions } from '@/constants/FeedlotCorrals/options/feedlot-corral-status-options';
import type { FeedlotCorralStatusValue } from '@/constants/FeedlotMap/feedlot-corral-status';

import type { LanguageDate } from '@/@types/language';
import type { FeedlotStatusHistoryRow } from '@/@types/v2/Dashboards/feedlotDashboard';

interface HistoricoStatusProps {
  data: FeedlotStatusHistoryRow[];
}

function StatusBadge({
  status,
  languageGB,
}: {
  status: FeedlotCorralStatusValue;
  languageGB: LanguageDate;
}) {
  return (
    <Badge colorPalette={feedlotCorralStatusColor[status]} variant="subtle" borderRadius="full">
      {feedlotCorralStatusOptions.getLabel(status, languageGB)}
    </Badge>
  );
}

export function HistoricoStatus({ data }: HistoricoStatusProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.feedlotDashboard.history;

  return (
    <DashboardCard title={text.title}>
      <Grid
        templateColumns="1fr 2fr 1fr"
        gap="2"
        fontSize="xs"
        color="cardTextSecondary"
        paddingBottom="2"
      >
        <Text fontWeight="medium">{text.corral}</Text>
        <Text fontWeight="medium">
          {text.from} → {text.to}
        </Text>
        <Text fontWeight="medium">{text.changedAt}</Text>
      </Grid>
      <Flex direction="column" gap="2">
        {data.map((row, index) => (
          <Grid
            key={`${row.corral_uuid}-${row.changed_at}-${index}`}
            templateColumns="1fr 2fr 1fr"
            gap="2"
            alignItems="center"
            paddingY="1"
            borderTopWidth={index === 0 ? 0 : '1px'}
            borderColor="cardBorder"
          >
            <Text fontSize="sm" color="cardTextPrimary">
              {row.corral_name}
            </Text>
            <Flex align="center" gap="2">
              <StatusBadge status={row.from_status} languageGB={languageGB} />
              <Icon as={FiArrowRight} boxSize={3} color="cardTextSecondary" />
              <StatusBadge status={row.to_status} languageGB={languageGB} />
            </Flex>
            <Text fontSize="xs" color="cardTextSecondary">
              {formatDate(row.changed_at, 'dd/MM/yyyy HH:mm')}
            </Text>
          </Grid>
        ))}
      </Flex>
    </DashboardCard>
  );
}
