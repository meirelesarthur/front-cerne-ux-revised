// src/pages/Administrativo/BaixaEstoque/BaixaEstoqueDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (100% leitura) de BAIXA DE ESTOQUE — TASK-FE-3003. Rota
// `/administrativo/baixa-estoque/:uuid` (guardada por `stock-writeoffs_view`
// — mesma permissão da listagem, contrato de tela §4). Não existe edição — a
// Baixa nunca teve `update`/`edit` (`apiResource(...)->only([index,store,
// show,destroy])`, contrato de tela §2.1).
//
// Mirror estrutural de `Administrativo/CorrecaoEstoque/CorrecaoEstoqueDetalhe.tsx`
// (`FormContainer` + `SimpleGrid`/`InfoField` + `Table.Root` de itens, 100%
// leitura, `useParams<{ uuid }>()` + `isValidGuid` como guarda de entrada).
//
// Divergências deliberadas do molde (contrato de tela §2.2/§3.7):
// - `cost_center` é SEMPRE `null` no Resource (D3) — NUNCA renderizado.
// - `justification` (omitida no show legado, RR-007) É EXIBIDA aqui —
//   melhoria de UI sem custo, não altera o contrato de leitura.
// - Bloco de anexos OMITIDO (D-FE-BE-06) — o `StockWriteoffResource` ainda
//   não expõe anexos no detalhe; quando expuser, a tabela entra aqui.
// - `value` do item é o unitário RECONSTITUÍDO pelo backend (`amount/
//   quantity`, DV-008/CV-008) — exibido como está, nunca recalculado.
//
// `formatQuantityPtBr`/`formatCurrencyBRL` são funções LOCAIS a este arquivo
// (mirror exato do precedente — convenção já estabelecida no projeto).
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
import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiArrowLeft, FiFileText } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { getStockWriteoff } from '@/services/v2/StockWriteoffs/stock-writeoff-service';

const BAIXA_ESTOQUE_LIST_ROUTE = '/administrativo/baixa-estoque';

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

