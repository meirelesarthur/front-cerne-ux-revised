// src/pages/Operacional/PesagemRodoviaria/dialogs/ClientDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo de sub-cadastro Cliente (FE-DLG-CLIENT, TASK-MWG-FE-11) — wrapper
// FINO sobre `ClientFormModal` (`pages/CadastrosBase/Clientes/ClientFormModal.tsx`),
// mesmo modal genérico reutilizado por `InlineClientModal.tsx` (Pedidos,
// PED-FE-07) e outras features do fork.
//
// DV-010 FECHADO POR CONSTRUÇÃO: `ClientFormModal` é "gated-mount"
// (`unmountOnExit` no `CustomDialog` subjacente, `key={clientUuid ?? 'new'}`
// interno) — reabrir para "novo" depois de editar NÃO herda `id` oculto nem
// `state_registrations[]` residuais (o componente inteiro remonta do zero).
// `is_enabled` omitido (`hideIsEnabled`) — cliente criado a partir da
// Pesagem nasce/permanece ATIVO, mesma decisão de `InlineClientModal`.
// -----------------------------------------------------------------------------

import {
  ClientFormModal,
  type ClientFormModalSavedPayload,
} from '@/pages/CadastrosBase/Clientes/ClientFormModal';

export type { ClientFormModalSavedPayload };

export interface ClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** uuid do Cliente para EDITAR; `undefined`/vazio = modo CRIAR. */
  clientUuid?: string;
  onSaved: (client: ClientFormModalSavedPayload) => void;
}

export function ClientDialog({ isOpen, onClose, clientUuid, onSaved }: ClientDialogProps) {
  return (
    <ClientFormModal
      isOpen={isOpen}
      onClose={onClose}
      clientUuid={clientUuid}
      onSaved={onSaved}
      hideIsEnabled
    />
  );
}

export default ClientDialog;
