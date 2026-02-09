# Admin Unit - Business Logic Model

## Overview
Admin Unit의 비즈니스 로직 및 데이터 플로우를 문서화합니다.

---

## 1. 관리자 인증 로직 (US-007)

### 1.1 로그인 프로세스

**Input**:
- `username` (string): 사용자명
- `password` (string): 비밀번호
- `storeId` (string): 매장 식별자

**Process**:
1. **자격 증명 검증**:
   - Admins 테이블에서 storeId + username으로 관리자 조회
   - 관리자가 존재하지 않으면 → 에러 (401 Unauthorized)
   - bcrypt.compare(password, admin.passwordHash) 검증
   - 비밀번호 불일치 시 → 에러 (401 Unauthorized)

2. **세션 생성**:
   - sessionId 생성 (UUID)
   - expiresAt 계산 (현재 시각 + 16시간)
   - AdminSession 엔티티 생성 및 저장

3. **JWT 토큰 발행**:
   - Payload: { adminId, storeId, sessionId }
   - Secret: 환경 변수에서 로드
   - Expiration: 16시간
   - 토큰 생성 및 반환

**Output**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "adminId": "uuid",
    "username": "admin1",
    "storeId": "store-123"
  },
  "expiresAt": "2026-02-10T05:55:41Z"
}
```

**Error Scenarios**:
- 존재하지 않는 사용자: 401 Unauthorized
- 잘못된 비밀번호: 401 Unauthorized
- 데이터베이스 에러: 500 Internal Server Error

---

### 1.2 토큰 검증 로직

**Input**:
- `token` (string): JWT 토큰 (Authorization 헤더)

**Process**:
1. **토큰 파싱 및 검증**:
   - JWT 서명 검증
   - 만료 시각 확인
   - Payload에서 adminId, storeId, sessionId 추출

2. **세션 유효성 확인**:
   - AdminSessions 테이블에서 sessionId 조회
   - 세션이 존재하지 않으면 → 에러 (401 Unauthorized)
   - 세션이 만료되었으면 → 에러 (401 Unauthorized)

3. **관리자 정보 로드**:
   - Admins 테이블에서 adminId로 관리자 조회
   - 관리자 정보를 요청 컨텍스트에 저장

**Output**:
- 요청 컨텍스트에 admin 정보 추가
- 다음 미들웨어/핸들러로 진행

**Error Scenarios**:
- 잘못된 토큰: 401 Unauthorized
- 만료된 토큰: 401 Unauthorized
- 존재하지 않는 세션: 401 Unauthorized

---

### 1.3 토큰 갱신 로직

**Input**:
- `refreshToken` (string): 기존 JWT 토큰

**Process**:
1. **기존 토큰 검증**:
   - JWT 파싱 (만료 여부 무시)
   - sessionId 추출

2. **세션 유효성 확인**:
   - AdminSessions 테이블에서 sessionId 조회
   - 세션이 만료되었으면 → 에러 (401 Unauthorized)

3. **새 토큰 발행**:
   - 동일한 Payload로 새 JWT 생성
   - 새 expiresAt 계산 (현재 + 16시간)
   - AdminSession의 expiresAt 업데이트

**Output**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-02-10T05:55:41Z"
}
```

**Error Scenarios**:
- 만료된 세션: 401 Unauthorized (재로그인 필요)
- 존재하지 않는 세션: 401 Unauthorized

---

## 2. 주문 모니터링 로직 (US-008)

### 2.1 SSE 연결 관리

**Input**:
- SSE 연결 요청
- `storeId` (from JWT token)

**Process**:
1. **연결 생성**:
   - SSE 응답 헤더 설정 (Content-Type: text/event-stream)
   - 연결을 메모리 내 연결 풀에 저장
   - 연결 ID 생성 및 매핑

2. **초기 데이터 전송**:
   - Orders 테이블에서 storeId로 현재 주문 목록 조회
   - 초기 주문 목록을 SSE 이벤트로 전송

3. **연결 유지**:
   - Heartbeat 이벤트 주기적 전송 (30초마다)
   - 클라이언트 연결 끊김 감지

**Output**:
- SSE 스트림 (지속적 연결)

