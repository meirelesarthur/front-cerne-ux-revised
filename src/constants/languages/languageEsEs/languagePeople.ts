// src/constants/languages/languageEsEs/languagePeople.ts
// Traducción ES-ES del módulo PERSONAS (Person — Registros Base).

import { ModulePeople } from '@/@types/language/module-people';

export const languagePeople: ModulePeople = {
  person: {
    singularLabel: 'Persona',
    roles: {
      proprietary: 'Propietario',
      employee: 'Empleado',
      provider: 'Proveedor',
      client: 'Cliente',
      user: 'Usuario',
    },
    roleHints: {
      proprietary: 'Dueño de finca — participación por propiedad e inscripciones estatales.',
      employee: 'Colaborador — cargo, función, datos bancarios y centro de costo.',
      provider: 'Vende insumos — sucursales, vendedores y datos bancarios.',
      client: 'Comprador — inscripciones estatales, contribuyente y datos fiscales.',
      user: 'Acceso al sistema — perfiles, fincas y encargados.',
    },

    list: {
      pageTitle: 'Personas',
      pageSubtitle:
        'Registro único de identidad civil — cada persona puede acumular los roles de Propietario, Empleado, Proveedor, Cliente y Usuario.',
      searchPlaceholder: 'Buscar por nombre, apodo o CPF/CNPJ',
      deletedToast: 'Persona eliminada con éxito',
      table: {
        name: 'Nombre',
        document: 'CPF / CNPJ',
        email: 'Correo electrónico',
        roles: 'Roles',
        noRole: 'Sin rol',
        actions: '',
      },
      actions: {
        view: 'Ver detalles',
        edit: 'Editar',
        delete: 'Eliminar',
      },
      emptyState: {
        titleEmpty: 'Ninguna persona registrada.',
        descriptionEmpty: 'Comience registrando la primera persona.',
        titleFiltered: 'Ninguna persona encontrada.',
        descriptionFiltered: 'Intente ajustar los filtros o borrar la búsqueda.',
        cta: 'Nueva Persona',
      },
      deleteDialog: {
        title: '¿Eliminar persona?',
        description: '¿Está seguro de que desea eliminar',
        warning:
          'La persona deja de aparecer en los listados, pero los roles y registros vinculados permanecen intactos en la base de datos.',
      },
    },

    filter: {
      title: 'Filtrar personas',
      search: 'Buscar',
      role: 'Rol',
      roleAll: 'Todos los roles',
    },

    steps: {
      basico: 'Datos Básicos',
      endereco: 'Dirección',
    },

    form: {
      title: { create: 'Nueva Persona', edit: 'Editar Persona' },
      subtitle: {
        create: 'Complete las etapas para registrar la persona.',
        edit: 'Actualice los datos de la persona.',
      },

      basico: {
        subtitle: 'Informe la identificación de la persona y active los roles aplicables.',
        nif: 'CPF / CNPJ',
        nameFisica: 'Nombre Completo',
        namePj: 'Nombre Comercial',
        nicknameFisica: 'Apodo',
        nicknamePj: 'Razón Social',
        email: 'Correo electrónico',
        phone: 'Teléfono',
        rolesLabel: 'Roles de esta persona',
        rolesHint:
          'Active los roles aplicables — cada uno añade una etapa de configuración a continuación.',
        roleAdded: 'Paso "{role}" agregado — configúralo a continuación.',
        nifFoundWarning:
          'Persona ya registrada — datos cargados. Guardar ACTUALIZARÁ el registro existente.',
      },

      endereco: {
        subtitle: 'Ubicación y dirección de correspondencia de la persona.',
        zipCode: 'Código Postal',
        city: 'Ciudad',
        address: 'Dirección',
        number: 'Número',
        district: 'Barrio',
      },

      proprietary: {
        subtitle:
          'Vincule las fincas, la participación por propiedad y las inscripciones estatales.',
        stateRegistrations: 'Inscripciones Estatales',
        stateRegistrationShort: 'IE',
        addStateRegistration: 'Añadir inscripción',
        emptyStateRegistrations: 'Ninguna inscripción estatal registrada.',
        farms: 'Fincas y Participación',
        addFarm: 'Añadir finca',
        emptyFarms: 'Ninguna finca vinculada.',
        farm: 'Finca',
        percentage: 'Participación (%)',
      },

      employee: {
        subtitle: 'Cargo, función, centro de costo y datos bancarios del colaborador.',
        office: 'Cargo',
        function: 'Función (CBO)',
        commission: 'Comisión (%)',
        vlTimeProductive: 'Valor Hora Productiva',
        vlTimeUnproductive: 'Valor Hora Improductiva',
        baseSalary: 'Salario Base',
        goalSalary: 'Salario Meta',
        centerId: 'Centro de Costo',
        birthday: 'Fecha de Nacimiento',
        bank: {
          title: 'Datos Bancarios',
          bankId: 'Banco',
          accountType: 'Tipo de Cuenta',
          agency: 'Agencia',
          account: 'Cuenta',
          pixType: 'Tipo de Clave PIX',
          pix: 'Clave PIX',
        },
      },

      provider: {
        subtitle: 'Tipo de suministro, datos bancarios, sucursales y vendedores.',
        type: 'Tipo de Proveedor',
        typeOptions: {
          resale: 'Reventa de insumos',
          industry: 'Industria',
          service: 'Prestador de servicio',
          carrier: 'Transportista',
          commissioned: 'Representante comisionado',
        },
        commission: 'Comisión (%)',
        hourValue: 'Valor por Hora',
        stateRegistration: 'IE del proveedor',
        cityRegistration: 'IM del proveedor',
        contact: 'Contacto',
        contactPhone: 'Teléfono del Contacto',
        branches: 'Sucursales',
        addBranch: 'Añadir sucursal',
        emptyBranches: 'Ninguna sucursal registrada.',
        branchNif: 'CNPJ de la Sucursal',
        branchName: 'Nombre de la Sucursal',
        branchStateRegistration: 'Inscripción Estatal',
        branchZipCode: 'Código Postal',
        branchCity: 'Ciudad',
        branchAddress: 'Dirección',
        sellers: 'Vendedores',
        addSeller: 'Añadir vendedor',
        emptySellers: 'Ningún vendedor registrado.',
        sellerName: 'Nombre',
        sellerEmail: 'Correo electrónico',
        sellerPhone: 'Teléfono',
      },

      client: {
        subtitle: 'Datos fiscales, contacto comercial e inscripciones estatales del comprador.',
        cellphone: 'Celular',
        contact: 'Contacto',
        contactPhone: 'Teléfono del Contacto',
        cityRegistration: 'IM del cliente',
        farmName: 'Nombre de la Finca',
        finalCustomer: 'Consumidor Final',
        finalCustomerHint: 'Impacta la tributación en la emisión de factura electrónica.',
        taxpayer: 'Contribuyente',
        taxpayerHint: 'Define si el cliente es contribuyente de ICMS (impacto fiscal).',
        country: 'País',
        idAbroad: 'ID en el Extranjero',
        stateRegistrations: 'Inscripciones Estatales',
        stateRegistrationShort: 'IE',
        addStateRegistration: 'Añadir inscripción',
        emptyStateRegistrations: 'Ninguna inscripción estatal registrada.',
      },

      user: {
        subtitle: 'Acceso al sistema — contraseña, perfiles, fincas y encargados.',
        password: 'Contraseña',
        passwordConfirmation: 'Confirmación de Contraseña',
        passwordHint: 'Mínimo 8 caracteres, con mayúscula, minúscula y número.',
        editPasswordNotice:
          'La contraseña no se puede cambiar aquí durante la edición. Use el flujo de restablecimiento de contraseña para cambiarla.',
        purchasingAssistant: 'Asistente de Compras',
        purchasingAssistantHint: 'Perfil especial con permisos de verificación de compras.',
        farms: 'Fincas',
        roles: 'Perfiles',
        bosses: 'Encargados',
        farmsSearchPlaceholder: 'Buscar finca...',
        rolesSearchPlaceholder: 'Buscar perfil...',
        bossesSearchPlaceholder: 'Buscar encargado...',
        selectedCount: 'Seleccionados',
        toggleRoleWarning:
          'Desactivar este rol no elimina el acceso ya existente — solo evita reenviar nuevos datos.',
        deactivateDialog: {
          title: '¿Desactivar el acceso del usuario?',
          message: 'Al guardar, este usuario perderá el acceso al sistema. ¿Desea continuar?',
          confirm: 'Guardar y desactivar acceso',
        },
      },

      // TASK-FE-338 — confirmación al desactivar un rol Propietario/
      // Empleado/Proveedor/Cliente ya activo (generalización del hallazgo
      // F). `{roles}` se sustituye por la lista de roles afectados (ej.:
      // "Propietario, Proveedor").
      roleDeactivateDialog: {
        title: '¿Desactivar el/los rol(es) seleccionado(s)?',
        message:
          'Al guardar, se desactivará(n) el/los siguiente(s) rol(es): {roles}. Los datos ya vinculados (fincas, sucursales, vendedores, inscripciones) se conservarán. ¿Desea continuar?',
        confirm: 'Guardar y desactivar',
      },

      pixTypeOptions: {
        cpfCnpj: 'CPF / CNPJ',
        email: 'Correo electrónico',
        phone: 'Teléfono',
        random: 'Clave Aleatoria',
      },

      footer: {
        back: 'Volver',
        next: 'Siguiente',
        save: 'Guardar Persona',
        saving: 'Guardando...',
        close: 'Cerrar',
        stepCounter: {
          label: 'Paso',
          of: 'de',
        },
      },

      toasts: {
        createdSuccess: 'Persona creada con éxito.',
        updatedSuccess: 'Persona actualizada con éxito.',
        upsertSuccess: 'Persona ya registrada — datos actualizados.',
      },

      unsavedChanges: {
        title: 'Cambios no guardados',
        message: 'Tiene cambios no guardados. ¿Desea salir sin guardar?',
        confirm: 'Salir sin guardar',
        cancel: 'Quedarse',
      },

      validation: {
        nifRequired: 'El CPF/CNPJ es obligatorio.',
        nifInvalid: 'CPF/CNPJ inválido — verifique los dígitos.',
        nameRequired: 'Campo obligatorio.',
        nameMaxLength: 'Máximo 120 caracteres.',
        nicknameRequired: 'Campo obligatorio.',
        nicknameMaxLength: 'Máximo 60 caracteres.',
        emailInvalid: 'Correo electrónico inválido.',
        emailRequiredForAccess:
          'El correo es obligatorio para conceder acceso o registrar cliente.',
        cityRequired: 'Seleccione una ciudad.',
        addressRequired: 'Campo obligatorio.',
        numberRequired: 'Campo obligatorio.',
        numberMaxLength: 'Máximo 10 caracteres.',
        districtRequired: 'Campo obligatorio.',
        districtMaxLength: 'Máximo 60 caracteres.',
        functionRequired: 'Seleccione la función.',
        birthdayRequired: 'La fecha de nacimiento es obligatoria.',
        farmRequired: 'Seleccione la finca.',
        percentageRange: 'El porcentaje debe estar entre 0 y 100.',
        typeRequired: 'Seleccione el tipo.',
        finalCustomerRequired: 'Campo obligatorio.',
        taxpayerRequired: 'Campo obligatorio.',
        countryRequired: 'Seleccione el país.',
        branchNifRequired: 'El CNPJ de la sucursal es obligatorio.',
        branchCityRequired: 'Seleccione la ciudad de la sucursal.',
        branchAddressRequired: 'La dirección de la sucursal es obligatoria.',
        sellerNameRequired: 'El nombre del vendedor es obligatorio.',
        passwordRequired: 'La contraseña es obligatoria.',
        passwordMin: 'Mínimo 8 caracteres.',
        passwordConfirmationMismatch: 'Las contraseñas no coinciden.',
      },
    },
  },
};
