// src/pages/Invoices/InvoiceInstallmentsTab.tsx
// -----------------------------------------------------------------------------
// Aba "Parcelamento" do formulário de Invoice — TASK-FE-2765. A peça mais
// peculiar da tela: um GERADOR de parcelas (UI PURA, "Possui entrada?"/
// "Data entrada"/"Valor entrada"/"Nº Parcelas"/"Venc. 1ª PC"/"Intervalo
// (dias)") que produz a tabela `Parcela/Vencimento/Valor` — só a tabela final
// (`due_date`+`value` por linha) é o que o contrato aceita como payload
// (`installments[]`). Os 6 campos do gerador vivem em `useState` LOCAL desta
// aba (NÃO no `useForm` raiz — mirror "estado fora do RHF quando o campo não
// é do payload", mesma separação de `imageFile` em
// `CreateOrUpdateEquipamento.tsx`).
//
// Fórmula do gerador (decisão de implementação registrada, sem precedente
// exato no fork): com entrada — 1ª linha usa Data/Valor de entrada
// diretamente; as `Nº Parcelas` linhas seguintes usam `Venc. 1ª PC` como
// vencimento da 1ª parcela regular, somando `Intervalo (dias)` a cada
// vencimento subsequente; valor de cada parcela regular = `(vl_total −
// valor_entrada) / Nº Parcelas`, com o RESTO de arredondamento absorvido pela
// ÚLTIMA parcela regular (mesmo racional de fechamento de centavos já
// documentado no rateio, `InvoiceApportionmentTab.tsx`/contrato §10.3). Sem
// entrada: `Nº Parcelas` linhas, 1ª vencendo em `Venc. 1ª PC`, valor =
// `vl_total / Nº Parcelas` (mesma distribuição, resto na última).
//
// `vl_total` alvo é o MESMO calculado em `InvoiceItemsTab.tsx` — lido via
// `watch` do form raiz, nunca recalculado com uma 2ª fórmula.
//
// WRITE-ONLY (achado real, não documentado no packet original) — o backend
// NUNCA devolve o parcelamento persistido e `UpdateInvoiceAction` o IGNORA no
// PUT (Contas a Pagar imutáveis pós-criação). Em EDIÇÃO esta aba fica
// desabilitada/informativa (sem dado para reidratar, sem efeito no PUT) —
// `invoice-schema.ts` já não exige/valida `installments` quando `isEditing`.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Badge, Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import type { Option } from '@/@types/option';
import type { InvoiceForm, InvoiceItemForm } from '@/@types/v2/Invoices';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface InvoiceInstallmentsTabProps {
  control: Control<InvoiceForm>;
  errors: FieldErrors<InvoiceForm>;
  watch: UseFormWatch<InvoiceForm>;
  setValue: UseFormSetValue<InvoiceForm>;
  isLoading: boolean;
  canSave: boolean;
  isEditing: boolean;
}

/**
 * Recalcula o Vl. Total do documento — mesma fórmula de
 * `InvoiceItemsTab.tsx`, nunca uma 2ª fonte de verdade.
 * @param {UseFormWatch<InvoiceForm>} watch - `watch` do form raiz.
 * @return {number} Vl. Total calculado no client (preview).
 */
