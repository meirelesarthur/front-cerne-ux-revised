/**
 * Mock Configuration
 *
 * Configuração central para habilitar/desabilitar modo mock.
 *
 * Durante desenvolvimento: USE_MOCK = true
 * Em produção com API real: USE_MOCK = false
 *
 * Pode ser controlado por variável de ambiente:
 * VITE_USE_MOCK_API=true (desenvolvimento)
 * VITE_USE_MOCK_API=false (produção)
 */

export const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false';

/**
 * Delay de resposta do mock (milissegundos)
 * Simula latência de rede real
 */
export const MOCK_DELAY = {
  MIN: 100,
  MAX: 500,
};

/**
 * Configurações de paginação padrão
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 25,
  LIMIT_OPTIONS: [10, 25, 50, 100],
};

/**
 * Log de debug para modo mock
 */
if (USE_MOCK) {
  console.log(
    '%c🔧 MOCK MODE ENABLED',
    'background: #FFA500; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
  );
  console.log('API calls will use mock data instead of real endpoints.');
  console.log('To disable: set VITE_USE_MOCK_API=false in .env');
}
