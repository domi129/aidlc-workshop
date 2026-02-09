# Customer Unit - NFR Design Plan

## Plan Overview
Customer Unit의 NFR 요구사항을 디자인 패턴과 논리적 컴포넌트로 구체화합니다.

---

## Execution Steps

### Step 1: Resilience Patterns 설계
- [x] API 재시도 패턴 설계 (지수 백오프)
- [x] 에러 처리 패턴 설계
- [x] 장애 조치 메커니즘 설계

### Step 2: Scalability Patterns 설계
- [x] 무상태 아키텍처 설계
- [x] 수평 확장 전략 설계
- [x] 캐싱 전략 설계

### Step 3: Performance Patterns 설계
- [x] API 응답 최적화 패턴
- [x] 프론트엔드 로딩 최적화 패턴
- [x] 실시간 통신 최적화 패턴

### Step 4: Security Patterns 설계
- [x] 인증 및 권한 부여 패턴
- [x] 데이터 보호 패턴
- [x] 계정 잠금 메커니즘 설계

### Step 5: Logical Components 정의
- [x] 인프라 컴포넌트 식별
- [x] 미들웨어 컴포넌트 정의
- [x] 유틸리티 컴포넌트 정의

---

## NFR Design Questions

다음 질문들에 답변해주시면 더 정확한 NFR Design을 생성할 수 있습니다.

### 1. Resilience Patterns

**Q1-1**: API 재시도 시 어떤 에러 타입을 재시도 대상에서 제외하시겠습니까?
- A) 4xx 클라이언트 에러 모두 제외
- B) 401, 403, 404만 제외 (400, 409는 재시도)
- C) 400, 401, 403, 404 제외
- D) 기타 (설명 필요)

[Answer]: C

**Q1-2**: 네트워크 연결 끊김 시 자동 재연결 시도 간격은 얼마로 하시겠습니까?
- A) 5초마다 재연결 시도
- B) 10초마다 재연결 시도
- C) 지수 백오프 (5초, 10초, 20초)
- D) 기타 (설명 필요)

[Answer]: C

**Q1-3**: SSE 연결 끊김 시 재연결 전략은 무엇인가요?
- A) 즉시 재연결 시도
- B) 3초 후 재연결 시도
- C) 지수 백오프 재연결
- D) 기타 (설명 필요)

[Answer]: B

### 2. Scalability Patterns

**Q2-1**: 메뉴 데이터 캐싱 전략은 무엇인가요?
- A) 클라이언트 메모리 캐싱 (5분)
- B) LocalStorage 캐싱 (5분)
- C) SWR 자동 캐싱 (5분)
- D) 캐싱 없음

[Answer]: C

**Q2-2**: 장바구니 데이터 동기화 전략은 무엇인가요?
- A) LocalStorage만 사용 (동기화 없음)
- B) 주기적 백엔드 동기화 (1분마다)
- C) 주문 생성 시에만 백엔드 전송
- D) 기타 (설명 필요)

[Answer]: C

**Q2-3**: 이미지 로딩 최적화 전략은 무엇인가요?
- A) Lazy Loading (스크롤 시 로드)
- B) Progressive Loading (저화질 → 고화질)
- C) 즉시 로딩 (최적화 없음)
- D) 기타 (설명 필요)

[Answer]: A

### 3. Performance Patterns

**Q3-1**: React 컴포넌트 렌더링 최적화 전략은 무엇인가요?
- A) React.memo + useMemo + useCallback
- B) React.memo만 사용
- C) 최적화 없음 (초기 버전)
- D) 기타 (설명 필요)

[Answer]: A

**Q3-2**: 번들 크기 최적화 전략은 무엇인가요?
- A) 코드 스플리팅 (React.lazy) + Tree Shaking
- B) Tree Shaking만
- C) 최적화 없음
- D) 기타 (설명 필요)

[Answer]: C

**Q3-3**: API 요청 최적화 전략은 무엇인가요?
- A) 요청 병합 (Batching)
- B) 요청 디바운싱 (Debouncing)
- C) 최적화 없음
- D) 기타 (설명 필요)

[Answer]: C

### 4. Security Patterns

**Q4-1**: JWT 토큰 저장 위치는 어디인가요?
- A) LocalStorage (XSS 위험 있지만 간편)
- B) HttpOnly Cookie (XSS 방어, CSRF 위험)
- C) SessionStorage (브라우저 종료 시 삭제)
- D) 기타 (설명 필요)

[Answer]: A

**Q4-2**: CORS 설정은 어떻게 하시겠습니까?
- A) 특정 도메인만 허용 (화이트리스트)
- B) 모든 도메인 허용 (개발 편의)
- C) 환경별 설정 (개발: 모두, 프로덕션: 화이트리스트)
- D) 기타 (설명 필요)

[Answer]: B

**Q4-3**: 입력 검증 전략은 무엇인가요?
- A) 프론트엔드 + 백엔드 이중 검증
- B) 백엔드만 검증
- C) 프론트엔드만 검증
- D) 기타 (설명 필요)

[Answer]: C

**Q4-4**: XSS 방어 전략은 무엇인가요?
- A) React 기본 이스케이프 + DOMPurify (HTML 렌더링 시)
- B) React 기본 이스케이프만
- C) 수동 이스케이프
- D) 기타 (설명 필요)

[Answer]: B

### 5. Logical Components

**Q5-1**: 에러 처리를 위한 미들웨어 구조는 무엇인가요?
- A) 전역 에러 미들웨어 (Express errorHandler)
- B) 컨트롤러별 try-catch
- C) 둘 다 사용
- D) 기타 (설명 필요)

[Answer]: A

**Q5-2**: 로깅을 위한 미들웨어 구조는 무엇인가요?
- A) 요청/응답 로깅 미들웨어 (Morgan 스타일)
- B) 컨트롤러별 수동 로깅
- C) 로깅 없음
- D) 기타 (설명 필요)

[Answer]: A

**Q5-3**: 인증을 위한 미들웨어 구조는 무엇인가요?
- A) JWT 검증 미들웨어 (모든 보호된 라우트에 적용)
- B) 컨트롤러별 수동 검증
- C) 기타 (설명 필요)

[Answer]: A

**Q5-4**: 프론트엔드 에러 바운더리 구조는 무엇인가요?
- A) 전역 에러 바운더리 (App 레벨)
- B) 페이지별 에러 바운더리
- C) 컴포넌트별 에러 바운더리
- D) 에러 바운더리 없음

[Answer]: C

**Q5-5**: API 클라이언트 구조는 무엇인가요?
- A) 중앙 집중식 API 클라이언트 (axios instance)
- B) 컴포넌트별 fetch 호출
- C) SWR fetcher 함수만 사용
- D) 기타 (설명 필요)

[Answer]: C

---

## Next Steps

1. 위 질문들에 대한 답변을 [Answer]: 태그 아래에 작성해주세요.
2. 답변 완료 후 "완료했습니다" 또는 "답변 완료"라고 알려주세요.
3. 답변을 검토하고 추가 질문이 필요한 경우 clarification questions 파일을 생성합니다.
4. 모든 질문이 해결되면 NFR Design 아티팩트를 생성합니다.

---

## 문서 버전 정보
- **작성일**: 2026-02-09
- **버전**: 1.0
- **상태**: 질문 대기 중
