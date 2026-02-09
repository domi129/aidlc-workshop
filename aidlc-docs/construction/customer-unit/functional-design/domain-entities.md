# Customer Unit - Domain Entities

## Overview
Customer Unit에서 사용하는 도메인 엔티티와 그 관계를 정의합니다.

---

## 1. Core Entities

### 1.1 Table (테이블)

**설명**: 매장의 물리적 테이블을 나타내는 엔티티

**속성**:
```typescript
interface Table {
  tableId: string;           // PK, UUID
  storeId: string;           // FK to Store
  tableNumber: string;       // 테이블 번호 (예: "1", "A-1")
  tablePassword: string;     // 해시된 비밀번호
  sessionId: string;         // 현재 세션 ID
  sessionStartedAt?: string; // 세션 시작 시각 (ISO 8601)
  createdAt: string;         // 생성 시각
  updatedAt: string;         // 수정 시각
}
```

**비즈니스 규칙**:
- 테이블 번호는 매장 내에서 고유해야 함
- 세션 ID는 테이블 이용 시작 시 생성됨
- 세션 종료 시 새로운 세션 ID 생성

**생명주기**:
1. 생성: 관리자가 테이블 등록
2. 활성화: 고객이 테이블 로그인 (세션 시작)
3. 사용 중: 주문 생성 및 관리
4. 종료: 관리자가 테이블 이용 완료 처리 (세션 종료)
5. 재활성화: 새 고객이 로그인 (새 세션 시작)

---

### 1.2 Menu (메뉴)

**설명**: 매장에서 제공하는 메뉴 항목

**속성**:
```typescript
interface Menu {
  menuId: string;           // PK, UUID
  storeId: string;          // FK to Store
  menuName: string;         // 메뉴명
  price: number;            // 가격 (정수, 원 단위)
  description: string;      // 메뉴 설명
  imageUrl?: string;        // 이미지 URL (외부 링크)
  category: string;         // 카테고리 (예: "메인", "사이드", "음료")
  displayOrder: number;     // 표시 순서
  isAvailable: boolean;     // 주문 가능 여부 (품절 여부)
  createdAt: string;        // 생성 시각
  updatedAt: string;        // 수정 시각
}
```

**비즈니스 규칙**:
- 가격은 0보다 커야 함
- 카테고리는 매장에서 정의한 목록 중 하나여야 함
- 품절 메뉴는 주문 불가

**생명주기**:
1. 생성: 관리자가 메뉴 등록
2. 활성화: isAvailable = true
3. 품절: isAvailable = false
4. 수정: 관리자가 정보 업데이트
5. 삭제: 관리자가 메뉴 삭제 (soft delete 권장)

---

### 1.3 CartItem (장바구니 항목)

**설명**: 고객이 주문하기 전 임시로 담은 메뉴 항목 (클라이언트 측 전용)

**속성**:
```typescript
interface CartItem {
  menuId: string;           // FK to Menu
  menuName: string;         // 메뉴명 (캐시)
  price: number;            // 가격 (캐시)
  quantity: number;         // 수량 (1~99)
  imageUrl?: string;        // 이미지 URL (캐시)
}
```

**비즈니스 규칙**:
- 수량은 1 이상 99 이하
- 동일 메뉴는 하나의 CartItem으로 관리 (수량 증가)
- 주문 생성 시 서버에서 최신 가격으로 재검증

**생명주기**:
1. 생성: 사용자가 메뉴 추가
2. 수정: 수량 증가/감소
3. 삭제: 수량 0 또는 사용자가 삭제
4. 소멸: 주문 생성 성공 시 장바구니 비우기

---

### 1.4 Cart (장바구니)

**설명**: 장바구니 전체를 나타내는 집합 엔티티 (클라이언트 측 전용)

**속성**:
```typescript
interface Cart {
  items: CartItem[];        // 장바구니 항목 목록
  totalAmount: number;      // 총 금액 (계산값)
  lastUpdated: string;      // 마지막 업데이트 시각 (ISO 8601)
}
```

**비즈니스 규칙**:
- totalAmount = Σ(item.price × item.quantity)
- LocalStorage에 저장 (키: `cart_${tableId}_${sessionId}`)
- 페이지 새로고침 시에도 유지

