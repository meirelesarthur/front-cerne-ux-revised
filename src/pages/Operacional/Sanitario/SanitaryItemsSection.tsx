// src/pages/Operacional/Sanitario/SanitaryItemsSection.tsx
// -----------------------------------------------------------------------------
// Bloco de itens de produto do formulário de Sanitário — `san-form-items`
// (F-062, TASK-SAN-FE-04, contrato-tela-lane-c-sanitario-frontend.md §6.4).
// `useFieldArray` de `items`, mínimo 1 linha (schema Yup `items: min(1)` já
// entregue na TASK-SAN-FE-01), botão "+" (AC-05, `append`) e remoção por
// linha (AC-06, `remove`) desabilitada quando só resta 1 — mirror estrutural
// do bloco de itens de `FeedlotCorralSanitaryDialog.tsx` (linhas 82/181-215,
// execução 042: mesmo par `useFieldArray`+`append(EMPTY_ITEM)`/`remove(index)`,
// mesmo layout `Flex` com título + botão "+" acima e coluna de linhas abaixo).
//
// A garantia de "mínimo 1 linha" É deste componente (não do `defaultValues`
// de `CreateOrUpdateSanitario.tsx`, que ainda inicializa `items: []` — Tarefa
// 03): um `useEffect` acrescenta 1 linha vazia sempre que `fields.length`
// chega a 0 (montagem inicial OU depois de um `reset` de edição que ainda
// não hidrata itens reais, TASK-SAN-FE-29 — ver nota em
// `@/@types/v2/Sanitaries`). Isso NÃO é mock: é uma linha real e vazia,
// pronta para o usuário preencher — o mesmo estado que o usuário veria ao
// clicar em "Adicionar item" manualmente.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Flex, Text } from '@chakra-ui/react';
import { Control, useFieldArray } from 'react-hook-form';

import { Button } from '@/components/Button';

import type { LanguageDate } from '@/@types/language';
import type { SanitaryFormValues, SanitaryItemFormValue } from '@/@types/v2/Sanitaries';

import { SanitaryItemRow } from './SanitaryItemRow';

const EMPTY_ITEM: SanitaryItemFormValue = {
  warehouse_uuid: null,
  product: null,
  measurement_uuid: null,
  quantity: '',
  cost_center_uuid: null,
  note: '',
};

export interface SanitaryItemsSectionProps {
  control: Control<SanitaryFormValues>;
  languageGB: LanguageDate;
  /** `animal_uuids.length` do form pai — repassado a cada `SanitaryItemRow` (IG-06). */
  animalsCount: number;
  isDisabled?: boolean;
}

export function SanitaryItemsSection({
  control,
  languageGB,
  animalsCount,
  isDisabled,
}: SanitaryItemsSectionProps) {
  const text = languageGB.sanitary.sanitary.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (fields.length === 0) {
      append(EMPTY_ITEM);
    }
    // eslint-disable-next-line
  }, [fields.length]);

  return (
    <Flex direction="column" gap={4} mt={6}>
      <Flex justify="space-between" align="center">
        <Text fontWeight="bold">{text.sections.items}</Text>
        <Button
          title={text.addItem}
          variant="outline"
          type="button"
          onClick={() => append(EMPTY_ITEM)}
          disabled={isDisabled}
        />
      </Flex>

      <Flex direction="column" gap={4}>
        {fields.map((field, index) => (
          <SanitaryItemRow
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

export default SanitaryItemsSection;
