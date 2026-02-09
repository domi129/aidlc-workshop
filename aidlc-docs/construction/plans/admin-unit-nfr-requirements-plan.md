# Admin Unit - NFR Requirements Plan

## Unit Context

**Unit Name**: Admin Unit

**Purpose**: 매장 관리자가 주문을 실시간으로 모니터링하고 매장을 관리

**Functional Design Summary**:
- 7개 비즈니스 로직 플로우
- 12개 도메인 엔티티
- 50+ 비즈니스 규칙
- SSE 기반 실시간 모니터링

---

## Planning Questions

다음 질문에 답변하여 NFR Requirements를 결정해주세요.

### Scalability Requirements

#### Question 1: Expected Concurrent Admins
동시 접속 관리자 수는 얼마나 예상됩니까?

A) 1-5명 (소규모 매장)
B) 5-20명 (중규모 체인점)
C) 20-100명 (대규모 체인점)
D) 100명 이상 (대형 프랜차이즈)
E) Other (please describe after [Answer]: tag below)

[Answer]: B

#### Question 2: SSE Connection Scaling
SSE 연결 수 증가 시 스케일링 전략은?

A) Vertical scaling - Lambda 메모리 증가
B) Horizontal scaling - Lambda 동시 실행 수 증가
C) Connection pooling - 연결 관리 최적화
D) Other (please describe after [Answer]: tag below)

[Answer]: B

#### Question 3: Order Volume Growth
주문 볼륨 증가 예상은?

A) Stable - 일정한 주문량 유지
B) Linear growth - 선형 증가 (월 10-20%)
C) Exponential growth - 급격한 증가 (월 50%+)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Performance Requirements

#### Question 4: API Response Time Target
Admin API 응답 시간 목표는?

A) < 500ms (매우 빠름)
B) < 1s (빠름)
C) < 2s (보통)
D) < 5s (느림, 허용 가능)
E) Other (please describe after [Answer]: tag below)

[Answer]: B

#### Question 5: SSE Event Delivery Latency
SSE 이벤트 전달 지연 시간 목표는?

A) < 100ms (실시간)
B) < 500ms (거의 실시간)
C) < 1s (허용 가능)
D) < 2s (느림)
E) Other (please describe after [Answer]: tag below)

[Answer]: C

#### Question 6: Database Query Performance
DynamoDB 쿼리 성능 목표는?

A) < 50ms (매우 빠름, 캐싱 필요)
B) < 100ms (빠름)
C) < 200ms (보통)
D) < 500ms (느림)
E) Other (please describe after [Answer]: tag below)

[Answer]: B

#### Question 7: Image Upload Performance
이미지 업로드 성능 목표는?

A) < 1s (5MB 이미지)
B) < 3s (5MB 이미지)
C) < 5s (5MB 이미지)
D) No specific target
E) Other (please describe after [Answer]: tag below)

[Answer]: B

### Availability Requirements

#### Question 8: Uptime Target
Admin 시스템 가용성 목표는?

A) 99.9% (월 43분 다운타임)
B) 99% (월 7시간 다운타임)
C) 95% (월 36시간 다운타임)
D) Best effort (목표 없음)
E) Other (please describe after [Answer]: tag below)

[Answer]: D

#### Question 9: Disaster Recovery
재해 복구 전략은?

A) Multi-region deployment - 다중 리전 배포
B) Backup and restore - 백업 및 복구 (RPO: 24시간)
C) No DR - MVP에서 제외
D) Other (please describe after [Answer]: tag below)

[Answer]: C

#### Question 10: Failover Strategy
장애 조치 전략은?

A) Automatic failover - 자동 장애 조치
B) Manual failover - 수동 장애 조치
C) No failover - MVP에서 제외
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Security Requirements

#### Question 11: Data Encryption
데이터 암호화 요구사항은?

A) At-rest and in-transit - 저장 및 전송 중 암호화
B) In-transit only - 전송 중만 암호화 (HTTPS)
C) No encryption - MVP에서 제외
D) Other (please describe after [Answer]: tag below)

