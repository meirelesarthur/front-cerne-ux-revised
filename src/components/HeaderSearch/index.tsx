// src/components/HeaderSearch/index.tsx
// Busca REAL do Header — substitui o bloco decorativo (desktop) e o botão de
// busca mobile por um trigger funcional: estado local (query/open/activeIdx),
// atalho de teclado (Ctrl+K/⌘K abre+foca, Escape fecha, setas navegam,
// Enter seleciona) e navegação real via `useNavigate()`.
//
// UMA ÚNICA instância controlada por `open` — a variante mobile (ícone que
// expande para um campo de texto) e a variante desktop (campo sempre visível)
// compartilham o mesmo estado/Popover, só o gatilho visual muda (§3 do plano
// `PLANO-header-search-menu.md`).
//
// Decisão de implementação: o campo de busca é o próprio "trigger" (o usuário
// digita direto na barra, não clica para abrir um modal à parte) — por isso
// usamos `Popover.Anchor` (só posiciona, sem toggle automático de clique) em
// vez de `Popover.Trigger` (que alternaria aberto/fechado a cada clique no
// input, inclusive ao só reposicionar o cursor). Abertura/fechamento são 100%
// geridos por este componente (focus/teclado/seleção), `onOpenChange` do
// Popover só sincroniza fechamento por clique fora/Escape nativo do Ark.
//
// O `Popover.Root.open` só fica verdadeiro quando `query` tem conteúdo — sem
// isso, não há nada para mostrar (mesmo comportamento do cerne, que só marca
// `isOpen` quando há resultados ou estado vazio a exibir).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Icon, IconButton, Input, Kbd, Popover, Portal } from "@chakra-ui/react";
import { FiSearch, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { useLanguage } from "@/hooks/useLanguage";
import { useHeaderSearchIndex, type SearchItem } from "@/hooks/useHeaderSearchIndex";
import {
  HeaderSearchResults,
  filterHeaderSearchResults,
} from "@/components/HeaderSearch/HeaderSearchResults";

export function HeaderSearch() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const items = useHeaderSearchIndex();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const desktopInputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => filterHeaderSearchResults(items, query), [items, query]);

  // activeIdx reseta para 0 a cada mudança de query (fidelidade ao cerne).
  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const closeAndClear = useCallback(() => {
    setQuery("");
    setOpen(false);
    setMobileExpanded(false);
  }, []);

  const handleSelect = useCallback(
    (item: SearchItem) => {
      closeAndClear();
      navigate(item.path);
    },
    [closeAndClear, navigate]
  );

  // Ctrl+K/⌘K (foca+abre) e Escape (fecha) — escopo do componente (Header),
  // montado/desmontado junto com ele, sem vazar listener para o app inteiro.
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setMobileExpanded(true);
        desktopInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setOpen(false);
        setMobileExpanded(false);
        (document.activeElement as HTMLElement | null)?.blur();
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // ArrowUp/ArrowDown (clamp, sem wrap) + Enter — mesmo comportamento do
  // cerne (`SearchBar.tsx`), ligado ao input focado (desktop OU mobile).
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && results[activeIdx]) {
      handleSelect(results[activeIdx]);
    }
  };

  return (
    <Popover.Root
      open={open && query.trim().length > 0}
      onOpenChange={(e: { open: boolean }) => setOpen(e.open)}
      positioning={{ placement: "bottom-end" }}
      autoFocus={false}
      restoreFocus={false}
      lazyMount
      unmountOnExit
    >
      <Popover.Anchor>
        <Box as="span" display="flex" alignItems="center">
          {/* Trigger desktop — campo real, mesmo visual do bloco decorativo anterior. */}
          <Flex
            align="center"
            gap={2}
            h="32px"
            w="260px"
            pl={3}
            pr={2}
            borderRadius="base"
            borderWidth="1px"
            borderColor={open ? "sidebarItemActiveText" : "topBarBorder"}
            bg="inputBG"
            transition="border-color 0.15s ease"
            display={{ base: "none", sm: "flex" }}
          >
            <Icon as={FiSearch} boxSize={4} color="topBarTextSecondary" flexShrink={0} />
            <Input
              ref={desktopInputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleInputKeyDown}
              placeholder={languageGB.defaltStrings.headerSearch.placeholder}
              aria-label={languageGB.defaltStrings.search}
              border="none"
              bg="transparent"
              h="auto"
              px={0}
              py={0}
              fontSize="sm"
              color="topBarTextColor"
              _placeholder={{ color: "topBarTextSecondary" }}
              _focus={{ boxShadow: "none" }}
              _focusVisible={{ boxShadow: "none" }}
            />
            <Kbd fontSize="10px" flexShrink={0}>
              ⌘K
            </Kbd>
          </Flex>

          {/* Trigger mobile — MESMA instância/estado; só o gatilho visual muda:
              ícone fechado, campo real quando expandido. */}
          <Box display={{ base: "flex", sm: "none" }} alignItems="center">
            {mobileExpanded ? (
              <Flex
                align="center"
                gap={1}
                h="32px"
                w="180px"
                pl={3}
                pr={1}
                borderRadius="base"
                borderWidth="1px"
                borderColor="sidebarItemActiveText"
                bg="inputBG"
              >
                <Icon as={FiSearch} boxSize={4} color="topBarTextSecondary" flexShrink={0} />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                  }}
                  onFocus={() => setOpen(true)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={languageGB.defaltStrings.headerSearch.placeholder}
                  aria-label={languageGB.defaltStrings.search}
                  border="none"
                  bg="transparent"
                  h="auto"
                  px={0}
                  py={0}
                  fontSize="sm"
                  color="topBarTextColor"
                  _placeholder={{ color: "topBarTextSecondary" }}
                  _focus={{ boxShadow: "none" }}
                />
                <IconButton
                  variant="ghost"
                  size="xs"
                  aria-label={languageGB.defaltStrings.headerSearch.close}
                  onClick={closeAndClear}
                >
                  <Icon as={FiX} boxSize={4} color="topBarIconColor" />
                </IconButton>
              </Flex>
            ) : (
              <IconButton
                variant="ghost"
                size="sm"
                aria-label={languageGB.defaltStrings.search}
                borderRadius="lg"
                onClick={() => setMobileExpanded(true)}
              >
                <Icon as={FiSearch} boxSize={5} color="topBarIconColor" />
              </IconButton>
            )}
          </Box>
        </Box>
      </Popover.Anchor>

      <Portal>
        {/* @ts-ignore - Chakra UI v3 API */}
        <Popover.Positioner>
          <HeaderSearchResults
            items={items}
            query={query}
            activeIdx={activeIdx}
            onSelect={handleSelect}
          />
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}

export default HeaderSearch;
