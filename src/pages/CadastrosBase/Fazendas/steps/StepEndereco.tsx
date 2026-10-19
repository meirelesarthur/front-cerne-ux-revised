// src/pages/CadastrosBase/Fazendas/steps/StepEndereco.tsx
// -----------------------------------------------------------------------------
// Etapa 3/6 do wizard de Fazenda — Endereço (TASK-FE-402): `country_uuid`,
// `zip_code`, `city_uuid`, `district`, `number`, `latitude`/`longitude`
// (`Input` de texto simples — continuam 100% EDITÁVEIS manualmente mesmo
// após a etapa Demarcação, `TASK-FE-411`/`TASK-FE-414`, GAP-FE-121 reaberto,
// derivar um default a partir do centróide do polígono: o mapa deriva um
// valor conveniente, o usuário pode sobrescrever, mesmo racional do
// `cerne`/legado — RHF é a fonte única, `register` já reflete o `setValue`
// de outro step ao navegar de volta).
//
// ✅ GAP-FE-120/GAP-FE-124 FECHADOS (companheira desta execução, backend
// commitado em `TASK-BE-421`/`TASK-BE-423`/`TASK-BE-424`) — `FarmRequest`
// agora aceita `city_uuid`/`country_uuid` (string, uuid), resolvidos para os
// `id`s internos na Action (mirror `TASK-BE-334`/People). Cidade consome o
// mesmo catálogo `/cities/options` (`listCityOptions`, já usado por Pessoas);
// País consome o catálogo novo `/countries/options` (`listCountryOptions`,
// `TASK-BE-423`). Ambos `SelectAsyncPaginate` reais, com prefill em edição
// (`CreateOrUpdateFarm.tsx::fillForm`, a partir de `data.town`/`data.country`).
// -----------------------------------------------------------------------------

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listCityOptions } from '@/services/v2/Cities/city-service';
import { listCountryOptions } from '@/services/v2/Countries/country-service';

import type { CityListItem } from '@/@types/v2/Cities';
import type { CountryOptionItem } from '@/@types/v2/Countries';

import { StepHeading, type StepProps } from './parts';

export function StepEndereco({ control, register, errors, disabled, loading }: StepProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.farms.farm.form;

  return (
    <Box>
      <StepHeading title={text.steps.endereco} subtitle={text.stepsSubtitle.endereco} />

      <SimpleGrid columns={columnsForm.twoColumns} gap={4} mb={2}>
        <Controller
          name="country_uuid"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectAsyncPaginate
              label={text.fields.countryId}
              name="country_uuid"
              value={value}
              onChange={onChange}
              service={listCountryOptions}
              findParams={(search) => ({ search })}
              mapOptions={(item: CountryOptionItem) => ({
                label: item.nome,
                value: item.uuid,
              })}
              error={errors.country_uuid?.message as string | undefined}
              isRequired
              isDisabled={disabled}
            />
          )}
        />
        {/* ERRO-FE-013/ERRO-FE-021 (mirror) — `Controller` (CONTROLADO), não
            `{...register('zip_code')}`: `register()` nunca repassa `value`
            a `MaskedInput` uncontrolled (só onChange/onBlur/ref) — ao
            remontar o step (navegar e voltar), o CEP já digitado some do
            input embora o RHF ainda o tenha em memória. Mesmo padrão já em
            produção em `StepDadosBasicos.tsx::nif` (Pessoas) e
            `CreateOrUpdateEmissor.tsx::cpf_cnpj` — `MaskedInput` (saída
            STRING) já aceita `value` controlado sem nenhuma alteração no
            componente compartilhado (não regride Telefone/outros usos). */}
        <Controller
          name="zip_code"
          control={control}
          render={({ field, fieldState }) => (
            <MaskedInput
              kind="cep"
              label={text.fields.zipCode}
              name={field.name}
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              isRequired
              disabled={disabled}
            />
          )}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.twoColumns} gap={4} mb={2}>
        <Controller
          name="city_uuid"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectAsyncPaginate
              label={text.fields.city}
              name="city_uuid"
              value={value}
              onChange={onChange}
              service={listCityOptions}
              findParams={(search) => ({ search })}
              mapOptions={(item: CityListItem) => ({
                label: `${item.title} — ${item.state?.letter ?? ''}`,
                value: item.uuid,
              })}
              error={errors.city_uuid?.message as string | undefined}
              isRequired
              isDisabled={disabled}
            />
          )}
        />
        <Input
          label={text.fields.district}
          maxLength={50}
          {...register('district')}
          error={errors.district?.message}
          isRequired
          loading={loading}
          disabled={disabled}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.twoColumns} gap={4} mb={6}>
        <Input
          label={text.fields.number}
          maxLength={6}
          {...register('number')}
          error={errors.number?.message}
          loading={loading}
          disabled={disabled}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.twoColumns} gap={4}>
        <Input
          label={text.fields.latitude}
          placeholder={text.placeholders.latitude}
          {...register('latitude')}
          error={errors.latitude?.message}
          loading={loading}
          disabled={disabled}
        />
        <Input
          label={text.fields.longitude}
          placeholder={text.placeholders.longitude}
          {...register('longitude')}
          error={errors.longitude?.message}
          loading={loading}
          disabled={disabled}
        />
      </SimpleGrid>
    </Box>
  );
}