**Error Scenarios**:
- 인증 실패: 401 Unauthorized (연결 거부)
- 연결 끊김: 자동 재연결 (클라이언트 측)

---

### 2.2 실시간 주문 업데이트 전송

**Trigger**:
- 새 주문 생성 (Customer Unit에서)
- 주문 상태 변경 (Admin Unit에서)
- 주문 삭제 (Admin Unit에서)

**Process**:
1. **이벤트 감지**:
   - DynamoDB Streams 또는 애플리케이션 레벨 이벤트
   - 변경된 주문 정보 추출

2. **필터링**:
   - 주문의 storeId 확인
   - 해당 매장의 SSE 연결 목록 조회

3. **이벤트 전송**:
   - 각 연결에 SSE 이벤트 전송
   - 이벤트 타입: order-created, order-updated, order-deleted
   - 이벤트 데이터: 주문 정보 (JSON)

**Output**:
```
event: order-created
data: {"orderId":"uuid","tableNumber":"T1","status":"PENDING",...}

event: order-updated
data: {"orderId":"uuid","status":"PREPARING",...}

event: order-deleted
data: {"orderId":"uuid"}
```

**Error Scenarios**:
- 연결 끊김: 해당 연결 제거, 에러 무시
- 전송 실패: 로그 기록, 다음 연결 계속

---

### 2.3 주문 필터링 로직

**Input**:
- `storeId` (from JWT token)

**Process**:
1. **매장별 필터링**:
   - Orders 테이블에서 storeId로 필터링
   - GSI: storeId-createdAt-index 사용

2. **정렬**:
   - createdAt 기준 내림차순 (최신순)

3. **그룹화** (클라이언트 측):
   - tableId로 그룹화
   - 테이블별 주문 목록 생성

**Output**:
```json
{
  "orders": [
    {
      "orderId": "uuid",
      "tableId": "table-1",
      "tableNumber": "T1",
      "orderNumber": 1,
      "items": [...],
      "totalAmount": 25000,
      "status": "PENDING",
      "createdAt": "2026-02-09T13:55:41Z"
    },
    ...
  ]
}
```

---

## 3. 주문 상태 관리 로직 (US-009)

### 3.1 상태 전환 검증

**Input**:
- `orderId` (string): 주문 식별자
- `newStatus` (OrderStatus): 새 상태

**Process**:
1. **주문 조회**:
   - Orders 테이블에서 orderId로 조회
   - 주문이 존재하지 않으면 → 에러 (404 Not Found)

2. **상태 전환 규칙 검증**:
   - 현재 상태 확인
   - 허용된 전환인지 검증:
     - PENDING → PREPARING: 허용
     - PREPARING → COMPLETED: 허용
     - 기타: 거부 (400 Bad Request)

3. **상태 업데이트**:
   - order.status = newStatus
   - order.updatedAt = 현재 시각
   - newStatus가 COMPLETED면 order.completedAt = 현재 시각
   - Orders 테이블 업데이트

4. **이벤트 발행**:
   - SSE를 통해 모든 연결된 관리자에게 업데이트 전송

**Output**:
```json
{
  "orderId": "uuid",
  "status": "PREPARING",
  "updatedAt": "2026-02-09T13:55:41Z"
}
```

**Error Scenarios**:
- 존재하지 않는 주문: 404 Not Found
- 잘못된 상태 전환: 400 Bad Request
- 데이터베이스 에러: 500 Internal Server Error

---

## 4. 주문 삭제 로직 (US-010)

### 4.1 삭제 가능 여부 검증

**Input**:
- `orderId` (string): 주문 식별자

**Process**:
1. **주문 조회**:
   - Orders 테이블에서 orderId로 조회
   - 주문이 존재하지 않으면 → 에러 (404 Not Found)

2. **삭제 가능 조건 확인**:
   - order.status === 'PENDING'인지 확인
   - PENDING이 아니면 → 에러 (400 Bad Request, "Only PENDING orders can be deleted")

3. **삭제 실행**:
   - Orders 테이블에서 orderId 삭제

4. **이벤트 발행**:
   - SSE를 통해 모든 연결된 관리자에게 삭제 이벤트 전송

**Output**:
```json
{
  "success": true,
  "orderId": "uuid"
}
```

