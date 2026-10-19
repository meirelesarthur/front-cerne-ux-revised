// @vitest-environment jsdom
// D-101-08 — Resumo do CT-e: Cancelar=cte_delete; Transmitir/CC-e=cte_edit; DACTE=cte_view.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languages } from '@/constants/languages';

import type { CteEmissaoData } from '@/@types/v2/Fiscal/cteEmissao';

import { ResumoTab } from './ResumoTab';

const languageGB = languages.BR;
const actions = languageGB.ctes.cte.emission.actions;

function renderTab(estado: string, perms: { edit?: boolean; del?: boolean; view?: boolean }) {
  const noop = vi.fn();
  const data = {
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
    estado,
    sequencia_cce: 0,
    created_at: '2026-10-13T10:00:00Z',
  } as unknown as CteEmissaoData;
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
        canEmit={!!perms.edit}
        canCancel={!!perms.del}
        canView={!!perms.view}
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

afterEach(() => cleanup());

describe('CT-e ResumoTab — permissões do legado', () => {
  it('Cancelar só com cte_delete', () => {
    renderTab('aprovado', { edit: true, view: true });
    expect(screen.queryByText(actions.cancelarButton)).toBeNull();
    cleanup();
    renderTab('aprovado', { del: true });
    expect(screen.queryByText(actions.cancelarButton)).not.toBeNull();
  });

  it('CC-e só com cte_edit', () => {
    renderTab('aprovado', { del: true, view: true });
    expect(screen.queryByText(actions.corrigirButton)).toBeNull();
    cleanup();
    renderTab('aprovado', { edit: true });
    expect(screen.queryByText(actions.corrigirButton)).not.toBeNull();
  });

  it('DACTE só com cte_view', () => {
    renderTab('aprovado', { edit: true, del: true });
    expect(screen.queryByText(actions.dacteButton)).toBeNull();
    cleanup();
    renderTab('aprovado', { view: true });
    expect(screen.queryByText(actions.dacteButton)).not.toBeNull();
  });
});
