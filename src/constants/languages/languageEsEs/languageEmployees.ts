// src/constants/languages/languageEsEs/languageEmployees.ts
// Traducción ES-ES del módulo "Funcionários" (Employee — Registros Base).
// TASK-EMP-FE-01: singular/plural (queryKey), opciones de los enums PIX/tipo
// de cuenta y mensajes de validación del schema Yup — esqueleto de `list`/
// `filter`/`form.fields`/`form.user` para `TASK-EMP-FE-02/03/04`.

import { ModuleEmployees } from '@/@types/language/module-employees';

export const languageEmployees: ModuleEmployees = {
  employee: {
    singularLabel: 'Empleado',
    pluralLabel: 'Empleados',

    pixTypeOptions: {
      cpfCnpj: 'CPF/CNPJ',
      email: 'Correo electrónico',
      phone: 'Teléfono',
      random: 'Clave Aleatoria',
    },

    accountTypeOptions: {
      checking: 'Cuenta Corriente',
      savings: 'Cuenta de Ahorros',
    },

    list: {
      pageTitle: 'Empleados',
      pageSubtitle: 'Gestione los empleados registrados en esta finca.',
      table: {
        document: 'CPF / CNPJ',
        name: 'Empleado',
        email: 'Correo electrónico',
        phone: 'Teléfono',
        office: 'Cargo',
        createdAt: 'Registrado el',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
      },
      actions: {
        edit: 'Editar',
        deactivate: 'Desactivar',
        activate: 'Activar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ningún empleado registrado',
        descriptionEmpty: 'Registre el primer empleado para comenzar.',
        titleFiltered: 'Ningún empleado encontrado',
        descriptionFiltered: 'Ajuste los filtros aplicados e intente nuevamente.',
        cta: 'Nuevo Empleado',
      },
      deactivatedToast: 'Empleado desactivado con éxito.',
      activatedToast: 'Empleado activado con éxito.',
      deactivateDialog: {
        title: 'Desactivar Empleado',
        description: '¿Está seguro de que desea desactivar al empleado',
        warning:
          'El empleado dejará de aparecer en el listado predeterminado, pero puede reactivarse después.',
        confirm: 'Desactivar',
      },
      deletedToast: 'Empleado eliminado con éxito.',
      deleteDialog: {
        title: 'Eliminar Empleado',
        description: '¿Seguro que desea eliminar al empleado',
        warning:
          'Esta acción no se puede deshacer. Un empleado con registros vinculados no puede eliminarse; desactívelo.',
        confirm: 'Eliminar',
      },
      activateDialog: {
        title: 'Activar Empleado',
        description: '¿Está seguro de que desea activar al empleado',
        warning:
          'El empleado volverá a estar activo en el sistema y podrá ser desactivado nuevamente cuando sea necesario.',
        confirm: 'Activar',
      },
    },

    filter: {
      title: 'Filtros',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nombre o CPF/CNPJ',
      startDate: 'Registrado desde',
      endDate: 'Registrado hasta',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
    },

    form: {
      title: {
        create: 'Nuevo Empleado',
        edit: 'Editar Empleado',
      },
      subtitle: {
        create: 'Registre un nuevo empleado.',
        edit: 'Actualice los datos del empleado.',
      },
      employmentSectionTitle: 'Vínculo Laboral',
      nifFoundWarning:
        'Persona ya registrada — datos cargados. Guardar ACTUALIZARÁ el registro existente.',
      nifFoundWarningEditing:
        'Ya existe otra Persona registrada con este CPF/CNPJ — sus datos reemplazaron los de este formulario. Revise antes de guardar.',
      nifPermissionDeniedWarning:
        'Sin permiso para consultar el registro de personas — complete los datos manualmente.',
      employeeAlreadyExistsRedirectWarning:
        'Empleado ya registrado en esta granja. Abriendo el registro para edición.',
      fields: {
        nif: 'CPF/CNPJ',
        nickname: 'Apodo',
        name: 'Nombre Completo',
        email: 'Correo electrónico',
        phone: 'Teléfono',
        zipCode: 'Código Postal',
        address: 'Dirección',
        number: 'Número',
        district: 'Barrio',
        city: 'Ciudad',
        office: 'Cargo',
        function: 'Función (CBO)',
        commission: 'Comisión (%)',
        vlTimeProductive: 'Valor Hora Productiva',
        baseSalary: 'Salario Base',
        goalSalary: 'Salario Meta',
        centerId: 'Centro de Costo',
        birthday: 'Fecha de Nacimiento',
      },
      bank: {
        title: 'Datos Bancarios',
        bankId: 'Banco',
        accountType: 'Tipo de Cuenta',
        agency: 'Agencia',
        account: 'Cuenta',
        pixType: 'Tipo de Clave PIX',
        pix: 'Clave PIX',
      },
      cepAutofill: {
        notFound: {
          title: 'Código Postal no encontrado',
          description: 'Complete la dirección manualmente.',
        },
        cityNotResolved: {
          title: 'Ciudad no identificada',
          description: 'Seleccione la ciudad manualmente.',
        },
        networkError: {
          title: 'Error al buscar el Código Postal',
          description: 'No fue posible consultar el ViaCEP ahora. Complete manualmente.',
        },
      },
      user: {
        sectionTitle: 'Acceso al Sistema',
        createUser: 'Crear Usuario',
        role: 'Perfil de Usuario',
        limitReachedError:
          'Se alcanzó el límite de usuarios del plan contratado. Desmarque esta opción o contáctenos para ampliar el plan.',
        rolePermissionDenied: 'No tienes permiso para ver perfiles de usuario.',
        usersQuotaReached:
          'Se alcanzó el límite de usuarios del plan contratado — no es posible crear un nuevo acceso.',
      },
      validation: {
        nifRequired: 'El CPF/CNPJ es obligatorio.',
        nifInvalid: 'CPF/CNPJ inválido — verifique los dígitos.',
        nameRequired: 'Campo obligatorio.',
        nameMaxLength: 'Máximo 120 caracteres.',
        nicknameRequired: 'Campo obligatorio.',
        nicknameMaxLength: 'Máximo 60 caracteres.',
        emailInvalid: 'Correo electrónico inválido.',
        emailMaxLength: 'Máximo 89 caracteres.',
        emailRequiredForUser: 'El correo electrónico es obligatorio para crear acceso al sistema.',
        phoneMaxLength: 'Máximo 15 caracteres.',
        addressRequired: 'Campo obligatorio.',
        addressMaxLength: 'Máximo 120 caracteres.',
        numberRequired: 'Campo obligatorio.',
        numberMaxLength: 'Máximo 10 caracteres.',
        districtRequired: 'Campo obligatorio.',
        districtMaxLength: 'Máximo 60 caracteres.',
        cityRequired: 'Seleccione una ciudad.',
        officeMaxLength: 'Máximo 120 caracteres.',
        functionRequired: 'Seleccione la función.',
        birthdayRequired: 'La fecha de nacimiento es obligatoria.',
        birthdayNotFuture: 'La fecha de nacimiento no puede ser futura.',
        baseSalaryRequired: 'El salario base es obligatorio.',
        baseSalaryMin: 'El salario base no puede ser negativo.',
        roleRequired: 'Seleccione el perfil de acceso.',
      },
    },
  },
};
