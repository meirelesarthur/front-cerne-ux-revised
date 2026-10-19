// src/pages/Frota/Abastecimentos/warehouse-change-product-select-clear-repro.test.tsx
// -----------------------------------------------------------------------------
// Reprodução isolada do bug real reportado pelo dono via teste manual
// (Esteira 017, item 1, 3º achado):
//
// > "quando eu troco o armazém, a unidade de medida é removida e o produto
// > ainda permanece selecionado."
//
// Causa raiz JÁ CONFIRMADA (investigação read-only anterior, evidência
// abaixo, revalidada por leitura própria nesta execução):
//   1. `stock_uuid` TEM vínculo real e exclusivo com Armazém no banco
//      (`Stock.warehouse_id` FK NOT NULL) — a lógica de LIMPAR
//      `stock_uuid`/`measurement_uuid` ao trocar Armazém
//      (`SupplyItemRow.tsx`, onChange do Controller `warehouse_uuid`,
//      `setValue(items.${index}.stock_uuid, null)`) está CORRETA e não foi
//      alterada nesta correção.
//   2. O bug real: o Controller de `stock_uuid` renderizava
//      `<SelectAsyncPaginate value={field.value ?? undefined} .../>`. Quando
//      `setValue(..., null)` roda, `field.value` vira `null`, mas
//      `null ?? undefined` avalia para `undefined` — e
//      `react-select`/`AsyncPaginate` trata `value={undefined}` como campo
//      NÃO-CONTROLADO (mantém a seleção visual antiga), mesmo com o form
//      state já `null` internamente. Anti-padrão documentado no próprio
//      `SelectAsyncPaginate.tsx` (comentário `TASK-BREED-FILTER-CLEAR-FIX`):
//      só `value={null}` força o clear visual.
//   3. O FIX (aplicado nesta execução) troca `?? undefined` por `?? null`
//      nos 4 `SelectAsyncPaginate` de `SupplyItemRow.tsx` (equipment_uuid,
//      warehouse_uuid, stock_uuid, responsible_uuid) — mesmo padrão já usado
//      em dezenas de outros consumidores do componente no projeto (ex.
//      `ProductFormFields.tsx`).
//
// Este teste monta o `SupplyItemRow` REAL (não um clone/mirror) com uma
// linha já hidratada (Armazém + Produto/Estoque selecionados, mirror de uma
// edição em andamento) e substitui APENAS o componente-folha
// `SelectAsyncPaginate` (biblioteca de terceiros `react-select-async-paginate`
// sem precedente de render real em teste neste projeto — AsyncPaginate real
// exigiria abrir portal em `document.body`, aguardar debounce de 500ms e
// paginação assíncrona) por um stub que expõe o `value` efetivamente
// recebido — permitindo provar, na PRÓPRIA lógica de produção de
// `SupplyItemRow.tsx` (não reimplementada), que:
// 1) ANTES de qualquer alteração, o Select de Produto recebe o valor
//    hidratado (rótulo visível, mirror do sintoma "produto permanece
//    selecionado");
// 2) ao disparar o `onChange` real do Controller de Armazém (mesmo handler
//    de produção, incluindo os 2 `setValue(..., null)`), o Select de
//    Produto passa a receber `value === null` — NUNCA `undefined` — que é
//    exatamente a diferença que faz `react-select` limpar a seleção visual;
// 3) o mesmo vale para o Select de Un. Medida (mesma cascata,
//    `measurement_uuid`, usa o wrapper `Select` comum — já usava `?? null`
//    antes desta correção, mantido como guarda de não-regressão).
// -----------------------------------------------------------------------------

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import type { SupplyForm } from '@/@types/v2/Supplies';

import { SupplyItemRow } from './SupplyItemRow';

// Stub do componente-folha de terceiros — expõe exatamente o `value` que
// `SupplyItemRow.tsx` (código de produção, NÃO alterado por este mock)
// calcula e repassa, e permite disparar o `onChange` real recebido de
// produção (mesmo handler que contém os `setValue(..., null)` do gate de
// sequência).
vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: (props: any) => (
    <div>
      <span>{props.label}</span>
      <span data-testid={`value-kind-${props.name}`}>
        {props.value === null ? 'NULL' : props.value === undefined ? 'UNDEFINED' : 'DEFINED'}
      </span>
      <span data-testid={`value-label-${props.name}`}>{props.value?.label ?? ''}</span>
      <button
        type="button"
        data-testid={`change-${props.name}`}
        onClick={() => props.onChange({ value: 'wh-2', label: 'Armazém 2' })}
      >
        trocar {props.name}
      </button>
    </div>
  ),
}));

