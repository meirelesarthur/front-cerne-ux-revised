// src/components/Layout/SecondaryNav.tsx
// Painel secundário de navegação (o "meio" dos 3 painéis) do GB Cerne, fiel a
// `MCPs/cerne/src/components/layout/SecondaryNav.tsx`. Só é renderizado pelo
// DashboardLayout quando o módulo ativo tem `groups` ou `flatItems`.
//
// Diferença estrutural em relação ao cerne: lá o item ativo é state local
// (activeItemId); aqui navegamos de verdade via React Router — o "ativo" é
// derivado comparando `item.path` com `location.pathname`.

import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";

import { Icon as GbIcon } from "@/components/ui/Icon";
import { useLocation, useNavigate } from "react-router-dom";

import { Tooltip } from "@/components/ui/tooltip";
import type { NavGroup, NavModule, NavSubItem } from "@/config/v2/navigationTree";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/hooks/useLanguage";

// Larguras do painel secundário (fonte única — full 224px / icon-only 56px,
// espelha SIDEBAR_W_FULL/SIDEBAR_W_ICON do NavRail).
export const SECONDARY_W_FULL = "224px";
export const SECONDARY_W_ICON = "56px";

// Resolve, dentre TODAS as folhas do módulo (flatItems + itens de grupo +
// filhos), o path mais específico que casa com a rota atual.
//
// Correção de causa raiz (UT-000013 / Nova CTe, rejeição AF item b): antes,
// cada item testava prefixo de forma isolada
// (`pathname.startsWith(item.path + "/")`), então uma rota-irmã cujo path é
// prefixo textual de outra folha (ex.: "/fiscal/ctes" é prefixo de
// "/fiscal/ctes/create") marcava as DUAS folhas como ativas ao mesmo tempo —
// "Lista de CTe" ficava destacada junto com "Nova CTe". Escolhendo o path
// mais longo (mais específico) dentre os candidatos que casam, só uma folha
// fica ativa por vez, preservando o match de sub-rotas não listadas na
// árvore (ex.: "/fiscal/ctes/123" continua ativando "Lista de CTe", pois
// nenhuma outra folha do módulo é mais específica para essa rota).
function collectLeafPaths(module: NavModule): string[] {
  const paths: string[] = [];
  const pushItem = (item: NavSubItem) => {
    paths.push(item.path);
    item.children?.forEach((child) => paths.push(child.path));
  };
  module.flatItems?.forEach(pushItem);
  module.groups?.forEach((group) => group.items.forEach(pushItem));
  return paths;
}

function resolveActivePath(module: NavModule, pathname: string): string {
  const candidates = collectLeafPaths(module).filter(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );
  if (candidates.length === 0) return pathname;
  return candidates.reduce((best, path) => (path.length > best.length ? path : best));
}

function isItemActive(item: NavSubItem, activePath: string): boolean {
  if (activePath === item.path) return true;
  return !!item.children?.some((c) => activePath === c.path);
}


