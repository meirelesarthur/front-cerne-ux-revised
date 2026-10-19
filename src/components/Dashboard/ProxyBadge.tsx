// src/components/Dashboard/ProxyBadge.tsx
// Badge de métrica DERIVADA (execução 046, TASK-DASH-FE-06 — criada na
// reconciliação, ver `05-RECONCILIACAO-front-x-api-046.md` MUD-046-04).
//
// O desenho do `cerne` tem um badge de texto FIXO ("Estimado via log de
// auditoria"). Aqui ele é renderizado a partir do DADO: a tela decide
// mostrar `ProxyBadge` só quando o `block_id` do card está em
// `meta.proxies[]` (`DashboardMeta`, `src/@types/v2/Dashboards/dashboard-meta.d.ts`)
// — a regra de derivação (`rule`) vem da API e aparece no tooltip. NUNCA
// hardcoded na página. Rótulo do badge via i18n (`languageGB.dashboards.common.proxyBadge`).

import { Badge } from '@chakra-ui/react';

import { Tooltip } from '@/components/TooLtip';

import { useLanguage } from '@/hooks/useLanguage';

interface ProxyBadgeProps {
  /** Regra de derivação da métrica — `meta.proxies[].rule` (API), exibida no tooltip. */
  rule: string;
}

export function ProxyBadge({ rule }: ProxyBadgeProps) {
  const { languageGB } = useLanguage();

  return (
    <Tooltip content={rule}>
      <Badge
        colorPalette="blue"
        variant="subtle"
        borderRadius="full"
        px={2}
        py={0.5}
        fontWeight="medium"
        cursor="help"
      >
        {languageGB.dashboards.common.proxyBadge.label}
      </Badge>
    </Tooltip>
  );
}
