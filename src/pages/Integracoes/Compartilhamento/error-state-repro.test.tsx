// Reprodução isolada do bug real (achado do front-tester, fix-070-f122-fe-errorstate):
// em `CompartilhamentoList` (`index.tsx`), `isEmpty` era calculado como
// `!isLoading && (items?.length ?? 0) === 0`, SEM considerar `isError`. Uma
// falha de query (403/500/rede) devolve `data: undefined` → `items:
// undefined` → `(items?.length ?? 0) === 0` → `true`, então QUALQUER erro de
// carga era renderizado como "Nenhum compartilhamento cadastrado." (empty
// state), mascarando o erro real. Isso viola o contrato de tela
// (`F-122-compartilhamento-frontend-contract.md`), que exige os 4 estados
// obrigatórios: loading / empty / error (mensagem + retry) / success.
//
// Este teste isola a FÓRMULA booleana (a mesma exercitada em `index.tsx`
// após o fix — `isEmpty`/`isErrorState` derivados de
// `{ isLoading, isError, items }`) sem montar a árvore de providers inteira
// da tela (Router/Language/Permissions/TableProvider), mirror do padrão já
// usado em `Operacional/Planejamentos/dirty-guard-repro.test.tsx`.
import { describe, expect, it } from 'vitest';

interface GridQuerySnapshot {
  isLoading: boolean;
  isError: boolean;
  items: unknown[] | undefined;
}

// Fórmula BUGADA (estado real do arquivo antes do fix) — mantida aqui só
// para provar o sintoma, nunca reintroduzida em produção.
function buggyIsEmpty({ isLoading, items }: GridQuerySnapshot): boolean {
  return !isLoading && (items?.length ?? 0) === 0;
}

// Fórmulas CORRIGIDAS — mirror exato de `index.tsx` pós-fix.
function fixedIsEmpty({ isLoading, isError, items }: GridQuerySnapshot): boolean {
  return !isLoading && !isError && (items?.length ?? 0) === 0;
}
function fixedIsErrorState({ isLoading, isError }: GridQuerySnapshot): boolean {
  return !isLoading && isError;
}

describe('CompartilhamentoList — isEmpty/isErrorState (reprodução do bug real + fix)', () => {
  it('BUG: fórmula antiga trata 403 (isError, sem items) como lista vazia', () => {
    const snapshot403: GridQuerySnapshot = { isLoading: false, isError: true, items: undefined };

    expect(buggyIsEmpty(snapshot403)).toBe(true); // sintoma relatado: mascara erro como "vazio"
  });

  it('BUG: fórmula antiga trata 500 (isError, sem items) como lista vazia', () => {
    const snapshot500: GridQuerySnapshot = { isLoading: false, isError: true, items: undefined };

    expect(buggyIsEmpty(snapshot500)).toBe(true);
  });

  it('FIX: erro de query (403) nunca é isEmpty — vira isErrorState', () => {
    const snapshot403: GridQuerySnapshot = { isLoading: false, isError: true, items: undefined };

    expect(fixedIsEmpty(snapshot403)).toBe(false);
    expect(fixedIsErrorState(snapshot403)).toBe(true);
  });

  it('FIX: erro de query (500/rede) nunca é isEmpty — vira isErrorState', () => {
    const snapshot500: GridQuerySnapshot = { isLoading: false, isError: true, items: undefined };
    const snapshotNetwork: GridQuerySnapshot = {
      isLoading: false,
      isError: true,
      items: undefined,
    };

    expect(fixedIsEmpty(snapshot500)).toBe(false);
    expect(fixedIsErrorState(snapshot500)).toBe(true);
    expect(fixedIsEmpty(snapshotNetwork)).toBe(false);
    expect(fixedIsErrorState(snapshotNetwork)).toBe(true);
  });

  it('FIX: sucesso com lista vazia continua isEmpty (comportamento preservado)', () => {
    const snapshotEmptySuccess: GridQuerySnapshot = { isLoading: false, isError: false, items: [] };

    expect(fixedIsEmpty(snapshotEmptySuccess)).toBe(true);
    expect(fixedIsErrorState(snapshotEmptySuccess)).toBe(false);
  });

  it('FIX: sucesso com itens não é empty nem error (comportamento preservado)', () => {
    const snapshotWithItems: GridQuerySnapshot = {
      isLoading: false,
      isError: false,
      items: [{ uuid: 'x' }],
    };

    expect(fixedIsEmpty(snapshotWithItems)).toBe(false);
    expect(fixedIsErrorState(snapshotWithItems)).toBe(false);
  });

  it('FIX: loading tem precedência sobre error e empty (comportamento preservado)', () => {
    const snapshotLoadingWithPriorError: GridQuerySnapshot = {
      isLoading: true,
      isError: true,
      items: undefined,
    };

    expect(fixedIsEmpty(snapshotLoadingWithPriorError)).toBe(false);
    expect(fixedIsErrorState(snapshotLoadingWithPriorError)).toBe(false);
  });
});
