// src/pages/Administrativo/Earning/earningTotals.ts
// -----------------------------------------------------------------------------
// GAP-EARNING-08 [AVALIADO], Opção B — fix cirúrgico só frontend, SEM reabrir
// `GAP-EARNING-01`. O servidor continua nunca recalculando `total`/`vl_cheque`
// a partir de `events[]` (comportamento deliberado, preservado). O problema
// era só de EXIBIÇÃO: `index.tsx`/`EarningDetalhe.tsx` mostravam a coluna
// persistida crua (pode ficar obsoleta em relação aos eventos atuais),
// enquanto `CreateOrUpdateEarning.tsx` (Editar) sempre recalculava
// client-side a partir de `events[]` — por isso só Editar mostrava o valor
// certo.
//
// Este util centraliza a MESMA fórmula que `CreateOrUpdateEarning.tsx` já usa
// (`computedTotal`/`computedVlCheque`, CV-01/CV-02: `total = Σ(condition===0
// ? -valor : +valor)`; `vl_cheque = total - vl_account`), para ser reaproveitada
// por `index.tsx` (Listagem) e `EarningDetalhe.tsx` (Detalhe) sem duplicar a
// regra de sinal.
//
// `EarningEventRow` (resposta de `GET /earnings*`) NÃO expõe `condition` (só
// `method` — mesma limitação documentada em `useEventCatalog`, GAP-EARNING-FE-04).
// Por isso a assinatura recebe o catálogo de eventos (`useEventCatalog()`,
// `Map<uuid, EventListItem>`) para resolver o sinal por `event.uuid`
// (`EarningEventRow.uuid` É o uuid do EVENTO, confirmado por leitura direta —
// mesma convenção já usada em `CreateOrUpdateEarning.tsx::fillForm`).
//
// Degradação graciosa: sem `events` (ausente/vazio) → soma 0 (mirror do
// formulário, que nasce em 0 sem linhas); evento não encontrado no catálogo
// (ex.: desabilitado, fora do filtro `is_enabled:true` do catálogo) → tratado
// como sinal positivo (mesma limitação já presente em `CreateOrUpdateEarning`,
// não é regressão nova).
// -----------------------------------------------------------------------------

import type {
  EarningEventRow,
  EarningFilterForm,
  EarningListItem,
  EarningTypeValue,
} from '@/@types/v2/Earnings';
import type { EventListItem } from '@/@types/v2/Events';

// F-105 (UT-000731) — `GET /earnings` agora lista o ROSTER de elegíveis
// (reverte `GAP-EARNING-FE-02`); o discriminador CANÔNICO de linha "A apurar"
// (sem earning lançado no período) é `is_pay === null` (o `uuid` também vem
// `null` nessas linhas, mas `is_pay` é o campo semântico — mirror do
// contrato do `EarningListItem`). Centralizado aqui para `index.tsx` não
// duplicar a checagem em badge/totais/ações.
export function isRosterOnlyEarning(item: Pick<EarningListItem, 'is_pay'>): boolean {
  return item.is_pay === null;
}

// UT-000716 item 9 — período/tipo DEFAULT (mirror legado EXATO,
// `agro365/app/Http/Controllers/Admin/EarningController.php:35-39`:
// `month = today()->subMonth()->month`, `year = today()->subMonth()->year`,
// `type = 'N'`). Centralizado aqui para ser reaproveitado SEM duplicar a
// regra por `CreateOrUpdateEarning.tsx` (filtro da tela de edição) e
// `index.tsx` (filtro default da listagem, drawer `FilterSideEarning`).

/**
 * Mês/ano ANTERIOR ao corrente (mirror `today()->subMonth()`).
 *
 * @return {object} Mês (1-12, campo `month`) e ano (campo `year`) do período anterior.
 */
export function previousMonthPeriod(): { month: number; year: number } {
  const now = new Date();
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { month: previous.getMonth() + 1, year: previous.getFullYear() };
}

