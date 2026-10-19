// @vitest-environment jsdom
// Execução 085, item 3 — ImageUpload: placeholder "sem foto" quando a imagem
// atual falha ao carregar; volta a exibir a imagem quando o src muda.
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { system } from '@/theme';

import { ImageUpload } from './ImageUpload';

afterEach(cleanup);

function ui(url: string | null) {
  return (
    <ChakraProvider value={system}>
      <ImageUpload
        label="Foto"
        currentImageUrl={url}
        onFileSelected={() => {}}
        changeLabel="Trocar"
        noImageLabel="Sem foto"
      />
    </ChakraProvider>
  );
}

describe('ImageUpload', () => {
  it('mostra placeholder no onError, mantém o botão Trocar e reseta ao mudar o src', () => {
    const { rerender } = render(ui('http://x/storage/a.png'));
    const img = screen.getByAltText('Foto');
    expect(img.getAttribute('src')).toBe('http://x/storage/a.png');

    fireEvent.error(img);
    expect(screen.queryByAltText('Foto')).toBeNull();
    expect(screen.getByRole('img', { name: 'Sem foto' })).toBeTruthy();
    expect(screen.getByText('Trocar')).toBeTruthy();

    rerender(ui('http://x/storage/b.png'));
    expect(screen.queryByRole('img', { name: 'Sem foto' })).toBeNull();
    expect(screen.getByAltText('Foto').getAttribute('src')).toBe('http://x/storage/b.png');
  });
});
