// src/pages/BaseRegistrations/DepreciationForecasts/index.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de PREVISÃO DE DEPRECIAÇÃO — Cadastros Base / Bens-Ativos.
// 100% leitura/simulação: 2 Selects (Equipamento + Horizonte) que, ao terem os
// 2 valores preenchidos, disparam automaticamente a projeção calculada — SEM
// botão "Calcular" (reativo, ratificado no contrato de tela
// `DepreciationForecast-FE-contrato.md §2/item 1`). Sem grid, sem CRUD, sem
// paginação.
//
// UX-GAP declarado (sem página no Storybook `cerne` para esta composição,
// contrato §5) — mesma decisão já aceita em `SafraDetalhe.tsx` (TASK-FE-010):
// `FormContainer` (shell) + painel de resultado read-only abaixo, tokens
// semânticos `bg.muted`/`border.subtle`/`fg.muted`.
//
// Select "Bem imobilizado" usa `id` numérico (NUNCA `uuid`, exceção D4 do
// contrato de API). Select "Tempo de Previsão" com 16 opções ESTÁTICAS
// (`i18n form.forecastOptions`) — NÃO busca essas opções do backend.
//
// 422 "sem depreciação processada" é regra de negócio ESPERADA (Doc Bruta
// RN-3) — card informativo neutro, NUNCA toast de erro.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Flex, Icon, SimpleGrid, Skeleton, Table, Text } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { FiInfo } from 'react-icons/fi';

import { QueryErrorState } from '@/components/QueryErrorState';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import type { Option } from '@/@types/option';
import type { DepreciationForecastRow } from '@/@types/v2/BaseRegistrations/depreciationForecasts';

import { useDepreciationForecastQuery, useEquipmentOptions } from './useDepreciationForecast';

// 12 abreviações de mês vêm do i18n (`result.table.monthAbbreviations`) — sem
// depender de locale de `Intl`/`date-fns` (nenhum consumidor prévio no
// projeto para este formato). `row.month` é 1-12.
function formatMonthYear(row: DepreciationForecastRow, monthAbbreviations: string[]): string {
  const abbreviation = monthAbbreviations[row.month - 1] ?? row.month;
  return `${abbreviation}/${row.year}`;
}

// Moeda BRL — reaproveita o formatter já usado no projeto (mesmo padrão de
// `Estorno/index.tsx`), sem implementar um novo.
function formatCurrencyBRL(value: number): string {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function DepreciationForecasts() {
  const { languageGB } = useLanguage();
  const text = languageGB.depreciationForecasts;

  const [equipmentOption, setEquipmentOption] = useState<Option<number> | null>(null);
  const [forecastOption, setForecastOption] = useState<Option<number> | null>(null);

  const equipmentOptionsQuery = useEquipmentOptions();

  const equipmentSelectOptions: Option<number>[] = useMemo(
    () =>
      (equipmentOptionsQuery.data ?? []).map((equipment) => ({
        value: equipment.id,
        label: equipment.description,
      })),
    [equipmentOptionsQuery.data]
  );

  const forecastSelectOptions: Option<number>[] = useMemo(
    () =>
      text.form.forecastOptions.map((label, index) => ({
        value: index + 1,
        label,
      })),
    [text.form.forecastOptions]
  );

  const equipmentId = equipmentOption?.value;
  const forecastTime = forecastOption?.value;

  const projectionQuery = useDepreciationForecastQuery({ equipmentId, forecastTime });

  // Vazio inicial — nenhum Select preenchido ainda. Estado neutro, sem
  // mensagem alarmante, sem chamada de rede (o hook mantém `enabled: false`
  // internamente até os 2 ids serem válidos).
  const hasSelection = equipmentId !== undefined && forecastTime !== undefined;

  // 422 "sem depreciação processada" — regra de negócio ESPERADA (Doc Bruta
  // RN-3), NUNCA toast de erro. Distingue de erro 404/500/rede.
  const isBusinessRuleEmpty =
    isAxiosError(projectionQuery.error) && projectionQuery.error.response?.status === 422;
  const isGenericError = projectionQuery.isError && !isBusinessRuleEmpty;

  const forecastData = projectionQuery.data?.data;

  return (
    <FormContainer title={text.form.title}>
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Flex direction="column" gap={6}>
          {/* Painel de filtros — sem FormFooter, sem botão de submit. Mudar
              qualquer um dos 2 Selects já dispara a query automaticamente
              quando ambos válidos. */}
          <SimpleGrid columns={columnsForm.twoColumns} gap={4}>
            <Select
              label={text.form.fields.equipment}
              name="equipmentId"
              placeholder={text.form.placeholders.select}
              options={equipmentSelectOptions}
              loading={equipmentOptionsQuery.isLoading}
              value={equipmentOption}
              onChange={(value) => setEquipmentOption(value as Option<number> | null)}
            />
            <Select
              label={text.form.fields.forecastTime}
              name="forecastTime"
              placeholder={text.form.placeholders.select}
              options={forecastSelectOptions}
              value={forecastOption}
              onChange={(value) => setForecastOption(value as Option<number> | null)}
            />
          </SimpleGrid>

          {/* Painel de resultado — só renderiza algo quando há seleção. */}
          {hasSelection && (
            <Box
              bg="bg.muted"
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="lg"
              p={4}
            >
              <Skeleton loading={projectionQuery.isLoading}>
                {isBusinessRuleEmpty && (
                  <Flex direction="column" align="center" justify="center" py={10} px={4} gap={2}>
                    <Icon as={FiInfo} boxSize={8} color="fg.muted" />
                    <Text color="fg.muted" textAlign="center">
                      {text.result.empty.noDepreciation}
                    </Text>
                  </Flex>
                )}

                {isGenericError && (
                  <QueryErrorState
                    error={projectionQuery.error}
                    message={text.result.error.title}
                    description={text.result.error.description}
                    retryLabel={text.result.error.retry}
                    onRetry={() => projectionQuery.refetch()}
                    isRetrying={projectionQuery.isFetching}
                  />
                )}

                {!isBusinessRuleEmpty && !isGenericError && forecastData && (
                  <Flex direction="column" gap={4}>
                    <Text fontSize="md" fontWeight="semibold" color="fg.default">
                      {forecastData.equipment.description}
                    </Text>

                    <Table.Root variant="line" size="md">
                      <Table.Header>
                        <Table.Row borderBottom="1px solid" borderColor="border.subtle">
                          <Table.ColumnHeader>{text.result.table.month}</Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="right">
                            {text.result.table.valueToDepreciate}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="right">
                            {text.result.table.monthlyDepreciation}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader textAlign="right">
                            {text.result.table.remainingBalance}
                          </Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {forecastData.rows.map((row, index) => (
                          // eslint-disable-next-line react/no-array-index-key
                          <Table.Row key={`${row.year}-${row.month}-${index}`}>
                            <Table.Cell>
                              {formatMonthYear(row, text.result.table.monthAbbreviations)}
                            </Table.Cell>
                            <Table.Cell textAlign="right">
                              {formatCurrencyBRL(row.vl_depreciate)}
                            </Table.Cell>
                            <Table.Cell textAlign="right">
                              {formatCurrencyBRL(row.vl_depreciation)}
                            </Table.Cell>
                            <Table.Cell textAlign="right">
                              {formatCurrencyBRL(row.sd_depreciate)}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Flex>
                )}
              </Skeleton>
            </Box>
          )}
        </Flex>
      </Box>
    </FormContainer>
  );
}
