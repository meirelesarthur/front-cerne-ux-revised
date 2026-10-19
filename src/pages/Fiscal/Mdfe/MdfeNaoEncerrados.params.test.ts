// @vitest-environment node
// Retomada 4 (E2E SEFAZ homologação): MDF-e cancelado aparecia em "Não encerrados" com o botão
// Encerrar. A lista passa a pedir só MDF-e autorizado e ainda não encerrado.
import { describe, expect, it } from 'vitest';

import { naoEncerradosListParams } from './MdfeNaoEncerrados';

describe('naoEncerradosListParams', () => {
  it('filtra por estado aprovado, não encerrado e pelo emissor escolhido', () => {
    expect(naoEncerradosListParams('emissor-uuid')).toEqual({
      page: 1,
      per_page: 100,
      estado: 'aprovado',
      encerrado: false,
      emissorId: 'emissor-uuid',
    });
  });
});
