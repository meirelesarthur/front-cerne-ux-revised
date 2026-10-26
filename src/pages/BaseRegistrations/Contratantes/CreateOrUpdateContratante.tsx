// src/pages/BaseRegistrations/Contratantes/CreateOrUpdateContratante.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de criação/edição de Contratante (Tenant) — Cadastros Base →
// Gerais. Formulário SINGLE-PAGE fiel ao legado
// (`agro365/resources/views/tenants/_forms.blade.php`), 33 campos + `centers[]`
// (`Tenant-contrato-tela.md`, `TASK-TN-FE-03/04/05`). Fecha, num único fork, os
// 3 blocos planejados:
//   03 — Identificação/Localização (campos 1-7, 14-18)
//   04 — Papel/Plano/Quotas/Flags (campos 8-13, 20-21, 27-28, 30)
//   05 — Contrato/Status/Condicionais/Centros de Custo + submit final
//
// Precedente estrutural mais próximo: `Afiliados/CreateOrUpdateAfiliado.tsx`
// (~70% de sobreposição de campos — nif/nickname/name/email/phone/cellphone/
// zip_code/address/city/contact/contact_phone/status/data/qtd_farms) +
// `Planos/CreateOrUpdatePlanRole.tsx` (`CheckboxListField` server-side p/
// `centers[]`, mirror exato de `role_uuids[]`).
//
// RECONCILIAÇÃO (`GAP-TN-FE-03`, Achados A/B/C/D) — TODOS RESOLVIDOS no
// backend real (`TenantRequest`/`TASK-TN-05`/`TASK-TN-06`, confirmados por
// leitura direta do `api_root` nesta execução):
//   A — `country`/`city` uuid-first (`country_uuid`/`person.city_uuid`).
//   B — payload ANINHADO (`person: {...}`).
//   C — `qtd_issuers` (30º campo), mirror `qtd_farms`/`qtd_users`.
//   D — `role_id` (FORM) → payload `role_uuid` (uuid puro, SEM cast/
//       placeholder — Achado D fechou depois do texto da ficha `TASK-TN-FE-05`,
//       que ainda descrevia um placeholder `as unknown as number`; o
//       `role-service.ts` já produzia uuid, e agora o backend também aceita
//       uuid — nenhuma conversão é necessária).
//
// GAP RESOLVIDO (`GAP-TN-10`/`TASK-TN-08` backend, ✅ CONCLUÍDO/validado —
// aplicado nesta execução, TASK-TN-FE-05 follow-up): `TenantDetailResource`
// agora devolve `centers: [{uuid, code, description}]`, SEMPRE presente
// como array (`[]` quando não há vínculo, nunca `null`/omitida). `fillForm`
// PRÉ-SELECIONA os centros vinculados via `data.centers.map(c => c.uuid)` —
// o `CheckboxListField` marca sozinho qualquer opção cujo `value` esteja
// nesse array. A semântica de ESCRITA permanece INALTERADA (mirror
// `plan_uuid`/`GAP-TN-FE-01`): `centers` só entra no payload quando
// `dirtyFields.centers` (o usuário tocou no campo nesta sessão) —
// confirmado seguro por leitura de `StoreTenantAction`/`UpdateTenantAction`:
// "SyncTenantCentersAction (se centers presente no payload)" — omitir a
// chave PRESERVA os vínculos atuais no servidor. Enviar sempre o array
// (como o snippet original da ficha, pré-`GAP-TN-FE-01`) arriscaria UNLINK
// silencioso de centros já vinculados em toda edição que não
// re-selecionasse manualmente todos eles. Schema (`tenant-schema.ts`)
// espelha essa mesma condicional (`centers` obrigatório só no CREATE).
//
// AJUSTE DE HOMOLOGAÇÃO (2026-08-13, `TASK-TN-12` backend ✅ validado):
// +3 campos de quantidade fiscal — `qtd_nfe`/`qtd_cte`/`qtd_mdfe` (campos
// 31-33) — mirror EXATO de `qtd_issuers` em cada ponto (form/schema/
// tipos/payload/fillForm/i18n). `TenantRequest` já exige os 3
// (`required|integer|min:1`) e `TenantDetailResource` já os expõe.
//
// EXECUÇÃO 072 — TASK-072-FE-03 (I1/I2/I3/D1/D2): País SEMPRE desabilitado;
// no CREATE vem Brasil (`useBrazilCountryOption`, `GET /countries/options?
// codigo=1058`, API-D1) aplicado por `applyDefaultCountry` (setValue nomeado,
// não reset inline — Lei 2). No EDIT mostra o país gravado, sem forçar troca
// (G-FE-1 — há contratantes fora do Brasil). NIF com `MaskedInput
// kind="cpfCnpj"` enviado COM pontuação; CEP `MaskedInput kind="cep"`
// (`00000-000`) quando Brasil. Defaults do legado no create: status 1,
// uses_cash_book/generate_financial/generate_ticket = Não. Payload montado
// pelo mapper puro `buildTenantPayload`.
// -----------------------------------------------------------------------------

