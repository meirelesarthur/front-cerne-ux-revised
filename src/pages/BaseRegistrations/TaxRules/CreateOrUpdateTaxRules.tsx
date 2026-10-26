// src/pages/BaseRegistrations/TaxRules/CreateOrUpdateTaxRules.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO e EDIÇÃO de REGRA FISCAL (mesmo arquivo para os dois casos).
// Rotas: /cadastros-base/regras-fiscais/novo (criar) e
// /cadastros-base/regras-fiscais/:taxRuleId (editar, GUID) — ambas
// registradas em src/router/index.tsx (TASK-FE-114), guardadas por
// `tax-rules_view`.
//
// PARTE 1 (TASK-FE-112) — seções "Identificação" (2 campos) e "Fiscal
// Clássico" (17 campos) — tela funcional e salvável de ponta a ponta.
// PARTE 2 (TASK-FE-113, ADITIVA ao mesmo arquivo/useForm) — seções "Reforma
// Tributária — IBS/CBS/IS" e "Zona Franca de Manaus / Doação" (18 campos,
// TODOS `nullable`, contrato de API §10). Nenhum componente novo criado —
// só mais `Controller`/JSX dentro do MESMO `<Form>`, entre "Fiscal Clássico"
// e o `FormFooter`.
//
// Estrutura mecânica idêntica a CadastrosBase/GruposProduto/
// CreateOrUpdateGrupoProduto.tsx (payload sempre completo, guard `isEmpty`
// CORRIGIDO — ERRO-FE-001) + `CreateOrUpdateCentroCusto.tsx` (`NumberInput`
// para os campos percentuais) + seções ad hoc de `Parametrizacoes/index.tsx`
// (`Heading`+`Box` com borda, sem componente de card compartilhado novo).
//
// 10 Selects do formulário inteiro alimentados por UM ÚNICO fetch
// (`useTaxRuleOptions`, TASK-FE-110) — nunca um `useQuery` por campo:
// `cst_csosn`/`cst_csosn_exp` reaproveitam a chave `cst_csosn`;
// `cst_pis`/`cst_cofins` reaproveitam `cst_pis_cofins`;
// `cst_ipi`/`cenq_ipi`/`origem`/`modality_bc`/`cst_ibs_cbs`/
// `tp_cred_pres_ibs_zfm` uma chave cada. `is_enabled`/`ind_doacao` são
// genéricos Sim-Não/Ativo-Inativo (D3 do Maestro, NUNCA `Switch`) — não vêm
// de `/options`.
//
// 422 por campo: mesmo padrão LOCAL já usado em Bancos/CreateOrUpdateBanco.tsx
// (`useRequest.tsx` não tem `onError` customizável) — aqui GENERALIZADO para
// os 33 campos (percorre `error.response.data.errors` e chama `setError` por
// chave), já que não há como fixar uma mensagem por campo como o caso pontual
// do Banco.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, Heading, SimpleGrid } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import {
  isMotDesIcmsVisible,
  isPercDifVisible,
  isPercFcpVisible,
  normalizePercFcp,
  sanitizeC1ForCst,
} from '@/constants/Fiscal/fiscal-field-visibility';
import { getMotDesIcmsOptions } from '@/constants/Fiscal/mot-des-icms-catalog';
import { queryKey } from '@/constants/query-key';

import { taxRuleSchemaResolver } from '@/validations/schemas/BaseRegistrations/tax-rule-schema';

import {
  createTaxRule,
  getTaxRuleByUuid,
  getTaxRuleOptions,
  updateTaxRule,
} from '@/services/v2/TaxRules/tax-rule-service';

import type { Option } from '@/@types/option';
import type {
  TaxRuleData,
  TaxRuleForm as TaxRuleFormType,
  TaxRuleOptionsData,
  TaxRulePayload,
} from '@/@types/v2/TaxRules';

