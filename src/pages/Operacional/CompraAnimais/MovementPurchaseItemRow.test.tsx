// @vitest-environment jsdom
// T-FE-01 (088) — trava do Valor Unitário por ORIGEM fiscal (não por chave digitada).
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import type { MovementPurchaseForm, MovementPurchaseItemForm } from '@/@types/v2/MovementPurchases';

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    languageInUse: 'BR',
    languageGB: languagePtBr.BR,
    updateLanguageGB: vi.fn(),
  }),
}));

vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: () => null,
}));

const { MovementPurchaseItemRow } = await import('./MovementPurchaseItemRow');
const { buildMovementPurchaseItemPayload, computeMovementPurchaseItemAmount } =
  await import('./useMovementPurchases');

const text = languagePtBr.BR.movementPurchases.movementPurchase.form.itemRow;

function item(overrides: Partial<MovementPurchaseItemForm> = {}): MovementPurchaseItemForm {
  return {
    category_uuid: { label: 'Boi', value: 'cat-1' },
    batch_uuid: null,
    grazing_uuid: null,
    center_uuid: null,
    quantity: 3,
    value_unit: 10.5,
    amount: 31.5,
    note: '',
    item_description: 'BOI NELORE',
    ...overrides,
  };
}

function Harness({
  isFiscalLocked,
  chave = null,
  row,
}: {
  isFiscalLocked: boolean;
  chave?: string | null;
  row: MovementPurchaseItemForm;
}) {
  const { control, watch, formState } = useForm<MovementPurchaseForm>({
    defaultValues: { chave, items: [row] } as unknown as MovementPurchaseForm,
  });
  return (
    <ChakraProvider value={system}>
      <MovementPurchaseItemRow
        index={0}
        control={control}
        errors={formState.errors}
        watch={watch}
        isDisabled={false}
        isFiscalLocked={isFiscalLocked}
        onRemove={() => {}}
      />
    </ChakraProvider>
  );
}

const valueUnitInput = () =>
  document.querySelector('input[name="items.0.value_unit"]') as HTMLInputElement;

afterEach(cleanup);

const norm = (v: string) => v.replace(/\s/g, ' ');
const shows = (v: string) => norm(document.body.textContent ?? '').includes(norm(v));

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

describe('MovementPurchaseItemRow — trava do Valor Unitário', () => {
  it('compra nova com chave DIGITADA (sem origem fiscal): unitário editável e total = qtd x unit', () => {
    render(<Harness isFiscalLocked={false} chave={'1'.repeat(44)} row={item()} />);
    const input = valueUnitInput();
    expect(input.readOnly).toBe(false);
    expect(input.disabled).toBe(false);
    expect(shows(brl(31.5))).toBe(true);
    expect(screen.queryByText(text.fields.itemDescription)).toBeNull();
  });

  it('itens do XML / compra salva com chave: unitário somente leitura com valor em R$', () => {
    render(<Harness isFiscalLocked chave={'1'.repeat(44)} row={item()} />);
    expect(document.querySelector('input[name="items.0.value_unit"]')).toBeNull();
    expect(shows(brl(10.5))).toBe(true);
    expect(screen.getByText('BOI NELORE')).toBeTruthy();
  });

  it('travado com unitário 0 mostra R$ 0,00 (nunca "—")', () => {
    render(<Harness isFiscalLocked row={item({ value_unit: 0, amount: 0 })} />);
    expect(shows(brl(0))).toBe(true);
    expect(shows('—')).toBe(false);
  });

  it('sem chave e sem origem fiscal: editável', () => {
    render(<Harness isFiscalLocked={false} row={item()} />);
    expect(valueUnitInput().readOnly).toBe(false);
  });
});

describe('Valor Total do item', () => {
  it('manual: qtd x unit com round 2', () => {
    expect(
      computeMovementPurchaseItemAmount(item({ quantity: 3, value_unit: 3.333, amount: 0 }))
    ).toBe(10);
    expect(buildMovementPurchaseItemPayload(item({ quantity: 2, value_unit: 1.005 })).amount).toBe(
      2.01
    );
  });

  it('XML: preserva amount da nota enquanto qtd/unit inalterados; recalcula ao editar', () => {
    const xml = item({
      quantity: 3,
      value_unit: 3.33,
      amount: 10,
      fiscal_baseline: { quantity: 3, value_unit: 3.33, amount: 10 },
    });
    expect(buildMovementPurchaseItemPayload(xml).amount).toBe(10);
    expect(buildMovementPurchaseItemPayload({ ...xml, quantity: 4 }).amount).toBe(13.32);
    expect(buildMovementPurchaseItemPayload({ ...xml, value_unit: 4 }).amount).toBe(12);
  });
});
