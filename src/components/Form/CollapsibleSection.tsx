// src/components/Form/CollapsibleSection.tsx
// -----------------------------------------------------------------------------
// Seção colapsável de formulário — adaptação do `CollapsibleSection` do
// design system `cerne` (`ux_root/src/components/ui/CollapsibleSection.tsx`,
// composição: título + badge de contagem de campos + conteúdo
// aberto/fechado) para a stack do fork (Chakra UI v3 + Ark-UI `Accordion`,
// nenhum componente equivalente existia no catálogo — `Regra F`/escada de
// reuso: não existe, criado aqui ANTES de ser usado, em vez de inline numa
// página). Criado por TASK-FE-1043 (execução 026, formulário de Estoque
// Inicial, primeiro consumidor de 3 zonas colapsáveis do projeto).
//
// Base estrutural: `Accordion.Root` nativo do Chakra v3 (Ark-UI), já uma
// dependência instalada (não é lib nova) — `collapsible` (permite fechar o
// único item) + `defaultValue` controla o estado inicial aberto/fechado via
// `defaultOpen`. Cada instância tem seu próprio `Accordion.Root` (não é uma
// lista de itens dentro de um Root compartilhado) porque cada Zona do
// formulário abre/fecha independentemente das outras — mirror do
// comportamento do UX (`defaultOpen` por seção, sem exclusividade mútua).
//
// Tokens semânticos do Chakra (`bg.muted`/`border.subtle`/`fg.muted`) — os
// MESMOS já usados em `FormContainer.tsx` — garantem suporte automático a
// light/dark, sem cor hardcoded.
//
// exec-038 HOMOLOG R2 (R2-01, achado E2E do dono) — suporte OPT-IN a modo
// "agrupado": quando renderizado dentro de `CollapsibleSectionGroup`
// (`CollapsibleSectionGroupContext` = `true`), esta seção deixa de montar seu
// PRÓPRIO `Accordion.Root` e passa a renderizar só o `Accordion.Item`,
// reaproveitando o Root único do grupo — Ark-UI/zag-js Accordion tem
// `multiple: false` como DEFAULT (confirmado em
// `@zag-js/accordion/dist/accordion.machine.js`), então um Root
// compartilhado com vários Items dá "abrir um fecha os outros" de graça, sem
// estado controlado manual. FORA de um grupo, o comportamento é 100%
// INALTERADO (Root próprio por instância, como sempre foi) — nenhum
// consumidor existente (`Config`, `Invoices`, `NfeEmitidas`,
// `CreateOrUpdateEmissor`, `CreateOrUpdateEstoqueInicial`, `CreateBaixaEstoque`)
// regride. O visual (borda/raio/fundo do header) migrou do Root para o
// Item para ficar idêntico nos dois modos.
// -----------------------------------------------------------------------------
import { ReactNode, createContext, useContext } from 'react';

import { Accordion, Badge, Box, Flex, Text } from '@chakra-ui/react';

/** Só usado internamente por `CollapsibleSectionGroup` — não importe direto
 *  fora deste par de arquivos. */
export const CollapsibleSectionGroupContext = createContext(false);

interface CollapsibleSectionProps {
  title: string;
  /** Badge numérico opcional (contagem de campos da seção — mirror UX). */
  fieldCount?: number;
  /** Estado inicial aberto/fechado (default `true`, mirror UX `defaultOpen`).
   *  Ignorado dentro de um `CollapsibleSectionGroup` — lá o aberto inicial é
   *  `defaultOpenSectionId` do grupo. */
  defaultOpen?: boolean;
  children: ReactNode;
  /** Identificador estável desta seção dentro do `Accordion.Root`
   *  compartilhado — OBRIGATÓRIO dentro de um `CollapsibleSectionGroup`
   *  (cada seção do grupo precisa de um `value` distinto). Fora de um grupo,
   *  ignorado (mantém o valor interno fixo `'section'`, comportamento
   *  inalterado). */
  sectionId?: string;
}

export function CollapsibleSection({
  title,
  fieldCount,
  defaultOpen = true,
  children,
  sectionId,
}: CollapsibleSectionProps) {
  const insideGroup = useContext(CollapsibleSectionGroupContext);
  const itemValue = sectionId ?? 'section';

  const item = (
    <Accordion.Item
      value={itemValue}
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="md"
      overflow="hidden"
      mb={insideGroup ? 4 : 0}
    >
      <Accordion.ItemTrigger
        px={4}
        py={3}
        bg="bg.muted"
        cursor="pointer"
        _hover={{ opacity: 0.85 }}
      >
        <Flex flex="1" align="center" gap={2}>
          <Text fontWeight="600" fontSize="sm" color="fg.default">
            {title}
          </Text>
          {typeof fieldCount === 'number' && (
            <Badge colorPalette="gray" size="sm" borderRadius="full">
              {fieldCount}
            </Badge>
          )}
        </Flex>
        <Accordion.ItemIndicator />
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <Accordion.ItemBody px={4} py={4}>
          <Box>{children}</Box>
        </Accordion.ItemBody>
      </Accordion.ItemContent>
    </Accordion.Item>
  );

  if (insideGroup) {
    return item;
  }

  return (
    <Accordion.Root collapsible defaultValue={defaultOpen ? [itemValue] : []} mb={6}>
      {item}
    </Accordion.Root>
  );
}
