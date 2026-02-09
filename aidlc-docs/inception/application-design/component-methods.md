# Component Methods

**Note**: 이 문서는 각 컴포넌트의 주요 메서드 시그니처와 고수준 목적을 정의합니다. 상세한 비즈니스 로직은 Functional Design (CONSTRUCTION 단계)에서 정의됩니다.

---

## Frontend Component Methods

### Customer Domain

#### MenuList Component

```typescript
interface MenuListProps {
  storeId: string;
  tableId: string;
}

// Methods
fetchMenus(storeId: string, category?: string): Promise<MenuItem[]>
// Purpose: API에서 메뉴 데이터 가져오기 (React Query)

filterByCategory(category: string): void
// Purpose: 선택한 카테고리로 메뉴 필터링

handleAddToCart(menu: MenuItem): void
// Purpose: 메뉴를 장바구니에 추가 (Zustand store 업데이트)
```

#### Cart Component

```typescript
// Methods (Zustand store actions)
addItem(menu: MenuItem): void
// Purpose: 장바구니에 아이템 추가

removeItem(menuId: string): void
// Purpose: 장바구니에서 아이템 삭제

updateQuantity(menuId: string, quantity: number): void
// Purpose: 아이템 수량 업데이트

clearCart(): void
// Purpose: 장바구니 비우기

calculateTotal(): number
// Purpose: 총 금액 계산

checkout(): Promise<Order>
// Purpose: 주문 생성 API 호출
```

#### OrderHistory Component

```typescript
interface OrderHistoryProps {
  tableId: string;
  sessionId: string;
}

// Methods
fetchOrders(tableId: string, sessionId: string): Promise<Order[]>
// Purpose: 현재 세션 주문 목록 가져오기 (React Query)

refreshOrders(): void
// Purpose: 주문 목록 새로고침
```

---

### Admin Domain

#### OrderDashboard Component

```typescript
interface OrderDashboardProps {
  storeId: string;
}

// Methods
connectSSE(storeId: string): EventSource
// Purpose: SSE 연결 설정 (eventsource-polyfill)

handleNewOrder(order: Order): void
// Purpose: 신규 주문 수신 시 처리 (애니메이션, 상태 업데이트)

disconnectSSE(): void
// Purpose: SSE 연결 종료

fetchInitialOrders(storeId: string): Promise<TableOrderSummary[]>
// Purpose: 초기 주문 데이터 로드
```

#### OrderDetailModal Component

```typescript
interface OrderDetailModalProps {
  tableId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Methods
fetchTableOrders(tableId: string): Promise<Order[]>
// Purpose: 테이블의 전체 주문 목록 가져오기

updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>
// Purpose: 주문 상태 변경 API 호출

deleteOrder(orderId: string): Promise<void>
// Purpose: 주문 삭제 API 호출

completeTableSession(tableId: string): Promise<void>
// Purpose: 테이블 이용 완료 API 호출
```

#### MenuManagement Component

```typescript
interface MenuManagementProps {
  storeId: string;
}

// Methods
fetchMenus(storeId: string): Promise<MenuItem[]>
// Purpose: 메뉴 목록 가져오기

createMenu(menu: CreateMenuDto): Promise<MenuItem>
// Purpose: 새 메뉴 생성 API 호출

updateMenu(menuId: string, menu: UpdateMenuDto): Promise<MenuItem>
// Purpose: 메뉴 수정 API 호출

deleteMenu(menuId: string): Promise<void>
// Purpose: 메뉴 삭제 API 호출

validateMenuForm(menu: MenuFormData): ValidationResult
// Purpose: 메뉴 폼 유효성 검증
```

---

## Backend Component Methods

### Controllers

#### AuthController

```typescript
// Endpoints
POST /api/auth/table-login
tableLogin(req: Request, res: Response): Promise<Response>
// Purpose: 테이블 자동 로그인 처리
// Input: { storeId, tableNumber, tablePassword }
// Output: { token, expiresIn, tableId, sessionId }

POST /api/auth/admin-login
adminLogin(req: Request, res: Response): Promise<Response>
// Purpose: 관리자 로그인 처리
// Input: { storeId, username, password }
// Output: { token, expiresIn, storeId }

POST /api/auth/verify-token
verifyToken(req: Request, res: Response): Promise<Response>
// Purpose: JWT 토큰 검증
// Input: { token }
// Output: { valid: boolean, payload }
```

