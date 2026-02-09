# User Stories

## Story Statistics
- **Total Stories**: 13
- **Customer Stories**: 5
- **Manager Stories**: 8
- **High Priority**: 8
- **Medium Priority**: 5

---

## Customer Stories

### US-001: 테이블 자동 로그인
**Title**: 테이블 태블릿 자동 로그인

**As a** Customer  
**I want** 테이블 태블릿이 자동으로 로그인되어 있기를 원한다  
**So that** 별도의 로그인 절차 없이 즉시 메뉴를 보고 주문할 수 있다

**Acceptance Criteria**:
- Given 테이블 태블릿이 초기 설정되어 있을 때
  When 태블릿을 켜면
  Then 자동으로 로그인되어 메뉴 화면이 표시된다
- Given 자동 로그인이 완료되었을 때
  When 페이지를 새로고침하면
  Then 로그인 상태가 유지되고 메뉴 화면이 표시된다

**Priority**: High  
**Estimate**: 3 Story Points  
**Technical Notes**:
- JWT 토큰을 LocalStorage에 저장
- 16시간 세션 유지
- 매장 ID, 테이블 번호, 테이블 비밀번호 기반 인증

---

### US-002: 메뉴 조회 및 탐색
**Title**: 메뉴 카테고리별 조회

**As a** Customer  
**I want** 카테고리별로 메뉴를 탐색하고 상세 정보를 확인하고 싶다  
**So that** 원하는 메뉴를 쉽게 찾고 선택할 수 있다

**Acceptance Criteria**:
- Given 메뉴 화면에 접속했을 때
  When 화면을 보면
  Then 카테고리별로 분류된 메뉴 목록이 카드 형태로 표시된다
- Given 메뉴 카드를 볼 때
  When 메뉴 카드를 확인하면
  Then 메뉴명, 가격, 설명, 이미지가 표시된다
- Given 카테고리 탭이 있을 때
  When 다른 카테고리를 선택하면
  Then 해당 카테고리의 메뉴만 필터링되어 표시된다

**Priority**: High  
**Estimate**: 5 Story Points  
**Technical Notes**:
- GET /api/menus?storeId={storeId}&category={category}
- React 컴포넌트: MenuList, MenuCard
- 이미지는 외부 URL 링크

---

### US-003: 장바구니에 메뉴 추가
**Title**: 메뉴를 장바구니에 추가

**As a** Customer  
**I want** 선택한 메뉴를 장바구니에 추가하고 싶다  
**So that** 주문 전에 여러 메뉴를 모아둘 수 있다

**Acceptance Criteria**:
- Given 메뉴 카드를 볼 때
  When "추가" 버튼을 클릭하면
  Then 해당 메뉴가 장바구니에 추가되고 확인 메시지가 표시된다
- Given 장바구니에 메뉴가 추가되었을 때
  When 장바구니 아이콘을 확인하면
  Then 장바구니 아이템 개수가 표시된다

**Priority**: High  
**Estimate**: 3 Story Points  
**Technical Notes**:
- 클라이언트 측 상태 관리 (React Context 또는 Redux)
- LocalStorage에 장바구니 저장 (페이지 새로고침 시 유지)

---

### US-004: 장바구니 관리
**Title**: 장바구니에서 수량 조절 및 삭제

**As a** Customer  
**I want** 장바구니에서 메뉴 수량을 조절하거나 삭제하고 싶다  
**So that** 주문 전에 내용을 수정할 수 있다

**Acceptance Criteria**:
- Given 장바구니에 메뉴가 있을 때
  When 수량 증가 버튼을 클릭하면
  Then 해당 메뉴의 수량이 1 증가하고 총 금액이 업데이트된다
- Given 장바구니에 메뉴가 있을 때
  When 수량 감소 버튼을 클릭하면
  Then 해당 메뉴의 수량이 1 감소하고 총 금액이 업데이트된다
- Given 메뉴 수량이 1일 때
  When 수량 감소 버튼을 클릭하면
  Then 해당 메뉴가 장바구니에서 삭제된다
