import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import type { ProviderFormModalSavedPayload } from './ProviderFormModal';

// D5 (UT-000773, R3) — helper ÚNICO para os pontos em que o `ProviderFormModal`
// ao lado do campo Fornecedor auto-seleciona o fornecedor recém-salvo.
// Fornecedor salvo com Ativo=Não NÃO é auto-selecionado (a API não o lista
// mais nos selects): exibe toast informativo e devolve `false`. Quando
// `isEnabled` não vier no payload (undefined), segue o comportamento antigo.
export function useApplySavedProvider() {
  const { languageGB } = useLanguage();

  return function applySavedProvider(
    provider: ProviderFormModalSavedPayload,
    select: () => void
  ): boolean {
    if (provider.isEnabled === false) {
      toaster.create({
        type: 'info',
        description: languageGB.providers.provider.form.savedInactiveNotSelected,
        duration: 8000,
      });
      return false;
    }
    select();
    return true;
  };
}
