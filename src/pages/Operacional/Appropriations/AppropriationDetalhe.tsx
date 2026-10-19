// src/pages/Operacional/Appropriations/AppropriationDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de Visualização (somente leitura) de Apontamento (Appropriation) —
// TASK-FE-2712. Mirror estrutural de `Invoices/InvoiceDetalhe.tsx` — bloco
// read-only, sem `useForm`, seções sequenciais (Identificação + 5 seções de
// item + Movimentações). Diferente da Listagem (sem "Editar" na linha), aqui
// a ação de Editar existe como botão de topo — a Visualização é o hub de
// navegação para Editar/Apropriar/Voltar Status/Excluir, mirror a estrutura
// real do legado (especificação visual #12/#13).
//
// "Operação"/"Atividade" NÃO se repetem por linha de item (contrato §13.1 —
// o legado grava o MESMO valor do cabeçalho em toda linha; o Resource de
// item nem expõe esses campos) — já aparecem 1x no cabeçalho. VL.UNIT/
// VL.TOTAL = `amount`/`total_amount` do Resource; Centro de Custo =
// `center_uuid` — resolvido só pelo uuid truncado (sem round-trip a
// `listCostCenterOptions` por linha nesta fatia, decisão aceitável
// registrada ao Tester).
// -----------------------------------------------------------------------------

import { ElementType, ReactNode, useEffect, useState } from 'react';

import { Badge, Box, Flex, Image, SimpleGrid, Skeleton, Table, Text } from '@chakra-ui/react';
import { FiArrowLeft, FiEdit, FiRotateCcw, FiTrash2 } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FormContainer } from '@/components/Layout/FormContainer';
import { QueryErrorState } from '@/components/QueryErrorState';
import { Status } from '@/components/Status';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { deleteAppropriation } from '@/services/v2/Appropriations/appropriation-service';

import type { AppropriationDetail } from '@/@types/v2/Appropriations';

import {
  APPROPRIATION_STATUS_META,
  getAppropriationStatusLegend,
  isAppropriationEditable,
} from './appropriationStatus';
import { RevertAppropriationStatusModal } from './RevertAppropriationStatusModal';
import { useAppropriationForm } from './useAppropriations';

const APPROPRIATIONS_LIST_ROUTE = '/operacional/apontamentos';

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

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text
      fontSize="sm"
      fontWeight="semibold"
      color="fg.default"
      mb={4}
      pb={2}
      borderBottom="1px solid"
      borderColor="border.subtle"
    >
      {children}
    </Text>
  );
}

function truncateUuid(uuid: string | null): string {
  if (!uuid) return '—';
  return `${uuid.slice(0, 8)}…`;
}

