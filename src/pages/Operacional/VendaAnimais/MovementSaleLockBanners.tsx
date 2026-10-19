// src/pages/Operacional/VendaAnimais/MovementSaleLockBanners.tsx
// -----------------------------------------------------------------------------
// Banner de imutabilidade da Venda de Animais — mirror `TransferGuardBanners`
// (Operacional/Romaneios). Contrato de tela §5.3 (ação A8 "Editar"):
//   isLocked = incomes_count>0 || (type_sale===2 && status==='F')
//
// `incomes_count` NÃO é exposto por `MovementSaleResource` em NENHUM modo
// (list ou detail) — `GAP-VENDAS-FE-03` (achado desta Tarefa, ver docblock de
// `@/@types/v2/MovementSales`). Esta função computa apenas a parte
// disponível hoje (`type_sale===2 && status==='F'`), fielmente — não é mock,
// é a fidelidade possível com o dado real disponível. Único lugar do módulo
// que calcula `isLocked` (reusado por listagem + Detalhe, mesmo racional de
// `TransferGuardBanners`/`RomaneioActionsMenu`).
// -----------------------------------------------------------------------------

import { Box, Text, VStack } from '@chakra-ui/react';

import type { LanguageDate } from '@/@types/language';
import type { MovementSaleStatus, MovementSaleType } from '@/@types/v2/MovementSales';

export interface MovementSaleLockDetail {
  status: MovementSaleStatus;
  type_sale: MovementSaleType;
}

/**
 * Fonte única de `isLocked` do módulo — reusada pela listagem
 * (`VendaAnimaisActionsMenu`) e pelo Detalhe (`MovementSaleDetalhe`).
 *
 * @param {MovementSaleLockDetail | undefined | null} detail Registro (ou
 *   trecho dele) contendo `status`/`type_sale`.
 * @return {boolean} `true` quando a venda de Abate já está Finalizada.
 */
export function isMovementSaleLocked(detail: MovementSaleLockDetail | undefined | null): boolean {
  if (!detail) return false;
  return detail.type_sale === 2 && detail.status === 'F';
}

export interface MovementSaleLockBannersProps {
  detail: MovementSaleLockDetail | undefined | null;
  languageGB: LanguageDate;
}

export function MovementSaleLockBanners({ detail, languageGB }: MovementSaleLockBannersProps) {
  if (!isMovementSaleLocked(detail)) return null;

  const text = languageGB.movementSales.movementSale.banners;

  return (
    <VStack align="stretch" gap={2} mb={4}>
      <Box p={3} borderRadius="md" bg="feedBack.warn">
        <Text fontSize="sm" color="feedBack.warnMain">
          {text.finishedSlaughterLocked}
        </Text>
      </Box>
    </VStack>
  );
}
