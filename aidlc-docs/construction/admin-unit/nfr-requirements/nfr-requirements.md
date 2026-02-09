# Admin Unit - NFR Requirements

## Overview
Admin Unit의 비기능 요구사항(Non-Functional Requirements)을 정의합니다.

---

## 1. Scalability Requirements

### 1.1 Concurrent Users
**Requirement**: 5-20명의 동시 접속 관리자 지원

**Details**:
- 예상 동시 접속: 5-20명 (중규모 체인점)
- 피크 시간대: 점심/저녁 시간 (11:00-14:00, 17:00-21:00)
- 관리자당 평균 세션: 4-8시간

**Implications**:
- Lambda 동시 실행 제한: 기본 제한(1000)으로 충분
- SSE 연결 수: 최대 20개 동시 연결
- DynamoDB 읽기/쓰기 용량: On-demand 모드로 자동 처리

---

### 1.2 SSE Connection Scaling
**Requirement**: Horizontal scaling (Lambda 동시 실행 수 증가)

**Details**:
- Lambda 함수가 각 SSE 연결을 독립적으로 처리
- 연결 수 증가 시 Lambda 인스턴스 자동 증가
- 연결당 메모리 사용량: ~10-20MB

**Scaling Strategy**:
- Lambda 동시 실행 수: 자동 스케일링 (AWS 기본)
- 연결 풀 관리: 메모리 내 Map 구조
- 연결 제한: 없음 (Lambda 제한까지)

**Cost Implications**:
- 연결당 Lambda 실행 시간: 지속적 (시간당 과금)
- 20개 연결 × 8시간 = 160 Lambda-hours/day

---

### 1.3 Order Volume Growth
**Requirement**: 안정적인 주문량 유지

**Details**:
- 주문 볼륨: 일정 수준 유지 (월 10% 미만 증가)
- 예상 일일 주문: 100-500건
- 피크 시간 주문: 시간당 50-100건

**Capacity Planning**:
- DynamoDB On-demand: 자동 스케일링으로 대응
- Lambda: 기본 제한으로 충분
- S3: 무제한 스토리지

---

## 2. Performance Requirements

### 2.1 API Response Time
**Target**: < 1초

**Breakdown**:
- Lambda cold start: < 500ms (첫 요청)
- Lambda warm execution: < 200ms
- DynamoDB query: < 100ms
- Network latency: < 200ms
- **Total**: < 1000ms

**Optimization Strategies**:
- Lambda 메모리: 256MB (CPU 성능 향상)
- DynamoDB GSI: 효율적인 쿼리 패턴
- Payload 최소화: 필요한 필드만 반환

---

### 2.2 SSE Event Delivery Latency
**Target**: < 1초

**Breakdown**:
- 이벤트 감지: < 100ms (애플리케이션 레벨)
- 이벤트 전송: < 500ms (SSE 스트림)
- 네트워크 지연: < 400ms
- **Total**: < 1000ms

**Acceptable Latency**:
- 주문 생성 → 관리자 화면 표시: 1초 이내
- 실시간성 요구사항: 중간 수준

---

### 2.3 Database Query Performance
**Target**: < 100ms

**Query Types**:
- 주문 목록 조회 (storeId): < 100ms
- 주문 상세 조회 (orderId): < 50ms
- 메뉴 목록 조회 (storeId): < 100ms
- 과거 주문 조회 (tableId): < 150ms

**Optimization**:
- GSI 활용: storeId-createdAt-index, tableId-archivedAt-index
- Eventually Consistent Read: 성능 우선
- Projection: 필요한 속성만 조회

---

### 2.4 Image Upload Performance
**Target**: < 3초 (5MB 이미지)

**Breakdown**:
- 파일 검증: < 100ms
- S3 업로드: < 2500ms (5MB)
- URL 생성: < 100ms
- DynamoDB 업데이트: < 300ms
- **Total**: < 3000ms

**Upload Strategy**:
- Direct upload to S3 (Lambda를 통한 프록시)
- Multipart upload: 5MB 이상 시 고려
- Content-Type 검증: MIME type 확인

---

## 3. Availability Requirements

### 3.1 Uptime Target
**Target**: Best effort (목표 없음)

**Rationale**:
- MVP 프로젝트로 엄격한 SLA 불필요
- AWS 관리형 서비스의 기본 가용성에 의존
- Lambda: 99.95% (AWS SLA)
- DynamoDB: 99.99% (AWS SLA)
- S3: 99.99% (AWS SLA)

**Expected Availability**:
- 실제 예상 가용성: ~99.5% (AWS 서비스 조합)
- 월 다운타임: ~3.6시간 (이론적)
- 실제 다운타임: 대부분 계획된 유지보수

---

### 3.2 Disaster Recovery
**Strategy**: No DR (MVP에서 제외)

**Rationale**:
- MVP 단계에서 DR 구현 비용 대비 효과 낮음
- 데이터 손실 허용 (주문 데이터는 일시적)
- 재구축 시간: 1-2일 (수동 배포)

