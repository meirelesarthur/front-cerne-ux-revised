// @vitest-environment jsdom
// T-776-FE-02 — CT-e: IBS/CBS pela natureza (editáveis). Trocar a natureza
// preenche só os campos NÃO editados; hidratação traz os 11 campos e a unidade
// de medida pelo rótulo (T-776-API-04c).
import { ReactNode, useState } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import { languages } from '@/constants/languages';

import CreateOrUpdateCte from './CreateOrUpdateCte';

const getNatureOperationMock = vi.fn();
const getCteMock = vi.fn();

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({ languageGB: languages.BR, languageInUse: 'BR' }),
}));
vi.mock('@/hooks/usePermissions', () => ({ usePermissions: () => ({ can: () => true }) }));

vi.mock('@/services/v2/NatureOperations/nature-operation-service', () => ({
  getNatureOperation: (...args: unknown[]) => getNatureOperationMock(...args),
  listActiveNatureOperations: vi.fn(),
}));
vi.mock('@/services/v2/Fiscal/cte-service', () => ({
  createCte: vi.fn(),
  updateCte: vi.fn(),
  getCte: (...args: unknown[]) => getCteMock(...args),
  getCitiesOptions: vi.fn(),
  getClientAddressForCte: vi.fn(),
  getClientsOptions: vi.fn().mockResolvedValue([]),
  getEquipmentsOptions: vi.fn(),
}));

// react-select assíncrono não é o alvo deste teste: o mock expõe a troca de natureza.
vi.mock('@/components/Form/SelectAsyncPaginate', () => ({
  SelectAsyncPaginate: ({ name, onChange }: { name: string; onChange: (o: unknown) => void }) => (
    <div>
      <button
        type="button"
        data-testid={`pick-${name}-a`}
        onClick={() => onChange({ value: 'nat-a', label: 'Natureza A' })}
      />
      <button
        type="button"
        data-testid={`pick-${name}-b`}
        onClick={() => onChange({ value: 'nat-b', label: 'Natureza B' })}
      />
    </div>
  ),
}));

const natureA = {
  c_class_trib: '000001',
  cst_ibs_cbs: '000',
  perc_ibs_uf: 0.1,
  perc_ibs_mun: 0.2,
  perc_cbs: 0.9,
  perc_reducao_aliq_ibs_uf: 10,
  perc_reducao_aliq_ibs_mun: 20,
  perc_reducao_aliq_cbs: 30,
  perc_dif_ibs_uf: 1,
  perc_dif_ibs_mun: 2,
  perc_dif_cbs: 3,
};
const natureB = { ...natureA, c_class_trib: '000002', perc_cbs: 1.5 };

