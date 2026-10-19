import { useEffect, useRef } from "react";
import { useLoad } from "./useLoad";

export const useMultiQueryOrMutationLoading = (mutationsOrQueries: any[]) => {
  const { toggleLoading } = useLoad();
  const loadingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Limpa o timeout anterior se houver
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Verifica se alguma query/mutation está carregando
    const anyLoading = mutationsOrQueries.some(
      (m) => m.isLoading || m.isPending
    );

    // Se há algum carregamento, atualiza imediatamente para true
    if (anyLoading) {
      loadingRef.current = true;
      toggleLoading(true);
    } else {
      // Se não há carregamento, espera um pequeno delay antes de desativar
      // Isso evita flickering quando há requisições encadeadas
      timeoutRef.current = setTimeout(() => {
        if (loadingRef.current) {
          loadingRef.current = false;
          toggleLoading(false);
        }
      }, 100); // Ajuste este delay conforme necessário
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [mutationsOrQueries]);

  // Retorna se está carregando (opcional, se você ainda precisa desse valor)
  return mutationsOrQueries.some((m) => m.isLoading || m.isPending);
};
