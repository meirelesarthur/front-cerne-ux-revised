// src/pages/Operacional/Reproducao/ProtocoloEstacao/ProtocolSeasonDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE, SOMENTE LEITURA, de Protocolo/Estação — Operacional /
// Reprodução (F-057, execução 040, TASK-FE-1058). Rota
// `/operacional/protocolos-estacao/:uuid`, guardada por
// `<RequirePermission permission="protocols-season_view">` (router/index.tsx,
// TASK-FE-1052).
//
// Mirror ESTRUTURAL de `LoteReproducao/LoteReproducaoDetalhe.tsx`
// (`FormContainer` + `InfoField`, guarda de uuid inválido via `isValidGuid`,
// `EmptyState`). Timeline SERVER-SIDE (CAL-007, campo `timeline` do `show`) —
// renderiza `data.timeline` diretamente, SEM recalcular client-side (isso é
// só do form, `ProtocolSeasonTimelinePreview.tsx`, TASK-FE-1057) — mesmo
// componente compartilhado `ProtocolSeasonTimeline.tsx` (contrato §7.4).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Box, EmptyState, Flex, Icon, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
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
import { queryKey } from '@/constants/query-key';

import { getProtocolSeason } from '@/services/v2/Operacional/Reproducao/protocolSeason-service';

import { ProtocolSeasonTimeline } from './ProtocolSeasonTimeline';

const PROTOCOL_SEASON_LIST_ROUTE = '/operacional/protocolos-estacao';

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

export default function ProtocolSeasonDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.protocolSeasons.protocolSeason;
  const detailText = text.detail;
  const noData = '—';
  const canEdit = can('protocols-season_edit');

  const hasValidUuid = isValidGuid(uuid ?? null);

  useEffect(() => {
    if (!hasValidUuid) {
      toaster.create({
        type: 'error',
        title: detailText.invalidParamsToast.title,
        description: detailText.invalidParamsToast.description,
      });
      navigate(PROTOCOL_SEASON_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid]);

  const detailQuery = useQuery({
    queryKey: [queryKey.protocolSeasons.protocolSeason, uuid],
    queryFn: async () => {
      const response = await getProtocolSeason(uuid as string);
      return response.data;
    },
    enabled: hasValidUuid,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (!hasValidUuid) {
    return null;
  }

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data;
  const notFound = !isLoading && detailQuery.isError;
  const canEditItem = canEdit && (item?.matings_count ?? 0) < 1;

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
                onClick={() => navigate(PROTOCOL_SEASON_LIST_ROUTE)}
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
      subtitle={item ? `${item.code} — ${item.name}` : undefined}
      footer={
        <>
          <Button
            title={detailText.backButton}
            variant="outline"
            type="button"
            onClick={() => navigate(PROTOCOL_SEASON_LIST_ROUTE)}
          />
          {canEditItem && item && (
            <Button
              title={detailText.editButton}
              icon={FiEdit as ElementType}
              type="button"
              onClick={() => navigate(`${PROTOCOL_SEASON_LIST_ROUTE}/${item.uuid}/editar`)}
            />
          )}
        </>
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
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
              label={detailText.fields.responsible}
              value={item?.employee?.name ?? item?.user?.name ?? noData}
            />
            <InfoField
              label={detailText.fields.breedingSeason}
              value={item?.breeding_season?.description || noData}
            />
            <InfoField label={detailText.fields.name} value={item?.name || noData} />
            <InfoField label={detailText.fields.description} value={item?.description || noData} />
          </SimpleGrid>
        </Box>

        <Box
          mt={6}
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
            {detailText.sections.timeline}
          </Text>

          <ProtocolSeasonTimeline groups={item?.timeline ?? []} />
        </Box>
      </Box>
    </FormContainer>
  );
}
