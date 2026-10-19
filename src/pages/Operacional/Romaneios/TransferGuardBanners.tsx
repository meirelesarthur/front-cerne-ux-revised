// src/pages/Operacional/Romaneios/TransferGuardBanners.tsx
// -----------------------------------------------------------------------------
// Banners de imutabilidade/origem do Romaneio (GAP-TRF-FE-05, contrato de
// tela §4.6) — os 5 casos derivados, presentes tanto no `index` quanto no
// `show` (`TransferRepository::withDerivedFlags()`), sem request extra:
//   1. `has_fiscal_document`     → warning, formulário inteiro read-only.
//   2. `has_financial_posting`   → warning, formulário inteiro read-only.
//   3. `is_from_charge`          → info (vínculos preservados, não editáveis).
//   4. `is_from_weighing`        → info (estoque movimentado pelo módulo de
//      origem — salvar aqui não altera saldo).
//   5. `sale_contract_id_legacy` → info (FK legado preservada).
//
// Reusado pela TASK-TRF-FE-05 (visualização) — por isso vive como componente
// próprio, não inline no formulário. Cópia herdada de `badges.*Banner`
// (já publicada na TASK-TRF-FE-01, i18n ×3) — nenhuma string nova aqui.
// -----------------------------------------------------------------------------

import { Box, Text, VStack } from '@chakra-ui/react';

import type { LanguageDate } from '@/@types/language';

export interface TransferGuardBannersDetail {
  has_fiscal_document: boolean;
  has_financial_posting: boolean;
  is_from_charge: boolean;
  is_from_weighing: boolean;
  sale_contract_id_legacy: number | null;
}

export interface TransferGuardBannersProps {
  detail: TransferGuardBannersDetail | undefined | null;
  languageGB: LanguageDate;
}

type BannerTone = 'warning' | 'info';

interface BannerEntry {
  key: string;
  tone: BannerTone;
  message: string;
}

export function TransferGuardBanners({ detail, languageGB }: TransferGuardBannersProps) {
  if (!detail) return null;

  const text = languageGB.transfers.transfer.badges;

  const banners: BannerEntry[] = [];

  // Precedência de servidor (contrato §4.6/§5.7): NF-e > financeiro > origem.
  if (detail.has_fiscal_document) {
    banners.push({ key: 'fiscal-document', tone: 'warning', message: text.fiscalDocumentBanner });
  }
  if (detail.has_financial_posting) {
    banners.push({
      key: 'financial-posting',
      tone: 'warning',
      message: text.financialPostingBanner,
    });
  }
  if (detail.is_from_charge) {
    banners.push({ key: 'from-charge', tone: 'info', message: text.fromChargeBanner });
  }
  if (detail.is_from_weighing) {
    banners.push({ key: 'from-weighing', tone: 'info', message: text.fromWeighingBanner });
  }
  if (detail.sale_contract_id_legacy) {
    banners.push({
      key: 'sale-contract-legacy',
      tone: 'info',
      message: text.saleContractLegacyBanner,
    });
  }

  if (banners.length === 0) return null;

  return (
    <VStack align="stretch" gap={2} mb={4}>
      {banners.map((banner) => (
        <Box
          key={banner.key}
          p={3}
          borderRadius="md"
          bg={banner.tone === 'warning' ? 'feedBack.warn' : 'feedBack.info'}
        >
          <Text
            fontSize="sm"
            color={banner.tone === 'warning' ? 'feedBack.warnMain' : 'feedBack.infoMain'}
          >
            {banner.message}
          </Text>
        </Box>
      ))}
    </VStack>
  );
}
