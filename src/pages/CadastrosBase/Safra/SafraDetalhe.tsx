// src/pages/CadastrosBase/Safra/SafraDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de uma SAFRA — Cadastros Base.
// Rota própria (registrada em TASK-FE-011): /cadastros-base/safras/:harvestId
// /detalhe, guardada por `harvests_view`. Clique na linha do grid
// (RowClickToDetail, TASK-FE-007) e a ação "Visualizar" já apontam para cá.
//
// Rota própria — NÃO um modo `readOnly` de `CreateOrUpdateSafra.tsx` (decisão
// já tomada na Tarefa, 3 razões): (1) Referência UX modela `SafraDetalhe.tsx`
// como componente inteiramente separado; (2) busca um dado de um ENDPOINT
// DIFERENTE do form (`weeks/current`, que o form nunca chama); (3) composição
// visual materialmente diferente (strip de estatísticas + painéis de
// leitura, zero controle de formulário).
//
// Fidelidade à Referência UX (GB.Cerne.UX/.../SafraDetalhe.tsx, commit
// 73b5fa86) COM ADAPTAÇÃO: troca `PageCard`/`FormPageHeader`/ícones
// `lucide-react` por `FormContainer`/`Heading` (interno ao FormContainer)/
// `react-icons/fi`, já existentes no projeto. O 5º cartão da tira de
// estatísticas ("Semana Vigente") NÃO existe no mock — é um dado novo desta
// Tarefa (`GET /harvests/{uuid}/weeks/current`).
//
// Cartões de estatística: fundo neutro (`bg.muted`/`border.subtle`, iguais ao
// resto do módulo) + chip de ícone usando os tokens `statCard.*` (`styles/
// theme/semantic/{light,dark}.ts`) — token JÁ EXISTE no tema ("para painéis
// de estatísticas") mas não tinha nenhum consumidor real ainda; nenhuma cor
// hex fixa foi introduzida aqui. Variante `primary` deliberadamente NÃO
// usada nesta tela: `statCard.primaryBG` no dark.ts resolve para
// `{colors.gray.200}` (tom CLARO) — inconsistente com as demais variantes
// (todas `gray.700` no dark), o que renderizaria uma caixa clara destoante
// no tema escuro. Suspeita de bug pré-existente no token, fora do escopo de
// `Arquivos Afetados` desta Tarefa — sinalizado à parte, não corrigido aqui.
//
// `FormContainer.subtitle`: prop aceita mas NUNCA renderizada no JSX atual do
// componente (achado nesta Tarefa — afeta também Centro de Custo/Perfil/
// Safra-formulário, que já passam a prop sem efeito visual). Por isso o
// subtítulo desta tela (intervalo de datas + rebanho + evolução) é montado
// AQUI, como conteúdo normal dentro de `children`, e não via a prop
// `subtitle` do FormContainer — contorno deliberado, sem tentar corrigir o
// componente compartilhado (fora de `Arquivos Afetados`; mudaria a saída
// visual de 3 outras telas já entregues, sem ciclo de teste próprio).
// -----------------------------------------------------------------------------

import { ElementType, ReactNode, useEffect, useMemo } from 'react';

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
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiEdit,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';

import { resolveWeekColorKey, WEEK_COLOR_PALETTE } from './safra-weeks';
import { useHarvestCurrentWeek, useHarvestDetail } from './useHarvests';
import { WeeksCanvas } from './WeeksCanvas';

const SAFRAS_LIST_ROUTE = '/cadastros-base/safras';

// Tons disponíveis nos tokens `statCard.*` do tema — `primary` deliberadamente
// omitido aqui (ver nota de cabeçalho: bug suspeito no dark.ts).
type StatTone = 'default' | 'success' | 'warning' | 'purple';

const STAT_TONE_TOKENS: Record<StatTone, { bg: string; icon: string }> = {
  default: { bg: 'statCard.defaultBG', icon: 'statCard.defaultIcon' },
  success: { bg: 'statCard.successBG', icon: 'statCard.successIcon' },
  warning: { bg: 'statCard.warningBG', icon: 'statCard.warningIcon' },
  purple: { bg: 'statCard.purpleBG', icon: 'statCard.purpleIcon' },
};

