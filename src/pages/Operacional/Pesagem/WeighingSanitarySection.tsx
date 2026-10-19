// src/pages/Operacional/Pesagem/WeighingSanitarySection.tsx
// -----------------------------------------------------------------------------
// Bloco condicional Sanitário do formulário de Pesagem — `WeighingSanitarySection`
// (F-071, TASK-PES-FE-06, contrato-tela-lane-c-pesagem-frontend.md §6.6,
// ADR-FE-PES-00). Visível só quando `sanitary=true` (toggle já ligado ao
// cabeçalho do form principal por `WeighingHeaderFields.tsx`, TASK-PES-FE-04/
// 37 — trava cruzada CL-024/OQ-P7 já implementada lá) — a CONDIÇÃO de
// visibilidade é do componente PAI (`CreateOrUpdateWeighing.tsx`), este
// componente só cuida do CONTEÚDO do bloco (§2.1 do contrato-tela).
//
// `useFieldArray` de `sanitary_items`, mínimo 1 linha quando o bloco está
// montado — mirror ESTRUTURAL EXATO de `Sanitario/SanitaryItemsSection.tsx`
// (mesmo `useFieldArray`+`append`/`remove`, mesmo `useEffect` que acrescenta 1
// linha vazia sempre que `fields.length` chega a 0 — montagem inicial com
// `sanitary_items: []` OU depois de o toggle `sanitary` ser ligado pela 1ª
// vez). SEM seletor de animais (§2.2) — `animalsCount` é só a CONTAGEM
// (`animals.length` do bloco principal), repassada pelo pai a cada linha,
// nunca uma seleção própria deste bloco.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Flex, Text } from '@chakra-ui/react';
import { Control, useFieldArray } from 'react-hook-form';

import { Button } from '@/components/Button';

import type { LanguageDate } from '@/@types/language';
import type { WeighingFormValues, WeighingSanitaryItemFormValue } from '@/@types/v2/Weighing';

import { WeighingSanitaryItemRow } from './WeighingSanitaryItemRow';

const EMPTY_SANITARY_ITEM: WeighingSanitaryItemFormValue = {
  warehouse_uuid: null,
  product: null,
  measurement_uuid: null,
  quantity: '',
  note: '',
};

export interface WeighingSanitarySectionProps {
  control: Control<WeighingFormValues>;
  languageGB: LanguageDate;
  /** `animals.length` do bloco principal — repassado a cada `WeighingSanitaryItemRow` (§2.2 do contrato-tela). */
  animalsCount: number;
  isDisabled?: boolean;
}

export function WeighingSanitarySection({
  control,
  languageGB,
  animalsCount,
  isDisabled,
}: WeighingSanitarySectionProps) {
  const text = languageGB.weighing.weighing.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'sanitary_items' });

  useEffect(() => {
    if (fields.length === 0) {
      append({ ...EMPTY_SANITARY_ITEM });
    }
    // eslint-disable-next-line
  }, [fields.length]);

  return (
    <Flex direction="column" gap={4} mt={6}>
      <Flex justify="space-between" align="center">
        <Text fontWeight="bold">{text.sections.sanitary}</Text>
        <Button
          title={text.addItem}
          variant="outline"
          type="button"
          onClick={() => append({ ...EMPTY_SANITARY_ITEM })}
          disabled={isDisabled}
        />
      </Flex>

      <Flex direction="column" gap={4}>
        {fields.map((field, index) => (
          <WeighingSanitaryItemRow
            key={field.id}
            control={control}
            index={index}
            canRemove={fields.length > 1}
            onRemove={() => remove(index)}
            animalsCount={animalsCount}
            languageGB={languageGB}
            isDisabled={isDisabled}
          />
        ))}
      </Flex>

      {fields.length === 0 && <Text color="fg.muted">{text.emptyItemsRow}</Text>}
    </Flex>
  );
}

export default WeighingSanitarySection;