function computeVlTotal(watch: UseFormWatch<InvoiceForm>): number {
  const items = (watch('items') ?? []) as InvoiceItemForm[];
  const vlItems = items.reduce((total, item) => {
    const quantity = Number(item?.quantity) || 0;
    const amount = Number(item?.amount) || 0;
    const discount = Number(item?.discount) || 0;
    return total + (quantity * amount - discount);
  }, 0);
  const vlFreight = Number(watch('vl_freight')) || 0;
  const vlIpi = Number(watch('vl_ipi')) || 0;
  const vlDiscount = Number(watch('vl_discount')) || 0;
  const vlSafe = Number(watch('vl_safe')) || 0;
  const vlExpense = Number(watch('vl_expense')) || 0;
  return vlItems + vlFreight + vlIpi - vlDiscount + vlSafe + vlExpense;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Distribui `total` em `count` parcelas iguais, absorvendo o resto de
 * arredondamento (centavos) na ÚLTIMA parcela — mesma técnica documentada
 * para o rateio (`InvoiceApportionmentTab.tsx`, contrato §10.3).
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

export function InvoiceInstallmentsTab({
  control,
  errors,
  watch,
  isLoading,
  canSave,
  isEditing,
}: InvoiceInstallmentsTabProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.invoices.invoice.form;

  const { fields, replace, remove } = useFieldArray({ control, name: 'installments' });

  const isDisabled = !canSave || isLoading || isEditing;

  // ---- Estado LOCAL do gerador (fora do RHF, não é campo do payload) ----
  const [hasDownPayment, setHasDownPayment] = useState(false);
  const [downPaymentDate, setDownPaymentDate] = useState<string | null>(null);
  const [downPaymentValue, setDownPaymentValue] = useState<number | null>(null);
  const [installmentCount, setInstallmentCount] = useState<number | null>(null);
  const [firstDueDate, setFirstDueDate] = useState<string | null>(null);
  const [intervalDays, setIntervalDays] = useState<number | null>(30);

  // TASK-FE-649 (DF-20) — `window.confirm()` nativo trocado por Dialog
  // in-app (`DeleteConfirmDialog`, já padronizado no `cerne`, reaproveitado
  // 1:1 — mesmo componente usado em `CreateOrUpdateAppropriation.tsx` para o
  // confirm de "Finalizar").
  const [isOverwriteConfirmOpen, setIsOverwriteConfirmOpen] = useState(false);

  const vlTotal = computeVlTotal(watch);

  const watchedInstallments = watch('installments') ?? [];
  const totalInstallments = watchedInstallments.reduce(
    (sum, row) => sum + (Number(row?.value) || 0),
    0
  );
  const isSumComplete =
    Math.abs(totalInstallments - vlTotal) <= 0.01 * Math.max(watchedInstallments.length, 1);

  const arrayError = errors.installments?.message as string | undefined;

  function executeGenerate() {
    const count = Number(installmentCount) || 0;
    if (count <= 0 || !firstDueDate) return;

    const rows: { due_date: string; value: number }[] = [];

    if (hasDownPayment && downPaymentDate && downPaymentValue) {
      rows.push({ due_date: downPaymentDate, value: Number(downPaymentValue) });
      const remaining = vlTotal - Number(downPaymentValue);
      const shares = distributeEqually(remaining, count);
      shares.forEach((value, idx) => {
        rows.push({ due_date: addDays(firstDueDate, idx * (Number(intervalDays) || 0)), value });
      });
    } else {
      const shares = distributeEqually(vlTotal, count);
      shares.forEach((value, idx) => {
        rows.push({ due_date: addDays(firstDueDate, idx * (Number(intervalDays) || 0)), value });
      });
    }

    replace(rows);
  }

  function handleGenerate() {
    if (fields.length > 0) {
      setIsOverwriteConfirmOpen(true);
      return;
    }
    executeGenerate();
  }

  function handleAddRow() {
    replace([...watchedInstallments, { due_date: null, value: null }] as any);
  }

  if (isEditing) {
    return (
      <Box pt={4}>
        <Text fontSize="sm" color="fg.muted">
          {formText.hints.writeOnlyDisabledInEdit}
        </Text>
      </Box>
    );
  }

  return (
    <Box pt={4}>
      {/* ---- Gerador (UI local) ---- */}
      <Box p={4} bg="bg.muted" borderRadius="lg" mb={6}>
        <Text fontSize="sm" fontWeight="semibold" mb={4}>
          {formText.sections.installmentGenerator}
        </Text>
        <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
          <Select
            label={formText.fields.hasDownPayment}
            name="hasDownPayment"
            value={
              [
                { value: true, label: languageGB.defaltStrings.yes },
                { value: false, label: languageGB.defaltStrings.no },
              ].find((option) => option.value === hasDownPayment) ?? null
            }
            onChange={(option: Option<boolean> | null) => setHasDownPayment(!!option?.value)}
            options={[
              { value: true, label: languageGB.defaltStrings.yes },
              { value: false, label: languageGB.defaltStrings.no },
            ]}
            noClearable
            isDisabled={isDisabled}
          />

          {hasDownPayment && (
            <>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {formText.fields.downPaymentDate}
                </Text>
                <DateInput
                  value={downPaymentDate}
                  onChange={setDownPaymentDate}
                  disabled={isDisabled}
                />
              </Box>
              <NumberInput
                name="downPaymentValue"
                label={formText.fields.downPaymentValue}
                allowDot
                decimalPlaces={2}
                value={downPaymentValue}
                onValueChange={setDownPaymentValue}
                disabled={isDisabled}
              />
            </>
          )}

          <NumberInput
            name="installmentCount"
            label={formText.fields.installmentCount}
            allowDot={false}
            decimalPlaces={0}
            min={1}
            value={installmentCount}
            onValueChange={setInstallmentCount}
            disabled={isDisabled}
          />

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {formText.fields.firstDueDate}
            </Text>
            <DateInput value={firstDueDate} onChange={setFirstDueDate} disabled={isDisabled} />
          </Box>

          <NumberInput
            name="intervalDays"
            label={formText.fields.intervalDays}
            allowDot={false}
            decimalPlaces={0}
            min={0}
            value={intervalDays}
            onValueChange={setIntervalDays}
            disabled={isDisabled}
          />
        </SimpleGrid>

        <Button
          title={formText.installmentRow.generateButton}
          variant="outline"
          size="sm"
          mt={4}
          onClick={handleGenerate}
          disabled={isDisabled}
        />
      </Box>

      {/* ---- Tabela editável (RHF, useFieldArray) ---- */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" color="fg.muted">
          {formText.installmentRow.sumBadgeLabel}
        </Text>
        {fields.length > 0 && (
          <Badge colorPalette={isSumComplete ? 'green' : 'orange'} variant="subtle">
            {formatCurrencyBRL(totalInstallments)} / {formatCurrencyBRL(vlTotal)}
          </Badge>
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
            {formText.installmentRow.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-end" wrap="wrap">
              <Box flex="1" minW="200px">
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {formText.installmentRow.dueDate}
                </Text>
                <Controller
                  name={`installments.${index}.due_date`}
                  control={control}
                  render={({ field: rowField }) => (
                    <DateInput
                      value={rowField.value ?? null}
                      onChange={rowField.onChange}
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <Box w={{ base: 'full', sm: '200px' }}>
                <Controller
                  name={`installments.${index}.value`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <NumberInput
                      name={rowField.name}
                      label={formText.installmentRow.value}
                      allowDot
                      decimalPlaces={2}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <IconButtonTable
                aria-label={formText.installmentRow.removeButton}
                mensegerTooltip={formText.installmentRow.removeButton}
                size="sm"
                color="red.500"
                variant="ghost"
                disabled={isDisabled}
                onClick={() => remove(index)}
              >
                <Icon as={FiTrash2} />
              </IconButtonTable>
            </Flex>
          ))}
        </Flex>
      )}

      <Button
        title={formText.installmentRow.addButton}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={handleAddRow}
        disabled={isDisabled}
      />

      <DeleteConfirmDialog
        isOpen={isOverwriteConfirmOpen}
        onClose={() => setIsOverwriteConfirmOpen(false)}
        onConfirm={() => {
          executeGenerate();
          setIsOverwriteConfirmOpen(false);
        }}
        description={formText.installmentRow.overwriteConfirm}
        tone="warning"
        hideQuestionMark
        confirmButtonText={languageGB.defaltStrings.confirm}
      />
    </Box>
  );
}
