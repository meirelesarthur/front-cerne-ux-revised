// src/pages/Operacional/Reproducao/ProtocoloEstacao/ProtocolSeasonTimelinePreview.tsx
// -----------------------------------------------------------------------------
// Preview de timeline client-side (SURF-018, CAL-006) — usado SÓ dentro do
// formulário (`CreateOrUpdateProtocolSeason.tsx`, TASK-FE-1054/1057). Recebe
// os `items` atuais via `useWatch` do PAI, debounced (~350ms, mirror
// `debouncedHandleTimeline` do legado), agrupa (CAL-007 client-side,
// `buildProtocolSeasonTimelinePreview`) e reusa o MESMO componente visual da
// Visualização (`ProtocolSeasonTimeline.tsx`, contrato §7.4) — sem duplicar
// markup entre as duas telas.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Text } from '@chakra-ui/react';

import { useLanguage } from '@/hooks/useLanguage';

import type {
  ProtocolItemData,
  ProtocolItemFieldValue,
} from '@/@types/v2/Operacional/Reproducao/protocolSeason';

import { ProtocolSeasonTimeline } from './ProtocolSeasonTimeline';
import { buildProtocolSeasonTimelinePreview } from './utils/buildProtocolSeasonTimelinePreview';

export interface ProtocolSeasonTimelinePreviewProps {
  items: ProtocolItemFieldValue[];
}

const DEBOUNCE_MS = 350;

function fieldValueToTimelineItem(item: ProtocolItemFieldValue, index: number): ProtocolItemData {
  return {
    uuid: `preview-${index}`,
    product: item.product_uuid
      ? { uuid: item.product_uuid.value, description: item.product_uuid.label }
      : null,
    service: item.service?.value ?? null,
    warehouse: item.warehouse_uuid
      ? { uuid: item.warehouse_uuid.value, description: item.warehouse_uuid.label }
      : null,
    stock_uuid: item.stock_uuid,
    measurement: item.measurement_uuid
      ? { uuid: item.measurement_uuid.value, description: item.measurement_uuid.label }
      : null,
    date: item.date,
    time: item.time,
    quantity: item.quantity ?? 0,
    identification: item.identification || null,
    description: item.description ?? null,
  };
}

export function ProtocolSeasonTimelinePreview({ items }: ProtocolSeasonTimelinePreviewProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.protocolSeasons.protocolSeason.form.timelinePreview;

  const [debouncedItems, setDebouncedItems] = useState(items);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedItems(items), DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [JSON.stringify(items)]);

  const groups = buildProtocolSeasonTimelinePreview(debouncedItems.map(fieldValueToTimelineItem));

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {text.title}
      </Text>
      {debouncedItems.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          {text.empty}
        </Text>
      ) : (
        <ProtocolSeasonTimeline groups={groups} />
      )}
    </Box>
  );
}

export default ProtocolSeasonTimelinePreview;
