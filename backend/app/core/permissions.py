from enum import Enum

class Permissions(str, Enum):
    """
    Enum de permisos para acciones en el sistema.
    El valor es el que se guardará en la base de datos.
    """
    # --- Permisos de Super Admin ---
    FULL_ACCESS = "full_access" # Un permiso especial para el rol de Admin

    # --- Permisos de Órdenes ---
    LIST_ALL_ORDERS = "list_all_orders"
    UPDATE_ORDER_STATUS = "update_order_status"
    EDIT_ORDER = "edit_order"

    # --- Permisos de Fotógrafos ---
    LIST_PHOTOGRAPHERS = "list_photographers"
    CREATE_PHOTOGRAPHER = "create_photographer"
    EDIT_PHOTOGRAPHER = "edit_photographer"
    DELETE_PHOTOGRAPHER = "delete_photographer"

    # --- Permisos de Álbumes ---
    CREATE_ALBUM = "create_album"
    EDIT_OWN_ALBUM = "edit_own_album"
    DELETE_OWN_ALBUM = "delete_own_album"
    EDIT_ANY_ALBUM = "edit_any_album"
    DELETE_ANY_ALBUM = "delete_any_album"

    # --- Permisos de Fotos ---
    UPLOAD_PHOTO = "upload_photo"
    EDIT_OWN_PHOTO = "edit_own_photo"
    DELETE_OWN_PHOTO = "delete_own_photo"
    EDIT_ANY_PHOTO = "edit_any_photo"
    DELETE_ANY_PHOTO = "delete_any_photo"

    # --- Permisos de Roles y Permisos ---
    MANAGE_ROLES = "manage_roles"

    # --- Permisos de Descuentos ---
    MANAGE_DISCOUNTS = "manage_discounts"

    # --- Permisos de Tags ---
    MANAGE_TAGS = "manage_tags"

    # --- Permisos de Combos ---
    MANAGE_COMBOS = "manage_combos"

    # --- Permisos de Usuarios ---
    LIST_USERS = "list_users"
    EDIT_USER_ROLE = "edit_user_role"

    # --- Permisos de Ganancias ---
    VIEW_OWN_EARNINGS = "view_own_earnings"
    VIEW_ANY_EARNINGS = "view_any_earnings"

    # --- Permisos de Sesiones ---
    DELETE_ANY_SESSION = "delete_any_session"
