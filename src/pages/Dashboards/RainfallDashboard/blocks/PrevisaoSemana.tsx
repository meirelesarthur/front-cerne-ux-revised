// src/pages/Dashboards/RainfallDashboard/blocks/PrevisaoSemana.tsx
// Bloco "Previsão da semana" — tira de dias (Open-Meteo `daily` + regra do
// legado), mirror `PrevisaoSemana`/`WeatherIcon` da Referência UX.
//
// **CORREÇÃO PÓS-E2E (048):** payload real é
// `{day_name,temp_max,temp_min,precipitation,icon}` — `day_name` já vem
// LOCALIZADO pelo backend (ex. `"Quarta"`), sem `date`; `icon` é uma classe
// Font Awesome do legado (ex. `"fas fa-cloud-showers-heavy text-primary"`).
// A versão anterior lia `day.date` (inexistente) para computar o dia da
// semana via `Intl.DateTimeFormat` — sempre `undefined`.
//
// **MAPA GRANULAR DE ÍCONES (048, ajuste "Previsão da semana"):** o backend
// passou a decidir `icon` pela PRECIPITAÇÃO real do dia (dia seco →
// `fa-sun`; faixas de chuva/forte/tempestade) e expõe `weather_code` (WMO)
// em paralelo — mas o ícone do front continua derivado só de `icon`
// (classe Font Awesome), nunca de `weather_code`. `weatherIconFromClass`
// antes colapsava `fa-cloud-rain` (garoa) e `fa-cloud-showers-heavy`
// (chuva forte) no MESMO ícone azul via regex raso `/rain|shower/`, e
// nunca mapeava `fa-cloud-sun` (parcialmente nublado) para sol — os 7 dias
// pareciam idênticos. Agora cada classe tem ícone e/ou tom distintos.

import { Flex, SimpleGrid, Text } from '@chakra-ui/react';
import {
  FiCloud,
  FiCloudDrizzle,
  FiCloudLightning,
  FiCloudRain,
  FiCloudSnow,
  FiDroplet,
  FiSun,
} from 'react-icons/fi';

import { DashboardCard } from '@/components/Dashboard';
import { Icon } from '@/components/Icon';

import { useLanguage } from '@/hooks/useLanguage';

import type { RainfallWeekForecastDay } from '@/@types/v2/Dashboards/rainfallDashboard';

import type { IconType } from 'react-icons';

interface PrevisaoSemanaProps {
  data: RainfallWeekForecastDay[];
}

interface WeatherIconMatch {
  icon: IconType;
  /** Token de cor Chakra COMPLETO (família + shade), ex. `"blue.700"` — nunca só a família, para permitir tons distintos dentro da mesma cor-base (garoa vs chuva forte). */
  tone: string;
}

/**
 * Infere o ícone/tom pela classe Font Awesome REAL que a API publica
 * (`day.icon`, ex. `"fas fa-cloud-showers-heavy text-primary"`), decidida
 * pelo backend a partir da precipitação real do dia. Distingue TODAS as
 * classes que o backend pode emitir: `fa-sun`, `fa-cloud-sun`,
 * `fa-cloud-rain`, `fa-cloud-showers-heavy`, `fa-bolt`, `fa-snowflake`,
 * `fa-smog`, `fa-cloud` (fallback). Nunca lê `weather_code` (WMO) —
 * a regra continua ancorada na classe Font Awesome.
 * @param {string} iconClass - Classe Font Awesome vinda da API.
 * @return {WeatherIconMatch} Ícone react-icons (`icon`) + tom Chakra completo (`tone`).
 */
function weatherIconFromClass(iconClass: string): WeatherIconMatch {
  const normalized = iconClass.toLowerCase();

  // Tempestade (`fa-bolt`) — antes de qualquer checagem de nuvem/chuva.
  if (/bolt|lightning|storm|thunder/.test(normalized)) {
    return { icon: FiCloudLightning, tone: 'purple.600' };
  }
  // Neve (`fa-snowflake`).
  if (/snow/.test(normalized)) {
    return { icon: FiCloudSnow, tone: 'cyan.500' };
  }
  // Neblina (`fa-smog`) — sem ícone de neblina no kit `fi`; nuvem em tom cinza-claro, distinto do fallback.
  if (/smog|fog|mist|haze/.test(normalized)) {
    return { icon: FiCloud, tone: 'gray.400' };
  }
  // Chuva forte (`fa-cloud-showers-heavy`) — antes da garoa, ícone/tom mais escuros.
  if (/shower/.test(normalized)) {
    return { icon: FiCloudRain, tone: 'blue.700' };
  }
  // Garoa/chuva fraca (`fa-cloud-rain`) — ícone de gotas leves (`FiCloudDrizzle`), tom claro.
  if (/rain|drizzle/.test(normalized)) {
    return { icon: FiCloudDrizzle, tone: 'blue.300' };
  }
  // Parcialmente nublado (`fa-cloud-sun`) — sem ícone sol+nuvem no kit `fi`; nuvem em tom âmbar claro.
  if (/cloud/.test(normalized) && /sun/.test(normalized)) {
    return { icon: FiCloud, tone: 'amber.300' };
  }
  // Sol pleno (`fa-sun`, dia seco).
  if (/sun/.test(normalized)) {
    return { icon: FiSun, tone: 'amber.500' };
  }
  // Fallback (`fa-cloud` ou classe desconhecida) — nublado neutro.
  return { icon: FiCloud, tone: 'gray.500' };
}

export function PrevisaoSemana({ data }: PrevisaoSemanaProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.rainfallDashboard.weekForecast;
  const commonText = languageGB.dashboards.common;

  return (
    <DashboardCard
      flex={2}
      minWidth={320}
      title={text.title}
      action={
        <Text fontSize="xs" color="cardTextSecondary">
          {text.source}
        </Text>
      }
    >
      {data.length === 0 ? (
        <Text fontSize="sm" color="cardTextSecondary">
          {commonText.noData}
        </Text>
      ) : (
        <SimpleGrid columns={data.length} gap="2">
          {data.map((day, index) => {
            const { icon, tone } = weatherIconFromClass(day.icon ?? '');
            const isToday = index === 0;
            const dayLabel = isToday ? text.today : day.day_name;

            return (
              // eslint-disable-next-line react/no-array-index-key -- linha sem chave estável própria (sem `date`)
              <Flex
                key={`${day.day_name}-${index}`}
                direction="column"
                align="center"
                gap="1"
                paddingY="2"
              >
                <Text
                  fontSize="xs"
                  fontWeight={isToday ? 'semibold' : 'normal'}
                  color={isToday ? 'cardTextPrimary' : 'cardTextSecondary'}
                >
                  {dayLabel}
                </Text>
                <Icon as={icon} boxSize={4} color={tone} />
                <Text fontSize="sm" fontWeight="semibold" color="cardTextPrimary">
                  {Math.round(day.temp_max)}°
                </Text>
                <Text fontSize="xs" color="cardTextSecondary">
                  {Math.round(day.temp_min)}°
                </Text>
                {day.precipitation > 0 ? (
                  <Flex align="center" gap="1">
                    <Icon as={FiDroplet} boxSize={3} color="blue.500" />
                    <Text fontSize="xs" color="blue.500" fontWeight="semibold">
                      {day.precipitation}
                    </Text>
                  </Flex>
                ) : (
                  <Text fontSize="xs" color="cardTextSecondary">
                    —
                  </Text>
                )}
              </Flex>
            );
          })}
        </SimpleGrid>
      )}
    </DashboardCard>
  );
}
