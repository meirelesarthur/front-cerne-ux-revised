// @vitest-environment jsdom
// T-776-FE-02 — Resumo do CT-e exibe cClassTrib, CST IBS/CBS, IBS e CBS; nulos -> traço.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languages } from '@/constants/languages';

import type { CteEmissaoData } from '@/@types/v2/Fiscal/cteEmissao';

import { ResumoTab } from './ResumoTab';

const languageGB = languages.BR;
const text = languageGB.ctes.cte.emission.fields;

function baseData(overrides: Partial<CteEmissaoData> = {}): CteEmissaoData {
  return {
    uuid: 'u1',
    natureza: { uuid: 'n1', descricao: 'Frete' },
    cst: '00',
    perc_icms: 12,
    remetente: { uuid: 'r', nome: 'Rem' },
    destinatario: { uuid: 'd', nome: 'Dest' },
    produto_predominante: 'Soja',
    data_prevista_entrega: '2026-10-20',
    tpDoc: '00',
    valor_carga: 1000,
    valor_transporte: 100,
    valor_receber: 100,
    observacao: null,
    cte_numero: 1,
    chave: 'c',
    estado: 'aprovado',
    sequencia_cce: 0,
    created_at: '2026-10-13T10:00:00Z',
    ...overrides,
  } as CteEmissaoData;
}

function renderTab(data: CteEmissaoData) {
  const noop = vi.fn();
  return render(
    <ChakraProvider value={system}>
      <ResumoTab
        data={data}
        languageGB={languageGB}
        control={{} as never}
        issueOptions={[]}
        issueOptionsLoading={false}
        issueOptionsError={false}
        issueSelected={false}
        canEmit={false}
        canCancel={false}
        canView={false}
        onGerarXml={noop}
        isGeneratingXml={false}
        onTransmitir={noop}
        isTransmitting={false}
        onOpenCorrecao={noop}
        onOpenCancelamento={noop}
        onDacte={noop}
        isDownloadingDacte={false}
        onImprimirCorrecao={noop}
        isDownloadingCorrecaoImpressao={false}
        onImprimirCancelamento={noop}
        isDownloadingCancelamentoImpressao={false}
      />
    </ChakraProvider>
  );
}

function valueOf(label: string): string {
  const el = screen.getByText(label);
  const container = el.closest('div')?.parentElement ?? el.parentElement!;
  return container.textContent ?? '';
}

describe('ResumoTab IBS/CBS', () => {
  afterEach(cleanup);

  it('exibe cClassTrib, CST IBS/CBS (rótulo do catálogo), IBS e CBS formatados', () => {
    renderTab(
      baseData({
        c_class_trib: '000001',
        cst_ibs_cbs: '000',
        v_ibs: 12.5,
        v_cbs: 7.25,
      })
    );
    expect(valueOf(text.cClassTrib)).toContain('000001');
    expect(valueOf(text.cstIbsCbs)).toContain('000 - Tributação integral');
    expect(valueOf(text.vIbs)).toMatch(/12,50/);
    expect(valueOf(text.vCbs)).toMatch(/7,25/);
  });

  it('CT-e sem o grupo (nulos) mostra o traço, sem quebrar', () => {
    renderTab(baseData({ c_class_trib: null, cst_ibs_cbs: null, v_ibs: null, v_cbs: null }));
    expect(valueOf(text.cClassTrib)).toContain(text.noValue);
    expect(valueOf(text.vIbs)).toContain(text.noValue);
    expect(valueOf(text.vCbs)).toContain(text.noValue);
  });
});
