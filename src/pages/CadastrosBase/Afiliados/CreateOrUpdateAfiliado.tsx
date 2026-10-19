// src/pages/CadastrosBase/Afiliados/CreateOrUpdateAfiliado.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de AFILIADO (Partner) — Cadastros Base /
// Pessoas, execução 024, TASK-FE-432. Rotas (TASK-FE-433):
// /cadastros-base/pessoas/afiliados/novo (create) e
// /cadastros-base/pessoas/afiliados/:uuid (edit, GUID), guardadas por
// `partners_create`/`partners_edit` respectivamente (ver contrato de tela
// §3.1 — guarda GRANULAR por rota, estilo People).
//
// Formulário SINGLE-PAGE (sem wizard), fiel ao legado
// (`partners/_forms.blade.php` é 1 form contínuo) — decisão já tomada no
// contrato de tela §2. Mirror estrutural mais próximo dentro do próprio
// frontend_root: `People/CreateOrUpdatePessoa.tsx` para os campos de
// identidade (nome/nif/email/endereço/city_uuid, sem stepper), combinado com
// a máscara CPF/CNPJ dinâmica de `Emissores/CreateOrUpdateEmissor.tsx` e o
// autofill de CEP via ViaCEP de `Contador/CreateOrUpdateContador.tsx`.
//
// 19 campos, na mesma ordem do legado (contrato de tela §3.4):
//   1 nif · 2 nickname · 3 name · 4 email · 5 phone · 6 cellphone ·
//   7 zip_code · 8 address · 9 city (city_uuid) · 10 contact ·
//   11 contact_phone · 12 status · 13 dt_affiliation · 14 commission ·
//   15 due_date · 16 qtd_farms · 17 business_rule · 18 note · 19 contract_file
//
// ⚠️ `zip_code` — CORREÇÃO E2E (feature 024): backend passou a aceitar o
// campo no payload raiz (`PartnerRequest`) e a expor `person.zip_code` no GET
// `/partners/{uuid}`; agora vai em `PartnerPayload` (opcional, mesmo
// tratamento de `phone`/`cellphone`) e é pré-preenchido na edição a partir de
// `data.person.zip_code`. Autofill de `address`/`city` no `onBlur`, mirror
// EXATO de `Contador/CreateOrUpdateContador.tsx::handleCepBlur` (ViaCEP →
// `logradouro`/`bairro` concatenados em `address`; código IBGE →
// `getCityByIso`). Falha (CEP não encontrado, cidade não resolvida, rede fora
// do ar) nunca trava o formulário — só toast + preenchimento manual continua
// disponível.
//
// ⚠️ `nif` — máscara DINÂMICA CPF↔CNPJ via `<MaskedInput kind="cpfCnpj">`
// (97-Esteiras/001, Wave 1) — mirror `Emissores/CreateOrUpdateEmissor.tsx`,
// mesma migração.
//
// ⚠️ `dt_affiliation`/`due_date` — `DateInput` do design system (mirror
// `Pessoas/steps/StepFuncionario.tsx::employee.birthday`), NÃO `<Input
// type="date">` (padrão usado em Safra) — decisão explícita do contrato de
// tela §3.4 (adaptação visual ao `cerne`, mesmo componente para os 2 campos
// de data, mesmo o legado sendo assimétrico). Formato ISO `YYYY-MM-DD` nos
// dois sentidos — compatível com `PartnerForm.dt_affiliation`/`due_date`
// (`string | null`).
//
// ⚠️ `commission` — `PercentInput` (contrato §3.4, "reaproveitar
// PercentInput/CommissionPercentInput já existente"), SEM prop `maxValue`
// (diferente de `employee.commission`/`provider.commission`, que usam
// `maxValue={100}`) — `PartnerRequest::commission` é `numeric, min:0` SEM
// teto (contrato backend §5, replicado em `partner-schema.ts`).
//
// ⚠️ `city` — `SelectAsyncPaginate` sobre `listCityOptions` (`GET
// /cities/options`, lookup ENXUTO sem gate de `cities_view` — mirror EXATO
// de People/DEC-009, nunca `listCities`/`city_id`).
//
// ⚠️ `contract_file` — extensão aditiva de `FileUpload.tsx` (TASK-FE-432,
// já materializada): em edição com `contract_file` (URL) presente e nenhum
// arquivo novo selecionado nesta sessão, mostra o 3º estado (chip com
// nome/link + "Substituir"/"Remover"). `remove_contract_file` é setado
// `true` no `onRemove` SÓ quando havia um arquivo existente no servidor
// (`currentFileUrl`) — nunca quando o usuário só descarta uma seleção nova
// ainda não enviada (nesse caso já não havia nada a remover no backend).
// -----------------------------------------------------------------------------