export default function AppropriationDetalhe() {
  const { appropriationId } = useParams<{ appropriationId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.appropriations.appropriation;
  const detailText = text.detail;
  const noData = '—';

  useEffect(() => {
    if (!isValidGuid(appropriationId)) {
      navigate(APPROPRIATIONS_LIST_ROUTE, { replace: true });
    }
  }, [appropriationId, navigate]);

  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const detailQuery = useAppropriationForm({
    registrationId: isValidGuid(appropriationId) ? appropriationId : undefined,
    fillForm: () => undefined,
  });

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data as AppropriationDetail | undefined;
  const notFound = !isLoading && (detailQuery as any).isError;

  const canEdit = can('appropriations_edit');
  const canDelete = can('appropriations_delete');

  const deleteMutation = useRequest({
    asyncFunction: async ({ uuid }: { uuid: string }) => deleteAppropriation(uuid),
    queryKey: queryKey.appropriations.appropriations,
    queryKey2: queryKey.appropriations.appropriation,
    typesRequest: 'update',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      navigate(APPROPRIATIONS_LIST_ROUTE);
    },
  });

  if (!isValidGuid(appropriationId)) {
    return null;
  }

  if (notFound) {
    return (
      <FormContainer title={text.singularLabel}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <QueryErrorState
            message={detailText.notFound.title}
            description={detailText.notFound.description}
            onBack={() => navigate(APPROPRIATIONS_LIST_ROUTE)}
            backLabel={detailText.notFound.back}
            backIcon={FiArrowLeft as ElementType}
          />
        </Flex>
      </FormContainer>
    );
  }

  const legend = getAppropriationStatusLegend(languageGB);
  const currentStatusLabel = item
    ? legend.find((entry) => entry.status === item.status)?.label
    : undefined;
  const showEdit = canEdit && isAppropriationEditable(item?.status);
  const showAppropriate = canEdit && item?.status === 'F';
  const showRevertStatus =
    canEdit && !!item && !!APPROPRIATION_STATUS_META[item.status].nextStatusOnRevert;

  return (
    <FormContainer
      title={item?.code ?? text.singularLabel}
      headerActions={
        item && (
          <Flex align="center" gap={3} flexShrink={0}>
            {currentStatusLabel && (
              <Status
                text={currentStatusLabel}
                backgroundColor={APPROPRIATION_STATUS_META[item.status].badgeColor}
              />
            )}
            {showEdit && (
              <Button
                title={detailText.actions.edit}
                icon={FiEdit as ElementType}
                size="sm"
                onClick={() => navigate(`${APPROPRIATIONS_LIST_ROUTE}/${appropriationId}`)}
              />
            )}
            {showAppropriate && (
              <Button
                title={detailText.actions.appropriate}
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(`${APPROPRIATIONS_LIST_ROUTE}/${appropriationId}/apropriar`)
                }
              />
            )}
            {showRevertStatus && (
              <Button
                title={detailText.actions.revertStatus}
                icon={FiRotateCcw as ElementType}
                variant="outline"
                size="sm"
                onClick={() => setIsRevertModalOpen(true)}
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
            {item?.description || text.singularLabel}
          </Text>
        </Skeleton>

        <Flex direction="column" gap={6} mt={6}>
          {/* ---- Identificação ---- */}
          <Box>
            <SectionTitle>{detailText.sections.header}</SectionTitle>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField label={text.form.fields.code} value={item?.code ?? noData} />
              <InfoField label={text.form.fields.date} value={item?.date ?? noData} />
              <InfoField label={text.form.fields.area} value={item?.area?.description ?? noData} />
              <InfoField label={text.form.fields.activity} value={item?.activity?.name ?? noData} />
              <InfoField
                label={text.form.fields.operation}
                value={item?.operation?.name ?? noData}
              />
              <InfoField
                label={text.form.fields.cultivation}
                value={item?.cultivation?.name ?? noData}
              />
              <InfoField
                label={text.form.fields.harvest}
                value={item?.harvest?.description ?? noData}
              />
              <InfoField
                label={text.form.fields.warehouseProduction}
                value={item?.warehouse_production?.description ?? noData}
              />
              <InfoField
                label={text.form.fields.usedArea}
                value={
                  item?.used_area !== null && item?.used_area !== undefined
                    ? String(item.used_area)
                    : noData
                }
              />
              <InfoField
                label={text.form.fields.responsible}
                value={item?.employee?.name ?? item?.user?.name ?? noData}
              />
              <InfoField label={text.form.fields.description} value={item?.description ?? noData} />
            </SimpleGrid>
          </Box>

          {/* ---- MO/Serviços ---- */}
          <Box>
            <SectionTitle>{detailText.sections.labor}</SectionTitle>
            {(item?.labor_items ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {detailText.emptySection}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{text.form.labor.fields.executor}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.labor.fields.quantity}</Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {text.form.labor.fields.totalQuantity}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.labor.fields.typePayment}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.costCenterLabel}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.labor_items ?? []).map((row: any, index: number) => (
                      <Table.Row key={`${row.person.uuid}-${index}`}>
                        <Table.Cell>{row.person?.name ?? noData}</Table.Cell>
                        <Table.Cell>{row.quantity}</Table.Cell>
                        <Table.Cell>{row.total_quantity}</Table.Cell>
                        <Table.Cell>{row.type_payment_label ?? noData}</Table.Cell>
                        <Table.Cell>{truncateUuid(row.center_uuid)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>

          {/* ---- Máq/Implementos ---- */}
          <Box>
            <SectionTitle>{detailText.sections.equipment}</SectionTitle>
            {(item?.equipment_items ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {detailText.emptySection}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>
                        {text.form.equipment.fields.equipment}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {text.form.equipment.fields.startHourMeter}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {text.form.equipment.fields.endHourMeter}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.equipment.fields.amount}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.costCenterLabel}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.equipment_items ?? []).map((row: any, index: number) => (
                      <Table.Row key={`${row.equipment.uuid}-${index}`}>
                        <Table.Cell>{row.equipment?.description ?? noData}</Table.Cell>
                        <Table.Cell>{row.start_hour_meter}</Table.Cell>
                        <Table.Cell>{row.end_hour_meter}</Table.Cell>
                        <Table.Cell>{row.amount}</Table.Cell>
                        <Table.Cell>{truncateUuid(row.center_uuid)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>

          {/* ---- Insumos ---- */}
          <Box>
            <SectionTitle>{detailText.sections.stock}</SectionTitle>
            {(item?.stock_items ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {detailText.emptySection}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{text.form.stock.fields.product}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.stock.fields.quantity}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.stock.fields.measurement}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.costCenterLabel}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.stock_items ?? []).map((row: any, index: number) => (
                      <Table.Row key={`${row.product.uuid}-${index}`}>
                        <Table.Cell>{row.product?.description ?? noData}</Table.Cell>
                        <Table.Cell>{row.quantity}</Table.Cell>
                        {/* TASK-FE-751 (destravada por ERRO-BE-018) —
                            `description` (texto completo) no lugar de
                            `name` (abreviação); fallback por segurança. */}
                        <Table.Cell>
                          {row.measurement?.description || row.measurement?.name || noData}
                        </Table.Cell>
                        <Table.Cell>{truncateUuid(row.center_uuid)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>

          {/* ---- Produção ---- */}
          <Box>
            <SectionTitle>{detailText.sections.production}</SectionTitle>
            {(item?.production_items ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {detailText.emptySection}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{text.form.production.fields.product}</Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {text.form.production.fields.quantity}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.production.fields.amount}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.production.fields.total}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.costCenterLabel}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.production_items ?? []).map((row: any, index: number) => (
                      <Table.Row key={`${row.product.uuid}-${index}`}>
                        <Table.Cell>{row.product?.description ?? noData}</Table.Cell>
                        <Table.Cell>{row.quantity}</Table.Cell>
                        <Table.Cell>{row.amount}</Table.Cell>
                        <Table.Cell>{row.total}</Table.Cell>
                        <Table.Cell>{truncateUuid(row.center_uuid)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>

          {/* ---- Ocorrências ---- */}
          <Box>
            <SectionTitle>{detailText.sections.occurrences}</SectionTitle>
            {(item?.occurrences ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {detailText.emptySection}
              </Text>
            ) : (
              <Flex direction="column" gap={4}>
                {(item?.occurrences ?? []).map((occurrence: any, index: number) => (
                  <Box
                    key={index}
                    p={4}
                    border="1px solid"
                    borderColor="border.subtle"
                    borderRadius="lg"
                  >
                    <Flex justify="space-between" align="flex-start" mb={2}>
                      <Text fontSize="sm" fontWeight="medium">
                        {occurrence.diagnosis ?? noData}
                      </Text>
                      <Badge
                        colorPalette={
                          occurrence.priority === '2'
                            ? 'red'
                            : occurrence.priority === '1'
                              ? 'orange'
                              : 'gray'
                        }
                      >
                        {occurrence.priority_label}
                      </Badge>
                    </Flex>
                    <Text fontSize="sm" color="fg.muted" mb={3}>
                      {occurrence.recommendation ?? noData}
                    </Text>
                    {occurrence.images?.length > 0 && (
                      <Flex gap={2} wrap="wrap">
                        {occurrence.images.map((image: any, imageIndex: number) => (
                          <Image
                            key={imageIndex}
                            src={image.url}
                            alt={detailText.sections.occurrences}
                            boxSize="96px"
                            objectFit="cover"
                            borderRadius="md"
                          />
                        ))}
                      </Flex>
                    )}
                  </Box>
                ))}
              </Flex>
            )}
          </Box>

          {/* ---- Movimentações ---- */}
          <Box>
            <SectionTitle>{detailText.sections.movements}</SectionTitle>
            {(item?.movements ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {detailText.movementsTable.empty}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{detailText.movementsTable.date}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.movementsTable.user}</Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {detailText.movementsTable.previousStatus}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {detailText.movementsTable.currentStatus}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {detailText.movementsTable.observation}
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.movements ?? []).map((movement: any, index: number) => (
                      <Table.Row key={index}>
                        <Table.Cell>
                          {new Date(movement.created_at).toLocaleString('pt-BR')}
                        </Table.Cell>
                        <Table.Cell>{movement.user?.name ?? noData}</Table.Cell>
                        <Table.Cell>{movement.previous_status_label ?? noData}</Table.Cell>
                        <Table.Cell>{movement.current_status_label}</Table.Cell>
                        <Table.Cell>{movement.observation ?? noData}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>
        </Flex>
      </Box>

      <RevertAppropriationStatusModal
        isOpen={isRevertModalOpen}
        onClose={() => setIsRevertModalOpen(false)}
        appropriationUuid={appropriationId}
        currentStatus={item?.status}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => appropriationId && deleteMutation.mutate({ uuid: appropriationId })}
        isLoading={deleteMutation.isPending}
        itemName={item?.code}
        tone="danger"
      />
    </FormContainer>
  );
}
