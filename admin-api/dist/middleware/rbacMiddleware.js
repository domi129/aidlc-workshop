"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = checkRole;
function checkRole(admin, allowedRoles) {
    if (!allowedRoles.includes(admin.role)) {
        throw {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
            statusCode: 403
        };
    }
}
