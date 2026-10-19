// src/pages/Frota/Manutencoes/ManutencaoDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de Visualização (100% somente-leitura) de Manutenção — Tarefa 43.
// Mirror estrutural de `Frota/Abastecimentos/AbastecimentoDetalhe.tsx`.
//
// Dados idênticos aos da listagem (mirror contrato Supplies §6/§7.2 — "sem
// reconversão adicional") — reusa `GET /maintenances/{uuid}` (mesmo `show`
// da API, sem `.../edit`), via `useMaintenanceDetailQuery`
// (`fillForm: () => undefined`).
//
// Botão "Gerar Financeiro" (mirror `AM-05` do legado) — condicional a haver
// item com `provider` (nunca um catálogo geral), `RequirePermission`-style
// via `usePermissions().can('maintenances_generate_financial')` (permissão
// NOVA, corrige CL-3/CL-4 do legado — RBAC real, a rota em si é da
// Tarefa 45, este botão só precisa existir e navegar).
//
// `employee_amount`/`employee_total_amount` exibidos TAL COMO vêm do
// Resource — nenhuma fórmula de recálculo no client (FID-G3F §3, não
// reproduzir CL-26).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useState } from 'react';

import {
  Box,
  EmptyState,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft, FiDollarSign, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';

import { canShowGenerateFinancial } from '@/services/v2/Maintenances/maintenance-mapper';

import type { MaintenanceDetail } from '@/@types/v2/Maintenances';

import { useDeleteMaintenanceMutation, useMaintenanceDetailQuery } from './useManutencoes';

const MANUTENCOES_LIST_ROUTE = '/frota/manutencoes';

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

export default function ManutencaoDetalhe() {
  const { maintenanceId } = useParams<{ maintenanceId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.maintenances.maintenance;
  const detailText = text.detail;
  const noData = '—';

  useEffect(() => {
    if (!isValidGuid(maintenanceId)) {
      navigate(MANUTENCOES_LIST_ROUTE, { replace: true });
    }
  }, [maintenanceId, navigate]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const detailQuery = useMaintenanceDetailQuery({
    registrationId: isValidGuid(maintenanceId) ? maintenanceId : undefined,
    fillForm: () => undefined,
  });

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data as MaintenanceDetail | undefined;
  const notFound = !isLoading && (detailQuery as any).isError;

  const canEdit = can('maintenances_edit');
  const canDelete = can('maintenances_delete');
  const canGenerateFinancial = can('maintenances_generate_financial');
  // UT-000684 — replica o legado: oculta o botão sem fornecedor ou com despesa já gerada.
  const showGenerateFinancial = canShowGenerateFinancial(item, canGenerateFinancial);

  const deleteMutation = useDeleteMaintenanceMutation({
    actionSuccess: () => navigate(MANUTENCOES_LIST_ROUTE),
  });

  if (!isValidGuid(maintenanceId)) {
    return null;
  }

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
                title={detailText.notFound.back}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(MANUTENCOES_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={item?.code ?? text.singularLabel}
      headerActions={
        item && (
          <Flex align="center" gap={3} flexShrink={0}>
            {showGenerateFinancial && (
              <Button
                title={detailText.actions.generateFinancial}
                icon={FiDollarSign as ElementType}
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(`${MANUTENCOES_LIST_ROUTE}/${maintenanceId}/gerar-financeiro`)
                }
              />
            )}
            {canEdit && (
              <Button
                title={detailText.actions.edit}
                icon={FiEdit as ElementType}
                size="sm"
                onClick={() => navigate(`${MANUTENCOES_LIST_ROUTE}/${maintenanceId}`)}
              />
            )}
            {canDelete && (
              <Button
                title={detailText.actions.delete}
                icon={FiTrash2 as ElementType}
                variant="ghost"
                color="red.500"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              />
            )}
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Text fontSize="sm" color="fg.muted">
            {item?.code ?? text.singularLabel}
          </Text>
        </Skeleton>

        <Flex direction="column" gap={6} mt={6}>
          {/* ---- Identificação ---- */}
          <Box>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField label={text.form.fields.code} value={item?.code ?? noData} />
              <InfoField label={text.form.fields.date} value={item?.date ?? noData} />
              <InfoField
                label={text.form.fields.requester}
                value={item?.requester?.name ?? noData}
              />
            </SimpleGrid>
          </Box>

          {/* ---- Itens ---- */}
          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="fg.default"
              mb={4}
              pb={2}
              borderBottom="1px solid"
              borderColor="border.subtle"
            >
              {detailText.sections.items}
            </Text>
            {(item?.items ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {noData}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{text.list.itemsTable.equipment}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.hourMeter}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.mileage}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.warehouse}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.product}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.measurement}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.quantity}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.amount}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.totalAmount}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.executor}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.laborCost}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.list.itemsTable.note}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.items ?? []).map((row, index) => (
                      <Table.Row key={`${row.equipment.uuid}-${index}`}>
                        <Table.Cell>{row.equipment.description}</Table.Cell>
                        <Table.Cell>{row.hour_meter ?? noData}</Table.Cell>
                        <Table.Cell>{row.mileage ?? noData}</Table.Cell>
                        <Table.Cell>{row.warehouse?.description ?? noData}</Table.Cell>
                        <Table.Cell>{row.product?.description ?? noData}</Table.Cell>
                        <Table.Cell>{row.measurement?.name ?? noData}</Table.Cell>
                        <Table.Cell>{row.quantity ?? noData}</Table.Cell>
                        <Table.Cell>{row.amount ?? noData}</Table.Cell>
                        <Table.Cell>{row.total_amount ?? noData}</Table.Cell>
                        <Table.Cell>
                          {row.executor_type === 'employee'
                            ? (row.employee?.name ?? noData)
                            : row.executor_type === 'provider'
                              ? (row.provider?.name ?? noData)
                              : noData}
                        </Table.Cell>
                        {/* GAP-MNT-02/FID-G3F §3 — SEMPRE o valor do Resource,
                            nunca `vl_time_productive × employee_quantity`
                            recalculado aqui (reproduziria CL-26). */}
                        <Table.Cell>{row.employee_total_amount ?? noData}</Table.Cell>
                        <Table.Cell>{row.note ?? noData}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>
        </Flex>
      </Box>

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => maintenanceId && deleteMutation.mutate({ maintenanceUuid: maintenanceId })}
        isLoading={deleteMutation.isPending}
        itemName={item?.code}
        tone="danger"
      />
    </FormContainer>
  );
}
