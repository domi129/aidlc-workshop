# Unit of Work Plan

## Plan Overview

이 계획은 테이블오더 서비스를 관리 가능한 작업 단위(Units of Work)로 분해하기 위한 단계별 실행 체크리스트입니다.

---

## Decomposition Context Analysis

**시스템 특성**:
- **프로젝트 유형**: Greenfield (신규 개발)
- **아키텍처**: Monorepo (프론트엔드 + 백엔드)
- **개발 전략**: 병렬 개발 (고객용 팀 / 관리자용 팀)
- **총 User Stories**: 13개 (Customer 6개, Manager 7개)
- **총 컴포넌트**: 33개 (Frontend 15개, Backend 18개)

**주요 기능 영역**:
1. 인증 및 세션 관리
2. 메뉴 관리
3. 주문 관리
4. 장바구니 관리 (클라이언트 측)
5. 테이블 관리
6. 실시간 통신 (SSE)

---

## Unit Decomposition Questions

다음 질문들에 답변하여 시스템 분해 방향을 결정해주세요.

### Question 1: Unit Decomposition Strategy
시스템을 어떻게 분해하시겠습니까?

A) 단일 Unit (전체 시스템을 하나의 Unit으로)
B) 도메인별 분해 (Customer Unit, Admin Unit)
C) 기능별 분해 (Auth Unit, Menu Unit, Order Unit, Table Unit)
D) 계층별 분해 (Frontend Unit, Backend Unit)
E) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 2: Deployment Model (Greenfield)
배포 모델은 어떻게 하시겠습니까?

A) Monolith (단일 애플리케이션)
B) Microservices (독립 배포 가능한 서비스들)
C) Modular Monolith (논리적 모듈 분리, 단일 배포)
D) Hybrid (일부는 독립 서비스, 일부는 통합)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 3: Code Organization (Greenfield)
코드 디렉토리 구조는 어떻게 하시겠습니까?

A) 기능별 폴더 (features/)
B) 도메인별 폴더 (domains/)
C) 계층별 폴더 (controllers/, services/, repositories/)
D) 혼합 (도메인별로 나누고, 각 도메인 내에서 계층별)
E) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 4: Unit Dependencies
Unit 간 의존성을 어떻게 관리하시겠습니까?

A) 직접 의존 (Unit이 다른 Unit의 코드를 직접 import)
B) API 기반 (Unit 간 HTTP API로만 통신)
C) 이벤트 기반 (Unit 간 이벤트로 통신)
D) 공유 라이브러리 (공통 코드를 shared 모듈로)
E) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 5: Development Team Structure
개발 팀 구조는 어떻게 되어 있습니까?

A) 단일 팀 (모든 Unit을 한 팀이 개발)
B) 2개 팀 (고객용 팀, 관리자용 팀)
C) 3개 이상 팀 (기능별 팀)
D) 풀스택 개발자들 (각자 전체 스택 담당)
E) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 6: Unit Testing Strategy
Unit별 테스트 전략은?

A) Unit별 독립 테스트 (각 Unit의 테스트를 독립적으로 실행)
B) 통합 테스트 중심 (Unit 간 통합 테스트)
C) E2E 테스트 중심 (전체 시스템 E2E 테스트)
D) 수동 테스트만 (테스트 코드 없음)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Unit of Work Generation Execution Steps

사용자 답변을 기반으로 다음 단계를 실행합니다:

### Phase 1: Unit Identification
- [x] 답변 기반으로 Unit 분해 전략 확정
- [x] 각 Unit의 범위 및 책임 정의
- [x] Unit별 포함될 컴포넌트 식별
- [x] Unit별 포함될 User Stories 식별
- [x] `aidlc-docs/inception/application-design/unit-of-work.md` 생성

### Phase 2: Unit Dependencies
- [x] Unit 간 의존성 매트릭스 생성
- [x] 의존성 타입 정의 (직접/API/이벤트/공유)
- [x] 통합 지점 식별
- [x] 순환 의존성 검증
- [x] `aidlc-docs/inception/application-design/unit-of-work-dependency.md` 생성

### Phase 3: Story Mapping
- [x] 각 User Story를 Unit에 매핑
- [x] Story 간 의존성 확인
- [x] Unit별 Story 우선순위 정의
- [x] `aidlc-docs/inception/application-design/unit-of-work-story-map.md` 생성

### Phase 4: Code Organization (Greenfield)
- [x] 답변 기반으로 디렉토리 구조 정의
- [x] Unit별 코드 위치 명시
- [x] 공유 코드 위치 정의
- [x] `unit-of-work.md`에 코드 구조 문서화

### Phase 5: Validation
- [x] 모든 User Stories가 Unit에 할당되었는지 확인
- [x] 모든 컴포넌트가 Unit에 할당되었는지 확인
- [x] Unit 경계가 명확하고 중복되지 않는지 확인
- [x] 의존성이 관리 가능한지 확인

---

## Completion Criteria

다음 조건이 모두 충족되면 Units Generation이 완료됩니다:

- [ ] 모든 질문에 답변 완료
- [ ] 모든 실행 단계 체크박스 [x] 완료
- [ ] unit-of-work.md 파일 생성 완료
- [ ] unit-of-work-dependency.md 파일 생성 완료
- [ ] unit-of-work-story-map.md 파일 생성 완료
- [ ] 모든 Stories가 Unit에 매핑됨
- [ ] 모든 컴포넌트가 Unit에 할당됨
- [ ] 사용자 승인 완료

---

## 답변 완료 후

모든 질문에 답변하신 후, "완료했습니다" 또는 "done"이라고 말씀해주세요.
