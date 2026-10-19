// src/pages/Administrativo/FarmTransfer/FarmTransferFinancialSection.tsx
// -----------------------------------------------------------------------------
// Cabeçalho do subfluxo financeiro opcional de Trans. Fazendas (FarmTransfer
// — Estoque, Tarefa 03, `GAP-FARMTRANSFER-FE-03`): toggle `has_financial` +
// `vl_total`. Toggle boolean via `Switch` (`@/components/ui/switch`, Chakra
// v3) — mirror do idioma REAL já em produção em
// `MovCaixaBancario/CreateOrUpdateMovimento.tsx` (`fiscal_document`/
// `generates_obligation`), não o `ToggleSwitch` legado (API v2 divergente).
//
// Consumido por `CreateFarmTransfer.tsx`, que decide o que fazer quando o
// toggle desliga (limpar os arrays financeiros — regressão zero da Tarefa
// 02) — este componente só apresenta os 2 campos de cabeçalho.
// -----------------------------------------------------------------------------

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { Control, Controller, FieldErrors } from 'react-hook-form';

import { MoneyInput } from '@/components/Form/MoneyInput';
import { Switch } from '@/components/ui/switch';

import { columnsForm } from '@/constants/coluns-form';

import type { LanguageDate } from '@/@types/language';
import type { FarmTransferCreateForm } from '@/@types/v2/FarmTransfers';

export interface FarmTransferFinancialSectionProps {
  control: Control<FarmTransferCreateForm>;
  hasFinancial: boolean;
  errors: FieldErrors<FarmTransferCreateForm>;
  languageGB: LanguageDate;
  disabled?: boolean;
}

export function FarmTransferFinancialSection({
  control,
  hasFinancial,
  languageGB,
  disabled = false,
}: FarmTransferFinancialSectionProps) {
  const financialText = languageGB.farmTransfers.farmTransfer.form.fields.financial;

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
        <Controller
          name="has_financial"
          control={control}
          render={({ field }) => (
            <Flex align="center" justify="space-between" h="full">
              <Text fontSize="sm" fontWeight="medium">
                {financialText.toggleLabel}
              </Text>
              {/* @ts-ignore - Chakra UI v3 Switch API */}
              <Switch
                checked={!!field.value}
                onCheckedChange={(d: any) => field.onChange(d.checked)}
                colorPalette="green"
                disabled={disabled}
                aria-label={financialText.toggleLabel}
              />
            </Flex>
          )}
        />

        {hasFinancial && (
          <Controller
            name="vl_total"
            control={control}
            render={({ field, fieldState }) => (
              <MoneyInput
                name={field.name}
                label={financialText.vlTotal}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                error={fieldState.error?.message}
                isRequired
                disabled={disabled}
              />
            )}
          />
        )}
      </SimpleGrid>
    </Box>
  );
}

export default FarmTransferFinancialSection;
