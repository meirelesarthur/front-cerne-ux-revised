// @vitest-environment jsdom
// UT-000795 — bloco Pecuária: campos, obrigatoriedade, cascata por props e
// serviços de Área (criação × edição).
import { ChakraProvider } from '@chakra-ui/react';
import { act, cleanup, render } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

const captured: Record<string, any> = {};
const order: string[] = [];

vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: (props: any) => {
    captured[props.name] = props;
    order.push(props.name);
    return <div data-testid={`select-${props.name}`} />;
  },
}));

const listAreaOptionsForExpenseMock = vi.fn();
const listGrazingOptionsMock = vi.fn();
vi.mock('@/services/v2/BaseRegistrations/areas-service', () => ({
  listAreaOptionsForExpense: (...a: unknown[]) => listAreaOptionsForExpenseMock(...a),
}));
vi.mock('@/services/v2/BaseRegistrations/grazings-service', () => ({
  listGrazingOptions: (...a: unknown[]) => listGrazingOptionsMock(...a),
}));

import type { ExpenseAppropriationLivestockDetail } from '@/@types/v2/Financeiro/expense';

import { ExpenseLivestockBlock } from './ExpenseLivestockBlock';

const opt = (value: string, label = value) => ({ label, value });

let formApi: ReturnType<typeof useForm<any>>;

function Harness({
  isEditing,
  isDisabled = false,
  defaults = {},
  detail,
}: {
  isEditing: boolean;
  isDisabled?: boolean;
  defaults?: Record<string, unknown>;
  detail?: ExpenseAppropriationLivestockDetail | null;
}) {
  const form = useForm<any>({
    defaultValues: {
      aprop_pec_area_uuid: null,
      aprop_pec_grazing_uuid: null,
      aprop_pec_batch_uuid: null,
      aprop_pec_animal_uuid: null,
      aprop_pec_operation_uuid: null,
      aprop_pec_activity_uuid: null,
      ...defaults,
    },
  });
  formApi = form;
  return (
    <ChakraProvider value={system}>
      <ExpenseLivestockBlock
        control={form.control}
        errors={form.formState.errors}
        setValue={form.setValue}
        getValues={form.getValues}
        clearErrors={form.clearErrors}
        isEditing={isEditing}
        isDisabled={isDisabled}
        detail={detail}
      />
    </ChakraProvider>
  );
}

beforeEach(() => {
  listAreaOptionsForExpenseMock.mockReset().mockResolvedValue({ data: { items: [] } });
  listGrazingOptionsMock.mockReset().mockResolvedValue({ data: { items: [] } });
});

afterEach(() => {
  cleanup();
  Object.keys(captured).forEach((k) => delete captured[k]);
  order.length = 0;
});

