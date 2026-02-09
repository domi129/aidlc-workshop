"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockTableHandler = exports.mockMenuHandler = exports.mockOrderHandler = exports.mockAuthHandler = void 0;
const mockServices_1 = require("../mocks/mockServices");
const responseFormatter_1 = require("../utils/responseFormatter");
const mockAuthMiddleware_1 = require("../middleware/mockAuthMiddleware");
const authService = new mockServices_1.MockAuthService();
const orderService = new mockServices_1.MockOrderService();
const menuService = new mockServices_1.MockMenuService();
const tableService = new mockServices_1.MockTableService();
// Auth Handler
const mockAuthHandler = async (event) => {
    const { httpMethod, path } = event;
    try {
        if (path === '/auth/login' && httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');
            const { username, password, storeId } = body;
            const result = await authService.login(username, password, storeId);
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
exports.mockAuthHandler = mockAuthHandler;
// Order Handler
const mockOrderHandler = async (event) => {
    const { httpMethod, path, pathParameters } = event;
    try {
        const admin = await (0, mockAuthMiddleware_1.verifyAuthMock)(event);
        if (path === '/orders' && httpMethod === 'GET') {
            const orders = await orderService.getOrdersByStore(admin.storeId);
            return (0, responseFormatter_1.successResponse)(orders);
        }
        if (path.match(/\/orders\/[^/]+\/status/) && httpMethod === 'PATCH') {
            (0, mockAuthMiddleware_1.checkRoleMock)(admin, ['Admin', 'Manager']);
            const orderId = pathParameters?.orderId;
            const body = JSON.parse(event.body || '{}');
            const order = await orderService.updateOrderStatus(orderId, body.status);
            return (0, responseFormatter_1.successResponse)(order);
        }
        if (path.match(/\/orders\/[^/]+$/) && httpMethod === 'DELETE') {
            (0, mockAuthMiddleware_1.checkRoleMock)(admin, ['Admin']);
            const orderId = pathParameters?.orderId;
            await orderService.deleteOrder(orderId);
            return (0, responseFormatter_1.successResponse)({ success: true });
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
exports.mockOrderHandler = mockOrderHandler;
// Menu Handler
const mockMenuHandler = async (event) => {
    const { httpMethod, path, pathParameters } = event;
    try {
        const admin = await (0, mockAuthMiddleware_1.verifyAuthMock)(event);
        if (path === '/menus' && httpMethod === 'GET') {
            const menus = await menuService.getMenusByStore(admin.storeId);
            return (0, responseFormatter_1.successResponse)(menus);
        }
        if (path === '/menus' && httpMethod === 'POST') {
            (0, mockAuthMiddleware_1.checkRoleMock)(admin, ['Admin']);
            const body = JSON.parse(event.body || '{}');
            const menu = await menuService.createMenu({ ...body, storeId: admin.storeId });
            return (0, responseFormatter_1.successResponse)(menu);
        }
        if (path.match(/\/menus\/[^/]+$/) && httpMethod === 'PUT') {
            (0, mockAuthMiddleware_1.checkRoleMock)(admin, ['Admin']);
            const menuId = pathParameters?.menuId;
            const body = JSON.parse(event.body || '{}');
            const menu = await menuService.updateMenu(menuId, body);
            return (0, responseFormatter_1.successResponse)(menu);
        }
        if (path.match(/\/menus\/[^/]+$/) && httpMethod === 'DELETE') {
            (0, mockAuthMiddleware_1.checkRoleMock)(admin, ['Admin']);
            const menuId = pathParameters?.menuId;
            await menuService.deleteMenu(menuId);
            return (0, responseFormatter_1.successResponse)({ success: true });
        }
        if (path === '/menus/upload-url' && httpMethod === 'POST') {
            (0, mockAuthMiddleware_1.checkRoleMock)(admin, ['Admin']);
            const body = JSON.parse(event.body || '{}');
            const { fileName } = body;
            const result = await menuService.generateUploadUrl(admin.storeId, fileName);
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
exports.mockMenuHandler = mockMenuHandler;
// Table Handler
const mockTableHandler = async (event) => {
    const { httpMethod, path, pathParameters, queryStringParameters } = event;
    try {
        const admin = await (0, mockAuthMiddleware_1.verifyAuthMock)(event);
        if (path.match(/\/tables\/[^/]+\/complete/) && httpMethod === 'POST') {
            (0, mockAuthMiddleware_1.checkRoleMock)(admin, ['Admin', 'Manager']);
            const tableId = pathParameters?.tableId;
            const body = JSON.parse(event.body || '{}');
            const { sessionId } = body;
            const result = await tableService.completeSession(tableId, sessionId);
            return (0, responseFormatter_1.successResponse)(result);
        }
        if (path.match(/\/tables\/[^/]+\/history/) && httpMethod === 'GET') {
            const tableId = pathParameters?.tableId;
            const { startDate, endDate, page, pageSize } = queryStringParameters || {};
            const history = await tableService.getOrderHistory(tableId, {
                startDate,
                endDate,
                page: page ? parseInt(page) : 1,
                pageSize: pageSize ? parseInt(pageSize) : 20
            });
            return (0, responseFormatter_1.successResponse)(history);
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
exports.mockTableHandler = mockTableHandler;
