// src/pages/Financeiro/MovCaixaBancario/useObligationDraftRedirect.ts
// -----------------------------------------------------------------------------
// UT-000796 r2 — hook fino compartilhado pela tela principal
// (`CreateOrUpdateMovimento`) e pelo modal OFX (`NewMovementModal`): quando o
// movimento salvo devolve `generated_obligation_draft`, navega para a tela de
// Nova Conta a Pagar/Receber pré-preenchida (legado: "Gera Obrigação").
//
// `redirectIfDraft(movement, { replace })` devolve `true` quando NAVEGOU (o
// chamador não deve navegar de novo) e `false` caso contrário (sem rascunho
// OU sem permissão no destino — nesse caso o toast de aviso já foi exibido e
// o chamador segue o fluxo normal de saída).
//   - tela principal: `replace: true` (Cancelar/salvar o título voltam à lista);
//   - modal OFX: `replace: false` (push — Voltar/Cancelar retornam à Conciliação).
// -----------------------------------------------------------------------------

import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import type { MovementGeneratedObligationDraft } from '@/@types/v2/Movements';

import {
  buildObligationNavigation,
  persistObligationDraft,
  resolveObligationDestination,
} from './obligation-draft';

export function useObligationDraftRedirect() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { languageGB } = useLanguage();
  const text = languageGB.movements.movement.form.obligationDraftGenerated;

  const redirectIfDraft = useCallback(
    (
      movement:
        { generated_obligation_draft?: MovementGeneratedObligationDraft | null } | null | undefined,
      options: { replace: boolean }
    ): boolean => {
      const draft = movement?.generated_obligation_draft;
      if (!draft) return false;

      if (!can(resolveObligationDestination(draft).permission)) {
        toaster.create({
          type: 'info',
          title: text.title,
          description: text.noPermission,
          duration: 9000,
        });
        return false;
      }

      persistObligationDraft(draft);
      toaster.create({
        type: 'info',
        title: text.title,
        description: text.navigating,
        duration: 9000,
      });
      const { to, state } = buildObligationNavigation(draft);
      navigate(to, { replace: options.replace, state });
      return true;
    },
    [can, navigate, text]
  );

  return { redirectIfDraft };
}