describe('ExpenseLivestockBlock', () => {
  it('renderiza os 6 campos na ordem do legado', () => {
    const { getByTestId } = render(<Harness isEditing={false} />);
    const unique = [...new Set(order)];
    expect(unique).toEqual([
      'aprop_pec_area_uuid',
      'aprop_pec_grazing_uuid',
      'aprop_pec_batch_uuid',
      'aprop_pec_animal_uuid',
      'aprop_pec_operation_uuid',
      'aprop_pec_activity_uuid',
    ]);
    expect(getByTestId('expense-livestock-block')).toBeTruthy();
  });

  it('Operação e Atividade obrigatórias; Área/Módulo/Lote/Animal opcionais', () => {
    render(<Harness isEditing={false} />);
    expect(captured.aprop_pec_operation_uuid.isRequired).toBe(true);
    expect(captured.aprop_pec_activity_uuid.isRequired).toBe(true);
    expect(captured.aprop_pec_area_uuid.isRequired).toBeFalsy();
    expect(captured.aprop_pec_batch_uuid.isRequired).toBeFalsy();
  });

  it('Atividade desabilitada em criação sem Operação; habilitada em edição', () => {
    render(<Harness isEditing={false} />);
    expect(captured.aprop_pec_activity_uuid.isDisabled).toBe(true);
    cleanup();
    render(<Harness isEditing />);
    expect(captured.aprop_pec_activity_uuid.isDisabled).toBe(false);
    cleanup();
    render(<Harness isEditing={false} defaults={{ aprop_pec_operation_uuid: opt('op-1') }} />);
    expect(captured.aprop_pec_activity_uuid.isDisabled).toBe(false);
  });

  it('Lote e Animal desabilitados sem pai e sem valor hidratado; habilitados com pai ou valor', () => {
    render(<Harness isEditing={false} />);
    expect(captured.aprop_pec_batch_uuid.isDisabled).toBe(true);
    expect(captured.aprop_pec_animal_uuid.isDisabled).toBe(true);
    cleanup();
    render(
      <Harness
        isEditing={false}
        defaults={{ aprop_pec_area_uuid: opt('a-1'), aprop_pec_batch_uuid: opt('b-1') }}
      />
    );
    expect(captured.aprop_pec_batch_uuid.isDisabled).toBe(false);
    expect(captured.aprop_pec_animal_uuid.isDisabled).toBe(false);
    cleanup();
    // edição: valor gravado aparece mesmo sem o pai carregado
    render(
      <Harness
        isEditing
        defaults={{ aprop_pec_batch_uuid: opt('b-1'), aprop_pec_animal_uuid: opt('an-1') }}
      />
    );
    expect(captured.aprop_pec_batch_uuid.isDisabled).toBe(false);
    expect(captured.aprop_pec_animal_uuid.isDisabled).toBe(false);
  });

  it('cacheUniqs/findParams: Lote muda com Área, Animal com Lote, Atividade com Operação', () => {
    render(<Harness isEditing={false} defaults={{ aprop_pec_area_uuid: opt('area-1') }} />);
    expect(captured.aprop_pec_batch_uuid.cacheUniqs).toEqual(['area-1', undefined]);
    expect(captured.aprop_pec_animal_uuid.cacheUniqs).toEqual([undefined]);
    expect(captured.aprop_pec_activity_uuid.cacheUniqs).toEqual([undefined]);

    act(() => {
      formApi.setValue('aprop_pec_area_uuid', null);
      formApi.setValue('aprop_pec_grazing_uuid', opt('graz-1'));
      formApi.setValue('aprop_pec_batch_uuid', opt('batch-1'));
      formApi.setValue('aprop_pec_operation_uuid', opt('op-1'));
    });
    expect(captured.aprop_pec_batch_uuid.cacheUniqs).toEqual([undefined, 'graz-1']);
    expect(captured.aprop_pec_animal_uuid.cacheUniqs).toEqual(['batch-1']);
    expect(captured.aprop_pec_activity_uuid.cacheUniqs).toEqual(['op-1']);
    expect(captured.aprop_pec_activity_uuid.findParams('x')).toEqual({
      search: 'x',
      operation_uuid: 'op-1',
    });
  });

  it('Área: criação chama o serviço com withoutGrazing=true; edição sem o parâmetro', async () => {
    render(<Harness isEditing={false} />);
    await captured.aprop_pec_area_uuid.service({ search: 'p' });
    expect(listAreaOptionsForExpenseMock).toHaveBeenLastCalledWith({
      search: 'p',
      withoutGrazing: true,
    });
    cleanup();
    render(<Harness isEditing />);
    await captured.aprop_pec_area_uuid.service({ search: 'p' });
    expect(listAreaOptionsForExpenseMock).toHaveBeenLastCalledWith({
      search: 'p',
      withoutGrazing: false,
    });
  });

  it('onChange do usuário aciona a cascata (Área limpa Módulo/Lote/Animal)', () => {
    render(
      <Harness
        isEditing={false}
        defaults={{
          aprop_pec_grazing_uuid: opt('g'),
          aprop_pec_batch_uuid: opt('b'),
          aprop_pec_animal_uuid: opt('an'),
        }}
      />
    );
    act(() => captured.aprop_pec_area_uuid.onChange(opt('area-9')));
    const v = formApi.getValues();
    expect(v.aprop_pec_area_uuid).toEqual(opt('area-9'));
    expect(v.aprop_pec_grazing_uuid).toBeNull();
    expect(v.aprop_pec_batch_uuid).toBeNull();
    expect(v.aprop_pec_animal_uuid).toBeNull();
  });

  it('visualização (isDisabled): todos desabilitados e valores hidratados visíveis nas props', () => {
    render(
      <Harness
        isEditing
        isDisabled
        defaults={{
          aprop_pec_area_uuid: opt('a-1', 'Pasto 1'),
          aprop_pec_operation_uuid: opt('op-1', 'Vacinação'),
          aprop_pec_activity_uuid: opt('act-1', 'Aplicação'),
        }}
        detail={{
          uuid: 'p-1',
          code: '0007',
          status: 'F',
          date: '2026-10-14',
          amount: 1500,
          area: { uuid: 'a-1', description: 'Pasto 1' },
          grazing: null,
          batch: null,
          animal: null,
          operation: { uuid: 'op-1', name: 'Vacinação' },
          activity: { uuid: 'act-1', name: 'Aplicação' },
        }}
      />
    );
    [
      'aprop_pec_area_uuid',
      'aprop_pec_grazing_uuid',
      'aprop_pec_operation_uuid',
      'aprop_pec_activity_uuid',
    ].forEach((name) => expect(captured[name].isDisabled).toBe(true));
    expect(captured.aprop_pec_area_uuid.value).toEqual(opt('a-1', 'Pasto 1'));
    expect(captured.aprop_pec_activity_uuid.value).toEqual(opt('act-1', 'Aplicação'));
  });
});
