# Units of Work

## Decomposition Strategy

**선택된 전략**: 도메인별 분해 (Customer Unit, Admin Unit)

**배포 모델**: Monolith (단일 애플리케이션)
- 프론트엔드와 백엔드를 하나의 Monorepo에서 관리
- 단일 배포 단위
- 논리적으로는 Customer와 Admin 도메인으로 분리

**팀 구조**: 2개 팀
- **Team A**: Customer Unit 담당
- **Team B**: Admin Unit 담당
- 병렬 개발 가능

---

## Unit 1: Customer Unit

### Purpose
고객이 테이블에서 메뉴를 조회하고 주문하는 기능을 제공

### Responsibilities
- 테이블 자동 로그인
- 메뉴 조회 및 탐색
- 장바구니 관리 (클라이언트 측)
- 주문 생성
- 주문 내역 조회

### Included Components

**Frontend Components (5개)**:
1. **AutoLogin Component**: 테이블 자동 로그인 처리
2. **MenuList Component**: 메뉴 목록 표시
3. **MenuCard Component**: 개별 메뉴 카드
4. **Cart Component**: 장바구니 관리
5. **OrderHistory Component**: 주문 내역 조회

**Frontend Stores (1개)**:
- **CartStore (Zustand)**: 장바구니 상태 관리

**Backend Components (8개)**:
1. **AuthController**: 테이블 로그인 엔드포인트
2. **MenuController**: 메뉴 조회 엔드포인트
3. **OrderController**: 주문 생성, 조회 엔드포인트
4. **AuthService**: 테이블 인증 로직
5. **MenuService**: 메뉴 조회 로직
6. **OrderService**: 주문 생성 로직
7. **MenuRepository**: 메뉴 데이터 접근
8. **OrderRepository**: 주문 데이터 접근

**Shared Components**:
- Button, Modal, ErrorBoundary (공통 UI 컴포넌트)
- API Client (React Query)
- Types (TypeScript 타입 정의)

### Included User Stories (6개)
- US-001: 테이블 자동 로그인
- US-002: 메뉴 조회 및 탐색
- US-003: 장바구니에 메뉴 추가
- US-004: 장바구니 관리
- US-005: 주문 생성 및 확인
- US-006: 주문 내역 조회

### API Endpoints
```
POST   /api/auth/table-login
GET    /api/menus?storeId={storeId}&category={category}
POST   /api/orders
GET    /api/orders?tableId={tableId}&sessionId={sessionId}
```

### Story Points
- Total: 19 Story Points
- Priority: High (5 stories), Medium (1 story)

---

## Unit 2: Admin Unit

### Purpose
매장 관리자가 주문을 실시간으로 모니터링하고 매장을 관리하는 기능을 제공

### Responsibilities
- 관리자 로그인
- 실시간 주문 모니터링 (SSE)
- 주문 상태 관리
- 주문 삭제
- 테이블 세션 관리
- 과거 주문 내역 조회
- 메뉴 관리 (CRUD)

### Included Components

**Frontend Components (5개)**:
1. **LoginForm Component**: 관리자 로그인 폼
2. **OrderDashboard Component**: 실시간 주문 대시보드
3. **TableCard Component**: 테이블별 주문 카드
4. **OrderDetailModal Component**: 주문 상세 모달
5. **MenuManagement Component**: 메뉴 관리

**Frontend Stores (1개)**:
- **AdminStore (Zustand)**: 관리자 상태 관리

**Backend Components (12개)**:
1. **AuthController**: 관리자 로그인 엔드포인트
2. **OrderController**: 주문 조회, 상태 변경, 삭제, SSE 스트림
3. **TableController**: 테이블 세션 관리
4. **MenuController**: 메뉴 CRUD 엔드포인트
5. **AuthService**: 관리자 인증 로직
6. **OrderService**: 주문 상태 변경, 삭제 로직
7. **TableService**: 테이블 세션 관리 로직
8. **MenuService**: 메뉴 CRUD 로직
9. **SSEService**: 실시간 통신 관리
10. **OrderRepository**: 주문 데이터 접근
11. **TableRepository**: 테이블 데이터 접근
12. **OrderHistoryRepository**: 주문 이력 데이터 접근

**Shared Components**:
- Button, Modal, ErrorBoundary (공통 UI 컴포넌트)
- API Client (React Query)
- SSE Client (eventsource-polyfill)
- Types (TypeScript 타입 정의)

### Included User Stories (7개)
- US-007: 관리자 로그인
- US-008: 실시간 주문 모니터링
- US-009: 주문 상태 변경
- US-010: 주문 삭제
- US-011: 테이블 세션 종료
- US-012: 과거 주문 내역 조회
- US-013: 메뉴 관리

### API Endpoints
```
POST   /api/auth/admin-login
GET    /api/orders/stream (SSE)
PATCH  /api/orders/:orderId/status
DELETE /api/orders/:orderId
POST   /api/tables/:tableId/complete-session
GET    /api/orders/history?tableId={tableId}
POST   /api/menus
PUT    /api/menus/:menuId
DELETE /api/menus/:menuId
```

