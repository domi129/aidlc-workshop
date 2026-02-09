# Admin Unit - Domain Entities

## Overview
Admin Unit의 도메인 엔티티 정의 및 관계를 문서화합니다.

---

## Core Entities

### 1. Admin (관리자)

**Purpose**: 매장 관리자 정보를 표현

**Attributes**:
- `adminId` (string, PK): 관리자 고유 식별자 (UUID)
- `storeId` (string, FK): 소속 매장 식별자
- `username` (string): 로그인 사용자명 (unique per store)
- `passwordHash` (string): bcrypt 해시된 비밀번호
- `email` (string, optional): 이메일 주소
- `createdAt` (timestamp): 생성 시각
- `updatedAt` (timestamp): 수정 시각

**Business Rules**:
- username은 매장 내에서 고유해야 함
- passwordHash는 bcrypt로 해싱 (salt rounds: 10)
- 하나의 매장에 여러 관리자 존재 가능

**Relationships**:
- Admin N:1 Store (한 관리자는 하나의 매장에 소속)
- Admin 1:N AdminSession (한 관리자는 여러 세션 가질 수 있음)

---

### 2. AdminSession (관리자 세션)

**Purpose**: 관리자 로그인 세션 정보

**Attributes**:
- `sessionId` (string, PK): 세션 고유 식별자 (UUID)
- `adminId` (string, FK): 관리자 식별자
- `storeId` (string): 매장 식별자 (빠른 조회용)
- `token` (string): JWT 토큰
- `expiresAt` (timestamp): 만료 시각 (16시간 후)
- `createdAt` (timestamp): 생성 시각
- `lastAccessedAt` (timestamp): 마지막 접근 시각

**Business Rules**:
- 세션은 16시간 후 자동 만료
- 만료된 세션은 토큰 갱신 불가
- 하나의 관리자가 여러 디바이스에서 동시 로그인 가능

**Relationships**:
- AdminSession N:1 Admin

---

### 3. Store (매장)

**Purpose**: 매장 정보

**Attributes**:
- `storeId` (string, PK): 매장 고유 식별자
- `storeName` (string): 매장명
- `address` (string, optional): 매장 주소
- `phoneNumber` (string, optional): 전화번호
- `createdAt` (timestamp): 생성 시각
- `updatedAt` (timestamp): 수정 시각

**Business Rules**:
- storeId는 시스템 전체에서 고유
- 매장 삭제 시 관련 데이터 처리 필요 (cascade 또는 soft delete)

**Relationships**:
- Store 1:N Admin
- Store 1:N Table
- Store 1:N Menu
- Store 1:N Order

---

### 4. Order (주문)

**Purpose**: 고객 주문 정보

**Attributes**:
- `orderId` (string, PK): 주문 고유 식별자 (UUID)
- `storeId` (string, FK): 매장 식별자
- `tableId` (string, FK): 테이블 식별자
- `sessionId` (string): 테이블 세션 식별자
- `orderNumber` (number): 주문 번호 (매장 내 순차 번호)
- `items` (OrderItem[]): 주문 항목 목록
- `totalAmount` (number): 총 주문 금액
- `status` (OrderStatus): 주문 상태
- `createdAt` (timestamp): 주문 생성 시각
- `updatedAt` (timestamp): 주문 수정 시각
- `completedAt` (timestamp, optional): 완료 시각

**Business Rules**:
- orderNumber는 매장 내에서 순차적으로 증가
- totalAmount는 items의 합계와 일치해야 함
- status는 PENDING → PREPARING → COMPLETED 순서로만 전환 가능
- PENDING 상태의 주문만 삭제 가능

**Relationships**:
- Order N:1 Store
- Order N:1 Table
- Order 1:N OrderItem (embedded)

---

### 5. OrderItem (주문 항목)

**Purpose**: 주문 내 개별 메뉴 항목

**Attributes**:
- `menuId` (string): 메뉴 식별자
- `menuName` (string): 메뉴명 (스냅샷)
- `quantity` (number): 수량
- `unitPrice` (number): 단가 (스냅샷)
- `subtotal` (number): 소계 (quantity × unitPrice)

