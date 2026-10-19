// src/pages/Operacional/DiscountTable/DiscountRuleTypeTab.tsx
// -----------------------------------------------------------------------------
// Conteúdo de UMA aba de tipo de Regra de Desconto (SURF-RULES-GRID) dentro
// do card de produto (DiscountTable — Operacional/Agricultura, F-032,
// TASK-DT-FE-03). `useFieldArray` de
// `products.${productIndex}.rules.${type}` — decisão estrutural mirror
// `FeedingPhaseItemsEditor`: `useFieldArray` vive AQUI (não no card/pai),
// escopado à PRÓPRIA aba (2º nível de aninhamento do repeater).
//
// BR-03 NÃO migrado (contrato de tela §4.3, divergência corrigida): a aba
// nasce SEM linhas — o usuário adiciona explicitamente via "Adicionar
// Regra"; remover a última linha é permitido (o tipo fica vazio e não é
// enviado). Nenhuma linha zerada automática.
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { Box, Text } from '@chakra-ui/react';
import { Control, useFieldArray } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';

import type { LanguageDate } from '@/@types/language';
import type { DiscountRuleType } from '@/@types/v2/DiscountTables';

import { DiscountRuleRow } from './DiscountRuleRow';

export interface DiscountRuleTypeTabProps {
  control: Control<any>;
  productIndex: number;
  type: DiscountRuleType;
  languageGB: LanguageDate;
  disabled?: boolean;
}

export function DiscountRuleTypeTab({
  control,
  productIndex,
  type,
  languageGB,
  disabled = false,
}: DiscountRuleTypeTabProps) {
  const text = languageGB.discountTables.discountTable.form.rules;

  // Path genuinamente dinâmico (índice do produto + tipo de regra) — `name`
  // como `any` é o cast pragmático deste limite de tipagem (ver nota em
  // `DiscountRuleRow.tsx`).
  const { fields, append, remove } = useFieldArray({
    control,
    name: `products.${productIndex}.rules.${type}` as any,
  });

  function handleAdd() {
    append({ initial_limit_percent: '', final_limit_percent: '', discount_percent: '' });
  }

  return (
    <Box pt={4}>
      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.emptyState}
          </Text>
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" gap={3} mb={3}>
          {fields.map((field, rowIndex) => (
            <DiscountRuleRow
              key={field.id}
              control={control}
              productIndex={productIndex}
              type={type}
              rowIndex={rowIndex}
              remove={remove}
              languageGB={languageGB}
              disabled={disabled}
            />
          ))}
        </Box>
      )}

      <Button
        title={text.addRule}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}
