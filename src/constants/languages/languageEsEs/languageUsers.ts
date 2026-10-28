// src/constants/languages/languageEsEs/languageUsers.ts
// Traducción ES-ES del módulo de USUARIOS (User — CRUD administrativo).

import { ModuleUsers } from '@/@types/language/module-users';

export const languageUsers: ModuleUsers = {
  user: {
    singularLabel: 'Usuario',
    pluralLabel: 'Usuarios',
    list: {
      pageTitle: 'Usuarios',
      pageSubtitle: 'Administre las cuentas de acceso al sistema y sus vínculos.',
      table: {
        name: 'Nombre',
        email: 'Correo electrónico',
        role: 'Perfil',
        roleMore: '+{count}',
        status: 'Estado',
        statusActive: 'Activo',
        statusInactive: 'Inactivo',
        lastActivity: 'Última actividad',
        photo: 'Foto',
      },
      actions: {
        edit: 'Editar',
        view: 'Visualizar',
      },
      emptyState: {
        titleEmpty: 'Ningún usuario registrado.',
        descriptionEmpty: 'Comience agregando el primer usuario.',
        titleFiltered: 'Ningún usuario encontrado.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nuevo Usuario',
      },
      error: {
        message: 'No fue posible cargar los usuarios.',
        retry: 'Intentar de nuevo',
      },
    },
    filter: {
      title: 'Filtrar usuarios',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nombre, correo o NIF',
      role: 'Perfil',
      roleAll: 'Todos',
      isActive: 'Estado',
      isActiveAll: 'Todos',
      activeOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
      online: 'En línea ahora',
      onlineAll: 'Todos',
      onlineOptions: {
        online: 'En línea',
        offline: 'Sin conexión',
      },
      inactiveDays: 'Inactividad',
      inactiveDaysAll: 'Todos',
      // CORRECCIÓN (lote 3b, Execução 027 — hallazgo del lote 2): el legado
      // nunca muestra el número puro de días, siempre "Más de X" — fuente
      // real: agro365/resources/views/users/index.blade.php:59-72. Los
      // VALORES numéricos (1/7/15/30/90/180/365) no cambian, solo el label.
      inactiveDaysOptions: {
        oneDay: 'Más de 1 día',
        oneWeek: 'Más de 1 semana',
        oneFortnight: 'Más de 1 quincena',
        oneMonth: 'Más de 1 mes',
        oneQuarter: 'Más de 1 trimestre',
        oneSemester: 'Más de 1 semestre',
        oneYear: 'Más de 1 año',
      },
      tenant: 'Tenant',
      tenantAll: 'Todos',
      plan: 'Plan',
      planAll: 'Todos',
      tenantStatus: 'Estado del tenant',
      tenantStatusAll: 'Todos',
      // CORRECCIÓN (lote 2, Ejecución 027): rótulo `active` era inventado
      // ("Activo"). Fuente real: `App\Enums\TenantStatus::label()`
      // (GB.Cerne.Api/app/Enums/TenantStatus.php) — `ACTIVE => 'Habilitado'`
      // (enum PT-only del backend), traducido aquí como "Habilitado" (cognado
      // directo, mismo significado en español).
      tenantStatusOptions: {
        active: 'Habilitado',
        defaulting: 'Moroso',
        suspended: 'Suspendido',
        cancelled: 'Cancelado',
      },
    },
    form: {
      title: {
        create: 'Nuevo Usuario',
        edit: 'Editar Usuario',
      },
      subtitle: {
        create: 'Registre la persona y la cuenta de acceso.',
        edit: 'Actualice los datos de la persona y de la cuenta de acceso.',
      },
      sectionPerson: 'Identificación',
      sectionAccount: 'Cuenta',
      sectionLinks: 'Acceso',
      sectionLinksHint: 'Perfiles y alcances concedidos al usuario.',
      fields: {
        nif: 'CPF/CNPJ',
        name: 'Nombre',
        email: 'Correo electrónico',
        phone: 'Teléfono',
        city: 'Ciudad',
        address: 'Dirección',
        password: 'Contraseña',
        passwordConfirmation: 'Confirmación de contraseña',
        isActive: 'Activo',
        isPurchasingAssistant: 'Verificador de Compras?',
        photo: 'Foto',
        roleUuids: 'Perfil de Usuario',
        farmUuids: 'Fincas',
        bossUuids: 'Encargados',
      },
      placeholders: {
        email: 'nombre@empresa.com',
      },
      nifFoundWarning:
        'Persona ya registrada — datos cargados. Guardar ACTUALIZARÁ el registro existente.',
      nifFoundWarningEditing:
        'Ya existe otra Persona registrada con este CPF/CNPJ — sus datos reemplazaron los de este formulario. Revise antes de guardar.',
      rolesSearchPlaceholder: 'Buscar perfil...',
      farmsSearchPlaceholder: 'Buscar finca...',
      bossesSearchPlaceholder: 'Buscar encargado...',
      selectedCount: 'Seleccionados',
      editPasswordNotice:
        'La contraseña se define en la creación; para restablecerla, use la acción "Restablecer Contraseña" en el listado.',
      emailReadonlyNotice:
        'El correo electrónico no puede modificarse después de creada la cuenta.',
      hints: {
        photoAccepted: 'Formatos aceptados: JPEG, PNG, JPG, GIF, SVG.',
        photoMaxSize: 'Tamaño máximo: 2 MB.',
      },
      image: {
        dropzoneTitle: 'Arrastre una imagen o haga clic para seleccionar',
        dropzoneDragging: 'Suelte la imagen aquí',
        changeLabel: 'Cambiar foto',
        removeLabel: 'Eliminar foto',
        errorType: 'Formato no aceptado.',
        errorSize: 'El archivo excede el tamaño máximo de 2 MB.',
      },
      validation: {
        nifRequired: 'Informe el CPF/CNPJ',
        nifInvalid: 'CPF/CNPJ inválido',
        nameRequired: 'Informe el nombre',
        nameMaxLength: 'El nombre debe tener como máximo 120 caracteres',
        emailRequired: 'Informe el correo electrónico',
        emailInvalid: 'Correo electrónico inválido',
        emailMaxLength: 'El correo electrónico debe tener como máximo 191 caracteres',
        cityRequired: 'Seleccione la ciudad',
        addressRequired: 'Informe la dirección',
        addressMaxLength: 'La dirección debe tener como máximo 120 caracteres',
        passwordRequired: 'Informe la contraseña',
        passwordMin: 'La contraseña debe tener como mínimo 6 caracteres',
        passwordConfirmationMismatch: 'Las contraseñas no coinciden',
        roleUuidsMin: 'Seleccione al menos un perfil',
        farmUuidsMin: 'Seleccione al menos una finca',
      },
    },
    actions: {
      activate: 'Activar',
      deactivate: 'Desactivar',
      activateConfirmTitle: 'Activar usuario',
      activateConfirmDescription: 'El usuario recuperará el acceso al sistema. ¿Desea continuar?',
      deactivateConfirmTitle: 'Desactivar usuario',
      deactivateConfirmDescription: 'El usuario perderá el acceso al sistema. ¿Desea continuar?',
      resetPassword: 'Restablecer Contraseña',
      resetPasswordConfirmTitle: 'Restablecer contraseña',
      resetPasswordConfirmDescription:
        'Se generará una nueva contraseña y se enviará por correo al usuario; sus sesiones activas serán cerradas. ¿Desea continuar?',
      resetPasswordSuccess:
        'Contraseña restablecida. El usuario fue notificado por correo electrónico.',
      activateSuccess: 'Usuario activado con éxito.',
      deactivateSuccess: 'Usuario desactivado con éxito.',
      deleteUser: 'Eliminar',
      deleteUserConfirmTitle: 'Eliminar usuario',
      deleteUserConfirmDescription:
        'Esta acción elimina el usuario de forma definitiva. No se puede deshacer.',
      deleteUserSuccess: 'Usuario eliminado con éxito.',
    },
    viewDialog: {
      title: 'Visualizar usuario',
      sectionPerson: 'Identificación',
      sectionAccount: 'Cuenta',
      sectionLinks: 'Acceso',
      fields: {
        nif: 'CPF/CNPJ',
        name: 'Nombre',
        nickname: 'Apodo',
        loginEmail: 'Correo de acceso',
        contactEmail: 'Correo de contacto',
        phone: 'Teléfono',
        address: 'Dirección',
        city: 'Ciudad',
        isActive: 'Estado',
        isPurchasingAssistant: 'Verificador de Compras?',
        lastActivity: 'Última actividad',
        roles: 'Perfiles',
        farms: 'Fincas',
        bosses: 'Encargados',
      },
      noValue: '-',
      noRoles: 'Ningún perfil vinculado.',
      noFarms: 'Ninguna finca vinculada.',
      noBosses: 'Ningún encargado vinculado.',
      loadError: 'No fue posible cargar los datos del usuario.',
      close: 'Cerrar',
    },
  },
};
