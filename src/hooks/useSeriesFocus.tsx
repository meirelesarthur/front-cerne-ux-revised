// src/hooks/useSeriesFocus.tsx
// Foco de série dentro de um card de gráfico (execução 046, TASK-DASH-FE-02)
// — adaptação Chakra v3 de `GB.Cerne.UX/src/hooks/useSeriesFocus.tsx@8663490`,
// suporte de `FocusableChartCard` (`src/components/Dashboard/FocusableChartCard.tsx`).
//
// Devolve as séries que devem ir ao gráfico e o seletor pronto para o slot
// `action` do `DashboardCard`. Com "Todas as séries" o gráfico fica como
// está; ao escolher uma, ela ocupa o gráfico inteiro — comparar é uma
// leitura, olhar uma série de perto é outra.
//
// Serve para bloco de VÁRIAS SÉRIES sobre o mesmo eixo (meses, semanas,
// setores). Em composição de item único — barra por categoria, donut —
// focar um item deixaria uma fatia sozinha: ali o recorte se faz pelo filtro
// da tela (`FilterSide`), que reflete em todos os blocos.
//
// O foco é estado de leitura, não filtro de dado: fica local, fora da URL.
// O rótulo da opção "todas" é responsabilidade do CALLER (i18n modular —
// cada tela injeta `languageGB.dashboards.common.allSeries` ou equivalente).

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { createListCollection, Portal, Select } from '@chakra-ui/react';

const ALL = '__todas__';

interface UseSeriesFocusResult<T> {
  series: T[];
  selector: ReactNode;
  focused: string | null;
}

/**
 * ```tsx
 * const rebanho = useSeriesFocus(rebanhoSeries, languageGB.dashboards.common.allSeries);
 * <DashboardCard title="Evolução do rebanho" action={rebanho.selector}>
 *   <LineChart series={rebanho.series} labels={labels} />
 * </DashboardCard>
 * ```
 * @param {T[]} series - Séries do bloco de gráfico (cada item precisa de `name`).
 * @param {string} allLabel - Rótulo da opção "todas as séries", vindo de i18n do módulo consumidor.
 * @return {UseSeriesFocusResult<T>} Séries visíveis, seletor pronto e série em foco (`null` = todas).
 */
export function useSeriesFocus<T extends { name: string }>(
  series: T[],
  /** Rótulo da opção que mostra tudo — vem de i18n do módulo consumidor, nunca literal aqui. */
  allLabel: string
): UseSeriesFocusResult<T> {
  const [focus, setFocus] = useState(ALL);

  const visible = useMemo(
    () => (focus === ALL ? series : series.filter((serie) => serie.name === focus)),
    [focus, series]
  );

  const collection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: allLabel, value: ALL },
          ...series.map((serie) => ({ label: serie.name, value: serie.name })),
        ],
      }),
    [series, allLabel]
  );

  // Uma série só não tem o que focar — o seletor não aparece.
  const selector =
    series.length < 2 ? null : (
      <Select.Root
        collection={collection}
        size="xs"
        width="auto"
        minWidth="9rem"
        value={[focus]}
        onValueChange={(details: { value: string[] }) => setFocus(details.value[0] ?? ALL)}
        positioning={{ sameWidth: false }}
      >
        <Select.HiddenSelect aria-label="Focar uma série do gráfico" />
        {/* @ts-ignore - Chakra UI v3 type issue, mesmo padrão de src/components/SelectPagination.tsx */}
        <Select.Control>
          {/* @ts-ignore - Chakra UI v3 type issue */}
          <Select.Trigger
            paddingX="2"
            paddingY="1"
            height="auto"
            minHeight="unset"
            fontSize="xs"
            color="cardTextSecondary"
            background="transparent"
            border="1px solid"
            borderColor="cardBorder"
            borderRadius="md"
            cursor="pointer"
          >
            <Select.ValueText />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          {/* @ts-ignore - Chakra UI v3 type issue */}
          <Select.Positioner>
            {/* @ts-ignore - Chakra UI v3 type issue */}
            <Select.Content
              background="cardBG"
              borderRadius="md"
              boxShadow="cardShadow"
              borderWidth="1px"
              borderColor="cardBorder"
              padding="1"
              zIndex={1500}
            >
              {collection.items.map((option: { label: string; value: string }) => (
                // @ts-ignore - Chakra UI v3 type issue
                <Select.Item
                  item={option}
                  key={option.value}
                  padding="2"
                  cursor="pointer"
                  fontSize="sm"
                  color="cardTextPrimary"
                  _hover={{ backgroundColor: 'sidebarItemHoverBG' }}
                >
                  {/* @ts-ignore - Chakra UI v3 type issue */}
                  <Select.ItemText>{option.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
    );

  return {
    // Filtro que não casa (série saiu do recorte) cai de volta para tudo, em
    // vez de deixar o card vazio.
    series: visible.length ? visible : series,
    selector,
    focused: focus === ALL ? null : focus,
  };
}
