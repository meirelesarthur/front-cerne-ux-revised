// src/pages/Financeiro/OfxImport/Reconciliation/WriteoffIncomeModal.tsx
// -----------------------------------------------------------------------------
// Modal "Vincular Título de Receita" (SURF-068) da Conciliação Bancária da
// Importação OFX (F-114, 97-Esteiras/064, TASK-064-OFX-FE-02). Mirror
// ESTRUTURAL de `WriteoffExpenseModal.tsx` (mesmo racional de 2 passos), só
// trocando o domínio: adapta o fluxo legado `modalIncome`
// (modal_income.blade.php, FLD-36..41) para `GET /api/v1/incomes` (LK-09,
// busca por cliente/período) + `POST /api/v1/writeoffs/batch`
// (`segment='incomes'`, reuso INTEGRAL do `WriteOffBatchModal` — NENHUMA
// Tarefa de API nova, NENHUMA lógica de baixa duplicada).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { FormSurface, type FormSurfaceVariant } from '@/components/ui/FormSurface';
import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Checkbox } from '@/components/ui/checkbox';
import { WriteOffBatchModal } from '@/components/WriteOff/WriteOffBatchModal';
import type { WriteOffBatchModalRowInput } from '@/components/WriteOff/WriteOffBatchModal';

import { useLanguage } from '@/hooks/useLanguage';

import type { ClientOptionItem } from '@/services/v2/CadastrosBase/Client/client-service';
import { listClientOptions } from '@/services/v2/CadastrosBase/Client/client-service';
import { listIncomes } from '@/services/v2/Incomes/income-service';

import type { Option } from '@/@types/option';
import type { OfxReconciliationItem } from '@/@types/v2/Financeiro/ofxImport/reconciliation';

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function findClientParams(search: string | { search: string }) {
  return { search: typeof search === 'string' ? search : search.search };
}

export interface WriteoffIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** `panel` = formulário inline no painel de conciliação (sem modal). Default: `dialog`. */
  variant?: FormSurfaceVariant;
  item: OfxReconciliationItem | null;
  onSuccess: () => void;
}

