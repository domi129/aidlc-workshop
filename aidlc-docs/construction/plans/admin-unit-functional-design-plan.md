# Admin Unit - Functional Design Plan

## Unit Context

**Unit Name**: Admin Unit

**Purpose**: 매장 관리자가 주문을 실시간으로 모니터링하고 매장을 관리하는 기능 제공

**Assigned Stories** (7개, 32 Story Points):
- US-007: 관리자 로그인 (3 SP)
- US-008: 실시간 주문 모니터링 (8 SP)
- US-009: 주문 상태 변경 (3 SP)
- US-010: 주문 삭제 (3 SP)
- US-011: 테이블 세션 종료 (5 SP)
- US-012: 과거 주문 내역 조회 (3 SP)
- US-013: 메뉴 관리 (8 SP)

---

## Planning Questions

다음 질문에 답변하여 Functional Design 방향을 결정해주세요.

### Question 1: Business Logic Complexity
관리자 인증 로직의 복잡도는 어느 정도입니까?

A) Simple - 기본 username/password 검증만
B) Standard - 기본 검증 + 세션 관리 + 토큰 갱신
C) Complex - 표준 + 역할 기반 권한 + 다중 매장 지원
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 2: Order State Machine
주문 상태 전환 로직을 어떻게 모델링하시겠습니까?

A) Simple transitions - PENDING → PREPARING → COMPLETED (순차적)
B) Flexible transitions - 모든 상태 간 자유로운 전환 가능
C) State machine - 명시적 상태 전환 규칙 및 검증
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 3: SSE Connection Management
실시간 주문 모니터링의 SSE 연결 관리는 어떻게 하시겠습니까?

A) Simple - 단일 SSE 스트림, 모든 주문 브로드캐스트
B) Per-store - 매장별 SSE 스트림, 해당 매장 주문만 전송
C) Per-admin - 관리자별 SSE 스트림, 권한 기반 필터링
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4: Table Session Lifecycle
테이블 세션 종료 시 비즈니스 로직은 어떻게 처리하시겠습니까?

A) Simple archive - 주문을 OrderHistory로 이동만
B) Full cleanup - 주문 이동 + 테이블 상태 리셋 + 세션 ID 갱신
C) Transactional - 전체 작업을 트랜잭션으로 처리 (all-or-nothing)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5: Menu Management Validation
메뉴 생성/수정 시 비즈니스 규칙 검증은 어느 수준입니까?

A) Basic - 필수 필드만 검증 (이름, 가격)
B) Standard - 기본 + 가격 범위, 카테고리 유효성
C) Comprehensive - 표준 + 중복 검사, 이미지 검증, 순서 검증
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 6: Order Deletion Business Rules
주문 삭제 시 비즈니스 규칙은 무엇입니까?

A) Always allow - 모든 주문 삭제 가능
B) Status-based - 특정 상태의 주문만 삭제 가능 (예: PENDING만)
C) Soft delete - 실제 삭제 대신 deleted 플래그 설정
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 7: Historical Data Retention
과거 주문 내역의 보관 정책은 어떻게 하시겠습니까?

A) Indefinite - 모든 과거 주문 영구 보관
B) Time-based - 일정 기간 후 자동 삭제 (예: 90일)
C) Manual - 관리자가 수동으로 삭제
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 8: Concurrent Admin Actions
여러 관리자가 동시에 같은 주문을 수정할 때 처리 방식은?

A) Last-write-wins - 마지막 수정이 적용됨
B) Optimistic locking - 버전 체크 후 충돌 시 에러
C) Pessimistic locking - 수정 중 다른 관리자 접근 차단
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 9: Error Handling Strategy
비즈니스 로직 에러 처리 전략은?

A) Fail fast - 에러 발생 시 즉시 실패 반환
B) Graceful degradation - 일부 실패해도 가능한 작업 계속
C) Retry with fallback - 재시도 후 실패 시 대체 로직
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 10: Data Consistency Requirements
데이터 일관성 요구사항은?

A) Eventual consistency - 최종 일관성 (DynamoDB 기본)
B) Strong consistency - 강한 일관성 (DynamoDB ConsistentRead)
C) Transactional - DynamoDB Transactions 사용
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Functional Design Execution Plan