**Business Rules**:
- menuName과 unitPrice는 주문 시점의 값을 저장 (스냅샷)
- quantity는 1 이상이어야 함
- subtotal = quantity × unitPrice

**Note**: OrderItem은 Order 엔티티에 embedded되어 저장됨 (DynamoDB List)

---

### 6. OrderStatus (주문 상태)

**Purpose**: 주문 상태를 나타내는 enum

**Values**:
- `PENDING`: 대기중 (주문 생성 직후)
- `PREPARING`: 준비중 (주방에서 조리 중)
- `COMPLETED`: 완료 (고객에게 서빙 완료)

**State Transitions**:
```
PENDING → PREPARING → COMPLETED
```

**Business Rules**:
- 순차적 전환만 허용 (역방향 불가)
- PENDING 상태에서만 주문 삭제 가능
- COMPLETED 상태는 최종 상태 (더 이상 변경 불가)

---

### 7. Table (테이블)

**Purpose**: 매장 내 테이블 정보

**Attributes**:
- `tableId` (string, PK): 테이블 고유 식별자 (UUID)
- `storeId` (string, FK): 매장 식별자
- `tableNumber` (string): 테이블 번호 (매장 내 고유)
- `tablePassword` (string): 테이블 비밀번호
- `currentSessionId` (string, optional): 현재 활성 세션 ID
- `sessionStartTime` (timestamp, optional): 현재 세션 시작 시각
- `createdAt` (timestamp): 생성 시각
- `updatedAt` (timestamp): 수정 시각

**Business Rules**:
- tableNumber는 매장 내에서 고유
- currentSessionId가 null이면 테이블 사용 가능
- 세션은 4시간 후 자동 만료

**Relationships**:
- Table N:1 Store
- Table 1:N Order (현재 세션)

---

### 8. TableSession (테이블 세션)

**Purpose**: 테이블 사용 세션 정보 (논리적 개념)

**Attributes**:
- `sessionId` (string): 세션 고유 식별자 (UUID)
- `tableId` (string): 테이블 식별자
- `storeId` (string): 매장 식별자
- `startTime` (timestamp): 세션 시작 시각
- `endTime` (timestamp, optional): 세션 종료 시각
- `status` (SessionStatus): 세션 상태

**Business Rules**:
- 세션은 첫 주문 생성 시 자동 시작
- 세션은 관리자가 "이용 완료" 처리 시 종료
- 세션은 4시간 후 자동 만료
- 종료된 세션의 주문은 OrderHistory로 이동

**Note**: TableSession은 Table 엔티티의 currentSessionId로 추적됨 (별도 테이블 없음)

---

### 9. SessionStatus (세션 상태)

**Purpose**: 테이블 세션 상태를 나타내는 enum

**Values**:
- `ACTIVE`: 활성 (고객 사용 중)
- `COMPLETED`: 완료 (이용 완료 처리됨)
- `EXPIRED`: 만료 (4시간 자동 만료)

**Business Rules**:
- ACTIVE 상태에서만 주문 생성 가능
- COMPLETED 또는 EXPIRED 상태의 주문은 OrderHistory로 이동

---

### 10. Menu (메뉴)

**Purpose**: 매장 메뉴 정보

**Attributes**:
- `menuId` (string, PK): 메뉴 고유 식별자 (UUID)
- `storeId` (string, FK): 매장 식별자
- `menuName` (string): 메뉴명
- `price` (number): 가격
- `description` (string, optional): 메뉴 설명
- `category` (MenuCategory): 메뉴 카테고리
- `imageUrl` (string, optional): 이미지 URL (S3)
- `displayOrder` (number): 노출 순서
- `isAvailable` (boolean): 판매 가능 여부
- `createdAt` (timestamp): 생성 시각
- `updatedAt` (timestamp): 수정 시각

