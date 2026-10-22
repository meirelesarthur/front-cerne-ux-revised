// src/components/Header/index.tsx
// Topbar do GB Cerne — fiel ao design system cerne (implementado em Chakra v3).
// Esquerda: breadcrumb "Início › [Módulo] › [Item]" (só adiciona os segmentos
// que existirem). Direita: search bar decorativa (ícone + "Buscar..." + atalho
// ⌘K, sem busca real por enquanto), botão de notificações (Bell + badge
// com contador real, T-081-FE-11) e as ações existentes (error log em dev,
// painel de contexto, menu mobile). O toggle de tema NÃO mora mais aqui — foi para o rodapé da
// NavRail/Sidebar, espelhando o protótipo cerne (lá o Sol/Lua fica na sidebar).
// Fundo TRANSPARENTE e sem borda própria (fiel a Topbar.tsx do cerne) — o
// Header vive dentro do card de conteúdo (DashboardLayout) e herda o fundo dele.
// topBarBG/topBarBorder continuam usados só em elementos internos (search bar,
// badge), não mais no container raiz.

import { useLanguage } from "@/hooks/useLanguage";
import { findItemByPath, type NavModule } from "@/config/v2/navigationTree";
import {
  Badge,
  Box,
  Flex,
  HStack,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import { AccountMenu } from "@/components/Header/AccountMenu";
import { BreadcrumbTrail } from "@/components/ui/BreadcrumbTrail";
import { Icon as GbIcon } from "@/components/ui/Icon";
import { ErrorLogPanel } from "@/components/ErrorLogPanel";
import { FarmSwitcher } from "@/components/FarmSwitcher";
import { HeaderSearch } from "@/components/HeaderSearch";
import { NotificationPanel } from "@/components/NotificationPanel";
import { Tooltip } from "@/components/ui/tooltip";
import { useRightPanel } from "@/contexts/RightPanelContext";
import { useLeftSidebar } from "@/contexts/LeftSidebarContext";
import useErrorLog from "@/hooks/useErrorLog";

interface HeaderProps {
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
  /**
   * Sidebar global recolhida. Não é mais usada para offset (o Header agora vive
   * DENTRO do card de conteúdo, que já é deslocado pelo DashboardLayout) — mantida
   * na interface só por compatibilidade de chamada.
   */
  navCollapsed?: boolean;
  /** Módulo com o SecondaryNav aberto (mesma fonte do DashboardLayout) — alimenta o 2º nível do breadcrumb. */
  expandedModule?: NavModule;
}

export function Header({
  onMenuClick,
  expandedModule,
}: HeaderProps) {
  const { languageGB } = useLanguage();
  const location = useLocation();
  const { hasPanel, togglePanel } = useRightPanel();
  const { hasSidebar, toggleSidebar } = useLeftSidebar();

  // Item ativo dentro do módulo expandido — alimenta o 3º nível do breadcrumb.
  const activeItem = useMemo(
    () => findItemByPath(location.pathname, expandedModule),
    [location.pathname, expandedModule]
  );

  const { unreadCount: errorCount } = useErrorLog();

  const breadcrumbItems = [
    { label: "Início" },
    ...(expandedModule
      ? [{ label: languageGB.sidebar.navigation[expandedModule.id] ?? expandedModule.label }]
      : []),
    ...(activeItem
      ? [{ label: languageGB.sidebar.navigation[activeItem.id] ?? activeItem.label }]
      : []),
  ];

  return (
    <Box
      position="relative"
      background="transparent"
      pl={3}
      pr={4}
      h="48px"
      flexShrink={0}
      display="flex"
      alignItems="center"
      zIndex={1}
    >
      <Flex align="center" justify="space-between" w="full">
        {/* Esquerda — toggle da sidebar secundária (quando houver) + breadcrumb */}
        <HStack gap={2}>
          {hasSidebar && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              aria-label={languageGB.common.navRail.toggleSidebar}
              title={languageGB.common.navRail.toggleSidebar}
              borderRadius="lg"
            >
              <Box as="span" display="flex" color="topBarIconColor"><GbIcon name="sidebar-collapse" size="lg" /></Box>
            </IconButton>
          )}

          {/* Breadcrumb: Início / [Módulo] / [Item] — componente do kit (DS Breadcrumb) */}
          <BreadcrumbTrail items={breadcrumbItems} />
        </HStack>

        {/* Direita — busca funcional + ações */}
        <HStack gap={2}>
          {/* Busca do Header (desktop + mobile, mesma instância) — TASK-FE-903/904 */}
          <HeaderSearch />

          {/* Seletor de fazenda ativa (troca o contexto X-Farm-Id) — TASK-FE-921.
              Auto-oculto quando o usuário não tem fazenda vinculada (DEC-020.3). */}
          <FarmSwitcher />

          {/* Error Log — oculto em produção */}
          {import.meta.env.VITE_APP_ENVIRONMENT !== "production" && (
            <ErrorLogPanel
              trigger={
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label={languageGB.common.errorLog.title}
                  borderRadius="lg"
                  position="relative"
                >
                  <Box as="span" display="flex" color={errorCount > 0 ? "red.400" : "topBarIconColor"}>
                    <GbIcon name="warning" size="lg" />
                  </Box>
                  {errorCount > 0 && (
                    <Badge
                      position="absolute"
                      top="2px"
                      right="2px"
                      colorPalette="red"
                      variant="solid"
                      borderRadius="full"
                      fontSize="9px"
                      minW="16px"
                      h="16px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {errorCount > 9 ? "9+" : errorCount}
                    </Badge>
                  )}
                </IconButton>
              }
            />
          )}

          {/* Sino global (T-081-FE-11): o contador real é desenhado pelo NotificationPanel */}
          <NotificationPanel
            trigger={
              <IconButton
                variant="ghost"
                size="sm"
                aria-label={languageGB.common.navRail.notifications}
                borderRadius="lg"
                position="relative"
              >
                <Box as="span" display="flex" color="topBarIconColor"><GbIcon name="bell" size="lg" /></Box>
              </IconButton>
            }
          />

          {/* Menu da conta (Execução 071, TASK-071-FE-05, SRF-071-06/06a) —
              o avatar deixou de navegar para /home e passou a abrir o menu
              da conta (perfil, idioma, tema, planos/config/ajuda "em breve"
              e sair). */}
          <AccountMenu />

          {/* Toggle do painel de contexto (chat do Aleex) — só quando há painel na rota. */}
          {hasPanel && (
            <Tooltip content={languageGB.common.navRail.talkToAleex} showArrow>
              <IconButton
                variant="ghost"
                size="sm"
                onClick={togglePanel}
                aria-label={languageGB.common.navRail.talkToAleex}
                borderRadius="lg"
              >
                <Box as="span" display="flex" color="primaryMain"><GbIcon name="message" size="lg" /></Box>
              </IconButton>
            </Tooltip>
          )}

          {/* Menu mobile — abre o drawer de navegação global (NavRail mobile) */}
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            aria-label={languageGB.common.navRail.menu}
            title={languageGB.common.navRail.menu}
            borderRadius="lg"
            display={{ base: "flex", md: "none" }}
          >
            <Box as="span" display="flex" color="topBarIconColor"><GbIcon name="menu" size="lg" /></Box>
          </IconButton>
        </HStack>
      </Flex>
    </Box>
  );
}

export default Header;
