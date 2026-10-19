// src/pages/Administrativo/Earning/useEarnings.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de APURAÇÃO MENSAL (Earning) — 97-Esteiras/002,
// Tarefas 07/08, mirror de `Adiantamento/useAdvances.tsx`:
//   - useEarningsList  → useCustomGridQuery (listagem paginada, filtros
//     employee_uuid/function_uuid/month/year)
//   - useEarningDetail → useQuery direto (tela de Detalhe, leitura pura,
//     SEMPRE alcançada a partir de uma linha JÁ existente no índice — 200)
//   - useEarningForm   → useQuery customizado (Tarefa 08) que trata 404 como
//     dado nulo (formulário em branco), NUNCA como erro de tela (Armadilha 1)
// -----------------------------------------------------------------------------

import { useEffect, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { isValidGuid } from '@/utils/guid';

import { queryKey } from '@/constants/query-key';

import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import {
  getEarning,
  getEarningForForm,
  listEarnings,
} from '@/services/v2/Earnings/earning-service';
import { listEmployeeEvents } from '@/services/v2/EmployeeEvents/employee-event-service';
import { listEvents } from '@/services/v2/Events/event-service';
import { listTeams } from '@/services/v2/Teams/team-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { EarningDetail, EarningFilterRequest, EarningListItem } from '@/@types/v2/Earnings';
import type { EmployeeEventListItem } from '@/@types/v2/EmployeeEvents';
import type { EventListItem } from '@/@types/v2/Events';

interface UseEarningsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: EarningFilterRequest;
}

export function useEarningsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseEarningsListProps) {
  return useCustomGridQuery<EarningListItem, EarningFilterRequest>({
    asyncFunction: listEarnings,
    queryKey: queryKey.earnings.earnings,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as EarningFilterRequest),
  });
}

interface UseEarningDetailProps {
  employeeUuid?: string;
  month?: number;
  year?: number;
  type?: string;
}

