// src/pages/Operacional/Reproducao/LoteReproducao/LoteReproducaoDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE, SOMENTE LEITURA, de Lote de Reprodução — Operacional /
// Reprodução (97-Esteiras/048, Tarefa 07). Rota
// `/operacional/lotes-reproducao/:breedingBatchUuid`, guardada por
// `<RequirePermission permission="breeding-batch_view">` (router/index.tsx).
//
// Mirror ESTRUTURAL de `EstacaoDeMonta/EstacaoDeMontaDetalhe.tsx`
// (`FormContainer` + `InfoField`, guarda de uuid inválido via `isValidGuid`,
// `EmptyState`) — SEM a faixa de estatísticas/gráfico "Dias por mês"
// (`NAO_APLICAVEL`, contrato de tela §6: recurso específico de
// `EstacaoDeMonta`, não existe no contrato legado de `breeding-batch`).
//
// Lotes vinculados (`batches[]` do `BreedingBatchResource`, mirror
// `show.blade.php`/CLM-35, que fazia `implode('description', ', ')`) — aqui
// cada lote vinculado é UMA LINHA com `code`/`description` (lista simples),
// não uma string concatenada — melhoria de legibilidade sem alterar o dado
// exibido, renderiza sem quebrar com `batches: []` (DoD).
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

import { getBreedingBatch } from '@/services/v2/BreedingBatch/breeding-batch-service';

const LOTE_REPRODUCAO_LIST_ROUTE = '/operacional/lotes-reproducao';

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

export default function LoteReproducaoDetalhe() {
  const { breedingBatchUuid } = useParams<{ breedingBatchUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.breedingBatches.breedingBatch;
  const detailText = text.detail;
  const noData = '—';
  const canEdit = can('breeding-batch_edit');

  const hasValidUuid = isValidGuid(breedingBatchUuid ?? null);

  useEffect(() => {
    if (!hasValidUuid) {
      toaster.create({
        type: 'error',
        title: detailText.invalidParamsToast.title,
        description: detailText.invalidParamsToast.description,
      });
      navigate(LOTE_REPRODUCAO_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid]);

  const detailQuery = useQuery({
    queryKey: [queryKey.breedingBatches.breedingBatch, breedingBatchUuid],
    queryFn: async () => {
      const response = await getBreedingBatch(breedingBatchUuid as string);
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
                onClick={() => navigate(LOTE_REPRODUCAO_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const linkedBatches = item?.batches ?? [];

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
            onClick={() => navigate(LOTE_REPRODUCAO_LIST_ROUTE)}
          />
          {canEdit && item && (
            <Button
              title={detailText.editButton}
              icon={FiEdit as ElementType}
              type="button"
              onClick={() => navigate(`${LOTE_REPRODUCAO_LIST_ROUTE}/${item.uuid}/editar`)}
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
              value={item?.responsible_name || noData}
            />
            <InfoField
              label={detailText.fields.breedingSeason}
              value={item?.breeding_season?.description || noData}
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
            {detailText.sections.linkedBatches}
          </Text>

          {linkedBatches.length === 0 ? (
            <Text fontSize="sm" color="fg.muted">
              {detailText.linkedBatchesEmpty}
            </Text>
          ) : (
            <VStack align="stretch" gap={0}>
              <Flex px={2} pb={2} borderBottom="1px solid" borderColor="border.subtle" gap={4}>
                <Text
                  flex="0 0 140px"
                  fontSize="xs"
                  fontWeight="semibold"
                  color="fg.muted"
                  textTransform="uppercase"
                >
                  {detailText.linkedBatchesTable.code}
                </Text>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="fg.muted"
                  textTransform="uppercase"
                >
                  {detailText.linkedBatchesTable.description}
                </Text>
              </Flex>

              {linkedBatches.map((batch) => (
                <Flex
                  key={batch.uuid}
                  px={2}
                  py={2}
                  gap={4}
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                >
                  <Text flex="0 0 140px" fontSize="sm" color="fg.default">
                    {batch.code}
                  </Text>
                  <Text fontSize="sm" color="fg.default">
                    {batch.description}
                  </Text>
                </Flex>
              ))}
            </VStack>
          )}
        </Box>
      </Box>
    </FormContainer>
  );
}
