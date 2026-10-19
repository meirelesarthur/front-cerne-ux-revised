// src/components/FormSection/index.tsx
// Adaptação Chakra v3 (não cópia) do `FormSection` do design system `cerne`
// (GB.Cerne.UX/src/components/ui/FormSection.tsx, commit 24bd91603a6ee4e19b58fa5efe2221835c83e306).
// Contrato visual preservado: título + divisor opcional + grid responsivo de N colunas.
// Implementação trocada de CSS inline sobre tokens próprios do DS para primitivas/tokens
// nativos da SPA (`SimpleGrid`, `columnsForm`, tokens semânticos de `src/theme.ts`).
import type { CSSProperties, ReactNode } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';

import { columnsForm } from '@/constants/coluns-form';

export interface FormSectionProps {
  /** Título da seção (obrigatório — casa com o divisor). */
  title: string;
  /** Texto de apoio abaixo do título, fora da área do divisor. */
  subtitle?: string;
  /** Número de colunas do grid de campos. `1` renderiza os filhos em bloco (sem grid). */
  columns?: 1 | 2 | 3;
  /**
   * `true` → grid fluido por largura mínima de coluna (mirror do `auto-fit`/`minmax` do DS).
   * `false` (default) → grid por breakpoint via `columnsForm` — ADAPTAÇÃO deliberada: o DS,
   * neste modo, usa colunas fixas sem media query (squeeza em telas estreitas); a SPA exige
   * grid mobile-safe em todo lugar, então aqui o modo fixo ainda colapsa para 1 coluna em telas
   * pequenas via os breakpoints de `columnsForm` — não é regressão de fidelidade, é a mesma
   * regra de a11y/responsividade já aplicada a todo formulário do projeto.
   */
  responsive?: boolean;
  /** Exibe a linha divisória abaixo do título. Default `true`. */
  divider?: boolean;
  /** Alinhamento vertical dos itens do grid. Default `stretch`. */
  alignItems?: CSSProperties['alignItems'];
  children: ReactNode;
}

const FLUID_MIN_WIDTH: Record<2 | 3, string> = {
  2: '280px',
  3: '180px',
};

export function FormSection({
  title,
  subtitle,
  columns = 1,
  responsive = false,
  divider = true,
  alignItems = 'stretch',
  children,
}: FormSectionProps) {
  const isGrid = columns > 1;
  const fixedColumns = columns === 3 ? columnsForm.threeColumns : columnsForm.twoColumns;

  return (
    <Box mb="6">
      <Box
        pb={divider ? '2.5' : '0'}
        mb={subtitle ? '1' : '0'}
        borderBottom={divider ? '1px solid' : 'none'}
        borderColor="cardBorder"
      >
        <Box
          as="span"
          fontSize="16px"
          fontWeight="600"
          color="cardTextPrimary"
          lineHeight="1.4"
          fontFamily="heading"
        >
          {title}
        </Box>
      </Box>

      {subtitle && (
        <Box fontSize="13px" color="cardTextSecondary" lineHeight="1.4" mt={divider ? '0' : '1'}>
          {subtitle}
        </Box>
      )}

      {isGrid ? (
        responsive ? (
          <SimpleGrid
            pt="4"
            minChildWidth={FLUID_MIN_WIDTH[columns as 2 | 3]}
            gap="4"
            alignItems={alignItems}
          >
            {children}
          </SimpleGrid>
        ) : (
          <SimpleGrid pt="4" columns={fixedColumns} gap="4" alignItems={alignItems}>
            {children}
          </SimpleGrid>
        )
      ) : (
        <Box pt="4">{children}</Box>
      )}
    </Box>
  );
}

export default FormSection;
