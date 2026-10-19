// src/pages/Operacional/PesagemRodoviaria/dialogs/ProviderDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo de sub-cadastro Fornecedor/Motorista (FE-DLG-PROVIDER,
// TASK-MWG-FE-11) — wrapper FINO sobre `ProviderFormModal`
// (`pages/CadastrosBase/Fornecedores/ProviderFormModal.tsx`), usado tanto
// para "fornecedor" quanto "motorista" (mesmo cadastro, contexto diferente).
//
// DV-009 FECHADO POR CONSTRUÇÃO: cada instância deste componente (uma para o
// select de fornecedor, outra para o select de motorista/equipamento) é um
// componente React ISOLADO com seu próprio estado `isOpen`/`uuid` — nenhum
// `id` DOM compartilhado entre as duas instâncias possíveis na mesma tela
// (`ProviderFormModal` não hardcoda nenhum `id`, é "gated-mount").
// -----------------------------------------------------------------------------

import {
  ProviderFormModal,
  type ProviderFormModalSavedPayload,
} from '@/pages/CadastrosBase/Fornecedores/ProviderFormModal';

export type { ProviderFormModalSavedPayload };

export interface ProviderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** uuid do Fornecedor/Motorista para EDITAR; `undefined`/vazio = modo CRIAR. */
  providerUuid?: string;
  onSaved: (provider: ProviderFormModalSavedPayload) => void;
}

export function ProviderDialog({ isOpen, onClose, providerUuid, onSaved }: ProviderDialogProps) {
  return (
    <ProviderFormModal
      isOpen={isOpen}
      onClose={onClose}
      providerUuid={providerUuid}
      onSaved={onSaved}
    />
  );
}

export default ProviderDialog;