function NavItemButton({
  item,
  active,
  activePath,
  onNavigate,
}: {
  item: NavSubItem;
  active: boolean;
  activePath: string;
  onNavigate: (path: string) => void;
}) {
  const { languageGB } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const hasChildren = !!item.children && item.children.length > 0;
  const hasActiveChild = hasChildren && item.children!.some((c) => c.path === activePath);
  const [expanded, setExpanded] = useState(hasActiveChild);
  const favorited = !hasChildren && isFavorite(item.path);

  const handleClick = () => {
    if (hasChildren) {
      setExpanded((prev) => !prev);
    } else {
      onNavigate(item.path);
    }
  };

  const itemLabel = languageGB.sidebar.navigation[item.id] ?? item.label;

  return (
    <Box>
      <Flex
        as="button"
        className="group"
        onClick={handleClick}
        w="100%"
        align="center"
        justify="space-between"
        h="36px"
        pl={1}
        pr={2.5}
        borderRadius="md"
        fontSize="base"
        fontWeight={active && !hasChildren ? "semibold" : "normal"}
        color={active && !hasChildren ? "sidebarItemActiveText" : "sidebarTextColor"}
        bg={active && !hasChildren ? "sidebarItemActiveBG" : "transparent"}
        _hover={{
          bg: active && !hasChildren ? "sidebarItemActiveBG" : "sidebarItemHoverBG",
          color: active && !hasChildren ? "sidebarItemActiveText" : "sidebarTextHover",
        }}
        transition="background-color 0.12s ease, color 0.12s ease"
      >
        <Flex align="center" gap={2} minW={0}>
          {item.icon && (
            <Box
              as="span"
              display="flex"
              flexShrink={0}
              color={active && !hasChildren ? "sidebarItemActiveText" : "sidebarSubtitleColor"}
            >
              <GbIcon name={item.icon} size={14} />
            </Box>
          )}
          <Text as="span" textAlign="left" lineClamp="1" fontSize="inherit" fontWeight="inherit">
            {itemLabel}
          </Text>
        </Flex>
        <Flex align="center" gap={1} flexShrink={0} ml={1}>
          {/* Favoritar (GAP-BE-023): só itens-folha; visível ao passar o mouse
              ou quando já favoritado. span clicável (não <button> aninhado). */}
          {!hasChildren && (
            <Box
              as="span"
              role="button"
              aria-label={
                favorited
                  ? languageGB.defaltStrings.removeFavorite
                  : languageGB.defaltStrings.addFavorite
              }
              display="flex"
              color={favorited ? "#f0b429" : "sidebarSubtitleColor"}
              opacity={favorited ? 1 : 0}
              _groupHover={{ opacity: 1 }}
              _hover={{ transform: "scale(1.2)" }}
              transition="opacity 0.12s ease, transform 0.12s ease"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleFavorite(item.path);
              }}
            >
              <GbIcon name="star" size={12} filled={favorited} />
            </Box>
          )}
          {hasChildren && (
            // Chevron padronizado (Ajustes Globais): fechado `>` (rotate 0) /
            // aberto `v` (rotate 90deg) — ícone único que rotaciona.
            <Box
              as="span"
              display="flex"
              flexShrink={0}
              color="sidebarSubtitleColor"
              transform={expanded ? "rotate(90deg)" : "rotate(0deg)"}
              transition="transform 0.15s ease"
            >
              <GbIcon name="chevron-right" size={10} />
            </Box>
          )}
        </Flex>
      </Flex>
      {expanded && hasChildren && (
        <Box pb={0.5}>
          {item.children!.map((child) => {
            const childActive = child.path === activePath;
            const childLabel = languageGB.sidebar.navigation[child.id] ?? child.label;
            return (
              <Flex
                as="button"
                key={child.id}
                onClick={() => onNavigate(child.path)}
                w="100%"
                align="center"
                gap={2}
                h="36px"
                pl={4}
                pr={2.5}
                borderRadius="md"
                fontSize="base"
                fontWeight={childActive ? "semibold" : "normal"}
                color={childActive ? "sidebarItemActiveText" : "sidebarTextColor"}
                bg={childActive ? "sidebarItemActiveBG" : "transparent"}
                _hover={{
                  bg: childActive ? "sidebarItemActiveBG" : "sidebarItemHoverBG",
                  color: childActive ? "sidebarItemActiveText" : "sidebarTextHover",
                }}
                transition="background-color 0.12s ease, color 0.12s ease"
              >
                {child.icon && (
                  <Box
                    as="span"
                    display="flex"
                    flexShrink={0}
                    color={childActive ? "sidebarItemActiveText" : "sidebarSubtitleColor"}
                  >
                    <GbIcon name={child.icon} size={13} />
                  </Box>
                )}
                <Text as="span" textAlign="left" lineClamp="1" fontSize="inherit" fontWeight="inherit">
                  {childLabel}
                </Text>
              </Flex>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

function NavGroupSection({
  group,
  open,
  activePath,
  onToggle,
  onNavigate,
}: {
  group: NavGroup;
  open: boolean;
  activePath: string;
  onToggle: () => void;
  onNavigate: (path: string) => void;
}) {
  const { languageGB } = useLanguage();
  const groupLabel = languageGB.sidebar.navigation[group.id] ?? group.label;
  return (
    <Box mb={1}>
      <Flex
        as="button"
        onClick={onToggle}
        w="100%"
        align="center"
        gap={1.5}
        fontSize="11px" // DS: t.font.size['2xs'] nos rótulos de grupo
        fontWeight="medium"
        color="sidebarSubtitleColor"
        letterSpacing="0.5px"
        textTransform="uppercase"
        py={1.5}
        pr={2.5}
        pl={1}
        borderRadius="md"
        _hover={{ bg: "sidebarItemHoverBG" }}
        transition="background-color 0.1s ease"
      >
        <Text as="span" flex="1" textAlign="left" fontSize="inherit" fontWeight="inherit" letterSpacing="inherit">
          {groupLabel}
        </Text>
        {/* Chevron padronizado (Ajustes Globais): fechado `>` (rotate 0) /
            aberto `v` (rotate 90deg) — ícone único que rotaciona. */}
        <Box
          as="span"
          display="flex"
          flexShrink={0}
          transform={open ? "rotate(90deg)" : "rotate(0deg)"}
          transition="transform 0.15s ease"
        >
          <GbIcon name="chevron-right" size={11} />
        </Box>
      </Flex>

      {open && (
        // 2º nível colado à lateral (sem padding-left); itens de 36px sem folga entre si — passo de 36px,
        // igual ao menu do DS (pedido do dono).
        <Flex direction="column" gap={0} pb={2}>
          {group.items.map((item) => (
            <NavItemButton
              key={item.id}
              item={item}
              active={isItemActive(item, activePath)}
              activePath={activePath}
              onNavigate={onNavigate}
            />
          ))}
        </Flex>
      )}
    </Box>
  );
}

// Achata os itens de TELA (folha) do módulo numa lista única — IGNORA
// agrupadores (só o rótulo dos grupos existe visualmente no modo full; no
// rail colapsado não há espaço para cabeçalho de grupo).
function collectAllItems(module: NavModule): NavSubItem[] {
  return [
    ...(module.flatItems ?? []),
    ...(module.groups?.flatMap((g) => g.items) ?? []),
  ];
}

function CollapsedIconList({
  module,
  activePath,
  onNavigate,
}: {
  module: NavModule;
  activePath: string;
  onNavigate: (path: string) => void;
}) {
  const { languageGB } = useLanguage();
  const items = collectAllItems(module);

  return (
    <Flex direction="column" align="center" gap={1}>
      {items.map((item) => {
        const active = isItemActive(item, activePath);
        const itemLabel = languageGB.sidebar.navigation[item.id] ?? item.label;
        return (
          <Tooltip key={item.id} content={itemLabel} positioning={{ placement: "right" }}>
            <Flex
              as="button"
              onClick={() => onNavigate(item.path)}
              align="center"
              justify="center"
              w="36px"
              h="36px"
              borderRadius="md"
              aria-label={itemLabel}
              color={active ? "sidebarItemActiveText" : "sidebarTextColor"}
              bg={active ? "sidebarItemActiveBG" : "transparent"}
              _hover={{
                bg: active ? "sidebarItemActiveBG" : "sidebarItemHoverBG",
                color: active ? "sidebarItemActiveText" : "sidebarTextHover",
              }}
              transition="background-color 0.12s ease, color 0.12s ease"
            >
              <GbIcon name={item.icon ?? "circle"} size={16} />
            </Flex>
          </Tooltip>
        );
      })}
    </Flex>
  );
}

interface SecondaryNavProps {
  module: NavModule;
}

export function SecondaryNav({ module }: SecondaryNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  // `activePath` resolve a folha mais específica do módulo que casa com a
  // rota atual (ver `resolveActivePath`) — é isso, e não `location.pathname`
  // cru, que deve alimentar toda comparação de "item ativo" abaixo.
  const activePath = resolveActivePath(module, location.pathname);

  // Accordion: só um grupo aberto por vez — abrir um fecha o anterior.
  // Estado interno do componente (não é prop pública); preserva o
  // comportamento de abrir automaticamente o grupo do item ativo.
  const [openGroupId, setOpenGroupId] = useState<string | null>(() => {
    const activeGroup = module.groups?.find((g) =>
      g.items.some((i) => isItemActive(i, activePath))
    );
    return activeGroup?.id ?? null;
  });

  // Rail colapsável (icon-only) — estado LOCAL, independente do `navCollapsed`
  // do NavRail (sidebar primária). Sem persistência: sempre reabre full ao
  // trocar de módulo/sessão.
  const [collapsed, setCollapsed] = useState(false);

  const toggleGroup = (id: string) => {
    setOpenGroupId((prev) => (prev === id ? null : id));
  };

  const toggleLabel = collapsed
    ? languageGB.common.navRail.expandSecondaryMenu
    : languageGB.common.navRail.collapseSecondaryMenu;

  return (
    <Box
      h="100%"
      w={collapsed ? SECONDARY_W_ICON : SECONDARY_W_FULL}
      minW={collapsed ? SECONDARY_W_ICON : SECONDARY_W_FULL}
      bg="cardBG"
      borderRadius="xl"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      flexShrink={0}
      transition="width 0.2s ease, min-width 0.2s ease"
    >
      <Box
        className="nav-scroll"
        flex="1"
        minH={0}
        overflowY="auto"
        p={2}
        css={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        {collapsed ? (
          <CollapsedIconList module={module} activePath={activePath} onNavigate={navigate} />
        ) : module.flatItems ? (
          <Box>
            {module.flatItems.map((item) => (
              <NavItemButton
                key={item.id}
                item={item}
                active={isItemActive(item, activePath)}
                activePath={activePath}
                onNavigate={navigate}
              />
            ))}
          </Box>
        ) : (
          module.groups?.map((group) => (
            <NavGroupSection
              key={group.id}
              group={group}
              open={openGroupId === group.id}
              activePath={activePath}
              onToggle={() => toggleGroup(group.id)}
              onNavigate={navigate}
            />
          ))
        )}
      </Box>

      {/* Rodapé: alterna o rail entre full (224px) e icon-only (56px). */}
      <Flex
        justify={collapsed ? "center" : "flex-end"}
        px={2}
        py={1.5}
        flexShrink={0}
      >
        <Tooltip content={toggleLabel} positioning={{ placement: "right" }}>
          <Flex
            as="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={toggleLabel}
            align="center"
            justify="center"
            w="24px"
            h="24px"
            borderRadius="full"
            borderWidth="1px"
            borderColor="sidebarBorder"
            bg="cardBG"
            color="sidebarSubtitleColor"
            flexShrink={0}
            _hover={{ bg: "sidebarItemHoverBG", color: "sidebarTextHover" }}
            transition="background-color 0.12s ease, color 0.12s ease"
          >
            <GbIcon name={collapsed ? "chevron-right" : "chevron-left"} size={14} />
          </Flex>
        </Tooltip>
      </Flex>
    </Box>
  );
}

export default SecondaryNav;
