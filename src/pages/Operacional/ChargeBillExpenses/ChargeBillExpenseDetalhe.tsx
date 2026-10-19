// src/pages/Operacional/ChargeBillExpenses/ChargeBillExpenseDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de UMA Conta a Pagar (ChargeBillExpense —
// Operacional / Agricultura / Carregamento). TASK-CBE-07, esteira
// 97-Esteiras/062 (contrato de tela §2.3, §2.4, §4).
//
// Rota: `/operacional/carregamento/contas-a-pagar/:chargeBillExpenseUuid/
// detalhe`, guarda `charge_expense_view` (`src/router/index.tsx`).
//
// Mirror ESTRUTURAL de `Operacional/ChargeBillIncomes/ChargeBillIncomeDetalhe.tsx`
// (gêmeo, execução 059): guard de UUID malformado ANTES de qualquer chamada,
// `EmptyState` de "não encontrado", `InfoField`-like layout com `Skeleton` por
// campo, botão "Editar" gated `charge_expense_edit`. 8 campos read-only, fiéis
// ao `show.blade.php` legado: code, dt_emission, due_date, number, amount,
// provider.name, cultivation.name, description. `branch` é OMITIDO da
// renderização (mesmo a API expondo o campo no payload) — fidelidade ao show
// legado, list_manifest note, contrato §2.3.
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

import type { ChargeBillExpenseDetail } from '@/@types/v2/ChargeBillExpense';

import { useChargeBillExpenseDetail } from './useChargeBillExpenses';

const CHARGE_BILL_EXPENSES_LIST_ROUTE = '/operacional/carregamento/contas-a-pagar';
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

export default function ChargeBillExpenseDetalhe() {
  const { chargeBillExpenseUuid } = useParams<{ chargeBillExpenseUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.chargeBillExpenses.chargeBillExpense;
  const detailText = text.detail;

  const isValidId = isValidGuid(chargeBillExpenseUuid);

  // Guard de UUID malformado ANTES de qualquer chamada (mirror `ChargeBillIncomeDetalhe`).
  useEffect(() => {
    if (chargeBillExpenseUuid && !isValidId) {
      navigate(CHARGE_BILL_EXPENSES_LIST_ROUTE, { replace: true });
    }
  }, [chargeBillExpenseUuid, isValidId, navigate]);

  const chargeBillExpenseQuery = useChargeBillExpenseDetail(
    isValidId ? chargeBillExpenseUuid : undefined
  );

  const isLoading = checkLoadingStatus([chargeBillExpenseQuery as any]);
  const item = chargeBillExpenseQuery.data as ChargeBillExpenseDetail | undefined;
  const notFound = !isLoading && (chargeBillExpenseQuery as any).isError;

  const canEdit = can('charge_expense_edit');

  if (chargeBillExpenseUuid && !isValidId) {
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
                type="button"
                size="sm"
                onClick={() => navigate(CHARGE_BILL_EXPENSES_LIST_ROUTE)}
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
                type="button"
                size="sm"
                onClick={() =>
                  navigate(`${CHARGE_BILL_EXPENSES_LIST_ROUTE}/${chargeBillExpenseUuid}`)
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
          onClick={() => navigate(CHARGE_BILL_EXPENSES_LIST_ROUTE)}
        />
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Flex direction="column" gap={6} mt={2}>
          <Box>
            {/* 8 campos read-only, ORDEM fixa do contrato §2.3. `branch` é
                EXCLUSIVO desta feature (payload) mas OMITIDO aqui — fidelidade
                ao `show.blade.php` legado. */}
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
