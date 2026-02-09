# Customer Unit - Logical Components

## Overview
Customer Unit의 NFR 요구사항을 지원하는 논리적 컴포넌트를 정의합니다.

---

## 1. Backend Middleware Components

### 1.1 Authentication Middleware

**목적**: JWT 토큰 검증 및 인증

**위치**: `backend/middleware/authMiddleware.js`

**구현**:
```javascript
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: { message: '인증 토큰이 필요합니다', statusCode: 401 }
      });
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 요청 객체에 사용자 정보 추가
    req.user = {
      tableId: decoded.tableId,
      storeId: decoded.storeId,
      sessionId: decoded.sessionId
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: { message: '토큰이 만료되었습니다', statusCode: 401 }
      });
    }
    
    return res.status(401).json({
      error: { message: '유효하지 않은 토큰입니다', statusCode: 401 }
    });
  }
}

module.exports = authMiddleware;
```

**적용 라우트**:
```javascript
// routes/orderRoutes.js
const authMiddleware = require('../middleware/authMiddleware');

router.post('/api/orders', authMiddleware, orderController.createOrder);
router.get('/api/orders', authMiddleware, orderController.getOrders);
router.get('/api/orders/stream', authMiddleware, orderController.streamOrders);
```

### 1.2 Error Handling Middleware

**목적**: 전역 에러 처리

**위치**: `backend/middleware/errorMiddleware.js`

**구현**:
```javascript
function errorHandler(err, req, res, next) {
  // 에러 로깅
  console.error(`[${new Date().toISOString()}] [ERROR] [${req.method} ${req.path}]`, {
    message: err.message,
    stack: err.stack,
    body: req.body
  });

  // 상태 코드 결정
  const statusCode = err.statusCode || 500;

  // 사용자 친화적 메시지 변환
  let message = err.message;
  
  if (statusCode === 500) {
    message = '일시적인 오류가 발생했습니다. 다시 시도해주세요.';
  }

  // 에러 응답
  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = errorHandler;
```

**적용**:
```javascript
// app.js
const errorHandler = require('./middleware/errorMiddleware');

// 모든 라우트 정의 후 마지막에 추가
app.use(errorHandler);
```

### 1.3 Logging Middleware

**목적**: 요청/응답 로깅

**위치**: `backend/middleware/loggerMiddleware.js`

**구현**:
```javascript
function loggerMiddleware(req, res, next) {
  const start = Date.now();

  // 응답 완료 시 로깅
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    
    console.log(
      `[${timestamp}] [${req.method}] ${req.path} ` +
      `${res.statusCode} ${duration}ms`
    );
  });

  next();
}

module.exports = loggerMiddleware;
```

**적용**:
```javascript
// app.js
const loggerMiddleware = require('./middleware/loggerMiddleware');

app.use(loggerMiddleware);
```

### 1.4 CORS Middleware

**목적**: Cross-Origin 요청 허용

**위치**: `backend/middleware/corsMiddleware.js`

**구현**:
```javascript
const cors = require('cors');

const corsOptions = {
  origin: '*',  // 모든 도메인 허용 (초기 버전)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

module.exports = cors(corsOptions);
```

**적용**:
```javascript
// app.js
const corsMiddleware = require('./middleware/corsMiddleware');

app.use(corsMiddleware);
```

---

## 2. Frontend Utility Components

### 2.1 API Client

**목적**: 중앙 집중식 API 통신

**위치**: `frontend/shared/api/apiClient.js`

**구현**:
```javascript
import AuthService from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class ApiClient {
  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // 기본 헤더 설정
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // 인증 토큰 추가
    const accessToken = AuthService.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // 요청 옵션
    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);

      // 401 Unauthorized - 토큰 갱신 시도
      if (response.status === 401) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // 토큰 갱신 성공 - 원래 요청 재시도
          headers['Authorization'] = `Bearer ${AuthService.getAccessToken()}`;
          const retryResponse = await fetch(url, { ...config, headers });
          return await retryResponse.json();
        } else {
          // 토큰 갱신 실패 - 로그인 화면으로 이동
          AuthService.clearTokens();
          window.location.href = '/login';
          throw new Error('인증이 필요합니다');
        }
      }

      // 에러 응답
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '요청 실패');
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  static async refreshToken() {
    const refreshToken = AuthService.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        AuthService.setTokens(data.accessToken, data.refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  static get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  static post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  static put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  static delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export default ApiClient;
```

### 2.2 SWR Fetcher

**목적**: SWR 라이브러리용 fetcher 함수

**위치**: `frontend/shared/api/fetcher.js`

