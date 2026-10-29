// src/pages/Onboarding/steps/StepContractor.tsx
// Passo 4: dados do contratante (mesmos campos-chave do cadastro de Contratantes, em versão enxuta).

import { useState } from 'react';

import { Box, Grid, Text } from '@chakra-ui/react';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useLanguage } from '@/hooks/useLanguage';

import { digits, isEmail, type ContractorData } from '../types';

interface Props {
  initial: ContractorData;
  defaultContactName: string;
  defaultContactEmail: string;
  onSubmit: (data: ContractorData) => void;
}

const FORM_STYLE = { display: 'flex', flexDirection: 'column', gap: 16 } as const;

export function StepContractor({ initial, defaultContactName, defaultContactEmail, onSubmit }: Props) {
  const { languageGB } = useLanguage();
  const t = languageGB.subscription.onboarding.contractor;
  const [f, setF] = useState<ContractorData>({
    ...initial,
    contactName: initial.contactName || defaultContactName,
    contactEmail: initial.contactEmail || defaultContactEmail,
  });
  const [submitted, setSubmitted] = useState(false);
  const set = <K extends keyof ContractorData>(k: K, v: ContractorData[K]) => setF((s) => ({ ...s, [k]: v }));
  const pj = f.personType === 'pj';
  const req = (v: string) => (v.trim() ? '' : t.errors.required);

  const errors: Record<string, string> = {
    document: req(f.document) || (digits(f.document).length === (pj ? 14 : 11) ? '' : t.errors.document),
    legalName: req(f.legalName),
    phone: req(f.phone),
    contactName: req(f.contactName),
    contactEmail: req(f.contactEmail) || (isEmail(f.contactEmail) ? '' : t.errors.email),
    zip: req(f.zip) || (digits(f.zip).length === 8 ? '' : t.errors.zip),
    address: req(f.address),
    number: req(f.number),
    city: req(f.city),
    state: req(f.state),
  };
  const valid = Object.values(errors).every((e) => !e);
  const e = (k: string) => (submitted ? errors[k] : '');
  const title = (s: string) => (
    <Text fontWeight="semibold" fontSize="md" mt={2}>
      {s}
    </Text>
  );

  return (
    <form
      noValidate
      onSubmit={(ev: React.FormEvent) => {
        ev.preventDefault();
        setSubmitted(true);
        if (valid) onSubmit(f);
      }}
      style={FORM_STYLE}
    >
      <SegmentedControl<'pj' | 'pf'>
        ariaLabel={t.sections.identity}
        value={f.personType}
        onChange={(v) => setF((s) => ({ ...s, personType: v, document: '' }))}
        options={[
          { key: 'pj', label: t.personType.pj },
          { key: 'pf', label: t.personType.pf },
        ]}
      />
      {title(t.sections.identity)}
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
        <MaskedInput name="cpfCnpj" kind="cpfCnpj" label={t.fields.document} isRequired value={f.document} onChange={(ev) => set('document', ev.target.value)} error={e('document')} />
        <Input label={pj ? t.fields.legalName : t.fields.name} isRequired value={f.legalName} onChange={(ev) => set('legalName', ev.target.value)} error={e('legalName')} />
        {pj && <Input label={t.fields.tradeName} value={f.tradeName} onChange={(ev) => set('tradeName', ev.target.value)} />}
        <MaskedInput name="phone" kind="phone" label={t.fields.phone} isRequired value={f.phone} onChange={(ev) => set('phone', ev.target.value)} error={e('phone')} />
        <MaskedInput name="cellphone" kind="phone" label={t.fields.cellphone} value={f.cellphone} onChange={(ev) => set('cellphone', ev.target.value)} />
      </Grid>
      {title(t.sections.contact)}
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
        <Input label={t.fields.contactName} isRequired value={f.contactName} onChange={(ev) => set('contactName', ev.target.value)} error={e('contactName')} />
        <Input label={t.fields.contactEmail} isRequired type="email" value={f.contactEmail} onChange={(ev) => set('contactEmail', ev.target.value)} error={e('contactEmail')} />
      </Grid>
      {title(t.sections.address)}
      <Grid templateColumns={{ base: '1fr', md: '1fr 2fr 1fr' }} gap={4}>
        <MaskedInput name="cep" kind="cep" label={t.fields.zip} isRequired value={f.zip} onChange={(ev) => set('zip', ev.target.value)} error={e('zip')} />
        <Input label={t.fields.address} isRequired value={f.address} onChange={(ev) => set('address', ev.target.value)} error={e('address')} />
        <MaskedInput name="number" kind="digits" label={t.fields.number} isRequired value={f.number} onChange={(ev) => set('number', ev.target.value)} error={e('number')} />
        <Input label={t.fields.complement} value={f.complement} onChange={(ev) => set('complement', ev.target.value)} />
        <Input label={t.fields.city} isRequired value={f.city} onChange={(ev) => set('city', ev.target.value)} error={e('city')} />
        <Input label={t.fields.state} isRequired maxLength={2} value={f.state} onChange={(ev) => set('state', ev.target.value.toUpperCase())} error={e('state')} />
      </Grid>
      <Button type="submit" title={t.submit} w="full" />
    </form>
  );
}

export default StepContractor;
