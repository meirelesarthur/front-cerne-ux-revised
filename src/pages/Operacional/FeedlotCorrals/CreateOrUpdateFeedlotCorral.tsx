// src/pages/Operacional/FeedlotCorrals/CreateOrUpdateFeedlotCorral.tsx
// -----------------------------------------------------------------------------
// Casca de CADASTRO/EDIÇÃO (wizard 3 etapas) de CURRAL (FeedlotCorral) —
// Operacional/Confinamento. Rotas: /operacional/currais/novo (create) e
// /operacional/currais/:uuid (edit) — guardadas por `feedlot-corrals_view`/
// `feedlot-corrals_edit`. TASK-043-CUR-T03 (`03-Wizard-Casca-Etapa1.md`,
// DEC-043-CURRAIS-FORM) — SUBSTITUI por inteiro a casca mínima da T01.
//
// `FeedlotCorralForm`/`FeedlotCorralDialog`/`feedlotCorral-schema` do Mapa
// ficam INTOCADOS — este componente usa o schema/tipo NOVOS
// (`FeedlotCorralWizardForm`/`feedlotCorralWizard-schema`), isolamento
// crítico para não regredir o Mapa (execução 042).
//
// Tabs por `useCustomSearch` (etapa persistida na URL, nunca `useState` —
// mandato da Tarefa). Transição (`attemptGoToTab`) só avança para uma etapa
// POSTERIOR se `trigger(stepFields(etapaAtual))` passar (IG-001/AC-012/014);
// voltar (`nextIndex < tabIndex`) nunca revalida (AC-013). Footer usa
// `Button` simples com título dinâmico Continuar/Salvar — NÃO
// `ButtonSaveAndNext` (esse componente hoje é hardcoded para "Salvar" em
// telas de formulário único sem passos, ver seu próprio comentário-fonte;
// usá-lo aqui mostraria "Salvar" também nas Etapas 1-2, quebrando a
// fidelidade do rótulo dinâmico de AC-014). Sibling mais próximo para esta
// decisão: `CadastrosBase/Fazendas/CreateOrUpdateFarm.tsx` (único wizard
// real do fork com `trigger()` por etapa).
//
// Etapa 3 (Lotes) chegou na T05. Esta Tarefa (T06, `06-Orquestracao-Submit.md`,
// DEC-043-CURRAIS-FORM §7) implementa o SUBMIT real do wizard, sequenciando os
// contratos existentes — decisão-mãe do dono ACEITA: ORQUESTRAÇÃO CLIENTE
// (não endpoint atômico único).
//
// A API evoluiu desde que o contrato de tela §7 foi escrito
// (`contrato-api-currais-gaps.md`, TASK-BE-043-CUR-02/03 já materializadas no
// fork — verificado em `GB.Cerne.Api` antes de codar esta Tarefa, não
// presumido):
//   - GAP-API-05 (atomicidade do CREATE) → RESOLVIDO: `FeedlotCorralRequest`
//     aceita `available_at`/`note` no ramo POST (`required_if` status
//     restrito). O CREATE do wizard vira 1 chamada só (`store`) — SEM 2ª
//     chamada a `updateStatus` (diferente do §7 original, escrito antes do
//     GAP ser resolvido).
//   - GAP-API-06/PARADA-API-07 (attach de lotes) → RESOLVIDO: endpoint NOVO
//     corral-scoped `PUT /feedlot-corrals/{uuid}/batches`
//     (`attachFeedlotCorralBatches`, gate `feedlot-corrals_edit`), DISTINTO
//     do `syncCorralBatches` do Mapa (gate `feedlot-map_manage`, exige
//     datas) — sem cruzar permissão, sem exigir datas que o wizard não
//     coleta.
//   - PARADA-API-07 só cobriu o endpoint NOVO de lotes. `PUT
//     /feedlot-corrals/{uuid}/status` (situação, usado no EDIT quando o
//     status carregado exige detalhe — `status` é readonly no wizard em
//     editar, PARADA-D) aceita `feedlot-map_manage` OU `feedlot-corrals_edit`
//     (`UpdateFeedlotCorralStatusRequest::authorize()`, verificado no fork,
//     TASK-BE-043-CUR-04a) — TASK-063-CUR-03 (execução 063, F-035 Currais)
//     corrigiu o gate client-side (`onSubmit` abaixo) para o mesmo OR; antes
//     bloqueava ANTES da chamada de rede um usuário com só
//     `feedlot-corrals_edit`, mesmo a API aceitando.
//
// Base no EDIT envia o payload COMPLETO (não filtrado por `dirtyFields`) —
// divergência FIEL ao backend real, não ao texto original da Tarefa
// ("PATCH parcial"): `FeedlotCorralRequest::rules()` marca TODOS os campos
// base como `required` tanto no POST quanto no PUT (não há regra
// `sometimes`) — mirror exato do que `FeedlotCorralDialog.tsx` do Mapa já
// faz (asset de não-regressão, mesma API). Filtrar por `dirtyFields` como em
// `CreateOrUpdateFeedlotSector.tsx` geraria 422 nos campos base não tocados.
// O que a Tarefa pede ("dirty guarda o quê é submetido") é honrado no NÍVEL
// DO PASSO: se nenhum campo base mudou em editar, o passo Base é PULADO
// inteiro (nenhuma chamada), não uma filtragem de payload.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Tabs } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomSearch } from '@/hooks/useCustomSearch';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { queryKey } from '@/constants/query-key';

