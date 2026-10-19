// @vitest-environment jsdom
// FE-C1-03 (D-101-19/D-101-20) — campos C1 (mot_des_icms, perc_dif, perc_fcp) na Natureza de
// Operacao: visibilidade por CST, autofill regra -> natureza (copia os 3 campos respeitando o
// CST da regra), payload (null quando oculto) e 422 por campo. Hook-form/schema/payload REAIS.
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { chooseSelectOption } from '@/test-helpers/chakraSelect';
import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

const captured = vi.hoisted(() => ({ detail: null as any, rule: null as any }));
const updateMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter(languageContextTypes.BR) }),
}));
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasFarm: true, can: () => true }),
}));
vi.mock('@/hooks/useRequest', () => ({
  useRequest: (options: { asyncFunction: (data: any) => Promise<unknown> }) => ({
    mutateAsync: (data: any) => options.asyncFunction(data).catch(() => undefined),
    isPending: false,
  }),
}));
// Stub do select assincrono: um botao que "seleciona" a regra fiscal.
vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: ({ name, onChange }: any) =>
    name === 'tax_rule_uuid' ? (
      <button type="button" onClick={() => onChange({ label: 'Regra', value: 'rule-uuid' })}>
        pick-rule
      </button>
    ) : null,
}));
vi.mock('@/services/v2/AdditionalInfo/additional-info-service', () => ({
  listAdditionalInfos: vi.fn(async () => ({ data: { items: [], meta: {} } })),
}));
vi.mock('@/services/v2/TaxRules/tax-rule-service', () => ({
  getTaxRuleByUuid: vi.fn(async () => ({ data: captured.rule })),
  listTaxRuleEntityOptions: vi.fn(),
  getTaxRuleOptions: vi.fn(),
}));
vi.mock('@/services/v2/NatureOperations/nature-operation-service', () => ({
  createNatureOperation: vi.fn(),
  updateNatureOperation: (...args: unknown[]) => updateMock(...args),
}));
vi.mock('./useNatureOperations', async () => {
  const { useEffect: useEffectStub } = await import('react');
  return {
    useNatureOperationForm: ({
      fillForm,
    }: {
      fillForm: (data: unknown, force?: boolean) => void;
    }) => {
      useEffectStub(() => {
        if (captured.detail) fillForm(captured.detail, true);
      }, []);
      return { data: captured.detail, isLoading: false, isFetching: false };
    },
    useNatureOperationFiscalOptions: () => ({
      isLoading: false,
      data: {
        cst_csosn: [
          { value: '20', label: '20 - Com reducao' },
          { value: '30', label: '30 - Isenta ST' },
          { value: '51', label: '51 - Diferimento' },
          { value: '60', label: '60 - ST anterior' },
        ],
        cst_pis_cofins: [{ value: '01', label: '01' }],
        cst_ipi: [{ value: '50', label: '50' }],
        cenq_ipi: [{ value: '999', label: '999' }],
        origem: [{ value: '0', label: '0 - Nacional' }],
        modality_bc: [{ value: 3, label: '3 - Valor da operacao' }],
        cst_ibs_cbs: [],
        tp_cred_pres_ibs_zfm: [],
      },
    }),
  };
});

import CreateOrUpdateNaturezaOperacao from './CreateOrUpdateNaturezaOperacao';

const EDIT_UUID = '3f2b8c1e-4d5a-4e6f-8a7b-9c0d1e2f3a4b';

