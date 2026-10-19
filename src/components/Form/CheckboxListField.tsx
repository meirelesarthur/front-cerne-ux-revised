// src/components/Form/CheckboxListField.tsx
// -----------------------------------------------------------------------------
// Multi-seleção em LISTA DE CHECKBOXES INLINE — com busca, contador "Nº de
// registros selecionados" e "Marcar/Desmarcar todos". Padrão do design
// system `cerne` para "multi-seleções de cadastros relacionados" (ver
// `GB.Cerne.UX/src/components/ui/CheckboxListField.tsx` — o próprio arquivo
// se documenta como esse padrão, ex.: Fazendas Vinculadas/Proprietários).
//
// ADAPTAÇÃO à stack do fork (React 18 + Chakra UI v3 + tokens semânticos de
// `src/theme.ts`), NÃO cópia 1:1 do arquivo do Storybook (que usa
// `t.*`/estilo inline puro sem framework): a composição visual é recriada
// com primitivas Chakra (`Box`/`Flex`/`Input`/`Badge`) + tokens do projeto
// (`borderGrid`/`gridHeadSecondary`/`gridBGAlternate`/`brandColorText`), para
// herdar automaticamente light/dark do tema já registrado — e com o mesmo
// idioma de `PermissionTreeSelector.tsx` (`Checkbox` do projeto recebendo o
// RÓTULO como `children`, nunca um `onClick` manual duplicado no container:
// o `<label>` nativo do Checkbox já cobre clique no texto inteiro, um único
// disparo de `onCheckedChange`).
//
// Nasceu para substituir o `SelectAsyncPaginate isMulti` do campo "Operações"
// de Atividade (rodada visual 2, pós-E2E) — o dropdown flutuante do
// AsyncPaginate vazava do card em telas menores (overflow) e o dev pediu
// explicitamente o padrão do UX. Componente GENÉRICO (não específico de
// Operação) — fonte única para qualquer outro multiselect de cadastro
// relacionado que precise do mesmo comportamento (não duplicar esta
// composição inline em cada formulário).
//
// Busca: sempre CONTROLADA pelo consumidor (`searchValue`/`onSearchChange`)
// — este componente NUNCA decide sozinho se filtra local ou remotamente.
// Quem decide é quem fornece `items`: se `items` já vier pré-filtrado pelo
// backend (busca server-side, caso de `useOperationsChecklist`), o campo só
// exibe; nada impede um consumidor futuro de filtrar `items` no client antes
// de passá-los (lista pequena, sem paginação real).
//
// `columns` (opcional, adendo pós-E2E Achado 4, execução 029,
// `contrato-adendo-lotes-elegiveis-metricas.md §7.3`/TASK-FE-2005/2105):
// DEFAULT `undefined` → comportamento ORIGINAL preservado (lista vertical
// única, `VStack`) — nenhum dos 8 consumidores já em produção (Usuários,
// Contas Bancárias, Atividades, Contador, Emissores, Farms, Produtos,
// Pessoas) é afetado. Passar um valor (mirror `columnsForm.threeColumns`)
// troca o layout interno para `SimpleGrid` de múltiplas colunas — usado por
// Lote/Módulo e Lote/Área para espelhar o grid de 3 colunas do picker legado
// (imgs 18/19, `e2e-dono-rodada-1.md`), SEM duplicar esta composição em cada
// tela.
// -----------------------------------------------------------------------------

import {
  Badge,
  Box,
  Button,
  Flex,
  Icon,
  Input,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  type SimpleGridProps,
} from '@chakra-ui/react';
import { FiAlertCircle } from 'react-icons/fi';
import { MdInfoOutline } from 'react-icons/md';

import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip } from '@/components/TooLtip';

export interface CheckboxListItem<TValue extends string | number = string> {
  value: TValue;
  label: string;
  /**
   * Opcional — DEFAULT `undefined`/`false` preserva o comportamento ORIGINAL
   * (checkbox clicável normal). Quando `true`, a linha renderiza como um
   * RÓTULO/cabeçalho não-clicável (mesmo texto, sem `<Checkbox>` e sem
   * handler de clique) — usado para exibir um item na lista sem permitir
   * seleção (ex.: Centro de Custo RAIZ no form de Contratante, fiel ao
   * legado `@if($center->depth)`). Nunca entra em `selectedValues` nem no
   * conjunto de "marcar/desmarcar todos".
   */
  nonSelectable?: boolean;
}

