// UT-000796 (T-03) — filtro OPCIONAL de categoria do rateio: com
// `categoryOptionsParams` o `findParams` mescla os parâmetros e `cacheUniqs`
// muda; sem a prop o comportamento é idêntico ao anterior (EditRateioMovimento,
// NewMovementModal, BulkInvestmentBanner).
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, render } from '@testing-library/react';
import { useFieldArray, useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ can: () => false, canAny: () => false, canAll: () => false }),
}));
vi.mock('@/components/ui/toaster', () => ({ toaster: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/v2/CostCenters/cost-center-service', () => ({
  listCostCenterOptions: vi.fn(),
}));
vi.mock('@/services/v2/FinancialCategories/financial-category-service', () => ({
  listFinancialCategoryOptions: vi.fn(),
  listAllFinancialCategoriesForReport: vi.fn(),
}));

const captured = vi.hoisted(() => ({ byName: {} as Record<string, any> }));
vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: (props: any) => {
    captured.byName[props.name] = props;
    return <div data-testid={props.name} />;
  },
}));

import type { ListFinancialCategoryOptionsParams } from '@/services/v2/FinancialCategories/financial-category-service';

import { MovementAllocationEditor, type AllocationsFieldValues } from './MovementAllocationEditor';

function Harness({ params }: { params?: Partial<ListFinancialCategoryOptionsParams> }) {
  const { control, formState } = useForm<AllocationsFieldValues>({
    defaultValues: {
      allocations: [
        {
          category_uuid: null,
          center_uuid: null,
          plan_account_uuid: null,
          harvest_uuid: null,
          value: 10,
        },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'allocations' });
  return (
    <MovementAllocationEditor
      control={control}
      fields={fields}
      append={append}
      remove={remove}
      headerValue={10}
      errors={formState.errors}
      languageGB={languagePtBr.BR}
      categoryOptionsParams={params}
    />
  );
}

function renderHarness(params?: Partial<ListFinancialCategoryOptionsParams>) {
  const ui = (p?: Partial<ListFinancialCategoryOptionsParams>) => (
    <ChakraProvider value={system}>
      <Harness params={p} />
    </ChakraProvider>
  );
  const utils = render(ui(params));
  return {
    ...utils,
    rerenderWith: (p?: Partial<ListFinancialCategoryOptionsParams>) => utils.rerender(ui(p)),
  };
}

const category = () => captured.byName['allocations.0.category_uuid'];

describe('MovementAllocationEditor — filtro de categoria (UT-796)', () => {
  afterEach(() => {
    cleanup();
    captured.byName = {};
  });

  it('sem a prop: findParams devolve só { search } e cacheUniqs não é enviado', () => {
    renderHarness();
    expect(category().findParams('abc')).toEqual({ search: 'abc' });
    expect(category().findParams({ search: 'x' })).toEqual({ search: 'x' });
    expect(category().cacheUniqs).toBeUndefined();
  });

  it('com a prop: findParams mescla os parâmetros e cacheUniqs muda ao trocar o filtro', () => {
    const { rerenderWith } = renderHarness({ type_id: 2, cost_center_scoped: 'true' });
    expect(category().findParams('abc')).toEqual({
      search: 'abc',
      type_id: 2,
      cost_center_scoped: 'true',
    });
    const first = category().cacheUniqs;

    rerenderWith({ bank_movement_scoped: 'true', class: 2, is_enabled: 'true' });
    expect(category().findParams('')).toEqual({
      search: '',
      bank_movement_scoped: 'true',
      class: 2,
      is_enabled: 'true',
    });
    expect(category().cacheUniqs).not.toEqual(first);
  });

  it('a identidade de findParams é estável enquanto o filtro não muda', () => {
    const { rerenderWith } = renderHarness({ type_id: 1, cost_center_scoped: 'true' });
    const before = category().findParams;
    rerenderWith({ type_id: 1, cost_center_scoped: 'true' });
    expect(category().findParams).toBe(before);
  });

  it('os demais selects do rateio não recebem o filtro', () => {
    renderHarness({ type_id: 2, cost_center_scoped: 'true' });
    const center = captured.byName['allocations.0.center_uuid'];
    expect(center.findParams('q')).toEqual({
      search: 'q',
      only_analytic: true,
      is_enabled: 'true',
    });
  });
});
