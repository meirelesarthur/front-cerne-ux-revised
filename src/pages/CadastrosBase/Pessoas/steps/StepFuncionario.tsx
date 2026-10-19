// src/pages/CadastrosBase/Pessoas/steps/StepFuncionario.tsx
// -----------------------------------------------------------------------------
// Etapa de papel "Funcionário" do wizard de Pessoa (TASK-FE-303) — cargo,
// função (CBO, `SelectAsyncPaginate` real sobre `GET /functions/options`,
// TASK-BE-332), centro de custo, comissão/valores, data de nascimento e
// bloco bancário.
//
// `pix_type` usa as 4 opções REAIS do Enum `PixType` do backend (contrato
// §5/PERGUNTA-01, ordem default assumida pelo Arquiteto: 0=CPF/CNPJ,
// 1=E-mail, 2=Telefone, 3=Chave Aleatória).
//
// `account_type` — backend aceita STRING LIVRE (sem `Rule::enum()`); mantido
// como `Select` de conveniência com as 2 opções do protótipo (Conta
// Corrente/Poupança), sem validação de negócio real (fiel à nota da Tarefa).
//
// TASK-FE-331 — "Chave PIX" (`employee.pix`) reativa ao `employee.pix_type`
// selecionado: CPF/CNPJ (0) → `MaskedInput kind="cpfCnpj"`; E-mail (1) →
// `Input` puro (`type="email"`, sem máscara); Telefone (2) → `MaskedInput
// kind="phone"` (`TASK-FE-329`); Chave Aleatória (3) → `Input` puro. Extensão consciente
// sobre a Referência UX (`GB.Cerne.UX/.../parts.tsx::BankFields` não
// implementa essa reatividade hoje) — composição de primitivas de máscara já
// oficiais, sem token/layout novo. Trocar de tipo com texto já digitado NÃO
// reformata retroativamente (mesmo comportamento tolerado hoje pelo campo
// `nif`) — comportamento aceito, não um bug.
//
// TASK-FE-333 (Achado E, execução 023) — o CPF/CNPJ (0) usava `docTypeOfNif`
// (contagem EXATA — 11/14) para escolher a máscara; como `react-input-mask`
// usa máscaras de comprimento FIXO, a máscara de CPF (11 dígitos) nunca
// deixava passar do 11º dígito, então NUNCA chegava a existir um valor de 14
// dígitos para `docTypeOfNif` classificar como `'cnpj'` — o campo travava
// sempre em CPF, MESMO BUG do Achado A-ii do campo `nif`
// (`StepDadosBasicos.tsx`). Mesma correção, reaproveitada de `nif.ts` (SEM
// duplicar lógica): `maskDocTypeOfNif` (`>11` dígitos ⇒ CNPJ, mesmo padrão do
// Emissor) + `beforeMaskedStateChange={nifBeforeMaskedStateChange}` (resgata
// o 12º dígito que a máscara de CPF, ainda ativa no render anterior,
// descartaria). O hook funciona igual em uncontrolled (`register()`, como
// aqui) ou controlled — comprovado por simulação isolada da lib — então o
// campo continua `{...register('employee.pix')}`, sem precisar virar
// `Controller`. Só o tipo CPF/CNPJ (0) é afetado; e-mail/telefone/aleatória
// continuam com o comportamento de sempre.
//
// TASK-FE-332 (GAP-FE-120 addendum FECHADO, execução 023) — `employee.center`
// consome `listCostCenterOptions` (`/cost-centers/options`, sem gate de
// `costcenters_view`, TASK-BE-355) e `employee.bank` consome
// `listBankOptions` (`/banks/options`, sem gate de `banks_view`,
// TASK-BE-356) — mesma correção já aplicada a `employee.function`
// (`/functions/options`) e `city` (`/cities/options`, TASK-FE-327).
// `mapOptions` de Centro de Custo usa `${code} — ${description}` (mesma
// convenção de `CreateOrUpdateCentroCusto.tsx`); Banco usa `${code}-${name}`
// (mesmo template de `BankResource.info` no backend).
// -----------------------------------------------------------------------------

import { Box, Field as ChakraField, SimpleGrid } from '@chakra-ui/react';
import { Controller, type UseFormWatch } from 'react-hook-form';

import { DateInput } from '@/components/DateInput';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listBankOptions } from '@/services/v2/Banks/bank-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFunctionOptions } from '@/services/v2/Functions/function-service';

import type { Option } from '@/@types/option';
import type { BankOptionItem } from '@/@types/v2/Banks';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FunctionOption } from '@/@types/v2/Functions';

import { StepHeading, type StepProps } from './parts';

import type { PessoaFormValues } from '../pessoa.types';

const ACCOUNT_TYPE_OPTIONS: Option<string>[] = [
  { value: 'C', label: 'Conta Corrente' },
  { value: 'P', label: 'Conta Poupança' },
];

interface Props extends StepProps {
  watch: UseFormWatch<PessoaFormValues>;
}

