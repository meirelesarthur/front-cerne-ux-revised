// src/pages/Operacional/Pesagem/CreateOrUpdateWeighing.tsx
// -----------------------------------------------------------------------------
// Casca ÚNICA de criação/edição de Pesagem — `pes-screen-create`/
// `pes-screen-edit`, `pes-action-save` (F-071, TASK-PES-FE-04,
// contrato-tela-lane-c-pesagem-frontend.md §6.4). Rotas
// `/operacional/pesagem/novo` e `/operacional/pesagem/:uuid/editar`
// (registradas só na TASK-PES-FE-08 — esta Tarefa só entrega o componente).
//
// Esqueleto mirror `Sanitario/CreateOrUpdateSanitario.tsx` (guard de uuid
// malformado, `useCustomFormQueryById`+`fillForm` nomeada com guarda
// `!isEmpty(dirtyFields) || resetForce`, `FormContainer` com `footer` opt-in
// `Cancelar`+`ButtonSaveAndNext`, `useUnsavedChangesGuard`+
// `DeleteConfirmDialog tone="warning"`).
//
// ESCOPO ORIGINAL (TASK-PES-FE-04/37): casca + `WeighingHeaderFields.tsx`
// (cabeçalho completo — código/data/lote-OU-categoria/is_stock+arroba_value/
// toggle sanitário). Nessa entrega, `animals` ficava sempre `[]` (bloco de
// animais ainda não existia) e o bloco sanitário embutido
// (`WeighingSanitarySection`, Tarefa 39) segue reservado.
//
// TASK-PES-FE-05: montou `WeighingAnimalsSection`/`WeighingAnimalRow` de
// verdade no lugar do comentário reservado, e CORRIGIU a hidratação de
// `animals` em `fillForm` (round-trip por `row_uuid`, contrato-tela §6.7/
// matriz FID-G3F §2.2) — `sanitary_items` ficava `[]` até esta Tarefa.
//
// TASK-PES-FE-06 (esta atualização, contrato-tela §6.6/§6.7): plugou
// `WeighingSanitarySection` (visível só quando `sanitary=true`) e EXTRAIU o
// mapper form↔payload inline (`fillForm`/`toSavePayload`/`buildAnimalPayload`/
// `buildSanitaryItemPayload` das Tarefas 37/38, lógica preservada
// byte-a-byte) para `./weighing-form-mapper.ts`
// (`mapWeighingDetailToFormValues`/`mapFormValuesToSaveRequest`), que agora
// também hidrata/serializa o bloco sanitário embutido a partir de
// `WeighingSanitaryDetail`/`WeighingSanitaryItemDetail` reais.
//
// ---- Divergência real encontrada na TASK-PES-FE-04 (leitura direta do
// worktree irmão da API, `WeighingResource::toArray()`) — CORRIGIDA para o
// bloco de animais na TASK-PES-FE-05, e para o bloco sanitário nesta Tarefa
// -------------------------------------------------------------------------
// `src/@types/v2/Weighing/index.d.ts` (TASK-PES-FE-01) declarava
// `WeighingAnimalDetail` como um shape FLAT (`animal_uuid`/`identification`
// no topo). O `WeighingResource` REAL devolve, para cada linha de animal,
// `{ uuid (da linha AnimalWeighing), animal: {uuid, identification} | null,
// weight, last_weight, last_weight_date, has_ultrasound }` — aninhado, com
// um `uuid` de LINHA próprio (necessário para o round-trip `row_uuid`).
// `WeighingAnimalDetail` (index.d.ts) já reflete o shape real desde a Tarefa
// 05. O bloco `sanitary` do detalhe (`WeighingSanitaryDetail`/
// `WeighingSanitaryItemDetail`) também é aninhado e SEM `warehouse_uuid`/
// `measurement_uuid` por item — `weighing-form-mapper.ts` (esta Tarefa)
// hidrata só o que o servidor de fato devolve, deixando esses 2 campos
// `null` no round-trip de edição (limitação honesta, SEM MOCK, mesmo padrão
// já aceito por `sanitario-form-mapper.ts`).
//
// `code` NUNCA é campo do `useForm` (mirror `SanitarioHeaderFields`/`Weaning`)
// — sempre `InputReadOnly`, nunca reenviado no payload.
//
// CORREÇÃO (97-Esteiras/002 execução 002 lane C, correção reportada pelo
// dono ao vivo, mirror EXATO `CreateOrUpdateSanitario.tsx`): `code` em modo
// CRIAÇÃO agora busca a prévia real via `GET /weighings/next-code`
// (`getWeighingNextCode`, `nextCodeQuery` abaixo) — o texto estático
// `formText.hints.codeGeneratedOnSave` só permanece como FALLBACK enquanto
// a query carrega ou falha. `next-code` NUNCA é chamado em edição — `code`
// vem do próprio detalhe carregado (`weighingQuery.data?.code`).
// -----------------------------------------------------------------------------

