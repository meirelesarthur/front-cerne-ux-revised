// src/pages/Fiscal/Mdfe/CreateOrUpdateMdfe.tsx
// -----------------------------------------------------------------------------
// Casca de Cadastro/Edição de MDFe (domínio Fiscal-Transporte) — TASK-MDFE-FE-03
// (`CONTRATO-FRONT-MDFE.md §5.1/§5.5/§5.6/§5.7`), mirror estrutural
// `CreateOrUpdateNfe.tsx`/`CreateOrUpdateCte.tsx`. UM ÚNICO `useForm`
// (`MdfeForm`) + `Tabs.Root` (3 abas) + UM ÚNICO `<Form id="mdfe-form">`
// envolvendo as 3 `Tabs.Content` (Pattern 11 — nunca um `<Form>` por aba).
// `MdfeTabGeral`/`MdfeTabTransporte`/`MdfeTabDescarga` (TASK-MDFE-FE-04/05)
// recebem `control`/`register`/`errors`/`watch`/`setValue` por prop — NUNCA
// instanciam `useForm` próprio.
//
// Gate de cota mensal (só em criação, `GET /mdfes/quota`, `GAP-MDFE-06`
// backend): bloqueia a RENDERIZAÇÃO do form (não CSS disabled) quando
// `blocked: true`.
//
// Guarda de estado bloqueado (`AC009`): em edição, se `estado` não estiver
// em `MDFE_EDITABLE_ESTADOS`, redireciona para o Detalhe ANTES do usuário
// poder editar (mirror `CreateOrUpdateNfe.tsx:568-573`).
// -----------------------------------------------------------------------------

import { useEffect, useRef } from 'react';

import { Box, EmptyState, Icon, Skeleton, SimpleGrid, Tabs, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FieldErrors, useForm } from 'react-hook-form';
import { FiLock } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Tooltip } from '@/components/TooLtip';
import { toaster } from '@/components/ui/toaster';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useCustomSearch } from '@/hooks/useCustomSearch';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';
import { formatCnpj, formatCpfCnpjProgressive } from '@/utils/masks/document';
import { formatPlateIfValid } from '@/utils/masks/plate';

import { ufOptions } from '@/constants/BaseRegistrations/options/uf-options';
import { columnsForm } from '@/constants/coluns-form';
import { isMdfeEditable } from '@/constants/Fiscal/mdfe-estado-options';
import {
  mdfePaymentComponentOptions,
  mdfePaymentTypeOptions,
} from '@/constants/Fiscal/mdfe-payment-options';
import { mdfeTipoCargaOptions } from '@/constants/Fiscal/mdfe-tipo-carga-options';
import { mdfeUnidadeTransporteOptions } from '@/constants/Fiscal/mdfe-unidade-transporte-options';
import { queryKey } from '@/constants/query-key';

import { mdfeSchemaResolver } from '@/validations/schemas/Mdfe/mdfe-schema';

import { createMdfe, getMdfe, getMdfeQuota, updateMdfe } from '@/services/v2/Fiscal/mdfe-service';

import type { Option } from '@/@types/option';
import type { MdfeData, MdfeForm as MdfeFormType, MdfePayload } from '@/@types/v2/Fiscal/Mdfe';

import { extractCiotFieldError, MDFE_TRANSPORT_TAB_INDEX } from './mdfe-ciot-errors';
import { MdfeTabDescarga } from './MdfeTabDescarga';
import { MdfeTabGeral, mdfeCargaPosteriorOptions, mdfeTypeEmissionOptions } from './MdfeTabGeral';
import { MdfeTabTransporte, mdfeTpEmitOptions, mdfeTpTranspOptions } from './MdfeTabTransporte';

const MDFE_LIST_ROUTE = '/fiscal/mdfe-lista';

function findOption<T>(options: Option<T>[], value: T | null | undefined): Option<T> | null {
  if (value === null || value === undefined) return null;
  return options.find((option) => option.value === value) ?? null;
}

