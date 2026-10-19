// src/pages/Operacional/FeedlotCorrals/DetalheFeedlotCorral.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de um CURRAL (FeedlotCorral) —
// Operacional/Confinamento. Rota:
// /operacional/currais/:uuid/detalhe, guardada por `feedlot-corrals_view`
// (TASK-043-CUR-T07, `07-Tela-Visualizacao-Curral.md`, SR-R04/CLM-017).
//
// Mirror estrutural `FeedlotSectors/DetalheFeedlotSector.tsx` /
// `FeedlotYards/DetalheFeedlotYard.tsx` (`FormContainer` com `headerActions`
// — botão Editar — + sub-componente local `InfoField`; "Voltar" é o X
// embutido no `FormContainer`).
//
// Fidelidade CLM-017: o `show.blade.php` legado exibe 16 valores/cartões e
// NÃO exibe `available_at`/`note`/lotes — reproduzido 1:1 aqui. Nenhum campo
// extra inventado.
//
// Dados: `useCustomFormQueryByGuid(getFeedlotCorral)` — `fillForm` é um
// no-op proposital: esta tela não tem `useForm`/RHF nenhum, só lê
// `feedlotCorralQuery.data` diretamente (mesmo racional dos mirrors).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Box, EmptyState, Flex, Icon, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft, FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { feedlotCorralStatusColor } from '@/constants/FeedlotCorrals/feedlot-corral-status-color';
import { queryKey } from '@/constants/query-key';

import { getFeedlotCorral } from '@/services/v2/FeedlotCorrals/feedlot-corral-service';

import type { FeedlotCorralDetail } from '@/@types/v2/FeedlotCorrals';

const FEEDLOT_CORRALS_LIST_ROUTE = '/operacional/currais';

// Formatação de "Largura"/"Comprimento"/"Área Total" — pt-BR, 2 casas, mesma
// regra do formulário (FM-008/009/010, `convertMoedaToFloat`/CV-003) — SEM
// símbolo monetário.
const numberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMeasurement(value: number | null | undefined, unit: string): string {
  return value === null || value === undefined ? '—' : `${numberFormatter.format(value)} ${unit}`;
}

// `total_area` (FM-010) é TRANSIENTE — calculado no cliente (`width*length`,
// IG-003/CV-003), nunca persistido/expor pelo backend (`FeedlotCorralDetail`
// não tem essa propriedade — mirror exato do formulário/wizard).
function computeTotalArea(width: number | null, length: number | null): number | null {
  if (width === null || width === undefined || length === null || length === undefined) {
    return null;
  }
  return width * length;
}

// Campo de leitura (label + valor) — mesma adaptação já usada em
// `DetalheFeedlotSector.tsx`/`DetalheFeedlotYard.tsx`. `dotColor` opcional
// reproduz o indicador colorido de situação já usado na listagem
// (`feedlotCorralStatusColor`, LM-010) — mesmo dado, mesma cor, sem inventar.
function InfoField({
  label,
  value,
  dotColor,
}: {
  label: string;
  value: string;
  dotColor?: string;
}) {
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
      <Flex align="center" gap={2}>
        {dotColor && <Box boxSize="2.5" borderRadius="full" bg={dotColor} flexShrink={0} />}
        <Text fontSize="sm" color="fg.default">
          {value}
        </Text>
      </Flex>
    </Box>
  );
}

// `useCustomFormQueryByGuid` exige `fillForm` no seu contrato (hook
// compartilhado com o formulário); o dado real é lido direto de
// `feedlotCorralQuery.data` abaixo — mesmo racional dos mirrors.
function noop() {}

