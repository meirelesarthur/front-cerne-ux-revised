// src/pages/Fiscal/CashBook/CashBookDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (show) de CashBook (LCDPR — Livro Caixa Digital do
// Produtor Rural, domínio Fiscal, execução 045, TASK-LCDPR-FE-04). 100%
// leitura — sem `useForm`/mutação de update (não existe edição, `RT-NA-EDIT`).
//
// `period`/`special`/`verification` são exibidos com o `label` devolvido
// DIRETO pela API (`CashBookDetailResource`, já resolvido por
// `CashBookPeriodEnum::label()` etc.) — nunca recalculados via options
// factory local, garantindo paridade byte-a-byte com o texto legal (ver
// nota de topo dos `@types/v2/Fiscal/cashBook`).
//
// Resumo mensal (`monthly_summary`) é `null` quando o TXT não existe mais no
// storage — a seção é OMITIDA silenciosamente, sem mensagem de erro
// (`EV-SHOW-CONTROLLER`, paridade exata com o legado).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import {
  Box,
  Flex,
  Heading,
  Icon,
  Skeleton,
  SimpleGrid,
  Table as ChakraTable,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FiAlertCircle, FiDownload, FiPrinter, FiTrash2 } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { queryKey } from '@/constants/query-key';

import {
  deleteCashBook,
  downloadCashBookReport,
  downloadCashBookTxt,
  getCashBook,
} from '@/services/v2/Fiscal/CashBook/cash-book-service';

