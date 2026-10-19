// src/pages/Operacional/PesagemRodoviaria/dialogs/ProductDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo de sub-cadastro Produto (FE-DLG-PRODUCT, TASK-MWG-FE-11) — wrapper
// FINO sobre `ProductFormModal` (`pages/CadastrosBase/Produtos/Catalogo/
// ProductFormModal.tsx`), o modal GENÉRICO já em produção reutilizado por
// outras features do fork (mesmo `useProductFormController`/schema/service
// da página cheia). Reaproveitar é FIDELIDADE (mesma UX que o resto do
// fork já usa para Produto), não duplicar o form completo (cascata grupo→
// categoria→tipo/NCM/cultivo/qualidade, `IG-021..026`) — mirror da decisão
// já tomada em `InlineClientModal.tsx` (PED-FE-07, execução 043).
//
// `ProductFormModal` é "gated-mount" (`unmountOnExit` no `CustomDialog`
// subjacente) — reabrir para "criar" depois de editar não herda estado
// residual (fecha por construção qualquer defeito análogo a DV-010).
// -----------------------------------------------------------------------------

import {
  ProductFormModal,
  type ProductFormModalSavedPayload,
} from '@/pages/CadastrosBase/Produtos/Catalogo/ProductFormModal';

export type { ProductFormModalSavedPayload };

export interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** uuid do Produto para EDITAR (hidrata via `GET products/{uuid}`);
   *  `undefined`/vazio = modo CRIAR. */
  productUuid?: string;
  /** Disparado após criar/editar com sucesso — o caller (`CreateOrUpdateModuleWeighing`)
   *  seleciona a opção no select de produto; o modal fecha sozinho. */
  onSaved: (product: ProductFormModalSavedPayload) => void;
}

export function ProductDialog({ isOpen, onClose, productUuid, onSaved }: ProductDialogProps) {
  return (
    <ProductFormModal
      isOpen={isOpen}
      onClose={onClose}
      productUuid={productUuid}
      onSaved={onSaved}
    />
  );
}

export default ProductDialog;
