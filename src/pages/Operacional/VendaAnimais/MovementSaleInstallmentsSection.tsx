// src/pages/Operacional/VendaAnimais/MovementSaleInstallmentsSection.tsx
// -----------------------------------------------------------------------------
// TASK-VD-FE-04 — Fundação compartilhada do subfluxo financeiro de Vendas
// (`GAP-VENDAS-FE-04` §2.8-§2.10/§4, `GAP-VENDAS-FE-05` §3). Bloco "Condição
// de Pagamento - Parcelamento" consumido pelas telas de Criar/Editar (Tarefa
// 22) e Finalizar (Tarefa 23) — esta Tarefa NÃO monta o componente em
// nenhuma tela.
//
// Copy-adapt de DUAS fontes, conforme o Roteiro Cirúrgico:
//   - Gerador (Nº Parcelas/1º Vencimento/Intervalo) + confirmação de
//     sobrescrita (`DeleteConfirmDialog`) de
//     `src/pages/Financeiro/ContasAPagar/ExpenseInstallmentsTab.tsx`;
//   - Linha da tabela editável (`{date, value}`, soma reativa via
//     `useWatch`, badge de fechamento) de
//     `src/pages/Administrativo/FarmTransfer/FarmTransferInstallments.tsx`.
//
// Geradores (`qtd_installments`/`first_installment`/`int_installments`) em
// `useState` LOCAL — NUNCA entram no payload, exatamente como no legado
// (mirror `GAP-VENDAS-FE-04` §Estado). `int_installments` nasce com o
// DEFAULT `30` e exige `>= 1`.
//
// Divergências legadas a NÃO replicar (`income_form.blade.php`):
//   - `input type="test"` (typo literal, `:67,81,95`);
//   - `hasInput` que não checa `has_input == 1` (`:485`) — fora de escopo
//     aqui, "Entrada" nem existe nesta fundação (ver nota abaixo);
//   - `int_installments` vazio virando `0` (todas as parcelas na mesma
//     data) — aqui o gerador NUNCA dispara com intervalo `< 1`.
//
// Entrada (`has_input`/`input_date`/`input_value`) e "Dedutível"
// (`fiscal_document`) ficam FORA de escopo — sem campo na API de Vendas
// (`MovementSaleRequest`/`MovementSaleSlaughterRequest`, GAP-VENDAS-FE-04
// §D). Ausência limpa declarada, SEM MOCK.
//
// ⚠️ DIVERGÊNCIA DELIBERADA registrada (reconciliação Roteiro × Cenário de
// smoke desta própria Tarefa): o Roteiro pede reaproveitar `distributeEqually()`
// "literalmente" de `ExpenseInstallmentsTab.tsx` — mas aquela função absorve
// o resíduo de arredondamento na ÚLTIMA parcela (ex.: 1000/3 -> 333.33,
// 333.33, 333.34 = 1000.00 exato). O Cenário de smoke desta MESMA Tarefa
// (`21-vendas-financeiro-fundacao-compartilhada.md` §Cenários item 2) exige
// 3 linhas de EXATAMENTE `333.33` (soma `999.99`, tolerância `0.03`) — ou
// seja, SEM absorção de resto, mirror do texto do próprio Gap (`GAP-VENDAS-FE-04`
// §C: "parcelas iguais SEM TRATAMENTO DE RESTO", fórmula legada real). Os
// dois textos da Tarefa se contradizem entre si; seguido aqui o Cenário
// numérico explícito + a fórmula legada (fonte de verdade), não a prosa que
// pede reuso literal de uma função que produziria um resultado diferente do
// Cenário. `addDays()` É reaproveitada literalmente (sem esse conflito).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Badge, Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFieldArrayReplace,
  useWatch,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { IconButtonTable } from '@/components/IconButtonTable';

import { columnsForm } from '@/constants/coluns-form';

import type { LanguageDate } from '@/@types/language';
import type { MovementSaleForm, MovementSaleInstallmentRowForm } from '@/@types/v2/MovementSales';

export interface MovementSaleInstallmentFieldValues {
  financial_installments: MovementSaleInstallmentRowForm[];
}

export interface MovementSaleInstallmentsSectionProps {
  control: Control<MovementSaleForm>;
  fields: FieldArrayWithId<MovementSaleInstallmentFieldValues, 'financial_installments', 'id'>[];
  append: UseFieldArrayAppend<MovementSaleInstallmentFieldValues, 'financial_installments'>;
  remove: UseFieldArrayRemove;
  /** Regenerar SUBSTITUI o array inteiro (mirror `ExpenseInstallmentsTab.tsx`). */
  replace: UseFieldArrayReplace<MovementSaleInstallmentFieldValues, 'financial_installments'>;
  /** `total` da venda (recalculado por `MovementSaleTotalsBlock`) — base do gerador e do badge de fechamento. */
  vlTotal: number;
  errors: FieldErrors<MovementSaleForm>;
  languageGB: LanguageDate;
  disabled?: boolean;
}

const DEFAULT_INTERVAL_DAYS = 30;

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Distribui `total` em `count` parcelas iguais, SEM tratamento de resto —
 * mirror da fórmula legada real (`GAP-VENDAS-FE-04` §C: "amount = (total −
 * entrada) / qtd_installments, parcelas iguais sem tratamento de resto").
 * Deliberadamente DIFERENTE de `distributeEqually()` de
 * `ExpenseInstallmentsTab.tsx` (que absorve o resíduo na última parcela) —
 * ver nota de divergência no cabeçalho do arquivo.
 * @param {number} total - Valor total a distribuir.
 * @param {number} count - Número de parcelas.
 * @return {number[]} Valor de cada parcela (idêntico em todas), na ordem.
 */
