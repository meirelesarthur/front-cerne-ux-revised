// src/components/ModulePlaceholder.tsx
// -----------------------------------------------------------------------------
// Placeholder genérico de item de navegação "Em construção" do GB Cerne.
//
// Duas formas de uso:
//  1) `<ModulePlaceholder moduleName="X" />` — uso direto (retrocompatível),
//     usado por Home ou qualquer tela que já sabe seu próprio nome.
//  2) `<RoutePlaceholder />` — usado pelas rotas catch-all de cada módulo
//     (`/cadastros-base/*`, `/administrativo/*` etc.). Ele descobre sozinho,
//     a partir de `location.pathname`, qual item da árvore de navegação
//     (`navigationTree.ts`) corresponde à rota atual e mostra o label desse
//     item — reaproveitando o mesmo corpo visual do ModulePlaceholder.
// -----------------------------------------------------------------------------

import { Flex, Heading, Icon, Text } from "@chakra-ui/react";
import { Construction } from "lucide-react";
import { useLocation } from "react-router-dom";

import {
  findItemByPath,
  findModuleByBaseSegment,
  findModuleByPath,
} from "@/config/v2/navigationTree";
import { AccessDenied } from "@/components/AccessDenied";
import { useLanguage } from "@/hooks/useLanguage";
import {
  ruleAllows,
  ruleForNavId,
  useMenuModules,
} from "@/hooks/useMenuModules";
import { usePermissions } from "@/hooks/usePermissions";

interface ModulePlaceholderProps {
  /** Nome do módulo/item, ex.: "Financeiro". */
  moduleName: string;
  /** Texto de apoio opcional. */
  description?: string;
}

export function ModulePlaceholder({
  moduleName,
  description,
}: ModulePlaceholderProps) {
  const { languageGB } = useLanguage();
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minH="70vh"
      p={8}
      m={6}
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="border.default"
      borderRadius="xl"
      bg="bg.subtle"
    >
      <Icon as={Construction} boxSize={12} color="fg.muted" mb={4} />
      <Heading size="lg" color="fg.default" mb={2} textAlign="center">
        {moduleName}
      </Heading>
      <Text color="fg.muted" textAlign="center" maxW="440px">
        {description ?? languageGB.sidebar.placeholderDescription}
      </Text>
    </Flex>
  );
}

/**
 * Placeholder "auto-descobrível" usado pelas rotas catch-all de módulo.
 * Resolve o item ativo da árvore de navegação a partir do pathname atual e
 * exibe o label correspondente (ou o label do módulo, se não achar item
 * folha específico — ex.: acessar a rota-base do módulo direto por URL).
 */
export function RoutePlaceholder() {
  const location = useLocation();
  const { languageGB } = useLanguage();
  const { can, canAny, hasRole, hasFarm, isFarmScoped } = usePermissions();
  const visibleModules = useMenuModules();
  const module = findModuleByPath(location.pathname);
  const item = findItemByPath(location.pathname, module);

  // Guard por permissão (equivalente do <RequirePermission> para catch-all).
  // Dois níveis — UX apenas; o 403 real é do backend:
  // 1. Item conhecido da árvore → vale a regra dele (sameAs resolvido: os
  //    placeholders de Favoritos herdam a regra do item-alvo). Farm-scoping
  //    (GAP-BE-033) entra pelo mesmo `ruleAllows` do useMenuModules — sem
  //    isso, a URL direta ficaria inconsistente com o menu (que já esconde
  //    o item sem fazenda ativa).
  // 2. Path sem item mapeado (ex.: /fiscal/rota-inexistente) → vale o MÓDULO
  //    dono do segmento-base: se ele existe na árvore estática mas não sobrou
  //    na árvore podada do usuário, é acesso negado — não placeholder.
  const baseModule = module ?? findModuleByBaseSegment(location.pathname);
  const allowed = item
    ? ruleAllows(ruleForNavId(item.id), { can, canAny, hasFarm, isFarmScoped, hasRole })
    : baseModule
      ? visibleModules.some((m) => m.id === baseModule.id)
      : true;

  if (!allowed) return <AccessDenied />;

  const resolvedId = item?.id ?? module?.id;
  const fallbackLabel = item?.label ?? module?.label ?? "Funcionalidade";
  const label = resolvedId
    ? languageGB.sidebar.navigation[resolvedId] ?? fallbackLabel
    : fallbackLabel;

  return <ModulePlaceholder moduleName={label} />;
}

export default ModulePlaceholder;
