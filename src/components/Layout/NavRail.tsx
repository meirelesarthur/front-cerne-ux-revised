// src/components/Layout/NavRail.tsx
// Sidebar primária (esquerda) do GB Cerne — fiel a
// `MCPs/cerne/src/components/layout/Sidebar.tsx`, implementada em Chakra UI v3.
// Colapsável entre 240px (full) e 56px (icon-only) com transição suave de largura.
//
// Diferença estrutural vs. o cerne: lá "expandir módulo" é 100% state local
// (activeModuleId/expandedModuleId no AppLayout); aqui os módulos SEM filhos
// navegam de verdade via React Router, e os módulos COM filhos (groups ou
// flatItems) alternam a exibição do SecondaryNav — controlada pelo
// DashboardLayout via `expandedModuleId` (estado de UI por cima da rota: a
// rota decide o valor inicial, o clique alterna por cima).
//
// Rodapé (tema, planos, config, idioma, sair) REMOVIDO (Execução 071,
// TASK-071-FE-06, SRF-071-07, D3) — os 5 itens migraram para o menu da conta
// no avatar do Header (`Header/AccountMenu.tsx`, TASK-071-FE-05). A sidebar
// termina na lista de módulos; sem divisor nem rodapé.

import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  Flex,
  IconButton,
  Image,
  Portal,
  Text,
} from "@chakra-ui/react";