function Wrapper({ children, path }: { children: ReactNode; path: string }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
  );
  return (
    <QueryClientProvider client={client}>
      <ChakraProvider value={system}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/fiscal/ctes/create" element={children} />
            <Route path="/fiscal/ctes/:id" element={children} />
          </Routes>
        </MemoryRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

function input(container: HTMLElement, name: string): HTMLInputElement {
  return container.querySelector(`input[name="${name}"]`) as HTMLInputElement;
}

describe('CreateOrUpdateCte — IBS/CBS pela natureza', () => {
  beforeEach(() => {
    getNatureOperationMock.mockReset();
    getCteMock.mockReset();
  });
  afterEach(cleanup);

  it('trocar a natureza preenche os campos IBS/CBS', async () => {
    getNatureOperationMock.mockResolvedValue({ data: natureA });
    const { container } = render(
      <Wrapper path="/fiscal/ctes/create">
        <CreateOrUpdateCte />
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('pick-natureza-a'));

    await waitFor(() => expect(input(container, 'cClassTrib').value).toBe('000001'));
    expect(getNatureOperationMock).toHaveBeenCalledWith('nat-a');
    expect(input(container, 'percCbs').value).toMatch(/0,9/);
    expect(input(container, 'percDifCbs').value).toMatch(/3/);
  });

  it('campo já editado pelo usuário NÃO é sobrescrito ao trocar a natureza', async () => {
    getNatureOperationMock.mockResolvedValueOnce({ data: natureA });
    const { container } = render(
      <Wrapper path="/fiscal/ctes/create">
        <CreateOrUpdateCte />
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('pick-natureza-a'));
    await waitFor(() => expect(input(container, 'cClassTrib').value).toBe('000001'));

    fireEvent.change(input(container, 'cClassTrib'), { target: { value: '999999' } });

    getNatureOperationMock.mockResolvedValueOnce({ data: natureB });
    fireEvent.click(screen.getByTestId('pick-natureza-b'));

    await waitFor(() => expect(input(container, 'percCbs').value).toMatch(/1,5/));
    expect(input(container, 'cClassTrib').value).toBe('999999');
  });

  it('falha ao ler a natureza (403) deixa os campos vazios, sem quebrar', async () => {
    getNatureOperationMock.mockRejectedValue(new Error('403'));
    const { container } = render(
      <Wrapper path="/fiscal/ctes/create">
        <CreateOrUpdateCte />
      </Wrapper>
    );

    fireEvent.click(screen.getByTestId('pick-natureza-a'));
    await waitFor(() => expect(getNatureOperationMock).toHaveBeenCalled());
    expect(input(container, 'cClassTrib').value).toBe('');
  });

  it('hidratação: traz os campos IBS/CBS gravados e a unidade pelo rótulo (01 -> KG)', async () => {
    getCteMock.mockResolvedValue({
      data: {
        uuid: '019f62a6-1111-7023-8abc-0123456789ab',
        natureza: { uuid: 'nat-a', descricao: 'Natureza A' },
        globalizado: 0,
        cst: '00',
        perc_icms: 12,
        ...natureA,
        v_ibs: 1,
        v_cbs: 2,
        remetente: { uuid: 'r', nome: 'Rem' },
        destinatario: { uuid: 'd', nome: 'Dest' },
        chaves_nfe: [],
        tpDoc: '00',
        descOutros: null,
        nDoc: null,
        vDocFisc: 0,
        equipment: { uuid: 'e', description: 'Caminhão' },
        produto_predominante: 'Soja',
        tomador: 0,
        valor_carga: 100,
        valor_transporte: 10,
        valor_receber: 10,
        modal: '01',
        medidas: [
          { uuid: 'm1', cod_unidade: '01', tipo_medida: 'PESO BRUTO', quantidade_carga: 5 },
        ],
        componentes: [{ uuid: 'c1', nome: 'Frete', valor: 10 }],
        rua_tomador: 'Rua',
        numero_tomador: '1',
        bairro_tomador: 'B',
        cep_tomador: '1',
        cidade_tomador: { uuid: 'ci', name: 'Cidade' },
        data_prevista_entrega: '2026-10-20',
        municipio_envio: { uuid: 'ci', name: 'Cidade' },
        municipio_inicio: { uuid: 'ci', name: 'Cidade' },
        municipio_fim: { uuid: 'ci', name: 'Cidade' },
        retira: false,
        detalhes_retira: null,
        observacao: null,
      },
    });
    const { container } = render(
      <Wrapper path="/fiscal/ctes/019f62a6-1111-7023-8abc-0123456789ab">
        <CreateOrUpdateCte />
      </Wrapper>
    );

    await waitFor(() => expect(input(container, 'cClassTrib').value).toBe('000001'));
    // rótulo (KG), nunca o código cru (01), na unidade de medida hidratada
    expect(screen.getAllByText('KG').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('01')).toHaveLength(0);
    expect(screen.getAllByText('000 - Tributação integral').length).toBeGreaterThan(0);
    expect(input(container, 'percReducaoAliqCbs').value).toMatch(/30/);
  });
});