**생명주기**:
1. 생성: 첫 메뉴 추가 시
2. 업데이트: 항목 추가/수정/삭제 시
3. 비우기: 주문 생성 성공 또는 사용자가 비우기
4. 소멸: 세션 종료 시

---

### 1.5 Order (주문)

**설명**: 고객이 생성한 주문

**속성**:
```typescript
interface Order {
  orderId: string;          // PK, UUID
  orderNumber: string;      // 주문 번호 (날짜 + 순번: 20260209-001)
  storeId: string;          // FK to Store
  tableId: string;          // FK to Table
  sessionId: string;        // 세션 ID
  items: OrderItem[];       // 주문 항목 목록
  totalAmount: number;      // 총 금액
  status: OrderStatus;      // 주문 상태
  createdAt: string;        // 주문 생성 시각
  updatedAt: string;        // 주문 수정 시각
  completedAt?: string;     // 주문 완료 시각
}

interface OrderItem {
  menuId: string;           // FK to Menu
  menuName: string;         // 메뉴명 (스냅샷)
  price: number;            // 주문 시점 가격 (스냅샷)
  quantity: number;         // 수량
}

enum OrderStatus {
  PENDING = "pending",      // 대기중
  PREPARING = "preparing",  // 준비중
  COMPLETED = "completed"   // 완료
}
```

**비즈니스 규칙**:
- 주문 번호는 날짜 + 순번 형식 (예: 20260209-001)
- 주문 항목은 최소 1개 이상
- 총 금액은 주문 시점의 가격으로 고정 (스냅샷)
- 상태 변경은 PENDING → PREPARING → COMPLETED 순서

**생명주기**:
1. 생성: 고객이 주문 확정 (status = PENDING)
2. 준비 중: 관리자가 상태 변경 (status = PREPARING)
3. 완료: 관리자가 상태 변경 (status = COMPLETED)
4. 보관: 세션 종료 시 OrderHistory로 이동

---

### 1.6 Session (세션)

**설명**: 테이블의 이용 세션 (논리적 엔티티, 별도 테이블 없음)

**속성**:
```typescript
interface Session {
  sessionId: string;        // PK, UUID
  tableId: string;          // FK to Table
  storeId: string;          // FK to Store
  startedAt: string;        // 세션 시작 시각
  endedAt?: string;         // 세션 종료 시각
  totalOrders: number;      // 총 주문 수
  totalAmount: number;      // 총 주문 금액
}
```

**비즈니스 규칙**:
- 세션은 테이블 로그인 시 시작
- 세션은 관리자가 "이용 완료" 처리 시 종료
- 세션 종료 시 해당 세션의 모든 주문이 OrderHistory로 이동

**생명주기**:
1. 시작: 고객이 테이블 로그인
2. 활성: 주문 생성 및 관리
3. 종료: 관리자가 이용 완료 처리
4. 보관: 세션 정보는 OrderHistory에 포함

---

## 2. Entity Relationships

### 2.1 Entity Relationship Diagram (ERD)

```
Store (매장)
  ↓ 1:N
Table (테이블)
  ↓ 1:N
Session (세션) [논리적]
  ↓ 1:N
Order (주문)
  ↓ 1:N
OrderItem (주문 항목)
  ↓ N:1
Menu (메뉴)

Cart (장바구니) [클라이언트 전용]
  ↓ 1:N
CartItem (장바구니 항목)
  ↓ N:1
Menu (메뉴)
```

### 2.2 Relationship Details

**Store ↔ Table**:
- 관계: 1:N (한 매장은 여러 테이블을 가짐)
- 외래 키: Table.storeId → Store.storeId

**Table ↔ Session**:
- 관계: 1:N (한 테이블은 여러 세션을 가짐, 시간에 따라)
- 외래 키: Session.tableId → Table.tableId
- 현재 세션: Table.sessionId

**Session ↔ Order**:
- 관계: 1:N (한 세션은 여러 주문을 가짐)
- 외래 키: Order.sessionId

**Order ↔ OrderItem**:
- 관계: 1:N (한 주문은 여러 주문 항목을 가짐)
- 포함 관계: OrderItem은 Order의 일부

**OrderItem ↔ Menu**:
- 관계: N:1 (여러 주문 항목이 하나의 메뉴를 참조)
- 외래 키: OrderItem.menuId → Menu.menuId
- 스냅샷: OrderItem은 주문 시점의 메뉴 정보를 저장

