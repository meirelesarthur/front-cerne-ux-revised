// Renderiza a splash screen oficial (pós-login) no nível mais alto do app —
// FORA do <AuthProvider>, de propósito: o AuthContext tem um early-return
// (`if (loading) return <Loading/>`) que substitui toda a árvore abaixo dele
// enquanto `signIn()` está em voo. Se a splash fosse filha do AuthProvider (ou
// do Login), ela seria engolida por esse early-return ou desmontada junto da
// troca de rota — revelando a tela de login por baixo antes da Home estar
// pronta. Aqui, como irmã do AuthProvider, ela cobre a tela (position:fixed,
// z-index 9999) pelo seu tempo fixo (~4.8s) sem depender do que acontece por
// baixo. Ver `src/stores/splashStore.ts` para o motivo completo.
import { useSplashStore } from "@/stores/splashStore";
import { SplashScreen } from "./SplashScreen";

export function GlobalSplash() {
  const visible = useSplashStore((s) => s.visible);
  const hide = useSplashStore((s) => s.hide);

  if (!visible) return null;

  return <SplashScreen onDone={hide} />;
}

export default GlobalSplash;
