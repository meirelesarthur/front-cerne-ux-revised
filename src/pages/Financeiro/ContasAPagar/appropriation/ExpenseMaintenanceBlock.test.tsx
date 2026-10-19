// @vitest-environment jsdom
// UT-000795 — bloco Manutenção: alternância Horímetro × Km por `uses_mileage`,
// limpeza do medidor oculto e máscara do Horímetro (preenchimento pela direita).
import { ChakraProvider } from '@chakra-ui/react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
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

const listEquipmentCatalogOptionsMock = vi.fn();
vi.mock('@/services/v2/Equipments/equipment-service', () => ({
  listEquipmentCatalogOptions: (...a: unknown[]) => listEquipmentCatalogOptionsMock(...a),
}));

import { buildAppropriationPayload } from './expenseAppropriation';
import { ExpenseMaintenanceBlock } from './ExpenseMaintenanceBlock';

const equipment = (usesMileage: boolean, value = 'eq-1') => ({
  label: 'Trator',
  value,
  uses_mileage: usesMileage,
});

let formApi: ReturnType<typeof useForm<any>>;

function Harness({
  isDisabled = false,
  defaults = {},
  detail,
}: {
  isDisabled?: boolean;
  defaults?: Record<string, unknown>;
  detail?: any;
}) {
  const form = useForm<any>({
    defaultValues: {
      aprop_man_equipment_uuid: null,
      aprop_man_hour_meter: null,
      aprop_man_mileage: null,
      ...defaults,
    },
  });
  formApi = form;
  return (
    <ChakraProvider value={system}>
      <ExpenseMaintenanceBlock
        control={form.control}
        errors={form.formState.errors}
        setValue={form.setValue}
        clearErrors={form.clearErrors}
        isDisabled={isDisabled}
        detail={detail}
      />
    </ChakraProvider>
  );
}

afterEach(() => {
  cleanup();
  Object.keys(captured).forEach((k) => delete captured[k]);
  listEquipmentCatalogOptionsMock.mockReset();
});

const hourInput = () =>
  document.querySelector('input[name="aprop_man_hour_meter"]') as HTMLInputElement | null;
const kmInput = () =>
  document.querySelector('input[name="aprop_man_mileage"]') as HTMLInputElement | null;