import { useEffect, useRef } from 'react';

import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { queryKey } from '@/constants/query-key';

import { weighingSchemaResolver } from '@/validations/schemas/Weighing/weighing-schema';

import {
  createWeighing,
  getWeighingByUuid,
  getWeighingNextCode,
  updateWeighing,
} from '@/services/v2/Weighing/weighing-service';

import type { WeighingDetail, WeighingFormValues } from '@/@types/v2/Weighing';

import { useWeighingDateConflicts } from './useWeighingDateConflicts';
import { mapFormValuesToSaveRequest, mapWeighingDetailToFormValues } from './weighing-form-mapper';
import { WeighingAnimalsSection } from './WeighingAnimalsSection';
import { WeighingHeaderFields } from './WeighingHeaderFields';
import { WeighingSanitarySection } from './WeighingSanitarySection';

const WEIGHING_LIST_ROUTE = '/operacional/pesagem';

// Campos da linha de animal com controller/erro próprio (`WeighingAnimalRow`).
const ROW_ERROR_FIELDS = [
  'animal_uuid',
  'weight',
  'last_weight',
  'last_weight_date',
  'aol',
  'egs',
  'marm',
  'classification',
];

const defaultValues: WeighingFormValues = {
  date: null,
  batch_uuid: null,
  category_uuid: null,
  is_stock: false,
  arroba_value: '',
  animals: [],
  sanitary: false,
  sanitary_items: [],
};

