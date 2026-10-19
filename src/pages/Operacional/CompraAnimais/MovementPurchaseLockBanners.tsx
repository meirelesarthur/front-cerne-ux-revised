// src/pages/Operacional/CompraAnimais/MovementPurchaseLockBanners.tsx
// -----------------------------------------------------------------------------
// Banner de imutabilidade da Compra de Animais — TASK-CP-09 + T6 (088).
// `isLocked = finished_processing` (CLM-45): `MovementPurchaseResource` passou
// a expor `finished_processing` (listagem e detalhe, aditivo). Fonte ÚNICA
// reusada pelo menu de ações, pelo Detalhe e pela tela de edição (leitura).
// Campo ausente (`undefined`) nunca bloqueia por presunção (SEM MOCK).
// -----------------------------------------------------------------------------

import { Box, Text, VStack } from '@chakra-ui/react';

import type { LanguageDate } from '@/@types/language';
import type {
  MovementPurchaseDetail,
  MovementPurchaseListItem,
} from '@/@types/v2/MovementPurchases';

export type MovementPurchaseLockDetail = MovementPurchaseListItem | MovementPurchaseDetail;

/**
 * Fonte única de `isLocked` do módulo (processamento FINALIZADO vinculado).
 *
 * @param {MovementPurchaseLockDetail | undefined | null} detail Registro (ou
 *   trecho dele) da compra.
 * @return {boolean} `true` somente quando `finished_processing === true`.
 */
export function isMovementPurchaseLocked(
  detail: MovementPurchaseLockDetail | undefined | null
): boolean {
  return detail?.finished_processing === true;
}

export interface MovementPurchaseLockBannersProps {
  detail: MovementPurchaseLockDetail | undefined | null;
  languageGB: LanguageDate;
}

export function MovementPurchaseLockBanners({
  detail,
  languageGB,
}: MovementPurchaseLockBannersProps) {
  if (!isMovementPurchaseLocked(detail)) return null;

  const text = languageGB.movementPurchases.movementPurchase.banners;

  return (
    <VStack align="stretch" gap={2} mb={4}>
      <Box p={3} borderRadius="md" bg="feedBack.warn">
        <Text fontSize="sm" color="feedBack.warnMain">
          {text.lockedMessage}
        </Text>
      </Box>
    </VStack>
  );
}