**Cart ↔ CartItem**:
- 관계: 1:N (한 장바구니는 여러 항목을 가짐)
- 포함 관계: CartItem은 Cart의 일부
- 저장 위치: LocalStorage (클라이언트 측)

**CartItem ↔ Menu**:
- 관계: N:1 (여러 장바구니 항목이 하나의 메뉴를 참조)
- 외래 키: CartItem.menuId → Menu.menuId
- 캐시: CartItem은 메뉴 정보를 캐시

---

## 3. Data Flow

### 3.1 주문 생성 데이터 흐름

```
[고객] 메뉴 선택
    ↓
[CartItem] 장바구니에 추가 (클라이언트)
    ↓
[Cart] 장바구니 업데이트 (LocalStorage)
    ↓
[고객] 주문 확정
    ↓
[API] POST /api/orders
    Request: Cart → Order 변환
    ↓
[백엔드] Order 생성
    - Menu 정보 조회 (최신 가격)
    - OrderItem 생성 (스냅샷)
    - DynamoDB 저장
    ↓
[응답] Order 정보 반환
    ↓
[클라이언트] Cart 비우기
```

### 3.2 주문 내역 조회 데이터 흐름

```
[고객] 주문 내역 화면 진입
    ↓
[API] GET /api/orders?tableId={tableId}&sessionId={sessionId}
    ↓
[백엔드] Order 목록 조회
    - 현재 세션의 주문만 필터링
    - 시간 역순 정렬
    ↓
[응답] Order[] 반환
    ↓
[클라이언트] 주문 목록 표시
```

### 3.3 실시간 상태 업데이트 데이터 흐름

```
[관리자] 주문 상태 변경
    ↓
[백엔드] Order.status 업데이트
    ↓
[SSE] 상태 변경 이벤트 발송
    Event: { orderId, status }
    ↓
[클라이언트] SSE 이벤트 수신
    ↓
[UI] 해당 주문의 상태 배지 업데이트
```

---

## 4. Entity Validation Rules

### 4.1 Table Validation

- `tableNumber`: 필수, 1~50자, 매장 내 고유
- `tablePassword`: 필수, 최소 4자, bcrypt 해시
- `sessionId`: UUID v4 형식

### 4.2 Menu Validation

- `menuName`: 필수, 1~100자
- `price`: 필수, 0보다 큰 정수
- `category`: 필수, 매장 정의 카테고리 목록 중 하나
- `imageUrl`: 선택, 유효한 URL 형식

### 4.3 CartItem Validation

- `quantity`: 필수, 1~99 범위
- `price`: 필수, 0보다 큰 정수

### 4.4 Order Validation

- `items`: 필수, 최소 1개 이상
- `totalAmount`: 필수, Σ(item.price × item.quantity)와 일치
- `status`: 필수, OrderStatus enum 값 중 하나

---

## 5. Entity State Transitions

### 5.1 Order Status Transitions

```
[PENDING] 대기중
    ↓ (관리자가 "준비중" 클릭)
[PREPARING] 준비중
    ↓ (관리자가 "완료" 클릭)
[COMPLETED] 완료
```

**규칙**:
- PENDING → PREPARING만 가능
- PREPARING → COMPLETED만 가능
- 역방향 전환 불가
- COMPLETED 상태에서는 삭제만 가능

### 5.2 Session State Transitions

```
[NOT_STARTED] 세션 없음
    ↓ (고객 로그인)
[ACTIVE] 활성 세션
    ↓ (관리자가 "이용 완료" 클릭)
[ENDED] 종료된 세션
    ↓ (새 고객 로그인)
[ACTIVE] 새 세션 시작
```

---

## 6. Data Persistence

### 6.1 Backend (DynamoDB)

**저장 엔티티**:
- Store
- Table
- Menu
- Order
- OrderHistory

**저장 방식**:
- 파티션 키: 엔티티별 ID (storeId, tableId, menuId, orderId)
- 글로벌 보조 인덱스 (GSI): storeId, sessionId

### 6.2 Frontend (LocalStorage)

**저장 엔티티**:
- Cart
- AuthTokens (accessToken, refreshToken)
- TableInfo (storeId, tableId, tableNumber)

**저장 키**:
- `cart_${tableId}_${sessionId}`: 장바구니
- `auth_tokens`: 인증 토큰
- `table_info`: 테이블 정보

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: 생성 완료
