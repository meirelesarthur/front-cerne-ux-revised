// src/pages/Financeiro/OfxImport/Reconciliation/WriteoffExpenseModal.tsx
// -----------------------------------------------------------------------------
// Modal "Vincular Título de Despesa" (SURF-067) da Conciliação Bancária da
// Importação OFX (F-114, 97-Esteiras/064, TASK-064-OFX-FE-02). Adapta o
// fluxo legado `modalExpense` (modal_expense.blade.php, FLD-30..35, CV-05,
// INT-09/INT-10) para o par de rotas já migrado: `GET /api/v1/expenses`
// (LK-08, busca de títulos em aberto por fornecedor/período) + `POST
// /api/v1/writeoffs/batch` (reuso INTEGRAL do módulo compartilhado de baixa
// em lote já existente, `WriteOffBatchModal`/`writeoff-service.ts` —
// TASK-036-GB-05/09) — NENHUMA Tarefa de API nova.
//
// 2 passos, mesmo componente:
//   1. "pick"  — busca Fornecedor (mirror FLD-30) + período (FLD-31/32,
//      default ±10 dias da data da transação OFX, mesmo racional legado) →
//      lista títulos em aberto (`balance>0`, client-side — o backend não
//      tem um filtro de "status aberto" equivalente ao que o legado
//      aplicava implicitamente) → usuário marca 1+ (mirror FLD-33 ids[]).
//   2. "batch" — `WriteOffBatchModal` COMPARTILHADO recebe as linhas já
//      selecionadas (`segment='expenses'`) e conduz o resto do fluxo de
//      baixa (conta bancária, data, tipo de baixa) — NENHUMA lógica de
//      baixa duplicada aqui.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Checkbox } from '@/components/ui/checkbox';
import { WriteOffBatchModal } from '@/components/WriteOff/WriteOffBatchModal';
import type { WriteOffBatchModalRowInput } from '@/components/WriteOff/WriteOffBatchModal';

import { useLanguage } from '@/hooks/useLanguage';

import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listExpenses } from '@/services/v2/Financeiro/Expenses/expense-service';

import type { Option } from '@/@types/option';
import type { OfxReconciliationItem } from '@/@types/v2/Financeiro/ofxImport/reconciliation';

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function findProviderParams(search: string | { search: string }) {
  return { search: typeof search === 'string' ? search : search.search };
}

export interface WriteoffExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: OfxReconciliationItem | null;
  onSuccess: () => void;
}

