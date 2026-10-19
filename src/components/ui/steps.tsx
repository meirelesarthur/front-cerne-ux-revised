// src/components/ui/steps.tsx
// -----------------------------------------------------------------------------
// Wrapper sobre o `Steps` nativo do Chakra UI v3. RESKIN (execução 024,
// GAP-FE-127 — decisão do dev: Opção B aprovada) fiel ao `Stepper.tsx` do
// design system `cerne` (GB.Cerne.UX/src/components/ui/Stepper.tsx): círculos
// SEM número (vazio = pendente, contorno = etapa atual, preenchido =
// concluída, cor `colorPalette.solid` — rampa `green`/brand do projeto) ligados
// por uma linha de progresso colorida, com o label ABAIXO do círculo (antes:
// numerado, ícone de check, label ao lado). Compartilhado por 2 wizards —
// Fazenda (`CreateOrUpdateFarm.tsx`) e Pessoas (`CreateOrUpdatePessoa.tsx`,
// GAP-FE-127) — a mudança É intencional nas duas telas (aprovada pelo dev,
// ambas ganham fidelidade ao DS). Continua fino wrapper: só estiliza via
// slots oficiais do Chakra (`Trigger`/`Indicator`/`Title`/`Separator` +
// `ItemContext` para ler estado current/completed, mesmo padrão que o próprio
// `StepsNumber` oficial do Chakra usa internamente) — não reescreve a máquina
// de estado do Ark UI.
// -----------------------------------------------------------------------------
'use client';

import * as React from 'react';

import { Steps as ChakraSteps } from '@chakra-ui/react';

interface StepsItemProps extends Omit<ChakraSteps.ItemProps, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Opcional: tamanho fixo do indicador (token Chakra) para exibir o número legível. Sem a prop, mantém o ponto atual. */
  indicatorSize?: string;
}

interface StepsItemState {
  current: boolean;
  completed: boolean;
}

export const StepsItem = React.forwardRef<HTMLDivElement, StepsItemProps>(
  function StepsItem(props, ref) {
    const { title, description, indicatorSize, ...rest } = props;
    return (
      // @ts-ignore - Chakra UI v3 headless Steps: tipos ainda não compatíveis
      <ChakraSteps.Item {...rest} ref={ref}>
        {/* @ts-ignore - Chakra UI v3 headless Steps */}
        <ChakraSteps.ItemContext>
          {({ current, completed }: StepsItemState) => (
            <>
              {/* @ts-ignore - Chakra UI v3 headless Steps */}
              <ChakraSteps.Trigger
                css={{
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2',
                  textAlign: 'center',
                }}
              >
                {/* @ts-ignore - Chakra UI v3 headless Steps — dot sem número/ícone,
                    fiel ao círculo vazio/contorno/preenchido do `Stepper.tsx` */}
                <ChakraSteps.Indicator
                  css={{
                    // Círculo SEMPRE outline (sem número/preenchimento), fiel ao
                    // "Ajustes Globais": select/atual e completo mostram contorno
                    // verde; pendente mostra contorno neutro.
                    boxSize: indicatorSize ?? (current ? '4' : '3'),
                    ...(indicatorSize ? { fontSize: 'xs', fontWeight: 'bold', flexShrink: 0 } : {}),
                    borderRadius: 'full',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    bg: 'bg.surface',
                    borderColor: completed || current ? 'colorPalette.solid' : 'border.default',
                    transition:
                      'background 0.2s ease, border-color 0.2s ease, width 0.2s ease, height 0.2s ease',
                  }}
                />
                {title && (
                  // @ts-ignore - Chakra UI v3 headless Steps
                  <ChakraSteps.Title
                    css={{
                      fontSize: 'xs',
                      whiteSpace: 'nowrap',
                      // bold-verde quando select/atual; regular quando completo/pendente.
                      fontWeight: current ? 'bold' : 'normal',
                      color: completed || current ? 'colorPalette.solid' : 'fg.muted',
                    }}
                  >
                    {title}
                    {description && (
                      // @ts-ignore - Chakra UI v3 headless Steps
                      <ChakraSteps.Description>{description}</ChakraSteps.Description>
                    )}
                  </ChakraSteps.Title>
                )}
              </ChakraSteps.Trigger>
              {/* @ts-ignore - Chakra UI v3 headless Steps — linha de progresso */}
              <ChakraSteps.Separator
                css={{
                  height: '2px',
                  bg: completed ? 'colorPalette.solid' : 'border.default',
                  transition: 'background 0.2s ease',
                }}
              />
            </>
          )}
        </ChakraSteps.ItemContext>
      </ChakraSteps.Item>
    );
  }
);

export const StepsList = ChakraSteps.List;

/**
 * `colorPalette="green"` default — rampa brand do `cerne` neste projeto
 * (`src/styles/theme/color-tokens.ts`). Consumidores podem sobrescrever
 * passando a prop explicitamente (nenhum dos 2 consumidores atuais passa).
 */
export const StepsRoot = React.forwardRef<HTMLDivElement, ChakraSteps.RootProps>(
  function StepsRoot(props, ref) {
    // @ts-ignore - Chakra UI v3 headless Steps
    return <ChakraSteps.Root colorPalette="green" {...props} ref={ref} />;
  }
);

export const StepsContent = ChakraSteps.Content;
export const StepsCompletedContent = ChakraSteps.CompletedContent;
export const StepsNextTrigger = ChakraSteps.NextTrigger;
export const StepsPrevTrigger = ChakraSteps.PrevTrigger;

// Namespace completo — reexportado para consumidores que preferem
// `Steps.Root`/`Steps.List`/`Steps.Item` (mesma convenção usada aqui).
export const Steps = {
  Root: StepsRoot,
  List: StepsList,
  Item: StepsItem,
  Content: StepsContent,
  CompletedContent: StepsCompletedContent,
  NextTrigger: StepsNextTrigger,
  PrevTrigger: StepsPrevTrigger,
};
