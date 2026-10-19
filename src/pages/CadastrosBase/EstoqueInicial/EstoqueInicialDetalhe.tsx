// src/pages/CadastrosBase/EstoqueInicial/EstoqueInicialDetalhe.tsx
// ----
// Tela de DETALHE (somente leitura) de um ESTOQUE INICIAL — Cadastros Base.
// TASK-FE-1045, execução 026.
//
// MIRROR visual do UX (commit `24bd916`), referência estrutural. Adaptação:
// troca componentes customizados (inexistentes no fork) por `FormContainer`
// + Chakra (padrão de `SafraDetalhe.tsx`/`ProdutoDetalhe.tsx`). Estrutura:
// 3 seções (Identificação, Quantidades & Valores, Informações Adicionais —
// condicional). Zona 4 (Café) não entra nesta Tarefa — TASK-FE-1044.
//
// Campos exibidos: fidelidade ao legado `show.blade.php` (conteúdo). Achado:
// `date` sempre NULL (Doc Bruta §6 regra 0, contrato API §13 invariante 1) —
// exibir `created_at` como "Dt. Movimento" em seu lugar. Fallback de campo
// vazio = chave `noData` (já existe: "Não Possui").
//
// Permissão exigida: `openingbalances_view` (gate de lista). Rota própria:
// wiring real é TASK-FE-1046 (roteamento, NÃO TOCADO AQUI).
// ----

import { ElementType, useEffect } from 'react';

import { Box, EmptyState, Flex, Icon, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft, FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';

import { useOpeningBalanceDetail } from './useOpeningBalanceDetail';

const OPENING_BALANCES_LIST_ROUTE = '/cadastros-base/estoques-iniciais';

/**
 * Formata moeda em PT-BR
 * @param {number} value - Valor a ser formatado
 * @return {string} Valor formatado em moeda PT-BR
 */
function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formata quantidade com 3 casas decimais
 * @param {number} value - Quantidade a ser formatada
 * @return {string} Quantidade formatada com 3 casas decimais
 */
function formatQuantityPtBr(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

/**
 * Campo de leitura (label + valor)
 * @param {Object} props - Props do componente
 * @param {string} props.label - Rótulo do campo
 * @param {string} props.value - Valor do campo
 * @return {React.ReactElement} Elemento renderizado
 */
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

export default function EstoqueInicialDetalhe() {
  const { openingBalanceUuid } = useParams<{ openingBalanceUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.openingBalances.openingBalance;
  const noData = text.list.table.noData;

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  useEffect(() => {
    if (!isValidGuid(openingBalanceUuid)) {
      navigate(OPENING_BALANCES_LIST_ROUTE, { replace: true });
    }
  }, [openingBalanceUuid, navigate]);

  if (!isValidGuid(openingBalanceUuid)) {
    return null;
  }

  const detailQuery = useOpeningBalanceDetail(openingBalanceUuid, true);

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data;
  const notFound = !isLoading && (detailQuery as any).isError;
  const canEdit = can('openingbalances_edit');

  // Estado: 404 (registro não encontrado)
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
                onClick={() => navigate(OPENING_BALANCES_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  // Condições de renderização para Seção 3 (Informações Adicionais):
  // condicional se há `provider_lot` OU `expiration_date` presentes
  const hasAdditionalInfo =
    (item?.provider_lot && item.provider_lot.trim() !== '') || !!item?.expiration_date;

  return (
    <FormContainer
      title={item?.product.description ?? text.singularLabel}
      headerActions={
        item && (
          <Flex align="center" gap={3} flexShrink={0}>
            {canEdit && (
              <Button
                title={text.detail.actions.edit}
                icon={FiEdit as ElementType}
                onClick={() =>
                  navigate(`${OPENING_BALANCES_LIST_ROUTE}/${openingBalanceUuid}/editar`)
                }
              />
            )}
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        {/* Subtítulo — Código + Armazém */}
        <Skeleton loading={isLoading} width="fit-content">
          <Text fontSize="sm" color="fg.muted">
            {item ? `${item.product.code} · ${item.warehouse.description}` : text.singularLabel}
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
              {text.form.sections.identification}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField
                label={text.form.fields.product}
                value={item ? `${item.product.code} — ${item.product.description}` : noData}
              />
              <InfoField
                label={text.form.fields.measurement}
                value={item?.product.measurement?.description || noData}
              />
              <InfoField
                label={text.form.fields.warehouse}
                value={item?.warehouse.description || noData}
              />
              <InfoField
                label={text.list.table.movementDate}
                value={item?.created_at ? formatDate(item.created_at) : noData}
              />
            </SimpleGrid>
          </Box>

          {/* ---- Seção 2 — Quantidades & Valores ---- */}
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
              {text.form.sections.quantitiesValues}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField
                label={text.form.fields.quantity}
                value={item !== undefined ? formatQuantityPtBr(item.quantity) : noData}
              />
              <InfoField
                label={text.form.fields.amount}
                value={item !== undefined ? formatCurrencyBRL(item.amount) : noData}
              />
              <InfoField
                label={text.form.fields.totalAmount}
                value={item !== undefined ? formatCurrencyBRL(item.total_amount) : noData}
              />
              <InfoField
                label={text.form.fields.averageCost}
                value={item !== undefined ? formatCurrencyBRL(item.average_cost) : noData}
              />
            </SimpleGrid>
          </Box>

          {/* ---- Seção 3 — Informações Adicionais (condicional) ---- */}
          {hasAdditionalInfo && (
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
                {text.form.sections.additionalInfo}
              </Text>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField
                  label={text.form.fields.providerLot}
                  value={item?.provider_lot || noData}
                />
                <InfoField
                  label={text.form.fields.expirationDate}
                  value={item?.expiration_date ? formatDate(item.expiration_date) : noData}
                />
              </SimpleGrid>
            </Box>
          )}
        </Flex>
      </Box>
    </FormContainer>
  );
}
