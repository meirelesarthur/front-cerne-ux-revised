// src/pages/Administrativo/Solicitacao/RequestItemProductField.tsx
// -----------------------------------------------------------------------------
// Select de PRODUTO de uma linha de item da Solicitação (execução 081,
// T-081-FE-05; contrato LEGADO 03: FM20, FM36, IG05, IG06, PR-I01, PR-I12,
// PR-I16).
//
//   - P/M/U: produto OPCIONAL, com botão "+"/lápis no rótulo que abre o
//     `ProductFormModal` reutilizado (cria ou edita o produto da linha; o legado
//     troca o ícone `+` por lápis quando há produto selecionado — IG05);
//   - F/E: select de produto opcional, SEM botão de cadastro (legado:
//     `_card-finished-purchase`).
//
// Depois de criar/editar pelo modal, o produto passa a ser o valor da linha e o
// `SelectAsyncPaginate` relê a página 1 (`cacheUniqs`), mesmo padrão do
// `BudgetItemsEditor`. Sem endpoint, schema ou service novo.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, Icon, IconButton, useDisclosure } from '@chakra-ui/react';
import { useController } from 'react-hook-form';
import { FiEdit, FiPlus } from 'react-icons/fi';

import { ProductFormModal } from '@/pages/CadastrosBase/Produtos/Catalogo/ProductFormModal';

import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { listProductOptions } from '@/services/v2/Products/product-service';

import type { RequestPurchaseForm } from '@/@types/v2/RequestPurchases';

import type { ProductFormModalSavedPayload } from '@/pages/CadastrosBase/Produtos/Catalogo/ProductFormModal';
import type { Control } from 'react-hook-form';

interface RequestItemProductFieldProps {
  control: Control<RequestPurchaseForm>;
  index: number;
  disabled: boolean;
  /** `true` em P/M/U (botão +/lápis com `ProductFormModal`); `false` em F/E. */
  withProductModal: boolean;
  /** Em célula de tabela: sem rótulo (vai no cabeçalho) e +/lápis ao lado do campo. */
  hideLabel?: boolean;
}

export function RequestItemProductField({
  control,
  index,
  disabled,
  withProductModal,
  hideLabel = false,
}: RequestItemProductFieldProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.requestPurchases.requestPurchase.form;

  const { field, fieldState } = useController({ control, name: `items.${index}.product_uuid` });

  const productModal = useDisclosure();
  const [optionsCacheKey, setOptionsCacheKey] = useState(0);

  const hasProduct = !!field.value;
  const canManageProduct = can('products_create') || can('products_edit');
  const actionLabel = hasProduct ? text.guards.productEdit : text.guards.productAdd;

  function handleProductSaved(product: ProductFormModalSavedPayload) {
    field.onChange({ label: product.label, value: product.uuid });
    setOptionsCacheKey((key) => key + 1);
  }

  const productAction = withProductModal ? (
    <IconButton
      aria-label={actionLabel}
      title={actionLabel}
      variant="ghost"
      size="2xs"
      minH="0"
      h="20px"
      w="20px"
      minW="0"
      p="0"
      disabled={disabled || !canManageProduct}
      onClick={productModal.onOpen}
    >
      <Icon as={hasProduct ? FiEdit : FiPlus} boxSize="16px" color="primaryMain" />
    </IconButton>
  ) : undefined;

  const select = (
    <SelectAsyncPaginate
      name={field.name}
      label={hideLabel ? undefined : text.itemsSection.fields.product}
      aria-label={hideLabel ? text.itemsSection.fields.product : undefined}
      service={listProductOptions}
      mapOptions={(item: { uuid: string; code: string; description: string }) => ({
        label: `${item.code} — ${item.description}`,
        value: item.uuid,
      })}
      findParams={(search: string | { search: string }) => ({
        search: typeof search === 'string' ? search : search.search,
      })}
      value={field.value ?? undefined}
      onChange={(option: any) => field.onChange(option ?? null)}
      error={fieldState.error?.message}
      isDisabled={disabled}
      cacheUniqs={[optionsCacheKey]}
      menuPortalTarget={document.body}
      menuPosition="fixed"
      labelActionTooltip={!hideLabel && withProductModal ? actionLabel : undefined}
      labelAction={hideLabel ? undefined : productAction}
    />
  );

  return (
    <>
      {hideLabel ? (
        <Flex align="flex-start" gap={1}>
          <Box flex="1" minW={0}>
            {select}
          </Box>
          {productAction && (
            <Flex h="38px" align="center" flexShrink={0}>
              {productAction}
            </Flex>
          )}
        </Flex>
      ) : (
        select
      )}

      {withProductModal && (
        <ProductFormModal
          isOpen={productModal.open}
          onClose={productModal.onClose}
          productUuid={field.value?.value}
          onSaved={handleProductSaved}
        />
      )}
    </>
  );
}
