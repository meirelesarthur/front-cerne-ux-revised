// src/pages/Administrativo/FarmTransfer/FarmTransferDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE dedicada, SOMENTE LEITURA, de Trans. Fazendas
// (FarmTransfer — Estoque, Tarefa 01, `GAP-FARMTRANSFER-FE-04`). Rota
// `/administrativo/transf-fazendas/:uuid`, guardada por
// `<RequirePermission permission="warehouse-transfer-farm_view">`
// (mirror da permissão de `.show`).
//
// Como a feature NÃO tem modo editar (`RT-06 NAO_APLICAVEL`), não existe um
// formulário de edição para reaproveitar em modo somente-leitura, e o shape
// do `show` (1 registro flat) é estruturalmente diferente do shape do
// `create` (lote com `items[]`) — por isso esta tela é DEDICADA e LEVE: sem
// tabs, sem `useForm`, sem catálogos de select. Mirror ESTRUTURAL (não
// literal) de `SaldoEstoqueDetalhe.tsx` (`FormContainer` + `SimpleGrid`/
// `InfoField`, seções por `<Text>`+borda).
//
// `FarmTransferResource` não expõe dados financeiros (Income/Expense não
// são carregados por este Resource) — esta tela NÃO tenta exibi-los
// (`GAP-FARMTRANSFER-FE-04`, achado).
//
// Rodapé: Voltar (sempre) + Excluir (gateado por
// `warehouse-transfer-farm_delete`), reaproveitando a MESMA
// `DeleteConfirmDialog` já usada na listagem.
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useState } from 'react';

import { Box, EmptyState, Flex, Icon, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
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
import { queryKey } from '@/constants/query-key';

import {
  deleteFarmTransfer,
  getFarmTransfer,
} from '@/services/v2/FarmTransfers/farm-transfer-service';

const FARM_TRANSFER_LIST_ROUTE = '/administrativo/transf-fazendas';

function formatQuantityPtBr(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

export default function FarmTransferDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.farmTransfers.farmTransfer;
  const detailText = text.detail;
  const noData = '—';

  const canDelete = can('warehouse-transfer-farm_delete');
  const hasValidUuid = isValidGuid(uuid ?? null);

  // Guarda de entrada — `uuid` ausente/mal-formado NUNCA dispara a chamada
  // de rede; redireciona à Listagem com toast (mirror
  // `SaldoEstoqueDetalhe.tsx`).
  useEffect(() => {
    if (!hasValidUuid) {
      toaster.create({
        type: 'error',
        title: detailText.invalidParamsToast.title,
        description: detailText.invalidParamsToast.description,
      });
      navigate(FARM_TRANSFER_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid]);

  const detailQuery = useQuery({
    queryKey: [queryKey.farmTransfers.farmTransfer, uuid],
    queryFn: async () => {
      const response = await getFarmTransfer(uuid as string);
      return response.data;
    },
    enabled: hasValidUuid,
    retry: false,
  });

  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);

  const deleteMutation = useRequest({
    asyncFunction: async ({ farmTransferUuid }: { farmTransferUuid: string }) => {
      await deleteFarmTransfer(farmTransferUuid);
      return undefined;
    },
    queryKey: queryKey.farmTransfers.farmTransfers,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      setIsOpenDeleteDialog(false);
      navigate(FARM_TRANSFER_LIST_ROUTE);
    },
  });

  function handleConfirmDelete() {
    if (uuid) {
      deleteMutation.mutate({ farmTransferUuid: uuid });
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
                onClick={() => navigate(FARM_TRANSFER_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={detailText.title}
      footer={
        <>
          <Button
            title={detailText.backButton}
            variant="outline"
            type="button"
            onClick={() => navigate(FARM_TRANSFER_LIST_ROUTE)}
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
          <InfoField
            label={detailText.fields.product}
            value={
              item?.origin?.product
                ? `${item.origin.product.code} — ${item.origin.product.description}`
                : noData
            }
          />
          <InfoField
            label={detailText.fields.originFarm}
            value={item?.origin?.farm?.description || noData}
          />
          <InfoField
            label={detailText.fields.originWarehouse}
            value={item?.origin?.warehouse?.description || noData}
          />
          <InfoField
            label={detailText.fields.destinationFarm}
            value={item?.destination_warehouse?.farm?.description || noData}
          />
          <InfoField
            label={detailText.fields.destinationWarehouse}
            value={item?.destination_warehouse?.description || noData}
          />
          <InfoField
            label={detailText.fields.quantity}
            value={item !== undefined ? formatQuantityPtBr(item.quantity) : noData}
          />
          <InfoField
            label={detailText.fields.amount}
            value={item !== undefined ? formatCurrencyBRL(item.amount) : noData}
          />
          <InfoField
            label={detailText.fields.costCenter}
            value={item?.cost_center?.description || noData}
          />
          <InfoField label={detailText.fields.user} value={item?.user?.name || noData} />
          <InfoField
            label={detailText.fields.createdAt}
            value={item?.created_at ? formatDate(item.created_at, 'dd/MM/yyyy HH:mm') : noData}
          />
        </SimpleGrid>
      </Box>

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => setIsOpenDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        itemName={item?.code}
        tone="danger"
      />
    </FormContainer>
  );
}