**Business Rules**:
- menuName은 매장 내에서 고유 (권장)
- price는 0보다 커야 함
- displayOrder는 카테고리 내 정렬 순서
- isAvailable이 false면 고객에게 노출 안 됨

**Relationships**:
- Menu N:1 Store

---

### 11. MenuCategory (메뉴 카테고리)

**Purpose**: 메뉴 카테고리를 나타내는 enum

**Values**:
- `APPETIZER`: 애피타이저
- `MAIN`: 메인 요리
- `DESSERT`: 디저트
- `BEVERAGE`: 음료
- `ALCOHOL`: 주류
- `OTHER`: 기타

**Business Rules**:
- 카테고리는 고정된 값 사용
- 새 카테고리 추가 시 enum 확장 필요

---

### 12. OrderHistory (주문 이력)

**Purpose**: 완료된 테이블 세션의 주문 이력

**Attributes**:
- `historyId` (string, PK): 이력 고유 식별자 (UUID)
- `orderId` (string): 원본 주문 식별자
- `storeId` (string): 매장 식별자
- `tableId` (string): 테이블 식별자
- `sessionId` (string): 세션 식별자
- `orderNumber` (number): 주문 번호
- `items` (OrderItem[]): 주문 항목 목록
- `totalAmount` (number): 총 주문 금액
- `status` (OrderStatus): 최종 주문 상태
- `createdAt` (timestamp): 원본 주문 생성 시각
- `archivedAt` (timestamp): 이력 이동 시각
- `expiresAt` (timestamp): 자동 삭제 시각 (90일 후)

**Business Rules**:
- 테이블 세션 종료 시 Order에서 OrderHistory로 이동
- 90일 후 자동 삭제 (TTL)
- 읽기 전용 (수정 불가)

**Relationships**:
- OrderHistory는 독립적 (FK 없음, 스냅샷)

---

## Entity Relationships Diagram

```
Store
  ├─→ Admin (1:N)
  │     └─→ AdminSession (1:N)
  ├─→ Table (1:N)
  │     └─→ Order (1:N, current session)
  ├─→ Menu (1:N)
  └─→ Order (1:N)
        └─→ OrderItem (1:N, embedded)

OrderHistory (독립적, 스냅샷)
```

---

## DynamoDB Table Design

### Tables (6개)

1. **Stores**: Store 엔티티
   - PK: storeId

2. **Admins**: Admin 엔티티
   - PK: adminId
   - GSI: storeId-username-index (매장 내 username 고유성)

3. **AdminSessions**: AdminSession 엔티티
   - PK: sessionId
   - GSI: adminId-index (관리자별 세션 조회)
   - TTL: expiresAt (16시간 후 자동 삭제)

4. **Tables**: Table 엔티티
   - PK: tableId
   - GSI: storeId-tableNumber-index (매장 내 테이블 조회)

5. **Orders**: Order 엔티티
   - PK: orderId
   - GSI: storeId-createdAt-index (매장별 주문 조회, 시간순 정렬)
   - GSI: tableId-sessionId-index (테이블 세션별 주문 조회)

6. **Menus**: Menu 엔티티
   - PK: menuId
   - GSI: storeId-category-index (매장별 카테고리별 조회)

7. **OrderHistory**: OrderHistory 엔티티
   - PK: historyId
   - GSI: tableId-archivedAt-index (테이블별 이력 조회)
   - TTL: expiresAt (90일 후 자동 삭제)

---

## Data Consistency

**Consistency Model**: Eventual Consistency (DynamoDB 기본)

**Read Operations**:
- 기본적으로 Eventually Consistent Read 사용
- 성능 우선, 최종 일관성 보장

**Write Operations**:
- Last-write-wins (동시 수정 시 마지막 쓰기 적용)
- 낙관적 동시성 제어 없음 (MVP 단순화)

**Trade-offs**:
- 성능 향상 (낮은 레이턴시)
- 일시적 불일치 가능 (수 밀리초 이내 해소)
- MVP에 적합한 단순한 모델

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: Domain Entities 정의 완료
