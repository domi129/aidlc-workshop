# Application Components

## Component Organization Strategy

**선택된 전략**: Domain 기반 (customer, admin 등 도메인별 폴더)

**구조**:
```
frontend/
├── customer/          # 고객용 도메인
│   ├── components/    # 고객용 컴포넌트
│   ├── pages/         # 고객용 페이지
│   ├── hooks/         # 고객용 커스텀 훅
│   └── stores/        # 고객용 Zustand 스토어
├── admin/             # 관리자용 도메인
│   ├── components/    # 관리자용 컴포넌트
│   ├── pages/         # 관리자용 페이지
│   ├── hooks/         # 관리자용 커스텀 훅
│   └── stores/        # 관리자용 Zustand 스토어
└── shared/            # 공통 컴포넌트
    ├── components/    # 공통 UI 컴포넌트
    ├── api/           # API 클라이언트
    ├── types/         # TypeScript 타입
    └── utils/         # 유틸리티 함수

backend/
├── controllers/       # HTTP 요청 처리
├── services/          # 도메인 서비스 (비즈니스 로직)
├── repositories/      # 데이터 접근 계층
├── models/            # 데이터 모델 (DynamoDB 스키마)
├── middleware/        # Express 미들웨어
└── utils/             # 유틸리티 함수
```

---

## Frontend Components

### 1. Customer Domain Components

#### 1.1 MenuList Component
**Purpose**: 메뉴 목록을 카테고리별로 표시

**Responsibilities**:
- 메뉴 데이터를 API에서 가져오기 (React Query)
- 카테고리별 필터링
- 메뉴 카드 렌더링
- 장바구니 추가 액션 처리

**Interface**:
- Props: `storeId: string, tableId: string`
- Events: `onAddToCart(menuItem: MenuItem)`

#### 1.2 MenuCard Component
**Purpose**: 개별 메뉴 아이템 표시

**Responsibilities**:
- 메뉴 정보 표시 (이름, 가격, 설명, 이미지)
- 장바구니 추가 버튼
- 터치 친화적 UI

**Interface**:
- Props: `menu: MenuItem, onAdd: (menu: MenuItem) => void`

#### 1.3 Cart Component
**Purpose**: 장바구니 관리

**Responsibilities**:
- 장바구니 아이템 목록 표시
- 수량 증가/감소
- 아이템 삭제
- 총 금액 계산
- 주문하기 버튼

**Interface**:
- Props: None (Zustand store 사용)
- Events: `onCheckout()`

#### 1.4 OrderHistory Component
**Purpose**: 주문 내역 조회

**Responsibilities**:
- 현재 세션 주문 목록 표시
- 주문 상세 정보 표시
- 실시간 상태 업데이트 (선택사항)

**Interface**:
- Props: `tableId: string, sessionId: string`

#### 1.5 AutoLogin Component
**Purpose**: 테이블 자동 로그인 처리

**Responsibilities**:
- LocalStorage에서 로그인 정보 로드
- JWT 토큰 검증
- 자동 로그인 수행
- 로그인 실패 시 에러 처리

**Interface**:
- Props: None
- Returns: `isAuthenticated: boolean`

---

### 2. Admin Domain Components

#### 2.1 OrderDashboard Component
**Purpose**: 실시간 주문 모니터링 대시보드

**Responsibilities**:
- 테이블별 주문 카드 그리드 표시
- SSE를 통한 실시간 업데이트
- 신규 주문 강조 표시
- 테이블 카드 클릭 시 상세 보기

**Interface**:
- Props: `storeId: string`
- Events: `onTableClick(tableId: string)`

#### 2.2 TableCard Component
**Purpose**: 테이블별 주문 현황 카드

**Responsibilities**:
- 테이블 번호 표시
- 총 주문액 표시
- 최신 주문 n개 미리보기
- 신규 주문 애니메이션

**Interface**:
- Props: `table: TableInfo, orders: Order[]`
- Events: `onClick()`

#### 2.3 OrderDetailModal Component
**Purpose**: 주문 상세 정보 모달

**Responsibilities**:
- 전체 주문 목록 표시
- 주문 상태 변경 버튼
- 주문 삭제 버튼
- 테이블 이용 완료 버튼

**Interface**:
- Props: `tableId: string, isOpen: boolean, onClose: () => void`
- Events: `onStatusChange(orderId, status)`, `onDelete(orderId)`, `onCompleteSession()`

#### 2.4 MenuManagement Component
**Purpose**: 메뉴 관리 (CRUD)

**Responsibilities**:
- 메뉴 목록 표시
- 메뉴 추가/수정/삭제 폼
- 카테고리 관리
- 이미지 URL 입력

**Interface**:
- Props: `storeId: string`
- Events: `onSave(menu)`, `onDelete(menuId)`

#### 2.5 LoginForm Component
**Purpose**: 관리자 로그인 폼

**Responsibilities**:
- 매장 ID, 사용자명, 비밀번호 입력
- 로그인 요청
- JWT 토큰 저장 (LocalStorage)
- 에러 메시지 표시

**Interface**:
- Props: None
- Events: `onLoginSuccess(token)`

---

### 3. Shared Components

#### 3.1 Button Component
**Purpose**: 공통 버튼 컴포넌트

**Responsibilities**:
- 다양한 스타일 지원 (primary, secondary, danger)
- 로딩 상태 표시
- 비활성화 상태

**Interface**:
- Props: `variant, loading, disabled, onClick, children`

#### 3.2 Modal Component
**Purpose**: 공통 모달 컴포넌트