function buildDetail(over: Record<string, unknown> = {}) {
  return {
    uuid: EDIT_UUID,
    code: 1,
    descricao: 'Venda agro',
    tipo: 1,
    cfop_saida_interno: '5101',
    cfop_saida_externo: '6101',
    cfop_saida_exportacao: null,
    cfop_entrada_interno: '1101',
    cfop_entrada_externo: '2101',
    cfop_entrada_exportacao: null,
    ativo: true,
    sobrescreve_cfop_produto: false,
    overwrite_product: true,
    generate_financial: true,
    automatic_calculation: true,
    tax_rule: null,
    additional_info: null,
    cst_csosn: '20',
    cst_pis: '01',
    cst_cofins: '01',
    cst_ipi: '50',
    perc_icms: 12,
    perc_pis: 1.65,
    perc_cofins: 7.6,
    perc_ipi: 0,
    origem: '0',
    cest: '1234567',
    cst_csosn_exp: '20',
    modality_bc: 3,
    percent_reduction: 10,
    mot_des_icms: 3,
    perc_dif: null,
    perc_fcp: 2,
    cenq_ipi: '999',
    c_class_trib: null,
    cst_ibs_cbs: null,
    perc_ibs_uf: 0,
    perc_ibs_mun: 0,
    perc_reducao_aliq_ibs_uf: 0,
    perc_reducao_aliq_ibs_mun: 0,
    perc_dif_ibs_uf: 0,
    perc_dif_ibs_mun: 0,
    perc_cbs: 0,
    perc_reducao_aliq_cbs: 0,
    perc_dif_cbs: 0,
    cst_is: null,
    perc_is: 0,
    perc_is_espec: 0,
    ad_rem_ibs: 0,
    ad_rem_cbs: 0,
    tp_cred_pres_ibs_zfm: null,
    ind_doacao: null,
    ...over,
  };
}

