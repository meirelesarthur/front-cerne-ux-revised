// src/pages/Operacional/FeedlotYards/DetalheFeedlotYard.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de um PÁTIO (FeedlotYard) — Operacional/
// Confinamento. Rota própria: /operacional/patios/:feedlotYardUuid/detalhe,
// guardada por `feedlot-yards_view` (TASK-PT-FE-01). A ação "Visualizar" do
// menu "..." da listagem (index.tsx) já aponta para cá.
//
// Mirror `CadastrosBase/CentroCusto/DetalheCentroCusto.tsx` (sibling
// estrutural PRIMÁRIO): `FormContainer` com `headerActions` (badge + botão
// Editar) e sub-componente local `InfoField` (label + valor). SEM
// categorias/apportionments (não existem em FeedlotYard) — só os campos
// planos do Resource.
//
// `priority` (rótulo "Ordem", `CLM-17`) é exibido AQUI e SOMENTE aqui —
// nunca na listagem nem no formulário (fiel ao legado).
//
// Dados: `useFeedlotYardForm` (useFeedlotYards.tsx, JÁ EXISTE — hook
// INALTERADO, só consumido em modo leitura) — `GET /feedlot-yards/{uuid}`
// via `getFeedlotYard`. `fillForm` é um no-op proposital: esta tela não tem
// `useForm`/RHF nenhum, só lê `feedlotYardQuery.data` diretamente.
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
import { feedlotYardStatusColor } from '@/constants/FeedlotYards/feedlot-yard-status';

import type { FeedlotYardDetail } from '@/@types/v2/FeedlotYards';

import { useFeedlotYardForm } from './useFeedlotYards';

const FEEDLOT_YARDS_LIST_ROUTE = '/operacional/patios';

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
// `DetalheCentroCusto.tsx`.
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

// `useFeedlotYardForm` exige `fillForm` no seu contrato (hook compartilhado
// com o formulário, INALTERADO aqui); o dado real é lido direto de
// `feedlotYardQuery.data` abaixo — mesmo racional de `DetalheCentroCusto.tsx`.
function noop() {}

export default function DetalheFeedlotYard() {
  const { feedlotYardUuid } = useParams<{ feedlotYardUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.feedlotYards.feedlotYard;

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  // nem renderizar conteúdo (mesmo racional de `DetalheCentroCusto.tsx`):
  // redireciona para a listagem antes de montar qualquer coisa.
  useEffect(() => {
    if (!isValidGuid(feedlotYardUuid)) {
      navigate(FEEDLOT_YARDS_LIST_ROUTE, { replace: true });
    }
  }, [feedlotYardUuid, navigate]);

  const feedlotYardQuery = useFeedlotYardForm({ registrationId: feedlotYardUuid, fillForm: noop });

  if (!isValidGuid(feedlotYardUuid)) {
    return null;
  }

  const isLoading = checkLoadingStatus([feedlotYardQuery as any]);
  const feedlotYard = feedlotYardQuery.data as FeedlotYardDetail | undefined;
  const notFound = !isLoading && (feedlotYardQuery as any).isError;

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
                onClick={() => navigate(FEEDLOT_YARDS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={feedlotYard?.name ?? text.singularLabel}
      headerActions={
        feedlotYard && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Badge
              colorPalette={
                feedlotYard.is_active ? feedlotYardStatusColor.true : feedlotYardStatusColor.false
              }
              variant="subtle"
              py={1}
              px={3}
            >
              {feedlotYard.is_active ? text.list.table.activeLabel : text.list.table.inactiveLabel}
            </Badge>
            {can('feedlot-yards_edit') && (
              <Button
                title={text.detail.actions.edit}
                icon={FiEdit as ElementType}
                onClick={() => navigate(`${FEEDLOT_YARDS_LIST_ROUTE}/${feedlotYardUuid}`)}
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
                <InfoField label={text.detail.fields.code} value={feedlotYard?.code ?? '—'} />
                <InfoField label={text.detail.fields.name} value={feedlotYard?.name ?? '—'} />
                {/* Único lugar desta feature onde `priority` (Ordem) aparece — CLM-17. */}
                <InfoField
                  label={text.detail.fields.priority}
                  value={feedlotYard ? String(feedlotYard.priority) : '—'}
                />
                <InfoField
                  label={text.detail.fields.width}
                  value={feedlotYard?.width != null ? String(feedlotYard.width) : '—'}
                />
                <InfoField
                  label={text.detail.fields.length}
                  value={feedlotYard?.length != null ? String(feedlotYard.length) : '—'}
                />
                <InfoField
                  label={text.detail.fields.area}
                  value={formatArea(feedlotYard?.area ?? null)}
                />
                <InfoField
                  label={text.detail.fields.observation}
                  value={feedlotYard?.observation || '—'}
                />
              </SimpleGrid>
            </Box>
          </Flex>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
