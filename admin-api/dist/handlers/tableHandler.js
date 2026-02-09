"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tableHandler = void 0;
const tableService_1 = require("../services/tableService");
const responseFormatter_1 = require("../utils/responseFormatter");
const authMiddleware_1 = require("../middleware/authMiddleware");
const rbacMiddleware_1 = require("../middleware/rbacMiddleware");
const tableService = new tableService_1.TableService();
const tableHandler = async (event) => {
    const { httpMethod, path, pathParameters, queryStringParameters } = event;
    try {
        const admin = await (0, authMiddleware_1.verifyAuth)(event);
        if (path.match(/\/tables\/[^/]+\/complete/) && httpMethod === 'POST') {
            (0, rbacMiddleware_1.checkRole)(admin, ['Admin', 'Manager']);
            const tableId = pathParameters?.tableId;
            const body = JSON.parse(event.body || '{}');
            const { sessionId } = body;
            await tableService.completeSession(tableId, sessionId);
            return (0, responseFormatter_1.successResponse)({ success: true });
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
exports.tableHandler = tableHandler;
