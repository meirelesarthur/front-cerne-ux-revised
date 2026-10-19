// src/hooks/useBudgetActions.ts
// -----------------------------------------------------------------------------
// Hook COMPARTILHADO das 4 ações sem rota própria de Orçamento (Budget —
// Operacional / Vendas, F-018, 97-Esteiras/054, TASK-BG-FE-05): PDF
// (report), WhatsApp, E-mail, Copiar link público. Extraído de
// `Operacional/Budget/index.tsx` (TASK-BG-FE-02, onde os 4 handlers foram
// implementados pela primeira vez, já ligados aos endpoints REAIS) para que
// a grid (`index.tsx`) e `BudgetDetalhe.tsx` (TASK-BG-FE-05) consumam os
// MESMOS handlers — DoD da Tarefa: "Nenhum handler de ação duplicado entre
// `index.tsx` e `BudgetDetalhe.tsx`".
//
// GAP-BG-FE-07 (já resolvido em `index.tsx`, preservado aqui): o backend
// REAL expõe `GET /budgets/{uuid}/whatsapp` com o link `wa.me` PRONTO
// (`BuildBudgetWhatsappLinkAction`) — não existe util client-side
// (`budgetWhatsApp.ts`) montando mensagem/telefone; o contrato de tela
// previa esse util ANTES da leitura direta do backend confirmar o shape
// real (ver docblock de `index.tsx`). Nenhum util novo é criado aqui.
//
// Mirror EXATO `handleGenerateDocument`/`handleOpenBlobInNewTab` de
// `RequisitionList/index.tsx:208-226` para o PDF; `useRequest` (mirror
// `deleteRequisition`) para o E-mail (POST sem payload).
//
// "Copiar link público" busca o `hash` via `getBudget(uuid)` quando o
// chamador não o tiver à mão (grid, `BudgetListResource` não expõe `hash`,
// GAP-BG-FE-07 2ª parte) — `BudgetDetalhe.tsx` já tem o `BudgetData`
// carregado (com `hash`) e passa `knownHash` para evitar uma chamada de
// rede redundante.
//
// WhatsApp/E-mail promovem `status` 1→2 no servidor (SE-05). O E-mail já é
// uma mutation via `useRequest`, que invalida `queryKey.budgets.budgets`/
// `queryKey.budgets.budget` sozinha (TanStack Query). O WhatsApp é uma
// leitura pura (GET, sem mutation) — o chamador recebe `onWhatsappOpened`
// para decidir COMO refletir o novo status (grid: `refetch()` da listagem;
// detalhe: `refetch()` do próprio registro).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { toaster } from '@/components/ui/toaster';

import { useRequest } from '@/hooks/useRequest';

import { copyToClipboard } from '@/utils/copyToClipboard';

import { queryKey } from '@/constants/query-key';

import {
  getBudget,
  getBudgetReport,
  getBudgetWhatsappLink,
  sendBudgetEmail,
} from '@/services/v2/Budgets/budget-service';

import type { LanguageDate } from '@/@types/language';

export interface UseBudgetActionsOptions {
  languageGB: LanguageDate;
  /** Chamado após o link do WhatsApp abrir com sucesso — `status` pode ter
   *  sido promovido (1→2) no servidor (SE-05); o chamador decide como
   *  refletir o valor real (refetch de grid OU de detalhe). Opcional —
   *  omitido quando o chamador não tiver nada a re-consultar. */
  onWhatsappOpened?: () => void;
}

export function useBudgetActions({ languageGB, onWhatsappOpened }: UseBudgetActionsOptions) {
  const text = languageGB.budgets.budget;

  const [downloadingReportUuid, setDownloadingReportUuid] = useState<string | null>(null);
  const [openingWhatsappUuid, setOpeningWhatsappUuid] = useState<string | null>(null);
  const [copyingLinkUuid, setCopyingLinkUuid] = useState<string | null>(null);

  // ---- E-mail (POST sem payload — promove status 1→2 no servidor) --------
  const emailMutation = useRequest({
    asyncFunction: async ({ budgetUuid }: { budgetUuid: string }) => {
      await sendBudgetEmail(budgetUuid);
      return undefined;
    },
    queryKey: queryKey.budgets.budgets,
    queryKey2: queryKey.budgets.budget,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.emailToast,
    actionSuccess: () => {},
  });

  async function handleOpenBlobInNewTab(blob: Blob) {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  async function handleGenerateReport(budgetUuid: string) {
    setDownloadingReportUuid(budgetUuid);
    try {
      const blob = await getBudgetReport(budgetUuid);
      await handleOpenBlobInNewTab(blob);
    } catch {
      toaster.error({ title: text.singularLabel, description: text.list.reportErrorToast });
    } finally {
      setDownloadingReportUuid(null);
    }
  }

  async function handleWhatsappClick(budgetUuid: string) {
    setOpeningWhatsappUuid(budgetUuid);
    try {
      const response = await getBudgetWhatsappLink(budgetUuid);
      window.open(response.data.url, '_blank');
      // `status` pode ter sido promovido (1→2) no servidor — o chamador
      // decide o que re-consultar para refletir o valor real.
      onWhatsappOpened?.();
    } catch {
      toaster.error({ title: text.singularLabel, description: text.list.whatsappErrorToast });
    } finally {
      setOpeningWhatsappUuid(null);
    }
  }

  // GAP-BG-FE-07 (2ª parte) — `hash` só vem no `BudgetDetailResource` (`GET
  // /budgets/{uuid}`); `knownHash` evita a chamada extra quando o chamador
  // já tem o detalhe carregado (`BudgetDetalhe.tsx`).
  async function handleCopyPublicLink(budgetUuid: string, knownHash?: string) {
    setCopyingLinkUuid(budgetUuid);
    try {
      const hash = knownHash ?? (await getBudget(budgetUuid)).data.hash;
      const publicUrl = `${window.location.origin}/orcamento-aprovacao/${hash}`;
      // `copyToClipboard` cai no fallback `execCommand` quando `navigator.
      // clipboard` não existe (homologação em HTTP puro — secure context
      // ausente), onde o `writeText` direto lançava e disparava o toast de
      // erro mesmo com o `hash` já em mãos (F-018).
      await copyToClipboard(publicUrl);
      toaster.success({ title: text.singularLabel, description: text.list.copyLinkToast });
    } catch {
      toaster.error({ title: text.singularLabel, description: text.list.copyLinkErrorToast });
    } finally {
      setCopyingLinkUuid(null);
    }
  }

  function sendEmail(budgetUuid: string) {
    emailMutation.mutate({ budgetUuid });
  }

  return {
    downloadingReportUuid,
    openingWhatsappUuid,
    copyingLinkUuid,
    isSendingEmail: emailMutation.isPending,
    sendEmail,
    handleGenerateReport,
    handleWhatsappClick,
    handleCopyPublicLink,
  };
}

export default useBudgetActions;