describe('ExpenseMaintenanceBlock — alternância Horímetro × Km', () => {
  it('Horímetro visível por padrão; Km fora do DOM', () => {
    render(<Harness />);
    expect(hourInput()).not.toBeNull();
    expect(kmInput()).toBeNull();
  });

  it('equipamento uses_mileage:true mostra Km e REMOVE o Horímetro do DOM', () => {
    render(<Harness defaults={{ aprop_man_equipment_uuid: equipment(true) }} />);
    expect(kmInput()).not.toBeNull();
    expect(hourInput()).toBeNull();
  });

  it('equipamento uses_mileage:false mostra só Horímetro', () => {
    render(<Harness defaults={{ aprop_man_equipment_uuid: equipment(false) }} />);
    expect(hourInput()).not.toBeNull();
    expect(kmInput()).toBeNull();
  });

  it('trocar para equipamento de Km (ação do usuário) limpa o horímetro oculto e alterna o campo', () => {
    render(
      <Harness
        defaults={{ aprop_man_equipment_uuid: equipment(false), aprop_man_hour_meter: 55.5 }}
      />
    );
    act(() => captured.aprop_man_equipment_uuid.onChange(equipment(true, 'eq-2')));
    expect(formApi.getValues('aprop_man_hour_meter')).toBeNull();
    expect(kmInput()).not.toBeNull();
    expect(hourInput()).toBeNull();
  });

  it('trocar para equipamento de horímetro limpa o Km oculto', () => {
    render(
      <Harness defaults={{ aprop_man_equipment_uuid: equipment(true), aprop_man_mileage: 4500 }} />
    );
    act(() => captured.aprop_man_equipment_uuid.onChange(equipment(false, 'eq-3')));
    expect(formApi.getValues('aprop_man_mileage')).toBeNull();
    expect(hourInput()).not.toBeNull();
  });

  it('trocar entre equipamentos da MESMA família não limpa o medidor', () => {
    render(
      <Harness
        defaults={{ aprop_man_equipment_uuid: equipment(false), aprop_man_hour_meter: 55.5 }}
      />
    );
    act(() => captured.aprop_man_equipment_uuid.onChange(equipment(false, 'eq-9')));
    expect(formApi.getValues('aprop_man_hour_meter')).toBe(55.5);
  });

  it('hidratação (reset) não limpa o medidor gravado', () => {
    render(<Harness />);
    act(() => {
      formApi.reset({
        aprop_man_equipment_uuid: equipment(false),
        aprop_man_hour_meter: 1234.5,
        aprop_man_mileage: null,
      });
    });
    expect(formApi.getValues('aprop_man_hour_meter')).toBe(1234.5);
  });

  it('Equipamento: purpose=expense-maintenance, per_page 100, rótulo só com a descrição e uses_mileage na option', async () => {
    listEquipmentCatalogOptionsMock.mockResolvedValue({ data: { items: [] } });
    render(<Harness />);
    await captured.aprop_man_equipment_uuid.service({ page: 1, search: 'tra' });
    expect(listEquipmentCatalogOptionsMock).toHaveBeenCalledWith({
      page: 1,
      per_page: 100,
      search: 'tra',
      purpose: 'expense-maintenance',
    });
    expect(captured.aprop_man_equipment_uuid.pageSize).toBe(100);
    expect(
      captured.aprop_man_equipment_uuid.mapOptions({
        uuid: 'u',
        code: 'EQ-1',
        description: 'Trator John Deere',
        uses_mileage: true,
      })
    ).toEqual({ label: 'Trator John Deere', value: 'u', uses_mileage: true });
    expect(
      captured.aprop_man_equipment_uuid.mapOptions({ uuid: 'u', code: 'c', description: 'd' })
        .uses_mileage
    ).toBe(false);
    expect(captured.aprop_man_equipment_uuid.isRequired).toBe(true);
  });
});