export default function CashBookDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.cashBooks.cashBook;

  // Guard de navegação: `uuid` inválido (não GUID) → volta à listagem antes
  // de renderizar.
  useEffect(() => {
    if (!uuid || !isValidGuid(uuid)) {
      navigate('/fiscal/livro-caixa', { replace: true });
    }
  }, [uuid, navigate]);

  const cashBookQuery = useQuery({
    queryKey: [queryKey.cashBooks.cashBook, uuid],
    queryFn: async () => {
      const response = await getCashBook(uuid!);
      return response.data;
    },
    enabled: !!uuid && isValidGuid(uuid),
    retry: false,
  });

  const data = cashBookQuery.data;

  // ---- Downloads ------------------------------------------------------------
  const [isDownloadingTxt, setIsDownloadingTxt] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  async function handleDownloadTxt() {
    if (!uuid || !data) return;
    setIsDownloadingTxt(true);
    try {
      const blob = await downloadCashBookTxt(uuid);
      downloadBlob(blob, data.filename || `livro-caixa-${data.year}.txt`);
    } catch {
      toaster.error({ title: text.singularLabel, description: text.detail.downloadTxtError });
    } finally {
      setIsDownloadingTxt(false);
    }
  }

  async function handlePrintReport() {
    if (!uuid || !data) return;
    setIsDownloadingReport(true);
    try {
      const blob = await downloadCashBookReport(uuid);
      const reportFilename = data.filename
        ? data.filename.replace(/\.txt$/i, '.pdf')
        : `livro-caixa-${data.year}.pdf`;
      downloadBlob(blob, reportFilename);
    } catch {
      toaster.error({ title: text.singularLabel, description: text.detail.downloadReportError });
    } finally {
      setIsDownloadingReport(false);
    }
  }

  // ---- Exclusão ---------------------------------------------------------
  const {
    open: isOpenDeleteDialog,
    onOpen: onOpenDeleteDialog,
    onClose: onCloseDeleteDialog,
  } = useDisclosure();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!uuid) return;
    setIsDeleting(true);
    try {
      await deleteCashBook(uuid);
      queryClient.invalidateQueries({ queryKey: [queryKey.cashBooks.cashBooksList] });
      toaster.success({ title: text.singularLabel, description: text.detail.deleteSuccess });
      navigate('/fiscal/livro-caixa');
    } catch (error) {
      // Falha de storage não deve expor detalhe técnico ao usuário (`CL-16`).
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) || text.detail.deleteError,
      });
    } finally {
      setIsDeleting(false);
      onCloseDeleteDialog();
    }
  }

  if (!uuid || !isValidGuid(uuid)) {
    return null;
  }

  return (
    <FormContainer
      title={text.detail.pageTitle}
      headerActions={
        !cashBookQuery.isLoading && data ? (
          <Flex gap={2}>
            {can('cash-book_view') && (
              <Button
                title={text.detail.actions.downloadTxt}
                icon={FiDownload as any}
                variant="outline"
                size="sm"
                loading={isDownloadingTxt}
                onClick={handleDownloadTxt}
              />
            )}
            {can('cash-book_view') && (
              <Button
                title={text.detail.actions.printReport}
                icon={FiPrinter as any}
                variant="outline"
                size="sm"
                loading={isDownloadingReport}
                onClick={handlePrintReport}
              />
            )}
            {can('cash-book_delete') && (
              <Button
                title={text.detail.actions.delete}
                icon={FiTrash2 as any}
                variant="outline"
                colorPalette="red"
                size="sm"
                onClick={onOpenDeleteDialog}
              />
            )}
          </Flex>
        ) : undefined
      }
    >
      {/* `FormContainer` só aplica padding horizontal (`PAD`) no ramo COM
          `footer` (via `ScrollArea.Content`); esta tela é read-only e não
          passa `footer`, caindo no ramo `<Box>{children}</Box>` sem `px`.
          Correção LOCAL e pontual (decisão do dono): envolver o conteúdo em
          `px={5}` aqui, sem tocar em `FormContainer.tsx` (usado por ~80
          telas — correção da raiz fica para outra tarefa). Retest do dono
          (lote-2): adicionado `pb={5}` — o card ficava sem respiro abaixo do
          último campo ("Forma de Apuração"); mesmo valor `PAD=5` do
          `FormContainer` no ramo com footer, para consistência visual. `pt`
          não é necessário: o header já tem `mb={4}` próprio no
          `FormContainer`. */}
      <Box px={5} pb={5}>
        {cashBookQuery.isLoading ? (
          <VStack align="stretch" gap={4} py={4}>
            <Skeleton height="20px" />
            <Skeleton height="20px" />
            <Skeleton height="20px" />
          </VStack>
        ) : cashBookQuery.isError || !data ? (
          <VStack gap={3} py={12}>
            <Icon as={FiAlertCircle} boxSize={8} color="red.400" />
            <Text color="fg.muted">{text.detail.loadError.message}</Text>
            <Button
              variant="outline"
              title={text.detail.loadError.retry}
              onClick={() => cashBookQuery.refetch()}
            />
          </VStack>
        ) : (
          <VStack align="stretch" gap={8}>
            {/* Metadados (FM-14..20) — read-only, labels traduzidos dos 3
              enums vêm DIRETO da API (data.period.label/etc.), nunca
              recalculados no front. */}
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4}>
              <InputReadOnly label={text.detail.metadata.year} value={String(data.year)} />
              <InputReadOnly
                label={text.detail.metadata.proprietary}
                value={data.proprietary.label}
              />
              <InputReadOnly label={text.detail.metadata.contador} value={data.contador.label} />
              <InputReadOnly label={text.detail.metadata.period} value={data.period.label} />
              <InputReadOnly label={text.detail.metadata.special} value={data.special.label} />
              <InputReadOnly
                label={text.detail.metadata.dtSpecial}
                value={
                  data.dt_special
                    ? formatDate(data.dt_special)
                    : text.detail.metadata.dtSpecialEmpty
                }
              />
              <InputReadOnly
                label={text.detail.metadata.verification}
                value={data.verification.label}
              />
            </SimpleGrid>

            {/* Resumo mensal (Q200, LM-S-01..04) — OMITIDO sem erro se o TXT
              não existe mais (`monthly_summary === null`). */}
            {data.monthly_summary && data.monthly_summary.length > 0 && (
              <Box>
                <Heading size="sm" mb={3} color="brandColorText">
                  {text.detail.monthly.title}
                </Heading>
                <Box overflowX="auto">
                  <ChakraTable.Root size="sm">
                    <ChakraTable.Header>
                      <ChakraTable.Row>
                        <ChakraTable.ColumnHeader>
                          {text.detail.monthly.table.month}
                        </ChakraTable.ColumnHeader>
                        <ChakraTable.ColumnHeader textAlign="right">
                          {text.detail.monthly.table.entrance}
                        </ChakraTable.ColumnHeader>
                        <ChakraTable.ColumnHeader textAlign="right">
                          {text.detail.monthly.table.exit}
                        </ChakraTable.ColumnHeader>
                        <ChakraTable.ColumnHeader textAlign="right">
                          {text.detail.monthly.table.balance}
                        </ChakraTable.ColumnHeader>
                      </ChakraTable.Row>
                    </ChakraTable.Header>
                    <ChakraTable.Body>
                      {data.monthly_summary.map((row) => (
                        <ChakraTable.Row key={row.month}>
                          <ChakraTable.Cell>{row.month}</ChakraTable.Cell>
                          <ChakraTable.Cell textAlign="right" fontVariantNumeric="tabular-nums">
                            {formatCurrencyBRL(row.entrance)}
                          </ChakraTable.Cell>
                          <ChakraTable.Cell textAlign="right" fontVariantNumeric="tabular-nums">
                            {formatCurrencyBRL(row.exit)}
                          </ChakraTable.Cell>
                          <ChakraTable.Cell
                            textAlign="right"
                            fontVariantNumeric="tabular-nums"
                            color={row.balance < 0 ? 'feedBack.errorMain' : 'feedBack.successMain'}
                          >
                            {formatCurrencyBRL(row.balance)}
                          </ChakraTable.Cell>
                        </ChakraTable.Row>
                      ))}
                    </ChakraTable.Body>
                    {data.monthly_summary_totals && (
                      <ChakraTable.Footer>
                        <ChakraTable.Row fontWeight="bold">
                          <ChakraTable.Cell>{text.detail.monthly.totalsLabel}</ChakraTable.Cell>
                          <ChakraTable.Cell textAlign="right" fontVariantNumeric="tabular-nums">
                            {formatCurrencyBRL(data.monthly_summary_totals.entrance)}
                          </ChakraTable.Cell>
                          <ChakraTable.Cell textAlign="right" fontVariantNumeric="tabular-nums">
                            {formatCurrencyBRL(data.monthly_summary_totals.exit)}
                          </ChakraTable.Cell>
                          <ChakraTable.Cell
                            textAlign="right"
                            fontVariantNumeric="tabular-nums"
                            color={
                              data.monthly_summary_totals.balance < 0
                                ? 'feedBack.errorMain'
                                : 'feedBack.successMain'
                            }
                          >
                            {formatCurrencyBRL(data.monthly_summary_totals.balance)}
                          </ChakraTable.Cell>
                        </ChakraTable.Row>
                      </ChakraTable.Footer>
                    )}
                  </ChakraTable.Root>
                </Box>
              </Box>
            )}
          </VStack>
        )}
      </Box>

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={onCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title={text.detail.deleteConfirm.title}
      />
    </FormContainer>
  );
}
