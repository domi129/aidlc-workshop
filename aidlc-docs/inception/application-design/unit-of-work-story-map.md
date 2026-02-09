# Unit of Work Story Mapping

이 문서는 각 User Story를 Unit of Work에 매핑하고, Story 간 의존성을 정의합니다.

---

## Story to Unit Mapping

### Customer Unit Stories (6개, 19 Story Points)

| Story ID | Title | Priority | Estimate | Unit |
|----------|-------|----------|----------|------|
| US-001 | 테이블 자동 로그인 | High | 3 SP | Customer |
| US-002 | 메뉴 조회 및 탐색 | High | 5 SP | Customer |
| US-003 | 장바구니에 메뉴 추가 | High | 3 SP | Customer |
| US-004 | 장바구니 관리 | High | 5 SP | Customer |
| US-005 | 주문 생성 및 확인 | High | 5 SP | Customer |
| US-006 | 주문 내역 조회 | Medium | 3 SP | Customer |

**Total**: 19 Story Points

---

### Admin Unit Stories (7개, 32 Story Points)

| Story ID | Title | Priority | Estimate | Unit |
|----------|-------|----------|----------|------|
| US-007 | 관리자 로그인 | High | 3 SP | Admin |
| US-008 | 실시간 주문 모니터링 | High | 8 SP | Admin |
| US-009 | 주문 상태 변경 | Medium | 3 SP | Admin |
| US-010 | 주문 삭제 | Medium | 3 SP | Admin |
| US-011 | 테이블 세션 종료 | High | 5 SP | Admin |
| US-012 | 과거 주문 내역 조회 | Medium | 3 SP | Admin |
| US-013 | 메뉴 관리 | Medium | 8 SP | Admin |

**Total**: 32 Story Points

---

## Story Dependencies

### Customer Unit Internal Dependencies

```
US-001 (자동 로그인)
  ↓
US-002 (메뉴 조회)
  ↓
US-003 (장바구니 추가)
  ↓
US-004 (장바구니 관리)
  ↓
US-005 (주문 생성)
  ↓
US-006 (주문 내역 조회)
```

**설명**:
- US-001은 모든 기능의 전제 조건 (로그인 필요)
- US-002는 US-003의 전제 조건 (메뉴를 봐야 추가 가능)
- US-003은 US-004의 전제 조건 (장바구니에 아이템이 있어야 관리 가능)
- US-004는 US-005의 전제 조건 (장바구니 내용을 주문으로 전환)
- US-005는 US-006의 전제 조건 (주문이 있어야 내역 조회 가능)

---

### Admin Unit Internal Dependencies

```
US-007 (관리자 로그인)
  ↓
  ├─→ US-008 (실시간 주문 모니터링)
  │     ↓
  │     ├─→ US-009 (주문 상태 변경)
  │     ├─→ US-010 (주문 삭제)
  │     └─→ US-011 (테이블 세션 종료)
  │           ↓
  │           └─→ US-012 (과거 주문 내역 조회)
  └─→ US-013 (메뉴 관리)
```

**설명**:
- US-007은 모든 관리자 기능의 전제 조건
- US-008은 US-009, US-010, US-011의 전제 조건 (주문을 봐야 관리 가능)
- US-011은 US-012의 전제 조건 (세션 종료 후 과거 내역 생성)
- US-013은 독립적 (다른 Story와 의존성 없음)

---

## Cross-Unit Dependencies

### Customer → Admin

| Customer Story | Admin Story | Dependency Type | Description |
|----------------|-------------|-----------------|-------------|
| US-005 (주문 생성) | US-008 (주문 모니터링) | Data Flow | 고객이 생성한 주문을 관리자가 모니터링 |

**설명**:
- Customer가 주문을 생성하면 (US-005)
- SSE를 통해 Admin에게 실시간 전달 (US-008)
- 이는 데이터 흐름 의존성이지 코드 의존성은 아님

### Admin → Customer

| Admin Story | Customer Story | Dependency Type | Description |
|-------------|----------------|-----------------|-------------|
| US-013 (메뉴 관리) | US-002 (메뉴 조회) | Data Flow | 관리자가 생성한 메뉴를 고객이 조회 |

**설명**:
- Admin이 메뉴를 생성/수정하면 (US-013)
- Customer가 업데이트된 메뉴를 조회 (US-002)
- 이는 데이터 흐름 의존성이지 코드 의존성은 아님

---

## Development Priority

### Phase 1: Foundation (병렬 개발 가능)

**Team A (Customer)**:
1. US-001: 테이블 자동 로그인 (3 SP)
2. US-002: 메뉴 조회 및 탐색 (5 SP)

**Team B (Admin)**:
1. US-007: 관리자 로그인 (3 SP)
2. US-013: 메뉴 관리 (8 SP)

**Total**: 19 SP (병렬 개발 시 최대 8 SP)

---

### Phase 2: Core Features (병렬 개발 가능)

**Team A (Customer)**:
3. US-003: 장바구니에 메뉴 추가 (3 SP)
4. US-004: 장바구니 관리 (5 SP)
5. US-005: 주문 생성 및 확인 (5 SP)

**Team B (Admin)**:
3. US-008: 실시간 주문 모니터링 (8 SP)

**Total**: 21 SP (병렬 개발 시 최대 13 SP)

**Integration Point**: US-005 완료 후 US-008과 통합 테스트 필요

---

### Phase 3: Additional Features (병렬 개발 가능)

**Team A (Customer)**:
6. US-006: 주문 내역 조회 (3 SP)

**Team B (Admin)**:
4. US-009: 주문 상태 변경 (3 SP)
5. US-010: 주문 삭제 (3 SP)
6. US-011: 테이블 세션 종료 (5 SP)
7. US-012: 과거 주문 내역 조회 (3 SP)

**Total**: 17 SP (병렬 개발 시 최대 14 SP)

---

## Story Mapping by Feature

### Authentication Feature
- **Customer**: US-001 (테이블 자동 로그인)
- **Admin**: US-007 (관리자 로그인)
- **Shared**: AuthService, JWT 토큰

### Menu Feature
- **Customer**: US-002 (메뉴 조회)
- **Admin**: US-013 (메뉴 관리)
- **Shared**: MenuService, MenuRepository

### Order Feature
- **Customer**: US-005 (주문 생성), US-006 (주문 내역 조회)
- **Admin**: US-008 (주문 모니터링), US-009 (상태 변경), US-010 (주문 삭제)
- **Shared**: OrderService, OrderRepository, SSEService

### Cart Feature
- **Customer**: US-003 (장바구니 추가), US-004 (장바구니 관리)
- **Admin**: None
- **Shared**: None (클라이언트 측 전용)

### Table Feature
- **Customer**: None
- **Admin**: US-011 (세션 종료), US-012 (과거 내역 조회)
- **Shared**: TableService, TableRepository, OrderHistoryRepository

---

## Validation

### All Stories Mapped
✅ 13개 Story 모두 Unit에 매핑됨
- Customer Unit: 6개
- Admin Unit: 7개

### All Components Assigned
✅ 33개 컴포넌트 모두 Unit에 할당됨
- Customer Unit: 13개 (Frontend 5 + Backend 8)
- Admin Unit: 17개 (Frontend 5 + Backend 12)
- Shared: 3개 (공통 컴포넌트)

### Dependencies Clear
✅ Unit 간 의존성 명확히 정의됨
- API 기반 통신
- 데이터 흐름 의존성만 존재
- 코드 의존성 없음 (도메인 격리)

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: Story 매핑 완료
