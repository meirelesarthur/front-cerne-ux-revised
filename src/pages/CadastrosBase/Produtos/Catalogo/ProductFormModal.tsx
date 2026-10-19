// src/pages/CadastrosBase/Produtos/Catalogo/ProductFormModal.tsx
// -----------------------------------------------------------------------------
// TASK-FE-036-B16 — modal reutilizável de criação/edição de Produto, sobre o
// MESMO shell genérico já usado por `ClientFormModal.tsx` (`CustomDialog`,
// mirror exato de estrutura/gated-render). Reusa 100% de
// `useProductFormController`/`ProductFormFields` (extraídos de
// `CreateOrUpdateProduto.tsx` nesta mesma Tarefa) — zero endpoint/schema/
// service novo, zero regra de negócio reimplementada.
//
// Diferença deliberada vs. `ClientFormModal` — não há "gated-mount" à espera
// do detalhe (`GET /products/{uuid}`) antes de montar o corpo: o padrão de
// hidratação de Produto SEMPRE foi via `reset()` guardado por
// `!isEmpty(dirtyFields)` dentro do PRÓPRIO `useProductFormController`
// (mesmo padrão da página cheia, nunca `defaultValues` síncronos) — o
// Skeleton por campo já é resolvido pelo prop `loading={isLoading}` que cada
// campo de `ProductFormFields` já recebe, sem precisar de um 2º nível de
// Skeleton no wrapper do Modal. `key={productUuid ?? 'new'}` força remount
// completo do controller (tabValue/dirtyFields/packageUuidsTouched) a cada
// abertura para um Produto diferente — mesmo racional do `key` de
// `ClientFormModalBody`.
//
// `size="full"` (não `"xl"` como Cliente) — o form de Produto é um wizard de
// 3 abas (~60 campos, incluindo o bloco Fiscal de ~40 campos) MUITO maior
// que o de Cliente; mesma decisão de "usar o teto do Dialog genérico quando
// o conteúdo justifica" já registrada em `CreateProductFromXmlModal.tsx`
// (`size="cover"`, fora do `CustomDialog` porque aquele Dialog é bespoke).
// `scrollableBody` habilitado — o corpo rola dentro do Dialog, mesmo em
// `"full"`.
//
// `disablePortal` (mirror `ClientFormModal`/`CreateProductFromXmlModal`) —
// este componente SEMPRE monta dentro de `CustomDialog`/`Dialog.Root`; sem
// isso, os Selects (Aba 1 + Abas 2/3, repassado a `ProdutoEstoqueFinanceiroTab`/
// `ProdutoFiscalTab`) abririam com o menu portalizado em `document.body`,
// fora da árvore de Portal do Dialog — opções visíveis porém não-clicáveis.
// -----------------------------------------------------------------------------

import { CustomDialog } from '@/components/CustomDialog';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { isValidGuid } from '@/utils/guid';

import { ProductFormFields, ProductFormFooter } from './ProductFormFields';
import { useProductFormController } from './useProductFormController';

export interface ProductFormModalSavedPayload {
  uuid: string;
  label: string;
}

export interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** uuid do Produto para EDITAR; `undefined`/vazio = modo CRIAR. */
  productUuid?: string;
  /** Disparado após criar/editar com sucesso — o caller decide o que fazer
   *  (selecionar no Select, invalidar cache de options, etc.). O modal NUNCA
   *  navega/redireciona por conta própria — só fecha e devolve o dado. */
  onSaved: (product: ProductFormModalSavedPayload) => void;
}

export function ProductFormModal({ isOpen, onClose, productUuid, onSaved }: ProductFormModalProps) {
  // `key` remonta o controller ao TROCAR de Produto (reseta tabValue/
  // dirtyFields; a hidratação de edição é por `reset()` guardado, mirror
  // `CreateOrUpdateProduto`). O `CustomDialog` vive DENTRO do componente que
  // tem o controller para que o footer (que depende dele) vá para o SLOT
  // `footer` real do dialog — header/footer fixos, só o body rola, SEM
  // sticky/margem-negativa (que geravam faixa morta abaixo do footer).
  return (
    <ProductFormModalDialog
      key={productUuid ?? 'new'}
      isOpen={isOpen}
      onClose={onClose}
      productUuid={productUuid}
      onSaved={onSaved}
    />
  );
}

interface ProductFormModalDialogProps {
  isOpen: boolean;
  productUuid?: string;
  onClose: () => void;
  onSaved: (product: ProductFormModalSavedPayload) => void;
}

function ProductFormModalDialog({
  isOpen,
  productUuid,
  onClose,
  onSaved,
}: ProductFormModalDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.products.product;
  const { can } = usePermissions();

  // `isEditing` gateado por `isOpen`: fechado → nenhum GET /products/{uuid}
  // dispara, mesmo com este componente sempre montado (o CustomDialog usa
  // lazyMount/unmountOnExit; corpo e rodapé só renderizam aberto).
  const isEditing = isOpen && isValidGuid(productUuid);
  const canSave = isEditing ? can('products_edit') : can('products_create');

  const controller = useProductFormController({
    productId: productUuid,
    isEditing,
    canSave,
    onPersisted: (data) => {
      onSaved({ uuid: data.uuid, label: data.description });
      onClose();
    },
  });

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={isValidGuid(productUuid) ? text.form.title.edit : text.form.title.create}
      size="form"
      footer={
        <ProductFormFooter
          tabValue={controller.tabValue}
          handleNext={controller.handleNext}
          handleBack={controller.handleBack}
          isSubmitting={controller.isSubmitting}
          isLoading={controller.isLoading}
          canSave={canSave}
          onCancel={onClose}
        />
      }
    >
      <ProductFormFields
        {...controller}
        isEditing={isEditing}
        onCancel={onClose}
        disablePortal
        renderFooter={false}
      />
    </CustomDialog>
  );
}
