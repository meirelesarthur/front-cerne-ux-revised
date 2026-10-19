// src/@types/v2/TaxAccountsReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Contas Tributárias" (F-327, esteira 060,
// `CORE_WORKSPACE/97-Esteiras/060/ROTEIROS/ROTEIRO-F327-FRONT.md` §3.D).
// Mirror ESTRUTURAL de `@/@types/v2/WeighingStockClientReport` (mesma casca
// de tela download-only, SEM grid/prévia) — mas com domínio PRÓPRIO deste
// módulo, chaves EXATAS de `TaxAccountsReportRequest::rules()`.
//
// LANDMINE (não remover): `cost_center`/`provider` NÃO levam sufixo `_uuid`
// no nome do parâmetro — o VALOR enviado é o uuid do registro, resolvido
// pelo backend (`Rule::exists(...,'uuid')`). `is_taxation` é boolean —
// `false` ("Não") é um valor válido e DEVE ser enviado (nunca descartado
// como falsy); "Todas" omite a chave (`undefined`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export type TaxAccountsReportFormat = 'pdf' | 'xlsx'; // chave EXATA do FormRequest da API

export interface TaxAccountsReportFilterForm {
  start_date: string | null; // obrigatório — DateInput entrega ISO 'YYYY-MM-DD'
  end_date: string | null; // obrigatório (after_or_equal start_date, validado server-side)
  is_taxation: Option<boolean> | null; // opcional — "Todas" = null (omite o param)
  cost_center: Option<string> | null; // opcional — value = uuid
  provider: Option<string> | null; // opcional — value = uuid
  format: Option<TaxAccountsReportFormat> | null; // obrigatório
}

export interface TaxAccountsReportParams {
  start_date: string; // ISO 'YYYY-MM-DD' — repassado direto do DateInput
  end_date: string;
  is_taxation?: boolean; // omitido quando "Todas"; enviado true E false
  cost_center?: string; // uuid — chave EXATA do FormRequest (NUNCA cost_center_uuid); omitido quando vazio
  provider?: string; // uuid — chave EXATA do FormRequest (NUNCA provider_uuid); omitido quando vazio
  format: TaxAccountsReportFormat;
}
