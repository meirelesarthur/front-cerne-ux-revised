// src/pages/Public/Rastreio/ImageWithFallback.tsx
// -----------------------------------------------------------------------------
// Imagem com fallback tratado — reuso entre a imagem principal do produto
// (`## 4.4`) e o logo do produtor/config (`## 4.10`), F-067 (`97-Esteiras/058`,
// TASK-TR-PUB-FE-03). Corrige o `asset('/img/noimage.png')` do legado (`CL-28`)
// sem depender de um asset físico inexistente neste repositório: usa o MESMO
// placeholder honesto já usado pela galeria admin (`Traceability/Galery/
// index.tsx`) — ícone `FiImage` sobre `bg.muted` — em vez de fabricar um
// arquivo `noimage.png` que não existe na SPA.
//
// ⚠️ Adaptação, não cópia literal do contrato de tela (`## 4.4`, que cita
// `fallbackSrc` do Chakra): a versão instalada de `@chakra-ui/react` (3.36)
// NÃO expõe `fallback`/`fallbackSrc` no componente `Image` (é um wrapper fino
// de `<img>`, ver `node_modules/@chakra-ui/react/dist/types/components/image/
// image.d.ts`) — o fallback é implementado aqui via estado local + `onError`,
// mesmo resultado observável (nunca um ícone de imagem quebrada do browser).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Flex, Icon, Image } from '@chakra-ui/react';
import { FiImage } from 'react-icons/fi';

interface ImageWithFallbackProps {
  src: string | null;
  alt: string;
  height: { base: string; md: string };
  borderRadius?: string;
}

export function ImageWithFallback({
  src,
  alt,
  height,
  borderRadius = 'lg',
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <Flex
        w="full"
        h={height}
        borderRadius={borderRadius}
        bg="bg.muted"
        align="center"
        justify="center"
        border="1px solid"
        borderColor="border.subtle"
      >
        <Icon as={FiImage} boxSize={10} color="fg.muted" aria-hidden />
      </Flex>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      objectFit="cover"
      w="full"
      h={height}
      borderRadius={borderRadius}
      onError={() => setFailed(true)}
    />
  );
}

export default ImageWithFallback;
