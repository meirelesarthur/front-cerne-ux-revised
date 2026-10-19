// src/pages/Administrativo/Earning/EarningDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE, SOMENTE LEITURA, de Apuração Mensal (Earning —
// Administrativo, 97-Esteiras/002, Tarefa 07). Rota
// `/administrativo/apuracao/:employeeUuid` (query `month`/`year`/`type`),
// guardada por `<RequirePermission permission="earnings_view">`.
//
// Mirror ESTRUTURAL de `RequisitionDetalhe.tsx` (`FormContainer` +
// `SimpleGrid`/`InfoField`, guarda de uuid inválido, `EmptyState`) — só
// alcançável a partir de linhas JÁ existentes no índice (`GET
// /earnings/{employee_uuid}` sempre 200 aqui; o 404 só importa para a
// Tarefa 08).
//
// `total`/`vl_account`/`vl_cheque` vêm como STRING (`decimal:2`) —
// `Number(...)` antes de formatar (Armadilha 4). `events[]`/
// `advances_period` podem estar AUSENTES — checar presença antes de
// renderizar o bloco (Armadilha 7 da Tarefa 08, também vale aqui).
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
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';

import { computeEarningTotalFromEvents, computeEarningVlChequeFromEvents } from './earningTotals';
import { useEarningDetail, useEventCatalog } from './useEarnings';

const EARNING_LIST_ROUTE = '/administrativo/apuracao';

function formatCurrencyBRL(value: string | number | null | undefined): string {
  return Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

export default function EarningDetalhe() {
  const { employeeUuid } = useParams<{ employeeUuid: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  const text = languageGB.earnings.earning;
  const detailText = text.detail;
  const noData = '—';

  const month = Number(searchParams.get('month')) || undefined;
  const year = Number(searchParams.get('year')) || undefined;
  const type = searchParams.get('type') ?? undefined;

  const hasValidParams = isValidGuid(employeeUuid ?? null) && !!month && !!year;

  useEffect(() => {
    if (!hasValidParams) {
      toaster.create({
        type: 'error',
        title: detailText.invalidParamsToast.title,
        description: detailText.invalidParamsToast.description,
      });
      navigate(EARNING_LIST_ROUTE, { replace: true });
    }
  }, [hasValidParams]);

  const detailQuery = useEarningDetail({ employeeUuid, month, year, type });

  // GAP-EARNING-08 [AVALIADO], Opção B — `total`/`vl_cheque` deixam de vir da
  // coluna persistida crua (pode ficar obsoleta em relação aos eventos
  // atuais) e passam a ser recalculados a partir de `item.events[]`, mesma
  // fórmula já usada em `CreateOrUpdateEarning.tsx` (ver `earningTotals.ts`).
  const eventCatalogQuery = useEventCatalog();

  if (!hasValidParams) {
    return null;
  }

  const isLoading = checkLoadingStatus([detailQuery as any, eventCatalogQuery as any]);
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
                onClick={() => navigate(EARNING_LIST_ROUTE)}
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
        <Button
          title={detailText.backButton}
          variant="outline"
          type="button"
          onClick={() => navigate(EARNING_LIST_ROUTE)}
        />
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Flex align="center" gap={3}>
            <Text fontSize="sm" color="fg.muted">
              {item?.employee?.name ?? text.singularLabel}
            </Text>
            {item && (
              <Badge colorPalette={item.is_pay ? 'green' : 'orange'} variant="subtle">
                {item.is_pay ? text.list.statusLabels.paid : text.list.statusLabels.pending}
              </Badge>
            )}
          </Flex>
        </Skeleton>

        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <InfoField label={detailText.fields.employee} value={item?.employee?.name || noData} />
          <InfoField label={detailText.fields.function} value={item?.function?.name || noData} />
          <InfoField
            label={detailText.fields.period}
            value={item ? `${String(item.month).padStart(2, '0')}/${item.year}` : noData}
          />
          <InfoField label={detailText.fields.type} value={item?.type?.description || noData} />
          <InfoField
            label={detailText.fields.total}
            value={formatCurrencyBRL(
              computeEarningTotalFromEvents(item?.events, eventCatalogQuery.data)
            )}
          />
          <InfoField
            label={detailText.fields.vlAccount}
            value={formatCurrencyBRL(item?.vl_account)}
          />
          <InfoField
            label={detailText.fields.vlCheque}
            value={formatCurrencyBRL(
              computeEarningVlChequeFromEvents(
                item?.events,
                item?.vl_account,
                eventCatalogQuery.data
              )
            )}
          />
          <InfoField
            label={detailText.fields.costCenter}
            value={item?.cost_center?.description || noData}
          />
          <InfoField label={detailText.fields.team} value={item?.team?.name || noData} />
          <InfoField
            label={detailText.fields.proprietary}
            value={item?.proprietary?.name || noData}
          />
          <InfoField
            label={detailText.fields.createdAt}
            value={item?.created_at ? formatDate(item.created_at, 'dd/MM/yyyy HH:mm') : noData}
          />
        </SimpleGrid>

        {/* Tabela de eventos (read-only) — `events[]` PODE estar ausente
            (não é `[]`), checar presença antes de renderizar. */}
        <Box mt={8}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={3}
          >
            {detailText.events.title}
          </Text>
          {!item?.events || item.events.length === 0 ? (
            <Text fontSize="sm" color="fg.muted">
              {detailText.events.empty}
            </Text>
          ) : (
            <Flex direction="column" gap={2}>
              {item.events.map((eventRow) => (
                <Flex
                  key={eventRow.uuid}
                  justify="space-between"
                  p={3}
                  bg="bg.muted"
                  border="1px solid"
                  borderColor="border.subtle"
                  borderRadius="md"
                >
                  <Text fontSize="sm">{eventRow.name}</Text>
                  <Text fontSize="sm" color="fg.muted">
                    {eventRow.method.description}
                  </Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {formatCurrencyBRL(eventRow.value)}
                  </Text>
                </Flex>
              ))}
            </Flex>
          )}
        </Box>

        {/* `advances_period` — bloco informativo, só quando presente. */}
        {item?.advances_period && item.advances_period.length > 0 && (
          <Box mt={8}>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="wide"
              mb={3}
            >
              {detailText.advancesPeriod.title}
            </Text>
            <Flex direction="column" gap={2}>
              {item.advances_period.map((advance) => (
                <Flex
                  key={advance.uuid}
                  justify="space-between"
                  p={3}
                  bg="bg.muted"
                  border="1px solid"
                  borderColor="border.subtle"
                  borderRadius="md"
                >
                  <Text fontSize="sm">{formatDate(advance.date, 'dd/MM/yyyy')}</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {formatCurrencyBRL(advance.amount)}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Box>
        )}
      </Box>
    </FormContainer>
  );
}