import logoMin from "@/assets/logo-min.svg";
import logoMinWhite from "@/assets/logo-min-white.svg";
import { Icon as GbIcon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/tooltip";
import { type NavModule } from "@/config/v2/navigationTree";
import { useMenuModules } from "@/hooks/useMenuModules";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "@/contexts/ThemeContext";
import { savePathAndClearStorage } from "@/utils/storageUtils";

// Larguras da sidebar (fonte única — importadas pelo DashboardLayout/Header p/ offsets).
export const SIDEBAR_W_FULL = "240px";
export const SIDEBAR_W_ICON = "56px";
// Compat: alguns pontos ainda importam RAIL_W (largura do estado colapsado).
export const RAIL_W = SIDEBAR_W_ICON;

interface NavRailProps {
  /** Sidebar recolhida (icon-only) — controlado pelo DashboardLayout. */
  collapsed: boolean;
  /** Alterna full / icon-only (desktop). */
  onToggleCollapse: () => void;
  /** Estado do drawer mobile (controlado pelo DashboardLayout). */
  isOpen: boolean;
  /** Fecha o drawer mobile. */
  onClose: () => void;
  /** Id do módulo com o SecondaryNav aberto (derivado da rota + toggle local). */
  expandedModuleId: string | null;
  /** Alterna abrir/fechar o SecondaryNav do módulo (ou navega, se o módulo não tiver filhos). */
  onModuleClick: (module: NavModule) => void;
}

interface NavRailContentProps {
  /** Modo compacto (só ícones). No drawer mobile é sempre false. */
  collapsed: boolean;
  /** Botão de recolher (só no desktop full). */
  onToggleCollapse?: () => void;
  /** Chamado ao selecionar item (fecha o drawer mobile). */
  onItemSelected?: () => void;
  expandedModuleId: string | null;
  onModuleClick: (module: NavModule) => void;
}

/**
 * Conteúdo da sidebar — reutilizado pela barra fixa (desktop) e pelo drawer (mobile).
 */
function NavRailContent({
  collapsed,
  onToggleCollapse,
  onItemSelected,
  expandedModuleId,
  onModuleClick,
}: NavRailContentProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  // `theme` só alimenta a troca de logo (claro/escuro) — o toggle de tema em
  // si mudou para o menu da conta (TASK-071-FE-05/06).
  const { theme } = useTheme();
  const isDark = theme === "dark";
  // Árvore de módulos já podada pelas permissões do usuário (F4 do plano de
  // permissionamento) — item sem permissão não aparece em nenhuma superfície.
  const visibleModules = useMenuModules();

  const isModuleActive = useCallback(
    (module: NavModule) => {
      if (expandedModuleId === module.id) return true;
      if (module.path) {
        return (
          location.pathname === module.path ||
          location.pathname.startsWith(module.path + "/")
        );
      }
      return false;
    },
    [location.pathname, expandedModuleId]
  );

  const handleModuleNavigation = useCallback(
    (module: NavModule) => {
      if (module.path) {
        onItemSelected?.();
        savePathAndClearStorage(module.path);
        navigate(module.path);
        return;
      }
      // Módulo com filhos: delega ao DashboardLayout, que alterna o SecondaryNav.
      onModuleClick(module);
      onItemSelected?.();
    },
    [navigate, onItemSelected, onModuleClick]
  );

  return (
    <Flex direction="column" h="100%" w="100%" px={2} py={3}>
      {/* Logo + botão de recolher */}
      <Flex
        align="center"
        justify={collapsed ? "center" : "space-between"}
        h="48px"
        px={collapsed ? 0 : 1}
        mb={2}
        flexShrink={0}
      >
        <Image
          src={isDark ? logoMinWhite : logoMin}
          alt="GB Cerne"
          h="28px"
          w="auto"
          userSelect="none"
          pointerEvents="none"
        />
        {!collapsed && onToggleCollapse && (
          <IconButton
            variant="ghost"
            size="sm"
            aria-label={languageGB.common.navRail.toggleSidebar}
            title={languageGB.common.navRail.toggleSidebar}
            onClick={(e) => {
              // stopPropagation: sem isso o clique borbulha até a raiz da
              // sidebar (que também chama onToggleCollapse), disparando o
              // toggle 2x e anulando o efeito líquido.
              e.stopPropagation();
              onToggleCollapse();
            }}
            borderRadius="md"
            color="sidebarSubtitleColor"
            _hover={{ bg: "sidebarItemHoverBG", color: "sidebarTextHover" }}
          >
            <GbIcon name="sidebar-collapse" size={15} />
          </IconButton>
        )}
      </Flex>

      {/* Navegação — lista de módulos */}
      <Flex direction="column" gap="2px" flex="1" overflowY="auto" overflowX="hidden">
        {visibleModules.map((module) => {
          const isActive = isModuleActive(module);
          const hasChildren = !!(module.groups || module.flatItems);
          const isExpanded = expandedModuleId === module.id;

          const moduleLabel = languageGB.sidebar.navigation[module.id] ?? module.label;

          const button = (
            <Flex
              as="button"
              onClick={(e) => {
                // Divergência deliberada vs. o cerne: lá, clicar num módulo em
                // modo FULL propaga e também colapsa a sidebar (onClick da raiz).
                // Aqui os módulos navegam de verdade via React Router — deixar
                // propagar faria a sidebar fechar toda vez que o usuário navega,
                // prejudicando a usabilidade. Por isso stopPropagation também no
                // modo full (não só no icon-only).
                e.stopPropagation();
                handleModuleNavigation(module);
              }}
              align="center"
              gap={collapsed ? 0 : 3}
              justify={collapsed ? "center" : "flex-start"}
              w="100%"
              h="40px"
              px={collapsed ? 0 : 3}
              borderRadius="lg"
              aria-label={moduleLabel}
              aria-current={isActive ? "page" : undefined}
              color={isActive ? "sidebarItemActiveText" : "sidebarTextColor"}
              bg={isActive ? "sidebarItemActiveBG" : "transparent"}
              fontSize="md"
              fontWeight={isActive ? "semibold" : "medium"}
              _hover={{
                bg: isActive ? "sidebarItemActiveBG" : "sidebarItemHoverBG",
                color: isActive ? "sidebarItemActiveText" : "sidebarTextHover",
              }}
              transition="background-color 0.15s ease, color 0.15s ease"
              cursor="pointer"
            >
              <GbIcon name={module.icon} size={collapsed ? 16 : 15} />
              {!collapsed && (
                <>
                  <Text as="span" flex="1" textAlign="left" lineClamp="1">
                    {moduleLabel}
                  </Text>
                  {hasChildren && (
                    // Chevron padronizado (Ajustes Globais): `<` fechado / `>` aberto.
                    <Box
                      as="span"
                      display="flex"
                      flexShrink={0}
                      color={isActive ? "sidebarItemActiveText" : "sidebarSubtitleColor"}
                    >
                      <GbIcon name={isExpanded ? "chevron-right" : "chevron-left"} size={13} />
                    </Box>
                  )}
                </>
              )}
            </Flex>
          );

          return (
            <Box key={module.id} position="relative">
              {collapsed ? (
                <Tooltip content={moduleLabel} positioning={{ placement: "right" }}>
                  {button}
                </Tooltip>
              ) : (
                button
              )}
            </Box>
          );
        })}
      </Flex>
    </Flex>
  );
}

export function NavRail({
  collapsed,
  onToggleCollapse,
  isOpen,
  onClose,
  expandedModuleId,
  onModuleClick,
}: NavRailProps) {
  return (
    <>
      {/* Desktop — card flutuante fixo à esquerda, colapsável. Clique em área
          vazia (não em módulo/ícone — esses fazem stopPropagation) alterna
          abrir/fechar, replicando o onClick={onToggle} da raiz do Sidebar.tsx
          do cerne. */}
      <Box
        onClick={onToggleCollapse}
        position="fixed"
        left="8px"
        top="8px"
        bottom="8px"
        w={collapsed ? SIDEBAR_W_ICON : SIDEBAR_W_FULL}
        bg="sidebarBG"
        borderRadius="2xl"
        zIndex={1100}
        overflow="hidden"
        cursor="default"
        transition="width 0.2s ease"
        display={{ base: "none", md: "block" }}
      >
        <NavRailContent
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          expandedModuleId={expandedModuleId}
          onModuleClick={onModuleClick}
        />
      </Box>

      {/* Mobile — drawer com os mesmos itens (sempre em modo full) */}
      <Drawer.Root
        open={isOpen}
        onOpenChange={(details: { open: boolean }) => {
          if (!details.open) onClose();
        }}
        placement="start"
      >
        <Portal>
          <Drawer.Backdrop />
          {/* @ts-ignore */}
          <Drawer.Positioner>
            {/* @ts-ignore */}
            <Drawer.Content w={SIDEBAR_W_FULL} maxW={SIDEBAR_W_FULL} bg="sidebarBG">
              <NavRailContent
                collapsed={false}
                onItemSelected={onClose}
                expandedModuleId={expandedModuleId}
                onModuleClick={onModuleClick}
              />
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  );
}

export default NavRail;
