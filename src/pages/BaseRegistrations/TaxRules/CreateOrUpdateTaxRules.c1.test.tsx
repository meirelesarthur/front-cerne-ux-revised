// @vitest-environment jsdom
// FE-C1-02 (D-101-19/D-101-20) — campos C1 (mot_des_icms, perc_dif, perc_fcp) na Regra Tributaria:
// visibilidade por CST, opcoes por grupo de CST, round-trip fill->payload (null quando oculto,
// FCP 0 -> null) e 422 por campo exibido na tela. Hook-form, schema e payload sao REAIS.
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

const captured = vi.hoisted(() => ({ detail: null as any }));
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
vi.mock('@/services/v2/TaxRules/tax-rule-service', () => ({
  createTaxRule: vi.fn(),
  updateTaxRule: (...args: unknown[]) => updateMock(...args),
  getTaxRuleByUuid: vi.fn(async () => ({ data: captured.detail })),
  getTaxRuleOptions: vi.fn(async () => ({
    data: {
      cst_csosn: [
        { value: '00', label: '00 - Tributada integralmente' },
        { value: '20', label: '20 - Com reducao de base' },
        { value: '30', label: '30 - Isenta com ST' },
        { value: '51', label: '51 - Diferimento' },
        { value: '60', label: '60 - ICMS ST anterior' },
      ],
      cst_pis_cofins: [{ value: '01', label: '01' }],
      cst_ipi: [{ value: '50', label: '50' }],
      cenq_ipi: [{ value: '999', label: '999' }],
      origem: [{ value: '0', label: '0 - Nacional' }],
      modality_bc: [{ value: 3, label: '3 - Valor da operacao' }],
      cst_ibs_cbs: [],
      tp_cred_pres_ibs_zfm: [],
    },
  })),
}));

import CreateOrUpdateTaxRules from './CreateOrUpdateTaxRules';

const EDIT_UUID = '3f2b8c1e-4d5a-4e6f-8a7b-9c0d1e2f3a4b';

function buildDetail(over: Record<string, unknown> = {}) {
  return {
    uuid: EDIT_UUID,
    name: 'Regra teste',
    is_enabled: true,
    cfop_saida_interno: '5101',
    cfop_saida_externo: '6101',
    cst_csosn: '20',
    cst_csosn_exp: null,
    cst_pis: '01',
    cst_cofins: '01',
    cst_ipi: '50',
    perc_icms: 12,
    perc_pis: 1.65,
    perc_cofins: 7.6,
    perc_ipi: 0,
    percent_reduction: 10,
    origem: '0',
    cest: null,
    modality_bc: 3,
    cenq_ipi: '999',
    cbenef: null,
    mot_des_icms: 3,
    perc_dif: null,
    perc_fcp: 2,
    c_class_trib: null,
    cst_ibs_cbs: null,
    perc_ibs_uf: null,
    perc_ibs_mun: null,
    perc_reducao_aliq_ibs_uf: null,
    perc_reducao_aliq_ibs_mun: null,
    perc_dif_ibs_uf: null,
    perc_dif_ibs_mun: null,
    perc_cbs: null,
    perc_reducao_aliq_cbs: null,
    perc_dif_cbs: null,
    cst_is: null,
    perc_is: null,
    perc_is_espec: null,
    ad_rem_ibs: null,
    ad_rem_cbs: null,
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
        <MemoryRouter initialEntries={[`/cadastros-base/regras-fiscais/${EDIT_UUID}`]}>
          <Routes>
            <Route
              path="/cadastros-base/regras-fiscais/:taxRuleId"
              element={<CreateOrUpdateTaxRules />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

const text = getLanguageRouter(languageContextTypes.BR).taxRules.taxRule.form;
const MOT = text.fields.motDesIcms;
const DIF = text.fields.percDif;
const FCP = text.fields.percFcp;

async function ready() {
  await waitFor(() => expect(screen.getByDisplayValue('Regra teste')).toBeTruthy());
}

async function save() {
  // edicao so persiste com campo sujo (guard `isEmpty` do projeto): toca o nome
  fireEvent.change(screen.getByDisplayValue('Regra teste'), { target: { value: 'Regra teste 2' } });
  await waitFor(() => expect(screen.getByDisplayValue('Regra teste 2')).toBeTruthy());
  fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
}

afterEach(() => {
  cleanup();
  updateMock.mockReset();
  captured.detail = null;
});

describe('CreateOrUpdateTaxRules — campos C1 (FE-C1-02)', () => {
  it('CST 20: mostra mot_des_icms e perc_fcp, oculta perc_dif; hidrata valores', async () => {
    renderEdit();
    await ready();
    expect(screen.getAllByText(MOT).length).toBeGreaterThan(0);
    expect(screen.getAllByText(FCP).length).toBeGreaterThan(0);
    expect(screen.queryByText(DIF)).toBeNull();
    // opcao 3 do grupo 20/70/90 hidratada no select
    expect(screen.getAllByText(/3 - Uso na agropecuária/).length).toBeGreaterThan(0);
  });

  it('CST 51: so perc_dif e perc_fcp; CST 60: nenhum dos tres', async () => {
    const first = renderEdit({
      cst_csosn: '51',
      mot_des_icms: null,
      perc_dif: 100,
      perc_fcp: null,
    });
    await ready();
    expect(screen.queryByText(MOT)).toBeNull();
    expect(screen.getAllByText(DIF).length).toBeGreaterThan(0);
    first.unmount();

    renderEdit({ cst_csosn: '60', mot_des_icms: null, perc_dif: null, perc_fcp: null });
    await ready();
    expect(screen.queryByText(MOT)).toBeNull();
    expect(screen.queryByText(DIF)).toBeNull();
    expect(screen.queryByText(FCP)).toBeNull();
  });

  it('round-trip: payload do CST 20 leva mot_des_icms/perc_fcp e perc_dif null', async () => {
    updateMock.mockResolvedValue({ data: {} });
    renderEdit();
    await ready();
    await save();
    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    const [uuid, payload] = updateMock.mock.calls[0];
    expect(uuid).toBe(EDIT_UUID);
    expect(payload.mot_des_icms).toBe(3);
    expect(payload.perc_fcp).toBe(2);
    expect(payload.perc_dif).toBeNull();
  });

  it('payload nao persiste lixo oculto: CST 60 com valores residuais sai tudo null', async () => {
    updateMock.mockResolvedValue({ data: {} });
    renderEdit({ cst_csosn: '60', mot_des_icms: 3, perc_dif: 10, perc_fcp: 0 });
    await ready();
    await save();
    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    const payload = updateMock.mock.calls[0][1];
    expect(payload.mot_des_icms).toBeNull();
    expect(payload.perc_dif).toBeNull();
    expect(payload.perc_fcp).toBeNull();
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
  it('troca de CST 20 -> 30 pelo Select limpa mot_des_icms 3 e o payload sai null', async () => {
    updateMock.mockResolvedValue({ data: {} });
    renderEdit();
    await ready();
    await chooseSelectOption(text.fields.cstCsosn, /30 - Isenta com ST/);
    await waitFor(() => expect(screen.queryByText(/3 - Uso na agropecuária/)).toBeNull());
    // CST 30 continua mostrando o campo (dominio {6,7,9}), agora sem valor
    expect(screen.getAllByText(MOT).length).toBeGreaterThan(0);
    await save();
    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    const payload = updateMock.mock.calls[0][1];
    expect(payload.cst_csosn).toBe('30');
    expect(payload.mot_des_icms).toBeNull();
    expect(payload.perc_fcp).toBeNull();
  });
});
