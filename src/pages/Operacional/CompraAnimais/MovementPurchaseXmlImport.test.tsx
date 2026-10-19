// @vitest-environment jsdom
// 088 D4-FE-T1 — diálogo de importação de XML da Compra: preview com duplicatas,
// defaults do título e avisos (por code, fallback = message); erros 422 do upload
// com as mensagens LITERAIS do legado vindas da API; "Aplicar" entrega o draft.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languagePtBr } from '@/constants/languages/languagePtBr';

import type { MovementPurchaseXmlDraft } from '@/services/v2/MovementPurchases/movement-purchase-service';

const lang = languagePtBr.BR;
const xmlText = lang.movementPurchases.movementPurchase.form.xmlImport;

const importMock = vi.fn();
const toastError = vi.fn();
const toastSuccess = vi.fn();
const toastCreate = vi.fn();

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageInUse: 'BR', languageGB: lang, updateLanguageGB: vi.fn() }),
}));
vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    error: (...a: unknown[]) => toastError(...a),
    success: (...a: unknown[]) => toastSuccess(...a),
    create: (...a: unknown[]) => toastCreate(...a),
    warning: vi.fn(),
  },
}));
vi.mock('@/services/v2/MovementPurchases/movement-purchase-service', () => ({
  importMovementPurchaseXml: (...args: unknown[]) => importMock(...args),
}));
vi.mock('@/components/Form/FileUpload', () => ({
  FileUpload: (p: any) => (
    <input
      type="file"
      data-testid="xml-file"
      disabled={p.disabled}
      onChange={(e) => p.onFileSelected(e.target.files?.[0] ?? null)}
    />
  ),
}));
vi.mock('@/components/CustomDialog', () => ({
  CustomDialog: (p: any) =>
    p.isOpen ? (
      <div role="dialog">
        {p.children}
        {p.footer}
      </div>
    ) : null,
}));

const { MovementPurchaseXmlImportDialog } = await import('./MovementPurchaseXmlImport');

function draft(overrides: Partial<MovementPurchaseXmlDraft> = {}): MovementPurchaseXmlDraft {
  return {
    number: '142',
    serie: '1',
    dt_sale: '2026-10-01',
    chave: '3'.repeat(44),
    note: '',
    provider: {
      uuid: 'prov-5',
      matched: true,
      nif: '123',
      name: 'Fornecedor XML',
      type: 5,
      is_enabled: true,
      created: false,
    },
    total_products: 900,
    freight: 100,
    discount: 0,
    total: 1000,
    items: [{ category_uuid: null, description: 'Boi', quantity: 10, value_unit: 90, amount: 900 }],
    installments: [
      { number: '001', due_date: '2026-11-01', amount: 600 },
      { number: '002', due_date: '2026-12-20', amount: 400 },
    ],
    interval_days: 49,
    financial_defaults: {
      number: '142',
      type_title: { uuid: 'tt-4', description: 'Compra de animais' },
      proprietary: null,
      note: '',
      fiscal_document: true,
      classification: 'N',
      has_input: false,
    },
    warnings: [],
    ...overrides,
  };
}

const onApply = vi.fn();
const onClose = vi.fn();

function renderDialog() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
    >
      <ChakraProvider value={system}>
        <MovementPurchaseXmlImportDialog isOpen onClose={onClose} onApply={onApply} />
      </ChakraProvider>
    </QueryClientProvider>
  );
}

async function upload() {
  const file = new File(['<xml/>'], 'nfe.xml', { type: 'text/xml' });
  await act(async () => {
    fireEvent.change(screen.getByTestId('xml-file'), { target: { files: [file] } });
  });
}

beforeEach(() => {
  importMock.mockReset();
  onApply.mockReset();
  onClose.mockReset();
  toastError.mockReset();
  toastSuccess.mockReset();
  toastCreate.mockReset();
});
afterEach(cleanup);

describe('preview do XML', () => {
  it('mostra as duplicatas (nº/vencimento/valor) e os defaults do título (Classificação N)', async () => {
    importMock.mockResolvedValue({ data: draft() });
    renderDialog();
    await upload();

    const installments = await screen.findByTestId('xml-preview-installments');
    expect(installments.textContent).toContain('001');
    expect(installments.textContent).toContain('002');
    expect(installments.textContent).toMatch(/600,00/);
    expect(installments.textContent).toMatch(/400,00/);

    const defaults = screen.getByTestId('xml-preview-defaults');
    expect(defaults.textContent).toContain('142');
    expect(defaults.textContent).toContain('Compra de animais');
    expect(defaults.textContent).toContain(lang.defaltStrings.yes);
    expect(defaults.textContent).toContain(
      lang.movementPurchases.movementPurchase.form.financial.header.classificationNone
    );
    expect(screen.queryByTestId('xml-preview-warnings')).toBeNull();
  });

  it('avisos: texto por code (CITY_NOT_FOUND, PROVIDER_TYPE_MISMATCH) e fallback = message; não bloqueiam o Aplicar', async () => {
    importMock.mockResolvedValue({
      data: draft({
        warnings: [
          { code: 'CITY_NOT_FOUND', message: 'msg API cidade' },
          { code: 'PROVIDER_TYPE_MISMATCH', message: 'msg API tipo' },
          { code: 'OUTRO', message: 'mensagem da API' },
        ],
      }),
    });
    renderDialog();
    await upload();

    const warnings = await screen.findByTestId('xml-preview-warnings');
    expect(warnings.textContent).toContain(xmlText.warnings.CITY_NOT_FOUND);
    expect(warnings.textContent).toContain(xmlText.warnings.PROVIDER_TYPE_MISMATCH);
    expect(warnings.textContent).toContain('mensagem da API');

    const apply = screen.getByRole('button', { name: xmlText.applyButton });
    expect((apply as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(apply);
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0].provider.uuid).toBe('prov-5');
  });
});

describe('erros 422 do upload (mensagens literais do legado vindas da API)', () => {
  it.each([
    ['Informe um arquivo válido', { errors: { file: ['Informe um arquivo válido'] } }],
    ['Este XML não é de NFe!', { message: 'Este XML não é de NFe!' }],
    ['Documento Fiscal já lançado', { message: 'Documento Fiscal já lançado' }],
  ])('"%s" vai ao toast de erro e nada é aplicado', async (literal, data) => {
    importMock.mockRejectedValue(
      Object.assign(new Error('Request failed'), {
        isAxiosError: true,
        response: { status: 422, data: { success: false, ...data } },
      })
    );
    renderDialog();
    await upload();

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError.mock.calls[0][0].description).toBe(literal);
    expect(onApply).not.toHaveBeenCalled();
    const apply = screen.getByRole('button', { name: xmlText.applyButton });
    expect((apply as HTMLButtonElement).disabled).toBe(true);
  });
});
