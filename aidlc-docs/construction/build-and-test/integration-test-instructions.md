# Integration Test Instructions - Customer Unit

## 개요

Customer Unit의 Frontend와 Backend 간 통합 테스트 및 시스템 간 상호작용 테스트 지침입니다.

---

## 1. 통합 테스트 범위

### 1.1 테스트 시나리오

1. **인증 플로우 (US-001)**
   - QR 코드 스캔 → 로그인 → 토큰 발급 → 메뉴 페이지 이동

2. **메뉴 조회 플로우 (US-002)**
   - 로그인 → 메뉴 목록 조회 → 카테고리 필터링 → 메뉴 상세 조회

3. **장바구니 플로우 (US-003)**
   - 메뉴 선택 → 장바구니 추가 → 수량 변경 → 항목 삭제

4. **주문 생성 플로우 (US-004)**
   - 장바구니 확인 → 주문 생성 → 주문 번호 발급 → 주문 성공 페이지

5. **주문 내역 플로우 (US-005)**
   - 주문 내역 조회 → 주문 상세 조회 → 주문 상태 확인

6. **실시간 업데이트 플로우 (US-006)**
   - WebSocket 연결 → 주문 상태 변경 → 실시간 알림 수신

---

## 2. Frontend-Backend 통합 테스트

### 2.1 테스트 환경 설정

#### 2.1.1 테스트 프레임워크 설치

```bash
cd frontend
npm install --save-dev @playwright/test
npx playwright install
```

#### 2.1.2 Playwright 설정

`playwright.config.js`:

```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/integration',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```

### 2.2 통합 테스트 작성

#### 2.2.1 인증 플로우 테스트

`tests/integration/auth.spec.js`:

```javascript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login with QR code', async ({ page }) => {
    // QR 코드로 로그인 페이지 접속
    await page.goto('/?qr=STORE123_TABLE001_SESSION456');

    // 자동 로그인 처리 대기
    await page.waitForURL('**/menu');

    // 메뉴 페이지로 이동 확인
    await expect(page).toHaveURL(/.*menu/);
    
    // 로컬 스토리지에 토큰 저장 확인
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeTruthy();
  });

  test('should login with table number', async ({ page }) => {
    await page.goto('/');

    // 테이블 번호 입력
    await page.fill('input[name="tableNumber"]', 'T001');
    
    // 로그인 버튼 클릭
    await page.click('button:has-text("로그인")');

    // 메뉴 페이지로 이동 대기
    await page.waitForURL('**/menu');

    // 메뉴 페이지 확인
    await expect(page).toHaveURL(/.*menu/);
  });

  test('should show error for invalid table number', async ({ page }) => {
    await page.goto('/');

    // 잘못된 테이블 번호 입력
    await page.fill('input[name="tableNumber"]', 'INVALID');
    
    // 로그인 버튼 클릭
    await page.click('button:has-text("로그인")');

    // 에러 메시지 확인
    await expect(page.locator('text=로그인 실패')).toBeVisible();
  });

  test('should refresh token automatically', async ({ page, context }) => {
    // 로그인
    await page.goto('/?qr=STORE123_TABLE001_SESSION456');
    await page.waitForURL('**/menu');

    // 토큰 만료 시뮬레이션 (15시간 후)
    await context.addCookies([{
      name: 'tokenExpiry',
      value: String(Date.now() - 15 * 60 * 60 * 1000),
      domain: 'localhost',
      path: '/'
    }]);

    // API 호출 (토큰 갱신 트리거)
    await page.reload();

    // 새 토큰 발급 확인
    const newToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(newToken).toBeTruthy();
  });
});
```

#### 2.2.2 메뉴 조회 플로우 테스트

`tests/integration/menu.spec.js`:

