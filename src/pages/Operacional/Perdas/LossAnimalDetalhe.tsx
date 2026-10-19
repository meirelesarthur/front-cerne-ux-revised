// src/pages/Operacional/Perdas/LossAnimalDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE, SOMENTE LEITURA, de Perda (LossAnimal) — Operacional /
// Pecuária. Feature F-043, execução 040 (TASK-FE-2775). Rota
// `/operacional/perdas/:lossAnimalUuid`, guardada por
// `<RequirePermission permission="loss_animals_view">` (router/index.tsx).
//
// Mirror ESTRUTURAL de `Operacional/Reproducao/LoteReproducao/
// LoteReproducaoDetalhe.tsx` (`FormContainer` + `InfoField`, guarda de uuid
// inválido via `isValidGuid`, `EmptyState`) — mirror do `mode_matrix.
// visualizar` do legado (contrato de tela §7.5.3): Código, Data, Animal,
// Causa, Lote (se houver), Responsável, Observação.
//
// `employee` (contrato §7.3, campo de leitura-somente FORA do formulário,
// DEC-LA-01) — fallback `employee.name ?? user.name`, mirror `mode_matrix.
// visualizar` do legado. `batch`/`uuid`/timestamps NÃO aparecem na
// visualização quando `batch` é `null` (a linha some, mirror `omitted_from_
// view` — quando presente, é exibido).
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

import { getLossAnimal } from '@/services/v2/Operacional/Pecuaria/lossAnimal-service';

const LOSS_ANIMALS_LIST_ROUTE = '/operacional/perdas';

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

export default function LossAnimalDetalhe() {
  const { lossAnimalUuid } = useParams<{ lossAnimalUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.lossAnimals.lossAnimal;
  const noData = '—';
  const canEdit = can('loss_animals_edit');

  const hasValidUuid = isValidGuid(lossAnimalUuid ?? null);

  useEffect(() => {
    if (!hasValidUuid) {
      toaster.create({
        type: 'error',
        title: languageGB.defaltStrings.pageNotFound,
        description: languageGB.defaltStrings.performNewSearch,
      });
      navigate(LOSS_ANIMALS_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid]);

  const detailQuery = useQuery({
    queryKey: [queryKey.lossAnimals.lossAnimal, lossAnimalUuid],
    queryFn: async () => {
      const response = await getLossAnimal(lossAnimalUuid as string);
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
      <FormContainer title={text.detailTitle}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{text.list.emptyState.titleEmptyNoCreate}</EmptyState.Title>
                <EmptyState.Description>
                  {text.list.emptyState.descriptionEmptyNoCreate}
                </EmptyState.Description>
              </VStack>
              <Button
                title={languageGB.defaltStrings.toGoBack}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(LOSS_ANIMALS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  // Mirror fallback `mode_matrix.visualizar` do legado — `employee` (DEC-LA-01,
  // leitura-somente, presente em 7/26 linhas históricas reais).
  const responsavel = item?.employee?.name ?? item?.user?.name ?? noData;

  return (
    <FormContainer
      title={text.detailTitle}
      subtitle={item?.code}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.toGoBack}
            variant="outline"
            type="button"
            onClick={() => navigate(LOSS_ANIMALS_LIST_ROUTE)}
          />
          {canEdit && item && (
            <Button
              title={text.list.actions.edit}
              icon={FiEdit as ElementType}
              type="button"
              onClick={() => navigate(`${LOSS_ANIMALS_LIST_ROUTE}/${item.uuid}/editar`)}
            />
          )}
        </>
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <InfoField label={text.form.fields.code} value={item?.code || noData} />
            <InfoField
              label={text.list.table.animal}
              value={item?.animal?.identification || noData}
            />
            <InfoField label={text.list.table.cause} value={item?.cause?.description || noData} />
            {/* `batch`/omitted_from_view — só renderiza a linha quando presente
                (mirror `omitted_from_view` do legado; ausência não é esquecimento). */}
            {item?.batch && (
              <InfoField label={text.form.fields.batch} value={item.batch.description} />
            )}
            <InfoField label={text.form.fields.responsible} value={responsavel} />
            <InfoField
              label={text.form.fields.date}
              value={item?.date ? formatDate(item.date) : noData}
            />
            <InfoField label={text.form.fields.note} value={item?.note || noData} />
          </SimpleGrid>
        </Box>
      </Box>
    </FormContainer>
  );
}
