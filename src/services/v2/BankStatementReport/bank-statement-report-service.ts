// src/services/v2/BankStatementReport/bank-statement-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Extrato Financeiro" (`bankEstatement.report`, F-233, execução
// 97-Esteiras/079, TASK-F233-FE-02). Mirror ESTRUTURAL de
// `payment-cashflow-report-service.ts` (F-293) — `toQuery` como WHITELIST
// EXPLÍCITA (nunca `{ ...params }`), 2 downloads binários síncronos sobre a
// MESMA rota, `report_type` distinto por botão.
//
// Endpoint DELIVERED (FLAT, reconciliação obrigatória do plano — NÃO
// `/reports/...`):
//   GET /bank-statement-report (PDF/Excel, responseType:'blob')
//   params: account_uuid (REQUIRED), start_date, end_date, proprietary_uuid?,
//           center_uuid?, categories_uuid[]?, farm_uuid?, condition?(S|C),
//           report_type(pdf|excel)
//
// FRONT-09 — options DEDICADO (1 único fetch, NUNCA os genéricos
// `/accounts/options`/`/cost-centers/options`/`/proprietaries/options`/
// `/farms/options`):
//   GET /bank-statement-report/options?farm_uuid= →
//     { accounts, proprietaries, cost_centers, financial_categories, farms }
//
// AF#2 — `listBankStatementReportOptions` aceita `farm_uuid` OPCIONAL (a
// fazenda que o usuário está montando no FILTRO, não a fazenda ATIVA da
// sessão) porque `cost_centers` do bundle é escopado por ela no servidor;
// ausência/fora do escopo cai no fallback server-side (fazenda ativa).
//
// `toBankStatementReportParams()` é a FRONTEIRA OBRIGATÓRIA valores→payload —
// monta as chaves campo a campo a partir do form (8 campos) + o
// `report_type` literal recebido do handler que chama. PROIBIDO
// `{ ...values }`, spread parcial — a página nunca remonta chaves inline.
//
// `toQuery` omite `proprietary_uuid`/`center_uuid`/`categories_uuid`/
// `farm_uuid`/`condition` vazios (nunca envia `''`/`[]`), mas SEMPRE envia
// `account_uuid` (único campo obrigatório além das datas). Nomes EXATOS de
// param: `account_uuid`, `proprietary_uuid`, `center_uuid`,
// `categories_uuid`, `farm_uuid`, `condition`, `report_type` (NUNCA
// `type`/`account`/`proprietary`/`center`/sufixo `_id` do legado).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  BankStatementReportFormValues,
  BankStatementReportOptions,
  BankStatementReportParams,
  BankStatementReportType,
} from '@/@types/v2/BankStatementReport';

function toBankStatementReportParams(
  values: BankStatementReportFormValues,
  reportType: BankStatementReportType
): BankStatementReportParams {
  return {
    account_uuid: values.account?.value as string,
    start_date: values.start_date as string,
    end_date: values.end_date as string,
    proprietary_uuid: values.proprietary?.value || undefined,
    center_uuid: values.center_id?.value || undefined,
    categories_uuid: values.categories.length > 0 ? values.categories : undefined,
    farm_uuid: values.farm_id?.value || undefined,
    condition: values.condition?.value || undefined,
    report_type: reportType,
  };
}

// Segunda barreira (whitelist explícita, NUNCA `{ ...params }`): garante que
// nenhuma chave indeclarada sobreviva a um refactor, e que
// `proprietary_uuid`/`center_uuid`/`categories_uuid`/`farm_uuid`/`condition`
// vazios não cheguem à querystring como `''`/`[]`. `account_uuid` é SEMPRE
// enviado (obrigatório).
function toQuery(params: BankStatementReportParams) {
  return {
    account_uuid: params.account_uuid,
    start_date: params.start_date,
    end_date: params.end_date,
    proprietary_uuid: params.proprietary_uuid || undefined,
    center_uuid: params.center_uuid || undefined,
    categories_uuid:
      params.categories_uuid && params.categories_uuid.length > 0
        ? params.categories_uuid
        : undefined,
    farm_uuid: params.farm_uuid || undefined,
    condition: params.condition || undefined,
    report_type: params.report_type,
  };
}

async function downloadBankStatementReportPdf(params: BankStatementReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/bank-statement-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

async function downloadBankStatementReportExcel(params: BankStatementReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/bank-statement-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

// FRONT-09 — fetch DEDICADO, UM ÚNICO `useQuery` popula os 5 campos
// (`accountOptions`/`proprietaryOptions`/`costCenterOptions`/`farmOptions`
// via `useMemo` + `categoryItems` do `CheckboxListField` na tela). NUNCA os
// endpoints genéricos. `farmUuid` (AF#2) é o `farm_id` selecionado no
// PRÓPRIO filtro — ausente = fallback server-side (fazenda ativa).
// Desempacota o envelope (`res.data.data`) — a tela consome as 5 listas
// direto.
async function listBankStatementReportOptions(
  farmUuid?: string
): Promise<BankStatementReportOptions> {
  const { data } = await api.V2.get<Response<BankStatementReportOptions>>(
    '/bank-statement-report/options',
    farmUuid ? { farm_uuid: farmUuid } : undefined
  );
  return data.data;
}

export {
  downloadBankStatementReportExcel,
  downloadBankStatementReportPdf,
  listBankStatementReportOptions,
  toBankStatementReportParams,
};
