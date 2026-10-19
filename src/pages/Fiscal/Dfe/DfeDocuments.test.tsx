// @vitest-environment jsdom
// UT-000752 (T-752-FE-01) — lista de DFe: ações por linha (XML/DANFE/Lançar)
// mostram a mensagem REAL da API mesmo com `responseType: 'blob'` (422 chega
// como Blob), nome do XML `xml_nfe_<chave>.xml`, Manifestar por linha para
// `tipo_evento` 3/4 e "Lançar Retorno" navega só com o uuid.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languageDfes } from '@/constants/languages/languagePtBr/languageDfes';

const svc = vi.hoisted(() => ({
  downloadDfeXml: vi.fn(),
  generateDfeDanfe: vi.fn(),
  parseInvoiceXml: vi.fn(),
  importMovementPurchaseXml: vi.fn(),
  downloadBlob: vi.fn(),
  navigate: vi.fn(),
  toaster: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
  rows: [] as any[],
}));

vi.mock('@/services/v2/Fiscal/dfe-service', () => ({
  downloadDfeXml: svc.downloadDfeXml,
  generateDfeDanfe: svc.generateDfeDanfe,
  listDfes: vi.fn(),
  toggleDfePersonal: vi.fn(),
  toggleDfeShipment: vi.fn(),
}));
vi.mock('@/services/v2/Invoices/invoice-service', () => ({ parseInvoiceXml: svc.parseInvoiceXml }));
vi.mock('@/services/v2/MovementPurchases/movement-purchase-service', () => ({
  importMovementPurchaseXml: svc.importMovementPurchaseXml,
}));
vi.mock('@/utils/downloadBlob', () => ({ downloadBlob: svc.downloadBlob }));
vi.mock('@/components/ui/toaster', () => ({ toaster: svc.toaster }));
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => svc.navigate,
}));

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: { dfes: languageDfes, defaltStrings: { actions: 'Ações' } } }),
}));
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }));
vi.mock('@/hooks/useGridStorageScope', () => ({ useGridStorageScope: () => 'scope' }));
vi.mock('@/hooks/useGridSettings', () => ({
  useGridSettings: () => ({
    columnOrder: undefined,
    setColumnOrder: vi.fn(),
    columnVisibility: undefined,
    setColumnVisibility: vi.fn(),
  }),
}));
vi.mock('@/hooks/usePaginatedQueryStorage', () => ({
  userPaginatedQuery: () => ({
    paginatedQuery: {
      pageIndex: 1,
      pageSize: 10,
      pagesCount: 1,
      totalRecords: 1,
      filter: { issue_uuid: 'issuer-1' },
    },
    handlePaginatedQuery: vi.fn(),
    handleFilterChange: vi.fn(),
    handleResetFilter: vi.fn(),
  }),
}));
vi.mock('@/hooks/useCustomGridQuery', () => ({
  useCustomGridQuery: () => ({
    data: { data: { items: svc.rows } },
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
}));

// Renderiza só a coluna de ações de cada linha (a grid real não é o alvo).
vi.mock('@/contexts/TableContext', () => ({
  TableProvider: ({ data, columns, children }: any) => (
    <div>
      {(data ?? []).map((item: any) => (
        <div key={item.uuid} data-testid={`row-${item.uuid}`}>
          {columns.find((column: any) => column.id === 'acoes').cell({ row: { original: item } })}
        </div>
      ))}
      {children}
    </div>
  ),
}));
vi.mock('@/components/Table', () => ({ Table: () => null }));
vi.mock('@/components/HeaderGrid', () => ({ HeaderGrid: ({ children }: any) => <>{children}</> }));
vi.mock('./HeaderTable', () => ({ HeaderTable: () => null }));
vi.mock('./FilterSideDfe', () => ({ FilterSideDfe: () => null }));
vi.mock('./DfeManifestModal', () => ({ DfeManifestModal: () => null }));
vi.mock('./DfeActionsMenu', () => ({
  DfeActionsMenu: (props: any) => (
    <div>
      {props.canManifest && <button onClick={props.onManifest}>manifest</button>}
      {props.canLaunchInvoice && <button onClick={props.onLaunchInvoice}>launch-invoice</button>}
      {props.canLaunchReturn && <button onClick={props.onLaunchReturn}>launch-return</button>}
      {props.canXml && <button onClick={props.onXml}>xml</button>}
      {props.canDanfe && <button onClick={props.onDanfe}>danfe</button>}
    </div>
  ),
}));

import DfeRecebidasList from './index';

const ENV_MESSAGE = 'Emissor sem ambiente SEFAZ configurado (produção/homologação).';

class JsonBlob extends Blob {
  private readonly body: string;

  constructor(body: string) {
    super([body], { type: 'application/json' });
    this.body = body;
  }

  text() {
    return Promise.resolve(this.body);
  }
}

function blobApiError(status: number, message: string): AxiosError {
  const error = new AxiosError('failed');
  error.response = {
    status,
    data: new JsonBlob(JSON.stringify({ success: false, message })),
    statusText: '',
    headers: {},
    config: {} as never,
  };
  return error;
}

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    uuid: 'dfe-1',
    chave: '3526CHAVE',
    emissor_uuid: 'issuer-1',
    razao_social: 'Fornecedor',
    cpf_cnpj: '1',
    issue_ie: '',
    ie: '',
    number: '10',
    serie: '1',
    valor: 10,
    data_emissao: '2026-01-01T10:00:00',
    tipo: '1',
    tipo_evento: 1,
    sequencia_evento: 0,
    is_personal: false,
    is_shipment: false,
    launched_in: null,
    integration_status: 'P',
    ...overrides,
  };
}

