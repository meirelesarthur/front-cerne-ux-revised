// src/pages/Operacional/TransferAbcBatch/TransferAbcInstallments.tsx
// -----------------------------------------------------------------------------
// Repetidor de PARCELAS (`financial.installments[]`) da tela de CRIAÇÃO de
// Transferência ABC de Animais entre Lotes (TransferAbcBatch —
// 97-Esteiras/039, REWORK de fidelidade TASK-FE-039-ABCFIN-01).
//
// Auto-geração ("Nº Parcelas"/"Venc. 1ª PC"/"Int. Parcelas (dias)") substitui
// o repeater manual "Adicionar Parcela" — mirror MECÂNICO de
// `ExpenseInstallmentsTab.distributeEqually` (resíduo de arredondamento
// absorvido na ÚLTIMA parcela, CV-004) + `RequestReceiptInstallmentsFieldArray`
// (botão "Gerar Parcelas" + `DeleteConfirmDialog` quando já há linhas,
// `addDays` local para os vencimentos, CV-005). Quando `hasInput=true`
// (TASK-FE-039-ABCFIN-02, já mesclado), a 1ª posição do array gerado é a
// linha de entrada (`due_date=inputDate`, `value=inputValue`), somente
// leitura na tabela — fonte única de verdade é o cabeçalho (FD-FIN3).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Badge, Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { Control, Controller, FieldArrayWithId, FieldErrors, useWatch } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { NumberInput } from '@/components/Form/NumberInput';

import type { LanguageDate } from '@/@types/language';
import type {
  TransferAbcBatchForm,
  TransferAbcInstallmentRowForm,
} from '@/@types/v2/Livestock/transferAbcBatch';

import type { UseFieldArrayReplace } from 'react-hook-form';

export interface TransferAbcInstallmentsFieldValues {
  installments: TransferAbcInstallmentRowForm[];
}

export interface TransferAbcInstallmentsProps {
  control: Control<TransferAbcBatchForm>;
  fields: FieldArrayWithId<TransferAbcInstallmentsFieldValues, 'installments', 'id'>[];
  replace: UseFieldArrayReplace<TransferAbcInstallmentsFieldValues, 'installments'>;
  vlTotal: number;
  hasInput: boolean;
  inputDate: string | null;
  inputValue: number | null;
  errors: FieldErrors<TransferAbcBatchForm>;
  languageGB: LanguageDate;
  disabled?: boolean;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateBRL(dateIso: string | null): string {
  if (!dateIso) return '—';
  const date = new Date(`${dateIso}T00:00:00`);
  return date.toLocaleDateString('pt-BR');
}

/**
 * Distribui `total` em `count` parcelas iguais, absorvendo o resto de
 * arredondamento na ÚLTIMA parcela (mirror `ExpenseInstallmentsTab.
 * distributeEqually` — CV-004). Diferente do irmão
 * `distributeWithoutReconciling` (`RequestReceiptInstallmentsFieldArray`),
 * que NÃO serve aqui: o schema Yup do ABC já valida soma exata
 * (`SUM_TOLERANCE=0.01` flat, não escalado por contagem de linhas).
 * @param {number} total - Valor total a distribuir.
 * @param {number} count - Número de parcelas.
 * @return {number[]} Valor de cada parcela, na ordem.
 */
function distributeEqually(total: number, count: number): number[] {
  if (count <= 0) return [];
  const roundedShare = Math.round((total / count) * 100) / 100;
  const shares = new Array(count).fill(roundedShare);
  const distributed = roundedShare * count;
  const remainder = Math.round((total - distributed) * 100) / 100;
  shares[count - 1] = Math.round((shares[count - 1] + remainder) * 100) / 100;
  return shares;
}

function addDays(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

interface GenerateAbcInstallmentsParams {
  vlTotal: number;
  hasInput: boolean;
  inputDate: string | null;
  inputValue: number | null;
  count: number;
  firstInstallmentDate: string;
  intervalDays: number;
}

/**
 * Gera o array final `installments[]` — CV-004 (parcela normal =
 * `(vl_total - input_value) / qtd`) + CV-005 (vencimentos avançam por
 * `intervalDays`) + CV-006 (`hasInput` insere 1 linha de entrada pré-mesclada
 * na 1ª posição, FD-FIN3).
 * @param {GenerateAbcInstallmentsParams} params - Dados do cabeçalho e do gerador.
 * @return {TransferAbcInstallmentRowForm[]} Lista completa de parcelas a enviar.
 */
function generateAbcInstallments({
  vlTotal,
  hasInput,
  inputDate,
  inputValue,
  count,
  firstInstallmentDate,
  intervalDays,
}: GenerateAbcInstallmentsParams): TransferAbcInstallmentRowForm[] {
  const base = Math.round((vlTotal - (hasInput ? Number(inputValue) || 0 : 0)) * 100) / 100;
  const shares = distributeEqually(base, count);
  const rows: TransferAbcInstallmentRowForm[] = shares.map((value, index) => ({
    due_date: addDays(firstInstallmentDate, index * intervalDays),
    value,
  }));

  if (hasInput) {
    rows.unshift({ due_date: inputDate, value: inputValue });
  }

  return rows;
}

export function TransferAbcInstallments({
  control,
  fields,
  replace,
  vlTotal,
  hasInput,
  inputDate,
  inputValue,
  errors,
  languageGB,
  disabled = false,
}: TransferAbcInstallmentsProps) {
  const financialText = languageGB.livestock.transferAbcBatch.form.fields.financial;

  const genericControl = control as unknown as Control<TransferAbcInstallmentsFieldValues>;
  const arrayError = (errors as any)?.installments?.message as string | undefined;

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const qtdInstallments = useWatch({ control, name: 'financial_qtd_installments' });
  const firstInstallmentDate = useWatch({ control, name: 'financial_first_installment_date' });
  const intInstallments = useWatch({ control, name: 'financial_int_installments' });

  const watchedRows = useWatch({ control: genericControl, name: 'installments' }) ?? [];
  const totalInstallments = watchedRows.reduce((sum, row) => sum + (Number(row?.value) || 0), 0);
  const isSumComplete = Math.abs(totalInstallments - vlTotal) <= 0.01;

  const canGenerate =
    !!qtdInstallments && Number(qtdInstallments) > 0 && !!firstInstallmentDate && vlTotal > 0;

  function executeGenerate() {
    if (!canGenerate) return;
    const rows = generateAbcInstallments({
      vlTotal,
      hasInput,
      inputDate,
      inputValue,
      count: Number(qtdInstallments) || 0,
      firstInstallmentDate: firstInstallmentDate as string,
      intervalDays: Number(intInstallments) || 0,
    });
    replace(rows);
    setIsConfirmOpen(false);
  }

  function handleGenerateClick() {
    if (fields.length > 0) {
      setIsConfirmOpen(true);
    } else {
      executeGenerate();
    }
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {financialText.installmentsSectionTitle}
      </Text>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={4}>
        <Controller
          name="financial_qtd_installments"
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={financialText.installmentsCount}
              allowDot={false}
              decimalPlaces={0}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              error={fieldState.error?.message}
              isRequired
              disabled={disabled}
            />
          )}
        />

        <Controller
          name="financial_first_installment_date"
          control={control}
          render={({ field, fieldState }) => (
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {financialText.firstInstallmentDate}
              </Text>
              <DateInput
                value={field.value ?? null}
                onChange={field.onChange}
                disabled={disabled}
              />
              {fieldState.error?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {fieldState.error.message}
                </Text>
              )}
            </Box>
          )}
        />