import { FocusEvent, useState } from 'react';

import { Box, SimpleGrid, Text, Field as ChakraField } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { FileUpload } from '@/components/Form/FileUpload';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { partnerStatusOptions } from '@/constants/afiliados/partner/options/partner-status-options';
import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { createPartner, updatePartner } from '@/services/v2/Afiliados/partner-service';
import { getCityByIso, listCityOptions } from '@/services/v2/Cities/city-service';
import { getAddressByCep } from '@/services/viacep';

import type { Option } from '@/@types/option';
import type {
  PartnerDetail,
  PartnerForm as PartnerFormType,
  PartnerPayload,
} from '@/@types/v2/Afiliados';

import { partnerSchemaResolver } from './partner-schema';
import { usePartnerForm } from './useAfiliados';

export default function CreateOrUpdateAfiliado() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(uuid);
  const canSave = isEditing ? can('partners_edit') : can('partners_create');

  const text = languageGB.afiliados.partner;

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<PartnerFormType>({
    mode: 'onChange',
    resolver: partnerSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      nif: '',
      nickname: '',
      name: '',
      email: '',
      phone: '',
      cellphone: '',
      zip_code: '',
      address: '',
      city: null,
      contact: '',
      contact_phone: '',
      status: null,
      dt_affiliation: null,
      commission: null,
      due_date: null,
      qtd_farms: null,
      business_rule: '',
      note: '',
      contract_file: null,
      remove_contract_file: false,
    },
  });

  // URL do contrato JÁ EXISTENTE no servidor (edição) — populada por
  // `fillForm`, NUNCA no RHF (não é campo submetido, é só estado de exibição
  // do 3º estado de `FileUpload`, mirror `currentImageUrl`).
  const [currentContractFileUrl, setCurrentContractFileUrl] = useState<string | null>(null);

  function fillForm(data: PartnerDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        nif: data.person.nif,
        name: data.person.name,
        email: data.person.email,
        // CORREÇÃO E2E (feature 024): `PartnerResource` passou a expor
        // `person.{nickname,phone,address,city_uuid,city_name}` — prefill
        // real a partir do bloco Person (fecha o bug de campos vazios na
        // edição).
        nickname: data.person.nickname ?? '',
        phone: data.person.phone ?? '',
        cellphone: data.cellphone ?? '',
        // CORREÇÃO E2E (feature 024): `PartnerResource` passou a expor
        // `person.zip_code` — prefill real (fecha o bug de CEP vazio na
        // edição).
        zip_code: data.person.zip_code ?? '',
        address: data.person.address ?? '',
        city: data.person.city_uuid
          ? { value: data.person.city_uuid, label: data.person.city_name ?? data.person.city_uuid }
          : null,
        contact: data.contact ?? '',
        contact_phone: data.contact_phone ?? '',
        status: data.status ? { value: data.status.value, label: data.status.label } : null,
        dt_affiliation: data.dt_affiliation,
        commission: data.commission != null ? Number(data.commission) : null,
        due_date: data.due_date,
        qtd_farms: data.qtd_farms,
        business_rule: data.business_rule ?? '',
        note: data.note ?? '',
        contract_file: null,
        remove_contract_file: false,
      });
    }
    setCurrentContractFileUrl(data.contract_file ?? null);
  }

  const partnerQuery = usePartnerForm({
    registrationId: isEditing ? uuid : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([partnerQuery as any]);

  const partnerMutation = useRequest({
    asyncFunction: tryPersistPartner,
    entityName: text.singularLabel,
    queryKey: queryKey.afiliados.partners,
    queryKey2: queryKey.afiliados.partner,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistPartner(data: PartnerFormType) {
    const payload: PartnerPayload = {
      nif: data.nif.trim(),
      nickname: data.nickname.trim(),
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || null,
      cellphone: data.cellphone?.trim() || null,
      // CORREÇÃO E2E (feature 024): `PartnerRequest` passou a aceitar
      // `zip_code` no payload raiz — antes era conveniência client-only.
      zip_code: data.zip_code?.trim() || undefined,
      address: data.address.trim(),
      city_uuid: data.city?.value ?? '',
      contact: data.contact?.trim() || null,
      contact_phone: data.contact_phone?.trim() || null,
      status: (data.status?.value ?? 1) as PartnerPayload['status'],
      dt_affiliation: data.dt_affiliation ?? '',
      commission: data.commission ?? 0,
      due_date: data.due_date,
      qtd_farms: data.qtd_farms,
      business_rule: data.business_rule?.trim() || null,
      note: data.note?.trim() || null,
    };

    if (data.contract_file) {
      payload.contract_file = data.contract_file;
    }
    if (data.remove_contract_file) {
      payload.remove_contract_file = true;
    }

    if (isEditing && uuid) {
      return await updatePartner(uuid, payload);
    }

    return await createPartner(payload);
  }

  async function onSubmit(data: PartnerFormType) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await partnerMutation.mutateAsync(data);
    }
  }

  const isSubmitting = partnerMutation.isPending;

  // ---- Máscara dinâmica CPF↔CNPJ (mirror CreateOrUpdateEmissor.tsx) --------

  const statusOptions = partnerStatusOptions.options(languageGB);

  // ---- Autofill de CEP via ViaCEP (mirror CreateOrUpdateContador.tsx) ------
  // `zip_code` agora também vai ao payload (CORREÇÃO E2E feature 024) — este
  // handler só dispara o preenchimento de `address`/`city` quando o CEP tem 8
  // dígitos completos; o valor do próprio `zip_code` já está no form via
  // `Controller`/`field.onChange`.
  async function handleZipCodeBlur(event: FocusEvent<HTMLInputElement>) {
    const digits = (event.target.value ?? '').replace(/\D/g, '');
    if (digits.length !== 8) return;

    try {
      const viaCepAddress = await getAddressByCep(digits);

      if (!viaCepAddress) {
        toaster.create({
          type: 'warning',
          title: text.filter.title,
          description: text.form.hints.cityRequired,
        });
        return;
      }

      setValue(
        'address',
        [viaCepAddress.logradouro, viaCepAddress.bairro].filter(Boolean).join(', '),
        { shouldDirty: true, shouldValidate: true }
      );

      const city = await getCityByIso(Number(viaCepAddress.ibge));

      if (city) {
        setValue(
          'city',
          { label: city.title, value: city.uuid },
          { shouldDirty: true, shouldValidate: true }
        );
      }
    } catch {
      // Rede fora do ar (ViaCEP OU /cities/options) — nunca propaga exceção
      // não tratada; o autofill é um atalho, o preenchimento manual continua
      // sempre disponível.
    }
  }

  const contractFile = watch('contract_file');

  function handleContractFileSelected(file: File | null) {
    setValue('contract_file', file, { shouldDirty: true });
    if (file) {
      setValue('remove_contract_file', false, { shouldDirty: true });
    }
  }

  function handleContractFileRemove() {
    setValue('contract_file', null, { shouldDirty: true });
    // Só marca remoção no payload quando havia um arquivo JÁ EXISTENTE no
    // servidor — descartar uma seleção nova ainda não enviada não deve gerar
    // `remove_contract_file: true` (nada a remover no backend nesse caso).
    if (currentContractFileUrl) {
      setValue('remove_contract_file', true, { shouldDirty: true });
      setCurrentContractFileUrl(null);
    }
  }

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && (
            <ButtonSaveAndNext
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="nif"
            control={control}
            render={({ field, fieldState }) => (
              <MaskedInput
                kind="cpfCnpj"
                label={text.form.fields.nif}
                name={field.name}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                isRequired
                // ⚠️ CPF/CNPJ nunca editável na edição (pedido explícito do
                // dev, correção E2E feature 024) — só na criação. Valor
                // continua no form/payload, só a UI fica bloqueada.
                disabled={!canSave || isLoading || isEditing}
              />
            )}
          />

          <Input
            label={text.form.fields.nickname}
            placeholder={text.form.placeholders.nickname}
            {...register('nickname')}
            error={errors.nickname?.message}
            isRequired
            maxLength={60}
            loading={isLoading}
            disabled={!canSave}
          />

          <Input
            label={text.form.fields.name}
            placeholder={text.form.placeholders.name}
            {...register('name')}
            error={errors.name?.message}
            isRequired
            maxLength={30}
            loading={isLoading}
            disabled={!canSave}
          />

          <Input
            label={text.form.fields.email}
            type="email"
            placeholder={text.form.placeholders.email}
            {...register('email')}
            error={errors.email?.message}
            isRequired
            maxLength={89}
            loading={isLoading}
            disabled={!canSave}
          />

          <MaskedInput
            kind="phone"
            label={text.form.fields.phone}
            {...register('phone')}
            error={errors.phone?.message}
            isRequired
            disabled={!canSave || isLoading}
          />

          <MaskedInput
            kind="phone"
            label={text.form.fields.cellphone}
            {...register('cellphone')}
            error={errors.cellphone?.message}
            disabled={!canSave || isLoading}
          />

          <Controller
            name="zip_code"
            control={control}
            render={({ field }) => (
              <MaskedInput
                kind="cep"
                label={text.form.fields.zipCode}
                name={field.name}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={(event) => {
                  field.onBlur();
                  handleZipCodeBlur(event);
                }}
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Input
            label={text.form.fields.address}
            placeholder={text.form.placeholders.address}
            {...register('address')}
            error={errors.address?.message}
            isRequired
            maxLength={120}
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="city"
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.city}
                placeholder={text.form.placeholders.city}
                service={listCityOptions}
                mapOptions={(item: any) => ({
                  label: [item.title, item.state?.letter].filter(Boolean).join(' — '),
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={fieldState.error?.message}
                isRequired
                isDisabled={!canSave}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Input
            label={text.form.fields.contact}
            {...register('contact')}
            error={errors.contact?.message}
            maxLength={120}
            loading={isLoading}
            disabled={!canSave}
          />

          <MaskedInput
            kind="phone"
            label={text.form.fields.contactPhone}
            {...register('contact_phone')}
            error={errors.contact_phone?.message}
            disabled={!canSave || isLoading}
          />

          <Controller
            name="status"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.status}
                name={name}
                value={statusOptions.find((option) => option.value === value?.value) ?? null}
                onChange={(opt: Option<number> | null) =>
                  onChange(opt ? { value: opt.value, label: opt.label } : null)
                }
                options={statusOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <ChakraField.Root invalid={!!errors.dt_affiliation}>
            <ChakraField.Label>
              {text.form.fields.dtAffiliation}
              <Text as="span" color="fg.error">
                {' '}
                *
              </Text>
            </ChakraField.Label>
            <Controller
              name="dt_affiliation"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  value={value ?? null}
                  onChange={onChange}
                  disabled={!canSave || isLoading}
                />
              )}
            />
            {errors.dt_affiliation?.message && (
              <ChakraField.ErrorText>{errors.dt_affiliation.message}</ChakraField.ErrorText>
            )}
          </ChakraField.Root>

          <Controller
            name="commission"
            control={control}
            render={({ field, fieldState }) => (
              <PercentInput
                name={field.name}
                label={text.form.fields.commission}
                value={field.value}
                onValueChange={field.onChange}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          <ChakraField.Root invalid={!!errors.due_date}>
            <ChakraField.Label>{text.form.fields.dueDate}</ChakraField.Label>
            <Controller
              name="due_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  value={value ?? null}
                  onChange={onChange}
                  disabled={!canSave || isLoading}
                />
              )}
            />
            {errors.due_date?.message && (
              <ChakraField.ErrorText>{errors.due_date.message}</ChakraField.ErrorText>
            )}
          </ChakraField.Root>

          <Controller
            name="qtd_farms"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label={text.form.fields.qtdFarms}
                type="number"
                min={0}
                value={field.value ?? ''}
                onChange={(event) =>
                  field.onChange(event.target.value === '' ? null : Number(event.target.value))
                }
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                isRequired
                loading={isLoading}
                disabled={!canSave}
              />
            )}
          />
        </SimpleGrid>

        <Box mt={6}>
          <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
            <Textarea
              label={text.form.fields.businessRule}
              {...register('business_rule')}
              error={errors.business_rule?.message}
              loading={isLoading}
              disabled={!canSave}
            />
            <Textarea
              label={text.form.fields.note}
              {...register('note')}
              error={errors.note?.message}
              loading={isLoading}
              disabled={!canSave}
            />
          </SimpleGrid>
        </Box>

        <Box mt={6}>
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            {text.form.fields.contractFile}
          </Text>
          <FileUpload
            accept=".pdf"
            maxSizeMb={1}
            file={contractFile}
            onFileSelected={handleContractFileSelected}
            onRemove={handleContractFileRemove}
            currentFileUrl={currentContractFileUrl}
            dropzoneTitle={text.form.contractFile.dropzoneTitle}
            dropzoneDraggingTitle={text.form.contractFile.dropzoneDraggingTitle}
            changeLabel={text.form.contractFile.changeLabel}
            removeLabel={text.form.contractFile.removeLabel}
            replaceLabel={text.form.contractFile.replaceLabel}
            existingFileLabel={text.form.contractFile.existingFileLabel}
            errorTypeMessage={text.form.contractFile.errorType}
            errorSizeMessage={text.form.contractFile.errorSize}
            disabled={!canSave || isLoading}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
