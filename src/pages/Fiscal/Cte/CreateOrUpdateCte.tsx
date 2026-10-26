// src/pages/Fiscal/Cte/CreateOrUpdateCte.tsx
// -----------------------------------------------------------------------------
// Formulário único de criação/edição de CT-e (Cte — domínio Fiscal, execução
// 045, Onda 1, TASK-CTE-FE-03/04/05). Rotas `/fiscal/ctes/create` e
// `/fiscal/ctes/:id`. Casca `FormContainer` (`footer` opt-in, `fullHeight`) +
// `Tabs.Root` v3 com 2 `Tabs.Trigger` SEMPRE visíveis (Contrato §2.1 — NÃO
// gateadas por `!!id`): "NFe referenciada" (chavesNfe) e "Outros documentos"
// (F11-F14). Campos principais + Medidas/Componentes (F20-F24,
// TASK-CTE-FE-04) + cascata de endereço do tomador (F25-F30, TASK-CTE-FE-05)
// renderizam FORA dos tabs, no corpo principal do form — mirror
// `CreateOrUpdateHarvestProduct.tsx` (esqueleto geral, hidratação Lei 2).
//
// Único `<Form id="cte-form">` engloba TODOS os campos (mirror `IG08` — um
// único submit serializa tudo, inclusive as 2 tabs + os 2 subcadastros).
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Box, SimpleGrid, Skeleton, Tabs, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { cteFormDefaultValues } from '@/constants/Fiscal/cte/default-values';
import { cteCstOptions } from '@/constants/Fiscal/cte/options/cte-cst-options';
import { cteEnderecoTomadorOptions } from '@/constants/Fiscal/cte/options/cte-endereco-tomador-options';
import { cteGlobalizadoOptions } from '@/constants/Fiscal/cte/options/cte-globalizado-options';
import { cteModalOptions } from '@/constants/Fiscal/cte/options/cte-modal-options';
import { cteRetiraOptions } from '@/constants/Fiscal/cte/options/cte-retira-options';
import { cteTipoDocumentoOptions } from '@/constants/Fiscal/cte/options/cte-tipo-documento-options';
import { cteTomadorOptions } from '@/constants/Fiscal/cte/options/cte-tomador-options';
import { cteUnidadeMedidaOptions } from '@/constants/Fiscal/cte/options/cte-unidade-medida-options';
import { nfeCstIbsCbsOptions } from '@/constants/Fiscal/nfe-fiscal-catalogs';
import { queryKey } from '@/constants/query-key';

import { cteSchemaResolver } from '@/validations/schemas/Fiscal/cte-schema';

import {
  createCte,
  getCitiesOptions,
  getClientAddressForCte,
  getClientsOptions,
  getCte,
  getEquipmentsOptions,
  updateCte,
} from '@/services/v2/Fiscal/cte-service';
// GAP-SEC-09 P0-B — picker real de `nature_operations` (FK tenant-scoped),
// substituindo o estático `cteNaturezaOptions` (1/2/3, NT-01/DV08 REVOGADO).
import {
  getNatureOperation,
  listActiveNatureOperations,
} from '@/services/v2/NatureOperations/nature-operation-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type {
  CreateCteRequest,
  CteCityOptionItem,
  CteClientOptionItem,
  CteData,
  CteEquipmentOptionItem,
  CteForm,
} from '@/@types/v2/Fiscal/cte';
import type { NatureOperationData, NatureOperationListItem } from '@/@types/v2/NatureOperations';

import { ChavesNfeFieldArray } from './ChavesNfeFieldArray';
import { ComponentesFieldArray } from './ComponentesFieldArray';
import { MedidasFieldArray } from './MedidasFieldArray';

const CTE_LIST_ROUTE = '/fiscal/ctes';

function mapClientOption(item: CteClientOptionItem): Option<string> {
  return { value: item.uuid, label: item.name ?? '—' };
}

function mapEquipmentOption(item: CteEquipmentOptionItem): Option<string> {
  return { value: item.uuid, label: `${item.code} — ${item.description}` };
}

function mapCityOption(item: CteCityOptionItem): Option<string> {
  return {
    value: item.uuid,
    label: item.state?.letter ? `${item.title} (${item.state.letter})` : item.title,
  };
}

// GAP-SEC-09 P0-B — `value` = uuid real de `nature_operations` (tenant
// resolvido pelo backend via `X-Farm-Id`), `label` = descrição cadastrada.
function mapNatureOperationOption(item: NatureOperationListItem): Option<string> {
  return { value: item.uuid, label: item.descricao };
}

