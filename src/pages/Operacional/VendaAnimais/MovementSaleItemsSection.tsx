// src/pages/Operacional/VendaAnimais/MovementSaleItemsSection.tsx
// -----------------------------------------------------------------------------
// Seção "Itens" (animais) da Venda de Animais — TASK-VD-FE-02, contrato de
// tela §7.2. Mirror EXATO `RomaneioItemsTab.tsx` — `useFieldArray({control,
// name:'items'})` no PAI (aqui), a linha (`MovementSaleItemRow`) recebe
// `control`/`index`/`watch`/`setValue`/`errors`/`isDisabled` por prop e NUNCA
// instancia seu próprio `useFieldArray` (contrato §"Estado").
//
// Distribuição de peso médio (`average_weight_kg`, IG7, contrato §7.2) —
// campo auxiliar FORA do array, `onChange` distribui `weight_kg` entre TODOS
// os `items` visíveis; não é campo persistido (payload nunca o inclui).
//
// VD-FE-02 (contrato §3.2/§3.4 DIV-FE-3, PARADA-FE-4 aprovada — dono aceitou
// o default "corrigir CV-010"): `average_weight_kg` representa o PESO TOTAL
// GERAL informado, não o peso de cada item — cada `weight_kg` recebe
// `total/quantidade` (`round(2)`). O fork anterior atribuía o MESMO valor
// (o total) a cada item, sem dividir — divergência de fidelidade corrigida
// aqui (IG-010 do contrato legado: "divide total igualmente").
// -----------------------------------------------------------------------------

import { Box, Flex, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { NumberInput } from '@/components/Form/NumberInput';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import type { MovementSaleForm, MovementSaleItemForm } from '@/@types/v2/MovementSales';

import { MovementSaleItemRow } from './MovementSaleItemRow';
import { MovementSaleWeighingImportPanel } from './MovementSaleWeighingImportPanel';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface MovementSaleItemsSectionProps {
  control: Control<MovementSaleForm>;
  errors: FieldErrors<MovementSaleForm>;
  watch: UseFormWatch<MovementSaleForm>;
  setValue: UseFormSetValue<MovementSaleForm>;
  isDisabled: boolean;
  /** TASK-VD-FE-03 (contrato §8) — repassado a cada `MovementSaleItemRow`;
   *  Default `false` preserva o form principal (Tarefa 15). */
  lockIdentityFields?: boolean;
  /** Esconde "Adicionar animal" + o distribuidor de peso médio (IG7, sem
   *  sentido na Finalização — os itens já estão fechados) além do botão de
   *  remover linha (repassado à linha). Default `false`. */
  hideRowActions?: boolean;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function createEmptyMovementSaleItem(): MovementSaleItemForm {
  return {
    animal_uuid: null,
    category_uuid: null,
    previous_weight_kg: null,
    entry_date: null,
    weight_kg: null,
    performance: null,
    gain: null,
    gmd: null,
    carcass_weight: null,
    note: '',
  };
}

export function MovementSaleItemsSection({
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  lockIdentityFields = false,
  hideRowActions = false,
}: MovementSaleItemsSectionProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.movementSales.movementSale.form.itemRow;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const arrayError = errors.items?.message as string | undefined;

  function handleAdd() {
    append(createEmptyMovementSaleItem());
  }

  function handleRemove(index: number) {
    if (fields.length <= 1) {
      toaster.error({
        title: text.addButton,
        description: text.removeLastError,
      });
      return;
    }
    remove(index);
  }

  return (
    <Box pt={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={2}>
        {text.title}
      </Text>

      {arrayError && (
        <Text fontSize="xs" color="fg.error" mb={2}>
          {arrayError}
        </Text>
      )}

      {/* VD-FE-01 (contrato §3.2 FALTA-A, SURF-PNL-001) — painel de
          Importação de Pesagem, aditivo. Ausente na Finalização de abate
          (`hideRowActions=true`): os itens já estão fechados desde a criação
          da venda, sem sentido reimportar pesagem ali. */}
      {!hideRowActions && (
        <MovementSaleWeighingImportPanel
          items={watch('items') ?? []}
          setValue={setValue}
          isDisabled={isDisabled}
        />
      )}

      {fields.length === 0 ? (
        <Text fontSize="sm" color="fg.muted" mb={4}>
          {text.empty}
        </Text>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <MovementSaleItemRow
              key={field.id}
              index={index}
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isDisabled={isDisabled}
              onRemove={() => handleRemove(index)}
              lockIdentityFields={lockIdentityFields}
              hideRowActions={hideRowActions}
            />
          ))}
        </Flex>
      )}

      {!hideRowActions && (
        <Flex gap={4} align="flex-end" wrap="wrap">
          <Button
            title={text.addButton}
            icon={FiPlus as any}
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={isDisabled}
          />

          {/* IG7 — distribui peso médio entre os itens visíveis (client-only,
              nunca persistido). */}
          <Box maxW="220px">
            <Controller
              name="average_weight_kg"
              control={control}
              render={({ field }) => (
                <NumberInput
                  name={field.name}
                  label={languageGB.movementSales.movementSale.form.fields.averageWeight}
                  allowDot
                  decimalPlaces={2}
                  value={field.value ?? null}
                  onValueChange={(value) => {
                    field.onChange(value);
                    const currentItems = watch('items') ?? [];
                    const quantity = currentItems.length;
                    // CV-010: `value` é o total geral informado; cada item
                    // recebe `total/quantidade`. Ao limpar (`value` vazio),
                    // propaga o próprio vazio (comportamento preexistente).
                    const perItemWeight =
                      value && quantity > 0 ? round(value / quantity, 2) : value;
                    currentItems.forEach((_, index) => {
                      setValue(`items.${index}.weight_kg`, perItemWeight, {
                        shouldValidate: true,
                      });
                    });
                  }}
                  disabled={isDisabled || fields.length === 0}
                />
              )}
            />
          </Box>
        </Flex>
      )}
    </Box>
  );
}
