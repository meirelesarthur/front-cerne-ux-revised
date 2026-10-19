// src/pages/Frota/Transferencias/TransferenciaDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (somente leitura) de Transferência de Máquinas —
// `/frota/transferencias/:uuid/detalhe` (TASK-ETR-FE-04, SURF-16). Mirror
// estrutural de `Frota/Abastecimentos/AbastecimentoDetalhe.tsx` +
// `Administrativo/FarmTransfer/FarmTransferDetalhe.tsx` — não existe padrão-
// alvo dedicado para tela de detalhe read-only (LACUNA registrada,
// `LAC-04-padroes-front-sem-tela-de-detalhe-e-sem-repetidor`).
//
// 100% leitura: nenhum input, nenhum botão Editar (OD-001), nenhuma ação
// Receber/Cancelar (o legado só as oferece na listagem — EV21, não inventar).
//
// Bloco de recebimento (`CL-21`) SÓ renderiza com `receipt_date` E
// `employee` presentes — a API devolve os dois sempre, `null` quando
// ausentes.
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Box, Flex, Link, SimpleGrid, Skeleton, Table, Text, VStack } from '@chakra-ui/react';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Status } from '@/components/Status';

import { useLanguage } from '@/hooks/useLanguage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';

import type { EquipmentTransferDetail } from '@/@types/v2/EquipmentTransfers';

import { useEquipmentTransferDetail } from './useTransferencias';

const TRANSFERENCIAS_LIST_ROUTE = '/frota/transferencias';
const NO_DATA = '—';

// Campo de leitura (label + valor) — mirror `AbastecimentoDetalhe.InfoField`.
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

export default function TransferenciaDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  const text = languageGB.equipmentTransfers.equipmentTransfer;
  const showText = text.show;
  const validUuid = isValidGuid(uuid);

  // Guarda de rota — `uuid` inválido redireciona (mirror
  // `AbastecimentoDetalhe`/`isValidGuid`) — efeito colateral em `useEffect`,
  // NUNCA um early `return` antes dos hooks abaixo (Regra dos Hooks).
  useEffect(() => {
    if (!validUuid) {
      navigate(TRANSFERENCIAS_LIST_ROUTE, { replace: true });
    }
  }, [validUuid, navigate]);

  // `useCustomFormQueryByGuid` devolve o `UseQueryResult` cru sob um cast de
  // tipo (`Response<TData>`) que NÃO declara `isError`/`isLoading`/`refetch`
  // — mirror `(detailQuery as any)` de `AbastecimentoDetalhe.tsx`.
  const detailQuery = useEquipmentTransferDetail({
    uuid: validUuid ? uuid : undefined,
    fillForm: () => undefined,
  }) as any;

  const isLoading = checkLoadingStatus([detailQuery]);
  const item = detailQuery.data as EquipmentTransferDetail | undefined;
  const isErrorState = !isLoading && detailQuery.isError;

  // CL-21 — o bloco de recebimento SÓ aparece com os dois campos presentes.
  const showsReceiptBlock = !!item?.receipt_date && !!item?.employee;

  if (!validUuid) {
    return null;
  }

  if (isErrorState) {
    return (
      <FormContainer title={showText.pageTitle}>
        <Box px={{ base: 4, md: 10 }} pb={8}>
          <EmptyState
            variant="error"
            message={text.list.emptyState.titleError}
            description={text.list.emptyState.descriptionError}
            onRetry={() => detailQuery.refetch()}
            retryLabel={text.list.emptyState.retry}
          />
          <Flex justify="center" mt={4}>
            <Button
              title={showText.pageTitle}
              icon={FiArrowLeft as ElementType}
              variant="outline"
              size="sm"
              onClick={() => navigate(TRANSFERENCIAS_LIST_ROUTE)}
            />
          </Flex>
        </Box>
      </FormContainer>
    );
  }

  return (
    <FormContainer title={item?.code ?? showText.pageTitle}>
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Text fontSize="sm" color="fg.muted">
            {item?.code ?? showText.pageTitle}
          </Text>
        </Skeleton>

        <Flex direction="column" gap={6} mt={6}>
          {/* ---- Cabeçalho — exibição crua (CL-35) ---- */}
          <Box>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <Box>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="fg.muted"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  mb={1}
                >
                  {text.list.table.status}
                </Text>
                {item ? (
                  <Status text={item.status.label} backgroundColor={item.status.color} />
                ) : (
                  <Text fontSize="sm">{NO_DATA}</Text>
                )}
              </Box>
              <InfoField label={text.list.table.code} value={item?.code ?? NO_DATA} />
              <InfoField label={text.list.table.responsible} value={item?.user?.name ?? NO_DATA} />
              <InfoField
                label={text.list.table.date}
                value={item?.date ? formatDate(item.date) : NO_DATA}
              />
              <InfoField
                label={text.list.table.farmOrigin}
                value={item?.farm?.description ?? NO_DATA}
              />
              <InfoField
                label={text.list.table.farmDestination}
                value={item?.farm_out?.description ?? NO_DATA}
              />
            </SimpleGrid>
          </Box>

          {/* ---- Bloco de recebimento — SÓ com receipt_date E employee (CL-21) ---- */}
          {showsReceiptBlock && (
            <Box>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="fg.default"
                mb={4}
                pb={2}
                borderBottom="1px solid"
                borderColor="border.subtle"
              >
                {showText.receiptBlock.title}
              </Text>
              <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
                <InfoField
                  label={showText.receiptBlock.receiptDate}
                  value={item?.receipt_date ? formatDate(item.receipt_date) : NO_DATA}
                />
                <InfoField
                  label={showText.receiptBlock.employee}
                  value={item?.employee?.name ?? NO_DATA}
                />
              </SimpleGrid>
            </Box>
          )}

          {/* ---- Máquinas — CL-36 ---- */}
          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="fg.default"
              mb={4}
              pb={2}
              borderBottom="1px solid"
              borderColor="border.subtle"
            >
              {showText.equipments.title}
            </Text>
            {(item?.equipments ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {NO_DATA}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{text.list.table.equipments}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.equipments ?? []).map((equipment) => (
                      <Table.Row key={equipment.uuid}>
                        <Table.Cell>{equipment.description}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>

          {/* ---- Anexos — CL-36/IG-10 (link "Ver Documento", nova aba) ---- */}
          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="fg.default"
              mb={4}
              pb={2}
              borderBottom="1px solid"
              borderColor="border.subtle"
            >
              {showText.attachments.title}
            </Text>
            {(item?.attachments ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {showText.attachments.empty}
              </Text>
            ) : (
              <VStack align="stretch" gap={3}>
                {(item?.attachments ?? []).map((attachment) => (
                  <Flex
                    key={attachment.uuid}
                    justify="space-between"
                    align="center"
                    gap={3}
                    p={3}
                    bg="bg.subtle"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="border.subtle"
                  >
                    <Text fontSize="sm" fontWeight="medium">
                      {attachment.name}
                    </Text>
                    <Link
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      fontSize="sm"
                      color="blue.500"
                      _hover={{ textDecoration: 'underline' }}
                    >
                      {showText.attachments.viewDocument}
                    </Link>
                  </Flex>
                ))}
              </VStack>
            )}
          </Box>
        </Flex>
      </Box>
    </FormContainer>
  );
}
