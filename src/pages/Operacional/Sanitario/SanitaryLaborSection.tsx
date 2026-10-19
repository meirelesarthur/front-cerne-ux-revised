// src/pages/Operacional/Sanitario/SanitaryLaborSection.tsx
// -----------------------------------------------------------------------------
// Bloco de mão de obra do formulário de Sanitário — `san-form-labor`, FS-01..04
// (F-062, TASK-SAN-FE-05, contrato-tela-lane-c-sanitario-frontend.md §6.5/
// §6.6). `useFieldArray` de `labor`, visível SÓ quando `time_control=true`
// (IG-09) — o próprio componente assiste `watch('time_control')` do form
// pai, mirror do racional já documentado em `SanitarioHeaderFields.tsx`
// ("bloco condicional, mesmo racional de ADR-FE-BM-01: o legado usa toggle
// de classe CSS, não abas").
//
// Diferente de `SanitaryItemsSection` (mínimo 1 linha via `useEffect`), este
// bloco começa VAZIO e não tem invariante de mínimo — mirror EXATO
// `ServiceOrders/tabs/ServiceOrderLaborTab.tsx` (contrato-tela §6.5: "sem
// mínimo de 1 linha documentada para Sanitário").
//
// Esconder o bloco (Switch desligado) NÃO apaga as linhas já digitadas — o
// `control` do react-hook-form mantém o estado do array fora do ciclo de
// vida deste componente (`useForm` sem `shouldUnregister`); reaparecer com
// `time_control=true` de novo mostra as mesmas linhas intactas (DoD da
// Tarefa: "sem perder dados digitados ao reaparecer"). Quem decide se essas
// linhas residuais entram ou não no payload quando o bloco está oculto é o
// `sanitario-form-mapper.ts` (`toPayload`, Regra 3 da Tarefa) — este
// componente só renderiza.
// -----------------------------------------------------------------------------

import { Flex, Text } from '@chakra-ui/react';
import { Control, useFieldArray, UseFormWatch } from 'react-hook-form';

import { Button } from '@/components/Button';

import type { LanguageDate } from '@/@types/language';
import type { SanitaryFormValues, SanitaryLaborFormValue } from '@/@types/v2/Sanitaries';

import { SanitaryLaborRow } from './SanitaryLaborRow';

const EMPTY_LABOR: SanitaryLaborFormValue = {
  func_type: null,
  employee_uuid: null,
  function_uuid: null,
  provider_uuid: null,
  measurement_uuid: null,
  total_quantity: '',
};

export interface SanitaryLaborSectionProps {
  control: Control<SanitaryFormValues>;
  watch: UseFormWatch<SanitaryFormValues>;
  languageGB: LanguageDate;
  isDisabled?: boolean;
}

export function SanitaryLaborSection({
  control,
  watch,
  languageGB,
  isDisabled,
}: SanitaryLaborSectionProps) {
  const text = languageGB.sanitary.sanitary.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'labor' });

  const timeControl = !!watch('time_control');

  if (!timeControl) {
    return null;
  }

  return (
    <Flex direction="column" gap={4} mt={6}>
      <Flex justify="space-between" align="center">
        <Text fontWeight="bold">{text.sections.labor}</Text>
        <Button
          title={text.addLabor}
          variant="outline"
          type="button"
          onClick={() => append(EMPTY_LABOR)}
          disabled={isDisabled}
        />
      </Flex>

      <Flex direction="column" gap={4}>
        {fields.map((field, index) => (
          <SanitaryLaborRow
            key={field.id}
            control={control}
            index={index}
            onRemove={() => remove(index)}
            languageGB={languageGB}
            isDisabled={isDisabled}
          />
        ))}
      </Flex>

      {fields.length === 0 && <Text color="fg.muted">{text.emptyLaborRow}</Text>}
    </Flex>
  );
}

export default SanitaryLaborSection;
