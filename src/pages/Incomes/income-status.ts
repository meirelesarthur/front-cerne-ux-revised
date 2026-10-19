// src/pages/Incomes/income-status.ts
// -----------------------------------------------------------------------------
// Status derivado no CLIENTE (contrato §5.1) — `IncomeResource` NÃO devolve um
// campo `status` pronto; só é usado como filtro server-side
// (`IncomeIndexRequest`/`IncomeRepository::applyStatusFilter`). Reproduz
// EXATAMENTE a mesma fórmula do filtro (nunca um limiar novo/inventado).
// Reaproveitado por `index.tsx` (badge da listagem) e `IncomeDetalhe.tsx`
// (badge do detalhe) — NUNCA duplicar esta função.
//
// Prioridade "vencido" > "parcial" quando ambos são verdadeiros
// (`balance>0 && balance<amount && due_date<today`) — default proposto no
// contrato, Ponto Aberto §10.1 (baixo risco, reversível).
//
// TASK-FE-036-322 (FID-G3F LM03/FM11/LK12, Decisão do Dono nº 3) — 6 estados
// (mirror `Income::opStatus` do legado, prioridade 1..6): título ADIANTAMENTO
// (`payment_type===4`) tem semântica de saldo DIFERENTE dos demais tipos
// (crédito, pode preservar `balance` mesmo com baixa automática — ver
// `IncomeAutomaticWriteoffSection.tsx`) — NUNCA cai na régua
// vencido/parcial/aberto/baixado dos títulos normais, e nunca é descrito
// como "vencido" mesmo com `due_date` no passado.
// -----------------------------------------------------------------------------

import { todayLocalIso } from '@/utils/localDate';

import type { IncomePaymentType, IncomeStatus } from '@/@types/v2/Incomes';

export function deriveIncomeStatus(row: {
  balance: number;
  amount: number;
  due_date: string;
  payment_type: IncomePaymentType;
}): IncomeStatus {
  // Ramo ADIANTAMENTO — só 2 estados possíveis, por `balance`, nunca por
  // `due_date` (Adiantamento nunca "vence").
  if (row.payment_type === 4) {
    return row.balance === 0 ? 'adiantamento_baixado' : 'adiantamento_aberto';
  }

  const today = todayLocalIso();
  if (row.balance === 0) return 'baixado';
  if (row.due_date < today) return 'vencido';
  if (row.balance < row.amount) return 'parcial';
  return 'aberto';
}

/** Mapeamento de `colorPalette` do `Badge` — default do contrato §5.1, ajustável. */
export const INCOME_STATUS_COLOR_PALETTE: Record<IncomeStatus, string> = {
  baixado: 'green',
  aberto: 'gray',
  parcial: 'orange',
  vencido: 'red',
  adiantamento_aberto: 'blue',
  adiantamento_baixado: 'teal',
};

// TASK-FE-036-333 (ONDA 3 sub-onda 3a — integração de Baixa Manual em Contas
// a Receber, AM09) — mirror EXATO do gate `action_manifest` do contrato
// legado (`"balance>0 && (payment_type!=4 || !writeOffs)"`), simplificado
// para `balance>0 && payment_type!==4` porque a baixa CRUZADA com
// adiantamento não existe na API migrada (TASK-FE-036-330) — um Adiantamento
// não tem hoje nenhum fluxo de baixa que este módulo cubra. MESMA condição
// já usada por `isRowSelectable` (seleção em lote, `index.tsx:172`,
// INC-R15) — REAPROVEITADA aqui (não duplicada) para a ação "Baixar"
// (`IncomeActionsMenu.tsx`), mirror da instrução explícita do Roteiro desta
// Tarefa. Se esta simplificação divergir do que o dono espera, registrar
// como Gap — não foi decidido sozinho além do que o Roteiro já autorizou.
export function isIncomeEligibleForWriteOff(row: {
  balance: number;
  payment_type: IncomePaymentType;
}): boolean {
  return row.balance > 0 && row.payment_type !== 4;
}