- Given 장바구니에 메뉴가 있을 때
  When "삭제" 버튼을 클릭하면
  Then 해당 메뉴가 장바구니에서 즉시 삭제된다
- Given 장바구니에 메뉴가 있을 때
  When "장바구니 비우기" 버튼을 클릭하면
  Then 모든 메뉴가 삭제되고 장바구니가 비워진다

**Priority**: High  
**Estimate**: 5 Story Points  
**Technical Notes**:
- 클라이언트 측 상태 관리
- 실시간 총 금액 계산
- LocalStorage 동기화

---

### US-005: 주문 생성 및 확인
**Title**: 장바구니 내용을 주문으로 전환

**As a** Customer  
**I want** 장바구니의 메뉴를 주문하고 주문 번호를 받고 싶다  
**So that** 내 주문이 매장에 전달되었음을 확인할 수 있다

**Acceptance Criteria**:
- Given 장바구니에 메뉴가 있을 때
  When "주문하기" 버튼을 클릭하면
  Then 주문 확인 화면이 표시된다
- Given 주문 확인 화면에서
  When "확정" 버튼을 클릭하면
  Then 주문이 서버로 전송되고 주문 번호가 표시된다
- Given 주문이 성공했을 때
  When 5초 후
  Then 장바구니가 비워지고 메뉴 화면으로 자동 리다이렉트된다
- Given 주문이 실패했을 때
  When 에러가 발생하면
  Then 에러 메시지가 표시되고 장바구니 내용이 유지된다

**Priority**: High  
**Estimate**: 5 Story Points  
**Technical Notes**:
- POST /api/orders
- Request body: { storeId, tableId, sessionId, items: [{menuId, quantity, price}], totalAmount }
- Response: { orderId, orderNumber, createdAt }

---

### US-006: 주문 내역 조회
**Title**: 현재 세션의 주문 내역 확인

**As a** Customer  
**I want** 내가 주문한 내역을 확인하고 싶다  
**So that** 무엇을 주문했는지 기억하고 추가 주문을 결정할 수 있다

**Acceptance Criteria**:
- Given 주문 내역 화면에 접속했을 때
  When 화면을 보면
  Then 현재 테이블 세션의 주문 목록이 시간 역순으로 표시된다
- Given 주문 목록을 볼 때
  When 각 주문을 확인하면
  Then 주문 번호, 시각, 메뉴 목록, 총 금액, 상태가 표시된다
- Given 이전 세션의 주문이 있을 때
  When 주문 내역을 조회하면
  Then 이전 세션 주문은 표시되지 않는다

**Priority**: Medium  
**Estimate**: 3 Story Points  
**Technical Notes**:
- GET /api/orders?tableId={tableId}&sessionId={sessionId}
- 현재 세션만 필터링
- 페이지네이션 또는 무한 스크롤

---

## Manager Stories

### US-007: 관리자 로그인
**Title**: 매장 관리자 인증

**As a** Manager  
**I want** 매장 식별자와 비밀번호로 로그인하고 싶다  
**So that** 내 매장의 주문을 관리할 수 있다

**Acceptance Criteria**:
- Given 로그인 화면에서
  When 매장 ID, 사용자명, 비밀번호를 입력하고 로그인 버튼을 클릭하면
  Then JWT 토큰이 발급되고 관리자 대시보드로 이동한다
- Given 로그인에 성공했을 때
  When 16시간 이내에 페이지를 새로고침하면
  Then 로그인 상태가 유지되고 대시보드가 표시된다
- Given 로그인 정보가 잘못되었을 때
  When 로그인을 시도하면
  Then 에러 메시지가 표시되고 로그인 화면에 머문다

**Priority**: High  
**Estimate**: 3 Story Points  
**Technical Notes**:
- POST /api/auth/login
- Request: { storeId, username, password }
- Response: { token, expiresIn: "16h" }
- JWT 토큰을 LocalStorage에 저장

---

### US-008: 실시간 주문 모니터링
**Title**: 테이블별 주문 현황 실시간 확인

