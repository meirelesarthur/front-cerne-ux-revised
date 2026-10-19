// src/pages/Operacional/PesagemRodoviaria/ModuleWeighingStatusLegend.tsx
// -----------------------------------------------------------------------------
// Legenda de status da listagem de Pesagem Rodoviária (ModuleWeighing,
// FE-SCR-01, TASK-MWG-FE-02 — GAP-FRONT correção 050, Bug 1) — o Badge da
// coluna Status (`index.tsx`) já rotula cada linha individualmente, mas
// faltava a legenda dos 5 estados possíveis (`ModuleWeighingStatus`) acima
// do grid. Mirror ESTRUTURAL de
// `Administrativo/Solicitacao/RequestPurchaseStatusLegend.tsx` (mesmo
// propósito: recompor legenda de enum de status junto ao `HeaderGrid`),
// adaptado para usar `Badge` (mesmo componente/`colorPalette` já usado na
// coluna Status do grid, `index.tsx:197`) — consistência visual entre a
// legenda e o dado que ela explica.
//
// `moduleWeighingStatusOptions.options(languageGB)` + `moduleWeighingStatusColor`
// — fonte única (constantes já existentes, nenhum valor novo inventado).
// Funciona em light+dark: `Badge` (Chakra v3) e `fg.muted` já resolvem por
// token de tema, sem cor hardcoded.
// -----------------------------------------------------------------------------

import { Badge, Flex, Text } from '@chakra-ui/react';

import { useLanguage } from '@/hooks/useLanguage';

import { moduleWeighingStatusColor } from '@/constants/ModuleWeighing/module-weighing-status';
import { moduleWeighingStatusOptions } from '@/constants/ModuleWeighing/options/module-weighing-status-options';

export function ModuleWeighingStatusLegend() {
  const { languageGB } = useLanguage();
  const text = languageGB.moduleWeighing.moduleWeighing.list;

  const options = moduleWeighingStatusOptions.options(languageGB);

  return (
    <Flex align="center" gap={3} rowGap={2} wrap="wrap">
      <Text fontSize="sm" fontWeight="bold" color="fg.muted" flexShrink={0}>
        {text.legend.label}:
      </Text>
      {options.map((option) => (
        <Badge
          key={option.value}
          colorPalette={moduleWeighingStatusColor[option.value]}
          variant="subtle"
        >
          {option.label}
        </Badge>
      ))}
    </Flex>
  );
}

export default ModuleWeighingStatusLegend;