describe('ExpenseMaintenanceBlock — máscara do Horímetro (preenchimento pela direita, decisão do dono 2026-10-15)', () => {
  // Simula a digitação progressiva: cada tecla acrescenta o dígito ao TEXTO
  // exibido (como o navegador) e dispara o change.
  function typeDigit(digit: string) {
    fireEvent.change(hourInput()!, { target: { value: `${hourInput()!.value}${digit}` } });
  }

  it('digitar 1, 2, 5 progressivamente vira 0,1 -> 1,2 -> 12,5 (valor 12.5)', () => {
    render(<Harness />);
    typeDigit('1');
    expect(hourInput()!.value).toBe('0,1');
    expect(formApi.getValues('aprop_man_hour_meter')).toBe(0.1);
    typeDigit('2');
    expect(hourInput()!.value).toBe('1,2');
    expect(formApi.getValues('aprop_man_hour_meter')).toBe(1.2);
    typeDigit('5');
    expect(hourInput()!.value).toBe('12,5');
    expect(formApi.getValues('aprop_man_hour_meter')).toBe(12.5);
  });

  it('colar 1234,5 equivale aos dígitos 12345 e devolve 1234.5 (exibe 1.234,5)', () => {
    render(<Harness />);
    fireEvent.change(hourInput()!, { target: { value: '1234,5' } });
    expect(formApi.getValues('aprop_man_hour_meter')).toBe(1234.5);
    expect(hourInput()!.value).toBe('1.234,5');
  });

  it('digitar 125 devolve 12.5 (right-fill, não 125)', () => {
    render(<Harness />);
    fireEvent.change(hourInput()!, { target: { value: '125' } });
    expect(formApi.getValues('aprop_man_hour_meter')).toBe(12.5);
  });

  it('digitar 0 devolve 0 (não null) e exibe 0,0', () => {
    render(<Harness />);
    fireEvent.change(hourInput()!, { target: { value: '0' } });
    expect(formApi.getValues('aprop_man_hour_meter')).toBe(0);
    expect(hourInput()!.value).toBe('0,0');
  });

  it('apagar tudo devolve null', () => {
    render(<Harness defaults={{ aprop_man_hour_meter: 12.5 }} />);
    fireEvent.change(hourInput()!, { target: { value: '' } });
    expect(formApi.getValues('aprop_man_hour_meter')).toBeNull();
  });

  it('hidratar 1234.5 exibe 1.234,5, mantém 1234.5 no form e no payload (sem ×10)', () => {
    render(<Harness defaults={{ aprop_man_hour_meter: 1234.5 }} />);
    expect(hourInput()!.value).toBe('1.234,5');
    expect(formApi.getValues('aprop_man_hour_meter')).toBe(1234.5);
    const payload = buildAppropriationPayload({
      appropriation: { label: 'Direta', value: 1 },
      appropriation_type: { label: 'Manutenção', value: 4 },
      aprop_man_equipment_uuid: equipment(false),
      aprop_man_hour_meter: formApi.getValues('aprop_man_hour_meter'),
      aprop_man_mileage: null,
    } as any);
    expect(payload.aprop_man_hour_meter).toBe(1234.5);
  });

  it('hidratar 55.5 exibe 55,5', () => {
    render(<Harness defaults={{ aprop_man_hour_meter: 55.5 }} />);
    expect(hourInput()!.value).toBe('55,5');
  });

  it('hidratar 0 exibe 0,0 (zero é valor válido, não vazio)', () => {
    render(<Harness defaults={{ aprop_man_hour_meter: 0 }} />);
    expect(hourInput()!.value).toBe('0,0');
  });

  it('mais de 11 dígitos crus é cortado (cap derivado de HOUR_METER_MAX)', () => {
    render(<Harness />);
    fireEvent.change(hourInput()!, { target: { value: '123456789012345' } });
    expect(formApi.getValues('aprop_man_hour_meter')).toBe(12345678901 / 10);
  });

  it('valor acima de HOUR_METER_MAX é grampeado no blur', () => {
    render(<Harness />);
    fireEvent.change(hourInput()!, { target: { value: '99999999999' } });
    act(() => {
      formApi.setValue('aprop_man_hour_meter', 99999999999.9);
    });
    fireEvent.blur(hourInput()!);
    expect(formApi.getValues('aprop_man_hour_meter')).toBe(9999999999.9);
  });

  it('Km: digitar 45210 devolve inteiro 45210', () => {
    render(<Harness defaults={{ aprop_man_equipment_uuid: equipment(true) }} />);
    fireEvent.change(kmInput()!, { target: { value: '45210' } });
    expect(formApi.getValues('aprop_man_mileage')).toBe(45210);
  });
});

describe('ExpenseMaintenanceBlock — visualização', () => {
  it('desabilita equipamento e medidor e mostra o resumo gravado; só o medidor aplicável', () => {
    render(
      <Harness
        isDisabled
        defaults={{ aprop_man_equipment_uuid: equipment(true), aprop_man_mileage: 45210 }}
        detail={{
          uuid: 'm-1',
          code: '0003',
          status: 'F',
          date: '2026-10-14',
          amount: 1500,
          equipment: {
            uuid: 'eq-1',
            code: 'EQ-1',
            description: 'Trator',
            family: null,
            uses_mileage: true,
          },
          hour_meter: 0,
          mileage: 45210,
          note: null,
        }}
      />
    );
    expect(captured.aprop_man_equipment_uuid.isDisabled).toBe(true);
    expect(kmInput()!.disabled).toBe(true);
    expect(kmInput()!.value).toBe('45.210');
    expect(hourInput()).toBeNull();
    expect(screen.getByText('0003')).toBeTruthy();
  });
});