/**
 * `type` default do filtro — `'N'`/"Folha Normal" (mirror legado). Label
 * idêntico ao já usado em `CreateOrUpdateEarning.tsx`/`FilterSideEarning.tsx`
 * (`TYPE_OPTIONS`), só no formato `Option` pronto para popular o Select do
 * filtro (`index.tsx`).
 */
export const EARNING_DEFAULT_TYPE_OPTION: { label: string; value: EarningTypeValue } = {
  label: 'Folha Normal',
  value: 'N',
};

// UT-000756 — contrato: o legado (`EarningController.php:35-39`) RECALCULA
// mês/ano a cada visita (`today()->subMonth()`, sem persistência); a decisão
// do dono (esteira 102/DEC-109) é manter o filtro no drawer `FilterSideEarning`
// (nunca inline), só corrigindo o PRÉ-PREENCHIMENTO para não "congelar" o
// mês/ano de uma visita anterior salva em `localStorage`. Centraliza o
// default COMPLETO (sem funcionário/função) para `index.tsx` (filtro
// aplicado ao montar) e `FilterSideEarning.tsx` ("Limpar filtros") não
// duplicarem a regra — chamar a cada necessidade (nunca memoizar no module
// scope) para o mês/ano recalcularem a cada nova chamada.
export function buildDefaultEarningFilter(): EarningFilterForm {
  const period = previousMonthPeriod();
  return {
    employee_uuid: null,
    function_uuid: null,
    year: String(period.year),
    month: { label: String(period.month).padStart(2, '0'), value: period.month },
    type: EARNING_DEFAULT_TYPE_OPTION,
  };
}

/**
 * Sinal da linha na soma de `total` (`EventCondition`: 0=Diminui/1=Soma) —
 * mesma regra de `CreateOrUpdateEarning.tsx` (CV-01/CV-02).
 *
 * @param {number} value Valor bruto (já `Number(...)`, decimal convertido) da linha.
 * @param {number | null | undefined} condition `EventCondition` resolvido (0=Diminui/1=Soma) ou `undefined`/`null` se não resolvido (tratado como positivo).
 * @return {number} Valor com sinal aplicado.
 */
export function signedEventValue(value: number, condition: number | null | undefined): number {
  return condition === 0 ? -value : value;
}

/**
 * Recalcula `total` a partir de `events[]`, resolvendo `condition` pelo
 * catálogo de eventos (`useEventCatalog`).
 *
 * @param {EarningEventRow[] | undefined} events `events[]` da resposta da API (`GET /earnings*`) — pode estar ausente.
 * @param {Map<string, EventListItem> | undefined} conditionCatalog Catálogo de eventos (`useEventCatalog().data`) para resolver `condition` por `event.uuid`.
 * @return {number} `total` recalculado.
 */
export function computeEarningTotalFromEvents(
  events: EarningEventRow[] | undefined,
  conditionCatalog: Map<string, EventListItem> | undefined
): number {
  return (events ?? []).reduce((sum, row) => {
    const value = Number(row.value) || 0;
    const condition = conditionCatalog?.get(row.uuid)?.condition;
    return sum + signedEventValue(value, condition);
  }, 0);
}

/**
 * `vl_cheque = total (recalculado) - vl_account` — mesma fórmula de
 * `CreateOrUpdateEarning.tsx`.
 *
 * @param {EarningEventRow[] | undefined} events `events[]` da resposta da API (`GET /earnings*`) — pode estar ausente.
 * @param {number | string | undefined} vlAccount `vl_account` (STRING decimal ou já `number`) do registro.
 * @param {Map<string, EventListItem> | undefined} conditionCatalog Catálogo de eventos (`useEventCatalog().data`) para resolver `condition` por `event.uuid`.
 * @return {number} `vl_cheque` recalculado.
 */
export function computeEarningVlChequeFromEvents(
  events: EarningEventRow[] | undefined,
  vlAccount: number | string | null | undefined,
  conditionCatalog: Map<string, EventListItem> | undefined
): number {
  return computeEarningTotalFromEvents(events, conditionCatalog) - (Number(vlAccount) || 0);
}