**Error Scenarios**:
- 존재하지 않는 주문: 404 Not Found
- PENDING 상태가 아님: 400 Bad Request
- 데이터베이스 에러: 500 Internal Server Error

---

## 5. 테이블 세션 관리 로직 (US-011)

### 5.1 세션 종료 프로세스

**Input**:
- `tableId` (string): 테이블 식별자
- `sessionId` (string): 세션 식별자

**Process**:
1. **테이블 조회**:
   - Tables 테이블에서 tableId로 조회
   - 테이블이 존재하지 않으면 → 에러 (404 Not Found)

2. **세션 유효성 확인**:
   - table.currentSessionId === sessionId 확인
   - 일치하지 않으면 → 에러 (400 Bad Request, "Invalid session")

3. **주문 이력 이동**:
   - Orders 테이블에서 tableId + sessionId로 주문 목록 조회
   - 각 주문을 OrderHistory로 복사:
     - historyId 생성 (UUID)
     - orderId, storeId, tableId, sessionId, orderNumber, items, totalAmount, status, createdAt 복사
     - archivedAt = 현재 시각
     - expiresAt = 현재 시각 + 90일
   - OrderHistory 테이블에 삽입

4. **주문 삭제**:
   - Orders 테이블에서 해당 주문들 삭제

5. **테이블 상태 리셋**:
   - table.currentSessionId = null
   - table.sessionStartTime = null
   - table.updatedAt = 현재 시각
   - Tables 테이블 업데이트

**Output**:
```json
{
  "success": true,
  "tableId": "uuid",
  "archivedOrdersCount": 5
}
```

**Error Scenarios**:
- 존재하지 않는 테이블: 404 Not Found
- 잘못된 세션 ID: 400 Bad Request
- 이미 종료된 세션: 400 Bad Request
- 데이터베이스 에러: 500 Internal Server Error (일부 작업 실패 가능)

**Note**: 트랜잭션 미사용으로 일부 작업 실패 시 불일치 가능 (MVP 허용)

---

## 6. 과거 주문 조회 로직 (US-012)

### 6.1 이력 조회 및 필터링

**Input**:
- `tableId` (string): 테이블 식별자
- `startDate` (timestamp, optional): 시작 날짜
- `endDate` (timestamp, optional): 종료 날짜
- `page` (number, optional): 페이지 번호 (기본: 1)
- `pageSize` (number, optional): 페이지 크기 (기본: 20)

**Process**:
1. **기본 조회**:
   - OrderHistory 테이블에서 tableId로 조회
   - GSI: tableId-archivedAt-index 사용

2. **날짜 필터링**:
   - startDate가 있으면: archivedAt >= startDate
   - endDate가 있으면: archivedAt <= endDate

3. **정렬**:
   - archivedAt 기준 내림차순 (최신순)

4. **페이지네이션**:
   - offset = (page - 1) × pageSize
   - limit = pageSize
   - DynamoDB Query with Limit and ExclusiveStartKey

**Output**:
```json
{
  "orders": [
    {
      "historyId": "uuid",
      "orderId": "uuid",
      "orderNumber": 1,
      "items": [...],
      "totalAmount": 25000,
      "status": "COMPLETED",
      "createdAt": "2026-02-09T10:00:00Z",
      "archivedAt": "2026-02-09T12:00:00Z"
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 150,
    "hasMore": true
  }
}
```

**Error Scenarios**:
- 존재하지 않는 테이블: 빈 배열 반환 (에러 아님)
- 잘못된 날짜 범위: 400 Bad Request
- 데이터베이스 에러: 500 Internal Server Error

---

## 7. 메뉴 관리 로직 (US-013)

### 7.1 메뉴 생성

**Input**:
- `menuName` (string): 메뉴명
- `price` (number): 가격
- `description` (string, optional): 설명
- `category` (MenuCategory): 카테고리
- `imageUrl` (string, optional): 이미지 URL
- `storeId` (string, from JWT): 매장 식별자

**Process**:
1. **필수 필드 검증**:
   - menuName이 비어있으면 → 에러 (400 Bad Request)
   - price가 0 이하면 → 에러 (400 Bad Request)

