// src/pages/CadastrosBase/Pessoas/steps/StepEndereco.tsx
// -----------------------------------------------------------------------------
// Etapa fixa "Endereço" do wizard de Pessoa (TASK-FE-302) — zip_code
// (`MaskedInput kind="cep"`), city (SelectAsyncPaginate real sobre `/cities/options`,
// TASK-FE-327), address, number (max 10), district (max 60) — todos
// `required` exceto `zip_code`.
//
// GAP-FE-120 FECHADO do lado front (TASK-FE-327/TASK-BE-334/TASK-BE-353): o
// Select consome `listCityOptions` (`/cities/options`, sem gate de
// `cities_view` — mirror de `listGrouperOptions`) e o valor selecionado
// (`uuid`) é enviado como `city_uuid` (não mais um cast forçado para
// `city_id` inteiro) — ver `buildPayload()` em `CreateOrUpdatePessoa.tsx`.
// -----------------------------------------------------------------------------

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listCityOptions } from '@/services/v2/Cities/city-service';

import type { CityListItem } from '@/@types/v2/Cities';

import { StepHeading, type StepProps } from './parts';

import { StepBody } from '@/components/ui/StepBody';
export function StepEndereco({ control, register, errors, disabled }: StepProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.people.person;

  return (
    <StepBody>
      <StepHeading title={text.steps.endereco} subtitle={text.form.endereco.subtitle} />

      <SimpleGrid columns={columnsForm.twoColumns} gap={4} mb={4}>
        <MaskedInput
          kind="cep"
          label={text.form.endereco.zipCode}
          {...register('zip_code')}
          error={errors.zip_code?.message}
          disabled={disabled}
        />
        <Controller
          name="city"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectAsyncPaginate
              label={text.form.endereco.city}
              name="city"
              value={value}
              onChange={onChange}
              service={listCityOptions}
              findParams={(search) => ({ search })}
              mapOptions={(item: CityListItem) => ({
                label: `${item.title} — ${item.state?.letter ?? ''}`,
                value: item.uuid,
              })}
              error={errors.city?.message as string | undefined}
              isRequired
              isDisabled={disabled}
            />
          )}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.oneColumns} gap={4} mb={4}>
        <Input
          label={text.form.endereco.address}
          {...register('address')}
          error={errors.address?.message}
          isRequired
          disabled={disabled}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.twoColumns} gap={4}>
        <Input
          label={text.form.endereco.number}
          maxLength={10}
          {...register('number')}
          error={errors.number?.message}
          isRequired
          disabled={disabled}
        />
        <Input
          label={text.form.endereco.district}
          maxLength={60}
          {...register('district')}
          error={errors.district?.message}
          isRequired
          disabled={disabled}
        />
      </SimpleGrid>
    </StepBody>
  );
}
