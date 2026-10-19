// src/pages/CadastrosBase/Rebanho/AnimalBulkActionBar.tsx
// -----------------------------------------------------------------------------
// Barra flutuante de ações em lote da tela Rebanho (Tarefa 27, Gestão Animais
// — feature 3596a556). ADAPTAÇÃO (não cópia) do `BulkActionBar` do design
// system `cerne` (`GB.Cerne.UX/src/components/ui/BulkActionBar.tsx@24bd916`):
// o DS é React puro com `style` inline e tokens `t.*`; aqui é Chakra UI v3 com
// os tokens semânticos de `src/theme.ts` (AD-F03, contrato de tela §3.2/§3.3).
//
// Contrato visual honrado do DS:
//   - `count <= 0` → a barra NÃO renderiza (nunca botões desabilitados nem
//     barra vazia — IG-11/CLM-11 adaptado);
//   - flutuante, centralizada no rodapé (`position="fixed"`, `zIndex="toast"`
//     — camada de overlay transitório, não o footer de página que
//     `get_pwa_ui_components_pattern §3` restringe);
//   - conteúdo: ícone de seleção · contagem (i18n, singular/plural real,
//     nunca `count !== 1 ? 's' : ''`) · divisor 1px · N botões · botão `X`;
//   - `role="toolbar"` + `aria-label` na barra e no `X` (a11y obrigatória);
//   - `danger: true` → `colorPalette="red"`.
//
// Esta Tarefa entrega a barra SEM nenhuma ação plugada (`actions=[]`) — as
// Tarefas 28/29/30 preenchem o array em `index.tsx`.
// -----------------------------------------------------------------------------

import { Box, Flex, Icon, IconButton, Text } from '@chakra-ui/react';
import { FiCheckSquare, FiX } from 'react-icons/fi';

import { Button } from '@/components/Button';

import type { LanguageDate } from '@/@types/language';

export interface AnimalBulkAction {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface AnimalBulkActionBarProps {
  count: number;
  actions: AnimalBulkAction[];
  onClose: () => void;
  languageGB: LanguageDate;
}

export function AnimalBulkActionBar({
  count,
  actions,
  onClose,
  languageGB,
}: AnimalBulkActionBarProps) {
  const text = languageGB.animals.animal.list.bulkBar;

  // Contrato do `cerne` (`BulkActionBar.tsx:28`) — a barra SOME com 0
  // selecionados; nunca renderiza vazia nem com botões desabilitados.
  if (count <= 0) return null;

  return (
    <Flex
      role="toolbar"
      aria-label={text.ariaLabel}
      position="fixed"
      bottom={7}
      left="50%"
      transform="translateX(-50%)"
      align="center"
      gap={3}
      // Superfície ELEVADA e ESCURA deliberadamente invariante ao tema —
      // mirror do `cerne` (`BulkActionBar.tsx`: `t.color.neutral[800]` no
      // branch fora de GBMode), mesma convenção de um toast: a barra
      // flutuante lê igual sobre fundo light ou dark. `gray.*` aqui é a
      // rampa neutra do CERNE (`color-tokens.ts`), nunca hex fixo.
      bg="gray.800"
      color="white"
      borderRadius="2xl"
      boxShadow="lg"
      paddingY={2}
      paddingX={5}
      // Abaixo de `modal` (1400): diálogos abertos (ex.: Apagar Animais, cujo
      // rodapé fica na mesma região) nunca ficam cobertos pela barra.
      zIndex="banner"
      whiteSpace="nowrap"
    >
      <Icon as={FiCheckSquare} boxSize={4} color="green.400" aria-hidden="true" />

      <Text fontSize="sm" fontWeight="semibold">
        {count === 1
          ? text.selectedOne.replace('{count}', String(count))
          : text.selectedMany.replace('{count}', String(count))}
      </Text>

      <Box aria-hidden="true" width="1px" height={5} bg="gray.600" />

      {actions.map((action) => (
        <Button
          key={action.label}
          title={action.label}
          size="sm"
          variant="solid"
          colorPalette={action.danger ? 'red' : undefined}
          onClick={action.onClick}
        />
      ))}

      <IconButton
        aria-label={text.clearSelection}
        onClick={onClose}
        size="sm"
        variant="ghost"
        color="gray.400"
        _hover={{ color: 'white', bg: 'gray.700' }}
      >
        <Icon as={FiX} boxSize={4} />
      </IconButton>
    </Flex>
  );
}
