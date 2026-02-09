// Mock data for local testing without AWS resources

export const mockAdmins = [
  {
    adminId: 'admin-001',
    storeId: 'store-001',
    username: 'admin1',
    // Password: "password123" hashed with bcrypt
    passwordHash: '$2b$10$rXK5Z5Z5Z5Z5Z5Z5Z5Z5ZuqK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
    role: 'Admin',
    createdAt: Date.now()
  },
  {
    adminId: 'admin-002',
    storeId: 'store-001',
    username: 'manager1',
    passwordHash: '$2b$10$rXK5Z5Z5Z5Z5Z5Z5Z5Z5ZuqK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
    role: 'Manager',
    createdAt: Date.now()
  }
];

export const mockSessions = new Map<string, any>();

export const mockOrders = [
  {
    orderId: 'order-001',
    storeId: 'store-001',
    tableId: 'table-001',
    sessionId: 'session-001',
    orderNumber: 1,
    items: [
      {
        menuId: 'menu-001',
        menuName: '김치찌개',
        quantity: 2,
        unitPrice: 8000,
        subtotal: 16000
      }
    ],
    totalAmount: 16000,
    status: 'PENDING',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000
  },
  {
    orderId: 'order-002',
    storeId: 'store-001',
    tableId: 'table-002',
    sessionId: 'session-002',
    orderNumber: 2,
    items: [
      {
        menuId: 'menu-002',
        menuName: '된장찌개',
        quantity: 1,
        unitPrice: 7000,
        subtotal: 7000
      },
      {
        menuId: 'menu-003',
        menuName: '제육볶음',
        quantity: 1,
        unitPrice: 9000,
        subtotal: 9000
      }
    ],
    totalAmount: 16000,
    status: 'PREPARING',
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 1800000
  },
  {
    orderId: 'order-003',
    storeId: 'store-001',
    tableId: 'table-003',
    sessionId: 'session-003',
    orderNumber: 3,
    items: [
      {
        menuId: 'menu-001',
        menuName: '김치찌개',
        quantity: 1,
        unitPrice: 8000,
        subtotal: 8000
      }
    ],
    totalAmount: 8000,
    status: 'COMPLETED',
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 3600000
  }
];

export const mockMenus = [
  {
    menuId: 'menu-001',
    storeId: 'store-001',
    menuName: '김치찌개',
    price: 8000,
    description: '얼큰한 김치찌개',
    category: 'MAIN',
    imageUrl: 'https://example.com/kimchi-jjigae.jpg',
    isAvailable: true,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000
  },
  {
    menuId: 'menu-002',
    storeId: 'store-001',
    menuName: '된장찌개',
    price: 7000,
    description: '구수한 된장찌개',
    category: 'MAIN',
    imageUrl: 'https://example.com/doenjang-jjigae.jpg',
    isAvailable: true,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000
  },
  {
    menuId: 'menu-003',
    storeId: 'store-001',
    menuName: '제육볶음',
    price: 9000,
    description: '매콤한 제육볶음',
    category: 'MAIN',
    isAvailable: true,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000
  }
];

export const mockTables = [
  {
    tableId: 'table-001',
    storeId: 'store-001',
    tableNumber: 'T1',
    currentSessionId: 'session-001',
    sessionStartTime: Date.now() - 3600000,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000
  },
  {
    tableId: 'table-002',
    storeId: 'store-001',
    tableNumber: 'T2',
    currentSessionId: 'session-002',
    sessionStartTime: Date.now() - 1800000,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 1800000
  }
];

export const mockOrderHistory: any[] = [];