### Story Points
- Total: 32 Story Points
- Priority: High (3 stories), Medium (4 stories)

---

## Shared Infrastructure

### Shared Backend Components
- **StoreRepository**: 매장 정보 조회 (양쪽 Unit에서 사용)
- **AuthMiddleware**: JWT 토큰 검증 (양쪽 Unit에서 사용)
- **ErrorMiddleware**: 전역 에러 처리
- **LoggerMiddleware**: 요청/응답 로깅

### Shared Data Models
- **Store**: 매장 정보
- **Table**: 테이블 정보
- **Menu**: 메뉴 정보
- **Order**: 주문 정보
- **OrderHistory**: 주문 이력

### Shared Frontend
- **Shared Components**: Button, Modal, ErrorBoundary
- **API Client**: React Query 설정
- **Types**: 공통 TypeScript 타입
- **Utils**: 공통 유틸리티 함수

---

## Code Organization (Greenfield)

**선택된 구조**: 도메인별 폴더

```
table-order-service/
├── frontend/
│   ├── customer/              # Customer Unit Frontend
│   │   ├── components/
│   │   │   ├── AutoLogin.tsx
│   │   │   ├── MenuList.tsx
│   │   │   ├── MenuCard.tsx
│   │   │   ├── Cart.tsx
│   │   │   └── OrderHistory.tsx
│   │   ├── pages/
│   │   │   ├── MenuPage.tsx
│   │   │   └── OrderHistoryPage.tsx
│   │   ├── stores/
│   │   │   └── cartStore.ts
│   │   └── hooks/
│   │       └── useAuth.ts
│   ├── admin/                 # Admin Unit Frontend
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── OrderDashboard.tsx
│   │   │   ├── TableCard.tsx
│   │   │   ├── OrderDetailModal.tsx
│   │   │   └── MenuManagement.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   └── MenuManagementPage.tsx
│   │   ├── stores/
│   │   │   └── adminStore.ts
│   │   └── hooks/
│   │       └── useSSE.ts
│   └── shared/                # Shared Frontend
│       ├── components/
│       │   ├── Button.tsx
│       │   ├── Modal.tsx
│       │   └── ErrorBoundary.tsx
│       ├── api/
│       │   └── apiClient.ts
│       ├── types/
│       │   └── index.ts
│       └── utils/
│           └── helpers.ts
├── backend/
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── menuController.ts
│   │   ├── orderController.ts
│   │   └── tableController.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── menuService.ts
│   │   ├── orderService.ts
│   │   ├── tableService.ts
│   │   └── sseService.ts
│   ├── repositories/
│   │   ├── storeRepository.ts
│   │   ├── tableRepository.ts
│   │   ├── menuRepository.ts
│   │   ├── orderRepository.ts
│   │   └── orderHistoryRepository.ts
│   ├── models/
│   │   ├── Store.ts
│   │   ├── Table.ts
│   │   ├── Menu.ts
│   │   ├── Order.ts
│   │   └── OrderHistory.ts
│   ├── middleware/
│   │   ├── authMiddleware.ts
│   │   ├── errorMiddleware.ts
│   │   └── loggerMiddleware.ts
│   └── utils/
│       └── helpers.ts
├── shared/
│   └── types/
│       └── index.ts
├── package.json
└── README.md
```

---

## Development Workflow

### Team A (Customer Unit)
**Focus**: 고객 경험 최적화

**Development Steps**:
1. 테이블 자동 로그인 구현
2. 메뉴 조회 및 UI 구현
3. 장바구니 기능 구현
4. 주문 생성 플로우 구현
5. 주문 내역 조회 구현

**Testing**:
- Unit별 독립 테스트
- Customer 도메인 E2E 테스트

### Team B (Admin Unit)
**Focus**: 관리 효율성 및 실시간 모니터링

**Development Steps**:
1. 관리자 로그인 구현
2. 실시간 주문 모니터링 (SSE) 구현
3. 주문 상태 관리 구현
4. 테이블 세션 관리 구현
5. 메뉴 관리 (CRUD) 구현

**Testing**:
- Unit별 독립 테스트
- Admin 도메인 E2E 테스트

### Integration Points
- **Shared Backend API**: 양쪽 Unit이 동일한 백엔드 API 사용
- **Shared Data Models**: DynamoDB 테이블 공유
- **Shared Authentication**: JWT 토큰 기반 인증 공유

---

## Unit Summary

| Metric | Customer Unit | Admin Unit | Total |
|--------|---------------|------------|-------|
| User Stories | 6 | 7 | 13 |
| Story Points | 19 | 32 | 51 |
| Frontend Components | 5 | 5 | 10 |
| Backend Components | 8 | 12 | 20 |
| API Endpoints | 4 | 9 | 13 |
| Priority High | 5 | 3 | 8 |
| Priority Medium | 1 | 4 | 5 |

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: Unit 정의 완료
