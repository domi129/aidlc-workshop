"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAuthMock = verifyAuthMock;
exports.checkRoleMock = checkRoleMock;
const mockServices_1 = require("../mocks/mockServices");
const mockAuthService = new mockServices_1.MockAuthService();
async function verifyAuthMock(event) {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    if (!authHeader) {
        throw {
            code: 'UNAUTHORIZED',
            message: 'No authorization header',
            statusCode: 401
        };
    }
    const token = authHeader.replace('Bearer ', '');
    const admin = await mockAuthService.verifyToken(token);
    return admin;
}
function checkRoleMock(admin, allowedRoles) {
    if (!allowedRoles.includes(admin.role)) {
        throw {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
            statusCode: 403
        };
    }
}