export function WriteoffExpenseModal({
  isOpen,
  onClose,
  item,
  onSuccess,
}: WriteoffExpenseModalProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.ofxImports.ofxImport.reconciliation.writeoffModal;

  const [step, setStep] = useState<'pick' | 'batch'>('pick');
  const [providerOption, setProviderOption] = useState<Option<string> | null>(null);
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');
  const [selectedUuids, setSelectedUuids] = useState<Record<string, boolean>>({});
  const [batchRows, setBatchRows] = useState<WriteOffBatchModalRowInput[]>([]);

  // Reabertura (mirror FLD-31/32) — reseta seleção/passo e pré-preenche o
  // período default (±10 dias da data da transação OFX) a cada nova
  // abertura do modal, nunca durante a sessão já aberta.
  useEffect(() => {
    if (!isOpen || !item) return;
    setStep('pick');
    setProviderOption(null);
    setDueDateFrom(addDays(item.date, -10));
    setDueDateTo(addDays(item.date, 10));
    setSelectedUuids({});
    setBatchRows([]);
    // Deps: reset só na abertura/troca de transação — os `set*` são
    // estáveis (`useState`), incluí-los na lista não muda o comportamento.
  }, [isOpen, item?.fit_id]);

  const titlesQuery = useQuery({
    queryKey: ['ofx-reconciliation-writeoff-expenses', providerOption, dueDateFrom, dueDateTo],
    queryFn: () =>
      listExpenses({
        provider_uuid: providerOption!.value,
        due_date_from: dueDateFrom || undefined,
        due_date_to: dueDateTo || undefined,
        per_page: 50,
        page: 1,
      }),
    enabled: isOpen && step === 'pick' && !!providerOption,
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
      <CustomDialog
        isOpen={isOpen && step === 'pick'}
        onClose={onClose}
        title={text.expenseTitle}
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
          <WriteoffExpenseModalBody
            item={item}
            providerOption={providerOption}
            setProviderOption={setProviderOption}
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
      </CustomDialog>

      <WriteOffBatchModal
        isOpen={isOpen && step === 'batch'}
        onClose={() => setStep('pick')}
        segment="expenses"
        rows={batchRows}
        onSuccess={() => {
          onSuccess();
          onClose();
        }}
      />
    </>
  );
}

interface WriteoffExpenseModalBodyProps {
  item: OfxReconciliationItem;
  providerOption: Option<string> | null;
  setProviderOption: (option: Option<string> | null) => void;
  dueDateFrom: string;
  setDueDateFrom: (value: string) => void;
  dueDateTo: string;
  setDueDateTo: (value: string) => void;
  openTitles: { uuid: string; number: string; due_date: string | null; balance: number }[];
  selectedUuids: Record<string, boolean>;
  toggleSelected: (uuid: string, checked: boolean) => void;
  isLoading: boolean;
}

function WriteoffExpenseModalBody({
  providerOption,
  setProviderOption,
  dueDateFrom,
  setDueDateFrom,
  dueDateTo,
  setDueDateTo,
  openTitles,
  selectedUuids,
  toggleSelected,
  isLoading,
}: WriteoffExpenseModalBodyProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.ofxImports.ofxImport.reconciliation.writeoffModal;

  return (
    <Box>
      <Text fontSize="sm" color="fg.muted" mb={4}>
        {text.hint}
      </Text>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        <SelectAsyncPaginate
          name="provider_uuid"
          label={text.providerLabel}
          placeholder={text.providerPlaceholder}
          service={listProviderOptions}
          mapOptions={(providerItem: ProviderOptionItem) => ({
            label: providerItem.label,
            value: providerItem.uuid,
          })}
          findParams={findProviderParams}
          value={providerOption ?? undefined}
          onChange={(option: any) => setProviderOption(option ?? null)}
          isRequired
          // FIX homologação (SURF-067) — o menu deste Select é o PRIMEIRO
          // conteúdo do body (`CustomDialog scrollableBody`, `Dialog.Body`
          // com `overflowY:"auto"`, mirror `dialog.js` slot recipe) e, com
          // pouco conteúdo abaixo (hint "selecione um fornecedor"), o body
          // ainda não cresceu o suficiente para caber a lista de opções —
          // o menu (position:absolute por padrão, mirror `customStyles`)
          // estoura a borda do card e é cortado pelo overflow do body.
          // `position="fixed"` + `menuPosition="fixed"` tiram o menu do
          // fluxo/clipping do `Dialog.Body` (ele passa a se posicionar
          // relativo ao viewport, não ao container com overflow) SEM criar
          // Portal para `document.body` — continua nó-filho da própria
          // árvore do `Dialog.Root` (`Portal` do `CustomDialog`), então NÃO
          // reincide no bug de clicabilidade (`aria-hidden`/`inert`) já
          // resolvido em outros modais via `disablePortal` (ver
          // `WriteOffBatchModal`/`WriteOffCreateModal`/
          // `GenerateTransferDialog`, comentário "execução 045, FIX A").
          // NECESSÁRIO passar as DUAS props: `menuPosition` (cálculo interno
          // do react-select de top/left) e `position` (prop própria do
          // wrapper, que o `customStyles().menu()` usa para o CSS
          // `position` final — sem ela, o wrapper reescreve de volta para
          // "absolute" e anula o `menuPosition="fixed"`).
          position="fixed"
          menuPosition="fixed"
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
        {!providerOption ? (
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
