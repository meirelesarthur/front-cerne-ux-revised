// src/pages/Public/RequestQuotation/RequestQuotationPublicItems.tsx
// -----------------------------------------------------------------------------
// Itens do formulário público: SEMPRE uma TABELA com edição na própria linha
// (kit `SimpleTable`), para o fornecedor lançar muitos produtos sem rolar de
// cartão em cartão. Colunas: # · produto · qtde pedida (leitura) · QTDE OFERTADA
// (editável, já vem com o total pedido) · marca · valor unitário · total da
// linha · observação. A rolagem lateral é a do próprio `SimpleTable` (uma só).
// Teclado: Enter desce para o mesmo campo da linha de baixo (`tableKeyboard`).
// Apresentação apenas (27/11/2026).
// -----------------------------------------------------------------------------

import { Box } from '@chakra-ui/react';

import { SimpleTable } from '@/components/ui/SimpleTable';

import { useLanguage } from '@/hooks/useLanguage';

import type {
  PublicRequestQuotationForm,
  PublicRequestQuotationItemRow as PublicItemData,
} from '@/@types/v2/RequestQuotations';

import { getItemTableCells } from './RequestQuotationPublicItemRow';
import { handleEnterMovesDown } from './tableKeyboard';

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

  return (
    <Box onKeyDown={handleEnterMovesDown}>
      <SimpleTable
        ariaLabel={text.itemsSection.tableLabel}
        columns={[
          { key: 'index', header: '#' },
          { key: 'item', header: itemLabel },
          { key: 'requested', header: text.fields.quantity, align: 'right' },
          { key: 'quantity', header: text.fields.offeredQuantity },
          { key: 'unavailable', header: text.fields.unavailable },
          { key: 'brand', header: text.fields.brand },
          { key: 'unit', header: text.fields.unitaryValue },
          { key: 'total', header: text.fields.amount, align: 'right' },
        ]}
        rows={items.map((item, index) => ({
          key: item.request_item_uuid,
          cells: getItemTableCells({ control, errors, setValue, index, item, disabled }, text),
        }))}
      />
    </Box>
  );
}
