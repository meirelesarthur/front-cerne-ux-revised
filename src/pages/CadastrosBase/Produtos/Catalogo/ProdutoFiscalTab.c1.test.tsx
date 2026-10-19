// @vitest-environment jsdom
// FE-C1-04 (D-101-19/D-101-20) — campos C1 (mot_des_icms, perc_dif, perc_fcp) na aba fiscal do
// Produto: visibilidade por CST, autofill pela regra tributaria (copia os 3 pelo array e
// reconcilia com o CST efetivo) e limpeza de lixo. Hook-form REAL; so servicos/stub de select
// assincrono sao simulados.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { chooseSelectOption } from '@/test-helpers/chakraSelect';
import { system } from '@/theme';

import { getLanguageRouter } from '@/utils/get-language-route';

import { languageContextTypes } from '@/constants/languages';

import type { ProductForm } from '@/@types/v2/Products';

const captured = vi.hoisted(() => ({ rule: null as any }));

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: getLanguageRouter(languageContextTypes.BR) }),
}));
vi.mock('@/components/ui/toaster', () => ({
  toaster: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));
vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: ({ name, onChange }: any) =>
    name === 'tax_rule_uuid' ? (
      <button type="button" onClick={() => onChange({ label: 'Regra', value: 'rule-uuid' })}>
        pick-rule
      </button>
    ) : null,
}));
vi.mock('./useProducts', () => ({
  useTaxRuleFiscalDefaultsAutofill: () => ({
    mutate: (_uuid: string, opts: { onSuccess: (r: { data: unknown }) => void }) =>
      opts.onSuccess({ data: captured.rule }),
  }),
}));
vi.mock('@/services/v2/TaxRules/tax-rule-service', () => ({
  listTaxRuleEntityOptions: vi.fn(),
}));

import { ProdutoFiscalTab } from './ProdutoFiscalTab';

const text = getLanguageRouter(languageContextTypes.BR).products.product.form;
const MOT = text.fields.motDesIcms;
const DIF = text.fields.percDif;
const FCP = text.fields.percFcp;

function Harness({ defaults }: { defaults: Partial<ProductForm> }) {
  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductForm>({ defaultValues: { is_fiscal: true, ...defaults } as any });
  return (
    <ChakraProvider value={system}>
      <ProdutoFiscalTab
        control={control}
        register={register}
        errors={errors}
        isLoading={false}
        canSave
        setValue={setValue}
      />
      <pre data-testid="c1">
        {JSON.stringify({
          cst: watch('cst_csosn'),
          mot: watch('mot_des_icms') ?? null,
          dif: watch('perc_dif') ?? null,
          fcp: watch('perc_fcp') ?? null,
        })}
      </pre>
    </ChakraProvider>
  );
}

const readC1 = () => JSON.parse(screen.getByTestId('c1').textContent ?? '{}');

afterEach(() => {
  cleanup();
  captured.rule = null;
});

describe('ProdutoFiscalTab — campos C1 (FE-C1-04)', () => {
  it('CST 20: mostra mot_des_icms e perc_fcp, oculta perc_dif', () => {
    render(<Harness defaults={{ cst_csosn: '20', mot_des_icms: 3, perc_fcp: 2 }} />);
    expect(screen.getAllByText(MOT).length).toBeGreaterThan(0);
    expect(screen.getAllByText(FCP).length).toBeGreaterThan(0);
    expect(screen.queryByText(DIF)).toBeNull();
    expect(screen.getAllByText(/3 - Uso na agropecuária/).length).toBeGreaterThan(0);
  });

  it('troca de CST 20 -> 30 pelo Select limpa mot_des_icms 3 e perc_fcp', async () => {
    render(<Harness defaults={{ cst_csosn: '20', mot_des_icms: 3, perc_fcp: 2 }} />);
    expect(readC1()).toEqual({ cst: '20', mot: 3, dif: null, fcp: 2 });
    await chooseSelectOption(text.fields.cstCsosn, /^30 - /);
    await waitFor(() => expect(readC1().cst).toBe('30'));
    expect(readC1()).toEqual({ cst: '30', mot: null, dif: null, fcp: null });
    expect(screen.queryByText(/3 - Uso na agropecuária/)).toBeNull();
    expect(screen.getAllByText(MOT).length).toBeGreaterThan(0);
  });

  it('CST 51: so perc_dif e perc_fcp; CST 60: nenhum dos tres', () => {
    const first = render(<Harness defaults={{ cst_csosn: '51', perc_dif: 100 }} />);
    expect(screen.queryByText(MOT)).toBeNull();
    expect(screen.getAllByText(DIF).length).toBeGreaterThan(0);
    first.unmount();
    render(<Harness defaults={{ cst_csosn: '60' }} />);
    expect(screen.queryByText(MOT)).toBeNull();
    expect(screen.queryByText(DIF)).toBeNull();
    expect(screen.queryByText(FCP)).toBeNull();
  });

  it('autofill copia os 3 campos da regra (CST 20 da regra) sem 0 espurio', async () => {
    captured.rule = {
      cst_csosn: '20',
      mot_des_icms: 12,
      perc_dif: 50,
      perc_fcp: 1.5,
    };
    render(<Harness defaults={{ cst_csosn: null, mot_des_icms: null }} />);
    fireEvent.click(screen.getByText('pick-rule'));
    await waitFor(() => expect(readC1().cst).toBe('20'));
    // perc_dif so existe no CST 51: zerado mesmo vindo da regra
    expect(readC1()).toEqual({ cst: '20', mot: 12, dif: null, fcp: 1.5 });
  });

  it('autofill de regra com campos C1 nulos preserva o que ja esta no CST compativel', async () => {
    captured.rule = { cst_csosn: '20', mot_des_icms: null, perc_dif: null, perc_fcp: null };
    render(<Harness defaults={{ cst_csosn: '20', mot_des_icms: 9, perc_fcp: 3 }} />);
    fireEvent.click(screen.getByText('pick-rule'));
    await waitFor(() => expect(readC1().cst).toBe('20'));
    expect(readC1()).toEqual({ cst: '20', mot: 9, dif: null, fcp: 3 });
  });

  it('autofill de regra com CST sem grupo (60) limpa os 3 residuais do produto', async () => {
    captured.rule = { cst_csosn: '60', mot_des_icms: null, perc_dif: null, perc_fcp: null };
    render(<Harness defaults={{ cst_csosn: '20', mot_des_icms: 9, perc_fcp: 3 }} />);
    fireEvent.click(screen.getByText('pick-rule'));
    await waitFor(() => expect(readC1().cst).toBe('60'));
    expect(readC1()).toEqual({ cst: '60', mot: null, dif: null, fcp: null });
    expect(screen.queryByText(MOT)).toBeNull();
  });
});
