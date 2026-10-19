// src/constants/languages/languageEsEs/languageProviders.ts
// Traducción ES-ES del módulo "Fornecedores" (Provider — Registros Base).
// TASK-PR-FE-01: singular/plural (queryKey), opciones del enum `type`
// (ProviderTypeEnum, DA-PR-09) y mensajes de validación del schema Yup.

import { ModuleProviders } from '@/@types/language/module-providers';

export const languageProviders: ModuleProviders = {
  provider: {
    singularLabel: 'Proveedor',
    pluralLabel: 'Proveedores',

    typeOptions: {
      fornecedor: 'Proveedor',
      funcionario: 'Empleado',
      terceirizado: 'Tercerizado',
      transportador: 'Transportista',
      comissionado: 'Comisionado',
      inseminador: 'Inseminador',
    },

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
      pageTitle: 'Proveedores',
      pageSubtitle: 'Gestione los proveedores registrados en este tenant.',
      table: {
        document: 'CPF/CNPJ',
        name: 'Proveedor',
        city: 'Ciudad',
        type: 'Tipo',
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
        titleEmpty: 'Ningún proveedor registrado',
        descriptionEmpty: 'Registre el primer proveedor para empezar.',
        titleFiltered: 'Ningún proveedor encontrado',
        descriptionFiltered: 'Ajuste los filtros aplicados e intente de nuevo.',
        cta: 'Nuevo Proveedor',
      },
      deactivatedToast: 'Proveedor desactivado con éxito.',
      activatedToast: 'Proveedor activado con éxito.',
      deletedToast: 'Proveedor eliminado con éxito.',
      deactivateDialog: {
        title: 'Desactivar Proveedor',
        description: 'Seguro que desea desactivar el proveedor',
        warning:
          'El proveedor dejará de aparecer en el listado por defecto, pero puede reactivarse después.',
        confirm: 'Desactivar',
      },
      activateDialog: {
        title: 'Activar Proveedor',
        description: '¿Seguro que desea activar al proveedor',
        warning:
          'El proveedor volverá a estar activo y podrá desactivarse nuevamente cuando sea necesario.',
        confirm: 'Activar',
      },
      deleteDialog: {
        title: 'Eliminar Proveedor',
        description: '¿Seguro que desea eliminar al proveedor',
        warning:
          'Esta acción no se puede deshacer. Un proveedor con registros vinculados no puede eliminarse; desactívelo.',
        confirm: 'Eliminar',
      },
    },

    filter: {
      title: 'Filtros',
      search: 'Buscar',
      searchPlaceholder: 'Buscar por nombre, apodo o CPF/CNPJ',
      type: 'Tipo',
      typeAll: 'Todos los tipos',
      city: 'Ciudad',
      cityAll: 'Todas las ciudades',
      isEnabled: 'Estado',
      isEnabledAll: 'Todos',
      enabledOptions: {
        active: 'Activo',
        inactive: 'Inactivo',
      },
    },

    form: {
      title: {
        create: 'Nuevo Proveedor',
        edit: 'Editar Proveedor',
      },
      subtitle: {
        create: 'Registre un nuevo proveedor.',
        edit: 'Actualice los datos del proveedor.',
      },
      tabs: {
        dados: 'Datos',
        conta: 'Cuenta',
        filiais: 'Sucursales',
        vendedores: 'Vendedores',
      },
      comingSoon: 'Esta pestaña estará disponible próximamente.',
      nifFoundWarning:
        'Persona ya registrada — datos cargados. Guardar ACTUALIZARÁ el registro existente.',
      nifFoundWarningEditing:
        'Ya existe otra Persona registrada con este CPF/CNPJ — sus datos reemplazaron los de este formulario. Revise antes de guardar.',
      nifPermissionDeniedWarning:
        'Sin permiso para consultar el registro de personas — complete los datos manualmente.',
      savedInactiveNotSelected:
        'Proveedor guardado como inactivo: no se seleccionó en el campo, ya que los proveedores inactivos no están disponibles para selección.',
      enabledOptions: {
        yes: 'Sí',
        no: 'No',
      },
      placeholders: {
        defaultCostCenter: 'Seleccione el centro de costo predeterminado',
      },
      fields: {
        nif: 'CPF/CNPJ',
        nickname: 'Apodo',
        name: 'Razón Social/Nombre',
        stateRegistration: 'IE del proveedor',
        cityRegistration: 'IM del proveedor',
        type: 'Tipo',
        commission: 'Comisión',
        hourValue: 'Valor de la Hora',
        email: 'Correo electrónico',
        phone: 'Teléfono',
        zipCode: 'Código Postal',
        address: 'Dirección',
        number: 'Número',
        district: 'Barrio',
        city: 'Ciudad',
        contact: 'Contacto',
        contactPhone: 'Teléfono de Contacto',
        cellphone: 'Celular',
        isEnabled: 'Activo',
        defaultCostCenter: 'Centro de Costo Predeterminado',
        bankId: 'Banco',
        accountType: 'Tipo de Cuenta',
        agency: 'Agencia',
        account: 'Cuenta',
        pixType: 'Tipo de Clave PIX',
        pix: 'Clave PIX',
      },
      cepAutofill: {
        notFound: {
          title: 'Código postal no encontrado',
          description: 'Complete la dirección manualmente.',
        },
        cityNotResolved: {
          title: 'Ciudad no localizada',
          description: 'Seleccione la ciudad manualmente.',
        },
        networkError: {
          title: 'Error al consultar el código postal',
          description: 'Complete la dirección manualmente.',
        },
      },
      branches: {
        empty: 'Ninguna sucursal registrada.',
        add: 'Agregar Sucursal',
        removeAria: 'Eliminar sucursal',
        fields: {
          name: 'Nombre',
          nif: 'CNPJ',
          stateRegistration: 'IE',
          zipCode: 'Código Postal',
          city: 'Ciudad',
          address: 'Dirección',
        },
        cnpjAutofill: {
          loading: 'Buscando los datos del CNPJ...',
          notFound: {
            title: 'No fue posible buscar los datos del CNPJ automáticamente',
            description: 'Complete los campos de la sucursal manualmente.',
          },
          cityNotResolved: {
            title: 'Ciudad de la sucursal no localizada',
            description: 'Seleccione la ciudad de la sucursal manualmente.',
          },
        },
      },
      sellers: {
        empty: 'Ningún vendedor registrado.',
        add: 'Agregar Vendedor',
        removeAria: 'Eliminar vendedor',
        fields: {
          name: 'Nombre',
          email: 'Correo electrónico',
          phone: 'Teléfono',
        },
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
        addressRequired: 'Campo obligatorio.',
        addressMaxLength: 'Máximo 120 caracteres.',
        numberRequired: 'Campo obligatorio.',
        numberMaxLength: 'Máximo 10 caracteres.',
        districtRequired: 'Campo obligatorio.',
        districtMaxLength: 'Máximo 60 caracteres.',
        cityRequired: 'Seleccione una ciudad.',
        typeRequired: 'Seleccione el tipo de proveedor.',
        commissionRequiredForType: 'La comisión es obligatoria para el tipo Comisionado.',
        hourValueRequiredForType: 'El valor por hora es obligatorio para el tipo Tercerizado.',
        contactMaxLength: 'Máximo de 120 caracteres.',
        cellphoneMaxLength: 'Máximo de 15 caracteres.',
        defaultCostCenterInvalid: 'Centro de costo inválido.',
        isEnabledRequired: 'Campo obligatorio.',
        branchNifRequired: 'El CPF/CNPJ de la sucursal es obligatorio.',
        branchCityRequired: 'Seleccione la ciudad de la sucursal.',
        branchAddressRequired: 'La dirección de la sucursal es obligatoria.',
        sellerNameRequired: 'El nombre del vendedor es obligatorio.',
        sellerEmailInvalid: 'Correo electrónico inválido.',
      },
    },
  },
};
