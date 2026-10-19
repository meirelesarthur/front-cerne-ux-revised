// src/pages/MeuPerfil/SecurityCard.tsx
// -----------------------------------------------------------------------------
// Card "Segurança" (troca de senha) — Execução 071, TASK-071-FE-04. Contrato
// de tela §5, regra do LEGADO (D2): mínimo 6 caracteres, diferente da atual,
// confirmação — NUNCA a regra de 8 caracteres + complexidade da UX (C-U01).
//
// Sem hidratação (os 3 campos nascem vazios). Sucesso: toast ÚNICO (DEF-06
// não reproduzido) + os 3 campos voltam a vazio. A sessão atual continua
// ativa (contrato API §3.2) — sem logout.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, Flex, Heading } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Field } from '@/components/Form/Field';
import { PageCard } from '@/components/ui/PageCard';
import { PasswordInput } from '@/components/ui/password-input';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import { securitySchemaResolver } from '@/validations/schemas/MeuPerfil/security-schema';

import { changeOwnPassword } from '@/services/v2/Me/me-service';

interface SecurityForm {
  current_password: string;
  password: string;
  password_confirmation: string;
}

const EMPTY_SECURITY_FORM: SecurityForm = {
  current_password: '',
  password: '',
  password_confirmation: '',
};

interface SecurityCardProps {
  onDirtyChange: (dirty: boolean) => void;
}

export function SecurityCard({ onDirtyChange }: SecurityCardProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.common.myProfile.security;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<SecurityForm>({
    mode: 'onSubmit',
    resolver: securitySchemaResolver(languageGB),
    defaultValues: EMPTY_SECURITY_FORM,
  });

  const isDirty = Object.keys(dirtyFields).length > 0;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const passwordMutation = useRequest<null>({
    asyncFunction: tryChangePassword,
    entityName: text.title,
    queryKey: queryKey.me.profile,
    typesRequest: 'update',
    personalizedMessage: text.saveSuccessMessage,
    actionSuccess: () => {
      reset(EMPTY_SECURITY_FORM);
    },
  });

  async function tryChangePassword(data: SecurityForm) {
    try {
      return await changeOwnPassword(data);
    } catch (error) {
      // 422 por campo (ex.: "O campo da senha atual não corresponde à sua
      // senha", texto exato do legado, contrato API §3.1) — o `throw`
      // preserva o toast genérico do `useRequest` (também cobre o 429, cujo
      // `message` já vem pronto de `getBusinessMutationErrorMessage`).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          const message = messages?.[0];
          if (message) {
            setError(field as keyof SecurityForm, { type: 'server', message });
          }
        });
      }
      throw error;
    }
  }

  async function onSubmit(data: SecurityForm) {
    // `useRequest.onError` já mostra o toast (429/erro genérico) e o 422 já
    // populou os campos via `setError`, acima — o `.catch` aqui só evita que
    // a rejeição de `mutateAsync` suba como unhandled promise rejection.
    await passwordMutation.mutateAsync(data).catch(() => {});
  }

  const isSaving = passwordMutation.isPending;

  return (
    <PageCard>
      <Box
        as="form"
        // @ts-expect-error - `Box as="form"` (Chakra v3) não tipa os atributos
        // nativos do elemento alvo; `noValidate` é HTML válido (desliga a
        // validação nativa do browser, que bloquearia o submit ANTES do
        // resolver do RHF/yup rodar — mirror `Form/index.tsx`, `noValidate`).
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        p={5}
      >
        <Heading size="sm" mb={4} color="fg.default">
          {text.title}
        </Heading>

        <Flex direction="column" gap={4}>
          <Field
            label={text.currentPassword.label}
            isRequired
            invalid={!!errors.current_password}
            errorText={errors.current_password?.message}
          >
            <PasswordInput
              autoComplete="current-password"
              aria-label={text.currentPassword.label}
              disabled={isSubmitting}
              {...register('current_password')}
            />
          </Field>

          <Field
            label={text.newPassword.label}
            isRequired
            invalid={!!errors.password}
            errorText={errors.password?.message}
            helperText={!errors.password ? text.newPassword.hint : undefined}
          >
            <PasswordInput
              autoComplete="new-password"
              aria-label={text.newPassword.label}
              disabled={isSubmitting}
              {...register('password')}
            />
          </Field>

          <Field
            label={text.confirmPassword.label}
            isRequired
            invalid={!!errors.password_confirmation}
            errorText={errors.password_confirmation?.message}
          >
            <PasswordInput
              autoComplete="new-password"
              aria-label={text.confirmPassword.label}
              disabled={isSubmitting}
              {...register('password_confirmation')}
            />
          </Field>
        </Flex>

        <Flex justify="flex-end" mt={5} pt={4} borderTop="1px solid" borderColor="border1">
          <Button title={text.submitButton} type="submit" loading={isSaving} disabled={isSaving} />
        </Flex>
      </Box>
    </PageCard>
  );
}

export default SecurityCard;
