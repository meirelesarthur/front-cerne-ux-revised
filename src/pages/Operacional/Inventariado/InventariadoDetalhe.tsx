// src/pages/Operacional/Inventariado/InventariadoDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de um INVENTARIADO — Operacional →
// Pecuária (S3 do contrato de tela, TASK-INV-FE-04). Rota
// `/operacional/inventariado/:uuid` (declarada em `src/router/index.tsx` na
// TASK-INV-FE-02).
//
// Mirror ESTRUTURAL de `CadastrosBase/EstoqueInicial/EstoqueInicialDetalhe.tsx`
// (guard de uuid, skeleton, `FormContainer` + campos de leitura, botão
// Voltar) — SEM edição (feature sem `_edit`, SR-06 do legado).
//
// Cabeçalho: `Data` (= `created_at`, DEF-02; campo JSON `date`) + `Responsável`
// (`user.people.name`, já resolvido pelo backend — FLD-SHOW-01/02). Lista de
// animais: `Lote`/`Animal`/`Status` (FLD-SHOW-03..05) — status colorido via
// TOKEN do design system (`inventoriedAnimalStatusColorToken`), NUNCA o hex
// cru que a API devolve em `status.color` (fiel ao legado, mas exceção
// documentada — ver `src/constants/inventoried/inventoried-status.ts`).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Box, EmptyState, Flex, Icon, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Status } from '@/components/Status';

import { useLanguage } from '@/hooks/useLanguage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { getInventoriedAnimalStatusColorToken } from '@/constants/inventoried/inventoried-status';

import { useInventoriedDetail } from './useInventoriedDetail';

const INVENTORIED_LIST_ROUTE = '/operacional/inventariado';

/**
 * Campo de leitura (label + valor) — mirror `InfoField` de `EstoqueInicialDetalhe.tsx`.
 * @param {Object} props - Props do componente
 * @param {string} props.label - Rótulo do campo
 * @param {string} props.value - Valor do campo
 * @return {React.ReactElement} Elemento renderizado
 */
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

export default function InventariadoDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  const text = languageGB.inventoried.inventoried;
  const noData = text.detail.noData;

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query.
  useEffect(() => {
    if (!isValidGuid(uuid)) {
      navigate(INVENTORIED_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  if (!isValidGuid(uuid)) {
    return null;
  }

  const detailQuery = useInventoriedDetail(uuid, true);

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data;
  const notFound = !isLoading && detailQuery.isError;

  // Estado: 404 (registro não encontrado / farm errada)
  if (notFound) {
    return (
      <FormContainer title={text.detail.pageTitle}>
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
                title={text.detail.back}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                onClick={() => navigate(INVENTORIED_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={text.detail.pageTitle}
      headerActions={
        <Flex align="center" gap={3} flexShrink={0}>
          <Button
            title={text.detail.back}
            icon={FiArrowLeft as ElementType}
            variant="outline"
            onClick={() => navigate(INVENTORIED_LIST_ROUTE)}
          />
        </Flex>
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Flex direction="column" gap={6} mt={2}>
          {/* ---- Cabeçalho — Data + Responsável (FLD-SHOW-01/02) ---- */}
          <Box>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <Skeleton loading={isLoading} width="fit-content">
                <InfoField
                  label={text.detail.header.date}
                  value={item?.date ? formatDate(item.date) : noData}
                />
              </Skeleton>
              <Skeleton loading={isLoading} width="fit-content">
                <InfoField
                  label={text.detail.header.responsible}
                  value={item?.responsavel || noData}
                />
              </Skeleton>
            </SimpleGrid>
          </Box>

          {/* ---- Lista de animais — Lote/Animal/Status (FLD-SHOW-03..05) ---- */}
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
              {text.detail.animals.title}
            </Text>

            {isLoading ? (
              <Flex direction="column" gap={2}>
                <Skeleton height="48px" borderRadius="md" />
                <Skeleton height="48px" borderRadius="md" />
                <Skeleton height="48px" borderRadius="md" />
              </Flex>
            ) : (item?.animals?.length ?? 0) === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {noData}
              </Text>
            ) : (
              <Flex direction="column" gap={2}>
                {item?.animals.map((animal, index) => (
                  <Flex
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${animal.animal}-${index}`}
                    align="center"
                    gap={6}
                    px={4}
                    py={3}
                    border="1px solid"
                    borderColor="border.subtle"
                    borderRadius="lg"
                    bg="bg.subtle"
                    wrap="wrap"
                  >
                    <Box minW="140px">
                      <Text fontSize="xs" color="fg.muted" mb={1}>
                        {text.detail.animals.batch}
                      </Text>
                      <Text fontSize="sm">{animal.lote || text.detail.animals.noBatch}</Text>
                    </Box>
                    <Box minW="140px">
                      <Text fontSize="xs" color="fg.muted" mb={1}>
                        {text.detail.animals.animal}
                      </Text>
                      <Text fontSize="sm">{animal.animal}</Text>
                    </Box>
                    <Box minW="140px">
                      <Text fontSize="xs" color="fg.muted" mb={1}>
                        {text.detail.animals.status}
                      </Text>
                      <Status
                        text={animal.status.label}
                        backgroundColor={getInventoriedAnimalStatusColorToken(animal.status.value)}
                        fontSize="sm"
                      />
                    </Box>
                  </Flex>
                ))}
              </Flex>
            )}
          </Box>
        </Flex>
      </Box>
    </FormContainer>
  );
}
