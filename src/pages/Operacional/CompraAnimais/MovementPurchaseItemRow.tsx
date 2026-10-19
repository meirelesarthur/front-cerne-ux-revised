// src/pages/Operacional/CompraAnimais/MovementPurchaseItemRow.tsx
// -----------------------------------------------------------------------------
// Linha do repeater de Itens da Compra de Animais — TASK-CP-06, contrato de
// frontend §5 (SUBREG-ITEMS). Mirror ESTRUTURAL `MovementSaleItemRow.tsx` —
// recebe `control`/`index`/`watch`/`setValue`/`errors`/`isDisabled` por prop,
// NÃO instancia o próprio `useFieldArray` (contrato §"Estado").
//
// Campos SEMPRE visíveis (FLD-18..22 do legado, `_card-item.blade.php`):
//   `category_uuid` (SelectAsyncPaginate, obrigatório) / `quantity`
//   (NumberInput, min 1) / `value_unit` (MoneyInput, readonly quando a
//   compra tem `chave` setada — mirror `_card-item.blade.php`: "readonly
//   quando o item pertence a compra com chave") / `amount` (MoneyInput,
//   SEMPRE readonly, `= quantity × value_unit`, recalculado localmente) /
//   `note`.
//
// `item_description` (FLD-23) — readonly, SÓ renderizado quando a compra tem
// `chave` setada (compra veio de import XML, `TASK-CP-08`) — mirror
// `MovementSaleItemForm`/legado.
//
// NÃO RENDERIZADOS (decisão de fidelidade reconciliada, contrato-frontend-
// compras-movimento.md §4.1/§4.2 + task-packet RUN-047, DECISÃO DE ESCOPO
// já tomada pelo Maestro):
//   - `batch_uuid`/`grazing_uuid`/`center_uuid` — ausentes do card de item
//     visível do legado (`_card-item.blade.php`); a API aceita
//     (`sometimes|nullable`) mas não exige — ficam `null` na fábrica
//     (`createEmptyMovementPurchaseItem`, `useMovementPurchases.tsx`).
//   - Os 15 campos fiscais (`cst_*`/`perc_*`/`origem`/`cest`/`cenq_ipi`/
//     `red_bc`/`vbc`/`cfop`/`ncm`) — `MovementPurchaseItemData` (DTO de
//     escrita REAL, confirmado no código do `api_root`) NÃO os aceita; o
//     legado também nunca os exibiu neste card (só na tela de emissão de
//     NFe, fora de escopo, `GAP-CP-01`). Renderizar um sub-bloco "Dados
//     Fiscais (NFe)" editável seria SEM MOCK puro — a API rejeitaria o
//     payload (campo não whitelisted no DTO/Request).
// -----------------------------------------------------------------------------

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';

import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';
import type { MovementPurchaseForm, MovementPurchaseItemForm } from '@/@types/v2/MovementPurchases';

import { computeMovementPurchaseItemAmount } from './useMovementPurchases';

import type { Control, FieldErrors, UseFormWatch } from 'react-hook-form';

export interface MovementPurchaseItemRowProps {
  index: number;
  control: Control<MovementPurchaseForm>;
  errors: FieldErrors<MovementPurchaseForm>;
  watch: UseFormWatch<MovementPurchaseForm>;
  isDisabled: boolean;
  /** Origem fiscal: compra salva com chave ou itens do XML importado. */
  isFiscalLocked?: boolean;
  onRemove: () => void;
}

// Modo COMBINADO (063-est03-9-reprovacoes, TASK-FE-063-14) — `is_enabled` +
// `tenant_cost_center_scoped` juntos: só categorias HABILITADAS e vinculadas
// ao centro de custo do tenant ativo. `findCategoryParams` já era dedicada
// só a este Select — seguro estender direto (sem risco de contaminar outro).
const findCategoryParams = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
  is_enabled: true,
  tenant_cost_center_scoped: true,
});

export function MovementPurchaseItemRow({
  index,
  control,
  errors,
  watch,
  isDisabled,
  isFiscalLocked = false,
  onRemove,
}: MovementPurchaseItemRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.movementPurchases.movementPurchase.form.itemRow;

  const rowErrors = errors.items?.[index];

  // Trava por ORIGEM (paridade legado `_card-item.blade.php:17`), nunca por
  // `watch('chave')`: chave digitada à mão em compra nova NÃO trava.
  const hasChave = isFiscalLocked;

  const valueUnit = Number(watch(`items.${index}.value_unit`)) || 0;
  const computedAmount = computeMovementPurchaseItemAmount({
    ...(watch(`items.${index}`) as MovementPurchaseItemForm),
  });

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Box gridColumn={{ base: 'auto', lg: 'span 2' }}>
          <Controller
            name={`items.${index}.category_uuid`}
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.fields.category}
                placeholder={text.placeholders.category}
                error={rowErrors?.category_uuid?.message as string | undefined}
                service={listCategoryAnimalOptions}
                mapOptions={(item: CategoryAnimalOptionItem) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={findCategoryParams}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </Box>

        <Controller
          name={`items.${index}.quantity`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={text.fields.quantity}
              allowDot={false}
              min={1}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              error={rowErrors?.quantity?.message as string | undefined}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        {/* `value_unit` — readonly quando a compra tem `chave` setada (mirror
            `_card-item.blade.php`: valor vem do XML importado, não é
            digitado manualmente). */}
        {hasChave ? (
          <Box>
            <InputReadOnly
              label={text.fields.valueUnit}
              value={valueUnit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            />
            {/* D5 (088) — unitário > 0 vale também na linha travada (XML). */}
            {rowErrors?.value_unit?.message && (
              <Text fontSize="xs" color="fg.error" mt={1} role="alert">
                {rowErrors.value_unit.message as string}
              </Text>
            )}
          </Box>
        ) : (
          <Controller
            name={`items.${index}.value_unit`}
            control={control}
            render={({ field }) => (
              <MoneyInput
                name={field.name}
                label={text.fields.valueUnit}
                value={field.value ?? 0}
                onValueChange={(value) => field.onChange(value)}
                error={rowErrors?.value_unit?.message as string | undefined}
                disabled={isDisabled}
              />
            )}
          />
        )}

        {/* `amount` — SEMPRE readonly, recalculado localmente (CLM-28: o
            servidor persiste o valor enviado sem recomputar; o front garante
            que o valor enviado É o produto correto). */}
        <InputReadOnly
          label={text.fields.amount}
          value={computedAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        />

        <Controller
          name={`items.${index}.note`}
          control={control}
          render={({ field }) => (
            <Input
              label={text.fields.note}
              name={field.name}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
              disabled={isDisabled}
            />
          )}
        />

        {/* `item_description` (FLD-23) — readonly, só quando `chave` setada
            (mirror `MovementSaleItemForm`/legado). */}
        {hasChave && (
          <InputReadOnly
            label={text.fields.itemDescription}
            value={watch(`items.${index}.item_description`) ?? '—'}
          />
        )}
      </SimpleGrid>

      <Flex justify="flex-end" mt={3}>
        <IconButtonTable
          aria-label={text.removeButton}
          mensegerTooltip={text.removeButton}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={isDisabled}
          onClick={onRemove}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Box>
  );
}
