// src/pages/Operacional/AnimalFazenda/TransferAnimalFarm/ShowTransferAnimalFarm.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO read-only (SURF-005/006) da Transferência de Animal
// entre Fazendas (97-Esteiras/042, TASK-FE-042-106) — a irmã `TransferBatchFarm`
// NÃO TEM esta tela (diverge do precedente estrutural; o legado desta
// feature tem `show` dedicado desde sempre). Desenhada do zero por
// fidelidade ao contrato legado, mirror ESTRUTURAL de
// `TransferAbcBatchDetalhe.tsx` (`FormContainer` + `InfoField`, sem
// `useForm`/edição — não há modo `editar`, `modes_not_exposed.editar`
// `NAO_APLICAVEL`, confirmado no FID-G1).
//
// Campos exibidos: `code`, `date` E `created_at` (◈ §7.3 do
// contrato-frontend — o legado exibe `created_at` como "Data de Emissão" no
// lugar de `date`, divergência PRESERVADA, não "corrigida" por analogia ao
// create — ambos exibidos, rotulados fiel ao legado), `status` (badge cor),
// `farm_from`, `farm_to`, `category`, responsável (`employee ?? user`),
// `has_financial`, lista de identificações dos animais (SURF-006, `animals[]`
// completo — o Resource já traz o array inteiro via API nova, diferente do
// legado que só mostrava a primeira por limitação de UI da Blade).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import {
  Box,
  EmptyState,
  Flex,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiArrowLeft, FiCheckCircle, FiUpload } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { transferAnimalFarmStatusColor } from '@/constants/animalFazenda/transferAnimalFarm/transfer-animal-farm-status';
import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { getTransferAnimalFarm } from '@/services/v2/Operacional/AnimalFazenda/transferAnimalFarm-service';

const TRANSFER_ANIMAL_FARM_LIST_ROUTE = '/operacional/animal-fazenda/transferencias';

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

export default function ShowTransferAnimalFarm() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  const text = languageGB.animalFazenda.transferAnimalFarm;
  const showText = text.show;
  const noData = '—';

  const hasValidUuid = isValidGuid(uuid ?? null);

  useEffect(() => {
    if (!hasValidUuid) {
      toaster.create({
        type: 'error',
        title: showText.invalidParamsToast.title,
        description: showText.invalidParamsToast.description,
      });
      navigate(TRANSFER_ANIMAL_FARM_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid]);

  const detailQuery = useQuery({
    queryKey: [queryKey.animalFazenda.transferAnimalFarm, uuid],
    queryFn: async () => {
      const response = await getTransferAnimalFarm(uuid as string);
      return response.data;
    },
    enabled: hasValidUuid,
    retry: false,
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
                <EmptyState.Title>{showText.notFoundTitle}</EmptyState.Title>
                <EmptyState.Description>{showText.notFoundDescription}</EmptyState.Description>
              </VStack>
              <Button
                title={showText.backButton}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(TRANSFER_ANIMAL_FARM_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const animals = item?.animals ?? [];

  return (
    <FormContainer
      title={showText.title}
      footer={
        <Button
          title={showText.backButton}
          variant="outline"
          type="button"
          onClick={() => navigate(TRANSFER_ANIMAL_FARM_LIST_ROUTE)}
        />
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Text fontSize="sm" color="fg.muted">
            {item ? item.code : text.singularLabel}
          </Text>
        </Skeleton>

        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <InfoField label={showText.fields.code} value={item?.code || noData} />
          <InfoField
            label={showText.fields.date}
            value={item?.date ? formatDate(item.date, 'dd/MM/yyyy') : noData}
          />
          {/* ◈ §7.3 do contrato-frontend — `created_at` exibido separadamente
              de `date` (round-trip RT-002, o legado rotula como "Data de
              Emissão"). */}
          <InfoField
            label={showText.fields.createdAt}
            value={item?.created_at ? formatDate(item.created_at, 'dd/MM/yyyy') : noData}
          />
          <Box>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="wide"
              mb={1}
            >
              {showText.fields.status}
            </Text>
            {item ? (
              <HStack gap={2}>
                <Box
                  boxSize="2.5"
                  borderRadius="full"
                  flexShrink={0}
                  backgroundColor={transferAnimalFarmStatusColor[item.status]}
                />
                <Text fontSize="sm">{item.status_label}</Text>
              </HStack>
            ) : (
              <Text fontSize="sm">{noData}</Text>
            )}
          </Box>
          <InfoField
            label={showText.fields.farmFrom}
            value={item?.farm_from?.description || noData}
          />
          <InfoField label={showText.fields.farmTo} value={item?.farm_to?.description || noData} />
          <InfoField
            label={showText.fields.category}
            value={item?.category?.description || noData}
          />
          <InfoField
            label={showText.fields.employee}
            value={item?.employee?.name || item?.user?.name || noData}
          />
          <Box>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="wide"
              mb={1}
            >
              {showText.fields.hasFinancial}
            </Text>
            {item ? (
              <Icon
                as={item.has_financial ? FiCheckCircle : FiUpload}
                color={item.has_financial ? 'green.500' : 'red.500'}
                boxSize={4}
              />
            ) : (
              <Text fontSize="sm">{noData}</Text>
            )}
          </Box>
        </SimpleGrid>

        {/* Animais da transferência (SURF-006) — lista completa. */}
        <Box mt={8}>
          <Text fontSize="sm" fontWeight="semibold" mb={3}>
            {showText.animalsSectionTitle}
          </Text>
          {animals.length === 0 ? (
            <Text fontSize="sm" color="fg.muted">
              {showText.emptyAnimals}
            </Text>
          ) : (
            <Box
              bg="bg.muted"
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="lg"
              overflow="hidden"
            >
              <Flex
                px={4}
                py={2}
                fontSize="xs"
                fontWeight="semibold"
                color="fg.muted"
                textTransform="uppercase"
                borderBottom="1px solid"
                borderColor="border.subtle"
              >
                <Text>{showText.animalsColumns.identification}</Text>
              </Flex>
              {animals.map((animal) => (
                <Flex
                  key={animal.uuid}
                  px={4}
                  py={2}
                  fontSize="sm"
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                  _last={{ borderBottom: 'none' }}
                >
                  <Text>{animal.identification}</Text>
                </Flex>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </FormContainer>
  );
}
