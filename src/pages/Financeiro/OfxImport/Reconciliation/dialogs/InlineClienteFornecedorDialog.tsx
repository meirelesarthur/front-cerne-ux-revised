// src/pages/Financeiro/OfxImport/Reconciliation/dialogs/InlineClienteFornecedorDialog.tsx
// -----------------------------------------------------------------------------
// Wrapper FINO (mirror `Pedidos/dialogs/InlineClientModal.tsx`) que abre
// `ClientFormModal`/`ProviderFormModal` a partir do `NewMovementModal.tsx`
// (NOSSO, TASK-065-OFX-FE-02, reconciliação de merge 065 — ver
// 97-Esteiras/065/ROTEIROS/arquitetura-reconciliacao-ofx-frontend.md §2/§7),
// ramificado por `isIncome` (mesma nomenclatura já usada em
// `NewMovementModal.tsx`: `isIncome`/`isExpense`, derivada do `type` FIXO da
// transação bancária — `true`→Cliente, `false`→Fornecedor). ZERO linhas novas
// de form de cliente/fornecedor — os 2 modais reusados já cobrem 100% dos
// campos e já orquestram seus próprios `useCustomFormQueryById`/`useRequest`.
//
// ADAPTADO (era `dialogs/InlineClienteFornecedorDialog.tsx`, DELES, prop
// `type: 'E'|'S'` mirror do `type` do lançamento) — trocado por `isIncome:
// boolean` para casar com a nomenclatura já em uso no caller NOSSO
// (`isIncome`/`isExpense`, computados a partir de `watchedType` em
// `NewMovementModal.tsx`), evitando reintroduzir o vocabulário `'E'|'S'` só
// para este wrapper.
// -----------------------------------------------------------------------------

import {
  ClientFormModal,
  type ClientFormModalSavedPayload,
} from '@/pages/CadastrosBase/Clientes/ClientFormModal';
import {
  ProviderFormModal,
  type ProviderFormModalSavedPayload,
} from '@/pages/CadastrosBase/Fornecedores/ProviderFormModal';

export type { ClientFormModalSavedPayload, ProviderFormModalSavedPayload };

export interface InlineClienteFornecedorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** `true` → Cliente; `false` → Fornecedor (mirror `isIncome`/`isExpense`
   *  já usado em `NewMovementModal.tsx`). */
  isIncome: boolean;
  /** uuid para EDITAR; `undefined`/vazio = modo CRIAR. */
  participantUuid?: string;
  onSaved: (payload: ClientFormModalSavedPayload | ProviderFormModalSavedPayload) => void;
}

export function InlineClienteFornecedorDialog({
  isOpen,
  onClose,
  isIncome,
  participantUuid,
  onSaved,
}: InlineClienteFornecedorDialogProps) {
  if (isIncome) {
    return (
      <ClientFormModal
        isOpen={isOpen}
        onClose={onClose}
        clientUuid={participantUuid}
        onSaved={onSaved}
      />
    );
  }

  return (
    <ProviderFormModal
      isOpen={isOpen}
      onClose={onClose}
      providerUuid={participantUuid}
      onSaved={onSaved}
    />
  );
}
