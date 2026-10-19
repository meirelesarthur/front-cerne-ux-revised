// @vitest-environment jsdom
import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { system } from '@/theme';

import { Steps, StepsList, StepsRoot } from './steps';

afterEach(cleanup);

function renderSteps(indicatorSize?: string) {
  return render(
    <ChakraProvider value={system}>
      <StepsRoot step={1} count={2}>
        <StepsList>
          <Steps.Item index={0} title="Peso Total" indicatorSize={indicatorSize} />
          <Steps.Item index={1} title="Tara do Veículo" indicatorSize={indicatorSize} />
        </StepsList>
      </StepsRoot>
    </ChakraProvider>
  );
}

describe('Steps', () => {
  it('renderiza as 2 etapas com a atual marcada, com e sem indicatorSize', () => {
    for (const size of [undefined, '7']) {
      const { container, unmount } = renderSteps(size);
      expect(screen.getByText('Peso Total')).toBeTruthy();
      expect(screen.getByText('Tara do Veículo')).toBeTruthy();
      expect(container.querySelectorAll('[data-part=item]').length).toBe(2);
      expect(container.querySelectorAll('[data-part=item][aria-current=step]').length).toBe(1);
      unmount();
    }
  });
});
