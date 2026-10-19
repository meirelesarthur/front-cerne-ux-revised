// src/pages/Operacional/AnimalFazenda/TransferAnimalFarm/AnimalCategorySelector.tsx
// -----------------------------------------------------------------------------
// Seletor de animais agrupado por categoria (97-Esteiras/042, TASK-FE-042-104,
// §4.2.1 do contrato-frontend) — peça NOVA, SEM precedente no
// `frontend_root` (a irmã `TransferBatchFarm` transfere 1 lote inteiro, não
// uma seleção de animais individuais; `TransferAbcAnimalsEditor.tsx` é um
// repeater linha-a-linha de OUTRA feature, estrutura incompatível).
//
// Fonte: `field_manifest` FLD-012..017 + `interaction_graph`
// IG-008/009/010/011/012. `batchUuid`/`categoryFilterUuids` são CONTROLADOS
// pelo formulário pai (`CreateOrUpdateTransferAnimalFarm.tsx`, que renderiza
// os próprios campos de filtro FLD-008/009 e limpa `animal_uuids` ao trocar
// de lote/categoria — mesma cascata documentada em `useCascadesWeaning`) —
// este componente só CONSOME o filtro já resolvido, dispara
// `eligible-animals` e resolve a seleção (`animal_uuids`).
//
// "Marcar todos"/"Desmarcar todos" — AMBOS funcionais nos 2 sentidos (◈ §7.1
// do contrato-frontend: o legado tem um handler morto de "Desmarcar todos",
// aqui é implementado como ação real, não réplica do defeito).
// -----------------------------------------------------------------------------

import { Box, Card, Flex, HStack, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { Checkbox } from '@/components/ui/checkbox';

import { useLanguage } from '@/hooks/useLanguage';

import { queryKey } from '@/constants/query-key';

import { listEligibleAnimalsForTransferAnimalFarm } from '@/services/v2/Operacional/AnimalFazenda/transferAnimalFarm-service';

import type { TransferAnimalFarmEligibleAnimal } from '@/@types/v2/Operacional/AnimalFazenda/transferAnimalFarm';

export interface AnimalCategorySelectorProps {
  batchUuid: string | null;
  categoryFilterUuids: string[];
  /** `animal_uuids` selecionados (FLD-012) — array de STRING, não `Option[]`. */
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function AnimalCategorySelector({
  batchUuid,
  categoryFilterUuids,
  value,
  onChange,
  disabled = false,
}: AnimalCategorySelectorProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.animalFazenda.transferAnimalFarm.form.fields.animalSelector;

  const hasFilter = !!batchUuid || categoryFilterUuids.length > 0;

  const eligibleAnimalsQuery = useQuery({
    queryKey: [queryKey.animalFazenda.eligibleAnimals, batchUuid, categoryFilterUuids],
    queryFn: () =>
      listEligibleAnimalsForTransferAnimalFarm({
        batch_uuid: batchUuid,
        categories: batchUuid ? undefined : categoryFilterUuids,
      }),
    enabled: hasFilter,
  });

  const byCategory = eligibleAnimalsQuery.data?.data ?? {};
  const categoryLabels = Object.keys(byCategory);
  const selectedSet = new Set(value);

  function toggleAnimal(animalUuid: string, checked: boolean) {
    if (disabled) return;
    if (checked) {
      onChange([...value, animalUuid]);
    } else {
      onChange(value.filter((uuid) => uuid !== animalUuid));
    }
  }

  function selectAllInCategory(animals: TransferAnimalFarmEligibleAnimal[]) {
    if (disabled) return;
    const uuidsInCategory = animals.map((animal) => animal.uuid);
    const merged = new Set([...value, ...uuidsInCategory]);
    onChange(Array.from(merged));
  }

  // ◈ §7.1 do contrato-frontend — funcional (o legado tinha handler morto
  // aqui, não réplica do defeito).
  function unselectAllInCategory(animals: TransferAnimalFarmEligibleAnimal[]) {
    if (disabled) return;
    const uuidsInCategory = new Set(animals.map((animal) => animal.uuid));
    onChange(value.filter((uuid) => !uuidsInCategory.has(uuid)));
  }

  if (!hasFilter) {
    return (
      <Box py={4}>
        <Text fontSize="sm" color="fg.muted">
          {text.emptyFilter}
        </Text>
      </Box>
    );
  }

  if (!eligibleAnimalsQuery.isLoading && categoryLabels.length === 0) {
    return (
      <Box py={4}>
        <Text fontSize="sm" color="fg.muted">
          {text.emptyAnimals}
        </Text>
      </Box>
    );
  }

  return (
    <Flex direction="column" gap={4}>
      {categoryLabels.map((categoryLabel) => {
        const animals = byCategory[categoryLabel] ?? [];
        const selectedInCategory = animals.filter((animal) => selectedSet.has(animal.uuid)).length;

        return (
          <Card.Root key={categoryLabel} variant="outline" size="sm">
            <Card.Header>
              <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                <Text fontSize="sm" fontWeight="semibold">
                  {categoryLabel} — {selectedInCategory}/{animals.length} {text.selectedOfTotal}
                </Text>
                <HStack gap={2}>
                  <Button
                    type="button"
                    title={text.selectAllButton}
                    variant="outline"
                    size="xs"
                    onClick={() => selectAllInCategory(animals)}
                    disabled={disabled}
                  />
                  <Button
                    type="button"
                    title={text.unselectAllButton}
                    variant="outline"
                    size="xs"
                    onClick={() => unselectAllInCategory(animals)}
                    disabled={disabled}
                  />
                </HStack>
              </Flex>
            </Card.Header>
            <Card.Body>
              {/* Item B (063-est03-9-reprovacoes) — altura fixa + scroll
                  interno (nunca `flex=1` isolado sem teto, lição da 062):
                  com centenas de animais (ex.: 727) o card não pode crescer
                  sem limite e empurrar o resto do formulário. Cada card de
                  categoria rola INDEPENDENTEMENTE — o scroll fica aqui, não
                  no `Flex` externo que empilha os cards. */}
              <Flex
                direction="column"
                gap={2}
                maxHeight="320px"
                overflowY="auto"
                paddingRight="1"
                css={{ '&::-webkit-scrollbar': { display: 'none' } }}
              >
                {animals.map((animal) => (
                  <Checkbox
                    key={animal.uuid}
                    checked={selectedSet.has(animal.uuid)}
                    onCheckedChange={(details: { checked: boolean | 'indeterminate' }) =>
                      toggleAnimal(animal.uuid, details.checked === true)
                    }
                    disabled={disabled}
                  >
                    {animal.identification}
                  </Checkbox>
                ))}
              </Flex>
            </Card.Body>
          </Card.Root>
        );
      })}
    </Flex>
  );
}
