// src/pages/CadastrosBase/Pessoas/steps/StepFornecedor.tsx
// -----------------------------------------------------------------------------
// Etapa de papel "Fornecedor" do wizard de Pessoa (TASK-FE-304) — tipo de
// fornecimento, dados bancários, filiais e vendedores.
//
// 3 divergências protótipo × contrato real (sigo o contrato):
//   1. `type` SEM enumeração fechada no backend (contrato §5/PERGUNTA-02) —
//      valor `2` é RESERVADO ao mirror automático de Employee (RN-07,
//      `CreateMirrorProviderForEmployeeAction`), NUNCA selecionável aqui.
//      Opções do protótipo (`TIPO_FORNECEDOR`) usadas, REMOVENDO o valor `2`.
//   2. `commission`/`hour_value` são SEMPRE opcionais no backend
//      (`nullable numeric`, sem `required_if` por `type`) — NÃO replicadas
//      como obrigatórias condicionais (o protótipo inventa essa regra).
//   3. Filiais/vendedores recriados do zero a cada save (RN-08) — comportamento
//      esperado, sem diffing.
//
// GAP-FE-120 FECHADO do lado front (TASK-FE-327) — `provider.branches.*.city`
// consome `listCityOptions` (`/cities/options`, sem gate) e envia
// `city_uuid` (não mais `city_id` cast de uuid→number) — mesma correção do
// campo raiz em `StepEndereco.tsx`. Prefill em edição usa fallback rótulo=uuid
// (`BranchResource` só expõe `city_uuid` cru, sem nome/UF denormalizados).
//
// TASK-FE-332 (GAP-FE-120 addendum FECHADO, execução 023) — `provider.bank`
// consome `listBankOptions` (`/banks/options`, sem gate de `banks_view`,
// TASK-BE-356) em vez de `listBanks` (gated); `mapOptions` usa
// `${code}-${name}` (mesmo template de `BankResource.info` no backend).
// Prefill em edição agora usa `ProviderResource.bank{uuid,code,name}`
// (TASK-BE-357) — rótulo REAL, não mais uuid cru (ver `CreateOrUpdatePessoa.tsx::fillForm`).
// -----------------------------------------------------------------------------

import { type ElementType } from 'react';

import { Box, Flex, Icon, IconButton, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listBankOptions } from '@/services/v2/Banks/bank-service';
import { listCityOptions } from '@/services/v2/Cities/city-service';

import type { Option } from '@/@types/option';
import type { BankOptionItem } from '@/@types/v2/Banks';
import type { CityListItem } from '@/@types/v2/Cities';

import { SectionLabel, StepHeading, type StepProps } from './parts';

import { RepeaterList } from '@/components/ui/RepeaterList';
import { StepBody } from '@/components/ui/StepBody';
const ACCOUNT_TYPE_OPTIONS: Option<string>[] = [
  { value: 'C', label: 'Conta Corrente' },
  { value: 'P', label: 'Conta Poupança' },
];

