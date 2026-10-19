import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createContext } from "use-context-selector";

import { withHasFarmsRaised } from '@/utils/noFarmGuard';

import type { LoginCredentials, User, UserProfile, UserProfileV2 } from "@/@types/auth";
import type { FarmContextSignal } from '@/@types/v2/permissions';

import * as authService from "@/services/v2/Auth/auth-service";
import * as twoFactorService from "@/services/v2/Auth/two-factor-service";
import { queryClient } from "@/services/query-client";
import { IS_TOKEN_AUTH } from "@/config/env";

import { Loading } from "./components/Loading";
import { mapUser } from "./mapUser";
import { isTwoFactorRequired } from "@/utils/two-factor";

interface AuthProviderProps {
  children: ReactNode;
}

// `mapUser` foi extraído para `./mapUser.ts` (Execução 071, TASK-071-FE-02,
// FE02-T01) para ser testável isoladamente — reexportado abaixo por
// compatibilidade com quem já o importa deste módulo.
export { mapUser };

// Estado do 2FA pendente
interface TwoFactorPendingState {
  tempToken: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  /**
   * `true` enquanto o boot inicial (`verifySession()`) ou qualquer operação
   * de auth (`signIn`/`signOut`/`verifyTwoFactor*`) ainda está resolvendo.
   * ERRO-FE-012: consumido por `PrivateRoute` para distinguir "ainda não sei
   * se está autenticado" de "sei que não está" — nunca decidir um redirect
   * enquanto `loading===true`.
   */
  loading: boolean;
  error: string;
  user: User | null;
  profile: UserProfileV2 | null;
  /** Permissões Spatie do usuário — array plano `recurso_acao` vindo do /auth/me. */
  permissions: string[];
  /**
   * Papéis Spatie do usuário (ex.: "Gestor_Plataf") — array plano de nomes
   * vindo do /auth/me (`getRoleNames()`). DEC-005/GAP-BE-032: exceção
   * deliberada e pontual à convenção 100%-permissão do resto da base — só
   * consumida via `usePermissions().hasRole()`, e só onde a própria regra de
   * negócio é modelada por papel no backend (não generalizar).
   */
  roles: string[];
  /**
   * Rotas favoritas do usuário (GAP-BE-023) — strings cruas vindas do /auth/me.
   * Podem conter rotas legadas do Blade (ex.: "expenses.index") que a SPA não
   * conhece: elas são PRESERVADAS nas escritas e simplesmente não renderizam.
   */
  favorites: string[];
  /**
   * Fazenda ativa (uuid) — mesma fonte que o header `X-Farm-Id` do axios
   * (services/api.ts), espelhada em estado reativo (GAP-BE-033/B1). `null`
   * quando o usuário não tem fazenda (admin/contratante novo) — NÃO existe
   * seletor de troca de fazenda na SPA hoje (deferido, ver diagnóstico Item 3).
   */
  activeFarmUuid: string | null;
  /**
   * Subconjunto de `permissions` que exige fazenda ativa (`is_farm=true` em
   * algum ancestral de `App\Support\PermissionTree`) — GAP-BE-033. Consumido
   * exclusivamente via `usePermissions().isFarmScoped()`.
   */
  farmScopedPermissions: string[];
  /**
   * Troca a fazenda ativa (TASK-FE-920, AJUSTE 3 — seletor de fazenda do
   * header): grava `localStorage['app-active-farm']` (mesma fonte lida pelo
   * interceptor Axios em `services/api.ts`, header `X-Farm-Id`) e propaga em
   * estado React (`activeFarmUuid`). NÃO chama o backend nem invalida cache —
   * quem orquestra a sequência completa (POST /me/farms/{uuid}/select →
   * setActiveFarm → invalidateQueries) é o consumidor (`FarmSwitcher`,
   * TASK-FE-921/DEC-020). Antes desta Tarefa só existia o setter PRIVADO
   * `setActiveFarmUuid` (useState interno), não exposto no Context.
   */
  setActiveFarm: (uuid: string) => void;
  /**
   * TASK-072-FE-11 — sinal `farm_context` do `/auth/me` (derivado de
   * `profile`, sem request novo). `null` quando o back não envia (fail-open
   * do guard "contratante sem fazenda").
   */
  farmContext: FarmContextSignal | null;
  /**
   * TASK-072-FE-11 — setter OTIMISTA chamado após criar a 1ª fazenda
   * (FE-09): sobe `farm_context.has_farms` para `true` (nunca para `false`)
   * até o `refreshProfile()` trazer o valor real. Libera o guard sem novo login.
   */
  markHasFarms: () => void;
  /** Alterna um favorito (path da SPA) — otimista, com rollback em erro. */
  toggleFavorite: (route: string) => Promise<void>;
  twoFactorPending: TwoFactorPendingState | null;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
  // 2FA Methods
  verifyTwoFactor: (code: string) => Promise<void>;
  verifyTwoFactorBackup: (backupCode: string) => Promise<void>;
  cancelTwoFactor: () => void;
  /**
   * Quando true, suprime o overlay genérico de loading (`<Loading/>`) mesmo com
   * `loading===true` — usado pela splash screen oficial do pós-login (Login/
   * index.tsx), que já cobre a tela inteira com a própria animação e não quer
   * ser substituída pelo spinner genérico durante o `signIn()`.
   */
  setSuppressLoadingOverlay: (suppress: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  error: '',
  user: null,
  profile: null,
  permissions: [],
  roles: [],
  favorites: [],
  activeFarmUuid: null,
  farmScopedPermissions: [],
  setActiveFarm: () => {},
  farmContext: null,
  markHasFarms: () => {},
  toggleFavorite: async () => {},
  twoFactorPending: null,
  signIn: async () => {},
  signOut: async () => {},
  clearError: () => {},
  refreshProfile: async () => {},
  verifyTwoFactor: async () => {},
  verifyTwoFactorBackup: async () => {},
  cancelTwoFactor: () => {},
  setSuppressLoadingOverlay: () => {},
});

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileV2 | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeFarmUuid, setActiveFarmUuid] = useState<string | null>(() =>
    localStorage.getItem('app-active-farm')
  );
  const [farmScopedPermissions, setFarmScopedPermissions] = useState<string[]>([]);

  /**
   * TASK-FE-920 (AJUSTE 3) — expõe publicamente a troca de fazenda ativa.
   * Mesma fonte de verdade de sempre (`localStorage['app-active-farm']`,
   * lida pelo interceptor Axios) + espelho em estado React, igual ao que
   * `signIn()`/`completeTwoFactorLogin()`/`saveProfile()` já fazem — só que
   * chamável de fora do login (pelo `FarmSwitcher`, TASK-FE-921).
   */
  const setActiveFarm = useCallback((uuid: string) => {
    localStorage.setItem('app-active-farm', uuid);
    setActiveFarmUuid(uuid);
  }, []);

  /**
   * TASK-072-FE-11 — liberação imediata do guard ao criar a 1ª fazenda. Atua
   * só no estado React (`profile`); o `localStorage['app-user-profile']` é
   * regravado pelo `refreshProfile()` seguinte com o valor do servidor.
   */
  const markHasFarms = useCallback(() => {
    setProfile((current) => withHasFarmsRaised(current));
  }, []);
  const farmContext = profile?.farm_context ?? null;

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [suppressLoadingOverlay, setSuppressLoadingOverlay] = useState(false);
  const [twoFactorPending, setTwoFactorPending] = useState<TwoFactorPendingState | null>(null);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  /**
   * Salva o perfil completo e dispara evento de atualização
   */
  const saveProfile = useCallback((profileData: UserProfileV2) => {
    setProfile(profileData);

    // Salvar no localStorage para persistência
    localStorage.setItem('app-user-profile', JSON.stringify(profileData));

    // Permissões do GB Cerne (Spatie): array plano de strings em `permissions`.
    // Fallback para o formato antigo (tier.permissions) mantém compatibilidade.
    const perms: string[] =
      (profileData as any).permissions ?? profileData.tier?.permissions ?? [];
    setPermissions(perms);

    // Papéis Spatie (DEC-005/GAP-BE-032): mesmo tratamento de `permissions`
    // acima. O backend (`MeResource::toArray()`) envia via `getRoleNames()`,
    // que já serializa como `string[]` — a normalização por item abaixo é
    // defesa contra um formato `{ name: string }` (objeto Spatie completo),
    // caso o contrato mude no futuro.
    const rolesList: string[] = ((profileData as any).roles ?? [])
      .map((r: any) => (typeof r === 'string' ? r : r?.name))
      .filter(Boolean);
    setRoles(rolesList);

    // Favoritos (GAP-BE-023): rotas cruas por usuário, junto das permissões.
    setFavorites((profileData as any).favorites ?? []);

    // GAP-BE-033: subconjunto farm-scoped das permissões do usuário — consumido
    // por usePermissions().isFarmScoped()/useMenuModules() para esconder itens
    // de menu que exigem fazenda ativa. Campo declarado (opcional) em
    // UserProfileV2 — ver src/@types/v2/permissions.d.ts — por isso lido
    // type-safe, sem `as any` (diferente de permissions/roles/favorites acima).
    setFarmScopedPermissions(profileData.farm_scoped_permissions ?? []);

    // Espelha o localStorage já escrito por signIn()/completeTwoFactorLogin()
    // em estado React — nenhum dado novo, só reatividade (seletor de fazenda:
    // DEFERIDO, ver diagnóstico Item 3).
    setActiveFarmUuid(localStorage.getItem('app-active-farm'));

    // Disparar evento para notificar outros componentes (PermissionStore, etc.)
    window.dispatchEvent(new CustomEvent('permissions-updated', {
      detail: { profile: profileData },
    }));

    console.log('✅ [AuthContext] Perfil salvo:', {
      user: (profileData as any).name ?? profileData.username,
      roles: rolesList.length,
      permissions: perms.length,
    });
  }, []);

  /**
   * Verifica sessão ao carregar o app.
   * O interceptor do axios trata 401 automaticamente, tentando refresh
   * via Token Manager antes de propagar o erro.
   */
  async function verifySession() {
    try {
      setLoading(true);

      // Modo token: sem token salvo não há sessão a restaurar. Evita um /auth/me
      // que retornaria 401 no boot (estado deslogado, esperado).
      if (IS_TOKEN_AUTH && !authService.getAccessToken()) {
        return;
      }

      // Perguntamos ao backend quem está autenticado (GET /auth/me). No modo
      // cookie, o cookie de sessão autentica a chamada; no modo token, o
      // interceptor anexa o Bearer. Sem credencial válida, o backend responde
      // 401 e caímos no catch (estado deslogado, comportamento esperado).
      const response = await authService.getUserProfile();

      if (response.data.success) {
        const profileData = response.data.data as unknown as UserProfileV2;
        setUser(mapUser(profileData));
        saveProfile(profileData);
      } else {
        authService.clearAuthStorage();
        setActiveFarmUuid(null);
      }
    } catch (err: any) {
      // 401 sem sessão é esperado no boot — não poluir como erro de aplicação.
      authService.clearAuthStorage();
      setActiveFarmUuid(null);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Atualiza o perfil do usuário (para recarregar permissões)
   */
  const refreshProfile = useCallback(async () => {
    try {
      const response = await authService.getUserProfile();

      if (response.data.success) {
        const profileData = response.data.data as UserProfileV2;
        // Mesmo padrão de `verifySession`/`signIn`/`completeTwoFactorLogin`
        // acima: sem `setUser`+`authService.saveUser`, o `user` do Context
        // (consumido por AccountSummaryCard/AccountMenu para nome e foto)
        // ficava obsoleto após um `refreshProfile()` — só `profile`
        // (via `saveProfile`) era atualizado.
        setUser(mapUser(profileData));
        authService.saveUser(mapUser(profileData));
        saveProfile(profileData);
      }
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
    }
  }, [saveProfile]);

  useEffect(() => {
    verifySession();
  }, []);

  /**
   * Alterna um favorito (otimista): atualiza o estado já, envia o CONJUNTO
   * COMPLETO via PUT /me/favorites (replace-set — GAP-BE-023) e faz rollback
   * se a API falhar. Rotas legadas desconhecidas permanecem no conjunto.
   */
  const toggleFavorite = useCallback(async (route: string) => {
    let previous: string[] = [];
    let next: string[] = [];

    setFavorites((current) => {
      previous = current;
      next = current.includes(route)
        ? current.filter((r) => r !== route)
        : [...current, route];
      return next;
    });

    try {
      const response = await authService.updateFavorites(next);
      if (response.data.success) {
        setFavorites(response.data.data.favorites ?? next);
      }
    } catch (err) {
      console.warn("Não foi possível salvar favorito — revertendo:", err);
      setFavorites(previous);
    }
  }, []);

  /**
   * Sincronização de permissões/favoritos em (quase) tempo real — fase 2 do
   * plano de permissionamento. Sem sessão de websocket: revalida o perfil
   * (GET /auth/me) a cada 15 min e ao focar a janela (throttle de 5 min).
   * Mudança de role feita por um admin passa a valer sem novo login; um 401
   * aqui cai no interceptor global (desloga). Substitui o antigo
   * useSessionValidator (removido — checava token Bearer que não existe mais).
   */
  const lastProfileRefreshRef = useRef(Date.now());
  useEffect(() => {
    if (!user) return;

    const doRefresh = () => {
      lastProfileRefreshRef.current = Date.now();
      refreshProfile();
    };

    const interval = setInterval(doRefresh, 15 * 60 * 1000);
    const onFocus = () => {
      if (Date.now() - lastProfileRefreshRef.current > 5 * 60 * 1000) {
        doRefresh();
      }
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, refreshProfile]);

  /**
   * Realiza login.
   *
   * ERRO-FE-005 (causa-raiz CONFIRMADA): esta função NÃO chama mais
   * `navigate('/home')` de forma imperativa. A transição pra Home é 100%
   * dirigida pelo estado — `PublicRoute` (src/components/PublicRoute.tsx),
   * continuamente montado em `/login`, já redireciona reativamente assim
   * que `isAuthenticated` propagar. O `navigate()` imperativo competia com
   * a propagação de `setUser(...)` via `use-context-selector` (que só
   * atualiza sua ref interna dentro de um `useLayoutEffect` do Provider,
   * DEPOIS do commit) — `PrivateRoute` podia montar e ler
   * `isAuthenticated=false` (stale) ANTES dessa propagação, causando o
   * bounce intermitente relatado. Ver "ATUALIZAÇÃO 2" no ERRO-FE-005.
   */
  const signIn = useCallback(async (credentials: LoginCredentials) => {
    try {
      setError("");
      setLoading(true);

      const response = await authService.login(credentials);

      if (!response.data.success) {
        throw new Error('Credenciais inválidas');
      }

      const loginData = response.data.data as any;

      // Verificar se 2FA é necessário
      if (isTwoFactorRequired(loginData)) {
        // 2FA necessário - salvar estado pendente e navegar para verificação
        setTwoFactorPending({
          tempToken: loginData.temp_token,
          email: credentials.email,
        });
        setLoading(false);
        navigate('/login/two-factor', { replace: true });
        return;
      }

      // Modo token: o backend devolve o Bearer token no corpo do login.
      // Persistir ANTES de qualquer chamada autenticada (o interceptor de
      // request lê o token do localStorage). No modo cookie a sessão já está
      // ativa (cookie HttpOnly) e loginData.token é null — nada a guardar.
      if (IS_TOKEN_AUTH && loginData?.token) {
        authService.saveAccessToken(loginData.token);
      }

      // Persistimos a fazenda ativa para o header X-Farm-Id das próximas
      // requisições tenant-scoped. Usuário SEM fazenda (admin de plataforma,
      // contratante novo) é um estado VÁLIDO — mas precisamos limpar qualquer
      // fazenda de uma sessão/usuário ANTERIOR no mesmo navegador, senão ela
      // vaza como X-Farm-Id para este login (que não é dono daquela fazenda).
      if (loginData?.active_farm_uuid) {
        localStorage.setItem('app-active-farm', loginData.active_farm_uuid);
      } else {
        localStorage.removeItem('app-active-farm');
      }

      // Flag LOCAL e síncrona — não confiar em `user` (estado React, batched)
      // para decidir se lança um erro visível. NÃO condiciona mais navegação
      // nenhuma: não há `navigate()` nesta função para condicionar (ver
      // comentário abaixo, após o `if (!profileLoaded)`).
      let profileLoaded = false;

      try {
        const profileResponse = await authService.getUserProfile();
        if (profileResponse.data.success) {
          const profileData = profileResponse.data.data as unknown as UserProfileV2;
          setUser(mapUser(profileData));
          authService.saveUser(mapUser(profileData));
          saveProfile(profileData);
          profileLoaded = true;
        }
        // Sem `else`: profileLoaded continua false e cai no fallback abaixo.
      } catch (profileErr) {
        console.warn('Não foi possível buscar perfil após login:', profileErr);
      }

      // Fallback: usa os dados básicos do próprio login.
      if (!profileLoaded && loginData?.user) {
        setUser(mapUser(loginData.user));
        authService.saveUser(mapUser(loginData.user));
        profileLoaded = true;
      }

      if (!profileLoaded) {
        throw new Error('Login efetuado, mas não foi possível carregar seu perfil. Tente novamente.');
      }

      // SEM navigate('/home') aqui — CAUSA-RAIZ CONFIRMADA (ver docstring
      // acima): a transição pra Home é 100% responsabilidade do
      // `PublicRoute`, reativo, que já observa `isAuthenticated`.
    } catch (err: any) {
      console.error('Erro ao fazer login:', err);

      const errorMessage = err?.response?.data?.error?.message ||
                          err?.message ||
                          'Erro ao fazer login. Tente novamente.';
      setError(errorMessage);

      throw err; // Relança — reativa o catch já existente de Login/index.tsx.
    } finally {
      setLoading(false);
    }
  }, [navigate, saveProfile]);

  /**
   * Limpa sessão/estado local e redireciona para /login. Extraído de
   * `signOut()` (ERRO-FE-005, item 3) para ser compartilhado com o listener
   * do evento global `auth-logout` (services/api.ts:125, disparado em
   * qualquer 401 fora de `/auth/login`) — antes desta correção, o evento era
   * disparado sem nenhum ouvinte em toda a base (confirmado por grep
   * exaustivo), deixando a UI "logada" com dado obsoleto após um 401 global.
   */
  const forceLogout = useCallback(() => {
    // Limpar storage
    authService.clearAuthStorage();
    sessionStorage.removeItem('trial-expiring-dialog-shown');

    // Limpar cache do React Query (billing, trial, etc.)
    queryClient.clear();

    // Limpar estado
    setUser(null);
    setProfile(null);
    setPermissions([]);
    setRoles([]);
    setFavorites([]);
    setActiveFarmUuid(null);
    setFarmScopedPermissions([]);
    setError("");
    setLoading(false);

    // Redirecionar para login
    navigate('/login', { replace: true });
  }, [navigate]);

  /**
   * Realiza logout
   */
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    } finally {
      forceLogout();
    }
  }, [forceLogout]);

  // Reage ao 401 global (services/api.ts:125). Não rechama authService.logout()
  // (a sessão já está inválida no backend — chamar de novo só geraria outro
  // 401 em loop); só limpa o estado local e redireciona (ERRO-FE-005, item 3).
  useEffect(() => {
    const onAuthLogout = () => forceLogout();
    window.addEventListener('auth-logout', onAuthLogout);
    return () => window.removeEventListener('auth-logout', onAuthLogout);
  }, [forceLogout]);

  /**
   * Limpa mensagem de erro
   */
  const clearError = useCallback(() => {
    setError("");
  }, []);

  /**
   * Completa autenticação após verificação 2FA bem-sucedida
   */
  const completeTwoFactorLogin = useCallback(async (loginData: any) => {
    // Nota: o backend GB Cerne não aciona 2FA hoje (login direto). Este caminho
    // fica preparado caso o 2FA volte. No modo token, persistir o Bearer antes
    // de buscar o perfil; no modo cookie a sessão já está ativa.
    if (IS_TOKEN_AUTH && loginData?.token) {
      authService.saveAccessToken(loginData.token);
    }

    if (loginData?.active_farm_uuid) {
      localStorage.setItem('app-active-farm', loginData.active_farm_uuid);
    }

    // Buscar perfil completo (roles + permissions)
    try {
      const profileResponse = await authService.getUserProfile();
      if (profileResponse.data.success) {
        const profileData = profileResponse.data.data as unknown as UserProfileV2;
        setUser(mapUser(profileData));
        authService.saveUser(mapUser(profileData));
        saveProfile(profileData);
      }
    } catch (profileErr) {
      console.warn('Não foi possível buscar perfil após 2FA:', profileErr);
      if (loginData?.user) {
        setUser(mapUser(loginData.user));
        authService.saveUser(mapUser(loginData.user));
      }
    }

    // Limpar estado de 2FA pendente
    setTwoFactorPending(null);

    // SEM navigate('/home') aqui — ERRO-FE-005, item 1b: mesmo padrão de
    // `signIn()` (path dormente, backend não aciona 2FA hoje, mas correção
    // gratuita para não reabrir este Erro se o 2FA for reativado). A rota
    // `/login/two-factor` também está dentro do grupo envolto por
    // `PublicRoute`, que redireciona reativamente para /home assim que
    // `isAuthenticated` propagar — sem competir com navegação imperativa.
  }, [saveProfile]);

  /**
   * Verifica código TOTP do 2FA
   */
  const verifyTwoFactor = useCallback(async (code: string) => {
    if (!twoFactorPending) {
      setError('Sessão de verificação expirada. Faça login novamente.');
      navigate('/login', { replace: true });
      return;
    }

    try {
      setError("");
      setLoading(true);

      const response = await twoFactorService.verifyTwoFactorCode({
        temp_token: twoFactorPending.tempToken,
        code,
      });

      if (response.data.success) {
        await completeTwoFactorLogin(response.data.data);
      } else {
        setError('Código inválido. Tente novamente.');
      }
    } catch (err: any) {
      console.error('Erro ao verificar 2FA:', err);

      const errorMessage = err?.response?.data?.error?.message ||
                          'Código inválido ou expirado. Tente novamente.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [twoFactorPending, completeTwoFactorLogin, navigate]);

  /**
   * Verifica código de backup do 2FA
   */
  const verifyTwoFactorBackup = useCallback(async (backupCode: string) => {
    if (!twoFactorPending) {
      setError('Sessão de verificação expirada. Faça login novamente.');
      navigate('/login', { replace: true });
      return;
    }

    try {
      setError("");
      setLoading(true);

      const response = await twoFactorService.verifyTwoFactorBackupCode({
        temp_token: twoFactorPending.tempToken,
        backup_code: backupCode,
      });

      if (response.data.success) {
        await completeTwoFactorLogin(response.data.data);
      } else {
        setError('Código de backup inválido ou já utilizado.');
      }
    } catch (err: any) {
      console.error('Erro ao verificar código de backup:', err);

      const errorMessage = err?.response?.data?.error?.message ||
                          'Código de backup inválido ou já utilizado.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [twoFactorPending, completeTwoFactorLogin, navigate]);

  /**
   * Cancela verificação 2FA e volta ao login
   */
  const cancelTwoFactor = useCallback(() => {
    setTwoFactorPending(null);
    setError("");
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        permissions,
        roles,
        favorites,
        activeFarmUuid,
        farmScopedPermissions,
        setActiveFarm,
        farmContext,
        markHasFarms,
        toggleFavorite,
        error,
        isAuthenticated,
        loading,
        twoFactorPending,
        signIn,
        signOut,
        clearError,
        refreshProfile,
        verifyTwoFactor,
        verifyTwoFactorBackup,
        cancelTwoFactor,
        setSuppressLoadingOverlay,
      }}
    >
      {/*
        ERRO-FE-012: `<Loading/>` (já `position:fixed`, cobre a viewport
        inteira — ver Loading.tsx) é renderizado como IRMÃ de `{children}`,
        nunca mais como substituta. Antes, o early-return acima trocava
        `{children}` inteiro por `<Loading/>`, desmontando toda a
        `<AppRoutes>` (e todo estado local sob ela, ex.: Login/index.tsx)
        a cada ciclo `loading: true→false` sem `suppressLoadingOverlay` —
        mesma classe de fragilidade já documentada em GlobalSplash.tsx:1-9
        para a splash oficial, um nível mais para dentro. Visualmente
        idêntico para o usuário (mesmo overlay, mesmo timing); o que muda é
        que `{children}` nunca mais é destruído por causa de `loading`.
      */}
      {loading && !suppressLoadingOverlay && <Loading />}
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext, AuthProvider };
