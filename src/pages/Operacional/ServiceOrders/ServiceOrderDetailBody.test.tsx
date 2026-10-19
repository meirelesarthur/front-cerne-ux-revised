// @vitest-environment jsdom
// Execução 086, FE-01 — detalhe da OS a partir de fixture do contrato
// `ServiceOrderDetailResource`: labels (nome/unidade/armazém), anexos com link,
// `category_label`, datas formatadas e bloco de cancelamento.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languageServiceOrders } from '@/constants/languages/languagePtBr/languageServiceOrders';

import type { ServiceOrderDetail } from '@/@types/v2/ServiceOrders';

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: { serviceOrders: languageServiceOrders } }),
}));

import { formatServiceOrderDate, ServiceOrderDetailBody } from './ServiceOrderDetailBody';

const detail = languageServiceOrders.serviceOrder.detail;

const fixture = {
  uuid: 'os-1',
  code: '000123',
  dt_emission: '2026-09-01',
  execution_date: '2026-09-05',
  deadline: '2026-09-10',
  category: 2,
  category_label: 'Agricultura',
  status: { value: 9, label: 'Cancelada', color: '#FF0000' },
  cancellation_reason: 'Chuva forte no talhão',
  cancellation_date: '2026-09-02T13:30:00-03:00',
  cancellation_user: { uuid: 'u-1', name: 'Carlos Gestor' },
  execution_start_date: null,
  execution_end_date: null,
  rating_date: null,
  employees: [
    {
      id: 1,
      type: 3,
      employee_uuid: null,
      function_uuid: null,
      provider_uuid: 'prov-1',
      label: 'Prestadora Ltda',
      note: null,
      is_checked: false,
    },
  ],
  equipments: [
    { equipment_uuid: 'eq-1', label: 'Trator JD 6110', note: null, is_checked: false },
    { equipment_uuid: null, label: null, note: null, is_checked: false },
  ],
  products: [
    {
      stock_uuid: 'stk-1',
      label: 'Glifosato',
      product_description: 'Glifosato',
      measurement_uuid: 'm-1',
      measurement_name: 'Litro',
      warehouse: { uuid: 'wh-1', label: 'Armazém de Insumos' },
      stock_quantity: 10,
      quantity: 2,
      total_quantity: 20,
      note: null,
      is_checked: false,
    },
  ],
  productions: [
    {
      product_uuid: 'p-1',
      label: 'Soja em grão',
      measurement_uuid: 'm-2',
      measurement_name: 'Saca',
      quantity: 30,
      note: null,
      is_checked: false,
    },
  ],
  protections: [{ product_uuid: 'e-1', label: 'Luva nitrílica', note: null, is_checked: true }],
  attachments: [
    {
      uuid: 'a-1',
      name: 'Croqui',
      filename: 'os/croqui.pdf',
      url: 'http://api.test/storage/os/croqui.pdf',
    },
    { uuid: 'a-2', name: 'Planilha', filename: null, url: null },
  ],
} as unknown as ServiceOrderDetail;

function renderBody(item: ServiceOrderDetail | undefined = fixture) {
  return render(
    <ChakraProvider value={system}>
      <ServiceOrderDetailBody item={item} isLoading={false} />
    </ChakraProvider>
  );
}

function openTab(label: string) {
  fireEvent.click(screen.getByRole('tab', { name: label }));
}

afterEach(cleanup);

describe('ServiceOrderDetailBody — execução 086, FE-01', () => {
  it('cabeçalho: category_label e datas formatadas (dd/MM/yyyy)', () => {
    renderBody();

    expect(screen.getByText('Agricultura')).toBeTruthy();
    expect(screen.getByText('01/09/2026')).toBeTruthy();
    expect(screen.getByText('05/09/2026')).toBeTruthy();
    expect(screen.getByText('10/09/2026')).toBeTruthy();
  });

  it('bloco de cancelamento: motivo, data e quem cancelou (só com status 9)', () => {
    renderBody();

    expect(screen.getByText(detail.sections.cancellation)).toBeTruthy();
    expect(screen.getByText('Chuva forte no talhão')).toBeTruthy();
    expect(screen.getByText('02/09/2026 13:30')).toBeTruthy();
    expect(screen.getByText('Carlos Gestor')).toBeTruthy();
  });

  it('OS não cancelada não mostra o bloco de cancelamento', () => {
    renderBody({
      ...fixture,
      status: { value: 1, label: 'Aberta', color: '#858796' },
      cancellation_reason: null,
      cancellation_date: null,
      cancellation_user: null,
    } as ServiceOrderDetail);

    expect(screen.queryByText(detail.sections.cancellation)).toBeNull();
  });

  it('mão de obra: tipo traduzido + nome do executor (sem uuid)', () => {
    renderBody();

    expect(screen.getByText('Fornecedor')).toBeTruthy();
    expect(screen.getByText('Prestadora Ltda')).toBeTruthy();
    expect(screen.queryByText(/prov-1/)).toBeNull();
  });

  it('equipamentos: label; FK órfã vira "—" (nunca uuid truncado)', () => {
    renderBody();
    openTab(detail.sections.equipment);

    expect(screen.getByText('Trator JD 6110')).toBeTruthy();
    expect(screen.queryByText(/eq-1/)).toBeNull();
  });

  it('insumos: produto, armazém e unidade por nome', () => {
    renderBody();
    openTab(detail.sections.products);

    expect(screen.getByText('Glifosato')).toBeTruthy();
    expect(screen.getByText('Armazém de Insumos')).toBeTruthy();
    expect(screen.getByText('Litro')).toBeTruthy();
    expect(screen.queryByText(/stk-1/)).toBeNull();
  });

  it('produção e proteções: label e unidade', () => {
    renderBody();
    openTab(detail.sections.productions);
    expect(screen.getByText('Soja em grão')).toBeTruthy();
    expect(screen.getByText('Saca')).toBeTruthy();

    openTab(detail.sections.protections);
    expect(screen.getByText('Luva nitrílica')).toBeTruthy();
  });

  it('aba Anexos: link para o arquivo (nova aba) e "Sem arquivo" quando não há url', () => {
    renderBody();
    openTab(detail.sections.attachments);

    expect(screen.getByText('Croqui')).toBeTruthy();
    const link = screen.getByText(detail.attachments.open).closest('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('http://api.test/storage/os/croqui.pdf');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(screen.getByText(detail.attachments.noFile)).toBeTruthy();
  });

  it('sem anexos: estado vazio honesto', () => {
    renderBody({ ...fixture, attachments: [] } as ServiceOrderDetail);
    openTab(detail.sections.attachments);

    expect(screen.getByText(detail.emptySection)).toBeTruthy();
  });
});

describe('formatServiceOrderDate', () => {
  it('formata ISO e devolve "—" para ausente/inválido', () => {
    expect(formatServiceOrderDate('2026-09-01')).toBe('01/09/2026');
    expect(formatServiceOrderDate(null)).toBe('—');
    expect(formatServiceOrderDate(undefined)).toBe('—');
  });
});
