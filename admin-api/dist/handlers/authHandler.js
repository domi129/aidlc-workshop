"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authHandler = void 0;
const authService_1 = require("../services/authService");
const responseFormatter_1 = require("../utils/responseFormatter");
const authService = new authService_1.AuthService();
const authHandler = async (event) => {
    const { httpMethod, path } = event;
    try {
        if (path === '/auth/login' && httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');
            const { username, password, storeId } = body;
            if (!username || !password || !storeId) {
                return (0, responseFormatter_1.errorResponse)({
                    code: 'INVALID_REQUEST',
                    message: 'Missing required fields',
                    statusCode: 400
                });
            }
            const result = await authService.login(username, password, storeId);
            return (0, responseFormatter_1.successResponse)(result);
        }
        if (path === '/auth/refresh' && httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');
            const { token } = body;
            if (!token) {
                return (0, responseFormatter_1.errorResponse)({
                    code: 'INVALID_REQUEST',
                    message: 'Token required',
                    statusCode: 400
                });
            }
            const result = await authService.refreshToken(token);
            return (0, responseFormatter_1.successResponse)(result);
        }
        return (0, responseFormatter_1.errorResponse)({
            code: 'NOT_FOUND',
            message: 'Route not found',
            statusCode: 404
        });
    }
    catch (error) {
        return (0, responseFormatter_1.errorResponse)(error);
    }
};
exports.authHandler = authHandler;