[Answer]: A

#### Question 12: Authentication Strength
인증 강도 요구사항은?

A) Strong - 비밀번호 복잡도 + MFA
B) Standard - 비밀번호 복잡도만
C) Basic - 최소 길이만
D) Other (please describe after [Answer]: tag below)

[Answer]: C

#### Question 13: Authorization Model
권한 모델은?

A) RBAC - 역할 기반 접근 제어
B) Simple - 관리자 = 모든 권한
C) ABAC - 속성 기반 접근 제어
D) Other (please describe after [Answer]: tag below)

[Answer]: A

#### Question 14: Audit Logging
감사 로그 요구사항은?

A) Comprehensive - 모든 관리자 작업 로깅
B) Critical only - 중요 작업만 로깅 (삭제, 상태 변경)
C) No audit logging - MVP에서 제외
D) Other (please describe after [Answer]: tag below)

[Answer]: C

### Reliability Requirements

#### Question 15: Error Handling Strategy
에러 처리 전략은?

A) Graceful degradation - 부분 실패 허용
B) Fail fast - 즉시 실패 (이미 선택됨)
C) Retry with exponential backoff - 재시도
D) Other (please describe after [Answer]: tag below)

[Answer]: B

#### Question 16: Monitoring and Alerting
모니터링 및 알림 요구사항은?

A) Comprehensive - CloudWatch + 알림 + 대시보드
B) Basic - CloudWatch Logs만
C) No monitoring - MVP에서 제외
D) Other (please describe after [Answer]: tag below)

[Answer]: C

#### Question 17: Health Checks
헬스 체크 요구사항은?

A) Deep health checks - DB 연결, 외부 서비스 확인
B) Shallow health checks - API 응답만 확인
C) No health checks - MVP에서 제외
D) Other (please describe after [Answer]: tag below)

[Answer]: C

### Tech Stack Selection

#### Question 18: Lambda Runtime
Lambda 런타임 선택은?

A) Node.js 20.x (최신 LTS)
B) Node.js 18.x (안정 LTS)
C) Other (please describe after [Answer]: tag below)

[Answer]: B

#### Question 19: Lambda Memory Configuration
Lambda 메모리 설정은?

A) 128MB (최소, 비용 최적화)
B) 256MB (표준)
C) 512MB (성능 우선)
D) 1024MB+ (고성능)
E) Other (please describe after [Answer]: tag below)

[Answer]: B

#### Question 20: API Gateway Type
API Gateway 타입은?

A) REST API (표준)
B) HTTP API (저비용, 단순)
C) WebSocket API (양방향 통신)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

#### Question 21: DynamoDB Capacity Mode
DynamoDB 용량 모드는?

A) On-demand - 자동 스케일링
B) Provisioned - 고정 용량
C) Other (please describe after [Answer]: tag below)

[Answer]: A

#### Question 22: S3 Storage Class
S3 스토리지 클래스는?

A) Standard - 표준 (자주 접근)
B) Intelligent-Tiering - 자동 계층화
C) Standard-IA - 저빈도 접근
D) Other (please describe after [Answer]: tag below)

[Answer]: A

#### Question 23: CloudWatch Logs Retention
CloudWatch Logs 보관 기간은?

A) 7 days (단기)
B) 30 days (표준)
C) 90 days (장기)
D) Never expire (영구)
E) Other (please describe after [Answer]: tag below)

[Answer]: B

### Maintainability Requirements

#### Question 24: Code Quality Standards
코드 품질 기준은?

A) Strict - ESLint + Prettier + TypeScript strict mode
B) Standard - ESLint + Prettier
C) Minimal - 기본 린팅만
D) Other (please describe after [Answer]: tag below)

[Answer]: B

#### Question 25: Testing Requirements
테스트 요구사항은?

