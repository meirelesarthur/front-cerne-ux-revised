// src/components/ui/Icon.tsx
// Ícone do sistema — porte fiel de `Icon.tsx` do design system `cerne`. Única forma de
// renderizar um ícone nos menus/shell: tela nenhuma importa biblioteca de ícone direto;
// o desenho de cada PAPEL (`edit`, `delete`, `harvest`) mora em `src/design/icons.ts`
// (família HugeIcons stroke-rounded, traço 1.5 em grade 24). Espessura e degraus de
// tamanho vêm do DS (`t.stroke.icon`, `t.icon`) e não variam por chamada.

import { HugeiconsIcon } from '@hugeicons/react';

import { icons, type IconName } from '@/design/icons';

export type { IconName };

/** Degraus de tamanho do DS (`t.icon`): xs 13 · sm 15 · md 17 · lg 20 · xl 26. */
const ICON_SIZES = { xs: 13, sm: 15, md: 17, lg: 20, xl: 26 } as const;
/** Espessura de traço do DS (`t.stroke.icon`). */
const ICON_STROKE = 1.5;

export interface IconProps {
  /** Papel do ícone no sistema — ver `design/icons.ts`. */
  name: IconName;
  /** Degrau da escala (`xs..xl`) ou pixels. Default: `sm`. */
  size?: keyof typeof ICON_SIZES | number;
  /** Cor do traço. Default: herda do contexto via `currentColor`. */
  color?: string;
  /** Preenche o desenho (estado ligado/desligado com a mesma forma — ex.: favorito). */
  filled?: boolean;
  /** Rótulo para leitor de tela; ausente = decorativo (`aria-hidden`). */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({
  name,
  size = 'sm',
  color = 'currentColor',
  filled = false,
  label,
  className,
  style,
}: IconProps) {
  const px = typeof size === 'number' ? size : ICON_SIZES[size];
  const glyph = icons[name];
  // Papel desconhecido (ex.: dado legado que ainda manda um componente): não derruba a tela.
  if (!glyph) return null;

  return (
    <HugeiconsIcon
      icon={glyph}
      size={px}
      color={color}
      strokeWidth={ICON_STROKE}
      fill={filled ? color : 'none'}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ flexShrink: 0, ...style }}
    />
  );
}

export default Icon;
