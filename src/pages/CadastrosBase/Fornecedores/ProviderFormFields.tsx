// src/pages/CadastrosBase/Fornecedores/ProviderFormFields.tsx
// -----------------------------------------------------------------------------
// TASK-MV-FE-12 — extraído de `CreateOrUpdateFornecedor.tsx` (JSX de linhas
// 1063-1616 originais, `Tabs.Root` completo das 4 abas), SEM reescrever
// nenhuma linha — recorte-e-cola literal. Componente PURO de campos: recebe
// o retorno de `useProviderFormController` + `canSave` + um `columns`
// opcional (mesma técnica de `ClientFormFieldsColumns`, TASK-MV-FE-10) + as
// props OBRIGATÓRIAS `tabIndex`/`onTabsChange` (a página cheia sincroniza com
// a URL via `useCustomSearch`; o futuro modal, TASK-MV-FE-13, usa estado
// local próprio — este componente deixou de chamar `useCustomSearch`
// internamente).
//
// Por que `columns` é prop e não constante fixa: `SimpleGrid columns` do
// Chakra é responsivo por BREAKPOINT DE VIEWPORT, não por largura do
// container — dentro de um modal mais estreito que a página cheia, a
// densidade de colunas precisa ser menor. Fornecedor usa hoje a MESMA
// constante `columnsForm.default` nas 7 grids das abas Dados/Conta — por
// isso 1 único papel `root` é suficiente, mais os 3 papéis específicos dos
// arrays dinâmicos (`branchRow`/`branchAddress`/`sellerRow`).
// -----------------------------------------------------------------------------

import { type ElementType, type FocusEvent } from 'react';

import {
  Box,
  Flex,
  Icon,
  IconButton,
  SimpleGrid,
  Spinner,
  Tabs,
  Text,
  type SimpleGridProps,
} from '@chakra-ui/react';
import { Controller } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';

import { accountTypeOptions } from '@/constants/cadastrosBase/provider/options/account-type-options';
import { enabledOptions } from '@/constants/cadastrosBase/provider/options/enabled-options';
import { pixTypeOptions } from '@/constants/cadastrosBase/provider/options/pix-type-options';
import { providerTypeOptions } from '@/constants/cadastrosBase/provider/options/provider-type-options';
import { providerType } from '@/constants/cadastrosBase/provider/provider-type';
import { columnsForm } from '@/constants/coluns-form';

import { listBankOptions } from '@/services/v2/Banks/bank-service';
import { listCityOptions } from '@/services/v2/Cities/city-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';

import type { BankOptionItem } from '@/@types/v2/Banks';
import type { CityListItem } from '@/@types/v2/Cities';
import type { CostCenterRef } from '@/@types/v2/CostCenters';

import type { useProviderFormController } from './useProviderFormController';

export interface ProviderFormFieldsColumns {
  root: SimpleGridProps['columns']; // hoje columnsForm.default — as 7 SimpleGrid das abas "Dados"+"Conta"
  branchRow: SimpleGridProps['columns']; // hoje columnsForm.threeColumns — as 2 SimpleGrid de cada linha de Filial
  branchAddress: SimpleGridProps['columns']; // hoje columnsForm.oneColumns — SimpleGrid do endereço de Filial
  sellerRow: SimpleGridProps['columns']; // hoje columnsForm.threeColumns — SimpleGrid da linha de Vendedor
}

const DEFAULT_PROVIDER_FORM_FIELDS_COLUMNS: ProviderFormFieldsColumns = {
  root: columnsForm.default,
  branchRow: columnsForm.threeColumns,
  branchAddress: columnsForm.oneColumns,
  sellerRow: columnsForm.threeColumns,
};

