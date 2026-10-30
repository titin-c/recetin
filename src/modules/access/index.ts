// Contrato público del módulo access: roles, permisos y políticas.
export {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  isAdmin,
  isHouseholdMember,
  isHouseholdOwner,
  canInviteToHousehold,
  canRemoveAdminRole,
} from "./domain/policies";
export type { Actor, RoleCode, PermissionCode, HouseholdRoleCode } from "./domain/policies";
