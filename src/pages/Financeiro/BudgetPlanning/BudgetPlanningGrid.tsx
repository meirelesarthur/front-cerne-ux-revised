// src/pages/Financeiro/BudgetPlanning/BudgetPlanningGrid.tsx
// -----------------------------------------------------------------------------
// Grade mensal (categorias × 12 meses) de Prev. Orçamentária (BudgetPlanning
// — F-106, esteira 97-Esteiras/067, TASK-PO-FE-07, GAP-PO-08 resolvido).
// Contrato de tela §4: 1 LINHA por categoria elegível (retornada por
// `listEligibleBudgetPlanningCategories`, COM ou SEM valor salvo) × 12
// COLUNAS FIXAS (meses 0-11) + coluna "Valor Ano Anterior" (read-only,
// `financial_category.last_year_value`) + coluna "Total Ano" (linha, client)
// + linha "Total" por mês (rodapé, client) + total geral (client). NENHUM
// desses 4 totais é enviado ao servidor (contrato §5).
//
// Decisão estrutural (Roteiro da Tarefa): matriz FIXA — NÃO é
// `useFieldArray` de adicionar/remover linha (nº de linhas = nº de
// categorias elegíveis, imutável pelo usuário). `rows` já vem POPULADO pelo
// `fillBudgetPlanningForm` do formulário PAI (`CreateOrUpdateBudgetPlanning`)
// — este componente só lê via `useWatch` (não instancia query própria) e
// liga cada célula por `Controller` de índice fixo `rows.{i}.months.{j}.amount`.
// Estilo (Box com borda, `Badge`/tabela) adaptado de
// `MovementAllocationEditor.tsx`/`AccountingEntryItemsEditor.tsx` — NÃO a
// lógica de array dinâmico (Passo UX, contrato de tela §1).
//
// `Table.Root`/`Table.ScrollArea` nativos do Chakra v3 (mirror
// `OfxImport/Report/index.tsx`) — SEM TanStack Table/`TableProvider`: não há
// ordenação/paginação/customização de coluna que justifique a máquina de
// grid para uma matriz de tamanho fixo dentro de um formulário.
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Alert, Box, Icon, Skeleton, Table, Text } from '@chakra-ui/react';
import { Control, Controller, FieldErrors, useWatch } from 'react-hook-form';
import { FiAlertCircle, FiInbox } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { MoneyInput } from '@/components/Form/MoneyInput';

import { months } from '@/constants/options/months';

import type { LanguageDate } from '@/@types/language';
import type { BudgetPlanningForm } from '@/@types/v2/Financeiro/budgetPlanning';