// Defaults neutros dos 19 campos da Reforma Tributária/ZFM/Doação (UI só em
// TASK-FE-113) — mantém o payload sempre completo desde já.
const taxReformDefaults = {
  c_class_trib: null,
  cst_ibs_cbs: null,
  perc_ibs_uf: null,
  perc_ibs_mun: null,
  perc_reducao_aliq_ibs_uf: null,
  perc_reducao_aliq_ibs_mun: null,
  perc_dif_ibs_uf: null,
  perc_dif_ibs_mun: null,
  perc_cbs: null,
  perc_reducao_aliq_cbs: null,
  perc_dif_cbs: null,
  cst_is: null,
  perc_is: null,
  perc_is_espec: null,
  ad_rem_ibs: null,
  ad_rem_cbs: null,
  tp_cred_pres_ibs_zfm: null,
  ind_doacao: null,
} as const;

export default function CreateOrUpdateTaxRules() {
  const { taxRuleId } = useParams<{ taxRuleId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:taxRuleId` — é uma rota irmã distinta registrada em router/index.tsx).
  const isEditing = isValidGuid(taxRuleId);

  // Guard de navegação: um `taxRuleId` presente mas que NÃO é um GUID válido
  // não deve chegar ao hook de query nem renderizar um form "fantasma" —
  // redireciona para a listagem, mesmo racional de
  // CreateOrUpdateGrupoProduto.tsx/CreateOrUpdateBanco.tsx.
  useEffect(() => {
    if (taxRuleId && !isValidGuid(taxRuleId)) {
      navigate('/cadastros-base/regras-fiscais', { replace: true });
    }
  }, [taxRuleId, navigate]);

  const text = languageGB.taxRules.taxRule;

  const isEnabledOptions: Option<string>[] = [
    { value: 'true', label: text.form.isEnabledOptions.active },
    { value: 'false', label: text.form.isEnabledOptions.inactive },
  ];

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<TaxRuleFormType>({
    mode: 'onChange',
    resolver: taxRuleSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      is_enabled: 'true',
      cfop_saida_interno: '',
      cfop_saida_externo: '',
      cst_csosn: '',
      cst_csosn_exp: null,
      cst_pis: '',
      cst_cofins: '',
      cst_ipi: '',
      perc_icms: 0,
      perc_pis: 0,
      perc_cofins: 0,
      perc_ipi: 0,
      percent_reduction: 0,
      mot_des_icms: null,
      perc_dif: null,
      perc_fcp: null,
      origem: '',
      cest: null,
      modality_bc: 0,
      cenq_ipi: '',
      cbenef: null,
      ...taxReformDefaults,
    },
  });

  // Lei 2 (fillForm nomeada) — guarda CORRETA (`!isEmpty`, ERRO-FE-001):
  // `isEmpty()` é MAL NOMEADA (retorna `true` quando o objeto TEM chaves) —
  // `!isEmpty(dirtyFields)` só é `true` quando NADA foi tocado ainda.
  function fillForm(data: TaxRuleData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        name: data.name,
        is_enabled: data.is_enabled ? 'true' : 'false',
        cfop_saida_interno: data.cfop_saida_interno,
        cfop_saida_externo: data.cfop_saida_externo,
        cst_csosn: data.cst_csosn,
        cst_csosn_exp: data.cst_csosn_exp,
        cst_pis: data.cst_pis,
        cst_cofins: data.cst_cofins,
        cst_ipi: data.cst_ipi,
        perc_icms: data.perc_icms,
        perc_pis: data.perc_pis,
        perc_cofins: data.perc_cofins,
        perc_ipi: data.perc_ipi,
        percent_reduction: data.percent_reduction,
        mot_des_icms: data.mot_des_icms ?? null,
        perc_dif: data.perc_dif ?? null,
        perc_fcp: data.perc_fcp ?? null,
        origem: data.origem,
        cest: data.cest,
        modality_bc: data.modality_bc,
        cenq_ipi: data.cenq_ipi,
        cbenef: data.cbenef,
        c_class_trib: data.c_class_trib,
        cst_ibs_cbs: data.cst_ibs_cbs,
        perc_ibs_uf: data.perc_ibs_uf,
        perc_ibs_mun: data.perc_ibs_mun,
        perc_reducao_aliq_ibs_uf: data.perc_reducao_aliq_ibs_uf,
        perc_reducao_aliq_ibs_mun: data.perc_reducao_aliq_ibs_mun,
        perc_dif_ibs_uf: data.perc_dif_ibs_uf,
        perc_dif_ibs_mun: data.perc_dif_ibs_mun,
        perc_cbs: data.perc_cbs,
        perc_reducao_aliq_cbs: data.perc_reducao_aliq_cbs,
        perc_dif_cbs: data.perc_dif_cbs,
        cst_is: data.cst_is,
        perc_is: data.perc_is,
        perc_is_espec: data.perc_is_espec,
        ad_rem_ibs: data.ad_rem_ibs,
        ad_rem_cbs: data.ad_rem_cbs,
        tp_cred_pres_ibs_zfm: data.tp_cred_pres_ibs_zfm,
        ind_doacao: data.ind_doacao === null ? null : data.ind_doacao ? 'true' : 'false',
      });
    }
  }

  const taxRuleQuery = useCustomFormQueryByGuid<TaxRuleData>({
    registrationId: isEditing ? taxRuleId : undefined,
    queryKey: queryKey.taxRules.detail,
    asyncFunction: getTaxRuleByUuid,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([taxRuleQuery as any]);

  // 10 Selects do formulário inteiro (8 da Parte 1 + 2 da Parte 2,
  // TASK-FE-113) alimentados por UM ÚNICO fetch — `staleTime: Infinity`,
  // nenhum request extra por campo. `/tax-rules/options` não é paginado nem
  // gated por farm/permissão: `useQuery` DIRETO do TanStack (não a família
  // useCustomGridQuery*/useCustomFormQuery*), dado 100% hardcoded no backend.
  const optionsQuery = useQuery({
    queryKey: [queryKey.taxRules.options],
    queryFn: async () => {
      const response = await getTaxRuleOptions();
      return response.data as TaxRuleOptionsData;
    },
    staleTime: Infinity,
  });
  const options = optionsQuery.data;
  const isOptionsLoading = optionsQuery.isLoading;

  const cstCsosnOptions = options?.cst_csosn ?? [];
  // C1: visibilidade/dominio dos campos pelo CST do proprio formulario.
  const watchedCst = watch('cst_csosn');
  const showMotDesIcms = isMotDesIcmsVisible(watchedCst);
  const showPercDif = isPercDifVisible(watchedCst);
  const showPercFcp = isPercFcpVisible(watchedCst);
  const motDesIcmsOptions = getMotDesIcmsOptions(watchedCst);
  const cstPisCofinsOptions = options?.cst_pis_cofins ?? [];
  const cstIpiOptions = options?.cst_ipi ?? [];
  const cenqIpiOptions = options?.cenq_ipi ?? [];
  const origemOptions = options?.origem ?? [];
  const modalityBcOptions = options?.modality_bc ?? [];
  // -- Parte 2 (TASK-FE-113) — mesmo `optionsQuery` acima, sem request novo --
  const cstIbsCbsOptions = options?.cst_ibs_cbs ?? [];
  const tpCredPresIbsZfmOptions = options?.tp_cred_pres_ibs_zfm ?? [];

  // `ind_doacao` (Parte 2) — Select "Sim/Não" clearable (3 estados reais do
  // legado: ''/'1' → aqui null/'true'/'false'), MESMO componente genérico de
  // `is_enabled`, mas SEM `noClearable` (permite limpar → `null` no payload).
  const booleanOptions: Option<string>[] = [
    { value: 'true', label: text.form.booleanOptions.yes },
    { value: 'false', label: text.form.booleanOptions.no },
  ];

  // Sem flags de autorização por item no `TaxRuleResource` — permissão
  // GLOBAL basta (mesmo padrão de GruposProduto/Vacinas CreateOrUpdate*.tsx).
  const canSave = isEditing ? can('tax-rules_edit') : can('tax-rules_create');

  const taxRuleMutation = useRequest({
    asyncFunction: tryPersistTaxRule,
    entityName: text.singularLabel,
    queryKey: queryKey.taxRules.list,
    queryKey2: queryKey.taxRules.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Payload SEMPRE completo (create/update — TaxRuleRequest::rules() não
  // diferencia por verbo, contrato de API §9/§10).
  async function tryPersistTaxRule(data: TaxRuleFormType) {
    const payload: TaxRulePayload = {
      name: data.name.trim(),
      is_enabled: data.is_enabled === 'true',
      cfop_saida_interno: data.cfop_saida_interno.trim(),
      cfop_saida_externo: data.cfop_saida_externo.trim(),
      cst_csosn: data.cst_csosn,
      cst_csosn_exp: data.cst_csosn_exp || null,
      cst_pis: data.cst_pis,
      cst_cofins: data.cst_cofins,
      cst_ipi: data.cst_ipi,
      perc_icms: Number(data.perc_icms),
      perc_pis: Number(data.perc_pis),
      perc_cofins: Number(data.perc_cofins),
      perc_ipi: Number(data.perc_ipi),
      percent_reduction: Number(data.percent_reduction),
      // C1 (D-101-19): campos ocultos pelo CST saem como null; FCP 0/vazio -> null (P-F2).
      ...sanitizeC1ForCst(data.cst_csosn, {
        mot_des_icms: data.mot_des_icms,
        perc_dif: data.perc_dif,
        perc_fcp: data.perc_fcp,
      }),
      origem: data.origem,
      cest: data.cest?.trim() || null,
      modality_bc: Number(data.modality_bc),
      cenq_ipi: data.cenq_ipi,
      cbenef: data.cbenef?.trim() || null,
      // -- Reforma Tributária / ZFM / Doação (TASK-FE-113 popula a UI; o
      //    payload já sai completo desde esta Parte) --
      c_class_trib: data.c_class_trib || null,
      cst_ibs_cbs: data.cst_ibs_cbs || null,
      perc_ibs_uf:
        data.perc_ibs_uf === null || data.perc_ibs_uf === undefined
          ? null
          : Number(data.perc_ibs_uf),
      perc_ibs_mun:
        data.perc_ibs_mun === null || data.perc_ibs_mun === undefined
          ? null
          : Number(data.perc_ibs_mun),
      perc_reducao_aliq_ibs_uf:
        data.perc_reducao_aliq_ibs_uf === null || data.perc_reducao_aliq_ibs_uf === undefined
          ? null
          : Number(data.perc_reducao_aliq_ibs_uf),
      perc_reducao_aliq_ibs_mun:
        data.perc_reducao_aliq_ibs_mun === null || data.perc_reducao_aliq_ibs_mun === undefined
          ? null
          : Number(data.perc_reducao_aliq_ibs_mun),
      perc_dif_ibs_uf:
        data.perc_dif_ibs_uf === null || data.perc_dif_ibs_uf === undefined
          ? null
          : Number(data.perc_dif_ibs_uf),
      perc_dif_ibs_mun:
        data.perc_dif_ibs_mun === null || data.perc_dif_ibs_mun === undefined
          ? null
          : Number(data.perc_dif_ibs_mun),
      perc_cbs:
        data.perc_cbs === null || data.perc_cbs === undefined ? null : Number(data.perc_cbs),
      perc_reducao_aliq_cbs:
        data.perc_reducao_aliq_cbs === null || data.perc_reducao_aliq_cbs === undefined
          ? null
          : Number(data.perc_reducao_aliq_cbs),
      perc_dif_cbs:
        data.perc_dif_cbs === null || data.perc_dif_cbs === undefined
          ? null
          : Number(data.perc_dif_cbs),
      cst_is: data.cst_is || null,
      perc_is: data.perc_is === null || data.perc_is === undefined ? null : Number(data.perc_is),
      perc_is_espec:
        data.perc_is_espec === null || data.perc_is_espec === undefined
          ? null
          : Number(data.perc_is_espec),
      ad_rem_ibs:
        data.ad_rem_ibs === null || data.ad_rem_ibs === undefined ? null : Number(data.ad_rem_ibs),
      ad_rem_cbs:
        data.ad_rem_cbs === null || data.ad_rem_cbs === undefined ? null : Number(data.ad_rem_cbs),
      tp_cred_pres_ibs_zfm:
        data.tp_cred_pres_ibs_zfm === null || data.tp_cred_pres_ibs_zfm === undefined
          ? null
          : Number(data.tp_cred_pres_ibs_zfm),
      ind_doacao:
        data.ind_doacao === null || data.ind_doacao === undefined
          ? null
          : data.ind_doacao === 'true',
    };

    try {
      return isEditing && taxRuleId
        ? await updateTaxRule(taxRuleId, payload)
        : await createTaxRule(payload);
    } catch (error) {
      // 422 por campo — mapeamento GENÉRICO (mesmo racional de
      // CreateOrUpdateBanco.tsx, mas percorrendo todas as chaves recebidas em
      // vez de checar uma única): useRequest.tsx não tem `onError`
      // customizável, então o `setError` é LOCAL, por cima do try/catch. O
      // `throw` preserva o toast genérico de useRequest (soma, não
      // substitui).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        if (fieldErrors) {
          Object.entries(fieldErrors).forEach(([field, messagesForField]) => {
            if (messagesForField?.[0]) {
              setError(field as keyof TaxRuleFormType, {
                type: 'server',
                message: messagesForField[0],
              });
            }
          });
        }
      }
      throw error;
    }
  }

  // Guard do submit — forma CORRIGIDA (ERRO-FE-001): `isEmpty(dirtyFields)`
  // SEM negação já é `true` quando HÁ mudança real (nome enganoso da
  // utilidade). Em edição sem nenhum campo tocado, só volta (sem chamada de
  // rede). Em criação, sempre dispara.
  async function onSubmit(data: TaxRuleFormType) {
    if (isEditing && isEmpty(dirtyFields)) {
      await taxRuleMutation.mutateAsync(data);
      return;
    }

    if (isEditing) {
      navigate(-1);
      return;
    }

    await taxRuleMutation.mutateAsync(data);
  }

  const isSubmitting = taxRuleMutation.isPending;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
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
        <Heading size="sm" fontWeight="600" mb={4}>
          {text.form.sections.identification}
        </Heading>
        <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={6} mb={6}>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Input
              label={text.form.fields.name}
              {...register('name')}
              error={errors.name?.message}
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
                  value={isEnabledOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<string> | null) =>
                    onChange(opt?.value as TaxRuleFormType['is_enabled'])
                  }
                  options={isEnabledOptions}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave}
                  loading={isLoading}
                />
              )}
            />
          </SimpleGrid>
        </Box>

        <Heading size="sm" fontWeight="600" mb={4}>
          {text.form.sections.fiscalClassic}
        </Heading>
        <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={6} mb={6}>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Input
              label={text.form.fields.cfopSaidaInterno}
              maxLength={4}
              {...register('cfop_saida_interno')}
              error={errors.cfop_saida_interno?.message}
              isRequired
              loading={isLoading}
              disabled={!canSave}
            />

            <Input
              label={text.form.fields.cfopSaidaExterno}
              maxLength={4}
              {...register('cfop_saida_externo')}
              error={errors.cfop_saida_externo?.message}
              isRequired
              loading={isLoading}
              disabled={!canSave}
            />

            <Controller
              name="cst_csosn"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.cstCsosn}
                  name={name}
                  value={cstCsosnOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<string> | null) => {
                    onChange(opt?.value);
                    // C1: troca de CST limpa o que deixa de pertencer ao novo CST.
                    const current = getValues();
                    const clean = sanitizeC1ForCst(opt?.value, {
                      mot_des_icms: current.mot_des_icms,
                      perc_dif: current.perc_dif,
                      perc_fcp: current.perc_fcp,
                    });
                    (Object.keys(clean) as (keyof typeof clean)[]).forEach((key) => {
                      if ((current[key] ?? null) !== clean[key]) {
                        setValue(key, clean[key], { shouldDirty: true, shouldValidate: true });
                      }
                    });
                  }}
                  options={cstCsosnOptions}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave}
                  loading={isLoading || isOptionsLoading}
                />
              )}
            />

            <Controller
              name="cst_csosn_exp"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.cstCsosnExp}
                  name={name}
                  value={cstCsosnOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                  options={cstCsosnOptions}
                  error={error?.message}
                  isDisabled={!canSave}
                  loading={isLoading || isOptionsLoading}
                />
              )}
            />

            <Controller
              name="cst_pis"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.cstPis}
                  name={name}
                  value={cstPisCofinsOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<string> | null) => onChange(opt?.value)}
                  options={cstPisCofinsOptions}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave}
                  loading={isLoading || isOptionsLoading}
                />
              )}
            />

            <Controller
              name="cst_cofins"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.cstCofins}
                  name={name}
                  value={cstPisCofinsOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<string> | null) => onChange(opt?.value)}
                  options={cstPisCofinsOptions}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave}
                  loading={isLoading || isOptionsLoading}
                />
              )}
            />

            <Controller
              name="cst_ipi"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.cstIpi}
                  name={name}
                  value={cstIpiOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<string> | null) => onChange(opt?.value)}
                  options={cstIpiOptions}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave}
                  loading={isLoading || isOptionsLoading}
                />
              )}
            />

            <Controller
              name="perc_icms"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <NumberInput
                  allowDot
                  name={name}
                  label={text.form.fields.percIcms}
                  value={value ?? null}
                  onValueChange={(value) => onChange(value)}
                  min={0}
                  max={999.99}
                  decimalPlaces={2}
                  error={error?.message}
                  isRequired
                  disabled={!canSave}
                />
              )}
            />

            <Controller
              name="perc_pis"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <NumberInput
                  allowDot
                  name={name}
                  label={text.form.fields.percPis}
                  value={value ?? null}
                  onValueChange={(value) => onChange(value)}
                  min={0}
                  max={999.99}
                  decimalPlaces={2}
                  error={error?.message}
                  isRequired
                  disabled={!canSave}
                />
              )}
            />

            <Controller
              name="perc_cofins"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <NumberInput
                  allowDot
                  name={name}
                  label={text.form.fields.percCofins}
                  value={value ?? null}
                  onValueChange={(value) => onChange(value)}
                  min={0}
                  max={999.99}
                  decimalPlaces={2}
                  error={error?.message}
                  isRequired
                  disabled={!canSave}
                />
              )}
            />

            <Controller
              name="perc_ipi"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <NumberInput
                  allowDot
                  name={name}
                  label={text.form.fields.percIpi}
                  value={value ?? null}
                  onValueChange={(value) => onChange(value)}
                  min={0}
                  max={999.99}
                  decimalPlaces={2}
                  error={error?.message}
                  isRequired
                  disabled={!canSave}
                />
              )}
            />

            <Controller
              name="percent_reduction"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <NumberInput
                  allowDot
                  name={name}
                  label={text.form.fields.percentReduction}
                  value={value ?? null}
                  onValueChange={(value) => onChange(value)}
                  min={0}
                  max={999.99}
                  decimalPlaces={2}
                  error={error?.message}
                  isRequired
                  disabled={!canSave}
                />
              )}
            />

            {showMotDesIcms && (
              <Controller
                name="mot_des_icms"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <Select
                    label={text.form.fields.motDesIcms}
                    helperText={text.form.fields.motDesIcmsHint}
                    name={name}
                    value={motDesIcmsOptions.find((o) => o.value === value) ?? null}
                    onChange={(opt: Option<number> | null) => onChange(opt?.value ?? null)}
                    options={motDesIcmsOptions}
                    error={error?.message}
                    isDisabled={!canSave}
                    loading={isLoading}
                  />
                )}
              />
            )}

            {showPercDif && (
              <Controller
                name="perc_dif"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <NumberInput
                    allowDot
                    name={name}
                    label={text.form.fields.percDif}
                    helperText={text.form.fields.percDifHint}
                    value={value ?? null}
                    onValueChange={(next) => onChange(next)}
                    min={0}
                    max={100}
                    decimalPlaces={4}
                    error={error?.message}
                    disabled={!canSave}
                  />
                )}
              />
            )}

            {showPercFcp && (
              <Controller
                name="perc_fcp"
                control={control}
                render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                  <NumberInput
                    allowDot
                    name={name}
                    label={text.form.fields.percFcp}
                    helperText={text.form.fields.percFcpHint}
                    value={value ?? null}
                    onValueChange={(next) => onChange(normalizePercFcp(next))}
                    min={0}
                    max={100}
                    decimalPlaces={4}
                    error={error?.message}
                    disabled={!canSave}
                  />
                )}
              />
            )}

            <Controller
              name="origem"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.origem}
                  name={name}
                  value={origemOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<string> | null) => onChange(opt?.value)}
                  options={origemOptions}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave}
                  loading={isLoading || isOptionsLoading}
                />
              )}
            />

            <Input
              label={text.form.fields.cest}
              maxLength={10}
              {...register('cest')}
              error={errors.cest?.message}
              loading={isLoading}
              disabled={!canSave}
            />

            <Controller
              name="modality_bc"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.modalityBc}
                  name={name}
                  value={modalityBcOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<number> | null) => onChange(opt?.value)}
                  options={modalityBcOptions}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave}
                  loading={isLoading || isOptionsLoading}
                />
              )}
            />

            <Controller
              name="cenq_ipi"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.cenqIpi}
                  name={name}
                  value={cenqIpiOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<string> | null) => onChange(opt?.value)}
                  options={cenqIpiOptions}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave}
                  loading={isLoading || isOptionsLoading}
                />
              )}
            />

            <Input
              label={text.form.fields.cbenef}
              maxLength={255}
              {...register('cbenef')}
              error={errors.cbenef?.message}
              loading={isLoading}
              disabled={!canSave}
            />
          </SimpleGrid>
        </Box>

        <Heading size="sm" fontWeight="600" mb={4}>
          {text.form.sections.taxReform}
        </Heading>
        <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={6} mb={6}>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Input
              label={text.form.fields.cClassTrib}
              {...register('c_class_trib')}
              error={errors.c_class_trib?.message}
              loading={isLoading}
              disabled={!canSave}
            />

            <Controller
              name="cst_ibs_cbs"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.cstIbsCbs}
                  name={name}
                  value={cstIbsCbsOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                  options={cstIbsCbsOptions}
                  error={error?.message}
                  isDisabled={!canSave}
                  loading={isLoading || isOptionsLoading}
                />
              )}
            />

            <Controller
              name="perc_ibs_uf"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <NumberInput
                  allowDot
                  name={name}
                  label={text.form.fields.percIbsUf}
                  value={value ?? null}
                  onValueChange={(value) => onChange(value)}
                  min={0}
                  decimalPlaces={4}
                  error={error?.message}
                  disabled={!canSave}
                />
              )}
            />

            <Controller
              name="perc_ibs_mun"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <NumberInput
                  allowDot
                  name={name}
                  label={text.form.fields.percIbsMun}
                  value={value ?? null}
                  onValueChange={(value) => onChange(value)}
                  min={0}
                  decimalPlaces={4}
                  error={error?.message}
                  disabled={!canSave}
                />
              )}
            />

            <Controller
              name="perc_reducao_aliq_ibs_uf"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <NumberInput
                  allowDot
                  name={name}
                  label={text.form.fields.percReducaoAliqIbsUf}
                  value={value ?? null}
                  onValueChange={(value) => onChange(value)}
                  min={0}
                  decimalPlaces={4}
                  error={error?.message}
                  disabled={!canSave}
                />
              )}
            />

            <Controller
              name="perc_reducao_aliq_ibs_mun"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <NumberInput
                  allowDot
                  name={name}
                  label={text.form.fields.percReducaoAliqIbsMun}
                  value={value ?? null}
                  onValueChange={(value) => onChange(value)}
                  min={0}
                  decimalPlaces={4}
                  error={error?.message}
                  disabled={!canSave}
                />
              )}
            />

            <Controller
              name="perc_dif_ibs_uf"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <NumberInput
                  allowDot
                  name={name}
                  label={text.form.fields.percDifIbsUf}
                  value={value ?? null}
                  onValueChange={(value) => onChange(value)}
                  min={0}
                  decimalPlaces={4}
                  error={error?.message}
                  disabled={!canSave}
                />
              )}
            />

            <Controller
              name="perc_dif_ibs_mun"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <NumberInput
                  allowDot
                  name={name}
                  label={text.form.fields.percDifIbsMun}
                  value={value ?? null}
                  onValueChange={(value) => onChange(value)}
                  min={0}
                  decimalPlaces={4}
                  error={error?.message}
                  disabled={!canSave}
                />
              )}
            />

            <Controller
              name="perc_cbs"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <NumberInput
                  allowDot
                  name={name}
                  label={text.form.fields.percCbs}
                  value={value ?? null}
                  onValueChange={(value) => onChange(value)}
                  min={0}
                  decimalPlaces={4}
                  error={error?.message}
                  disabled={!canSave}
                />
              )}
            />

            <Controller
              name="perc_reducao_aliq_cbs"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <NumberInput
                  allowDot
                  name={name}
                  label={text.form.fields.percReducaoAliqCbs}
                  value={value ?? null}
                  onValueChange={(value) => onChange(value)}
                  min={0}
                  decimalPlaces={4}
                  error={error?.message}
                  disabled={!canSave}
                />
              )}
            />

            <Controller
              name="perc_dif_cbs"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <NumberInput
                  allowDot
                  name={name}
                  label={text.form.fields.percDifCbs}
                  value={value ?? null}
                  onValueChange={(value) => onChange(value)}
                  min={0}
                  decimalPlaces={4}
                  error={error?.message}
                  disabled={!canSave}
                />
              )}
            />

            <Input
              label={text.form.fields.cstIs}
              {...register('cst_is')}
              error={errors.cst_is?.message}
              loading={isLoading}
              disabled={!canSave}
            />

            <Controller
              name="perc_is"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <NumberInput
                  allowDot
                  name={name}
                  label={text.form.fields.percIs}
                  value={value ?? null}
                  onValueChange={(value) => onChange(value)}
                  min={0}
                  decimalPlaces={4}
                  error={error?.message}
                  disabled={!canSave}
                />
              )}
            />

            <Controller
              name="perc_is_espec"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <NumberInput
                  allowDot
                  name={name}
                  label={text.form.fields.percIsEspec}
                  value={value ?? null}
                  onValueChange={(value) => onChange(value)}
                  min={0}
                  decimalPlaces={4}
                  error={error?.message}
                  disabled={!canSave}
                />
              )}
            />

            <Controller
              name="ad_rem_ibs"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <NumberInput
                  name={name}
                  label={text.form.fields.adRemIbs}
                  value={value ?? null}
                  onValueChange={(value) => onChange(value)}
                  min={0}
                  allowDot
                  decimalPlaces={4}
                  error={error?.message}
                  disabled={!canSave}
                />
              )}
            />

            <Controller
              name="ad_rem_cbs"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <NumberInput
                  name={name}
                  label={text.form.fields.adRemCbs}
                  value={value ?? null}
                  onValueChange={(value) => onChange(value)}
                  min={0}
                  allowDot
                  decimalPlaces={4}
                  error={error?.message}
                  disabled={!canSave}
                />
              )}
            />
          </SimpleGrid>
        </Box>

        <Heading size="sm" fontWeight="600" mb={4}>
          {text.form.sections.zfmDonation}
        </Heading>
        <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={6} mb={6}>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Controller
              name="tp_cred_pres_ibs_zfm"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.tpCredPresIbsZfm}
                  name={name}
                  value={tpCredPresIbsZfmOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<number> | null) => onChange(opt?.value ?? null)}
                  options={tpCredPresIbsZfmOptions}
                  error={error?.message}
                  isDisabled={!canSave}
                  loading={isLoading || isOptionsLoading}
                />
              )}
            />

            {/* `ind_doacao` — Select "Sim/Não" CLEARABLE (3 estados reais do
                legado, Doc Bruta Anexo: ''/'1' → aqui null/'true'/'false').
                NUNCA Switch (D3), NUNCA noClearable (permite "nenhuma
                seleção" → null no payload). */}
            <Controller
              name="ind_doacao"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.indDoacao}
                  name={name}
                  value={booleanOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                  options={booleanOptions}
                  error={error?.message}
                  isDisabled={!canSave}
                  loading={isLoading}
                />
              )}
            />
          </SimpleGrid>
        </Box>
      </Form>
    </FormContainer>
  );
}
