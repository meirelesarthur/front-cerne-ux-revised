// src/pages/CadastrosBase/NaturezaOperacao/CreateOrUpdateNaturezaOperacao.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO e EDIÇÃO de NATUREZA DE OPERAÇÃO (mesmo arquivo para os dois
// casos). Rotas: /cadastros-base/natureza-operacao/novo (criar) e
// /cadastros-base/natureza-operacao/:natureOperationId (editar, GUID) —
// registradas em src/router/index.tsx (TASK-NO-FE-02), guardadas por
// `natop_create`/`natop_edit` respectivamente. Estende os arquivos criados
// pela Tarefa irmã TASK-NO-FE-01 (service/types/hooks/query-key/i18n) — NÃO
// os recria.
//
// Ordem exata dos campos (fidelidade ao legado, requisito nº 1 do dono):
//   Grupo "Geral" (13, sempre visível) → Bloco Fiscal Clássico (16, visível
//   só com `overwrite_product=Sim`) → Reforma Tributária IBS/CBS/IS (18,
//   idem) — mirror da ordem de `_forms.blade.php`.
//
// Estrutura mecânica ADAPTADA de 2 moldes:
//   - RegrasFiscais/CreateOrUpdateRegraFiscal.tsx — bloco fiscal inteiro
//     (mesmíssimos enums/options de `useNatureOperationFiscalOptions`,
//     mesmíssimos componentes `NumberInput`/`Select`, mesma composição visual
//     `Heading` + `Box borderWidth` por seção).
//   - CentroCusto/CreateOrUpdateCentroCusto.tsx:594-646 — bloco condicional
//     grande (`watch('overwrite_product')` + unmount `{cond && <Box>...}`).
//
// 2 distinções de visibilidade (Riscos da Tarefa, NUNCA confundir):
//   - Toggle `tipo` (CFOPs Entrada/Saída, #3-8): CSS `display` — NUNCA
//     unmount. Os 4 CFOPs principais continuam SEMPRE obrigatórios e SEMPRE
//     registrados no schema, visível ou não (RN-1, contrato §7).
//   - Toggle `overwrite_product` (bloco fiscal, 34 campos): UNMOUNT
//     condicional — CORRETO aqui, pois os campos genuinamente ficam
//     opcionais/sem uso quando ocultos (RN-3, contrato §7/DA-NO-18). Valores
//     digitados antes de ocultar NÃO são apagados (RHF mantém o estado por
//     padrão, `shouldUnregister` não é setado) — só voltam a ficar
//     opcionais/fora do schema ativo.
//
// Autofill de CFOP por prefixo (Achado 1/RN-2, contrato §7): `onBlur` de
// `cfop_saida_interno`/`cfop_entrada_interno` recalcula os outros 5 campos de
// CFOP — mirror exato de `_forms.blade.php:288-312`.
//
// Autofill de Regra Fiscal (Achado 3/DA-NO-16): ao SELECIONAR (nunca no
// `fillForm`/carga de edição) uma Regra Fiscal, busca `GET /tax-rules/{uuid}`
// (`getTaxRuleByUuid`, já existe) e copia os 14 campos clássicos via
// `setValue(..., { shouldDirty: true })` — nunca `reset()`.
//
// Bug de rótulo `cst_pis`↔`cst_cofins` (Achado 4/DA-NO-15): RÓTULOS
// corrigidos ("CST PIS"/"CST COFINS", mirror `languageTaxRules.ts:64-65`) —
// o campo/coluna real (`cst_pis`/`cst_cofins`) permanece inalterado.
//
// `generate_financial` (Achado 5/RN4): semântica DIRETA (Select Sim/Não,
// `true`=gera financeiro) — NUNCA replicar a inversão do checkbox legado.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Badge, Box, Flex, Heading, Skeleton, SimpleGrid, Text } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import {
  isMotDesIcmsVisible,
  isPercDifVisible,
  isPercFcpVisible,
  normalizePercFcp,
  sanitizeC1ForCst,
} from '@/constants/Fiscal/fiscal-field-visibility';
import { getMotDesIcmsOptions } from '@/constants/Fiscal/mot-des-icms-catalog';
import { queryKey } from '@/constants/query-key';

import { listAdditionalInfos } from '@/services/v2/AdditionalInfo/additional-info-service';
import {
  createNatureOperation,
  updateNatureOperation,
} from '@/services/v2/NatureOperations/nature-operation-service';
import {
  getTaxRuleByUuid,
  listTaxRuleEntityOptions,
} from '@/services/v2/TaxRules/tax-rule-service';

import type { Option } from '@/@types/option';
import type { AdditionalInfoListItem } from '@/@types/v2/AdditionalInfo';
import type {
  NatureOperationData,
  NatureOperationForm as NatureOperationFormType,
  NatureOperationPayload,
} from '@/@types/v2/NatureOperations';
import type { TaxRuleEntityOption } from '@/@types/v2/TaxRules';

import { natureOperationSchemaResolver } from './nature-operation-schema';
import { useNatureOperationFiscalOptions, useNatureOperationForm } from './useNatureOperations';

// TipoOperacaoEnum (backend `app/Enums/NatureOperation/TipoOperacaoEnum.php`)
// — só 2 valores fixos, hardcode local aceitável (mesmo racional já usado em
// index.tsx/FilterSideNaturezaOperacao.tsx, TASK-NO-FE-01).
const TIPO_ENTRADA = 0;
const TIPO_SAIDA = 1;

