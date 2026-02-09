# Customer Unit - NFR Requirements

## Overview
Customer Unit의 비기능 요구사항(Non-Functional Requirements)을 정의합니다.

---

## 1. Scalability Requirements

### 1.1 동시 사용자 수

**목표**: 매장당 최대 50개 테이블 동시 사용 지원

**세부 요구사항**:
- 매장당 50개 테이블 × 평균 2~3명 = 100~150명 동시 사용자
- 피크 시간대 (점심/저녁) 트래픽 5배 증가 대응
- 주말/공휴일 트래픽 급증 대응

**확장 전략**:
- 무상태(stateless) 백엔드 설계로 수평 확장 가능
- DynamoDB 자동 확장 활용
- CloudFront CDN으로 정적 파일 분산

### 1.2 서비스 성장 계획

**초기 목표**: 10~20개 매장
**1년 목표**: 50~100개 매장

**확장 시나리오**:
- **Phase 1** (0~6개월): 10~20개 매장, 500~1,000개 테이블
- **Phase 2** (6~12개월): 20~50개 매장, 1,000~2,500개 테이블
- **Phase 3** (12개월 이후): 50~100개 매장, 2,500~5,000개 테이블

**확장 대응**:
- EC2/ECS Auto Scaling 설정
- DynamoDB On-Demand 모드 또는 Auto Scaling
- CloudWatch 메트릭 기반 자동 확장

### 1.3 피크 시간대 트래픽

**피크 시간대**: 점심 (11:30~13:30), 저녁 (18:00~20:00)
**트래픽 증가율**: 평상시 대비 5배

**대응 전략**:
- 캐싱 전략 (메뉴 데이터 5분 캐싱)
- 읽기 전용 복제본 활용 (DynamoDB Global Tables)
- CloudFront 캐싱으로 정적 파일 부하 감소

---

## 2. Performance Requirements

### 2.1 API 응답 시간

**목표**:
- 평균 응답 시간: 500ms 이하
- 최대 응답 시간: 1초 이하
- 95 percentile: 800ms 이하

**측정 대상 API**:
- GET /api/menus: 300ms 이하
- POST /api/orders: 500ms 이하
- GET /api/orders: 400ms 이하
- POST /api/auth/table-login: 300ms 이하

**최적화 전략**:
- DynamoDB 쿼리 최적화 (GSI 활용)
- 메뉴 데이터 캐싱 (5분)
- 불필요한 데이터 전송 최소화

### 2.2 페이지 로드 시간

**목표**: 2초 이하 (초기 페이지 로드)

**측정 기준**:
- First Contentful Paint (FCP): 1초 이하
- Time to Interactive (TTI): 2초 이하
- Largest Contentful Paint (LCP): 2초 이하

**최적화 전략**:
- 코드 스플리팅 (React.lazy)
- 이미지 Lazy Loading
- 번들 크기 최소화 (Tree Shaking)
- CloudFront CDN 활용

### 2.3 실시간 주문 상태 업데이트

**목표**: 2~3초 이내 (준실시간)

**구현 방식**:
- Server-Sent Events (SSE) 사용
- 관리자가 주문 상태 변경 시 2~3초 이내 고객 화면 업데이트

**네트워크 요구사항**:
- SSE 연결 유지 (Keep-Alive)
- 연결 끊김 시 자동 재연결

---

## 3. Availability Requirements

### 3.1 서비스 가동 시간

**목표**: 99.5% (월 3.6시간 다운타임 허용)

**계산**:
- 월 720시간 × 0.5% = 3.6시간 다운타임
- 주당 약 50분 다운타임 허용

**가동 시간 보장 전략**:
- 다중 가용 영역 (Multi-AZ) 배포
- 헬스 체크 및 자동 장애 조치
- 정기 유지보수 시간 공지 (새벽 2~4시)

### 3.2 재해 복구 목표 시간 (RTO)

**목표**: 4시간 이내

**재해 시나리오**:
- 가용 영역 장애
- 데이터베이스 장애
- 애플리케이션 서버 장애

**복구 절차**:
1. 장애 감지 (CloudWatch Alarms)
2. 백업 데이터 확인
3. 대체 인프라 활성화
4. 데이터 복원
5. 서비스 재개

### 3.3 데이터 백업

**백업 주기**: 1일 1회 (새벽 3시)

