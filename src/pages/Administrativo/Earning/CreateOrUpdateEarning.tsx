// src/pages/Administrativo/Earning/CreateOrUpdateEarning.tsx
// -----------------------------------------------------------------------------
// Formulário ÚNICO de upsert de APURAÇÃO MENSAL (Earning — Administrativo,
// 97-Esteiras/002, Tarefa 08). Rota
// `/administrativo/apuracao/:employeeUuid/editar` (query `month`/`year`/
// `type`, default `type=N`, `month`/`year` = mês anterior se ausentes,
// mirror do legado).
//
// Diferente do padrão canônico `isEditing = !!id && id !== 'create'` — aqui
// **sempre** é a mesma tela/rota para os dois casos, distinguidos só pelo
// `GET` retornar 200 (apuração existe, hidrata) ou 404 (não existe,
// formulário em branco) — `GetEarningAction` NÃO faz seed de eventos
// quando a apuração não existe (Nota de fidelidade, Tarefa 08 — NAO_APLICAVEL,
// decisão já fechada na FID-G3A, não reabrir).
//
// `total`/`vl_cheque` são 100% CALCULADOS client-side (mirror exato do JS
// legado, `GAP-EARNING-01`): `total = Σ(evento.condition==soma ? +valor :
// -valor)`; `vl_cheque = total - vl_account`. O servidor NUNCA recalcula
// `total` a partir de `events[]` — o valor que o usuário vê é o que vai
// literalmente no payload.
// -----------------------------------------------------------------------------

import { useEffect, useMemo } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { earningSchemaResolver } from '@/validations/schemas/Earnings/earning-schema';

import { getEmployeeByUuid } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { getEarningForForm, upsertEarning } from '@/services/v2/Earnings/earning-service';
import { listTeams } from '@/services/v2/Teams/team-service';

import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type {
  EarningDetail,
  EarningEventPayload,
  EarningTypeValue,
  EarningUpsertForm,
  EarningUpsertPayload,
  EventMethodValue,
} from '@/@types/v2/Earnings';
import type { TeamListItem } from '@/@types/v2/Teams';

// UT-000716 item 9 — `previousMonthPeriod` consolidado em `earningTotals.ts`
// (reaproveitado também por `index.tsx`/filtro default da listagem), SEM
// duplicar a regra de "mês anterior" (mirror legado).
import { previousMonthPeriod } from './earningTotals';
import { EventoApuracaoEditor } from './EventoApuracaoEditor';
import {
  useEmployeeEventItems,
  useEmployeeEventValueMap,
  useEventCatalog,
  useProprietaryOptionsAccess,
  useTeamOptionsAccess,
} from './useEarnings';

const EARNING_LIST_ROUTE = '/administrativo/apuracao';

const TYPE_OPTIONS: { label: string; value: EarningTypeValue }[] = [
  { label: 'Folha Normal', value: 'N' },
  { label: 'Adiantamento 13º', value: 'A' },
  { label: '13º Salário', value: 'D' },
];

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

// `GAP-EARNING-06` [AVALIADO] — corte de período do EDITAR (dia 25 do mês
// corrente vs o mês/ano do período), DIFERENTE do corte de EXCLUIR (dia 01
// do mês anterior, Tarefa 07/índice). Mirror EXATO
// `UpsertEarningAction::guardEditPeriodCutoff` — client-side é só feedback
// antecipado, o servidor continua sendo a autoridade (mensagem do 422/403
// já exibida pelo `useRequest`, não duplicar).
function isEditPeriodCutoffBlocked(year: number, month: number): boolean {
  const cutoff = new Date(year, month - 1, 25);
  return cutoff.getTime() > Date.now();
}