**Risk Acceptance**:
- 리전 장애 시 서비스 중단 허용
- 데이터 백업 없음 (DynamoDB 자동 백업 제외)
- 복구 시간 목표(RTO): 정의 안 됨
- 복구 시점 목표(RPO): 정의 안 됨

---

### 3.3 Failover Strategy
**Strategy**: No failover (MVP에서 제외)

**Rationale**:
- Best effort 가용성 목표와 일치
- AWS 관리형 서비스의 기본 가용성에 의존
- 자동 장애 조치 구현 비용 높음

**AWS Service Resilience**:
- Lambda: 자동 재시도 (비동기 호출)
- DynamoDB: 자동 복제 (3개 AZ)
- S3: 자동 복제 (다중 AZ)
- API Gateway: 다중 AZ 배포

**Manual Recovery**:
- 장애 감지: 수동 (사용자 보고)
- 복구 조치: 수동 (재배포, 재시작)
- 복구 시간: 1-4시간

---

## 4. Security Requirements

### 4.1 Data Encryption
**Requirement**: At-rest and in-transit encryption

**At-Rest Encryption**:
- DynamoDB: 기본 암호화 활성화 (AWS managed keys)
- S3: 기본 암호화 활성화 (SSE-S3)
- CloudWatch Logs: 기본 암호화

**In-Transit Encryption**:
- HTTPS: 모든 API 통신 (TLS 1.2+)
- API Gateway: HTTPS 강제
- SSE: HTTPS 연결

**Key Management**:
- AWS managed keys (KMS 불필요)
- 비용 최적화 (추가 KMS 비용 없음)

---

### 4.2 Authentication Strength
**Requirement**: Basic (최소 길이만)

**Password Policy**:
- 최소 길이: 8자
- 복잡도 요구사항: 없음 (MVP 단순화)
- MFA: 없음 (MVP 제외)

**Rationale**:
- MVP 단계에서 사용자 편의성 우선
- 내부 관리자 시스템 (외부 노출 최소)
- 향후 강화 가능

**Session Management**:
- JWT 토큰: 16시간 만료
- 토큰 갱신: 지원
- 세션 무효화: 로그아웃 시

---

### 4.3 Authorization Model
**Requirement**: RBAC (역할 기반 접근 제어)

**Roles**:
- **Admin**: 모든 권한 (주문 관리, 메뉴 관리, 테이블 관리)
- **Manager**: 주문 관리, 메뉴 조회 (메뉴 수정 불가)
- **Viewer**: 주문 조회만 (수정 불가)

**Implementation**:
- Admin 엔티티에 role 필드 추가
- JWT 토큰에 role 포함
- API 레벨에서 role 검증

**Permissions Matrix**:
```
| Action              | Admin | Manager | Viewer |
|---------------------|-------|---------|--------|
| 주문 조회           | ✓     | ✓       | ✓      |
| 주문 상태 변경      | ✓     | ✓       | ✗      |
| 주문 삭제           | ✓     | ✗       | ✗      |
| 메뉴 조회           | ✓     | ✓       | ✓      |
| 메뉴 생성/수정/삭제 | ✓     | ✗       | ✗      |
| 테이블 세션 관리    | ✓     | ✓       | ✗      |
```

---

### 4.4 Audit Logging
**Requirement**: No audit logging (MVP에서 제외)

**Rationale**:
- MVP 단계에서 감사 로그 구현 비용 높음
- CloudWatch Logs로 기본 로깅만 수행
- 향후 필요 시 추가 가능

**Basic Logging**:
- API 요청/응답: CloudWatch Logs
- 에러 로그: CloudWatch Logs
- Lambda 실행 로그: CloudWatch Logs

**Not Logged**:
- 관리자 작업 이력 (누가, 언제, 무엇을)
- 데이터 변경 이력
- 접근 시도 이력

---

## 5. Reliability Requirements

### 5.1 Error Handling Strategy
**Strategy**: Fail fast (즉시 실패)

**Principles**:
- 에러 발생 시 즉시 실패 반환
- 부분 성공 허용 안 함
- 명확한 에러 메시지 제공

