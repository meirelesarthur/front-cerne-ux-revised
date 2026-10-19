// src/pages/Operacional/PesagemRodoviaria/DeleteModuleWeighingDialog.tsx
// -----------------------------------------------------------------------------
// Confirmação de exclusão da listagem de Pesagem Rodoviária (ModuleWeighing,
// FE-FLW-DELETE, TASK-MWG-FE-02, `AM-010`) — wrapper fino sobre
// `DeleteConfirmDialog` (mirror `IG-019`), mesmo componente compartilhado
// usado por `Operacional/Pesagem/index.tsx`.
//
// GAP-PES-02 (P0, decisão do dono em `DECISOES-DONO.md`): `destroy` é
// BLOQUEADO (422) quando `status >= Finalizado` ou vinculada a NFe/
// transferência — a UI NÃO decide a regra, só reage à resposta da API. Se a
// exclusão falhar, `errorMessage` recebe a `message` do envelope de erro
// TAL QUAL veio (nunca reescrita) — ver `index.tsx` (`onError` da mutação).
// -----------------------------------------------------------------------------

import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

export interface DeleteModuleWeighingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title: string;
  description?: string;
}

export function DeleteModuleWeighingDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  description,
}: DeleteModuleWeighingDialogProps) {
  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={title}
      description={description}
      hideQuestionMark
      tone="danger"
    />
  );
}

export default DeleteModuleWeighingDialog;