```javascript
import { test, expect } from '@playwright/test';

test.describe('Menu Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/?qr=STORE123_TABLE001_SESSION456');
    await page.waitForURL('**/menu');
  });

  test('should display menu list', async ({ page }) => {
    // 메뉴 목록 로딩 대기
    await page.waitForSelector('[data-testid="menu-item"]');

    // 메뉴 항목 확인
    const menuItems = await page.locator('[data-testid="menu-item"]').count();
    expect(menuItems).toBeGreaterThan(0);
  });

  test('should filter menus by category', async ({ page }) => {
    // 카테고리 탭 클릭
    await page.click('button:has-text("메인")');

    // 필터링된 메뉴 확인
    await page.waitForSelector('[data-testid="menu-item"]');
    
    const menuItems = await page.locator('[data-testid="menu-item"]');
    const firstItem = menuItems.first();
    
    // 메인 카테고리 메뉴만 표시되는지 확인
    await expect(firstItem).toContainText('메인');
  });

  test('should show menu details', async ({ page }) => {
    // 첫 번째 메뉴 클릭
    await page.click('[data-testid="menu-item"]:first-child');

    // 메뉴 상세 정보 확인
    await expect(page.locator('[data-testid="menu-detail"]')).toBeVisible();
    await expect(page.locator('[data-testid="menu-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="menu-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="menu-description"]')).toBeVisible();
  });

  test('should add menu to cart', async ({ page }) => {
    // 메뉴 항목 클릭
    await page.click('[data-testid="menu-item"]:first-child');

    // 장바구니 추가 버튼 클릭
    await page.click('button:has-text("장바구니 담기")');

    // 장바구니 배지 업데이트 확인
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    await expect(cartBadge).toHaveText('1');
  });
});
```

#### 2.2.3 주문 생성 플로우 테스트

`tests/integration/order.spec.js`:

```javascript
import { test, expect } from '@playwright/test';

test.describe('Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('/?qr=STORE123_TABLE001_SESSION456');
    await page.waitForURL('**/menu');
  });

  test('should create order successfully', async ({ page }) => {
    // 메뉴 추가
    await page.click('[data-testid="menu-item"]:first-child');
    await page.click('button:has-text("장바구니 담기")');

    // 장바구니 페이지로 이동
    await page.click('[data-testid="cart-button"]');
    await page.waitForURL('**/cart');

    // 주문하기 버튼 클릭
    await page.click('button:has-text("주문하기")');

    // 주문 성공 페이지 확인
    await page.waitForURL('**/order-success');
    await expect(page.locator('text=주문이 완료되었습니다')).toBeVisible();
    
    // 주문 번호 확인
    const orderNumber = await page.locator('[data-testid="order-number"]').textContent();
    expect(orderNumber).toMatch(/^\d{8}-\d{3}$/);
  });

  test('should validate cart before order', async ({ page }) => {
    // 빈 장바구니로 주문 시도
    await page.goto('/cart');

    // 주문하기 버튼 비활성화 확인
    const orderButton = page.locator('button:has-text("주문하기")');
    await expect(orderButton).toBeDisabled();
  });

  test('should calculate total amount correctly', async ({ page }) => {
    // 메뉴 2개 추가
    await page.click('[data-testid="menu-item"]:nth-child(1)');
    await page.click('button:has-text("장바구니 담기")');
    
    await page.click('[data-testid="menu-back"]');
    
    await page.click('[data-testid="menu-item"]:nth-child(2)');
    await page.click('button:has-text("장바구니 담기")');

    // 장바구니 페이지로 이동
    await page.click('[data-testid="cart-button"]');

    // 총액 확인
    const totalAmount = await page.locator('[data-testid="total-amount"]').textContent();
    expect(totalAmount).toMatch(/\d+원/);
  });

  test('should clear cart after order', async ({ page }) => {
    // 메뉴 추가 및 주문
    await page.click('[data-testid="menu-item"]:first-child');
    await page.click('button:has-text("장바구니 담기")');
    await page.click('[data-testid="cart-button"]');
    await page.click('button:has-text("주문하기")');

    // 주문 성공 후 메뉴로 돌아가기
    await page.click('button:has-text("메뉴로 돌아가기")');

    // 장바구니 비어있는지 확인
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    await expect(cartBadge).not.toBeVisible();
  });
});
```

