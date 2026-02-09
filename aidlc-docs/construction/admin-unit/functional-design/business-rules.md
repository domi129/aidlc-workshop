# Admin Unit - Business Rules

## Overview
Admin Unit의 비즈니스 규칙 및 검증 로직을 문서화합니다.

---

## 1. 인증 및 권한 규칙

### 1.1 로그인 규칙

**BR-AUTH-001: 자격 증명 검증**
- **규칙**: username, password, storeId 모두 필수
- **검증**: 필드가 비어있으면 400 Bad Request
- **우선순위**: High

**BR-AUTH-002: 비밀번호 해싱**
- **규칙**: 비밀번호는 bcrypt로 해싱 (salt rounds: 10)
- **검증**: 저장 시 평문 비밀번호 금지
- **우선순위**: High (보안)

**BR-AUTH-003: 관리자 존재 확인**
- **규칙**: storeId + username 조합으로 관리자 조회
- **검증**: 관리자가 없으면 401 Unauthorized
- **우선순위**: High

**BR-AUTH-004: 비밀번호 일치 확인**
- **규칙**: bcrypt.compare로 비밀번호 검증
- **검증**: 불일치 시 401 Unauthorized
- **우선순위**: High

---

### 1.2 세션 관리 규칙

**BR-SESSION-001: 세션 만료 시간**
- **규칙**: 관리자 세션은 16시간 후 자동 만료
- **검증**: expiresAt = createdAt + 16시간
- **우선순위**: High

**BR-SESSION-002: 만료된 세션 거부**
- **규칙**: 만료된 세션으로 요청 시 401 Unauthorized
- **검증**: 현재 시각 > expiresAt이면 거부
- **우선순위**: High

**BR-SESSION-003: 다중 세션 허용**
- **규칙**: 하나의 관리자가 여러 디바이스에서 동시 로그인 가능
- **검증**: 세션 수 제한 없음
- **우선순위**: Medium

**BR-SESSION-004: 세션 자동 정리**
- **규칙**: 만료된 세션은 DynamoDB TTL로 자동 삭제
- **검증**: TTL 필드 = expiresAt
- **우선순위**: Medium

---

### 1.3 토큰 규칙

**BR-TOKEN-001: JWT 토큰 구조**
- **규칙**: Payload에 adminId, storeId, sessionId 포함
- **검증**: 필수 필드 누락 시 토큰 생성 실패
- **우선순위**: High

**BR-TOKEN-002: 토큰 만료 시간**
- **규칙**: JWT 토큰 만료 시간 = 16시간
- **검증**: exp claim = iat + 16시간
- **우선순위**: High

**BR-TOKEN-003: 토큰 갱신 조건**
- **규칙**: 세션이 유효한 경우에만 토큰 갱신 가능
- **검증**: 세션 만료 시 갱신 거부, 재로그인 필요
- **우선순위**: High

---

### 1.4 권한 규칙

**BR-AUTHZ-001: 매장 접근 권한**
- **규칙**: 관리자는 자신이 소속된 매장의 데이터만 접근 가능
- **검증**: 요청의 storeId와 JWT의 storeId 일치 확인
- **우선순위**: High (보안)

**BR-AUTHZ-002: 다중 관리자 지원**
- **규칙**: 하나의 매장에 여러 관리자 계정 존재 가능
- **검증**: username은 매장 내에서만 고유하면 됨
- **우선순위**: Medium

---

## 2. 주문 관리 규칙

### 2.1 주문 상태 전환 규칙

**BR-ORDER-001: 순차적 상태 전환**
- **규칙**: 주문 상태는 PENDING → PREPARING → COMPLETED 순서로만 전환
- **검증**: 
  - PENDING → PREPARING: 허용
  - PREPARING → COMPLETED: 허용
  - 기타 전환: 400 Bad Request
- **우선순위**: High

**BR-ORDER-002: 최종 상태 불변**
- **규칙**: COMPLETED 상태는 최종 상태, 더 이상 변경 불가
- **검증**: COMPLETED 상태의 주문 수정 시도 시 400 Bad Request
- **우선순위**: High

**BR-ORDER-003: 상태 변경 타임스탬프**
- **규칙**: 상태 변경 시 updatedAt 업데이트
- **검증**: updatedAt = 현재 시각
- **우선순위**: Medium

