# Customer Unit - NFR Requirements Plan

## Plan Overview
Customer Unit의 비기능 요구사항(NFR)을 평가하고 기술 스택을 결정합니다.

---

## Execution Steps

### Step 1: Scalability Requirements 평가
- [x] 예상 동시 사용자 수 분석
- [x] 성장 패턴 및 확장 트리거 정의
- [x] 용량 계획 수립

### Step 2: Performance Requirements 평가
- [x] 응답 시간 목표 정의
- [x] 처리량 및 지연 시간 요구사항 정의
- [x] 성능 벤치마크 설정

### Step 3: Availability Requirements 평가
- [x] 가동 시간 목표 정의
- [x] 재해 복구 요구사항 정의
- [x] 장애 조치 및 비즈니스 연속성 계획

### Step 4: Security Requirements 평가
- [x] 데이터 보호 요구사항 정의
- [x] 인증 및 권한 부여 메커니즘 정의
- [x] 위협 모델 및 보안 제어 정의

### Step 5: Tech Stack Selection
- [x] 프론트엔드 기술 스택 확정
- [x] 백엔드 기술 스택 확정
- [x] 데이터베이스 및 저장소 선택
- [x] 실시간 통신 기술 선택

### Step 6: Reliability Requirements 평가
- [x] 에러 처리 및 내결함성 요구사항 정의
- [x] 모니터링 및 알림 요구사항 정의

### Step 7: Maintainability Requirements 평가
- [x] 코드 품질 및 문서화 요구사항 정의
- [x] 테스트 전략 정의
- [x] 운영 요구사항 정의

---

## NFR Assessment Questions

다음 질문들에 답변해주시면 더 정확한 NFR Requirements를 생성할 수 있습니다.

### 1. Scalability Requirements

**Q1-1**: Customer Unit의 예상 동시 사용자 수는 얼마나 되나요?
- A) 매장당 최대 10개 테이블 (소규모)
- B) 매장당 최대 50개 테이블 (중규모)
- C) 매장당 최대 100개 테이블 (대규모)
- D) 기타 (설명 필요)

[Answer]: B

**Q1-2**: 서비스 성장 계획은 어떻게 되나요?
- A) 초기 1~5개 매장, 1년 내 10~20개 매장
- B) 초기 10~20개 매장, 1년 내 50~100개 매장
- C) 초기 50개 이상 매장, 빠른 확장 계획
- D) 기타 (설명 필요)

[Answer]: B

**Q1-3**: 피크 시간대 트래픽 증가율은 얼마나 되나요?
- A) 평상시 대비 2배 (점심/저녁 시간)
- B) 평상시 대비 5배 (주말/공휴일)
- C) 평상시 대비 10배 이상 (특별 이벤트)
- D) 기타 (설명 필요)

[Answer]: B

### 2. Performance Requirements

**Q2-1**: API 응답 시간 목표는 얼마나 되나요?
- A) 평균 200ms 이하, 최대 500ms
- B) 평균 500ms 이하, 최대 1초
- C) 평균 1초 이하, 최대 2초
- D) 기타 (설명 필요)

[Answer]: B

**Q2-2**: 페이지 로드 시간 목표는 얼마나 되나요?
- A) 1초 이하 (매우 빠름)
- B) 2초 이하 (빠름)
- C) 3초 이하 (보통)
- D) 기타 (설명 필요)

[Answer]: A

**Q2-3**: 실시간 주문 상태 업데이트 지연 시간 목표는 얼마나 되나요?
- A) 1초 이내 (실시간)
- B) 2~3초 이내 (준실시간)
- C) 5초 이내 (지연 허용)
- D) 실시간 업데이트 불필요

[Answer]: B

### 3. Availability Requirements

**Q3-1**: 서비스 가동 시간 목표는 얼마나 되나요?
- A) 99.9% (월 43분 다운타임)
- B) 99.5% (월 3.6시간 다운타임)
- C) 99% (월 7.2시간 다운타임)
- D) 기타 (설명 필요)

[Answer]: B

**Q3-2**: 재해 복구 목표 시간(RTO)은 얼마나 되나요?
- A) 1시간 이내 (긴급)
- B) 4시간 이내 (중요)
- C) 24시간 이내 (보통)
- D) 재해 복구 계획 없음

[Answer]: B

**Q3-3**: 데이터 백업 주기는 어떻게 되나요?
- A) 실시간 백업 (지속적 복제)
- B) 1시간마다 백업
- C) 1일 1회 백업
- D) 백업 불필요

[Answer]: C

### 4. Security Requirements

**Q4-1**: 데이터 암호화 요구사항은 무엇인가요?
- A) 전송 중 암호화 (HTTPS) + 저장 시 암호화
- B) 전송 중 암호화 (HTTPS)만
- C) 암호화 불필요
- D) 기타 (설명 필요)

[Answer]: B

**Q4-2**: 준수해야 할 보안 규정이나 표준이 있나요?
- A) GDPR, PCI-DSS 등 국제 표준
- B) 개인정보보호법 등 국내 법규
- C) 특별한 규정 없음
- D) 기타 (설명 필요)

[Answer]: C

