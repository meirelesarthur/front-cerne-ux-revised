// src/pages/Operacional/HarvestProduct/HarvestProductBoxesFieldArray.tsx
// -----------------------------------------------------------------------------
// Subcadastro GRID repetível `boxes[]` (Colheita de Frutas — HarvestProduct,
// Operacional / Agricultura, F-040, execução 040, TASK-FE-1098) — peça mais
// crítica de fidelidade: no legado, a guarda "ao menos uma caixa" era FURADA
// no `store()` (DIV-01); agora o backend retorna 422 real, e o front aplica a
// MESMA guarda no client (Yup `.min(1)`, TASK-FE-1092).
//
// `useFieldArray({ control, name: 'boxes' })` vive no formulário PAI
// (`CreateOrUpdateHarvestProduct.tsx`) — mesmo desenho de
// `ProtocolSeasonItemsFieldArray.tsx` (contrato §7.3-bis, `useFieldArray`
// NÃO documentado nas tools `get_pwa_*` — LACUNA registrada, autorização
// explícita do dono + precedente `ProtocoloEstacao`/`LoteReproducao` cobre o
// gap): `control`/`fields`/`append`/`remove` chegam por prop, este componente
// só renderiza linhas.
//
// D3 (contrato §7.10) — `KgInput` com `decimalPlaces={5}`: preserva as 5
// casas físicas que o backend agora expõe/armazena (`decimal(12,5)`),
// evitando reintroduzir o defeito DIV-03 ("editar sobrescreve com 2 casas").
//
// Remover linha (`remove(index)`) SEM a trava visual do legado de "não zerar
// a lista" (contrato §7.7) — o Yup `.min(1)` já bloqueia o submit vazio,
// então a UI permite remover a última linha e mostra o erro de array (mais
// simples que replicar a trava JS do legado, registrado como melhoria).
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { KgInput } from '@/components/Form/kgInput';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import type { HarvestProductForm } from '@/@types/v2/HarvestProduct';

export interface HarvestProductBoxesFieldArrayProps {
  control: Control<HarvestProductForm>;
  fields: FieldArrayWithId<HarvestProductForm, 'boxes', 'id'>[];
  append: UseFieldArrayAppend<HarvestProductForm, 'boxes'>;
  remove: UseFieldArrayRemove;
  errors: FieldErrors<HarvestProductForm>;
  disabled?: boolean;
}

export function HarvestProductBoxesFieldArray({
  control,
  fields,
  append,
  remove,
  errors,
  disabled = false,
}: HarvestProductBoxesFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.harvestProduct.form;

  // Erro de array inteiro (regra `.min(1)`) — mensagem `boxesMinOne`
  // (TASK-FE-1093), paridade de intenção com "Adicione ao menos uma caixa
  // antes de salvar." do legado.
  const arrayError = (errors.boxes as any)?.message as string | undefined;

  function handleAdd() {
    append({ uuid: undefined, amount: null });
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {text.boxesSectionTitle}
      </Text>

      {arrayError && (
        <Box mb={4}>
          <Text fontSize="sm" color="fg.error">
            {arrayError}
          </Text>
        </Box>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || text.boxesSectionTitle}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => {
            // erro por linha — `(errors.boxes as any)?.[index]?.amount?.message`.
            const rowError = (errors.boxes as any)?.[index]?.amount?.message as string | undefined;

            return (
              <Flex key={field.id} align="flex-end" gap={4}>
                <Box flex="1" maxW={{ base: 'full', md: '280px' }}>
                  <Controller
                    name={`boxes.${index}.amount`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <KgInput
                        name={controllerField.name}
                        label={text.boxAmount}
                        value={controllerField.value ?? ''}
                        onChange={(_event, _masked, floatValue) =>
                          controllerField.onChange(floatValue)
                        }
                        allowDot
                        decimalPlaces={5}
                        error={rowError}
                        isRequired
                        disabled={disabled}
                      />
                    )}
                  />
                </Box>

                <IconButtonTable
                  aria-label={text.removeBoxButton}
                  mensegerTooltip={text.removeBoxButton}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => remove(index)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            );
          })}
        </Flex>
      )}

      <Button
        type="button"
        title={text.addBoxButton}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}

export default HarvestProductBoxesFieldArray;