function defaultValues(languageGB: ReturnType<typeof useLanguage>['languageGB']): MdfeFormType {
  return {
    uf_inicio: null,
    uf_fim: null,
    data_inicio_viagem: null,
    carga_posterior: null,
    // FD002 — default legado "1 - Normal" (LK002).
    type_emission: mdfeTypeEmissionOptions(languageGB)[0] ?? null,
    cnpj_contratante: '',
    quantidade_carga: null,
    valor_carga: null,
    produto_pred_nome: '',
    produto_pred_ncm: '',
    produto_pred_cod_barras: '',
    cep_carrega: '',
    cep_descarrega: '',
    latitude_carregamento: '',
    longitude_carregamento: '',
    latitude_descarregamento: '',
    longitude_descarregamento: '',
    // FD026 — default legado `01` (LK006).
    tp_carga: { value: '01', label: mdfeTipoCargaOptions.getLabel('01', languageGB) },
    seguradora_nome: '',
    seguradora_cnpj: '',
    numero_apolice: '',
    numero_averbacao: '',
    info_complementar: '',
    info_adicional_fisco: '',
    municipios_carregamento: [],
    percursos: [],

    veiculo_tracao_id: null,
    veiculo_reboque_id: null,
    veiculo_reboque2_id: null,
    veiculo_reboque3_id: null,
    // FD007/FD008 — default legado `1` (LK004/LK005).
    tp_emit: mdfeTpEmitOptions(languageGB)[0] ?? null,
    tp_transp: mdfeTpTranspOptions(languageGB)[0] ?? null,
    lac_rodo: '',
    ciots: [],
    vale_pedagios: [],
    payments: [],

    condutor_nome: '',
    condutor_cpf: '',
    info_descarga: [],
  };
}

