"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockTableService = exports.MockMenuService = exports.MockOrderService = exports.MockAuthService = void 0;
const uuid_1 = require("uuid");
const jwt = __importStar(require("jsonwebtoken"));
const mockData_1 = require("./mockData");
const JWT_SECRET = process.env.JWT_SECRET || 'local-test-secret-key';
// Mock Auth Service
class MockAuthService {
    async login(username, password, storeId) {
        const admin = mockData_1.mockAdmins.find(a => a.username === username && a.storeId === storeId);
        if (!admin) {
            throw {
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid username or password',
                statusCode: 401
            };
        }
        // For mock, accept any password (in real app, use bcrypt.compare)
        // const isValid = await bcrypt.compare(password, admin.passwordHash);
        const isValid = true; // Mock: always valid
        if (!isValid) {
            throw {
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid username or password',
                statusCode: 401
            };
        }
        const sessionId = (0, uuid_1.v4)();
        const expiresAt = Date.now() + 16 * 60 * 60 * 1000; // 16 hours
        mockData_1.mockSessions.set(sessionId, {
            sessionId,
            adminId: admin.adminId,
            storeId: admin.storeId,
            expiresAt,
            createdAt: Date.now()
        });
        const token = jwt.sign({
            adminId: admin.adminId,
            storeId: admin.storeId,
            sessionId,
            role: admin.role
        }, JWT_SECRET, { expiresIn: '16h' });
        return {
            token,
            admin: {
                adminId: admin.adminId,
                username: admin.username,
                storeId: admin.storeId,
                role: admin.role
            },
            expiresAt
        };
    }
    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const session = mockData_1.mockSessions.get(decoded.sessionId);
            if (!session || session.expiresAt < Date.now()) {
                throw new Error('Invalid or expired session');
            }
            const admin = mockData_1.mockAdmins.find(a => a.adminId === decoded.adminId);
            if (!admin) {
                throw new Error('Admin not found');
            }
            return {
                adminId: admin.adminId,
                username: admin.username,
                storeId: admin.storeId,
                role: admin.role
            };
        }
        catch (error) {
            throw {
                code: 'UNAUTHORIZED',
                message: 'Invalid or expired token',
                statusCode: 401
            };
        }
    }
}
exports.MockAuthService = MockAuthService;
// Mock Order Service
class MockOrderService {
    async getOrdersByStore(storeId) {
        return mockData_1.mockOrders.filter(o => o.storeId === storeId);
    }
    async updateOrderStatus(orderId, status) {
        const order = mockData_1.mockOrders.find(o => o.orderId === orderId);
        if (!order) {
            throw {
                code: 'NOT_FOUND',
                message: 'Order not found',
                statusCode: 404
            };
        }
        // Validate state transition
        const validTransitions = {
            PENDING: ['PREPARING'],
            PREPARING: ['COMPLETED'],
            COMPLETED: []
        };
        if (!validTransitions[order.status]?.includes(status)) {
            throw {
                code: 'INVALID_STATE_TRANSITION',
                message: `Cannot transition from ${order.status} to ${status}`,
                statusCode: 400
            };
        }
        order.status = status;
        order.updatedAt = Date.now();
        return order;
    }
    async deleteOrder(orderId) {
        const index = mockData_1.mockOrders.findIndex(o => o.orderId === orderId);
        if (index === -1) {
            throw {
                code: 'NOT_FOUND',
                message: 'Order not found',
                statusCode: 404
            };
        }
        const order = mockData_1.mockOrders[index];
        if (order.status !== 'PENDING') {
            throw {
                code: 'INVALID_REQUEST',
                message: 'Only PENDING orders can be deleted',
                statusCode: 400
            };
        }
        mockData_1.mockOrders.splice(index, 1);
        return { success: true };
    }
}
exports.MockOrderService = MockOrderService;
// Mock Menu Service
class MockMenuService {
    async getMenusByStore(storeId) {
        return mockData_1.mockMenus.filter(m => m.storeId === storeId);
    }
    async createMenu(input) {
        const menu = {
            menuId: (0, uuid_1.v4)(),
            storeId: input.storeId,
            menuName: input.menuName,
            price: input.price,
            description: input.description,
            category: input.category,
            imageUrl: input.imageUrl,
            isAvailable: true,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        mockData_1.mockMenus.push(menu);
        return menu;
    }
    async updateMenu(menuId, input) {
        const menu = mockData_1.mockMenus.find(m => m.menuId === menuId);
        if (!menu) {
            throw {
                code: 'NOT_FOUND',
                message: 'Menu not found',
                statusCode: 404
            };
        }
        Object.assign(menu, input, { updatedAt: Date.now() });
        return menu;
    }
    async deleteMenu(menuId) {
        const index = mockData_1.mockMenus.findIndex(m => m.menuId === menuId);
        if (index === -1) {
            throw {
                code: 'NOT_FOUND',
                message: 'Menu not found',
                statusCode: 404
            };
        }
        mockData_1.mockMenus.splice(index, 1);
        return { success: true };
    }
    async generateUploadUrl(storeId, fileName) {
        const key = `menus/${storeId}/${(0, uuid_1.v4)()}-${fileName}`;
        return {
            uploadUrl: `https://mock-s3.amazonaws.com/upload/${key}`,
            imageUrl: `https://mock-s3.amazonaws.com/${key}`
        };
    }
}
exports.MockMenuService = MockMenuService;
// Mock Table Service
class MockTableService {
    async completeSession(tableId, sessionId) {
        const table = mockData_1.mockTables.find(t => t.tableId === tableId);
        if (!table) {
            throw {
                code: 'NOT_FOUND',
                message: 'Table not found',
                statusCode: 404
            };
        }
        if (table.currentSessionId !== sessionId) {
            throw {
                code: 'INVALID_REQUEST',
                message: 'Invalid session ID',
                statusCode: 400
            };
        }
        // Move orders to history
        const sessionOrders = mockData_1.mockOrders.filter(o => o.tableId === tableId && o.sessionId === sessionId);
        sessionOrders.forEach(order => {
            mockData_1.mockOrderHistory.push({
                historyId: (0, uuid_1.v4)(),
                orderId: order.orderId,
                storeId: order.storeId,
                tableId: order.tableId,
                sessionId: order.sessionId,
                orderNumber: order.orderNumber,
                items: order.items,
                totalAmount: order.totalAmount,
                status: order.status,
                createdAt: order.createdAt,
                completedAt: order.updatedAt,
                archivedAt: Date.now()
            });
        });
        // Remove orders from active orders
        sessionOrders.forEach(order => {
            const index = mockData_1.mockOrders.findIndex(o => o.orderId === order.orderId);
            if (index !== -1) {
                mockData_1.mockOrders.splice(index, 1);
            }
        });
        // Reset table
        table.currentSessionId = (0, uuid_1.v4)();
        table.sessionStartTime = null;
        table.updatedAt = Date.now();
        return { success: true, archivedOrdersCount: sessionOrders.length };
    }
    async getOrderHistory(tableId, filters) {
        let history = mockData_1.mockOrderHistory.filter(h => h.tableId === tableId);
        // Apply date filters
        if (filters.startDate) {
            const startTime = new Date(filters.startDate).getTime();
            history = history.filter(h => h.archivedAt >= startTime);
        }
        if (filters.endDate) {
            const endTime = new Date(filters.endDate).getTime();
            history = history.filter(h => h.archivedAt <= endTime);
        }
        // Sort by archivedAt descending
        history.sort((a, b) => b.archivedAt - a.archivedAt);
        // Pagination
        const page = filters.page || 1;
        const pageSize = filters.pageSize || 20;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return {
            items: history.slice(startIndex, endIndex),
            total: history.length,
            page,
            pageSize
        };
    }
}
exports.MockTableService = MockTableService;