A) Comprehensive - Unit + Integration + E2E
B) Standard - Unit + Integration
C) Minimal - Unit tests만
D) No tests - MVP에서 제외
E) Other (please describe after [Answer]: tag below)

[Answer]: D

#### Question 26: Documentation Requirements
문서화 요구사항은?

A) Comprehensive - API docs + Code comments + Architecture docs
B) Standard - API docs + README
C) Minimal - README만
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## NFR Assessment Execution Plan

### Phase 1: Scalability Assessment
- [ ] **Step 1.1**: 동시 접속 관리자 수 분석
- [ ] **Step 1.2**: SSE 연결 스케일링 전략 결정
- [ ] **Step 1.3**: 주문 볼륨 증가 패턴 분석
- [ ] **Step 1.4**: Lambda 동시 실행 제한 계산
- [ ] **Step 1.5**: DynamoDB 처리량 요구사항 계산

### Phase 2: Performance Assessment
- [ ] **Step 2.1**: API 응답 시간 목표 설정
- [ ] **Step 2.2**: SSE 이벤트 전달 지연 목표 설정
- [ ] **Step 2.3**: 데이터베이스 쿼리 성능 목표 설정
- [ ] **Step 2.4**: 이미지 업로드 성능 목표 설정
- [ ] **Step 2.5**: 성능 병목 지점 식별

### Phase 3: Availability Assessment
- [ ] **Step 3.1**: 가용성 목표 설정
- [ ] **Step 3.2**: 재해 복구 전략 결정
- [ ] **Step 3.3**: 장애 조치 전략 결정
- [ ] **Step 3.4**: 백업 정책 결정

### Phase 4: Security Assessment
- [ ] **Step 4.1**: 데이터 암호화 요구사항 결정
- [ ] **Step 4.2**: 인증 강도 요구사항 결정
- [ ] **Step 4.3**: 권한 모델 결정
- [ ] **Step 4.4**: 감사 로그 요구사항 결정
- [ ] **Step 4.5**: 보안 위협 모델 분석

### Phase 5: Reliability Assessment
- [ ] **Step 5.1**: 에러 처리 전략 확정
- [ ] **Step 5.2**: 모니터링 및 알림 전략 결정
- [ ] **Step 5.3**: 헬스 체크 전략 결정
- [ ] **Step 5.4**: SLA 정의

### Phase 6: Tech Stack Decisions
- [ ] **Step 6.1**: Lambda 런타임 선택
- [ ] **Step 6.2**: Lambda 메모리 설정 결정
- [ ] **Step 6.3**: API Gateway 타입 선택
- [ ] **Step 6.4**: DynamoDB 용량 모드 선택
- [ ] **Step 6.5**: S3 스토리지 클래스 선택
- [ ] **Step 6.6**: CloudWatch Logs 보관 기간 설정

### Phase 7: Maintainability Assessment
- [ ] **Step 7.1**: 코드 품질 기준 설정
- [ ] **Step 7.2**: 테스트 전략 결정
- [ ] **Step 7.3**: 문서화 전략 결정
- [ ] **Step 7.4**: CI/CD 요구사항 결정 (이미 수동 배포로 결정됨)

### Phase 8: Documentation
- [ ] **Step 8.1**: NFR Requirements 문서 생성
  - [ ] `aidlc-docs/construction/admin-unit/nfr-requirements/nfr-requirements.md`
  - [ ] 모든 NFR 요구사항 문서화

- [ ] **Step 8.2**: Tech Stack Decisions 문서 생성
  - [ ] `aidlc-docs/construction/admin-unit/nfr-requirements/tech-stack-decisions.md`
  - [ ] 기술 스택 선택 및 근거 문서화

---

## Completion Criteria

NFR Requirements가 완료되려면:
- [ ] 모든 planning questions에 답변 완료
- [ ] 모든 NFR 카테고리 평가 완료
- [ ] 기술 스택 결정 완료
- [ ] 2개 문서 파일 생성 완료

---

**답변 완료 후 "완료" 또는 "done"이라고 알려주세요.**