export default function CreateOrUpdateMdfe() {
  const { mdfeUuid } = useParams<{ mdfeUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.mdfes.mdfe;

  const isEditing = isValidGuid(mdfeUuid);
  const hasWritePermission = isEditing ? can('mdfe_edit') : can('mdfe_create');

  const { tabIndex, handleTabsChange } = useCustomSearch();

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<MdfeFormType>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: mdfeSchemaResolver(languageGB),
    defaultValues: defaultValues(languageGB),
  });

  // ---- Gate de cota mensal (só em criação, GAP-MDFE-06 backend) -----------
  const quotaQuery = useQuery({
    queryKey: ['mdfe-quota'],
    queryFn: async () => (await getMdfeQuota()).data,
    enabled: !isEditing,
    retry: false,
  });
  const isQuotaBlocked = !isEditing && quotaQuery.data?.blocked === true;

  // ---- Hidratação (Lei 2: `!isEmpty(dirtyFields) || resetForce`) + guarda
  // de estado bloqueado (`AC009`) ------------------------------------------
  function fillMdfeForm(data: MdfeData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uf_inicio: findOption(ufOptions, data.uf_inicio),
        uf_fim: findOption(ufOptions, data.uf_fim),
        data_inicio_viagem: data.data_inicio_viagem ?? null,
        carga_posterior: findOption(mdfeCargaPosteriorOptions(languageGB), data.carga_posterior),
        type_emission: findOption(mdfeTypeEmissionOptions(languageGB), data.type_emission),
        cnpj_contratante: data.cnpj_contratante
          ? formatCpfCnpjProgressive(data.cnpj_contratante)
          : '',
        quantidade_carga: data.quantidade_carga ?? null,
        valor_carga: data.valor_carga ?? null,
        produto_pred_nome: data.produto_pred_nome ?? '',
        produto_pred_ncm: data.produto_pred_ncm ?? '',
        produto_pred_cod_barras: data.produto_pred_cod_barras ?? '',
        cep_carrega: data.cep_carrega ?? '',
        cep_descarrega: data.cep_descarrega ?? '',
        latitude_carregamento: data.latitude_carregamento ?? '',
        longitude_carregamento: data.longitude_carregamento ?? '',
        latitude_descarregamento: data.latitude_descarregamento ?? '',
        longitude_descarregamento: data.longitude_descarregamento ?? '',
        tp_carga: data.tp_carga
          ? {
              value: data.tp_carga,
              label: mdfeTipoCargaOptions.getLabel(data.tp_carga, languageGB),
            }
          : null,
        seguradora_nome: data.seguradora_nome ?? '',
        seguradora_cnpj: data.seguradora_cnpj ? formatCnpj(data.seguradora_cnpj) : '',
        numero_apolice: data.numero_apolice ?? '',
        numero_averbacao: data.numero_averbacao ?? '',
        info_complementar: data.info_complementar ?? '',
        info_adicional_fisco: data.info_adicional_fisco ?? '',
        // BUG-PROD homologação 2026-09 — `item.cidade_id` já vem como UUID
        // string do backend (`MdfeMunicipioCarregamentoData`); `value` do
        // Select precisa ser o UUID para bater com o que o SUBMIT envia
        // (`tryPersistMdfe` abaixo), senão o PUT falha com 422. Preferir
        // `item.cidade?.uuid` quando presente (mesma fonte, mais explícito).
        municipios_carregamento: (data.municipios_carregamento ?? []).map((item) => ({
          cidade_id: {
            value: item.cidade?.uuid ?? item.cidade_id,
            label: item.cidade?.title ?? item.cidade_id,
          },
        })),
        percursos: (data.percursos ?? []).map((item) => ({
          uf: findOption(ufOptions, item.uf) ?? { value: item.uf, label: item.uf },
        })),

        veiculo_tracao_id: data.veiculo_tracao
          ? {
              value: data.veiculo_tracao.uuid,
              label: `${data.veiculo_tracao.code} — ${data.veiculo_tracao.description}`,
            }
          : null,
        veiculo_reboque_id: data.veiculo_reboque
          ? {
              value: data.veiculo_reboque.uuid,
              label: `${data.veiculo_reboque.code} — ${data.veiculo_reboque.description}`,
            }
          : null,
        veiculo_reboque2_id: data.veiculo_reboque2
          ? {
              value: data.veiculo_reboque2.uuid,
              label: `${data.veiculo_reboque2.code} — ${data.veiculo_reboque2.description}`,
            }
          : null,
        veiculo_reboque3_id: data.veiculo_reboque3
          ? {
              value: data.veiculo_reboque3.uuid,
              label: `${data.veiculo_reboque3.code} — ${data.veiculo_reboque3.description}`,
            }
          : null,
        tp_emit: findOption(mdfeTpEmitOptions(languageGB), data.tp_emit),
        tp_transp: findOption(mdfeTpTranspOptions(languageGB), data.tp_transp),
        lac_rodo: data.lac_rodo ?? '',
        ciots: (data.ciots ?? []).map((item) => ({
          codigo: item.codigo,
          cpf_cnpj: item.cpf_cnpj ? formatCpfCnpjProgressive(item.cpf_cnpj) : item.cpf_cnpj,
        })),
        vale_pedagios: (data.vales_pedagio ?? []).map((item) => ({
          cnpj_fornecedor: item.cnpj_fornecedor
            ? formatCpfCnpjProgressive(item.cnpj_fornecedor)
            : item.cnpj_fornecedor,
          cnpj_fornecedor_pagador: item.cnpj_fornecedor_pagador
            ? formatCpfCnpjProgressive(item.cnpj_fornecedor_pagador)
            : item.cnpj_fornecedor_pagador,
          numero_compra: item.numero_compra,
          valor: item.valor,
        })),
        payments: (data.payments ?? []).map((item) => ({
          responsible_name: item.responsible_name ?? '',
          responsible_cpf_cnpj: item.responsible_cpf_cnpj
            ? formatCpfCnpjProgressive(item.responsible_cpf_cnpj)
            : '',
          payment_type: findOption(mdfePaymentTypeOptions.options(languageGB), item.payment_type),
          component_type: findOption(
            mdfePaymentComponentOptions.options(languageGB),
            item.component_type
          ),
          amount: item.amount ?? null,
          bank_code: item.bank_code ? { value: item.bank_code, label: item.bank_code } : null,
          agency_code: item.agency_code ?? '',
          cnpj_ipef: item.cnpj_ipef ? formatCpfCnpjProgressive(item.cnpj_ipef) : '',
          pix_key: item.pix_key ?? '',
          additional_info: item.additional_info ?? '',
        })),

        condutor_nome: data.condutor_nome ?? '',
        condutor_cpf: data.condutor_cpf ?? '',
        info_descarga: (data.info_descarga ?? []).map((item) => ({
          tp_unid_transp: findOption(
            mdfeUnidadeTransporteOptions.options(languageGB),
            item.tp_unid_transp
          ),
          // UT-000787 — placa (tp 1/2) hidratada formatada (ABC1234 -> ABC-1234).
          id_unid_transp:
            item.tp_unid_transp === 1 || item.tp_unid_transp === 2
              ? formatPlateIfValid(item.id_unid_transp)
              : (item.id_unid_transp ?? ''),
          quantidade_rateio: item.quantidade_rateio ?? null,
          // BUG-PROD homologação 2026-09 — mirror `municipios_carregamento`
          // acima: `value` = UUID (`item.cidade?.uuid ?? item.cidade_id`),
          // nunca `String()` do id numérico legado.
          cidade_id: item.cidade
            ? { value: item.cidade.uuid ?? item.cidade_id, label: item.cidade.title }
            : { value: item.cidade_id, label: item.cidade_id },
          chave_nfe: item.nfe_descarga?.chave ?? '',
          seg_cod_nfe: item.nfe_descarga?.seg_cod_barras ?? '',
          chave_cte: item.cte_descarga?.chave ?? '',
          seg_cod_cte: item.cte_descarga?.seg_cod_barras ?? '',
          unidade_carga: item.unidade_carga
            ? {
                id_unidade_carga: item.unidade_carga.id_unidade_carga,
                quantidade_rateio: item.unidade_carga.quantidade_rateio,
              }
            : null,
          lacre_unidade_cargas: (item.lacre_unidade_cargas ?? []).map((lacre) => ({
            numero: lacre.numero,
          })),
          lacre_transportes: (item.lacre_transportes ?? []).map((lacre) => ({
            numero: lacre.numero,
          })),
        })),
      });
    }

    // Guarda de estado bloqueado (`AC009`) — nunca deixa editar um MDFe fora
    // de `MDFE_EDITABLE_ESTADOS` via URL direta, mesmo com a ação de Editar
    // já oculta na Listagem (mirror `CreateOrUpdateNfe.tsx:568-573`).
    if (isEditing && !isMdfeEditable(data.estado)) {
      toaster.warning({
        title: text.form.editBlockedToast.title,
        description: text.form.editBlockedToast.description,
      });
      navigate(`${MDFE_LIST_ROUTE}/${data.uuid}/visualizar`, { replace: true });
    }
  }

  const mdfeQuery = useCustomFormQueryById<MdfeData>({
    registrationId: isEditing && mdfeUuid ? mdfeUuid : '',
    queryKey: queryKey.mdfes.mdfe,
    asyncFunction: getMdfe,
    fillForm: fillMdfeForm,
  });

  const isLoading = isEditing && checkLoadingStatus([mdfeQuery as any]);

  // ---- Gate de habilitação do Salvar (`CV006`, `CONTRATO-FRONT-MDFE.md
  // §5.5`) — cruza 2 coleções + 2 campos escalares -------------------------
  const municipios = watch('municipios_carregamento');
  const infoDescarga = watch('info_descarga');
  const condutorNome = watch('condutor_nome');
  const condutorCpf = watch('condutor_cpf');
  const hasMunicipioCarregamento = (municipios?.length ?? 0) >= 1;
  const hasInfoDescarga = (infoDescarga?.length ?? 0) >= 1;
  const canSaveGate =
    hasMunicipioCarregamento && hasInfoDescarga && !!condutorNome && !!condutorCpf;

  // CORREÇÃO ADICIONAL (retest do dono, lote-2) — o dono confirmou que o
  // Salvar continuava desabilitado mesmo com os campos com `*` preenchidos
  // porque `canSaveGate` também exige as 2 subcoleções (`municipios_
  // carregamento`/`info_descarga`, seção "adicionar item à lista" sem
  // nenhuma indicação de obrigatoriedade). Tooltip lista SÓ o que falta,
  // mirror `WeighingHeaderFields.tsx::sanitaryTooltip` — nunca menciona o
  // que já está preenchido.
  const saveDisabledText = text.form.saveDisabledTooltip;
  const missingSaveGateItems: string[] = [];
  if (!hasMunicipioCarregamento) missingSaveGateItems.push(saveDisabledText.municipioCarregamento);
  if (!hasInfoDescarga) missingSaveGateItems.push(saveDisabledText.infoDescarga);
  if (!condutorNome) missingSaveGateItems.push(saveDisabledText.condutorNome);
  if (!condutorCpf) missingSaveGateItems.push(saveDisabledText.condutorCpf);
  const saveGateTooltip =
    missingSaveGateItems.length > 0
      ? `${saveDisabledText.prefix}${missingSaveGateItems.join(', ')}`
      : undefined;

  // ---- Persistência (`CONTRATO-FRONT-MDFE.md §5.6`) -----------------------
  const mdfeMutation = useRequest({
    asyncFunction: tryPersistMdfe,
    entityName: text.singularLabel,
    queryKey: queryKey.mdfes.mdfesList,
    queryKey2: queryKey.mdfes.mdfe,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: (data) => {
      if (!isEditing) {
        navigate(`${MDFE_LIST_ROUTE}/${data.uuid}/visualizar`, { replace: true });
      } else {
        navigate(-1);
      }
    },
  });

  async function tryPersistMdfe(data: MdfeFormType) {
    const payload: MdfePayload = {
      uf_inicio: data.uf_inicio!.value,
      uf_fim: data.uf_fim!.value,
      data_inicio_viagem: data.data_inicio_viagem!,
      carga_posterior: !!data.carga_posterior?.value,
      type_emission: data.type_emission!.value,
      cnpj_contratante: data.cnpj_contratante,
      quantidade_carga: Number(data.quantidade_carga ?? 0),
      valor_carga: Number(data.valor_carga ?? 0),
      produto_pred_nome: data.produto_pred_nome,
      produto_pred_ncm: data.produto_pred_ncm,
      produto_pred_cod_barras: data.produto_pred_cod_barras,
      cep_carrega: data.cep_carrega,
      cep_descarrega: data.cep_descarrega,
      latitude_carregamento: data.latitude_carregamento,
      longitude_carregamento: data.longitude_carregamento,
      latitude_descarregamento: data.latitude_descarregamento,
      longitude_descarregamento: data.longitude_descarregamento,
      // FD026 — não obrigatório no schema (default `01`); nunca `!` aqui.
      tp_carga: data.tp_carga?.value ?? '01',
      seguradora_nome: data.seguradora_nome,
      seguradora_cnpj: data.seguradora_cnpj,
      numero_apolice: data.numero_apolice,
      numero_averbacao: data.numero_averbacao,
      info_complementar: data.info_complementar,
      info_adicional_fisco: data.info_adicional_fisco,
      // GAP-FE-245 (Bug 2) — `cidade_id` é uuid (`MdfeTabGeral.tsx` monta o
      // Select com `value: city.uuid`); `Number(uuid)` virava `NaN` →
      // serializava `null` no JSON e o backend rejeitava como "obrigatório"
      // mesmo com cidade selecionada. Enviar a uuid string tal como o Select
      // produz, mirror `veiculo_tracao_id`/reboques abaixo.
      municipios_carregamento: data.municipios_carregamento.map((item) => ({
        cidade_id: item.cidade_id!.value,
        cidade: null,
      })),
      percursos: data.percursos.map((item) => ({ uf: item.uf!.value })),

      veiculo_tracao_id: data.veiculo_tracao_id!.value,
      veiculo_reboque_id: data.veiculo_reboque_id?.value ?? null,
      veiculo_reboque2_id: data.veiculo_reboque2_id?.value ?? null,
      veiculo_reboque3_id: data.veiculo_reboque3_id?.value ?? null,
      tp_emit: data.tp_emit?.value ?? 1,
      tp_transp: data.tp_transp?.value ?? 1,
      lac_rodo: data.lac_rodo,
      ciots: data.ciots.map((item) => ({ codigo: item.codigo, cpf_cnpj: item.cpf_cnpj })),
      vale_pedagios: data.vale_pedagios.map((item) => ({
        cnpj_fornecedor: item.cnpj_fornecedor,
        cnpj_fornecedor_pagador: item.cnpj_fornecedor_pagador,
        numero_compra: item.numero_compra,
        valor: Number(item.valor ?? 0),
      })),
      payments: data.payments.map((item) => ({
        payment_type: item.payment_type?.value ?? 0,
        component_type: item.component_type?.value ?? '01',
        responsible_cpf_cnpj: item.responsible_cpf_cnpj || null,
        responsible_name: item.responsible_name || null,
        amount: Number(item.amount ?? 0),
        additional_info: item.additional_info || null,
        bank_code: item.bank_code?.value ?? null,
        agency_code: item.agency_code || null,
        cnpj_ipef: item.cnpj_ipef || null,
        pix_key: item.pix_key || null,
      })),

      condutor_nome: data.condutor_nome,
      condutor_cpf: data.condutor_cpf,
      // GAP-MDFE-FE-07 — `unidade_carga`/`nfe_descarga`/`cte_descarga` são
      // `sometimes|array` em `MdfeRequest::rules()`: `sometimes` só dispensa
      // a regra quando a CHAVE está AUSENTE do payload; com a chave presente
      // e valor `null`, a regra `array` rejeita ("deve ser uma matriz") e o
      // `POST /api/v1/mdfes` sempre voltava 422 mesmo com o mínimo
      // preenchido. Spread condicional — OMITE a chave quando vazia, nunca
      // envia `null` (mirror `veiculo_reboque_id` etc., que são `nullable`
      // de verdade e por isso continuam podendo enviar `null`).
      info_descarga: data.info_descarga.map((item) => {
        const hasUnidadeCarga = !!item.unidade_carga;
        const hasNfeDescarga = !!(item.chave_nfe && item.seg_cod_nfe);
        const hasCteDescarga = !!(item.chave_cte && item.seg_cod_cte);

        return {
          // GAP-FE-245 (Bug 2) — mesma correção do bloco `municipios_carregamento`
          // acima: uuid string, nunca `Number()`.
          cidade_id: item.cidade_id!.value,
          cidade: null,
          tp_unid_transp: item.tp_unid_transp?.value ?? 1,
          id_unid_transp: item.id_unid_transp,
          quantidade_rateio: Number(item.quantidade_rateio ?? 0),
          ...(hasUnidadeCarga
            ? {
                unidade_carga: {
                  id_unidade_carga: item.unidade_carga!.id_unidade_carga,
                  quantidade_rateio: Number(item.unidade_carga!.quantidade_rateio ?? 0),
                },
              }
            : {}),
          lacre_unidade_cargas: item.lacre_unidade_cargas,
          lacre_transportes: item.lacre_transportes,
          ...(hasNfeDescarga
            ? { nfe_descarga: { chave: item.chave_nfe, seg_cod_barras: item.seg_cod_nfe } }
            : {}),
          ...(hasCteDescarga
            ? { cte_descarga: { chave: item.chave_cte, seg_cod_barras: item.seg_cod_cte } }
            : {}),
        };
      }),
    };

    // Update — payload SEMPRE completo (backend apaga+recria as 6
    // coleções filhas a cada update, `CONTRATO-FRONT-MDFE.md §5.6`).
    if (isEditing && mdfeUuid) {
      return await updateMdfe(mdfeUuid, payload);
    }
    return await createMdfe(payload);
  }

  // BUG-PROD homologação 2026-09 — guarda de duplo-submit local (toast verde
  // + vermelho juntos): 2 cliques rápidos (ou Enter + clique) chamam
  // `handleSubmit(onSubmit)` 2x ANTES do React re-renderizar o botão com
  // `disabled`/`loading` (`mdfeMutation.isPending` só reflete no DOM no
  // próximo render, não é síncrono). Um `useRef` é síncrono e visível na
  // mesma re-entrância, então bloqueia a 2ª chamada mesmo nesse intervalo —
  // dispara 2 requisições, `onSuccess`/`onError` são exclusivos por
  // chamada e mostram os 2 toasts (`duration 7000`) sobrepostos. Escopo
  // local ao componente (`useRequest.tsx` é compartilhado — não mexer lá).
  const isSubmittingRef = useRef(false);

  async function onSubmit(data: MdfeFormType) {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      await mdfeMutation.mutateAsync(data);
    } catch (error) {
      // T-776-FE-03: 422 `ciots`/`ciots.N.codigo` da API → erro no campo + leva à aba Transporte.
      const ciotMessage = extractCiotFieldError(error);
      if (!ciotMessage) throw error;
      setError('ciots', { type: 'server', message: ciotMessage });
      handleTabsChange(MDFE_TRANSPORT_TAB_INDEX);
    } finally {
      isSubmittingRef.current = false;
    }
  }

  // CORREÇÃO ADICIONAL (retest do dono, lote-2) — mesma classe de bug já
  // corrigida em `CreateCashBook.tsx`/`CreateOrUpdateContrato.tsx`/
  // `CreateOrUpdateNfe.tsx`: clicar "Salvar" com o form inválido (ex.: campo
  // obrigatório vazio numa aba não visível no momento, ou tipo de dado
  // errado) não dava NENHUM feedback — `handleSubmit` só atualizava `errors`
  // em silêncio, sem toast nem indicação de qual aba/campo falhou. Guarda
  // `onInvalid` mirror do padrão já em produção: toast com a mensagem REAL
  // do 1º erro, já localizada pelo Yup/schema resolver.
  function onInvalid(formErrors: FieldErrors<MdfeFormType>) {
    const firstErrorMessage = Object.values(formErrors).find(
      (fieldError): fieldError is { message?: string } =>
        !!fieldError && typeof fieldError === 'object' && 'message' in fieldError
    )?.message;

    // T-776-FE-03: erro de CIOT mora na aba Transporte — leva o usuário até lá.
    if (formErrors.ciots) handleTabsChange(MDFE_TRANSPORT_TAB_INDEX);

    toaster.error({
      title: isEditing ? text.form.title.edit : text.form.title.create,
      description: firstErrorMessage || text.singularLabel,
      duration: 7000,
    });
  }

  const isSaving = mdfeMutation.isPending;

  useEffect(() => {
    if (mdfeUuid && !isValidGuid(mdfeUuid)) {
      navigate(MDFE_LIST_ROUTE, { replace: true });
    }
  }, [mdfeUuid, navigate]);

  if (isQuotaBlocked) {
    return (
      <FormContainer title={isEditing ? text.form.title.edit : text.form.title.create}>
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiLock} boxSize={8} color="fg.muted" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1}>
              <EmptyState.Title>{text.singularLabel}</EmptyState.Title>
              <EmptyState.Description>{text.list.quotaBlockedMessage}</EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      </FormContainer>
    );
  }

  if (isLoading) {
    return (
      <FormContainer title={isEditing ? text.form.title.edit : text.form.title.create} showDivider>
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
      title={isEditing ? text.form.title.edit : text.form.title.create}
      subtitle={isEditing ? text.form.subtitle.edit : text.form.subtitle.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          {hasWritePermission && (
            <Tooltip content={saveGateTooltip} disabled={!!canSaveGate}>
              <ButtonSaveAndNext
                create={!isEditing}
                dirtyFields={dirtyFields}
                type="submit"
                form="mdfe-form"
                languageGB={languageGB}
                loading={isSaving || isSubmitting}
                disabled={!canSaveGate || isSaving || isSubmitting}
              />
            </Tooltip>
          )}
        </>
      }
    >
      <Form id="mdfe-form" noPadding onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <Tabs.Root
          value={String(tabIndex)}
          onValueChange={(details: { value: string }) => handleTabsChange(Number(details.value))}
          variant="outline"
        >
          <Tabs.List position="sticky" top="0" zIndex={1} bg="formBG">
            <Tabs.Trigger value="0">{text.tabs.geral}</Tabs.Trigger>
            <Tabs.Trigger value="1">{text.tabs.transporte}</Tabs.Trigger>
            <Tabs.Trigger value="2">{text.tabs.descarga}</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="0">
            <MdfeTabGeral
              control={control}
              register={register}
              errors={errors}
              watch={watch}
              disabled={!hasWritePermission}
            />
          </Tabs.Content>

          <Tabs.Content value="1">
            <MdfeTabTransporte
              control={control}
              register={register}
              errors={errors}
              watch={watch}
              disabled={!hasWritePermission}
            />
          </Tabs.Content>

          <Tabs.Content value="2">
            <MdfeTabDescarga
              control={control}
              register={register}
              errors={errors}
              disabled={!hasWritePermission}
            />
          </Tabs.Content>
        </Tabs.Root>
      </Form>
    </FormContainer>
  );
}