export function StepFornecedor({ control, register, errors, disabled }: StepProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.people.person;
  const p = text.form.provider;

  const typeOptions: Option<number>[] = [
    { value: 1, label: p.typeOptions.resale },
    // value 2 (Indústria) RESERVADO ao mirror automático de Employee (RN-07)
    // — nunca selecionável manualmente aqui.
    { value: 3, label: p.typeOptions.service },
    { value: 4, label: p.typeOptions.carrier },
    { value: 5, label: p.typeOptions.commissioned },
  ];

  const pixTypeOptions: Option<number>[] = [
    { value: 0, label: text.form.pixTypeOptions.cpfCnpj },
    { value: 1, label: text.form.pixTypeOptions.email },
    { value: 2, label: text.form.pixTypeOptions.phone },
    { value: 3, label: text.form.pixTypeOptions.random },
  ];

  const branchesArray = useFieldArray({ control, name: 'provider.branches' });
  const sellersArray = useFieldArray({ control, name: 'provider.sellers' });

  return (
    <StepBody>
      <StepHeading title={text.roles.provider} subtitle={p.subtitle} />

      <SimpleGrid columns={columnsForm.threeColumns} gap={4} mb={4}>
        <Controller
          name="provider.type"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Select
              label={p.type}
              name="provider.type"
              value={typeOptions.find((o) => o.value === value?.value) ?? null}
              onChange={onChange}
              options={typeOptions}
              isDisabled={disabled}
              error={(errors.provider?.type as any)?.message as string | undefined}
              isRequired
            />
          )}
        />
        <Controller
          name="provider.commission"
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <PercentInput
              name={name}
              label={p.commission}
              value={value}
              onValueChange={onChange}
              maxValue={100}
              disabled={disabled}
            />
          )}
        />
        <Controller
          name="provider.hour_value"
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <MoneyInput
              name={name}
              label={p.hourValue}
              value={value}
              onValueChange={onChange}
              disabled={disabled}
            />
          )}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.twoColumns} gap={4} mb={4}>
        <MaskedInput
          kind="digits"
          label={p.stateRegistration}
          {...register('provider.state_registration')}
          disabled={disabled}
        />
        <MaskedInput
          kind="digits"
          label={p.cityRegistration}
          {...register('provider.city_registration')}
          disabled={disabled}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.twoColumns} gap={4} mb={4}>
        <Input label={p.contact} {...register('provider.contact')} disabled={disabled} />
        <MaskedInput
          kind="phone"
          label={p.contactPhone}
          {...register('provider.contact_phone')}
          disabled={disabled}
        />
      </SimpleGrid>

      <Box fontSize="sm" fontWeight="bold" color="fg.muted" mb={3} textTransform="uppercase">
        {text.form.employee.bank.title}
      </Box>
      <SimpleGrid columns={columnsForm.twoColumns} gap={4} mb={4}>
        <Controller
          name="provider.bank"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectAsyncPaginate
              label={text.form.employee.bank.bankId}
              name="provider.bank"
              value={value}
              onChange={onChange}
              service={listBankOptions}
              findParams={(search) => ({ search })}
              mapOptions={(item: BankOptionItem) => ({
                label: `${item.code}-${item.name}`,
                value: item.uuid,
              })}
              isDisabled={disabled}
            />
          )}
        />
        <Controller
          name="provider.account_type"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Select
              label={text.form.employee.bank.accountType}
              name="provider.account_type"
              value={ACCOUNT_TYPE_OPTIONS.find((o) => o.value === value) ?? null}
              onChange={(opt: Option<string> | null) => onChange(opt?.value ?? '')}
              options={ACCOUNT_TYPE_OPTIONS}
              isDisabled={disabled}
            />
          )}
        />
      </SimpleGrid>
      <SimpleGrid columns={columnsForm.twoColumns} gap={4} mb={4}>
        <Input
          label={text.form.employee.bank.agency}
          {...register('provider.agency')}
          disabled={disabled}
        />
        <Input
          label={text.form.employee.bank.account}
          {...register('provider.account')}
          disabled={disabled}
        />
      </SimpleGrid>
      <SimpleGrid columns={columnsForm.twoColumns} gap={4} mb={4}>
        <Controller
          name="provider.pix_type"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Select
              label={text.form.employee.bank.pixType}
              name="provider.pix_type"
              value={pixTypeOptions.find((o) => o.value === value?.value) ?? null}
              onChange={onChange}
              options={pixTypeOptions}
              isDisabled={disabled}
            />
          )}
        />
        <Input
          label={text.form.employee.bank.pix}
          {...register('provider.pix')}
          disabled={disabled}
          spellCheck={false}
        />
      </SimpleGrid>

      {/* Filiais */}
      <Box mb={4}>
        <SectionLabel>{p.branches}</SectionLabel>
        <RepeaterList
          align="start"
          count={branchesArray.fields.length}
          rowKey={(i) => branchesArray.fields[i].id}
          emptyText={p.emptyBranches}
          addLabel={p.addBranch}
          removeLabel="Remover filial"
          disabled={disabled}
          onAdd={() =>
            branchesArray.append({
              nif: '',
              name: '',
              state_registration: '',
              zip_code: '',
              city: null,
              address: '',
            })
          }
          onRemove={(i) => branchesArray.remove(i)}
          renderRow={(i) => (
            <Box borderWidth="1px" borderColor="semanticNeutral.200" borderRadius="8px" p={4}>
              <SimpleGrid columns={columnsForm.twoColumns} gap={4} mb={3}>
                  <Controller
                    name={`provider.branches.${i}.nif` as const}
                    control={control}
                    render={({ field }) => (
                      <MaskedInput
                        kind="cnpj"
                        label={p.branchNif}
                        name={field.name}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={(errors.provider?.branches?.[i] as any)?.nif?.message}
                        disabled={disabled}
                      />
                    )}
                  />
                  <Input
                    label={p.branchName}
                    {...register(`provider.branches.${i}.name` as const)}
                    disabled={disabled}
                  />
                </SimpleGrid>
                <SimpleGrid columns={columnsForm.twoColumns} gap={4} mb={3}>
                  <MaskedInput
                    kind="cep"
                    label={p.branchZipCode}
                    {...register(`provider.branches.${i}.zip_code` as const)}
                    disabled={disabled}
                  />
                  <Controller
                    name={`provider.branches.${i}.city`}
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <SelectAsyncPaginate
                        label={p.branchCity}
                        name={`provider-branch-city-${i}`}
                        value={value}
                        onChange={onChange}
                        service={listCityOptions}
                        findParams={(search) => ({ search })}
                        mapOptions={(item: CityListItem) => ({
                          label: `${item.title} — ${item.state?.letter ?? ''}`,
                          value: item.uuid,
                        })}
                        isRequired
                        isDisabled={disabled}
                        error={(errors.provider?.branches?.[i] as any)?.city?.message}
                      />
                    )}
                  />
                </SimpleGrid>
                <SimpleGrid columns={columnsForm.oneColumns} gap={4} mb={0}>
                  <Input
                    label={p.branchAddress}
                    {...register(`provider.branches.${i}.address` as const)}
                    error={(errors.provider?.branches?.[i] as any)?.address?.message}
                    disabled={disabled}
                  />
                </SimpleGrid>
            </Box>
          )}
        />
      </Box>

      {/* Vendedores */}
      <Box>
        <SectionLabel>{p.sellers}</SectionLabel>
        <RepeaterList
          align="start"
          count={sellersArray.fields.length}
          rowKey={(i) => sellersArray.fields[i].id}
          emptyText={p.emptySellers}
          addLabel={p.addSeller}
          removeLabel="Remover vendedor"
          disabled={disabled}
          onAdd={() => sellersArray.append({ name: '', email: '', phone: '' })}
          onRemove={(i) => sellersArray.remove(i)}
          renderRow={(i) => (
            <SimpleGrid columns={columnsForm.threeColumns} gap={3}>
              <Input
                label={p.sellerName}
                {...register(`provider.sellers.${i}.name` as const)}
                error={(errors.provider?.sellers?.[i] as any)?.name?.message}
                disabled={disabled}
              />
              <Input
                label={p.sellerEmail}
                type="email"
                spellCheck={false}
                {...register(`provider.sellers.${i}.email` as const)}
                disabled={disabled}
              />
              <MaskedInput
                kind="phone"
                label={p.sellerPhone}
                {...register(`provider.sellers.${i}.phone` as const)}
                disabled={disabled}
              />
            </SimpleGrid>
          )}
        />
      </Box>
    </StepBody>
  );
}
