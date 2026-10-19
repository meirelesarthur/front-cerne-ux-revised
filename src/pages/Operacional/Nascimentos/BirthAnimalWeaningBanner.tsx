// src/pages/Operacional/Nascimentos/BirthAnimalWeaningBanner.tsx
// -----------------------------------------------------------------------------
// Banner de imutabilidade do Nascimento (GAP-NASC-09, contrato de tela §5.3/§6)
// — mirror `Operacional/Romaneios/TransferGuardBanners.tsx`. Reusado pela
// listagem (via `BirthAnimalActionsMenu`) e pelo Detalhe — o MESMO booleano
// `has_weaning` do Resource, calculado 1x, NUNCA recalculado localmente
// (mesmo padrão de variável-única de `TransferGuardBanners`).
//
// Servidor permanece PERMISSIVO mesmo com `has_weaning=true` (decisão de
// paridade já tomada) — o gate é SÓ de UI (Editar/Excluir escondidos),
// nenhum bloqueio server-side é replicado aqui.
// -----------------------------------------------------------------------------

import { Box, Text, VStack } from '@chakra-ui/react';

import type { LanguageDate } from '@/@types/language';

export interface BirthAnimalWeaningBannerDetail {
  has_weaning: boolean;
}

export interface BirthAnimalWeaningBannerProps {
  detail: BirthAnimalWeaningBannerDetail | undefined | null;
  languageGB: LanguageDate;
}

export function BirthAnimalWeaningBanner({ detail, languageGB }: BirthAnimalWeaningBannerProps) {
  if (!detail?.has_weaning) return null;

  const text = languageGB.birthAnimals.birthAnimal.banners;

  return (
    <VStack align="stretch" gap={2} mb={4}>
      <Box p={3} borderRadius="md" bg="feedBack.warn">
        <Text fontSize="sm" color="feedBack.warnMain">
          {text.weaningLocked}
        </Text>
      </Box>
    </VStack>
  );
}
