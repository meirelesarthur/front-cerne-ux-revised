// src/components/Form/DetailGrid.tsx
// -----------------------------------------------------------------------------
// Grade de `ViewField`s para telas de DETALHE — adaptação de
// `GB.Cerne.UX/src/components/ui/DetailGrid.tsx` para Chakra UI v3
// (`SimpleGrid` + tokens desta SPA, ver `ViewField.tsx`).
// -----------------------------------------------------------------------------
import type { ReactNode } from 'react';

import { SimpleGrid, SimpleGridProps } from '@chakra-ui/react';

import { columnsForm } from '@/constants/coluns-form';

import { ViewField } from './ViewField';

export interface DetailItem {
  /** Chave estável do item na lista — cai para `label` (depois índice) quando ausente. */
  itemKey?: string;
  label?: string;
  value?: ReactNode;
}

interface DetailGridProps {
  items: DetailItem[];
  /** Default: `columnsForm.default` (base 1 / sm 2 / md 3 / lg 4), mesmo
   *  degrau responsivo já usado nas telas de detalhe do projeto. */
  columns?: SimpleGridProps['columns'];
  gap?: SimpleGridProps['gap'];
}

export function DetailGrid({ items, columns = columnsForm.default, gap = 6 }: DetailGridProps) {
  return (
    <SimpleGrid columns={columns} gap={gap}>
      {items.map((item, index) => (
        <ViewField
          key={item.itemKey ?? item.label ?? index}
          label={item.label}
          value={item.value}
        />
      ))}
    </SimpleGrid>
  );
}