**BR-ORDER-004: 완료 시각 기록**
- **규칙**: COMPLETED 상태로 전환 시 completedAt 기록
- **검증**: completedAt = 현재 시각
- **우선순위**: Medium

---

### 2.2 주문 삭제 규칙

**BR-DELETE-001: PENDING 상태만 삭제 가능**
- **규칙**: PENDING 상태의 주문만 삭제 가능
- **검증**: order.status !== 'PENDING'이면 400 Bad Request
- **이유**: 조리 중이거나 완료된 주문은 삭제 불가 (비즈니스 정책)
- **우선순위**: High

**BR-DELETE-002: 삭제 시 영구 제거**
- **규칙**: 주문 삭제 시 데이터베이스에서 영구 제거 (soft delete 없음)
- **검증**: Orders 테이블에서 완전 삭제
- **우선순위**: Medium

**BR-DELETE-003: 삭제 이벤트 발행**
- **규칙**: 주문 삭제 시 SSE를 통해 모든 관리자에게 알림
- **검증**: order-deleted 이벤트 전송
- **우선순위**: Medium

---

### 2.3 동시성 제어 규칙

**BR-CONCURRENCY-001: Last-Write-Wins**
- **규칙**: 여러 관리자가 동시에 같은 주문 수정 시 마지막 쓰기 적용
- **검증**: 낙관적 잠금 없음, DynamoDB 기본 동작
- **Trade-off**: 일부 수정 손실 가능 (MVP 허용)
- **우선순위**: Low

**BR-CONCURRENCY-002: 충돌 감지 없음**
- **규칙**: 동시 수정 충돌 감지 및 에러 반환 없음
- **검증**: 버전 체크 없음
- **우선순위**: Low

---

## 3. 테이블 세션 규칙

### 3.1 세션 라이프사이클 규칙

**BR-TABLE-001: 세션 자동 시작**
- **규칙**: 테이블의 첫 주문 생성 시 세션 자동 시작
- **검증**: currentSessionId가 null이면 새 sessionId 생성
- **우선순위**: High

**BR-TABLE-002: 세션 자동 만료**
- **규칙**: 테이블 세션은 4시간 후 자동 만료
- **검증**: sessionStartTime + 4시간 < 현재 시각이면 만료
- **우선순위**: High

**BR-TABLE-003: 수동 세션 종료**
- **규칙**: 관리자가 "이용 완료" 처리 시 세션 즉시 종료
- **검증**: currentSessionId를 null로 설정
- **우선순위**: High

**BR-TABLE-004: 세션 종료 시 이력 이동**
- **규칙**: 세션 종료 시 해당 세션의 모든 주문을 OrderHistory로 이동
- **검증**: Orders → OrderHistory 복사 후 Orders 삭제
- **우선순위**: High

---

### 3.2 세션 종료 규칙

**BR-COMPLETE-001: 유효한 세션 확인**
- **규칙**: 종료하려는 sessionId가 테이블의 currentSessionId와 일치해야 함
- **검증**: 불일치 시 400 Bad Request
- **우선순위**: High

**BR-COMPLETE-002: 이미 종료된 세션 거부**
- **규칙**: currentSessionId가 null인 테이블은 종료 불가
- **검증**: 400 Bad Request, "No active session"
- **우선순위**: Medium

**BR-COMPLETE-003: 테이블 상태 리셋**
- **규칙**: 세션 종료 시 currentSessionId와 sessionStartTime을 null로 설정
- **검증**: 두 필드 모두 null
- **우선순위**: High

**BR-COMPLETE-004: 트랜잭션 미사용**
- **규칙**: 세션 종료 작업은 트랜잭션 없이 순차 실행
- **Trade-off**: 일부 작업 실패 시 불일치 가능 (MVP 허용)
- **우선순위**: Low

---

## 4. 메뉴 관리 규칙

### 4.1 메뉴 생성 규칙

**BR-MENU-001: 필수 필드 검증**
- **규칙**: menuName과 price는 필수
- **검증**: 
  - menuName이 비어있으면 400 Bad Request
  - price가 없으면 400 Bad Request
- **우선순위**: High

**BR-MENU-002: 가격 범위 검증**
- **규칙**: 가격은 0보다 커야 함
- **검증**: price <= 0이면 400 Bad Request
- **우선순위**: High

**BR-MENU-003: 카테고리 유효성**
- **규칙**: category는 MenuCategory enum 값이어야 함
- **검증**: 유효하지 않은 카테고리 시 400 Bad Request
- **우선순위**: Medium

