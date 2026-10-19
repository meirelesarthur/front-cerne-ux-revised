// src/pages/Operacional/Carregamento/ChargeItemsTab.tsx
// -----------------------------------------------------------------------------
// Aba "Itens" do Carregamento (TASK-FE-CG-03) — `useFieldArray({control,
// name:'items'})` no PAI (`CreateOrUpdateCharge.tsx`, mirror GAP-TRF-FE-02
// aprovado), repassado por prop a `ChargeItemRow` (linha "burra", NÃO
// instancia o próprio `useFieldArray`, contrato §"Estado"). Mirror ESTRUTURAL
// EXATO `RomaneioItemsTab.tsx` — sem bloco "Totais" (Charge não tem cálculo
// de cabeçalho agregando os itens, nota técnica 2 do plano: `total`/
// `total_real` são só do cabeçalho, calculados no servidor).
//
// IG-06/IG-07 — bloqueia "Adicionar" com QUALQUER linha incompleta (falta
// `product_uuid`/`quantity`/`amount`), bloqueia remover a ÚLTIMA linha
// (`items` nunca vazio, `min:1` no servidor) — mensagens literais do módulo.
//
// `isItemsLocked` — repeater 100% travado (sem adicionar/remover, campos das
// linhas `isDisabled`) SÓ quando o usuário não tem `charge_edit` (só
// `charge_view`). Decisão do dono #5 (MANTER LIVRE, TASK-FE-CG-05) — Charge
// `finalizada` CONTINUA EDITÁVEL; o pai (`CreateOrUpdateCharge.tsx`) NUNCA
// mais deriva `isReadOnly`/`isItemsLocked` do `status`, só da permissão.
// -----------------------------------------------------------------------------

import { Box, Flex, Text } from '@chakra-ui/react';
import { useFieldArray } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import type { ChargeForm, ChargeItemForm } from '@/@types/v2/Carregamentos';

import { ChargeItemRow } from './ChargeItemRow';
import { createEmptyChargeItem } from './useCarregamentos';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface ChargeItemsTabProps {
  control: Control<ChargeForm>;
  errors: FieldErrors<ChargeForm>;
  watch: UseFormWatch<ChargeForm>;
  setValue: UseFormSetValue<ChargeForm>;
  isDisabled: boolean;
  /** `true` só quando falta `charge_edit` (usuário só com `charge_view`) —
   *  trava só o REPEATER (adicionar/remover/campos das linhas), não a
   *  aba/tela inteira. NUNCA derivado do `status` (decisão do dono #5). */
  isItemsLocked?: boolean;
}

function isRowComplete(item: ChargeItemForm | undefined): boolean {
  if (!item) return false;
  return (
    !!item.product_uuid?.value &&
    item.quantity !== null &&
    item.quantity !== undefined &&
    item.quantity > 0 &&
    item.amount !== null &&
    item.amount !== undefined &&
    item.amount >= 0
  );
}

export function ChargeItemsTab({
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  isItemsLocked = false,
}: ChargeItemsTabProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.carregamentos.charge.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const isRepeaterDisabled = isDisabled || isItemsLocked;

  const arrayError = errors.items?.message as string | undefined;

  function handleAdd() {
    const currentItems = watch('items') ?? [];
    const hasIncompleteRow = currentItems.some((item) => !isRowComplete(item));

    if (hasIncompleteRow) {
      toaster.error({
        title: text.itemRow.addButton,
        description: text.itemRow.addIncompleteError,
      });
      return;
    }

    append(createEmptyChargeItem());
  }

  function handleRemove(index: number) {
    if (fields.length <= 1) {
      // IG-07 — `items` nunca vazio; recusa direto (sem diálogo), mensagem
      // literal do módulo.
      toaster.error({
        title: text.itemRow.removeButton,
        description: text.itemRow.removeLastError,
      });
      return;
    }
    remove(index);
  }

  return (
    <Box pt={4}>
      {arrayError && (
        <Text fontSize="xs" color="fg.error" mb={2}>
          {arrayError}
        </Text>
      )}

      <Flex direction="column" gap={4} mb={4}>
        {fields.map((field, index) => (
          <ChargeItemRow
            key={field.id}
            index={index}
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            isDisabled={isRepeaterDisabled}
            onRemove={() => handleRemove(index)}
          />
        ))}
      </Flex>

      {!isItemsLocked && (
        <Button
          title={text.itemRow.addButton}
          icon={FiPlus as any}
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={isRepeaterDisabled}
        />
      )}
    </Box>
  );
}
