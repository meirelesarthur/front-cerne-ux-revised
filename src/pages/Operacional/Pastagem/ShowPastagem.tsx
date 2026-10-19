// src/pages/Operacional/Pastagem/ShowPastagem.tsx
// -----------------------------------------------------------------------------
// Tela de Visualização (somente leitura) de Pastagem — TASK-PAST-FE-06.
// 5 abas read-only (MO/Serviços, Máq/Implementos, Insumos, Produção,
// Ocorrências) via `useCustomSearch` (tabs por URL, deep-link). Payload de
// `GET /pastures/{uuid}` (AC-EP-03/AC-RES-01).
//
// Requisitante/armazém — mesmo fallback honesto da listagem (FE-02):
// `requester` sempre presente (calculado no Resource); os refs de armazém
// só expõem `uuid` (sem eager-load no `show()` real — na verdade `show()`
// carrega `inputsWarehouse`/`productionsWarehouse`, ver
// `PastureRepository::findByUuidForFarmOrFail()` — diferente do `index()`,
// que NÃO carrega; aqui a informação de armazém FICA disponível, mas ainda
// só como `uuid`, sem `description` — renderiza o uuid truncado).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import {
  Box,
  EmptyState,
  Flex,
  Icon,
  Image,
  SimpleGrid,
  Skeleton,
  Table,
  Tabs,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft, FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Status } from '@/components/Status';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomSearch } from '@/hooks/useCustomSearch';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { PASTURE_STATUS_META, getPastureStatusLegend } from '@/constants/pastures/pasture-status';
import { queryKey } from '@/constants/query-key';

import { getPasture } from '@/services/v2/Pastures';

import type { PastureDetail } from '@/@types/v2/Pastures';

const PASTAGEM_LIST_ROUTE = '/operacional/pastagem';

function truncateUuid(uuid: string | null | undefined): string {
  if (!uuid) return '—';
  return `${uuid.slice(0, 8)}…`;
}

