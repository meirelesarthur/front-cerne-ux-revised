// src/pages/Operacional/Processamentos/FinishProcessing.discardDraft.test.tsx
// -----------------------------------------------------------------------------
// TASK-FE-039-PROCFID-01 §3.7 — teste de regressão CONTROLADO do bug relatado
// pelo dono: "o Descartar do prompt de rascunho continua preenchendo a tela".
//
// A leitura estática (Arquiteto) não achou um caminho de código determinístico
// — este teste REPRODUZ o fluxo real com as peças de produção não-mockadas
// (`useFormDraftAutosave` e `DeleteConfirmDialog` reais) para decidir entre as
// 2 hipóteses:
//   (a) o `prepare` re-hidrata a tela com valores da ORIGEM após o discard —
//       comportamento correto, só parece "usar o rascunho" se o usuário
//       editou pouco;
//   (b) `Dialog.ActionTrigger` do botão "Descartar" fecha o diálogo por 2
//       caminhos (`onClick` direto + `onOpenChange` do `Dialog.Root`),
//       potencialmente disparando `handleDiscardDraft` 2x.
//
// O harness abaixo NÃO é um mock da tela — é a MESMA sequência de estados de
// `FinishProcessing.tsx` (draftResolved → shouldFetch(Prepare) → hidratação
// guardada por `isEmpty(dirtyFields)`), isolada do resto da tela (services,
// router, i18n) porque o que está em investigação é só essa interação.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

import { useFormDraftAutosave } from '@/hooks/useFormDraftAutosave';

import { isEmpty } from '@/utils/isEmpty';

const STORAGE_KEY = 'processing-draft:test-uuid';
const PREPARE_WEIGHT = 100;
const DIVERGENT_WEIGHT = 999;
const DEBOUNCE_MS = 100;

interface HarnessForm {
  weight: number | null;
}

// Contador de chamadas EXPOSTO fora do componente — sobrevive ao unmount/
// remount (mount 2 é uma instância NOVA do componente, mas o teste precisa
// contar as invocações de handleDiscardDraft do mount 2 especificamente).
let discardCallCount = 0;

/**
 * Stub de `localStorage` in-memory — o jsdom desta suíte (origem `about:blank`)
 * não expõe uma implementação funcional de `Storage` (`window.localStorage`
 * chega como `{}` sem `getItem`/`setItem`/`clear`), então o hook real
 * (`useFormDraftAutosave`) precisa de um backing store real para o
 * `try/catch` interno não engolir toda gravação/leitura silenciosamente.
 * O HOOK sob teste continua o de produção, não-mockado — só o backend de
 * armazenamento é substituído.
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

Object.defineProperty(window, 'localStorage', {
  value: new MemoryStorage(),
  writable: true,
  configurable: true,
});

/**
 * Mesma sequência de estados de `FinishProcessing.tsx` (draft prompt →
 * `prepare` guardado por `dirtyFields`), com `useFormDraftAutosave` e
 * `DeleteConfirmDialog` REAIS — não são o alvo da investigação, o resto da
 * tela (services/router/i18n) é.
 * @return {JSX.Element} Harness controlado para o teste de regressão.
 */
function DraftHarness() {
  const {
    register,
    watch,
    getValues,
    reset,
    formState: { dirtyFields },
  } = useForm<HarnessForm>({ defaultValues: { weight: null } });

  const [draftResolved, setDraftResolved] = useState(false);
  const [draftPromptOpen, setDraftPromptOpen] = useState(false);
  const draftAcceptedRef = useRef(false);
  const draftPromptShownRef = useRef(false);

  const { hasDraft, restoreDraft, discardDraft } = useFormDraftAutosave<HarnessForm>({
    storageKey: STORAGE_KEY,
    watch,
    getValues,
    reset,
    enabled: true,
    isDirty: isEmpty(dirtyFields),
    debounceMs: DEBOUNCE_MS,
  });

  useEffect(() => {
    if (draftPromptShownRef.current) return;
    draftPromptShownRef.current = true;
    if (hasDraft) {
      setDraftPromptOpen(true);
    } else {
      setDraftResolved(true);
    }
  }, [hasDraft]);

  function handleAcceptDraft() {
    restoreDraft();
    draftAcceptedRef.current = true;
    setDraftPromptOpen(false);
    setDraftResolved(true);
  }

  function handleDiscardDraft() {
    discardCallCount += 1;
    discardDraft();
    setDraftPromptOpen(false);
    setDraftResolved(true);
  }

  // Mirror de `shouldFetchPrepare`/`fillAnimalsFromPrepare` de
  // `FinishProcessing.tsx` — MESMA guarda `isEmpty(dirtyFields)`.
  const shouldHydrateFromPrepare = draftResolved && !draftAcceptedRef.current;
  useEffect(() => {
    if (!shouldHydrateFromPrepare) return;
    if (isEmpty(dirtyFields)) return;
    reset({ weight: PREPARE_WEIGHT });
  }, [shouldHydrateFromPrepare]);

  return (
    <>
      <input aria-label="weight" type="number" {...register('weight', { valueAsNumber: true })} />
      <DeleteConfirmDialog
        isOpen={draftPromptOpen}
        onClose={handleDiscardDraft}
        onConfirm={handleAcceptDraft}
        tone="info"
        colorPalette="blue"
        title="Rascunho encontrado"
        description="Encontramos um rascunho salvo"
        confirmButtonText="Recuperar"
        cancelButtonText="Descartar"
        hideQuestionMark
        warningText=""
      />
    </>
  );
}

