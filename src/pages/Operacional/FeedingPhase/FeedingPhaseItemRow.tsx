// src/pages/Operacional/FeedingPhase/FeedingPhaseItemRow.tsx
// -----------------------------------------------------------------------------
// Linha de composição (item) de Fase de Alimentação (FeedingPhase —
// Operacional/Pecuária/Confinamento, F-034, TASK-FP-FE-03). Mirror
// `DietIngredientRow.tsx` (`useController` por campo, SEM handler global por
// seletor de classe).
//
// Campos (contrato de tela §4.2): "Ordem" (index+1, readonly, server-
// authoritative — nunca no payload), "Dieta" (SelectAsyncPaginate reusando
// `listDietOptionsPaginated` — SEM MOCK, `diet_uuid` no wire), "Regra de
// Troca" (Select da fábrica `feedingPhaseChangeRuleOptions`), "Mínimo/
// Início" e "Máximo/Fim" (NumberInput inteiro min 1, com sufixo de unidade
// dias/kg derivado da Regra de Troca da PRÓPRIA linha, CV-03).
//
// Validação IMEDIATA pós-preenchimento (Esteira 051, AUTORIZADA pelo dono
// — ajuste de fidelidade IG-02/IG-03): ao `blur` de `minimum_start`/
// `maximum_end`, ou à TROCA de `change_rule`, valida intra-item + cross-
// item (`feeding-phase-items-validation.ts`) e, se inválido, marca o erro
// inline (`error=`, já suportado pelos campos) + dispara Toast — SEM
// limpar o valor digitado (decisão do dono, diverge do legado só nesse
// detalhe). Quando volta a ficar válido, o erro manual é limpo
// (`clearErrors`) sem tocar o restante do `formState` (Yup continua dono
// de required/integer/min(1)).
// -----------------------------------------------------------------------------

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import {
  Control,
  UseFormClearErrors,
  UseFormGetValues,
  UseFormSetError,
  useController,
} from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { feedingPhaseChangeRuleUnit } from '@/constants/feeding-phase/feeding-phase-change-rule';
import { feedingPhaseChangeRuleOptions } from '@/constants/feeding-phase/options';

import {
  feedingPhaseItemValidationMessages,
  validateFeedingPhaseItemMaximumEnd,
  validateFeedingPhaseItemMinimumStart,
} from '@/validations/schemas/FeedingPhase/feeding-phase-items-validation';

import { listDietOptionsPaginated } from '@/services/v2/Diets/diet-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { FeedingPhaseChangeRule, FeedingPhaseItemForm } from '@/@types/v2/FeedingPhases';

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

function mapDietOption(item: Option<string>) {
  return { label: item.label, value: item.value };
}

export interface FeedingPhaseItemsFieldValues {
  items: FeedingPhaseItemForm[];
}

interface FeedingPhaseItemRowProps {
  control: Control<FeedingPhaseItemsFieldValues>;
  index: number;
  remove: (index: number) => void;
  languageGB: LanguageDate;
  disabled: boolean;
  /** `getValues`/`setError`/`clearErrors` do `useForm` do formulário PAI
   *  (`FeedingPhaseForm`) — necessários para a validação IMEDIATA
   *  cross-item (Esteira 051), que precisa enxergar TODOS os itens, não só
   *  o da própria linha. */
  getValues: UseFormGetValues<FeedingPhaseItemsFieldValues>;
  setError: UseFormSetError<FeedingPhaseItemsFieldValues>;
  clearErrors: UseFormClearErrors<FeedingPhaseItemsFieldValues>;
}

