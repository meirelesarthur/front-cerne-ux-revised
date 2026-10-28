// src/constants/languages/languagePtBr/languageUsers.ts
// Tradução PT-BR do módulo de USUÁRIOS (User — CRUD administrativo).

import { ModuleUsers } from '@/@types/language/module-users';

export const languageUsers: ModuleUsers = {
  user: {
    singularLabel: 'Usuário',
    pluralLabel: 'Usuários',
    list: {
      pageTitle: 'Usuários',
      pageSubtitle: 'Administre as contas de acesso ao sistema e seus vínculos.',
      table: {
        name: 'Nome',
        email: 'E-mail',
        role: 'Perfil',
        roleMore: '+{count}',
        status: 'Status',
        statusActive: 'Ativo',
        statusInactive: 'Inativo',
        lastActivity: 'Última atividade',
        photo: 'Foto',
      },
      actions: {
        edit: 'Editar',
        view: 'Visualizar',
      },
      emptyState: {
        titleEmpty: 'Nenhum usuário cadastrado.',
        descriptionEmpty: 'Comece adicionando o primeiro usuário.',
        titleFiltered: 'Nenhum usuário encontrado.',
        descriptionFiltered: 'Tente ajustar os filtros ou limpar a busca.',
        cta: 'Novo Usuário',
      },
      error: {
        message: 'Não foi possível carregar os usuários.',
        retry: 'Tentar novamente',
      },
    },
    filter: {
      title: 'Filtrar usuários',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nome, e-mail ou NIF',
      role: 'Perfil',
      roleAll: 'Todos',
      isActive: 'Status',
      isActiveAll: 'Todos',
      activeOptions: {
        active: 'Ativo',
        inactive: 'Inativo',
      },
      online: 'Online agora',
      onlineAll: 'Todos',
      onlineOptions: {
        online: 'Online',
        offline: 'Offline',
      },
      inactiveDays: 'Inatividade',
      inactiveDaysAll: 'Todos',
      // CORREÇÃO (lote 3b, Execução 027 — achado do lote 2): o legado nunca
      // mostra o número puro de dias, sempre "Mais de X" — fonte real:
      // agro365/resources/views/users/index.blade.php:59-72. Os VALORES
      // numéricos (1/7/15/30/90/180/365) continuam os mesmos, só o label.
      inactiveDaysOptions: {
        oneDay: 'Mais de 1 dia',
        oneWeek: 'Mais de 1 semana',
        oneFortnight: 'Mais de 1 quinzena',
        oneMonth: 'Mais de 1 mês',
        oneQuarter: 'Mais de 1 trimestre',
        oneSemester: 'Mais de 1 semestre',
        oneYear: 'Mais de 1 ano',
      },
      tenant: 'Tenant',
      tenantAll: 'Todos',
      plan: 'Plano',
      planAll: 'Todos',
      tenantStatus: 'Status do tenant',
      tenantStatusAll: 'Todos',
      // CORREÇÃO (lote 2, Execução 027): rótulo de `active` era inventado
      // ("Ativo"). Fonte real: `App\Enums\TenantStatus::label()`
      // (GB.Cerne.Api/app/Enums/TenantStatus.php) — `ACTIVE => 'Habilitado'`.
      // Os outros 3 já batiam com o enum (Inadimplente/Suspenso/Cancelado).
      tenantStatusOptions: {
        active: 'Habilitado',
        defaulting: 'Inadimplente',
        suspended: 'Suspenso',
        cancelled: 'Cancelado',
      },
    },
    form: {
      title: {
        create: 'Novo Usuário',
        edit: 'Editar Usuário',
      },
      subtitle: {
        create: 'Cadastre a pessoa e a conta de acesso ao sistema.',
        edit: 'Atualize os dados da pessoa e da conta de acesso.',
      },
      sectionPerson: 'Identificação',
      sectionAccount: 'Conta',
      sectionLinks: 'Acesso',
      sectionLinksHint: 'Perfis e escopos concedidos ao usuário.',
      fields: {
        nif: 'CPF/CNPJ',
        name: 'Nome',
        email: 'Email',
        phone: 'Telefone',
        city: 'Cidade',
        address: 'Endereço',
        password: 'Senha',
        passwordConfirmation: 'Confirmação de senha',
        isActive: 'Ativo',
        isPurchasingAssistant: 'Conferente de Compras?',
        photo: 'Foto',
        roleUuids: 'Perfil de Usuário',
        farmUuids: 'Fazendas',
        bossUuids: 'Encarregados',
      },
      placeholders: {
        email: 'nome@empresa.com',
      },
      nifFoundWarning:
        'Pessoa já cadastrada — dados carregados. Salvar irá ATUALIZAR o registro existente.',
      nifFoundWarningEditing:
        'Já existe outra Pessoa cadastrada com este CPF/CNPJ — os dados dela substituíram os deste formulário. Revise antes de salvar.',
      rolesSearchPlaceholder: 'Buscar perfil...',
      farmsSearchPlaceholder: 'Buscar fazenda...',
      bossesSearchPlaceholder: 'Buscar encarregado...',
      selectedCount: 'Selecionados',
      editPasswordNotice:
        'A senha é definida na criação; para redefinir, use a ação "Redefinir Senha" na listagem.',
      emailReadonlyNotice: 'O e-mail não pode ser alterado após a criação da conta.',
      hints: {
        photoAccepted: 'Formatos aceitos: JPEG, PNG, JPG, GIF, SVG.',
        photoMaxSize: 'Tamanho máximo: 2 MB.',
      },
      image: {
        dropzoneTitle: 'Arraste uma imagem ou clique para selecionar',
        dropzoneDragging: 'Solte a imagem aqui',
        changeLabel: 'Trocar foto',
        removeLabel: 'Remover foto',
        errorType: 'Formato não aceito.',
        errorSize: 'Arquivo excede o tamanho máximo de 2 MB.',
      },
      validation: {
        nifRequired: 'Informe o CPF/CNPJ',
        nifInvalid: 'CPF/CNPJ inválido',
        nameRequired: 'Informe o nome',
        nameMaxLength: 'O nome deve ter no máximo 120 caracteres',
        emailRequired: 'Informe o e-mail',
        emailInvalid: 'E-mail inválido',
        emailMaxLength: 'O e-mail deve ter no máximo 191 caracteres',
        cityRequired: 'Selecione a cidade',
        addressRequired: 'Informe o endereço',
        addressMaxLength: 'O endereço deve ter no máximo 120 caracteres',
        passwordRequired: 'Informe a senha',
        passwordMin: 'A senha deve ter no mínimo 6 caracteres',
        passwordConfirmationMismatch: 'As senhas não coincidem',
        roleUuidsMin: 'Selecione ao menos um perfil',
        farmUuidsMin: 'Selecione ao menos uma fazenda',
      },
    },
    actions: {
      activate: 'Ativar',
      deactivate: 'Desativar',
      activateConfirmTitle: 'Ativar usuário',
      activateConfirmDescription: 'O usuário voltará a ter acesso ao sistema. Deseja continuar?',
      deactivateConfirmTitle: 'Desativar usuário',
      deactivateConfirmDescription: 'O usuário perderá o acesso ao sistema. Deseja continuar?',
      resetPassword: 'Redefinir Senha',
      resetPasswordConfirmTitle: 'Redefinir senha',
      resetPasswordConfirmDescription:
        'Uma nova senha será gerada e enviada por e-mail ao usuário; as sessões ativas dele serão encerradas. Deseja continuar?',
      resetPasswordSuccess: 'Senha redefinida. O usuário foi notificado por e-mail.',
      activateSuccess: 'Usuário ativado com sucesso.',
      deactivateSuccess: 'Usuário desativado com sucesso.',
      deleteUser: 'Excluir',
      deleteUserConfirmTitle: 'Excluir usuário',
      deleteUserConfirmDescription:
        'Esta ação apaga o usuário definitivamente. Não pode ser desfeita.',
      deleteUserSuccess: 'Usuário excluído com sucesso.',
    },
    viewDialog: {
      title: 'Visualizar usuário',
      sectionPerson: 'Identificação',
      sectionAccount: 'Conta',
      sectionLinks: 'Acesso',
      fields: {
        nif: 'CPF/CNPJ',
        name: 'Nome',
        nickname: 'Apelido',
        loginEmail: 'E-mail de login',
        contactEmail: 'E-mail de contato',
        phone: 'Telefone',
        address: 'Endereço',
        city: 'Cidade',
        isActive: 'Status',
        isPurchasingAssistant: 'Conferente de Compras?',
        lastActivity: 'Última atividade',
        roles: 'Perfis',
        farms: 'Fazendas',
        bosses: 'Encarregados',
      },
      noValue: '-',
      noRoles: 'Nenhum perfil vinculado.',
      noFarms: 'Nenhuma fazenda vinculada.',
      noBosses: 'Nenhum encarregado vinculado.',
      loadError: 'Não foi possível carregar os dados do usuário.',
      close: 'Fechar',
    },
  },
};
