// src/pages/Administrativo/RegistroEventos/RegistroEventoDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de um REGISTRO DE EVENTOS (Bonus) —
// Administrativo. Rota própria: /administrativo/registro-eventos/:bonusUuid
// /detalhe (guarda `bonuses_view`). Esteira 037
// (registro-eventos-front-roteiro.md, TASK-FE-07). Mirror estrutural de
// `Adiantamento/AdiantamentoDetalhe.tsx`: rota própria, read-only,
// `FormContainer` + `SimpleGrid` de campos — SEM painel de Parcelas (fora do
// núcleo de Bonus).
// -----------------------------------------------------------------------------

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

import { useBonusDetail } from './useBonuses';

const BONUSES_LIST_ROUTE = '/administrativo/registro-eventos';

// Campo de leitura (label + valor) do painel "Dados Gerais" — mirror
// `InfoField` de `AdiantamentoDetalhe.tsx`.
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

export default function RegistroEventoDetalhe() {
  const { bonusUuid } = useParams<{ bonusUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.bonuses.bonus;

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  // (mesmo padrão de `AdiantamentoDetalhe.tsx`): redireciona para a listagem
  // ANTES de renderizar qualquer conteúdo.
  useEffect(() => {
    if (!isValidGuid(bonusUuid)) {
      navigate(BONUSES_LIST_ROUTE, { replace: true });
    }
  }, [bonusUuid, navigate]);

  const bonusQuery = useBonusDetail({ bonusUuid });

  // uuid mal formado: o efeito acima já está redirecionando — nada a
  // renderizar (a query acima fica permanentemente `enabled: false`).
  if (!isValidGuid(bonusUuid)) {
    return null;
  }

  const isLoading = checkLoadingStatus([bonusQuery]);
  const bonus = bonusQuery.data;
  const notFound = !isLoading && bonusQuery.isError;
  const canEdit = can('bonuses_edit');

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
                onClick={() => navigate(BONUSES_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={bonus?.employee?.name ?? text.singularLabel}
      headerActions={
        bonus && (
          <Flex align="center" gap={3} flexShrink={0}>
            {canEdit && (
              <Button
                title={text.detail.actions.edit}
                icon={FiEdit as ElementType}
                onClick={() => navigate(`${BONUSES_LIST_ROUTE}/${bonusUuid}`)}
              />
            )}
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading}>
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
              {text.detail.generalData.title}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField label={text.detail.fields.employee} value={bonus?.employee?.name ?? '—'} />
              <InfoField label={text.detail.fields.event} value={bonus?.event?.name ?? '—'} />
              <InfoField label={text.detail.fields.date} value={formatDate(bonus?.date ?? '')} />
              <InfoField
                label={text.detail.fields.amount}
                value={bonus ? formatCurrencyBRL(bonus.amount) : '—'}
              />
            </SimpleGrid>
          </Box>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
