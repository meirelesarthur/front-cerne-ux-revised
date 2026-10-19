// src/pages/CadastrosBase/Autorizadores/VisualizarAutorizador.tsx
// -----------------------------------------------------------------------------
// Tela VISUALIZAR de Autorizador (legado `request_authorizers/show`), rota
// `/cadastros-base/autorizadores/:authorizerId/visualizar`, guardada só por
// `request-authorizers_view` (PAR-03): usuário sem permissão de editar abre a
// consulta, com campos desabilitados e sem botão Salvar. Reaproveita o
// formulário em modo leitura (`mode="view"`).
// -----------------------------------------------------------------------------

import CreateOrUpdateAutorizador from './CreateOrUpdateAutorizador';

export default function VisualizarAutorizador() {
  return <CreateOrUpdateAutorizador mode="view" />;
}
