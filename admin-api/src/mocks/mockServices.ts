import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import SharedMockData from './sharedMockData';

const JWT_SECRET = process.env.JWT_SECRET || 'local-test-secret-key';

// In-memory session storage (not persisted to file)
const mockSessions = new Map<string, any>();

// Mock Auth Service
export class MockAuthService {
  async login(username: string, password: string, storeId: string) {
    const admin = SharedMockData.getAdmin(username, storeId);

    if (!admin) {
      throw {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password',
        statusCode: 401
      };
    }

    // For mock, accept any password (in real app, use bcrypt.compare)
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

      const admins = SharedMockData.getAdmins();
      const admin = admins.find(a => a.adminId === decoded.adminId);
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
    return SharedMockData.getOrders(storeId);
  }

  async updateOrderStatus(orderId: string, status: string) {
    const order = SharedMockData.getOrder(orderId);
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

    const updatedOrder = SharedMockData.updateOrder(orderId, { status });
    return updatedOrder;
  }

  async deleteOrder(orderId: string) {
    const order = SharedMockData.getOrder(orderId);
    if (!order) {
      throw {
        code: 'NOT_FOUND',
        message: 'Order not found',
        statusCode: 404
      };
    }

    if (order.status !== 'PENDING') {
      throw {
        code: 'INVALID_REQUEST',
        message: 'Only PENDING orders can be deleted',
        statusCode: 400
      };
    }

    SharedMockData.deleteOrder(orderId);
    return { success: true };
  }
}

// Mock Menu Service
export class MockMenuService {
  async getMenusByStore(storeId: string) {
    return SharedMockData.getMenus(storeId);
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
      isAvailable: input.isAvailable !== undefined ? input.isAvailable : true,
      displayOrder: input.displayOrder || 999,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return SharedMockData.addMenu(menu);
  }

  async updateMenu(menuId: string, input: any) {
    const menu = SharedMockData.getMenu(menuId);
    if (!menu) {
      throw {
        code: 'NOT_FOUND',
        message: 'Menu not found',
        statusCode: 404
      };
    }

    const updatedMenu = SharedMockData.updateMenu(menuId, { ...input, updatedAt: Date.now() });
    return updatedMenu;
  }

  async deleteMenu(menuId: string) {
    const menu = SharedMockData.getMenu(menuId);
    if (!menu) {
      throw {
        code: 'NOT_FOUND',
        message: 'Menu not found',
        statusCode: 404
      };
    }

    SharedMockData.deleteMenu(menuId);
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
    const table = SharedMockData.getTable(tableId);
    if (!table) {
      throw {
        code: 'NOT_FOUND',
        message: 'Table not found',
        statusCode: 404
      };
    }

    // For mock, we'll just mark orders as completed
    const orders = SharedMockData.getOrders();
    const sessionOrders = orders.filter(
      o => o.tableId === tableId && o.sessionId === sessionId
    );

    let archivedCount = 0;
    sessionOrders.forEach(order => {
      if (order.status !== 'COMPLETED') {
        SharedMockData.updateOrder(order.orderId, { status: 'COMPLETED' });
      }
      archivedCount++;
    });

    return { success: true, archivedOrdersCount: archivedCount };
  }

  async getOrderHistory(tableId: string, filters: any) {
    // Get all orders for the table (no separate history in mock mode)
    let orders = SharedMockData.getOrders();
    let history = orders.filter(o => o.tableId === tableId);

    // Apply date filters
    if (filters.startDate) {
      const startTime = new Date(filters.startDate).getTime();
      history = history.filter(h => h.createdAt >= startTime);
    }

    if (filters.endDate) {
      const endTime = new Date(filters.endDate).getTime();
      history = history.filter(h => h.createdAt <= endTime);
    }

    // Sort by createdAt descending
    history.sort((a, b) => b.createdAt - a.createdAt);

    // Pagination
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Transform to match expected format
    const items = history.slice(startIndex, endIndex).map(order => ({
      historyId: order.orderId, // Use orderId as historyId in mock mode
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      tableId: order.tableId,
      sessionId: order.sessionId,
      items: order.items,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt,
      archivedAt: order.updatedAt || order.createdAt // Use updatedAt as archivedAt
    }));

    return {
      items,
      total: history.length,
      page,
      pageSize
    };
  }
}
