# Unit Test Instructions - Customer Unit

## 개요

Customer Unit의 Frontend와 Backend에 대한 단위 테스트 실행 지침입니다.

**참고**: 현재 프로젝트는 Standard 코드 생성 방식을 사용했으므로, 테스트 코드는 별도로 작성해야 합니다.

---

## 1. Frontend 단위 테스트

### 1.1 테스트 프레임워크 설치

```bash
cd frontend
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### 1.2 Vitest 설정

`vite.config.js`에 테스트 설정 추가:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.js'
      ]
    }
  }
});
```

### 1.3 테스트 설정 파일

`src/test/setup.js`:

```javascript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

afterEach(() => {
  cleanup();
});
```

### 1.4 테스트 작성 예시

#### 1.4.1 Utility 함수 테스트

`src/shared/utils/validation.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import ValidationService from './validation';

describe('ValidationService', () => {
  describe('validateTableNumber', () => {
    it('should return true for valid table number', () => {
      expect(ValidationService.validateTableNumber('T001')).toBe(true);
      expect(ValidationService.validateTableNumber('T999')).toBe(true);
    });

    it('should return false for invalid table number', () => {
      expect(ValidationService.validateTableNumber('')).toBe(false);
      expect(ValidationService.validateTableNumber('ABC')).toBe(false);
      expect(ValidationService.validateTableNumber('T')).toBe(false);
    });
  });

  describe('validateQRCode', () => {
    it('should return true for valid QR code format', () => {
      const validQR = 'STORE123_TABLE001_SESSION456';
      expect(ValidationService.validateQRCode(validQR)).toBe(true);
    });

    it('should return false for invalid QR code format', () => {
      expect(ValidationService.validateQRCode('')).toBe(false);
      expect(ValidationService.validateQRCode('INVALID')).toBe(false);
    });
  });
});
```

#### 1.4.2 Store 테스트

`src/customer/stores/cartStore.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import useCartStore from './cartStore';

describe('cartStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCartStore.setState({
      items: [],
      totalAmount: 0,
      totalQuantity: 0
    });
  });

  it('should add item to cart', () => {
    const { addItem } = useCartStore.getState();
    
    addItem({
      menuId: 'MENU001',
      menuName: '김치찌개',
      price: 8000,
      quantity: 1
    });

    const { items, totalAmount, totalQuantity } = useCartStore.getState();
    
    expect(items).toHaveLength(1);
    expect(items[0].menuId).toBe('MENU001');
    expect(totalAmount).toBe(8000);
    expect(totalQuantity).toBe(1);
  });

  it('should increase quantity if item already exists', () => {
    const { addItem } = useCartStore.getState();
    
    const item = {
      menuId: 'MENU001',
      menuName: '김치찌개',
      price: 8000,
      quantity: 1
    };

    addItem(item);
    addItem(item);

    const { items, totalAmount, totalQuantity } = useCartStore.getState();
    
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
    expect(totalAmount).toBe(16000);
    expect(totalQuantity).toBe(2);
  });

  it('should remove item from cart', () => {
    const { addItem, removeItem } = useCartStore.getState();
    
    addItem({
      menuId: 'MENU001',
      menuName: '김치찌개',
      price: 8000,
      quantity: 1
    });

    removeItem('MENU001');

    const { items, totalAmount, totalQuantity } = useCartStore.getState();
    
    expect(items).toHaveLength(0);
    expect(totalAmount).toBe(0);
    expect(totalQuantity).toBe(0);
  });

  it('should clear cart', () => {
    const { addItem, clearCart } = useCartStore.getState();
    
    addItem({
      menuId: 'MENU001',
      menuName: '김치찌개',
      price: 8000,
      quantity: 1
    });

    clearCart();

    const { items, totalAmount, totalQuantity } = useCartStore.getState();
    
    expect(items).toHaveLength(0);
    expect(totalAmount).toBe(0);
    expect(totalQuantity).toBe(0);
  });
});
```

#### 1.4.3 Component 테스트

`src/shared/components/Loading.test.jsx`:

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from './Loading';

describe('Loading Component', () => {
  it('should render loading spinner', () => {
    render(<Loading />);
    
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<Loading message="데이터를 불러오는 중..." />);
    
    const message = screen.getByText('데이터를 불러오는 중...');
    expect(message).toBeInTheDocument();
  });
});
```

`src/customer/pages/LoginPage.test.jsx`:

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import AuthService from '../../shared/utils/auth';

vi.mock('../../shared/utils/auth');

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('테이블 로그인')).toBeInTheDocument();
    expect(screen.getByLabelText('테이블 번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('should handle QR code login', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      accessToken: 'token123',
      tableInfo: { tableId: 'T001' }
    });
    AuthService.loginWithQRCode = mockLogin;

    // Mock URL with QR code
    delete window.location;
    window.location = { search: '?qr=STORE123_TABLE001_SESSION456' };

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('STORE123_TABLE001_SESSION456');
    });
  });

  it('should handle manual table number login', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockResolvedValue({
      accessToken: 'token123',
      tableInfo: { tableId: 'T001' }
    });
    AuthService.loginWithTableNumber = mockLogin;

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const input = screen.getByLabelText('테이블 번호');
    const button = screen.getByRole('button', { name: '로그인' });

    await user.type(input, 'T001');
    await user.click(button);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('T001');
    });
  });

  it('should show error message on login failure', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid table number'));
    AuthService.loginWithTableNumber = mockLogin;

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const input = screen.getByLabelText('테이블 번호');
    const button = screen.getByRole('button', { name: '로그인' });

    await user.type(input, 'INVALID');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/로그인 실패/i)).toBeInTheDocument();
    });
  });
});
```

