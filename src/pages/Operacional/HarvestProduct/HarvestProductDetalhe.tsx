// src/pages/Operacional/HarvestProduct/HarvestProductDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE, SOMENTE LEITURA, de Colheita de Frutas — Operacional /
// Agricultura (F-040, execução 040, TASK-FE-1099). Rota
// `/operacional/colheita-frutas/:uuid`, guardada por
// `<RequirePermission permission="harvest-products_view">` (TASK-FE-1100).
//
// Mirror ESTRUTURAL de `ProtocoloEstacao/ProtocolSeasonDetalhe.tsx`
// (`FormContainer` + `InfoField`, guarda de uuid inválido via `isValidGuid`,
// `EmptyState` para "não encontrado"). Nenhum cálculo de soma/contagem feito
// no front — usa `boxes_count`/`total_weight` já calculados pela API
// (contrato §7.8).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Box, EmptyState, Flex, Icon, SimpleGrid, Table, Text, VStack } from '@chakra-ui/react';
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

import { getHarvestProduct } from '@/services/v2/HarvestProduct/harvestProduct-service';

const HARVEST_PRODUCT_LIST_ROUTE = '/operacional/colheita-frutas';

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

function formatWeight(totalWeight: string): string {
  const value = Number(totalWeight);
  if (Number.isNaN(value)) return '—';
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 5 })} Kg`;
}

export default function HarvestProductDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.harvestProduct;
  const detailText = text.detail;
  const noData = '—';
  const canEdit = can('harvest-products_edit');

  const hasValidUuid = isValidGuid(uuid ?? null);

  useEffect(() => {
    if (!hasValidUuid) {
      toaster.create({
        type: 'error',
        title: detailText.invalidParamsToast.title,
        description: detailText.invalidParamsToast.description,
      });
      navigate(HARVEST_PRODUCT_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid]);

  const detailQuery = useQuery({
    queryKey: [queryKey.harvestProducts.harvestProduct, uuid],
    queryFn: async () => {
      const response = await getHarvestProduct(uuid as string);
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
                onClick={() => navigate(HARVEST_PRODUCT_LIST_ROUTE)}
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
      subtitle={item ? item.code : undefined}
      footer={
        <>
          <Button
            title={detailText.backButton}
            variant="outline"
            type="button"
            onClick={() => navigate(HARVEST_PRODUCT_LIST_ROUTE)}
          />
          {canEdit && item && (
            <Button
              title={detailText.editButton}
              icon={FiEdit as ElementType}
              type="button"
              onClick={() => navigate(`${HARVEST_PRODUCT_LIST_ROUTE}/${item.uuid}/editar`)}
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
            <InfoField label={text.list.table.code} value={item?.code || noData} />
            <InfoField
              label={text.list.table.date}
              value={item?.date ? formatDate(item.date) : noData}
            />
            <InfoField label={text.form.client} value={item?.client?.name || noData} />
            <InfoField label={text.form.area} value={item?.area?.description || noData} />
            <InfoField label={text.form.product} value={item?.product?.description || noData} />
            <InfoField
              label={text.form.city}
              value={
                item?.city
                  ? item.city.state_letter
                    ? // FID-G5 (execução 040) — parênteses, não hífen: casa
                      // com o form (`CreateOrUpdate…:110`, `mapCityOption`)
                      // e com o legado `show` (`info_state = title (letter)`).
                      `${item.city.title} (${item.city.state_letter})`
                    : item.city.title
                  : noData
              }
            />
            <InfoField label={text.form.plate} value={item?.plate || noData} />
            <InfoField label={text.form.driverName} value={item?.driver_name || noData} />
            <InfoField label={text.form.driverNif} value={item?.driver_nif || noData} />
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
            {detailText.sections.boxes}
          </Text>

          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{detailText.table.amount}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {(item?.boxes ?? []).map((box) => (
                <Table.Row key={box.uuid}>
                  <Table.Cell>{formatWeight(box.amount)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>

          <Flex
            justify="space-between"
            mt={4}
            pt={4}
            borderTop="1px solid"
            borderColor="border.subtle"
          >
            <Text fontSize="sm" color="fg.muted">
              {text.list.table.boxesCount}: {item?.boxes_count ?? 0}
            </Text>
            <Text fontSize="sm" fontWeight="semibold">
              {text.list.table.totalWeight}: {item ? formatWeight(item.total_weight) : noData}
            </Text>
          </Flex>
        </Box>
      </Box>
    </FormContainer>
  );
}