**As a** Manager  
**I want** 모든 테이블의 주문을 실시간으로 확인하고 싶다  
**So that** 주문을 빠르게 처리하고 누락을 방지할 수 있다

**Acceptance Criteria**:
- Given 관리자 대시보드에 접속했을 때
  When 화면을 보면
  Then 테이블별 카드가 그리드 형태로 표시된다
- Given 테이블 카드를 볼 때
  When 각 카드를 확인하면
  Then 테이블 번호, 총 주문액, 최신 주문 n개가 표시된다
- Given 신규 주문이 들어왔을 때
  When 2초 이내에
  Then 해당 테이블 카드가 강조 표시되고 주문이 추가된다
- Given 테이블 카드를 클릭했을 때
  When 카드를 클릭하면
  Then 해당 테이블의 전체 주문 목록이 상세 보기로 표시된다

**Priority**: High  
**Estimate**: 8 Story Points  
**Technical Notes**:
- GET /api/orders/stream (Server-Sent Events)
- React 컴포넌트: OrderDashboard, TableCard
- SSE 연결 유지 및 재연결 로직

---

### US-009: 주문 상태 변경
**Title**: 주문 상태를 준비중/완료로 변경

**As a** Manager  
**I want** 주문 상태를 변경하고 싶다  
**So that** 주문 진행 상황을 추적할 수 있다

**Acceptance Criteria**:
- Given 주문 목록을 볼 때
  When 주문의 상태 변경 버튼을 클릭하면
  Then 상태가 변경되고 화면에 즉시 반영된다
- Given 주문 상태가 "대기중"일 때
  When "준비중" 버튼을 클릭하면
  Then 상태가 "준비중"으로 변경된다
- Given 주문 상태가 "준비중"일 때
  When "완료" 버튼을 클릭하면
  Then 상태가 "완료"로 변경된다

**Priority**: Medium  
**Estimate**: 3 Story Points  
**Technical Notes**:
- PATCH /api/orders/{orderId}/status
- Request: { status: "pending" | "preparing" | "completed" }

---

### US-010: 주문 삭제
**Title**: 잘못된 주문 삭제

**As a** Manager  
**I want** 잘못된 주문을 삭제하고 싶다  
**So that** 주문 오류를 수정할 수 있다

**Acceptance Criteria**:
- Given 주문 목록을 볼 때
  When 주문의 "삭제" 버튼을 클릭하면
  Then 확인 팝업이 표시된다
- Given 확인 팝업에서
  When "확인" 버튼을 클릭하면
  Then 주문이 삭제되고 테이블 총 주문액이 재계산된다
- Given 확인 팝업에서
  When "취소" 버튼을 클릭하면
  Then 팝업이 닫히고 주문이 유지된다

**Priority**: Medium  
**Estimate**: 3 Story Points  
**Technical Notes**:
- DELETE /api/orders/{orderId}
- 테이블 총 주문액 실시간 업데이트

---

### US-011: 테이블 세션 종료
**Title**: 테이블 이용 완료 처리

**As a** Manager  
**I want** 테이블 이용을 완료 처리하고 싶다  
**So that** 다음 고객이 깨끗한 상태로 시작할 수 있다

**Acceptance Criteria**:
- Given 테이블 카드를 볼 때
  When "이용 완료" 버튼을 클릭하면
  Then 확인 팝업이 표시된다
- Given 확인 팝업에서
  When "확인" 버튼을 클릭하면
  Then 해당 세션의 주문이 과거 이력으로 이동하고 테이블이 리셋된다
- Given 테이블이 리셋되었을 때
  When 테이블 카드를 확인하면
  Then 현재 주문 목록과 총 주문액이 0으로 표시된다

**Priority**: High  
**Estimate**: 5 Story Points  
**Technical Notes**:
- POST /api/tables/{tableId}/complete-session
- 주문을 OrderHistory 테이블로 이동
- 새 세션 ID 생성

---

### US-012: 과거 주문 내역 조회
**Title**: 테이블별 과거 주문 조회

**As a** Manager  
**I want** 테이블의 과거 주문 내역을 조회하고 싶다  
**So that** 이전 주문 정보를 확인할 수 있다

