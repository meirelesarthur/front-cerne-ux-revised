// src/pages/Onboarding/steps/StepDone.tsx
// Passo 5: conclusão — resumo do contrato e próximos passos.

import { Box, Flex, Text } from '@chakra-ui/react';

import { Button } from '@/components/Button';
import { useLanguage } from '@/hooks/useLanguage';
import type { OnboardingOrder } from '@/pages/Planos/Contratacao/order';
import { formatBRL } from '@/pages/Planos/Contratacao/pricing';

import type { PaymentResult } from '../types';

interface Props {
  email: string;
  order: OnboardingOrder;
  payment: PaymentResult;
  onEnter: () => void;
}

export function StepDone({ email, order, payment, onEnter }: Props) {
  const { languageGB } = useLanguage();
  const t = languageGB.subscription.onboarding;
  const row = (label: string, value: string) => (
    <Flex justify="space-between" gap={4} py={2} borderBottomWidth="1px" borderColor="border.muted">
      <Text color="fg.muted">{label}</Text>
      <Text fontWeight="semibold">{value}</Text>
    </Flex>
  );
  return (
    <Flex direction="column" gap={5}>
      <Text color="fg.muted">{t.done.subtitle.replace('{email}', email)}</Text>
      <Box>
        {row(t.done.plan, `${order.plan} · ${order.users}`)}
        {row(t.done.paid, t.done.paidValue.replace('{v}', formatBRL(order.chargeNow)).replace('{method}', t.payment.method[payment.method]))}
      </Box>
      <Box>
        <Text fontWeight="semibold" mb={2}>
          {t.done.nextTitle}
        </Text>
        <Flex as="ol" direction="column" gap={1} pl={5} style={{ listStyle: 'decimal' }}>
          {t.done.next.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </Flex>
      </Box>
      <Button title={t.done.enter} w="full" onClick={onEnter} />
      <Text fontSize="sm" color="fg.muted" textAlign="center">
        {t.done.devNote}
      </Text>
    </Flex>
  );
}

export default StepDone;
