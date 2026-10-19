// src/pages/Operacional/Reproducao/BullSeedSeason/BullSeedSeasonDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE, SOMENTE LEITURA, de Touros/Sêmen/Embrião — Operacional /
// Reprodução (Tarefa 24). Rota
// `/operacional/touros-semen-embriao/:bullSeedSeasonUuid`, guardada por
// `<RequirePermission permission="bull-seed-season_view">`.
//
// Mirror ESTRUTURAL de `EstacaoDeMonta/EstacaoDeMontaDetalhe.tsx` (mesmo
// submódulo: `FormContainer` + `SimpleGrid`/`InfoField`, guarda de uuid
// inválido, `EmptyState`) + `RequisitionDetalhe.tsx` (footer com
// Voltar/Excluir + `DeleteConfirmDialog`, exclusão navega de volta à
// listagem em caso de sucesso) + `SaldoInicialDetalhe.tsx` (painel agrupado
// com `Table.Root` read-only para a seção "Produtos").
//
// `animals`/`products` só existem neste Resource (`BullSeedSeasonDetail`,
// armadilha 3 da Tarefa 24) — a reexibição de quantidade/UM dos produtos é
// capacidade NOVA vs. legado (fecha `CL-13`, contrato de tela §6.2).
// -----------------------------------------------------------------------------

import { ElementType, ReactNode, useEffect, useState } from 'react';

import {
  Badge,
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
import { FiAlertTriangle, FiArrowLeft, FiEdit } from 'react-icons/fi';
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

import { deleteBullSeedSeason } from '@/services/v2/BullSeedSeason/bull-seed-season-service';

import { useBullSeedSeasonDetail } from './useBullSeedSeasons';

const BULL_SEED_SEASON_LIST_ROUTE = '/operacional/touros-semen-embriao';

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

// Painel agrupado com borda/rótulo — mesma linguagem visual já usada em
// `CentroCusto/DetalheCentroCusto.tsx` (`DetailPanel`)/`EstacaoDeMonta`,
// aqui nomeado `FormSection` para mirror da nomenclatura do contrato de
// tela (§2.2).
function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={4}
        pb={2}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        {title}
      </Text>
      {children}
    </Box>
  );
}

export default function BullSeedSeasonDetalhe() {
  const { bullSeedSeasonUuid } = useParams<{ bullSeedSeasonUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.bullSeedSeason.bullSeedSeason;
  const detailText = text.detail;
  const noData = '—';

  const canEdit = can('bull-seed-season_edit');
  const canDelete = can('bull-seed-season_delete');

  const hasValidUuid = isValidGuid(bullSeedSeasonUuid ?? null);

  useEffect(() => {
    if (!hasValidUuid) {
      toaster.create({
        type: 'error',
        title: detailText.invalidParamsToast.title,
        description: detailText.invalidParamsToast.description,
      });
      navigate(BULL_SEED_SEASON_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid]);

  const detailQuery = useBullSeedSeasonDetail(bullSeedSeasonUuid);

  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);

  // `onError` NÃO customizado — 422 de negócio (FK filha) exibido tal como
  // vem do servidor (armadilha 4 da Tarefa 24, mirror `index.tsx`).
  const deleteMutation = useRequest({
    asyncFunction: async ({ uuid }: { uuid: string }) => {
      await deleteBullSeedSeason(uuid);
      return undefined;
    },
    queryKey: queryKey.bullSeedSeason.bullSeedSeasonsList,
    queryKey2: queryKey.bullSeedSeason.bullSeedSeason,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      setIsOpenDeleteDialog(false);
      navigate(BULL_SEED_SEASON_LIST_ROUTE);
    },
  });

  function handleConfirmDelete() {
    if (bullSeedSeasonUuid) {
      deleteMutation.mutate({ uuid: bullSeedSeasonUuid });
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
                onClick={() => navigate(BULL_SEED_SEASON_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const animals = item?.animals ?? [];
  const products = item?.products ?? [];

  return (
    <FormContainer
      title={detailText.title}
      subtitle={item ? `${item.code} — ${item.description}` : undefined}
      footer={
        <>
          <Button
            title={detailText.backButton}
            variant="outline"
            type="button"
            onClick={() => navigate(BULL_SEED_SEASON_LIST_ROUTE)}
          />
          {canEdit && item && (
            <Button
              title={detailText.editButton}
              icon={FiEdit as ElementType}
              type="button"
              onClick={() => navigate(`${BULL_SEED_SEASON_LIST_ROUTE}/${item.uuid}/editar`)}
            />
          )}
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
        <Skeleton loading={isLoading} borderRadius="lg">
          <Flex direction="column" gap={6}>
            <FormSection title={detailText.sections.generalData}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField label={detailText.fields.code} value={item?.code || noData} />
                <InfoField
                  label={detailText.fields.date}
                  value={item?.date ? formatDate(item.date) : noData}
                />
                <InfoField
                  label={detailText.fields.description}
                  value={item?.description || noData}
                />
                <InfoField
                  label={detailText.fields.breedingSeason}
                  value={item?.breeding_season?.description || noData}
                />
                <InfoField
                  label={detailText.fields.createdAt}
                  value={
                    item?.created_at ? formatDate(item.created_at, 'dd/MM/yyyy HH:mm') : noData
                  }
                />
                <InfoField
                  label={detailText.fields.updatedAt}
                  value={
                    item?.updated_at ? formatDate(item.updated_at, 'dd/MM/yyyy HH:mm') : noData
                  }
                />
              </SimpleGrid>
            </FormSection>

            <FormSection title={detailText.sections.animals}>
              {animals.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                  {detailText.animalsEmpty}
                </Text>
              ) : (
                <Flex wrap="wrap" gap={2}>
                  {animals.map((animal) => (
                    <Badge key={animal.uuid} colorPalette="gray" variant="subtle">
                      {animal.identification}
                    </Badge>
                  ))}
                </Flex>
              )}
            </FormSection>

            {/* Reexibição de quantidade/UM por produto — capacidade NOVA vs.
                legado (fecha `CL-13`, contrato de tela §6.2). */}
            <FormSection title={detailText.sections.products}>
              {products.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                  {detailText.productsEmpty}
                </Text>
              ) : (
                <Table.Root size="sm" variant="outline">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{detailText.productsTable.product}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.productsTable.warehouse}</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="end">
                        {detailText.productsTable.quantity}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {detailText.productsTable.measurement}
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {products.map((product) => (
                      <Table.Row key={product.uuid}>
                        <Table.Cell>{product.description}</Table.Cell>
                        <Table.Cell>
                          {product.warehouse?.description || detailText.productsTable.noWarehouse}
                        </Table.Cell>
                        <Table.Cell textAlign="end">{product.quantity}</Table.Cell>
                        <Table.Cell>{product.measurement}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              )}
            </FormSection>
          </Flex>
        </Skeleton>
      </Box>

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => setIsOpenDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        title={text.list.deleteDialog.title}
        itemName={item?.code}
        tone="danger"
      />
    </FormContainer>
  );
}
