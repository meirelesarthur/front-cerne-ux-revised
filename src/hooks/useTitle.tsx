import { useContextSelector } from 'use-context-selector';

import { TitleContext } from '@/contexts/TitleContext';

export function useTitle() {
  const titleGB = useContextSelector(
    TitleContext,
    (titleGB) => titleGB.titleGB,
  );
  const updateTitleGB = useContextSelector(
    TitleContext,
    (titleGB) => titleGB.updateTitleGB,
  );
  return {
    titleGB,
    updateTitleGB,
  };
}