### Phase 1: Domain Model Definition
- [x] **Step 1.1**: Admin 도메인 엔티티 정의
  - [x] Admin 엔티티 (관리자 정보)
  - [x] AdminSession 엔티티 (관리자 세션)
  - [x] Store 엔티티 (매장 정보)
  - [x] 엔티티 간 관계 정의

- [x] **Step 1.2**: Order 도메인 엔티티 정의
  - [x] Order 엔티티 (주문 정보)
  - [x] OrderItem 엔티티 (주문 항목)
  - [x] OrderStatus enum (주문 상태)
  - [x] 상태 전환 규칙 정의

- [x] **Step 1.3**: Table 도메인 엔티티 정의
  - [x] Table 엔티티 (테이블 정보)
  - [x] TableSession 엔티티 (테이블 세션)
  - [x] SessionStatus enum (세션 상태)

- [x] **Step 1.4**: Menu 도메인 엔티티 정의
  - [x] Menu 엔티티 (메뉴 정보)
  - [x] MenuCategory enum (메뉴 카테고리)
  - [x] 메뉴 검증 규칙 정의

- [x] **Step 1.5**: OrderHistory 도메인 엔티티 정의
  - [x] OrderHistory 엔티티 (과거 주문)
  - [x] 보관 정책 정의

### Phase 2: Business Logic Modeling
- [x] **Step 2.1**: 관리자 인증 로직 모델링
  - [x] 로그인 프로세스 정의
  - [x] 세션 생성 및 관리 로직
  - [x] 토큰 갱신 로직
  - [x] 권한 검증 로직

- [x] **Step 2.2**: 주문 모니터링 로직 모델링
  - [x] SSE 연결 관리 로직
  - [x] 주문 필터링 로직 (매장별)
  - [x] 실시간 업데이트 전송 로직
  - [x] 연결 끊김 처리 로직

- [x] **Step 2.3**: 주문 상태 관리 로직 모델링
  - [x] 상태 전환 검증 로직
  - [x] 상태 변경 이벤트 발행
  - [x] 동시성 제어 로직

- [x] **Step 2.4**: 주문 삭제 로직 모델링
  - [x] 삭제 가능 여부 검증
  - [x] 삭제 실행 로직
  - [x] 관련 데이터 정리 로직

- [x] **Step 2.5**: 테이블 세션 관리 로직 모델링
  - [x] 세션 종료 프로세스
  - [x] 주문 이력 이동 로직
  - [x] 테이블 상태 리셋 로직
  - [x] 트랜잭션 처리 (필요 시)

- [x] **Step 2.6**: 과거 주문 조회 로직 모델링
  - [x] 이력 조회 필터링 로직
  - [x] 페이지네이션 로직
  - [x] 날짜 범위 검색 로직

- [x] **Step 2.7**: 메뉴 관리 로직 모델링
  - [x] 메뉴 생성 검증 로직
  - [x] 메뉴 수정 검증 로직
  - [x] 메뉴 삭제 검증 로직
  - [x] 이미지 업로드 처리 로직
  - [x] 순서 조정 로직

### Phase 3: Business Rules Definition
- [x] **Step 3.1**: 인증 및 권한 규칙
  - [x] 로그인 시도 제한 규칙
  - [x] 세션 만료 규칙 (16시간)
  - [x] 토큰 갱신 규칙
  - [x] 다중 관리자 접근 규칙

- [x] **Step 3.2**: 주문 관리 규칙
  - [x] 주문 상태 전환 규칙
  - [x] 주문 삭제 가능 조건
  - [x] 동시 수정 충돌 해결 규칙

- [x] **Step 3.3**: 테이블 세션 규칙
  - [x] 세션 자동 만료 규칙 (4시간)
  - [x] 세션 종료 조건
  - [x] 이력 이동 규칙

- [x] **Step 3.4**: 메뉴 관리 규칙
  - [x] 메뉴 필수 필드 규칙
  - [x] 가격 범위 규칙
  - [x] 카테고리 유효성 규칙
  - [x] 이미지 파일 형식 규칙
  - [x] 중복 메뉴 검사 규칙