function distributeInstallmentsEqually(total: number, count: number): number[] {
  if (count <= 0) return [];
  const share = Math.round((total / count) * 100) / 100;
  return new Array(count).fill(share);
}

// Reaproveitada LITERALMENTE de `ExpenseInstallmentsTab.tsx` — sem conflito
// com o Cenário de smoke (datas = `first + n × interval` dias).
function addDays(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function MovementSaleInstallmentsSection({
  control,
  fields,
  append,
  remove,
  replace,
  vlTotal,
  errors,
  languageGB,
  disabled = false,
}: MovementSaleInstallmentsSectionProps) {
  const financialText = languageGB.movementSales.movementSale.form.financial.installments;

  const genericControl = control as unknown as Control<MovementSaleInstallmentFieldValues>;
  const arrayError = (errors as any)?.financial_installments?.message as string | undefined;

  // Geradores — UI local, NUNCA entram no payload.
  const [installmentCount, setInstallmentCount] = useState<number | null>(null);
  const [firstInstallmentDate, setFirstInstallmentDate] = useState<string | null>(null);
  const [intervalDays, setIntervalDays] = useState<number | null>(DEFAULT_INTERVAL_DAYS);
  const [isOverwriteConfirmOpen, setIsOverwriteConfirmOpen] = useState(false);

  const watchedRows = useWatch({ control: genericControl, name: 'financial_installments' }) ?? [];
  const totalInstallments = watchedRows.reduce((sum, row) => sum + (Number(row?.value) || 0), 0);
  const isSumComplete =
    Math.abs(totalInstallments - vlTotal) <= 0.01 * Math.max(watchedRows.length, 1);

  function executeGenerate() {
    const count = Number(installmentCount) || 0;
    const interval = Number(intervalDays) || 0;
    if (count <= 0 || !firstInstallmentDate || interval < 1) return;

    const shares = distributeInstallmentsEqually(vlTotal, count);
    const rows = shares.map((value, idx) => ({
      date: addDays(firstInstallmentDate, idx * interval),
      value,
    }));

    replace(rows);
  }

  function handleGenerate() {
    if (fields.length > 0) {
      setIsOverwriteConfirmOpen(true);
      return;
    }
    executeGenerate();
  }

  function handleAdd() {
    append({ date: null, value: null });
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={1}>
        {financialText.sectionTitle}
      </Text>
      <Text fontSize="xs" color="fg.muted" mb={4}>
        {financialText.sectionHint}
      </Text>

      {/* ---- Gerador (UI local) ---- */}
      <Box p={4} bg="bg.panel" borderRadius="lg" mb={4}>
        <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
          <NumberInput
            name="movement_sale_installments_generator_count"
            label={financialText.qtdInstallments}
            allowDot={false}
            decimalPlaces={0}
            min={1}
            value={installmentCount}
            onValueChange={setInstallmentCount}
            disabled={disabled}
          />

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {financialText.firstInstallment}
            </Text>
            <DateInput
              value={firstInstallmentDate}
              onChange={setFirstInstallmentDate}
              disabled={disabled}
            />
          </Box>

          <NumberInput
            name="movement_sale_installments_generator_interval"
            label={financialText.intInstallments}
            allowDot={false}
            decimalPlaces={0}
            min={1}
            value={intervalDays}
            onValueChange={setIntervalDays}
            disabled={disabled}
          />
        </SimpleGrid>

        <Button
          type="button"
          title={financialText.generateButton}
          variant="outline"
          size="sm"
          mt={4}
          onClick={handleGenerate}
          disabled={disabled}
        />
      </Box>

      {/* ---- Tabela editável (RHF, `useFieldArray` do PAI) — permanece
          editável DEPOIS de gerada. ---- */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" color="fg.muted">
          {financialText.sumLabel}:
        </Text>
        {fields.length > 0 && (
          <Flex align="center" gap={2}>
            <Badge colorPalette={isSumComplete ? 'green' : 'orange'} variant="subtle">
              {formatCurrencyBRL(totalInstallments)} / {formatCurrencyBRL(vlTotal)}
            </Badge>
            {!isSumComplete && (
              <Text fontSize="xs" color="fg.muted">
                ({financialText.sumHint})
              </Text>
            )}
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
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-start" wrap="wrap">
              <Box flex="1" minW="200px">
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {financialText.installmentDate}
                </Text>
                <Controller
                  name={`financial_installments.${index}.date`}
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
                  name={`financial_installments.${index}.value`}
                  control={genericControl}
                  render={({ field: rowField, fieldState }) => (
                    <MoneyInput
                      name={rowField.name}
                      label={financialText.installmentValue}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={disabled}
                    />
                  )}
                />
              </Box>

              <IconButtonTable
                aria-label={financialText.removeInstallment}
                mensegerTooltip={financialText.removeInstallment}
                size="sm"
                color="red.500"
                variant="ghost"
                disabled={disabled}
                onClick={() => remove(index)}
              >
                <Icon as={FiTrash2} />
              </IconButtonTable>
            </Flex>
          ))}
        </Flex>
      )}

      <Button
        type="button"
        title={financialText.addInstallment}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />

      <DeleteConfirmDialog
        isOpen={isOverwriteConfirmOpen}
        onClose={() => setIsOverwriteConfirmOpen(false)}
        onConfirm={() => {
          executeGenerate();
          setIsOverwriteConfirmOpen(false);
        }}
        title={financialText.regenerateConfirmTitle}
        description={financialText.regenerateConfirmDescription}
        tone="warning"
        hideQuestionMark
        confirmButtonText={languageGB.defaltStrings.confirm}
      />
    </Box>
  );
}

export default MovementSaleInstallmentsSection;