import { FocusEvent, useEffect, useState } from 'react';

import { Box, Field as ChakraField, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useBrazilCountryOption } from '@/hooks/useBrazilCountryOption';
import { useCepAddressAutofill } from '@/hooks/useCepAddressAutofill';
import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useTenantNifAutofill } from '@/hooks/useTenantNifAutofill';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { resolveTenantFormMode } from '@/constants/BaseRegistrations/mappers/tenant-form-mode';
import { buildTenantPayload } from '@/constants/BaseRegistrations/mappers/tenant-payload';
import { tenantBooleanOptions } from '@/constants/BaseRegistrations/options/tenant-boolean-options';
import { tenantDueDayOptions } from '@/constants/BaseRegistrations/options/tenant-due-day-options';
import { tenantSignatureOptions } from '@/constants/BaseRegistrations/options/tenant-signature-options';
import { tenantStatusOptions } from '@/constants/BaseRegistrations/options/tenant-status-options';
import { columnsForm } from '@/constants/coluns-form';
import { isBrazilCountry } from '@/constants/countries';
import { queryKey } from '@/constants/query-key';

import { tenantSchemaResolver } from '@/validations/schemas/BaseRegistrations/tenant-schema';

import {
  createTenant,
  getTenantByUuid,
  updateTenant,
} from '@/services/v2/BaseRegistrations/tenant-service';
import { listCityOptions } from '@/services/v2/Cities/city-service';
import { listGlobalCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listCountryOptions } from '@/services/v2/Countries/country-service';
import { listAllPlanRoles } from '@/services/v2/Planos/planRole-service';
import { listPlatformRoleOptions } from '@/services/v2/Roles/role-service';

import type { Option } from '@/@types/option';
import type {
  TenantData,
  TenantDueDay,
  TenantForm as TenantFormType,
  TenantSignature,
  TenantStatus,
} from '@/@types/v2/BaseRegistrations/tenant';
import type { CountryOptionItem } from '@/@types/v2/Countries';
import type { PlanRoleOptionItem } from '@/@types/v2/Planos';
import type { RoleOptionItem } from '@/@types/v2/Roles';