// Leitura pura para a tela de Detalhe — SEMPRE alcançada a partir de uma
// linha JÁ existente no índice, portanto sempre 200 aqui (o 404 só importa
// para `useEarningForm`, abaixo).
export function useEarningDetail({ employeeUuid, month, year, type }: UseEarningDetailProps) {
  const hasValidParams = isValidGuid(employeeUuid) && !!month && !!year;

  return useQuery({
    queryKey: [queryKey.earnings.earning, employeeUuid, month, year, type],
    queryFn: async () => {
      const response = await getEarning(employeeUuid as string, {
        month: month as number,
        year: year as number,
        type,
      });
      return response.data as EarningDetail;
    },
    enabled: hasValidParams,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

interface UseEarningFormProps {
  employeeUuid?: string;
  month?: number;
  year?: number;
  type?: string;
  fillForm: (data: EarningDetail | null, resetForce?: boolean) => void;
}

// Hidratação do formulário de upsert (Tarefa 08, Armadilha 1) — 404 vira
// `null` (formulário em branco), NUNCA um toast de erro genérico. Qualquer
// outro status segue o fluxo padrão de erro (propagado por
// `getEarningForForm`).
export function useEarningForm({ employeeUuid, month, year, type, fillForm }: UseEarningFormProps) {
  const hasValidParams = isValidGuid(employeeUuid) && !!month && !!year;

  const query = useQuery({
    queryKey: [queryKey.earnings.earning, employeeUuid, month, year, type],
    queryFn: () =>
      getEarningForForm(employeeUuid as string, {
        month: month as number,
        year: year as number,
        type,
      }),
    enabled: hasValidParams,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // `data !== undefined` cobre os DOIS casos de sucesso: 200 (objeto
  // hidratado) E 404-tratado (sentinela `null`, formulário nasce em
  // branco) — só `undefined` (loading/disabled) não deve disparar
  // `fillForm`. Mirror `useCustomFormQueryByGuid`, ajustado para o
  // sentinela `null` ser um resultado VÁLIDO, não ausência de dado.
  useEffect(() => {
    if (query.isSuccess && !query.isRefetching) {
      fillForm(query.data ?? null, true);
    }
  }, [query.isSuccess, query.isRefetching]);

  return query;
}

// ---- Degradação graciosa de campos opcionais gateados por permissão de
// OUTRO domínio (`GAP-EARNING-FE-03` — Proprietary; Armadilha 3 da Tarefa
// 07 — Team) — reaproveitados por `CreateOrUpdateEarning.tsx` e
// `EarningImportModal.tsx` (mesmos 2 campos, mesmo tratamento). O 403
// isolado desta query NUNCA propaga para o `ErrorLogPanel`/toast genérico
// da tela inteira — só oculta o campo, o upsert/import continua funcionando
// sem ele (ambos os campos são `nullable`/opcionais nos respectivos
// Requests da API).

// Proprietário (`GET /proprietaries/options`, gate `accounts_create|
// accounts_edit`) — lookup ENXUTO já paginação-free (array completo).
export function useProprietaryOptionsAccess() {
  return useQuery({
    queryKey: [queryKey.earnings.earning, 'proprietary-options', 'farm'],
    queryFn: () => listProprietaryOptions(undefined, 'farm'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

// Equipe (`GET /teams`, SEM `/options` dedicado — gate `teams_view`) — probe
// enxuto (`per_page:1`) só para testar a permissão; a busca real do select
// usa `listTeams` diretamente como `service` do `SelectAsyncPaginate`.
export function useTeamOptionsAccess() {
  return useQuery({
    queryKey: [queryKey.earnings.earning, 'team-options-probe'],
    queryFn: () => listTeams({ page: 1, per_page: 1 }),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

// ---- Catálogo de Eventos (`GAP-EARNING-FE-04`) -----------------------------
// `EarningEventRow` (resposta do `GET /earnings/{employee_uuid}`) NÃO expõe
// `condition` (só `method`) — necessário para resolver o SINAL de linhas já
// hidratadas (evento escolhido em uma sessão anterior) no cálculo
// client-side de `total` (CV-01/CV-02). Busca única do catálogo COMPLETO de
// eventos habilitados (`GET /events`, gate `events_view` — mesma fonte do
// picker em `EventoApuracaoEditor.tsx`) para resolver `condition`/
// `condition_label` por `uuid` no `fillForm` de `CreateOrUpdateEarning.tsx`.
// Catálogo de rubrica é tipicamente pequeno (dezenas de itens) — 1 página
// grande é suficiente, sem paginação incremental.
export function useEventCatalog() {
  return useQuery({
    queryKey: [queryKey.earnings.earning, 'event-catalog'],
    queryFn: async () => {
      const response = await listEvents({ page: 1, per_page: 200, is_enabled: true });
      const map = new Map<string, EventListItem>();
      response.data.items.forEach((item) => map.set(item.uuid, item));
      return map;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

// ---- Valores de "Funcionário X Eventos" (`EmployeeEvent`) para hidratar
// linhas de evento método FIXO (`GAP-EARNING-FE-05` [AVALIADO], Opção A —
// front-only, SEM mudança de contrato de API) --------------------------------
//
// Mirror do legado (`earnings/create.blade.php`): `GET /api/v1/employee-events
// ?employee=<id>` sempre alimentava o valor (readonly) de linhas "Fixo" a
// partir do vínculo Funcionário×Evento. A migração para `EventoApuracaoEditor
// .tsx` (Tarefa 08) nunca reproduziu essa hidratação — o valor nascia sempre
// zerado (regressão de fidelidade). Endpoint já migrado e filtrável por
// funcionário (`GET /employee-events?employee_uuid=`), sem mudança de
// contrato: consultado aqui só para pré-popular (readonly) o campo `value`
// das linhas "Fixo" — tanto ao adicionar uma linha manualmente
// (`EventoApuracaoEditor.tsx::handleEventChange`) quanto na hidratação
// inicial de uma apuração já existente cujo `value` persistido ainda esteja
// zerado (`CreateOrUpdateEarning.tsx::fillForm`).
//
// UT-000742 — vínculos COMPLETOS de "Funcionário x Eventos" (`EmployeeEventListItem[]`,
// mesma fonte/queryKey de `useEmployeeEventValueMap` abaixo, dedupe automático do
// TanStack Query — 1 única chamada de rede serve os dois hooks). Necessário para
// SEMEAR as linhas de `events[]` no ramo "apuração nova" (404,
// `CreateOrUpdateEarning.tsx::fillForm(null)`) — o `Map` de
// `useEmployeeEventValueMap` descarta `event.name`/`method`, que a seed exige
// (mirror legado `earnings/edit.blade.php:73-110`, `@foreach ($item->events as
// $event)` quando `!count($item->earnings)`).
export function useEmployeeEventItems(employeeUuid?: string) {
  const hasValidEmployee = isValidGuid(employeeUuid ?? null);

  // UT-000756 — SEM CACHEAMENTO (pedido literal do dono): vínculo de
  // "Funcionário x Eventos" editado em OUTRA aba/sessão (fora da invalidação
  // em memória da esteira 113, que só cobre a mesma aba) não pode ficar
  // servindo a lista antiga por `staleTime`. `staleTime: 0` + `gcTime: 0`
  // garantem busca ao servidor a cada abertura da Apuração; `refetchOnMount:
  // 'always'` força o refetch mesmo que o TanStack ainda considere o dado
  // "fresco" por alguma reentrância de render. Não altera o default global
  // (`refetchOnWindowFocus: false` em `query-client.ts`) nem outras queries
  // deste módulo (catálogo de eventos, proprietário, equipe).
  return useQuery({
    queryKey: [queryKey.earnings.earning, 'employee-event-items', employeeUuid],
    queryFn: async () => {
      const response = await listEmployeeEvents({
        employee_uuid: employeeUuid,
        is_enabled: true,
        page: 1,
        per_page: 200,
      });
      return response.data.items;
    },
    enabled: hasValidEmployee,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });
}

// Chave do Map = uuid do EVENTO (`EmployeeEventListItem.event.uuid`), valor =
// `EmployeeEventListItem.value` (já `number`, mirror `EmployeeEventResource`).
// Degradação graciosa: funcionário sem nenhum vínculo configurado → Map
// vazio, `.get()` sempre `undefined`, comportamento anterior (0/travado)
// preservado, sem crash. Derivado de `useEmployeeEventItems` (mesma
// queryKey → mesma resposta em cache, sem 2ª chamada de rede).
export function useEmployeeEventValueMap(employeeUuid?: string) {
  const itemsQuery = useEmployeeEventItems(employeeUuid);

  const map = useMemo(() => {
    const result = new Map<string, number>();
    (itemsQuery.data ?? []).forEach((item: EmployeeEventListItem) =>
      result.set(item.event.uuid, Number(item.value))
    );
    return result;
  }, [itemsQuery.data]);

  return { ...itemsQuery, data: map };
}
