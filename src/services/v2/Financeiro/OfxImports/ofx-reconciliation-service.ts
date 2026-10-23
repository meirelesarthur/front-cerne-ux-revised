// src/services/v2/Financeiro/OfxImports/ofx-reconciliation-service.ts
// -----------------------------------------------------------------------------
// OfxImport Reconciliation Service — API v1 do backend Laravel GB.Cerne
// ("Conciliação Bancária" da Importação OFX, F-114, 97-Esteiras/064,
// TASK-064-OFX-FE-02). Arquivo DEDICADO, separado de
// `ofx-import-service.ts` (CRUD base, TASK-064-OFX-FE-01) — a semântica
// HTTP dos 2 verbos diverge (Decisão 2 da arquitetura de API):
//
//   GET  /ofx-imports/{uuid}/reconciliation → PREVIEW puro (SEM efeito
//        colateral no banco) — reparseia o OFX, casa cada transação com um
//        `Movement` do mesmo `account_id`/período por (value,date,type)
//        exato, devolve o estado ATUAL de `is_reconciled` sem gravar nada.
//   POST /ofx-imports/{uuid}/reconciliation → APPLY (ÚNICO ponto que grava
//        `is_reconciled=true` em massa para os matches encontrados) — SEM
//        corpo de requisição (`OfxReconciliationRequest::rules()` vazio;
//        toda a entrada vem do `{uuid}` da rota e do anexo já persistido,
//        nunca de um payload do front — por isso não existe seleção
//        per-item aqui, é tudo-ou-nada sobre o que bater exatamente).
//
// Ambos os verbos devolvem a MESMA forma (`OfxReconciliationResult`,
// `OfxReconciliationResource`) e exigem `import_ofx_edit` (Decisão 1 da
// arquitetura de API, unificação do slug incorreto do link legado).
//
// Rota dentro de `farm.context` ESTRITO — `X-Farm-Id` é anexado
// automaticamente pelo interceptor genérico de `@/services/api.ts`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  OfxReconciliationConfirmPick,
  OfxReconciliationConfirmResult,
  OfxReconciliationResult,
} from '@/@types/v2/Financeiro/ofxImport/reconciliation';

// GET — preview puro, nunca dispara mutação. Chamador NUNCA faz polling
// (DoD da Tarefa) — só refetch explícito após uma ação do usuário (criar
// movimento, vincular título, desconciliar, aplicar).
async function getOfxReconciliationPreview(
  ofxImportUuid: string
): Promise<Response<OfxReconciliationResult>> {
  const { data } = await api.V2.get<Response<OfxReconciliationResult>>(
    `/ofx-imports/${ofxImportUuid}/reconciliation`
  );
  return data;
}

// POST — SEM corpo (o servidor não aceita/precisa de payload, ver cabeçalho
// do arquivo). Aplica em massa todos os matches (value+date+type) que a
// PreviewOfxReconciliationAction encontrar no momento do apply.
async function applyOfxReconciliation(
  ofxImportUuid: string
): Promise<Response<OfxReconciliationResult>> {
  const { data } = await api.V2.post<Response<OfxReconciliationResult>>(
    `/ofx-imports/${ofxImportUuid}/reconciliation`
  );
  return data;
}

// FASE 3 — confirma por linha/lote o candidato escolhido (`POST …/reconciliation/confirm`).
// Não existe no backend atual: a tela só o chama quando o preview traz `candidates`.
async function confirmOfxReconciliation(
  ofxImportUuid: string,
  picks: OfxReconciliationConfirmPick[]
): Promise<Response<OfxReconciliationConfirmResult>> {
  const { data } = await api.V2.post<Response<OfxReconciliationConfirmResult>>(
    `/ofx-imports/${ofxImportUuid}/reconciliation/confirm`,
    { items: picks }
  );
  return data;
}

export { applyOfxReconciliation, confirmOfxReconciliation, getOfxReconciliationPreview };