**Error Response Format**:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "statusCode": 400
  }
}
```

**No Retry Logic**:
- 비즈니스 로직 레벨에서 재시도 없음
- 클라이언트가 재시도 결정
- Lambda 자동 재시도 (비동기 호출만)

---

### 5.2 Monitoring and Alerting
**Requirement**: No monitoring (MVP에서 제외)

**Rationale**:
- MVP 단계에서 모니터링 구현 비용 높음
- CloudWatch Logs로 기본 로깅만 수행
- 수동 로그 확인

**Basic Logging Only**:
- CloudWatch Logs: Lambda 실행 로그
- 로그 보관: 30일
- 로그 검색: CloudWatch Insights (수동)

**No Alerting**:
- 에러 알림 없음
- 성능 알림 없음
- 가용성 알림 없음

---

### 5.3 Health Checks
**Requirement**: No health checks (MVP에서 제외)

**Rationale**:
- Serverless 아키텍처에서 헬스 체크 불필요
- Lambda: AWS가 자동 관리
- DynamoDB: AWS가 자동 관리
- API Gateway: AWS가 자동 관리

**Service Health**:
- AWS 서비스 상태: AWS Health Dashboard
- 장애 감지: 사용자 보고 또는 수동 확인

---

### 5.4 SLA (Service Level Agreement)
**SLA**: None (정의 안 됨)

**Rationale**:
- MVP 프로젝트로 SLA 불필요
- Best effort 가용성
- 내부 시스템 (외부 고객 없음)

**Expected Service Levels** (비공식):
- 가용성: ~99.5% (AWS 서비스 기본)
- 응답 시간: < 1초 (목표)
- 에러율: < 1% (목표)

---

## 6. Maintainability Requirements

### 6.1 Code Quality Standards
**Standard**: ESLint + Prettier

**Tools**:
- ESLint: JavaScript/TypeScript 린팅
- Prettier: 코드 포맷팅
- TypeScript: 타입 안전성 (strict mode 아님)

**Configuration**:
- ESLint: Airbnb style guide (기본)
- Prettier: 기본 설정
- Pre-commit hooks: 없음 (MVP 단순화)

**Code Review**:
- Pull request 리뷰: 권장
- 자동 린팅 체크: CI/CD 없음 (수동 배포)

---

### 6.2 Testing Requirements
**Requirement**: No tests (MVP에서 제외)

**Rationale**:
- MVP 단계에서 테스트 작성 시간 절약
- 빠른 프로토타입 개발 우선
- 향후 안정화 단계에서 테스트 추가

**Manual Testing**:
- 수동 기능 테스트
- Postman/Thunder Client로 API 테스트
- 브라우저에서 UI 테스트

**Risk Acceptance**:
- 버그 발생 가능성 높음
- 리그레션 위험
- 리팩토링 어려움

---

### 6.3 Documentation Requirements
**Standard**: API docs + README

**API Documentation**:
- OpenAPI/Swagger 스펙 (선택사항)
- API 엔드포인트 목록
- 요청/응답 예시
- 에러 코드 설명

**README Documentation**:
- 프로젝트 개요
- 설치 및 실행 방법
- 환경 변수 설정
- 배포 방법

**Not Included**:
- 아키텍처 다이어그램 (AIDLC 문서에 있음)
- 코드 주석 (최소한만)
- 개발자 가이드

---

## 7. Operational Requirements

### 7.1 Deployment
**Strategy**: Manual deployment (수동 배포)

**Deployment Process**:
1. 코드 변경 및 테스트 (로컬)
2. AWS CLI 또는 콘솔로 수동 배포
3. Lambda 함수 업데이트
4. API Gateway 재배포
5. 수동 검증

**No CI/CD**:
- 자동 빌드 없음
- 자동 테스트 없음
- 자동 배포 없음

---

### 7.2 Environment Management
**Environments**: Single environment (Production only)

**Rationale**:
- MVP 단계에서 다중 환경 불필요
- 개발 = 프로덕션
- 비용 절감

**Configuration**:
- 환경 변수: Lambda 환경 변수
- Secrets: AWS Systems Manager Parameter Store (선택사항)

---

### 7.3 Backup and Recovery
**Strategy**: DynamoDB default backup only

**DynamoDB Backup**:
- Point-in-Time Recovery (PITR): 비활성화 (비용 절감)
- On-demand backup: 수동 (필요 시)
- 백업 보관: 35일 (AWS 기본)

**S3 Backup**:
- Versioning: 비활성화
- 백업: 없음

**Recovery**:
- 데이터 복구: 수동 (DynamoDB 백업에서)
- 복구 시간: 1-4시간

---

## 8. Cost Optimization

### 8.1 Cost Targets
**Target**: 월 $50-100 (예상)

**Cost Breakdown**:
- Lambda: $20-40 (실행 시간 기반)
- DynamoDB: $10-20 (On-demand)
- S3: $5-10 (스토리지 + 전송)
- API Gateway: $5-10 (요청 수 기반)
- CloudWatch Logs: $5-10 (로그 저장)

---

### 8.2 Cost Optimization Strategies
- Lambda 메모리: 256MB (비용 vs 성능 균형)
- DynamoDB: On-demand (사용량 기반)
- S3: Standard class (자주 접근)
- CloudWatch Logs: 30일 보관 (비용 절감)
- No monitoring/alerting (비용 절감)

---

## NFR Summary

| Category | Requirement | Priority |
|----------|-------------|----------|
| Scalability | 5-20 concurrent admins | Medium |
| Performance | < 1s API response | High |
| Availability | Best effort (~99.5%) | Low |
| Security | At-rest + in-transit encryption | High |
| Reliability | Fail fast, no monitoring | Low |
| Maintainability | Standard code quality, no tests | Medium |

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: NFR Requirements 정의 완료