**구현**:
```javascript
import ApiClient from './apiClient';

async function fetcher(url) {
  return await ApiClient.get(url);
}

export default fetcher;
```

**사용 예시**:
```javascript
import useSWR from 'swr';
import fetcher from '../api/fetcher';

function useMenus(storeId, category) {
  const { data, error, isLoading } = useSWR(
    `/api/menus?storeId=${storeId}&category=${category}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000 // 5분 캐싱
    }
  );

  return { menus: data, isLoading, isError: error };
}
```

### 2.3 Auth Service

**목적**: 인증 관련 유틸리티

**위치**: `frontend/shared/utils/auth.js`

**구현**:
```javascript
class AuthService {
  static setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  static getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  static getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  static clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  static isAuthenticated() {
    return !!this.getAccessToken();
  }

  static setTableInfo(tableInfo) {
    localStorage.setItem('tableInfo', JSON.stringify(tableInfo));
  }

  static getTableInfo() {
    const info = localStorage.getItem('tableInfo');
    return info ? JSON.parse(info) : null;
  }

  static clearTableInfo() {
    localStorage.removeItem('tableInfo');
  }
}

export default AuthService;
```

### 2.4 Toast Service

**목적**: 사용자 피드백 메시지 표시

**위치**: `frontend/shared/utils/toast.js`

**구현**:
```javascript
import { toast } from 'react-toastify';

