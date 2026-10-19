// src/pages/CadastrosBase/Pessoas/steps/StepProprietario.tsx
// -----------------------------------------------------------------------------
// Etapa de papel "Proprietário" do wizard de Pessoa (TASK-FE-303) —
// repeaters `farms` (`{ farm_uuid, percentage }`, seletor real de Fazenda) e
// `state_registration_numbers` (repeater de texto livre). Sem bloqueio de
// dados (`ProprietaryResource` já completo).
//
// Seletor de Fazenda: `services/v2/Farms/farm-service.ts` só expõe
// `listFarms()` (`GET /farms/current-tenant`, SEM paginação/busca real —
// achado já documentado no próprio arquivo do service, não uma limitação
// nova desta Tarefa). Por isso o seletor de fazenda usa `Select` estático
// (opções carregadas 1x via `useQuery`), não `SelectAsyncPaginate` (que
// exige um `service` paginado) — mesmo padrão real já usado para o picker
// "Fazendas Vinculadas" de Emissores NFe.
//
// Sem `EditableListComponent` genérico reaproveitável (`Form/
// EditableListComponent.tsx` está vazio; o `components/EditableListComponent.tsx`
// raiz é outro padrão, de item único com persistência assíncrona própria) —
// repeaters implementados diretamente com `useFieldArray` (RHF), conforme
// orientação explícita da Tarefa.
// -----------------------------------------------------------------------------

import { type ElementType } from 'react';

import { Box, Flex, Icon, IconButton, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { Select } from '@/components/Form/Select';

import { useLanguage } from '@/hooks/useLanguage';

import { listFarms } from '@/services/v2/Farms/farm-service';

import type { Option } from '@/@types/option';

import { SectionLabel, StepHeading, type StepProps } from './parts';

export function StepProprietario({ control, register, errors, disabled }: StepProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.people.person;

  const { data: farms } = useQuery({ queryKey: ['people-farms-options'], queryFn: listFarms });
  const farmOptions: Option<string>[] = (farms ?? []).map((f) => ({
    value: f.uuid,
    label: f.description,
  }));

  const farmsArray = useFieldArray({ control, name: 'proprietary.farms' });
  const registrationsArray = useFieldArray({
    control,
    name: 'proprietary.state_registration_numbers',
  });

  return (
    <Box>
      <StepHeading title={text.roles.proprietary} subtitle={text.form.proprietary.subtitle} />

      <Box mb={8}>
        <SectionLabel>{text.form.proprietary.stateRegistrations}</SectionLabel>
        {registrationsArray.fields.length === 0 && (
          <Text fontSize="sm" color="fg.muted" mb={2}>
            {text.form.proprietary.emptyStateRegistrations}
          </Text>
        )}
        <Flex direction="column" gap={3}>
          {registrationsArray.fields.map((field, i) => (
            <Flex key={field.id} gap={2} align="flex-end">
              <Box flex={1}>
                <MaskedInput
                  kind="digits"
                  label={`${text.form.proprietary.stateRegistrationShort} ${i + 1}`}
                  disabled={disabled}
                  {...register(`proprietary.state_registration_numbers.${i}.value` as const)}
                />
              </Box>
              <IconButton
                aria-label="Remover inscrição"
                variant="ghost_danger"
                disabled={disabled}
                onClick={() => registrationsArray.remove(i)}
              >
                <Icon as={FiTrash2} />
              </IconButton>
            </Flex>
          ))}
        </Flex>
        <Button
          title={text.form.proprietary.addStateRegistration}
          icon={FiPlus as ElementType}
          variant="outline"
          mt={3}
          disabled={disabled}
          onClick={() => registrationsArray.append({ value: '' })}
        />
      </Box>

      <Box>
        <SectionLabel>{text.form.proprietary.farms}</SectionLabel>
        {farmsArray.fields.length === 0 && (
          <Text fontSize="sm" color="fg.muted" mb={2}>
            {text.form.proprietary.emptyFarms}
          </Text>
        )}
        <Flex direction="column" gap={4}>
          {farmsArray.fields.map((field, i) => (
            <Box
              key={field.id}
              border="1px solid"
              borderColor="border.subtle"
              borderRadius="md"
              p={4}
            >
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={2}>
                <Controller
                  name={`proprietary.farms.${i}.farm`}
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      label={text.form.proprietary.farm}
                      name={`proprietary-farm-${i}`}
                      value={value}
                      onChange={onChange}
                      options={farmOptions}
                      isDisabled={disabled}
                      error={(errors.proprietary?.farms?.[i] as any)?.farm?.message}
                    />
                  )}
                />
                <Input
                  label={text.form.proprietary.percentage}
                  inputMode="decimal"
                  {...register(`proprietary.farms.${i}.percentage` as const)}
                  disabled={disabled}
                  error={(errors.proprietary?.farms?.[i] as any)?.percentage?.message}
                />
              </SimpleGrid>
              <Flex justify="flex-end">
                <IconButton
                  aria-label="Remover fazenda"
                  variant="ghost_danger"
                  size="sm"
                  disabled={disabled}
                  onClick={() => farmsArray.remove(i)}
                >
                  <Icon as={FiTrash2} />
                </IconButton>
              </Flex>
            </Box>
          ))}
        </Flex>
        <Button
          title={text.form.proprietary.addFarm}
          icon={FiPlus as ElementType}
          variant="outline"
          mt={3}
          disabled={disabled}
          onClick={() => farmsArray.append({ farm: null, percentage: '' })}
        />
      </Box>
    </Box>
  );
}