export interface CheckboxListFieldProps<TValue extends string | number = string> {
  label: string;
  /** Ícone de info ao lado do label (hover mostra o texto) — Lote 2
   *  (helperText → tooltip no label). Quando omitido, o label renderiza
   *  exatamente como antes (retrocompat total). */
  tooltip?: string;
  /** Itens a EXIBIR — já filtrados pela busca, se `searchValue` estiver ativo. */
  items: CheckboxListItem<TValue>[];
  /** Seleção COMPLETA (não só os itens visíveis/carregados). */
  selectedValues: TValue[];
  onChange: (values: TValue[]) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  selectAllLabel?: string;
  deselectAllLabel?: string;
  /** Prefixo do contador — o número é concatenado pelo componente (`: N`). */
  selectedCountLabel: string;
  /**
   * TASK-FE-1089 — sobrepõe o número exibido no badge (ex.: SOMA de uma
   * métrica do domínio, como `quantity` por animal, em vez da contagem de
   * LINHAS selecionadas — `quantity > 1` existe de verdade em alguns
   * consumidores). Se omitido, mantém o comportamento original
   * (`selectedValues.length`) — 100% retrocompatível com os consumidores
   * existentes (Atividade/Operações etc.), que não passam esta prop.
   */
  selectedCountOverride?: number;
  emptyLabel?: string;
  isLoading?: boolean;
  isError?: boolean;
  errorLabel?: string;
  onRetry?: () => void;
  retryLabel?: string;
  isDisabled?: boolean;
  maxHeight?: string | number;
  /** Ver nota de cabeçalho — `undefined` (default) preserva a lista vertical única. */
  columns?: SimpleGridProps['columns'];
}