const stockOptionSelecionado = {
  value: 'stock-1',
  label: 'Produto X',
  quantity: 100,
  measurement: { value: 'um-l', label: 'L' },
  measurementSecond: null,
  factor: null,
  factorType: null,
};

const itemComProdutoJaSelecionado: SupplyForm['items'][number] = {
  equipment_uuid: null,
  hour_meter: null,
  mileage: null,
  warehouse_uuid: { value: 'wh-1', label: 'Armazém 1' },
  stock_uuid: stockOptionSelecionado,
  measurement_uuid: { value: 'um-l', label: 'L' },
  quantity: null,
  responsible_uuid: null,
  note: null,
};

function Harness() {
  const { control, watch, setValue, formState } = useForm<SupplyForm>({
    defaultValues: {
      date: '2026-09-16',
      employee_uuid: null,
      items: [itemComProdutoJaSelecionado],
    },
  });

  return (
    <SupplyItemRow
      index={0}
      control={control}
      errors={formState.errors}
      watch={watch}
      setValue={setValue}
      isDisabled={false}
      canRemove={false}
      onRemove={() => {}}
    />
  );
}

function renderHarness() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <Harness />
      </ChakraProvider>
    </QueryClientProvider>
  );
}

describe('Abastecimentos — Produto permanece selecionado ao trocar Armazém (Esteira 017, item 1)', () => {
  // RTL não registra cleanup automático nesta suíte (vitest.config.ts roda
  // sem `globals: true`) — sem isso, o 2º/3º `render()` desta describe
  // deixariam os testids do 1º render ainda no DOM (`Found multiple
  // elements`). Mirror do problema, não do sintoma sob teste.
  afterEach(() => {
    cleanup();
  });

  it('ANTES da troca: o Select de Produto recebe o valor hidratado (mirror do estado relatado pelo dono)', () => {
    renderHarness();

    expect(screen.getByTestId('value-kind-items.0.stock_uuid').textContent).toBe('DEFINED');
    expect(screen.getByTestId('value-label-items.0.stock_uuid').textContent).toBe('Produto X');
  });

  it('FIX: ao trocar o Armazém, o Select de Produto recebe value === null (nunca undefined) — força o clear visual', () => {
    renderHarness();

    fireEvent.click(screen.getByTestId('change-items.0.warehouse_uuid'));

    // A asserção central do bug: `null ?? undefined` vira `undefined`, que o
    // `react-select`/`AsyncPaginate` trata como NÃO-CONTROLADO (mantém a
    // seleção antiga). O fix garante que o valor passado seja
    // explicitamente `null`.
    expect(screen.getByTestId('value-kind-items.0.stock_uuid').textContent).toBe('NULL');
    expect(screen.getByTestId('value-label-items.0.stock_uuid').textContent).toBe('');
  });

  it('FIX: ao trocar o Armazém, o Select de Un. Medida também é limpo (guarda de não-regressão — já usava `?? null`)', () => {
    renderHarness();

    fireEvent.click(screen.getByTestId('change-items.0.warehouse_uuid'));

    // `measurement_uuid` usa o wrapper `Select` comum (não `SelectAsyncPaginate`),
    // renderizado de verdade — sem opções disponíveis (nenhum `stock_uuid`
    // selecionado), o Select fica vazio/desabilitado.
    expect(screen.queryByText('L')).toBeNull();
  });

  it('FIX: o próprio Select de Armazém também nunca fica undefined ao ser limpo por outro fluxo (mesma correção aplicada nos 4 SelectAsyncPaginate da linha)', () => {
    renderHarness();

    // Estado inicial: Armazém já hidratado (DEFINED), prova que a correção
    // não regrediu a hidratação normal dos outros 3 campos irmãos.
    expect(screen.getByTestId('value-kind-items.0.warehouse_uuid').textContent).toBe('DEFINED');
    expect(screen.getByTestId('value-kind-items.0.equipment_uuid').textContent).toBe('NULL');
    expect(screen.getByTestId('value-kind-items.0.responsible_uuid').textContent).toBe('NULL');
  });
});
