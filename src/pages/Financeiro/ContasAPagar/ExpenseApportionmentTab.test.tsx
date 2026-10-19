// @vitest-environment jsdom
// UT-000765 / FE-765-C e FE-765-D — Categoria Financeira escopada por Centro de
// Custo (como o legado) e coluna "Safra" do Rateio só em edição.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, render } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

const captured: Record<string, any> = {};

vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: (props: any) => {
    captured[props.name] = props;
    return <div data-testid={`select-${props.name}`} />;
  },
}));

vi.mock('@/components/Form/MoneyInput', () => ({ MoneyInput: () => <div /> }));
vi.mock('@/components/Form/PercentInput', () => ({ PercentInput: () => <div /> }));

import { ExpenseApportionmentTab } from './ExpenseApportionmentTab';

function Harness({ isEditing }: { isEditing: boolean }) {
  const { control, watch, setValue, formState } = useForm<any>({
    defaultValues: {
      amount: 100,
      categories: [
        {
          category_uuid: null,
          center_uuid: null,
          plan_account_uuid: null,
          area_uuid: null,
          harvest_uuid: null,
          value: 100,
          percent: 100,
        },
      ],
    },
  });
  return (
    <ChakraProvider value={system}>
      <ExpenseApportionmentTab
        control={control}
        errors={formState.errors}
        watch={watch}
        setValue={setValue}
        isLoading={false}
        canSave
        hasMoved={false}
        isEditing={isEditing}
        showHarvestColumn={isEditing}
        listAreasForActiveFarm={async () => ({ data: [], meta: {} }) as any}
      />
    </ChakraProvider>
  );
}

afterEach(() => {
  cleanup();
  Object.keys(captured).forEach((k) => delete captured[k]);
});

describe('ExpenseApportionmentTab — Categoria Financeira (FE-765-C)', () => {
  it('envia cost_center_scoped=true, type_id=1 e pageSize=20', () => {
    render(<Harness isEditing={false} />);
    const props = captured['categories.0.category_uuid'];
    expect(props.pageSize).toBe(20);
    const params = props.findParams('abc');
    expect(params).toEqual({ search: 'abc', cost_center_scoped: true, type_id: 1 });
    expect(params).not.toHaveProperty('is_enabled');
  });

  it('nao replica a busca minima de 3 caracteres do legado', () => {
    render(<Harness isEditing={false} />);
    expect(captured['categories.0.category_uuid'].findParams('a').search).toBe('a');
  });
});

describe('ExpenseApportionmentTab — Safra por modo (FE-765-D)', () => {
  it('criacao: coluna Safra do rateio ausente', () => {
    const { queryByTestId } = render(<Harness isEditing={false} />);
    expect(queryByTestId('select-categories.0.harvest_uuid')).toBeNull();
  });

  it('edicao: coluna Safra por linha presente', () => {
    const { queryByTestId } = render(<Harness isEditing />);
    expect(queryByTestId('select-categories.0.harvest_uuid')).not.toBeNull();
  });
});
