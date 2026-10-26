// src/pages/CadastrosBase/Emissores/CreateOrUpdateEmissor.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de EMISSOR NFe (Issuer) — Cadastros Base /
// Fiscal (execução 023, TASK-FE-322/323). Rotas:
// /cadastros-base/emissores/novo e /cadastros-base/emissores/:issuerUuid
// (GUID), registradas em src/router/index.tsx (TASK-FE-325), guardadas por
// `issue_view` (canSave interno = `issue_create`/`issue_edit`).
//
// Referência UX real (raro nesta esteira — a maioria dos módulos recentes
// teve UX-GAP): `EmissorCadastro.tsx` (ux_root, commit
// f45073270fc2de51feaa264de92326229dd15338) — segmentação visual replicada
// com Text (título maiúsculo) + SimpleGrid (sem componente CollapsibleSection
// no catálogo do fork).
//
// Estrutura mecânica idêntica a CondicoesPagamento/CreateOrUpdateCondicaoPagamento
// (isEditing por GUID, `fillForm` guardado por `!isEmpty(dirtyFields) ||
// resetForce`, mutação via `useRequest`) + o tratamento de estado NÃO-RHF de
// `FamiliaBens/CreateOrUpdateFamiliaBens` (arrays que não sujam `dirtyFields`
// precisam de uma flag própria no guard de submit).
//
// Divergências UX×API já resolvidas por default (Gaps abertos, não
// bloqueantes — contrato de tela §8):
//   - GAP-FE-111: SEM campo de logo nesta rodada (IssuerRequest não aceita
//     escrita desse campo).
//   - GAP-FE-112: "Inscrições Estaduais" é lista simples de números
//     (`numbers: string[]`), SEM UF/isento.
//   - GAP-FE-113: "Cidade" é `SelectAsyncPaginate` sobre `listCities`
//     (`cidade_uuid` é FK real), NUNCA texto livre.
//
// UT-000766 T4 (D-101-03): os campos fiscais padrão (CST x4, % x4, CFOP x2, NCM,
// Token IBPT) saíram da tela, do schema e do payload. UT-000780: CNAE, Perfil
// SPED e o bloco "Séries de NF-e" (`SeriesNfeField`, RHF `useFieldArray`).
//
// ⚠️ ARMADILHA CENTRAL #2 — `numbers`/`farm_uuids` NÃO são campos RHF (evita
// a complexidade de `useFieldArray` para uma lista simples de strings) — são
// `useState` locais com uma flag própria (`numbersDirty`/`farmsDirty`) que
// entra no guard de `onSubmit`, mesmo racional de `hasImageChange` em
// `CreateOrUpdateFamiliaBens.tsx` (uma edição só nesses arrays não suja
// `dirtyFields`, e a fórmula pura de Lei 2 descartaria essa edição em
// silêncio).
//
// ⚠️ ARMADILHA CENTRAL #3 — `cidade_uuid` guarda o `Option<string>` INTEIRO
// no RHF (label+value), mesmo padrão de `parent_uuid` em
// `PlanAccount/CreateOrUpdatePlanAccount.tsx` (SelectAsyncPaginate
// controlado via Controller) — necessário para exibir o label da cidade já
// selecionada em modo edição sem uma segunda fonte de estado. O payload
// extrai `.value` no submit.
//
// ⚠️ `cpf_cnpj` — máscara DINÂMICA CPF↔CNPJ (contrato §6.2/TASK-FE-322).
// Migrado (97-Esteiras/001, Wave 1) para `<MaskedInput kind="cpfCnpj">`
// (`src/components/Form/MaskedInput.tsx`): o componente único já infere
// CPF/CNPJ pela contagem de dígitos crus internamente
// (`utils/masks/document.ts::maskDocTypeOfDigits`), sem depender de
// `react-input-mask`/`beforeMaskedStateChange` — substitui o antigo
// `InputMask` + `maskDocType`/`cpfCnpjBeforeMaskedStateChange` manuais.
// -----------------------------------------------------------------------------

import { ElementType, FocusEvent, useMemo, useRef, useState } from 'react';

import { Box, Field as ChakraField, SimpleGrid, Text, useDisclosure } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import cleanMask from '@/utils/clean-mask';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';
import { formatCpfCnpjProgressive, normalizeDocument } from '@/utils/masks/document';

