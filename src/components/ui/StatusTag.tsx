// src/components/ui/StatusTag.tsx
// Tag de SITUAÇÃO para a própria linha da tabela: pílula com o fundo na cor da situação e o texto
// em branco ou preto, o que der mais contraste (AA). Substitui "bolinha colorida + legenda":
// a situação aparece escrita na linha, sem precisar consultar uma legenda acima do grid.
//
// `color` aceita o nome de um token/cor do tema (ex.: `supplyStatus3`, `green.500`) ou um valor
// CSS (`#B8860B`, `rgb(...)`). A cor do texto é calculada pela luminância da cor RESOLVIDA, então
// acompanha o tema claro/escuro.

import { useLayoutEffect, useState } from 'react';

import { Box } from '@chakra-ui/react';

export interface StatusTagProps {
  /** Texto da situação (já traduzido). */
  label: string;
  /** Token do tema (`supplyStatus3`, `green.500`) ou cor CSS. */
  color?: string;
  /** Tamanho: `md` (padrão, 12px) ou `sm` (11px, para espaços apertados). */
  size?: 'sm' | 'md';
}

const toCssVar = (token: string) =>
  `--chakra-colors-${token
    .replace(/\./g, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()}`;
const isCssColor = (c: string) => /^(#|rgb|hsl|var\()/i.test(c);

// Resolve a cor para `rgb(...)` usando o navegador (vale para token do tema ou cor CSS).
function resolveRgb(color: string): [number, number, number] | null {
  if (typeof document === 'undefined') return null;
  const probe = document.createElement('span');
  probe.style.display = 'none';
  probe.style.color = isCssColor(color) ? color : `var(${toCssVar(color)})`;
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  const m = rgb.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b] = m[1]
    .split(/[ ,/]+/)
    .filter(Boolean)
    .map(Number);
  return [r, g, b];
}

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: [number, number, number]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

// Texto branco ou preto sobre a cor de fundo. Branco é o padrão (a maioria das situações usa cores
// médias/escuras); preto só entra quando o fundo é realmente claro (amarelo, verde-claro, ciano) e
// o branco perderia legibilidade.
export function contrastTextFor(rgb: [number, number, number]): '#ffffff' | '#111111' {
  return luminance(rgb) > 0.5 ? '#111111' : '#ffffff';
}

export function StatusTag({ label, color = 'semanticNeutral.500', size = 'md' }: StatusTagProps) {
  const [text, setText] = useState<string>('#ffffff');

  // recalcula quando a cor muda e quando o tema (claro/escuro) troca — o tema marca o <html>
  // (atributo data-theme ou classe), então basta observar o atributo; não depende de provider.
  useLayoutEffect(() => {
    const update = () => {
      const rgb = resolveRgb(color);
      if (rgb) setText(contrastTextFor(rgb));
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    return () => observer.disconnect();
  }, [color]);

  return (
    <Box
      as="span"
      display="inline-block"
      px="10px"
      py="3px"
      borderRadius="full"
      fontSize={size === 'sm' ? 'xs' : 'sm'}
      fontWeight="semibold"
      lineHeight="1.35"
      whiteSpace="nowrap"
      bg={isCssColor(color) ? undefined : color}
      style={{ ...(isCssColor(color) ? { backgroundColor: color } : {}), color: text }}
    >
      {label}
    </Box>
  );
}

export default StatusTag;
