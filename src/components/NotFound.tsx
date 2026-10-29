import { ErrorStatus } from '@/pages/Errors';

// 404 do sistema: usa a tela de erro do design (ver pages/Errors).
export function NotFound() {
  return <ErrorStatus code={404} />;
}

export default NotFound;