export function CheckboxListField<TValue extends string | number = string>({
  label,
  tooltip,
  items,
  selectedValues,
  onChange,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  selectAllLabel = 'Marcar todos',
  deselectAllLabel = 'Desmarcar todos',
  selectedCountLabel,
  selectedCountOverride,
  emptyLabel = 'Nenhum item encontrado.',
  isLoading = false,
  isError = false,
  errorLabel = 'Erro ao carregar a lista.',
  onRetry,
  retryLabel = 'Tentar novamente',
  isDisabled = false,
  maxHeight = '260px',
  columns,
}: CheckboxListFieldProps<TValue>) {
  // Itens `nonSelectable` (rótulo/cabeçalho não-clicável) NUNCA contam para
  // "todos marcados" nem entram no conjunto do toggle-all — ver nota de
  // `CheckboxListItem.nonSelectable`. Consumidores que não passam a flag
  // (default `undefined`) têm `selectableItems === items`, sem mudança de
  // comportamento.
  const selectableItems = items.filter((item) => !item.nonSelectable);

  const allVisibleSelected =
    selectableItems.length > 0 &&
    selectableItems.every((item) => selectedValues.includes(item.value));

  function handleToggle(value: TValue) {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  }

  // "Marcar/desmarcar todos" atua sobre os itens VISÍVEIS (mesma semântica
  // do componente de referência do UX — `items.every(...)`/`items.map(...)`
  // sobre a lista já filtrada) — coerente com busca server-side: marcar
  // "todos" enquanto uma busca está ativa marca os resultados da busca, não
  // o cadastro inteiro (que pode nem estar carregado). Itens `nonSelectable`
  // ficam de fora (nunca marcados, nunca desmarcados por este botão).
  function handleToggleAll() {
    if (selectableItems.length === 0) return;

    if (allVisibleSelected) {
      const visible = new Set(selectableItems.map((item) => item.value));
      onChange(selectedValues.filter((v) => !visible.has(v)));
    } else {
      const merged = new Set([...selectedValues, ...selectableItems.map((item) => item.value)]);
      onChange(Array.from(merged));
    }
  }

  return (
    <Box
      width="full"
      border="1px solid"
      borderColor="borderGrid"
      borderRadius="md"
      overflow="hidden"
    >
      <Flex
        align="center"
        justify="space-between"
        gap={2}
        paddingX={4}
        paddingY={3}
        background="gridHeadSecondary"
        borderBottom="1px solid"
        borderColor="borderGrid"
        wrap="wrap"
      >
        <Flex align="center" gap={2} wrap="wrap">
          <Text fontSize="sm" fontWeight="semibold" color="textGridColor">
            {label}
          </Text>
          {!!tooltip && (
            <Tooltip label={tooltip}>
              <Icon as={MdInfoOutline} boxSize="16px" color="gray.500" />
            </Tooltip>
          )}
          <Badge colorPalette="green" variant="subtle" py={1} px={2}>
            {selectedCountLabel}: {selectedCountOverride ?? selectedValues.length}
          </Badge>
        </Flex>

        {!isDisabled && selectableItems.length > 0 && (
          <Button variant="ghost" color="brandColorText" onClick={handleToggleAll}>
            {allVisibleSelected ? deselectAllLabel : selectAllLabel}
          </Button>
        )}
      </Flex>

      <Box paddingX={4} paddingTop={3}>
        <Input
          size="sm"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          disabled={isDisabled}
        />
      </Box>

      <Box paddingX={2} paddingY={3} maxHeight={maxHeight} overflowY="auto">
        {isLoading ? (
          <Flex align="center" justify="center" paddingY={6}>
            <Spinner size="sm" />
          </Flex>
        ) : isError ? (
          <Flex direction="column" align="center" gap={2} paddingY={6}>
            <Icon as={FiAlertCircle} boxSize={5} color="red.400" />
            <Text fontSize="sm" color="fg.muted">
              {errorLabel}
            </Text>
            {onRetry && (
              <Button variant="outline" onClick={onRetry}>
                {retryLabel}
              </Button>
            )}
          </Flex>
        ) : items.length === 0 ? (
          <Text fontSize="sm" color="fg.muted" paddingX={2} paddingY={2}>
            {emptyLabel}
          </Text>
        ) : columns ? (
          // Grid de múltiplas colunas (Achado 4, ver nota de cabeçalho) —
          // só entra neste ramo quando o consumidor passa `columns`.
          <SimpleGrid columns={columns} gap={0.5} columnGap={4}>
            {items.map((item) =>
              item.nonSelectable ? (
                <Box key={item.value} width="full" paddingX={2} paddingY={1.5}>
                  <Text fontSize="sm" fontWeight="semibold" color="fg.default" lineClamp="1">
                    {item.label}
                  </Text>
                </Box>
              ) : (
                <Checkbox
                  key={item.value}
                  size="sm"
                  checked={selectedValues.includes(item.value)}
                  disabled={isDisabled}
                  onCheckedChange={() => handleToggle(item.value)}
                  width="full"
                  paddingX={2}
                  paddingY={1.5}
                  borderRadius="sm"
                  _hover={!isDisabled ? { background: 'gridBGAlternate' } : undefined}
                >
                  <Text fontSize="sm" color="fg.default" lineClamp="1">
                    {item.label}
                  </Text>
                </Checkbox>
              )
            )}
          </SimpleGrid>
        ) : (
          // Lista vertical única — comportamento ORIGINAL (default).
          <VStack align="stretch" gap={0.5}>
            {items.map((item) =>
              item.nonSelectable ? (
                <Box key={item.value} width="full" paddingX={2} paddingY={1.5}>
                  <Text fontSize="sm" fontWeight="semibold" color="fg.default" lineClamp="1">
                    {item.label}
                  </Text>
                </Box>
              ) : (
                <Checkbox
                  key={item.value}
                  size="sm"
                  checked={selectedValues.includes(item.value)}
                  disabled={isDisabled}
                  onCheckedChange={() => handleToggle(item.value)}
                  width="full"
                  paddingX={2}
                  paddingY={1.5}
                  borderRadius="sm"
                  _hover={!isDisabled ? { background: 'gridBGAlternate' } : undefined}
                >
                  <Text fontSize="sm" color="fg.default" lineClamp="1">
                    {item.label}
                  </Text>
                </Checkbox>
              )
            )}
          </VStack>
        )}
      </Box>
    </Box>
  );
}