export default function DetalheFeedlotCorral() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.feedlotCorrals.feedlotCorral;

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  // nem renderizar conteúdo (mesmo racional dos mirrors): redireciona para a
  // listagem antes de montar qualquer coisa.
  useEffect(() => {
    if (!isValidGuid(uuid)) {
      navigate(FEEDLOT_CORRALS_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const feedlotCorralQuery = useCustomFormQueryByGuid<FeedlotCorralDetail>({
    registrationId: uuid,
    asyncFunction: getFeedlotCorral,
    queryKey: queryKey.feedlotCorrals.feedlotCorral,
    fillForm: noop,
  });

  if (!isValidGuid(uuid)) {
    return null;
  }

  const isLoading = checkLoadingStatus([feedlotCorralQuery as any]);
  const feedlotCorral = feedlotCorralQuery.data as FeedlotCorralDetail | undefined;
  const notFound = !isLoading && (feedlotCorralQuery as any).isError;

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
                onClick={() => navigate(FEEDLOT_CORRALS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const totalArea = feedlotCorral
    ? computeTotalArea(feedlotCorral.width, feedlotCorral.length)
    : null;
  const statusColor = feedlotCorral?.status?.value
    ? feedlotCorralStatusColor[feedlotCorral.status.value]
    : undefined;

  return (
    <FormContainer
      title={feedlotCorral?.name ?? text.singularLabel}
      headerActions={
        feedlotCorral &&
        can('feedlot-corrals_edit') && (
          <Button
            title={text.detail.actions.edit}
            icon={FiEdit as ElementType}
            onClick={() => navigate(`${FEEDLOT_CORRALS_LIST_ROUTE}/${uuid}`)}
          />
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading}>
          <Flex direction="column" gap={6}>
            <Box
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
                {text.detail.generalData.title}
              </Text>
              {/* 16 cards read-only — CLM-017, sem available_at/note/lotes. */}
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField
                  label={text.detail.fields.identification}
                  value={feedlotCorral?.identification ?? '—'}
                />
                <InfoField label={text.detail.fields.name} value={feedlotCorral?.name ?? '—'} />
                <InfoField
                  label={text.detail.fields.feedlotSector}
                  value={feedlotCorral?.feedlot_sector?.name ?? '—'}
                />
                <InfoField
                  label={text.detail.fields.installationType}
                  value={feedlotCorral?.installation_type?.label ?? '—'}
                />
                <InfoField
                  label={text.detail.fields.status}
                  value={feedlotCorral?.status?.label ?? '—'}
                  dotColor={statusColor}
                />
                <InfoField
                  label={text.detail.fields.width}
                  value={formatMeasurement(feedlotCorral?.width ?? null, 'm')}
                />
                <InfoField
                  label={text.detail.fields.length}
                  value={formatMeasurement(feedlotCorral?.length ?? null, 'm')}
                />
                <InfoField
                  label={text.detail.fields.areaTotal}
                  value={formatMeasurement(totalArea, 'm²')}
                />
                <InfoField
                  label={text.detail.fields.capacity}
                  value={feedlotCorral?.capacity != null ? String(feedlotCorral.capacity) : '—'}
                />
                <InfoField
                  label={text.detail.fields.coverage}
                  value={feedlotCorral?.coverage?.label ?? '—'}
                />
                <InfoField
                  label={text.detail.fields.floor}
                  value={feedlotCorral?.floor?.label ?? '—'}
                />
                <InfoField
                  label={text.detail.fields.shading}
                  value={feedlotCorral?.shading?.label ?? '—'}
                />
                <InfoField
                  label={text.detail.fields.trough}
                  value={feedlotCorral?.trough?.description ?? '—'}
                />
                <InfoField
                  label={text.detail.fields.drinkingFountain}
                  value={feedlotCorral?.drinking_fountain?.description ?? '—'}
                />
                <InfoField
                  label={text.detail.fields.createdAt}
                  value={feedlotCorral?.created_at ? formatDate(feedlotCorral.created_at) : '—'}
                />
                <InfoField
                  label={text.detail.fields.updatedAt}
                  value={feedlotCorral?.updated_at ? formatDate(feedlotCorral.updated_at) : '—'}
                />
              </SimpleGrid>
            </Box>
          </Flex>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
