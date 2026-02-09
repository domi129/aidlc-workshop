"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderHandler = void 0;
const orderService_1 = require("../services/orderService");
const responseFormatter_1 = require("../utils/responseFormatter");
const authMiddleware_1 = require("../middleware/authMiddleware");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const orderService = new orderService_1.OrderService();
const orderHandler = async (event) => {
    const { httpMethod, path, pathParameters } = event;
    try {
        // Verify authentication
        const admin = await (0, authMiddleware_1.verifyAuth)(event);
        if (path === '/orders' && httpMethod === 'GET') {
            const orders = await orderService.getOrdersByStore(admin.storeId);
            return (0, responseFormatter_1.successResponse)(orders);
        }
        if (path.match(/\/orders\/[^/]+\/status/) && httpMethod === 'PATCH') {
            (0, rbacMiddleware_1.checkRole)(admin, ['Admin', 'Manager']);
            const orderId = pathParameters?.orderId;
            const body = JSON.parse(event.body || '{}');
            const { status } = body;
            const order = await orderService.updateOrderStatus(orderId, status);
            return (0, responseFormatter_1.successResponse)(order);
        }
        if (path.match(/\/orders\/[^/]+$/) && httpMethod === 'DELETE') {
            (0, rbacMiddleware_1.checkRole)(admin, ['Admin']);
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
exports.orderHandler = orderHandler;