export default function BaixaEstoqueDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.stockWriteoffs.stockWriteoff;
  const noData = text.detail.noData;

  // ---- Handoff "Emitir NFe" (TASK-FE-3006/exec-038, D-FE-BE-05) -----------
  const canEmitNfe = can('nfe_create');

  const hasValidParams = isValidGuid(uuid);

  // Guarda de entrada — `uuid` ausente ou mal-formado NUNCA dispara a
  // chamada de rede; redireciona à Listagem com toast. Deps somente
  // [hasValidParams] — `navigate`/`text` são estáveis por execução (mesma
  // disciplina do precedente `CorrecaoEstoqueDetalhe.tsx`).
  useEffect(() => {
    if (!hasValidParams) {
      toaster.create({
        type: 'error',
        title: text.detail.invalidParamsToast.title,
        description: text.detail.invalidParamsToast.description,
      });
      navigate(BAIXA_ESTOQUE_LIST_ROUTE, { replace: true });
    }
  }, [hasValidParams]);

  const detailQuery = useQuery({
    queryKey: [queryKey.stockWriteoffs.stockWriteoff, uuid],
    queryFn: async () => {
      const response = await getStockWriteoff(uuid!);
      return response.data;
    },
    enabled: hasValidParams,
    retry: false,
  });

  if (!hasValidParams) {
    return null;
  }

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data;
  const notFound = !isLoading && detailQuery.isError;

  // Estado: 404 (baixa inexistente ou de outra fazenda — isolamento por
  // tenant é silencioso, contrato de tela §4.2).
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
                <EmptyState.Title>{text.detail.notFound.title}</EmptyState.Title>
                <EmptyState.Description>{text.detail.notFound.description}</EmptyState.Description>
              </VStack>
              <Button
                title={text.detail.notFound.back}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(BAIXA_ESTOQUE_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const items = item?.items ?? [];
  const hasItems = items.length > 0;
  const totalsQuantity = items.reduce((sum, row) => sum + row.quantity, 0);
  const totalsAmount = items.reduce((sum, row) => sum + row.amount, 0);

  // TASK-FE-3006 — visível SOMENTE quando `nfe_uuid==null` (AM-008/RR-012).
  const showEmitNfeAction = canEmitNfe && !!item && item.nfe_uuid == null;

  // Mirror legado `StockWriteoffController@nfe()` / mirror front do
  // "Duplicar" da Nfe (`CreateOrUpdateNfe.tsx::duplicateFromUuid`) — NAVEGA
  // para a criação de Nfe já preenchida, sem modal de vínculo (ver
  // `index.tsx::handleEmitirNfeClick`, MESMA rotina). Guarda defensiva de
  // `nfe_uuid` redundante com `showEmitNfeAction` acima, mantida por
  // fidelidade ao pedido "Se a baixa já tiver NFe, mantenha o aviso".
  function handleEmitirNfeClick() {
    if (!item) return;
    if (item.nfe_uuid) {
      toaster.warning({
        title: text.nfeHandoff.alreadyEmittedWarning.title,
        description: text.nfeHandoff.alreadyEmittedWarning.description,
      });
      return;
    }
    navigate('/fiscal/nfe-emitidas/novo', {
      state: { stockWriteoffUuidForNfe: item.uuid },
    });
  }

  return (
    <FormContainer
      title={item ? item.code : text.singularLabel}
      headerActions={
        showEmitNfeAction ? (
          <Button
            title={text.detail.actions.emitNfe}
            icon={FiFileText as ElementType}
            variant="outline"
            size="sm"
            onClick={handleEmitirNfeClick}
          />
        ) : undefined
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Text fontSize="sm" color="fg.muted">
            {item ? formatDate(item.created_at, 'dd/MM/yyyy HH:mm') : text.singularLabel}
          </Text>
        </Skeleton>

        <Flex direction="column" gap={6} mt={6}>
          {/* ---- Seção 1 — Identificação ---- */}
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
              {text.detail.sections.identification}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField label={text.detail.fields.code} value={item?.code || noData} />
              <InfoField label={text.detail.fields.type} value={item?.type_label || noData} />
              <InfoField
                label={text.detail.fields.createdAt}
                value={item ? formatDate(item.created_at, 'dd/MM/yyyy HH:mm') : noData}
              />
              <InfoField label={text.detail.fields.user} value={item?.user?.name || noData} />
              <InfoField
                label={text.detail.fields.warehouse}
                value={item?.warehouse?.description || noData}
              />
              {item?.type_note && (
                <InfoField label={text.detail.fields.typeNote} value={item.type_note} />
              )}
              <InfoField
                label={text.detail.fields.justification}
                value={item?.justification || noData}
              />
              {/* `cost_center` é SEMPRE `null` no Resource (D3) — NUNCA renderizado
                  (fidelidade AS-IS, contrato de tela §2.2/§3.7). */}
            </SimpleGrid>
          </Box>

          {/* ---- Seção 2 — Itens da Baixa (SEMPRE renderizada, mesmo vazia) ---- */}
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
              {text.detail.sections.items}
            </Text>
            <Skeleton loading={isLoading}>
              {hasItems ? (
                <Table.Root size="sm" variant="outline">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{text.detail.table.product}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.detail.table.lot}</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="end">
                        {text.detail.table.quantity}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="end">
                        {text.detail.table.value}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="end">
                        {text.detail.table.amount}
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {items.map((row, index) => (
                      // Sem `uuid` próprio na linha (pivot sem identificador
                      // exposto pelo Resource) — chave composta pelo índice +
                      // produto/lote, estável para a mesma resposta.
                      <Table.Row key={`${index}-${row.product?.uuid ?? 'x'}-${row.lot ?? 'x'}`}>
                        <Table.Cell>
                          {row.product ? `${row.product.code} — ${row.product.description}` : '—'}
                        </Table.Cell>
                        <Table.Cell>{row.lot || '—'}</Table.Cell>
                        <Table.Cell textAlign="end">{formatQuantityPtBr(row.quantity)}</Table.Cell>
                        <Table.Cell textAlign="end">{formatCurrencyBRL(row.value)}</Table.Cell>
                        <Table.Cell textAlign="end">{formatCurrencyBRL(row.amount)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                  <Table.Footer>
                    <Table.Row>
                      <Table.Cell fontWeight="semibold">{text.detail.totals.quantity}</Table.Cell>
                      <Table.Cell />
                      <Table.Cell textAlign="end" fontWeight="semibold">
                        {formatQuantityPtBr(totalsQuantity)}
                      </Table.Cell>
                      <Table.Cell />
                      <Table.Cell textAlign="end" fontWeight="semibold">
                        {formatCurrencyBRL(totalsAmount)}
                      </Table.Cell>
                    </Table.Row>
                  </Table.Footer>
                </Table.Root>
              ) : (
                !isLoading && (
                  <EmptyState.Root size="sm">
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <Icon as={FiAlertTriangle} boxSize={6} color="fg.muted" />
                      </EmptyState.Indicator>
                      <VStack textAlign="center" gap={1}>
                        <EmptyState.Title>{text.detail.itemsEmpty.title}</EmptyState.Title>
                        <EmptyState.Description>
                          {text.detail.itemsEmpty.description}
                        </EmptyState.Description>
                      </VStack>
                    </EmptyState.Content>
                  </EmptyState.Root>
                )
              )}
            </Skeleton>
          </Box>

          {/* Bloco de anexos OMITIDO — D-FE-BE-06: o `StockWriteoffResource`
              ainda não expõe anexos no detalhe. Quando expuser, a tabela
              entra aqui (mesmo padrão da seção de itens). */}
        </Flex>
      </Box>
    </FormContainer>
  );
}
