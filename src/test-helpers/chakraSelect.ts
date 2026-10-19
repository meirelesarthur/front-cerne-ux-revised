// Helper de teste: escolhe uma opcao no `Select` (Chakra v3/zag) pela UI, como o usuario faria
// (abre o trigger e clica na opcao), em vez de setar o valor direto no form.
import { fireEvent, screen } from '@testing-library/react';

export async function chooseSelectOption(
  fieldLabel: string,
  optionName: RegExp | string,
  scope: ParentNode = document.body
) {
  // jsdom nao implementa `scrollTo` (zag rola o conteudo ao selecionar).
  if (!HTMLElement.prototype.scrollTo) HTMLElement.prototype.scrollTo = () => undefined;
  const labelNode = Array.from(scope.querySelectorAll('label')).find((node) =>
    (node.textContent ?? '').startsWith(fieldLabel)
  );
  const field = labelNode?.closest('[data-scope="field"]');
  const trigger = field?.querySelector('[data-part="trigger"]');
  if (!trigger) throw new Error(`Select "${fieldLabel}" nao encontrado`);
  fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse' });
  fireEvent.click(trigger);
  const option = await screen.findByRole('option', { name: optionName });
  fireEvent.pointerDown(option, { button: 0, pointerType: 'mouse' });
  fireEvent.pointerUp(option, { button: 0, pointerType: 'mouse' });
  fireEvent.click(option);
}
