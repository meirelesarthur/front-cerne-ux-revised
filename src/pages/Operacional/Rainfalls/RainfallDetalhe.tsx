// src/pages/Operacional/Rainfalls/RainfallDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de um registro de PLUVIOMETRIA (Rainfall)
// — Operacional, execução 041, TASK-FE-041-PLV-04. Rota própria:
// `/operacional/pluviometria/:rainfallUuid/detalhe`, guardada por
// `rainfall_view`. A ação "Visualizar" do menu "..." da listagem (index.tsx)
// já aponta para cá.
//
// Mirror `DeathAnimals/DetalheDeathAnimal.tsx`/`FeedlotYards/DetalheFeedlotYard.tsx`
// (sibling estrutural PRIMÁRIO): `FormContainer` com `headerActions` (botão
// Editar) e sub-componente local `InfoField` (label + valor). Exibe todos os
// campos do Resource, todos read-only — Data, Responsável, mm de Chuva, Áreas
// (lista de descrições, sem tooltip aqui — texto direto, mirror `CLM-016`/show
// legado).
//
// Dados: `useRainfallForm` (`useRainfalls.tsx`, JÁ EXISTE — hook INALTERADO,
// só consumido em modo leitura) — `GET /rainfalls/{uuid}` via `getRainfall`.
// `fillForm` é um no-op proposital: esta tela não tem `useForm`/RHF nenhum, só
// lê `rainfallQuery.data` diretamente.
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

import type { RainfallDetail } from '@/@types/v2/Rainfalls';

import { useRainfallForm } from './useRainfalls';

const RAINFALLS_LIST_ROUTE = '/operacional/pluviometria';

const amountFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

// Campo de leitura (label + valor) — mesma adaptação já usada em
// `DetalheDeathAnimal.tsx`/`DetalheFeedlotYard.tsx`.
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

// `useRainfallForm` exige `fillForm` no seu contrato (hook compartilhado com o
// formulário, INALTERADO aqui); o dado real é lido direto de
// `rainfallQuery.data` abaixo — mesmo racional de `DetalheDeathAnimal.tsx`.
function noop() {}

export default function RainfallDetalhe() {
  const { rainfallUuid } = useParams<{ rainfallUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.rainfalls.rainfall;

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  // nem renderizar conteúdo (mesmo racional de `DetalheDeathAnimal.tsx`):
  // redireciona para a listagem antes de montar qualquer coisa.
  useEffect(() => {
    if (!isValidGuid(rainfallUuid)) {
      navigate(RAINFALLS_LIST_ROUTE, { replace: true });
    }
  }, [rainfallUuid, navigate]);

  const rainfallQuery = useRainfallForm({ registrationId: rainfallUuid, fillForm: noop });

  if (!isValidGuid(rainfallUuid)) {
    return null;
  }

  const isLoading = checkLoadingStatus([rainfallQuery as any]);
  const rainfall = rainfallQuery.data as RainfallDetail | undefined;
  const notFound = !isLoading && (rainfallQuery as any).isError;

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
                onClick={() => navigate(RAINFALLS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const areas = rainfall?.areas ?? [];
  const areasValue =
    areas.length > 0
      ? areas.map((area) => area.description).join(', ')
      : text.detail.fields.areasEmpty;

  return (
    <FormContainer
      title={text.singularLabel}
      headerActions={
        rainfall &&
        can('rainfall_edit') && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Button
              title={text.detail.actions.edit}
              icon={FiEdit as ElementType}
              onClick={() => navigate(`${RAINFALLS_LIST_ROUTE}/${rainfallUuid}`)}
            />
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
              <InfoField
                label={text.detail.fields.date}
                value={rainfall ? formatDate(rainfall.date) : '—'}
              />
              <InfoField label={text.detail.fields.user} value={rainfall?.user?.name ?? '—'} />
              <InfoField
                label={text.detail.fields.amount}
                value={rainfall ? amountFormatter.format(rainfall.amount) : '—'}
              />
              <InfoField label={text.detail.fields.areas} value={areasValue} />
            </SimpleGrid>
          </Box>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
