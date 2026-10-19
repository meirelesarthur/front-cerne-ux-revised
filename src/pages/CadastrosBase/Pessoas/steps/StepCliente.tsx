// src/pages/CadastrosBase/Pessoas/steps/StepCliente.tsx
// -----------------------------------------------------------------------------
// Etapa de papel "Cliente" do wizard de Pessoa (TASK-FE-304) — dados fiscais,
// contato comercial e inscrições estaduais do comprador.
//
// TASK-FE-334 (Achado B) — `client.state_registrations` virou REPEATER (N
// inscrições estaduais, fidelidade real ao legado confirmada; a decisão
// anterior de "string única" documentada aqui era incorreta e foi revertida
// em paralelo pelo backend, TASK-BE-359). Espelha o PRECEDENTE CANÔNICO já em
// produção no próprio projeto — `StepProprietario.tsx`
// (`state_registration_numbers`, `useFieldArray`, `{ value: string }[]`) —
// sem componente novo, sem limite/dedup artificiais (o legado não tinha).
// -----------------------------------------------------------------------------
// CORREÇÃO CRÍTICA DE HOMOLOGAÇÃO (97-Esteiras/030, espelho literal de
// `Clientes/CreateOrUpdateCliente.tsx`, nota "CORREÇÃO CRÍTICA DE
// HOMOLOGAÇÃO 2026-07-30") — `client.code_country` é **`integer`** físico no
// Postgres, guarda o `codigo` numérico de `countries` (ex.: `1058` = Brasil,
// `ClientRequest.php` valida `regex:/^\d+$/` + `Rule::exists('countries',
// 'codigo')`). O `CountryCombobox` (seletor ISO 3166-1 alpha-2, `value:
// "BR"`) usado antes aqui SEMPRE enviava a sigla, nunca o código — 422 em
// `client.code_country`. Trocado por `SelectAsyncPaginate` sobre
// `GET /countries/options` (mesmo catálogo/serviço `listCountryOptions` já
// usado por `Fazendas/steps/StepEndereco.tsx` e pelo CRUD standalone de
// Cliente), `value = String(codigo)` (dígitos), `label = nome`. O campo do
// form continua `string` (`ClientFormValues.code_country`, sem mudança de
// tipo) — só o CONTEÚDO da string mudou de sigla para dígitos.
//
// Rótulo do valor já selecionado usa o mesmo fallback HONESTO do CRUD
// standalone (`buildClientFormDefaultValues`): sem um lookup dedicado de
// país por `codigo` nesta tela, o rótulo exibido até o usuário reabrir o
// seletor é o próprio código numérico.
//
// `id_abroad` deixou de ser condicional a `code_country !== 'BR'` — a
// comparação com a sigla nunca mais bateria com um código numérico, e o CRUD
// standalone já decidiu (mesma nota de cabeçalho) que o campo é SEMPRE
// visível (evidência de legado, `_forms.blade.php:60`, sem `@if` nenhum).
// -----------------------------------------------------------------------------

import { type ElementType } from 'react';

import { Box, Flex, Icon, IconButton, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Switch } from '@/components/ui/switch';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listCountryOptions } from '@/services/v2/Countries/country-service';

import type { CountryOptionItem } from '@/@types/v2/Countries';

import { SectionLabel, StepHeading, type StepProps } from './parts';

export function StepCliente({ control, register, errors, disabled }: StepProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.people.person;
  const c = text.form.client;

  const registrationsArray = useFieldArray({ control, name: 'client.state_registrations' });

  return (
    <Box>
      <StepHeading title={text.roles.client} subtitle={c.subtitle} />

      <SimpleGrid columns={columnsForm.threeColumns} gap={6} mb={6}>
        <MaskedInput
          kind="phone"
          label={c.cellphone}
          {...register('client.cellphone')}
          disabled={disabled}
        />
        <Input label={c.contact} {...register('client.contact')} disabled={disabled} />
        <MaskedInput
          kind="phone"
          label={c.contactPhone}
          {...register('client.contact_phone')}
          disabled={disabled}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.twoColumns} gap={6} mb={6}>
        <MaskedInput
          kind="digits"
          label={c.cityRegistration}
          {...register('client.city_registration')}
          disabled={disabled}
        />
        <Input label={c.farmName} {...register('client.farm_name')} disabled={disabled} />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.twoColumns} gap={6} mb={6}>
        <Controller
          name="client.final_costumer"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Box
              display="flex"
              alignItems="center"
              gap={3}
              px={4}
              py={3}
              borderRadius="md"
              border="1px solid"
              borderColor="border.subtle"
              bg="bg.subtle"
            >
              <Switch
                checked={!!value}
                onCheckedChange={(d: { checked: boolean }) => onChange(d.checked)}
                disabled={disabled}
              >
                {c.finalCustomer}
              </Switch>
            </Box>
          )}
        />
        <Controller
          name="client.taxpayer"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Box
              display="flex"
              alignItems="center"
              gap={3}
              px={4}
              py={3}
              borderRadius="md"
              border="1px solid"
              borderColor="border.subtle"
              bg="bg.subtle"
            >
              <Switch
                checked={!!value}
                onCheckedChange={(d: { checked: boolean }) => onChange(d.checked)}
                disabled={disabled}
              >
                {c.taxpayer}
              </Switch>
            </Box>
          )}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.twoColumns} gap={6} mb={6}>
        <Controller
          name="client.code_country"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectAsyncPaginate
              name="client.code_country"
              label={c.country}
              service={listCountryOptions}
              mapOptions={(item: CountryOptionItem) => ({
                label: item.nome,
                value: String(item.codigo),
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              // Armadilha #9 — `?? null`, NUNCA `?? undefined`. Fallback
              // HONESTO de rótulo (mirror `buildClientFormDefaultValues`):
              // sem o objeto País aninhado nesta tela, o rótulo é o próprio
              // código até o usuário reabrir o seletor.
              value={value ? { value, label: value } : null}
              // `any` — mesmo padrão de `CreateOrUpdateCliente.tsx`
              // (`onChange={(option: any) => field.onChange(...)}`); a prop
              // real de `AsyncPaginate` tipa `newValue` como `unknown`.
              onChange={(option: any) => onChange(option?.value ?? '')}
              isDisabled={disabled}
              error={errors.client?.code_country?.message}
              isRequired
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />
        <Input label={c.idAbroad} {...register('client.id_abroad')} disabled={disabled} />
      </SimpleGrid>

      <Box>
        <SectionLabel>{c.stateRegistrations}</SectionLabel>
        {registrationsArray.fields.length === 0 && (
          <Text fontSize="sm" color="fg.muted" mb={2}>
            {c.emptyStateRegistrations}
          </Text>
        )}
        <Flex direction="column" gap={3}>
          {registrationsArray.fields.map((field, i) => (
            <Flex key={field.id} gap={2} align="flex-end">
              <Box flex={1}>
                <MaskedInput
                  kind="digitsOrIsento"
                  label={`${c.stateRegistrationShort} ${i + 1}`}
                  disabled={disabled}
                  {...register(`client.state_registrations.${i}.value` as const)}
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
          title={c.addStateRegistration}
          icon={FiPlus as ElementType}
          variant="outline"
          mt={3}
          disabled={disabled}
          onClick={() => registrationsArray.append({ value: '' })}
        />
      </Box>
    </Box>
  );
}
