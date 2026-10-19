// src/components/Dashboard/CardInfoTooltip.tsx
// Ícone de informação com tooltip curto (execução 062 — fix wave F-211, item
// C). Fecha o achado da auditoria `AUDITORIA-cards-kpis-F211.md` (coluna 5 —
// "texto de origem" de cada card): a tela não expunha ao usuário QUAL fonte
// de dado/regra de cálculo alimenta cada bloco. Reusável em qualquer
// `DashboardCard` (via `action`) ou `DashboardKpiCard` (via `infoTooltip`) —
// fonte única (Lei 2), nunca duplicar a marcação de tooltip por bloco.
//
// Mirror `LacunaNote.tsx` (mesmo `Tooltip` de `@/components/TooLtip`, mesmo
// racional de ícone com `cursor="help"`) — ícone neutro (`FiInfo`, tokens de
// texto secundário) em vez do ícone de alerta (`FiAlertTriangle`, tokens de
// warning) do `LacunaNote`, que sinaliza AUSÊNCIA de dado, não fonte.

import { Flex } from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';

import { Icon } from '@/components/Icon';
import { Tooltip } from '@/components/TooLtip';

interface CardInfoTooltipProps {
  /** Texto curto de origem/regra do card (coluna 5 da auditoria) — exibido no tooltip. */
  content: string;
}

/**
 * Ícone `FiInfo` com tooltip — texto de origem do dado exibido no card.
 * @return {JSX.Element} Ícone acessível (`role="img"`, `aria-label`) com tooltip ao hover/foco.
 */
export function CardInfoTooltip({ content }: CardInfoTooltipProps) {
  return (
    <Tooltip content={content}>
      <Flex
        as="span"
        align="center"
        justify="center"
        cursor="help"
        color="cardTextSecondary"
        aria-label={content}
        role="img"
      >
        <Icon as={FiInfo} boxSize={3.5} />
      </Flex>
    </Tooltip>
  );
}
