// src/pages/Operacional/Reproducao/ProtocoloEstacao/ProtocolSeasonTimeline.tsx
// -----------------------------------------------------------------------------
// Elemento visual NOVO — sem precedente no catálogo `get_pwa_ui_components_
// pattern` nem no sibling `LoteReproducao` (contrato-frontend §1/§4.5/§7.4).
// Adaptado a partir de primitivos de lista/card já existentes (`VStack`/
// `Box`/`Divider`/`Badge`, tokens semânticos do `cerne`, light+dark) — NÃO
// promovido a componente genérico de design system (§7.4: evitar
// generalização prematura sem 2º consumidor real).
//
// COMPARTILHADO entre os dois únicos consumidores desta feature: preview
// client-side no formulário (`ProtocolSeasonTimelinePreview.tsx`,
// TASK-FE-1057, CAL-006) e a timeline SERVER-SIDE da tela de Visualização
// (`ProtocolSeasonDetalhe.tsx`, TASK-FE-1058, CAL-007) — MESMO arquivo, MESMO
// shape de dado (`ProtocolSeasonTimelineGroup[]`), sem duplicar markup.
// -----------------------------------------------------------------------------

import { Badge, Box, EmptyState, Flex, Icon, Separator, Text, VStack } from '@chakra-ui/react';
import { FiClock } from 'react-icons/fi';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import { protocolSeasonServiceOptions } from '@/constants/operacional/reproducao/protocolSeason';

import type {
  ProtocolItemData,
  ProtocolSeasonTimelineGroup,
} from '@/@types/v2/Operacional/Reproducao/protocolSeason';

export interface ProtocolSeasonTimelineProps {
  groups: ProtocolSeasonTimelineGroup[];
}

function formatQuantity(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ItemLine({ item }: { item: ProtocolItemData }) {
  const { languageGB } = useLanguage();
  const text = languageGB.protocolSeasons.protocolSeason.timeline;
  const serviceLabel =
    item.service !== null
      ? protocolSeasonServiceOptions.getLabel(item.service as 1 | 2 | 3 | 4, languageGB)
      : null;
  const productLabel = item.product?.description ?? null;
  // FID-G1 Q5 — produto e serviço coexistem na mesma linha (mesma tabela
  // `protocol_season_products`, sem XOR); a Prévia/Visualização precisam
  // exibir os DOIS quando ambos existirem, não um fallback exclusivo.
  const combinedLabel = [productLabel, serviceLabel].filter(Boolean).join(text.andSeparator) || '—';

  return (
    <Flex align="center" justify="space-between" gap={4} py={1.5}>
      <Text fontSize="sm" color="fg.default">
        {combinedLabel}
      </Text>
      <Flex align="center" gap={3} flexShrink={0}>
        <Text fontSize="sm" color="fg.muted">
          {formatQuantity(item.quantity)}
          {item.measurement?.description ? ` ${item.measurement.description}` : ''}
        </Text>
        {item.time && (
          <Flex align="center" gap={1}>
            <Icon as={FiClock} boxSize={3} color="fg.muted" />
            <Text fontSize="xs" color="fg.muted">
              {item.time}
            </Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}

export function ProtocolSeasonTimeline({ groups }: ProtocolSeasonTimelineProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.protocolSeasons.protocolSeason.timeline;

  if (groups.length === 0) {
    return (
      <EmptyState.Root size="sm">
        <EmptyState.Content>
          <EmptyState.Title>{text.emptyState.title}</EmptyState.Title>
          <EmptyState.Description>{text.emptyState.description}</EmptyState.Description>
        </EmptyState.Content>
      </EmptyState.Root>
    );
  }

  return (
    <VStack align="stretch" gap={0}>
      {groups.map((group, index) => {
        const isDzero = (group.interval_days ?? 0) === 0;
        const badgeLabel = isDzero ? 'DZERO' : `D+${group.interval_days}`;
        const weekdayLabel = text.weekdays[group.weekday % 7];

        return (
          <Box key={group.date}>
            {index > 0 && <Separator borderColor="border.subtle" my={3} />}
            <Flex align="center" gap={3} mb={2}>
              <Badge colorPalette={isDzero ? 'blue' : 'gray'} variant="subtle">
                {badgeLabel}
              </Badge>
              <Text fontSize="sm" fontWeight="semibold" color="fg.default">
                {formatDate(group.date)}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {weekdayLabel}
              </Text>
            </Flex>
            <VStack align="stretch" gap={0} pl={2}>
              {group.items.map((item) => (
                <ItemLine key={item.uuid} item={item} />
              ))}
            </VStack>
          </Box>
        );
      })}
    </VStack>
  );
}

export default ProtocolSeasonTimeline;
