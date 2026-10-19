import { useContextSelector } from "use-context-selector";

import { LoadContext } from "@/contexts/LoadContext";

export function useLoad() {
  const toggleLoading = useContextSelector(
    LoadContext,
    (load) => load.toggleLoading
  );
  const isLoading = useContextSelector(LoadContext, (load) => load.isLoading);

  return {
    toggleLoading,
    isLoading,
  };
}
