// src/pages/Operacional/FindAnimal/MotherPanel.tsx
// -----------------------------------------------------------------------------
// Painel "Mãe" do dossiê da tela "Localizar Animal" (F-042, TASK-FA-FE-04,
// SURF-PANEL-MOTHER-DETAIL). Guarda: `mother !== null`.
//
// A mãe já chega RESOLVIDA pela API (`birth->mother`, contrato de tela §5.1) —
// o front NÃO recompõe essa regra e NÃO usa `animal_mother_id` (Regra 1/§8 do
// contrato de tela). Campos e ordem exatos: Identificação · Categoria · Idade
// · Peso Atual (mesmo shape de `AnimalDetailPanel`, sem `Id Pai`).
// -----------------------------------------------------------------------------

import { Heading, VStack } from '@chakra-ui/react';

import { DisplayFieldGroup } from '@/components/DisplayFieldGroup';

import { useLanguage } from '@/hooks/useLanguage';

import type { FindAnimalMother } from '@/@types/v2/Livestock/findAnimal';

import { formatDecimalPtBr } from './AnimalDetailPanel';

interface MotherPanelProps {
  mother: FindAnimalMother | null;
}

export function MotherPanel({ mother }: MotherPanelProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.livestock.findAnimal;

  // Regra 1 — condicional só pela nulidade do sub-objeto.
  if (mother === null) return null;

  return (
    <VStack align="stretch" gap={2}>
      <Heading as="h2" fontSize="lg" fontWeight="semibold" color="brandColorText">
        {text.panels.mother}
      </Heading>
      <DisplayFieldGroup
        loading={false}
        displayFields={[
          { label: text.fields.identification, value: mother.identification },
          { label: text.fields.category, value: mother.category.label },
          { label: text.fields.age, value: mother.age ?? '' },
          { label: text.fields.weight, value: formatDecimalPtBr(mother.weight) },
        ]}
      />
    </VStack>
  );
}
