import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import {
  mockAdmins,
  mockSessions,
  mockOrders,
  mockMenus,
  mockTables,
  mockOrderHistory
} from './mockData';

const JWT_SECRET = process.env.JWT_SECRET || 'local-test-secret-key';

// Mock Auth Service
export class MockAuthService {
  async login(username: string, password: string, storeId: string) {
    const admin = mockAdmins.find(
      a => a.username === username && a.storeId === storeId
    );

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

    const sessionId = uuidv4();
    const expiresAt = Date.now() + 16 * 60 * 60 * 1000; // 16 hours

    mockSessions.set(sessionId, {
      sessionId,
      adminId: admin.adminId,
      storeId: admin.storeId,
      expiresAt,
      createdAt: Date.now()
    });

    const token = jwt.sign(
      {
        adminId: admin.adminId,
        storeId: admin.storeId,
        sessionId,
        role: admin.role
      },
      JWT_SECRET,
      { expiresIn: '16h' }
    );

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

  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const session = mockSessions.get(decoded.sessionId);

      if (!session || session.expiresAt < Date.now()) {
        throw new Error('Invalid or expired session');
      }

      const admin = mockAdmins.find(a => a.adminId === decoded.adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      return {
        adminId: admin.adminId,
        username: admin.username,
        storeId: admin.storeId,
        role: admin.role
      };
    } catch (error) {
      throw {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
        statusCode: 401
      };
    }
  }
}

// Mock Order Service
export class MockOrderService {
  async getOrdersByStore(storeId: string) {
    return mockOrders.filter(o => o.storeId === storeId);
  }

  async updateOrderStatus(orderId: string, status: string) {
    const order = mockOrders.find(o => o.orderId === orderId);
    if (!order) {
      throw {
        code: 'NOT_FOUND',
        message: 'Order not found',
        statusCode: 404
      };
    }

    // Validate state transition
    const validTransitions: { [key: string]: string[] } = {
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

  async deleteOrder(orderId: string) {
    const index = mockOrders.findIndex(o => o.orderId === orderId);
    if (index === -1) {
      throw {
        code: 'NOT_FOUND',
        message: 'Order not found',
        statusCode: 404
      };
    }

    const order = mockOrders[index];
    if (order.status !== 'PENDING') {
      throw {
        code: 'INVALID_REQUEST',
        message: 'Only PENDING orders can be deleted',
        statusCode: 400
      };
    }

    mockOrders.splice(index, 1);
    return { success: true };
  }
}

// Mock Menu Service
export class MockMenuService {
  async getMenusByStore(storeId: string) {
    return mockMenus.filter(m => m.storeId === storeId);
  }

  async createMenu(input: any) {
    const menu = {
      menuId: uuidv4(),
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

    mockMenus.push(menu);
    return menu;
  }

  async updateMenu(menuId: string, input: any) {
    const menu = mockMenus.find(m => m.menuId === menuId);
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

  async deleteMenu(menuId: string) {
    const index = mockMenus.findIndex(m => m.menuId === menuId);
    if (index === -1) {
      throw {
        code: 'NOT_FOUND',
        message: 'Menu not found',
        statusCode: 404
      };
    }

    mockMenus.splice(index, 1);
    return { success: true };
  }

  async generateUploadUrl(storeId: string, fileName: string) {
    const key = `menus/${storeId}/${uuidv4()}-${fileName}`;
    return {
      uploadUrl: `https://mock-s3.amazonaws.com/upload/${key}`,
      imageUrl: `https://mock-s3.amazonaws.com/${key}`
    };
  }
}

// Mock Table Service
export class MockTableService {
  async completeSession(tableId: string, sessionId: string) {
    const table = mockTables.find(t => t.tableId === tableId);
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
    const sessionOrders = mockOrders.filter(
      o => o.tableId === tableId && o.sessionId === sessionId
    );

    sessionOrders.forEach(order => {
      mockOrderHistory.push({
        historyId: uuidv4(),
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
      const index = mockOrders.findIndex(o => o.orderId === order.orderId);
      if (index !== -1) {
        mockOrders.splice(index, 1);
      }
    });

    // Reset table
    table.currentSessionId = uuidv4();
    table.sessionStartTime = null as any;
    table.updatedAt = Date.now();

    return { success: true, archivedOrdersCount: sessionOrders.length };
  }

  async getOrderHistory(tableId: string, filters: any) {
    let history = mockOrderHistory.filter(h => h.tableId === tableId);

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