import { columnsForm } from '@/constants/coluns-form';
import { FISCAL_FORCE_HOMOLOGATION } from '@/constants/Fiscal/environmentLock';
import { queryKey } from '@/constants/query-key';

import { getCityByIso, listCityOptions } from '@/services/v2/Cities/city-service';
import { createIssuer, updateIssuer } from '@/services/v2/Issuers/issuer-service';
import { getAddressByCep } from '@/services/viacep';

import type { Option } from '@/@types/option';
import type { CityListItem } from '@/@types/v2/Cities';
import type {
  IssuerAmbienteSlug,
  IssuerDetail,
  IssuerFormType,
  IssuerPayload,
  IssuerRegimeSlug,
  IssuerSpedProfile,
} from '@/@types/v2/Issuers';

import { emissorSchemaResolver } from './emissor-schema';
import { applyNfeSeriesServerErrors } from './nfe-series-errors';
import { SeriesNfeField } from './SeriesNfeField';
import { useFarmsList, useIssuerForm } from './useIssuers';

export default function CreateOrUpdateEmissor() {
  const { issuerUuid } = useParams<{ issuerUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(issuerUuid);

  const text = languageGB.issuers.issuer;

  // D-101-12: ambiente travado em Homologação. Edição = `ambiente_locked` da API;
  // travado se `ambiente_locked` da API OU a constante FISCAL_FORCE_HOMOLOGATION.
  const [apiAmbienteLocked, setApiAmbienteLocked] = useState<boolean | undefined>(undefined);
  const isAmbienteLocked = !!apiAmbienteLocked || FISCAL_FORCE_HOMOLOGATION;

  const canSave = isEditing ? can('issue_edit') : can('issue_create');
  const canManageCertificate = can('issue_edit');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    setError,
    getFieldState,
    formState: { errors, dirtyFields },
  } = useForm<IssuerFormType>({
    mode: 'onChange',
    resolver: emissorSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      razao_social: '',
      nome_fantasia: '',
      cpf_cnpj: '',
      rua: '',
      numero: '',
      bairro: '',
      telefone: '',
      cep: '',
      cidade_uuid: null,
      issues_nfe: false,
      regime: '',
      ambiente: FISCAL_FORCE_HOMOLOGATION ? 'homologacao' : '',
      cnae: '',
      sped_profile: '',
      nfe_series: [],
      ultimo_numero_cte: null,
      numero_serie_cte: null,
      ultimo_numero_mdfe: null,
      numero_serie_mdfe: null,
      email: '',
      is_enabled: true,
      numbers: [],
      farm_uuids: [],
      aut_xml: '',
    },
  });

  // ---- Estado NÃO-RHF: Inscrições Estaduais adicionais (numbers[], GAP-FE-112)
  // e Fazendas Vinculadas (farm_uuids[]) — ver "Armadilha central #2" no
  // cabeçalho do arquivo. Cada flag *Dirty entra no guard de onSubmit.
  const [numbers, setNumbers] = useState<string[]>([]);
  const [numbersDirty, setNumbersDirty] = useState(false);
  const [farmUuids, setFarmUuids] = useState<string[]>([]);
  const [farmsDirty, setFarmsDirty] = useState(false);
  const [farmSearchValue, setFarmSearchValue] = useState('');

  // `numbers` continua em useState (ver armadilha #2), mas é espelhado no RHF
  // para o schema exigir >= 1 IE (UT-000766). Sem `shouldDirty`: a flag
  // `numbersDirty` já cobre o guard de submit.
  function commitNumbers(next: string[]) {
    setNumbers(next);
    setNumbersDirty(true);
    setValue('numbers', next, { shouldValidate: true });
  }

  function handleAddNumber() {
    commitNumbers([...numbers, '']);
  }

  function handleChangeNumber(index: number, value: string) {
    commitNumbers(numbers.map((item, i) => (i === index ? value : item)));
  }

  function handleRemoveNumber(index: number) {
    commitNumbers(numbers.filter((_, i) => i !== index));
  }

  function handleFarmsChange(values: string[]) {
    setFarmUuids(values);
    setFarmsDirty(true);
  }

  const farmsQuery = useFarmsList();
  const farmItems = useMemo(() => {
    const all = farmsQuery.data ?? [];
    const filtered = farmSearchValue
      ? all.filter((farm) => farm.description.toLowerCase().includes(farmSearchValue.toLowerCase()))
      : all;
    return filtered.map((farm) => ({ value: farm.uuid, label: farm.description }));
  }, [farmsQuery.data, farmSearchValue]);

  // Lei 2 (`get_pwa_form_query_pattern`) — guarda por `!isEmpty(dirtyFields) ||
  // resetForce`. Sincroniza os arrays NÃO-RHF só quando o usuário ainda não
  // mexeu neles nesta sessão (mesmo racional de `currentImageUrl` em
  // CreateOrUpdateFamiliaBens.tsx).
  function fillForm(data: IssuerDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      const locked = !!data.ambiente_locked || FISCAL_FORCE_HOMOLOGATION;
      setApiAmbienteLocked(data.ambiente_locked);
      reset({
        uuid: data.uuid,
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia,
        cpf_cnpj: data.cpf_cnpj ? formatCpfCnpjProgressive(data.cpf_cnpj) : data.cpf_cnpj,
        rua: data.endereco.rua,
        numero: data.endereco.numero,
        bairro: data.endereco.bairro,
        telefone: data.telefone,
        cep: data.endereco.cep,
        cidade_uuid: data.endereco.cidade_uuid
          ? {
              label: [data.endereco.cidade_nome, data.endereco.uf].filter(Boolean).join(' — '),
              value: data.endereco.cidade_uuid,
            }
          : null,
        issues_nfe: !!data.issues_nfe,
        regime: data.regime ?? '',
        ambiente: locked ? 'homologacao' : (data.ambiente ?? ''),
        cnae: data.cnae ?? '',
        sped_profile: data.sped_profile ?? '',
        nfe_series: (data.nfe_series ?? []).map((item) => ({
          uuid: item.uuid,
          serie: item.serie,
          ultimo_numero: item.ultimo_numero,
          is_default: item.is_default,
          is_active: item.is_active,
          in_use: item.in_use,
          min_ultimo_numero: item.in_use ? item.ultimo_numero : 0,
        })),
        ultimo_numero_cte: data.ultimo_numero_cte,
        numero_serie_cte: data.numero_serie_cte,
        ultimo_numero_mdfe: data.ultimo_numero_mdfe,
        numero_serie_mdfe: data.numero_serie_mdfe,
        email: data.email,
        is_enabled: !!data.is_enabled,
        numbers: data.state_registration_numbers ?? [],
        farm_uuids: data.farm_uuids ?? [],
        aut_xml: data.aut_xml ?? '',
      });
    }
    if (!numbersDirty) {
      setNumbers(data.state_registration_numbers ?? []);
    }
    if (!farmsDirty) {
      setFarmUuids(data.farm_uuids ?? []);
    }
  }

  const issuerQuery = useIssuerForm({
    registrationId: isEditing ? issuerUuid : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([issuerQuery as any]);

  const issuerMutation = useRequest({
    asyncFunction: tryPersistIssuer,
    entityName: text.singularLabel,
    queryKey: queryKey.issuers.list,
    queryKey2: queryKey.issuers.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistIssuer(data: IssuerFormType) {
    const payload: IssuerPayload = {
      razao_social: data.razao_social.trim(),
      nome_fantasia: data.nome_fantasia.trim(),
      cpf_cnpj: normalizeDocument(data.cpf_cnpj),
      rua: data.rua.trim(),
      numero: data.numero.trim(),
      bairro: data.bairro.trim(),
      telefone: data.telefone.trim(),
      cep: data.cep.trim(),
      cidade_uuid: data.cidade_uuid?.value ?? '',
      issues_nfe: !!data.issues_nfe,
      cnae: data.cnae?.trim() || null,
      sped_profile: (data.sped_profile || null) as IssuerSpedProfile | null,
      email: data.email.trim(),
      is_enabled: !!data.is_enabled,
      numbers: numbers.map((n) => n.trim()).filter(Boolean),
      farm_uuids: farmUuids,
    };

    // Bloco condicional (required_if:issues_nfe,true no backend) — só entra
    // no payload quando issues_nfe é true (contrato §12/§5.1).
    if (isAmbienteLocked) payload.ambiente = 'homologacao';
    if (data.issues_nfe) {
      payload.aut_xml = data.aut_xml?.trim() || '';
      payload.regime = data.regime as IssuerRegimeSlug;
      payload.ambiente = isAmbienteLocked ? 'homologacao' : (data.ambiente as IssuerAmbienteSlug);
      // Séries: na criação sempre; na edição só quando o usuário mexeu nelas
      // (ausente = a API preserva as séries atuais — round-trip seguro).
      if (!isEditing || dirtyFields.nfe_series) {
        payload.nfe_series = (data.nfe_series ?? []).map((item) => ({
          uuid: item.uuid ?? null,
          serie: Number(item.serie),
          ultimo_numero: Number(item.ultimo_numero),
          is_default: !!item.is_default,
          is_active: item.is_active !== false,
        }));
      }
      // Nullable, sem regra própria no legado — só enviados com Emite NFe = Sim
      // (campos ocultos quando Não; UT-000766).
      payload.ultimo_numero_cte = data.ultimo_numero_cte;
      payload.numero_serie_cte = data.numero_serie_cte;
      payload.ultimo_numero_mdfe = data.ultimo_numero_mdfe;
      payload.numero_serie_mdfe = data.numero_serie_mdfe;
    }

    try {
      if (isEditing && issuerUuid) {
        return await updateIssuer(issuerUuid, payload);
      }

      return await createIssuer(payload);
    } catch (error) {
      // 422 flat `nfe_series.N.campo` -> erro no campo da linha (o toast genérico
      // do useRequest continua sendo exibido).
      applyNfeSeriesServerErrors(error, setError as any);
      throw error;
    }
  }

  const hasArrayChange = numbersDirty || farmsDirty;

  // Guard de onSubmit (Lei 2) + fator adicional `!hasArrayChange` — mesmo
  // racional de `!hasImageChange` em CreateOrUpdateFamiliaBens.tsx (arrays
  // não-RHF não sujam `dirtyFields`; sem esse fator, uma edição só neles
  // seria descartada em silêncio).
  async function onSubmit(data: IssuerFormType) {
    // Explícito (o util `isEmpty` do projeto é invertido): sem nenhuma alteração
    // nos campos RHF nem nos arrays, edição apenas volta sem salvar.
    const hasFieldChange = Object.keys(dirtyFields).length > 0;
    if (isEditing && !hasFieldChange && !hasArrayChange) {
      navigate(-1);
    } else {
      await issuerMutation.mutateAsync(data);
    }
  }

  const isSubmitting = issuerMutation.isPending;

  // ---- Confirmação Homologação→Produção (contrato §5.2) ---------------------
  const {
    open: isAmbienteConfirmOpen,
    onOpen: onOpenAmbienteConfirm,
    onClose: onCloseAmbienteConfirm,
  } = useDisclosure();
  const [pendingAmbiente, setPendingAmbiente] = useState<IssuerAmbienteSlug | ''>('');

  function handleAmbienteChange(opt: Option<string> | null) {
    const newValue = (opt?.value as IssuerAmbienteSlug | '') ?? '';
    const currentValue = watch('ambiente');
    if (newValue === 'producao' && currentValue !== 'producao') {
      setPendingAmbiente(newValue);
      onOpenAmbienteConfirm();
      return;
    }
    setValue('ambiente', newValue, { shouldDirty: true, shouldValidate: true });
  }

  function confirmAmbienteChange() {
    if (pendingAmbiente) {
      setValue('ambiente', pendingAmbiente, { shouldDirty: true, shouldValidate: true });
    }
    setPendingAmbiente('');
    onCloseAmbienteConfirm();
  }

  const watchedIssuesNfe = watch('issues_nfe');

  // ---- Autofill de CEP (UT-000766) — molde `useProviderFormController`:
  // blur com 8 dígitos -> ViaCEP + cidade por IBGE; chamadas serializadas
  // (o último blur escreve por último); NUNCA sobrescreve campo editado pelo
  // usuário (`getFieldState().isDirty`) nem limpa o endereço em caso de falha
  // (toast + preenchimento manual segue disponível).
  const autofillChainRef = useRef<Promise<void>>(Promise.resolve());
  const cepText = text.form.cepAutofill;

  function fillIfNotEdited(name: 'rua' | 'bairro', value: string) {
    if (!value || getFieldState(name).isDirty) return;
    setValue(name, value, { shouldValidate: true });
  }

  async function runCepAutofill(digits: string) {
    try {
      const viaCep = await getAddressByCep(digits);
      if (!viaCep) {
        toaster.create({
          type: 'warning',
          title: cepText.notFound.title,
          description: cepText.notFound.description,
        });
        return;
      }

      fillIfNotEdited('rua', viaCep.logradouro);
      fillIfNotEdited('bairro', viaCep.bairro);

      const city = await getCityByIso(Number(viaCep.ibge));
      if (!city) {
        toaster.create({
          type: 'warning',
          title: cepText.cityNotResolved.title,
          description: cepText.cityNotResolved.description,
        });
        return;
      }
      if (!getFieldState('cidade_uuid').isDirty) {
        setValue(
          'cidade_uuid',
          {
            label: [city.title, city.state?.letter].filter(Boolean).join(' — '),
            value: city.uuid,
          },
          { shouldValidate: true }
        );
      }
    } catch {
      toaster.create({
        type: 'error',
        title: cepText.networkError.title,
        description: cepText.networkError.description,
      });
    }
  }

  function handleCepBlur(event: FocusEvent<HTMLInputElement>) {
    const digits = cleanMask(event.target.value ?? '');
    if (digits.length !== 8 || !canSave) return;
    autofillChainRef.current = autofillChainRef.current.then(() => runCepAutofill(digits));
  }

  const isEnabledOptions: Option<boolean>[] = [
    { value: true, label: text.form.isEnabledOptions.active },
    { value: false, label: text.form.isEnabledOptions.inactive },
  ];
  const issuesNfeOptions: Option<boolean>[] = [
    { value: true, label: text.form.issuesNfeOptions.yes },
    { value: false, label: text.form.issuesNfeOptions.no },
  ];
  const ambienteOptions: Option<string>[] = [
    { value: 'producao', label: text.form.ambienteOptions.producao },
    { value: 'homologacao', label: text.form.ambienteOptions.homologacao },
  ];
  const regimeOptions: Option<string>[] = [
    { value: 'simples_nacional', label: text.form.regimeOptions.simplesNacional },
    { value: 'normal', label: text.form.regimeOptions.normal },
  ];

  const spedProfileOptions: Option<string>[] = [
    { value: 'A', label: text.form.spedProfileOptions.A },
    { value: 'B', label: text.form.spedProfileOptions.B },
    { value: 'C', label: text.form.spedProfileOptions.C },
  ];

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      headerActions={
        isEditing && canManageCertificate ? (
          <Button
            title={text.certificate.title}
            variant="outline"
            onClick={() => navigate(`/cadastros-base/emissores/${issuerUuid}/certificado`)}
          />
        ) : undefined
      }
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="secondary"
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
        {/* ---- Seção: Informações Gerais ------------------------------------ */}
        <Text fontSize="sm" fontWeight="bold" color="brandColorText" textTransform="uppercase">
          {text.form.sections.generalInfo}
        </Text>
        <SimpleGrid columns={columnsForm.default} gap={6} mt={3}>
          <Input
            label={text.form.fields.razaoSocial}
            placeholder={text.form.placeholders.razaoSocial}
            {...register('razao_social')}
            error={errors.razao_social?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />
          <Input
            label={text.form.fields.nomeFantasia}
            placeholder={text.form.placeholders.nomeFantasia}
            {...register('nome_fantasia')}
            error={errors.nome_fantasia?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="cpf_cnpj"
            control={control}
            render={({ field, fieldState }) => (
              <MaskedInput
                kind="cpfCnpj"
                label={text.form.fields.cpfCnpj}
                name={field.name}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Input
            label={text.form.fields.email}
            type="email"
            {...register('email')}
            error={errors.email?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.isEnabled}
                name={name}
                value={isEnabledOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={isEnabledOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <MaskedInput
            kind="phone"
            label={text.form.fields.telefone}
            {...register('telefone')}
            error={errors.telefone?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="cep"
            control={control}
            render={({ field, fieldState }) => (
              <MaskedInput
                kind="cep"
                label={text.form.fields.cep}
                name={field.name}
                placeholder={text.form.placeholders.cep}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={(event) => {
                  field.onBlur();
                  handleCepBlur(event);
                }}
                error={fieldState.error?.message}
                isRequired
                disabled={!canSave || isLoading}
              />
            )}
          />

          <Input
            label={text.form.fields.rua}
            {...register('rua')}
            error={errors.rua?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />
          <Input
            label={text.form.fields.numero}
            {...register('numero')}
            error={errors.numero?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />
          <Input
            label={text.form.fields.bairro}
            {...register('bairro')}
            error={errors.bairro?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="cidade_uuid"
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.cidade}
                placeholder={text.form.cidade.placeholder}
                service={listCityOptions}
                mapOptions={(item: CityListItem) => ({
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
                valueColor="var(--chakra-colors-semantic-neutral-900)"
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </SimpleGrid>

        {/* ---- Seção: Configuração Fiscal (condicional por issues_nfe, §5.1) */}
        <Text
          fontSize="sm"
          fontWeight="bold"
          color="brandColorText"
          textTransform="uppercase"
          mt={8}
        >
          {text.form.sections.fiscalConfig}
        </Text>
        <SimpleGrid columns={columnsForm.default} gap={6} mt={3}>
          <Controller
            name="issues_nfe"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.issuesNfe}
                name={name}
                value={issuesNfeOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                options={issuesNfeOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Input
            label={text.form.fields.cnae}
            {...register('cnae')}
            error={errors.cnae?.message}
            maxLength={20}
            loading={isLoading}
            disabled={!canSave}
          />
          <Controller
            name="sped_profile"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.spedProfile}
                placeholder={text.form.spedProfilePlaceholder}
                name={name}
                value={spedProfileOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<string> | null) => onChange(opt?.value ?? '')}
                options={spedProfileOptions}
                error={error?.message}
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          {/* Bloco condicional (required_if:issues_nfe,true no backend) */}
          {watchedIssuesNfe && (
            <>
              <Input
                label={text.form.fields.autXml}
                {...register('aut_xml')}
                error={errors.aut_xml?.message}
                maxLength={18}
                loading={isLoading}
                disabled={!canSave}
              />
              <Controller
                name="ultimo_numero_cte"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.ultimoNumeroCte}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    decimalPlaces={0}
                    disabled={!canSave || isLoading}
                  />
                )}
              />
              <Controller
                name="numero_serie_cte"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.numeroSerieCte}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    decimalPlaces={0}
                    disabled={!canSave || isLoading}
                  />
                )}
              />
              <Controller
                name="ultimo_numero_mdfe"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.ultimoNumeroMdfe}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    decimalPlaces={0}
                    disabled={!canSave || isLoading}
                  />
                )}
              />
              <Controller
                name="numero_serie_mdfe"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    name={field.name}
                    label={text.form.fields.numeroSerieMdfe}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    decimalPlaces={0}
                    disabled={!canSave || isLoading}
                  />
                )}
              />

              <Controller
                name="ambiente"
                control={control}
                render={({ field: { name, value }, fieldState: { error } }) => (
                  <Select
                    label={text.form.fields.ambiente}
                    name={name}
                    value={ambienteOptions.find((option) => option.value === value) ?? null}
                    onChange={handleAmbienteChange}
                    options={ambienteOptions}
                    error={error?.message}
                    isRequired
                    noClearable
                    isDisabled={!canSave || isAmbienteLocked}
                    helperText={isAmbienteLocked ? text.form.ambienteLockedHelp : undefined}
                    loading={isLoading}
                  />
                )}
              />
              <Controller
                name="regime"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <Select
                    label={text.form.fields.regime}
                    name={name}
                    value={regimeOptions.find((option) => option.value === value) ?? null}
                    onChange={(opt: Option<string> | null) => onChange(opt?.value ?? '')}
                    options={regimeOptions}
                    error={error?.message}
                    isRequired
                    noClearable
                    isDisabled={!canSave}
                    loading={isLoading}
                  />
                )}
              />
            </>
          )}
        </SimpleGrid>

        {/* ---- Seção: Séries de NF-e (UT-000780; só com Emite NFe = Sim) ------ */}
        {watchedIssuesNfe && (
          <>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color="brandColorText"
              textTransform="uppercase"
              mt={8}
            >
              {text.form.sections.nfeSeries}
            </Text>
            <Box mt={3}>
              <SeriesNfeField
                control={control}
                errors={errors}
                setValue={setValue}
                getValues={getValues}
                text={text.form}
                canSave={canSave}
                isLoading={isLoading}
              />
            </Box>
          </>
        )}

        {/* ---- Seção: Fazendas Vinculadas ------------------------------------ */}
        <Text
          fontSize="sm"
          fontWeight="bold"
          color="brandColorText"
          textTransform="uppercase"
          mt={8}
        >
          {text.form.sections.farms}
        </Text>
        <Box mt={3}>
          <CheckboxListField
            label={text.form.sections.farms}
            items={farmItems}
            selectedValues={farmUuids}
            onChange={handleFarmsChange}
            searchValue={farmSearchValue}
            onSearchChange={setFarmSearchValue}
            searchPlaceholder={text.form.farms.searchPlaceholder}
            selectAllLabel={text.form.farms.selectAllLabel}
            deselectAllLabel={text.form.farms.deselectAllLabel}
            selectedCountLabel={text.form.farms.selectedCountLabel}
            emptyLabel={text.form.farms.emptyLabel}
            isLoading={farmsQuery.isLoading}
            isError={farmsQuery.isError}
            errorLabel={text.form.farms.errorLabel}
            onRetry={() => farmsQuery.refetch()}
            retryLabel={text.form.farms.retryLabel}
            isDisabled={!canSave}
          />
        </Box>

        {/* ---- Seção: Inscrições Estaduais (numbers[], GAP-FE-112) ----------- */}
        <Text
          fontSize="sm"
          fontWeight="bold"
          color="brandColorText"
          textTransform="uppercase"
          mt={8}
        >
          {text.form.sections.stateRegistrations}
          {/* Asterisco no mesmo padrão do Field (RequiredIndicator): numbers é obrigatório (min 1) */}
          <Text as="span" color="feedBack.errorMain" ml="1">
            *
          </Text>
        </Text>
        <Box mt={3}>
          {numbers.length === 0 && (
            <Text fontSize="sm" color="fg.muted" mb={2}>
              {text.form.stateRegistrations.empty}
            </Text>
          )}
          <SimpleGrid columns={columnsForm.default} gap={4}>
            {numbers.map((value, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <Box key={index} display="flex" alignItems="flex-end" gap={2}>
                <Box flex="1">
                  <MaskedInput
                    kind="digits"
                    name={`numbers.${index}`}
                    label={index === 0 ? text.form.stateRegistrations.placeholder : undefined}
                    placeholder={text.form.stateRegistrations.placeholder}
                    maxLength={20}
                    value={value}
                    onChange={(event) => handleChangeNumber(index, event.target.value)}
                    disabled={!canSave}
                  />
                </Box>
                <Button
                  title=""
                  variant="ghost_danger"
                  icon={FiTrash2 as ElementType}
                  tooltip={text.form.stateRegistrations.removeItem}
                  onClick={() => handleRemoveNumber(index)}
                  disabled={!canSave}
                />
              </Box>
            ))}
          </SimpleGrid>
          {errors.numbers?.message && (
            <ChakraField.Root invalid mt={2}>
              <ChakraField.ErrorText role="alert">{errors.numbers.message}</ChakraField.ErrorText>
            </ChakraField.Root>
          )}
          <Button
            title={text.form.stateRegistrations.addItem}
            variant="outline"
            mt={3}
            icon={FiPlus as ElementType}
            onClick={handleAddNumber}
            disabled={!canSave}
          />
        </Box>
      </Form>

      <DeleteConfirmDialog
        isOpen={isAmbienteConfirmOpen}
        onClose={onCloseAmbienteConfirm}
        onConfirm={confirmAmbienteChange}
        title={text.form.ambienteConfirm.title}
        description={text.form.ambienteConfirm.description}
        confirmButtonText={text.form.ambienteConfirm.confirmButtonText}
        colorPalette="blue"
        warningText=""
      />
    </FormContainer>
  );
}
