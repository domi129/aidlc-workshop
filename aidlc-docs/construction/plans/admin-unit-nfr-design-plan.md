# Admin Unit - NFR Design Plan

## Unit Context

**Unit Name**: Admin Unit

**NFR Requirements Summary**:
- Scalability: 5-20 concurrent admins, horizontal scaling
- Performance: <1s API, <1s SSE, <100ms DB
- Availability: Best effort, no DR, no failover
- Security: At-rest+in-transit encryption, basic auth, RBAC
- Reliability: Fail fast, no monitoring
- Tech Stack: Node.js 18.x, Lambda 256MB, DynamoDB On-demand, S3 Standard

---

## Planning Questions

다음 질문에 답변하여 NFR Design 방향을 결정해주세요.

### Resilience Patterns

#### Question 1: Lambda Error Handling Pattern
Lambda 함수의 에러 처리 패턴은?

A) Try-catch with error response - 모든 에러를 catch하여 표준 에러 응답 반환
B) Let it fail - 에러를 Lambda로 전파하여 자동 재시도 활용
C) Circuit breaker - 반복적 실패 시 요청 차단
D) Other (please describe after [Answer]: tag below)

[Answer]: A

#### Question 2: DynamoDB Error Handling
DynamoDB 에러 처리 방식은?

A) Immediate failure - 에러 발생 시 즉시 실패 반환
B) Retry with backoff - 일시적 에러 시 재시도 (exponential backoff)
C) Fallback to cache - 에러 시 캐시 데이터 반환
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Scalability Patterns

#### Question 3: SSE Connection Management Pattern
SSE 연결 관리 패턴은?

A) In-memory map - Lambda 메모리 내 Map으로 연결 관리
B) DynamoDB connection registry - DynamoDB에 연결 정보 저장
C) ElastiCache - Redis로 연결 관리
D) Other (please describe after [Answer]: tag below)

[Answer]: B

#### Question 4: Lambda Concurrency Pattern
Lambda 동시 실행 관리 패턴은?

A) Unreserved - 기본 동시 실행 제한 사용
B) Reserved concurrency - 특정 함수에 예약된 동시 실행 수 할당
C) Provisioned concurrency - 사전 워밍된 인스턴스 유지
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Performance Patterns

#### Question 5: DynamoDB Query Optimization
DynamoDB 쿼리 최적화 패턴은?

A) GSI only - GSI만 사용하여 쿼리
B) Caching layer - ElastiCache/DAX로 캐싱
C) Batch operations - BatchGetItem/BatchWriteItem 사용
D) Other (please describe after [Answer]: tag below)

[Answer]: A

#### Question 6: Lambda Cold Start Mitigation
Lambda cold start 완화 전략은?

A) Accept cold starts - Cold start 허용 (MVP)
B) Provisioned concurrency - 사전 워밍된 인스턴스
C) Scheduled warming - CloudWatch Events로 주기적 호출
D) Other (please describe after [Answer]: tag below)

[Answer]: A

#### Question 7: API Response Optimization
API 응답 최적화 패턴은?

A) Minimal payload - 필요한 필드만 반환
B) Compression - gzip 압축 사용
C) Pagination - 대량 데이터 페이지네이션
D) All of the above
E) Other (please describe after [Answer]: tag below)

[Answer]: A

### Security Patterns

#### Question 8: JWT Token Storage
JWT 토큰 저장 위치는?

A) Client-side only - 클라이언트 localStorage/sessionStorage
B) Server-side session - AdminSessions 테이블에 저장
C) Both - 클라이언트와 서버 양쪽 저장
D) Other (please describe after [Answer]: tag below)

[Answer]: C

#### Question 9: RBAC Implementation Pattern
RBAC 구현 패턴은?

A) Middleware-based - Express/Lambda 미들웨어로 권한 체크
B) Decorator-based - 함수 데코레이터로 권한 체크
C) Manual checks - 각 핸들러에서 수동 체크
D) Other (please describe after [Answer]: tag below)

[Answer]: A

#### Question 10: S3 Image Access Pattern
S3 이미지 접근 패턴은?

A) Public URLs - 공개 URL (버킷 정책)
B) Presigned URLs - 임시 서명된 URL
C) CloudFront - CDN을 통한 접근
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Logical Components

#### Question 11: API Layer Structure
API 레이어 구조는?

A) Single Lambda - 모든 API를 하나의 Lambda로 처리
B) Per-route Lambda - 각 라우트별 Lambda 함수
C) Per-resource Lambda - 리소스별 Lambda 함수 (orders, menus, tables)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

#### Question 12: SSE Infrastructure
SSE 인프라 구성은?

A) Lambda function URL - Lambda Function URL로 SSE 제공
B) API Gateway + Lambda - API Gateway를 통한 SSE
C) Separate WebSocket - WebSocket API 사용
D) Other (please describe after [Answer]: tag below)

[Answer]: A

#### Question 13: Authentication Flow
인증 플로우 구성은?

A) Stateless JWT - JWT만 사용, 세션 테이블 조회 없음
B) Stateful JWT - JWT + AdminSessions 테이블 검증
C) Hybrid - JWT 검증 후 필요 시 세션 조회
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## NFR Design Execution Plan

### Phase 1: Resilience Design
- [ ] **Step 1.1**: Lambda 에러 처리 패턴 정의
- [ ] **Step 1.2**: DynamoDB 에러 처리 패턴 정의
- [ ] **Step 1.3**: S3 에러 처리 패턴 정의
- [ ] **Step 1.4**: API Gateway 에러 처리 패턴 정의

### Phase 2: Scalability Design
- [ ] **Step 2.1**: SSE 연결 관리 패턴 정의
- [ ] **Step 2.2**: Lambda 동시 실행 패턴 정의
- [ ] **Step 2.3**: DynamoDB 스케일링 패턴 정의

### Phase 3: Performance Design
- [ ] **Step 3.1**: DynamoDB 쿼리 최적화 패턴 정의
- [ ] **Step 3.2**: Lambda cold start 완화 전략 정의
- [ ] **Step 3.3**: API 응답 최적화 패턴 정의

### Phase 4: Security Design
- [ ] **Step 4.1**: JWT 토큰 관리 패턴 정의
- [ ] **Step 4.2**: RBAC 구현 패턴 정의
- [ ] **Step 4.3**: S3 이미지 접근 패턴 정의
- [ ] **Step 4.4**: 데이터 암호화 패턴 정의

### Phase 5: Logical Components Design
- [ ] **Step 5.1**: API 레이어 구조 정의
- [ ] **Step 5.2**: SSE 인프라 구성 정의
- [ ] **Step 5.3**: 인증 플로우 구성 정의
- [ ] **Step 5.4**: 데이터 접근 레이어 구조 정의

### Phase 6: Documentation
- [ ] **Step 6.1**: NFR Design Patterns 문서 생성
  - [ ] `aidlc-docs/construction/admin-unit/nfr-design/nfr-design-patterns.md`
  - [ ] 모든 디자인 패턴 문서화

- [ ] **Step 6.2**: Logical Components 문서 생성
  - [ ] `aidlc-docs/construction/admin-unit/nfr-design/logical-components.md`
  - [ ] 모든 논리적 컴포넌트 및 인프라 요소 문서화

---

## Completion Criteria

NFR Design이 완료되려면:
- [ ] 모든 planning questions에 답변 완료
- [ ] 모든 디자인 패턴 정의 완료
- [ ] 모든 논리적 컴포넌트 정의 완료
- [ ] 2개 문서 파일 생성 완료

---

**답변 완료 후 "완료" 또는 "done"이라고 알려주세요.**
