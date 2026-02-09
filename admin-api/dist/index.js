"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const authHandler_1 = require("./handlers/authHandler");
const orderHandler_1 = require("./handlers/orderHandler");
const tableHandler_1 = require("./handlers/tableHandler");
const menuHandler_1 = require("./handlers/menuHandler");
const errorHandler_1 = require("./utils/errorHandler");
const handler = async (event) => {
    try {
        const { httpMethod, path } = event;
        // Route to appropriate handler
        if (path.startsWith('/auth')) {
            return await (0, authHandler_1.authHandler)(event);
        }
        else if (path.startsWith('/orders')) {
            return await (0, orderHandler_1.orderHandler)(event);
        }
        else if (path.startsWith('/tables')) {
            return await (0, tableHandler_1.tableHandler)(event);
        }
        else if (path.startsWith('/menus')) {
            return await (0, menuHandler_1.menuHandler)(event);
        }
        return {
            statusCode: 404,
            body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Route not found' } })
        };
    }
    catch (error) {
        return (0, errorHandler_1.handleError)(error);
    }
};
exports.handler = handler;
