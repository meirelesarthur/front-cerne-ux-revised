// src/constants/financial/movement/movement-type-labels.ts
// -----------------------------------------------------------------------------
// Rótulo do enum COMPLETO `type` de Movimento (F-213 "Conciliação de Contas",
// lote 079, rework FE). Mirror LITERAL de `App\Enums\MovementType::description()`
// (GB.Cerne.Api/app/Enums/MovementType.php): E→Entrada, S→Saída, A→Ambos,
// T→Transação Interna, M→Movimento, F→Financiamento.
//
// Diferente de `movement-type-options.ts` (que expõe SÓ `E`/`S` — o
// subconjunto aceito pelo formulário de Movimento, Decisão #4 do contrato de
// API) — este arquivo cobre o enum INTEIRO, usado só para EXIBIÇÃO da prévia
// em tela do relatório de Conciliação de Contas
// (`GenerateAccountReconciliationReportAction::buildRows()`, API já migrada).
//
// i18n via `languageGB` (pt/en/es) — mirror do padrão canônico
// `(value, languageGB) => label` de `movementTypeOptions.getLabel`. Fallback
// para o código cru (`?? item.type`) se um 7º valor futuro do enum PHP ainda
// não tiver rótulo aqui (mesmo racional do backend, ver contrato §0.4).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';

export type FullMovementTypeCode = 'E' | 'S' | 'A' | 'T' | 'M' | 'F';

function movementTypeLabel(type: string, languageGB: LanguageDate): string {
  const { movementTypes } = languageGB.financial.ofxImport.consolidatedReport;
  const labels: Record<FullMovementTypeCode, string> = {
    E: movementTypes.income,
    S: movementTypes.expense,
    A: movementTypes.both,
    T: movementTypes.internalTransaction,
    M: movementTypes.movement,
    F: movementTypes.financing,
  };
  return labels[type as FullMovementTypeCode] ?? type;
}

export { movementTypeLabel };
