// src/pages/Dashboards/RainfallDashboard/blocks/JanelaAplicacao.tsx
// Bloco "Janela de aplicação" — status/cor/mensagem vindos 100% da API
// (Open-Meteo + regra de negócio do legado), nunca calculados no front.
//
// **CORREÇÃO PÓS-E2E (048):** o payload real é `{status,color,message,source}`
// — `status` é TEXTO LIVRE (`"Atenção"`, não um enum `excellent`/`warning`/
// `unviable`/`unavailable`) e `color` é o HEX que a própria API publica
// (`"#ffc107"`) — a versão anterior lia um enum inexistente
// (`rainfallApplicationWindowColor[data.status]` sempre `undefined`,
// `text.status[data.status]` também) e o campo `source_label` (renomeado
// `source`). Cor aplicada via `style` inline com o HEX da API — dado do
// backend, não escolha de design do front (mesmo racional do `color` dos
// KPIs de Pecuária).

import { Badge, Text } from '@chakra-ui/react';

import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import type { RainfallApplicationWindow } from '@/@types/v2/Dashboards/rainfallDashboard';

interface JanelaAplicacaoProps {
  data: RainfallApplicationWindow | null;
}

export function JanelaAplicacao({ data }: JanelaAplicacaoProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.rainfallDashboard.applicationWindow;
  const commonText = languageGB.dashboards.common;

  return (
    <DashboardCard flex={1} minWidth={220} title={text.title}>
      {data ? (
        <>
          <Badge
            marginBottom="2"
            style={{ color: data.color, borderColor: data.color, background: 'transparent' }}
            borderWidth="1px"
          >
            {data.status}
          </Badge>
          <Text fontSize="sm" color="cardTextSecondary" marginBottom="2">
            {data.message}
          </Text>
          <Text fontSize="xs" color="cardTextSecondary">
            {data.source}
          </Text>
        </>
      ) : (
        <Text fontSize="sm" color="cardTextSecondary">
          {commonText.noData}
        </Text>
      )}
    </DashboardCard>
  );
}