export type ProviderFormFieldsProps = ReturnType<typeof useProviderFormController> & {
  canSave: boolean;
  columns?: Partial<ProviderFormFieldsColumns>;
  /** OBRIGATÓRIA (Decisão técnica 3 da ficha) — a página cheia sincroniza com
   * a URL via `useCustomSearch`; o futuro modal usa estado local próprio. */
  tabIndex: number;
  onTabsChange: (index: number) => void;
  /**
   * TASK-FE-036fix4 (item 1, BLOQUEADOR) — `false` na página cheia
   * (`CreateOrUpdateFornecedor.tsx`, default). `ProviderFormModal` passa
   * `true`: dentro de `Dialog.Root`/`Portal` (Ark UI), o menu do
   * `SelectAsyncPaginate` portalizado direto em `document.body`
   * (`menuPortalTarget`) vira IRMÃO do Portal do Dialog — o Dialog aplica
   * `aria-hidden`/`inert` nesse irmão (mesmo tratamento dado ao resto da
   * página de fundo), deixando as opções de Banco/Cidade VISÍVEIS porém
   * NÃO-CLICÁVEIS (mirror EXATO do mecanismo já documentado no cabeçalho de
   * `disablePortal` em `SelectAsyncPaginate.tsx`, TASK-FE-706/DF-31 —
   * `CreateProductFromXmlModal.tsx`/`GerarDepreciacaoModal.tsx` já usam a
   * mesma correção). Afeta os 4 `SelectAsyncPaginate` deste arquivo (city
   * e centro de custo padrão da aba Dados, bank da aba Conta, city de cada
   * Filial) — os demais
   * campos das 4 abas usam `Select` nativo (Chakra `Portal`) ou não são
   * portalizados, por isso NÃO sofrem o mesmo bloqueio. */
  disablePortal?: boolean;
};

