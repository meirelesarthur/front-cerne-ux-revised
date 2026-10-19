// src/pages/CadastrosBase/CicloProducao/CicloProducaoDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de um CICLO DE PRODUÇÃO — Cadastros Base
// / Agrícola. Rota própria: /cadastros-base/ciclo-producao/:productionCycleUuid
// /detalhe (guarda `production-cycles_view`). TASK-FE-01 (97-Esteiras/033).
//
// Mirror estrutural de `Safra/SafraDetalhe.tsx` (D-FE-5, FID-G3F §4): rota
// própria, read-only, `FormContainer` + `SimpleGrid` de campos + painel de
// Áreas. Exibe as 3 datas DISTINTAS (`date`/`start_date`/`end_date` — L2,
// corrige o bug legado C49 de rotular as duas datas de período com o mesmo
// campo).
//
// "Total ha"/"Qtd Áreas": `production-cycles/{uuid}` expõe `areas[]` só com
// `{uuid, description}` (SEM `productive_area`) — o valor vem de um JOIN
// client-side contra o catálogo completo de Áreas da fazenda ativa
// (`useProductionCycleAreasCatalog`, D-FE-3: base = `productive_area`).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useMemo } from 'react';

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
  Wrap,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft, FiEdit, FiMapPin } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { useContextSelector } from 'use-context-selector';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';

import { AuthContext } from '@/contexts/AuthContext';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';

import { useProductionCycleAreasCatalog, useProductionCycleDetail } from './useProductionCycles';

const PRODUCTION_CYCLES_LIST_ROUTE = '/cadastros-base/ciclo-producao';

// Campo de leitura (label + valor) do painel "Dados Gerais" — mesma
// adaptação do `InfoField` de `SafraDetalhe.tsx` (tokens Chakra no lugar de
// `style={}`).
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

export default function CicloProducaoDetalhe() {
  const { productionCycleUuid } = useParams<{ productionCycleUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.productionCycles.productionCycle;

  // Mesmo padrão de `GrazingMap`/`usePermissions.ts` — seletor dedicado
  // direto no `AuthContext`, sem passar por `useAuth()`.
  const activeFarmUuid = useContextSelector(AuthContext, (ctx) => ctx.activeFarmUuid);

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  // (mesmo padrão de `SafraDetalhe.tsx`): redireciona para a listagem ANTES
  // de renderizar qualquer conteúdo. A ausência de chamada de rede em si já é
  // garantida por `enabled: isValidGuid(...)` dentro do hook.
  useEffect(() => {
    if (!isValidGuid(productionCycleUuid)) {
      navigate(PRODUCTION_CYCLES_LIST_ROUTE, { replace: true });
    }
  }, [productionCycleUuid, navigate]);

  const productionCycleQuery = useProductionCycleDetail({ productionCycleUuid });
  const areasCatalogQuery = useProductionCycleAreasCatalog({ activeFarmUuid });

  // `useMemo` precisa vir ANTES do guard abaixo (Rules of Hooks — mesma
  // ordem de hooks em todo render, nunca depois de um `return` condicional).
  const areasCatalog = areasCatalogQuery.data ?? [];
  const areaByUuid = useMemo(
    () => new Map(areasCatalog.map((area) => [area.uuid, area])),
    [areasCatalog]
  );

  // uuid mal formado: o efeito acima já está redirecionando — nada a
  // renderizar (a query acima fica permanentemente `enabled: false`).
  if (!isValidGuid(productionCycleUuid)) {
    return null;
  }

  const isLoading = checkLoadingStatus([productionCycleQuery, areasCatalogQuery]);
  const productionCycle = productionCycleQuery.data;
  const notFound = !isLoading && productionCycleQuery.isError;
  const canEdit = can('production-cycles_edit');

  const productionCycleAreas = productionCycle?.areas ?? [];
  const totalHa = productionCycleAreas.reduce(
    (sum, area) => sum + (areaByUuid.get(area.uuid)?.productive_area ?? 0),
    0
  );
  const areasCount = productionCycleAreas.length;

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
                onClick={() => navigate(PRODUCTION_CYCLES_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={productionCycle?.description ?? text.singularLabel}
      headerActions={
        productionCycle && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Badge colorPalette="gray" variant="subtle" py={1} px={3}>
              {productionCycle.code}
            </Badge>
            {canEdit && (
              <Button
                title={text.detail.actions.edit}
                icon={FiEdit as ElementType}
                onClick={() => navigate(`${PRODUCTION_CYCLES_LIST_ROUTE}/${productionCycleUuid}`)}
              />
            )}
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading}>
          <Flex direction="column" gap={6}>
            <Text fontSize="sm" color="fg.muted">
              {text.detail.fields.harvest}: {productionCycle?.harvest?.description ?? '—'} ·{' '}
              {text.detail.fields.responsible}:{' '}
              {productionCycle?.employee?.name ?? productionCycle?.user?.name ?? '—'}
            </Text>

            {/* Painel "Dados Gerais" — 3 datas DISTINTAS (L2). */}
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
                <InfoField label={text.detail.fields.code} value={productionCycle?.code ?? '—'} />
                <InfoField
                  label={text.detail.fields.date}
                  value={formatDate(productionCycle?.date ?? '')}
                />
                <InfoField
                  label={text.detail.fields.startDate}
                  value={formatDate(productionCycle?.start_date ?? '')}
                />
                <InfoField
                  label={text.detail.fields.endDate}
                  value={formatDate(productionCycle?.end_date ?? '')}
                />
                <InfoField
                  label={text.detail.fields.harvest}
                  value={productionCycle?.harvest?.description ?? '—'}
                />
                <InfoField
                  label={text.detail.fields.cultivation}
                  value={productionCycle?.culture?.name ?? '—'}
                />
                <InfoField
                  label={text.detail.fields.costCenter}
                  value={productionCycle?.center?.description ?? '—'}
                />
                <InfoField
                  label={text.detail.fields.responsible}
                  value={productionCycle?.employee?.name ?? productionCycle?.user?.name ?? '—'}
                />
                <InfoField
                  label={text.detail.fields.description}
                  value={productionCycle?.description ?? '—'}
                />
              </SimpleGrid>
            </Box>

            {/* Painel "Áreas" — lista + Total ha (Σ productive_area, D-FE-3) / Qtd. */}
            <Box
              bg="bg.muted"
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="lg"
              p={4}
            >
              <Flex
                justify="space-between"
                align="center"
                mb={4}
                pb={2}
                borderBottom="1px solid"
                borderColor="border.subtle"
              >
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="fg.muted"
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  {text.detail.areas.title}
                </Text>
                <Flex gap={4}>
                  <Text fontSize="sm" color="fg.muted">
                    {text.detail.areas.totalHa}: <b>{totalHa.toFixed(2)}</b>
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    {text.detail.areas.areasCount}: <b>{areasCount}</b>
                  </Text>
                </Flex>
              </Flex>

              {areasCount === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                  {text.detail.areas.empty}
                </Text>
              ) : (
                <Wrap gap={2}>
                  {productionCycleAreas.map((area) => (
                    <Badge key={area.uuid} variant="subtle" colorPalette="green" py={1} px={3}>
                      <Icon as={FiMapPin} boxSize={3} mr={1} />
                      {area.description}
                    </Badge>
                  ))}
                </Wrap>
              )}
            </Box>
          </Flex>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
