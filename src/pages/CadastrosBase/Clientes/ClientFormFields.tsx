// src/pages/CadastrosBase/Clientes/ClientFormFields.tsx
// -----------------------------------------------------------------------------
// TASK-MV-FE-10 — extraído de `CreateOrUpdateCliente.tsx` (JSX de linhas
// 789-1151 originais), SEM reescrever nenhuma linha — recorte-e-cola
// literal. Componente PURO de campos: recebe o retorno de
// `useClientFormController` + `canSave` + um `columns` opcional (a página
// cheia usa o default de 4 colunas; o futuro modal, TASK-MV-FE-11, poderá
// passar `columnsForm.twoColumns`/`.threeColumns` sem tocar neste arquivo).
//
// Por que `columns` é prop e não constante fixa: `SimpleGrid columns` do
// Chakra é responsivo por BREAKPOINT DE VIEWPORT, não por largura do
// container (não é container query) — dentro de um modal mais estreito que
// a página cheia, 4 colunas de `Input` ficariam espremidas mesmo a viewport
// sendo `lg`. Preparar `columns` como prop com o default de hoje deixa a
// Tarefa seguinte livre para ajustar a densidade do modal sem reabrir este
// arquivo.
// -----------------------------------------------------------------------------

import { type ElementType, type FocusEvent } from 'react';

import {
  Box,
  Flex,
  Icon,
  IconButton,
  SimpleGrid,
  Text,
  type SimpleGridProps,
} from '@chakra-ui/react';
import { Controller } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Switch } from '@/components/ui/switch';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listCityOptions } from '@/services/v2/Cities/city-service';
import { listCountryOptions } from '@/services/v2/Countries/country-service';

import type { CityListItem } from '@/@types/v2/Cities';
import type { CountryOptionItem } from '@/@types/v2/Countries';

import type { useClientFormController } from './useClientFormController';

export interface ClientFormFieldsColumns {
  root: SimpleGridProps['columns']; // hoje columnsForm.default (4 campos linha 1/2/3)
  roleContact: SimpleGridProps['columns']; // hoje columnsForm.threeColumns (cellphone/contact/contact_phone)
  roleFarmName: SimpleGridProps['columns']; // hoje columnsForm.twoColumns (farm_name sozinho)
  roleSwitches: SimpleGridProps['columns']; // hoje columnsForm.threeColumns (is_enabled/final_costumer/taxpayer)
  roleCountry: SimpleGridProps['columns']; // hoje columnsForm.twoColumns (code_country/id_abroad)
}

const DEFAULT_CLIENT_FORM_FIELDS_COLUMNS: ClientFormFieldsColumns = {
  root: columnsForm.default,
  roleContact: columnsForm.threeColumns,
  roleFarmName: columnsForm.twoColumns,
  roleSwitches: columnsForm.threeColumns,
  roleCountry: columnsForm.twoColumns,
};

export type ClientFormFieldsProps = ReturnType<typeof useClientFormController> & {
  canSave: boolean;
  columns?: Partial<ClientFormFieldsColumns>;
  /**
   * Desabilita o Portal (`menuPortalTarget`/`menuPosition`) dos
   * `SelectAsyncPaginate` de Cidade/País — mirror EXATO `disablePortal`
   * (TASK-FE-706/DF-31, ver `SelectAsyncPaginate.tsx`). NUNCA `true` na
   * página cheia (`CreateOrUpdateCliente.tsx`, fora de qualquer `Dialog`):
   * o Portal em `document.body` é o comportamento correto ali. SÓ `true`
   * quando este componente é montado DENTRO de um `Dialog.Root` (item 1,
   * 036fix4/`ClientFormModal.tsx`) — sem isso, o Dialog aplica
   * `aria-hidden`/`inert` no menu portalizado (fora da árvore do Portal do
   * Dialog), deixando as opções VISÍVEIS porém NÃO-CLICÁVEIS.
   */
  disablePortal?: boolean;
  /**
   * Oculta o Switch `is_enabled` ("Ativo*") — uso EXCLUSIVO do modal inline
   * de Pedidos (`Operacional/Pedidos/dialogs/InlineClientModal.tsx`,
   * PED-FE-07, decisão do dono registrada na Tarefa/GAP-API-FE-01): a
   * fachada `POST/PUT /clients` força `is_enabled=true` na criação inline
   * (cliente criado a partir de um Pedido nasce sempre ATIVO — a tela cheia
   * de Clientes cuida de desabilitar depois). Como o valor é sempre
   * ignorado/forçado pelo backend nesse fluxo, expor o toggle induziria o
   * usuário a um controle sem efeito — por isso ele é OMITIDO, não apenas
   * desabilitado. `EMPTY_CLIENT_FORM_DEFAULTS.is_enabled` já nasce `true`
   * (`useClientFormController.ts`), então o campo continua sendo enviado
   * como `true` mesmo oculto — nenhuma mudança de schema/controller
   * necessária. Default `false`/omitido preserva 100% o comportamento atual
   * de TODOS os outros callers (`CreateOrUpdateCliente.tsx` via
   * `ClientFormModal`, `VendaAnimais/CreateClientQuickModal.tsx`,
   * `ContratosVenda`/`MovCaixaBancario`/`NfeEmitidas`/`Incomes` etc.) —
   * mudança aditiva, NÃO tocada a assinatura existente.
   */
  hideIsEnabled?: boolean;
};