**BR-MENU-004: 기본 노출 순서**
- **규칙**: 새 메뉴의 displayOrder는 카테고리 내 최대값 + 1
- **검증**: 자동 계산
- **우선순위**: Low

**BR-MENU-005: 기본 판매 가능 상태**
- **규칙**: 새 메뉴는 기본적으로 판매 가능 (isAvailable = true)
- **검증**: 명시적으로 false 설정하지 않는 한 true
- **우선순위**: Low

---

### 4.2 메뉴 수정 규칙

**BR-UPDATE-001: 존재하는 메뉴만 수정**
- **규칙**: menuId로 메뉴 조회 후 수정
- **검증**: 메뉴가 없으면 404 Not Found
- **우선순위**: High

**BR-UPDATE-002: 부분 업데이트 허용**
- **규칙**: 제공된 필드만 업데이트, 나머지는 유지
- **검증**: 제공되지 않은 필드는 변경 안 됨
- **우선순위**: Medium

**BR-UPDATE-003: 가격 검증 (수정 시)**
- **규칙**: 가격 수정 시 0보다 커야 함
- **검증**: price <= 0이면 400 Bad Request
- **우선순위**: High

---

### 4.3 메뉴 삭제 규칙

**BR-DELETE-MENU-001: 영구 삭제**
- **규칙**: 메뉴 삭제 시 데이터베이스에서 영구 제거
- **검증**: Menus 테이블에서 완전 삭제
- **우선순위**: Medium

**BR-DELETE-MENU-002: 주문 참조 무시**
- **규칙**: 메뉴 삭제 시 기존 주문의 메뉴 참조는 무시 (스냅샷 방식)
- **이유**: OrderItem에 menuName과 unitPrice가 스냅샷으로 저장됨
- **우선순위**: Low

---

### 4.4 이미지 업로드 규칙

**BR-IMAGE-001: 파일 형식 제한**
- **규칙**: JPEG, PNG 형식만 허용
- **검증**: MIME type 확인, 기타 형식 시 400 Bad Request
- **우선순위**: Medium

**BR-IMAGE-002: 파일 크기 제한**
- **규칙**: 최대 5MB
- **검증**: 파일 크기 확인, 초과 시 400 Bad Request
- **우선순위**: Medium

**BR-IMAGE-003: S3 키 구조**
- **규칙**: S3 키 = `menus/{storeId}/{uuid}.{ext}`
- **검증**: 자동 생성
- **우선순위**: Low

---

## 5. 데이터 일관성 규칙

### 5.1 읽기 일관성 규칙

**BR-CONSISTENCY-001: Eventually Consistent Read**
- **규칙**: 모든 읽기 작업은 Eventually Consistent Read 사용
- **이유**: 성능 우선, 최종 일관성 보장
- **Trade-off**: 수 밀리초 이내 일시적 불일치 가능
- **우선순위**: Medium

**BR-CONSISTENCY-002: Strong Consistency 미사용**
- **규칙**: ConsistentRead=true 옵션 사용 안 함
- **이유**: MVP 단순화, 성능 우선
- **우선순위**: Low

---

### 5.2 쓰기 일관성 규칙

**BR-WRITE-001: Last-Write-Wins**
- **규칙**: 동시 쓰기 시 마지막 쓰기 적용
- **검증**: 낙관적 잠금 없음
- **우선순위**: Low

**BR-WRITE-002: 트랜잭션 미사용**
- **규칙**: DynamoDB Transactions 사용 안 함 (세션 종료 제외)
- **이유**: MVP 단순화
- **Trade-off**: 일부 작업 실패 시 불일치 가능
- **우선순위**: Low

---

## 6. 과거 주문 내역 규칙

### 6.1 보관 정책 규칙

**BR-HISTORY-001: 90일 보관**
- **규칙**: 과거 주문 내역은 90일 후 자동 삭제
- **검증**: expiresAt = archivedAt + 90일
- **우선순위**: Medium

**BR-HISTORY-002: TTL 자동 삭제**
- **규칙**: DynamoDB TTL로 만료된 이력 자동 삭제
- **검증**: TTL 필드 = expiresAt
- **우선순위**: Medium

**BR-HISTORY-003: 읽기 전용**
- **규칙**: OrderHistory는 읽기 전용, 수정 불가
- **검증**: 수정 API 없음
- **우선순위**: High