function renderEdit(over: Record<string, unknown> = {}) {
  captured.detail = buildDetail(over);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/cadastros-base/natureza-operacao/${EDIT_UUID}`]}>
          <Routes>
            <Route
              path="/cadastros-base/natureza-operacao/:natureOperationId"
              element={<CreateOrUpdateNaturezaOperacao />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

const text = getLanguageRouter(languageContextTypes.BR).natureOperations.natureOperation.form;
const MOT = text.fields.motDesIcms;
const DIF = text.fields.percDif;
const FCP = text.fields.percFcp;

async function ready() {
  await waitFor(() => expect(screen.getByDisplayValue('Venda agro')).toBeTruthy());
}

async function save() {
  // toca um campo para a edicao nao ser tratada como "sem alteracoes"
  fireEvent.change(screen.getByDisplayValue('Venda agro'), { target: { value: 'Venda agro 2' } });
  await waitFor(() => expect(screen.getByDisplayValue('Venda agro 2')).toBeTruthy());
  fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
}

afterEach(() => {
  cleanup();
  updateMock.mockReset();
  captured.detail = null;
  captured.rule = null;
});

describe('CreateOrUpdateNaturezaOperacao — campos C1 (FE-C1-03)', () => {
  it('CST 20: mostra mot_des_icms e perc_fcp, oculta perc_dif', async () => {
    renderEdit();
    await ready();
    expect(screen.getAllByText(MOT).length).toBeGreaterThan(0);
    expect(screen.getAllByText(FCP).length).toBeGreaterThan(0);
    expect(screen.queryByText(DIF)).toBeNull();
    expect(screen.getAllByText(/3 - Uso na agropecuária/).length).toBeGreaterThan(0);
  });

  it('troca de CST 20 -> 30 pelo Select limpa mot_des_icms 3 e o payload sai null', async () => {
    updateMock.mockResolvedValue({ data: {} });
    renderEdit();
    await ready();
    expect(screen.getAllByText(/3 - Uso na agropecuária/).length).toBeGreaterThan(0);
    await chooseSelectOption(text.fields.cstCsosn, /30 - Isenta ST/);
    await waitFor(() => expect(screen.queryByText(/3 - Uso na agropecuária/)).toBeNull());
    // CST 30 mantem o campo (dominio {6,7,9}) sem valor; perc_fcp nao existe no grupo do 30
    expect(screen.getAllByText(MOT).length).toBeGreaterThan(0);
    expect(screen.queryByText(FCP)).toBeNull();
    await save();
    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    const payload = updateMock.mock.calls[0][1];
    expect(payload.cst_csosn).toBe('30');
    expect([payload.mot_des_icms, payload.perc_dif, payload.perc_fcp]).toEqual([null, null, null]);
  });

  it('CST 60: nenhum dos tres; payload sai null mesmo com residuo hidratado', async () => {
    updateMock.mockResolvedValue({ data: {} });
    renderEdit({ cst_csosn: '60', mot_des_icms: 3, perc_dif: 10, perc_fcp: 0 });
    await ready();
    expect(screen.queryByText(MOT)).toBeNull();
    expect(screen.queryByText(DIF)).toBeNull();
    expect(screen.queryByText(FCP)).toBeNull();
    await save();
    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    const payload = updateMock.mock.calls[0][1];
    expect([payload.mot_des_icms, payload.perc_dif, payload.perc_fcp]).toEqual([null, null, null]);
  });

  it('round-trip: payload do CST 20 leva mot_des_icms/perc_fcp e perc_dif null', async () => {
    updateMock.mockResolvedValue({ data: {} });
    renderEdit();
    await ready();
    await save();
    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    const payload = updateMock.mock.calls[0][1];
    expect(payload.mot_des_icms).toBe(3);
    expect(payload.perc_fcp).toBe(2);
    expect(payload.perc_dif).toBeNull();
  });

  it('autofill: selecionar a regra copia os 3 campos (CST 20 da regra)', async () => {
    updateMock.mockResolvedValue({ data: {} });
    captured.rule = {
      cst_csosn: '20',
      cst_pis: '01',
      cst_cofins: '01',
      cst_ipi: '50',
      perc_icms: 12,
      perc_pis: 1,
      perc_cofins: 1,
      perc_ipi: 0,
      origem: '0',
      cest: '1234567',
      cst_csosn_exp: '20',
      modality_bc: 3,
      percent_reduction: 0,
      cenq_ipi: '999',
      mot_des_icms: 12,
      perc_dif: 50,
      perc_fcp: 1.5,
    };
    renderEdit({ mot_des_icms: null, perc_fcp: null });
    await ready();
    fireEvent.click(screen.getByText('pick-rule'));
    await waitFor(() =>
      expect(screen.getAllByText(/12 - Órgão de fomento/).length).toBeGreaterThan(0)
    );
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    const payload = updateMock.mock.calls[0][1];
    expect(payload.mot_des_icms).toBe(12);
    expect(payload.perc_fcp).toBe(1.5);
    // CST 20 nao admite perc_dif (so CST 51): zerado mesmo vindo da regra
    expect(payload.perc_dif).toBeNull();
  });

  it('autofill: regra com CST sem grupo (60) zera os 3 campos', async () => {
    updateMock.mockResolvedValue({ data: {} });
    captured.rule = {
      cst_csosn: '60',
      cst_pis: '01',
      cst_cofins: '01',
      cst_ipi: '50',
      perc_icms: 12,
      perc_pis: 1,
      perc_cofins: 1,
      perc_ipi: 0,
      origem: '0',
      cest: '1234567',
      cst_csosn_exp: '20',
      modality_bc: 3,
      percent_reduction: 0,
      cenq_ipi: '999',
      mot_des_icms: 9,
      perc_dif: 10,
      perc_fcp: 3,
    };
    renderEdit();
    await ready();
    fireEvent.click(screen.getByText('pick-rule'));
    await waitFor(() => expect(screen.queryByText(MOT)).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    const payload = updateMock.mock.calls[0][1];
    expect([payload.mot_des_icms, payload.perc_dif, payload.perc_fcp]).toEqual([null, null, null]);
  });

  it('422 por campo (mot_des_icms) aparece no campo exibido', async () => {
    const err = new AxiosError('422');
    (err as any).response = {
      status: 422,
      data: { errors: { mot_des_icms: ['Motivo invalido para o CST informado.'] } },
    };
    updateMock.mockRejectedValue(err);
    renderEdit();
    await ready();
    await save();
    await waitFor(() =>
      expect(screen.getByText('Motivo invalido para o CST informado.')).toBeTruthy()
    );
  });
});