export default function CreateOrUpdateContratante() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(uuid);
  // TASK-072-FE-06 (I9) — `mode` substitui o antigo `canSave`: só
  // `tenants_view` abre o registro em VISUALIZAÇÃO (todos os campos
  // desabilitados, sem Salvar, sem autofills). `isEditable` é derivado.
  const mode = resolveTenantFormMode({
    isEditing,
    canCreate: can('tenants_create'),
    canEdit: can('tenants_edit'),
    canView: can('tenants_view'),
  });
  const isEditable = mode === 'create' || mode === 'edit';

  const text = languageGB.baseRegistrations.tenant;

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, dirtyFields },
  } = useForm<TenantFormType>({
    mode: 'onChange',
    resolver: tenantSchemaResolver(languageGB, { isEditing }) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      country: null,
      nif: '',
      nickname: '',
      name: '',
      email: '',
      phone: '',
      cellphone: '',
      role_id: null,
      plan_uuid: null,
      list_all_farms: null,
      qtd_farms: null,
      qtd_users: null,
      // Achado C — default `10` na CRIAÇÃO (mirror legado, `_forms.blade.php:131`).
      // Em edição é sobrescrito pelo `fillForm` assim que os dados reais chegam.
      qtd_issuers: 10,
      // Ajuste de homologação (`TASK-TN-12` backend ✅ validado) — mirror
      // EXATO de `qtd_issuers`: default `10` na CRIAÇÃO, sobrescrito pelo
      // `fillForm` em edição.
      qtd_nfe: 10,
      qtd_cte: 10,
      qtd_mdfe: 10,
      export_xls: null,
      zip_code: '',
      address: '',
      city: null,
      contact: '',
      contact_phone: '',
      // TASK-072-FE-03 (D2) — defaults do legado no CREATE
      // (`_forms.blade.php:79,82,114,117`): status 1 "Habilitado" e
      // Livro Caixa/Gera Financeiro/Gera Boleto = Não. Em edição o
      // `fillForm` sobrescreve com os valores gravados.
      status: isEditing ? null : tenantStatusOptions.getOption(1, languageGB),
      uses_cash_book: isEditing ? null : tenantBooleanOptions.getOption(false, languageGB),
      use_fiscal: null,
      signature: null,
      dt_accession: null,
      due_date: null,
      due_day: null,
      value: null,
      generate_financial: isEditing ? null : tenantBooleanOptions.getOption(false, languageGB),
      generate_ticket: isEditing ? null : tenantBooleanOptions.getOption(false, languageGB),
      cancellation_reason: '',
      centers: [],
    },
  });

  function fillForm(data: TenantData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        country: data.country
          ? { value: data.country.uuid, label: data.country.nome, codigo: data.country.codigo }
          : null,
        nif: data.person.nif,
        nickname: data.person.nickname,
        name: data.person.name,
        email: data.person.email,
        phone: data.person.phone ?? '',
        cellphone: data.cellphone ?? '',
        // ⚠️ Achado D RESOLVIDO — `role` pode faltar via `when()` (RESOURCE
        // do Tenant, currentUser sem role atribuída) — nunca quebrar o
        // fillForm por isso.
        // TASK-TN-FE-08 (backend TASK-TN-09 ✅) — rótulo por `description`
        // (ex. "Rastreabilidade"), mirror do fallback já usado no CREATE
        // (`mapOptions` do select "Atribuição", `TASK-TN-FE-04`). `??` (não
        // `||`): só cai para `name` se `description` for `null`/`undefined`,
        // nunca por string vazia.
        role_id: data.role
          ? { value: data.role.uuid, label: data.role.description ?? data.role.name }
          : null,
        // GAP-TN-FE-01 RESOLVIDO — pré-seleciona o plano ATIVO corrente;
        // ausência (Tenant sem plano ativo) → select abre vazio, não é erro.
        plan_uuid: data.plan ? { value: data.plan.uuid, label: data.plan.nome } : null,
        list_all_farms: tenantBooleanOptions.getOption(!!data.list_all_farms, languageGB),
        qtd_farms: data.qtd_farms,
        qtd_users: data.qtd_users,
        qtd_issuers: data.qtd_issuers,
        qtd_nfe: data.qtd_nfe,
        qtd_cte: data.qtd_cte,
        qtd_mdfe: data.qtd_mdfe,
        export_xls: tenantBooleanOptions.getOption(!!data.export_xls, languageGB),
        zip_code: data.person.zip_code ?? '',
        address: data.person.address,
        city: data.person.city
          ? { value: data.person.city.uuid, label: data.person.city.title }
          : null,
        contact: data.contact ?? '',
        contact_phone: data.contact_phone ?? '',
        status: data.status ? { value: data.status.value, label: data.status.label } : null,
        uses_cash_book: tenantBooleanOptions.getOption(!!data.uses_cash_book, languageGB),
        use_fiscal: tenantBooleanOptions.getOption(!!data.use_fiscal, languageGB),
        signature: data.signature
          ? { value: data.signature.value, label: data.signature.label }
          : null,
        dt_accession: data.dt_accession,
        due_date: data.due_date,
        due_day: { value: data.due_day.value, label: data.due_day.label },
        value: data.value,
        generate_financial: tenantBooleanOptions.getOption(!!data.generate_financial, languageGB),
        generate_ticket: tenantBooleanOptions.getOption(!!data.generate_ticket, languageGB),
        cancellation_reason: data.cancellation_reason ?? '',
        // GAP-TN-10/TASK-TN-08 RESOLVIDO (ver nota de cabeçalho) —
        // `TenantDetailResource` sempre devolve `centers` como array
        // (`[]` quando não há vínculo), então o `.map()` pré-marca os
        // checkboxes vinculados sem risco de quebrar por ausência da
        // chave. Semântica de ESCRITA inalterada: se o usuário não tocar
        // no campo, `centers` não entra no payload (dirtyFields),
        // preservando o vínculo atual no servidor.
        centers: data.centers.map((c) => c.uuid),
      });
    }
  }

  const tenantQuery = useCustomFormQueryByGuid<TenantData>({
    registrationId: isEditing ? uuid : undefined,
    queryKey: queryKey.baseRegistrations.tenant,
    asyncFunction: getTenantByUuid,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([tenantQuery as any]);

  const tenantMutation = useRequest({
    asyncFunction: tryPersistTenant,
    entityName: text.singularLabel,
    queryKey: queryKey.baseRegistrations.tenants,
    queryKey2: queryKey.baseRegistrations.tenant,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistTenant(data: TenantFormType) {
    // TASK-072-FE-03 — mapper puro (NIF pontuado preservado, due_date/
    // cancellation_reason condicionais, plan_uuid/centers só se dirty).
    const payload = buildTenantPayload(data, dirtyFields);

    if (isEditing && uuid) {
      return await updateTenant(uuid, payload);
    }

    return await createTenant(payload);
  }

  // "editar sem alterar nada = Cancelar" (mirror
  // `CreateOrUpdateDiagnosisPregnancy.tsx`/`CreateOrUpdateAfiliado.tsx` —
  // `isEmpty` é MAL NOMEADA, retorna `true` quando o objeto TEM chaves).
  async function onSubmit(data: TenantFormType) {
    // Visualização (I9) nunca persiste — defesa em profundidade (sem botão Salvar).
    if (!isEditable) return;
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await tenantMutation.mutateAsync(data);
    }
  }

  const isSubmitting = tenantMutation.isPending;

  // ---- País (TASK-072-FE-03, I1/D1) — travado. CREATE: Brasil resolvido
  // por `codigo` (API-D1), aplicado uma única vez por `applyDefaultCountry`
  // (setValue nomeado, só se o campo ainda estiver vazio — nunca reset
  // inline). EDIT: mantém o país gravado (G-FE-1), query desligada. Sem
  // troca de país pelo usuário, o antigo efeito que limpava `city` na troca
  // deixou de ser acionável e foi removido. -------------------------------
  const brazilCountryQuery = useBrazilCountryOption({ enabled: !isEditing });
  const isCountryLoading = !isEditing && brazilCountryQuery.isPending;

  function applyDefaultCountry(brazilOption: TenantFormType['country']) {
    if (!isEditing && brazilOption && !getValues('country')) {
      setValue('country', brazilOption, { shouldValidate: false });
    }
  }

  useEffect(() => {
    if (brazilCountryQuery.isSuccess) applyDefaultCountry(brazilCountryQuery.data);
    // `applyDefaultCountry` é recriada a cada render; o gatilho é só a
    // chegada do dado (mirror do contrato de `useCustomFormQueryById`).
  }, [brazilCountryQuery.isSuccess, brazilCountryQuery.data]);

  const countryValue = watch('country');
  const isBrazil = isBrazilCountry(countryValue);

  // ---- CEP → endereço + cidade (TASK-072-FE-04, I4) — só Brasil e só quando
  // o formulário é editável. `address` recebe apenas o logradouro (o form de
  // tenant não tem bairro/número/complemento, mirror `main.js:1081,1115`). --
  const { autofillByCep } = useCepAddressAutofill();

  function handleZipCodeBlur(rawCep: string) {
    if (!isEditable || !isBrazil) return;
    void autofillByCep(rawCep, {
      onAddress: (street) =>
        setValue('address', street, { shouldDirty: true, shouldValidate: !!street }),
      onCity: (option) => setValue('city', option, { shouldDirty: true, shouldValidate: true }),
      messages: text.form.cepAutofill,
    });
  }

  // ---- NIF → pessoa existente / Receita pelo back (TASK-072-FE-05, I5) —
  // só no CREATE (o hook ignora edit/view) e só Brasil; o hook valida o DV
  // antes de consultar. Nunca grava o `nif`; cidade nula cai no CEP (FE-04).
  const { handleNifBlur } = useTenantNifAutofill();

  function handleNifAutofill(rawNif: string) {
    if (!isBrazil) return;
    void handleNifBlur(rawNif, {
      mode,
      onField: (name, value) => setValue(name, value, { shouldDirty: true, shouldValidate: true }),
      onCity: (option) => setValue('city', option, { shouldDirty: true, shouldValidate: true }),
      messages: text.form.nifAutofill,
      cepMessages: text.form.cepAutofill,
    });
  }

  // ---- Condicionais (mirror `handleTaxation()`/`handleCancellation()` do
  // blade legado) — Nota: os 2 `useEffect` abaixo NÃO violam a Lei 2
  // (fillForm): governam campos derivados do próprio estado do form em
  // edição pelo usuário, não o carregamento de dados do servidor. --------
  const signatureValue = watch('signature')?.value;
  const statusValue = watch('status')?.value;

  useEffect(() => {
    if (signatureValue === 99) setValue('due_date', null, { shouldDirty: true });
  }, [signatureValue, setValue]);

  useEffect(() => {
    if (statusValue !== 4) setValue('cancellation_reason', '', { shouldDirty: true });
  }, [statusValue, setValue]);

  // ---- Centros de Custo (`centers[]`) — `CheckboxListField` server-side,
  // mirror `CreateOrUpdatePlanRole.tsx::additionalRoleItems`
  // (`role_uuids[]`). Fonte: `cost-center-service.ts` (contrato de tela §3,
  // "depth<=1") — o domínio só tem 2 níveis (Sintético raiz/Analítico
  // folha, `CostCenterListItem.class: 1|2`), então "depth<=1" cobre TODO o
  // catálogo habilitado; sem filtro adicional de `only_analytic`. --------
  const [centersSearch, setCentersSearch] = useState('');
  const costCentersQuery = useQuery({
    queryKey: [queryKey.baseRegistrations.tenant, 'cost-center-options-global'],
    // TASK-TN-FE-07/GAP-TN-FE-04 (origem) → REPONTADO em ajuste de
    // homologação (TASK-TN-11/GAP-TN-13, backend ✅ validado):
    // `listGlobalCostCenterOptions` agora chama `/cost-centers/options/global`
    // (endpoint dedicado, auth-only, FORA de qualquer farm-context — corrige
    // o "Header X-Farm-Id é obrigatório." do usuário de revenda sem
    // fazenda) em vez de `/cost-centers/options` (que ainda exige o header
    // para quem não é Gestor_Plataf). Sem `skipFarmHeader` — inócuo no
    // endpoint novo. `listCostCenterOptions` continua intocada para os
    // demais consumidores.
    queryFn: () => listGlobalCostCenterOptions(),
  });
  // Endpoint novo não aceita `search` (zero query params, filtro hardcoded
  // no backend) — filtragem ao digitar migrada para CLIENT-SIDE sobre a
  // lista completa já carregada (universo pequeno, mirror do mesmo ajuste
  // já aplicado ao select "Atribuição"/`role_id` nesta Tarefa).
  const normalizedCentersSearch = centersSearch.trim().toLowerCase();
  const centerItems = (costCentersQuery.data?.data.items ?? [])
    .filter(
      (item) =>
        !normalizedCentersSearch ||
        item.code.toLowerCase().includes(normalizedCentersSearch) ||
        item.description.toLowerCase().includes(normalizedCentersSearch)
    )
    .map((item) => ({
      value: item.uuid,
      label: [item.code, item.description].filter(Boolean).join(' — '),
      // Centro de Custo RAIZ (`is_root`, `CostCenterOptionResource`) continua
      // aparecendo na lista (fiel ao legado `@if($center->depth)`, que só
      // OCULTA o checkbox — a linha permanece visível), mas nunca deve ser
      // selecionável: mirror do comportamento legado onde a raiz nunca
      // entra em `centers[]`.
      nonSelectable: item.is_root,
    }));

  const statusOptions = tenantStatusOptions.options(languageGB);
  const signatureOptions = tenantSignatureOptions.options(languageGB);
  const dueDayOptions = tenantDueDayOptions.options(languageGB);
  const booleanOptions = tenantBooleanOptions.options(languageGB);

  return (
    <FormContainer
      title={
        mode === 'view'
          ? text.form.title.view
          : isEditing
            ? text.form.title.edit
            : text.form.title.create
      }
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
          />
          {isEditable && (
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
          {/* 1 — country (payload: country_uuid, Achado A ✅) */}
          <Controller
            name="country"
            control={control}
            render={({ field, fieldState }) => (
              <Skeleton loading={isCountryLoading} borderRadius="md">
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.countryId}
                  placeholder={text.form.placeholders.countryId}
                  service={listCountryOptions}
                  mapOptions={(item: CountryOptionItem): any => ({
                    label: item.nome,
                    value: item.uuid,
                    codigo: item.codigo,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={fieldState.error?.message}
                  isRequired
                  // I1/D1 — país nunca editável (create: Brasil; edit: gravado).
                  isDisabled
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </Skeleton>
            )}
          />

          {/* 2 — nif (I2/D3 — máscara dinâmica CPF/CNPJ, valor COM pontuação;
              readonly em edição, sem revalidar DV — G-FE-1) */}
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
                onBlur={(event: FocusEvent<HTMLInputElement>) => {
                  field.onBlur();
                  handleNifAutofill(event.target.value ?? '');
                }}
                ref={field.ref}
                error={fieldState.error?.message}
                isRequired
                loading={isLoading}
                disabled={!isEditable || isEditing}
              />
            )}
          />

          {/* 3 — nickname */}
          <Input
            label={text.form.fields.nickname}
            {...register('nickname')}
            error={errors.nickname?.message}
            isRequired
            maxLength={60}
            loading={isLoading}
            disabled={!isEditable}
          />

          {/* 4 — name */}
          <Input
            label={text.form.fields.name}
            {...register('name')}
            error={errors.name?.message}
            isRequired
            maxLength={30}
            loading={isLoading}
            disabled={!isEditable}
          />

          {/* 5 — email */}
          <Input
            label={text.form.fields.email}
            type="email"
            {...register('email')}
            error={errors.email?.message}
            isRequired
            maxLength={89}
            loading={isLoading}
            disabled={!isEditable}
          />

          {/* 6 — phone */}
          <MaskedInput
            kind="phone"
            label={text.form.fields.phone}
            {...register('phone')}
            error={errors.phone?.message}
            isRequired
            disabled={!isEditable || isLoading}
          />

          {/* 7 — cellphone */}
          <MaskedInput
            kind="phone"
            label={text.form.fields.cellphone}
            {...register('cellphone')}
            error={errors.cellphone?.message}
            disabled={!isEditable || isLoading}
          />

          {/* 8 — role_id (payload: role_uuid, Achado D ✅) */}
          <Controller
            name="role_id"
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.roleId}
                placeholder={text.form.placeholders.roleId}
                // TASK-TN-FE-07/GAP-TN-FE-04 → TASK-TN-10 (homologação,
                // 2026-08-13) — `listPlatformRoleOptions` repontado para o
                // endpoint DEDICADO `/roles/options` (FORA de qualquer
                // farm-context, auth-only): resolve na origem o 403 "Header
                // X-Farm-Id é obrigatório" que afetava usuário sem fazenda
                // ativa (ex.: gestor de revenda). `listRoles` continua
                // intocada para as outras telas (Perfil, Usuários, etc.).
                service={listPlatformRoleOptions}
                // Homologação (2026-08-13) — legado (`_forms.blade.php`,
                // select `role_id`) rotula pela DESCRIÇÃO do perfil (ex.:
                // "Rastreabilidade"), não pelo slug interno (`name`, ex.:
                // "Gestor_Rastro"). `?? item.name` é só rede de segurança
                // para o raro perfil sem `description` preenchida.
                mapOptions={(item: RoleOptionItem) => ({
                  label: item.description ?? item.name,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={fieldState.error?.message}
                isRequired
                isDisabled={!isEditable || isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          {/* 9 — plan_uuid (Opção B: sem gate de tenants_plan_edit) */}
          <Controller
            name="plan_uuid"
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.planUuid}
                placeholder={text.form.placeholders.planUuid}
                // Homologação (2026-08-13) → TASK-TN-10 — `listAllPlanRoles`
                // repontado para o endpoint DEDICADO `/plan-roles/options`
                // (FORA de farm-context, sem paginação — devolve os ~47
                // planos numa única resposta), ver comentário no service
                // (`planRole-service.ts`). Shape ENXUTO (`nome`, PT) — NÃO é
                // `PlanRoleListItem` (CRUD completo, `name` em EN).
                service={listAllPlanRoles}
                mapOptions={(item: PlanRoleOptionItem) => ({ label: item.nome, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={fieldState.error?.message}
                isRequired={!isEditing}
                isDisabled={!isEditable || isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          {/* 10 — list_all_farms (opcional) */}
          <Controller
            name="list_all_farms"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.listAllFarms}
                name={name}
                value={value}
                onChange={(opt: Option<boolean> | null) => onChange(opt ?? null)}
                options={booleanOptions}
                error={error?.message}
                isDisabled={!isEditable || isLoading}
                loading={isLoading}
              />
            )}
          />

          {/* 11 — qtd_farms */}
          <Controller
            name="qtd_farms"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label={text.form.fields.qtdFarms}
                type="number"
                min={1}
                value={field.value ?? ''}
                onChange={(event) =>
                  field.onChange(event.target.value === '' ? null : Number(event.target.value))
                }
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                isRequired
                loading={isLoading}
                disabled={!isEditable}
              />
            )}
          />

          {/* 12 — qtd_users */}
          <Controller
            name="qtd_users"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label={text.form.fields.qtdUsers}
                type="number"
                min={1}
                value={field.value ?? ''}
                onChange={(event) =>
                  field.onChange(event.target.value === '' ? null : Number(event.target.value))
                }
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                isRequired
                loading={isLoading}
                disabled={!isEditable}
              />
            )}
          />

          {/* 13 — export_xls */}
          <Controller
            name="export_xls"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.exportXls}
                name={name}
                value={value}
                onChange={(opt: Option<boolean> | null) => onChange(opt ?? null)}
                options={booleanOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!isEditable || isLoading}
                loading={isLoading}
              />
            )}
          />

          {/* 14 — zip_code (I3 — `00000-000` para Brasil; país estrangeiro
              gravado, só em edição, mantém CEP livre — G-FE-1) */}
          {isBrazil ? (
            <Controller
              name="zip_code"
              control={control}
              render={({ field, fieldState }) => (
                <MaskedInput
                  kind="cep"
                  label={text.form.fields.zipCode}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={(event: FocusEvent<HTMLInputElement>) => {
                    field.onBlur();
                    handleZipCodeBlur(event.target.value ?? '');
                  }}
                  ref={field.ref}
                  placeholder={text.form.placeholders.zipCode}
                  error={fieldState.error?.message}
                  loading={isLoading}
                  disabled={!isEditable}
                />
              )}
            />
          ) : (
            <Input
              label={text.form.fields.zipCode}
              {...register('zip_code')}
              error={errors.zip_code?.message}
              maxLength={9}
              loading={isLoading}
              disabled={!isEditable}
            />
          )}

          {/* 15 — address */}
          <Input
            label={text.form.fields.address}
            {...register('address')}
            error={errors.address?.message}
            isRequired
            maxLength={120}
            loading={isLoading}
            disabled={!isEditable}
          />

          {/* 16 — city (payload: person.city_uuid; gate de país + busca min 3
              chars — ver nota de cabeçalho sobre o limite real do
              `SelectAsyncPaginate` genérico, `isDisabled` é o bloqueio
              primário e funciona 100%). */}
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
                findParams={(search: string | { search: string }) => {
                  const term = typeof search === 'string' ? search : search.search;
                  return term.length >= 3
                    ? { search: term, country_uuid: countryValue?.value }
                    : undefined;
                }}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={fieldState.error?.message}
                isRequired
                isDisabled={!isEditable || isLoading || !countryValue}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          {/* 17 — contact */}
          <Input
            label={text.form.fields.contact}
            {...register('contact')}
            error={errors.contact?.message}
            maxLength={120}
            loading={isLoading}
            disabled={!isEditable}
          />

          {/* 18 — contact_phone */}
          <MaskedInput
            kind="phone"
            label={text.form.fields.contactPhone}
            {...register('contact_phone')}
            error={errors.contact_phone?.message}
            disabled={!isEditable || isLoading}
          />

          {/* 19 — status (status=4 revela+obriga cancellation_reason) */}
          <Controller
            name="status"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.status}
                name={name}
                value={statusOptions.find((option) => option.value === value?.value) ?? null}
                onChange={(opt: Option<TenantStatus> | null) =>
                  onChange(opt ? { value: opt.value, label: opt.label } : null)
                }
                options={statusOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!isEditable || isLoading}
                loading={isLoading}
              />
            )}
          />

          {/* 20 — uses_cash_book (opcional) */}
          <Controller
            name="uses_cash_book"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.usesCashBook}
                name={name}
                value={value}
                onChange={(opt: Option<boolean> | null) => onChange(opt ?? null)}
                options={booleanOptions}
                error={error?.message}
                isDisabled={!isEditable || isLoading}
                loading={isLoading}
              />
            )}
          />

          {/* 21 — use_fiscal */}
          <Controller
            name="use_fiscal"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.useFiscal}
                name={name}
                value={value}
                onChange={(opt: Option<boolean> | null) => onChange(opt ?? null)}
                options={booleanOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!isEditable || isLoading}
                loading={isLoading}
              />
            )}
          />

          {/* 22 — signature (signature=99 oculta+desobriga due_date) */}
          <Controller
            name="signature"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.signature}
                name={name}
                value={signatureOptions.find((option) => option.value === value?.value) ?? null}
                onChange={(opt: Option<TenantSignature> | null) =>
                  onChange(opt ? { value: opt.value, label: opt.label } : null)
                }
                options={signatureOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!isEditable || isLoading}
                loading={isLoading}
              />
            )}
          />

          {/* 23 — dt_accession */}
          <ChakraField.Root invalid={!!errors.dt_accession}>
            <ChakraField.Label>
              {text.form.fields.dtAccession}
              <Text as="span" color="fg.error">
                {' '}
                *
              </Text>
            </ChakraField.Label>
            <Controller
              name="dt_accession"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  value={value ?? null}
                  onChange={onChange}
                  disabled={!isEditable || isLoading}
                />
              )}
            />
            {errors.dt_accession?.message && (
              <ChakraField.ErrorText>{errors.dt_accession.message}</ChakraField.ErrorText>
            )}
          </ChakraField.Root>

          {/* 24 — due_date (some do layout quando signature=99) */}
          {signatureValue !== 99 && (
            <ChakraField.Root invalid={!!errors.due_date}>
              <ChakraField.Label>
                {text.form.fields.dueDate}
                <Text as="span" color="fg.error">
                  {' '}
                  *
                </Text>
              </ChakraField.Label>
              <Controller
                name="due_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput
                    value={value ?? null}
                    onChange={onChange}
                    disabled={!isEditable || isLoading}
                  />
                )}
              />
              {errors.due_date?.message && (
                <ChakraField.ErrorText>{errors.due_date.message}</ChakraField.ErrorText>
              )}
            </ChakraField.Root>
          )}

          {/* 25 — due_day */}
          <Controller
            name="due_day"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.dueDay}
                name={name}
                value={dueDayOptions.find((option) => option.value === value?.value) ?? null}
                onChange={(opt: Option<TenantDueDay> | null) =>
                  onChange(opt ? { value: opt.value, label: opt.label } : null)
                }
                options={dueDayOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!isEditable || isLoading}
                loading={isLoading}
              />
            )}
          />

          {/* 26 — value (MoneyInput, payload numérico puro) */}
          <Controller
            name="value"
            control={control}
            render={({ field, fieldState }) => (
              <MoneyInput
                name={field.name}
                label={text.form.fields.value}
                value={field.value}
                onValueChange={field.onChange}
                error={fieldState.error?.message}
                isRequired
                disabled={!isEditable || isLoading}
              />
            )}
          />

          {/* 27 — generate_financial */}
          <Controller
            name="generate_financial"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.generateFinancial}
                name={name}
                value={value}
                onChange={(opt: Option<boolean> | null) => onChange(opt ?? null)}
                options={booleanOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!isEditable || isLoading}
                loading={isLoading}
              />
            )}
          />

          {/* 28 — generate_ticket */}
          <Controller
            name="generate_ticket"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.generateTicket}
                name={name}
                value={value}
                onChange={(opt: Option<boolean> | null) => onChange(opt ?? null)}
                options={booleanOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!isEditable || isLoading}
                loading={isLoading}
              />
            )}
          />

          {/* 30 — qtd_issuers (Achado C, mirror qtd_farms/qtd_users) */}
          <Controller
            name="qtd_issuers"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label={text.form.fields.qtdIssuers}
                type="number"
                min={1}
                value={field.value ?? ''}
                onChange={(event) =>
                  field.onChange(event.target.value === '' ? null : Number(event.target.value))
                }
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                isRequired
                loading={isLoading}
                disabled={!isEditable}
              />
            )}
          />

          {/* 31 — qtd_nfe (ajuste de homologação, TASK-TN-12, mirror qtd_issuers) */}
          <Controller
            name="qtd_nfe"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label={text.form.fields.qtdNfe}
                type="number"
                min={1}
                value={field.value ?? ''}
                onChange={(event) =>
                  field.onChange(event.target.value === '' ? null : Number(event.target.value))
                }
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                isRequired
                loading={isLoading}
                disabled={!isEditable}
              />
            )}
          />

          {/* 32 — qtd_cte (ajuste de homologação, TASK-TN-12, mirror qtd_issuers) */}
          <Controller
            name="qtd_cte"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label={text.form.fields.qtdCte}
                type="number"
                min={1}
                value={field.value ?? ''}
                onChange={(event) =>
                  field.onChange(event.target.value === '' ? null : Number(event.target.value))
                }
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                isRequired
                loading={isLoading}
                disabled={!isEditable}
              />
            )}
          />

          {/* 33 — qtd_mdfe (ajuste de homologação, TASK-TN-12, mirror qtd_issuers) */}
          <Controller
            name="qtd_mdfe"
            control={control}
            render={({ field, fieldState }) => (
              <Input
                label={text.form.fields.qtdMdfe}
                type="number"
                min={1}
                value={field.value ?? ''}
                onChange={(event) =>
                  field.onChange(event.target.value === '' ? null : Number(event.target.value))
                }
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                isRequired
                loading={isLoading}
                disabled={!isEditable}
              />
            )}
          />
        </SimpleGrid>

        {/* 29 — cancellation_reason (some do layout quando status!==4, mirror `d-none` do blade) */}
        {statusValue === 4 && (
          <Box mt={6}>
            <Textarea
              label={text.form.fields.cancellationReason}
              {...register('cancellation_reason')}
              error={errors.cancellation_reason?.message}
              isRequired
              loading={isLoading}
              disabled={!isEditable}
            />
          </Box>
        )}

        {/* centers[] — mirror CreateOrUpdatePlanRole.tsx::role_uuids;
            pré-selecionado em edição via fillForm (ver nota de cabeçalho,
            GAP-TN-10/TASK-TN-08 resolvido). */}
        <Box mt={6}>
          <Controller
            name="centers"
            control={control}
            render={({ field: { value, onChange } }) => (
              <CheckboxListField
                label={text.form.fields.centers}
                items={centerItems}
                selectedValues={value}
                onChange={onChange}
                searchValue={centersSearch}
                onSearchChange={setCentersSearch}
                searchPlaceholder={text.form.placeholders.centersSearch}
                selectAllLabel={text.form.centersField.selectAll}
                deselectAllLabel={text.form.centersField.deselectAll}
                selectedCountLabel={text.form.centersField.selectedCount}
                emptyLabel={text.form.centersField.empty}
                isLoading={costCentersQuery.isLoading}
                isError={costCentersQuery.isError}
                onRetry={() => costCentersQuery.refetch()}
                isDisabled={!isEditable || isLoading}
              />
            )}
          />
          {errors.centers?.message && (
            <Text mt={1} fontSize="sm" color="fg.error">
              {errors.centers.message}
            </Text>
          )}
        </Box>
      </Form>
    </FormContainer>
  );
}
