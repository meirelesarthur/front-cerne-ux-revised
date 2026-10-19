// src/components/HeaderSearch/HeaderSearchResults.tsx
// Dropdown de resultados da busca do Header — mirror de
// `NotificationPanel`/`ErrorLogPanel` (Popover.Content do Chakra v3, nunca um
// `<div>` cru). Fidelidade ao design system cerne
// (`GB.Cerne.UX/src/components/SearchBar.tsx`), adaptada à stack:
// - dropdown vira Popover.Content (cerne usa `<div>` com posicionamento manual);
// - highlight do trecho casado usa token de tema (`yellow.100`/dark), nunca
//   `<mark>` cru com cor hardcoded.
//
// Contrato de montagem (decisão de implementação, TASK-FE-903): o `open` do
// `Popover.Root` só fica `true` quando `query.trim().length > 0` — por isso
// este componente NUNCA precisa tratar "query vazia": ou há resultados, ou
// há o estado vazio (query preenchida, zero matches).

import { Box, Flex, HStack, Icon, Kbd, Popover, Text } from "@chakra-ui/react";
import { FiArrowRight, FiHash } from "react-icons/fi";

import { useLanguage } from "@/hooks/useLanguage";
import type { SearchItem } from "@/hooks/useHeaderSearchIndex";

/** Corte de resultados exibidos — idêntico ao cerne (`SearchBar.tsx`), sem fuzzy. */
export const HEADER_SEARCH_RESULTS_LIMIT = 8;

/**
 * Match case-insensitive por label/moduleLabel/groupLabel, cortado em
 * `HEADER_SEARCH_RESULTS_LIMIT` — pura, exportada para ser reaproveitada pelo
 * `HeaderSearch` (TASK-FE-903) no cálculo do wrap-clamp de teclado (precisa da
 * MESMA contagem de resultados que é renderizada aqui).
 */
export function filterHeaderSearchResults(
  items: SearchItem[],
  query: string
): SearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return items
    .filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.moduleLabel.toLowerCase().includes(q) ||
        (item.groupLabel?.toLowerCase().includes(q) ?? false)
    )
    .slice(0, HEADER_SEARCH_RESULTS_LIMIT);
}

function HighlightedLabel({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <Text
        as="mark"
        bg="yellow.100"
        _dark={{ bg: "yellow.700" }}
        color="inherit"
        borderRadius="sm"
        px="1px"
      >
        {text.slice(idx, idx + q.length)}
      </Text>
      {text.slice(idx + q.length)}
    </>
  );
}

interface HeaderSearchResultsProps {
  items: SearchItem[];
  query: string;
  activeIdx: number;
  onSelect: (item: SearchItem) => void;
}

export function HeaderSearchResults({
  items,
  query,
  activeIdx,
  onSelect,
}: HeaderSearchResultsProps) {
  const { languageGB } = useLanguage();
  const results = filterHeaderSearchResults(items, query);

  const shortcuts: Array<[string, string]> = [
    ["↑↓", languageGB.defaltStrings.headerSearch.navigate],
    ["Enter", languageGB.defaltStrings.headerSearch.select],
    ["Esc", languageGB.defaltStrings.headerSearch.close],
  ];

  return (
    <Popover.Content
      w="420px"
      maxW="calc(100vw - 32px)"
      bg="cardBG"
      borderRadius="xl"
      boxShadow="0px 20px 25px -5px rgba(0, 0, 0, 0.2), 0px 10px 10px -5px rgba(0, 0, 0, 0.1)"
      border="1px solid"
      borderColor="cardBorder"
      overflow="hidden"
    >
      {results.length === 0 ? (
        <Flex align="center" justify="center" py={8} px={4} textAlign="center">
          <Text fontSize="sm" color="text.secondary">
            {languageGB.defaltStrings.headerSearch.noResultsFor}{" "}
            <Text as="strong" color="text.primary">
              &ldquo;{query}&rdquo;
            </Text>
          </Text>
        </Flex>
      ) : (
        <Box maxH="360px" overflowY="auto">
          {results.map((item, i) => {
            const isActive = i === activeIdx;
            return (
              <Flex
                key={item.id}
                align="center"
                gap={3}
                px={4}
                h="48px"
                cursor="pointer"
                bg={isActive ? "cardHoverBG" : "transparent"}
                borderBottom="1px solid"
                borderColor="border1"
                _hover={{ bg: "cardHoverBG" }}
                transition="background 0.1s ease"
                onClick={() => onSelect(item)}
              >
                {/* Ícone genérico por linha (Gate 4 do plano — default aceito
                    pelo dev: sem mapa módulo→ícone novo). */}
                <Flex
                  w="28px"
                  h="28px"
                  borderRadius="md"
                  bg="inputBG"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon
                    as={FiHash}
                    boxSize={3.5}
                    color={isActive ? "sidebarItemActiveText" : "topBarIconColor"}
                  />
                </Flex>

                {/* Label + metadado moduleLabel › groupLabel numa linha só. */}
                <HStack flex={1} minW={0} gap={1.5} overflow="hidden">
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color="topBarTextColor"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    <HighlightedLabel text={item.label} query={query} />
                  </Text>
                  <Text as="span" color="topBarBorder" fontSize="sm" flexShrink={0}>
                    ·
                  </Text>
                  <HStack
                    gap={1}
                    fontSize="xs"
                    color="topBarTextSecondary"
                    flexShrink={0}
                    whiteSpace="nowrap"
                    overflow="hidden"
                  >
                    <Text as="span" overflow="hidden" textOverflow="ellipsis">
                      {item.moduleLabel}
                    </Text>
                    {item.groupLabel && (
                      <>
                        <Text as="span" color="topBarBorder">
                          ›
                        </Text>
                        <Text as="span" overflow="hidden" textOverflow="ellipsis">
                          {item.groupLabel}
                        </Text>
                      </>
                    )}
                  </HStack>
                </HStack>

                <Icon
                  as={FiArrowRight}
                  boxSize={3.5}
                  color={isActive ? "sidebarItemActiveText" : "topBarBorder"}
                  flexShrink={0}
                />
              </Flex>
            );
          })}
        </Box>
      )}

      {/* Footer — legenda de atalhos, fixa. */}
      <Flex
        px={4}
        py={1.5}
        bg="inputBG"
        borderTop="1px solid"
        borderColor="border1"
        align="center"
        gap={3}
      >
        {shortcuts.map(([key, label]) => (
          <HStack key={key} gap={1} fontSize="10px" color="topBarTextSecondary">
            <Kbd fontSize="10px">{key}</Kbd>
            <Text as="span">{label}</Text>
          </HStack>
        ))}
      </Flex>
    </Popover.Content>
  );
}

export default HeaderSearchResults;
