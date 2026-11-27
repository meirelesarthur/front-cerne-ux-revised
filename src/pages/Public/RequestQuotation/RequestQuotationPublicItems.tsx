// src/pages/Public/RequestQuotation/RequestQuotationPublicItems.tsx
// -----------------------------------------------------------------------------
// Lista de itens do formulário público: TABELA limpa no desktop (kit
// `SimpleTable`) e CARTÕES por item no celular. Só um dos dois é montado por
// vez (os campos têm `name` único no formulário). Apresentação apenas.
// -----------------------------------------------------------------------------

import { Flex, useMediaQuery } from '@chakra-ui/react';

import { SimpleTable } from '@/components/ui/SimpleTable';

import { useLanguage } from '@/hooks/useLanguage';

import type {
  PublicRequestQuotationForm,
  PublicRequestQuotationItemRow as PublicItemData,
} from '@/@types/v2/RequestQuotations';

import { getItemTableCells, RequestQuotationPublicItemRow } from './RequestQuotationPublicItemRow';

import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';

export interface RequestQuotationPublicItemsProps {
  control: Control<PublicRequestQuotationForm>;
  errors: FieldErrors<PublicRequestQuotationForm>;
  setValue: UseFormSetValue<PublicRequestQuotationForm>;
  items: PublicItemData[];
  /** Rótulo da coluna de itens: "Produto" (tipo P) ou "Serviços". */
  itemLabel: string;
  disabled: boolean;
}

export function RequestQuotationPublicItems({
  control,
  errors,
  setValue,
  items,
  itemLabel,
  disabled,
}: RequestQuotationPublicItemsProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestQuotations.requestQuotation.publicForm;
  // 62em = breakpoint `lg` do tema; abaixo disso, cartões (sem rolagem lateral).
  const [isTable] = useMediaQuery(['(min-width: 62em)'], { fallback: [false] });

  if (isTable) {
    return (
      <SimpleTable
        ariaLabel={text.itemsSection.tableLabel}
        columns={[
          { key: 'item', header: itemLabel },
          { key: 'quantity', header: text.fields.quantity, align: 'right' },
          { key: 'brand', header: text.fields.brand },
          { key: 'unit', header: text.fields.unitaryValue },
          { key: 'total', header: text.fields.amount, align: 'right' },
          { key: 'observation', header: text.fields.observation },
        ]}
        rows={items.map((item, index) => ({
          key: item.request_item_uuid,
          cells: getItemTableCells(
            { control, errors, setValue, index, item, disabled },
            text
          ),
        }))}
      />
    );
  }

  return (
    <Flex as="ul" direction="column" gap={3} m={0} p={0} aria-label={text.itemsSection.tableLabel}>
      {items.map((item, index) => (
        <RequestQuotationPublicItemRow
          key={item.request_item_uuid}
          control={control}
          errors={errors}
          setValue={setValue}
          index={index}
          item={item}
          disabled={disabled}
        />
      ))}
    </Flex>
  );
}
