// src/pages/Operacional/DiscountTable/ProductPickerModal.tsx
// -----------------------------------------------------------------------------
// Modal picker de Produtos (SURF-PRODUCTS-PICKER, contrato de tela §4.2) do
// formulário de Tabela de Desconto (DiscountTable — Operacional/Agricultura,
// F-032, TASK-DT-FE-03). Pattern 14 (Dialog v3, Portal+Positioner) — lookup
// único (`GET /discount-tables/product-options`, tenant+group_id=8), busca
// CLIENT-SIDE sobre a lista já carregada (mirror `#product-search` do
// legado — NÃO é AJAX remoto), dedupe contra produtos já no form.
//
// `useQuery` DIRETO (Pattern 12 — lista sem paginação, sem busca
// server-side) — não `useCustomGridQuery`/`SelectAsyncPaginate` (o endpoint
// não pagina nem busca no servidor).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Box, Dialog, Portal, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { Input } from '@/components/Form/Input';
import { toaster } from '@/components/ui/toaster';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';

import { queryKey } from '@/constants/query-key';

import { getProductOptions } from '@/services/v2/DiscountTables/discount-table-service';

import type { LanguageDate } from '@/@types/language';
import type { ProductOption } from '@/@types/v2/DiscountTables';

export interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: ProductOption) => void;
  /** `product_uuid` já presentes no form — dedupe (fidelidade IG-02, toast
   *  "Produto já adicionado"). */
  alreadyAddedUuids: string[];
  languageGB: LanguageDate;
}

export function ProductPickerModal({
  isOpen,
  onClose,
  onSelect,
  alreadyAddedUuids,
  languageGB,
}: ProductPickerModalProps) {
  const text = languageGB.discountTables.discountTable.form.picker;
  const [search, setSearch] = useState('');

  const productOptionsQuery = useQuery({
    queryKey: [queryKey.discountTables.productOptions],
    queryFn: getProductOptions,
    enabled: isOpen,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Reset da busca local a cada abertura do modal.
  useEffect(() => {
    if (isOpen) setSearch('');
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    const all = productOptionsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (product) =>
        product.description.toLowerCase().includes(term) ||
        product.code.toLowerCase().includes(term)
    );
  }, [productOptionsQuery.data, search]);

  const isLoading = checkLoadingStatus([productOptionsQuery as any]);

  function handleSelect(product: ProductOption) {
    if (alreadyAddedUuids.includes(product.uuid)) {
      toaster.warning({ title: text.alreadyAddedToast });
      return;
    }
    onSelect(product);
    onClose();
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open) onClose();
      }}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>{text.title}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Input
                placeholder={text.searchPlaceholder}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                mb={4}
              />

              {isLoading ? (
                <Skeleton height="40px" borderRadius="md" />
              ) : filteredProducts.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                  {text.emptyState}
                </Text>
              ) : (
                <VStack align="stretch" gap={1} maxHeight="360px" overflowY="auto">
                  {filteredProducts.map((product) => (
                    <Box
                      key={product.uuid}
                      as="button"
                      textAlign="left"
                      p={2}
                      borderRadius="md"
                      _hover={{ bg: 'bg.muted' }}
                      onClick={() => handleSelect(product)}
                    >
                      <Text fontWeight="medium">{product.description}</Text>
                      <Text fontSize="xs" color="fg.muted">
                        {product.code}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button title={languageGB.defaltStrings.cancel} variant="outline" />
              </Dialog.ActionTrigger>
            </Dialog.Footer>
            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export default ProductPickerModal;