class ToastService {
  static success(message, options = {}) {
    toast.success(message, {
      position: 'top-center',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  static error(message, options = {}) {
    toast.error(message, {
      position: 'top-center',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  static info(message, options = {}) {
    toast.info(message, {
      position: 'top-center',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  static warning(message, options = {}) {
    toast.warning(message, {
      position: 'top-center',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }
}

export default ToastService;
```

### 2.5 Validation Service

**목적**: 프론트엔드 입력 검증

**위치**: `frontend/shared/utils/validation.js`

**구현**:
```javascript
class ValidationService {
  static validateOrder(order) {
    // 장바구니 비어있음
    if (!order.items || order.items.length === 0) {
      throw new Error('장바구니가 비어있습니다');
    }

    // 수량 검증
    order.items.forEach(item => {
      if (item.quantity < 1 || item.quantity > 99) {
        throw new Error('수량은 1~99 사이여야 합니다');
      }
    });

    // 총액 검증
    if (order.totalAmount <= 0) {
      throw new Error('주문 금액이 올바르지 않습니다');
    }

    return true;
  }

  static validateCartItem(item) {
    if (!item.menuId) {
      throw new Error('메뉴 ID가 필요합니다');
    }

    if (item.quantity < 1 || item.quantity > 99) {
      throw new Error('수량은 1~99 사이여야 합니다');
    }

    if (item.price <= 0) {
      throw new Error('가격이 올바르지 않습니다');
    }

    return true;
  }
}

export default ValidationService;
```

---

## 3. Frontend Error Boundary Components

### 3.1 Global Error Boundary

**목적**: 전역 에러 처리

**위치**: `frontend/shared/components/ErrorBoundary.jsx`

**구현**:
```javascript
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
    
    // 향후: Sentry 등 에러 추적 도구로 전송
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-content">
            <h1>⚠️ 문제가 발생했습니다</h1>
            <p>일시적인 오류가 발생했습니다. 페이지를 새로고침해주세요.</p>
            
            {process.env.NODE_ENV === 'development' && (
              <details>
                <summary>에러 상세 정보</summary>
                <pre>{this.state.error?.toString()}</pre>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </details>
            )}
            
            <button onClick={this.handleReset} className="reset-button">
              페이지 새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

**적용**:
```javascript
// App.jsx
import ErrorBoundary from './shared/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* 라우트 정의 */}
      </Routes>
    </ErrorBoundary>
  );
}
```

### 3.2 Component-Level Error Boundary

**목적**: 컴포넌트별 에러 격리

**위치**: `frontend/shared/components/ComponentErrorBoundary.jsx`

**구현**:
```javascript
import React from 'react';

class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="component-error">
          <p>이 컴포넌트를 로드하는 중 오류가 발생했습니다.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;
```

**적용**:
```javascript
// MenuList.jsx
import ComponentErrorBoundary from '../shared/components/ComponentErrorBoundary';

function MenuPage() {
  return (
    <div>
      <ComponentErrorBoundary>
        <MenuList />
      </ComponentErrorBoundary>
      
      <ComponentErrorBoundary>
        <Cart />
      </ComponentErrorBoundary>
    </div>
  );
}
```

---

## 4. State Management Components

### 4.1 Cart Store (Zustand)

**목적**: 장바구니 상태 관리

**위치**: `frontend/customer/stores/cartStore.js`

**구현**:
```javascript
import create from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],
  totalAmount: 0,

  // 장바구니에 아이템 추가
  addItem: (menu) => {
    const items = get().items;
    const existingItem = items.find(item => item.menuId === menu.menuId);

    if (existingItem) {
      // 기존 아이템 수량 증가
      set({
        items: items.map(item =>
          item.menuId === menu.menuId
            ? { ...item, quantity: Math.min(item.quantity + 1, 99) }
            : item
        )
      });
    } else {
      // 새 아이템 추가
      set({
        items: [...items, { ...menu, quantity: 1 }]
      });
    }

    // 총액 재계산
    get().calculateTotal();
  },

  // 아이템 수량 증가
  incrementQuantity: (menuId) => {
    set({
      items: get().items.map(item =>
        item.menuId === menuId
          ? { ...item, quantity: Math.min(item.quantity + 1, 99) }
          : item
      )
    });
    get().calculateTotal();
  },

  // 아이템 수량 감소
  decrementQuantity: (menuId) => {
    const items = get().items;
    const item = items.find(i => i.menuId === menuId);

    if (item && item.quantity === 1) {
      // 수량이 1이면 삭제
      get().removeItem(menuId);
    } else {
      set({
        items: items.map(i =>
          i.menuId === menuId
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
      });
      get().calculateTotal();
    }
  },

  // 아이템 삭제
  removeItem: (menuId) => {
    set({
      items: get().items.filter(item => item.menuId !== menuId)
    });
    get().calculateTotal();
  },

  // 장바구니 비우기
  clearCart: () => {
    set({ items: [], totalAmount: 0 });
  },

  // 총액 계산
  calculateTotal: () => {
    const total = get().items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    set({ totalAmount: total });
  },

  // LocalStorage에 저장
  saveToLocalStorage: () => {
    const { items, totalAmount } = get();
    localStorage.setItem('cart', JSON.stringify({ items, totalAmount }));
  },

  // LocalStorage에서 로드
  loadFromLocalStorage: () => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      const { items, totalAmount } = JSON.parse(saved);
      set({ items, totalAmount });
    }
  }
}));

export default useCartStore;
```

---

## 5. Infrastructure Components

### 5.1 DynamoDB Client

**목적**: DynamoDB 데이터 접근

**위치**: `backend/utils/dynamodbClient.js`

**구현**:
```javascript
const AWS = require('aws-sdk');

// DynamoDB 클라이언트 설정
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

class DynamoDBClient {
  static async get(tableName, key) {
    const params = {
      TableName: tableName,
      Key: key
    };

    const result = await dynamodb.get(params).promise();
    return result.Item;
  }

  static async put(tableName, item) {
    const params = {
      TableName: tableName,
      Item: item
    };

    await dynamodb.put(params).promise();
    return item;
  }

  static async query(tableName, keyCondition, expressionAttributeValues) {
    const params = {
      TableName: tableName,
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: expressionAttributeValues
    };

    const result = await dynamodb.query(params).promise();
    return result.Items;
  }

  static async scan(tableName, filterExpression, expressionAttributeValues) {
    const params = {
      TableName: tableName
    };

    if (filterExpression) {
      params.FilterExpression = filterExpression;
      params.ExpressionAttributeValues = expressionAttributeValues;
    }

    const result = await dynamodb.scan(params).promise();
    return result.Items;
  }

  static async delete(tableName, key) {
    const params = {
      TableName: tableName,
      Key: key
    };

    await dynamodb.delete(params).promise();
  }

  static async update(tableName, key, updateExpression, expressionAttributeValues) {
    const params = {
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.update(params).promise();
    return result.Attributes;
  }
}

module.exports = DynamoDBClient;
```

### 5.2 SSE Service

**목적**: Server-Sent Events 관리

**위치**: `backend/services/sseService.js`

**구현**:
```javascript
const EventEmitter = require('events');

class SSEService extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map();
  }

  addClient(clientId, res) {
    // SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 클라이언트 저장
    this.clients.set(clientId, res);

    // 연결 종료 시 클라이언트 제거
    res.on('close', () => {
      this.clients.delete(clientId);
    });
  }

  sendEvent(clientId, eventName, data) {
    const client = this.clients.get(clientId);
    if (client) {
      client.write(`event: ${eventName}\n`);
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }

  broadcast(eventName, data) {
    this.clients.forEach((client) => {
      client.write(`event: ${eventName}\n`);
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    });
  }
}

module.exports = new SSEService();
```

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: 생성 완료
