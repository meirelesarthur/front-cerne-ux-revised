// src/pages/Operacional/ChargeBillIncomes/ChargeBillIncomeDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de UMA Conta a Receber (ChargeBillIncome —
// Operacional / Agricultura / Carregamento). TASK-CBI-FE-04, esteira
// 97-Esteiras/059 (contrato de tela §5, SURF-FE-SHOW, CLM-21).
//
// Rota: `/operacional/carregamento/contas-a-receber/:chargeBillIncomeUuid/
// detalhe`, guarda `charge_income_view` (`src/router/index.tsx`).
//
// Molde de código (sibling-first): `Operacional/FechamentoSemana/
// ShowClosingWeek.tsx` (sem `useForm`, seções via `InfoField`, guard de UUID
// malformado ANTES de qualquer chamada, `EmptyState` de "não encontrado").
// 8 campos read-only, fiéis a `show.blade.php`: code, dt_emission, due_date,
// number, amount, provider.name, cultivation.name, description. Datas
// DD/MM/YYYY, `amount` moeda pt-BR, `provider`/`cultivation` por `.name` com
// fallback "Todos Associados"/"Todos" (mesmos fallbacks da listagem, FE-02).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Box, EmptyState, Flex, Icon, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
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

import type { ChargeBillIncomeDetail } from '@/@types/v2/ChargeBillIncome';

import { useChargeBillIncomeDetail } from './useChargeBillIncomes';

const CHARGE_BILL_INCOMES_LIST_ROUTE = '/operacional/carregamento/contas-a-receber';
const NO_DATA = '—';

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

export default function ChargeBillIncomeDetalhe() {
  const { chargeBillIncomeUuid } = useParams<{ chargeBillIncomeUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.chargeBillIncomes.chargeBillIncome;
  const detailText = text.detail;

  const isValidId = isValidGuid(chargeBillIncomeUuid);

  // Guard de UUID malformado ANTES de qualquer chamada (mirror `ShowClosingWeek`).
  useEffect(() => {
    if (chargeBillIncomeUuid && !isValidId) {
      navigate(CHARGE_BILL_INCOMES_LIST_ROUTE, { replace: true });
    }
  }, [chargeBillIncomeUuid, isValidId, navigate]);

  const chargeBillIncomeQuery = useChargeBillIncomeDetail(
    isValidId ? chargeBillIncomeUuid : undefined
  );

  const isLoading = checkLoadingStatus([chargeBillIncomeQuery as any]);
  const item = chargeBillIncomeQuery.data as ChargeBillIncomeDetail | undefined;
  const notFound = !isLoading && (chargeBillIncomeQuery as any).isError;

  const canEdit = can('charge_income_edit');

  if (chargeBillIncomeUuid && !isValidId) {
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
                variant="outline"
                size="sm"
                onClick={() => navigate(CHARGE_BILL_INCOMES_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={item ? `${text.singularLabel} Nº ${item.code}` : text.singularLabel}
      headerActions={
        item && (
          <Flex align="center" gap={3} flexShrink={0}>
            {canEdit && (
              <Button
                title={detailText.actions.edit}
                icon={FiEdit as ElementType}
                size="sm"
                onClick={() =>
                  navigate(`${CHARGE_BILL_INCOMES_LIST_ROUTE}/${chargeBillIncomeUuid}`)
                }
              />
            )}
          </Flex>
        )
      }
      footer={
        <Button
          title={detailText.actions.back}
          variant="outline"
          type="button"
          onClick={() => navigate(CHARGE_BILL_INCOMES_LIST_ROUTE)}
        />
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Flex direction="column" gap={6} mt={2}>
          <Box>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <Skeleton loading={isLoading}>
                <InfoField label={detailText.fields.code} value={item ? item.code : NO_DATA} />
              </Skeleton>
              <Skeleton loading={isLoading}>
                <InfoField
                  label={detailText.fields.dtEmission}
                  value={item ? formatDate(item.dt_emission) : NO_DATA}
                />
              </Skeleton>
              <Skeleton loading={isLoading}>
                <InfoField
                  label={detailText.fields.dueDate}
                  value={item ? formatDate(item.due_date) : NO_DATA}
                />
              </Skeleton>
              <Skeleton loading={isLoading}>
                <InfoField label={detailText.fields.number} value={item?.number || NO_DATA} />
              </Skeleton>
              <Skeleton loading={isLoading}>
                <InfoField
                  label={detailText.fields.amount}
                  value={item ? formatCurrencyBRL(item.amount) : NO_DATA}
                />
              </Skeleton>
              <Skeleton loading={isLoading}>
                <InfoField
                  label={detailText.fields.provider}
                  value={item?.provider?.name ?? text.list.fallback.provider}
                />
              </Skeleton>
              <Skeleton loading={isLoading}>
                <InfoField
                  label={detailText.fields.cultivation}
                  value={item?.cultivation?.name ?? text.list.fallback.cultivation}
                />
              </Skeleton>
              <Skeleton loading={isLoading}>
                <InfoField
                  label={detailText.fields.description}
                  value={item?.description || NO_DATA}
                />
              </Skeleton>
            </SimpleGrid>
          </Box>
        </Flex>
      </Box>
    </FormContainer>
  );
}