export function WriteoffIncomeModal({
  isOpen,
  onClose,
  variant = 'dialog',
  item,
  onSuccess,
}: WriteoffIncomeModalProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.ofxImports.ofxImport.reconciliation.writeoffModal;

  const [step, setStep] = useState<'pick' | 'batch'>('pick');
  const [clientOption, setClientOption] = useState<Option<string> | null>(null);
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');
  const [selectedUuids, setSelectedUuids] = useState<Record<string, boolean>>({});
  const [batchRows, setBatchRows] = useState<WriteOffBatchModalRowInput[]>([]);

  useEffect(() => {
    if (!isOpen || !item) return;
    setStep('pick');
    setClientOption(null);
    setDueDateFrom(addDays(item.date, -10));
    setDueDateTo(addDays(item.date, 10));
    setSelectedUuids({});
    setBatchRows([]);
    // Deps: reset só na abertura/troca de transação — os `set*` são
    // estáveis (`useState`), incluí-los na lista não muda o comportamento.
  }, [isOpen, item?.fit_id]);

  const titlesQuery = useQuery({
    queryKey: ['ofx-reconciliation-writeoff-incomes', clientOption, dueDateFrom, dueDateTo],
    queryFn: () =>
      listIncomes({
        client_id: clientOption!.value,
        due_date_from: dueDateFrom || undefined,
        due_date_to: dueDateTo || undefined,
        per_page: 50,
        page: 1,
      }),
    enabled: isOpen && step === 'pick' && !!clientOption,
  });

  const openTitles = useMemo(
    () => (titlesQuery.data?.data?.items ?? []).filter((title) => title.balance > 0),
    [titlesQuery.data]
  );

  function toggleSelected(uuid: string, checked: boolean) {
    setSelectedUuids((prev) => ({ ...prev, [uuid]: checked }));
  }

  const selectedCount = Object.values(selectedUuids).filter(Boolean).length;
  const selectedTotal = openTitles
    .filter((title) => selectedUuids[title.uuid])
    .reduce((sum, title) => sum + title.balance, 0);

  function handleContinue() {
    const rows: WriteOffBatchModalRowInput[] = openTitles
      .filter((title) => selectedUuids[title.uuid])
      .map((title) => ({
        titleUuid: title.uuid,
        titleNumber: title.number,
        titleBalance: title.balance,
      }));
    if (rows.length === 0) return;
    setBatchRows(rows);
    setStep('batch');
  }

  return (
    <>
      <FormSurface
        variant={variant}
        isOpen={isOpen && step === 'pick'}
        onClose={onClose}
        title={text.incomeTitle}
        size="xl"
        maxH="85vh"
        scrollableBody
        footer={
          <Flex justify="space-between" align="center" w="full">
            <Text fontSize="sm" color="fg.muted">
              {text.selectedTotalLabel}:{' '}
              {selectedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Text>
            <Flex gap={3}>
              <Button
                title={languageGB.defaltStrings.cancel}
                variant="outline"
                type="button"
                onClick={onClose}
              />
              <Button
                title={text.continueButton}
                type="button"
                onClick={handleContinue}
                disabled={selectedCount === 0}
              />
            </Flex>
          </Flex>
        }
      >
        {!isOpen || !item ? null : (
          <WriteoffIncomeModalBody
            clientOption={clientOption}
            setClientOption={setClientOption}
            dueDateFrom={dueDateFrom}
            setDueDateFrom={setDueDateFrom}
            dueDateTo={dueDateTo}
            setDueDateTo={setDueDateTo}
            openTitles={openTitles}
            selectedUuids={selectedUuids}
            toggleSelected={toggleSelected}
            isLoading={titlesQuery.isFetching}
          />
        )}
      </FormSurface>

      <WriteOffBatchModal
        isOpen={isOpen && step === 'batch'}
        onClose={() => setStep('pick')}
        segment="incomes"
        rows={batchRows}
        onSuccess={() => {
          onSuccess();
          onClose();
        }}
      />
    </>
  );
}

interface WriteoffIncomeModalBodyProps {
  clientOption: Option<string> | null;
  setClientOption: (option: Option<string> | null) => void;
  dueDateFrom: string;
  setDueDateFrom: (value: string) => void;
  dueDateTo: string;
  setDueDateTo: (value: string) => void;
  openTitles: { uuid: string; number: string; due_date: string; balance: number }[];
  selectedUuids: Record<string, boolean>;
  toggleSelected: (uuid: string, checked: boolean) => void;
  isLoading: boolean;
}

function WriteoffIncomeModalBody({
  clientOption,
  setClientOption,
  dueDateFrom,
  setDueDateFrom,
  dueDateTo,
  setDueDateTo,
  openTitles,
  selectedUuids,
  toggleSelected,
  isLoading,
}: WriteoffIncomeModalBodyProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.ofxImports.ofxImport.reconciliation.writeoffModal;

  return (
    <Box>
      <Text fontSize="sm" color="fg.muted" mb={4}>
        {text.hint}
      </Text>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        <SelectAsyncPaginate
          name="client_id"
          label={text.clientLabel}
          placeholder={text.clientPlaceholder}
          service={listClientOptions}
          mapOptions={(clientItem: ClientOptionItem) => ({
            label: clientItem.name,
            value: clientItem.uuid,
          })}
          findParams={findClientParams}
          value={clientOption ?? undefined}
          onChange={(option: any) => setClientOption(option ?? null)}
          isRequired
        />

        <Field label={text.dueDateFrom}>
          <DateInput value={dueDateFrom} onChange={(value) => setDueDateFrom(value ?? '')} />
        </Field>

        <Field label={text.dueDateTo}>
          <DateInput value={dueDateTo} onChange={(value) => setDueDateTo(value ?? '')} />
        </Field>
      </SimpleGrid>

      <Box
        mt={4}
        border="1px solid"
        borderColor="border.subtle"
        borderRadius="lg"
        overflow="hidden"
      >
        {!clientOption ? (
          <Box p={4}>
            <Text fontSize="sm" color="fg.muted">
              {text.selectPartyHint}
            </Text>
          </Box>
        ) : isLoading ? (
          <Box p={4}>
            <Text fontSize="sm" color="fg.muted">
              {languageGB.defaltStrings.loading}
            </Text>
          </Box>
        ) : openTitles.length === 0 ? (
          <Box p={4}>
            <Text fontSize="sm" color="fg.muted">
              {text.emptyTitles}
            </Text>
          </Box>
        ) : (
          <Flex direction="column">
            {openTitles.map((title) => (
              <Flex
                key={title.uuid}
                align="center"
                gap={4}
                p={3}
                borderBottomWidth="1px"
                borderColor="border.subtle"
              >
                <Checkbox
                  checked={!!selectedUuids[title.uuid]}
                  onCheckedChange={(d: any) => toggleSelected(title.uuid, !!d.checked)}
                />
                <Text fontSize="sm" flex="1">
                  {title.number}
                </Text>
                <Text fontSize="sm" color="fg.muted" minW="110px">
                  {title.due_date
                    ? new Date(`${title.due_date}T00:00:00`).toLocaleDateString('pt-BR')
                    : '—'}
                </Text>
                <Text fontSize="sm" fontWeight="medium" minW="120px" textAlign="right">
                  {title.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
              </Flex>
            ))}
          </Flex>
        )}
      </Box>
    </Box>
  );
}
