// src/pages/Operacional/Rastreabilidade/Traceability/AvailabilityMonthsPicker.tsx
// -----------------------------------------------------------------------------
// Widget de "Disponibilidade" (`availability`, FD-37) — 12 chips de mês
// clicáveis (`.div-availability` do legado, `IG-05`, `SR-BT-11`). TASK-TR-FE-06.
//
// UX-GAP declarada (`get_spa_ux_fidelity_pattern`): sem componente próprio no
// `cerne` para "grade de meses toggle" — mirror ESTRUTURAL do padrão de
// swatch-toggle já em produção neste fork (`CreateOrUpdateGrazing.tsx`, campo
// `color`): `ChakraButton` cru (nunca `Box as="button"`, tipagem polimórfica
// não resolve `type="button"` nesta versão do Chakra), `type="button"`
// OBRIGATÓRIO (widget vive dentro do `<Form onSubmit>`, sem isso o clique
// submeteria o form), `aria-pressed` para leitor de tela, `Field` (rótulo +
// erro) como casca.
//
// Contrato de tipo: `availability: number[]` (meses 1-12) — divergência
// DELIBERADA da ficha ("widget custom... `string[]`"): `TraceabilityRequest`
// real valida `availability.* => integer, between:1,12` (ver docblock de
// `TraceabilityForm`, `@/@types/v2/Rastreabilidade/traceability`), nunca
// `JSON.stringify` manual — fecha D09 por TIPAGEM, não por regra de front.
// -----------------------------------------------------------------------------

import { Button as ChakraButton, SimpleGrid } from '@chakra-ui/react';

import { Field } from '@/components/Form/Field';

import { useLanguage } from '@/hooks/useLanguage';

export interface AvailabilityMonthsPickerProps {
  label: string;
  value: number[];
  onChange: (value: number[]) => void;
  error?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}

export function AvailabilityMonthsPicker({
  label,
  value,
  onChange,
  error,
  isRequired,
  isDisabled = false,
}: AvailabilityMonthsPickerProps) {
  const { languageGB } = useLanguage();
  const monthsText = languageGB.rastreabilidade.traceability.form.availabilityMonths;

  const months: Array<{ month: number; label: string }> = [
    { month: 1, label: monthsText.january },
    { month: 2, label: monthsText.february },
    { month: 3, label: monthsText.march },
    { month: 4, label: monthsText.april },
    { month: 5, label: monthsText.may },
    { month: 6, label: monthsText.june },
    { month: 7, label: monthsText.july },
    { month: 8, label: monthsText.august },
    { month: 9, label: monthsText.september },
    { month: 10, label: monthsText.october },
    { month: 11, label: monthsText.november },
    { month: 12, label: monthsText.december },
  ];

  function toggleMonth(month: number) {
    if (isDisabled) return;

    if (value.includes(month)) {
      onChange(value.filter((selected) => selected !== month));
    } else {
      onChange([...value, month].sort((a, b) => a - b));
    }
  }

  return (
    <Field label={label} errorText={error} isRequired={isRequired} invalid={!!error}>
      <SimpleGrid columns={{ base: 3, sm: 4, md: 6 }} gap={2} mt={1}>
        {months.map((item) => {
          const isSelected = value.includes(item.month);
          return (
            <ChakraButton
              key={item.month}
              type="button"
              size="sm"
              variant={isSelected ? 'solid' : 'outline'}
              colorPalette={isSelected ? 'primary' : 'gray'}
              aria-pressed={isSelected}
              onClick={() => toggleMonth(item.month)}
              disabled={isDisabled}
              cursor={isDisabled ? 'not-allowed' : 'pointer'}
            >
              {item.label}
            </ChakraButton>
          );
        })}
      </SimpleGrid>
    </Field>
  );
}

export default AvailabilityMonthsPicker;
