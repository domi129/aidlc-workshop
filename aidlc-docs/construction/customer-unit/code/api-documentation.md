# Customer Unit - API Documentation

## Base URL
```
https://{api-gateway-id}.execute-api.ap-northeast-2.amazonaws.com/prod
```

## Authentication
모든 보호된 엔드포인트는 JWT 토큰이 필요합니다.

**Header**:
```
Authorization: Bearer {access_token}
```

---

## REST API Endpoints

### 1. 테이블 로그인
**Endpoint**: `POST /auth/table-login`

**Request Body**:
```json
{
  "storeId": "store-001",
  "tableNumber": "1",
  "tablePassword": "1234"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "tableId": "table-001",
  "storeId": "store-001",
  "tableNumber": "1",
  "sessionId": "session-1707484800"
}
```

**User Story**: US-001 (테이블 자동 로그인)

---

### 2. 토큰 갱신
**Endpoint**: `POST /auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### 3. 메뉴 조회
**Endpoint**: `GET /menus`

**Query Parameters**:
- `storeId` (required): 매장 ID
- `category` (optional): 카테고리 ("전체", "메인", "사이드", "음료")

**Response** (200 OK):
```json
[
  {
    "PK": "MENU#menu-001",
    "SK": "METADATA",
    "menuId": "menu-001",
    "storeId": "store-001",
    "menuName": "김치찌개",
    "price": 8000,
    "description": "얼큰한 김치찌개",
    "imageUrl": "https://...",
    "category": "메인",
    "displayOrder": 1,
    "isAvailable": true
  }
]
```

**User Story**: US-002 (메뉴 조회 및 필터링)

---

### 4. 주문 생성
**Endpoint**: `POST /orders`

**Request Body**:
```json
{
  "storeId": "store-001",
  "tableId": "table-001",
  "sessionId": "session-1707484800",
  "items": [
    {
      "menuId": "menu-001",
      "quantity": 2,
      "price": 8000
    }
  ],
  "totalAmount": 16000
}
```

**Response** (201 Created):
```json
{
  "orderId": "order-uuid",
  "orderNumber": "20260209-001",
  "createdAt": "2026-02-09T13:30:00Z"
}
```

**User Story**: US-004 (주문 생성)

---

### 5. 주문 내역 조회
**Endpoint**: `GET /orders`

**Query Parameters**:
- `tableId` (required): 테이블 ID
- `sessionId` (required): 세션 ID

**Response** (200 OK):
```json
[
  {
    "PK": "ORDER#order-uuid",
    "SK": "METADATA",
    "orderId": "order-uuid",
    "orderNumber": "20260209-001",
    "storeId": "store-001",
    "tableId": "table-001",
    "sessionId": "session-1707484800",
    "items": [
      {
        "menuId": "menu-001",
        "quantity": 2,
        "price": 8000
      }
    ],
    "totalAmount": 16000,
    "status": "pending",
    "createdAt": "2026-02-09T13:30:00Z",
    "updatedAt": "2026-02-09T13:30:00Z"
  }
]
```

**User Story**: US-005 (주문 내역 조회)

---

## WebSocket API

### Base URL
```
wss://{websocket-api-id}.execute-api.ap-northeast-2.amazonaws.com/prod
```

### Connection
**Endpoint**: `$connect`

**Query Parameters**:
- `token`: JWT access token

**Example**:
```javascript
const ws = new WebSocket(`wss://...?token=${accessToken}`);
```

---

### Messages

#### Client → Server (Ping)
```json
{
  "action": "ping"
}
```

#### Server → Client (Pong)
```json
{
  "action": "pong",
  "timestamp": "2026-02-09T13:30:00Z"
}
```

#### Server → Client (Order Status Changed)
```json
{
  "action": "orderStatusChanged",
  "data": {
    "orderId": "order-uuid",
    "status": "preparing",
    "updatedAt": "2026-02-09T13:30:00Z"
  }
}
```

**User Story**: US-006 (실시간 주문 상태 업데이트)

---

## Error Responses

### 400 Bad Request
```json
{
  "error": {
    "message": "Missing required fields",
    "statusCode": 400,
    "timestamp": "2026-02-09T13:30:00Z"
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "message": "Invalid or expired token",
    "statusCode": 401,
    "timestamp": "2026-02-09T13:30:00Z"
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "message": "Resource not found",
    "statusCode": 404,
    "timestamp": "2026-02-09T13:30:00Z"
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "message": "Internal server error",
    "statusCode": 500,
    "timestamp": "2026-02-09T13:30:00Z"
  }
}
```

---

## Rate Limiting
- API Gateway Throttling: 1000 requests/second
- Burst Limit: 2000 requests

## CORS
- Allowed Origins: `*` (모든 도메인)
- Allowed Methods: `GET, POST, PUT, DELETE, OPTIONS`
- Allowed Headers: `Content-Type, Authorization`

---

**문서 버전**: 1.0  
**작성일**: 2026-02-09
