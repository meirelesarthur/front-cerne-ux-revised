// src/pages/CadastrosBase/Produtos/Catalogo/CreateOrUpdateProduto.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO e EDIÇÃO de PRODUTO (Product — Cadastros Base / Estrutura /
// "Catálogo", execução 025, `TASK-FE-503`). MESMO arquivo para os dois casos
// (`isEditing = isValidGuid(productId)`).
//
// TASK-FE-036-B16 (2026-08-14) — EXTRAÇÃO, mirror EXATO de
// `CreateOrUpdateCliente.tsx`/`TASK-MV-FE-10`: toda a orquestração de
// estado/submit do wizard de 3 abas (`useForm`/cascata Grupo→Categoria→
// Classe/pivot Embalagens/autofill fiscal/persistência) migrou LITERALMENTE
// (recorte-e-cola, nenhuma linha de lógica reescrita) para
// `useProductFormController.ts`; todo o JSX das 3 abas + rodapé migrou para
// `ProductFormFields.tsx`. Esta página ficou reduzida ao wrapper de rota/
// permissão/guard de navegação + resolução dos hints da querystring (fluxo
// legado "+ Criar Produto") — pré-requisito de `ProductFormModal` (reuso
// destes mesmos módulos dentro do Contrato de Venda/NFe). Comportamento da
// tela: ZERO mudança (mesmos campos, ordem, cascata, autofill, validação,
// submit create/update).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { isValidGuid } from '@/utils/guid';

import { ProductFormFields, ProductFormFooter } from './ProductFormFields';
import { useProductFormController } from './useProductFormController';

export default function CreateOrUpdateProduto() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não casa com
  // `/:productId` — rota irmã distinta, wiring real em TASK-FE-506).
  const isEditing = isValidGuid(productId);

  // GAP-BE-630/DF-13 (TASK-FE-653) — hint OPCIONAL vindo do botão "+ Criar
  // Produto" de `InvoiceItemsTab.tsx` (item de XML não casado,
  // `product_matched===false`), fluxo legado superado por
  // `CreateProductFromXmlModal.tsx` mas mantido aqui por navegação direta.
  // SÓ lido na CRIAÇÃO (`!isEditing`) — nunca sobrescreve edição.
  const xmlDescriptionHint = !isEditing ? (searchParams.get('description')?.trim() ?? '') : '';
  const xmlNcmCodeHint = !isEditing ? searchParams.get('ncm_code') : null;
  const xmlNcmDescriptionHint = !isEditing ? searchParams.get('ncm_description') : null;

  // Guard de navegação: `productId` presente mas NÃO é um GUID válido (URL
  // adulterada) não deve renderizar um form "fantasma" — redireciona para a
  // listagem (mesmo racional de CreateOrUpdateKind.tsx/CreateOrUpdateEmbalagem.tsx).
  useEffect(() => {
    if (productId && !isValidGuid(productId)) {
      navigate('/cadastros-base/produtos', { replace: true });
    }
  }, [productId, navigate]);

  const text = languageGB.products.product;

  // Permissões REAIS do backend (`products_create`/`products_edit`,
  // Product-contrato.md §7) — sem flag de autorização por item no
  // `ProductResource`, permissão GLOBAL basta (mesmo padrão de Kind/Embalagens).
  const canSave = isEditing ? can('products_edit') : can('products_create');

  const controller = useProductFormController({
    productId,
    isEditing,
    canSave,
    xmlDescriptionHint,
    xmlNcmHint: { code: xmlNcmCodeHint, description: xmlNcmDescriptionHint },
  });

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      footer={
        <ProductFormFooter
          tabValue={controller.tabValue}
          handleNext={controller.handleNext}
          handleBack={controller.handleBack}
          isSubmitting={controller.isSubmitting}
          isLoading={controller.isLoading}
          canSave={canSave}
          onCancel={() => navigate(-1)}
        />
      }
    >
      <ProductFormFields
        {...controller}
        isEditing={isEditing}
        onCancel={() => navigate(-1)}
        renderFooter={false}
        xmlNcmHintLabel={controller.xmlNcmHintLabel}
      />
    </FormContainer>
  );
}