// Cartão de estatística — sub-componente PRIVADO deste arquivo (mesma
// convenção de localidade que `WeekTile` dentro de `WeeksCanvas.tsx`: uso
// único, sem precedente de reaproveitamento fora desta tela).
interface StatTileProps {
  icon: ElementType;
  tone: StatTone;
  label: string;
  value: ReactNode;
}

function StatTile({ icon, tone, label, value }: StatTileProps) {
  const toneTokens = STAT_TONE_TOKENS[tone];
  return (
    <Flex
      align="center"
      gap={3}
      bg="bg.muted"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      px={4}
      py={3}
    >
      <Flex
        align="center"
        justify="center"
        boxSize={9}
        borderRadius="md"
        bg={toneTokens.bg}
        flexShrink={0}
      >
        <Icon as={icon} boxSize={4} color={toneTokens.icon} />
      </Flex>
      <Box minW={0}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="wide"
        >
          {label}
        </Text>
        <Text fontSize="sm" fontWeight="semibold" color="fg.default" lineClamp="1">
          {value}
        </Text>
      </Box>
    </Flex>
  );
}

// Campo de leitura (label + valor) do painel "Dados Gerais" — adaptação do
// `InfoField` da Referência UX, com tokens Chakra no lugar de `style={}`.
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

// 1-12 → nome do mês por extenso (i18n) — '—' quando ausente (`first_month`/
// `second_month` são `number | null` no contrato real).
function monthLabel(monthNames: string[], month: number | null): string {
  if (!month) return '—';
  return monthNames[month - 1] ?? '—';
}