export function ProviderFormFields({
  columns,
  canSave,
  tabIndex,
  onTabsChange,
  disablePortal,
  control,
  register,
  watch,
  errors,
  branchesArray,
  sellersArray,
  autofillingBranchIndex,
  handleNifBlur,
  handleCepBlur,
  handleBranchCnpjBlur,
  isAutofillBusy,
  activeFarmUuid,
}: ProviderFormFieldsProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.providers.provider;

  const resolvedColumns: ProviderFormFieldsColumns = {
    ...DEFAULT_PROVIDER_FORM_FIELDS_COLUMNS,
    ...columns,
  };

  const watchedType = watch('type');

  return (
    // @ts-ignore - Chakra UI v3 Tabs API
    <Tabs.Root
      value={String(tabIndex)}
      onValueChange={(e: any) => onTabsChange(Number(e.value))}
      variant="outline"
    >
      {/* @ts-ignore - Tab List fixa (sticky) no topo do body: abas sempre
          visíveis; só o conteúdo rola. */}
      <Tabs.List position="sticky" top="0" zIndex={1} bg="formBG">
        {/* @ts-ignore */}
        <Tabs.Trigger value="0">{text.form.tabs.dados}</Tabs.Trigger>
        {/* @ts-ignore */}
        <Tabs.Trigger value="1">{text.form.tabs.conta}</Tabs.Trigger>
        {/* @ts-ignore */}
        <Tabs.Trigger value="2">{text.form.tabs.filiais}</Tabs.Trigger>
        {/* @ts-ignore */}
        <Tabs.Trigger value="3">{text.form.tabs.vendedores}</Tabs.Trigger>
      </Tabs.List>

      {/* ---- ABA 0: Dados (raiz Person + bloco Provider root) ---- */}
      {/* @ts-ignore */}
      <Tabs.Content value="0">
        <Box pt={4}>
          <SimpleGrid columns={resolvedColumns.root} gap={6}>
            <Controller
              name="nif"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <MaskedInput
                  kind="cpfCnpj"
                  label={text.form.fields.nif}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={() => {
                    field.onBlur();
                    handleNifBlur();
                  }}
                  error={error?.message}
                  isRequired
                  disabled={!canSave}
                />
              )}
            />
            <Input
              label={text.form.fields.nickname}
              {...register('nickname')}
              error={errors.nickname?.message}
              isRequired
              disabled={!canSave || isAutofillBusy}
            />
            <Input
              label={text.form.fields.name}
              {...register('name')}
              error={errors.name?.message}
              isRequired
              disabled={!canSave || isAutofillBusy}
            />
          </SimpleGrid>

          <SimpleGrid columns={resolvedColumns.root} gap={6} mt={6}>
            <MaskedInput
              kind="digits"
              label={text.form.fields.stateRegistration}
              {...register('state_registration')}
              disabled={!canSave}
            />
            <MaskedInput
              kind="digits"
              label={text.form.fields.cityRegistration}
              {...register('city_registration')}
              disabled={!canSave}
            />
            <Controller
              name="type"
              control={control}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.type}
                  name="type"
                  value={value}
                  onChange={onChange}
                  options={providerTypeOptions.options(languageGB)}
                  isDisabled={!canSave}
                  error={error?.message}
                  isRequired
                />
              )}
            />
            {watchedType?.value === providerType.comissionado && (
              <Controller
                name="commission"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <MoneyInput
                    name={name}
                    label={text.form.fields.commission}
                    value={value}
                    onValueChange={onChange}
                    error={error?.message}
                    isRequired
                    disabled={!canSave}
                  />
                )}
              />
            )}
            {watchedType?.value === providerType.terceirizado && (
              <Controller
                name="hour_value"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <MoneyInput
                    name={name}
                    label={text.form.fields.hourValue}
                    value={value}
                    onValueChange={onChange}
                    error={error?.message}
                    isRequired
                    disabled={!canSave}
                  />
                )}
              />
            )}
          </SimpleGrid>

          <SimpleGrid columns={resolvedColumns.root} gap={6} mt={6}>
            <Input
              label={text.form.fields.email}
              type="email"
              spellCheck={false}
              {...register('email')}
              error={errors.email?.message}
              disabled={!canSave || isAutofillBusy}
            />
            <MaskedInput
              kind="phone"
              label={text.form.fields.phone}
              {...register('phone')}
              error={errors.phone?.message}
              disabled={!canSave || isAutofillBusy}
            />
            <MaskedInput
              kind="phone"
              label={text.form.fields.cellphone}
              {...register('cellphone')}
              error={errors.cellphone?.message}
              disabled={!canSave || isAutofillBusy}
            />
            <Controller
              name="zip_code"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <MaskedInput
                  kind="cep"
                  label={text.form.fields.zipCode}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={(event: FocusEvent<HTMLInputElement>) => {
                    field.onBlur();
                    handleCepBlur(event);
                  }}
                  error={error?.message}
                  disabled={!canSave || isAutofillBusy}
                />
              )}
            />
          </SimpleGrid>

          <SimpleGrid columns={resolvedColumns.root} gap={6} mt={6}>
            <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
              <Input
                label={text.form.fields.address}
                {...register('address')}
                error={errors.address?.message}
                isRequired
                disabled={!canSave || isAutofillBusy}
              />
            </Box>
            <Input
              label={text.form.fields.number}
              {...register('number')}
              error={errors.number?.message}
              isRequired
              disabled={!canSave || isAutofillBusy}
            />
            <Input
              label={text.form.fields.district}
              {...register('district')}
              error={errors.district?.message}
              isRequired
              disabled={!canSave || isAutofillBusy}
            />
          </SimpleGrid>

          <SimpleGrid columns={resolvedColumns.root} gap={6} mt={6}>
            <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
              <Controller
                name="city"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.form.fields.city}
                    service={listCityOptions}
                    mapOptions={(item: CityListItem) => ({
                      label: `${item.title} — ${item.state?.letter ?? ''}`,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={error?.message}
                    isRequired
                    isDisabled={!canSave || isAutofillBusy}
                    disablePortal={disablePortal}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
            </Box>
            <Input
              label={text.form.fields.contact}
              {...register('contact')}
              error={errors.contact?.message}
              disabled={!canSave}
            />
            <MaskedInput
              kind="phone"
              label={text.form.fields.contactPhone}
              {...register('contact_phone')}
              disabled={!canSave}
            />
          </SimpleGrid>

          {/* UT-000773 — Ativo + Centro de Custo Padrão (ordem do legado:
              contato → is_enabled → centro de custo). */}
          <SimpleGrid columns={resolvedColumns.root} gap={6} mt={6}>
            <Controller
              name="is_enabled"
              control={control}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.isEnabled}
                  name="is_enabled"
                  value={value}
                  onChange={onChange}
                  options={enabledOptions.options(languageGB)}
                  isDisabled={!canSave}
                  error={error?.message}
                  isRequired
                />
              )}
            />
            <Controller
              name="default_cost_center"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.defaultCostCenter}
                  placeholder={text.form.placeholders.defaultCostCenter}
                  service={listCostCenterOptions}
                  mapOptions={(item: CostCenterRef) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    only_analytic: true,
                    is_enabled: true,
                    farm_uuid: activeFarmUuid ?? undefined,
                  })}
                  cacheUniqs={[activeFarmUuid]}
                  // `?? null` (NÃO `?? undefined`): `undefined` deixa o
                  // react-select não controlado e a seleção antiga não limpa.
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={error?.message}
                  isDisabled={!canSave || isAutofillBusy}
                  disablePortal={disablePortal}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          </SimpleGrid>
        </Box>
      </Tabs.Content>

      {/* ---- ABA 1: Conta (bloco bancário, TASK-PR-FE-04) ----
          `bank_uuid`/`account_type`/`agency`/`account`/`pix_type`/`pix`
          — todos `sometimes|nullable` no `ProviderRequest` (aba nunca
          obriga preenchimento). `bank`: `SelectAsyncPaginate`
          PORTALIZADO — mesmo tratamento de `city` na aba "Dados". */}
      {/* @ts-ignore */}
      <Tabs.Content value="1">
        <Box pt={4}>
          <SimpleGrid columns={resolvedColumns.root} gap={6}>
            <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
              <Controller
                name="bank"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.form.fields.bankId}
                    service={listBankOptions}
                    mapOptions={(item: BankOptionItem) => ({
                      label: `${item.code}-${item.name}`,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={error?.message}
                    isDisabled={!canSave}
                    disablePortal={disablePortal}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
            </Box>
            <Controller
              name="account_type"
              control={control}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.accountType}
                  name="account_type"
                  value={value}
                  onChange={onChange}
                  options={accountTypeOptions.options(languageGB)}
                  isDisabled={!canSave}
                  error={error?.message}
                />
              )}
            />
          </SimpleGrid>

          <SimpleGrid columns={resolvedColumns.root} gap={6} mt={6}>
            <Input label={text.form.fields.agency} {...register('agency')} disabled={!canSave} />
            <Input label={text.form.fields.account} {...register('account')} disabled={!canSave} />
            <Controller
              name="pix_type"
              control={control}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.pixType}
                  name="pix_type"
                  value={value}
                  onChange={onChange}
                  options={pixTypeOptions.options(languageGB)}
                  isDisabled={!canSave}
                  error={error?.message}
                />
              )}
            />
            <Input label={text.form.fields.pix} {...register('pix')} disabled={!canSave} />
          </SimpleGrid>
        </Box>
      </Tabs.Content>

      {/* ---- ABA 2: Filiais (array dinâmico + autofill receitaws.com.br,
          TASK-PR-FE-05) ---- `branches` é campo RAIZ do `ProviderForm`
          (`useFieldArray({ name: 'branches' })`). Ordem dos campos fiel
          ao legado: nome→CNPJ (InputMask FIXA, `onBlur` dispara o
          autofill)→inscrição estadual→CEP→cidade (SelectAsyncPaginate
          portalizado)→endereço. Payload: delete-then-recreate completo
          (RN-08), SEMPRE enviado (ver ERRO-01, controller). */}
      {/* @ts-ignore */}
      <Tabs.Content value="2">
        <Box pt={4}>
          {branchesArray.fields.length === 0 && (
            <Text fontSize="sm" color="fg.muted" mb={3}>
              {text.form.branches.empty}
            </Text>
          )}

          <Flex direction="column" gap={4}>
            {branchesArray.fields.map((field, index) => (
              <Box
                key={field.id}
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="md"
                p={4}
              >
                <SimpleGrid columns={resolvedColumns.branchRow} gap={4} mb={3}>
                  <Input
                    label={text.form.branches.fields.name}
                    {...register(`branches.${index}.name` as const)}
                    disabled={!canSave}
                  />
                  <Controller
                    name={`branches.${index}.nif` as const}
                    control={control}
                    render={({ field: nifField, fieldState: { error } }) => (
                      <MaskedInput
                        kind="cnpj"
                        label={text.form.branches.fields.nif}
                        name={nifField.name}
                        value={nifField.value ?? ''}
                        onChange={nifField.onChange}
                        onBlur={(event: FocusEvent<HTMLInputElement>) => {
                          nifField.onBlur();
                          handleBranchCnpjBlur(index, event);
                        }}
                        error={error?.message}
                        isRequired
                        disabled={!canSave}
                      />
                    )}
                  />
                  <MaskedInput
                    kind="digits"
                    label={text.form.branches.fields.stateRegistration}
                    {...register(`branches.${index}.state_registration` as const)}
                    disabled={!canSave}
                  />
                </SimpleGrid>

                <SimpleGrid columns={resolvedColumns.branchRow} gap={4} mb={3}>
                  <Controller
                    name={`branches.${index}.zip_code` as const}
                    control={control}
                    render={({ field: zipField }) => (
                      <MaskedInput
                        kind="cep"
                        label={text.form.branches.fields.zipCode}
                        name={zipField.name}
                        value={zipField.value ?? ''}
                        onChange={zipField.onChange}
                        onBlur={zipField.onBlur}
                        disabled={!canSave}
                      />
                    )}
                  />
                  <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
                    <Controller
                      name={`branches.${index}.city` as const}
                      control={control}
                      render={({ field: cityField, fieldState: { error } }) => (
                        <SelectAsyncPaginate
                          name={cityField.name}
                          label={text.form.branches.fields.city}
                          service={listCityOptions}
                          mapOptions={(item: CityListItem) => ({
                            label: `${item.title} — ${item.state?.letter ?? ''}`,
                            value: item.uuid,
                          })}
                          findParams={(search: string | { search: string }) => ({
                            search: typeof search === 'string' ? search : search.search,
                          })}
                          value={cityField.value ?? null}
                          onChange={(option: any) => cityField.onChange(option ?? null)}
                          error={error?.message}
                          isRequired
                          isDisabled={!canSave}
                          disablePortal={disablePortal}
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                        />
                      )}
                    />
                  </Box>
                </SimpleGrid>

                <SimpleGrid columns={resolvedColumns.branchAddress} gap={4} mb={2}>
                  <Input
                    label={text.form.branches.fields.address}
                    {...register(`branches.${index}.address` as const)}
                    error={errors.branches?.[index]?.address?.message}
                    isRequired
                    disabled={!canSave}
                  />
                </SimpleGrid>

                {autofillingBranchIndex === index && (
                  <Flex align="center" gap={2} mb={2}>
                    <Spinner size="xs" />
                    <Text fontSize="xs" color="fg.muted">
                      {text.form.branches.cnpjAutofill.loading}
                    </Text>
                  </Flex>
                )}

                <Flex justify="flex-end">
                  <IconButton
                    aria-label={text.form.branches.removeAria}
                    variant="ghost_danger"
                    size="sm"
                    disabled={!canSave}
                    onClick={() => branchesArray.remove(index)}
                  >
                    <Icon as={FiTrash2} />
                  </IconButton>
                </Flex>
              </Box>
            ))}
          </Flex>

          <Button
            title={text.form.branches.add}
            icon={FiPlus as ElementType}
            variant="outline"
            size="sm"
            mt={3}
            disabled={!canSave}
            onClick={() =>
              branchesArray.append({
                nif: '',
                name: null,
                state_registration: null,
                zip_code: null,
                city: null,
                address: '',
              })
            }
          />
        </Box>
      </Tabs.Content>
      {/* ---- ABA 3: Vendedores (array dinâmico simples, TASK-PR-FE-06)
          ---- `sellers` é campo RAIZ do `ProviderForm`
          (`useFieldArray({ name: 'sellers' })`). 3 campos por linha
          (ordem fiel ao legado: nome→email→telefone), SEM Select
          assíncrono e SEM máscara de documento. Payload:
          delete-then-recreate completo (RN-08), SEMPRE enviado (ver
          ERRO-01, controller). */}
      {/* @ts-ignore */}
      <Tabs.Content value="3">
        <Box pt={4}>
          {sellersArray.fields.length === 0 && (
            <Text fontSize="sm" color="fg.muted" mb={3}>
              {text.form.sellers.empty}
            </Text>
          )}

          <Flex direction="column" gap={4}>
            {sellersArray.fields.map((field, index) => (
              <Box
                key={field.id}
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="md"
                p={4}
              >
                <SimpleGrid columns={resolvedColumns.sellerRow} gap={4} mb={2}>
                  <Input
                    label={text.form.sellers.fields.name}
                    {...register(`sellers.${index}.name` as const)}
                    error={errors.sellers?.[index]?.name?.message}
                    isRequired
                    disabled={!canSave}
                  />
                  <Input
                    label={text.form.sellers.fields.email}
                    type="email"
                    spellCheck={false}
                    {...register(`sellers.${index}.email` as const)}
                    error={errors.sellers?.[index]?.email?.message}
                    disabled={!canSave}
                  />
                  <MaskedInput
                    kind="phone"
                    label={text.form.sellers.fields.phone}
                    {...register(`sellers.${index}.phone` as const)}
                    disabled={!canSave}
                  />
                </SimpleGrid>

                <Flex justify="flex-end">
                  <IconButton
                    aria-label={text.form.sellers.removeAria}
                    variant="ghost_danger"
                    size="sm"
                    disabled={!canSave}
                    onClick={() => sellersArray.remove(index)}
                  >
                    <Icon as={FiTrash2} />
                  </IconButton>
                </Flex>
              </Box>
            ))}
          </Flex>

          <Button
            title={text.form.sellers.add}
            icon={FiPlus as ElementType}
            variant="outline"
            size="sm"
            mt={3}
            disabled={!canSave}
            onClick={() =>
              sellersArray.append({
                name: '',
                email: null,
                phone: null,
              })
            }
          />
        </Box>
      </Tabs.Content>
    </Tabs.Root>
  );
}