function renderHarness() {
  return render(
    <ChakraProvider value={system}>
      <DraftHarness />
    </ChakraProvider>
  );
}

describe('FinishProcessing — bug do "Descartar" rascunho (TASK-FE-039-PROCFID-01 §3.7)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    discardCallCount = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reproduz o fluxo completo: edita valor divergente, sai, volta, Descarta — valor descartado NÃO reaparece', async () => {
    // ---- Mount 1: tela abre sem rascunho, `prepare` hidrata normalmente ----
    const mount1 = renderHarness();

    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect((screen.getByLabelText('weight') as HTMLInputElement).value).toBe(
      String(PREPARE_WEIGHT)
    );

    // ---- Usuário edita um valor DIVERGENTE do `prepare` ----
    fireEvent.change(screen.getByLabelText('weight'), {
      target: { value: String(DIVERGENT_WEIGHT) },
    });

    // ---- Autosave dispara após o debounce (sai sem finalizar) ----
    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE_MS + 10);
    });

    const savedDraft = window.localStorage.getItem(STORAGE_KEY);
    expect(savedDraft).not.toBeNull();
    expect(JSON.parse(savedDraft!).values.weight).toBe(DIVERGENT_WEIGHT);

    mount1.unmount();

    // ---- Mount 2: reabre a mesma tela — prompt de rascunho aparece ----
    renderHarness();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText('Rascunho encontrado')).not.toBeNull();

    // ---- Clica "Descartar" ----
    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));

    // Assert #1 (§3.7 passo 2): a chave do rascunho é removida do localStorage
    // IMEDIATAMENTE após o clique — antes de qualquer debounce de autosave
    // rodar (fireEvent.click já flusha o `discardDraft()` síncrono + o efeito
    // de hidratação do `prepare`, mas NÃO os timers pendentes).
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();

    // Assert #2 (§3.7 passo 3): o valor DIVERGENTE do passo 1 NÃO reaparece —
    // só o valor do `prepare` (comportamento correto, não um rascunho "vazando").
    expect((screen.getByLabelText('weight') as HTMLInputElement).value).toBe(
      String(PREPARE_WEIGHT)
    );
    expect((screen.getByLabelText('weight') as HTMLInputElement).value).not.toBe(
      String(DIVERGENT_WEIGHT)
    );

    // ---- CAUSA REAL ENCONTRADA (não hipótese a/b do Arquiteto): a própria
    // hidratação do `prepare` chama `fieldArray.replace()`/`reset()`, que
    // DISPARA o `watch()` do autosave (confirmado por teste dedicado de
    // `react-hook-form`) mas NÃO marca `dirtyFields`. Sem guarda de
    // dirtiness, alguns segundos depois do "Descartar" o autosave regravava
    // sozinho um rascunho "fantasma" em localStorage — o discard nunca era
    // definitivo. Avançar o debounce e confirmar que, com o fix, NENHUM
    // rascunho novo é criado sem edição real do usuário.
    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE_MS + 10);
    });

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('documenta o comportamento real do `Dialog.ActionTrigger` do botão "Descartar" (hipótese b)', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ values: { weight: DIVERGENT_WEIGHT }, timestamp: new Date(0).toISOString() })
    );

    renderHarness();

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // `Dialog.ActionTrigger asChild` fecha o diálogo por 2 caminhos (`onClick`
    // direto do botão + `onOpenChange` do `Dialog.Root` ao fechar) — os
    // handlers (`discardDraft`/`setDraftResolved`) são idempotentes
    // (removeItem/setState repetidos são inócuos), então a chamada dupla,
    // SE ocorrer, não causa o sintoma relatado. Documentado aqui para não
    // reabrir a investigação sem evidência nova.
    expect(discardCallCount).toBeGreaterThanOrEqual(1);
    expect(discardCallCount).toBeLessThanOrEqual(2);
  });
});