- [x] **Step 3.5**: 데이터 일관성 규칙
  - [x] 읽기 일관성 수준
  - [x] 쓰기 일관성 수준
  - [x] 트랜잭션 범위

### Phase 4: Data Flow Definition
- [x] **Step 4.1**: 관리자 인증 플로우
  - [x] 입력: username, password, storeId
  - [x] 처리: 검증 → 세션 생성 → 토큰 발행
  - [x] 출력: JWT 토큰, 관리자 정보

- [x] **Step 4.2**: 주문 모니터링 플로우
  - [x] 입력: SSE 연결 요청, storeId
  - [x] 처리: 연결 생성 → 주문 필터링 → 실시간 전송
  - [x] 출력: SSE 스트림 (주문 이벤트)

- [x] **Step 4.3**: 주문 상태 변경 플로우
  - [x] 입력: orderId, newStatus
  - [x] 처리: 검증 → 상태 업데이트 → 이벤트 발행
  - [x] 출력: 업데이트된 주문 정보

- [x] **Step 4.4**: 주문 삭제 플로우
  - [x] 입력: orderId
  - [x] 처리: 검증 → 삭제 실행 → 관련 데이터 정리
  - [x] 출력: 삭제 성공 여부

- [x] **Step 4.5**: 테이블 세션 종료 플로우
  - [x] 입력: tableId, sessionId
  - [x] 처리: 주문 이력 이동 → 테이블 리셋 → 세션 종료
  - [x] 출력: 종료 성공 여부

- [x] **Step 4.6**: 과거 주문 조회 플로우
  - [x] 입력: tableId, dateRange, pagination
  - [x] 처리: 필터링 → 정렬 → 페이지네이션
  - [x] 출력: 과거 주문 목록

- [x] **Step 4.7**: 메뉴 관리 플로우
  - [x] 입력: 메뉴 정보 (생성/수정/삭제)
  - [x] 처리: 검증 → CRUD 실행 → 이미지 처리
  - [x] 출력: 메뉴 정보 또는 성공 여부

### Phase 5: Error Scenarios Definition
- [x] **Step 5.1**: 인증 에러 시나리오
  - [x] 잘못된 자격 증명
  - [x] 만료된 토큰
  - [x] 권한 부족

- [x] **Step 5.2**: 주문 관리 에러 시나리오
  - [x] 존재하지 않는 주문
  - [x] 잘못된 상태 전환
  - [x] 동시 수정 충돌
  - [x] SSE 연결 끊김

- [x] **Step 5.3**: 테이블 세션 에러 시나리오
  - [x] 존재하지 않는 테이블
  - [x] 이미 종료된 세션
  - [x] 트랜잭션 실패

- [x] **Step 5.4**: 메뉴 관리 에러 시나리오
  - [x] 필수 필드 누락
  - [x] 잘못된 가격 범위
  - [x] 중복 메뉴
  - [x] 이미지 업로드 실패

### Phase 6: Documentation
- [x] **Step 6.1**: Domain Entities 문서 생성
  - [x] `aidlc-docs/construction/admin-unit/functional-design/domain-entities.md`
  - [x] 모든 엔티티 및 관계 문서화

- [x] **Step 6.2**: Business Logic Model 문서 생성
  - [x] `aidlc-docs/construction/admin-unit/functional-design/business-logic-model.md`
  - [x] 모든 비즈니스 로직 및 플로우 문서화

- [x] **Step 6.3**: Business Rules 문서 생성
  - [x] `aidlc-docs/construction/admin-unit/functional-design/business-rules.md`
  - [x] 모든 비즈니스 규칙 및 검증 로직 문서화

---

## Completion Criteria

Functional Design이 완료되려면:
- [x] 모든 planning questions에 답변 완료
- [x] 모든 도메인 엔티티 정의 완료
- [x] 모든 비즈니스 로직 모델링 완료
- [x] 모든 비즈니스 규칙 정의 완료
- [x] 모든 데이터 플로우 정의 완료
- [x] 모든 에러 시나리오 정의 완료
- [x] 3개 문서 파일 생성 완료

---

**답변 완료 후 "완료" 또는 "done"이라고 알려주세요.**