// 422 do backend é snake_case (+ 4 chaves camelCase, GAP-CTE-05) — o form
// React usa camelCase para os campos de cabeçalho; `medidas.N.<campo>`/
// `componentes.N.<campo>` traduzem só o nome do campo (índice preservado).
const SERVER_FIELD_MAP: Record<string, string> = {
  natureza_id: 'natureza',
  remetente_id: 'remetente',
  destinatario_id: 'destinatario',
  chaves_nfe: 'chavesNfe',
  equipment_id: 'equipment',
  produto_predominante: 'produtoPredominante',
  valor_carga: 'valorCarga',
  cod_unidade: 'codUnidade',
  tipo_medida: 'tipoMedida',
  quantidade_carga: 'quantidadeCarga',
  endereco_tomador: 'enderecoTomador',
  rua_tomador: 'ruaTomador',
  numero_tomador: 'numeroTomador',
  bairro_tomador: 'bairroTomador',
  cep_tomador: 'cepTomador',
  cidade_tomador: 'cidadeTomador',
  data_prevista_entrega: 'dataPrevistaEntrega',
  valor_transporte: 'valorTransporte',
  valor_receber: 'valorReceber',
  municipio_envio: 'municipioEnvio',
  municipio_inicio: 'municipioInicio',
  municipio_fim: 'municipioFim',
  detalhes_retira: 'detalhesRetira',
  perc_icms: 'percIcms',
  c_class_trib: 'cClassTrib',
  cst_ibs_cbs: 'cstIbsCbs',
  perc_ibs_uf: 'percIbsUf',
  perc_ibs_mun: 'percIbsMun',
  perc_cbs: 'percCbs',
  perc_reducao_aliq_ibs_uf: 'percReducaoAliqIbsUf',
  perc_reducao_aliq_ibs_mun: 'percReducaoAliqIbsMun',
  perc_reducao_aliq_cbs: 'percReducaoAliqCbs',
  perc_dif_ibs_uf: 'percDifIbsUf',
  perc_dif_ibs_mun: 'percDifIbsMun',
  perc_dif_cbs: 'percDifCbs',
};

// UT-000776 — campos RTC do form (nome no form -> nome no payload/natureza) e
// o tipo de cada um, para o preenchimento pela natureza e a montagem do payload.
type RtcPercentField =
  | 'percIbsUf'
  | 'percIbsMun'
  | 'percCbs'
  | 'percReducaoAliqIbsUf'
  | 'percReducaoAliqIbsMun'
  | 'percReducaoAliqCbs'
  | 'percDifIbsUf'
  | 'percDifIbsMun'
  | 'percDifCbs';

const RTC_PERCENT_FIELDS: ReadonlyArray<{
  form: RtcPercentField;
  api: keyof NatureOperationData;
  label: keyof LanguageDate['ctes']['cte']['form']['fields'];
}> = [
  { form: 'percIbsUf', api: 'perc_ibs_uf', label: 'percIbsUf' },
  { form: 'percIbsMun', api: 'perc_ibs_mun', label: 'percIbsMun' },
  { form: 'percCbs', api: 'perc_cbs', label: 'percCbs' },
  { form: 'percReducaoAliqIbsUf', api: 'perc_reducao_aliq_ibs_uf', label: 'percReducaoAliqIbsUf' },
  {
    form: 'percReducaoAliqIbsMun',
    api: 'perc_reducao_aliq_ibs_mun',
    label: 'percReducaoAliqIbsMun',
  },
  { form: 'percReducaoAliqCbs', api: 'perc_reducao_aliq_cbs', label: 'percReducaoAliqCbs' },
  { form: 'percDifIbsUf', api: 'perc_dif_ibs_uf', label: 'percDifIbsUf' },
  { form: 'percDifIbsMun', api: 'perc_dif_ibs_mun', label: 'percDifIbsMun' },
  { form: 'percDifCbs', api: 'perc_dif_cbs', label: 'percDifCbs' },
];

function getCstIbsCbsOption(value: string | null | undefined): Option<string> | null {
  if (!value) return null;
  return nfeCstIbsCbsOptions.find((option) => option.value === value) ?? { value, label: value };
}

const RTC_ALL_FIELDS = [
  'cClassTrib',
  'cstIbsCbs',
  ...RTC_PERCENT_FIELDS.map((f) => f.form),
] as const;
type RtcFieldName = (typeof RTC_ALL_FIELDS)[number];

