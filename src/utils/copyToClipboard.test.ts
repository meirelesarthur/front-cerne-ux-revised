// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { copyToClipboard } from './copyToClipboard';

// Guarda os descritores originais para restaurar entre os casos — `navigator.
// clipboard`/`isSecureContext` são somente-leitura, então redefinimos via
// `Object.defineProperty`.
const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
const originalSecureDescriptor = Object.getOwnPropertyDescriptor(window, 'isSecureContext');

function setSecureContext(value: boolean) {
  Object.defineProperty(window, 'isSecureContext', { value, configurable: true });
}

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
}

afterEach(() => {
  if (originalClipboardDescriptor) {
    Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor);
  }
  if (originalSecureDescriptor) {
    Object.defineProperty(window, 'isSecureContext', originalSecureDescriptor);
  }
  vi.restoreAllMocks();
});

describe('copyToClipboard', () => {
  it('usa navigator.clipboard.writeText em secure context', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setSecureContext(true);
    setClipboard({ writeText });

    await copyToClipboard('https://exemplo/orcamento-aprovacao/HASH');

    expect(writeText).toHaveBeenCalledWith('https://exemplo/orcamento-aprovacao/HASH');
  });

  it('cai no fallback execCommand quando navigator.clipboard é undefined (HTTP/inseguro)', async () => {
    setSecureContext(false);
    setClipboard(undefined);
    const execCommand = vi.fn().mockReturnValue(true);
    // `document.execCommand` não existe no jsdom por padrão.
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });

    await copyToClipboard('LINK');

    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('lança quando o fallback execCommand falha (para o handler exibir o toast de erro)', async () => {
    setSecureContext(false);
    setClipboard(undefined);
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn().mockReturnValue(false),
      configurable: true,
    });

    await expect(copyToClipboard('LINK')).rejects.toThrow();
  });
});
