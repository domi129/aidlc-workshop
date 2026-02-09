"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuHandler = void 0;
const menuService_1 = require("../services/menuService");
const responseFormatter_1 = require("../utils/responseFormatter");
const authMiddleware_1 = require("../middleware/authMiddleware");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const menuService = new menuService_1.MenuService();
const menuHandler = async (event) => {
    const { httpMethod, path, pathParameters } = event;
    try {
        const admin = await (0, authMiddleware_1.verifyAuth)(event);
        if (path === '/menus' && httpMethod === 'GET') {
            const menus = await menuService.getMenusByStore(admin.storeId);
            return (0, responseFormatter_1.successResponse)(menus);
        }
        if (path === '/menus' && httpMethod === 'POST') {
            (0, rbacMiddleware_1.checkRole)(admin, ['Admin']);
            const body = JSON.parse(event.body || '{}');
            const menu = await menuService.createMenu({ ...body, storeId: admin.storeId });
            return (0, responseFormatter_1.successResponse)(menu);
        }
        if (path.match(/\/menus\/[^/]+$/) && httpMethod === 'PUT') {
            (0, rbacMiddleware_1.checkRole)(admin, ['Admin']);
            const menuId = pathParameters?.menuId;
            const body = JSON.parse(event.body || '{}');
            const menu = await menuService.updateMenu(menuId, body);
            return (0, responseFormatter_1.successResponse)(menu);
        }
        if (path.match(/\/menus\/[^/]+$/) && httpMethod === 'DELETE') {
            (0, rbacMiddleware_1.checkRole)(admin, ['Admin']);
            const menuId = pathParameters?.menuId;
            await menuService.deleteMenu(menuId);
            return (0, responseFormatter_1.successResponse)({ success: true });
        }
        if (path === '/menus/upload-url' && httpMethod === 'POST') {
            (0, rbacMiddleware_1.checkRole)(admin, ['Admin']);
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
exports.menuHandler = menuHandler;