export default function CreateOrUpdateEarning() {
  const { employeeUuid } = useParams<{ employeeUuid: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  // UT-000714 itens 1/2 — fazenda ATIVA (`useAuth().activeFarmUuid`, mesmo
  // padrão de `CreateOrUpdateExpense.tsx`/`CreateOrUpdateIncome.tsx`),
  // usada para escopar o select de Centro de Custo ao pivot
  // `cost_center_farm` que a API valida (`EarningRequest.php`).
  const { activeFarmUuid } = useAuth();

  const text = languageGB.earnings.earning;
  const canSave = can('earnings_edit');

  const hasMalformedRouteParam = !isValidGuid(employeeUuid ?? null);

  useEffect(() => {
    if (hasMalformedRouteParam) {
      navigate(EARNING_LIST_ROUTE, { replace: true });
    }
  }, [hasMalformedRouteParam, navigate]);

  const defaultPeriod = useMemo(previousMonthPeriod, []);
  const month = Number(searchParams.get('month')) || defaultPeriod.month;
  const year = Number(searchParams.get('year')) || defaultPeriod.year;
  const type = (searchParams.get('type') as EarningTypeValue) || 'N';

  const periodCutoffBlocked = isEditPeriodCutoffBlocked(year, month);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<EarningUpsertForm>({
    mode: 'onChange',
    resolver: earningSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      employee_uuid: employeeUuid ?? '',
      function_uuid: null,
      month,
      year,
      type,
      total: 0,
      vl_account: 0,
      vl_cheque: 0,
      events: [],
      center_uuid: null,
      team_uuid: null,
      proprietary_uuid: null,
    },
  });

  // ---- Dados READONLY do cabeçalho (nome/CPF/função atual) — SEMPRE do
  // cadastro de Funcionário (`Employee`), independente de a apuração
  // existir ou não (no 404, o Earning não tem employee hidratado). ----
  const employeeQuery = useQuery({
    queryKey: [queryKey.earnings.earning, 'employee', employeeUuid],
    queryFn: async () => (await getEmployeeByUuid(employeeUuid as string)).data,
    enabled: isValidGuid(employeeUuid ?? null),
    refetchOnWindowFocus: false,
    retry: false,
  });

  // ---- Catálogo de Eventos (`GAP-EARNING-FE-04`) — resolve `condition`
  // para linhas HIDRATADAS (o `EarningEventRow` da API não expõe
  // `condition`, só `method`). ----
  const eventCatalogQuery = useEventCatalog();

  // ---- Valores de "Funcionário X Eventos" (`GAP-EARNING-FE-05` [AVALIADO],
  // Opção A) — pré-popula (readonly) o `value` de linhas método FIXO, tanto
  // ao adicionar manualmente (repassado ao `EventoApuracaoEditor`) quanto na
  // hidratação inicial abaixo, quando o `value` persistido ainda está
  // zerado. ----
  const employeeEventValuesQuery = useEmployeeEventValueMap(employeeUuid);
  // UT-000742 — vínculos COMPLETOS de "Funcionário x Eventos" (mesma fonte/
  // queryKey de `employeeEventValuesQuery`, sem 2ª chamada de rede — ver
  // `useEmployeeEventItems`), usados para SEMEAR `events[]` quando a
  // apuração ainda não existe (ramo `!data` de `fillForm`, abaixo).
  const employeeEventItemsQuery = useEmployeeEventItems(employeeUuid);

  // UT-000764 D1 — "Função" é SOMENTE LEITURA (mirror legado: `edit.blade.php:35`
  // e `EarningController.php:275` gravam a função ATUAL do funcionário). A
  // fonte única é `employeeQuery.data.function`, nunca o `earning.function`
  // persistido nem edição do usuário.
  const currentFunction = employeeQuery.data?.function ?? null;
  const currentFunctionOption = currentFunction?.uuid
    ? { label: currentFunction.name ?? '', value: currentFunction.uuid }
    : null;

  function fillForm(data: EarningDetail | null, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) && !resetForce) return;

    if (!data) {
      const catalog = eventCatalogQuery.data;
      const employeeEvents = employeeEventItemsQuery.data ?? [];

      reset({
        employee_uuid: employeeUuid ?? '',
        function_uuid: currentFunctionOption,
        month,
        year,
        type,
        total: 0,
        // UT-000742 item 2 — "Vl. Conta" nasce EM BRANCO no caminho de
        // apuração nova (mirror legado — `edit.blade.php` nunca pré-
        // preenche este campo quando ainda não há apuração); `MoneyInput`
        // aceita `null` e exibe vazio, cálculos já normalizam via
        // `Number(...) || 0`.
        vl_account: null,
        vl_cheque: 0,
        // UT-000742 item 1 (GAP reaberto SÓ no front, autorização do dono) —
        // semeia 1 linha por vínculo HABILITADO de "Funcionário x Eventos"
        // do funcionário, mirror legado (`earnings/edit.blade.php:73-110`,
        // `@foreach ($item->events as $event)` quando `!count($item->
        // earnings)`). `condition`/`conditionLabel` resolvidos pelo MESMO
        // catálogo (`eventCatalogQuery`) usado pelas linhas hidratadas
        // abaixo. Linha nasce `isPersisted: false` — totalmente editável/
        // removível (ainda não há apuração persistida travando a
        // estrutura), mesmo tratamento de uma linha adicionada manualmente.
        events: employeeEvents.map((item) => {
          const catalogEvent = catalog?.get(item.event.uuid);
          const condition: 0 | 1 | null =
            catalogEvent?.condition === 0 || catalogEvent?.condition === 1
              ? catalogEvent.condition
              : null;
          return {
            event: { label: item.event.name ?? '', value: item.event.uuid },
            event_uuid: item.event.uuid,
            value: Number(item.value) || 0,
            method: (item.method as EventMethodValue) ?? null,
            condition,
            conditionLabel: catalogEvent?.condition_label ?? item.method_label ?? '',
            isPersisted: false,
          };
        }),
        center_uuid: null,
        team_uuid: null,
        proprietary_uuid: null,
      });
      return;
    }

    const catalog = eventCatalogQuery.data;

    reset({
      employee_uuid: employeeUuid ?? '',
      function_uuid: currentFunctionOption,
      month: data.month,
      year: data.year,
      type: data.type.value,
      total: Number(data.total),
      vl_account: Number(data.vl_account),
      vl_cheque: Number(data.vl_cheque),
      events: (data.events ?? []).map((row) => {
        const catalogEvent = catalog?.get(row.uuid);
        const condition: 0 | 1 | null =
          catalogEvent?.condition === 0 || catalogEvent?.condition === 1
            ? catalogEvent.condition
            : null;
        // `GAP-EARNING-FE-05` [AVALIADO], Opção A — linha método FIXO cujo
        // `value` persistido ainda está zerado (ex.: adicionada manualmente
        // antes desta correção, ou apuração antiga) é pré-populada a partir
        // de "Funcionário X Eventos" (`EmployeeEvent`), SE houver vínculo
        // configurado. Um `value` persistido não-zero NUNCA é sobrescrito —
        // é o que o usuário efetivamente confirmou/gravou naquele período.
        const persistedValue = Number(row.value);
        const isFixedMethod = row.method.value === 0;
        const configuredValue = isFixedMethod
          ? employeeEventValuesQuery.data?.get(row.uuid)
          : undefined;
        const value =
          isFixedMethod && !persistedValue && configuredValue !== undefined
            ? configuredValue
            : persistedValue;
        return {
          event: { label: row.name, value: row.uuid },
          event_uuid: row.uuid,
          value,
          method: row.method.value,
          condition,
          conditionLabel: catalogEvent?.condition_label ?? row.method.description ?? '',
          // UT-000716 item 10 — linha vinda da apuração JÁ persistida é
          // 100% readonly (evento + valor), mirror legado; só linhas
          // adicionadas manualmente nesta sessão (`handleAdd`,
          // `EventoApuracaoEditor.tsx`) continuam editáveis.
          isPersisted: true,
        };
      }),
      center_uuid: data.cost_center
        ? { label: data.cost_center.description, value: data.cost_center.uuid }
        : null,
      team_uuid: data.team ? { label: data.team.name, value: data.team.uuid } : null,
      proprietary_uuid: data.proprietary?.uuid
        ? { label: data.proprietary.name ?? '', value: data.proprietary.uuid }
        : null,
    });
  }

  // Hidratação combinada — SÓ dispara quando a apuração (200/404-tratado) E
  // o catálogo de eventos JÁ resolveram; se o catálogo ainda não chegou na
  // 1ª passagem, a 2ª passagem (quando `eventCatalogQuery` resolve)
  // reexecuta `fillForm` com `condition` corretamente resolvido — sem custo
  // para o usuário, que ainda não teve chance de editar nada nesse meio-tempo.
  const earningQuery = useQuery({
    queryKey: [queryKey.earnings.earning, employeeUuid, month, year, type],
    queryFn: () => getEarningForForm(employeeUuid as string, { month, year, type }),
    enabled: isValidGuid(employeeUuid ?? null) && !!month && !!year,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (earningQuery.isSuccess && !earningQuery.isRefetching) {
      fillForm(earningQuery.data ?? null, true);
    }
  }, [
    earningQuery.isSuccess,
    earningQuery.isRefetching,
    eventCatalogQuery.isSuccess,
    employeeEventValuesQuery.isSuccess,
    employeeEventItemsQuery.isSuccess,
  ]);

  // UT-000764 D1 — mantém `function_uuid` (validado pelo schema, obrigatório)
  // sempre igual à função ATUAL do funcionário, independentemente da ordem
  // em que `earningQuery` e `employeeQuery` resolvem: roda quando o
  // funcionário chega e de novo após cada hidratação (o `reset` do
  // `fillForm` limpa erros). Sem função cadastrada → `null` + validação
  // obrigatória (mensagem de "obrigatório" no campo).
  useEffect(() => {
    if (!employeeQuery.isSuccess) return;
    setValue('function_uuid', currentFunctionOption, {
      shouldValidate: true,
      shouldDirty: false,
    });
  }, [
    employeeQuery.isSuccess,
    currentFunction?.uuid,
    currentFunction?.name,
    earningQuery.isSuccess,
    earningQuery.isRefetching,
  ]);

  // UT-000756 — o form não pode ficar habilitado/seedado antes dos vínculos
  // de "Funcionário x Eventos" chegarem (`employeeEventItemsQuery`, sem
  // cache — ver `useEmployeeEventItems`): sem isso, `isLoading` virava
  // `false` só com `earningQuery`/`employeeQuery` resolvidos e o usuário via
  // o form interativo (ou já seedado com `events: []`) ANTES do fetch fresco
  // dos vínculos completar — o `fillForm` então reexecutava (resetForce) ao
  // vínculo resolver, trocando a lista "atrasada" debaixo do usuário.
  //
  // REJEIÇÃO do Tester (corrigida aqui): `checkLoadingStatus` (util
  // COMPARTILHADO, não alterado) usa `isLoading || isPending`. No TanStack
  // Query v5 uma query DESABILITADA (`enabled: false`, ex.: employeeUuid
  // ainda inválido na 1ª renderização) fica com `isPending=true` PARA
  // SEMPRE (nunca sai do estado "pending" porque nunca chega a rodar) —
  // incluir `employeeEventItemsQuery` dentro de `checkLoadingStatus`
  // travaria o form desabilitado indefinidamente nesse cenário. A correção
  // usa `employeeEventItemsQuery.isLoading` ISOLADO (fora do util), que no
  // v5 é derivado de `isPending && isFetching` — portanto `false` quando a
  // query está desabilitada (não fetching) e só `true` durante a busca
  // real (1ª carga). `@tanstack/react-query` confirmado em `5.28.9`
  // (`package.json`), semântica de `isLoading` acima vale para essa versão.
  const isLoading =
    checkLoadingStatus([earningQuery as any, employeeQuery as any]) ||
    employeeEventItemsQuery.isLoading;

  // ---- Cálculo client-side de total/vl_cheque (CV-01/CV-02) ----------------
  const watchedEvents = watch('events');
  const watchedVlAccount = Number(watch('vl_account')) || 0;

  const computedTotal = useMemo(
    () =>
      (watchedEvents ?? []).reduce((sum, row) => {
        const value = Number(row?.value) || 0;
        const signed = row?.condition === 0 ? -value : value;
        return sum + signed;
      }, 0),
    [watchedEvents]
  );

  useEffect(() => {
    if (Number(watch('total')) !== computedTotal) {
      setValue('total', computedTotal, { shouldDirty: false });
    }
  }, [computedTotal]);

  // `vl_account > total` — aviso e zera os dois campos (mirror do alerta
  // legado, servidor não protege contra isso — Armadilha 4 da Tarefa 08).
  useEffect(() => {
    if (watchedVlAccount > computedTotal && computedTotal > 0) {
      toaster.create({
        type: 'warning',
        title: text.singularLabel,
        description: text.form.vlAccountExceedsTotalWarning,
      });
      setValue('vl_account', 0, { shouldDirty: true });
    }
  }, [watchedVlAccount, computedTotal]);

  const computedVlCheque = computedTotal - watchedVlAccount;
  useEffect(() => {
    if (Number(watch('vl_cheque')) !== computedVlCheque) {
      setValue('vl_cheque', computedVlCheque, { shouldDirty: false });
    }
  }, [computedVlCheque]);

  // ---- Degradação graciosa — Proprietário (`GAP-EARNING-FE-03`) + Equipe
  // (Armadilha 3 da Tarefa 07) ----
  const proprietaryAccessQuery = useProprietaryOptionsAccess();
  const teamAccessQuery = useTeamOptionsAccess();
  const isProprietaryAvailable = !proprietaryAccessQuery.isError;
  const isTeamAvailable = !teamAccessQuery.isError;

  const earningMutation = useRequest({
    asyncFunction: tryPersistEarning,
    entityName: text.singularLabel,
    queryKey: queryKey.earnings.earnings,
    queryKey2: queryKey.earnings.earning,
    typesRequest: 'update',
    actionSuccess: () => {
      navigate(EARNING_LIST_ROUTE);
    },
  });

  // Payload SEMPRE FULL (nunca patch parcial por `dirtyFields` — o
  // acoplamento total↔eventos torna PATCH inconsistente, Armadilha 5).
  async function tryPersistEarning(data: EarningUpsertForm) {
    const events: EarningEventPayload[] = (data.events ?? []).map((row) => ({
      event_uuid: row.event_uuid,
      value: Number(row.value) || 0,
      method: row.method ?? 0,
    }));

    const payload: EarningUpsertPayload = {
      employee_uuid: employeeUuid as string,
      function_uuid: (employeeQuery.data?.function?.uuid ?? data.function_uuid?.value) as string,
      month: data.month,
      year: data.year,
      type: data.type,
      total: Number(data.total),
      vl_account: Number(data.vl_account),
      events,
      center_uuid: data.center_uuid?.value as string | undefined,
      team_uuid: data.team_uuid?.value as string | undefined,
      proprietary_uuid: data.proprietary_uuid?.value as string | undefined,
    };

    return upsertEarning(
      employeeUuid as string,
      { month: data.month, year: data.year, type: data.type },
      payload
    );
  }

  async function onSubmit(data: EarningUpsertForm) {
    if (periodCutoffBlocked) {
      toaster.create({
        type: 'error',
        title: text.singularLabel,
        description: text.form.periodCutoffError,
      });
      return;
    }
    await earningMutation.mutateAsync(data);
  }

  const isSubmitting = earningMutation.isPending;

  if (hasMalformedRouteParam) {
    return null;
  }

  return (
    <FormContainer
      title={earningQuery.data ? text.form.title.edit : text.form.title.create}
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
              create={!earningQuery.data}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading || periodCutoffBlocked}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {periodCutoffBlocked && (
          <Box
            mb={4}
            p={3}
            bg="orange.500/10"
            border="1px solid"
            borderColor="orange.500/30"
            borderRadius="lg"
          >
            <Text fontSize="sm" color="orange.400">
              {text.form.periodCutoffError}
            </Text>
          </Box>
        )}

        <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={4}
            pb={2}
            borderBottom="1px solid"
            borderColor="border.subtle"
          >
            {text.form.sections.generalData}
          </Text>

          <SimpleGrid columns={columnsForm.default} gap={6}>
            {/* UT-000764 P1 — `fontSize` liga truncamento (reticências) + `title`
                com o valor completo no `InputReadOnly`; `minWidth={0}` deixa a
                célula do grid encolher. Funcionário ocupa a linha INTEIRA abaixo
                de `lg` (em `md` a grade tem 3 colunas e 1 coluna deixava o
                nome em ~36px) e 2 colunas no `lg` (mirror `col-md-6` do
                legado), fechando a linha em 4 colunas (Funcionário 2 + CPF 1
                + Função 1). Em `md` as linhas seguintes fecham em 3 (CPF,
                Função, Mês / Ano, Tipo, Centro), sem buracos. */}
            <Box gridColumn={{ base: '1 / -1', lg: 'span 2' }} minWidth={0}>
              <InputReadOnly
                name="employee"
                label={text.form.fields.employee}
                value={employeeQuery.data?.name || '—'}
                fontSize="md"
              />
            </Box>
            <Box minWidth={0}>
              <InputReadOnly
                name="cpf"
                label={text.form.fields.cpf}
                value={employeeQuery.data?.nif || '—'}
                fontSize="md"
              />
            </Box>

            {/* UT-000764 D1 — Função SOMENTE LEITURA (função atual do
                funcionário; `function_uuid` do form é sincronizado acima e
                enviado no salvar). Sem função cadastrada: mantém a
                validação obrigatória e exibe a mensagem do schema. */}
            <Box minWidth={0}>
              <InputReadOnly
                name="function"
                label={text.form.fields.function}
                value={currentFunction?.name || '—'}
                fontSize="md"
                isRequired
                error={errors.function_uuid?.message as string | undefined}
              />
            </Box>

            <InputReadOnly
              name="month"
              label={text.form.fields.month}
              value={String(month).padStart(2, '0')}
            />
            <InputReadOnly name="year" label={text.form.fields.year} value={String(year)} />

            {/* UT-000716 item 8 — "Tipo" volta a ser SOMENTE LEITURA, mirror
                legado: o valor vem do filtro (querystring `type`, default
                'N') e nunca é editado nesta tela; o campo `type` continua
                no `defaultValues`/`reset` do RHF (sem `Controller`/registro
                de input), mesmo padrão já usado aqui para `month`/`year`. */}
            <InputReadOnly
              name="type"
              label={text.form.fields.type}
              value={TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type}
            />

            <Controller
              name="center_uuid"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={name}
                  label={text.form.fields.costCenter}
                  service={listCostCenterOptions}
                  mapOptions={(item: CostCenterRef) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  // UT-000714 itens 1/2 — só Centros de Custo ANALÍTICOS
                  // (`only_analytic`) e pertencentes ao pivot da fazenda
                  // ATIVA (`farm_uuid`), mirror `EarningRequest.php:83-93`
                  // (`Rule::exists('cost_center_farm')` escopado à fazenda
                  // ativa) — resolve o 422 "centro de custo inválido" e a
                  // listagem indevida de Sintéticos/centros fora do pivot.
                  // UT-000764 P2 — + `is_enabled: true` (só ATIVOS), mirror
                  // legado `EarningController.php:165-170`.
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    only_analytic: true,
                    is_enabled: true,
                    farm_uuid: activeFarmUuid ?? '',
                  })}
                  value={value ?? null}
                  onChange={(option: any) => onChange(option ?? null)}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave || isLoading}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  // Troca de fazenda ativa em sessão aberta precisa reabrir
                  // o cache do dropdown (lição sistêmica de
                  // `SelectAsyncPaginate` dependente sem `cacheUniqs`).
                  cacheUniqs={[activeFarmUuid]}
                />
              )}
            />

            {isTeamAvailable ? (
              <Controller
                name="team_uuid"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <SelectAsyncPaginate
                    name={name}
                    label={text.form.fields.team}
                    service={listTeams}
                    mapOptions={(item: TeamListItem) => ({ label: item.name, value: item.uuid })}
                    findParams={findParamsFromSearch}
                    value={value ?? null}
                    onChange={(option: any) => onChange(option ?? null)}
                    isDisabled={!canSave || isLoading}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
            ) : (
              <InputReadOnly
                name="team_unavailable"
                label={text.form.fields.team}
                value={text.form.teamUnavailable}
              />
            )}

            {isProprietaryAvailable ? (
              <Controller
                name="proprietary_uuid"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    name={name}
                    label={text.form.fields.proprietary}
                    options={(proprietaryAccessQuery.data ?? []).map((item) => ({
                      label: item.label,
                      value: item.uuid,
                    }))}
                    value={value ?? null}
                    onChange={(option: any) => onChange(option ?? null)}
                    isDisabled={!canSave || isLoading || proprietaryAccessQuery.isLoading}
                    loading={proprietaryAccessQuery.isLoading}
                  />
                )}
              />
            ) : (
              <InputReadOnly
                name="proprietary_unavailable"
                label={text.form.fields.proprietary}
                value={text.form.proprietaryUnavailable}
              />
            )}
          </SimpleGrid>
        </Box>

        <Box mt={6}>
          <EventoApuracaoEditor
            control={control}
            errors={errors}
            disabled={!canSave || isLoading}
            employeeEventValues={employeeEventValuesQuery.data}
          />
        </Box>

        <Box
          mt={6}
          bg="bg.muted"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          p={4}
        >
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="vl_account"
              control={control}
              render={({ field, fieldState }) => (
                <MoneyInput
                  name={field.name}
                  label={text.form.fields.vlAccount}
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                  error={fieldState.error?.message}
                  isRequired
                  disabled={!canSave || isLoading}
                />
              )}
            />
            <InputReadOnly
              name="total"
              label={text.form.fields.total}
              value={computedTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            />
            <InputReadOnly
              name="vl_cheque"
              label={text.form.fields.vlCheque}
              value={computedVlCheque.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            />
          </SimpleGrid>
        </Box>

        {/* Adiantamentos do período — bloco informativo READ-ONLY, nunca
            editável, não faz parte do payload de upsert (só quando presente
            na resposta). */}
        {earningQuery.data?.advances_period && earningQuery.data.advances_period.length > 0 && (
          <Box mt={6}>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="fg.muted"
              textTransform="uppercase"
              mb={3}
            >
              {text.form.sections.advancesPeriod}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={3}>
              {earningQuery.data.advances_period.map((advance) => (
                <InputReadOnly
                  key={advance.uuid}
                  name={`advance-${advance.uuid}`}
                  label={advance.date}
                  value={Number(advance.amount).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                />
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Form>
    </FormContainer>
  );
}