export function StepFuncionario({ control, register, errors, disabled, watch }: Props) {
  const { languageGB } = useLanguage();
  const text = languageGB.people.person;
  const e = text.form.employee;

  const pixTypeOptions: Option<number>[] = [
    { value: 0, label: text.form.pixTypeOptions.cpfCnpj },
    { value: 1, label: text.form.pixTypeOptions.email },
    { value: 2, label: text.form.pixTypeOptions.phone },
    { value: 3, label: text.form.pixTypeOptions.random },
  ];

  // TASK-FE-331 — reatividade "Chave PIX" × "Tipo de Chave PIX".
  const pixType = watch('employee.pix_type');

  return (
    <Box>
      <StepHeading title={text.roles.employee} subtitle={e.subtitle} />

      <SimpleGrid columns={columnsForm.twoColumns} gap={6} mb={6}>
        <Input label={e.office} {...register('employee.office')} disabled={disabled} />
        <Controller
          name="employee.function"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectAsyncPaginate
              label={e.function}
              name="employee.function"
              value={value}
              onChange={onChange}
              service={listFunctionOptions}
              findParams={(search) => ({ search })}
              mapOptions={(item: FunctionOption) => ({ label: item.name, value: item.uuid })}
              error={errors.employee?.function?.message as string | undefined}
              isRequired
              isDisabled={disabled}
            />
          )}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.threeColumns} gap={6} mb={6}>
        <Controller
          name="employee.center"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectAsyncPaginate
              label={e.centerId}
              name="employee.center"
              value={value}
              onChange={onChange}
              service={listCostCenterOptions}
              findParams={(search) => ({ search, only_analytic: true })}
              mapOptions={(item: CostCenterRef) => ({
                label: `${item.code} — ${item.description}`,
                value: item.uuid,
              })}
              isDisabled={disabled}
            />
          )}
        />
        <Controller
          name="employee.commission"
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <PercentInput
              name={name}
              label={e.commission}
              value={value}
              onValueChange={onChange}
              maxValue={100}
              disabled={disabled}
            />
          )}
        />
        {/* TASK-FE-336/ERRO-FE-014 (Causa B) — `invalid` faltava aqui; sem
            ele, `ChakraField.ErrorText` (ark-ui `FieldErrorText`) nunca
            renderiza, mesmo com a guarda condicional abaixo montando o
            elemento (o `field.invalid` do contexto é que decide, não a
            guarda). Mesmo padrão do wrapper compartilhado `Form/Field.tsx`. */}
        <ChakraField.Root invalid={!!errors.employee?.birthday}>
          <ChakraField.Label>{e.birthday}</ChakraField.Label>
          <Controller
            name="employee.birthday"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput
                value={value}
                onChange={onChange}
                disabled={disabled}
                maxDate={new Date()}
              />
            )}
          />
          {errors.employee?.birthday?.message && (
            <ChakraField.ErrorText>{errors.employee.birthday.message}</ChakraField.ErrorText>
          )}
        </ChakraField.Root>
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.twoColumns} gap={6} mb={6}>
        <Controller
          name="employee.vl_time_productive"
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <MoneyInput
              name={name}
              label={e.vlTimeProductive}
              value={value}
              onValueChange={onChange}
              disabled={disabled}
            />
          )}
        />
        <Controller
          name="employee.vl_time_unproductive"
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <MoneyInput
              name={name}
              label={e.vlTimeUnproductive}
              value={value}
              onValueChange={onChange}
              disabled={disabled}
            />
          )}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.twoColumns} gap={6} mb={8}>
        <Controller
          name="employee.base_salary"
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <MoneyInput
              name={name}
              label={e.baseSalary}
              value={value}
              onValueChange={onChange}
              disabled={disabled}
            />
          )}
        />
        <Controller
          name="employee.goal_salary"
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <MoneyInput
              name={name}
              label={e.goalSalary}
              value={value}
              onValueChange={onChange}
              disabled={disabled}
            />
          )}
        />
      </SimpleGrid>

      <Box fontSize="sm" fontWeight="bold" color="fg.muted" mb={3} textTransform="uppercase">
        {e.bank.title}
      </Box>
      <SimpleGrid columns={columnsForm.twoColumns} gap={6} mb={6}>
        <Controller
          name="employee.bank"
          control={control}
          render={({ field: { value, onChange } }) => (
            <SelectAsyncPaginate
              label={e.bank.bankId}
              name="employee.bank"
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
          name="employee.account_type"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Select
              label={e.bank.accountType}
              name="employee.account_type"
              value={ACCOUNT_TYPE_OPTIONS.find((o) => o.value === value) ?? null}
              onChange={(opt: Option<string> | null) => onChange(opt?.value ?? '')}
              options={ACCOUNT_TYPE_OPTIONS}
              isDisabled={disabled}
            />
          )}
        />
      </SimpleGrid>
      <SimpleGrid columns={columnsForm.twoColumns} gap={6} mb={6}>
        <Input label={e.bank.agency} {...register('employee.agency')} disabled={disabled} />
        <Input label={e.bank.account} {...register('employee.account')} disabled={disabled} />
      </SimpleGrid>
      <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
        <Controller
          name="employee.pix_type"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Select
              label={e.bank.pixType}
              name="employee.pix_type"
              value={pixTypeOptions.find((o) => o.value === value?.value) ?? null}
              onChange={onChange}
              options={pixTypeOptions}
              isDisabled={disabled}
            />
          )}
        />
        {/* TASK-FE-331 — máscara reativa ao `pix_type` selecionado.
            `MaskedInput kind="cpfCnpj"` resolve CPF↔CNPJ internamente pela
            quantidade de dígitos digitados — substitui a heurística manual
            anterior (`maskDocTypeOfNif`/`nifBeforeMaskedStateChange`). */}
        {pixType?.value === 0 && (
          <MaskedInput
            kind="cpfCnpj"
            label={e.bank.pix}
            {...register('employee.pix')}
            disabled={disabled}
            spellCheck={false}
          />
        )}
        {pixType?.value === 2 && (
          <MaskedInput
            kind="phone"
            label={e.bank.pix}
            {...register('employee.pix')}
            disabled={disabled}
            spellCheck={false}
          />
        )}
        {(pixType?.value === 1 || pixType?.value === 3 || pixType == null) && (
          <Input
            label={e.bank.pix}
            {...register('employee.pix')}
            disabled={disabled}
            spellCheck={false}
            type={pixType?.value === 1 ? 'email' : 'text'}
          />
        )}
      </SimpleGrid>
    </Box>
  );
}
