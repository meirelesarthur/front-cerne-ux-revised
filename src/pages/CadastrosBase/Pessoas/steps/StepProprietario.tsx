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

import { RepeaterList } from '@/components/ui/RepeaterList';
import { StepBody } from '@/components/ui/StepBody';
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
    <StepBody>
      <StepHeading title={text.roles.proprietary} subtitle={text.form.proprietary.subtitle} />

      <Box mb={4}>
        <SectionLabel>{text.form.proprietary.stateRegistrations}</SectionLabel>
        <RepeaterList
          count={registrationsArray.fields.length}
          rowKey={(i) => registrationsArray.fields[i].id}
          emptyText={text.form.proprietary.emptyStateRegistrations}
          addLabel={text.form.proprietary.addStateRegistration}
          removeLabel={text.form.basico.removeStateRegistration}
          disabled={disabled}
          onAdd={() => registrationsArray.append({ value: '' })}
          onRemove={(i) => registrationsArray.remove(i)}
          renderRow={(i) => (
            <MaskedInput
              kind="digits"
              label={`${text.form.proprietary.stateRegistrationShort} ${i + 1}`}
              disabled={disabled}
              {...register(`proprietary.state_registration_numbers.${i}.value` as const)}
            />
          )}
        />
      </Box>

      <Box>
        <SectionLabel>{text.form.proprietary.farms}</SectionLabel>
        <RepeaterList
          align="start"
          count={farmsArray.fields.length}
          rowKey={(i) => farmsArray.fields[i].id}
          emptyText={text.form.proprietary.emptyFarms}
          addLabel={text.form.proprietary.addFarm}
          removeLabel={text.form.basico.removeFarm}
          disabled={disabled}
          onAdd={() => farmsArray.append({ farm: null, percentage: '' })}
          onRemove={(i) => farmsArray.remove(i)}
          renderRow={(i) => (
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
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
          )}
        />
      </Box>
    </StepBody>
  );
}
