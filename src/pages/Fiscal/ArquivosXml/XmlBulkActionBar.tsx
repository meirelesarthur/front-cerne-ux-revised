// src/pages/Fiscal/ArquivosXml/XmlBulkActionBar.tsx
// -----------------------------------------------------------------------------
// Barra flutuante de ações em lote da tela "Arquivos XML" (F-133, Gestão
// Fiscal, esteira 97-Esteiras/008, Tarefa 37). ADAPTAÇÃO (não cópia) do
// `BulkActionBar` do design system `cerne`
// (`GB.Cerne.UX/src/components/ui/BulkActionBar.tsx@24bd916`): o DS é React
// puro com `style` inline e tokens `t.*`; aqui é Chakra UI v3 com os tokens
// semânticos de `src/theme.ts`. Mirror direto de
// `src/pages/CadastrosBase/Rebanho/AnimalBulkActionBar.tsx` (execução 006,
// Tarefa 27) — mesma adaptação, mesmo módulo Fiscal do fork.
//
// Contrato visual honrado do DS:
//   - `count <= 0` → a barra NÃO renderiza (nunca botões desabilitados nem
//     barra vazia);
//   - flutuante, centralizada no rodapé (`position="fixed"`, `zIndex="toast"`
//     — camada de overlay transitório);
//   - conteúdo: ícone de seleção · contagem (`{count} {noun}`, `noun`
//     invariante ao número — ex.: "selecionados") · divisor 1px · N botões ·
//     botão `X`;
//   - `role="toolbar"` + `aria-label` na barra e no `X` (a11y obrigatória);
//   - `danger: true` → `colorPalette="red"`.
//
// Extensão sobre o contrato do DS (adaptação, não desvio): `loading`/
// `disabled` por ação — o DS estático não modela mutações assíncronas; as 2
// ações desta tela (baixar ZIP / enviar e-mail) usam `mutation.isPending`
// (item 6 da Tarefa: enquanto uma ação corre, as duas ficam desabilitadas).
// `clearLabel` — aria-label i18n do botão de fechar, já que este componente
// (diferente do `AnimalBulkActionBar`) não recebe `languageGB` inteiro,
// só o texto pronto (Props: `count`, `actions`, `onClose`, `noun` — fiel ao
// contrato do DS; `clearLabel` é o único acréscimo, opcional).
//
// AD-F02 — NENHUMA ação desta barra tem gate de permissão (C04, decisão
// explícita e deliberada do dono): não adicionar `disabled={!can(...)}` aqui.
// -----------------------------------------------------------------------------

import { Box, Flex, Icon, IconButton, Text } from '@chakra-ui/react';
import { FiCheckSquare, FiX } from 'react-icons/fi';

import { Button } from '@/components/Button';

export interface XmlBulkAction {
  label: string;
  onClick: () => void;
  danger?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

interface XmlBulkActionBarProps {
  count: number; // barra some quando 0
  actions: XmlBulkAction[];
  onClose: () => void;
  noun?: string; // substantivo invariante da contagem (ex.: "selecionados")
  clearLabel?: string; // aria-label i18n do botão de fechar
}

export function XmlBulkActionBar({
  count,
  actions,
  onClose,
  noun,
  clearLabel,
}: XmlBulkActionBarProps) {
  // Contrato do `cerne` (`BulkActionBar.tsx:28`) — a barra SOME com 0
  // selecionados; nunca renderiza vazia nem com botões desabilitados.
  if (count <= 0) return null;

  const countLabel = noun ? `${count} ${noun}` : String(count);

  return (
    <Flex
      role="toolbar"
      aria-label={countLabel}
      position="fixed"
      bottom={7}
      left="50%"
      transform="translateX(-50%)"
      align="center"
      gap={3}
      // Superfície ELEVADA e ESCURA deliberadamente invariante ao tema —
      // mirror do `cerne` e do `AnimalBulkActionBar` (mesma convenção de um
      // toast: a barra flutuante lê igual sobre fundo light ou dark).
      // `gray.*` é a rampa neutra do CERNE, nunca hex fixo.
      bg="gray.800"
      color="white"
      borderRadius="2xl"
      boxShadow="lg"
      paddingY={2}
      paddingX={5}
      zIndex="toast"
      whiteSpace="nowrap"
    >
      <Icon as={FiCheckSquare} boxSize={4} color="green.400" aria-hidden="true" />

      <Text fontSize="sm" fontWeight="semibold">
        {countLabel}
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
          loading={action.loading}
          disabled={action.disabled}
        />
      ))}

      <IconButton
        aria-label={clearLabel ?? countLabel}
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
