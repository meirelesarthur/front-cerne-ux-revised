// src/pages/CadastrosBase/Safra/safra-weeks.ts
// -----------------------------------------------------------------------------
// Algoritmo de geração de semanas + paleta de cores da seção "Semanas" do
// formulário de Safra (TASK-FE-009). Adaptação (NÃO cópia) do algoritmo de
// `GB.Cerne.UX/src/pages/cadastros/safras/safras.types.ts`
// (`generateWeeks`/`isoWeekNum`/`isCurrentWeek`, commit 73b5fa86) — TS puro,
// SEM import de `ux_root`. A única dependência é o tipo REAL do contrato da
// API (`WeekVintagePayload`, já commitado em TASK-FE-006/@types/v2/Harvests),
// garantindo que nunca haja drift entre o que este módulo gera e o que o
// backend espera — `HarvestForm.weeks` continua `WeekVintagePayload[]` sem
// precisar editar `@types/v2/Harvests` (fora de "Arquivos Afetados" desta
// Tarefa).
//
// Reconciliação deliberada com o pseudocódigo ilustrativo da Tarefa (ver
// Histórico da Tarefa para o detalhamento completo):
//  1. `generateWeeks` porta a lógica LINHA A LINHA (mesmo "truque de
//     quinta-feira" do ISO 8601, cursor ancorado na segunda-feira, MESMA
//     definição de "year" usada no casamento de cor — ano CIVIL da segunda-
//     feira via `cursor.getFullYear()`, não o "ano ISO" teórico da virada de
//     ano) — é o ponto de maior risco de bug sutil da Tarefa, então
//     fidelidade bit-a-bit ao comportamento do mock importa mais que
//     "corrigir" uma sutileza do ISO 8601 que o próprio mock também não trata
//     (ver a função `isoWeekNumber` abaixo).
//  2. EXCEÇÃO deliberada (única): o mock descarta o intervalo quando
//     `fim <= ini` (retorna `[]`) — mas `safra-schema.ts` (TASK-FE-008, já
//     commitado) e o backend (`after_or_equal:start_date`) ACEITAM
//     `end_date === start_date` (safra de 1 dia). Portar o guard `<=`
//     literalmente criaria uma contradição interna: datas válidas pelo
//     próprio schema desta Tarefa gerariam ZERO semanas, travando o submit
//     por `weeks.min(1)` sem nenhuma mensagem de campo que explique o
//     motivo. Aqui o guard é `end < start` (estritamente menor) — datas
//     iguais produzem exatamente 1 semana. Não afeta nenhum caso comum
//     (intervalos de meses), só o caso degenerado de 1 dia.
//  3. `start_date`/`end_date` saem em 'YYYY-MM-DD' (não 'DD/MM/YYYY' do
//     mock) — vão direto para o payload real (`WeekVintagePayload`),
//     conforme instrução explícita da Tarefa.
//  4. `existing`/retorno usam o tipo REAL do contrato (`WeekVintagePayload`)
//     em vez de um tipo `Week` paralelo — `GeneratedWeek` ESTENDE
//     `WeekVintagePayload` (superset estrutural: mesmos 4 campos do payload +
//     `color` estreitado à paleta fechada + `year`/`month` de conveniência).
//     Por ser superset, `GeneratedWeek[]` é atribuível a `WeekVintagePayload[]`
//     (o tipo real de `HarvestForm['weeks']`) SEM CAST — `replace(generateWeeks(...))`
//     tipa limpo em `CreateOrUpdateSafra.tsx`. `year`/`month` não são a
//     ÚNICA fonte dessa informação: `getWeekYearMonth` (abaixo) deriva os
//     mesmos valores de `start_date` para quem só tem um `WeekVintagePayload`
//     puro (ex.: semanas vindas prontas do servidor em TASK-FE-010, que nunca
//     passaram por `generateWeeks`) — sem dois "donos" divergentes do mesmo
//     dado.
//  5. `label` (rótulo textual da cor, ex. "Amarelo") NÃO mora nesta paleta —
//     é conteúdo i18n (`ModuleHarvests.harvest.form.weeks.colorLabels`),
//     resolvido em `WeeksCanvas.tsx`. `bg`/`text`/`border`/`abbr` seguem
//     fixos (idênticos à Referência UX) porque são identidade de DADO, não
//     tema (DoD: "não trocam por dark mode") nem idioma.
// -----------------------------------------------------------------------------

import type { WeekVintagePayload } from '@/@types/v2/Harvests';

export type WeekColorKey =
  | 'amarelo'
  | 'azul-claro'
  | 'azul-escuro'
  | 'azul-marinho'
  | 'branco'
  | 'marrom'
  | 'palha'
  | 'preto'
  | 'rosa';

export interface WeekColorDef {
  bg: string;
  text: string;
  border: string;
  /** Abreviação de 2 letras exibida no tile — a cor de fundo sozinha não diferencia os 3 tons de azul (WCAG 1.4.1, daltonismo). */
  abbr: string;
}

