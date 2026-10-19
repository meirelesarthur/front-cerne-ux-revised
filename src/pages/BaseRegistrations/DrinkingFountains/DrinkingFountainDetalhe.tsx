// src/pages/BaseRegistrations/DrinkingFountains/DrinkingFountainDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura, em cards) de um Bebedouro
// (DrinkingFountain) — Cadastros Base / Pecuários. Execução 029,
// TASK-FE-2303. Rota própria (`/cadastros-base/bebedouros/:uuid/detalhe`,
// TASK-FE-2304), guardada por `drinking-fountains_view`. Tela NOVA — sem
// equivalente no legado (mesma justificativa de Cochos, contrato de API
// §1.1). Molde estrutural: `CadastrosBase/CentroCusto/DetalheCentroCusto.tsx`
// (rota PRÓPRIA, `FormContainer` com `headerActions`, sub-componentes locais
// `InfoField`/`DetailPanel`) — mirror direto de `contrato-fe-cochos.md §5`.
//
// DELTA sobre Cochos (contrato-fe-bebedouros.md §4): painel "Dados Gerais"
// ganha 1 linha "Comprimento (cm)" (exibe "—" quando `length` é `null` —
// campo opcional, ausência é estado válido, NUNCA erro) + rótulo "Volume(L)"
// no lugar de "Área(Cm)" para a mesma coluna física `total_area`.
//
// i18n SEM alias (protocolo v2) — caminho completo
// `languageGB.baseRegistrations.drinkingFountain...` inline.
// -----------------------------------------------------------------------------

import { ElementType, ReactNode, useEffect } from 'react';

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

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { getDrinkingFountainByUuid } from '@/services/v2/BaseRegistrations/drinking-fountains-service';

import type { DrinkingFountainData } from '@/@types/v2/BaseRegistrations/drinking-fountains';

const DRINKING_FOUNTAINS_LIST_ROUTE = '/cadastros-base/bebedouros';

// Campo de leitura (label + valor) — mesma adaptação de
// `DetalheCentroCusto.tsx` (tokens Chakra, sem componente novo).
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

// Painel agrupado com borda/rótulo — mesma linguagem visual de
// `DetalheCentroCusto.tsx`.
function DetailPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
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
        {title}
      </Text>
      {children}
    </Box>
  );
}

// `useCustomFormQueryByGuid` exige `fillForm` no contrato (hook
// compartilhado com o formulário) — esta tela NÃO tem `useForm`/RHF, só lê
// `drinkingFountainQuery.data` direto. Mirror `noop` de `DetalheCentroCusto.tsx`.
function noop() {}