**백업 대상**:
- DynamoDB 테이블 (Store, Table, Menu, Order, OrderHistory)
- 환경 변수 및 설정 파일

**백업 보관**:
- 최근 7일 백업 보관
- 월말 백업 3개월 보관

**복원 테스트**: 분기별 1회

---

## 4. Security Requirements

### 4.1 데이터 암호화

**전송 중 암호화**:
- HTTPS 필수 (TLS 1.2 이상)
- 모든 API 통신 HTTPS 사용
- CloudFront HTTPS 리다이렉트

**저장 시 암호화**:
- 초기 버전에서는 제외
- 추후 DynamoDB 암호화 활성화 고려

### 4.2 보안 규정 준수

**준수 대상**: 특별한 규정 없음

**기본 보안 원칙**:
- OWASP Top 10 보안 취약점 방어
- SQL Injection, XSS, CSRF 방어
- 입력 검증 및 출력 인코딩

### 4.3 인증 실패 시 계정 잠금

**정책**: 5회 실패 시 30분 잠금

**구현**:
- 로그인 실패 횟수 추적 (DynamoDB 또는 메모리)
- 5회 실패 시 계정 잠금 (lockUntil 타임스탬프 저장)
- 30분 후 자동 잠금 해제

**예외 처리**:
- 관리자가 수동으로 잠금 해제 가능
- 잠금 상태에서 로그인 시도 시 "계정이 잠겼습니다" 메시지

### 4.4 보안 로그 및 감사 추적

**정책**: 초기 버전에서는 제외

**향후 고려사항**:
- 인증 실패 로깅
- 중요 작업 (주문 생성, 삭제) 로깅
- 보안 사고 발생 시 원인 분석

---

## 5. Reliability Requirements

### 5.1 API 호출 재시도 정책

**정책**: 지수 백오프 재시도 (1초, 2초, 4초)

**재시도 대상**:
- 네트워크 오류 (Network Error)
- 서버 오류 (500, 502, 503, 504)
- 타임아웃 (Timeout)

**재시도 제외**:
- 클라이언트 오류 (400, 401, 403, 404)
- 비즈니스 로직 오류

**구현**:
```javascript
// 재시도 로직 예시
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status < 500) throw new Error('Client error');
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // 1초, 2초, 4초
    }
  }
}
```

### 5.2 에러 모니터링 및 알림

**정책**: 초기 버전에서는 제외, 추후 추가 예정

**향후 계획**:
- CloudWatch Logs로 기본 로깅
- CloudWatch Alarms로 임계값 알림
- Sentry 또는 유사 도구 도입 고려

**알림 대상**:
- API 응답 시간 > 2초
- 에러율 > 5%
- 서버 CPU 사용률 > 80%

### 5.3 헬스 체크 엔드포인트

**엔드포인트**: GET /health

**응답 형식**:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-09T13:15:00Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

**체크 항목**:
- 서버 실행 상태
- DynamoDB 연결 상태 (선택사항)
- 메모리 사용률

**사용 목적**:
- 로드 밸런서 헬스 체크
- 모니터링 도구 연동

---

## 6. Maintainability Requirements

### 6.1 코드 품질

**린팅 및 포맷팅**: ESLint + Prettier

**ESLint 규칙**:
- Airbnb JavaScript Style Guide 기반
- React Hooks 규칙
- TypeScript 규칙 (사용 시)

**Prettier 설정**:
- 세미콜론 사용
- 싱글 쿼트
- 들여쓰기 2칸

**코드 리뷰**:
- Pull Request 필수
- 최소 1명 승인 필요

### 6.2 API 문서화

**도구**: Swagger/OpenAPI

**문서 위치**: /api-docs

**포함 내용**:
- 모든 API 엔드포인트
- 요청/응답 스키마
- 에러 코드 및 메시지
- 인증 방법

**자동 생성**:
- swagger-jsdoc 사용
- 코드 주석에서 자동 생성

### 6.3 환경 변수 관리

**방식**: .env 파일 + dotenv 라이브러리

**환경 변수 목록**:
```
# Server
PORT=3000
NODE_ENV=development

# AWS
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>

# DynamoDB
DYNAMODB_TABLE_PREFIX=table-order-

# JWT
JWT_SECRET=<secret>
JWT_ACCESS_EXPIRATION=16h
JWT_REFRESH_EXPIRATION=30d

# CORS
CORS_ORIGIN=http://localhost:3001
```

