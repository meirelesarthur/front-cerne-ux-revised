// src/pages/Home/index.tsx
// -----------------------------------------------------------------------------
// Home do GB Cerne — tela inicial MINIMAMENTE ESTRUTURADA, fiel à Home real do
// protótipo (`MCPs/cerne/src/pages/Dashboard.tsx`): heading + busca decorativa,
// grid de cards de módulo (11 módulos da árvore de navegação) e 3 painéis
// inferiores com dado de EXEMPLO claramente ilustrativo (Últimos acessos /
// Fazendas / Favoritos). Não é tela de produto com dado real — é a referência
// visual/funcional que reflete a Home do design system para o time de front.
//
// Implementada em Chakra UI v3 puro (sem CSS custom), reaproveitando a árvore
// de navegação já portada em `src/config/v2/navigationTree.ts` e os tokens
// semânticos já existentes em `src/styles/theme/semantic/{light,dark}.ts`.
// -----------------------------------------------------------------------------

import {
  Badge,
  Box,
  Flex,
  Heading,
  Icon,
  Input,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { ArrowRight, Plus, ExternalLink, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useMemo } from "react";

import {
  findModuleByPath,
  getAllModuleItems,
  type NavModule,
} from "@/config/v2/navigationTree";
import { useLanguage } from "@/hooks/useLanguage";
import { useMenuModules } from "@/hooks/useMenuModules";

// Popup de Atualizações do Sistema pendentes (GAP-BE-511-systemupdate,
// execução 031) — componente AUTOCONTIDO, só ACRESCENTADO aqui (sem
// refatorar o resto da Home): resolve sozinho dado/permissão/modal/"visto".
import { SystemUpdatePendingModal } from './SystemUpdatePendingModal';

// ─── Dado de EXEMPLO (ilustrativo) — painéis inferiores ──────────────────────
// Nomes de fazenda, itens de "Últimos acessos"/"Favoritos" (labels tipo "Contas
// a Pagar") são dado ilustrativo da Home, não texto de navegação/UI — ficam
// hardcoded de propósito (mesma decisão de design que já existia: paths
// resolvidos de verdade contra `navigationTree.ts`, mas o "conteúdo de
// exemplo" em si não é parte do dicionário de idiomas).
// Paths resolvidos de verdade contra `navigationTree.ts` (não são links mortos).
const recentItems = [
  { label: "Fazendas", module: "Cadastros Base", path: "/cadastros-base/fazendas" },
  { label: "Contas a Pagar", module: "Financeiro", path: "/financeiro/pagar" },
  { label: "DFe Recebidas", module: "Fiscal", path: "/fiscal/dfe" },
  { label: "Mov. Caixa / Bancário", module: "Financeiro", path: "/financeiro/caixa" },
];

const farms = [
  { name: "Fazenda São João", area: "1.240 ha", status: "active" as const },
  { name: "Fazenda Paraíso", area: "860 ha", status: "active" as const },
  { name: "Fazenda Nova Esperança", area: "530 ha", status: "inactive" as const },
];

const FARMS_PATH = "/cadastros-base/fazendas";

// (O painel "Favoritos" deixou de ser mock: renderiza os favoritos REAIS do
// usuário, mesma fonte do módulo Favoritos do menu — GAP-BE-023.)

// ─── Header de seção (título + ação "Ver todos"/"Gerenciar") ────────────────
function SectionHeader({ title, action }: { title: string; action: string }) {
  return (
    <Flex align="center" justify="space-between" mb={3}>
      <Heading size="sm" fontWeight="semibold" color="cardTextPrimary">
        {title}
      </Heading>
      <Flex
        as="button"
        align="center"
        gap={1}
        fontSize="xs"
        fontWeight="medium"
        color="loginButtonPrimary"
        cursor="pointer"
        _hover={{ textDecoration: "underline" }}
      >
        {action}
        <Icon as={ArrowRight} boxSize={3} />
      </Flex>
    </Flex>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  // Cards de módulo já podados pelas permissões do usuário (mesma árvore do
  // NavRail) — quem não vê o módulo no menu também não vê o card na Home.
  const visibleModules = useMenuModules();

  // Paths visíveis para o usuário — usados para filtrar os painéis inferiores
  // (o dado de "Últimos acessos" ainda é ilustrativo, mas nunca deve apontar
  // para uma tela que o usuário não pode ver).
  const visiblePaths = useMemo(
    () =>
      new Set(
        visibleModules.flatMap((m) =>
          getAllModuleItems(m).flatMap((i) => [
            i.path,
            ...(i.children ?? []).map((c) => c.path),
          ])
        )
      ),
    [visibleModules]
  );
  const visibleRecentItems = recentItems.filter((r) => visiblePaths.has(r.path));

  // Favoritos REAIS do usuário (GAP-BE-023) — mesma fonte do módulo Favoritos
  // do menu (useMenuModules materializa e poda por permissão).
  const favoriteItems =
    visibleModules.find((m) => m.id === "favoritos")?.flatItems ?? [];

  const handleModuleClick = (module: NavModule) => {
    // "Home" já é a própria tela — no-op.
    if (module.id === "painel") return;
    // Demais módulos não têm `path` próprio (são grouped/flatItems): navega
    // para o primeiro item-folha, reaproveitando o mecanismo já existente no
    // DashboardLayout que resolve o SecondaryNav certo a partir da rota.
    const firstItem = getAllModuleItems(module)[0];
    if (firstItem) navigate(firstItem.path);
  };

  return (
    <Box
      w="100%"
      maxW="1400px"
      mx="auto"
      px={{ base: 4, md: 6 }}
      py={{ base: 6, md: 8 }}
    >
      {/* Popup de Atualizações do Sistema pendentes — GAP-BE-511-systemupdate,
          execução 031. Renderiza via Portal (Chakra Dialog); não afeta o
          layout do restante da Home. */}
      <SystemUpdatePendingModal />

      {/* Heading + busca decorativa */}
      <Flex direction="column" align="center" mb={10} pb={2} textAlign="center">
        <Heading
          size="2xl"
          fontWeight="semibold"
          letterSpacing="-0.4px"
          color="cardTextPrimary"
          mb={4}
        >
          {languageGB.home.greeting}
        </Heading>
        <Box position="relative" w="100%" maxW="480px">
          <Icon
            as={Search}
            boxSize={4}
            position="absolute"
            left="14px"
            top="50%"
            transform="translateY(-50%)"
            color="cardTextSecondary"
            pointerEvents="none"
          />
          <Input
            placeholder={languageGB.home.searchPlaceholder}
            readOnly
            bg="cardBG"
            border="1px solid"
            borderColor="cardBorder"
            borderRadius="full"
            h="44px"
            pl="40px"
            fontSize="sm"
            color="cardTextPrimary"
            _placeholder={{ color: "cardTextSecondary" }}
            cursor="pointer"
          />
        </Box>
      </Flex>

      {/* Grid de cards de módulo */}
      <SimpleGrid
        columns={{ base: 2, sm: 3, md: 4, lg: 6 }}
        gap={3}
        maxW="1128px"
        mx="auto"
        mb={10}
      >
        {visibleModules.map((module) => {
          const description = languageGB.home.moduleDescriptions[module.id];
          if (!description) return null;
          const moduleLabel = languageGB.sidebar.navigation[module.id] ?? module.label;
          const ModuleIcon = module.icon;
          return (
            <Flex
              key={module.id}
              as="button"
              direction="column"
              align="center"
              textAlign="center"
              gap={2}
              p={4}
              bg="cardBG"
              border="1px solid"
              borderColor="cardBorder"
              borderRadius="xl"
              cursor="pointer"
              transition="transform 0.15s ease, box-shadow 0.15s ease"
              _hover={{ boxShadow: "cardShadow", transform: "translateY(-2px)" }}
              onClick={() => handleModuleClick(module)}
            >
              <Flex
                align="center"
                justify="center"
                boxSize="40px"
                borderRadius="lg"
                bg="sidebarItemActiveBG"
                color="sidebarItemActiveText"
                flexShrink={0}
              >
                <Icon as={ModuleIcon} boxSize={5} />
              </Flex>
              <Text fontSize="sm" fontWeight="semibold" color="cardTextPrimary" lineClamp="1">
                {moduleLabel}
              </Text>
              <Text fontSize="xs" color="cardTextSecondary" lineClamp="2">
                {description}
              </Text>
            </Flex>
          );
        })}
      </SimpleGrid>

      {/* Painéis inferiores — Últimos acessos / Fazendas / Favoritos */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={3}>
        {/* Últimos acessos */}
        <Box bg="cardBG" borderRadius="xl" p={4}>
          <SectionHeader
            title={languageGB.home.panels.recentAccess.title}
            action={languageGB.home.panels.recentAccess.action}
          />
          {visibleRecentItems.length === 0 && (
            <Text fontSize="sm" color="cardTextSecondary" py={2}>
              {languageGB.defaltStrings.noRecentAccess}
            </Text>
          )}
          {visibleRecentItems.map((item) => (
            <Flex
              key={item.label}
              as="button"
              w="100%"
              align="center"
              justify="space-between"
              py={2}
              borderBottom="1px solid"
              borderColor="cardBorder"
              cursor="pointer"
              _last={{ borderBottom: "none" }}
              onClick={() => navigate(item.path)}
            >
              <Box textAlign="left">
                <Text fontSize="sm" fontWeight="medium" color="cardTextPrimary">
                  {item.label}
                </Text>
                <Text fontSize="xs" color="cardTextSecondary" mt="1px">
                  {item.module}
                </Text>
              </Box>
              <Icon as={ExternalLink} boxSize={3} color="cardTextSecondary" />
            </Flex>
          ))}
        </Box>

        {/* Fazendas */}
        <Box bg="cardBG" borderRadius="xl" p={4}>
          <SectionHeader
            title={languageGB.home.panels.farms.title}
            action={languageGB.home.panels.farms.action}
          />
          <Flex direction="column" gap={2}>
            {farms.map((farm) => (
              <Flex
                key={farm.name}
                as="button"
                align="center"
                justify="space-between"
                px={3}
                py={2}
                bg="contentOuterBG"
                border="1px solid"
                borderColor="cardBorder"
                borderRadius="md"
                cursor="pointer"
                onClick={() => navigate(FARMS_PATH)}
              >
                <Box textAlign="left">
                  <Text fontSize="sm" fontWeight="medium" color="cardTextPrimary">
                    {farm.name}
                  </Text>
                  <Text fontSize="xs" color="cardTextSecondary" mt="2px">
                    {farm.area}
                  </Text>
                </Box>
                <Badge
                  colorPalette={farm.status === "active" ? "green" : "gray"}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="medium"
                  px={2}
                  py={0.5}
                >
                  {farm.status === "active"
                    ? languageGB.home.farmStatus.active
                    : languageGB.home.farmStatus.inactive}
                </Badge>
              </Flex>
            ))}
            <Flex
              as="button"
              align="center"
              justify="center"
              gap={1}
              w="100%"
              py={2}
              border="1px dashed"
              borderColor="cardBorder"
              borderRadius="md"
              color="cardTextSecondary"
              fontSize="sm"
              fontWeight="medium"
              cursor="pointer"
              onClick={() => navigate(FARMS_PATH)}
            >
              <Icon as={Plus} boxSize={3.5} />
              {languageGB.home.panels.farms.addButton}
            </Flex>
          </Flex>
        </Box>

        {/* Favoritos */}
        <Box bg="cardBG" borderRadius="xl" p={4}>
          <SectionHeader
            title={languageGB.home.panels.favorites.title}
            action={languageGB.home.panels.favorites.action}
          />
          {favoriteItems.length === 0 && (
            <Text fontSize="sm" color="cardTextSecondary" py={2}>
              {languageGB.defaltStrings.noFavorites}
            </Text>
          )}
          {favoriteItems.map((fav) => {
            const owningModule = findModuleByPath(fav.path);
            return (
              <Flex
                key={fav.id}
                as="button"
                w="100%"
                align="center"
                gap={2.5}
                py={2}
                borderBottom="1px solid"
                borderColor="cardBorder"
                cursor="pointer"
                _last={{ borderBottom: "none" }}
                onClick={() => navigate(fav.path)}
              >
                <Flex
                  align="center"
                  justify="center"
                  boxSize="26px"
                  borderRadius="md"
                  bg="contentOuterBG"
                  fontSize="md"
                  flexShrink={0}
                >
                  {owningModule?.emoji ?? "⭐"}
                </Flex>
                <Text
                  flex="1"
                  textAlign="left"
                  fontSize="sm"
                  fontWeight="medium"
                  color="cardTextPrimary"
                  lineClamp="1"
                >
                  {languageGB.sidebar.navigation[fav.id] ?? fav.label}
                </Text>
                <Icon as={ArrowRight} boxSize={3} color="cardTextSecondary" flexShrink={0} />
              </Flex>
            );
          })}
        </Box>
      </SimpleGrid>
    </Box>
  );
}