/**
 * Paleta FECHADA de 9 cores — hex/border/abbr idênticos à Referência UX
 * (`WEEK_COLORS`/`WEEK_COLOR_ABBR` de `safras.types.ts`). Decisão de design
 * deliberada (não um placeholder): o backend aceita qualquer string ≤20
 * chars, mas o front nunca oferece um color-picker livre — só estas 9.
 */
export const WEEK_COLOR_PALETTE: Record<WeekColorKey, WeekColorDef> = {
  amarelo: { bg: '#fef08a', text: '#713f12', border: '#fde047', abbr: 'AM' },
  'azul-claro': { bg: '#bae6fd', text: '#0c4a6e', border: '#7dd3fc', abbr: 'AC' },
  'azul-escuro': { bg: '#1e3a5f', text: '#ffffff', border: '#2d5a8e', abbr: 'AE' },
  'azul-marinho': { bg: '#0c1a3e', text: '#ffffff', border: '#1a3060', abbr: 'AZ' },
  branco: { bg: '#f8fafc', text: '#334155', border: '#e2e8f0', abbr: 'BR' },
  marrom: { bg: '#92400e', text: '#ffffff', border: '#b45309', abbr: 'MR' },
  palha: { bg: '#fef3c7', text: '#78350f', border: '#fde68a', abbr: 'PL' },
  preto: { bg: '#0f172a', text: '#ffffff', border: '#1e293b', abbr: 'PT' },
  rosa: { bg: '#fce7f3', text: '#831843', border: '#f9a8d4', abbr: 'RS' },
};

/** Ordem de distribuição cíclica ao gerar semanas novas — idêntica à Referência UX (`COLOR_CYCLE`). */
export const WEEK_COLOR_CYCLE: WeekColorKey[] = [
  'amarelo',
  'azul-claro',
  'azul-escuro',
  'azul-marinho',
  'branco',
  'marrom',
  'palha',
  'preto',
  'rosa',
];

/**
 * Type guard: `color` é uma das 9 chaves da paleta fechada.
 * @param {string|undefined|null} color - Valor livre vindo do payload real (`WeekVintagePayload.color: string`).
 * @return {boolean} `true` quando `color` é uma `WeekColorKey` válida.
 */
export function isValidWeekColor(color: string | undefined | null): color is WeekColorKey {
  return !!color && Object.prototype.hasOwnProperty.call(WEEK_COLOR_PALETTE, color);
}

/**
 * Resolve `color` (string livre do payload real, `WeekVintagePayload.color:
 * string`) para uma chave válida da paleta — nunca propaga um valor fora da
 * paleta (ex.: dado legado/editado fora da UI) para quem espera
 * `WeekColorKey`; cai no início do ciclo como fallback seguro.
 * @param {string|undefined|null} color - Valor livre vindo do payload real.
 * @return {WeekColorKey} Chave válida da paleta fechada.
 */
export function resolveWeekColorKey(color: string | undefined | null): WeekColorKey {
  return isValidWeekColor(color) ? color : WEEK_COLOR_CYCLE[0];
}

/**
 * Semana gerada — superset estrutural de `WeekVintagePayload` (ver item 4 da
 * nota de cabeçalho).
 */