#### MenuController

```typescript
// Endpoints
GET /api/menus
getMenus(req: Request, res: Response): Promise<Response>
// Purpose: 메뉴 목록 조회
// Query: storeId, category (optional)
// Output: MenuItem[]

POST /api/menus
createMenu(req: Request, res: Response): Promise<Response>
// Purpose: 새 메뉴 생성
// Input: { storeId, menuName, price, description, category, imageUrl }
// Output: MenuItem

PUT /api/menus/:menuId
updateMenu(req: Request, res: Response): Promise<Response>
// Purpose: 메뉴 수정
// Input: { menuName, price, description, category, imageUrl }
// Output: MenuItem

DELETE /api/menus/:menuId
deleteMenu(req: Request, res: Response): Promise<Response>
// Purpose: 메뉴 삭제
// Output: { success: boolean }
```

#### OrderController

```typescript
// Endpoints
POST /api/orders
createOrder(req: Request, res: Response): Promise<Response>
// Purpose: 주문 생성
// Input: { storeId, tableId, sessionId, items: [{menuId, quantity, price}], totalAmount }
// Output: { orderId, orderNumber, createdAt }

GET /api/orders
getOrders(req: Request, res: Response): Promise<Response>
// Purpose: 주문 조회
// Query: tableId, sessionId
// Output: Order[]

GET /api/orders/stream
streamOrders(req: Request, res: Response): void
// Purpose: SSE 스트림 엔드포인트
// Output: Server-Sent Events stream

PATCH /api/orders/:orderId/status
updateOrderStatus(req: Request, res: Response): Promise<Response>
// Purpose: 주문 상태 변경
// Input: { status: 'pending' | 'preparing' | 'completed' }
// Output: Order

DELETE /api/orders/:orderId
deleteOrder(req: Request, res: Response): Promise<Response>
// Purpose: 주문 삭제
// Output: { success: boolean }
```

#### TableController

```typescript
// Endpoints
POST /api/tables/:tableId/complete-session
completeSession(req: Request, res: Response): Promise<Response>
// Purpose: 테이블 세션 종료 (이용 완료)
// Output: { success: boolean, newSessionId }

GET /api/orders/history
getOrderHistory(req: Request, res: Response): Promise<Response>
// Purpose: 과거 주문 내역 조회
// Query: tableId, startDate (optional), endDate (optional)
// Output: OrderHistory[]
```

---

### Domain Services

#### AuthService

```typescript
class AuthService {
  generateToken(payload: TokenPayload, expiresIn: string): string
  // Purpose: JWT 토큰 생성
  
  verifyToken(token: string): TokenPayload | null
  // Purpose: JWT 토큰 검증 및 페이로드 추출
  
  hashPassword(password: string): Promise<string>
  // Purpose: 비밀번호 해싱 (bcrypt)
  
  comparePassword(password: string, hash: string): Promise<boolean>
  // Purpose: 비밀번호 비교
  
  authenticateTable(storeId: string, tableNumber: string, tablePassword: string): Promise<AuthResult>
  // Purpose: 테이블 인증 로직
  
  authenticateAdmin(storeId: string, username: string, password: string): Promise<AuthResult>
  // Purpose: 관리자 인증 로직
}
```

#### MenuService

```typescript
class MenuService {
  validateMenu(menu: CreateMenuDto): ValidationResult
  // Purpose: 메뉴 데이터 유효성 검증
  
  createMenu(menu: CreateMenuDto): Promise<MenuItem>
  // Purpose: 메뉴 생성 비즈니스 로직
  
  updateMenu(menuId: string, menu: UpdateMenuDto): Promise<MenuItem>
  // Purpose: 메뉴 수정 비즈니스 로직
  
  deleteMenu(menuId: string): Promise<void>
  // Purpose: 메뉴 삭제 비즈니스 로직
  
  getMenusByCategory(storeId: string, category?: string): Promise<MenuItem[]>
  // Purpose: 카테고리별 메뉴 조회
}
```