---

### 6.2 이력 조회 규칙

**BR-QUERY-001: 테이블별 조회**
- **규칙**: tableId로 과거 주문 조회
- **검증**: GSI: tableId-archivedAt-index 사용
- **우선순위**: High

**BR-QUERY-002: 날짜 범위 필터링**
- **규칙**: startDate와 endDate로 날짜 범위 필터링 가능
- **검증**: archivedAt 기준 필터링
- **우선순위**: Medium

**BR-QUERY-003: 최신순 정렬**
- **규칙**: archivedAt 기준 내림차순 정렬 (최신순)
- **검증**: GSI 정렬 키 사용
- **우선순위**: Medium

**BR-QUERY-004: 페이지네이션**
- **규칙**: 페이지 크기 기본값 20, 최대 100
- **검증**: pageSize > 100이면 100으로 제한
- **우선순위**: Low

---

## 7. SSE 연결 관리 규칙

### 7.1 연결 규칙

**BR-SSE-001: 인증 필수**
- **규칙**: SSE 연결 시 JWT 토큰 필수
- **검증**: 토큰 없으면 401 Unauthorized
- **우선순위**: High

**BR-SSE-002: 매장별 필터링**
- **규칙**: 관리자는 자신의 매장 주문만 수신
- **검증**: storeId 기준 필터링
- **우선순위**: High

**BR-SSE-003: Heartbeat 전송**
- **규칙**: 30초마다 heartbeat 이벤트 전송
- **검증**: 연결 유지 확인
- **우선순위**: Medium

**BR-SSE-004: 연결 끊김 처리**
- **규칙**: 클라이언트 연결 끊김 시 연결 풀에서 제거
- **검증**: 에러 무시, 자동 정리
- **우선순위**: Medium

---

### 7.2 이벤트 전송 규칙

**BR-EVENT-001: 이벤트 타입**
- **규칙**: order-created, order-updated, order-deleted 이벤트 지원
- **검증**: 이벤트 타입 명시
- **우선순위**: High

**BR-EVENT-002: 이벤트 데이터 형식**
- **규칙**: 이벤트 데이터는 JSON 형식
- **검증**: JSON.stringify 사용
- **우선순위**: High

**BR-EVENT-003: 전송 실패 무시**
- **규칙**: 특정 연결 전송 실패 시 해당 연결만 제거, 다른 연결 계속
- **검증**: try-catch로 에러 처리
- **우선순위**: Medium

---

## 8. 에러 처리 규칙

### 8.1 에러 응답 규칙

**BR-ERROR-001: 표준 에러 형식**
- **규칙**: 모든 에러는 { error: { code, message, statusCode } } 형식
- **검증**: 일관된 에러 응답 구조
- **우선순위**: High

**BR-ERROR-002: 명확한 에러 메시지**
- **규칙**: 에러 메시지는 문제를 명확히 설명
- **검증**: 사용자가 이해 가능한 메시지
- **우선순위**: Medium

**BR-ERROR-003: 민감 정보 노출 금지**
- **규칙**: 에러 메시지에 스택 트레이스, 내부 정보 포함 금지
- **검증**: 프로덕션 환경에서 민감 정보 필터링
- **우선순위**: High (보안)

---

### 8.2 Fail Fast 규칙

**BR-FAIL-001: 즉시 실패 반환**
- **규칙**: 에러 발생 시 즉시 실패 응답 반환
- **검증**: 부분 성공 허용 안 함 (트랜잭션 미사용 제외)
- **우선순위**: High

**BR-FAIL-002: 재시도 없음**
- **규칙**: 비즈니스 로직 레벨에서 자동 재시도 없음
- **검증**: 클라이언트가 재시도 결정
- **우선순위**: Medium

---

## 규칙 우선순위 요약

### High Priority (필수)
- 인증 및 권한 규칙
- 주문 상태 전환 규칙
- 주문 삭제 조건
- 세션 라이프사이클 규칙
- 메뉴 필수 필드 검증
- 데이터 보안 규칙

### Medium Priority (권장)
- 세션 자동 정리
- 이력 보관 정책
- 이미지 업로드 제한
- 에러 메시지 명확성

### Low Priority (선택)
- 동시성 제어 최적화
- 트랜잭션 사용
- 페이지네이션 제한

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: Business Rules 정의 완료