export interface BudgetPlanningGridProps {
  control: Control<BudgetPlanningForm>;
  errors: FieldErrors<BudgetPlanningForm>;
  languageGB: LanguageDate;
  disabled?: boolean;
  /** Loading do universo de categorias elegíveis (ainda sem `rows` populado). */
  isLoadingEligible?: boolean;
  /** Erro ao carregar o universo de categorias elegíveis. */
  isErrorEligible?: boolean;
  onRetryEligible?: () => void;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// `months` (`@/constants/options/months.ts`) é 1-indexado (label apenas) —
// a API/form usam índice 0-11 (0=Janeiro..11=Dezembro, contrato de tela §4).
// Só o `label` é reaproveitado aqui, por posição (`months[j].label`), nunca
// o `.value` (que é 1-12, não o índice 0-11 do servidor).
const monthLabels = months.map((month) => month.label);

export function BudgetPlanningGrid({
  control,
  errors,
  languageGB,
  disabled = false,
  isLoadingEligible = false,
  isErrorEligible = false,
  onRetryEligible,
}: BudgetPlanningGridProps) {
  const text = languageGB.financial.budgetPlanning.form.grid;

  // Erro de nível de ARRAY — `.message` próprio de `errors.rows` (Yup
  // `.test('ao-menos-1-valor', ...)` client OU 422 real do servidor,
  // `categories.required|array|min:1`, mapeado pelo PAI via
  // `setError('rows', ...)`) — mirror `arrayError` de
  // `MovementAllocationEditor`/`AccountingEntryItemsEditor`.
  const arrayError = (errors as any)?.rows?.message as string | undefined;

  // `rows` já populado 1x pelo `fillBudgetPlanningForm` do PAI — este
  // componente só observa (Lei 2: nenhum `reset`/`append`/`remove` aqui).
  const rows = useWatch({ control, name: 'rows' }) ?? [];

  const monthTotals = useMemo(
    () =>
      Array.from({ length: 12 }, (_, month) =>
        rows.reduce((sum, row) => sum + (Number(row?.months?.[month]?.amount) || 0), 0)
      ),
    [rows]
  );
  const generalTotal = useMemo(
    () => monthTotals.reduce((sum, monthTotal) => sum + monthTotal, 0),
    [monthTotals]
  );

  if (isErrorEligible) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={3}
        py={10}
        borderTop="1px solid"
        borderColor="border.subtle"
      >
        <Icon as={FiAlertCircle} boxSize={8} color="red.400" />
        <Text color="fg.muted">{text.error.message}</Text>
        <Button variant="outline" title={text.error.retry} onClick={onRetryEligible} />
      </Box>
    );
  }

  if (isLoadingEligible) {
    return (
      <Box display="flex" flexDirection="column" gap={2}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} height="40px" borderRadius="md" />
        ))}
      </Box>
    );
  }

  // Universo elegível existe (query resolvida com sucesso) mas devolveu 0
  // categorias — estado real da API, não vazio "cosmético" (contrato §1:
  // "grade em si nunca fica vazia — sempre 1 linha por categoria elegível";
  // aqui não há sequer 1 categoria elegível no tenant).
  if (rows.length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
        py={10}
        borderTop="1px solid"
        borderColor="border.subtle"
      >
        <Icon as={FiInbox} boxSize={8} color="fg.muted" />
        <Text color="fg.muted">{text.emptyEligible}</Text>
      </Box>
    );
  }

  return (
    // F-106 (esteira 089) — fix em DUAS PARTES, ambas comprovadas por
    // medição de DOM ao vivo. A grade tem 15 colunas fixas (categoria + 12
    // meses + ano anterior + total), muito mais larga que a viewport em
    // telas normais.
    //
    // PARTE 1 — constrição de largura (via grid): a casca `FormContainer`
    // envolve este form num `chakra-scroll-area__content` (Ark UI) que é
    // `display:table` — esse ancestral CRESCE até a largura mínima do
    // conteúdo (medido ao vivo: ~2380px), e com todo ancestral crescendo
    // junto o `Table.ScrollArea` interno nunca fica menor que o próprio
    // conteúdo, então não sobra o que rolar (`overflowX:hidden` só CLIPA,
    // não resolve — tentativa anterior, revertida). `display="grid"` com
    // track `gridTemplateColumns="minmax(0, 1fr)"` faz este Box contribuir
    // min-content = 0 para o layout — o `scroll-area__content` da casca
    // PARA de crescer (2380px → 1416px) e o `Table.ScrollArea` interno
    // passa a exceder seu container (2338px em ~1374px). `minW={0}`
    // continua necessário para permitir o encolhimento do grid.
    //
    // PARTE 2 — revelar a barra (via `css` no `Table.ScrollArea` abaixo): a
    // Parte 1 sozinha faz o container transbordar de fato, mas o app
    // ESCONDE as barras de rolagem nativas globalmente
    // (`scrollbarWidth: 'none'` em vários pontos, ex. `src/components/
    // Table.tsx:372`) — a barra horizontal existe, porém INVISÍVEL/overlay,
    // e as colunas depois de Julho pareciam simplesmente cortadas, sem
    // pista de que dava para rolar (medido ao vivo: espaço de scrollbar
    // 2px→12px ao revelar). Mesmo precedente já usado em
    // `src/pages/Relatorios/Financeiro/ApuracaoCusto/index.tsx` (~linhas
    // 552-591): `css` com `scrollbarWidth`/`scrollbarColor` (Firefox) +
    // `::-webkit-scrollbar*` (Chromium) força a barra CLÁSSICA
    // sempre-visível, usando tokens de tema (light+dark), escopado a esta
    // tela — nenhum componente compartilhado nem o hide global tocado.
    <Box minW={0} display="grid" gridTemplateColumns="minmax(0, 1fr)">
      {arrayError && (
        <Alert.Root status="error" borderRadius="md" mb={4}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{arrayError}</Alert.Title>
          </Alert.Content>
        </Alert.Root>
      )}

      <Table.ScrollArea
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="lg"
        maxH="60vh"
        width="100%"
        css={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--chakra-colors-border-emphasized) var(--chakra-colors-bg-muted)',
          '&::-webkit-scrollbar': {
            height: '10px',
            WebkitAppearance: 'none',
          },
          '&::-webkit-scrollbar-track': {
            background: 'var(--chakra-colors-bg-muted)',
            borderRadius: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'var(--chakra-colors-border-emphasized)',
            borderRadius: '8px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'var(--chakra-colors-fg-muted)',
          },
        }}
      >
        <Table.Root size="sm" variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader position="sticky" top={0} bg="bg.panel" zIndex={1} minW="220px">
                {text.categoryColumn}
              </Table.ColumnHeader>
              {monthLabels.map((label) => (
                <Table.ColumnHeader
                  key={label}
                  position="sticky"
                  top={0}
                  bg="bg.panel"
                  zIndex={1}
                  textAlign="end"
                  minW="140px"
                >
                  {label}
                </Table.ColumnHeader>
              ))}
              <Table.ColumnHeader
                position="sticky"
                top={0}
                bg="bg.panel"
                zIndex={1}
                textAlign="end"
                minW="150px"
              >
                {text.lastYearValueColumn}
              </Table.ColumnHeader>
              <Table.ColumnHeader
                position="sticky"
                top={0}
                bg="bg.panel"
                zIndex={1}
                textAlign="end"
                minW="150px"
              >
                {text.totalYearColumn}
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {rows.map((row, rowIndex) => {
              const rowTotal = (row.months ?? []).reduce(
                (sum, cell) => sum + (Number(cell?.amount) || 0),
                0
              );
              const rowErrors = (errors.rows as any)?.[rowIndex] as
                { months?: { amount?: { message?: string } }[] } | undefined;

              return (
                <Table.Row key={row.financial_category.uuid}>
                  <Table.Cell fontWeight="medium">
                    {row.financial_category.code} — {row.financial_category.description}
                  </Table.Cell>
                  {Array.from({ length: 12 }).map((_, month) => (
                    <Table.Cell key={month} px={1} py={1}>
                      <Controller
                        name={`rows.${rowIndex}.months.${month}.amount`}
                        control={control}
                        render={({ field }) => (
                          <MoneyInput
                            name={field.name}
                            value={field.value ?? null}
                            onValueChange={(value) => field.onChange(value)}
                            error={rowErrors?.months?.[month]?.amount?.message}
                            disabled={disabled}
                            size="sm"
                          />
                        )}
                      />
                    </Table.Cell>
                  ))}
                  <Table.Cell textAlign="end" color="fg.muted">
                    {formatCurrencyBRL(row.last_year_value)}
                  </Table.Cell>
                  <Table.Cell textAlign="end" fontWeight="semibold">
                    {formatCurrencyBRL(rowTotal)}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>

          <Table.Footer>
            <Table.Row>
              <Table.Cell fontWeight="bold">{text.totalMonthRow}</Table.Cell>
              {monthTotals.map((monthTotal, month) => (
                <Table.Cell key={month} textAlign="end" fontWeight="bold">
                  {formatCurrencyBRL(monthTotal)}
                </Table.Cell>
              ))}
              <Table.Cell />
              <Table.Cell textAlign="end" fontWeight="bold">
                {text.totalGeneral}: {formatCurrencyBRL(generalTotal)}
              </Table.Cell>
            </Table.Row>
          </Table.Footer>
        </Table.Root>
      </Table.ScrollArea>
    </Box>
  );
}

export default BudgetPlanningGrid;
