# Usuários

- **Rotas:** `/cadastros-base/usuarios` (lista) · `/cadastros-base/usuarios/novo` · `/cadastros-base/usuarios/:uuid`
- **Código:** `src/pages/CadastrosBase/Usuarios/`
- **Referência no DS:** `cerne/src/pages/cadastros/usuarios/UsuarioCadastro.tsx` (página única com `FormSection` *Identificação* e *Acesso*)
- **Status:** seções alinhadas ao DS · **Atualizado:** 2026-10-28

## Registro de edições
### UX-usuarios-001 · Seções do DS — 2026-10-28
| Antes | Agora |
|---|---|
| Títulos soltos ("Pessoa", "Conta", "Vínculos") separados por linhas | **`FormSection`**: *Identificação* (CPF/CNPJ, nome, e-mail, telefone, cidade, endereço) · *Conta* (senha e confirmação, ativo, conferente de compras, foto) · *Acesso* (perfis, fazendas, encarregados) com apoio "Perfis e escopos concedidos ao usuário." |
| Interruptores com rótulo solto | `ToggleRow` do kit (mesmo visual dos demais formulários) |
- **Estrutura do DS adotada:** é uma página única (sem wizard) em duas seções; o front mantém a 3ª seção *Conta* porque tem campos que o DS não modela (senha, ativo, foto).
- Textos: `users.user.form.sectionPerson/sectionLinks` renomeados ("Identificação", "Acesso") e `sectionLinksHint` novo, em PT/EN/ES. O diálogo de visualização (`UserViewDialog`) usa as mesmas chaves e acompanha os novos títulos.
- **Preservado:** campos, validações, regras de senha só na criação, seletores de perfis/fazendas/encarregados, upload e remoção de foto.
- **Verificado:** `tsc` 0 erros; no navegador as três seções e o apoio aparecem, sem separadores soltos, os dois interruptores renderizam e Cancelar/Salvar seguem no rodapé. **Não verificado:** salvar, modo edição e o diálogo de visualização (a API local não tem usuários).
- **Validação com a API local (2026-10-28):** editar (nome alterado, lista atualizada), criar pela interface (CPF, e-mail, cidade "Sorriso — MT", perfil, fazenda, senha) e a busca inline (`search=bruno` → 1 de 1; limpar → 4) funcionam. A validação do front que exige ao menos uma fazenda bloqueou o salvar do usuário de exemplo até ele ganhar fazendas — comportamento esperado.
