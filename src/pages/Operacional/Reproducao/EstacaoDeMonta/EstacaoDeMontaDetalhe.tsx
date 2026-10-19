// src/pages/Operacional/Reproducao/EstacaoDeMonta/EstacaoDeMontaDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE, SOMENTE LEITURA, de Estação de Monta — Operacional /
// Reprodução (Tarefa 12). Rota `/operacional/reproducao/:breedingSeasonUuid`,
// guardada por `<RequirePermission permission="breeding-seasons_view">`.
//
// Mirror ESTRUTURAL de `Administrativo/Earning/EarningDetalhe.tsx`
// (`FormContainer` + `SimpleGrid`/`InfoField`, guarda de uuid inválido,
// `EmptyState`) + faixa de estatísticas (mirror `SafraDetalhe.tsx` do design
// system `cerne`, `VDivider` adaptado com `Box borderLeftWidth` — sem
// componente `VDivider` neste fork, adaptação por tokens Chakra).
//
// `days`/`weeks` vêm do SERVIDOR (`BreedingSeasonResource`, `GAP-EM-05` do
// backend, fonte única) — NUNCA recalculados no cliente aqui. Gráfico "Dias
// por mês" (`BarChart`, `GAP-ESTACAOMONTA-FE-03`) calculado client-side a
// partir de `start_date`/`end_date`, mesma função pura do formulário
// (Tarefa 13) — nunca diverge entre as telas.
//
// SEM nenhuma menção às 5 telas dependentes futuras (nem link, nem texto) —
// decisão do dono, `GAP-ESTACAOMONTA-FE-04`.
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Box, EmptyState, Flex, Icon, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft, FiEdit } from 'react-icons/fi';
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

import { computeMonthlyDaysBars } from './breedingSeasonChart';
import { EstacaoDeMontaBarChart } from './EstacaoDeMontaBarChart';
import { useEstacaoDeMontaDetail } from './useEstacoesDeMonta';

const ESTACAO_DE_MONTA_LIST_ROUTE = '/operacional/reproducao';

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

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <VStack align="flex-start" gap={0} px={6} py={4} flex={1} minW="140px">
      <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase">
        {label}
      </Text>
      <Text fontSize="2xl" fontWeight="bold" color="fg.default">
        {value}
      </Text>
    </VStack>
  );
}

export default function EstacaoDeMontaDetalhe() {
  const { breedingSeasonUuid } = useParams<{ breedingSeasonUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.breedingSeasons.breedingSeason;
  const detailText = text.detail;
  const noData = '—';
  const canEdit = can('breeding-seasons_edit');

  const hasValidUuid = isValidGuid(breedingSeasonUuid ?? null);

  useEffect(() => {
    if (!hasValidUuid) {
      toaster.create({
        type: 'error',
        title: detailText.invalidParamsToast.title,
        description: detailText.invalidParamsToast.description,
      });
      navigate(ESTACAO_DE_MONTA_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid]);

  const detailQuery = useEstacaoDeMontaDetail(breedingSeasonUuid);

  if (!hasValidUuid) {
    return null;
  }

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data;
  const notFound = !isLoading && detailQuery.isError;

  const monthlyBars = computeMonthlyDaysBars(item?.start_date, item?.end_date);

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
                onClick={() => navigate(ESTACAO_DE_MONTA_LIST_ROUTE)}
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
      subtitle={item ? `${item.code} — ${item.description}` : undefined}
      footer={
        <>
          <Button
            title={detailText.backButton}
            variant="outline"
            type="button"
            onClick={() => navigate(ESTACAO_DE_MONTA_LIST_ROUTE)}
          />
          {canEdit && item && (
            <Button
              title={detailText.editButton}
              icon={FiEdit as ElementType}
              type="button"
              onClick={() => navigate(`${ESTACAO_DE_MONTA_LIST_ROUTE}/${item.uuid}/editar`)}
            />
          )}
        </>
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        {/* Faixa de estatísticas — mirror `SafraDetalhe.tsx` (VDivider),
            adaptada com `Box borderLeftWidth` (tokens Chakra locais). `days`/
            `weeks` vêm do servidor, nunca recalculados aqui. */}
        <Skeleton loading={isLoading} borderRadius="lg">
          <Flex
            bg="bg.muted"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="lg"
            overflow="hidden"
            mb={6}
          >
            <StatBlock label={detailText.stats.days} value={item ? String(item.days) : noData} />
            <Box borderLeftWidth="1px" borderColor="border.subtle" />
            <StatBlock label={detailText.stats.weeks} value={item ? String(item.weeks) : noData} />
          </Flex>
        </Skeleton>

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
            {detailText.sections.generalData}
          </Text>

          <SimpleGrid columns={columnsForm.default} gap={6}>
            <InfoField label={detailText.fields.code} value={item?.code || noData} />
            <InfoField
              label={detailText.fields.date}
              value={item?.date ? formatDate(item.date) : noData}
            />
            <InfoField
              label={detailText.fields.startDate}
              value={item?.start_date ? formatDate(item.start_date) : noData}
            />
            <InfoField
              label={detailText.fields.endDate}
              value={item?.end_date ? formatDate(item.end_date) : noData}
            />
            <InfoField
              label={detailText.fields.responsible}
              value={item?.responsible_name || noData}
            />
            <InfoField label={detailText.fields.description} value={item?.description || noData} />
            <InfoField
              label={detailText.fields.createdAt}
              value={item?.created_at ? formatDate(item.created_at, 'dd/MM/yyyy HH:mm') : noData}
            />
            <InfoField
              label={detailText.fields.updatedAt}
              value={item?.updated_at ? formatDate(item.updated_at, 'dd/MM/yyyy HH:mm') : noData}
            />
          </SimpleGrid>
        </Box>

        <Box mt={6}>
          <EstacaoDeMontaBarChart
            bars={monthlyBars}
            title={text.chart.title}
            emptyLabel={text.chart.empty}
          />
        </Box>
      </Box>
    </FormContainer>
  );
}
