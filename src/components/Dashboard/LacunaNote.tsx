// src/components/Dashboard/LacunaNote.tsx
// Nota de LACUNA de dado (execução 046, TASK-DASH-FE-06 — criada na
// reconciliação, ver `05-RECONCILIACAO-front-x-api-046.md` MUD-046-04).
//
// Quando o `block_id` de um card está em `meta.lacunas[]` (`DashboardMeta`,
// `src/@types/v2/Dashboards/dashboard-meta.d.ts`), a tela renderiza ESTA
// nota NO LUGAR do valor — nunca um número inventado (SEM MOCK). O motivo
// (`reason`) vem da API; o rótulo fixo ("Sem dado") vem de i18n
// (`languageGB.dashboards.common.lacunaNote`).

import { Flex, Text } from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';

import { Icon } from '@/components/Icon';
import { Tooltip } from '@/components/TooLtip';

import { useLanguage } from '@/hooks/useLanguage';

interface LacunaNoteProps {
  /** Motivo da ausência de dado — `meta.lacunas[].reason` (API), exibido no tooltip. */
  reason: string;
}

export function LacunaNote({ reason }: LacunaNoteProps) {
  const { languageGB } = useLanguage();

  return (
    <Tooltip content={reason}>
      <Flex align="center" gap="1" cursor="help" width="fit-content">
        <Icon as={FiAlertTriangle} boxSize={4} color="statCard.warningIcon" />
        <Text fontSize="sm" color="statCard.warningText" fontWeight="medium">
          {languageGB.dashboards.common.lacunaNote.label}
        </Text>
      </Flex>
    </Tooltip>
  );
}