        <Controller
          name="financial_int_installments"
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={financialText.installmentsInterval}
              allowDot={false}
              decimalPlaces={0}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              error={fieldState.error?.message}
              isRequired
              disabled={disabled}
            />
          )}
        />
      </SimpleGrid>

      <Button
        type="button"
        title={financialText.generateInstallments}
        variant="outline"
        size="sm"
        onClick={handleGenerateClick}
        disabled={disabled || !canGenerate}
      />

      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mt={4} mb={4}>
        {fields.length > 0 && (
          <Flex align="center" gap={2}>
            <Text fontSize="sm" color="fg.muted">
              {financialText.installmentsSumLabel}:
            </Text>
            <Badge colorPalette={isSumComplete ? 'green' : 'orange'} variant="subtle">
              {formatCurrencyBRL(totalInstallments)} / {formatCurrencyBRL(vlTotal)}
            </Badge>
          </Flex>
        )}
      </Flex>

      {arrayError && (
        <Text fontSize="xs" color="fg.error" mb={4}>
          {arrayError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {financialText.emptyInstallments}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => {
            const isEntryRow = hasInput && index === 0;

            if (isEntryRow) {
              return (
                <Flex key={field.id} gap={3} align="center" wrap="wrap">
                  <Badge colorPalette="blue" variant="subtle">
                    {financialText.installmentEntryBadge}
                  </Badge>
                  <Text fontSize="sm">{formatDateBRL(inputDate)}</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {formatCurrencyBRL(Number(inputValue) || 0)}
                  </Text>
                </Flex>
              );
            }

            return (
              <Flex key={field.id} gap={3} align="flex-end" wrap="wrap">
                <Box flex="1" minW="200px">
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    {financialText.installmentDate}
                  </Text>
                  <Controller
                    name={`installments.${index}.due_date`}
                    control={genericControl}
                    render={({ field: rowField }) => (
                      <DateInput
                        value={rowField.value ?? null}
                        onChange={rowField.onChange}
                        disabled={disabled}
                      />
                    )}
                  />
                </Box>

                <Box w={{ base: 'full', sm: '200px' }}>
                  <Controller
                    name={`installments.${index}.value`}
                    control={genericControl}
                    render={({ field: rowField, fieldState }) => (
                      <NumberInput
                        name={rowField.name}
                        label={financialText.installmentValue}
                        allowDot
                        decimalPlaces={2}
                        value={rowField.value ?? null}
                        onValueChange={(value) => rowField.onChange(value)}
                        error={fieldState.error?.message}
                        isRequired
                        disabled={disabled}
                      />
                    )}
                  />
                </Box>
              </Flex>
            );
          })}
        </Flex>
      )}

      <DeleteConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeGenerate}
        title={financialText.regenerateInstallmentsConfirmTitle}
        description={financialText.regenerateInstallmentsConfirmDescription}
        confirmButtonText={financialText.generateInstallments}
        tone="warning"
        colorPalette="orange"
      />
    </Box>
  );
}

export default TransferAbcInstallments;
