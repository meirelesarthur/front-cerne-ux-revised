// src/pages/Administrativo/Adiantamento/advance-financial-hydrate.ts
// -----------------------------------------------------------------------------
// Adaptador READ → FORM do bloco financeiro do Adiantamento Salarial —
// TASK-FE-FINANCEIRO-adiant (97-Esteiras/034, D2-REV). Isola a hidratação do
// `fillForm` de `CreateOrUpdateAdiantamento.tsx`.
//
// GAP-ADV-02 (CONFIRMADO no código real, `AdvanceResource::toArray()`,
// 2026-08-16) — a leitura (`GET /advances/{uuid}`) ecoa o HEADER financeiro
// completo (`financial.type`/`.provider`/`.proprietary`/`.number`/`.note`/
// `.fiscal_document`), reconstruído do `Expense` representativo
// (`$expenses->first()`), e o rateio JÁ AGREGADO por categoria/centro
// (`financial.categories[]`, valor ABSOLUTO — o servidor faz a agregação,
// não é mais preciso somar `expenses[].categories` no client). O EDIT
// reidrata TUDO — não há mais degradação nem aviso de header em branco.
//
// SÓ `has_input`/`input_date`/`input_value` não voltam do GET — nunca foram
// persistidos (`GenerateAdvanceExpensesAction` só usa header+installments+
// categories; esses 3 campos existem só para alimentar o gerador
// client-side na CRIAÇÃO). No EDIT ficam neutros (`has_input=false`), sem
// qualquer aviso de bloqueio — isso NUNCA foi um gap, é o comportamento
// pretendido (campos write-only de conveniência, não dados de negócio).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type { Advance, AdvanceFinancialForm } from '@/@types/v2/Advances';

export interface HydratedAdvanceFinancial {
  /** Pronto para spread dentro de `AdvanceFinancialForm` no `reset()`. */
  financial: AdvanceFinancialForm;
  /** "Picked option" do header — semeia `financialTypeOption`/
   *  `financialProviderOption`/`financialProprietaryOption` em
   *  `CreateOrUpdateAdiantamento.tsx` (mesma convenção de `employeeOption`/
   *  `eventOption`). `null` quando o header não tem aquele campo (opcionais). */
  typeOption: Option | null;
  providerOption: Option | null;
  proprietaryOption: Option | null;
  /** Cache de exibição — semeia `useState<Record<string, Option>>` de
   *  categoria no componente de rateio (mirror `ExpenseApportionmentTab`). */
  categoryOptions: Record<string, Option>;
  /** Idem, para o select de centro de custo. */
  centerOptions: Record<string, Option>;
}

/**
 * Normaliza `financial.fiscal_document` (boolean nativo do Postgres OU
 * string '0'/'1', ver nota de tipo em `@/@types/v2/Advances`) para o formato
 * `'0'|'1'` esperado pelo form/wire.
 * @param {boolean | string | null | undefined} value - Valor bruto devolvido pela Resource.
 * @return {string} `'1'` (Sim) ou `'0'` (Não) — default `'1'` se ausente.
 */
function normalizeFiscalDocument(value: boolean | string | null | undefined): '0' | '1' {
  if (value === false || value === '0') return '0';
  if (value === true || value === '1') return '1';
  return '1';
}

/**
 * Reconstrói o bloco financeiro do FORM a partir do `Advance` lido da API
 * (`GET /advances/{uuid}`), quando `has_financial=true`. Header +
 * installments + categories vêm 1:1 de `advance.financial.*` (já no
 * write-shape/agregado pelo servidor, GAP-ADV-02) — só `has_input`/
 * `input_date`/`input_value` ficam neutros (nunca persistidos).
 * @param {Advance} advance - Registro completo devolvido pela API (com
 *   `financial.*` populado).
 * @return {HydratedAdvanceFinancial} Forma pronta para `reset()` + caches de
 *   exibição dos selects de header/categoria/centro.
 */
export function hydrateFinancialFromResource(advance: Advance): HydratedAdvanceFinancial {
  const financial = advance.financial;
  const amount = Number(advance.amount) || 0;

  const installments = (financial?.installments ?? []).map((row) => ({
    due_date: row.due_date,
    value: Number(row.value),
  }));

  const categoryOptions: Record<string, Option> = {};
  const centerOptions: Record<string, Option> = {};

  const categories = (financial?.categories ?? []).map((row) => {
    categoryOptions[row.category.uuid] = {
      label: row.category.description,
      value: row.category.uuid,
    };
    if (row.center) {
      centerOptions[row.center.uuid] = { label: row.center.description, value: row.center.uuid };
    }
    const value = Number(row.value) || 0;
    return {
      category_uuid: row.category.uuid,
      center_uuid: row.center?.uuid ?? '',
      value,
      percent: amount ? Math.round((value / amount) * 10000) / 100 : null,
    };
  });

  const typeOption: Option | null = financial?.type
    ? { label: financial.type.description, value: financial.type.uuid }
    : null;
  const providerOption: Option | null = financial?.provider
    ? { label: financial.provider.name, value: financial.provider.uuid }
    : null;
  const proprietaryOption: Option | null = financial?.proprietary
    ? { label: financial.proprietary.name, value: financial.proprietary.uuid }
    : null;

  return {
    financial: {
      type_uuid: financial?.type?.uuid ?? '',
      provider_uuid: financial?.provider?.uuid ?? null,
      proprietary_uuid: financial?.proprietary?.uuid ?? null,
      number: financial?.number ?? null,
      note: financial?.note ?? null,
      fiscal_document: normalizeFiscalDocument(financial?.fiscal_document),
      // Nunca persistidos (write-only, só gerador na criação) — neutros no EDIT.
      has_input: false,
      input_date: null,
      input_value: null,
      installments,
      categories,
    },
    typeOption,
    providerOption,
    proprietaryOption,
    categoryOptions,
    centerOptions,
  };
}