export default function CreateOrUpdateWeighing() {
  const { uuid: weighingUuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.weighing.weighing;
  const formText = text.form;

  // Guard de navegação: `uuid` presente mas NÃO é um GUID válido (URL
  // adulterada) — redireciona para a listagem ANTES de renderizar o form
  // (mirror `CreateOrUpdateSanitario.tsx`/`CreateOrUpdateLoteReproducao.tsx`).
  const hasMalformedRouteParam = weighingUuid !== undefined && !isValidGuid(weighingUuid);

  useEffect(() => {
    if (hasMalformedRouteParam) {
      navigate(WEIGHING_LIST_ROUTE, { replace: true });
    }
  }, [hasMalformedRouteParam, navigate]);

  const isEditing = isValidGuid(weighingUuid);
  const canSave = isEditing ? can('weighing_edit') : can('weighing_create');

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { dirtyFields },
  } = useForm<WeighingFormValues>({
    mode: 'onChange',
    resolver: weighingSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues,
  });

  // ---- Guarda de saída sem salvar — `isEmpty(dirtyFields)` SEM negação
  // (mesma divergência de nome já documentada em `CreateOrUpdateSanitario.tsx`:
  // `src/utils/isEmpty.ts` retorna `true` quando o objeto TEM alguma chave
  // própria, ou seja, já significa "há campo sujo"). -----------------------
  const hasUnsavedChanges = isEmpty(dirtyFields);
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);

  // ✅ Guarda nomeada com `!isEmpty(dirtyFields) || resetForce` — mirror
  // EXATO `CreateOrUpdateSanitario.tsx`/`CreateOrUpdateBudget.tsx`.
  // `useCustomFormQueryById` sempre chama com `resetForce=true`.
  //
  // Hidratação completa (cabeçalho + animais + bloco sanitário embutido)
  // delegada a `mapWeighingDetailToFormValues` (`weighing-form-mapper.ts`,
  // TASK-PES-FE-06) — round-trip por `row_uuid`/`item_uuid` (contrato-tela
  // §6.7/matriz FID-G3F §2.2), nunca por posição.
  //
  // BUG-PES-EDIT-01 (correção AF_REJECTED, execução 017 item 2/3 — ver nota
  // completa em `WeighingAnimalsSection.tsx`): `WeighingAnimalsSection` monta
  // INCONDICIONALMENTE (linha abaixo, mesmo durante `isLoading`), então este
  // `reset()` (que muda `batch_uuid`/`category_uuid` de `null`→real E
  // `animals` juntos) dispara a cascata de limpeza do bloco de animais e
  // apaga os animais recém-hidratados. `skipNextAnimalsCascadeRef` é setada
  // `true` synchronamente ANTES do PRIMEIRO `reset()` de edição bem-sucedido
  // (só uma vez — `hasHydratedAnimalsRef`) e repassada por REF (não por
  // valor) a `WeighingAnimalsSection`, que a consome na cascata seguinte,
  // preservando os animais hidratados sem afetar trocas de lote/categoria
  // feitas pelo usuário DEPOIS da tela carregada (continuam limpando a
  // lista, comportamento original preservado).
  //
  // BUG-PES-EDIT-02 (regressão pós BUG-PES-EDIT-01, feedback do dono ao vivo:
  // "editar ainda não salva, só alterando alguns campos específicos
  // funciona") — causa raiz real confirmada empiricamente (harness de teste
  // isolado montando esta tela de verdade, NÃO faz parte do produto):
  // `useCustomFormQueryById` (hook COMPARTILHADO, `src/hooks/
  // useCustomFormQueryById.tsx`, ~50 outras telas) chama `fillForm(data,
  // true)` — `resetForce` SEMPRE `true` — em TODA transição
  // `isSuccess && !isRefetching`, não só na hidratação inicial. Qualquer
  // refetch em segundo plano da MESMA query (`staleTime` padrão 5min do
  // QueryClient global, `retry:1`, ou uma invalidação externa por prefixo
  // `['Weighing', uuid]`) reexecuta este `fillForm` com `resetForce=true`
  // de novo. Como o `||resetForce` do nome desta guarda sempre vencia, o
  // `reset()` rebaseava o form inteiro para os valores do servidor A
  // QUALQUER MOMENTO — mesmo com o usuário no meio de uma edição —, zerando
  // `dirtyFields` SEM aviso visual (o campo mascarado continua mostrando o
  // valor digitado, só o estado interno do RHF volta a "limpo"). No clique
  // em Salvar, `onSubmit` (abaixo) encontra `dirtyFields` vazio e só navega
  // de volta (`isEditing && !isEmpty(dirtyFields)`), SEM chamar
  // `updateWeighing` — reproduzido isoladamente disparando um
  // `refetchQueries` da MESMA chave `['Weighing', uuid]` a meio da edição de
  // `animals.0.weight`: o input seguia exibindo o valor digitado, mas o
  // Salvar não emitia requisição alguma.
  //
  // Fix LOCAL a esta tela (sem tocar no hook compartilhado nem no schema de
  // validação): só a 1ª chamada bem-sucedida (hidratação inicial de edição,
  // já rastreada por `hasHydratedAnimalsRef`) aplica `reset()`
  // incondicionalmente. Qualquer chamada POSTERIOR (refetch em segundo
  // plano) só pode rebasear o form se o usuário ainda não tiver sujado nada
  // (`!isEmpty(dirtyFields)`) — restaura o sentido ORIGINAL do nome desta
  // guarda, que `resetForce` sempre vencia incondicionalmente antes.
  const hasHydratedAnimalsRef = useRef(false);
  const skipNextAnimalsCascadeRef = useRef(false);

  function fillForm(data: WeighingDetail, resetForce?: boolean) {
    void resetForce; // sempre `true` no hook compartilhado — ver nota acima, não é mais fonte de decisão aqui.
    const isInitialHydration = !hasHydratedAnimalsRef.current;

    // Refetch em segundo plano com edição do usuário já em andamento — não
    // sobrescreve (BUG-PES-EDIT-02).
    if (!isInitialHydration && isEmpty(dirtyFields)) {
      return;
    }

    if (isInitialHydration) {
      hasHydratedAnimalsRef.current = true;
      skipNextAnimalsCascadeRef.current = true;
    }

    reset(mapWeighingDetailToFormValues(data));
  }

  const weighingQuery = useCustomFormQueryById<WeighingDetail>({
    registrationId: isEditing ? (weighingUuid ?? '') : '',
    queryKey: queryKey.weighing.weighing,
    asyncFunction: getWeighingByUuid,
    fillForm,
  });

  // `useCustomFormQueryById` tipa o retorno como `Response<TData>` (sem
  // `isError`/`isLoading`) embora o objeto real em runtime seja o
  // `UseQueryResult` do TanStack Query — mesma divergência já contornada com
  // `as any` em outros módulos (`CreateOrUpdateSanitario.tsx`/
  // `CreateOrUpdateWeaning.tsx`).
  const weighingQueryIsError = (weighingQuery as any).isError as boolean;

  // 404 (outro tenant)/erro de leitura em modo editar → toast + volta à
  // listagem (mirror `CreateOrUpdateSanitario.tsx`).
  useEffect(() => {
    if (isEditing && weighingQueryIsError) {
      toaster.error({
        title: text.singularLabel,
        description: text.list.error.message,
        duration: 7000,
      });
      navigate(WEIGHING_LIST_ROUTE);
    }
  }, [isEditing, weighingQueryIsError]);

  const isLoading = isEditing && checkLoadingStatus([weighingQuery as any]);

  // ---- Código sugerido (SÓ em modo criação, `GET /weighings/next-code`) ---
  // `next-code` NUNCA é chamado em edição (mirror
  // `CreateOrUpdateSanitario.tsx`/`EstacaoDeMonta`/`ServiceOrder`) — `code`
  // vem do próprio detalhe carregado nesse caso.
  const nextCodeQuery = useQuery({
    queryKey: [queryKey.weighing.weighing, 'next-code'],
    queryFn: getWeighingNextCode,
    enabled: !isEditing,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const codeDisplay = isEditing
    ? (weighingQuery.data?.code ?? '')
    : (nextCodeQuery.data?.data?.next_code ?? formText.hints.codeGeneratedOnSave);

  // CL-024/OQ-P7 — presença do bloco `sanitary` no detalhe carregado
  // (`WeighingResource` real devolve o OBJETO completo ou `null`, nunca um
  // `sanitary_id` escalar solto — ver nota de cabeçalho do arquivo).
  const hasSanitaryId = isEditing && !!weighingQuery.data?.sanitary;

  // Regra de data da pesagem: 1 chamada `check-date` com todos os animais;
  // `conflicts` marca a linha (sem remover o animal) e bloqueia o Salvar.
  const { conflicts: dateConflicts, hasConflicts: hasDateConflicts } = useWeighingDateConflicts({
    control,
    weighingUuid: isEditing ? weighingUuid : undefined,
    languageGB,
  });

  async function tryPersistWeighing(data: WeighingFormValues) {
    const payload = mapFormValuesToSaveRequest(data);

    try {
      if (isEditing && weighingUuid) {
        return await updateWeighing(weighingUuid, payload);
      }
      return await createWeighing(payload);
    } catch (error) {
      // 422 flat por campo: `animals.N.<campo>` aparece na linha N do animal
      // (o `throw` preserva o toast de `useRequest`). Chave sem controller
      // próprio na linha cai no campo Animal (a linha sempre mostra o erro).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          const message = Array.isArray(messages) ? messages[0] : undefined;
          if (!message) return;
          const match = /^animals\.(\d+)(?:\.(\w+))?/.exec(field);
          if (match) {
            const rowField =
              match[2] && ROW_ERROR_FIELDS.includes(match[2]) ? match[2] : 'animal_uuid';
            setError(`animals.${match[1]}.${rowField}` as any, { type: 'server', message });
          } else if (field === 'date') {
            setError('date', { type: 'server', message });
          }
        });
      }
      throw error;
    }
  }

  const weighingMutation = useRequest<WeighingDetail>({
    asyncFunction: tryPersistWeighing,
    entityName: text.singularLabel,
    queryKey: queryKey.weighing.weighings,
    queryKey2: queryKey.weighing.weighing,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(WEIGHING_LIST_ROUTE);
    },
  });

  // Guarda `isEditing && !isEmpty(dirtyFields)` (mirror EXATO
  // `CreateOrUpdateSanitario.tsx`/`CreateOrUpdateLoteReproducao.tsx`) —
  // "nada mudou" nesta edição, apenas volta sem chamar a API.
  async function onSubmit(data: WeighingFormValues) {
    if (hasDateConflicts) {
      toaster.create({
        type: 'warning',
        title: text.singularLabel,
        description: formText.dateConflictBlocked,
      });
      return;
    }
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
      return;
    }
    try {
      await weighingMutation.mutateAsync(data);
    } catch {
      // toast de erro já emitido por `useRequest`; 422 por linha já aplicado em
      // `tryPersistWeighing` — evita rejeição não tratada no submit.
    }
  }

  const isSubmitting = weighingMutation.isPending;

  // Visibilidade do bloco sanitário embutido (contrato-tela §6.6: "só quando
  // `sanitary=true` E `batch_uuid` preenchido" — a trava cruzada CL-024/OQ-P7
  // já vive em `WeighingHeaderFields.tsx`, esta condição é só defensiva).
  // `animalsCount` é a CONTAGEM repassada ao bloco (§2.2 — sem seletor
  // próprio de animais).
  const watchedSanitary = useWatch({ control, name: 'sanitary' });
  const watchedBatchUuid = useWatch({ control, name: 'batch_uuid' });
  const watchedAnimalsForSanitary = useWatch({ control, name: 'animals' }) ?? [];
  const showSanitarySection = !!watchedSanitary && !!watchedBatchUuid;
  const animalsCount = watchedAnimalsForSanitary.length;

  if (hasMalformedRouteParam) {
    return null;
  }

  return (
    <>
      <FormContainer
        title={isEditing ? formText.title.edit : formText.title.create}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="outline"
              type="button"
              onClick={() => guardedNavigate(-1)}
              disabled={isSubmitting}
            />
            {canSave && (
              <ButtonSaveAndNext
                create={!isEditing}
                dirtyFields={dirtyFields}
                type="button"
                onClick={handleSubmit(onSubmit)}
                languageGB={languageGB}
                loading={isSubmitting}
                disabled={isSubmitting || !!isLoading || hasDateConflicts}
              />
            )}
          </>
        }
      >
        <Form id="weighing-form" noPadding onSubmit={handleSubmit(onSubmit)}>
          <WeighingHeaderFields
            control={control}
            watch={watch}
            setValue={setValue}
            languageGB={languageGB}
            canSave={canSave}
            isEditing={!!isEditing}
            isLoading={!!isLoading}
            codeDisplay={codeDisplay}
            hasSanitaryId={hasSanitaryId}
          />

          <WeighingAnimalsSection
            control={control}
            setValue={setValue}
            languageGB={languageGB}
            isDisabled={!canSave || !!isLoading}
            skipNextCascadeRef={skipNextAnimalsCascadeRef}
            weighingUuid={isEditing ? weighingUuid : undefined}
            dateConflicts={dateConflicts}
          />

          {showSanitarySection && (
            <WeighingSanitarySection
              control={control}
              languageGB={languageGB}
              animalsCount={animalsCount}
              isDisabled={!canSave || !!isLoading}
            />
          )}
        </Form>
      </FormContainer>

      <DeleteConfirmDialog
        isOpen={isConfirmOpen}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        tone="warning"
        colorPalette="orange"
        title={formText.unsavedChangesDialog.title}
        description={formText.unsavedChangesDialog.description}
        confirmButtonText={formText.unsavedChangesDialog.confirm}
        cancelButtonText={formText.unsavedChangesDialog.cancel}
        hideQuestionMark
        warningText=""
      />
    </>
  );
}
