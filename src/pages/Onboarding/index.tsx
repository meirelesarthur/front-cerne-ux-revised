// src/pages/Onboarding/index.tsx
// Fluxo público "Criar conta" (Login → Criar conta): Plano → Conta → Pagamento → Contratante → Pronto.
// É um FRONT DE DESIGN: o pagamento é simulado (a integração real será com o Stripe) e nenhuma
// conta é criada. O rascunho fica em sessionStorage SEM senha nem dados de cartão.

import { useEffect, useMemo, useState } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import logo from '@/assets/Logo.svg';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { SummaryGroup, SummaryNote, SummaryPanel, SummaryRow, SummaryTotal } from '@/components/ui/SummaryPanel';
import { useLanguage } from '@/hooks/useLanguage';
import ContratacaoPlano from '@/pages/Planos/Contratacao';
import type { OnboardingOrder } from '@/pages/Planos/Contratacao/order';
import { formatBRL } from '@/pages/Planos/Contratacao/pricing';

import { StepAccount } from './steps/StepAccount';
import { StepContractor } from './steps/StepContractor';
import { StepDone } from './steps/StepDone';
import { StepPayment } from './steps/StepPayment';
import { DRAFT_KEY, EMPTY_CONTRACTOR, ONBOARDING_STEPS, type OnboardingDraft, type OnboardingStep } from './types';

const EMPTY_DRAFT: OnboardingDraft = { step: 'plan', order: null, account: null, payment: null, contractor: EMPTY_CONTRACTOR };

const loadDraft = (): OnboardingDraft => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY_DRAFT, ...JSON.parse(raw) } : EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
};