**보안**:
- .env 파일은 .gitignore에 추가
- .env.example 파일로 템플릿 제공
- 프로덕션 환경은 AWS Secrets Manager 고려

---

## 7. Usability Requirements

### 7.1 다국어 지원

**정책**: 한국어만 지원

**향후 계획**:
- i18n 라이브러리 (react-i18next) 도입 고려
- 영어, 일본어 추가 고려

### 7.2 접근성 (Accessibility)

**정책**: 초기 버전에서는 제외

**기본 고려사항**:
- 시맨틱 HTML 사용
- 버튼 최소 크기 44x44px (터치 친화적)
- 명확한 시각적 피드백

**향후 계획**:
- WCAG 2.1 AA 준수 고려
- 키보드 네비게이션 지원
- 스크린 리더 지원

### 7.3 오프라인 모드

**정책**: 불필요

**이유**:
- 테이블 태블릿은 항상 Wi-Fi 연결 상태
- 주문 생성은 실시간 서버 통신 필수

---

## 8. Deployment Requirements

### 8.1 배포 환경

**클라우드 플랫폼**: AWS

**주요 서비스**:
- **Compute**: EC2 또는 ECS
- **Database**: DynamoDB
- **Storage**: S3 (프론트엔드 호스팅)
- **CDN**: CloudFront
- **DNS**: Route 53
- **Monitoring**: CloudWatch

### 8.2 배포 전략

**배포 방식**: Blue-Green Deployment 또는 Rolling Update

**배포 절차**:
1. 코드 빌드 및 테스트
2. 스테이징 환경 배포
3. 스테이징 테스트
4. 프로덕션 배포
5. 헬스 체크 확인
6. 롤백 준비 (문제 발생 시)

**배포 주기**:
- 개발 환경: 수시
- 스테이징 환경: 주 1~2회
- 프로덕션 환경: 주 1회 또는 격주 1회

### 8.3 환경 분리

**환경 구성**:
- **Development**: 로컬 개발 환경
- **Staging**: 프로덕션 유사 환경 (테스트용)
- **Production**: 실제 서비스 환경

**환경별 설정**:
- 별도 .env 파일
- 별도 AWS 계정 또는 VPC
- 별도 DynamoDB 테이블

---

## 9. Testing Requirements

### 9.1 테스트 전략

**정책**: 초기 버전에서는 수동 테스트만 수행

**테스트 범위**:
- 기능 테스트 (Functional Testing)
- 통합 테스트 (Integration Testing)
- 사용자 인수 테스트 (UAT)

**향후 계획**:
- 단위 테스트 (Jest)
- E2E 테스트 (Cypress)
- 성능 테스트 (k6)

### 9.2 테스트 환경

**테스트 데이터**:
- 시드 데이터 스크립트 사용
- 샘플 매장, 테이블, 메뉴 데이터 생성

**테스트 시나리오**:
- 고객 주문 플로우 (로그인 → 메뉴 조회 → 장바구니 → 주문)
- 관리자 주문 관리 플로우 (로그인 → 주문 모니터링 → 상태 변경)

---

## 10. Operational Requirements

### 10.1 로깅

**로깅 라이브러리**: console.log (초기 버전)

**로그 레벨**:
- ERROR: 에러 발생 시
- WARN: 경고 메시지
- INFO: 일반 정보
- DEBUG: 디버깅 정보 (개발 환경만)

**로그 형식**:
```
[2026-02-09T13:15:00Z] [INFO] [AuthController] Table login successful: tableId=table-001
[2026-02-09T13:15:05Z] [ERROR] [OrderController] Order creation failed: error=Menu not found
```

**향후 계획**:
- Winston 또는 Pino 도입
- 구조화된 로깅 (JSON 형식)
- CloudWatch Logs 통합

### 10.2 모니터링

**정책**: 초기 버전에서는 제외, 추후 추가 예정

**향후 계획**:
- CloudWatch 메트릭 수집
- CloudWatch Alarms 설정
- 대시보드 구성

**모니터링 항목**:
- API 응답 시간
- 에러율
- 서버 CPU/메모리 사용률
- DynamoDB 읽기/쓰기 용량

### 10.3 알림

**정책**: 초기 버전에서는 제외

**향후 계획**:
- 이메일 알림 (AWS SNS)
- Slack 알림
- SMS 알림 (긴급 상황)

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: 생성 완료