export default function ShowPastagem() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.pastures.pasture;
  const showText = text.show;
  const noData = '—';

  const { tabIndex, handleTabsChange } = useCustomSearch(0);

  const detailQuery = useCustomFormQueryByGuid<PastureDetail>({
    registrationId: isValidGuid(uuid) ? uuid : undefined,
    queryKey: queryKey.pastures.pasture,
    asyncFunction: getPasture,
    fillForm: () => undefined,
  });

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data as PastureDetail | undefined;
  const notFound = !isValidGuid(uuid) || (!isLoading && (detailQuery as any).isError);

  const canEdit = can('pastures_edit');
  const legend = getPastureStatusLegend(languageGB);
  const currentStatusLabel = item
    ? legend.find((entry) => entry.status === item.status)?.label
    : undefined;

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
                <EmptyState.Title>{showText.notFound.title}</EmptyState.Title>
                <EmptyState.Description>{showText.notFound.description}</EmptyState.Description>
              </VStack>
              <Button
                title={showText.notFound.back}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(PASTAGEM_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={item?.code ?? text.singularLabel}
      headerActions={
        item && (
          <Flex align="center" gap={3} flexShrink={0}>
            {currentStatusLabel && (
              <Status
                text={currentStatusLabel}
                backgroundColor={PASTURE_STATUS_META[item.status].badgeColor}
              />
            )}
            {canEdit && item.status === 'O' && (
              <Button
                title={showText.backAction}
                icon={FiEdit as ElementType}
                size="sm"
                onClick={() => navigate(`${PASTAGEM_LIST_ROUTE}/${uuid}`)}
              />
            )}
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap={4} mb={6}>
            <InfoField label={text.list.table.date} value={item?.date ?? noData} />
            <InfoField label={text.list.table.requester} value={item?.requester ?? noData} />
            <InfoField label={text.list.table.createdAt} value={item?.created_at ?? noData} />
          </SimpleGrid>
        </Skeleton>

        {/* @ts-ignore - custom variant */}
        <Tabs.Root
          value={String(tabIndex)}
          onValueChange={(details: { value: string }) => handleTabsChange(Number(details.value))}
          variant={'secondary' as any}
        >
          {/* @ts-ignore */}
          <Tabs.List>
            {/* @ts-ignore */}
            <Tabs.Trigger value="0">{showText.tabs.services}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="1">{showText.tabs.equipments}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="2">{showText.tabs.inputs}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="3">{showText.tabs.productions}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="4">{showText.tabs.occurrences}</Tabs.Trigger>
          </Tabs.List>

          {/* @ts-ignore */}
          <Tabs.Content value="0">
            {(item?.services ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted" pt={4}>
                {showText.emptySection}
              </Text>
            ) : (
              <Box overflowX="auto" pt={4}>
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{text.form.services.fields.executor}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.services.fields.quantity}</Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {text.form.services.fields.totalQuantity}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {noData /* Centro de Custo — só uuid */}
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.services ?? []).map((row) => (
                      <Table.Row key={row.uuid}>
                        <Table.Cell>
                          {row.employee?.name ?? row.function?.name ?? row.provider?.name ?? noData}
                        </Table.Cell>
                        <Table.Cell>{row.quantity}</Table.Cell>
                        <Table.Cell>{row.total_quantity}</Table.Cell>
                        <Table.Cell>{truncateUuid(row.center?.uuid)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Tabs.Content>

          {/* @ts-ignore */}
          <Tabs.Content value="1">
            {(item?.equipments ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted" pt={4}>
                {showText.emptySection}
              </Text>
            ) : (
              <Box overflowX="auto" pt={4}>
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>
                        {text.form.equipments.fields.equipment}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {text.form.equipments.fields.startHourMeter}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {text.form.equipments.fields.endHourMeter}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.equipments.fields.note}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.equipments ?? []).map((row) => (
                      <Table.Row key={row.uuid}>
                        <Table.Cell>{truncateUuid(row.equipment?.uuid)}</Table.Cell>
                        <Table.Cell>{row.start_hour_meter}</Table.Cell>
                        <Table.Cell>{row.end_hour_meter}</Table.Cell>
                        <Table.Cell>{row.note ?? noData}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Tabs.Content>

          {/* @ts-ignore */}
          <Tabs.Content value="2">
            {(item?.inputs ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted" pt={4}>
                {showText.emptySection}
              </Text>
            ) : (
              <Box overflowX="auto" pt={4}>
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{text.form.inputs.fields.stock}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.inputs.fields.quantity}</Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {text.form.inputs.fields.quantityUnitary}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {text.form.inputs.fields.totalQuantity}
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.inputs ?? []).map((row) => (
                      <Table.Row key={row.uuid}>
                        <Table.Cell>{row.stock?.product?.description ?? noData}</Table.Cell>
                        <Table.Cell>{row.quantity}</Table.Cell>
                        <Table.Cell>{row.quantity_unitary}</Table.Cell>
                        <Table.Cell>{row.total_quantity}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Tabs.Content>

          {/* @ts-ignore */}
          <Tabs.Content value="3">
            {(item?.productions ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted" pt={4}>
                {showText.emptySection}
              </Text>
            ) : (
              <Box overflowX="auto" pt={4}>
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>
                        {text.form.productions.fields.product}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {text.form.productions.fields.quantity}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.productions.fields.note}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.productions ?? []).map((row) => (
                      <Table.Row key={row.uuid}>
                        <Table.Cell>{row.product?.description ?? noData}</Table.Cell>
                        <Table.Cell>{row.quantity}</Table.Cell>
                        <Table.Cell>{row.note ?? noData}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Tabs.Content>

          {/* @ts-ignore */}
          <Tabs.Content value="4">
            {(item?.occurrences ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted" pt={4}>
                {showText.emptySection}
              </Text>
            ) : (
              <Flex direction="column" gap={4} pt={4}>
                {(item?.occurrences ?? []).map((occurrence) => (
                  <Box
                    key={occurrence.uuid}
                    p={4}
                    border="1px solid"
                    borderColor="border.subtle"
                    borderRadius="lg"
                  >
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                      {occurrence.diagnosis ?? noData}
                    </Text>
                    <Text fontSize="sm" color="fg.muted" mb={3}>
                      {occurrence.recommendation ?? noData}
                    </Text>
                    {occurrence.images.length > 0 && (
                      <Flex gap={2} wrap="wrap">
                        {occurrence.images.map((image, imageIndex) => (
                          <Image
                            key={imageIndex}
                            src={image.image}
                            alt={showText.tabs.occurrences}
                            boxSize="96px"
                            objectFit="cover"
                            borderRadius="md"
                          />
                        ))}
                      </Flex>
                    )}
                  </Box>
                ))}
              </Flex>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </Box>
    </FormContainer>
  );
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
