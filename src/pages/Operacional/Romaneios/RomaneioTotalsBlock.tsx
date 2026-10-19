// src/pages/Operacional/Romaneios/RomaneioTotalsBlock.tsx
// -----------------------------------------------------------------------------
// Bloco "Totais" do Romaneio (TASK-TRF-FE-03, contrato de tela §5.5) — 8
// campos: 5 read-only/derivados (`total_products`, `total`) + a prévia R$ do
// funrural (também derivada) e 3 editáveis (`icms`, `freight`,
// `others_values`, `discount`) + `funrural_percentage`. Molde literal: bloco
// "Totais" de `InvoiceItemsTab.tsx` (`InputReadOnly` + `formatCurrencyBRL`,
// comentado "PREVIEW — o servidor sempre recalcula").
//
// GAP-TRF-FE-04 (aprovado): totais viram PRÉVIA read-only — só `icms`,
// `freight`, `others_values`, `discount` e `funrural_percentage` vão ao
// payload (`TransferForm`, campos de topo). `total_products`/`funrural`/
// `total` NUNCA são campos do form — são computados aqui na leitura, a
// partir de `watch('items')`/`watch('icms')`/etc.
//
// Base do funrural = `total_products` (armadilha #4) — `icms`/`freight`/
// `others_values`/`discount` NÃO entram na base, fórmula idêntica à do
// servidor (`funrural_percentage/100 * total_products`).
//
// Bidirecionalidade funrural R$ ⇄ % (contrato §5.5): a caixa em R$ NÃO é um
// campo do form (nada para "hidratar/drift" — diferente de `total_amount`
// do item, que É persistido pelo servidor com precisão própria). Ela é
// SEMPRE a prévia derivada de `funrural_percentage`/`total_products`; só o
// `onValueChange` dela é que ESCREVE de volta em `funrural_percentage`. Sem
// campo próprio, não há efeito reativo para "pular" — mais simples e sem
// risco de loop.
//
// Trava (armadilha #4): `funrural > total_products` exibe a mensagem
// LITERAL do legado e LIMPA o campo — implementado como estado local (não
// precisa de `setError`/`clearErrors` do form raiz, é validação de negócio
// efêmera, não erro persistente de schema).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { PercentInput } from '@/components/Form/PercentInput';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import type { TransferForm } from '@/@types/v2/Transfers';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface RomaneioTotalsBlockProps {
  control: Control<TransferForm>;
  errors: FieldErrors<TransferForm>;
  watch: UseFormWatch<TransferForm>;
  setValue: UseFormSetValue<TransferForm>;
  isDisabled: boolean;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function RomaneioTotalsBlock({
  control,
  errors,
  watch,
  setValue,
  isDisabled,
}: RomaneioTotalsBlockProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.transfers.transfer.form.totals;

  const [funruralError, setFunruralError] = useState<string | null>(null);

  const watchedItems = watch('items') ?? [];
  // `total_products = Σ item.total_amount` (armadilha #FC-TOT-04) — os
  // `total_amount` das linhas já são a prévia hidratada/recalculada da
  // TASK-TRF-FE-03 (mesma fonte que o servidor usa), sem risco de drift
  // adicional aqui.
  const totalProducts = watchedItems.reduce(
    (sum, item) => sum + (Number(item?.total_amount) || 0),
    0
  );

  const icms = Number(watch('icms')) || 0;
  const freight = Number(watch('freight')) || 0;
  const othersValues = Number(watch('others_values')) || 0;
  const discount = Number(watch('discount')) || 0;
  const funruralPercentage = Number(watch('funrural_percentage')) || 0;

  // Prévia derivada — NUNCA um campo próprio do form (ver nota de topo).
  const funruralPreview = round((funruralPercentage / 100) * totalProducts, 2);
  const total = round(
    totalProducts + icms + freight + othersValues - discount - funruralPreview,
    2
  );

  function handleFunruralPercentageChange(value: number) {
    setFunruralError(null);
    setValue('funrural_percentage', value, { shouldValidate: true });
  }

  function handleFunruralAmountChange(value: number) {
    if (totalProducts <= 0) {
      setFunruralError(null);
      setValue('funrural_percentage', 0, { shouldValidate: true });
      return;
    }
    if (value > totalProducts) {
      // Mensagem literal do legado (contrato §2.5/§5.5, armadilha #4) — limpa
      // o campo em vez de aceitar o valor acima do teto.
      setFunruralError(text.funruralMaxMessage);
      setValue('funrural_percentage', 0, { shouldValidate: true });
      return;
    }
    setFunruralError(null);
    setValue('funrural_percentage', round((value / totalProducts) * 100, 2), {
      shouldValidate: true,
    });
  }

  return (
    <Box mt={8} pt={4} borderTop="1px solid" borderColor="border.subtle">
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {languageGB.transfers.transfer.form.sections.totals}
      </Text>

      <SimpleGrid columns={columnsForm.default} gap={6}>
        <InputReadOnly label={text.fields.totalProducts} value={formatCurrencyBRL(totalProducts)} />

        <Controller
          name="icms"
          control={control}
          render={({ field }) => (
            <MoneyInput
              name={field.name}
              label={text.fields.icms}
              value={field.value ?? 0}
              onValueChange={(value) => field.onChange(value)}
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name="freight"
          control={control}
          render={({ field }) => (
            <MoneyInput
              name={field.name}
              label={text.fields.freight}
              value={field.value ?? 0}
              onValueChange={(value) => field.onChange(value)}
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name="others_values"
          control={control}
          render={({ field }) => (
            <MoneyInput
              name={field.name}
              label={text.fields.othersValues}
              value={field.value ?? 0}
              onValueChange={(value) => field.onChange(value)}
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name="discount"
          control={control}
          render={({ field }) => (
            <MoneyInput
              name={field.name}
              label={text.fields.discount}
              value={field.value ?? 0}
              onValueChange={(value) => field.onChange(value)}
              disabled={isDisabled}
            />
          )}
        />

        <Box>
          <Controller
            name="funrural_percentage"
            control={control}
            render={({ field }) => (
              <PercentInput
                name={field.name}
                label={text.fields.funruralPercentage}
                value={field.value ?? 0}
                onValueChange={handleFunruralPercentageChange}
                // Sem `maxlength` copiado do legado (armadilha #18) —
                // validação puramente numérica via `maxValue`.
                maxValue={100}
                error={errors.funrural_percentage?.message as string | undefined}
                disabled={isDisabled}
              />
            )}
          />
        </Box>

        <Box>
          <MoneyInput
            name="funrural-preview"
            label={text.fields.funrural}
            value={funruralPreview}
            onValueChange={handleFunruralAmountChange}
            disabled={isDisabled}
          />
          {funruralError && (
            <Text fontSize="xs" color="fg.error" mt={1}>
              {funruralError}
            </Text>
          )}
        </Box>

        <InputReadOnly label={text.fields.total} value={formatCurrencyBRL(total)} />
      </SimpleGrid>
    </Box>
  );
}