export function ClientFormFields({
  columns,
  canSave,
  control,
  register,
  errors,
  registrationsArray,
  registerStateRegistration,
  handleNifBlur,
  handleCepBlur,
  isAutofillBusy,
  disablePortal,
  hideIsEnabled,
}: ClientFormFieldsProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.clients.client;

  const resolvedColumns: ClientFormFieldsColumns = {
    ...DEFAULT_CLIENT_FORM_FIELDS_COLUMNS,
    ...columns,
    // `hideIsEnabled` reduz a linha de 3 Switches para 2 — força a densidade
    // adequada independentemente do `columns.roleSwitches` do caller (só o
    // modal de Pedidos passa `hideIsEnabled`, então isto nunca conflita com
    // o layout dos demais consumidores).
    ...(hideIsEnabled ? { roleSwitches: columnsForm.twoColumns } : {}),
  };

  return (
    <>
      {/* ---- AJUSTE DE HOMOLOGAÇÃO (dono, 2026-07-30) — ORDEM EXATA
          definida no browser, DIVERGE do mirror original de
          `Proprietary` (que segue nif→nickname→name→email→phone→zip_code
          →address→number→district→city). Prevalece sobre o espelhamento:

          1ª linha: nif · name · nickname · city_registration
          2ª linha: email · phone · zip_code · address
          3ª linha: number · district · city

          `city_registration` SOBE do bloco "papel" (antes agrupado com
          `farm_name`) para a 1ª linha raiz — único campo de papel movido
          para cima; os demais campos de papel preservam a ordem relativa
          atual (ver bloco `Box mt={8}` abaixo). ---- */}
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
          label={text.form.fields.name}
          {...register('name')}
          error={errors.name?.message}
          isRequired
          disabled={!canSave || isAutofillBusy}
        />
        <Input
          label={text.form.fields.nickname}
          {...register('nickname')}
          error={errors.nickname?.message}
          isRequired
          disabled={!canSave || isAutofillBusy}
        />
        <MaskedInput
          kind="digits"
          label={text.form.client.cityRegistration}
          {...register('city_registration')}
          error={errors.city_registration?.message}
          disabled={!canSave}
        />
      </SimpleGrid>

      {/* ---- 2ª linha: email → phone → zip_code → address ---- */}
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
        <Input
          label={text.form.fields.address}
          {...register('address')}
          error={errors.address?.message}
          isRequired
          disabled={!canSave || isAutofillBusy}
        />
      </SimpleGrid>

      {/* ---- 3ª linha: number → district → city ---- */}
      <SimpleGrid columns={resolvedColumns.root} gap={6} mt={6}>
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
              // Armadilha #9 — `?? null`, NUNCA `?? undefined`.
              value={field.value ?? null}
              onChange={(option: any) => field.onChange(option ?? null)}
              error={error?.message}
              isRequired
              isDisabled={!canSave || isAutofillBusy}
              // Armadilha #7 — portaliza SÓ esta instância no <body>, EXCETO
              // dentro do modal (`disablePortal`, item 1 do fix4 — ver
              // comentário da prop acima).
              menuPortalTarget={document.body}
              menuPosition="fixed"
              disablePortal={disablePortal}
            />
          )}
        />
      </SimpleGrid>

      {/* ---- Papel Client: contato comercial (cellphone/contact/contact_phone) ---- */}
      <Box mt={8}>
        <SimpleGrid columns={resolvedColumns.roleContact} gap={6} mb={6}>
          <MaskedInput
            kind="phone"
            label={text.form.client.cellphone}
            {...register('cellphone')}
            error={errors.cellphone?.message}
            disabled={!canSave}
          />
          <Input
            label={text.form.client.contact}
            {...register('contact')}
            error={errors.contact?.message}
            disabled={!canSave}
          />
          <MaskedInput
            kind="phone"
            label={text.form.client.contactPhone}
            {...register('contact_phone')}
            error={errors.contact_phone?.message}
            disabled={!canSave}
          />
        </SimpleGrid>

        {/* ---- Papel Client: farm_name (`city_registration` subiu para a
            1ª linha raiz — AJUSTE DE HOMOLOGAÇÃO, ver comentário acima) ---- */}
        <SimpleGrid columns={resolvedColumns.roleFarmName} gap={6} mb={6}>
          <Input
            label={text.form.client.farmName}
            {...register('farm_name')}
            error={errors.farm_name?.message}
            disabled={!canSave}
          />
        </SimpleGrid>

        {/* ---- Papel Client: is_enabled/final_costumer/taxpayer (Switch) ----
            AJUSTE DE HOMOLOGAÇÃO — `is_enabled` ("Ativo*") adicionado como
            3º Switch desta linha, posicionado ANTES de `final_costumer`/
            `taxpayer` (mesma adjacência do legado real,
            `agro365/resources/views/clients/_forms.blade.php:45-54`:
            `is_enabled` → `final_costumer` → `taxpayer`, nessa ordem). ---- */}
        <SimpleGrid columns={resolvedColumns.roleSwitches} gap={6} mb={6}>
          {/* `hideIsEnabled` (PED-FE-07) — omite o Switch "Ativo*"; o campo
              continua no form com o default `true` (ver comentário da prop
              acima), só a UI é omitida. */}
          {!hideIsEnabled && (
            <Controller
              name="is_enabled"
              control={control}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
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
                    disabled={!canSave}
                  >
                    {text.form.client.isEnabled}
                    {/* Switch (`@/components/ui/switch`) não tem `isRequired` com
                        asterisco automático (diferente de `Input`/`Select`) —
                        marcador manual, campo obrigatório por instrução do dono. */}
                    <Text as="span" color="fg.error">
                      {' *'}
                    </Text>
                  </Switch>
                  {error?.message && (
                    <Text fontSize="xs" color="fg.error">
                      {error.message}
                    </Text>
                  )}
                </Box>
              )}
            />
          )}
          <Controller
            name="final_costumer"
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
                  disabled={!canSave}
                >
                  {text.form.client.finalCustomer}
                </Switch>
              </Box>
            )}
          />
          <Controller
            name="taxpayer"
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
                  disabled={!canSave}
                >
                  {text.form.client.taxpayer}
                </Switch>
              </Box>
            )}
          />
        </SimpleGrid>

        {/* ---- Papel Client: code_country → id_abroad ----
            AJUSTE DE HOMOLOGAÇÃO — `id_abroad` deixou de ser condicional
            (legado real sempre renderiza, ver comentário de cabeçalho
            original de `CreateOrUpdateCliente.tsx`). CORREÇÃO CRÍTICA —
            `code_country` deixou de ser `CountryCombobox` (ISO, causa do
            500) e passou a `SelectAsyncPaginate` sobre `/countries/options`
            (`listCountryOptions`, mesmo serviço já usado por
            `Fazendas/steps/StepEndereco.tsx`), value = `codigo` (dígitos),
            NUNCA sigla ISO. ---- */}
        <SimpleGrid columns={resolvedColumns.roleCountry} gap={6} mb={6}>
          <Controller
            name="code_country"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.client.country}
                service={listCountryOptions}
                mapOptions={(item: CountryOptionItem) => ({
                  label: item.nome,
                  value: String(item.codigo),
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                // Armadilha #9 — `?? null`, NUNCA `?? undefined`.
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                // Armadilha #7 — portaliza SÓ esta instância no <body>,
                // EXCETO dentro do modal (`disablePortal`, item 1 do fix4).
                menuPortalTarget={document.body}
                menuPosition="fixed"
                disablePortal={disablePortal}
              />
            )}
          />
          <Input
            label={text.form.client.idAbroad}
            {...register('id_abroad')}
            error={errors.id_abroad?.message}
            disabled={!canSave}
          />
        </SimpleGrid>
      </Box>

      {/* ---- Seção "Inscrições Estaduais" (useFieldArray, 0+ linhas,
          molde direto de StepCliente.tsx) ---- */}
      <Box mt={8}>
        <Text fontSize="md" fontWeight="bold" color="brandColorText" mb={1}>
          {text.form.stateRegistrations.title}
        </Text>
        {registrationsArray.fields.length === 0 && (
          <Text fontSize="sm" color="fg.muted" mb={2}>
            {text.form.stateRegistrations.empty}
          </Text>
        )}
        <Flex direction="column" gap={3}>
          {registrationsArray.fields.map((field, index) => (
            <Flex key={field.id} gap={2} align="flex-end">
              <Box flex={1}>
                <MaskedInput
                  kind="digitsOrIsento"
                  label={`${text.form.stateRegistrations.fields.value} ${index + 1}`}
                  disabled={!canSave}
                  error={errors.state_registrations?.[index]?.value?.message}
                  {...registerStateRegistration(index)}
                />
              </Box>
              <IconButton
                aria-label={text.form.stateRegistrations.removeAria}
                variant="ghost"
                colorPalette="red"
                disabled={!canSave}
                onClick={() => registrationsArray.remove(index)}
              >
                <Icon as={FiTrash2} />
              </IconButton>
            </Flex>
          ))}
        </Flex>
        <Button
          title={text.form.stateRegistrations.add}
          icon={FiPlus as ElementType}
          variant="outline"
          size="sm"
          mt={3}
          disabled={!canSave}
          onClick={() => registrationsArray.append({ value: '' })}
        />
      </Box>
    </>
  );
}