export default function Onboarding() {
  const { languageGB } = useLanguage();
  const t = languageGB.subscription.onboarding;
  const navigate = useNavigate();
  const [draft, setDraft] = useState<OnboardingDraft>(loadDraft);
  const { step, order, account, payment, contractor } = draft;

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* rascunho é conveniência */
    }
  }, [draft]);

  const patch = (p: Partial<OnboardingDraft>) => setDraft((d) => ({ ...d, ...p }));

  // Só avança até onde os dados anteriores existem.
  const reached = useMemo(() => {
    if (payment && contractor.document && account && order) return 4;
    if (payment && account && order) return 3;
    if (account && order) return 2;
    if (order) return 1;
    return 0;
  }, [order, account, payment, contractor.document]);
  const stepIndex = ONBOARDING_STEPS.indexOf(step);
  const done = step === 'done';

  const stepItems = ONBOARDING_STEPS.map((key) => ({ key, label: t.steps[key] }));
  const goTo = (key: OnboardingStep) => !done && patch({ step: key });

  const enterSystem = () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    navigate('/login');
  };

  const summary = order && (
    <SummaryPanel title={t.payment.orderTitle}>
      <SummaryGroup title={`${order.plan} · ${order.users}`}>
        <SummaryRow label={t.payment.recurring} value={order.billing === 'annual' ? t.payment.annual : t.payment.monthly} />
        {order.modules.map((m) => (
          <SummaryRow key={m.key} label={m.name} value={formatBRL(m.price)} />
        ))}
        {order.consult && <SummaryRow label={order.consult.name} value={formatBRL(order.consult.price)} />}
      </SummaryGroup>
      <SummaryTotal label={t.payment.dueNow} value={formatBRL(order.chargeNow)} />
      {order.openRange && <SummaryNote>{t.payment.openRange}</SummaryNote>}
    </SummaryPanel>
  );

  const heading: Record<Exclude<OnboardingStep, 'plan'>, { title: string; subtitle?: string }> = {
    account: { title: t.account.title, subtitle: t.account.subtitle },
    payment: { title: t.payment.title, subtitle: t.payment.subtitle },
    contractor: { title: t.contractor.title, subtitle: t.contractor.subtitle },
    done: { title: t.done.title },
  };

  const body = () => {
    if (step === 'account') return <StepAccount initial={account} onSubmit={({ password: _pw, ...rest }) => patch({ account: rest, step: 'payment' })} />;
    if (step === 'payment' && order) return <StepPayment amount={order.chargeNow} onPaid={(p) => patch({ payment: p, step: 'contractor' })} />;
    if (step === 'contractor') {
      return (
        <StepContractor
          initial={contractor}
          defaultContactName={account?.name ?? ''}
          defaultContactEmail={account?.email ?? ''}
          onSubmit={(c) => patch({ contractor: c, step: 'done' })}
        />
      );
    }
    if (step === 'done' && order && payment) return <StepDone email={account?.email ?? ''} order={order} payment={payment} onEnter={enterSystem} />;
    return null;
  };

  return (
    <Flex direction="column" minH="100vh" bg="bg.subtle">
      <Flex as="header" align="center" justify="space-between" px={{ base: 4, md: 8 }} h="64px" bg="cardBG" borderBottomWidth="1px" borderColor="border.muted">
        <img src={logo} alt="GB Cerne" style={{ height: 32, width: 'auto' }} />
        <Flex align="center" gap={2} fontSize="sm">
          <Text color="fg.muted">{t.haveAccount}</Text>
          <Text as="button" fontSize="inherit" fontWeight="semibold" color="green.600" onClick={() => navigate('/login')}>
            {t.enter}
          </Text>
        </Flex>
      </Flex>

      <Box w="full" maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} py={6} flex={1}>
        <Box mb={6} bg="cardBG" borderWidth="1px" borderColor="border.muted" borderRadius="2xl" px={{ base: 4, md: 6 }} py={3}>
          <StepIndicator<OnboardingStep>
            spread
            ariaLabel={t.title}
            steps={stepItems}
            value={step}
            onChange={goTo}
            isStepDisabled={(k) => done || ONBOARDING_STEPS.indexOf(k) > reached}
          />
        </Box>

        {step === 'plan' ? (
          <>
            <Box mb={4}>
              <Text as="h1" fontSize="2xl" fontWeight="bold">
                {t.plan.heading}
              </Text>
              <Text color="fg.muted">{t.plan.sub}</Text>
            </Box>
            <ContratacaoPlano onboarding={{ continueLabel: t.plan.continue, onContinue: (o: OnboardingOrder) => patch({ order: o, step: 'account' }) }} />
          </>
        ) : (
          <Flex direction={{ base: 'column', lg: 'row' }} gap={6} align="stretch" maxW={done ? '640px' : undefined} mx={done ? 'auto' : undefined}>
            <Box flex={1} minW={0} bg="cardBG" borderWidth="1px" borderColor="border.muted" borderRadius="2xl" p={{ base: 5, md: 8 }}>
              <Text as="h1" fontSize="2xl" fontWeight="bold">
                {heading[step as Exclude<OnboardingStep, 'plan'>].title}
              </Text>
              {heading[step as Exclude<OnboardingStep, 'plan'>].subtitle && (
                <Text color="fg.muted" mb={5}>
                  {heading[step as Exclude<OnboardingStep, 'plan'>].subtitle}
                </Text>
              )}
              {!heading[step as Exclude<OnboardingStep, 'plan'>].subtitle && <Box mb={5} />}
              {body()}
              {stepIndex > 0 && !done && step !== 'contractor' && (
                <Text as="button" mt={4} fontSize="sm" color="fg.muted" onClick={() => goTo(ONBOARDING_STEPS[stepIndex - 1])}>
                  ← {t.back}
                </Text>
              )}
            </Box>
            {!done && summary && (
              <Box w={{ base: 'full', lg: '360px' }} flexShrink={0} borderRadius="2xl" overflow="hidden">
                {summary}
              </Box>
            )}
          </Flex>
        )}
      </Box>
    </Flex>
  );
}
