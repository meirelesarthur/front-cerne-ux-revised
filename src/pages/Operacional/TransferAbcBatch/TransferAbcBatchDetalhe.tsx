// src/pages/Operacional/TransferAbcBatch/TransferAbcBatchDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE dedicada, SOMENTE LEITURA, de Transferência ABC de Animais
// entre Lotes (TransferAbcBatch — Operacional > Pecuária > Transferências,
// 97-Esteiras/039, TASK-FE-039-ABC-02). Rota
// `/operacional/transferencias/:uuid`, guardada por
// `<RequirePermission permission="transfer_abc_batch_view">`.
//
// Como a feature NÃO tem modo editar (D3, parity — a API nunca teve
// `update()`), esta tela é DEDICADA e LEVE: sem tabs, sem `useForm`. Mirror
// ESTRUTURAL de `FarmTransferDetalhe.tsx` (`FormContainer` + `SimpleGrid`/
// `InfoField`), acrescido dos blocos `animals[]`/`expenses[]`/`incomes[]`
// (`whenLoaded` do `EP:show`, ausentes na listagem).
//
// `expenses[]`/`incomes[]` — tipados só com os campos ESCALARES garantidos
// pelo Model (ver docblock de `@/@types/v2/Livestock/transferAbcBatch`);
// `TransferAbcBatchRepository::EAGER_LOAD_DETAIL` não carrega as relações
// internas de `Expense`/`Income` (categorias/rateio), então esta tela NÃO
// tenta exibi-las (SEM MOCK).
//
// Rodapé: Voltar (sempre) + Excluir (gateado por
// `transfer_abc_batch_delete`), mensagem de confirmação NEUTRA — o
// delete NÃO reverte o lote/histórico (D1/FD4, non-reversal, parity).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useState } from 'react';

import {
  Badge,
  Box,
  EmptyState,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { transferAbcTypeColor } from '@/constants/livestock/transferAbcBatch/transferAbcBatch-status';
import { queryKey } from '@/constants/query-key';

import {
  deleteTransferAbcBatch,
  getTransferAbcBatch,
} from '@/services/v2/Livestock/transferAbcBatch-service';

const TRANSFER_ABC_BATCH_LIST_ROUTE = '/operacional/transferencias';

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatWeight(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={1}
      >
        {label}
      </Text>
      <Text fontSize="sm" color="fg.default">
        {value}
      </Text>
    </Box>
  );
}

