// src/components/GuidedTour/TourHelper.tsx
// Ícone de ajuda ao lado do sino: abre o painel "Primeiros passos" com os tutoriais, o progresso
// (anel + nível + pontos) e as ações de cada fluxo (começar, continuar, refazer).

import { useState } from 'react';

import { Box, Flex, IconButton, Popover, Portal, Text } from '@chakra-ui/react';

import { Icon, type IconName } from '@/components/ui/Icon';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { StatusTag } from '@/components/ui/StatusTag';
import { useLanguage } from '@/hooks/useLanguage';

import { useGuidedTour } from './GuidedTourContext';
import { LEVEL_THRESHOLDS } from './flows';

export function TourHelper() {
  const { languageGB } = useLanguage();
  const t = languageGB.subscription.tour;
  const { enabled, flows, progress, points, levelIndex, startFlow, restartFlow, resetAll } = useGuidedTour();
  const [open, setOpen] = useState(false);
  // só para quem chegou pelo "Criar conta"
  if (!enabled) return null;

  const completed = flows.filter((f) => progress[f.id]?.status === 'completed').length;
  const pct = flows.length ? (completed / flows.length) * 100 : 0;
  const next = LEVEL_THRESHOLDS[levelIndex + 1];
  const pending = flows.length - completed;

  const act = (fn: () => void) => {
    setOpen(false);
    // deixa o painel fechar antes de o balão aparecer
    window.setTimeout(fn, 150);
  };

  return (
    <Popover.Root open={open} onOpenChange={(e: { open: boolean }) => setOpen(e.open)} positioning={{ placement: 'bottom-end' }} lazyMount unmountOnExit>
      {/* @ts-ignore - Chakra UI v3 API */}
      <Popover.Trigger asChild>
        <IconButton variant="ghost" size="sm" aria-label={t.helper} title={t.helper} borderRadius="lg" position="relative" data-tour="helper">
          <Box as="span" display="flex" color="topBarIconColor">
            <Icon name="help" size="lg" />
          </Box>
          {pending > 0 && <Box position="absolute" top="4px" right="4px" boxSize="8px" borderRadius="full" bg="green.500" />}
        </IconButton>
      </Popover.Trigger>
      <Portal>
        {/* @ts-ignore - Chakra UI v3 API */}
        <Popover.Positioner>
          {/* @ts-ignore - Chakra UI v3 API */}
          <Popover.Content w="400px" maxW="calc(100vw - 32px)" bg="cardBG" borderRadius="xl" border="1px solid" borderColor="border.muted" boxShadow="0px 20px 25px -5px rgba(0, 0, 0, 0.2)">
            <Box p={4}>
              <Text fontSize="md" fontWeight="bold">
                {t.title}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {t.subtitle}
              </Text>

              <Flex align="center" gap={3} mt={4} p={3} borderRadius="lg" bg="semanticNeutral.100">
                <ProgressRing value={pct} size={48} label={t.progress.replace('{done}', String(completed)).replace('{total}', String(flows.length))} />
                <Box flex={1} minW={0}>
                  <Text fontSize="sm" fontWeight="semibold">
                    {t.level} {levelIndex + 1} · {t.levels[levelIndex]}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {points} {t.points}
                    {next ? ` · ${next - points} → ${t.levels[levelIndex + 1]}` : ''}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {pending === 0 ? t.allDone : t.progress.replace('{done}', String(completed)).replace('{total}', String(flows.length))}
                  </Text>
                </Box>
              </Flex>

              <Flex direction="column" gap={2} mt={3}>
                {flows.map((flow) => {
                  const p = progress[flow.id];
                  const status = p?.status ?? 'idle';
                  const inProgress = status === 'in_progress' || status === 'skipped';
                  return (
                    <Flex key={flow.id} gap={3} p={3} borderRadius="lg" borderWidth="1px" borderColor="border.muted" align="flex-start">
                      <Flex align="center" justify="center" flexShrink={0} boxSize="36px" borderRadius="lg" bg="semanticNeutral.100" color="green.600">
                        <Icon name={flow.icon as IconName} size={18} />
                      </Flex>
                      <Box flex={1} minW={0}>
                        <Flex align="center" gap={2} wrap="wrap">
                          <Text fontSize="sm" fontWeight="semibold">
                            {flow.title}
                          </Text>
                          {status === 'completed' && <StatusTag color="green.600" label={t.completed} size="sm" />}
                          {status === 'skipped' && <StatusTag color="orange.500" label={t.paused} size="sm" />}
                        </Flex>
                        <Text fontSize="xs" color="fg.muted">
                          {flow.description}
                        </Text>
                        <Text fontSize="xs" color="fg.muted" mt={1}>
                          {t.minutes.replace('{n}', String(flow.minutes))} · {t.pts.replace('{n}', String(flow.points))}
                        </Text>
                        <Flex gap={3} mt={2}>
                          <Text
                            as="button"
                            fontSize="sm"
                            fontWeight="semibold"
                            color="green.600"
                            onClick={() => act(() => (inProgress ? startFlow(flow.id) : restartFlow(flow.id)))}
                          >
                            {status === 'completed' ? t.restart : inProgress ? t.resume : t.start}
                          </Text>
                          {inProgress && (
                            <Text as="button" fontSize="sm" color="fg.muted" onClick={() => act(() => restartFlow(flow.id))}>
                              {t.restart}
                            </Text>
                          )}
                        </Flex>
                      </Box>
                    </Flex>
                  );
                })}
              </Flex>

              <Text as="button" fontSize="xs" color="fg.muted" mt={3} textDecoration="underline" onClick={resetAll}>
                {t.reset}
              </Text>
            </Box>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}

export default TourHelper;