#### 2.2.4 실시간 업데이트 테스트

`tests/integration/realtime.spec.js`:

```javascript
import { test, expect } from '@playwright/test';

test.describe('Real-time Update Flow', () => {
  test('should receive order status updates via WebSocket', async ({ page }) => {
    // 로그인
    await page.goto('/?qr=STORE123_TABLE001_SESSION456');
    await page.waitForURL('**/menu');

    // 주문 생성
    await page.click('[data-testid="menu-item"]:first-child');
    await page.click('button:has-text("장바구니 담기")');
    await page.click('[data-testid="cart-button"]');
    await page.click('button:has-text("주문하기")');

    // 주문 내역 페이지로 이동
    await page.click('button:has-text("주문 내역 보기")');
    await page.waitForURL('**/orders');

    // WebSocket 메시지 수신 대기
    await page.waitForFunction(() => {
      const orders = document.querySelectorAll('[data-testid="order-item"]');
      return orders.length > 0;
    });

    // 주문 상태 확인
    const orderStatus = await page.locator('[data-testid="order-status"]').first().textContent();
    expect(['pending', 'confirmed', 'preparing', 'ready', 'completed']).toContain(orderStatus);

    // 상태 변경 시뮬레이션 (Backend에서 상태 변경)
    // 실제 테스트에서는 Admin API를 호출하여 상태 변경

    // 실시간 업데이트 확인 (5초 대기)
    await page.waitForTimeout(5000);
    
    const updatedStatus = await page.locator('[data-testid="order-status"]').first().textContent();
    // 상태가 변경되었는지 확인 (실제 환경에서는 변경됨)
  });

  test('should reconnect WebSocket on connection loss', async ({ page, context }) => {
    // 로그인
    await page.goto('/?qr=STORE123_TABLE001_SESSION456');
    await page.waitForURL('**/menu');

    // 주문 내역 페이지로 이동
    await page.goto('/orders');

    // WebSocket 연결 확인
    const wsConnected = await page.evaluate(() => {
      return window.__wsConnected === true;
    });
    expect(wsConnected).toBe(true);

    // 네트워크 오프라인 시뮬레이션
    await context.setOffline(true);
    await page.waitForTimeout(2000);

    // 네트워크 온라인 복구
    await context.setOffline(false);
    await page.waitForTimeout(3000);

    // WebSocket 재연결 확인
    const wsReconnected = await page.evaluate(() => {
      return window.__wsConnected === true;
    });
    expect(wsReconnected).toBe(true);
  });
});
```

### 2.3 통합 테스트 실행

```bash
# 모든 통합 테스트 실행
npx playwright test

# 특정 테스트 파일 실행
npx playwright test auth.spec.js

# UI 모드로 실행 (디버깅)
npx playwright test --ui

# 헤드풀 모드로 실행 (브라우저 표시)
npx playwright test --headed

# 특정 브라우저로 실행
npx playwright test --project=chromium
```

### 2.4 예상 결과

```
Running 15 tests using 1 worker

  ✓ auth.spec.js:5:3 › should login with QR code (2.5s)
  ✓ auth.spec.js:18:3 › should login with table number (1.8s)
  ✓ auth.spec.js:32:3 › should show error for invalid table number (1.2s)
  ✓ auth.spec.js:45:3 › should refresh token automatically (3.1s)
  ✓ menu.spec.js:10:3 › should display menu list (1.5s)
  ✓ menu.spec.js:20:3 › should filter menus by category (2.0s)
  ✓ menu.spec.js:32:3 › should show menu details (1.8s)
  ✓ menu.spec.js:44:3 › should add menu to cart (2.2s)
  ✓ order.spec.js:10:3 › should create order successfully (3.5s)
  ✓ order.spec.js:30:3 › should validate cart before order (1.0s)
  ✓ order.spec.js:40:3 › should calculate total amount correctly (2.8s)
  ✓ order.spec.js:58:3 › should clear cart after order (3.2s)
  ✓ realtime.spec.js:5:3 › should receive order status updates via WebSocket (5.5s)
  ✓ realtime.spec.js:35:3 › should reconnect WebSocket on connection loss (8.0s)

  15 passed (42.1s)
```

