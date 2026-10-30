// Contrato público del módulo admin (solo servidor). Cada caso de uso comprueba su permiso.
export {
  getDashboard,
  listUsers,
  getUserDetail,
  changeUserRole,
  suspendUser,
  reactivateUser,
  auditEmailSent,
  getUserEmail,
  deleteUserAsAdmin,
  viewPrivateContent,
  listAudit,
  AUDIT_ACTION_LABELS,
  USERS_PAGE_SIZE,
  AUDIT_PAGE_SIZE,
} from "./application/admin";
