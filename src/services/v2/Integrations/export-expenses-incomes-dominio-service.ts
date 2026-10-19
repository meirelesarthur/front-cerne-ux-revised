// src/services/v2/Integrations/export-expenses-incomes-dominio-service.ts
// Service da tela STANDALONE "Exportação Domínio — Contas a Pagar/Receber"
// (F-118, Integrações, irmã do canário F-119). Download binário síncrono
// (V3 — `responseType: 'blob'`), mirror de `export-nfse-dominio-service.ts`/
// `export-movements-dominio-service.ts`. Service DEDICADO — NÃO reusa
// `src/services/v2/ImportExport`.
//
// `X-Farm-Id` (uuid) é injetado automaticamente pelo interceptor de request
// do `api.V2` (`src/services/api.ts`) — o payload NUNCA carrega `farm_id`
// (contrato de tela §2.1/§3). O campo "Fazenda" do form (`farm_uuid`) é um
// filtro OPCIONAL de narrowing DENTRO do tenant ativo, não o contexto.
//
// RISCO 1 (Option {value,label} vs valor cru — issue conhecida do projeto,
// `reference_select_option_vs_valor_cru_falha_submit_silenciosa`): o form
// guarda `Option`/`Option[]` nos 6 selects; a extração `.value`
// (single)/`.map(o => o.value)` (multiselect) acontece AQUI, nunca no
// componente. Chaves `undefined`/vazias são omitidas do payload — o
// `api.V2.get` (via `api-instances.ts`) descarta params `undefined`.

import api from '@/services/api';

import type {
  ExportExpensesIncomesDominioExportRequest,
  ExportExpensesIncomesDominioForm,
} from '@/@types/v2/Integrations/exportExpensesIncomesDominio';

const BASE = '/integrations/exports/expenses-incomes-dominio';

/**
 * Dispara o export e devolve o `Blob` binário (xlsx) para `downloadBlob`.
 * Erros (422/401/403/5xx) chegam como `Blob` de JSON — usar `parseBlobError`
 * no `catch` do call site (contrato de tela §Leitura do dev, risco 2).
 * @param {ExportExpensesIncomesDominioForm} form - estado do RHF (Options nos selects).
 * @return {Promise<Blob>} Blob binário do xlsx gerado (nome real vem do `Content-Disposition`).
 */
export async function exportExpensesIncomesDominio(
  form: ExportExpensesIncomesDominioForm
): Promise<Blob> {
  const params: ExportExpensesIncomesDominioExportRequest = {
    farm_uuid: form.farm?.value || undefined,
    start_date: form.start_date || undefined,
    end_date: form.end_date || undefined,
    start_due_date: form.start_due_date || undefined,
    end_due_date: form.end_due_date || undefined,
    proprietary_uuid: form.proprietary_id?.value || undefined,
    status: form.status?.value ?? undefined,
    center_uuid: form.center_id?.value || undefined,
    // `type` é o único campo sempre presente (obrigatório pelo schema —
    // `form.type!` é seguro aqui, `handleSubmit` só chama este service após
    // a validação passar).
    type: form.type!.value,
    category_uuids:
      form.categories && form.categories.length > 0
        ? form.categories.map((option) => option.value)
        : undefined,
  };

  const { data } = await api.V2.get<Blob>(BASE, params, { responseType: 'blob' });
  return data;
}
