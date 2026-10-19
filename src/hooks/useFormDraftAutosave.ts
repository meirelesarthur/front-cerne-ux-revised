// src/hooks/useFormDraftAutosave.ts
// -----------------------------------------------------------------------------
// Hook GENÉRICO de autosave + recuperação de rascunho em `localStorage`
// (INV-GENERICO-01 — não amarrado a Processamentos). Mirror adaptado de
// `_forms.blade.php:120-494` (legado): debounce de inatividade (default 2s)
// + gravação imediata no `beforeunload`.
//
// Independente do `useUnsavedChangesGuard` já existente — este hook
// PERSISTE em background; aquele AVISA na saída sem salvar. Nenhum dos dois
// precisa saber do outro.
//
// Falha ao gravar/ler `localStorage` (quota excedida, modo privado) é
// silenciosa (`try/catch`) — autosave é conveniência, nunca requisito de
// submissão (mirror do próprio legado, que só loga no console).
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';

import type { UseFormGetValues, UseFormReset, UseFormWatch } from 'react-hook-form';

export interface UseFormDraftAutosaveProps<T extends Record<string, any>> {
  /** Único por tela+entidade (ex.: `processing-draft:${uuid}`) — o `uuid` já é tenant-scoped na origem. */
  storageKey: string;
  watch: UseFormWatch<T>;
  getValues: UseFormGetValues<T>;
  reset: UseFormReset<T>;
  /** `false` enquanto a tela não está pronta (uuid inválido, guard de status não resolvido) — nenhum autosave roda. */
  enabled: boolean;
  /**
   * `true` quando há edição REAL do usuário (`!isEmpty(formState.dirtyFields)`
   * do formulário). Hidratação PROGRAMÁTICA (`prepare`/`restoreDraft`, via
   * `reset()`/`fieldArray.replace()`) dispara o `watch()` abaixo mas NUNCA
   * marca `dirtyFields` — sem este guard, o autosave regrava um rascunho
   * "fantasma" alguns segundos depois de QUALQUER hidratação programática,
   * inclusive logo após `discardDraft()` (TASK-FE-039-PROCFID-01 §3.7: o
   * "Descartar" nunca ficava definitivo, um rascunho novo era recriado
   * sozinho a partir do `prepare`). Default `true` preserva 100% o
   * comportamento anterior para quem ainda não passa a prop.
   */
  isDirty?: boolean;
  /** Debounce de inatividade em ms — default 2000 (mirror do intervalo legado). */
  debounceMs?: number;
}

export interface UseFormDraftAutosaveResult {
  hasDraft: boolean;
  draftTimestamp: string | null;
  /** `reset(draft)` + marca o rascunho como consumido. */
  restoreDraft: () => void;
  /** Remove a chave do `localStorage` — sem lixo residual. */
  discardDraft: () => void;
}

interface StoredDraft<T> {
  values: T;
  timestamp: string;
}

function readDraft<T>(storageKey: string): StoredDraft<T> | null {
  if (!storageKey) return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as StoredDraft<T>;
  } catch {
    return null;
  }
}

export function useFormDraftAutosave<T extends Record<string, any>>({
  storageKey,
  watch,
  getValues,
  reset,
  enabled,
  isDirty = true,
  debounceMs = 2000,
}: UseFormDraftAutosaveProps<T>): UseFormDraftAutosaveResult {
  // Lido UMA vez, na montagem (lazy initializer) — reflete o estado do
  // `localStorage` no momento em que a tela abriu para este `storageKey`.
  const [draft, setDraft] = useState<StoredDraft<T> | null>(() => readDraft<T>(storageKey));
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // `isDirty` como REF (não dependência de `saveNow`/do efeito de `watch()`
  // abaixo) — de propósito. O evento de mudança que agenda o debounce e a
  // atualização de `dirtyFields` que muda `isDirty` chegam no MESMO tick,
  // mas em ORDEM não garantida (o `watch()` já notifica com o `isDirty`
  // "antigo" antes do componente re-renderizar); se `saveNow` dependesse de
  // `isDirty` na dependência do `useCallback`, o reagendamento do efeito
  // cancelaria o debounce recém-armado sem reagendar outro (nenhum novo
  // evento de `watch()` dispara depois). Lendo via ref SEMPRE o valor mais
  // recente no momento em que o timer realmente dispara evita essa corrida.
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const saveNow = useCallback(() => {
    // `isDirtyRef.current===false` ⇒ a mudança que disparou o `watch()` foi
    // hidratação PROGRAMÁTICA (`prepare`/`restoreDraft`), não edição do
    // usuário — nunca persiste rascunho nesse caso (ver doc da prop acima).
    if (!enabled || !storageKey || !isDirtyRef.current) return;
    try {
      const payload: StoredDraft<T> = {
        values: getValues(),
        timestamp: new Date().toISOString(),
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // localStorage indisponível/quota excedida — conveniência, não requisito.
    }
  }, [enabled, storageKey, getValues]);

  // Debounce de inatividade — mirror do intervalo legado (2s).
  useEffect(() => {
    if (!enabled || !storageKey) return undefined;

    const subscription = watch(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(saveNow, debounceMs);
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, storageKey, watch, saveNow, debounceMs]);

  // Gravação imediata ao sair (mirror `_forms.blade.php:492-494`).
  useEffect(() => {
    if (!enabled || !storageKey) return undefined;
    window.addEventListener('beforeunload', saveNow);
    return () => window.removeEventListener('beforeunload', saveNow);
  }, [enabled, storageKey, saveNow]);

  function restoreDraft() {
    if (!draft) return;
    reset(draft.values);
    setDraft(null);
  }

  function discardDraft() {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // remoção é best-effort.
    }
    setDraft(null);
  }

  return {
    hasDraft: !!draft,
    draftTimestamp: draft?.timestamp ?? null,
    restoreDraft,
    discardDraft,
  };
}
