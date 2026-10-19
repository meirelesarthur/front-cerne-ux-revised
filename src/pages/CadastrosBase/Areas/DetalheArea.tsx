// src/pages/CadastrosBase/Areas/DetalheArea.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de uma ÁREA — Cadastros Base (Area,
// F-348/UT-000446, esteira 067, TASK-FE-417, SURF-07). Rota REAL registrada
// pela TASK-FE-422 (`areaViewRoute`, `./area-routes.ts`):
// /cadastros-base/fazendas/:farmId/areas/:areaId/detalhe.
//
// UX-GAP-03 (`CONTRATO-tela-frontend-area.md §6`): o `cerne` não tem uma
// página "Área detalhe" dedicada — composta a partir de `FarmAreasMap`
// (mapa read-only, `components/Dashboard/`, SEM controles de desenho — Risco
// 3 da Tarefa) + blocos de campos, mirror ESTRUTURAL de
// `CentroCusto/DetalheCentroCusto.tsx` (`InputReadOnly` em grade
// `columnsForm`, DEC-286 — PROIBIDO `ViewField`/`DetailGrid`).
//
// Campos exibidos = SUBCONJUNTO fiel ao legado (CLM-26, lido direto de
// `GB.Cerne.Api/resources/views/areas/show.blade.php:37-128`): Fazenda, Área
// da fazenda, Gestor, Cidade, Descrição, Ativo, Área(ha), Infraestrutura,
// Observação — SEM Matrícula/Data/Tipo/Atividade/Área de Lazer/Cor/
// produtiva-improdutiva isoladas. Default UX-GAP-03 (contrato §6) mantido —
// dono pode pedir depois para exibir todos os campos.
//
// "Área da fazenda" (`farm.total_area`, legado `money($farm->total_area)`) e
// "Cidade" (`farm.town.name`, legado `$farm->city`) NÃO estão em
// `AreaResource.farm` (`whenLoaded`, só `{uuid, description}` —
// `AreaResource.php::farmSummary()`, lido direto do backend nesta sessão).
// NÃO é mock/gap: o dado existe de fato num endpoint JÁ REAL e já consumido
// pelo repo (`GET /farms/{uuid}`) — hidratado aqui por uma 2ª query real,
// reusando `useFarmForm` (`Fazendas/useFarms.tsx`, INALTERADO), já que a rota
// desta tela é farm-scoped (`:farmId` na URL).
//
// Dados: `useAreaForm`/`useFarmForm` (JÁ EXISTEM, `useCustomFormQueryByGuid`)
// — hooks INALTERADOS, só consumidos em modo leitura (mesmo racional de
// `DetalheCentroCusto.tsx`: `fillForm` é um `noop`, o dado real é lido direto
// de `*Query.data`).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Badge, Box, EmptyState, Flex, Icon, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft, FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FarmAreasMap } from '@/components/Dashboard/FarmAreasMap';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkErrorStatus, checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';

import type { AreaData } from '@/@types/v2/BaseRegistrations/areas';
import type { FarmDetail } from '@/@types/v2/Farms/farm-admin';

import { areaEditRoute } from './area-routes';
import { useAreaForm } from './useAreas';

import { useFarmForm } from '../Fazendas/useFarms';

const FAZENDAS_LIST_ROUTE = '/cadastros-base/fazendas';

// Tela de leitura — sem `useForm`/RHF. `useAreaForm`/`useFarmForm` exigem
// `fillForm` no contrato do hook (compartilhado com os formulários de
// escrita, INALTERADOS aqui); mirror EXATO de `DetalheCentroCusto.tsx::noop`.
function noop() {}

