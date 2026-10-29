// src/pages/Onboarding/steps/StepAccount.tsx
// Passo 2: credenciais do novo acesso (nome, e-mail, senha e aceite dos termos).

import { useState } from 'react';

import { Box, Text } from '@chakra-ui/react';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/hooks/useLanguage';

import { isEmail, type AccountData } from '../types';

interface Props {
  initial: Omit<AccountData, 'password'> | null;
  onSubmit: (data: AccountData) => void;
}

const FORM_STYLE = { display: 'flex', flexDirection: 'column', gap: 16 } as const;

export function StepAccount({ initial, onSubmit }: Props) {
  const { languageGB } = useLanguage();
  const t = languageGB.subscription.onboarding.account;
  const [form, setForm] = useState<AccountData>({ name: initial?.name ?? '', email: initial?.email ?? '', password: '', accepted: initial?.accepted ?? false });
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const set = <K extends keyof AccountData>(k: K, v: AccountData[K]) => setForm((f) => ({ ...f, [k]: v }));

  const errors = {
    name: form.name.trim() ? '' : t.errors.required,
    email: !form.email.trim() ? t.errors.required : isEmail(form.email) ? '' : t.errors.email,
    password: form.password.length >= 8 && /[A-Za-z]/.test(form.password) && /\d/.test(form.password) ? '' : t.errors.passwordShort,
    confirm: confirm === form.password ? '' : t.errors.passwordMismatch,
    accepted: form.accepted ? '' : t.errors.terms,
  };
  const valid = Object.values(errors).every((e) => !e);
  const show = (k: keyof typeof errors) => (submitted ? errors[k] : '');

  return (
    <form
      noValidate
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (valid) onSubmit(form);
      }}
      style={FORM_STYLE}
    >
      <Input label={t.name} isRequired value={form.name} onChange={(e) => set('name', e.target.value)} error={show('name')} autoComplete="name" />
      <Input label={t.email} isRequired type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={show('email')} autoComplete="email" />
      <Input label={t.password} isRequired type="password" value={form.password} onChange={(e) => set('password', e.target.value)} error={show('password')} helperText={t.passwordHint} autoComplete="new-password" />
      <Input label={t.passwordConfirm} isRequired type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={show('confirm')} autoComplete="new-password" />
      <Box>
        <Checkbox checked={form.accepted} onCheckedChange={(d: { checked: boolean | "indeterminate" }) => set('accepted', !!d.checked)}>
          {t.terms}
        </Checkbox>
        {show('accepted') && (
          <Text fontSize="sm" color="red.500" mt={1}>
            {errors.accepted}
          </Text>
        )}
      </Box>
      <Button type="submit" title={t.submit} w="full" />
    </form>
  );
}

export default StepAccount;