export default function DrinkingFountainDetalhe() {
  // Rota registrada como `/cadastros-base/bebedouros/:uuid/detalhe`
  // (TASK-FE-2304, `router/index.tsx`) — o parâmetro de rota chama-se `uuid`.
  const { uuid: drinkingFountainId } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  useEffect(() => {
    if (!isValidGuid(drinkingFountainId)) {
      navigate(DRINKING_FOUNTAINS_LIST_ROUTE, { replace: true });
    }
  }, [drinkingFountainId, navigate]);

  const drinkingFountainQuery = useCustomFormQueryByGuid<DrinkingFountainData>({
    registrationId: drinkingFountainId,
    queryKey: queryKey.drinkingFountains.drinkingFountain,
    asyncFunction: getDrinkingFountainByUuid,
    fillForm: noop,
  });

  if (!isValidGuid(drinkingFountainId)) {
    return null;
  }

  const isLoading = checkLoadingStatus([drinkingFountainQuery as any]);
  const drinkingFountain = (drinkingFountainQuery as any)?.data as DrinkingFountainData | undefined;
  const notFound = !isLoading && (drinkingFountainQuery as any).isError;

  if (notFound) {
    return (
      <FormContainer title={languageGB.baseRegistrations.drinkingFountain.singularLabel}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>
                  {languageGB.baseRegistrations.drinkingFountain.detail.notFound.title}
                </EmptyState.Title>
                <EmptyState.Description>
                  {languageGB.baseRegistrations.drinkingFountain.detail.notFound.description}
                </EmptyState.Description>
              </VStack>
              <Button
                title={languageGB.baseRegistrations.drinkingFountain.detail.notFound.back}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(DRINKING_FOUNTAINS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  // Localização — Área OU Módulo Pastejo (o que estiver preenchido) + Curral
  // (se vinculado, relação independente) — "Nenhuma localização vinculada"
  // se os 3 estiverem vazios (estado válido, os 3 campos são opcionais).
  const locationLabel =
    drinkingFountain?.area?.description ?? drinkingFountain?.grazing?.description;
  const hasLocation = !!locationLabel || !!drinkingFountain?.feedlot_corral;

  return (
    <FormContainer
      title={
        drinkingFountain?.description ?? languageGB.baseRegistrations.drinkingFountain.singularLabel
      }
      headerActions={
        drinkingFountain && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Badge colorPalette="gray" variant="subtle" py={1} px={3}>
              {drinkingFountain.type_label}
            </Badge>
            <Badge
              colorPalette={drinkingFountain.is_enabled ? 'green' : 'gray'}
              variant="subtle"
              py={1}
              px={3}
            >
              {drinkingFountain.is_enabled
                ? languageGB.baseRegistrations.drinkingFountain.list.table.active
                : languageGB.baseRegistrations.drinkingFountain.list.table.inactive}
            </Badge>
            <Button
              title={languageGB.baseRegistrations.drinkingFountain.detail.actions.edit}
              icon={FiEdit as ElementType}
              size="sm"
              onClick={() => navigate(`${DRINKING_FOUNTAINS_LIST_ROUTE}/${drinkingFountainId}`)}
            />
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading}>
          <Flex direction="column" gap={6}>
            <Text fontSize="sm" color="fg.muted">
              {drinkingFountain?.code ?? '—'}
            </Text>

            <DetailPanel
              title={languageGB.baseRegistrations.drinkingFountain.detail.sections.generalData}
            >
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField
                  label={languageGB.baseRegistrations.drinkingFountain.detail.fields.code}
                  value={drinkingFountain?.code ?? '—'}
                />
                <InfoField
                  label={languageGB.baseRegistrations.drinkingFountain.detail.fields.type}
                  value={drinkingFountain?.type_label ?? '—'}
                />
                <InfoField
                  label={languageGB.baseRegistrations.drinkingFountain.detail.fields.description}
                  value={drinkingFountain?.description ?? '—'}
                />
                <InfoField
                  label={languageGB.baseRegistrations.drinkingFountain.detail.fields.totalArea}
                  value={
                    drinkingFountain?.total_area !== undefined
                      ? String(drinkingFountain.total_area)
                      : '—'
                  }
                />
                {/* "Comprimento (cm)" — opcional, D5-BEB, campo que Cochos
                    NÃO tem: "—" quando `null`, NUNCA erro/crash. */}
                <InfoField
                  label={languageGB.baseRegistrations.drinkingFountain.detail.fields.length}
                  value={
                    drinkingFountain?.length === null || drinkingFountain?.length === undefined
                      ? '—'
                      : String(drinkingFountain.length)
                  }
                />
              </SimpleGrid>
            </DetailPanel>

            <DetailPanel
              title={languageGB.baseRegistrations.drinkingFountain.detail.sections.location}
            >
              {hasLocation ? (
                <SimpleGrid columns={columnsForm.default} gap={6}>
                  {locationLabel && (
                    <InfoField
                      label={
                        drinkingFountain?.area
                          ? languageGB.baseRegistrations.drinkingFountain.detail.fields.area
                          : languageGB.baseRegistrations.drinkingFountain.detail.fields.grazing
                      }
                      value={locationLabel}
                    />
                  )}
                  {drinkingFountain?.feedlot_corral && (
                    <InfoField
                      label={
                        languageGB.baseRegistrations.drinkingFountain.detail.fields.feedlotCorral
                      }
                      value={
                        drinkingFountain.feedlot_corral.name
                          ? `${drinkingFountain.feedlot_corral.identification} — ${drinkingFountain.feedlot_corral.name}`
                          : drinkingFountain.feedlot_corral.identification
                      }
                    />
                  )}
                </SimpleGrid>
              ) : (
                <Text fontSize="sm" color="fg.muted">
                  {languageGB.baseRegistrations.drinkingFountain.detail.emptyLocation}
                </Text>
              )}
            </DetailPanel>
          </Flex>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
