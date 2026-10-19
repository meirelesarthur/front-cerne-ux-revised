// src/pages/Operacional/VendaAnimais/MovementSaleEmitNfeDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo de confirmação de "Emitir NFe" (HANDOFF) — ação A4 do dropdown
// (Tarefa 17.c — última fatia da Tarefa 17, task-packet §3/§6, matriz
// FID-G3F #3/#3a/#3b, DEC-022 — não reaberta).
//
// `POST .../nfe-issue` NÃO emite NFe nem grava `nfe_id` — devolve só o
// payload de HANDOFF (mirror `session('nfe')` do legado, ver docblock de
// `MovementSaleNfeHandoffPayload` em `@/@types/v2/MovementSales`). A ação
// NÃO remove o item da lista após sucesso (nada muda no servidor). O
// destino real é a navegação para `/fiscal/nfe-emitidas/novo` levando o
// payload em `location.state.movementSaleHandoff` — mudança ADITIVA e
// OPCIONAL em `CreateOrUpdateNfe.tsx` (Tarefa §2.4): sem esse state, o form
// de NFe se comporta EXATAMENTE como hoje (zero regressão, provado pelo
// Tester).
//
// Condição `!nfe_id` (§2.3) SEM mudança de backend — este diálogo consulta
// `useMovementSaleDetail` (mesmo endpoint já cacheado usado pelo modal de
// Documentos) ao ABRIR, e bloqueia com estado INFORMATIVO quando
// `detail.nfe` já existe — reaproveitando `DeleteConfirmDialog tone="info"`
// com `onConfirm=onClose` (mirror da convenção já usada no fork para
// diálogos informativos "bloqueados", ver docblock de
// `DeleteConfirmDialog.hideQuestionMark`: "onConfirm/onClose só fecham o
// diálogo, não disparam a ação"). É o equivalente SPA do `ConfirmDialog
// tone="default"` do design system `cerne` (ícone Info, ação NÃO
// destrutiva) — Referência UX da Tarefa (task-packet §4).
//
// Gate duplo (§2.5, `mov_sale_edit` + `nfe_create`) é responsabilidade
// do CALLER (`VendaAnimaisActionsMenu.tsx`/`index.tsx`): este diálogo só
// abre quando o menu já concedeu as 2 permissões (item desabilitado com
// Tooltip no menu quando falta `nfe_create`, nunca aqui dentro).
//
// `useIssueMovementSaleNfe` é `useMutation` DIRETO (não `useRequest`) —
// nenhuma queryKey invalidada (nada persiste no servidor) e nenhum toast de
// sucesso formal (navegação imediata substitui o feedback). Erro tratado
// localmente via `mutate(uuid, { onError })`, toast manual (mesmo padrão já
// usado por `deleteMutation` em `index.tsx`).
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import type { MovementSaleDetail } from '@/@types/v2/MovementSales';

import { useIssueMovementSaleNfe, useMovementSaleDetail } from './useMovementSales';

export interface MovementSaleEmitNfeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  movementSaleUuid: string | null;
  movementSaleCode?: string;
}

export function MovementSaleEmitNfeDialog({
  isOpen,
  onClose,
  movementSaleUuid,
  movementSaleCode,
}: MovementSaleEmitNfeDialogProps) {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const text = languageGB.movementSales.movementSale;
  const emitNfeText = text.emitNfe;

  // Fonte ÚNICA da condição `!nfe_id` (§2.3) — mesmo hook/endpoint já usado
  // por `MovementSaleDocumentsModal`, só habilitado enquanto o diálogo está
  // aberto (mesmo racional de cache do TanStack).
  const saleQuery = useMovementSaleDetail(isOpen ? (movementSaleUuid ?? undefined) : undefined);
  const detail = saleQuery.data as MovementSaleDetail | undefined;
  const isLoadingDetail = isOpen && ((saleQuery as any).isLoading || (saleQuery as any).isPending);
  const hasLoadError = isOpen && (saleQuery as any).isError;
  const existingNfe = detail?.nfe ?? null;

  const issueMutation = useIssueMovementSaleNfe();

  function handleConfirm() {
    if (!movementSaleUuid) return;
    issueMutation.mutate(movementSaleUuid, {
      onSuccess: (response) => {
        onClose();
        // Handoff — mudança ADITIVA/OPCIONAL em `CreateOrUpdateNfe.tsx`
        // (Tarefa §2.4): navega para a CRIAÇÃO de NFe levando o payload.
        navigate('/fiscal/nfe-emitidas/novo', {
          state: { movementSaleHandoff: response.data },
        });
      },
      onError: (error) => {
        toaster.error({
          title: text.singularLabel,
          description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
          duration: 7000,
        });
      },
    });
  }

  // Estado de CARREGAMENTO do detalhe — informativo, sem ação (fecha ao
  // clicar), mirror da convenção "onConfirm/onClose só fecham" já usada no
  // fork para variantes puramente informativas do `DeleteConfirmDialog`.
  if (isLoadingDetail) {
    return (
      <DeleteConfirmDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={onClose}
        title={emitNfeText.title}
        description={emitNfeText.loading}
        hideQuestionMark
        confirmButtonText={languageGB.defaltStrings.close}
        tone="info"
        colorPalette="blue"
      />
    );
  }

  if (hasLoadError) {
    return (
      <DeleteConfirmDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={onClose}
        title={emitNfeText.title}
        description={emitNfeText.loadError}
        hideQuestionMark
        confirmButtonText={languageGB.defaltStrings.close}
        tone="info"
        colorPalette="blue"
      />
    );
  }

  // §2.3 — `detail.nfe` já existe: preserva a semântica legada da condição
  // `!nfe_id` SEM mudança de backend e SEM dado fabricado (substitui a
  // necessidade de resolver `GAP-VENDAS-FE-03`). Estado informativo, sem
  // confirmação real.
  if (existingNfe) {
    return (
      <DeleteConfirmDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={onClose}
        title={emitNfeText.title}
        description={emitNfeText.alreadyIssuedTemplate.replace(
          '{number}',
          existingNfe.number ?? '—'
        )}
        hideQuestionMark
        confirmButtonText={languageGB.defaltStrings.close}
        tone="info"
        colorPalette="blue"
      />
    );
  }

  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      isLoading={issueMutation.isPending}
      title={emitNfeText.title}
      description={
        movementSaleCode
          ? emitNfeText.confirmDescriptionTemplate.replace('{code}', movementSaleCode)
          : emitNfeText.confirmDescription
      }
      confirmButtonText={emitNfeText.confirmButton}
      hideQuestionMark
      tone="info"
      colorPalette="blue"
    />
  );
}
