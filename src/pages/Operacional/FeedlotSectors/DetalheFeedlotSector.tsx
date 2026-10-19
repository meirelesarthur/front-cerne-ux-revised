// src/pages/Operacional/FeedlotSectors/DetalheFeedlotSector.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de um SETOR (FeedlotSector) —
// Operacional/Confinamento. Rota própria:
// /operacional/setores/:feedlotSectorUuid/detalhe, guardada por
// `feedlot-sectors_view` (TASK-FS-FE-01). A ação "Visualizar" do menu "..."
// da listagem (index.tsx) já aponta para cá.
//
// Mirror `FeedlotYards/DetalheFeedlotYard.tsx` (referência estrutural
// PRIMÁRIA): `FormContainer` com `headerActions` (badge + botão Editar) e
// sub-componente local `InfoField` (label + valor) — + campo "Pátio"
// (`feedlot_yard.name`), que `FeedlotYard` não tem.
//
// `priority` (rótulo "Ordem") é exibido AQUI e SOMENTE aqui — nunca na
// listagem nem no formulário (fiel ao legado).
//
// Dados: `useFeedlotSectorForm` (useFeedlotSectors.tsx, JÁ EXISTE — hook
// INALTERADO, só consumido em modo leitura) — `GET /feedlot-sectors/{uuid}`
// via `getFeedlotSector`. `fillForm` é um no-op proposital: esta tela não
// tem `useForm`/RHF nenhum, só lê `feedlotSectorQuery.data` diretamente.
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import {
  Badge,
  Box,
  EmptyState,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft, FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { feedlotSectorStatusColor } from '@/constants/FeedlotSectors/feedlot-sector-status';

import type { FeedlotSectorDetail } from '@/@types/v2/FeedlotSectors';

import { useFeedlotSectorForm } from './useFeedlotSectors';

const FEEDLOT_SECTORS_LIST_ROUTE = '/operacional/setores';

// Formatação de "Área (m²)" — mesma regra da listagem/formulário — 2 casas,
// SEM símbolo monetário.
const areaFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatArea(area: number | null): string {
  return area === null || area === undefined ? '—' : `${areaFormatter.format(area)} m²`;
}

// Campo de leitura (label + valor) — mesma adaptação já usada em
// `DetalheFeedlotYard.tsx`.
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

// `useFeedlotSectorForm` exige `fillForm` no seu contrato (hook compartilhado
// com o formulário, INALTERADO aqui); o dado real é lido direto de
// `feedlotSectorQuery.data` abaixo — mesmo racional de `DetalheFeedlotYard.tsx`.
function noop() {}

export default function DetalheFeedlotSector() {
  const { feedlotSectorUuid } = useParams<{ feedlotSectorUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.feedlotSectors.feedlotSector;

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  // nem renderizar conteúdo (mesmo racional de `DetalheFeedlotYard.tsx`):
  // redireciona para a listagem antes de montar qualquer coisa.
  useEffect(() => {
    if (!isValidGuid(feedlotSectorUuid)) {
      navigate(FEEDLOT_SECTORS_LIST_ROUTE, { replace: true });
    }
  }, [feedlotSectorUuid, navigate]);

  const feedlotSectorQuery = useFeedlotSectorForm({
    registrationId: feedlotSectorUuid,
    fillForm: noop,
  });

  if (!isValidGuid(feedlotSectorUuid)) {
    return null;
  }

  const isLoading = checkLoadingStatus([feedlotSectorQuery as any]);
  const feedlotSector = feedlotSectorQuery.data as FeedlotSectorDetail | undefined;
  const notFound = !isLoading && (feedlotSectorQuery as any).isError;

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
                onClick={() => navigate(FEEDLOT_SECTORS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={feedlotSector?.name ?? text.singularLabel}
      headerActions={
        feedlotSector && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Badge
              colorPalette={
                feedlotSector.is_active
                  ? feedlotSectorStatusColor.true
                  : feedlotSectorStatusColor.false
              }
              variant="subtle"
              py={1}
              px={3}
            >
              {feedlotSector.is_active
                ? text.list.table.activeLabel
                : text.list.table.inactiveLabel}
            </Badge>
            {can('feedlot-sectors_edit') && (
              <Button
                title={text.detail.actions.edit}
                icon={FiEdit as ElementType}
                onClick={() => navigate(`${FEEDLOT_SECTORS_LIST_ROUTE}/${feedlotSectorUuid}`)}
              />
            )}
          </Flex>
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
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField label={text.detail.fields.code} value={feedlotSector?.code ?? '—'} />
                <InfoField label={text.detail.fields.name} value={feedlotSector?.name ?? '—'} />
                <InfoField
                  label={text.detail.fields.feedlotYard}
                  value={feedlotSector?.feedlot_yard?.name ?? '—'}
                />
                {/* Único lugar desta feature onde `priority` (Ordem) aparece. */}
                <InfoField
                  label={text.detail.fields.priority}
                  value={feedlotSector ? String(feedlotSector.priority) : '—'}
                />
                <InfoField
                  label={text.detail.fields.width}
                  value={feedlotSector?.width != null ? String(feedlotSector.width) : '—'}
                />
                <InfoField
                  label={text.detail.fields.length}
                  value={feedlotSector?.length != null ? String(feedlotSector.length) : '—'}
                />
                <InfoField
                  label={text.detail.fields.area}
                  value={formatArea(feedlotSector?.area ?? null)}
                />
                <InfoField
                  label={text.detail.fields.observation}
                  value={feedlotSector?.observation || '—'}
                />
              </SimpleGrid>
            </Box>
          </Flex>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
