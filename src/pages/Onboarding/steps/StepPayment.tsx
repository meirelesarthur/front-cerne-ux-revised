// src/pages/Onboarding/steps/StepPayment.tsx
// Passo 3: pagamento. SIMULAÇÃO no estilo do Stripe (Payment Element): nada é enviado nem cobrado.
// Na integração real, este bloco vira o Stripe Elements/Checkout e o resultado vem do webhook.

import { useState } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useLanguage } from '@/hooks/useLanguage';
import { formatBRL } from '@/pages/Planos/Contratacao/pricing';

import { digits, type PayMethod, type PaymentResult } from '../types';

interface Props {
  amount: number;
  onPaid: (result: PaymentResult) => void;
}

const groupCard = (v: string) => digits(v).slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (v: string) => {
  const d = digits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

const FORM_STYLE = { display: 'flex', flexDirection: 'column', gap: 16 } as const;

export function StepPayment({ amount, onPaid }: Props) {
  const { languageGB } = useLanguage();
  const t = languageGB.subscription.onboarding.payment;
  const [method, setMethod] = useState<PayMethod>('card');
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvc: '' });
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const v = formatBRL(amount);

  const errors = {
    number: digits(card.number).length === 16 ? '' : t.errors.cardNumber,
    name: card.name.trim() ? '' : t.errors.cardName,
    expiry: /^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry) ? '' : t.errors.expiry,
    cvc: /^\d{3,4}$/.test(card.cvc) ? '' : t.errors.cvc,
  };
  const valid = method !== 'card' || Object.values(errors).every((e) => !e);
  const show = (k: keyof typeof errors) => (submitted && method === 'card' ? errors[k] : '');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!valid || processing) return;
    setProcessing(true);
    window.setTimeout(() => onPaid({ method, paidAt: new Date().toISOString() }), 1400);
  };
  const cta = method === 'card' ? t.pay : method === 'pix' ? t.payPix : t.payBoleto;

  return (
    <form noValidate onSubmit={submit} style={FORM_STYLE}>
      <SegmentedControl<PayMethod>
        ariaLabel={t.title}
        value={method}
        onChange={setMethod}
        options={[
          { key: 'card', label: t.method.card },
          { key: 'pix', label: t.method.pix },
          { key: 'boleto', label: t.method.boleto },
        ]}
      />
      {method === 'card' ? (
        <Flex direction="column" gap={4}>
          <Input label={t.cardNumber} isRequired inputMode="numeric" placeholder="4242 4242 4242 4242" value={card.number} onChange={(e) => setCard({ ...card, number: groupCard(e.target.value) })} error={show('number')} autoComplete="off" />
          <Input label={t.cardName} isRequired value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} error={show('name')} autoComplete="off" />
          <Flex gap={4}>
            <Input label={t.expiry} isRequired placeholder="MM/AA" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} error={show('expiry')} autoComplete="off" />
            <Input label={t.cvc} isRequired inputMode="numeric" maxLength={4} value={card.cvc} onChange={(e) => setCard({ ...card, cvc: digits(e.target.value) })} error={show('cvc')} autoComplete="off" />
          </Flex>
          <Text fontSize="sm" color="fg.muted">
            {t.testCard}
          </Text>
        </Flex>
      ) : (
        <Text fontSize="sm" color="fg.muted" borderWidth="1px" borderColor="border.muted" borderRadius="lg" p={4}>
          {method === 'pix' ? t.pixHelp : t.boletoHelp}
        </Text>
      )}
      <Button type="submit" title={processing ? t.processing : cta.replace('{v}', v)} w="full" disabled={processing} />
      <Text fontSize="sm" color="fg.muted" textAlign="center">
        {t.secure}
      </Text>
    </form>
  );
}

export default StepPayment;
