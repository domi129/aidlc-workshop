const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const SharedMockData = require('./shared/utils/sharedMockData');

const app = express();
const PORT = 3000;

const JWT_SECRET = 'local-test-secret-key';
const JWT_ACCESS_EXPIRATION = '16h';

// Middleware
app.use(cors());
app.use(express.json());

console.log('🚀 Customer Backend starting...');
console.log('📁 Using shared mock data file');

// Auth - Table Login
app.post('/auth/table-login', (req, res) => {
  const { storeId, tableNumber, password } = req.body;
  
  const table = SharedMockData.getTable(tableNumber);
  
  if (!table || table.storeId !== storeId || table.tablePassword !== password) {
    return res.status(401).json({ error: { message: '테이블 정보가 올바르지 않습니다' } });
  }
  
  const sessionId = uuidv4();
  const token = jwt.sign(
    { tableId: tableNumber, storeId, sessionId },
    JWT_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRATION }
  );
  
  res.json({
    token,
    tableInfo: {
      tableId: tableNumber,
      storeId,
      sessionId
    },
    expiresAt: new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString()
  });
});

// Menus - Get all menus
app.get('/menus', (req, res) => {
  const { storeId, category } = req.query;
  const menus = SharedMockData.getMenus(storeId, category);
  res.json(menus);
});

// Orders - Create order
app.post('/orders', (req, res) => {
  const { storeId, tableId, sessionId, items, totalAmount } = req.body;
  
  // Verify menu availability and prices
  for (const item of items) {
    const menu = SharedMockData.getMenu(item.menuId);
    
    // Check if menu exists
    if (!menu) {
      return res.status(400).json({ 
        error: { 
          message: `'${item.menuName}' 메뉴는 판매가 종료되었습니다. 장바구니를 새로고침해주세요.` 
        } 
      });
    }
    
    // Check if menu is available
    if (!menu.isAvailable) {
      return res.status(400).json({ 
        error: { 
          message: `'${menu.menuName}' 메뉴는 현재 품절입니다.` 
        } 
      });
    }
    
    // Check price match
    if (menu.price !== item.price) {
      return res.status(400).json({ 
        error: { 
          message: `'${menu.menuName}' 메뉴의 가격이 변경되었습니다. 장바구니를 새로고침해주세요.` 
        } 
      });
    }
  }
  
  const orderId = uuidv4();
  const orderNumber = Date.now() % 10000;
  
  const order = {
    orderId,
    orderNumber,
    storeId,
    tableId,
    sessionId,
    items: items.map(item => {
      const menu = SharedMockData.getMenu(item.menuId);
      return {
        menuId: item.menuId,
        menuName: menu.menuName,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.quantity * item.price
      };
    }),
    totalAmount,
    status: 'PENDING',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  SharedMockData.addOrder(order);
  
  res.status(201).json({
    orderId,
    orderNumber,
    createdAt: new Date(order.createdAt).toISOString()
  });
});

// Orders - Get orders for table
app.get('/orders', (req, res) => {
  const { tableId, sessionId } = req.query;
  
  let orders = SharedMockData.getOrders();
  
  if (tableId) {
    orders = orders.filter(o => o.tableId === tableId);
  }
  
  if (sessionId) {
    orders = orders.filter(o => o.sessionId === sessionId);
  }
  
  res.json(orders);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Customer Backend is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Customer Backend running on http://localhost:${PORT}`);
  console.log(`📊 Menus: ${SharedMockData.getMenus().length}`);
  console.log(`📋 Orders: ${SharedMockData.getOrders().length}`);
});
