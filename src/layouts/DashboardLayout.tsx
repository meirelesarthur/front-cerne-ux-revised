import { useEffect, useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { Outlet, useLocation } from 'react-router-dom';

import { Header } from '@/components/Header';
import {
  NavRail,
  SIDEBAR_W_FULL,
  SIDEBAR_W_ICON,
} from '@/components/Layout/NavRail';
import { SecondaryNav } from '@/components/Layout/SecondaryNav';
import { NoFarmOnboardingGuard } from '@/components/NoFarmOnboardingGuard';
import { type NavModule } from '@/config/v2/navigationTree';
import { useMenuModuleById, useMenuModuleByPath } from '@/hooks/useMenuModules';
import { GuidedTourProvider } from '@/components/GuidedTour';
import { RightPanelProvider } from '@/contexts/RightPanelContext';
import { LeftSidebarProvider } from '@/contexts/LeftSidebarContext';

export function DashboardLayout() {
  const location = useLocation();

  // Estado do drawer de navegação global (NavRail mobile) — orquestrado pelo layout
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Colapso da sidebar global (desktop): full 240px ↔ icon-only 56px
  const [navCollapsed, setNavCollapsed] = useState(false);

  // Módulo dono da rota atual (usado tanto para o SecondaryNav quanto o
  // breadcrumb) — já PODADO pelas permissões do usuário (useMenuModules), para
  // o SecondaryNav aberto por URL nunca exibir itens que o usuário não pode ver.
  const routeModule = useMenuModuleByPath(location.pathname);
  const routeModuleHasChildren = !!(routeModule?.groups || routeModule?.flatItems);

  // SecondaryNav aberto/fechado: DERIVADO DA ROTA (navegar direto por URL já
  // mostra o painel), mas com um toggle de UI por cima — clicar no módulo na
  // sidebar primária alterna fechar/abrir sem trocar de rota.
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(
    routeModuleHasChildren ? routeModule!.id : null
  );

  // Sempre que a ROTA muda para um módulo-com-filhos diferente, resincroniza
  // o SecondaryNav para o módulo dono da nova rota (ex.: navegação via
  // breadcrumb, link direto, ou o catch-all de outro módulo).
  useEffect(() => {
    if (routeModuleHasChildren && routeModule) {
      setExpandedModuleId(routeModule.id);
    } else if (!routeModuleHasChildren) {
      setExpandedModuleId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeModule?.id, routeModuleHasChildren]);

  const handleModuleClick = (module: NavModule) => {
    // Só módulos com filhos chegam aqui (NavRail já trata navegação direta).
    // Atribuição direta (não accordion): re-clicar no módulo já expandido
    // NUNCA oculta o SecondaryNav — o único jeito de recolher passa a ser o
    // botão de rodapé (`collapsed` local do próprio SecondaryNav).
    setExpandedModuleId(module.id);
  };

  // O módulo expandido pode ter sido aberto por CLIQUE (sem navegação — o caso
  // mais comum, já que a maioria dos módulos não tem `path` próprio) ou já vir
  // aberto por dono da ROTA atual. Busca por id na árvore inteira em vez de
  // depender de `routeModule` bater — senão o painel nunca abre por clique
  // quando a rota atual pertence a outro módulo (ex.: clicar "Cadastros Base"
  // estando em "/home").
  const expandedModule = useMenuModuleById(expandedModuleId);

  const navWidth = navCollapsed ? SIDEBAR_W_ICON : SIDEBAR_W_FULL;
  // Margem do canvas (espelha t.space[2] = 8px do cerne). A NavRail é
  // position=fixed (fora do fluxo do Flex) e já se posiciona a 8px de
  // left/top/bottom — o card de conteúdo (#F2F2F2, "segundo nível") mantém
  // seu vão de 8px (#E8E8E8) para o NavRail: ml = navWidth + 8px (offset) +
  // 8px (vão). O SecondaryNav é que cola na borda esquerda do #F2F2F2.
  const canvasMargin = "8px";

  return (
    <GuidedTourProvider>
    <RightPanelProvider>
      <LeftSidebarProvider>
        {/* Canvas: fundo geral atrás dos 2 cards flutuantes (sidebar + conteúdo) */}
        <Flex
          direction="row"
          minH="100vh"
          h="100vh"
          bg="bodyBackground"
          overflow="hidden"
          boxSizing="border-box"
        >
          {/* Sidebar de navegação global (desktop fixed colapsável; mobile = drawer) */}
          <NavRail
            collapsed={navCollapsed}
            onToggleCollapse={() => setNavCollapsed((v) => !v)}
            isOpen={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            expandedModuleId={expandedModuleId}
            onModuleClick={handleModuleClick}
          />

          {/* Card de conteúdo (#F2F2F2) — mantém o vão de 8px (#E8E8E8) para o
              NavRail (ml = navWidth + 16px). O SecondaryNav cola na borda
              esquerda deste layout. my/mr = moldura de 8px nas demais bordas. */}
          <Flex
            direction="column"
            flex="1"
            minW={0}
            ml={{ base: 0, md: `calc(${navWidth} + 16px)` }}
            my={{ base: 0, md: canvasMargin }}
            mr={{ base: 0, md: canvasMargin }}
            bg={{ base: "bodyBackground", md: "contentOuterBG" }}
            borderRadius={{ base: 0, md: "2xl" }}
            overflow="hidden"
            transition="margin-left 0.2s ease, background-color 0.2s ease"
          >
            {/* Topbar — vive dentro do card, sem fundo/borda próprios */}
            <Header
              navCollapsed={navCollapsed}
              onMenuClick={() => setMobileNavOpen(true)}
              expandedModule={expandedModule}
            />

            {/* Container do conteúdo: SecondaryNav (condicional) + área principal.
                O SecondaryNav COLA na borda esquerda do layout de conteúdo
                (#F2F2F2), sem pl (Ajustes Globais); py={2} mantém a moldura de
                8px em cima/baixo. */}
            <Flex flex="1" overflow="hidden" position="relative">
              {expandedModule && (
                <Box h="100%" py={2} flexShrink={0}>
                  <SecondaryNav module={expandedModule} />
                </Box>
              )}

              {/* Área da rota: coluna bounded que NÃO rola. `main` preenche por
                  flex e só rola quando a própria rota flui além da altura (ex.:
                  formulários); listagens preenchem exato e rolam internamente. */}
              <Box flex="1" overflow="hidden" minW={0} display="flex" flexDirection="column">
                <Box as="main" flex="1" minH={0} overflow="auto">
                  {/* TASK-072-FE-11 — contratante sem fazenda só abre a
                      allowlist; o chrome (sidebar/header) segue visível. */}
                  <NoFarmOnboardingGuard>
                    <Outlet />
                  </NoFarmOnboardingGuard>
                </Box>
              </Box>
            </Flex>
          </Flex>
        </Flex>
      </LeftSidebarProvider>
    </RightPanelProvider>
    </GuidedTourProvider>
  );
}