export default function SafraDetalhe() {
  const { harvestId } = useParams<{ harvestId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.harvests.harvest;

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  // (mesmo padrão de `get_pwa_form_query_pattern`, seção "ID inválido não
  // deve chegar ao hook"): redireciona para a listagem ANTES de renderizar
  // qualquer conteúdo. A ausência de chamada de rede em si já é garantida
  // por `enabled: isValidGuid(...)` dentro dos hooks (useHarvests.tsx) —
  // este efeito cobre a navegação, não é ele quem evita o fetch.
  useEffect(() => {
    if (!isValidGuid(harvestId)) {
      navigate(SAFRAS_LIST_ROUTE, { replace: true });
    }
  }, [harvestId, navigate]);

  const harvestQuery = useHarvestDetail({ harvestId });
  const today = useMemo(() => formatDate(new Date(), 'yyyy-MM-dd'), []);
  const currentWeekQuery = useHarvestCurrentWeek({ harvestId, date: today });

  // uuid mal formado: o efeito acima já está redirecionando — nada a
  // renderizar (as duas queries acima ficam permanentemente `enabled:
  // false` para este caso, então não há conteúdo real para montar).
  if (!isValidGuid(harvestId)) {
    return null;
  }

  const isLoading = checkLoadingStatus([harvestQuery, currentWeekQuery]);
  const harvest = harvestQuery.data;
  const notFound = !isLoading && harvestQuery.isError;
  const canEdit = can('harvests_edit');

  // 404 de weeks/current é resultado ESPERADO (nenhuma semana cobre hoje) —
  // tratado abaixo como estado de UI ("Sem semana vigente"), nunca toast.
  const currentWeek = currentWeekQuery.data;
  const currentWeekColorDef = currentWeek
    ? WEEK_COLOR_PALETTE[resolveWeekColorKey(currentWeek.color)]
    : undefined;

  const weeks = harvest?.weeks ?? [];
  const monthNames = text.form.monthOptions;

  const durationMonths = harvest
    ? Math.round(
        (new Date(`${harvest.end_date}T00:00:00`).getTime() -
          new Date(`${harvest.start_date}T00:00:00`).getTime()) /
          (1000 * 60 * 60 * 24 * 30)
      )
    : 0;

  const autoEvolutionLabel = harvest
    ? harvest.auto_evolution
      ? text.detail.stats.autoEvolutionEnabled
      : text.detail.stats.autoEvolutionDisabled
    : '';

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
                onClick={() => navigate(SAFRAS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={harvest?.description ?? text.singularLabel}
      headerActions={
        harvest && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Badge
              colorPalette={harvest.is_enabled ? 'green' : 'gray'}
              variant="subtle"
              py={1}
              px={3}
            >
              {harvest.is_enabled ? text.list.table.activeLabel : text.list.table.inactiveLabel}
            </Badge>
            {canEdit && (
              <Button
                title={text.detail.actions.edit}
                icon={FiEdit as ElementType}
                onClick={() => navigate(`${SAFRAS_LIST_ROUTE}/${harvestId}`)}
              />
            )}
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading}>
          <Flex direction="column" gap={6}>
            {/* Subtítulo — ver nota de cabeçalho sobre `FormContainer.subtitle` não renderizar. */}
            <Text fontSize="sm" color="fg.muted">
              {formatDate(harvest?.start_date ?? '')} — {formatDate(harvest?.end_date ?? '')} ·{' '}
              {text.detail.subtitle.herdControlPrefix}: {harvest?.herd_control_label ?? '—'} ·{' '}
              {text.detail.subtitle.autoEvolutionPrefix}: {autoEvolutionLabel || '—'}
            </Text>

            {/* Strip de estatísticas (4 do mock + 1 nova: Semana Vigente) */}
            <SimpleGrid columns={columnsForm.fiveColumns} gap={3}>
              <StatTile
                icon={FiCalendar as ElementType}
                tone="purple"
                label={text.detail.stats.weeksLabel}
                value={`${weeks.length} ${text.form.weeks.weeksCountSuffix}`}
              />
              <StatTile
                icon={FiUsers as ElementType}
                tone="default"
                label={text.detail.stats.herdControlLabel}
                value={harvest?.herd_control_label ?? '—'}
              />
              <StatTile
                icon={FiTrendingUp as ElementType}
                tone={harvest?.auto_evolution ? 'success' : 'default'}
                label={text.detail.stats.autoEvolutionLabel}
                value={autoEvolutionLabel || '—'}
              />
              <StatTile
                icon={FiClock as ElementType}
                tone="warning"
                label={text.detail.stats.durationLabel}
                value={`~${durationMonths} ${text.detail.stats.durationUnit}`}
              />
              <StatTile
                icon={FiTarget as ElementType}
                tone={currentWeek ? 'success' : 'default'}
                label={text.detail.stats.currentWeekLabel}
                value={
                  currentWeek && currentWeekColorDef ? (
                    <Flex align="center" gap={2}>
                      <Box
                        boxSize="10px"
                        borderRadius="full"
                        bg={currentWeekColorDef.bg}
                        border="1px solid"
                        borderColor={currentWeekColorDef.border}
                        flexShrink={0}
                      />
                      <Text as="span">
                        {text.form.weeks.tileAriaLabel.prefix} {currentWeek.number_week} (
                        {formatDate(currentWeek.start_date)}{' '}
                        {text.form.weeks.tileAriaLabel.rangeSeparator}{' '}
                        {formatDate(currentWeek.end_date)})
                      </Text>
                    </Flex>
                  ) : (
                    text.detail.stats.currentWeekEmpty
                  )
                }
              />
            </SimpleGrid>

            {/* Painel "Dados Gerais" */}
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
                <InfoField
                  label={text.form.fields.startDate}
                  value={formatDate(harvest?.start_date ?? '')}
                />
                <InfoField
                  label={text.form.fields.endDate}
                  value={formatDate(harvest?.end_date ?? '')}
                />
                <InfoField
                  label={text.form.fields.firstMonth}
                  value={monthLabel(monthNames, harvest?.first_month ?? null)}
                />
                <InfoField
                  label={text.form.fields.secondMonth}
                  value={monthLabel(monthNames, harvest?.second_month ?? null)}
                />
              </SimpleGrid>
            </Box>

            {/* WeeksCanvas (TASK-FE-009) em modo leitura — sem paleta nem captura de clique. */}
            <Box
              bg="bg.muted"
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="lg"
              p={4}
            >
              <WeeksCanvas
                weeks={weeks}
                editable={false}
                desc={text.detail.weeksReadOnlyHint}
                iniLabel={harvest ? formatDate(harvest.start_date) : undefined}
                fimLabel={harvest ? formatDate(harvest.end_date) : undefined}
                text={text}
              />
            </Box>
          </Flex>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