export default function DetalheArea() {
  const { farmId, areaId } = useParams<{ farmId: string; areaId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.areas.area;

  const isFarmValid = isValidGuid(farmId);
  const isAreaValid = isValidGuid(areaId);
  const canEdit = can('farms_edit');

  // Guard de navegação — `farmId`/`areaId` mal formados não devem chegar aos
  // hooks de query nem renderizar conteúdo (mirror `DetalheCentroCusto.tsx`/
  // `CreateOrUpdateArea.tsx`): redireciona para a lista de Fazendas (não há
  // lista de Área própria — SURF-01 vive dentro da lista de Fazendas).
  useEffect(() => {
    if (!isFarmValid || !isAreaValid) {
      navigate(FAZENDAS_LIST_ROUTE, { replace: true });
    }
  }, [isFarmValid, isAreaValid, navigate]);

  const areaQuery = useAreaForm({
    registrationId: isAreaValid ? areaId : undefined,
    fillForm: noop,
  });
  const farmQuery = useFarmForm({
    registrationId: isFarmValid ? farmId : undefined,
    fillForm: noop,
  });

  if (!isFarmValid || !isAreaValid) {
    return null;
  }

  const isLoading = checkLoadingStatus([areaQuery as any, farmQuery as any]);
  const isError = checkErrorStatus([areaQuery as any]);
  const area = areaQuery.data as AreaData | undefined;
  const farm = farmQuery.data as FarmDetail | undefined;

  const yesLabel = languageGB.defaltStrings.yes;
  const noLabel = languageGB.defaltStrings.no;

  if (!isLoading && isError) {
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
                onClick={() => navigate(FAZENDAS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const infrastructureLabel = (area?.infrastructure ?? [])
    .map((item) => item.description)
    .join(', ');

  const farmTotalAreaLabel = farm
    ? `${farm.total_area.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${text.mapEditor.areaUnit}`
    : '—';
  const totalAreaLabel = area
    ? `${area.total_area.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${text.mapEditor.areaUnit}`
    : '—';

  return (
    <FormContainer
      title={area?.description ?? text.singularLabel}
      headerActions={
        area && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Badge colorPalette={area.is_enabled ? 'green' : 'gray'} variant="subtle" py={1} px={3}>
              {area.is_enabled ? yesLabel : noLabel}
            </Badge>
            {canEdit && (
              <Button
                title={text.detail.actions.edit}
                icon={FiEdit as ElementType}
                onClick={() => navigate(areaEditRoute(farmId as string, areaId as string))}
              />
            )}
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Flex direction="column" gap={6}>
          <Box>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="wide"
              mb={3}
            >
              {text.detail.sections.map}
            </Text>
            {/*
              GAP-FE-CRIT-01 (achado E2E comparativo, TASK-FE-417 correção):
              `FarmAreasMap` NUNCA deve ficar aninhado dentro de um `Skeleton`
              ancestral — o único outro consumidor real do componente
              (`Dashboards/OverviewPanel/blocks/MapaTalhoes.tsx`) o renderiza
              DIRETO, sem `Skeleton` externo, repassando só `isLoading`
              (`FarmAreasMap` já resolve seu PRÓPRIO placeholder de loading
              internamente). Aninhar aqui num `<Skeleton loading={isLoading}>`
              (removido) deixava o container Leaflet montando dentro de uma
              árvore `visibility:hidden`/recém-alternada — mapa satélite e
              polígono nunca pintavam (evidência: `d-01-detalhe-area.png`
              100% em branco vs. o legado, que mostra o polígono
              centralizado). Mirror do padrão comprovado — `FarmAreasMap`
              renderizado direto, mesmo bloco de `Box` com borda/raio.

              GAP-FE-260 Fix B (causa raiz real, `RELATORIOS/GAP-FE-260-
              causa-raiz-mapa-em-branco.md §3`): o `isLoading` combinado
              (linha acima, `checkLoadingStatus([areaQuery, farmQuery])`)
              governa a grade de `InputReadOnly` — MAS o mapa só depende do
              geoJSON de `areaQuery`. Passar o combinado ao `FarmAreasMap`
              cria um commit intermediário (`areaQuery` resolvido/`farmQuery`
              ainda carregando) em que `hasAnyGeometry` já é `true` só que o
              `<div>` do mapa ainda está no ramo `Skeleton` — reproduzindo o
              mesmo mecanismo do `MapaTalhoes.tsx` (que funciona porque
              `isLoading`+`areas` vêm da MESMA query). Aqui o gate do mapa é
              ÁREA-ONLY, nunca o OR combinado.
            */}
            <Box borderRadius="lg" overflow="hidden" borderWidth="1px" borderColor="border.subtle">
              <FarmAreasMap
                areas={
                  area
                    ? [
                        {
                          id: area.uuid,
                          name: area.description,
                          color: area.color,
                          coordinates: area.coordinates,
                        },
                      ]
                    : []
                }
                isLoading={(areaQuery as any).isLoading || (areaQuery as any).isPending}
                height="360px"
                ariaLabel={text.detail.mapAriaLabel}
                emptyTitle={text.mapEditor.noPerimeter}
              />
            </Box>
          </Box>

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
              {text.detail.sections.details}
            </Text>
            {/* Cada `InputReadOnly` já resolve seu PRÓPRIO `Skeleton` via
                `loading` (`Form/InputReadOnly.tsx`) — o `<Skeleton
                loading={isLoading}>` externo que envolvia ESTA grade (e o
                mapa acima) era redundante aqui e a causa raiz do mapa em
                branco acima; removido por inteiro (mirror `DetalheCentroCusto.tsx`,
                que também nunca envolveu sua grade num `Skeleton` externo). */}
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InputReadOnly
                label={text.detail.fields.farm}
                value={area?.farm?.description ?? farm?.description ?? '—'}
                loading={isLoading}
              />
              <InputReadOnly
                label={text.detail.fields.farmTotalArea}
                value={farmTotalAreaLabel}
                loading={isLoading}
              />
              <InputReadOnly
                label={text.detail.fields.manager}
                value={area?.proprietary?.label ?? '—'}
                loading={isLoading}
              />
              <InputReadOnly
                label={text.detail.fields.city}
                value={farm?.town?.name ?? '—'}
                loading={isLoading}
              />
              <InputReadOnly
                label={text.detail.fields.description}
                value={area?.description ?? '—'}
                loading={isLoading}
              />
              <InputReadOnly
                label={text.detail.fields.active}
                value={area ? (area.is_enabled ? yesLabel : noLabel) : '—'}
                loading={isLoading}
              />
              <InputReadOnly
                label={text.detail.fields.totalArea}
                value={totalAreaLabel}
                loading={isLoading}
              />
              <InputReadOnly
                label={text.detail.fields.infrastructure}
                value={infrastructureLabel || '—'}
                loading={isLoading}
              />
              <InputReadOnly
                label={text.detail.fields.note}
                value={area?.note ?? '—'}
                loading={isLoading}
              />
            </SimpleGrid>
          </Box>
        </Flex>
      </Box>
    </FormContainer>
  );
}
