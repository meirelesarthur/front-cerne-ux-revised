// src/pages/Operacional/VendaAnimais/MovementSaleDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (read-only) da Venda de Animais — TASK-VD-FE-01.
// Rota: /operacional/venda-animais/:saleUuid, gate `mov_sale_view`.
//
// Mirror `RomaneioDetalhe.tsx` — tela DEDICADA, não o formulário em modo
// desabilitado (contrato de tela §6, `mode_matrix.visualizar`). Diferente de
// Romaneios, `MovementSaleResource` já devolve `client.name`/`seller.name`/
// `batch.description` HIDRATADOS (sem satélites só-uuid) — nenhuma
// resolução extra de rótulo é necessária aqui.
//
// Tabela de itens: `animal`/`categoria`/`peso`/`observação` — SEM
// `gain`/`gmd` (mirror legado, `mode_matrix.visualizar`, contrato §6),
// mesmo a API devolvendo os 2 campos calculados.
//
// `type_payment`/`chave`/`number`/`serie`/`has_financial`/`incomes_count`
// NÃO são expostos por `MovementSaleResource` (nenhuma dessas chaves existe
// em `toArray()`) — omitidos aqui por fidelidade ao dado real (SEM MOCK),
// não são "esquecidos". Ver `GAP-VENDAS-FE-03` e docblock de
// `@/@types/v2/MovementSales`.
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

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
import { FiAlertTriangle, FiCheckCircle, FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';

import type { MovementSaleDetail } from '@/@types/v2/MovementSales';

import { isMovementSaleLocked, MovementSaleLockBanners } from './MovementSaleLockBanners';
import { useMovementSaleDetail } from './useMovementSales';

const VENDA_ANIMAIS_LIST_ROUTE = '/operacional/venda-animais';

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

function SectionTitle({ children }: { children: string }) {
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

export default function MovementSaleDetalhe() {
  const { saleUuid } = useParams<{ saleUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.movementSales.movementSale;
  const detailText = text.detail;
  const noData = '—';

  // Guard de UUID malformado ANTES de qualquer chamada (mirror
  // `RomaneioDetalhe.tsx`/`CreateOrUpdateRomaneio.tsx`).
  useEffect(() => {
    if (!isValidGuid(saleUuid)) {
      navigate(VENDA_ANIMAIS_LIST_ROUTE, { replace: true });
    }
  }, [saleUuid, navigate]);

  const saleQuery = useMovementSaleDetail(isValidGuid(saleUuid) ? saleUuid : undefined);

  const isLoading = checkLoadingStatus([saleQuery as any]);
  const item = saleQuery.data as MovementSaleDetail | undefined;
  const notFound = !isLoading && (saleQuery as any).isError;

  if (!isValidGuid(saleUuid)) {
    return null;
  }

  const canEdit = can('mov_sale_edit');
  const isLocked = isMovementSaleLocked(item ?? null);
  const canFinish = canEdit && item?.status === 'P';

  if (notFound) {
    return (
      <FormContainer title={detailText.notFound.title}>
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
                variant="outline"
                size="sm"
                onClick={() => navigate(VENDA_ANIMAIS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={item ? detailText.pageTitleTemplate.replace('{code}', item.code) : text.singularLabel}
      footer={
        <>
          <Button
            title={detailText.backButton}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canFinish && (
            <Button
              title={text.list.actions.finish}
              icon={FiCheckCircle as ElementType}
              type="button"
              onClick={() => navigate(`${VENDA_ANIMAIS_LIST_ROUTE}/${saleUuid}/finalizar`)}
            />
          )}
          {canEdit && (
            <Button
              title={text.list.actions.edit}
              icon={FiEdit as ElementType}
              type="button"
              disabled={isLocked}
              tooltip={isLocked ? text.list.actions.editDisabledTooltip : undefined}
              onClick={() => navigate(`${VENDA_ANIMAIS_LIST_ROUTE}/${saleUuid}/editar`)}
            />
          )}
        </>
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Text fontSize="sm" color="fg.muted">
            {item ? (item.client?.name ?? noData) : text.singularLabel}
          </Text>
        </Skeleton>

        <MovementSaleLockBanners detail={item ?? null} languageGB={languageGB} />

        <Flex direction="column" gap={6} mt={2}>
          {/* ---- Seção 1 — Cabeçalho (contrato §6) ---- */}
          <Box>
            <SectionTitle>{detailText.sections.header}</SectionTitle>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField label={detailText.fields.code} value={item ? String(item.code) : noData} />
              <Box>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="fg.muted"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  mb={1}
                >
                  {detailText.fields.status}
                </Text>
                {item ? (
                  <Badge colorPalette={item.status === 'F' ? 'green' : 'orange'} variant="subtle">
                    {item.status_label}
                  </Badge>
                ) : (
                  <Text fontSize="sm">{noData}</Text>
                )}
              </Box>
              <InfoField
                label={detailText.fields.typeSale}
                value={item?.type_sale_label ?? noData}
              />
              <InfoField
                label={detailText.fields.dtSale}
                value={item ? formatDate(item.dt_sale) : noData}
              />
              <InfoField label={detailText.fields.client} value={item?.client?.name ?? noData} />
              <InfoField label={detailText.fields.seller} value={item?.seller?.name ?? noData} />
              <InfoField
                label={detailText.fields.batch}
                value={item?.batch_sale ? (item?.batch?.description ?? noData) : noData}
              />
              <InfoField label={detailText.fields.gtas} value={item?.gtas || noData} />
              <InfoField label={detailText.fields.nfe} value={item?.nfe?.number ?? noData} />
              <InfoField
                label={detailText.fields.createdAt}
                value={item ? formatDate(item.created_at) : noData}
              />
            </SimpleGrid>
          </Box>

          {/* ---- Seção 2 — Itens (contrato §6) — SEM gain/gmd ---- */}
          <Box>
            <SectionTitle>{detailText.sections.items}</SectionTitle>
            {(item?.items ?? []).length === 0 && !isLoading ? (
              <Text fontSize="sm" color="fg.muted">
                {detailText.itemsTable.empty}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{detailText.itemsTable.animal}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.itemsTable.category}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.itemsTable.weight}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.itemsTable.note}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.items ?? []).map((row, index) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <Table.Row key={`${row.animal?.uuid ?? 'item'}-${index}`}>
                        <Table.Cell>{row.animal?.identification ?? noData}</Table.Cell>
                        <Table.Cell>{row.category?.description ?? noData}</Table.Cell>
                        <Table.Cell>{row.weight_kg}</Table.Cell>
                        <Table.Cell>{row.note ?? noData}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>

          {/* ---- Seção 3 — Categorias agregadas (contrato §6/§7.3) ---- */}
          <Box>
            <SectionTitle>{detailText.sections.categories}</SectionTitle>
            {(item?.categories ?? []).length === 0 && !isLoading ? (
              <Text fontSize="sm" color="fg.muted">
                {detailText.categoriesTable.empty}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{detailText.categoriesTable.category}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.categoriesTable.quantity}</Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {detailText.categoriesTable.valueReal}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {detailText.categoriesTable.valueArroba}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {detailText.categoriesTable.valueHead}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {detailText.categoriesTable.valueTotal}
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.categories ?? []).map((row) => (
                      <Table.Row key={row.uuid}>
                        <Table.Cell>{row.description ?? noData}</Table.Cell>
                        <Table.Cell>{row.quantity}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.value_real)}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.value_arroba)}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.value_head)}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.value_total)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>

          {/* ---- Seção 4 — Totais (contrato §6) — sem recálculo, só formata ---- */}
          <Box>
            <SectionTitle>{detailText.sections.totals}</SectionTitle>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField
                label={detailText.totals.totalProducts}
                value={item ? formatCurrencyBRL(item.total_products) : noData}
              />
              <InfoField
                label={detailText.totals.freight}
                value={item ? formatCurrencyBRL(item.freight) : noData}
              />
              <InfoField
                label={detailText.totals.otherValues}
                value={item ? formatCurrencyBRL(item.other_values) : noData}
              />
              <InfoField
                label={detailText.totals.discount}
                value={item ? formatCurrencyBRL(item.discount) : noData}
              />
              <InfoField
                label={detailText.totals.total}
                value={item ? formatCurrencyBRL(item.total) : noData}
              />
            </SimpleGrid>
          </Box>
        </Flex>
      </Box>
    </FormContainer>
  );
}
