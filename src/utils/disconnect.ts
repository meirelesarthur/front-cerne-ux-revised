import { clearAuth } from './auth-token';

export default function disconnect() {
  setTimeout(() => {
    clearAuth();
    window.location.reload();
  }, 500);
}