export default function TransferAbcBatchDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.livestock.transferAbcBatch;
  const detailText = text.detail;
  const typeText = text.type;
  const noData = '—';

  const canDelete = can('transfer_abc_batch_delete');
  const hasValidUuid = isValidGuid(uuid ?? null);

  useEffect(() => {
    if (!hasValidUuid) {
      toaster.create({
        type: 'error',
        title: detailText.invalidParamsToast.title,
        description: detailText.invalidParamsToast.description,
      });
      navigate(TRANSFER_ABC_BATCH_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid]);

  const detailQuery = useQuery({
    queryKey: [queryKey.livestock.transferAbcBatch, uuid],
    queryFn: async () => {
      const response = await getTransferAbcBatch(uuid as string);
      return response.data;
    },
    enabled: hasValidUuid,
    retry: false,
  });

  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);

  const deleteMutation = useRequest({
    asyncFunction: async ({ transferAbcBatchUuid }: { transferAbcBatchUuid: string }) => {
      await deleteTransferAbcBatch(transferAbcBatchUuid);
      return undefined;
    },
    queryKey: queryKey.livestock.transferAbcBatches,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      setIsOpenDeleteDialog(false);
      navigate(TRANSFER_ABC_BATCH_LIST_ROUTE);
    },
  });

  function handleConfirmDelete() {
    if (uuid) {
      deleteMutation.mutate({ transferAbcBatchUuid: uuid });
    }
  }

  if (!hasValidUuid) {
    return null;
  }

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data;
  const notFound = !isLoading && detailQuery.isError;

  if (notFound) {
    return (
      <FormContainer title={text.singularLabel}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{detailText.notFound.title}</EmptyState.Title>
                <EmptyState.Description>{detailText.notFound.description}</EmptyState.Description>
              </VStack>
              <Button
                title={detailText.backButton}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(TRANSFER_ABC_BATCH_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const animals = item?.animals ?? [];
  const expenses = item?.expenses ?? [];
  const incomes = item?.incomes ?? [];

  return (
    <FormContainer
      title={detailText.title}
      footer={
        <>
          <Button
            title={detailText.backButton}
            variant="outline"
            type="button"
            onClick={() => navigate(TRANSFER_ABC_BATCH_LIST_ROUTE)}
          />
          {canDelete && (
            <Button
              title={detailText.deleteButton}
              variant="outline"
              colorPalette="red"
              type="button"
              onClick={() => setIsOpenDeleteDialog(true)}
              disabled={!item}
            />
          )}
        </>
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Text fontSize="sm" color="fg.muted">
            {item ? item.code : text.singularLabel}
          </Text>
        </Skeleton>

        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <InfoField label={detailText.fields.code} value={item?.code || noData} />
          <InfoField
            label={detailText.fields.date}
            value={item?.date ? formatDate(item.date, 'dd/MM/yyyy') : noData}
          />
          <Box>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="wide"
              mb={1}
            >
              {detailText.fields.type}
            </Text>
            {item ? (
              <Badge colorPalette={transferAbcTypeColor[item.type] ?? 'gray'} variant="subtle">
                {item.type === 1 ? typeText.entrada : typeText.saida}
              </Badge>
            ) : (
              <Text fontSize="sm">{noData}</Text>
            )}
          </Box>
          <InfoField label={detailText.fields.description} value={item?.description || noData} />
          <InfoField label={detailText.fields.user} value={item?.user?.label || noData} />
          {item?.type === 1 && (
            <InfoField label={detailText.fields.provider} value={item?.provider?.name ?? noData} />
          )}
          {item?.type === 2 && (
            <InfoField label={detailText.fields.client} value={item?.client?.name ?? noData} />
          )}
          <InfoField
            label={detailText.fields.originBatch}
            value={item?.origin_batch?.description || noData}
          />
          <InfoField
            label={detailText.fields.destinationBatch}
            value={item?.destination_batch?.description || noData}
          />
        </SimpleGrid>

        {/* Animais da transferência — `whenLoaded`, só presente no show. */}
        <Box mt={8}>
          <Text fontSize="sm" fontWeight="semibold" mb={3}>
            {detailText.animalsSectionTitle}
          </Text>
          {animals.length === 0 ? (
            <Text fontSize="sm" color="fg.muted">
              {detailText.emptyFinancial}
            </Text>
          ) : (
            <Box
              bg="bg.muted"
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="lg"
              overflow="hidden"
            >
              <Flex
                px={4}
                py={2}
                gap={3}
                fontSize="xs"
                fontWeight="semibold"
                color="fg.muted"
                textTransform="uppercase"
                borderBottom="1px solid"
                borderColor="border.subtle"
              >
                <Text flex="2">{detailText.animalsColumns.animal}</Text>
                <Text flex="1" textAlign="right">
                  {detailText.animalsColumns.lastWeight}
                </Text>
                <Text flex="1" textAlign="right">
                  {detailText.animalsColumns.actualWeight}
                </Text>
                <Text flex="1" textAlign="right">
                  {detailText.animalsColumns.value}
                </Text>
                <Text flex="1" textAlign="right">
                  {detailText.animalsColumns.totalValue}
                </Text>
              </Flex>
              {animals.map((animal) => (
                <Flex
                  key={animal.uuid}
                  px={4}
                  py={2}
                  gap={3}
                  fontSize="sm"
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                  _last={{ borderBottom: 'none' }}
                >
                  <Text flex="2">{animal.animal?.identification ?? noData}</Text>
                  <Text flex="1" textAlign="right">
                    {formatWeight(animal.last_weight)}
                  </Text>
                  <Text flex="1" textAlign="right">
                    {formatWeight(animal.actual_weight)}
                  </Text>
                  <Text flex="1" textAlign="right">
                    {formatCurrencyBRL(animal.value)}
                  </Text>
                  <Text flex="1" textAlign="right" fontWeight="medium">
                    {formatCurrencyBRL(animal.total_value)}
                  </Text>
                </Flex>
              ))}
            </Box>
          )}
        </Box>

        {/* Financeiro — despesas (Entrada) / receitas (Saída), resumo raso
            (campos escalares garantidos, sem relações internas — ver
            docblock de topo). */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mt={8}>
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={3}>
              {detailText.expensesSectionTitle}
            </Text>
            {expenses.length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {detailText.emptyFinancial}
              </Text>
            ) : (
              <VStack align="stretch" gap={2}>
                {expenses.map((expense) => (
                  <Flex
                    key={expense.uuid}
                    justify="space-between"
                    fontSize="sm"
                    bg="bg.muted"
                    borderRadius="md"
                    px={3}
                    py={2}
                  >
                    <Text>{expense.note || expense.code || noData}</Text>
                    <Text fontWeight="medium">{formatCurrencyBRL(expense.amount)}</Text>
                  </Flex>
                ))}
              </VStack>
            )}
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={3}>
              {detailText.incomesSectionTitle}
            </Text>
            {incomes.length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {detailText.emptyFinancial}
              </Text>
            ) : (
              <VStack align="stretch" gap={2}>
                {incomes.map((income) => (
                  <Flex
                    key={income.uuid}
                    justify="space-between"
                    fontSize="sm"
                    bg="bg.muted"
                    borderRadius="md"
                    px={3}
                    py={2}
                  >
                    <Text>{income.note || income.code || noData}</Text>
                    <Text fontWeight="medium">{formatCurrencyBRL(income.amount)}</Text>
                  </Flex>
                ))}
              </VStack>
            )}
          </Box>
        </SimpleGrid>
      </Box>

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => setIsOpenDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        itemName={item?.code}
        warningText={text.list.deleteConfirmMessage}
        tone="danger"
      />
    </FormContainer>
  );
}
