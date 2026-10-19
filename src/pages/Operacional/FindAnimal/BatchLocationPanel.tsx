// src/pages/Operacional/FindAnimal/BatchLocationPanel.tsx
// -----------------------------------------------------------------------------
// Painel "Lote / Módulo / Área" do dossiê da tela "Localizar Animal" (F-042,
// TASK-FA-FE-04, SURF-PANEL-BATCH-DETAIL). Guarda principal: `batch !== null`
// — senão renderiza só `emptyState.noBatchLinked` e **Módulo/Área somem
// juntos** (Regra 3 da Tarefa: "batch nulo → Módulo/Área somem juntos").
//
// Quando `batch !== null`, `grazing` e `area` são condicionais
// INDEPENDENTES aninhadas dentro deste painel (Regra 1/contrato §6.3):
//   - sub-bloco `Módulo` só se `grazing !== null`
//   - sub-bloco `Área` só se `area !== null`
//
// Formatação (Regra 4): `quantity_animal` inteiro cru sem separador de
// milhar; `total_area`/`productive_area`/`unproductive_area` com
// `formatDecimalPtBr` (2 casas, D2); `recreation_area` NÚMERO CRU `0`/`1`,
// nunca traduzido para Sim/Não (D2, `GAP-FE-FA-02`). `employee_name` nulo →
// `placeholders.dash`.
//
// `Lote Atual` (`current_batches`) NÃO é renderizado aqui — pertence à área
// de transferência (`BatchTransferForm.tsx`, TASK-FA-FE-05; manifesto FID-G3F
// §3.5/§3.6 lista "Lote Atual" sempre ao lado de "Transferir para Lote").
// -----------------------------------------------------------------------------

import { Heading, Text, VStack } from '@chakra-ui/react';

import { DisplayFieldGroup } from '@/components/DisplayFieldGroup';

import { useLanguage } from '@/hooks/useLanguage';

import type {
  FindAnimalArea,
  FindAnimalBatch,
  FindAnimalGrazing,
} from '@/@types/v2/Livestock/findAnimal';

import { formatDecimalPtBr } from './AnimalDetailPanel';

interface BatchLocationPanelProps {
  batch: FindAnimalBatch | null;
  grazing: FindAnimalGrazing | null;
  area: FindAnimalArea | null;
}

export function BatchLocationPanel({ batch, grazing, area }: BatchLocationPanelProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.livestock.findAnimal;

  // Regra 3 — `batch` nulo: mensagem única, Módulo/Área somem juntos (nem
  // avaliamos `grazing`/`area` neste ramo).
  if (batch === null) {
    return (
      <VStack align="stretch" gap={2}>
        <Heading as="h2" fontSize="lg" fontWeight="semibold" color="brandColorText">
          {text.panels.batch}
        </Heading>
        <Text color="fg.muted">{text.emptyState.noBatchLinked}</Text>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" gap={4}>
      <VStack align="stretch" gap={2}>
        <Heading as="h2" fontSize="lg" fontWeight="semibold" color="brandColorText">
          {`${text.panels.batch}: ${batch.description}`}
        </Heading>
        <DisplayFieldGroup
          loading={false}
          displayFields={[
            { label: text.fields.code, value: batch.code },
            // Inteiro cru, SEM separador de milhar (Regra 4).
            { label: text.fields.quantityAnimal, value: batch.quantity_animal },
            {
              label: text.fields.employeeName,
              value: batch.employee_name ?? text.placeholders.dash,
            },
          ]}
        />
      </VStack>

      {grazing !== null && (
        <VStack align="stretch" gap={2}>
          <Heading as="h3" fontSize="md" fontWeight="semibold" color="brandColorText">
            {text.panels.grazing}
          </Heading>
          <DisplayFieldGroup
            loading={false}
            displayFields={[
              { label: text.fields.description, value: grazing.description },
              { label: text.fields.fodder, value: grazing.fodder.label },
            ]}
          />
        </VStack>
      )}

      {area !== null && (
        <VStack align="stretch" gap={2}>
          <Heading as="h3" fontSize="md" fontWeight="semibold" color="brandColorText">
            {text.panels.area}
          </Heading>
          <DisplayFieldGroup
            loading={false}
            displayFields={[
              { label: text.fields.description, value: area.description },
              { label: text.fields.totalArea, value: formatDecimalPtBr(area.total_area) },
              {
                // D2/GAP-FE-FA-02 — `tinyInteger` 0/1 preservado CRU, defeito de
                // domínio do legado (rótulo "Área de Lazer" para um booleano
                // numérico). NÃO traduzir para Sim/Não.
                label: text.fields.recreationArea,
                value: area.recreation_area,
              },
              {
                label: text.fields.productiveArea,
                value: formatDecimalPtBr(area.productive_area),
              },
              {
                label: text.fields.unproductiveArea,
                value: formatDecimalPtBr(area.unproductive_area),
              },
            ]}
          />
        </VStack>
      )}
    </VStack>
  );
}
