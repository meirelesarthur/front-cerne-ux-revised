// src/pages/Administrativo/Recebimentos/financialPayload.ts
// -----------------------------------------------------------------------------
// Monta o payload do POST de Gerar Financeiro com as chaves do contrato da API
// (EXEC-API-05 §4; execução 081, T-081-FE-10): `number`, `type_uuid`,
// `proprietary_uuid`, `provider_uuid`, `fiscal_document`, `note`,
// `date_installments[]`, `value_installments[]`, `categories[]` e `vl_total` —
// este SÓ no tipo D (nos demais a API usa o valor sugerido e ignora o enviado).
// Campos que a SPA antiga mandava (`has_input`, `input_*`, `qtd_installments`,
// `first_installment`, `int_installments`, `percent`) NÃO fazem parte do contrato:
// a entrada já virou a 1ª parcela no cliente.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';
import type {
  GenerateFinancialRequest,
  RequestReceiptFinancialContext,
  RequestReceiptRatioPayload,
} from '@/@types/v2/RequestReceipts';

export interface FinancialPayloadSource {
  financial_number: string;
  financial_type_id: Option<string> | null;
  financial_proprietary_id: Option<string> | null;
  financial_provider_id: Option<string> | null;
  financial_note: string;
  fiscal_document: Option<boolean> | null;
  vl_total: number | null;
  installments: Array<{ due_date: string | null; value: number | null }>;
  ratio: Array<{
    category_uuid: Option<string> | null;
    center_uuid: Option<string> | null;
    plan_account_uuid: Option<string> | null;
    value: number | null;
  }>;
}

export function buildFinancialPayload(
  form: FinancialPayloadSource,
  options: { vlTotalEditable: boolean }
): GenerateFinancialRequest {
  const categories: RequestReceiptRatioPayload[] = form.ratio.map((row) => ({
    category_uuid: row.category_uuid?.value as string,
    center_uuid: row.center_uuid?.value as string,
    plan_account_uuid: row.plan_account_uuid?.value ?? null,
    value: Number(row.value ?? 0),
  }));

  const payload: GenerateFinancialRequest = {
    number: form.financial_number.trim(),
    type_uuid: form.financial_type_id?.value as string,
    proprietary_uuid: form.financial_proprietary_id?.value ?? null,
    provider_uuid: form.financial_provider_id?.value as string,
    fiscal_document: !!form.fiscal_document?.value,
    note: form.financial_note.trim(),
    date_installments: form.installments.map((row) => row.due_date as string),
    value_installments: form.installments.map((row) => Number(row.value ?? 0)),
    categories,
  };

  if (options.vlTotalEditable && form.vl_total !== null) {
    payload.vl_total = Number(form.vl_total);
  }

  return payload;
}

// Fazenda do rateio: vem do contexto do financeiro (T-081-API-11). Sem `farm`
// (null/ausente) devolve `undefined` — o rateio fica sem filtro e a API valida.
export function resolveFinancialFarmUuid(
  context: Pick<RequestReceiptFinancialContext, 'farm'> | null | undefined
): string | undefined {
  return context?.farm?.uuid || undefined;
}
