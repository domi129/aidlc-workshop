# Unit Test Instructions - Admin Unit

## Overview

**Note**: Standard code generation was used (no TDD). Unit tests were not generated during code generation phase per NFR requirements (No tests - MVP).

---

## Testing Strategy for MVP

Since this is an MVP with "No tests" requirement, unit testing is **optional**. However, if you want to add basic tests for critical paths, follow these guidelines.

---

## Manual Testing Approach (Recommended for MVP)

### 1. Test Authentication Service

**Test Login**:
```bash
# Using curl or Postman
curl -X POST https://api-gateway-url/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin1",
    "password": "password123",
    "storeId": "store-001"
  }'
```

**Expected Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "adminId": "uuid",
    "username": "admin1",
    "storeId": "store-001",
    "role": "Admin"
  },
  "expiresAt": 1707494400000
}
```

**Test Cases**:
- ✅ Valid credentials → Success
- ❌ Invalid username → 401 Unauthorized
- ❌ Invalid password → 401 Unauthorized
- ❌ Missing fields → 400 Bad Request

---

### 2. Test Order Service

**Test Get Orders**:
```bash
curl -X GET https://api-gateway-url/orders \
  -H "Authorization: Bearer <token>"
```

**Expected Response**:
```json
[
  {
    "orderId": "uuid",
    "orderNumber": 1,
    "tableNumber": "T1",
    "items": [...],
    "totalAmount": 25000,
    "status": "PENDING",
    "createdAt": 1707494400000
  }
]
```

**Test Update Order Status**:
```bash
curl -X PATCH https://api-gateway-url/orders/<orderId>/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "PREPARING"}'
```

**Test Cases**:
- ✅ PENDING → PREPARING → Success
- ✅ PREPARING → COMPLETED → Success
- ❌ PENDING → COMPLETED → 400 Bad Request (invalid transition)
- ❌ Delete PREPARING order → 400 Bad Request (only PENDING can be deleted)

---

### 3. Test Table Service

**Test Complete Session**:
```bash
curl -X POST https://api-gateway-url/tables/<tableId>/complete \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session-uuid"}'
```

**Expected**: Orders moved to OrderHistory, table reset.

**Test Get History**:
```bash
curl -X GET "https://api-gateway-url/tables/<tableId>/history?page=1&pageSize=20" \
  -H "Authorization: Bearer <token>"
```

---

### 4. Test Menu Service

**Test Create Menu**:
```bash
curl -X POST https://api-gateway-url/menus \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "menuName": "김치찌개",
    "price": 8000,
    "description": "얼큰한 김치찌개",
    "category": "MAIN"
  }'
```

**Test Generate Upload URL**:
```bash
curl -X POST https://api-gateway-url/menus/upload-url \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"fileName": "kimchi-jjigae.jpg"}'
```

---

## Automated Unit Tests (Optional)

If you want to add unit tests, create test files:

### Setup Testing Framework

```bash
npm install --save-dev jest @types/jest ts-jest
```

**jest.config.js**:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/']
};
```

### Example Test: AuthService

**src/services/__tests__/authService.test.ts**:
```typescript
import { AuthService } from '../authService';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('login', () => {
    it('should return token for valid credentials', async () => {
      // Mock DynamoDB and bcrypt
      // Test implementation
    });

    it('should throw 401 for invalid credentials', async () => {
      // Test implementation
    });
  });
});
```

### Run Tests

```bash
npm test
```

---

## Test Coverage Goals (If Implementing Tests)

- **Critical Paths**: 80%+ coverage
  - Authentication (login, token verification)
  - Order state transitions
  - RBAC authorization checks

- **Business Logic**: 70%+ coverage
  - Services layer
  - Validation logic

- **Data Access**: 50%+ coverage
  - Repositories (basic CRUD)

---

## Manual Test Checklist

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Token refresh
- [ ] Expired token handling

### Authorization
- [ ] Admin role can delete orders
- [ ] Manager role cannot delete orders
- [ ] Viewer role cannot modify orders

### Order Management
- [ ] Get orders by store
- [ ] Update order status (valid transitions)
- [ ] Invalid state transitions rejected
- [ ] Delete PENDING order
- [ ] Cannot delete PREPARING/COMPLETED orders

### Table Management
- [ ] Complete table session
- [ ] Orders moved to history
- [ ] Table reset after completion
- [ ] Get order history with pagination

### Menu Management
- [ ] Create menu
- [ ] Update menu
- [ ] Delete menu
- [ ] Generate S3 upload URL
- [ ] Upload image to S3

---

## Test Results

**Manual Testing**: ✅ Recommended for MVP
**Automated Testing**: ⚪ Optional (not required per NFR)

---

## Next Steps

1. Complete manual testing checklist
2. Document any issues found
3. Fix critical bugs
4. Proceed to Integration Tests

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: Unit Test Instructions 완료 (Manual Testing Focus)
