// src/pages/CadastrosBase/Pessoas/steps/StepDadosBasicos.tsx
// -----------------------------------------------------------------------------
// Etapa fixa "Dados Básicos" do wizard de Pessoa (TASK-FE-302) — nif
// (`MaskedInput kind="cpfCnpj"` — dinâmica por quantidade de dígitos), name/nickname
// (labels condicionais PF/PJ), email (obrigatório condicional), phone, e os
// 5 `Switch` de papel (cada um adiciona uma etapa ao stepper).
//
// Busca por NIF (`onBlur`, só em CRIAÇÃO) — `usePersonByNif`/`getPersonByNif`
// (TASK-FE-300): autopreenche nome/apelido/e-mail/telefone/endereço quando o
// NIF já existe no sistema (RN-02, upsert) e avisa o usuário. `city` TAMBÉM é
// autopreenchido — `PersonListItem.city` já expõe `{uuid, name, state}`
// (TASK-FE-327/TASK-BE-334, `PersonResource` + `findByNif` com
// `with('city.state')`), então dá para pré-selecionar o `SelectAsyncPaginate`
// de Cidade com rótulo completo `Nome — UF`, mesmo padrão do prefill de edição
// em `CreateOrUpdatePessoa.tsx::fillForm` (GAP-FE-120 fechado).
// -----------------------------------------------------------------------------

import { Box, GridItem, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useWatch, type UseFormSetValue, type UseFormWatch } from 'react-hook-form';

import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import type { IconName } from '@/components/ui/Icon';
import { ToggleCard } from '@/components/ui/ToggleCard';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { getPersonByNif } from '@/services/v2/People/person-service';

import { StepHeading, type StepProps } from './parts';

import { docTypeOfNif, isValidNif } from '../nif';
import { ROLE_ORDER, type PessoaFormValues } from '../pessoa.types';

// Ícone de cada papel — registry do DS (`design/icons.ts`).
const ROLE_ICON: Record<(typeof ROLE_ORDER)[number], IconName> = {
  proprietary: 'crown',
  employee: 'briefcase',
  provider: 'truck',
  client: 'cart',
  user: 'key',
};

interface Props extends StepProps {
  watch: UseFormWatch<PessoaFormValues>;
  setValue: UseFormSetValue<PessoaFormValues>;
  isEditing: boolean;
}

export function StepDadosBasicos({
  control,
  register,
  errors,
  disabled,
  watch,
  setValue,
  isEditing,
}: Props) {
  const { languageGB } = useLanguage();
  const text = languageGB.people.person;
  const roles = text.roles;
  const hints = text.roleHints;

  const nif = useWatch({ control, name: 'nif' });
  const docType = docTypeOfNif(nif ?? '');
  const isPJ = docType === 'cnpj';

  async function handleNifBlur() {
    if (isEditing) return;
    const current = watch('nif');
    if (!isValidNif(current)) return;

    const found = await getPersonByNif(current).catch(() => null);
    if (found) {
      setValue('name', found.name, { shouldDirty: true });
      setValue('nickname', found.nickname, { shouldDirty: true });
      setValue('email', found.email ?? '', { shouldDirty: true });
      setValue('phone', found.phone ?? '', { shouldDirty: true });
      setValue('address', found.address ?? '', { shouldDirty: true });
      setValue('number', found.number ?? '', { shouldDirty: true });
      setValue('district', found.district ?? '', { shouldDirty: true });
      setValue('zip_code', found.zip_code ?? '', { shouldDirty: true });
      // `city` é `Option<string> | null` (o `value` guarda o uuid, enviado
      // como `city_uuid` em `buildPayload()`); conversão idêntica à de
      // `CreateOrUpdatePessoa.tsx::fillForm` — rótulo `Nome — UF`, `null`
      // quando o backend omite a relação (`PersonResource::when()`).
      setValue(
        'city',
        found.city
          ? {
              value: found.city.uuid,
              label: [found.city.name, found.city.state?.uf].filter(Boolean).join(' — '),
            }
          : null,
        { shouldDirty: true }
      );
      toaster.create({
        type: 'warning',
        title: text.singularLabel,
        description: text.form.basico.nifFoundWarning,
      });
    }
  }

  return (
    <Box>
      <StepHeading title={text.steps.basico} subtitle={text.form.basico.subtitle} />

      {/* Layout do DS: grade de 4 colunas — CPF/CNPJ · Telefone · E-mail (2) / Nome (2) · Apelido (2) */}
      <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} mb={6}>
        {/* `MaskedInput kind="cpfCnpj"` resolve CPF↔CNPJ pela quantidade de dígitos; `Controller`
            (CONTROLADO) preservado — em edição, `reset(filled)` precisa refletir `value` no campo. */}
        <Controller
          name="nif"
          control={control}
          render={({ field, fieldState }) => (
            <MaskedInput
              kind="cpfCnpj"
              label={text.form.basico.nif}
              name={field.name}
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={() => {
                field.onBlur();
                handleNifBlur();
              }}
              error={fieldState.error?.message}
              isRequired
              disabled={disabled}
            />
          )}
        />
        <MaskedInput
          kind="phone"
          label={text.form.basico.phone}
          {...register('phone')}
          error={errors.phone?.message}
          disabled={disabled}
        />
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <Input
            label={text.form.basico.email}
            type="email"
            {...register('email')}
            error={errors.email?.message}
            isRequired={
              !!watch('user.enabled') || !!watch('client.enabled') || !!watch('proprietary.enabled')
            }
            disabled={disabled}
          />
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <Input
            label={isPJ ? text.form.basico.namePj : text.form.basico.nameFisica}
            maxLength={120}
            {...register('name')}
            error={errors.name?.message}
            isRequired
            disabled={disabled}
          />
        </GridItem>
        <GridItem colSpan={{ base: 1, md: 2 }}>
          <Input
            label={isPJ ? text.form.basico.nicknamePj : text.form.basico.nicknameFisica}
            maxLength={60}
            {...register('nickname')}
            error={errors.nickname?.message}
            isRequired
            disabled={disabled}
          />
        </GridItem>
      </SimpleGrid>

      {/* Papéis: cartões de seleção (DS `ToggleSection variant="card"`), até 4 por linha */}
      <Text fontSize="sm" fontWeight="medium" color="strongText">
        {text.form.basico.rolesLabel}
      </Text>
      <Text fontSize="sm" color="fg.muted" mt="4px" mb={3}>
        {text.form.basico.rolesHint}
      </Text>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap={3}>
        {ROLE_ORDER.map((role) => (
          <Controller
            key={role}
            name={`${role}.enabled` as const}
            control={control}
            render={({ field: { value, onChange } }) => (
              <ToggleCard
                title={roles[role]}
                description={hints[role]}
                icon={ROLE_ICON[role]}
                active={!!value}
                onToggle={onChange}
                disabled={disabled}
                activeHint={text.form.basico.roleAdded.replace('{role}', roles[role])}
              />
            )}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
}