**Acceptance Criteria**:
- Given 테이블 카드를 볼 때
  When "과거 내역" 버튼을 클릭하면
  Then 과거 주문 목록이 모달로 표시된다
- Given 과거 주문 목록을 볼 때
  When 목록을 확인하면
  Then 주문 번호, 시각, 메뉴 목록, 총 금액, 완료 시각이 시간 역순으로 표시된다
- Given 과거 주문 모달에서
  When "닫기" 버튼을 클릭하면
  Then 모달이 닫히고 대시보드로 돌아간다

**Priority**: Medium  
**Estimate**: 3 Story Points  
**Technical Notes**:
- GET /api/orders/history?tableId={tableId}
- 날짜 필터링 옵션
- 페이지네이션

---

### US-013: 메뉴 관리
**Title**: 메뉴 추가, 수정, 삭제

**As a** Manager  
**I want** 메뉴를 추가, 수정, 삭제하고 싶다  
**So that** 메뉴 정보를 최신 상태로 유지할 수 있다

**Acceptance Criteria**:
- Given 메뉴 관리 화면에서
  When "메뉴 추가" 버튼을 클릭하면
  Then 메뉴 입력 폼이 표시된다
- Given 메뉴 입력 폼에서
  When 메뉴명, 가격, 설명, 카테고리, 이미지 URL을 입력하고 저장하면
  Then 새 메뉴가 생성되고 목록에 추가된다
- Given 메뉴 목록을 볼 때
  When 메뉴의 "수정" 버튼을 클릭하면
  Then 수정 폼이 표시되고 기존 정보가 채워진다
- Given 메뉴 수정 폼에서
  When 정보를 수정하고 저장하면
  Then 메뉴 정보가 업데이트된다
- Given 메뉴 목록을 볼 때
  When 메뉴의 "삭제" 버튼을 클릭하면
  Then 확인 팝업이 표시되고 확인 시 메뉴가 삭제된다

**Priority**: Medium  
**Estimate**: 8 Story Points  
**Technical Notes**:
- POST /api/menus (생성)
- PUT /api/menus/{menuId} (수정)
- DELETE /api/menus/{menuId} (삭제)
- 필수 필드 검증
- 이미지 URL 형식 검증

---

## Story Dependencies

### 고객 워크플로우 의존성
1. US-001 (자동 로그인) → US-002 (메뉴 조회)
2. US-002 (메뉴 조회) → US-003 (장바구니 추가)
3. US-003 (장바구니 추가) → US-004 (장바구니 관리)
4. US-004 (장바구니 관리) → US-005 (주문 생성)
5. US-005 (주문 생성) → US-006 (주문 내역 조회)

### 관리자 워크플로우 의존성
1. US-007 (관리자 로그인) → US-008 (주문 모니터링)
2. US-008 (주문 모니터링) → US-009 (주문 상태 변경)
3. US-008 (주문 모니터링) → US-010 (주문 삭제)
4. US-008 (주문 모니터링) → US-011 (세션 종료)
5. US-008 (주문 모니터링) → US-012 (과거 내역 조회)
6. US-007 (관리자 로그인) → US-013 (메뉴 관리)

### 크로스 페르소나 의존성
- US-013 (메뉴 관리) → US-002 (메뉴 조회): 관리자가 생성한 메뉴를 고객이 조회
- US-005 (주문 생성) → US-008 (주문 모니터링): 고객이 생성한 주문을 관리자가 모니터링

---

## INVEST Criteria Verification

모든 스토리는 다음 INVEST 기준을 충족합니다:

- **Independent**: 각 스토리는 독립적으로 개발 가능 (의존성은 있지만 순차 개발 가능)
- **Negotiable**: 구현 방법은 협의 가능 (acceptance criteria는 결과 중심)
- **Valuable**: 각 스토리는 사용자에게 명확한 가치 제공
- **Estimable**: Story Points로 작업량 예측 가능
- **Small**: Feature 수준으로 1-2주 내 완료 가능
- **Testable**: Acceptance Criteria로 테스트 가능

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: 생성 완료