import {
  FEEDLOT_CORRAL_WIZARD_STEPS,
  feedlotCorralWizardSchemaResolver,
  requiresStatusDetail,
  stepFields,
} from '@/validations/schemas/FeedlotCorrals/feedlotCorralWizard-schema';

import {
  attachFeedlotCorralBatches,
  createFeedlotCorral,
  getFeedlotCorral,
  getFeedlotCorralOptions,
  updateCorralStatus,
  updateFeedlotCorral,
} from '@/services/v2/FeedlotCorrals/feedlot-corral-service';
import { getFeedlotSector } from '@/services/v2/FeedlotSectors/feedlot-sector-service';

import type { Option } from '@/@types/option';
import type {
  CreateFeedlotCorralRequest,
  FeedlotCorralDetail,
  FeedlotCorralResourceRef,
  FeedlotCorralWizardForm,
  UpdateFeedlotCorralRequest,
} from '@/@types/v2/FeedlotCorrals';

import { StepDimensoesEstrutura } from './steps/StepDimensoesEstrutura';
import { StepIdentificacaoSituacao } from './steps/StepIdentificacaoSituacao';
import { StepLotes } from './steps/StepLotes';

// Campos da Base (CRUD cru) — únicos que decidem se o passo 1 roda no EDIT
// (Lei 2, "nada sujo na base = nada a persistir na base"). Espelha
// `stepFields('identificacaoSituacao')` ∪ `stepFields('dimensoesEstrutura')`
// do schema, MENOS `feedlot_sector_uuid`/`status`/`available_at`/`note`
// (imutáveis/roteados por outro passo no EDIT — PARADA-D/§7).
const BASE_FIELD_KEYS = [
  'name',
  'installation_type',
  'width',
  'length',
  'capacity',
  'coverage',
  'floor',
  'shading',
  'trough_uuid',
  'drinking_fountain_uuid',
] as const satisfies readonly (keyof FeedlotCorralWizardForm)[];

function refToOption(ref: FeedlotCorralResourceRef | null): Option<string> | null {
  return ref ? { label: ref.description, value: ref.uuid } : null;
}

const EMPTY_VALUES: FeedlotCorralWizardForm = {
  name: '',
  feedlot_sector_uuid: null,
  installation_type: null,
  status: null,
  width: '',
  length: '',
  capacity: '',
  coverage: null,
  floor: null,
  shading: null,
  trough_uuid: null,
  drinking_fountain_uuid: null,
  available_at: null,
  note: '',
  batches: [],
};

