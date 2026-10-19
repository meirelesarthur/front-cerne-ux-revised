// src/utils/cpfCnpj.ts
// -----------------------------------------------------------------------------
// RE-EXPORT FINO — a consolidação de máscara CPF/CNPJ (97-Esteiras/001, Wave
// 1) moveu o checksum e a formatação progressiva para o módulo canônico
// `src/utils/masks/document.ts` (ver `02-Mapa-Consolidacao.md` §2). O
// checksum antigo deste arquivo era matematicamente redundante ao de
// `validateCpfCnpj.ts` (já canonizado) — descartado aqui.
//
// `onlyDigits`/`docTypeOfDigits`/`isValidCpf`/`isValidCnpj`/`isValidCpfCnpj`/
// `DocType` são re-exportados sem mudança de assinatura — nenhum callsite
// (schemas, `useProviderFormController.ts`, telas de grid/index, etc.) muda
// linha.
//
// `maskDocType`/`cpfCnpjBeforeMaskedStateChange` são MANTIDOS aqui (adaptador
// fino) porque não têm equivalente no módulo novo: são específicos do hook
// `beforeMaskedStateChange` do `react-input-mask`, lib que `MaskedInput` não
// usa (contrato §5) — ainda necessários pelos callsites de `InputMask`/mask
// dinâmica que permanecem fora do escopo desta Wave (`Fazendas/
// CreateOrUpdateFarm.tsx`, `StepIdentificacao.tsx`,
// `Inventario/EquipamentoFiscalVeiculoTab.tsx`, e pelo `nif.ts` para o
// wizard de Pessoas). `maskDocType` delega a `maskDocTypeOfDigits`
// (mesmo algoritmo, nome de domínio preservado); a formatação parcial de
// CNPJ usada pelo resgate do 12º dígito agora reaproveita `formatCnpj` do
// módulo novo (idêntica à antiga `formatCnpjPartial` privada, removida por
// duplicação).
// -----------------------------------------------------------------------------

import { formatCnpj, maskDocTypeOfDigits, onlyDigits } from './masks/document';

import type { BeforeMaskedStateChangeStates, InputState } from 'react-input-mask';

export {
  normalizeDocument,
  onlyDigits,
  docTypeOfDigits,
  isValidCpf,
  isValidCnpj,
  isValidCpfCnpj,
} from './masks/document';
export type { DocType } from './masks/document';

// Heurística de SELEÇÃO DE MÁSCARA em tempo de digitação (`>11` dígitos →
// CNPJ) — mesmo critério de `maskDocTypeOfDigits`, nome de domínio mantido
// para os callsites de `react-input-mask` que ainda dependem dele.
export function maskDocType(value: string): 'cpf' | 'cnpj' {
  return maskDocTypeOfDigits(value);
}

// `beforeMaskedStateChange` do `react-input-mask` — resgata o 12º dígito
// quando a máscara de CPF (ainda ativa neste render) descartaria o
// excedente ao ultrapassar 11 dígitos crus. Ver histórico completo do
// racional (TASK-FE-333) preservado nos callsites que ainda o consomem.
export function cpfCnpjBeforeMaskedStateChange({
  currentState,
  nextState,
}: BeforeMaskedStateChangeStates): InputState {
  if (!currentState) return nextState;

  const rawDigits = onlyDigits(currentState.value);
  const nextDigits = onlyDigits(nextState.value);

  if (rawDigits.length > 11 && nextDigits.length <= 11 && rawDigits.length > nextDigits.length) {
    const formatted = formatCnpj(rawDigits);
    return { value: formatted, selection: { start: formatted.length, end: formatted.length } };
  }

  return nextState;
}