#### OrderService

```typescript
class OrderService {
  createOrder(orderData: CreateOrderDto): Promise<Order>
  // Purpose: 주문 생성 비즈니스 로직
  
  generateOrderNumber(): string
  // Purpose: 주문 번호 생성 (예: ORD-20260209-001)
  
  calculateTotalAmount(items: OrderItem[]): number
  // Purpose: 총 금액 계산
  
  updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order>
  // Purpose: 주문 상태 변경 로직
  
  deleteOrder(orderId: string): Promise<void>
  // Purpose: 주문 삭제 로직
  
  getOrdersBySession(tableId: string, sessionId: string): Promise<Order[]>
  // Purpose: 세션별 주문 조회
}
```

#### TableService

```typescript
class TableService {
  generateSessionId(): string
  // Purpose: 세션 ID 생성 (UUID)
  
  completeSession(tableId: string): Promise<CompleteSessionResult>
  // Purpose: 테이블 세션 종료 로직
  // - 현재 세션 주문을 OrderHistory로 이동
  // - 새 세션 ID 생성
  // - 테이블 상태 리셋
  
  getTableInfo(tableId: string): Promise<TableInfo>
  // Purpose: 테이블 정보 조회
}
```

#### SSEService

```typescript
class SSEService {
  addClient(clientId: string, res: Response): void
  // Purpose: SSE 클라이언트 추가
  
  removeClient(clientId: string): void
  // Purpose: SSE 클라이언트 제거
  
  broadcastOrderUpdate(order: Order): void
  // Purpose: 모든 클라이언트에 주문 업데이트 브로드캐스트
  
  sendHeartbeat(): void
  // Purpose: 연결 유지를 위한 heartbeat 전송
}
```

---

### Repositories

#### MenuRepository

```typescript
class MenuRepository {
  create(menu: MenuItem): Promise<MenuItem>
  // Purpose: DynamoDB에 메뉴 생성
  
  findById(menuId: string): Promise<MenuItem | null>
  // Purpose: 메뉴 ID로 조회
  
  findByStore(storeId: string, category?: string): Promise<MenuItem[]>
  // Purpose: 매장별 메뉴 조회 (카테고리 필터 옵션)
  
  update(menuId: string, menu: Partial<MenuItem>): Promise<MenuItem>
  // Purpose: 메뉴 업데이트
  
  delete(menuId: string): Promise<void>
  // Purpose: 메뉴 삭제
}
```

#### OrderRepository

```typescript
class OrderRepository {
  create(order: Order): Promise<Order>
  // Purpose: DynamoDB에 주문 생성
  
  findById(orderId: string): Promise<Order | null>
  // Purpose: 주문 ID로 조회
  
  findBySession(tableId: string, sessionId: string): Promise<Order[]>
  // Purpose: 세션별 주문 조회 (GSI 사용)
  
  updateStatus(orderId: string, status: OrderStatus): Promise<Order>
  // Purpose: 주문 상태 업데이트
  
  delete(orderId: string): Promise<void>
  // Purpose: 주문 삭제
  
  findByStore(storeId: string): Promise<Order[]>
  // Purpose: 매장별 모든 주문 조회 (실시간 모니터링용)
}
```

#### OrderHistoryRepository

```typescript
class OrderHistoryRepository {
  create(orderHistory: OrderHistory): Promise<OrderHistory>
  // Purpose: 주문 이력 생성
  
  findByTable(tableId: string, startDate?: Date, endDate?: Date): Promise<OrderHistory[]>
  // Purpose: 테이블별 과거 주문 조회 (날짜 필터 옵션)
  
  findByStore(storeId: string, startDate?: Date, endDate?: Date): Promise<OrderHistory[]>
  // Purpose: 매장별 과거 주문 조회
}
```

---

## Method Summary

**Frontend Methods**: ~40개
- Customer Components: ~15개
- Admin Components: ~20개
- Shared Components: ~5개

**Backend Methods**: ~50개
- Controllers: ~15개
- Domain Services: ~20개
- Repositories: ~15개

**Total Methods**: ~90개

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: 메서드 시그니처 정의 완료
