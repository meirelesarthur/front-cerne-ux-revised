// src/pages/Operacional/FindAnimal/AnimalDetailPanel.tsx
// -----------------------------------------------------------------------------
// Painel "Animal" do dossiê da tela "Localizar Animal" (FindAnimal —
// Operacional > Pecuária > Manejo, F-042, TASK-FA-FE-04, SURF-PANEL-ANIMAL-
// DETAIL). Único painel SEM guarda de nulidade — `data.animal` é o único
// bloco sempre presente no envelope (contrato de tela §5.1).
//
// Campos e ordem EXATOS do contrato de tela §6.3/§7: Identificação · Categoria
// · Idade · Peso Atual · Id Pai. `age`/`identification` chegam prontos da API
// — exibidos CRUS, sem recalcular/pluralizar/reprocessar (Regra 4 da Tarefa).
// `weight` formatado 2 casas, milhar '.', decimal ',', SEM unidade/símbolo
// (`formatDecimalPtBr`, export nomeado — reusado por `MotherPanel.tsx` e
// `BatchLocationPanel.tsx`, nenhum arquivo global novo).
//
// `DisplayField`/`DisplayFieldGroup` (`src/components/`) — nunca
// `<Input isReadOnly>` para dado derivado (anti-padrão proibido pelo
// `get_pwa_ui_components_pattern`, confirmado nesta execução: DisplayField/
// DisplayFieldGroup são V2 no catálogo genérico, mas SÃO os componentes reais
// deste repositório, já em sintaxe Chakra v3 — precedência do repositório
// real sobre a nota genérica).
// -----------------------------------------------------------------------------

import { Heading, VStack } from '@chakra-ui/react';

import { DisplayFieldGroup } from '@/components/DisplayFieldGroup';

import { useLanguage } from '@/hooks/useLanguage';

import type { FindAnimalAnimal } from '@/@types/v2/Livestock/findAnimal';

interface AnimalDetailPanelProps {
  animal: FindAnimalAnimal;
}

/**
 * Formata um número no padrão decimal pt-BR (milhar `.`, decimal `,`, 2
 * casas, SEM unidade/símbolo) — mirror do padrão real `transformNumberToStringKg`
 * (`src/utils/transformNumberToStringKg.ts`), só sem o sufixo de unidade.
 * Usado por `weight` (Animal/Mãe) e pelos 3 campos de área do lote (D2,
 * `GAP-FE-FA-02`). `null`/`undefined`/`NaN` → `"0,00"` (espelha o helper
 * `money()` do legado).
 * @param {number | null | undefined} value - Valor numérico cru.
 * @return {string} Valor formatado, ex.: `"1.234,50"`.
 */
export function formatDecimalPtBr(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0,00';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AnimalDetailPanel({ animal }: AnimalDetailPanelProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.livestock.findAnimal;

  return (
    <VStack align="stretch" gap={2}>
      <Heading as="h2" fontSize="lg" fontWeight="semibold" color="brandColorText">
        {text.panels.animal}
      </Heading>
      <DisplayFieldGroup
        loading={false}
        displayFields={[
          { label: text.fields.identification, value: animal.identification },
          { label: text.fields.category, value: animal.category.label },
          // `age` cru da API — string vazia quando `null` (Regra 3, "campo vazio").
          { label: text.fields.age, value: animal.age ?? '' },
          { label: text.fields.weight, value: formatDecimalPtBr(animal.weight) },
          { label: text.fields.father, value: animal.father ?? '' },
        ]}
      />
    </VStack>
  );
}
