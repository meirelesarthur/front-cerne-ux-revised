// src/pages/Operacional/FindAnimal/ReproductivePanel.tsx
// -----------------------------------------------------------------------------
// Painel "Reprodutivo" do dossiê da tela "Localizar Animal" (F-042,
// TASK-FA-FE-04, SURF-PANEL-REPRODUCTIVE). Guarda: `reproductive !== null`.
//
// PROIBIDO reimplementar `category_id IN (1,2,3)` — a API já resolveu essa
// regra (o literal mágico está rastreado como `GAP-FA-01` na camada api); o
// front só decide pela nulidade do bloco (Regra 1 da Tarefa).
//
// Fallbacks EXATOS (Regra 3, cada um DISTINTO — não uniformizar):
//   - `category_matrix` nulo             → `placeholders.notInformed`
//   - `reproductive_status` nulo OU com `label: null` → `placeholders.notInformed`
//   - `last_semen` nulo                  → STRING VAZIA (nunca "Não Informado")
// -----------------------------------------------------------------------------

import { Heading, VStack } from '@chakra-ui/react';

import { DisplayFieldGroup } from '@/components/DisplayFieldGroup';

import { useLanguage } from '@/hooks/useLanguage';

import type { FindAnimalReproductive } from '@/@types/v2/Livestock/findAnimal';

interface ReproductivePanelProps {
  reproductive: FindAnimalReproductive | null;
}

export function ReproductivePanel({ reproductive }: ReproductivePanelProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.livestock.findAnimal;

  // Regra 1 — condicional só pela nulidade do sub-objeto, nenhum recálculo.
  if (reproductive === null) return null;

  return (
    <VStack align="stretch" gap={2}>
      <Heading as="h2" fontSize="lg" fontWeight="semibold" color="brandColorText">
        {text.panels.reproductive}
      </Heading>
      <DisplayFieldGroup
        loading={false}
        displayFields={[
          {
            label: text.fields.categoryMatrix,
            value: reproductive.category_matrix?.label ?? text.placeholders.notInformed,
          },
          {
            // `reproductive_status` nulo OU `.label` nulo → "Não Informado" —
            // o encadeamento `?.` + `??` cobre as DUAS origens do fallback.
            label: text.fields.reproductiveStatus,
            value: reproductive.reproductive_status?.label ?? text.placeholders.notInformed,
          },
          {
            // `last_semen` nulo → string vazia. Comportamento do legado
            // preservado deliberadamente (Regra 3) — NÃO trocar por
            // `placeholders.notInformed`.
            label: text.fields.lastSemen,
            value: reproductive.last_semen ?? '',
          },
        ]}
      />
    </VStack>
  );
}
