export function checkRole(admin: any, allowedRoles: string[]): void {
  if (!allowedRoles.includes(admin.role)) {
    throw {
      code: 'FORBIDDEN',
      message: 'Insufficient permissions',
      statusCode: 403
    };
  }
}
