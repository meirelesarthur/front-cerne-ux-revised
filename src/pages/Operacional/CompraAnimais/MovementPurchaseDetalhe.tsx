// src/pages/Operacional/CompraAnimais/MovementPurchaseDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (read-only) da Compra de Animais — TASK-CP-09, mirror
// `VendaAnimais/MovementSaleDetalhe.tsx`. Rota: `/operacional/compra-animais/
// :uuid`, gate `mov_purchase_view`.
//
// Tabela de itens (contrato §6, `agro365/resources/views/movement-purchases/
// show.blade.php:90-176`, CLM-46, LEITURA confirmada nesta Tarefa) alterna
// colunas por `chave` da compra:
//   - COM `chave` (compra veio de import XML): Descrição do Item, Categoria,
//     Quantidade, Valor Unitário, Valor Total, Observação.
//   - SEM `chave`: Categoria, Quantidade, Peso Médio, Rendimento, Valor (R$),
//     Valor (@), Valor Unitário, Valor Total, Observação — as 4 colunas
//     `weight_kg`/`performance`/`value_real`/`value_arroba` são campos
//     LEGADOS que a tela padrão de Compras NUNCA populava de fato (CLM-29:
//     sempre valiam `0`/`50`/`0`/`0` em qualquer compra desta tela — só a
//     finalização de Abate, que Compras não tem, os preenchia). A API nova
//     (`MovementPurchaseItem`, confirmado em `@/@types/v2/MovementPurchases`)
//     NEM SEQUER expõe esses 4 campos — por isso os 4 valores abaixo são
//     CONSTANTES LITERAIS (não vêm de `item`), replicando fielmente a
//     alternância visual do legado SEM fingir que carregam dado real
//     (instrução explícita do task-packet RUN-047 — "não finja que esses 4
//     campos 'sem chave' carregam informação real").
//
// `type_payment` é código livre (`movementPurchaseTypePaymentOptions`, mesmo
// catálogo do form). Sem seção "Categorias agregadas" (exclusiva de Vendas —
// Compras não tem esse rollup) nem "Documentos" (mirror `MovementSaleDetalhe`,
// que também não renderiza os anexos nesta tela).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

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
import { FiAlertTriangle, FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { movementPurchaseTypePaymentOptions } from '@/constants/GestaoAnimal/MovementPurchase/options';

import type { MovementPurchaseDetail } from '@/@types/v2/MovementPurchases';

import {
  isMovementPurchaseLocked,
  MovementPurchaseLockBanners,
} from './MovementPurchaseLockBanners';
import { useMovementPurchaseDetail } from './useMovementPurchases';

const COMPRA_ANIMAIS_LIST_ROUTE = '/operacional/compra-animais';

// CLM-29 — legado, constantes fixas (ver docblock de topo). NUNCA lidas do
// `item` real (a API não expõe esses 4 campos).
const LEGACY_WEIGHT_KG = 0;
const LEGACY_PERFORMANCE_PERCENT = 50;
const LEGACY_VALUE_REAL = 0;
const LEGACY_VALUE_ARROBA = 0;

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

export default function MovementPurchaseDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.movementPurchases.movementPurchase;
  const detailText = text.detail;
  const noData = '—';

  // Guard de UUID malformado ANTES de qualquer chamada (mirror
  // `MovementSaleDetalhe.tsx`).
  useEffect(() => {
    if (!isValidGuid(uuid)) {
      navigate(COMPRA_ANIMAIS_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const purchaseQuery = useMovementPurchaseDetail(isValidGuid(uuid) ? uuid : undefined);

  const isLoading = checkLoadingStatus([purchaseQuery as any]);
  const item = purchaseQuery.data as MovementPurchaseDetail | undefined;
  const notFound = !isLoading && (purchaseQuery as any).isError;

  if (!isValidGuid(uuid)) {
    return null;
  }

  const canEdit = can('mov_purchase_edit');
  const isLocked = isMovementPurchaseLocked(item ?? null);
  const hasChave = !!item?.chave;

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
                onClick={() => navigate(COMPRA_ANIMAIS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={
        item
          ? detailText.pageTitleTemplate.replace('{code}', String(item.code))
          : text.singularLabel
      }
      footer={
        <>
          <Button
            title={detailText.backButton}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canEdit && (
            <Button
              title={text.list.actions.edit}
              icon={FiEdit as ElementType}
              type="button"
              disabled={isLocked}
              tooltip={isLocked ? text.list.actions.editDisabledTooltip : undefined}
              onClick={() => navigate(`${COMPRA_ANIMAIS_LIST_ROUTE}/${uuid}/editar`)}
            />
          )}
        </>
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Text fontSize="sm" color="fg.muted">
            {item ? (item.provider?.name ?? noData) : text.singularLabel}
          </Text>
        </Skeleton>

        <MovementPurchaseLockBanners detail={item ?? null} languageGB={languageGB} />

        <Flex direction="column" gap={6} mt={2}>
          {/* ---- Seção 1 — Cabeçalho (contrato §6) ---- */}
          <Box>
            <SectionTitle>{detailText.sections.header}</SectionTitle>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField label={detailText.fields.code} value={item ? String(item.code) : noData} />
              <InfoField
                label={detailText.fields.dtSale}
                value={item ? formatDate(item.dt_sale) : noData}
              />
              <InfoField
                label={detailText.fields.provider}
                value={item?.provider?.name ?? noData}
              />
              <InfoField label={detailText.fields.seller} value={item?.seller?.name ?? noData} />
              <InfoField label={detailText.fields.chave} value={item?.chave || noData} />
              <InfoField label={detailText.fields.serie} value={item?.serie || noData} />
              <InfoField label={detailText.fields.number} value={item?.number || noData} />
              <InfoField label={detailText.fields.gtas} value={item?.gtas || noData} />
              <InfoField
                label={detailText.fields.typePayment}
                value={
                  item?.type_payment
                    ? movementPurchaseTypePaymentOptions.getLabel(item.type_payment, languageGB)
                    : noData
                }
              />
              <InfoField label={detailText.fields.note} value={item?.note || noData} />
              <InfoField
                label={detailText.fields.createdAt}
                value={item ? formatDate(item.created_at) : noData}
              />
            </SimpleGrid>
          </Box>

          {/* ---- Seção 2 — Itens (contrato §6, CLM-46 — alternância por
              `chave`, ver docblock de topo) ---- */}
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
                      {hasChave && (
                        <Table.ColumnHeader>
                          {detailText.itemsTable.itemDescription}
                        </Table.ColumnHeader>
                      )}
                      <Table.ColumnHeader>{detailText.itemsTable.category}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.itemsTable.quantity}</Table.ColumnHeader>
                      {!hasChave && (
                        <>
                          <Table.ColumnHeader>{detailText.itemsTable.weightKg}</Table.ColumnHeader>
                          <Table.ColumnHeader>
                            {detailText.itemsTable.performance}
                          </Table.ColumnHeader>
                          <Table.ColumnHeader>{detailText.itemsTable.valueReal}</Table.ColumnHeader>
                          <Table.ColumnHeader>
                            {detailText.itemsTable.valueArroba}
                          </Table.ColumnHeader>
                        </>
                      )}
                      <Table.ColumnHeader>{detailText.itemsTable.valueUnit}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.itemsTable.amount}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.itemsTable.note}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.items ?? []).map((row, index) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <Table.Row key={`${row.category?.uuid ?? 'item'}-${index}`}>
                        {hasChave && <Table.Cell>{row.item_description ?? noData}</Table.Cell>}
                        <Table.Cell>{row.category?.description ?? noData}</Table.Cell>
                        <Table.Cell>{row.quantity}</Table.Cell>
                        {!hasChave && (
                          <>
                            <Table.Cell>{LEGACY_WEIGHT_KG}</Table.Cell>
                            <Table.Cell>{LEGACY_PERFORMANCE_PERCENT}%</Table.Cell>
                            <Table.Cell>{formatCurrencyBRL(LEGACY_VALUE_REAL)}</Table.Cell>
                            <Table.Cell>{formatCurrencyBRL(LEGACY_VALUE_ARROBA)}</Table.Cell>
                          </>
                        )}
                        <Table.Cell>{formatCurrencyBRL(row.value_unit)}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.amount)}</Table.Cell>
                        <Table.Cell>{row.note ?? noData}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>

          {/* ---- Seção 3 — Totais (contrato §6) — sem recálculo, só formata ---- */}
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