// Converte string/undefined vazio para `null` (percentuais opcionais do
// bloco fiscal) — helper LOCAL para não repetir a mesma ternária ~16 vezes no
// payload (implementação, não comportamento — o valor enviado é idêntico).
function toNullableNumber(value: number | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
}

export default function CreateOrUpdateNaturezaOperacao() {
  const { natureOperationId } = useParams<{ natureOperationId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const isEditing = isValidGuid(natureOperationId);

  // Guard de navegação: um `natureOperationId` presente mas que NÃO é um GUID
  // válido não deve chegar ao hook de query nem renderizar um form "fantasma"
  // — redireciona para a listagem (mesmo racional de
  // CreateOrUpdateRegraFiscal.tsx/CreateOrUpdateGrupoProduto.tsx).
  useEffect(() => {
    if (natureOperationId && !isValidGuid(natureOperationId)) {
      navigate('/cadastros-base/natureza-operacao', { replace: true });
    }
  }, [natureOperationId, navigate]);

  const text = languageGB.natureOperations.natureOperation;

  const canSave = isEditing ? can('natop_edit') : can('natop_create');

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
  } = useForm<NatureOperationFormType>({
    mode: 'onChange',
    resolver: natureOperationSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      descricao: '',
      tipo: TIPO_SAIDA,
      cfop_saida_interno: '',
      cfop_saida_externo: '',
      cfop_saida_exportacao: null,
      cfop_entrada_interno: '',
      cfop_entrada_externo: '',
      cfop_entrada_exportacao: null,
      ativo: true,
      sobrescreve_cfop_produto: false,
      overwrite_product: false,
      generate_financial: true,
      automatic_calculation: true,
      tax_rule_uuid: null,
      additional_info_uuid: null,
      cst_csosn: null,
      cst_pis: null,
      cst_cofins: null,
      cst_ipi: null,
      perc_icms: 0,
      perc_pis: 0,
      perc_cofins: 0,
      perc_ipi: 0,
      origem: null,
      cest: null,
      cst_csosn_exp: null,
      modality_bc: null,
      percent_reduction: 0,
      mot_des_icms: null,
      perc_dif: null,
      perc_fcp: null,
      cenq_ipi: null,
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
    },
  });

  // Lei 2 (fillForm nomeada) — guarda EXPLÍCITA `Object.keys(dirtyFields).
  // length === 0` (nunca `isEmpty`/`!isEmpty` do utilitário ambíguo do
  // projeto — `src/utils/isEmpty.ts` tem nome invertido em relação ao
  // comportamento real, já causou confusão/rejeição em outros módulos).
  function fillForm(data: NatureOperationData, resetForce?: boolean) {
    if (Object.keys(dirtyFields).length === 0 || resetForce) {
      reset({
        uuid: data.uuid,
        descricao: data.descricao,
        tipo: data.tipo,
        cfop_saida_interno: data.cfop_saida_interno,
        cfop_saida_externo: data.cfop_saida_externo,
        cfop_saida_exportacao: data.cfop_saida_exportacao,
        cfop_entrada_interno: data.cfop_entrada_interno,
        cfop_entrada_externo: data.cfop_entrada_externo,
        cfop_entrada_exportacao: data.cfop_entrada_exportacao,
        ativo: data.ativo,
        sobrescreve_cfop_produto: data.sobrescreve_cfop_produto,
        overwrite_product: data.overwrite_product,
        generate_financial: data.generate_financial,
        automatic_calculation: data.automatic_calculation,
        // FKs — fonte é sempre o VÍNCULO gravado na própria Natureza de
        // Operação (sub-recursos `whenLoaded`, contrato §4.7), NUNCA os
        // valores fiscais da `TaxRule` (o autofill só ocorre na SELEÇÃO
        // manual, Achado 3 — ver `handleTaxRuleAutofill` abaixo).
        tax_rule_uuid: data.tax_rule
          ? { label: data.tax_rule.name, value: data.tax_rule.uuid }
          : null,
        additional_info_uuid: data.additional_info
          ? { label: data.additional_info.description, value: data.additional_info.uuid }
          : null,
        cst_csosn: data.cst_csosn,
        cst_pis: data.cst_pis,
        cst_cofins: data.cst_cofins,
        cst_ipi: data.cst_ipi,
        perc_icms: data.perc_icms,
        perc_pis: data.perc_pis,
        perc_cofins: data.perc_cofins,
        perc_ipi: data.perc_ipi,
        origem: data.origem,
        cest: data.cest,
        cst_csosn_exp: data.cst_csosn_exp,
        modality_bc: data.modality_bc,
        percent_reduction: data.percent_reduction,
        mot_des_icms: data.mot_des_icms ?? null,
        perc_dif: data.perc_dif ?? null,
        perc_fcp: data.perc_fcp ?? null,
        cenq_ipi: data.cenq_ipi,
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

  const natureOperationQuery = useNatureOperationForm({
    registrationId: isEditing ? natureOperationId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([natureOperationQuery as any]);
  const natureOperationData = natureOperationQuery.data;

  // 8 listas de enum fiscal — MESMO endpoint/queryKey de RegrasFiscais
  // (Achado 2 da Tarefa: `GET /tax-rules/options`, cache compartilhado, zero
  // request duplicado). Nenhum endpoint novo, nenhuma lista hardcoded
  // duplicada.
  const optionsQuery = useNatureOperationFiscalOptions();
  const options = optionsQuery.data;
  const isOptionsLoading = optionsQuery.isLoading;

  const cstCsosnOptions = options?.cst_csosn ?? [];
  const cstPisCofinsOptions = options?.cst_pis_cofins ?? [];
  const cstIpiOptions = options?.cst_ipi ?? [];
  const cenqIpiOptions = options?.cenq_ipi ?? [];
  const origemOptions = options?.origem ?? [];
  const modalityBcOptions = options?.modality_bc ?? [];
  const cstIbsCbsOptions = options?.cst_ibs_cbs ?? [];
  const tpCredPresIbsZfmOptions = options?.tp_cred_pres_ibs_zfm ?? [];

  const tipoOptions: Option<number>[] = [
    { value: TIPO_ENTRADA, label: text.list.tipoOptions.entrada },
    { value: TIPO_SAIDA, label: text.list.tipoOptions.saida },
  ];

  const booleanOptions: Option<boolean>[] = [
    { value: true, label: text.form.booleanOptions.yes },
    { value: false, label: text.form.booleanOptions.no },
  ];

  // `ind_doacao` — Select "Sim/Não" CLEARABLE (3 estados reais do legado:
  // null/'true'/'false'), MESMO componente genérico dos demais booleans,
  // mas SEM `noClearable` (permite limpar → `null` no payload). Value é
  // STRING (mirror `TaxRuleForm.ind_doacao`), não boolean.
  const indDoacaoOptions: Option<string>[] = [
    { value: 'true', label: text.form.booleanOptions.yes },
    { value: 'false', label: text.form.booleanOptions.no },
  ];

  const watchedTipo = watch('tipo');
  // C1: visibilidade/dominio dos campos pelo CST do proprio formulario.
  const watchedCst = watch('cst_csosn');
  const showMotDesIcms = isMotDesIcmsVisible(watchedCst);
  const showPercDif = isPercDifVisible(watchedCst);
  const showPercFcp = isPercFcpVisible(watchedCst);
  const motDesIcmsOptions = getMotDesIcmsOptions(watchedCst);

  // C1: troca/autofill de CST zera o que deixa de pertencer ao novo CST.
  function applyC1ForCst(cst: string | null | undefined) {
    const current = getValues();
    const clean = sanitizeC1ForCst(cst, {
      mot_des_icms: current.mot_des_icms,
      perc_dif: current.perc_dif,
      perc_fcp: current.perc_fcp,
    });
    (Object.keys(clean) as (keyof typeof clean)[]).forEach((key) => {
      if ((getValues(key) ?? null) !== clean[key]) {
        setValue(key, clean[key], { shouldDirty: true, shouldValidate: true });
      }
    });
  }
  const watchedOverwriteProduct = watch('overwrite_product');
  const watchedDescricao = watch('descricao');
  const descricaoLength = (watchedDescricao ?? '').length;

  // ---- Autofill de CFOP por prefixo (Achado 1/RN-2, mirror
  //      _forms.blade.php:288-312) — roda nos dois sentidos, nunca sobre o
  //      campo que disparou o blur. ----------------------------------------
  function handleCfopAutofillFromSaidaInterno(value: string) {
    if (!value || value.length < 4) return;
    const suffix = value.slice(1, 4);
    setValue('cfop_saida_externo', `6${suffix}`, { shouldDirty: true, shouldValidate: true });
    setValue('cfop_entrada_interno', `1${suffix}`, { shouldDirty: true, shouldValidate: true });
    setValue('cfop_entrada_externo', `2${suffix}`, { shouldDirty: true, shouldValidate: true });
    setValue('cfop_saida_exportacao', `7${suffix}`, { shouldDirty: true, shouldValidate: true });
    setValue('cfop_entrada_exportacao', `3${suffix}`, { shouldDirty: true, shouldValidate: true });
  }

  function handleCfopAutofillFromEntradaInterno(value: string) {
    if (!value || value.length < 4) return;
    const suffix = value.slice(1, 4);
    setValue('cfop_saida_externo', `6${suffix}`, { shouldDirty: true, shouldValidate: true });
    setValue('cfop_saida_interno', `1${suffix}`, { shouldDirty: true, shouldValidate: true });
    setValue('cfop_entrada_externo', `2${suffix}`, { shouldDirty: true, shouldValidate: true });
    setValue('cfop_saida_exportacao', `7${suffix}`, { shouldDirty: true, shouldValidate: true });
    setValue('cfop_entrada_exportacao', `3${suffix}`, { shouldDirty: true, shouldValidate: true });
  }

  const cfopSaidaInternoField = register('cfop_saida_interno');
  const cfopEntradaInternoField = register('cfop_entrada_interno');

  // ---- Autofill de Regra Fiscal (Achado 3/DA-NO-16) — só na SELEÇÃO manual,
  //      nunca no fillForm/carga de edição. `setValue` por campo, nunca
  //      `reset()` (evitaria apagar campos não relacionados). ---------------
  async function handleTaxRuleAutofill(taxRuleUuid: string) {
    try {
      const response = await getTaxRuleByUuid(taxRuleUuid);
      const taxRule = response.data;
      setValue('cst_csosn', taxRule.cst_csosn, { shouldDirty: true, shouldValidate: true });
      setValue('cst_pis', taxRule.cst_pis, { shouldDirty: true, shouldValidate: true });
      setValue('cst_cofins', taxRule.cst_cofins, { shouldDirty: true, shouldValidate: true });
      setValue('cst_ipi', taxRule.cst_ipi, { shouldDirty: true, shouldValidate: true });
      setValue('perc_icms', taxRule.perc_icms, { shouldDirty: true, shouldValidate: true });
      setValue('perc_pis', taxRule.perc_pis, { shouldDirty: true, shouldValidate: true });
      setValue('perc_cofins', taxRule.perc_cofins, { shouldDirty: true, shouldValidate: true });
      setValue('perc_ipi', taxRule.perc_ipi, { shouldDirty: true, shouldValidate: true });
      setValue('origem', taxRule.origem, { shouldDirty: true, shouldValidate: true });
      setValue('cest', taxRule.cest, { shouldDirty: true, shouldValidate: true });
      setValue('cst_csosn_exp', taxRule.cst_csosn_exp, { shouldDirty: true, shouldValidate: true });
      setValue('modality_bc', taxRule.modality_bc, { shouldDirty: true, shouldValidate: true });
      setValue('percent_reduction', taxRule.percent_reduction, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue('cenq_ipi', taxRule.cenq_ipi, { shouldDirty: true, shouldValidate: true });
      // C1: regra -> natureza copia mot_des_icms/perc_dif/perc_fcp (como percent_reduction),
      // respeitando a visibilidade pelo CST da regra (CST sem grupo => null).
      const c1 = sanitizeC1ForCst(taxRule.cst_csosn, {
        mot_des_icms: taxRule.mot_des_icms,
        perc_dif: taxRule.perc_dif,
        perc_fcp: taxRule.perc_fcp,
      });
      setValue('mot_des_icms', c1.mot_des_icms, { shouldDirty: true, shouldValidate: true });
      setValue('perc_dif', c1.perc_dif, { shouldDirty: true, shouldValidate: true });
      setValue('perc_fcp', c1.perc_fcp, { shouldDirty: true, shouldValidate: true });
    } catch {
      // Falha ao buscar a Regra Fiscal para autofill (rede/permissão): o
      // vínculo `tax_rule_uuid` já foi selecionado pelo usuário normalmente —
      // não bloqueia o preenchimento manual dos campos fiscais. O client
      // HTTP global já trata o toast de erro de rede/403, sem duplicar aqui.
    }
  }

  const natureOperationMutation = useRequest({
    asyncFunction: tryPersistNatureOperation,
    entityName: text.singularLabel,
    queryKey: queryKey.natureOperations.list,
    queryKey2: queryKey.natureOperations.detail,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Payload SEMPRE completo (create/update — `NatureOperationRequest` não usa
  // `sometimes` nos campos base, contrato §4.3). Os 27 campos do bloco fiscal
  // sempre viajam no payload — vazios/`null` quando `overwrite_product=Não`
  // (nunca bloqueiam o submit, requisito crítico do dono).
  async function tryPersistNatureOperation(data: NatureOperationFormType) {
    const payload: NatureOperationPayload = {
      descricao: data.descricao.trim(),
      tipo: Number(data.tipo),
      cfop_saida_interno: data.cfop_saida_interno,
      cfop_saida_externo: data.cfop_saida_externo,
      cfop_saida_exportacao: data.cfop_saida_exportacao || null,
      cfop_entrada_interno: data.cfop_entrada_interno,
      cfop_entrada_externo: data.cfop_entrada_externo,
      cfop_entrada_exportacao: data.cfop_entrada_exportacao || null,
      ativo: !!data.ativo,
      sobrescreve_cfop_produto: !!data.sobrescreve_cfop_produto,
      // Semântica DIRETA (Achado 5/RN4) — `true` = gera financeiro, sem
      // inversão do checkbox legado.
      generate_financial: !!data.generate_financial,
      overwrite_product: !!data.overwrite_product,
      automatic_calculation: !!data.automatic_calculation,
      tax_rule_uuid: data.tax_rule_uuid?.value ?? null,
      additional_info_uuid: data.additional_info_uuid?.value ?? null,
      // -- Bloco Fiscal Clássico --
      cst_csosn: data.cst_csosn || null,
      cst_pis: data.cst_pis || null,
      cst_cofins: data.cst_cofins || null,
      cst_ipi: data.cst_ipi || null,
      perc_icms: data.perc_icms == null ? 0 : Number(data.perc_icms),
      perc_pis: data.perc_pis == null ? 0 : Number(data.perc_pis),
      perc_cofins: data.perc_cofins == null ? 0 : Number(data.perc_cofins),
      perc_ipi: data.perc_ipi == null ? 0 : Number(data.perc_ipi),
      origem: data.origem || null,
      cest: data.cest?.trim() || null,
      cst_csosn_exp: data.cst_csosn_exp || null,
      modality_bc:
        data.modality_bc === null || data.modality_bc === undefined
          ? null
          : Number(data.modality_bc),
      percent_reduction: data.percent_reduction == null ? 0 : Number(data.percent_reduction),
      // C1 (D-101-19): oculto pelo CST => null; FCP 0/vazio => null (P-F2).
      ...sanitizeC1ForCst(data.cst_csosn, {
        mot_des_icms: data.mot_des_icms,
        perc_dif: data.perc_dif,
        perc_fcp: data.perc_fcp,
      }),
      cenq_ipi: data.cenq_ipi || null,
      // -- Reforma Tributária — IBS/CBS/IS --
      c_class_trib: data.c_class_trib?.trim() || null,
      cst_ibs_cbs: data.cst_ibs_cbs || null,
      perc_ibs_uf: toNullableNumber(data.perc_ibs_uf),
      perc_ibs_mun: toNullableNumber(data.perc_ibs_mun),
      perc_reducao_aliq_ibs_uf: toNullableNumber(data.perc_reducao_aliq_ibs_uf),
      perc_reducao_aliq_ibs_mun: toNullableNumber(data.perc_reducao_aliq_ibs_mun),
      perc_dif_ibs_uf: toNullableNumber(data.perc_dif_ibs_uf),
      perc_dif_ibs_mun: toNullableNumber(data.perc_dif_ibs_mun),
      perc_cbs: toNullableNumber(data.perc_cbs),
      perc_reducao_aliq_cbs: toNullableNumber(data.perc_reducao_aliq_cbs),
      perc_dif_cbs: toNullableNumber(data.perc_dif_cbs),
      cst_is: data.cst_is?.trim() || null,
      perc_is: toNullableNumber(data.perc_is),
      perc_is_espec: toNullableNumber(data.perc_is_espec),
      ad_rem_ibs: toNullableNumber(data.ad_rem_ibs),
      ad_rem_cbs: toNullableNumber(data.ad_rem_cbs),
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
      return isEditing && natureOperationId
        ? await updateNatureOperation(natureOperationId, payload)
        : await createNatureOperation(payload);
    } catch (error) {
      // 422 flat por campo (mot_des_icms/perc_dif/perc_fcp e demais): exibe a mensagem da API
      // no campo; o `throw` preserva o toast generico do useRequest.
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messagesForField]) => {
          if (messagesForField?.[0]) {
            setError(field as keyof NatureOperationFormType, {
              type: 'server',
              message: messagesForField[0],
            });
          }
        });
      }
      throw error;
    }
  }

  // Guard do submit — forma EXPLÍCITA `Object.keys(dirtyFields).length === 0`
  // (checklist da Tarefa: NUNCA `isEmpty`/`!isEmpty` do utilitário ambíguo).
  // Em edição sem nenhum campo tocado, só navega — sem PUT vazio.
  async function onSubmit(data: NatureOperationFormType) {
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }
    await natureOperationMutation.mutateAsync(data);
  }

  const isSubmitting = natureOperationMutation.isPending;

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
        {/* Código gerado — somente-leitura (Badge), NUNCA Input editável,
            NUNCA enviado no payload (contrato DA-NO-08). Em criação, texto de
            "gerado automaticamente" no lugar do valor. */}
        <Box
          bg="bg.muted"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          px={4}
          py={3}
          mb={6}
        >
          <Skeleton loading={isLoading} borderRadius="md">
            <Flex align="center" gap={3}>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="fg.muted"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                {text.form.fields.code}
              </Text>
              {isEditing ? (
                <Badge colorPalette="gray" variant="subtle" fontFamily="mono">
                  {natureOperationData?.code}
                </Badge>
              ) : (
                <Text fontSize="sm" color="fg.muted">
                  {text.form.hints.codeGenerated}
                </Text>
              )}
            </Flex>
          </Skeleton>
        </Box>

        {/* ---- Grupo "Geral" (13 campos, SEMPRE visível/obrigatório) ---- */}
        <Heading size="sm" fontWeight="600" mb={4}>
          {text.form.sections.general}
        </Heading>
        <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={6} mb={6}>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Input
              label={text.form.fields.descricao}
              maxLength={80}
              helperText={errors.descricao?.message ? undefined : `${descricaoLength}/80`}
              {...register('descricao')}
              error={errors.descricao?.message}
              isRequired
              loading={isLoading}
              disabled={!canSave}
            />

            <Controller
              name="tipo"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.tipo}
                  name={name}
                  value={tipoOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<number> | null) => onChange(opt?.value ?? TIPO_SAIDA)}
                  options={tipoOptions}
                  error={error?.message}
                  isRequired
                  noClearable
                  isDisabled={!canSave}
                  loading={isLoading}
                />
              )}
            />

            {/* #3 cfop_saida_interno — visível quando tipo=Saída. CSS
                `display`, NUNCA unmount (RN-1) — sempre obrigatório e sempre
                registrado no schema, visível ou não. Dispara o autofill de
                CFOP por prefixo (Achado 1) no `onBlur`. */}
            <Box display={watchedTipo === TIPO_SAIDA ? 'contents' : 'none'}>
              <Input
                label={text.form.fields.cfopSaidaInterno}
                maxLength={4}
                {...cfopSaidaInternoField}
                onBlur={(e) => {
                  cfopSaidaInternoField.onBlur(e);
                  handleCfopAutofillFromSaidaInterno(e.target.value);
                }}
                error={errors.cfop_saida_interno?.message}
                isRequired
                loading={isLoading}
                disabled={!canSave}
              />
            </Box>

            {/* #4 cfop_saida_externo — visível quando tipo=Saída. */}
            <Box display={watchedTipo === TIPO_SAIDA ? 'contents' : 'none'}>
              <Input
                label={text.form.fields.cfopSaidaExterno}
                maxLength={4}
                {...register('cfop_saida_externo')}
                error={errors.cfop_saida_externo?.message}
                isRequired
                loading={isLoading}
                disabled={!canSave}
              />
            </Box>

            {/* #5 cfop_entrada_interno — visível quando tipo=Entrada.
                Dispara o autofill de CFOP por prefixo no `onBlur`. */}
            <Box display={watchedTipo === TIPO_ENTRADA ? 'contents' : 'none'}>
              <Input
                label={text.form.fields.cfopEntradaInterno}
                maxLength={4}
                {...cfopEntradaInternoField}
                onBlur={(e) => {
                  cfopEntradaInternoField.onBlur(e);
                  handleCfopAutofillFromEntradaInterno(e.target.value);
                }}
                error={errors.cfop_entrada_interno?.message}
                isRequired
                loading={isLoading}
                disabled={!canSave}
              />
            </Box>

            {/* #6 cfop_entrada_externo — visível quando tipo=Entrada. */}
            <Box display={watchedTipo === TIPO_ENTRADA ? 'contents' : 'none'}>
              <Input
                label={text.form.fields.cfopEntradaExterno}
                maxLength={4}
                {...register('cfop_entrada_externo')}
                error={errors.cfop_entrada_externo?.message}
                isRequired
                loading={isLoading}
                disabled={!canSave}
              />
            </Box>

            {/* #7 cfop_saida_exportacao — opcional, visível quando tipo=Saída. */}
            <Box display={watchedTipo === TIPO_SAIDA ? 'contents' : 'none'}>
              <Input
                label={text.form.fields.cfopSaidaExportacao}
                maxLength={4}
                {...register('cfop_saida_exportacao')}
                error={errors.cfop_saida_exportacao?.message}
                loading={isLoading}
                disabled={!canSave}
              />
            </Box>

            {/* #8 cfop_entrada_exportacao — opcional, visível quando tipo=Entrada. */}
            <Box display={watchedTipo === TIPO_ENTRADA ? 'contents' : 'none'}>
              <Input
                label={text.form.fields.cfopEntradaExportacao}
                maxLength={4}
                {...register('cfop_entrada_exportacao')}
                error={errors.cfop_entrada_exportacao?.message}
                loading={isLoading}
                disabled={!canSave}
              />
            </Box>

            <Controller
              name="ativo"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.ativo}
                  name={name}
                  value={booleanOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                  options={booleanOptions}
                  error={error?.message}
                  isRequired
                  noClearable
                  isDisabled={!canSave}
                  loading={isLoading}
                />
              )}
            />

            <Controller
              name="sobrescreve_cfop_produto"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.sobrescreveCfopProduto}
                  name={name}
                  value={booleanOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                  options={booleanOptions}
                  error={error?.message}
                  isRequired
                  noClearable
                  isDisabled={!canSave}
                  loading={isLoading}
                />
              )}
            />

            {/* Gatilho do bloco fiscal condicional (34 campos abaixo). */}
            <Controller
              name="overwrite_product"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.overwriteProduct}
                  name={name}
                  value={booleanOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                  options={booleanOptions}
                  error={error?.message}
                  isRequired
                  noClearable
                  isDisabled={!canSave}
                  loading={isLoading}
                />
              )}
            />

            {/* Semântica DIRETA (Achado 5) — `true` = gera financeiro. */}
            <Controller
              name="generate_financial"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.generateFinancial}
                  name={name}
                  value={booleanOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                  options={booleanOptions}
                  error={error?.message}
                  isRequired
                  noClearable
                  isDisabled={!canSave}
                  loading={isLoading}
                />
              )}
            />

            <Controller
              name="automatic_calculation"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.automaticCalculation}
                  name={name}
                  value={booleanOptions.find((o) => o.value === value) ?? null}
                  onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
                  options={booleanOptions}
                  error={error?.message}
                  isRequired
                  noClearable
                  isDisabled={!canSave}
                  loading={isLoading}
                />
              )}
            />
          </SimpleGrid>
        </Box>

        {/* ---- Bloco fiscal condicional (34 campos) — UNMOUNT correto aqui
              (RN-3/DA-NO-18): os campos ficam genuinamente opcionais/sem uso
              quando ocultos. NUNCA bloqueia o submit quando
              `overwrite_product=Não` (requisito crítico do dono). ---- */}
        {!!watchedOverwriteProduct && (
          <>
            {/* ---- Sub-bloco "Fiscal Clássico" (16 campos: 2 FKs sempre
                  opcionais + 14 required_if) ---- */}
            <Heading size="sm" fontWeight="600" mb={4}>
              {text.form.sections.fiscalClassic}
            </Heading>
            <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={6} mb={6}>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                {/* #14 tax_rule_uuid — FK `.ignore` (NUNCA obrigatório).
                    Dispara o autofill (Achado 3) só na seleção manual. */}
                <Controller
                  name="tax_rule_uuid"
                  control={control}
                  render={({ field }) => (
                    <SelectAsyncPaginate
                      name={field.name}
                      label={text.form.fields.taxRuleUuid}
                      service={listTaxRuleEntityOptions}
                      mapOptions={(item: TaxRuleEntityOption) => ({
                        label: item.label,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                      })}
                      value={field.value ?? null}
                      onChange={(option: any) => {
                        field.onChange(option ?? null);
                        if (option?.value) {
                          handleTaxRuleAutofill(option.value);
                        }
                      }}
                      isDisabled={!canSave}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  )}
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
                        onChange(opt?.value ?? null);
                        // C1: troca de CST limpa o que deixa de pertencer ao novo CST.
                        applyC1ForCst(opt?.value ?? null);
                      }}
                      options={cstCsosnOptions}
                      error={error?.message}
                      isRequired
                      isDisabled={!canSave}
                      loading={isLoading || isOptionsLoading}
                    />
                  )}
                />

                {/* Bug de rótulo cst_pis/cst_cofins CORRIGIDO (Achado 4) —
                    o campo/coluna real permanece `cst_pis`. */}
                <Controller
                  name="cst_pis"
                  control={control}
                  render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                    <Select
                      label={text.form.fields.cstPis}
                      name={name}
                      value={cstPisCofinsOptions.find((o) => o.value === value) ?? null}
                      onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
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
                      onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
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
                      onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                      options={cstIpiOptions}
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
                      onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                      options={cenqIpiOptions}
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
                      name={name}
                      label={text.form.fields.percIcms}
                      value={value ?? null}
                      onValueChange={(value) => onChange(value)}
                      min={0}
                      max={999.99}
                      allowDot
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
                      name={name}
                      label={text.form.fields.percPis}
                      value={value ?? null}
                      onValueChange={(value) => onChange(value)}
                      min={0}
                      max={999.99}
                      allowDot
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
                      name={name}
                      label={text.form.fields.percCofins}
                      value={value ?? null}
                      onValueChange={(value) => onChange(value)}
                      min={0}
                      max={999.99}
                      allowDot
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
                      name={name}
                      label={text.form.fields.percIpi}
                      value={value ?? null}
                      onValueChange={(value) => onChange(value)}
                      min={0}
                      max={999.99}
                      allowDot
                      decimalPlaces={2}
                      error={error?.message}
                      isRequired
                      disabled={!canSave}
                    />
                  )}
                />

                <Input
                  label={text.form.fields.cest}
                  maxLength={10}
                  {...register('cest')}
                  error={errors.cest?.message}
                  isRequired
                  loading={isLoading}
                  disabled={!canSave}
                />

                <Controller
                  name="percent_reduction"
                  control={control}
                  render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                    <NumberInput
                      name={name}
                      label={text.form.fields.percentReduction}
                      value={value ?? null}
                      onValueChange={(value) => onChange(value)}
                      min={0}
                      max={999.99}
                      allowDot
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
                        name={name}
                        label={text.form.fields.percDif}
                        helperText={text.form.fields.percDifHint}
                        value={value ?? null}
                        onValueChange={(next) => onChange(next)}
                        min={0}
                        max={100}
                        allowDot
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
                        name={name}
                        label={text.form.fields.percFcp}
                        helperText={text.form.fields.percFcpHint}
                        value={value ?? null}
                        onValueChange={(next) => onChange(normalizePercFcp(next))}
                        min={0}
                        max={100}
                        allowDot
                        decimalPlaces={4}
                        error={error?.message}
                        disabled={!canSave}
                      />
                    )}
                  />
                )}

                <Controller
                  name="modality_bc"
                  control={control}
                  render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                    <Select
                      label={text.form.fields.modalityBc}
                      name={name}
                      value={modalityBcOptions.find((o) => o.value === value) ?? null}
                      onChange={(opt: Option<number> | null) => onChange(opt?.value ?? null)}
                      options={modalityBcOptions}
                      error={error?.message}
                      isRequired
                      isDisabled={!canSave}
                      loading={isLoading || isOptionsLoading}
                    />
                  )}
                />

                <Controller
                  name="origem"
                  control={control}
                  render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                    <Select
                      label={text.form.fields.origem}
                      name={name}
                      value={origemOptions.find((o) => o.value === value) ?? null}
                      onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                      options={origemOptions}
                      error={error?.message}
                      isRequired
                      isDisabled={!canSave}
                      loading={isLoading || isOptionsLoading}
                    />
                  )}
                />

                {/* Reaproveita a MESMA lista de `cst_csosn` (DA-NO-05). */}
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
                      isRequired
                      isDisabled={!canSave}
                      loading={isLoading || isOptionsLoading}
                    />
                  )}
                />

                {/* #29 additional_info_uuid — FK `.ignore` (NUNCA obrigatório). */}
                <Controller
                  name="additional_info_uuid"
                  control={control}
                  render={({ field }) => (
                    <SelectAsyncPaginate
                      name={field.name}
                      label={text.form.fields.additionalInfoUuid}
                      service={listAdditionalInfos}
                      mapOptions={(item: AdditionalInfoListItem) => ({
                        label: item.description,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                      })}
                      value={field.value ?? null}
                      onChange={(option: any) => field.onChange(option ?? null)}
                      isDisabled={!canSave}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  )}
                />
              </SimpleGrid>
            </Box>

            {/* ---- Sub-bloco "Reforma Tributária — IBS/CBS/IS" (18 campos:
                  5 sempre-opcionais + 13 required_if) ---- */}
            <Heading size="sm" fontWeight="600" mb={4}>
              {text.form.sections.taxReform}
            </Heading>
            <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={6} mb={6}>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Input
                  label={text.form.fields.cClassTrib}
                  maxLength={6}
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
                      name={name}
                      label={text.form.fields.percIbsUf}
                      value={value ?? null}
                      onValueChange={(value) => onChange(value)}
                      min={0}
                      max={999.9999}
                      allowDot
                      decimalPlaces={4}
                      error={error?.message}
                      isRequired
                      disabled={!canSave}
                    />
                  )}
                />

                <Controller
                  name="perc_ibs_mun"
                  control={control}
                  render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                    <NumberInput
                      name={name}
                      label={text.form.fields.percIbsMun}
                      value={value ?? null}
                      onValueChange={(value) => onChange(value)}
                      min={0}
                      max={999.9999}
                      allowDot
                      decimalPlaces={4}
                      error={error?.message}
                      isRequired
                      disabled={!canSave}
                    />
                  )}
                />

                <Controller
                  name="perc_reducao_aliq_ibs_uf"
                  control={control}
                  render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                    <NumberInput
                      name={name}
                      label={text.form.fields.percReducaoAliqIbsUf}
                      value={value ?? null}
                      onValueChange={(value) => onChange(value)}
                      min={0}
                      max={999.9999}
                      allowDot
                      decimalPlaces={4}
                      error={error?.message}
                      isRequired
                      disabled={!canSave}
                    />
                  )}
                />

                <Controller
                  name="perc_reducao_aliq_ibs_mun"
                  control={control}
                  render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                    <NumberInput
                      name={name}
                      label={text.form.fields.percReducaoAliqIbsMun}
                      value={value ?? null}
                      onValueChange={(value) => onChange(value)}
                      min={0}
                      max={999.9999}
                      allowDot
                      decimalPlaces={4}
                      error={error?.message}
                      isRequired
                      disabled={!canSave}
                    />
                  )}
                />

                <Controller
                  name="perc_dif_ibs_uf"
                  control={control}
                  render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                    <NumberInput
                      name={name}
                      label={text.form.fields.percDifIbsUf}
                      value={value ?? null}
                      onValueChange={(value) => onChange(value)}
                      min={0}
                      max={999.9999}
                      allowDot
                      decimalPlaces={4}
                      error={error?.message}
                      isRequired
                      disabled={!canSave}
                    />
                  )}
                />

                <Controller
                  name="perc_dif_ibs_mun"
                  control={control}
                  render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                    <NumberInput
                      name={name}
                      label={text.form.fields.percDifIbsMun}
                      value={value ?? null}
                      onValueChange={(value) => onChange(value)}
                      min={0}
                      max={999.9999}
                      allowDot
                      decimalPlaces={4}
                      error={error?.message}
                      isRequired
                      disabled={!canSave}
                    />
                  )}
                />

                <Controller
                  name="perc_cbs"
                  control={control}
                  render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                    <NumberInput
                      name={name}
                      label={text.form.fields.percCbs}
                      value={value ?? null}
                      onValueChange={(value) => onChange(value)}
                      min={0}
                      max={999.9999}
                      allowDot
                      decimalPlaces={4}
                      error={error?.message}
                      isRequired
                      disabled={!canSave}
                    />
                  )}
                />

                <Controller
                  name="perc_reducao_aliq_cbs"
                  control={control}
                  render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                    <NumberInput
                      name={name}
                      label={text.form.fields.percReducaoAliqCbs}
                      value={value ?? null}
                      onValueChange={(value) => onChange(value)}
                      min={0}
                      max={999.9999}
                      allowDot
                      decimalPlaces={4}
                      error={error?.message}
                      isRequired
                      disabled={!canSave}
                    />
                  )}
                />

                <Controller
                  name="perc_dif_cbs"
                  control={control}
                  render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                    <NumberInput
                      name={name}
                      label={text.form.fields.percDifCbs}
                      value={value ?? null}
                      onValueChange={(value) => onChange(value)}
                      min={0}
                      max={999.9999}
                      allowDot
                      decimalPlaces={4}
                      error={error?.message}
                      isRequired
                      disabled={!canSave}
                    />
                  )}
                />

                <Input
                  label={text.form.fields.cstIs}
                  maxLength={3}
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
                      name={name}
                      label={text.form.fields.percIs}
                      value={value ?? null}
                      onValueChange={(value) => onChange(value)}
                      min={0}
                      max={999.9999}
                      allowDot
                      decimalPlaces={4}
                      error={error?.message}
                      isRequired
                      disabled={!canSave}
                    />
                  )}
                />

                {/* Exceção de teto (contrato §2/`NatureOperationRequest.php:
                    132-134`) — SEM `max`, diferente dos demais percentuais. */}
                <Controller
                  name="perc_is_espec"
                  control={control}
                  render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                    <NumberInput
                      name={name}
                      label={text.form.fields.percIsEspec}
                      value={value ?? null}
                      onValueChange={(value) => onChange(value)}
                      min={0}
                      allowDot
                      decimalPlaces={4}
                      error={error?.message}
                      isRequired
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
                      isRequired
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
                      isRequired
                      disabled={!canSave}
                    />
                  )}
                />

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

                {/* `ind_doacao` — Select "Sim/Não" CLEARABLE (3 estados),
                    NUNCA Switch, NUNCA noClearable. */}
                <Controller
                  name="ind_doacao"
                  control={control}
                  render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                    <Select
                      label={text.form.fields.indDoacao}
                      name={name}
                      value={indDoacaoOptions.find((o) => o.value === value) ?? null}
                      onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                      options={indDoacaoOptions}
                      error={error?.message}
                      isDisabled={!canSave}
                      loading={isLoading}
                    />
                  )}
                />
              </SimpleGrid>
            </Box>
          </>
        )}
      </Form>
    </FormContainer>
  );
}
