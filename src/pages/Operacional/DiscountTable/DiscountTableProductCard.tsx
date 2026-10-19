// src/pages/Operacional/DiscountTable/DiscountTableProductCard.tsx
// -----------------------------------------------------------------------------
// Card por produto do subcadastro Produtos (SURF-PRODUCT-CARD, contrato de
// tela §4.2) do formulário de Tabela de Desconto (DiscountTable —
// Operacional/Agricultura, F-032, TASK-DT-FE-03). NÃO instancia
// `useFieldArray` de produtos (mirror `FeedingPhaseItemsEditor`/
// `DietIngredientsEditor`) — recebe `control`/`productIndex`/`remove` via
// props; o `useFieldArray({ name: 'products' })` vive no PAI
// (`CreateOrUpdateDiscountTable.tsx`).
//
// Header: `product_label` (display) + botão remover produto SEM
// confirmação (fidelidade IG-04). Corpo: `Tabs` Chakra v3 (estado LOCAL do
// card, exceção de tabs internas de formulário — NÃO navegação por URL) com
// as 6 abas de regra na ORDEM exata (`discountRuleTypeOptions.options`,
// CLM-17).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, Icon, Tabs, Text } from '@chakra-ui/react';
import { Control, FieldErrors, useWatch } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { IconButtonTable } from '@/components/IconButtonTable';

import { DISCOUNT_RULE_TYPES } from '@/constants/discount-table/discount-rule-type';
import { discountRuleTypeOptions } from '@/constants/discount-table/options';

import type { LanguageDate } from '@/@types/language';
import type { DiscountRuleType, DiscountTableForm } from '@/@types/v2/DiscountTables';

import { DiscountRuleTypeTab } from './DiscountRuleTypeTab';

export interface DiscountTableProductCardProps {
  /** `control` do `useForm` do formulário PAI (`DiscountTableForm`). */
  control: Control<DiscountTableForm>;
  productIndex: number;
  /** `remove` do `useFieldArray({ name: 'products' })` do PAI. */
  remove: (index: number) => void;
  errors: FieldErrors<DiscountTableForm>;
  languageGB: LanguageDate;
  disabled?: boolean;
}

export function DiscountTableProductCard({
  control,
  productIndex,
  remove,
  errors,
  languageGB,
  disabled = false,
}: DiscountTableProductCardProps) {
  const text = languageGB.discountTables.discountTable.form;
  const [activeTab, setActiveTab] = useState<DiscountRuleType>(DISCOUNT_RULE_TYPES[0]);

  const productLabel = useWatch({ control, name: `products.${productIndex}.product_label` });
  const productUuidError = (errors as any)?.products?.[productIndex]?.product_uuid?.message as
    string | undefined;

  const ruleTypeOptions = discountRuleTypeOptions.options(languageGB);

  // Cast pragmático — mesmo racional de `DietIngredientsEditor::genericControl`:
  // a partir daqui o path (`products.${productIndex}.rules.${type}`) tem 2
  // segmentos verdadeiramente dinâmicos, fora do alcance de tipagem estática
  // do RHF (ver nota em `DiscountRuleRow.tsx`).
  const genericControl = control as unknown as Control<any>;

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontWeight="semibold">{productLabel}</Text>
        <IconButtonTable
          aria-label={text.products.removeProduct}
          mensegerTooltip={text.products.removeProduct}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={disabled}
          onClick={() => remove(productIndex)}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>

      {productUuidError && (
        <Text fontSize="xs" color="fg.error" mb={2}>
          {productUuidError}
        </Text>
      )}

      {/* @ts-ignore - custom variant */}
      <Tabs.Root
        value={activeTab}
        onValueChange={(details: { value: string }) =>
          setActiveTab(details.value as DiscountRuleType)
        }
        variant={'secondary' as any}
      >
        {/* @ts-ignore */}
        <Tabs.List>
          {ruleTypeOptions.map((option) => (
            // @ts-ignore
            <Tabs.Trigger key={option.value} value={option.value}>
              {option.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {ruleTypeOptions.map((option) => (
          // @ts-ignore
          <Tabs.Content key={option.value} value={option.value}>
            <DiscountRuleTypeTab
              control={genericControl}
              productIndex={productIndex}
              type={option.value}
              languageGB={languageGB}
              disabled={disabled}
            />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </Box>
  );
}