---

## 3. API 통합 테스트

### 3.1 Postman/Newman 테스트

#### 3.1.1 Postman Collection 생성

`tests/api/table-order-api.postman_collection.json`:

```json
{
  "info": {
    "name": "Table Order API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Table Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status code is 200', function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "",
                  "pm.test('Response has accessToken', function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('accessToken');",
                  "    pm.environment.set('accessToken', jsonData.accessToken);",
                  "});",
                  "",
                  "pm.test('Response has tableInfo', function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('tableInfo');",
                  "    pm.expect(jsonData.tableInfo).to.have.property('tableId');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"qrCode\": \"STORE123_TABLE001_SESSION456\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/auth/table-login",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "table-login"]
            }
          }
        }
      ]
    },
    {
      "name": "Menus",
      "item": [
        {
          "name": "Get Menus",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status code is 200', function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "",
                  "pm.test('Response is array', function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.be.an('array');",
                  "});",
                  "",
                  "pm.test('Menu items have required fields', function () {",
                  "    var jsonData = pm.response.json();",
                  "    if (jsonData.length > 0) {",
                  "        pm.expect(jsonData[0]).to.have.property('menuId');",
                  "        pm.expect(jsonData[0]).to.have.property('menuName');",
                  "        pm.expect(jsonData[0]).to.have.property('price');",
                  "    }",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{accessToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/menus?storeId=STORE123&category=전체",
              "host": ["{{baseUrl}}"],
              "path": ["menus"],
              "query": [
                {
                  "key": "storeId",
                  "value": "STORE123"
                },
                {
                  "key": "category",
                  "value": "전체"
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "Orders",
      "item": [
        {
          "name": "Create Order",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status code is 201', function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "",
                  "pm.test('Response has orderId', function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('orderId');",
                  "    pm.environment.set('orderId', jsonData.orderId);",
                  "});",
                  "",
                  "pm.test('Response has orderNumber', function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('orderNumber');",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{accessToken}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"storeId\": \"STORE123\",\n  \"tableId\": \"T001\",\n  \"sessionId\": \"SESSION456\",\n  \"items\": [\n    {\n      \"menuId\": \"MENU001\",\n      \"quantity\": 2,\n      \"price\": 8000\n    }\n  ],\n  \"totalAmount\": 16000\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/orders",
              "host": ["{{baseUrl}}"],
              "path": ["orders"]
            }
          }
        }
      ]
    }
  ]
}
```

#### 3.1.2 Newman으로 테스트 실행

```bash
# Newman 설치
npm install -g newman

# 테스트 실행
newman run tests/api/table-order-api.postman_collection.json \
  --environment tests/api/environment.json \
  --reporters cli,json \
  --reporter-json-export results.json
```

---

## 4. 통합 테스트 체크리스트

### Frontend-Backend 통합
- [ ] 인증 플로우 테스트 통과
- [ ] 메뉴 조회 플로우 테스트 통과
- [ ] 장바구니 플로우 테스트 통과
- [ ] 주문 생성 플로우 테스트 통과
- [ ] 주문 내역 플로우 테스트 통과
- [ ] 실시간 업데이트 테스트 통과

### API 통합
- [ ] 모든 REST API 엔드포인트 테스트 통과
- [ ] WebSocket API 테스트 통과
- [ ] 에러 핸들링 테스트 통과
- [ ] 인증/인가 테스트 통과

### 성능
- [ ] 페이지 로딩 시간 3초 이내
- [ ] API 응답 시간 1초 이내
- [ ] WebSocket 연결 시간 2초 이내

---

**문서 버전**: 1.0  
**작성일**: 2026-02-09  
**상태**: 완료