**Responsibilities**:
- 모달 오버레이
- 닫기 버튼
- 애니메이션

**Interface**:
- Props: `isOpen, onClose, title, children`

#### 3.3 ErrorBoundary Component
**Purpose**: React 에러 경계

**Responsibilities**:
- 컴포넌트 에러 캐치
- 에러 UI 표시
- 에러 로깅

**Interface**:
- Props: `children, fallback`

---

## Backend Components

### 4. Controllers

#### 4.1 AuthController
**Purpose**: 인증 관련 HTTP 요청 처리

**Responsibilities**:
- 고객 자동 로그인 엔드포인트
- 관리자 로그인 엔드포인트
- JWT 토큰 발급
- 토큰 검증

**Endpoints**:
- `POST /api/auth/table-login`
- `POST /api/auth/admin-login`
- `POST /api/auth/verify-token`

#### 4.2 MenuController
**Purpose**: 메뉴 관련 HTTP 요청 처리

**Responsibilities**:
- 메뉴 조회 (카테고리별)
- 메뉴 생성
- 메뉴 수정
- 메뉴 삭제

**Endpoints**:
- `GET /api/menus?storeId={storeId}&category={category}`
- `POST /api/menus`
- `PUT /api/menus/:menuId`
- `DELETE /api/menus/:menuId`

#### 4.3 OrderController
**Purpose**: 주문 관련 HTTP 요청 처리

**Responsibilities**:
- 주문 생성
- 주문 조회 (테이블별, 세션별)
- 주문 상태 변경
- 주문 삭제
- SSE 스트림 엔드포인트

**Endpoints**:
- `POST /api/orders`
- `GET /api/orders?tableId={tableId}&sessionId={sessionId}`
- `GET /api/orders/stream` (SSE)
- `PATCH /api/orders/:orderId/status`
- `DELETE /api/orders/:orderId`

#### 4.4 TableController
**Purpose**: 테이블 관련 HTTP 요청 처리

**Responsibilities**:
- 테이블 세션 종료 (이용 완료)
- 과거 주문 내역 조회

**Endpoints**:
- `POST /api/tables/:tableId/complete-session`
- `GET /api/orders/history?tableId={tableId}`

---

### 5. Domain Services

#### 5.1 AuthService
**Purpose**: 인증 비즈니스 로직

**Responsibilities**:
- JWT 토큰 생성 및 검증
- 비밀번호 해싱 및 비교 (bcrypt)
- 세션 관리

#### 5.2 MenuService
**Purpose**: 메뉴 비즈니스 로직

**Responsibilities**:
- 메뉴 유효성 검증
- 카테고리 관리
- 메뉴 정렬 로직

#### 5.3 OrderService
**Purpose**: 주문 비즈니스 로직

**Responsibilities**:
- 주문 생성 로직
- 주문 상태 관리
- 총 금액 계산
- 주문 번호 생성

#### 5.4 TableService
**Purpose**: 테이블 비즈니스 로직

**Responsibilities**:
- 테이블 세션 관리
- 세션 ID 생성
- 주문 이력 이동 로직

#### 5.5 SSEService
**Purpose**: Server-Sent Events 관리

**Responsibilities**:
- SSE 클라이언트 연결 관리
- 주문 업데이트 브로드캐스트
- 연결 유지 및 재연결

---

### 6. Repositories

#### 6.1 StoreRepository
**Purpose**: 매장 데이터 접근

**Responsibilities**:
- 매장 정보 조회
- 매장 인증 정보 조회

#### 6.2 TableRepository
**Purpose**: 테이블 데이터 접근

**Responsibilities**:
- 테이블 정보 조회
- 테이블 세션 업데이트

#### 6.3 MenuRepository
**Purpose**: 메뉴 데이터 접근

**Responsibilities**:
- 메뉴 CRUD 작업
- 카테고리별 메뉴 조회
- DynamoDB 쿼리 최적화

#### 6.4 OrderRepository
**Purpose**: 주문 데이터 접근

**Responsibilities**:
- 주문 CRUD 작업
- 세션별 주문 조회
- 주문 상태 업데이트
- GSI를 통한 효율적 쿼리

#### 6.5 OrderHistoryRepository
**Purpose**: 주문 이력 데이터 접근

**Responsibilities**:
- 주문 이력 저장
- 과거 주문 조회
- 날짜별 필터링

---

### 7. Middleware

#### 7.1 AuthMiddleware
**Purpose**: JWT 토큰 검증

**Responsibilities**:
- Authorization 헤더 파싱
- JWT 토큰 검증
- 사용자 정보 추출 및 req.user에 저장

#### 7.2 ErrorMiddleware
**Purpose**: 전역 에러 처리

**Responsibilities**:
- 에러 캐치 및 로깅
- 클라이언트 친화적 에러 응답
- 에러 타입별 HTTP 상태 코드 매핑

#### 7.3 LoggerMiddleware
**Purpose**: 요청/응답 로깅

**Responsibilities**:
- HTTP 요청 로깅
- 응답 시간 측정
- 에러 로깅

---

## Component Summary

**Frontend Components**: 15개
- Customer Domain: 5개
- Admin Domain: 5개
- Shared: 3개
- Stores (Zustand): 2개 (customer, admin)

**Backend Components**: 18개
- Controllers: 4개
- Domain Services: 5개
- Repositories: 5개
- Middleware: 3개
- Models: 5개 (Store, Table, Menu, Order, OrderHistory)

**Total Components**: 33개

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: 컴포넌트 식별 완료
