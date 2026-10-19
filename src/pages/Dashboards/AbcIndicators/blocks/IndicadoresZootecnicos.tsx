// src/pages/Dashboards/AbcIndicators/blocks/IndicadoresZootecnicos.tsx
// Bloco "Indicadores zootécnicos do período" (`ABC-TABLE-01..05`, execução
// 046, TASK-ABC-FE-08) — `DetailGrid` (label | valor | unidade), os 5
// indicadores restantes que fecham os 14 sem sobra (`04-CONTRATO-TELA-abc
// -indicators.md §2`).

import { Grid, Text } from '@chakra-ui/react';

import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import { formatAbcIndicator } from '@/constants/dashboards/abcIndicators/abc-indicator-format';

import type { AbcIndicatorsData } from '@/@types/v2/Dashboards/abcIndicators';

interface IndicadoresZootecnicosProps {
  data: AbcIndicatorsData;
}

export function IndicadoresZootecnicos({ data }: IndicadoresZootecnicosProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.abcIndicators.detailGrid;
  const units = languageGB.dashboards.abcIndicators.units;

  const rows = [
    {
      label: text.totalProductionKg,
      value: formatAbcIndicator('total_production_kg', data.total_production_kg),
      unit: units.kg,
    },
    {
      label: text.productivityKgHa,
      value: formatAbcIndicator('productivity_kg_ha', data.productivity_kg_ha),
      unit: units.kgHa,
    },
    {
      label: text.capacityRateUa,
      value: formatAbcIndicator('capacity_rate_ua', data.capacity_rate_ua),
      unit: units.uaHa,
    },
    {
      label: text.averageEntryWeight,
      value: formatAbcIndicator('average_entry_weight', data.average_entry_weight),
      unit: units.kg,
    },
    {
      label: text.averageConsumption,
      value: formatAbcIndicator('average_consumption', data.average_consumption),
      unit: units.percentPv,
    },
  ];

  return (
    <DashboardCard title={text.title}>
      <Grid
        templateColumns="2fr 1fr 1fr"
        gap="2"
        fontSize="xs"
        color="cardTextSecondary"
        paddingBottom="2"
      >
        <Text fontWeight="medium">{text.label}</Text>
        <Text fontWeight="medium">{text.value}</Text>
        <Text fontWeight="medium">{text.unit}</Text>
      </Grid>
      {rows.map((row, index) => (
        <Grid
          key={row.label}
          templateColumns="2fr 1fr 1fr"
          gap="2"
          alignItems="center"
          paddingY="1.5"
          borderTopWidth={index === 0 ? 0 : '1px'}
          borderColor="cardBorder"
        >
          <Text fontSize="sm" color="cardTextPrimary">
            {row.label}
          </Text>
          <Text fontSize="sm" color="cardTextPrimary" fontWeight="medium">
            {row.value}
          </Text>
          <Text fontSize="sm" color="cardTextSecondary">
            {row.unit}
          </Text>
        </Grid>
      ))}
    </DashboardCard>
  );
}