### 1.5 테스트 실행

```bash
# 모든 테스트 실행
npm test

# Watch 모드로 실행
npm test -- --watch

# 커버리지 리포트 생성
npm test -- --coverage

# 특정 파일만 테스트
npm test -- validation.test.js
```

### 1.6 예상 결과

```
✓ src/shared/utils/validation.test.js (8 tests) 45ms
✓ src/customer/stores/cartStore.test.js (4 tests) 32ms
✓ src/shared/components/Loading.test.jsx (2 tests) 28ms
✓ src/customer/pages/LoginPage.test.jsx (4 tests) 156ms

Test Files  4 passed (4)
     Tests  18 passed (18)
  Start at  14:30:00
  Duration  1.2s

 % Coverage report from v8
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   85.2  |   78.5   |   90.1  |   85.2  |
 utils/             |   92.3  |   88.2   |   95.0  |   92.3  |
  validation.js     |   95.0  |   90.0   |  100.0  |   95.0  | 45-47
  auth.js           |   88.5  |   85.0   |   90.0  |   88.5  | 78-82, 95
 stores/            |   88.0  |   82.0   |   92.0  |   88.0  |
  cartStore.js      |   88.0  |   82.0   |   92.0  |   88.0  | 56-58
--------------------|---------|----------|---------|---------|-------------------
```

---

## 2. Backend 단위 테스트

### 2.1 테스트 프레임워크 설치

각 Lambda 함수 디렉토리에서:

```bash
cd backend/functions/auth
npm install --save-dev jest aws-sdk-mock
```

### 2.2 Jest 설정

`backend/functions/auth/jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.js'
  ],
  testMatch: ['**/*.test.js']
};
```

### 2.3 테스트 작성 예시

#### 2.3.1 Utility 함수 테스트

`backend/shared/utils/jwtUtils.test.js`:

```javascript
const JWTUtils = require('./jwtUtils');

describe('JWTUtils', () => {
  const testPayload = {
    tableId: 'T001',
    storeId: 'STORE123',
    sessionId: 'SESSION456'
  };

  describe('generateAccessToken', () => {
    it('should generate valid access token', () => {
      const token = JWTUtils.generateAccessToken(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });

    it('should include payload data in token', () => {
      const token = JWTUtils.generateAccessToken(testPayload);
      const decoded = JWTUtils.verifyAccessToken(token);
      
      expect(decoded.tableId).toBe(testPayload.tableId);
      expect(decoded.storeId).toBe(testPayload.storeId);
      expect(decoded.sessionId).toBe(testPayload.sessionId);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid token', () => {
      const token = JWTUtils.generateAccessToken(testPayload);
      const decoded = JWTUtils.verifyAccessToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.tableId).toBe(testPayload.tableId);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        JWTUtils.verifyAccessToken('invalid.token.here');
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      // Mock expired token
      const expiredToken = JWTUtils.generateAccessToken(testPayload, '-1h');
      
      expect(() => {
        JWTUtils.verifyAccessToken(expiredToken);
      }).toThrow('Token expired');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate valid refresh token', () => {
      const token = JWTUtils.generateRefreshToken(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });
});
```

#### 2.3.2 Lambda Handler 테스트

`backend/functions/auth/index.test.js`:

```javascript
const { handler } = require('./index');
const DynamoDBClient = require('../../shared/utils/dynamodbClient');
const JWTUtils = require('../../shared/utils/jwtUtils');

jest.mock('../../shared/utils/dynamodbClient');
jest.mock('../../shared/utils/jwtUtils');

describe('Auth Lambda Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/table-login', () => {
    it('should login with valid QR code', async () => {
      const mockTable = {
        PK: 'TABLE#T001',
        SK: 'METADATA',
        tableId: 'T001',
        storeId: 'STORE123',
        isActive: true
      };

      DynamoDBClient.get.mockResolvedValue(mockTable);
      JWTUtils.generateAccessToken.mockReturnValue('access-token-123');
      JWTUtils.generateRefreshToken.mockReturnValue('refresh-token-456');

      const event = {
        httpMethod: 'POST',
        path: '/auth/table-login',
        body: JSON.stringify({
          qrCode: 'STORE123_TABLE001_SESSION456'
        })
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.accessToken).toBe('access-token-123');
      expect(body.refreshToken).toBe('refresh-token-456');
      expect(body.tableInfo.tableId).toBe('T001');
    });

    it('should return 400 for invalid QR code format', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/auth/table-login',
        body: JSON.stringify({
          qrCode: 'INVALID_FORMAT'
        })
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.message).toContain('Invalid QR code');
    });

    it('should return 404 for non-existent table', async () => {
      DynamoDBClient.get.mockResolvedValue(null);

      const event = {
        httpMethod: 'POST',
        path: '/auth/table-login',
        body: JSON.stringify({
          qrCode: 'STORE123_TABLE999_SESSION456'
        })
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(404);
      
      const body = JSON.parse(response.body);
      expect(body.message).toContain('Table not found');
    });

    it('should return 403 for inactive table', async () => {
      const mockTable = {
        PK: 'TABLE#T001',
        SK: 'METADATA',
        tableId: 'T001',
        storeId: 'STORE123',
        isActive: false
      };

      DynamoDBClient.get.mockResolvedValue(mockTable);

      const event = {
        httpMethod: 'POST',
        path: '/auth/table-login',
        body: JSON.stringify({
          qrCode: 'STORE123_TABLE001_SESSION456'
        })
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(403);
      
      const body = JSON.parse(response.body);
      expect(body.message).toContain('Table is not active');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const mockPayload = {
        tableId: 'T001',
        storeId: 'STORE123',
        sessionId: 'SESSION456'
      };

      JWTUtils.verifyRefreshToken.mockReturnValue(mockPayload);
      JWTUtils.generateAccessToken.mockReturnValue('new-access-token');
      JWTUtils.generateRefreshToken.mockReturnValue('new-refresh-token');

      const event = {
        httpMethod: 'POST',
        path: '/auth/refresh',
        body: JSON.stringify({
          refreshToken: 'old-refresh-token'
        })
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.accessToken).toBe('new-access-token');
      expect(body.refreshToken).toBe('new-refresh-token');
    });

    it('should return 401 for invalid refresh token', async () => {
      JWTUtils.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const event = {
        httpMethod: 'POST',
        path: '/auth/refresh',
        body: JSON.stringify({
          refreshToken: 'invalid-token'
        })
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(401);
    });
  });
});
```

### 2.4 테스트 실행

```bash
# Auth Lambda 테스트
cd backend/functions/auth
npm test

# 커버리지 리포트
npm test -- --coverage

# Watch 모드
npm test -- --watch
```

### 2.5 예상 결과

```
PASS  ./index.test.js
  Auth Lambda Handler
    POST /auth/table-login
      ✓ should login with valid QR code (45ms)
      ✓ should return 400 for invalid QR code format (12ms)
      ✓ should return 404 for non-existent table (15ms)
      ✓ should return 403 for inactive table (18ms)
    POST /auth/refresh
      ✓ should refresh tokens with valid refresh token (22ms)
      ✓ should return 401 for invalid refresh token (10ms)

PASS  ../../shared/utils/jwtUtils.test.js
  JWTUtils
    generateAccessToken
      ✓ should generate valid access token (8ms)
      ✓ should include payload data in token (12ms)
    verifyAccessToken
      ✓ should verify valid token (10ms)
      ✓ should throw error for invalid token (5ms)
      ✓ should throw error for expired token (8ms)
    generateRefreshToken
      ✓ should generate valid refresh token (6ms)

Test Suites: 2 passed, 2 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        2.5s

--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   88.5  |   82.3   |   92.0  |   88.5  |
 functions/auth/    |   90.2  |   85.0   |   95.0  |   90.2  |
  index.js          |   90.2  |   85.0   |   95.0  |   90.2  | 78-82
 shared/utils/      |   86.5  |   78.5   |   88.0  |   86.5  |
  jwtUtils.js       |   92.0  |   88.0   |   95.0  |   92.0  | 45-47
  dynamodbClient.js |   80.5  |   68.0   |   80.0  |   80.5  | 56-62, 89-95
--------------------|---------|----------|---------|---------|-------------------
```

---

## 3. 테스트 커버리지 목표

### Frontend
- **Utilities**: 90% 이상
- **Stores**: 85% 이상
- **Components**: 80% 이상
- **Pages**: 75% 이상

### Backend
- **Utilities**: 90% 이상
- **Lambda Handlers**: 85% 이상
- **Business Logic**: 90% 이상

---

## 4. 테스트 실행 체크리스트

### Frontend
- [ ] 모든 utility 함수 테스트 통과
- [ ] 모든 store 테스트 통과
- [ ] 모든 component 테스트 통과
- [ ] 커버리지 목표 달성
- [ ] 테스트 실행 시간 5초 이내

### Backend
- [ ] 모든 Lambda handler 테스트 통과
- [ ] 모든 utility 함수 테스트 통과
- [ ] 커버리지 목표 달성
- [ ] Mock 데이터 정확성 검증

---

**문서 버전**: 1.0  
**작성일**: 2026-02-09  
**상태**: 완료
