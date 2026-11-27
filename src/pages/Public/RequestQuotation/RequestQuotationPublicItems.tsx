// src/pages/Public/RequestQuotation/RequestQuotationPublicItems.tsx
// -----------------------------------------------------------------------------
// Itens do formulário público: SEMPRE uma TABELA com edição na própria linha
// (kit `SimpleTable`), para o fornecedor lançar muitos produtos sem rolar de
// cartão em cartão. No celular a tabela rola DENTRO do próprio quadro (a página
// não rola de lado). Teclado: Enter vai para o MESMO campo da linha de baixo
// (marca → marca, valor → valor), como numa planilha; na última linha, Enter
// não envia o formulário. Apresentação apenas (27/11/2026).
// -----------------------------------------------------------------------------

import type { KeyboardEvent } from 'react';

import { Box } from '@chakra-ui/react';

import { SimpleTable } from '@/components/ui/SimpleTable';

import { useLanguage } from '@/hooks/useLanguage';

import type {
  PublicRequestQuotationForm,
  PublicRequestQuotationItemRow as PublicItemData,
} from '@/@types/v2/RequestQuotations';

import { getItemTableCells } from './RequestQuotationPublicItemRow';

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

const FIELD_NAME = /^items\.(\d+)\.(brand|unitary_value|observation)$/;

/** Enter desce para o mesmo campo da linha seguinte (e nunca envia o formulário). */
function handleEnterDown(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== 'Enter') return;
  const target = event.target as HTMLElement;
  if (target.tagName !== 'INPUT') return;
  const match = FIELD_NAME.exec((target as HTMLInputElement).name);
  if (!match) return;
  event.preventDefault();
  const next = event.currentTarget.querySelector<HTMLInputElement>(
    `input[name="items.${Number(match[1]) + 1}.${match[2]}"]`
  );
  next?.focus();
  next?.select();
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
    <Box overflowX="auto" onKeyDown={handleEnterDown}>
      <Box minW="880px">
        <SimpleTable
          ariaLabel={text.itemsSection.tableLabel}
          columns={[
            { key: 'index', header: '#' },
            { key: 'item', header: itemLabel },
            { key: 'quantity', header: text.fields.quantity, align: 'right' },
            { key: 'brand', header: text.fields.brand },
            { key: 'unit', header: text.fields.unitaryValue },
            { key: 'total', header: text.fields.amount, align: 'right' },
            { key: 'observation', header: text.fields.observation },
          ]}
          rows={items.map((item, index) => ({
            key: item.request_item_uuid,
            cells: getItemTableCells({ control, errors, setValue, index, item, disabled }, text),
          }))}
        />
      </Box>
    </Box>
  );
}
