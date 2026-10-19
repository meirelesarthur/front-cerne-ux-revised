// src/@types/v2/Fiscal/cashBook/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo CashBook (LCDPR — Livro Caixa Digital do Produtor Rural),
// domínio Fiscal, execução 045, TASK-LCDPR-FE-01. Fonte de verdade dos
// shapes: leitura DIRETA dos Resources reais do backend já implementado
// (`GB.Cerne.Api/app/Http/Resources/V1/CashBook*Resource.php`) — não
// inferido do contrato, conferido contra o código-fonte real.
//
// `CashBookListResource` expõe `proprietary_label`/`contador_label` FLAT
// (não `proprietary.label` aninhado, como o `CONTRATO-FRONT-LCDPR.md §1`
// presumia) — divergência registrada aqui por leitura direta do Resource
// real, mirror da Lei do Registro de Lacuna já aplicada a `dfes`/`nfes` em
// `query-key.ts`.
//
// `CashBookResource`/`CashBookDetailResource` expõem `period`/`special`/
// `verification` como OBJETO `{value, label}` — o backend já resolve o
// `label()` do Enum PHP (texto legal fixo, sem i18n mesmo no backend). O
// Detalhe (TASK-LCDPR-FE-04) deve exibir esse `label` DIRETO da API, nunca
// recalcular via options factory local (garante paridade byte-a-byte com o
// texto legal, sem depender de 2 fontes divergirem).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// Union types dos valores numéricos dos 3 enums (`CashBookPeriodEnum`,
// `CashBookSpecialSituationEnum`, `CashBookVerificationEnum` — fonte real em
// `GB.Cerne.Api/app/Enums/CashBook*.php`).
export type CashBookPeriod = 0 | 1 | 2;
export type CashBookSpecial = 0 | 1 | 2 | 3;
export type CashBookVerification = 1 | 2;

export interface CashBookEnumField<TValue extends number> {
  value: TValue;
  label: string;
}

// GET /cash-books — CashBookListResource (LM-I-01..04).
export interface CashBookListItem {
  uuid: string;
  year: number;
  proprietary_label: string;
  contador_label: string;
  created_at: string;
}

// Resumo mensal Q200 parseado do TXT (`CashBookDetailResource::monthly_summary`)
// — `month` já vem formatado `MM/YYYY` pelo backend (`GetCashBookAction`).
export interface CashBookMonthlySummaryRow {
  month: string;
  entrance: number;
  exit: number;
  balance: number;
}

export interface CashBookMonthlySummaryTotals {
  entrance: number;
  exit: number;
  balance: number;
}

// POST /cash-books (201) — CashBookResource. Também usado como base do
// bloco de metadados do Detalhe.
export interface CashBookData {
  uuid: string;
  year: number;
  proprietary: { uuid: string; label: string };
  contador: { uuid: string; label: string };
  period: CashBookEnumField<CashBookPeriod>;
  special: CashBookEnumField<CashBookSpecial>;
  dt_special: string | null;
  verification: CashBookEnumField<CashBookVerification>;
  filename: string;
  created_at: string;
}

// GET /cash-books/{uuid} — CashBookDetailResource (FM-14..28).
// `monthly_summary`/`monthly_summary_totals` são `null` quando o TXT não
// existe mais no storage — a tela OMITE a seção sem erro (`EV-SHOW-CONTROLLER`).
export interface CashBookDetailData extends CashBookData {
  monthly_summary: CashBookMonthlySummaryRow[] | null;
  monthly_summary_totals: CashBookMonthlySummaryTotals | null;
}

// Forma INTERNA do formulário de criação (`CreateCashBook.tsx`, RHF) — os 3
// Selects de enum e os 2 lookups guardam `Option` inteiro; desempacotado
// para valor primitivo só no submit (`tryPersistCashBook`).
// Option do select de Proprietário carrega `cpf_valid` (UT-000785) para o
// guard do schema (defesa extra além do `disabled` da option).
export interface CashBookProprietaryOption extends Option<string> {
  document_type?: 'cpf' | 'cnpj' | null;
  cpf_valid?: boolean;
}

export interface CashBookForm {
  start_date: string | null;
  end_date: string | null;
  proprietary_id: CashBookProprietaryOption | null;
  period: Option<CashBookPeriod> | null;
  special: Option<CashBookSpecial> | null;
  dt_special: string | null;
  verification: Option<CashBookVerification> | null;
  contador_id: Option<string> | null;
}

// POST /cash-books — payload achatado (CashBookRequest, FM-01..08). Nenhum
// campo a mais (`farm_id`/`year`/`tenant_id` NUNCA enviados — derivados no
// backend).
export interface CreateCashBookRequest {
  start_date: string;
  end_date: string;
  proprietary_id: string;
  period: CashBookPeriod;
  special: CashBookSpecial;
  dt_special: string | null;
  verification: CashBookVerification;
  contador_id: string;
}

// Filtro do index (aditivo — legado não tinha filtro nenhum aqui).
export interface CashBookFilterForm {
  year?: number;
  proprietary_id?: string;
}
