// src/pages/Operacional/AnimalFazenda/TransferAnimalFarm/AnimalAggregatesPanel.tsx
// -----------------------------------------------------------------------------
// Painel de indicadores agregados da seleção de animais (97-Esteiras/042,
// TASK-FE-042-104, FLD-013..017) — 5 indicadores (Total/Peso/Peso Médio/
// Total UA/UA Média), 100% derivados de `GET /animal-batches/aggregates`
// (CALC-002, Action já existe no backend) — NUNCA somados/recalculados
// localmente (IG-010: sem seleção zera os indicadores).
// -----------------------------------------------------------------------------

import { SimpleGrid } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';

import { StatCard } from '@/components/cards/StatCard';

import { useLanguage } from '@/hooks/useLanguage';

import { queryKey } from '@/constants/query-key';

import { getAnimalBatchAggregates } from '@/services/v2/Operacional/AnimalFazenda/transferAnimalFarm-service';

// Nomes de campo alinhados ao contrato REAL da API (`BatchAggregatesData`,
// animal-batch-contrato.md §3.2) — QA2 TASK-FE-063-ANIMAL-AGG-01.
const ZERO_AGGREGATES = {
  total_animals: 0,
  total_weight: 0,
  average_weight: 0,
  total_ua: 0,
  average_ua: 0,
};

// Blindado contra undefined/null (rede de segurança contra drift futuro de
// contrato) — não substitui o realinhamento de nomes acima, é defesa extra.
function formatNumber(value: number | undefined | null): string {
  return (value ?? 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export interface AnimalAggregatesPanelProps {
  animalUuids: string[];
}

export function AnimalAggregatesPanel({ animalUuids }: AnimalAggregatesPanelProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.animalFazenda.transferAnimalFarm.form.fields.animalSelector.aggregates;

  const aggregatesQuery = useQuery({
    queryKey: [queryKey.animalFazenda.aggregates, animalUuids],
    queryFn: () => getAnimalBatchAggregates(animalUuids),
    enabled: animalUuids.length > 0,
  });

  // IG-010 — sem seleção (ou ainda carregando), painel zerado.
  const aggregates = animalUuids.length > 0 ? aggregatesQuery.data?.data : ZERO_AGGREGATES;
  const values = aggregates ?? ZERO_AGGREGATES;

  return (
    <SimpleGrid columns={{ base: 2, md: 5 }} gap={4}>
      <StatCard title={text.total} value={values.total_animals} colorScheme="blue" />
      <StatCard title={text.weight} value={formatNumber(values.total_weight)} colorScheme="blue" />
      <StatCard
        title={text.average}
        value={formatNumber(values.average_weight)}
        colorScheme="blue"
      />
      <StatCard title={text.ua} value={formatNumber(values.total_ua)} colorScheme="blue" />
      <StatCard title={text.uaAverage} value={formatNumber(values.average_ua)} colorScheme="blue" />
    </SimpleGrid>
  );
}