export interface GeneratedWeek extends WeekVintagePayload {
  // ERRO-FE-003: alargado de `WeekColorKey` para `string` — a preservação de
  // cor em `generateWeeks` (abaixo) passou a repassar o valor BRUTO de
  // `existing[i].color` (que é `WeekVintagePayload.color: string`, paleta
  // ABERTA no backend) sempre que há match por `{number_week, year}`, mesmo
  // quando esse valor não é uma das 9 chaves nomeadas da paleta fechada do
  // front (ex.: HEX legado/seed/import). Estreitar aqui de volta para
  // `WeekColorKey` forçaria de novo um cast ou o descarte silencioso que
  // este Erro corrige — ver `resolveWeekColorKey` para quem precisa
  // exibir/agir sobre uma das 9 chaves com fallback seguro.
  color: string;
  /** Ano CIVIL da segunda-feira que inicia a semana (não o "ano ISO" teórico) — mesma definição usada no casamento de cor, ver item 1 da nota de cabeçalho. */
  year: number;
  /** 0-11 — só para agrupamento visual (`WeeksCanvas`). */
  month: number;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

// 'YYYY-MM-DD' a partir de um `Date` local (sem componente de hora/fuso).
function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

// Número da semana ISO 8601 ("truque de quinta-feira") — porte literal de
// `safras.types.ts::isoWeekNum`. Retorna só o NÚMERO (1-53); o "ano" usado
// para casamento de cor em `generateWeeks` é o ano civil da segunda-feira
// (`cursor.getFullYear()`), não o ano ISO que este cálculo produz por baixo
// dos panos — mesma convenção do mock (ver item 1 da nota de cabeçalho).
function isoWeekNumber(date: Date): number {
  const thursday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  return Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Gera as semanas de `[startDate, endDate]` alinhadas à segunda-feira,
 * numeradas pelo padrão ISO 8601, distribuindo cores em ciclo (9 cores) para
 * semanas NOVAS (sem match). Preserva a cor BRUTA de uma semana já existente
 * casando por `{number_week, year}` (ano civil da segunda-feira, derivado de
 * `existing[i].start_date`) — mesma regra da Referência UX, mas SEM o gate
 * de `isValidWeekColor`: o dado que veio do backend é repassado tal como
 * está, mesmo fora da paleta fechada de 9 cores (ERRO-FE-003 — descartar
 * silenciosamente um HEX/legado aqui e substituí-lo pelo ciclo default seria
 * perda de dado real, persistida no próximo PUT sem o usuário alterar nada).
 * Quem precisa de uma das 9 chaves nomeadas para exibir/agir (ex. destacar o
 * swatch selecionado) usa `resolveWeekColorKey` com fallback seguro.
 *
 * @param {string} startDate - 'YYYY-MM-DD'.
 * @param {string} endDate - 'YYYY-MM-DD'.
 * @param {WeekVintagePayload[]} [existing] - Semanas já preenchidas no form
 *   (geradas antes ou carregadas do servidor via `fillForm`) — usadas SÓ para
 *   preservar cor; `number_week` e datas são sempre recalculados a partir do
 *   período atual.
 * @return {GeneratedWeek[]} Semanas geradas, em ordem cronológica.
 */
export function generateWeeks(
  startDate: string,
  endDate: string,
  existing?: WeekVintagePayload[]
): GeneratedWeek[] {
  if (!startDate || !endDate) return [];

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  // `end < start` (não `<=`): datas iguais são um período de 1 dia válido
  // pelo próprio schema/backend (`after_or_equal`) — ver item 2 da nota de
  // cabeçalho.
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

  // Ancora no início (segunda-feira) da semana ISO que contém `start`.
  const dayOfWeek = start.getDay(); // 0=domingo..6=sábado
  const offsetToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() - offsetToMonday);

  const weeks: GeneratedWeek[] = [];
  let cycleIndex = 0;

  while (cursor <= end) {
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const numberWeek = isoWeekNumber(cursor);
    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    const preserved = existing?.find(
      (week) => week.number_week === numberWeek && week.start_date.slice(0, 4) === String(year)
    );

    weeks.push({
      number_week: numberWeek,
      start_date: toIsoDate(cursor),
      end_date: toIsoDate(weekEnd),
      // ERRO-FE-003: preserva a cor BRUTA de `preserved.color` sempre que
      // houve match por {number_week, year} — mesmo quando o valor não é
      // uma das 9 chaves nomeadas da paleta (`isValidWeekColor`). O gate por
      // `isValidWeekColor` aqui era o bug: descartava cor real (HEX/legado)
      // no simples ato de reabrir o formulário, substituindo-a pelo ciclo
      // default — e essa substituição ia para o próximo PUT como se fosse
      // escolha do usuário. Só cai no ciclo default quando NÃO há semana
      // correspondente (`preserved` é `undefined`, ou seja, `number_week`/
      // `year` novo).
      color: preserved ? preserved.color : WEEK_COLOR_CYCLE[cycleIndex % WEEK_COLOR_CYCLE.length],
      year,
      month,
    });

    cursor.setDate(cursor.getDate() + 7);
    cycleIndex++;
  }

  return weeks;
}

// 'YYYY-MM-DD' de hoje na data LOCAL (evita o desvio de fuso de `toISOString()`, que é UTC).
function todayIsoDate(): string {
  return toIsoDate(new Date());
}

/**
 * Hoje está dentro de `[start_date, end_date]` (comparação lexicográfica de
 * string ISO 'YYYY-MM-DD' = cronológica).
 * @param {{start_date: string, end_date: string}} week - Semana com datas ISO.
 * @return {boolean} `true` quando a data de hoje cai dentro do intervalo.
 */
export function isCurrentWeek(week: { start_date: string; end_date: string }): boolean {
  const today = todayIsoDate();
  return today >= week.start_date && today <= week.end_date;
}

/**
 * Ano/mês (0-11) derivados de `start_date` — permite a `WeeksCanvas` agrupar
 * QUALQUER `WeekVintagePayload` (recém-gerado ou vindo pronto do servidor)
 * sem depender de `GeneratedWeek.year/month` já estarem presentes no objeto.
 * @param {{start_date: string}} week - Semana com `start_date` ISO 'YYYY-MM-DD'.
 * @return {{year: number, month: number}} Ano civil e mês (0-11) derivados de `start_date`.
 */
export function getWeekYearMonth(week: { start_date: string }): { year: number; month: number } {
  return {
    year: Number(week.start_date.slice(0, 4)),
    month: Number(week.start_date.slice(5, 7)) - 1,
  };
}
