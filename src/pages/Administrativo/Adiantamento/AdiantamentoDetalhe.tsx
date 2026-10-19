// src/pages/Administrativo/Adiantamento/AdiantamentoDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de um ADIANTAMENTO SALARIAL —
// Administrativo. Rota própria: /administrativo/adiantamento/:advanceUuid
// /detalhe (guarda `advances_view`). TASK-FE-adiant-salarial
// (97-Esteiras/034). Mirror estrutural de
// `CadastrosBase/CicloProducao/CicloProducaoDetalhe.tsx`: rota própria,
// read-only, `FormContainer` + `SimpleGrid` de campos + painel de Parcelas.
//
// Parcelas: mês exibido `mm/yyyy` (a API entrega/persiste `YYYY-MM`, sem
// remap — TASK-FE §"Detalhe"), valor em pt-BR.
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
  Text,
  VStack,
} from '@chakra-ui/react';
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

import { useAdvanceDetail } from './useAdvances';

const ADVANCES_LIST_ROUTE = '/administrativo/adiantamento';

// Campo de leitura (label + valor) do painel "Dados Gerais" — mesma
// adaptação do `InfoField` de `CicloProducaoDetalhe.tsx` (tokens Chakra no
// lugar de `style={}`).
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

function formatCurrencyBRL(value: number | string): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// 'YYYY-MM' → 'MM/YYYY' (exibição), sem remap de valor/persistência.
function formatMonthDisplay(isoMonth: string): string {
  const [year, month] = isoMonth.split('-');
  if (!year || !month) return isoMonth;
  return `${month}/${year}`;
}

export default function AdiantamentoDetalhe() {
  const { advanceUuid } = useParams<{ advanceUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.advances.advance;

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  // (mesmo padrão de `CicloProducaoDetalhe.tsx`): redireciona para a
  // listagem ANTES de renderizar qualquer conteúdo.
  useEffect(() => {
    if (!isValidGuid(advanceUuid)) {
      navigate(ADVANCES_LIST_ROUTE, { replace: true });
    }
  }, [advanceUuid, navigate]);

  const advanceQuery = useAdvanceDetail({ advanceUuid });

  // uuid mal formado: o efeito acima já está redirecionando — nada a
  // renderizar (a query acima fica permanentemente `enabled: false`).
  if (!isValidGuid(advanceUuid)) {
    return null;
  }

  const isLoading = checkLoadingStatus([advanceQuery]);
  const advance = advanceQuery.data;
  const notFound = !isLoading && advanceQuery.isError;
  const canEdit = can('advances_edit');

  const installments = advance?.installments ?? [];

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
                onClick={() => navigate(ADVANCES_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={advance?.employee?.name ?? text.singularLabel}
      headerActions={
        advance && (
          <Flex align="center" gap={3} flexShrink={0}>
            {canEdit && (
              <Button
                title={text.detail.actions.edit}
                icon={FiEdit as ElementType}
                onClick={() => navigate(`${ADVANCES_LIST_ROUTE}/${advanceUuid}`)}
              />
            )}
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading}>
          <Flex direction="column" gap={6}>
            {/* Painel "Dados Gerais". */}
            <Box
              bg="bg.muted"
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="lg"
              p={4}
            >
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
                {text.detail.generalData.title}
              </Text>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField
                  label={text.detail.fields.employee}
                  value={advance?.employee?.name ?? '—'}
                />
                <InfoField label={text.detail.fields.event} value={advance?.event?.name ?? '—'} />
                <InfoField
                  label={text.detail.fields.date}
                  value={formatDate(advance?.date ?? '')}
                />
                <InfoField
                  label={text.detail.fields.amount}
                  value={advance ? formatCurrencyBRL(advance.amount) : '—'}
                />
              </SimpleGrid>
            </Box>

            {/* Painel "Parcelas". */}
            <Box
              bg="bg.muted"
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="lg"
              p={4}
            >
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
                {text.detail.installments.title}
              </Text>

              {installments.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                  {text.detail.installments.empty}
                </Text>
              ) : (
                <Flex direction="column" gap={2}>
                  <Flex
                    justify="space-between"
                    fontSize="xs"
                    fontWeight="semibold"
                    color="fg.muted"
                  >
                    <Text>{text.detail.installments.month}</Text>
                    <Text>{text.detail.installments.value}</Text>
                  </Flex>
                  {installments.map((row, index) => (
                    // eslint-disable-next-line react/no-array-index-key -- linhas sem uuid próprio (write-level array)
                    <Flex key={`${row.month}-${index}`} justify="space-between" fontSize="sm">
                      <Badge variant="subtle" colorPalette="gray">
                        {formatMonthDisplay(row.month)}
                      </Badge>
                      <Text fontWeight="medium" fontVariantNumeric="tabular-nums">
                        {formatCurrencyBRL(row.value)}
                      </Text>
                    </Flex>
                  ))}
                </Flex>
              )}
            </Box>
          </Flex>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