function mapServerFieldToFormField(field: string): string {
  // Traduz CADA segmento não numérico (`medidas.0.cod_unidade` ->
  // `medidas.0.codUnidade`); o índice do field array é preservado.
  return field
    .split('.')
    .map((segment) => (/^\d+$/.test(segment) ? segment : (SERVER_FIELD_MAP[segment] ?? segment)))
    .join('.');
}

export default function CreateOrUpdateCte() {
  const { id: uuid } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.ctes.cte;

  const hasMalformedRouteParam = uuid !== undefined && !isValidGuid(uuid);

  useEffect(() => {
    if (hasMalformedRouteParam) navigate(CTE_LIST_ROUTE, { replace: true });
  }, [hasMalformedRouteParam, navigate]);

  const isEditing = isValidGuid(uuid);
  const canSave = isEditing ? can('cte_edit') : can('cte_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<CteForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: cteSchemaResolver(languageGB),
    defaultValues: {
      ...cteFormDefaultValues,
      // Defaults de criação (F05/F06/F37, Contrato §3.1) — descartados pelo
      // `reset()` de `fillCteForm` assim que a query de edição resolve.
      globalizado: isEditing ? null : cteGlobalizadoOptions.getOption('0', languageGB),
      cst: isEditing ? null : cteCstOptions.getOption('00'),
      retira: isEditing ? null : cteRetiraOptions.getOption('1', languageGB),
    },
  });

  // Campos RTC já editados pelo usuário (a natureza só preenche os NÃO editados).
  const rtcEditedRef = useRef<Set<RtcFieldName>>(new Set());
  const [docTab, setDocTab] = useState('0');

  const chavesNfeArray = useFieldArray({ control, name: 'chavesNfe' });
  const medidasArray = useFieldArray({ control, name: 'medidas' });
  const componentesArray = useFieldArray({ control, name: 'componentes' });

  // ---- Guarda EXPLÍCITA `!isEmpty(dirtyFields) || resetForce` (Lei 2) ------
  function fillCteForm(data: CteData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      rtcEditedRef.current.clear();
      reset({
        // GAP-SEC-09 P0-B — `CteDetailResource.natureza` expõe
        // `{uuid, descricao}` (uuid REAL de `nature_operations`); hidrata
        // direto pelo uuid, sem mais o match por `descricao` contra a lista
        // estática 1/2/3 (GAP-CTE-FE-03 nota secundária, REVOGADA).
        natureza: data.natureza
          ? { value: data.natureza.uuid, label: data.natureza.descricao }
          : null,
        globalizado: cteGlobalizadoOptions.getOption(
          String(data.globalizado) as '0' | '1',
          languageGB
        ),
        cst: cteCstOptions.getOption(data.cst),
        percIcms: data.perc_icms,
        cClassTrib: data.c_class_trib ?? '',
        cstIbsCbs: getCstIbsCbsOption(data.cst_ibs_cbs),
        percIbsUf: data.perc_ibs_uf ?? null,
        percIbsMun: data.perc_ibs_mun ?? null,
        percCbs: data.perc_cbs ?? null,
        percReducaoAliqIbsUf: data.perc_reducao_aliq_ibs_uf ?? null,
        percReducaoAliqIbsMun: data.perc_reducao_aliq_ibs_mun ?? null,
        percReducaoAliqCbs: data.perc_reducao_aliq_cbs ?? null,
        percDifIbsUf: data.perc_dif_ibs_uf ?? null,
        percDifIbsMun: data.perc_dif_ibs_mun ?? null,
        percDifCbs: data.perc_dif_cbs ?? null,
        remetente: data.remetente
          ? { value: data.remetente.uuid, label: data.remetente.nome ?? '—' }
          : null,
        destinatario: data.destinatario
          ? { value: data.destinatario.uuid, label: data.destinatario.nome ?? '—' }
          : null,
        chavesNfe: data.chaves_nfe.map((value) => ({ value })),
        tpDoc: data.tpDoc ? cteTipoDocumentoOptions.getOption(data.tpDoc) : null,
        descOutros: data.descOutros ?? '',
        nDoc: data.nDoc,
        vDocFisc: data.vDocFisc || null,
        equipment: data.equipment
          ? { value: data.equipment.uuid, label: data.equipment.description }
          : null,
        produtoPredominante: data.produto_predominante,
        tomador: cteTomadorOptions.getOption(data.tomador),
        valorCarga: data.valor_carga,
        modal: cteModalOptions.getOption(data.modal),
        medidas: data.medidas.map((medida) => ({
          uuid: medida.uuid,
          // T-776-API-04c — rótulo (M3/KG/…) pelo código `00`..`04`, não o código cru.
          codUnidade: cteUnidadeMedidaOptions.getOption(medida.cod_unidade),
          tipoMedida: { value: medida.tipo_medida, label: medida.tipo_medida },
          quantidadeCarga: medida.quantidade_carga,
        })),
        componentes: data.componentes.map((componente) => ({
          uuid: componente.uuid,
          nome: componente.nome,
          valor: componente.valor,
        })),
        // CL15 — endereço do tomador NUNCA teve round-trip no legado, o
        // seletor sempre reabre vazio (preservado, mirror do achado da Tarefa).
        enderecoTomador: null,
        ruaTomador: data.rua_tomador ?? '',
        numeroTomador: data.numero_tomador ?? '',
        bairroTomador: data.bairro_tomador ?? '',
        cepTomador: data.cep_tomador ?? '',
        cidadeTomador: data.cidade_tomador
          ? { value: data.cidade_tomador.uuid, label: data.cidade_tomador.name }
          : null,
        dataPrevistaEntrega: data.data_prevista_entrega,
        valorTransporte: data.valor_transporte,
        valorReceber: data.valor_receber,
        municipioEnvio: { value: data.municipio_envio.uuid, label: data.municipio_envio.name },
        municipioInicio: { value: data.municipio_inicio.uuid, label: data.municipio_inicio.name },
        municipioFim: { value: data.municipio_fim.uuid, label: data.municipio_fim.name },
        retira: cteRetiraOptions.getOption(data.retira ? '1' : '0', languageGB),
        detalhesRetira: data.detalhes_retira ?? '',
        observacao: data.observacao ?? '',
      });
    }
  }

  const cteQuery = useCustomFormQueryById<CteData>({
    registrationId: isEditing && uuid ? uuid : '',
    queryKey: queryKey.ctes.cte,
    asyncFunction: getCte,
    fillForm: fillCteForm,
  });

  const isLoading = isEditing && checkLoadingStatus([cteQuery as any]);

  // ---- Lookups (F08/F09 — clients/options FLAT, Select local) -------------
  const clientsQuery = useQuery({
    queryKey: [queryKey.ctes.ctesList, 'clients-options'],
    queryFn: getClientsOptions,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const clientOptions: Option<string>[] = (clientsQuery.data ?? []).map(mapClientOption);

  // ---- SOMACOMPONENTES (IG05, Contrato §2.4) — recalcula valorTransporte/
  // valorReceber a cada add/remove/edit de componente. Continuam editáveis
  // manualmente (mirror legado — o efeito sobrescreve, mas o campo não é
  // readOnly). ----------------------------------------------------------------
  const componentesWatch = watch('componentes');

  useEffect(() => {
    const soma = (componentesWatch ?? []).reduce(
      (total, componente) => total + (Number(componente?.valor) || 0),
      0
    );
    setValue('valorTransporte', soma, { shouldDirty: true });
    setValue('valorReceber', soma, { shouldDirty: true });
    // Dep proposital: só a lista de valores (não `setValue`, estável do RHF) —
    // re-executa a cada add/remove/edit de componente, mirror Contrato §2.4.
  }, [JSON.stringify(componentesWatch?.map((c) => c?.valor))]);

  // ---- Cascata endereço do tomador (IG07/AC16, TASK-CTE-FE-05, GAP-CTE-01
  // Alternativa A). `watch('enderecoTomador')` dispara — cliente ausente não
  // chama a API (Contrato §2.5). ---------------------------------------------
  const enderecoTomadorOption = watch('enderecoTomador');
  const remetenteOption = watch('remetente');
  const destinatarioOption = watch('destinatario');
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  useEffect(() => {
    const selector = enderecoTomadorOption?.value;
    if (!selector) return;

    const clientUuid = selector === '0' ? remetenteOption?.value : destinatarioOption?.value;

    if (!clientUuid) {
      toaster.warning({
        title: text.singularLabel,
        description: text.form.enderecoTomadorCascade.promptSelectClient,
      });
      return;
    }

    let cancelled = false;
    setIsFetchingAddress(true);

    getClientAddressForCte(clientUuid)
      .then((address) => {
        if (cancelled) return;
        setValue('ruaTomador', address.address ?? '', { shouldDirty: true });
        setValue('numeroTomador', address.number ?? '', { shouldDirty: true });
        setValue('bairroTomador', address.district ?? '', { shouldDirty: true });
        setValue('cepTomador', address.zipCode ?? '', { shouldDirty: true });
        setValue(
          'cidadeTomador',
          address.city ? { value: address.city.uuid, label: address.city.name } : null,
          { shouldDirty: true }
        );
      })
      .catch((error) => {
        if (cancelled) return;
        const is403 = isAxiosError(error) && error.response?.status === 403;
        toaster.error({
          title: text.singularLabel,
          description: is403
            ? text.form.enderecoTomadorCascade.permissionDenied
            : text.form.enderecoTomadorCascade.genericError,
        });
      })
      .finally(() => {
        if (!cancelled) setIsFetchingAddress(false);
      });

    return () => {
      cancelled = true;
    };
    // Dep proposital: só o seletor (`enderecoTomador`) dispara a cascata
    // (Contrato §2.5/roteiro passo 1) — remetente/destinatário lidos frescos
    // no corpo do efeito, sem re-disparar a consulta ao mudar sozinhos.
  }, [enderecoTomadorOption?.value]);

  // ---- Natureza -> IBS/CBS (T-776-FE-02, P-06) --------------------------------
  // Ao trocar a natureza, copia os campos RTC dela SÓ para os que o usuário não
  // editou. Falha (403/erro): campos ficam como estão e a API copia da natureza
  // na gravação.
  async function applyNatureRtc(natureUuid: string) {
    try {
      const response = await getNatureOperation(natureUuid);
      const nature = response.data;
      if (!nature) return;
      const edited = rtcEditedRef.current;
      if (!edited.has('cClassTrib')) {
        setValue('cClassTrib', nature.c_class_trib ?? '', { shouldDirty: true });
      }
      if (!edited.has('cstIbsCbs')) {
        setValue('cstIbsCbs', getCstIbsCbsOption(nature.cst_ibs_cbs), { shouldDirty: true });
      }
      RTC_PERCENT_FIELDS.forEach(({ form, api }) => {
        if (edited.has(form)) return;
        const value = nature[api] as number | null | undefined;
        setValue(form, value ?? null, { shouldDirty: true });
      });
    } catch {
      // sem permissão/erro: deixa como está (P-06, R-FE-06).
    }
  }

  function markRtcEdited(name: RtcFieldName) {
    rtcEditedRef.current.add(name);
  }

  // ---- Persistência ----------------------------------------------------------
  const cteMutation = useRequest({
    asyncFunction: tryPersistCte,
    entityName: text.singularLabel,
    queryKey: queryKey.ctes.ctesList,
    queryKey2: queryKey.ctes.cte,
    typesRequest: isEditing ? 'update' : 'create',
    personalizedMessage: isEditing ? text.list.toast.updateSuccess : text.list.toast.createSuccess,
    actionSuccess: () => navigate(CTE_LIST_ROUTE),
  });

  async function tryPersistCte(data: CteForm) {
    // Payload SEMPRE completo (create E update — mirror `IG08`, Contrato
    // §2.1 item 4: nunca PATCH parcial neste form).
    const payload: CreateCteRequest = {
      // GAP-SEC-09 P0-B — uuid de `nature_operations` (FK tenant-scoped).
      natureza_id: data.natureza!.value,
      globalizado: Number(data.globalizado!.value) as 0 | 1,
      cst: data.cst!.value,
      perc_icms: data.percIcms!,
      // UT-000776 — RTC opcional: vazio é omitido (a API copia da natureza).
      c_class_trib: data.cClassTrib || undefined,
      cst_ibs_cbs: data.cstIbsCbs?.value || undefined,
      perc_ibs_uf: data.percIbsUf ?? undefined,
      perc_ibs_mun: data.percIbsMun ?? undefined,
      perc_cbs: data.percCbs ?? undefined,
      perc_reducao_aliq_ibs_uf: data.percReducaoAliqIbsUf ?? undefined,
      perc_reducao_aliq_ibs_mun: data.percReducaoAliqIbsMun ?? undefined,
      perc_reducao_aliq_cbs: data.percReducaoAliqCbs ?? undefined,
      perc_dif_ibs_uf: data.percDifIbsUf ?? undefined,
      perc_dif_ibs_mun: data.percDifIbsMun ?? undefined,
      perc_dif_cbs: data.percDifCbs ?? undefined,
      remetente_id: data.remetente!.value,
      destinatario_id: data.destinatario!.value,
      chaves_nfe: data.chavesNfe.map((item) => item.value),
      tpDoc: data.tpDoc?.value,
      descOutros: data.descOutros || undefined,
      nDoc: data.nDoc ?? undefined,
      vDocFisc: data.vDocFisc ?? undefined,
      equipment_id: data.equipment!.value,
      produto_predominante: data.produtoPredominante,
      tomador: data.tomador!.value,
      valor_carga: data.valorCarga!,
      valor_transporte: data.valorTransporte!,
      valor_receber: data.valorReceber!,
      modal: data.modal!.value,
      medidas: data.medidas.map((medida) => ({
        cod_unidade: medida.codUnidade!.value,
        tipo_medida: medida.tipoMedida!.value,
        quantidade_carga: medida.quantidadeCarga!,
      })),
      componentes: data.componentes.map((componente) => ({
        nome: componente.nome,
        valor: componente.valor!,
      })),
      endereco_tomador: data.enderecoTomador?.value,
      rua_tomador: data.ruaTomador,
      numero_tomador: data.numeroTomador,
      bairro_tomador: data.bairroTomador,
      cep_tomador: data.cepTomador,
      cidade_tomador: data.cidadeTomador!.value,
      data_prevista_entrega: data.dataPrevistaEntrega,
      municipio_envio: data.municipioEnvio!.value,
      municipio_inicio: data.municipioInicio!.value,
      municipio_fim: data.municipioFim!.value,
      retira: data.retira ? (Number(data.retira.value) as 0 | 1) : undefined,
      detalhes_retira: data.detalhesRetira || undefined,
      observacao: data.observacao || undefined,
    };

    try {
      return isEditing && uuid ? await updateCte(uuid, payload) : await createCte(payload);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          const mappedField = mapServerFieldToFormField(field);
          if (mappedField && messages?.[0]) {
            setError(mappedField as any, { type: 'server', message: messages[0] });
            if (mappedField === 'tpDoc') setDocTab('1');
          }
        });
      }
      throw error;
    }
  }

  async function onSubmit(data: CteForm) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
      return;
    }
    await cteMutation.mutateAsync(data);
  }

  // `tpDoc` mora na aba "Outros documentos": se a validação client-side o
  // reprova, leva o usuário até a aba para ver o erro.
  function onInvalid(formErrors: typeof errors) {
    if (formErrors.tpDoc) setDocTab('1');
  }

  const isSaving = cteMutation.isPending;

  if (hasMalformedRouteParam) return null;

  if (isLoading) {
    return (
      <FormContainer title={isEditing ? text.form.editTitle : text.form.createTitle} showDivider>
        <Box pt={4}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} height="40px" borderRadius="md" />
            ))}
          </SimpleGrid>
        </Box>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={isEditing ? text.form.editTitle : text.form.createTitle}
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
              type="submit"
              form="cte-form"
              languageGB={languageGB}
              loading={isSaving || isSubmitting}
              disabled={isSaving || isSubmitting}
            />
          )}
        </>
      }
    >
      <Form id="cte-form" noPadding onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="natureza"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.natureza}
                service={listActiveNatureOperations}
                mapOptions={mapNatureOperationOption as any}
                value={field.value ?? undefined}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  if (option?.value) void applyNatureRtc(option.value);
                }}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="globalizado"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={text.form.fields.globalizado}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={cteGlobalizadoOptions.options(languageGB)}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
              />
            )}
          />

          <Controller
            name="cst"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={text.form.fields.cst}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={cteCstOptions.options()}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
              />
            )}
          />

          <Controller
            name="percIcms"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <PercentInput
                name={field.name}
                label={text.form.fields.percIcms}
                value={field.value}
                onValueChange={field.onChange}
                error={error?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          {/* ---- UT-000776 (M5) — IBS/CBS pela natureza, editáveis (UX-GAP-776-02:
              mesma seção de cst/perc_icms, componentes já usados na tela) ---- */}
          <Box gridColumn="1 / -1">
            <Text fontSize="sm" fontWeight="semibold">
              {text.form.rtcSectionTitle}
            </Text>
            <Text fontSize="xs" color="fg.muted">
              {text.form.rtcSectionHint}
            </Text>
          </Box>

          <Controller
            name="cClassTrib"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Input
                label={text.form.fields.cClassTrib}
                maxLength={6}
                inputMode="numeric"
                name={field.name}
                value={field.value ?? ''}
                onChange={(event) => {
                  markRtcEdited('cClassTrib');
                  field.onChange(event.target.value.replace(/\D/g, ''));
                }}
                onBlur={field.onBlur}
                error={error?.message}
                disabled={!canSave}
              />
            )}
          />

          <Controller
            name="cstIbsCbs"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={text.form.fields.cstIbsCbs}
                name={field.name}
                value={field.value}
                onChange={(option: any) => {
                  markRtcEdited('cstIbsCbs');
                  field.onChange(option ?? null);
                }}
                options={nfeCstIbsCbsOptions}
                error={error?.message}
                isDisabled={!canSave}
              />
            )}
          />

          {RTC_PERCENT_FIELDS.map(({ form, label }) => (
            <Controller
              key={form}
              name={form}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <NumberInput
                  name={field.name}
                  label={text.form.fields[label]}
                  allowDot
                  decimalPlaces={4}
                  value={field.value ?? null}
                  onValueChange={(value) => {
                    markRtcEdited(form);
                    field.onChange(value);
                  }}
                  error={error?.message}
                  disabled={!canSave}
                />
              )}
            />
          ))}

          <Controller
            name="remetente"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={text.form.fields.remetente}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={clientOptions}
                error={error?.message}
                isRequired
                loading={clientsQuery.isLoading}
                isDisabled={!canSave}
              />
            )}
          />

          <Controller
            name="destinatario"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={text.form.fields.destinatario}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={clientOptions}
                error={error?.message}
                isRequired
                loading={clientsQuery.isLoading}
                isDisabled={!canSave}
              />
            )}
          />

          <Controller
            name="equipment"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.equipment}
                service={getEquipmentsOptions as any}
                pageSize={20}
                mapOptions={mapEquipmentOption as any}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Input
            label={text.form.fields.produtoPredominante}
            maxLength={30}
            {...register('produtoPredominante')}
            error={errors.produtoPredominante?.message}
            isRequired
            disabled={!canSave}
          />

          <Controller
            name="tomador"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={text.form.fields.tomador}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={cteTomadorOptions.options()}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
              />
            )}
          />

          <Controller
            name="valorCarga"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <MoneyInput
                name={field.name}
                label={text.form.fields.valorCarga}
                value={field.value}
                onValueChange={field.onChange}
                error={error?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          <Controller
            name="modal"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={text.form.fields.modal}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={cteModalOptions.options()}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
              />
            )}
          />
        </SimpleGrid>

        {/* ---- Tabs sempre visíveis (Contrato §2.1) ---- */}
        <Box mt={6}>
          <Tabs.Root
            value={docTab}
            onValueChange={(details: { value: string }) => setDocTab(details.value)}
            variant="outline"
          >
            {/* @ts-ignore ChakraUI v3 headless tabs: tipos ainda não compatíveis */}
            <Tabs.List>
              {/* @ts-ignore */}
              <Tabs.Trigger value="0">{text.form.tabs.nfeReferenciada}</Tabs.Trigger>
              {/* @ts-ignore */}
              <Tabs.Trigger value="1">{text.form.tabs.outrosDocumentos}</Tabs.Trigger>
            </Tabs.List>

            {/* @ts-ignore */}
            <Tabs.Content value="0">
              <Box pt={4}>
                <ChavesNfeFieldArray
                  control={control}
                  fields={chavesNfeArray.fields}
                  append={chavesNfeArray.append}
                  remove={chavesNfeArray.remove}
                  errors={errors}
                  disabled={!canSave}
                />
              </Box>
            </Tabs.Content>

            {/* @ts-ignore */}
            <Tabs.Content value="1">
              <SimpleGrid columns={columnsForm.default} gap={6} pt={4}>
                <Controller
                  name="tpDoc"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <Select
                      label={text.form.fields.tpDoc}
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      options={cteTipoDocumentoOptions.options()}
                      error={error?.message}
                      isDisabled={!canSave}
                    />
                  )}
                />
                <Input
                  label={text.form.fields.descOutros}
                  maxLength={100}
                  {...register('descOutros')}
                  error={errors.descOutros?.message}
                  disabled={!canSave}
                />
                <Controller
                  name="nDoc"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <Input
                      type="number"
                      label={text.form.fields.nDoc}
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === '' ? null : Number(event.target.value)
                        )
                      }
                      error={error?.message}
                      disabled={!canSave}
                    />
                  )}
                />
                <Controller
                  name="vDocFisc"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <MoneyInput
                      name={field.name}
                      label={text.form.fields.vDocFisc}
                      value={field.value}
                      onValueChange={field.onChange}
                      error={error?.message}
                      disabled={!canSave}
                    />
                  )}
                />
              </SimpleGrid>
            </Tabs.Content>
          </Tabs.Root>
        </Box>

        {/* ---- Medidas (F20-F22, TASK-CTE-FE-04) ---- */}
        <Box mt={6}>
          <MedidasFieldArray
            control={control}
            fields={medidasArray.fields}
            append={medidasArray.append}
            remove={medidasArray.remove}
            errors={errors}
            disabled={!canSave}
          />
        </Box>

        {/* ---- Componentes (F23-F24, TASK-CTE-FE-04) ---- */}
        <Box mt={6}>
          <ComponentesFieldArray
            control={control}
            fields={componentesArray.fields}
            append={componentesArray.append}
            remove={componentesArray.remove}
            errors={errors}
            disabled={!canSave}
          />
        </Box>

        {/* ---- Endereço do tomador (F25-F30, TASK-CTE-FE-05) ---- */}
        <Box mt={6}>
          <Text fontSize="sm" fontWeight="semibold" mb={4}>
            {text.form.fields.enderecoTomador}
          </Text>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="enderecoTomador"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.form.fields.enderecoTomador}
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  options={cteEnderecoTomadorOptions.options()}
                  loading={isFetchingAddress}
                  isDisabled={!canSave}
                />
              )}
            />
            <Input
              label={text.form.fields.ruaTomador}
              maxLength={80}
              {...register('ruaTomador')}
              error={errors.ruaTomador?.message}
              isRequired
              disabled={!canSave || isFetchingAddress}
            />
            <Input
              label={text.form.fields.numeroTomador}
              maxLength={20}
              {...register('numeroTomador')}
              error={errors.numeroTomador?.message}
              isRequired
              disabled={!canSave || isFetchingAddress}
            />
            <Input
              label={text.form.fields.bairroTomador}
              maxLength={40}
              {...register('bairroTomador')}
              error={errors.bairroTomador?.message}
              isRequired
              disabled={!canSave || isFetchingAddress}
            />
            <Input
              label={text.form.fields.cepTomador}
              maxLength={10}
              {...register('cepTomador')}
              error={errors.cepTomador?.message}
              isRequired
              disabled={!canSave || isFetchingAddress}
            />
            <Controller
              name="cidadeTomador"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.form.fields.cidadeTomador}
                  service={getCitiesOptions as any}
                  pageSize={20}
                  mapOptions={mapCityOption as any}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave || isFetchingAddress}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          </SimpleGrid>
        </Box>

        {/* ---- Demais campos principais (F31-F39) ---- */}
        <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
          <Controller
            name="dataPrevistaEntrega"
            control={control}
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <Field
                label={text.form.fields.dataPrevistaEntrega}
                isRequired
                errorText={error?.message}
                invalid={!!error}
              >
                <DateInput value={value || null} onChange={(v) => onChange(v ?? '')} />
              </Field>
            )}
          />

          <Controller
            name="valorTransporte"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <MoneyInput
                name={field.name}
                label={text.form.fields.valorTransporte}
                helperText={text.form.valorTransporteHint}
                value={field.value}
                onValueChange={field.onChange}
                error={error?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          <Controller
            name="valorReceber"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <MoneyInput
                name={field.name}
                label={text.form.fields.valorReceber}
                helperText={text.form.valorTransporteHint}
                value={field.value}
                onValueChange={field.onChange}
                error={error?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          <Controller
            name="municipioEnvio"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.municipioEnvio}
                service={getCitiesOptions as any}
                pageSize={20}
                mapOptions={mapCityOption as any}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="municipioInicio"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.municipioInicio}
                service={getCitiesOptions as any}
                pageSize={20}
                mapOptions={mapCityOption as any}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="municipioFim"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.form.fields.municipioFim}
                service={getCitiesOptions as any}
                pageSize={20}
                mapOptions={mapCityOption as any}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="retira"
            control={control}
            render={({ field }) => (
              <Select
                label={text.form.fields.retira}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={cteRetiraOptions.options(languageGB)}
                isDisabled={!canSave}
              />
            )}
          />

          <Input
            label={text.form.fields.detalhesRetira}
            maxLength={100}
            {...register('detalhesRetira')}
            error={errors.detalhesRetira?.message}
            disabled={!canSave}
          />

          <Box gridColumn={{ base: 'auto', md: 'span 2' }}>
            <Textarea
              label={text.form.fields.observacao}
              maxLength={191}
              {...register('observacao')}
              error={errors.observacao?.message}
              disabled={!canSave}
            />
          </Box>
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
