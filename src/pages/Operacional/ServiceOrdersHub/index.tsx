// src/pages/Operacional/ServiceOrdersHub/index.tsx
// -----------------------------------------------------------------------------
// Central de Trabalho e compras (branch feat/nova-ordem-servico-apontamento).
//
// Decisão do dono (24/11/2026): a Ordem de Serviço acabou. Trabalho da EQUIPE
// entra pelo Apontamento; produto OU serviço de fora entra pela Ordem de compra
// (antiga Solicitação de compra), e o serviço é confirmado no Recebimento.
// A tela leva ao módulo certo com dois cards, cada um navega direto. A explicação
// (o que vai em cada um, como a ordem de compra anda e onde acompanhar) fica na
// ajuda "Como funciona", aberta pelo botão à direita do título.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';
import type { ElementType } from 'react';

import { Box, Flex, Grid, Text } from '@chakra-ui/react';
import { FiHelpCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/ui/dialog';
import type { IconName } from '@/components/ui/Icon';
import { ModuleLinkCard } from '@/components/ui/ModuleLinkCard';
import { HubPage } from '@/components/ui/HubPage';
import { PageHeader } from '@/components/ui/PageHeader';
import { StepIndicator } from '@/components/ui/StepIndicator';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import {
  HUB_CHOICES,
  HUB_JOURNEY_ROUTES,
  HUB_JOURNEY_STEP_KEYS,
  HUB_SHORTCUTS,
  type HubChoiceKey,
  type HubJourneyStepKey,
} from './serviceOrdersHubRoutes';

const CHOICE_ICONS: Record<HubChoiceKey, IconName> = {
  internal: 'users',
  purchase: 'cart',
};

const SHORTCUT_ICONS: Record<(typeof HUB_SHORTCUTS)[number]['key'], IconName> = {
  appropriations: 'edit-line',
  orders: 'document-add',
  mine: 'list-checks',
  receipts: 'package-check',
};

export default function ServiceOrdersHub() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const text = languageGB.serviceOrders.hub;
  const help = text.help;

  const [helpOpen, setHelpOpen] = useState(false);
  const [step, setStep] = useState<HubJourneyStepKey>('request');

  const journeySteps = useMemo(
    () => HUB_JOURNEY_STEP_KEYS.map((key) => ({ key, label: help.journey.steps[key].label })),
    [help]
  );

  const currentStep = help.journey.steps[step];
  const choices = HUB_CHOICES.filter((item) => can(item.permission));
  const shortcuts = HUB_SHORTCUTS.filter((item) => can(item.permission));

  function go(path: string) {
    setHelpOpen(false);
    navigate(path);
  }

  return (
    <HubPage>
      <Box>
        <Flex justify="space-between" align="flex-start" gap="16px" wrap="wrap">
          <PageHeader title={text.pageTitle} description={text.pageSubtitle} />
          <Button
            title={text.helpButton}
            variant="ghost"
            icon={FiHelpCircle as ElementType}
            onClick={() => setHelpOpen(true)}
          />
        </Flex>

        <Box
          as="nav"
          aria-label={text.cardsAriaLabel}
          maxW="720px"
          mx="auto"
          mt={{ base: '24px', md: '48px' }}
          mb={{ base: '8px', md: '24px' }}
        >
          <Grid gap="16px" templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}>
            {choices.map(({ key, path }) => (
              <ModuleLinkCard
                key={key}
                icon={CHOICE_ICONS[key]}
                title={text.options[key].title}
                description={text.options[key].description}
                tag={text.options[key].destination}
                onClick={() => navigate(path)}
              />
            ))}
          </Grid>
        </Box>
      </Box>

      <Dialog.Root
        open={helpOpen}
        onOpenChange={(details: { open: boolean }) => setHelpOpen(details.open)}
        size="lg"
        lazyMount
        unmountOnExit
      >
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>{help.title}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <Flex direction="column" gap="24px">
              <Box>
                <Text fontSize="md" fontWeight="semibold" color="fg.default">
                  {help.about.title}
                </Text>
                <Text mt="4px" fontSize="md" color="fg.muted">
                  {help.about.text}
                </Text>
              </Box>

              <Box>
                <Text fontSize="md" fontWeight="semibold" color="fg.default">
                  {help.journey.title}
                </Text>
                <Box mt="12px" overflowX="auto">
                  <StepIndicator
                    steps={journeySteps}
                    value={step}
                    onChange={setStep}
                    ariaLabel={help.journey.ariaLabel}
                  />
                </Box>
                <Grid
                  role="tabpanel"
                  aria-labelledby={`step-${step}`}
                  mt="12px"
                  p="16px"
                  gap="12px"
                  borderWidth="1px"
                  borderColor="cardBorder"
                  borderRadius="lg"
                  templateColumns={{ base: '1fr', md: 'minmax(0, 1fr) auto' }}
                  alignItems="center"
                >
                  <Box minW={0}>
                    <Text fontSize="sm" color="fg.muted">
                      {help.journey.whoLabel}: {currentStep.who}
                    </Text>
                    <Text mt="2px" fontSize="md" color="fg.default">
                      {currentStep.what}
                    </Text>
                  </Box>
                  <Button
                    title={currentStep.open}
                    variant="outline"
                    onClick={() => go(HUB_JOURNEY_ROUTES[step])}
                  />
                </Grid>
              </Box>

              {shortcuts.length > 0 && (
                <Box>
                  <Text fontSize="md" fontWeight="semibold" color="fg.default">
                    {help.shortcuts.title}
                  </Text>
                  <Grid
                    mt="12px"
                    gap="8px"
                    templateColumns={{ base: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }}
                  >
                    {shortcuts.map((item) => (
                      <ModuleLinkCard
                        key={item.key}
                        size="sm"
                        icon={SHORTCUT_ICONS[item.key]}
                        title={help.shortcuts[item.key].title}
                        description={help.shortcuts[item.key].description}
                        onClick={() => go(item.path)}
                      />
                    ))}
                  </Grid>
                </Box>
              )}
            </Flex>
          </Dialog.Body>
          <Dialog.Footer>
            <Button title={help.close} variant="outline" onClick={() => setHelpOpen(false)} />
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </HubPage>
  );
}
