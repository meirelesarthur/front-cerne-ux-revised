// src/hooks/useUnsavedChangesGuard.tsx
// -----------------------------------------------------------------------------
// Hook NOVO, simples e autocontido (correção de rejeição da Tarefa 13,
// `07-Tarefas_Frontend/13-estacao-de-monta-formulario-cadastro.md`, DoD
// "Guarda de saída sem salvar"). NÃO é padrão de projeto — escopo restrito ao
// formulário `CreateOrUpdateEstacaoDeMonta.tsx` desta Tarefa.
//
// Limite técnico HONESTO (registrar, não mascarar): o app usa
// `<BrowserRouter>` declarativo (`src/main.tsx`), não um Data Router
// (`createBrowserRouter`/`RouterProvider`). O `useBlocker`/`unstable_usePrompt`
// do react-router-dom 6.22 SÓ funcionam com Data Router — chamá-los aqui
// lançaria um invariant-error em runtime. Migrar `main.tsx` para Data Router
// está fora do escopo desta Tarefa (afetaria toda a árvore de rotas do app).
//
// Por isso, a guarda de navegação INTERNA cobre as saídas que o próprio
// formulário controla (ex.: botão "Cancelar", `navigate(-1)`), expondo
// `guardedNavigate` para o consumidor usar no lugar do `navigate` do
// react-router-dom quando `hasUnsavedChanges` for `true`. Não intercepta
// cliques em links do menu lateral/topo (fora do controle deste componente).
// O fechamento/reload de aba é coberto de forma real e completa via
// `beforeunload` nativo (funciona independente do tipo de router).
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import type { NavigateOptions, To } from 'react-router-dom';

export interface UseUnsavedChangesGuardResult {
  /** `true` quando o dialog de confirmação de saída deve ser exibido. */
  isConfirmOpen: boolean;
  /** Confirma a saída: fecha o dialog e executa a navegação pendente. */
  confirmNavigation: () => void;
  /** Cancela a saída: fecha o dialog e descarta a navegação pendente. */
  cancelNavigation: () => void;
  /**
   * Substitui `navigate()` do react-router-dom nos pontos de saída do
   * próprio formulário. Se `hasUnsavedChanges` for `false`, navega direto;
   * se `true`, abre o dialog e só navega após `confirmNavigation`.
   */
  guardedNavigate: (to: To | number, options?: NavigateOptions) => void;
}

// Guarda de saída sem salvar: bloqueia navegação interna disparada via
// `guardedNavigate` e fechamento/reload de aba (`beforeunload`) enquanto
// `hasUnsavedChanges` for `true` (ex.: `formState.isDirty` do React Hook
// Form).
export function useUnsavedChangesGuard(hasUnsavedChanges: boolean): UseUnsavedChangesGuardResult {
  const navigate = useNavigate();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<{
    to: To | number;
    options?: NavigateOptions;
  } | null>(null);

  // Fechamento/reload de aba com alterações não salvas — nativo, funciona
  // com qualquer tipo de router.
  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      // Necessário para acionar o prompt nativo do browser em todos os
      // engines (Chrome/Firefox/Safari exigem `returnValue` setado).
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  function runNavigate(target: { to: To | number; options?: NavigateOptions }) {
    if (typeof target.to === 'number') {
      navigate(target.to);
    } else {
      navigate(target.to, target.options);
    }
  }

  const guardedNavigate = useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (hasUnsavedChanges) {
        setPendingTarget({ to, options });
        setIsConfirmOpen(true);
        return;
      }
      runNavigate({ to, options });
    },
    [hasUnsavedChanges, navigate]
  );

  const confirmNavigation = useCallback(() => {
    setIsConfirmOpen(false);
    if (pendingTarget) {
      runNavigate(pendingTarget);
      setPendingTarget(null);
    }
  }, [pendingTarget, navigate]);

  const cancelNavigation = useCallback(() => {
    setIsConfirmOpen(false);
    setPendingTarget(null);
  }, []);

  return { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate };
}
