// @vitest-environment jsdom
// UT-000748 / T-748-FE-02 — NfeMotivoModal: motivo 15..255 (cancelar) e 15..1000 (CC-e),
// 422 por campo (`fieldError`), 422 de negócio (`serverError`) e reset ao fechar.
import { useState } from 'react';

import { ChakraProvider } from '@chakra-ui/react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme';

import {
  NFE_CANCEL_MOTIVO_MAX,
  NFE_CORRECTION_MOTIVO_MAX,
  NFE_EVENT_MOTIVO_MIN,
} from './nfe-event-limits';
import { NfeMotivoModal, type NfeMotivoModalProps } from './NfeMotivoModal';

const MIN_MSG = 'mínimo 15';
const MAX_MSG = 'máximo';

function buildProps(overrides: Partial<NfeMotivoModalProps> = {}): NfeMotivoModalProps {
  return {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Titulo',
    description: 'Descricao',
    motivoLabel: 'Motivo',
    motivoPlaceholder: 'ph',
    motivoRequiredMessage: 'obrigatório',
    minLength: NFE_EVENT_MOTIVO_MIN,
    maxLength: NFE_CANCEL_MOTIVO_MAX,
    minLengthMessage: MIN_MSG,
    maxLengthMessage: MAX_MSG,
    helperText: 'Mínimo de 15 caracteres.',
    confirmLabel: 'Confirmar',
    cancelLabel: 'Voltar',
    mutation: { isPending: false } as unknown as NfeMotivoModalProps['mutation'],
    onConfirm: vi.fn(),
    ...overrides,
  };
}

function renderModal(props: NfeMotivoModalProps) {
  return render(
    <ChakraProvider value={system}>
      <NfeMotivoModal {...props} />
    </ChakraProvider>
  );
}

function getField(): HTMLTextAreaElement {
  return screen.getByRole('textbox') as HTMLTextAreaElement;
}

afterEach(() => cleanup());

describe('NfeMotivoModal', () => {
  it('bloqueia 14 caracteres e mostra a mensagem de mínimo', async () => {
    const props = buildProps();
    renderModal(props);
    fireEvent.change(getField(), { target: { value: 'a'.repeat(14) } });
    fireEvent.click(screen.getByText('Confirmar'));
    await waitFor(() => expect(screen.getByText(MIN_MSG)).toBeTruthy());
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it('aceita 15 caracteres', async () => {
    const props = buildProps();
    renderModal(props);
    const value = 'a'.repeat(15);
    fireEvent.change(getField(), { target: { value } });
    fireEvent.click(screen.getByText('Confirmar'));
    await waitFor(() => expect(props.onConfirm).toHaveBeenCalledWith(value));
  });

  it('cancelamento trava em 255 e CC-e aceita 1000', async () => {
    const cancel = renderModal(buildProps());
    expect(getField().maxLength).toBe(255);
    cancel.unmount();

    const props = buildProps({ maxLength: NFE_CORRECTION_MOTIVO_MAX });
    renderModal(props);
    expect(getField().maxLength).toBe(1000);
    const value = 'b'.repeat(1000);
    fireEvent.change(getField(), { target: { value } });
    fireEvent.click(screen.getByText('Confirmar'));
    await waitFor(() => expect(props.onConfirm).toHaveBeenCalledWith(value));
  });

  it('mostra o helper de mínimo', () => {
    renderModal(buildProps());
    expect(screen.getByText('Mínimo de 15 caracteres.')).toBeTruthy();
  });

  it('fieldError aparece no campo e some ao digitar', async () => {
    renderModal(buildProps({ fieldError: 'erro do servidor no motivo' }));
    await waitFor(() => expect(screen.getByText('erro do servidor no motivo')).toBeTruthy());
    fireEvent.change(getField(), { target: { value: 'a'.repeat(20) } });
    await waitFor(() => expect(screen.queryByText('erro do servidor no motivo')).toBeNull());
  });

  it('serverError aparece no alerta dentro do modal', () => {
    renderModal(buildProps({ serverError: 'Emissor sem ambiente' }));
    expect(screen.getByRole('alert').textContent).toContain('Emissor sem ambiente');
  });

  it('fechar reseta o campo', async () => {
    function Host() {
      const [open, setOpen] = useState(true);
      return (
        <ChakraProvider value={system}>
          <button type="button" onClick={() => setOpen(true)}>
            reabrir
          </button>
          <NfeMotivoModal {...buildProps({ isOpen: open, onClose: () => setOpen(false) })} />
        </ChakraProvider>
      );
    }
    render(<Host />);
    fireEvent.change(getField(), { target: { value: 'texto digitado' } });
    expect(getField().value).toBe('texto digitado');
    await act(async () => {
      fireEvent.click(screen.getByText('Voltar'));
    });
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
    fireEvent.click(screen.getByText('reabrir'));
    await waitFor(() => expect(getField().value).toBe(''));
  });
});