**Q4-3**: 인증 실패 시 계정 잠금 정책이 필요한가요?
- A) 필요 (5회 실패 시 30분 잠금)
- B) 필요 (10회 실패 시 1시간 잠금)
- C) 불필요 (무제한 재시도 허용)
- D) 기타 (설명 필요)

[Answer]: A

**Q4-4**: 보안 로그 및 감사 추적이 필요한가요?
- A) 필요 (모든 인증 및 중요 작업 로깅)
- B) 필요 (에러 및 실패만 로깅)
- C) 불필요
- D) 기타 (설명 필요)

[Answer]: C

### 5. Tech Stack Selection

**Q5-1**: 프론트엔드 상태 관리 라이브러리는 무엇을 사용하나요?
- A) Zustand (경량, 간단)
- B) Redux (표준, 강력)
- C) React Context API (내장)
- D) 기타 (설명 필요)

[Answer]: A

**Q5-2**: 프론트엔드 API 통신 라이브러리는 무엇을 사용하나요?
- A) React Query (캐싱, 자동 재시도)
- B) SWR (간단, 빠름)
- C) Axios (기본)
- D) Fetch API (내장)

[Answer]: B

**Q5-3**: 프론트엔드 UI 컴포넌트 라이브러리를 사용하나요?
- A) Material-UI (풍부한 컴포넌트)
- B) Ant Design (엔터프라이즈급)
- C) Tailwind CSS (유틸리티 우선)
- D) 커스텀 컴포넌트만 사용

[Answer]: A

**Q5-4**: 백엔드 로깅 라이브러리는 무엇을 사용하나요?
- A) Winston (강력, 유연)
- B) Pino (빠름, 경량)
- C) console.log (기본)
- D) 기타 (설명 필요)

[Answer]: C

**Q5-5**: 백엔드 입력 검증 라이브러리는 무엇을 사용하나요?
- A) Joi (스키마 기반)
- B) Yup (간단)
- C) express-validator (미들웨어)
- D) 수동 검증

[Answer]: C

**Q5-6**: DynamoDB 클라이언트는 무엇을 사용하나요?
- A) AWS SDK v3 (최신, 모듈화)
- B) AWS SDK v2 (안정적)
- C) DynamoDB DocumentClient (간편)
- D) 기타 (설명 필요)

[Answer]: B

### 6. Reliability Requirements

**Q6-1**: API 호출 실패 시 재시도 정책은 무엇인가요?
- A) 지수 백오프 재시도 (1초, 2초, 4초)
- B) 고정 간격 재시도 (1초마다 3회)
- C) 재시도 없음
- D) 기타 (설명 필요)

[Answer]: C

**Q6-2**: 에러 모니터링 및 알림 도구를 사용하나요?
- A) Sentry (에러 추적)
- B) CloudWatch Alarms (AWS 통합)
- C) 이메일 알림만
- D) 모니터링 없음

[Answer]: D

**Q6-3**: 헬스 체크 엔드포인트가 필요한가요?
- A) 필요 (GET /health, GET /ready)
- B) 필요 (GET /health만)
- C) 불필요
- D) 기타 (설명 필요)

[Answer]: B

### 7. Maintainability Requirements

**Q7-1**: 코드 린팅 및 포맷팅 도구를 사용하나요?
- A) ESLint + Prettier (표준)
- B) ESLint만
- C) 사용 안 함
- D) 기타 (설명 필요)

[Answer]: A

**Q7-2**: API 문서화 도구를 사용하나요?
- A) Swagger/OpenAPI (자동 생성)
- B) Postman Collection
- C) Markdown 문서만
- D) 문서화 없음

[Answer]: A

**Q7-3**: 환경 변수 관리 방식은 무엇인가요?
- A) .env 파일 + dotenv 라이브러리
- B) AWS Secrets Manager
- C) AWS Systems Manager Parameter Store
- D) 하드코딩 (권장하지 않음)

[Answer]: A

### 8. Usability Requirements

**Q8-1**: 다국어 지원이 필요한가요?
- A) 필요 (한국어, 영어, 일본어 등)
- B) 한국어만
- C) 영어만
- D) 기타 (설명 필요)

[Answer]: B

**Q8-2**: 접근성(Accessibility) 표준을 준수해야 하나요?
- A) WCAG 2.1 AA 준수
- B) 기본 접근성만 (키보드 네비게이션)
- C) 접근성 고려 안 함
- D) 기타 (설명 필요)

[Answer]: C

**Q8-3**: 오프라인 모드 지원이 필요한가요?
- A) 필요 (Service Worker + 캐싱)
- B) 부분 지원 (읽기 전용 캐싱)
- C) 불필요
- D) 기타 (설명 필요)

[Answer]: C

---

## Next Steps

1. 위 질문들에 대한 답변을 [Answer]: 태그 아래에 작성해주세요.
2. 답변 완료 후 "완료했습니다" 또는 "답변 완료"라고 알려주세요.
3. 답변을 검토하고 추가 질문이 필요한 경우 clarification questions 파일을 생성합니다.
4. 모든 질문이 해결되면 NFR Requirements 아티팩트를 생성합니다.

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: 질문 대기 중