export function FeedingPhaseItemRow({
  control,
  index,
  remove,
  languageGB,
  disabled,
  getValues,
  setError,
  clearErrors,
}: FeedingPhaseItemRowProps) {
  const text = languageGB.feedingPhases.feedingPhase.form;
  const validationMessages = feedingPhaseItemValidationMessages(languageGB);

  const { field: dietField, fieldState: dietFieldState } = useController({
    control,
    name: `items.${index}.diet_id`,
  });
  const { field: changeRuleField, fieldState: changeRuleFieldState } = useController({
    control,
    name: `items.${index}.change_rule`,
  });
  const { field: minimumStartField, fieldState: minimumStartFieldState } = useController({
    control,
    name: `items.${index}.minimum_start`,
  });
  const { field: maximumEndField, fieldState: maximumEndFieldState } = useController({
    control,
    name: `items.${index}.maximum_end`,
  });

  // Unidade dinâmica dias/kg (CV-03) — deriva do valor selecionado na
  // PRÓPRIA linha, nunca duplica lógica solta (mirror do racional do enum
  // server-side `unitLabel()`).
  const changeRuleValue = changeRuleField.value?.value as FeedingPhaseChangeRule | undefined;
  const unitLabel = changeRuleValue ? feedingPhaseChangeRuleUnit[changeRuleValue] : undefined;
  const minimumStartLabel = unitLabel
    ? `${text.items.minimumStart} (${unitLabel})`
    : text.items.minimumStart;
  const maximumEndLabel = unitLabel
    ? `${text.items.maximumEnd} (${unitLabel})`
    : text.items.maximumEnd;

  const changeRuleOptions = feedingPhaseChangeRuleOptions.options(languageGB);

  // Validação IMEDIATA pós-preenchimento (Esteira 051) — dispara Toast +
  // marca o erro inline via `setError`, SEM limpar o valor digitado
  // (decisão do dono). `clearErrors` some quando a checagem volta a passar
  // (ex.: o dev corrige o item vizinho primeiro).
  function reportFieldValidation(
    name: `items.${number}.minimum_start` | `items.${number}.maximum_end`,
    message: string | undefined
  ) {
    if (message) {
      setError(name, { type: 'manual', message });
      toaster.create({ type: 'error', title: message });
      return;
    }
    clearErrors(name);
  }

  function handleMinimumStartBlur() {
    const items = getValues('items');
    reportFieldValidation(
      `items.${index}.minimum_start`,
      validateFeedingPhaseItemMinimumStart(items, index, validationMessages)
    );
  }

  function handleMaximumEndBlur() {
    const items = getValues('items');
    reportFieldValidation(
      `items.${index}.maximum_end`,
      validateFeedingPhaseItemMaximumEnd(items, index, validationMessages)
    );
  }

  // Troca de Regra de Troca muda o GRUPO de comparação cross-item (CV-03) —
  // revalida IMEDIATAMENTE ambos os campos desta linha contra os NOVOS
  // vizinhos de mesma regra (item anterior/próximo continuam intocados,
  // fora do escopo desta linha).
  function handleChangeRuleChange(option: Option<FeedingPhaseChangeRule> | null) {
    changeRuleField.onChange(option ?? null);

    const items = getValues('items').map((item, itemIndex) =>
      itemIndex === index ? { ...item, change_rule: option ?? null } : item
    );

    reportFieldValidation(
      `items.${index}.minimum_start`,
      validateFeedingPhaseItemMinimumStart(items, index, validationMessages)
    );
    reportFieldValidation(
      `items.${index}.maximum_end`,
      validateFeedingPhaseItemMaximumEnd(items, index, validationMessages)
    );
  }

  return (
    <Flex gap={3} align="flex-start" wrap="wrap">
      <Box w={{ base: 'full', sm: '90px' }}>
        <Text fontSize="sm" color="fg.muted" mb={1}>
          {text.items.sequence}
        </Text>
        <Text fontSize="sm" fontWeight="semibold" fontVariantNumeric="tabular-nums">
          {index + 1}
        </Text>
      </Box>

      <Box flex="1" minW="220px">
        <SelectAsyncPaginate
          name={dietField.name}
          label={text.items.diet}
          service={listDietOptionsPaginated}
          mapOptions={mapDietOption}
          findParams={findParamsFromSearch}
          value={dietField.value ?? undefined}
          onChange={(option: any) => dietField.onChange(option ?? null)}
          error={dietFieldState.error?.message}
          isRequired
          isDisabled={disabled}
        />
      </Box>

      <Box flex="1" minW="160px">
        <Select
          name={changeRuleField.name}
          label={text.items.changeRule}
          value={changeRuleField.value ?? undefined}
          onChange={(option: any) => handleChangeRuleChange(option ?? null)}
          options={changeRuleOptions}
          isDisabled={disabled}
          error={changeRuleFieldState.error?.message}
          isRequired
        />
      </Box>

      <Box w={{ base: 'full', sm: '170px' }}>
        <NumberInput
          name={minimumStartField.name}
          label={minimumStartLabel}
          min={1}
          value={Number(minimumStartField.value) || 0}
          onValueChange={(value) => minimumStartField.onChange(value ?? 0)}
          onBlur={handleMinimumStartBlur}
          disabled={disabled}
          isRequired
          error={minimumStartFieldState.error?.message}
        />
      </Box>

      <Box w={{ base: 'full', sm: '170px' }}>
        <NumberInput
          name={maximumEndField.name}
          label={maximumEndLabel}
          min={1}
          value={Number(maximumEndField.value) || 0}
          onValueChange={(value) => maximumEndField.onChange(value ?? 0)}
          onBlur={handleMaximumEndBlur}
          disabled={disabled}
          isRequired
          error={maximumEndFieldState.error?.message}
        />
      </Box>

      <Flex direction="column" gap="1.5">
        <Flex alignItems="center" fontSize="14px" visibility="hidden">
          {text.items.removeItem}
        </Flex>
        <IconButtonTable
          aria-label={text.items.removeItem}
          mensegerTooltip={text.items.removeItem}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={disabled}
          onClick={() => remove(index)}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Flex>
  );
}