2. **메뉴 생성**:
   - menuId 생성 (UUID)
   - displayOrder = 현재 카테고리의 최대 displayOrder + 1
   - isAvailable = true (기본값)
   - createdAt, updatedAt = 현재 시각
   - Menu 엔티티 생성 및 저장

**Output**:
```json
{
  "menuId": "uuid",
  "menuName": "김치찌개",
  "price": 8000,
  "category": "MAIN",
  "displayOrder": 5,
  "createdAt": "2026-02-09T13:55:41Z"
}
```

**Error Scenarios**:
- 필수 필드 누락: 400 Bad Request
- 잘못된 가격: 400 Bad Request
- 데이터베이스 에러: 500 Internal Server Error

---

### 7.2 메뉴 수정

**Input**:
- `menuId` (string): 메뉴 식별자
- `menuName` (string, optional): 메뉴명
- `price` (number, optional): 가격
- `description` (string, optional): 설명
- `category` (MenuCategory, optional): 카테고리
- `imageUrl` (string, optional): 이미지 URL
- `isAvailable` (boolean, optional): 판매 가능 여부

**Process**:
1. **메뉴 조회**:
   - Menus 테이블에서 menuId로 조회
   - 메뉴가 존재하지 않으면 → 에러 (404 Not Found)

2. **필드 검증**:
   - price가 제공되고 0 이하면 → 에러 (400 Bad Request)

3. **메뉴 업데이트**:
   - 제공된 필드만 업데이트
   - updatedAt = 현재 시각
   - Menus 테이블 업데이트

**Output**:
```json
{
  "menuId": "uuid",
  "menuName": "김치찌개",
  "price": 9000,
  "updatedAt": "2026-02-09T13:55:41Z"
}
```

**Error Scenarios**:
- 존재하지 않는 메뉴: 404 Not Found
- 잘못된 가격: 400 Bad Request
- 데이터베이스 에러: 500 Internal Server Error

---

### 7.3 메뉴 삭제

**Input**:
- `menuId` (string): 메뉴 식별자

**Process**:
1. **메뉴 조회**:
   - Menus 테이블에서 menuId로 조회
   - 메뉴가 존재하지 않으면 → 에러 (404 Not Found)

2. **삭제 실행**:
   - Menus 테이블에서 menuId 삭제

**Output**:
```json
{
  "success": true,
  "menuId": "uuid"
}
```

**Error Scenarios**:
- 존재하지 않는 메뉴: 404 Not Found
- 데이터베이스 에러: 500 Internal Server Error

---

### 7.4 이미지 업로드 처리

**Input**:
- `file` (multipart/form-data): 이미지 파일
- `storeId` (string, from JWT): 매장 식별자

**Process**:
1. **파일 검증**:
   - 파일 형식 확인 (JPEG, PNG만 허용)
   - 파일 크기 확인 (최대 5MB)

2. **S3 업로드**:
   - S3 키 생성: `menus/{storeId}/{uuid}.{ext}`
   - S3 PutObject 호출
   - 업로드 완료 후 URL 생성

3. **URL 반환**:
   - S3 URL 반환 (https://bucket.s3.region.amazonaws.com/key)

**Output**:
```json
{
  "imageUrl": "https://bucket.s3.ap-northeast-2.amazonaws.com/menus/store-123/uuid.jpg"
}
```

**Error Scenarios**:
- 잘못된 파일 형식: 400 Bad Request
- 파일 크기 초과: 400 Bad Request
- S3 업로드 실패: 500 Internal Server Error

---

## 8. 에러 처리 전략

### 8.1 Fail Fast Approach

**원칙**:
- 에러 발생 시 즉시 실패 반환
- 부분 성공 허용 안 함 (트랜잭션 미사용 제외)
- 명확한 에러 메시지 제공

**Error Response Format**:
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password",
    "statusCode": 401
  }
}
```

**Error Codes**:
- `INVALID_CREDENTIALS`: 잘못된 자격 증명
- `UNAUTHORIZED`: 인증 실패
- `FORBIDDEN`: 권한 부족
- `NOT_FOUND`: 리소스 없음
- `INVALID_REQUEST`: 잘못된 요청
- `INVALID_STATE_TRANSITION`: 잘못된 상태 전환
- `INTERNAL_ERROR`: 내부 서버 에러

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: Business Logic Model 정의 완료
