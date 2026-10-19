// -----------------------------------------------------------------------------
// DEV AUTH BYPASS — SOMENTE para trabalho de UX local, sem backend.
//
// Ativação: `VITE_DEV_AUTH_BYPASS=true` no `.env` E build de desenvolvimento
// (`import.meta.env.DEV`). Em `vite build` o `DEV` é `false` e todo este módulo
// é eliminado por tree-shaking — não existe caminho para produção/homologação.
//
// Efeito: login/me/logout (auth-service.ts) respondem localmente, com um usuário
// fictício, TODAS as permissões do catálogo e uma fazenda ativa fictícia.
// Chamadas a outros endpoints continuam indo à API real (e falham sem backend):
// telas que dependem de dados ficam em estado de erro/vazio.
//
// A tela de login continua visível: a "sessão" só existe após o submit do login
// (flag em localStorage) e some no logout.
// -----------------------------------------------------------------------------

import permissionsCatalog from '@/config/v2/permissionsCatalog.json';

export const DEV_AUTH_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';

const SESSION_KEY = 'dev-auth-bypass-session';
const DEV_FARM_UUID = '00000000-0000-4000-8000-000000000001';

const devUser = {
  uuid: '00000000-0000-4000-8000-0000000000aa',
  user_id: 0,
  name: 'Usuário UX (dev)',
  username: 'Usuário UX (dev)',
  email: 'ux.dev@local.test',
  photo: null,
  photo_url: null,
  lang: 'pt-BR',
  roles: ['Gestor_Plataf'],
  permissions: permissionsCatalog as string[],
  farm_scoped_permissions: [] as string[],
};

const ok = <T,>(data: T) => ({ data: { success: true, message: 'dev-bypass', data, errors: null, meta: null } });

export const devHasSession = () => localStorage.getItem(SESSION_KEY) === '1';

export function devLogin() {
  localStorage.setItem(SESSION_KEY, '1');
  return ok({
    user: { uuid: devUser.uuid, name: devUser.name, email: devUser.email },
    farms: [{ uuid: DEV_FARM_UUID, name: 'Fazenda UX (dev)' }],
    active_farm_uuid: DEV_FARM_UUID,
    token: 'dev-bypass-token',
  });
}

export function devProfile() {
  if (!devHasSession()) {
    // Mesmo contrato de "sem sessão": o AuthContext trata como deslogado.
    return Promise.reject(Object.assign(new Error('Unauthenticated (dev-bypass)'), { response: { status: 401 } }));
  }
  localStorage.setItem('app-active-farm', DEV_FARM_UUID);
  return Promise.resolve(ok(devUser));
}

export function devLogout() {
  localStorage.removeItem(SESSION_KEY);
}