export default function CreateOrUpdateFeedlotCorral() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotCorrals.feedlotCorral;

  const isEditing = isValidGuid(uuid);

  // AC-030/PARADA-E — deep-link de Setores (`?sector_uuid=`): trava o campo
  // em criar, tal como o setor fica travado em editar (PARADA-D).
  const sectorUuidParam = searchParams.get('sector_uuid');
  const sectorLocked = isEditing || (!isEditing && isValidGuid(sectorUuidParam ?? undefined));

  const { can } = usePermissions();

  const {
    control,
    register,
    reset,
    watch,
    trigger,
    setValue,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<FeedlotCorralWizardForm>({
    mode: 'onChange',
    resolver: feedlotCorralWizardSchemaResolver(languageGB, !isEditing) as any,
    reValidateMode: 'onChange',
    defaultValues: EMPTY_VALUES,
  });

  // Lei 2 (`get_pwa_form_query_pattern`) — função NOMEADA com guarda
  // `!isEmpty(dirtyFields) || resetForce` (ERRO-FE-001, fórmula verificada).
  function fillForm(data: FeedlotCorralDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        name: data.name,
        // PARADA-D — setor imutável pós-create; valor fixo do próprio
        // Resource, nunca refeito via rede neste modo.
        feedlot_sector_uuid: { label: data.feedlot_sector.name, value: data.feedlot_sector.uuid },
        installation_type: data.installation_type,
        // FM-005 — VISÍVEL (readonly-attr) em editar, ao contrário do
        // diálogo do Mapa (que esconde o campo); valor real hidratado aqui.
        status: data.status,
        width: data.width ?? '',
        length: data.length ?? '',
        capacity: data.capacity ?? '',
        coverage: data.coverage,
        floor: data.floor,
        shading: data.shading,
        trough_uuid: refToOption(data.trough),
        drinking_fountain_uuid: refToOption(data.drinking_fountain),
        // TASK-063-CUR-02 — `FeedlotCorralResource::toArray()` já expõe
        // `available_at`/`last_status_note` (CUR-04b/PARADA-DEF-A, GB.Cerne.Api)
        // desde o lote 043; hidratamos os valores REAIS do recurso em vez do
        // vazio hardcoded anterior (a lacuna descrita no comentário antigo já
        // foi fechada pela API).
        available_at: data.available_at ?? null,
        note: data.last_status_note ?? '',
        // UT-000698 (DEFEITO #1) — hidrata com os lotes JÁ anexados ao curral
        // (`FeedlotCorralDetail.batches`, mirror `FeedlotCorralResource`);
        // antes fixo `[]`, o que escondia lotes existentes na Etapa 3 e
        // arriscava desanexá-los no submit (`attachFeedlotCorralBatches` faz
        // `sync` do conjunto enviado). Shape de linha idêntico ao que
        // `StepLotes.tsx` consome via `useFieldArray` (`batch_uuid: Option<string> | null`).
        batches: (data.batches ?? []).map((batch) => ({
          batch_uuid: { label: batch.description, value: batch.uuid },
        })),
      });
    }
  }

  const feedlotCorralQuery = useCustomFormQueryByGuid<FeedlotCorralDetail>({
    registrationId: isEditing ? uuid : undefined,
    asyncFunction: getFeedlotCorral,
    fillForm,
    queryKey: queryKey.feedlotCorrals.feedlotCorral,
  });
  const feedlotCorralData = feedlotCorralQuery.data as FeedlotCorralDetail | undefined;
  const isLoadingDetail = isEditing && checkLoadingStatus([feedlotCorralQuery as any]);

  const optionsQuery = useQuery({
    queryKey: [queryKey.feedlotCorrals.feedlotCorral, 'wizard-options', uuid, isEditing],
    queryFn: async () => (await getFeedlotCorralOptions(isEditing ? uuid : undefined)).data,
  });
  const isLoadingOptions = checkLoadingStatus([optionsQuery as any]);

  // FM-005 default `VA` em criar (mirror legado) — só quando o campo ainda
  // não foi tocado pelo usuário (`dirtyFields.status`), nunca sobrescrevendo
  // uma escolha interativa.
  useEffect(() => {
    if (isEditing) return;
    if (dirtyFields.status) return;
    const defaultStatus = optionsQuery.data?.statuses.find((status) => status.value === 'VA');
    if (defaultStatus) {
      setValue('status', defaultStatus, { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsQuery.data, isEditing]);

  // FM-012 — `coverage` default `AB` em criar (LK-003, mirror default de
  // schema do legado `feedlot_corrals.coverage`), só quando ainda não
  // tocado pelo usuário (mesmo padrão do default de `status` acima).
  useEffect(() => {
    if (isEditing) return;
    if (dirtyFields.coverage) return;
    const defaultCoverage = optionsQuery.data?.coverages.find(
      (coverage) => coverage.value === 'AB'
    );
    if (defaultCoverage) {
      setValue('coverage', defaultCoverage, { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsQuery.data, isEditing]);

  // AC-030/PARADA-E — resolve o rótulo do setor vindo por `?sector_uuid=`
  // (a query string só carrega o uuid; o nome vem de `GET /feedlot-sectors/{uuid}`).
  const sectorFromParamQuery = useQuery({
    queryKey: [queryKey.feedlotCorrals.feedlotCorral, 'sector-prefill', sectorUuidParam],
    queryFn: async () => (await getFeedlotSector(sectorUuidParam as string)).data,
    enabled: !isEditing && isValidGuid(sectorUuidParam ?? undefined),
  });

  useEffect(() => {
    if (isEditing) return;
    if (!sectorFromParamQuery.data) return;
    if (dirtyFields.feedlot_sector_uuid) return;
    setValue(
      'feedlot_sector_uuid',
      { label: sectorFromParamQuery.data.name, value: sectorFromParamQuery.data.uuid },
      { shouldDirty: false, shouldValidate: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectorFromParamQuery.data, isEditing]);

  const isLoadingForm =
    isLoadingOptions ||
    isLoadingDetail ||
    (sectorLocked && !isEditing && sectorFromParamQuery.isPending);

  // ---------------------------------------------------------------------
  // Orquestração de submit (T06, §7 do contrato — DEC-043-CURRAIS-FORM) — 3
  // mutações via `useRequest` (Lei 3/4), encadeadas por `mutateAsync` dentro
  // de `onSubmit`. Cada passo mantém seu PRÓPRIO toast (`useRequest.onError`
  // já exibe a mensagem da API) e sua PRÓPRIA invalidação de cache; a
  // orquestração só decide ORDEM e RECONCILIAÇÃO em falha parcial — nunca
  // engole o erro de um passo (Regra 9).
  // ---------------------------------------------------------------------

  // Passo 1 — Base: `POST /feedlot-corrals` (create, ATÔMICO com
  // available_at/note desde GAP-API-05/CUR-03) ou `PUT /feedlot-corrals/{uuid}`
  // (edit, payload completo da base — ver nota de topo do arquivo sobre por
  // que NÃO é filtrado por `dirtyFields` campo a campo).
  async function tryPersistBase(data: FeedlotCorralWizardForm) {
    const basePayload = {
      name: data.name,
      installation_type: data.installation_type!.value,
      coverage: data.coverage!.value,
      floor: data.floor!.value,
      shading: data.shading!.value,
      width: Number(data.width),
      length: Number(data.length),
      capacity: Number(data.capacity),
      trough_uuid: data.trough_uuid!.value,
      drinking_fountain_uuid: data.drinking_fountain_uuid!.value,
    };

    if (isEditing && uuid) {
      const payload: UpdateFeedlotCorralRequest = basePayload;
      return updateFeedlotCorral(uuid, payload);
    }

    const payload: CreateFeedlotCorralRequest = {
      ...basePayload,
      feedlot_sector_uuid: data.feedlot_sector_uuid!.value,
      status: data.status!.value,
      // GAP-API-05/CUR-03 — só entra quando o status exige detalhe (backend
      // `required_if`); nos demais o campo é ignorado/`nullable`.
      ...(requiresStatusDetail(data.status)
        ? { available_at: data.available_at, note: data.note || null }
        : {}),
    };
    return createFeedlotCorral(payload);
  }

  const baseMutation = useRequest<FeedlotCorralDetail>({
    asyncFunction: tryPersistBase,
    entityName: text.singularLabel,
    queryKey: queryKey.feedlotCorrals.feedlotCorral,
    queryKey2: queryKey.feedlotCorrals.feedlotCorrals,
    queryKey3: queryKey.feedlotMap.tree,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {},
  });

  // Passo 2 — Situação (SÓ no EDIT; o CREATE já é atômico no passo 1 —
  // GAP-API-05/CUR-03). Gate `feedlot-map_manage` (PARADA-B RESIDUAL — a
  // PARADA-API-07/Opção A só cobriu o endpoint NOVO de lotes;
  // `UpdateFeedlotCorralStatusRequest::authorize()` continua exigindo
  // `feedlot-map_manage`, verificado no fork) — checado ANTES de tentar a
  // chamada, nunca às cegas.
  async function tryPersistSituation(payload: {
    targetUuid: string;
    status: string;
    available_at: string | null;
    note: string | null;
  }) {
    return updateCorralStatus(payload.targetUuid, {
      status: payload.status,
      available_at: payload.available_at,
      note: payload.note,
    });
  }

  const situacaoMutation = useRequest<FeedlotCorralDetail>({
    asyncFunction: tryPersistSituation,
    entityName: languageGB.feedlotMap.feedlotMap.status.title,
    queryKey: queryKey.feedlotCorrals.feedlotCorral,
    queryKey2: queryKey.feedlotMap.tree,
    typesRequest: 'update',
    actionSuccess: () => {},
  });

  // Passo 3 — Lotes: `PUT /feedlot-corrals/{uuid}/batches`
  // (`attachFeedlotCorralBatches`, GAP-API-06/CUR-02) — gate
  // `feedlot-corrals_edit` (PARADA-API-07/Opção A), SEM cruzar a permissão
  // do Mapa e SEM exigir datas que o wizard não coleta.
  async function tryPersistBatches(payload: { targetUuid: string; batch_ids: string[] }) {
    return attachFeedlotCorralBatches(payload.targetUuid, { batch_ids: payload.batch_ids });
  }

  const batchesMutation = useRequest<FeedlotCorralDetail>({
    asyncFunction: tryPersistBatches,
    entityName: languageGB.feedlotMap.feedlotMap.batches.title,
    queryKey: queryKey.feedlotCorrals.feedlotCorral,
    queryKey2: queryKey.feedlotMap.tree,
    typesRequest: 'update',
    actionSuccess: () => {},
  });

  // Lei 4 — SEM `useState(loading)`: o indicador é 100% derivado das 3
  // mutações (`isPending`), nunca um booleano manual.
  const isSubmittingWizard =
    baseMutation.isPending || situacaoMutation.isPending || batchesMutation.isPending;

  // `onSubmit` só roda depois de `handleSubmit` validar o schema INTEIRO
  // (as 3 etapas) — o `trigger()` por etapa (`attemptGoToTab`) já bloqueou o
  // avanço antes disso; esta é a ÚLTIMA guarda antes de qualquer chamada de
  // rede, e a ÚNICA que decide a SEQUÊNCIA (§7 do contrato).
  async function onSubmit(data: FeedlotCorralWizardForm) {
    const baseDirty = !isEditing || BASE_FIELD_KEYS.some((key) => !!dirtyFields[key]);
    const situationRequired = isEditing && requiresStatusDetail(data.status);
    const batchesTouched = !!dirtyFields.batches;

    // Lei 2 — nada mudou em editar: nada a persistir, só sai do wizard.
    if (isEditing && !baseDirty && !situationRequired && !batchesTouched) {
      navigate(-1);
      return;
    }

    let targetUuid = uuid;

    // ---- Passo 1: Base -----------------------------------------------------
    if (baseDirty) {
      try {
        const response = await baseMutation.mutateAsync(data);
        targetUuid = response?.data?.uuid ?? targetUuid;
      } catch {
        // `useRequest.onError` já exibiu o toast — nada foi criado/alterado
        // ainda, nada a reconciliar.
        return;
      }
    }

    if (!targetUuid) return; // guarda defensiva — não deveria ocorrer

    // ---- Passo 2: Situação (só EDIT) ---------------------------------------
    if (situationRequired) {
      // TASK-063-CUR-03 — OR, mirror `UpdateFeedlotCorralStatusRequest::
      // authorize()` (GB.Cerne.Api), que já aceita `feedlot-map_manage` OU
      // `feedlot-corrals_edit`. O gate client-side checava só a 1ª permissão
      // e bloqueava ANTES da chamada de rede um usuário que a API aceitaria.
      if (!can('feedlot-map_manage') && !can('feedlot-corrals_edit')) {
        toaster.error({
          title: text.wizard.submit.partialSaveTitle,
          description: text.wizard.submit.situationPermissionDenied,
        });
        return;
      }
      try {
        await situacaoMutation.mutateAsync({
          targetUuid,
          status: data.status!.value,
          available_at: data.available_at,
          note: data.note || null,
        });
      } catch {
        toaster.error({
          title: text.wizard.submit.partialSaveTitle,
          description: text.wizard.submit.partialSaveSituationDescription,
        });
        return;
      }
    }

    // ---- Passo 3: Lotes ------------------------------------------------------
    if (batchesTouched) {
      const batchIds = (data.batches ?? [])
        .map((row) => row.batch_uuid?.value)
        .filter((value): value is string => !!value);
      try {
        await batchesMutation.mutateAsync({ targetUuid, batch_ids: batchIds });
      } catch {
        toaster.error({
          title: text.wizard.submit.partialSaveTitle,
          description: text.wizard.submit.partialSaveBatchesDescription,
        });
        // CREATE: o curral já existe — manda o usuário para a EDIÇÃO dele
        // (reconciliar lotes lá), nunca de volta pro form de criação (que
        // reenviaria `store` contra um registro já existente).
        if (!isEditing) navigate(`/operacional/currais/${targetUuid}`, { replace: true });
        return;
      }
    }

    navigate(-1);
  }

  // ---- Navegação do wizard (tabs por `useCustomSearch`, IG-001/AC-012/013/014) ----
  const { tabIndex, handleTabsChange } = useCustomSearch(0);
  const currentStepKey = FEEDLOT_CORRAL_WIZARD_STEPS[tabIndex] ?? FEEDLOT_CORRAL_WIZARD_STEPS[0];
  const isFirstStep = tabIndex === 0;
  const isLastStep = tabIndex === FEEDLOT_CORRAL_WIZARD_STEPS.length - 1;

  async function attemptGoToTab(nextIndex: number) {
    if (nextIndex === tabIndex) return;

    // AC-013 — voltar/revisitar etapa já percorrida nunca revalida.
    if (nextIndex < tabIndex) {
      handleTabsChange(nextIndex);
      return;
    }

    // IG-001 — avançar exige os `required` da etapa ATUAL; bloqueia e não
    // navega quando inválido (a mensagem por campo já aparece embaixo de
    // cada input via `errors`, mirror `SweetAlert` do legado).
    const valid = await trigger(stepFields(currentStepKey) as any);
    if (!valid) {
      toaster.error({ title: text.wizard.stepErrors });
      return;
    }
    handleTabsChange(nextIndex);
  }

  function handleBackClick() {
    if (isFirstStep) {
      navigate(-1);
      return;
    }
    handleTabsChange(tabIndex - 1);
  }

  async function handleContinueClick() {
    if (isLastStep) return;
    await attemptGoToTab(tabIndex + 1);
  }

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      footer={
        <>
          <Button
            title={
              isFirstStep ? languageGB.defaltStrings.cancel : languageGB.defaltStrings.toGoBack
            }
            variant="secondary"
            type="button"
            onClick={handleBackClick}
            disabled={isSubmittingWizard}
          />
          <Button
            title={isLastStep ? languageGB.defaltStrings.save : languageGB.defaltStrings.continue}
            type="button"
            // Etapa final (Salvar): dispara o submit real — `handleSubmit`
            // valida o schema INTEIRO antes de chamar `onSubmit` (T06).
            // Aceito aqui (`get_pwa_form_query_pattern`, "Acionamento EXTERNO
            // do submit", regra 4) porque a etapa anterior já validou via
            // `trigger(stepFields)` em `attemptGoToTab` — não é o único
            // gate. Etapas 1-2 (Continuar): só navegação, sem rede.
            onClick={isLastStep ? handleSubmit(onSubmit) : handleContinueClick}
            loading={isSubmittingWizard}
            disabled={isLoadingForm || isSubmittingWizard}
          />
        </>
      }
    >
      <Form id="feedlot-corral-wizard-form" noPadding onSubmit={(event) => event.preventDefault()}>
        <Tabs.Root
          value={String(tabIndex)}
          onValueChange={(details: { value: string }) => attemptGoToTab(Number(details.value))}
          variant="line"
        >
          <Tabs.List mb={6}>
            <Tabs.Trigger value="0">{text.wizard.step1}</Tabs.Trigger>
            <Tabs.Trigger value="1">{text.wizard.step2}</Tabs.Trigger>
            <Tabs.Trigger value="2">{text.wizard.step3}</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="0">
            <StepIdentificacaoSituacao
              control={control}
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValue}
              dirtyFields={dirtyFields}
              disabled={isLoadingForm}
              loading={isLoadingForm}
              isEditing={isEditing}
              identification={feedlotCorralData?.identification}
              nextIdentification={optionsQuery.data?.next_identification ?? null}
              installationTypeOptions={optionsQuery.data?.installation_types ?? []}
              statusOptions={optionsQuery.data?.statuses ?? []}
              sectorLocked={sectorLocked}
            />
          </Tabs.Content>

          {/* Etapa 2 (Dimensões & Estrutura) — TASK-043-CUR-T04. */}
          <Tabs.Content value="1">
            <StepDimensoesEstrutura
              control={control}
              setValue={setValue}
              disabled={isLoadingForm}
              loading={isLoadingForm}
              coverageOptions={optionsQuery.data?.coverages ?? []}
              floorOptions={optionsQuery.data?.floors ?? []}
              shadingOptions={optionsQuery.data?.shadings ?? []}
              troughs={optionsQuery.data?.troughs ?? []}
              drinkingFountains={optionsQuery.data?.drinking_fountains ?? []}
            />
          </Tabs.Content>

          {/* Etapa 3 (Lotes) — TASK-043-CUR-T05. Esta etapa só coleta
              `batches[]` no form; o attach real (`PUT
              /feedlot-corrals/{uuid}/batches`) acontece no submit
              orquestrado (T06, `onSubmit` acima). */}
          <Tabs.Content value="2">
            <StepLotes control={control} setValue={setValue} disabled={isLoadingForm} />
          </Tabs.Content>
        </Tabs.Root>
      </Form>
    </FormContainer>
  );
}