function setup(rows: any[]) {
  svc.rows = rows;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ChakraProvider value={system}>
        <DfeRecebidasList />
      </ChakraProvider>
    </QueryClientProvider>
  );
}

describe('Lista DFe (documentos/lançar/manifestar) — UT-000752 T-752-FE-01', () => {
  beforeEach(() => {
    svc.rows = [];
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('XML com 422 em Blob → toast com a mensagem real da API', async () => {
    svc.downloadDfeXml.mockRejectedValue(blobApiError(422, ENV_MESSAGE));
    setup([makeRow()]);

    fireEvent.click(screen.getByText('xml'));

    await waitFor(() =>
      expect(svc.toaster.error).toHaveBeenCalledWith(
        expect.objectContaining({ description: ENV_MESSAGE })
      )
    );
    expect(svc.downloadBlob).not.toHaveBeenCalled();
  });

  it('XML ok → nome do arquivo xml_nfe_<chave>.xml', async () => {
    const blob = new Blob(['<nfe/>'], { type: 'application/xml' });
    svc.downloadDfeXml.mockResolvedValue(blob);
    setup([makeRow()]);

    fireEvent.click(screen.getByText('xml'));

    await waitFor(() =>
      expect(svc.downloadBlob).toHaveBeenCalledWith(blob, 'xml_nfe_3526CHAVE.xml')
    );
  });

  it('DANFE com 422 em Blob → toast com a mensagem real da API', async () => {
    svc.generateDfeDanfe.mockRejectedValue(blobApiError(422, ENV_MESSAGE));
    setup([makeRow()]);

    fireEvent.click(screen.getByText('danfe'));

    await waitFor(() =>
      expect(svc.toaster.error).toHaveBeenCalledWith(
        expect.objectContaining({ description: ENV_MESSAGE })
      )
    );
  });

  it('Lançar Produto com 422 no XML → toast com a mensagem e SEM navegação', async () => {
    svc.downloadDfeXml.mockRejectedValue(blobApiError(422, ENV_MESSAGE));
    setup([makeRow()]);

    fireEvent.click(screen.getByText('launch-invoice'));

    await waitFor(() =>
      expect(svc.toaster.error).toHaveBeenCalledWith(
        expect.objectContaining({ description: ENV_MESSAGE })
      )
    );
    expect(svc.navigate).not.toHaveBeenCalled();
    expect(svc.parseInvoiceXml).not.toHaveBeenCalled();
  });

  it('Manifestar por linha aparece para tipo_evento 3 e 4 (legado) e não para 2', () => {
    setup([
      makeRow({ uuid: 'e3', tipo_evento: 3 }),
      makeRow({ uuid: 'e4', tipo_evento: 4 }),
      makeRow({ uuid: 'e2', tipo_evento: 2 }),
    ]);

    expect(screen.getByTestId('row-e3').textContent).toContain('manifest');
    expect(screen.getByTestId('row-e4').textContent).toContain('manifest');
    expect(screen.getByTestId('row-e2').textContent).not.toContain('manifest');
  });

  it('Lançar Retorno navega só com o uuid (sem location.state)', () => {
    setup([makeRow({ tipo: '0' })]);

    fireEvent.click(screen.getByText('launch-return'));

    expect(svc.navigate).toHaveBeenCalledWith('/fiscal/dfes/dfe-1/retorno');
  });
});
